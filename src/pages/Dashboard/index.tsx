import { useEffect, useState } from 'react';
import { Alert, Spin } from 'antd';
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
import { useAuthStore } from '../../store/authStore';

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
    bg: 'bg-red-50',
    text: 'text-red-600',
  },
  {
    key: 'productCount' as const,
    label: '商品总数',
    icon: <ShoppingOutlined />,
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
  },
  {
    key: 'adCount' as const,
    label: '广告总数',
    icon: <NotificationOutlined />,
    bg: 'bg-amber-50',
    text: 'text-amber-600',
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
  const [statsError, setStatsError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    setStatsError(null);

    Promise.allSettled([
      isAdmin ? statsApi.overview() : Promise.reject('skip'),
      isAdmin ? statsApi.operations() : Promise.reject('skip'),
      recommendApi.list(),
    ]).then(([overviewRes, opsRes, recRes]) => {
      if (overviewRes.status === 'fulfilled' && overviewRes.value.success) {
        setData(overviewRes.value.data);
      } else if (isAdmin) {
        setStatsError('统计接口无权限访问，请重新登录管理员账号。');
      }

      if (opsRes.status === 'fulfilled' && opsRes.value.success) {
        setOps(aggregateOps(opsRes.value.data));
      } else if (isAdmin) {
        setStatsError((message) => message ?? '操作统计加载失败，请检查账号权限。');
      }

      if (recRes.status === 'fulfilled' && recRes.value.success)
        setRecommendations(recRes.value.data ?? []);
    }).finally(() => setLoading(false));
  }, [isAdmin]);

  if (loading)
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-black mb-6">
          仪表盘
        </h1>
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {statCards.map((card) => (
              <div key={card.key} className="bg-white border border-black p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 w-16 bg-gray-200 mb-2" />
                    <div className="h-8 w-24 bg-gray-200" />
                  </div>
                  <div className={`w-12 h-12 ${card.bg} ${card.text} flex items-center justify-center text-xl`}>
                    {card.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-center h-40">
          <Spin size="large" />
        </div>
      </div>
    );

  const barOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { left: 40, right: 16, top: 16, bottom: 30 },
    xAxis: {
      type: 'category' as const,
      data: ops.map((o) => o.name),
      axisLabel: { fontSize: 11, color: '#555' },
      axisLine: { lineStyle: { color: '#000' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { fontSize: 11, color: '#555' },
      splitLine: { lineStyle: { color: '#e0e0e0' } },
    },
    series: [
      {
        type: 'bar',
        data: ops.map((o) => o.value),
        itemStyle: {
          borderRadius: 0,
          color: '#e53935',
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
            color: ['#e53935', '#2e7d32', '#f57f17', '#111', '#8b5cf6', '#0891b2', '#db2777'][
              i % 7
            ],
          },
        })),
        label: { fontSize: 11, color: '#555' },
        emphasis: {
          itemStyle: { shadowBlur: 0 },
        },
      },
    ],
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-black mb-6">
        仪表盘
      </h1>

      {/* Stat Cards */}
      {isAdmin && (
        <>
          {statsError && (
            <Alert
              type="warning"
              showIcon
              message={statsError}
              className="mb-6 border border-black"
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {statCards.map((card) => (
              <div
                key={card.key}
                className="bg-white border border-black p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{card.label}</p>
                    <p className="text-3xl font-bold tracking-tight text-black">
                      {statsError ? '--' : data?.[card.key] ?? 0}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 ${card.bg} ${card.text} flex items-center justify-center text-xl`}
                  >
                    {card.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </>
      )}

      {/* Charts */}
      {isAdmin && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-black p-6">
          <h2 className="text-base font-bold text-black mb-4">
            近 30 天操作统计
          </h2>
          {ops.length > 0 ? (
            <ReactEChartsCore
              echarts={echarts}
              option={barOption}
              style={{ height: 280 }}
            />
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-500">
              暂无操作数据
            </div>
          )}
        </div>

        <div className="bg-white border border-black p-6">
          <h2 className="text-base font-bold text-black mb-4">
            操作类型分布
          </h2>
          {ops.length > 0 ? (
            <ReactEChartsCore
              echarts={echarts}
              option={pieOption}
              style={{ height: 280 }}
            />
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-500">
              暂无操作数据
            </div>
          )}
        </div>
      </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mt-6">
          <div className="bg-white border border-black p-6">
            <div className="flex items-center gap-2 mb-4">
              <StarOutlined className="text-amber-500" />
              <h2 className="text-base font-bold text-black">
                为你推荐
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recommendations.slice(0, 6).map((item: any) => (
                <div
                  key={item.id}
                  className="group cursor-pointer"
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden mb-2">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingOutlined className="text-2xl text-gray-400" />
                    )}
                  </div>
                  <h3 className="text-xs text-gray-700 truncate">{item.name}</h3>
                  <span className="text-xs font-bold text-red-600">
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
