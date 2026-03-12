import { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Tag,
  Spin,
  Descriptions,
  Divider,
  Steps,
  App,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { orderApi, ORDER_STATUS_MAP } from '../../api';
import { useAuthStore } from '../../store/authStore';

const statusConfig: Record<string, { text: string; color: string; step: number }> = {
  PENDING: { text: '待支付', color: 'warning', step: 0 },
  PAID: { text: '已支付', color: 'processing', step: 1 },
  SHIPPED: { text: '已发货', color: 'cyan', step: 2 },
  COMPLETED: { text: '已完成', color: 'success', step: 3 },
  CANCELLED: { text: '已取消', color: 'default', step: -1 },
};

interface OrderItem {
  productId: number;
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface OrderDetail {
  id: number;
  orderNo: string;
  status: string;
  receiverName: string;
  receiverAddress: string;
  receiverPhone: string;
  paymentMethod: string;
  totalAmount: number;
  payAmount: number;
  discountAmount: number;
  remark?: string;
  createdAt: string;
  payTime?: string;
  shipTime?: string;
  finishTime?: string;
  items: OrderItem[];
}

interface OrderDetailLocationState {
  from?: string;
}

function mapOrderDetail(res: any): OrderDetail {
  const o = res.order ?? res;
  const items: OrderItem[] = res.items ?? o.items ?? [];
  return {
    id: o.id,
    orderNo: o.orderNo,
    status: ORDER_STATUS_MAP[o.status] ?? o.status,
    receiverName: o.receiverName,
    receiverAddress: o.receiverAddress,
    receiverPhone: o.receiverPhone,
    paymentMethod: o.paymentMethod,
    totalAmount: o.totalAmount,
    payAmount: o.payAmount ?? o.totalAmount,
    discountAmount: o.discountAmount ?? 0,
    remark: o.remark,
    createdAt: o.createdAt,
    payTime: o.payTime,
    shipTime: o.shipTime,
    finishTime: o.finishTime,
    items,
  };
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const user = useAuthStore((state) => state.user);
  const isManager = user?.role === 'ADMIN' || user?.role === 'MERCHANT';
  const isStorefrontRoute = location.pathname.startsWith('/store');
  const locationState = location.state as OrderDetailLocationState | null;
  const fallbackReturnPath = isStorefrontRoute ? '/store/orders' : '/orders';
  const returnPath = locationState?.from?.startsWith('/') ? locationState.from : fallbackReturnPath;

  const fetchOrder = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await orderApi.detail(Number(id));
      if (res.success) {
        setOrder(mapOrderDetail(res.data));
      }
    } catch {
      message.error('加载订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handlePay = async () => {
    if (!order) return;
    try {
      await orderApi.pay(order.id);
      message.success('支付成功');
      fetchOrder();
    } catch {
      message.error('支付失败');
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    try {
      await orderApi.cancel(order.id);
      message.success('订单已取消');
      fetchOrder();
    } catch {
      message.error('取消失败');
    }
  };

  const handleShip = async () => {
    if (!order) return;
    try {
      await orderApi.ship(order.id);
      message.success('已标记发货');
      fetchOrder();
    } catch {
      message.error('操作失败');
    }
  };

  const handleComplete = async () => {
    if (!order) return;
    try {
      await orderApi.complete(order.id);
      message.success('订单已完成');
      fetchOrder();
    } catch {
      message.error('操作失败');
    }
  };

  const cfg = order ? statusConfig[order.status] ?? { text: order.status, color: 'default', step: -1 } : null;

  const paymentLabels: Record<string, string> = {
    WECHAT: '微信支付',
    ALIPAY: '支付宝',
    CARD: '银行卡',
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(returnPath)}
        />
        <h1 className="text-2xl font-bold tracking-tight text-black">
          订单详情
        </h1>
        {order && (
          <span className="text-sm text-gray-500 font-mono">
            {order.orderNo ?? `#${order.id}`}
          </span>
        )}
      </div>

      <Spin spinning={loading}>
        {order && (
          <div className="space-y-6">
            {/* Status Steps */}
            {order.status !== 'CANCELLED' ? (
              <div className="bg-white border border-black p-6">
                <Steps
                  current={cfg?.step ?? 0}
                  items={[
                    { title: '待支付' },
                    { title: '已支付' },
                    { title: '已发货' },
                    { title: '已完成' },
                  ]}
                />
              </div>
            ) : (
              <div className="bg-white border border-black p-6 text-center">
                <Tag color="default" className="text-base px-4 py-1">
                  订单已取消
                </Tag>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left — Order Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Items */}
                <div className="bg-white border border-black p-6">
                  <h2 className="text-base font-bold text-black mb-4">
                    商品明细
                  </h2>
                  <div className="divide-y divide-gray-300">
                    {order.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-3"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-black">
                            {item.productName}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            x{item.quantity}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-black shrink-0">
                          ¥{(item.subtotal ?? item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Divider className="my-3" />
                  <div className="flex justify-between">
                    <span className="text-gray-600">商品总额</span>
                    <span className="font-bold text-black">
                      ¥{order.totalAmount?.toFixed(2)}
                    </span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between mt-1">
                      <span className="text-green-600">优惠减免</span>
                      <span className="text-green-600">
                        -¥{order.discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Delivery Info */}
                <div className="bg-white border border-black p-6">
                  <h2 className="text-base font-bold text-black mb-4">
                    收货信息
                  </h2>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="收货人">
                      {order.receiverName}
                    </Descriptions.Item>
                    <Descriptions.Item label="收货地址">
                      {order.receiverAddress}
                    </Descriptions.Item>
                    <Descriptions.Item label="联系电话">
                      {order.receiverPhone}
                    </Descriptions.Item>
                    <Descriptions.Item label="支付方式">
                      {paymentLabels[order.paymentMethod] ?? order.paymentMethod}
                    </Descriptions.Item>
                    {order.remark && (
                      <Descriptions.Item label="备注">
                        {order.remark}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </div>
              </div>

              {/* Right — Summary & Actions */}
              <div>
                <div className="bg-white border border-black p-6 sticky top-6">
                  <h2 className="text-base font-bold text-black mb-4">
                    订单状态
                  </h2>

                  <div className="text-center mb-4">
                    <Tag
                      color={cfg?.color}
                      className="text-sm px-3 py-0.5"
                    >
                      {cfg?.text}
                    </Tag>
                  </div>

                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="下单时间">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : '-'}
                    </Descriptions.Item>
                    {order.payTime && (
                      <Descriptions.Item label="支付时间">
                        {new Date(order.payTime).toLocaleString()}
                      </Descriptions.Item>
                    )}
                    {order.shipTime && (
                      <Descriptions.Item label="发货时间">
                        {new Date(order.shipTime).toLocaleString()}
                      </Descriptions.Item>
                    )}
                    {order.finishTime && (
                      <Descriptions.Item label="完成时间">
                        {new Date(order.finishTime).toLocaleString()}
                      </Descriptions.Item>
                    )}
                  </Descriptions>

                  <Divider className="my-4" />

                  <div className="flex justify-between items-baseline mb-4">
                    <span className="text-gray-600">应付金额</span>
                    <span className="text-xl font-bold text-red-600">
                      ¥{order.payAmount?.toFixed(2)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {!isManager && order.status === 'PENDING' && (
                      <>
                        <Button
                          type="primary"
                          block
                          onClick={handlePay}
                        >
                          立即支付
                        </Button>
                        <Button block danger onClick={handleCancel}>
                          取消订单
                        </Button>
                      </>
                    )}
                    {isManager && order.status === 'PAID' && (
                      <Button type="primary" block onClick={handleShip}>
                        标记发货
                      </Button>
                    )}
                    {!isManager && order.status === 'SHIPPED' && (
                      <Button type="primary" block onClick={handleComplete}>
                        确认收货
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Spin>
    </div>
  );
}
