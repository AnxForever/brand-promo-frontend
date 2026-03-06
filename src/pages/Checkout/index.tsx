import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Form,
  Input,
  Select,
  Spin,
  Empty,
  Divider,
  App,
} from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { cartApi, orderApi, couponApi } from '../../api';

interface CartItem {
  id: number;
  productId: number;
  productName: string;
  imageUrl?: string;
  price: number;
  quantity: number;
}

interface CouponOption {
  id: number;
  name: string;
  discount: number;
  minAmount: number;
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [coupons, setCoupons] = useState<CouponOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCouponId, setSelectedCouponId] = useState<number | undefined>();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { message } = App.useApp();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [cartRes, couponRes] = await Promise.allSettled([
          cartApi.list(),
          couponApi.mine(),
        ]);
        if (cartRes.status === 'fulfilled' && cartRes.value.success) {
          setCartItems(cartRes.value.data ?? []);
        }
        if (couponRes.status === 'fulfilled' && couponRes.value.success) {
          setCoupons(couponRes.value.data ?? []);
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const selectedCoupon = coupons.find((c) => c.id === selectedCouponId);
  const discount =
    selectedCoupon && subtotal >= selectedCoupon.minAmount
      ? selectedCoupon.discount
      : 0;
  const totalAmount = Math.max(0, subtotal - discount);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const res = await orderApi.create({
        receiverName: values.receiverName,
        receiverPhone: values.receiverPhone,
        receiverAddress: values.receiverAddress,
        paymentMethod: values.paymentMethod,
        couponId: selectedCouponId,
        remark: values.remark,
      });
      if (res.success) {
        message.success('订单创建成功');
        navigate(`/orders/${res.data?.id ?? res.data}`);
      }
    } catch {
      message.error('创建订单失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mb-6">
        确认订单
      </h1>

      <Spin spinning={loading}>
        {cartItems.length === 0 && !loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16">
            <Empty
              image={<ShoppingCartOutlined className="text-6xl text-slate-300" />}
              description={
                <span className="text-slate-400">购物车为空，无法结算</span>
              }
            >
              <Button type="primary" onClick={() => navigate('/cart')}>
                返回购物车
              </Button>
            </Empty>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left — Order Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cart Items Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-slate-900 mb-4">
                  商品清单
                </h2>
                <div className="divide-y divide-gray-100">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 py-3"
                    >
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ShoppingCartOutlined className="text-lg text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-slate-900 truncate block">
                          {item.productName}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">
                        x{item.quantity}
                      </span>
                      <span className="text-sm font-medium text-slate-900 w-20 text-right shrink-0">
                        ¥{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Info Form */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-slate-900 mb-4">
                  收货信息
                </h2>
                <Form form={form} layout="vertical">
                  <Form.Item
                    name="receiverName"
                    label="收货人姓名"
                    rules={[{ required: true, message: '请输入收货人姓名' }]}
                  >
                    <Input placeholder="请输入收货人姓名" />
                  </Form.Item>
                  <Form.Item
                    name="receiverAddress"
                    label="收货地址"
                    rules={[{ required: true, message: '请输入收货地址' }]}
                  >
                    <Input.TextArea
                      rows={2}
                      placeholder="请输入详细收货地址"
                    />
                  </Form.Item>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Form.Item
                      name="receiverPhone"
                      label="联系电话"
                      rules={[{ required: true, message: '请输入联系电话' }]}
                    >
                      <Input placeholder="请输入手机号" />
                    </Form.Item>
                    <Form.Item
                      name="paymentMethod"
                      label="支付方式"
                      rules={[{ required: true, message: '请选择支付方式' }]}
                    >
                      <Select
                        placeholder="请选择"
                        options={[
                          { value: 'WECHAT', label: '微信支付' },
                          { value: 'ALIPAY', label: '支付宝' },
                          { value: 'CARD', label: '银行卡' },
                        ]}
                      />
                    </Form.Item>
                  </div>
                  <Form.Item name="remark" label="订单备注">
                    <Input.TextArea
                      rows={2}
                      placeholder="选填，如有特殊要求请注明"
                    />
                  </Form.Item>
                </Form>
              </div>
            </div>

            {/* Right — Price Summary */}
            <div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                <h2 className="text-base font-semibold text-slate-900 mb-4">
                  订单汇总
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>商品小计</span>
                    <span>¥{subtotal.toFixed(2)}</span>
                  </div>

                  {/* Coupon selector */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      优惠券
                    </label>
                    <Select
                      allowClear
                      placeholder="选择优惠券"
                      className="w-full"
                      value={selectedCouponId}
                      onChange={setSelectedCouponId}
                      options={coupons.map((c) => ({
                        value: c.id,
                        label: `${c.name} (-¥${c.discount})`,
                        disabled: subtotal < c.minAmount,
                      }))}
                    />
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>优惠券减免</span>
                      <span>-¥{discount.toFixed(2)}</span>
                    </div>
                  )}

                  <Divider className="my-3" />

                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-900 font-medium">应付金额</span>
                    <span className="text-xl font-bold text-blue-600">
                      ¥{totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  type="primary"
                  size="large"
                  block
                  className="mt-6 font-medium"
                  loading={submitting}
                  onClick={handleSubmit}
                >
                  提交订单
                </Button>

                <Button
                  block
                  className="mt-2"
                  onClick={() => navigate('/cart')}
                >
                  返回购物车
                </Button>
              </div>
            </div>
          </div>
        )}
      </Spin>
    </div>
  );
}
