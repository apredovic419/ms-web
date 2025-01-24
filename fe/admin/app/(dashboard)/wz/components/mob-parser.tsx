import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import * as mapleWasm from '@/lib/wasm/maple_wasm';
import { getItemName, getItemDesc } from '@/lib/wasm/maple_string_pool';

// 在文件顶部添加常量定义
const ELEM_MAP: Record<string, string> = {
  'P': '伤害',
  'H': '圣',
  'F': '火',
  'I': '冰',
  'D': '暗',
  'L': '雷',
  'S': '毒',
};

const ATTR_MAP: Record<string, string> = {
  '1': '免疫',
  '2': '抗',
  '3': '弱',
};

function parseElemAttr(elemAttr: string): string[] {
  if (!elemAttr) return [];
  
  const result: string[] = [];
  let currentElem = '';
  
  for (const char of elemAttr) {
    if (/[PHFIDLS]/.test(char)) {
      // 如果是新的元素字母，先处理之前的元素
      if (currentElem) {
        // 如果只有元素没有数字，表示该属性
        result.push(currentElem.length === 1 
          ? `${ELEM_MAP[currentElem]}属性`
          : `${ATTR_MAP[currentElem[1]]}${ELEM_MAP[currentElem[0]]}`);
      }
      currentElem = char;
    } else if (/[123]/.test(char)) {
      currentElem += char;
    }
  }
  
  // 处理最后一个元素
  if (currentElem) {
    result.push(currentElem.length === 1 
      ? `${ELEM_MAP[currentElem]}属性`
      : `${ATTR_MAP[currentElem[1]]}${ELEM_MAP[currentElem[0]]}`);
  }
  
  return result;
}

interface Frame {
  canvas: string;
  delay: number;
}

interface MobData {
  oid: string;
  name: string;
  desc: string | null;
  icon: { stand: string };
  info: null;
  attr: {
    hp: number;
    mp?: number;
    acc?: number;
    exp?: number;
    speed?: number;
    level?: number;
    avoid?: number;
    matk?: number;
    watk?: number;
    mdef?: number;
    wdef?: number;
    boss?: number;
    elemAttr?: string;
  };
  move: Frame[];
  attack1: Frame[];
  stand: Frame[];
}

// 首先添加一个新的组件来处理动画
interface AnimatedFramesProps {
  frames: Frame[];
  className?: string;
}

function AnimatedFrames({ frames, className = "" }: AnimatedFramesProps) {
  if (!frames.length) return null;

  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  useEffect(() => {
    let timeoutId: number | NodeJS.Timeout | null = null;
    let startTime = Date.now();
    let frameIndex = 0;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;

      if (isPaused) {
        timeoutId = setTimeout(() => {
          startTime = Date.now();
          setIsPaused(false);
        }, 1000);
        return;
      }

      // 计算当前应该显示哪一帧
      let totalTime = 0;
      for (let i = 0; i < frames.length; i++) {
        totalTime += frames[i].delay || 120;
        if (elapsed < totalTime) {
          if (frameIndex !== i) {
            frameIndex = i;
            setCurrentFrame(i);
            if (i === 0) {
              setIsPaused(true);
              return;
            }
          }
          break;
        }
      }

      // 如果已经播放完所有帧，重新开始
      if (elapsed >= totalTime) {
        startTime = now;
        frameIndex = 0;
        setCurrentFrame(0);
        setIsPaused(true);
        return;
      }

      timeoutId = requestAnimationFrame(animate);
    };

    timeoutId = requestAnimationFrame(animate);

    return () => {
      if (timeoutId) {
        if (typeof timeoutId === 'number') {
          cancelAnimationFrame(timeoutId);
        } else {
          clearTimeout(timeoutId);
        }
      }
    };
  }, [frames, isPaused]);

  return (
    <div className={`relative ${className}`}>
      <img
        src={`data:image/png;base64,${frames[currentFrame].canvas}`}
        alt={`Frame ${currentFrame}`}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
}

export function MobParser() {
  const [formData, setFormData] = useState<MobData>({
    oid: '',
    name: '',
    desc: null,
    icon: { stand: '' },
    info: null,
    attr: {
      hp: 0,
      mp: 0,
      acc: 0,
      exp: 0,
      speed: 0,
      level: 0,
      avoid: 0,
      matk: 0,
      watk: 0,
      mdef: 0,
      wdef: 0,
    },
    move: [],
    attack1: [],
    stand: [],
  });

  const [currentAction, setCurrentAction] = useState<'stand' | 'move' | 'attack'>('stand');

  const extractOidFromFilename = (filename: string): string => {
    return filename.replace('.img', '').replace(/^0+/, '');
  };

  const [currentFileName, setCurrentFileName] = useState<string>('');

  const handleFileChange = async (file: File) => {
    try {
        setCurrentFileName(file.name);
        const buffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        const result = mapleWasm.parse_image(file.name, uint8Array, false);
        
        // 解析JSON结果
        const parsed = JSON.parse(result);
        console.log(parsed);

        const oid = extractOidFromFilename(file.name);
        const itemName = getItemName(oid, 'Mob');
        const itemDesc = getItemDesc(oid, 'Mob');

        // 提取所需信息
        const info: MobData = {
            oid: oid,
            name: itemName,
            desc: itemDesc,
            icon: { stand: parsed.stand[0].canvas },
            info: null,
            attr: {
                hp: parsed.info.maxHP,
                mp: parsed.info.maxMP,
                acc: parsed.info.acc,
                exp: parsed.info.exp,
                speed: parsed.info.speed,
                level: parsed.info.level,
                avoid: parsed.info.eva,
                matk: parsed.info.MADamage,
                watk: parsed.info.PADamage,
                mdef: parsed.info.MDDamage,
                wdef: parsed.info.PDDamage,
                boss: parsed.info.boss || 0,
            },
            // 提取动画帧数据
            move: Object.values(parsed.move || {}).map((frame: any) => ({
                canvas: frame.canvas,
                delay: frame.delay
            })).filter((frame: any) => frame.canvas),
            attack1: Object.values(parsed.attack1 || {}).map((frame: any) => ({
                canvas: frame.canvas,
                delay: frame.delay
            })).filter((frame: any) => frame.canvas),
            stand: Object.values(parsed.stand || {}).map((frame: any) => ({
                canvas: frame.canvas,
                delay: frame.delay
            })).filter((frame: any) => frame.canvas),
        };
        if (parsed.info.elemAttr) {
            info.attr.elemAttr = parsed.info.elemAttr;
        }

        console.log(info);
        setFormData(info);
      } catch (error) {
        console.error('解析文件失败:', error);
        toast.error('Failed to parse file');
      }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.img')) {
      handleFileChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.img';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileChange(file);
      }
    };
    input.click();
  };

  const handleClear = () => {
    setFormData({
      oid: '',
      name: '',
      desc: null,
      icon: { stand: '' },
      info: null,
      attr: {
        hp: 0,
        mp: 0,
        acc: 0,
        exp: 0,
        speed: 0,
        level: 0,
        avoid: 0,
        matk: 0,
        watk: 0,
        mdef: 0,
        wdef: 0,
      },
      move: [],
      attack1: [],
      stand: [],
    });
    setCurrentFileName('');
  };

  return (
    <div className="flex gap-6">
      {/* 左侧站立图片预览 */}
      <div className="w-1/3 pt-4">
        {formData.oid ? (
          <div className="bg-gray-600 text-white p-4 rounded-lg shadow-lg relative">
            {/* 清理按钮和文件名 */}
            <div className="absolute -top-8 left-0 right-0 flex justify-between items-center text-sm text-gray-500">
              <div className="truncate">
                Choose file: {currentFileName}
              </div>
              <button
                onClick={handleClear}
                className="ml-2 px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded flex items-center gap-1 transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear
              </button>
            </div>

            {/* 怪物名称 */}
            <div className="text-yellow-400 font-bold mb-4">
              {formData.name}
            </div>

            {/* 站立图片 */}
            <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-center">
              <img
                src={`data:image/png;base64,${formData.icon.stand}`}
                alt={formData.name}
                className="max-w-full h-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="text-xs text-gray-600 hidden">{formData.oid}</div>
            </div>

            {/* 怪物描述 */}
            <div className="mt-4 text-sm text-gray-300">
              {formData.desc}
            </div>

            {/* 元素属性 */}
            {formData.attr.elemAttr && (
              <div className="mt-4">
                <div className="text-xs text-gray-400 mb-2">元素属性</div>
                <div className="flex flex-wrap gap-2">
                  {parseElemAttr(formData.attr.elemAttr).map((attr, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-gray-700 rounded text-xs"
                    >
                      {attr}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center h-full min-h-[400px] bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors duration-200"
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="text-4xl text-gray-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-gray-500 text-center">
              Drag .img file here<br />
              or click to choose file
            </p>
          </div>
        )}
      </div>

      {/* 中间动态图片预览 */}
      <div className="w-1/3 pt-4">
        {formData.oid && (
          <div className="bg-gray-600 text-white p-4 rounded-lg shadow-lg relative">
            {/* 怪物名称 */}
            <div className="text-yellow-400 font-bold mb-4">
              Animation Preview
            </div>

            {/* 动画容器 - 使用更大的容器 */}
            <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-center" style={{ height: '440px' }}>
              <AnimatedFrames 
                frames={[
                  ...formData.stand,
                  ...formData.move,
                  ...formData.attack1,
                ]}
                className="w-full h-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* 右侧属性信息 */}
      <div className="w-1/3 pt-4">
        {formData.oid && (
          <div className="bg-gray-600 text-white p-4 rounded-lg shadow-lg space-y-3">
            {/* ID、名称和描述输入框 */}
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Mob ID
                </label>
                <input
                  type="text"
                  value={formData.oid}
                  onChange={(e) => setFormData(prev => ({ ...prev, oid: e.target.value }))}
                  className="w-full p-1.5 bg-gray-700 border border-gray-500 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Mob Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-1.5 bg-gray-700 border border-gray-500 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.desc || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, desc: e.target.value }))}
                  className="w-full p-1.5 bg-gray-700 border border-gray-500 rounded-md text-sm resize-none h-16"
                />
              </div>
            </div>

            {/* 分割线 */}
            <div className="border-t border-gray-500"></div>

            {/* 基本属性 */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-gray-400 text-xs mb-0.5">Level</div>
                <div>{formData.attr.level}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-0.5">EXP</div>
                <div>{formData.attr.exp}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-0.5">HP</div>
                <div>{formData.attr.hp}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-0.5">MP</div>
                <div>{formData.attr.mp}</div>
              </div>
            </div>

            {/* 战斗属性 */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div>物理攻击: {formData.attr.watk}</div>
              <div>魔法攻击: {formData.attr.matk}</div>
              <div>物理防御: {formData.attr.wdef}</div>
              <div>魔法防御: {formData.attr.mdef}</div>
              <div>命中率: {formData.attr.acc}</div>
              <div>回避率: {formData.attr.avoid}</div>
              <div>移动速度: {formData.attr.speed}</div>
            </div>

            {/* 上传按钮 */}
            <div className="pt-2">
              <button
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1.5 px-4 rounded text-sm transition-colors duration-200"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/wz', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        items: [{
                          oid: formData.oid,
                          name: formData.name,
                          category: 'Mob',
                          desc: formData.desc,
                          icon: formData.icon,
                          info: formData.info,
                          attr: formData.attr,
                        }],
                        strategy: 'override',
                      }),
                    });

                    const result = await response.json();
                    
                    if (!response.ok) {
                      throw new Error(result.error || 'Upload failed');
                    }

                    toast.success('Upload success!');
                    
                    if (result.results.errors?.length > 0) {
                      console.error('Upload errors:', result.results.errors);
                      toast.warning(`There are ${result.results.errors.length} errors, please check the console for details`);
                    }
                  } catch (error) {
                    console.error('Upload error:', error);
                    toast.error(error instanceof Error ? error.message : 'Upload failed');
                  }
                }}
              >
                Upload to database
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 