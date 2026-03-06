import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  InputNumber,
  Popconfirm,
  Spin,
  Empty,
  App,
} from 'antd';
import {
  DeleteOutlined,
  ShoppingCartOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { cartApi } from '../../api';

interface CartItem {
  id: number;
  productId: number;
  productName: string;
  imageUrl?: string;
  price: number;
  quantity: number;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { message } = App.useApp();

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await cartApi.list();
      if (res.success) {
        setItems(res.data ?? []);
      }
    } catch {
      // Backend not ready yet — show empty cart
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleQuantityChange = async (id: number, quantity: number) => {
    if (quantity < 1) return;
    try {
      await cartApi.updateQuantity(id, quantity);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity } : item)),
      );
    } catch {
      message.error('更新数量失败');
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await cartApi.remove(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      message.success('已移除');
    } catch {
      message.error('移除失败');
    }
  };

  const handleClear = async () => {
    try {
      await cartApi.clear();
      setItems([]);
      message.success('购物车已清空');
    } catch {
      message.error('清空失败');
    }
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          购物车
        </h1>
        {items.length > 0 && (
          <Popconfirm
            title="确认清空购物车？"
            description="清空后无法恢复。"
            onConfirm={handleClear}
          >
            <Button icon={<ClearOutlined />} danger>
              清空购物车
            </Button>
          </Popconfirm>
        )}
      </div>

      <Spin spinning={loading}>
        {items.length === 0 && !loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16">
            <Empty
              image={<ShoppingCartOutlined className="text-6xl text-slate-300" />}
              description={
                <span className="text-slate-400">购物车是空的，快去挑选商品吧</span>
              }
            >
              <Button type="primary" onClick={() => navigate('/products')}>
                去逛逛
              </Button>
            </Empty>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cart Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                >
                  {/* Product Image */}
                  <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingCartOutlined className="text-2xl text-slate-300" />
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-slate-900 truncate">
                      {item.productName}
                    </h3>
                    <p className="text-sm text-blue-600 font-semibold mt-1">
                      ¥{item.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center gap-2 shrink-0">
                    <InputNumber
                      min={1}
                      max={99}
                      value={item.quantity}
                      onChange={(val) =>
                        handleQuantityChange(item.id, val ?? 1)
                      }
                      size="small"
                      className="w-20"
                    />
                  </div>

                  {/* Subtotal */}
                  <div className="w-24 text-right shrink-0">
                    <span className="text-sm font-semibold text-slate-900">
                      ¥{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  {/* Remove */}
                  <Popconfirm
                    title="确认移除该商品？"
                    onConfirm={() => handleRemove(item.id)}
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      className="text-slate-400 hover:text-red-500"
                    />
                  </Popconfirm>
                </div>
              ))}
            </div>

            {/* Summary Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="text-slate-500">
                  共 <span className="font-semibold text-slate-900">{totalCount}</span> 件商品
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-slate-500">
                    合计：
                    <span className="text-xl font-bold text-blue-600 ml-1">
                      ¥{totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <Button
                    type="primary"
                    size="large"
                    className="font-medium px-8"
                    onClick={() => navigate('/checkout')}
                  >
                    去结算
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Spin>
    </div>
  );
}
