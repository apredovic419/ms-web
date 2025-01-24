import {and, desc, eq, gt, sql} from "drizzle-orm";
import {accounts, characters, loginlog} from "./schema";
import {gameDB} from "./connection";

interface CountResult {
  count: number;
}

interface LevelStatsResult {
  maxLevel: number;
  minLevel: number;
  avgLevel: number;
  medianLevel: number;
}

// 实时在线统计
export async function getOnlineStats() {
  // 在线角色数
  const onlineChars = await gameDB
    .select({count: sql`count(*)`})
    .from(accounts)
    .where(eq(accounts.loggedin, 2)) as CountResult[];

  // 在线设备数（去重hwid）
  const onlineDevices = await gameDB
    .select({count: sql`count(distinct ${accounts.hwid})`})
    .from(accounts)
    .where(eq(accounts.loggedin, 2)) as CountResult[];

  return {
    onlineChars: onlineChars[0].count,
    onlineDevices: onlineDevices[0].count,
  };
}

// 今日新增账户统计
export async function getTodayNewAccounts() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // 今日新增
  const todayNew = await gameDB
    .select({count: sql`count(*)`})
    .from(accounts)
    .where(gt(accounts.createdat, today)) as CountResult[];

  // 昨日新增
  const yesterdayNew = await gameDB
    .select({count: sql`count(*)`})
    .from(accounts)
    .where(and(
      gt(accounts.createdat, yesterday),
      sql`${accounts.createdat} < ${today}`
    )) as CountResult[];

  const growth = yesterdayNew[0].count === 0 ? 0 :
    ((todayNew[0].count - yesterdayNew[0].count) / yesterdayNew[0].count) * 100;

  return {
    today: todayNew[0].count,
    growth
  };
}

// 今日活跃角色统计
export async function getTodayActiveChars() {
  // 今日活跃
  const todayActive = await gameDB
    .select({count: sql`count(distinct ${loginlog.charId})`})
    .from(loginlog)
    .where(sql`${loginlog.date} = DATE(NOW())`) as CountResult[];

  // 昨日活跃
  const yesterdayActive = await gameDB
    .select({count: sql`count(distinct ${loginlog.charId})`})
    .from(loginlog)
    .where(sql`${loginlog.date} = DATE(DATE_SUB(NOW(), INTERVAL 1 DAY))`) as CountResult[];

  const growth = yesterdayActive[0].count === 0 ? 0 :
    ((todayActive[0].count - yesterdayActive[0].count) / yesterdayActive[0].count) * 100;

  return {
    today: todayActive[0].count,
    growth
  };
}

// 时间段统计基础函数
async function getPeriodStats(period: '24h' | '7d' | '30d') {
  const intervals = {
    '24h': 1,
    '7d': 7,
    '30d': 30
  };

  const days = intervals[period];

  // 注册账户数
  const newAccounts = await gameDB
    .select({count: sql`count(*)`})
    .from(accounts)
    .where(sql`${accounts.createdat} > DATE_SUB(NOW(), INTERVAL ${days} DAY)`) as CountResult[];

  // 新建角色数
  const newChars = await gameDB
    .select({count: sql`count(*)`})
    .from(characters)
    .where(sql`${characters.createDate} > DATE_SUB(NOW(), INTERVAL ${days} DAY)`) as CountResult[];

  // 登录角色数
  const activeChars = await gameDB
    .select({count: sql`count(distinct ${loginlog.charId})`})
    .from(loginlog)
    .where(sql`${loginlog.date} > DATE_SUB(CURDATE(), INTERVAL ${days} DAY)`) as CountResult[];

  // 登录设备数
  const activeDevices = await gameDB
    .select({count: sql`count(distinct ${accounts.hwid})`})
    .from(loginlog)
    .leftJoin(characters, eq(loginlog.charId, characters.id))
    .leftJoin(accounts, eq(characters.accountId, accounts.id))
    .where(sql`${loginlog.date} > DATE_SUB(CURDATE(), INTERVAL ${days} DAY)`) as CountResult[];

  return {
    newAccounts: newAccounts[0].count,
    newChars: newChars[0].count,
    activeChars: activeChars[0].count,
    activeDevices: activeDevices[0].count
  };
}

// 24小时统计
export async function get24HourStats() {
  return getPeriodStats('24h');
}

// 7天统计
export async function get7DayStats() {
  return getPeriodStats('7d');
}

// 30天统计
export async function get30DayStats() {
  return getPeriodStats('30d');
}

interface LoginDurationStat {
  date: Date;
  totalMinutes: number;
}

// 近30天每日登录时长统计
export async function getLoginDurationStats() {
  const stats = await gameDB
    .select({
      date: sql`dates.date`,
      totalMinutes: sql`COALESCE(sum(${loginlog.minute}), 0)`
    })
    .from(sql`
      (
        SELECT DATE(DATE_SUB(CURDATE(), INTERVAL n DAY)) as date
        FROM (
          SELECT @row := @row + 1 as n
          FROM (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4) t1,
               (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4) t2,
               (SELECT @row := -1) t0
          LIMIT 30
        ) numbers
      ) dates
      LEFT JOIN ${loginlog} ON DATE(${loginlog.date}) = dates.date
    `)
    .groupBy(sql`dates.date`)
    .orderBy(desc(sql`dates.date`)) as LoginDurationStat[];

  return stats.map(stat => ({
    date: stat.date,
    hours: Math.round(stat.totalMinutes / 60 * 100) / 100 // 转换为小时，保留2位小数
  }));
}

// 近90天角色等级统计
export async function getLevelStats() {
  // 基础统计
  const basicStats = await gameDB
    .select({
      maxLevel: sql`MAX(${characters.level})`,
      minLevel: sql`MIN(${characters.level})`,
      avgLevel: sql`AVG(${characters.level})`,
      totalCount: sql`COUNT(*)`
    })
    .from(characters)
    .where(sql`${characters.lastLogoutTime} > DATE_SUB(NOW(), INTERVAL 90 DAY)`) as (LevelStatsResult & {
    totalCount: number
  })[];

  // 计算中位数
  const medianResult = await gameDB
    .select({
      medianLevel: sql`
        CAST(
          SUBSTRING_INDEX(
            SUBSTRING_INDEX(
              GROUP_CONCAT(${characters.level} ORDER BY ${characters.level} SEPARATOR ','),
              ',',
              CEIL(COUNT(*) / 2)
            ),
            ',',
            -1
          ) AS DECIMAL(10,2)
        )
      `
    })
    .from(characters)
    .where(sql`${characters.lastLogoutTime} > DATE_SUB(NOW(), INTERVAL 90 DAY)`) as {
    medianLevel: number
  }[];

  return {
    max: basicStats[0].maxLevel || 0,
    min: basicStats[0].minLevel || 0,
    avg: Math.round(basicStats[0].avgLevel * 10) / 10 || 0, // 保留1位小数
    median: Math.round(medianResult[0].medianLevel) || 0
  };
} 