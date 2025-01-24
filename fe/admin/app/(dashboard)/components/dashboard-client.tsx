'use client';

import {useEffect, useState} from 'react';
import {Gamepad2, Monitor, UserPlus, Users} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import i18n from '@/lib/i18n';
import {SkeletonStatCard, StatCard} from './stat-card';
import {LoginTimeChart} from './login-time-chart';

const t = i18n.t;

interface DashboardData {
  realtime: {
    onlineChars: number;
    onlineDevices: number;
    newAccounts: {
      count: number;
      growth: number;
    };
    activeChars: {
      count: number;
      growth: number;
    };
  };
  periodStats: {
    '24h': any;
    '7d': any;
    '30d': any;
  };
  loginDuration: Array<{ date: string; hours: number }>;
  levelStats: {
    min: number;
    max: number;
    avg: number;
    median: number;
  };
}

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch('/api/dashboard');
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || '获取数据失败');
        }
      } catch (err) {
        setError('获取数据失败');
        console.error('获取仪表盘数据错误:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
    // 每60秒刷新一次数据
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex-1 p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-300 rounded w-1/3"></div>
          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SkeletonStatCard/>
          <SkeletonStatCard/>
          <SkeletonStatCard/>
          <SkeletonStatCard/>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <SkeletonStatCard/>
          <SkeletonStatCard/>
        </div>
        <SkeletonStatCard/>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg font-medium mb-4">{t('error')}: {error}</p>
          <button onClick={() => window.location.reload()}
                  className="bg-red-500 text-white px-4 py-2 rounded">{t('retry')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{t('dashboard')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('lastUpdated', {date: new Date().toLocaleString()})}
        </p>
      </div>

      {/* 实时数据 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('onlineCharacters')}
          value={data.realtime.onlineChars}
          icon={Gamepad2}
        />
        <StatCard
          title={t('onlineDevices')}
          value={data.realtime.onlineDevices}
          icon={Monitor}
        />
        <StatCard
          title={t('newAccountsToday')}
          value={data.realtime.newAccounts.count}
          icon={UserPlus}
          trend={{
            value: Math.abs(data.realtime.newAccounts.growth),
            isPositive: data.realtime.newAccounts.growth > 0
          }}
        />
        <StatCard
          title={t('activeCharactersToday')}
          value={data.realtime.activeChars.count}
          icon={Users}
          trend={{
            value: Math.abs(data.realtime.activeChars.growth),
            isPositive: data.realtime.activeChars.growth > 0
          }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 时间范围统计 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('registrationStats')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="24h" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="24h">{t('24h')}</TabsTrigger>
                <TabsTrigger value="7d">{t('7d')}</TabsTrigger>
                <TabsTrigger value="30d">{t('30d')}</TabsTrigger>
              </TabsList>

              {Object.entries(data.periodStats).map(([period, stats]) => (
                <TabsContent value={period} key={period}>
                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-2">
                      <p
                        className="text-sm font-medium text-muted-foreground">{t('newRegisteredAccounts')}</p>
                      <p className="text-2xl font-bold">{stats.newAccounts.toLocaleString()}</p>
                    </div>
                    <div className="space-y-2">
                      <p
                        className="text-sm font-medium text-muted-foreground">{t('newCreatedCharacters')}</p>
                      <p className="text-2xl font-bold">{stats.newChars.toLocaleString()}</p>
                    </div>
                    <div className="space-y-2">
                      <p
                        className="text-sm font-medium text-muted-foreground">{t('loggedInCharacters')}</p>
                      <p className="text-2xl font-bold">{stats.activeChars.toLocaleString()}</p>
                    </div>
                    <div className="space-y-2">
                      <p
                        className="text-sm font-medium text-muted-foreground">{t('loggedInDevices')}</p>
                      <p className="text-2xl font-bold">{stats.activeDevices.toLocaleString()}</p>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* 登录时长趋势 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('loginDurationTrend30Days')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <LoginTimeChart
              data={data.loginDuration.map((item) => ({
                x: item.date.replace(/-/g, '/').substring(2, 10),
                y: item.hours
              }))}
            />
          </CardContent>
        </Card>
      </div>

      {/* 角色等级统计 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('activeCharacterLevelStats90Days')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('maxLevel')}</p>
              <p className="text-2xl font-bold">{data.levelStats.max}</p>
              <div className="h-2 bg-blue-500 rounded-full" style={{width: '100%'}}/>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('minLevel')}</p>
              <p className="text-2xl font-bold">{data.levelStats.min}</p>
              <div className="h-2 bg-blue-500 rounded-full" style={{width: '10%'}}/>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('avgLevel')}</p>
              <p className="text-2xl font-bold">{data.levelStats.avg}</p>
              <div className="h-2 bg-blue-500 rounded-full" style={{width: '45%'}}/>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('medianLevel')}</p>
              <p className="text-2xl font-bold">{data.levelStats.median}</p>
              <div className="h-2 bg-blue-500 rounded-full" style={{width: '42%'}}/>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 