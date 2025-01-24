import { NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { msData } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { mustAuth } from "../utils";

// 定义冲突处理策略类型
type ConflictStrategy = 'skip' | 'override' | 'error';

// 定义请求体的接口
interface ItemData {
  oid: string;
  name: string;
  category: string;
  desc?: string;
  icon?: any;
  info?: any;
  attr?: any;
}

interface UploadRequest {
  items: ItemData[];
  strategy: ConflictStrategy;
}

export async function POST(request: Request) {
  const response = await mustAuth();
  if (response) {
    return response;
  }

  try {
    const body: UploadRequest = await request.json();
    const { items, strategy } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: '无效的道具数据' },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // 获取所有要处理的oid列表
    const oids = Array.from(new Set(items.map(item => item.oid)));

    // 批量查询已存在的记录
    const existingRecords = await db.select()
      .from(msData)
      .where(inArray(msData.oid, oids));

    // 创建现有记录的映射，用于快速查找
    const existingMap = new Map(
      existingRecords.map(record => [`${record.oid}-${record.category}`, record])
    );

    // 分类待处理的项目
    const toInsert: ItemData[] = [];
    const toUpdate: ItemData[] = [];

    // 在应用层处理冲突
    for (const item of items) {
      const key = `${item.oid}-${item.category}`;
      if (existingMap.has(key)) {
        switch (strategy) {
          case 'skip':
            results.skipped++;
            break;
          case 'error':
            results.errors.push(`道具 ${item.oid} (${item.category}) 已存在`);
            break;
          case 'override':
            toUpdate.push(item);
            break;
        }
      } else {
        toInsert.push(item);
      }
    }

    // 如果策略是error且有冲突，直接返回错误
    if (strategy === 'error' && results.errors.length > 0) {
      return NextResponse.json({
        message: '存在冲突的道具',
        results
      }, { status: 409 });
    }

    try {
      // 批量处理更新
      if (toUpdate.length > 0) {
        await Promise.all(
          toUpdate.map(item =>
            db.delete(msData)
              .where(
                and(
                  eq(msData.oid, item.oid),
                  eq(msData.category, item.category)
                )
              )
              .then(() =>
                db.insert(msData).values({
                  oid: item.oid,
                  name: item.name,
                  category: item.category,
                  desc: item.desc,
                  icon: item.icon,
                  info: item.info,
                  attr: item.attr,
                })
              )
          )
        );
        results.success += toUpdate.length;
      }

      // 批量插入新记录
      if (toInsert.length > 0) {
        await db.insert(msData).values(toInsert);
        results.success += toInsert.length;
      }

      return NextResponse.json({
        message: '上传完成',
        results
      });

    } catch (err: unknown) {
      const error = err as Error;
      console.error('Database operation error:', error);
      return NextResponse.json(
        { error: '数据库操作失败', message: error.message },
        { status: 500 }
      );
    }

  } catch (err: unknown) {
    const error = err as Error;
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: '处理上传请求时出错', message: error.message },
      { status: 500 }
    );
  }
}
