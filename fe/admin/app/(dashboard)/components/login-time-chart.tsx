'use client';

import {ResponsiveLine} from '@nivo/line';

interface LoginTimeChartProps {
  data: { x: string; y: number }[];
}

export function LoginTimeChart({data}: LoginTimeChartProps) {
  return (
    <ResponsiveLine
      data={[
        {
          id: '登录时长',
          data: data
        }
      ]}
      margin={{top: 20, right: 20, bottom: 50, left: 60}}
      xScale={{
        type: 'point'
      }}
      yScale={{
        type: 'linear',
        min: 'auto',
        max: 'auto'
      }}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: -45,
        legend: 'date',
        legendOffset: 40,
        legendPosition: 'middle'
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: 'hours',
        legendOffset: -50,
        legendPosition: 'middle'
      }}
      pointSize={4}
      pointColor={{theme: 'background'}}
      pointBorderWidth={2}
      pointBorderColor={{from: 'serieColor'}}
      pointLabelYOffset={-12}
      useMesh={true}
      theme={{
        axis: {
          ticks: {
            text: {
              fontSize: 11
            }
          },
          legend: {
            text: {
              fontSize: 12,
              fontWeight: 'bold'
            }
          }
        },
        grid: {
          line: {
            stroke: '#eee',
            strokeWidth: 1
          }
        }
      }}
    />
  );
} 