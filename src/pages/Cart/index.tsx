import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Checkbox,
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
  checked: number;
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
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleCheckedChange = async (id: number, checked: boolean) => {
    const val = checked ? 1 : 0;
    try {
      await cartApi.updateChecked(id, val);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, checked: val } : item)),
      );
    } catch {
      message.error('操作失败');
    }
  };

  const handleSelectAll = async (checked: boolean) => {
    const val = checked ? 1 : 0;
    try {
      await Promise.all(
        items.filter((item) => item.checked !== val).map((item) =>
          cartApi.updateChecked(item.id, val),
        ),
      );
      setItems((prev) => prev.map((item) => ({ ...item, checked: val })));
    } catch {
      message.error('操作失败');
    }
  };

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

  const checkedItems = items.filter((item) => item.checked === 1);
  const totalAmount = checkedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const totalCount = checkedItems.reduce((sum, item) => sum + item.quantity, 0);
  const allChecked = items.length > 0 && checkedItems.length === items.length;
  const indeterminate = checkedItems.length > 0 && checkedItems.length < items.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-black">
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
          <div className="bg-white border border-black p-16">
            <Empty
              image={<ShoppingCartOutlined className="text-6xl text-gray-400" />}
              description={
                <span className="text-gray-500">购物车是空的，快去挑选商品吧</span>
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
            <div className="bg-white border border-black divide-y divide-gray-300">
              {/* Header */}
              <div className="flex items-center gap-4 px-4 py-3 bg-gray-50">
                <Checkbox
                  checked={allChecked}
                  indeterminate={indeterminate}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                >
                  <span className="text-sm text-gray-600">全选</span>
                </Checkbox>
              </div>

              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-opacity duration-150"
                >
                  <Checkbox
                    checked={item.checked === 1}
                    onChange={(e) => handleCheckedChange(item.id, e.target.checked)}
                  />

                  <div className="w-20 h-20 bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingCartOutlined className="text-2xl text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-black truncate">
                      {item.productName}
                    </h3>
                    <p className="text-sm text-red-600 font-bold mt-1">
                      ¥{item.price.toFixed(2)}
                    </p>
                  </div>

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

                  <div className="w-24 text-right shrink-0">
                    <span className="text-sm font-bold text-black">
                      ¥{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  <Popconfirm
                    title="确认移除该商品？"
                    onConfirm={() => handleRemove(item.id)}
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      className="text-gray-500 hover:text-red-600"
                    />
                  </Popconfirm>
                </div>
              ))}
            </div>

            {/* Summary Bar */}
            <div className="bg-white border border-black p-6">
              <div className="flex items-center justify-between">
                <div className="text-gray-600">
                  已选 <span className="font-bold text-black">{checkedItems.length}</span> 件商品，
                  共 <span className="font-bold text-black">{totalCount}</span> 个
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-gray-600">
                    合计：
                    <span className="text-xl font-bold text-red-600 ml-1">
                      ¥{totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <Button
                    type="primary"
                    size="large"
                    className="font-bold px-8"
                    disabled={checkedItems.length === 0}
                    onClick={() => navigate('/checkout')}
                  >
                    去结算（{checkedItems.length}）
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
