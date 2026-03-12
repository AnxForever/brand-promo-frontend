import { useEffect, useState } from 'react';
import { Alert, Spin } from 'antd';
import {
  ShoppingOutlined,
  UserOutlined,
  NotificationOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { statsApi, recommendApi } from '../../api';
import { useAuthStore } from '../../store/authStore';

interface OverviewData {
  userCount: number;
  productCount: number;
  adCount: number;
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

export default function DashboardPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    setStatsError(null);

    Promise.allSettled([
      isAdmin ? statsApi.overview() : Promise.reject('skip'),
      recommendApi.list(),
    ]).then(([overviewRes, recRes]) => {
      if (overviewRes.status === 'fulfilled' && overviewRes.value.success) {
        setData(overviewRes.value.data);
      } else if (isAdmin) {
        setStatsError('统计接口无权限访问，请重新登录管理员账号。');
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
