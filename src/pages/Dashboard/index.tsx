import { useEffect, useState } from 'react';
import { Spin } from 'antd';
import {
  ShoppingOutlined,
  UserOutlined,
  NotificationOutlined,
  StarOutlined,
} from '@ant-design/icons';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { statsApi, recommendApi } from '../../api';

echarts.use([
  BarChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);

interface OverviewData {
  userCount: number;
  productCount: number;
  adCount: number;
}

interface OpItem {
  action: string;
  count: number;
}

const statCards = [
  {
    key: 'userCount' as const,
    label: '用户总数',
    icon: <UserOutlined />,
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    key: 'productCount' as const,
    label: '商品总数',
    icon: <ShoppingOutlined />,
    lightColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
  },
  {
    key: 'adCount' as const,
    label: '广告总数',
    icon: <NotificationOutlined />,
    lightColor: 'bg-amber-50',
    textColor: 'text-amber-600',
  },
];

function simplifyAction(action: string): string {
  if (action.startsWith('POST') && action.includes('products')) return '新增商品';
  if (action.startsWith('PUT') && action.includes('products')) return '修改商品';
  if (action.startsWith('DELETE') && action.includes('products')) return '删除商品';
  if (action.startsWith('POST') && action.includes('ads')) return '新增广告';
  if (action.startsWith('PUT') && action.includes('status')) return '更新广告状态';
  if (action.startsWith('PUT') && action.includes('ads')) return '修改广告';
  if (action.startsWith('POST') && action.includes('brands')) return '新增品牌';
  if (action.startsWith('PUT') && action.includes('brands')) return '修改品牌';
  if (action.startsWith('DELETE') && action.includes('brands')) return '删除品牌';
  return action;
}

function aggregateOps(ops: OpItem[]): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const op of ops) {
    const label = simplifyAction(op.action);
    map.set(label, (map.get(label) ?? 0) + op.count);
  }
  return Array.from(map, ([name, value]) => ({ name, value })).sort(
    (a, b) => b.value - a.value,
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [ops, setOps] = useState<{ name: string; value: number }[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([statsApi.overview(), statsApi.operations(), recommendApi.list()])
      .then(([overviewRes, opsRes, recRes]) => {
        if (overviewRes.success) setData(overviewRes.data);
        if (opsRes.success) setOps(aggregateOps(opsRes.data));
        if (recRes.success) setRecommendations(recRes.data ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );

  const barOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { left: 40, right: 16, top: 16, bottom: 30 },
    xAxis: {
      type: 'category' as const,
      data: ops.map((o) => o.name),
      axisLabel: { fontSize: 11, color: '#64748b' },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { fontSize: 11, color: '#64748b' },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    series: [
      {
        type: 'bar',
        data: ops.map((o) => o.value),
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#3b82f6' },
            { offset: 1, color: '#2563eb' },
          ]),
        },
        barWidth: 32,
      },
    ],
  };

  const pieOption = {
    tooltip: { trigger: 'item' as const },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '50%'],
        data: ops.map((o, i) => ({
          name: o.name,
          value: o.value,
          itemStyle: {
            color: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'][
              i % 7
            ],
          },
        })),
        label: { fontSize: 11, color: '#64748b' },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.1)' },
        },
      },
    ],
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mb-6">
        仪表盘
      </h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">{card.label}</p>
                <p className="text-3xl font-semibold tracking-tight text-slate-900">
                  {data?.[card.key] ?? 0}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-xl ${card.lightColor} ${card.textColor} flex items-center justify-center text-xl`}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            近 30 天操作统计
          </h2>
          {ops.length > 0 ? (
            <ReactEChartsCore
              echarts={echarts}
              option={barOption}
              style={{ height: 280 }}
            />
          ) : (
            <div className="flex items-center justify-center h-[280px] text-slate-400">
              暂无操作数据
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            操作类型分布
          </h2>
          {ops.length > 0 ? (
            <ReactEChartsCore
              echarts={echarts}
              option={pieOption}
              style={{ height: 280 }}
            />
          ) : (
            <div className="flex items-center justify-center h-[280px] text-slate-400">
              暂无操作数据
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mt-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <StarOutlined className="text-amber-500" />
              <h2 className="text-base font-semibold text-slate-900">
                为你推荐
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recommendations.slice(0, 6).map((item: any) => (
                <div
                  key={item.id}
                  className="group cursor-pointer"
                >
                  <div className="aspect-square rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden mb-2">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <ShoppingOutlined className="text-2xl text-slate-300" />
                    )}
                  </div>
                  <h3 className="text-xs text-slate-700 truncate">{item.name}</h3>
                  <span className="text-xs font-semibold text-blue-600">
                    ¥{item.price?.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
