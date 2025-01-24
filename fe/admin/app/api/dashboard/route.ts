import {NextResponse} from "next/server";
import {
  get24HourStats,
  get30DayStats,
  get7DayStats,
  getLevelStats,
  getLoginDurationStats,
  getOnlineStats,
  getTodayActiveChars,
  getTodayNewAccounts,
} from "@/lib/db/dashboard";
import {mustAuth} from "../utils";

export async function GET() {
  const response = await mustAuth();
  if (response) {
    return response;
  }

  try {
    // 并发请求所有数据
    const [
      onlineStats,
      todayNewAccounts,
      todayActiveChars,
      stats24h,
      stats7d,
      stats30d,
      loginDuration,
      levelStats,
    ] = await Promise.all([
      getOnlineStats(),
      getTodayNewAccounts(),
      getTodayActiveChars(),
      get24HourStats(),
      get7DayStats(),
      get30DayStats(),
      getLoginDurationStats(),
      getLevelStats(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        realtime: {
          onlineChars: onlineStats.onlineChars,
          onlineDevices: onlineStats.onlineDevices,
          newAccounts: {
            count: todayNewAccounts.today,
            growth: todayNewAccounts.growth,
          },
          activeChars: {
            count: todayActiveChars.today,
            growth: todayActiveChars.growth,
          },
        },
        periodStats: {
          "24h": stats24h,
          "7d": stats7d,
          "30d": stats30d,
        },
        loginDuration,
        levelStats,
      },
    });
  } catch (error) {
    console.error("监控数据获取失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "监控数据获取失败",
      },
      {status: 500}
    );
  }
} 