import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App, Button, Empty, Spin, Tag } from 'antd';
import {
  DeleteOutlined,
  EyeOutlined,
  HeartFilled,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { cartApi, favoriteApi } from '../../api';

interface FavoriteProduct {
  id: number;
  name: string;
  price: number;
  basePrice?: number;
  promoActive?: number;
  category?: string;
  brandName?: string;
  status: number;
  stock?: number;
  imageUrl?: string;
}

export default function FavoritesPage() {
  const [items, setItems] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const currentRoute = `${location.pathname}${location.search}`;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await favoriteApi.list();
      if (res.success) {
        setItems(res.data ?? []);
      }
    } catch {
      setItems([]);
      message.error('加载收藏列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRemove = async (productId: number) => {
    setProcessingId(productId);
    try {
      await favoriteApi.remove(productId);
      setItems((current) => current.filter((item) => item.id !== productId));
      message.success('已取消收藏');
    } catch {
      message.error('取消收藏失败');
    } finally {
      setProcessingId(null);
    }
  };

  const handleAddToCart = async (productId: number) => {
    setProcessingId(productId);
    try {
      await cartApi.add({ productId, quantity: 1 });
      message.success('已加入购物车');
    } catch {
      message.error('加入购物车失败');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-black">
          我的收藏
        </h1>
        <span className="text-sm text-gray-500">
          共 {items.length} 件商品
        </span>
      </div>

      <Spin spinning={loading}>
        {items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {items.map((item) => {
              const busy = processingId === item.id;
              return (
                <div
                  key={item.id}
                  className="bg-white border border-black overflow-hidden"
                >
                  <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingCartOutlined className="text-4xl text-gray-400" />
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2 text-xs">
                      {item.category && <Tag>{item.category}</Tag>}
                      {item.brandName && <Tag color="red">{item.brandName}</Tag>}
                      <Tag color={item.status === 1 ? 'success' : 'default'}>
                        {item.status === 1 ? '在售' : '已下架'}
                      </Tag>
                    </div>

                    <h2 className="text-base font-bold text-black line-clamp-2 min-h-[48px]">
                      {item.name}
                    </h2>

                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          ¥{item.price?.toFixed(2)}
                        </div>
                        {item.promoActive === 1 && item.basePrice && item.basePrice > item.price && (
                          <div className="text-xs text-gray-500 line-through mt-1">
                            ¥{item.basePrice.toFixed(2)}
                          </div>
                        )}
                        {item.stock !== undefined && (
                          <div className="text-xs text-gray-500 mt-1">
                            库存 {item.stock}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <HeartFilled className="text-red-500 text-lg" />
                        {item.promoActive === 1 && <Tag color="volcano">活动中</Tag>}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-5">
                      <Button
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/store/products/${item.id}`, {
                          state: { from: currentRoute },
                        })}
                      >
                        查看
                      </Button>
                      <Button
                        type="primary"
                        icon={<ShoppingCartOutlined />}
                        loading={busy}
                        onClick={() => handleAddToCart(item.id)}
                        disabled={item.status !== 1}
                      >
                        加购
                      </Button>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        loading={busy}
                        onClick={() => handleRemove(item.id)}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-black p-12">
            <Empty
              description="你还没有收藏商品"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" onClick={() => navigate('/store')}>
                去逛商品
              </Button>
            </Empty>
          </div>
        )}
      </Spin>
    </div>
  );
}
