'use client';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {LucideIcon} from 'lucide-react';
import i18n from '@/lib/i18n';

const t = i18n.t;

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({title, value, icon: Icon, trend}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground"/>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {trend && (
          <p className={`text-xs ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}% {t('comparedToYesterday')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="animate-pulse">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/6"></div>
      </div>
      <div className="h-8 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
    </div>
  );
} 