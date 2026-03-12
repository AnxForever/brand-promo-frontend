import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Table, Button, Tag, Space, Select, Spin, Empty, Pagination, App } from 'antd';
import {
  ArrowLeftOutlined,
  EyeOutlined,
  FilterOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { orderApi, ORDER_STATUS_MAP } from '../../api';
import { useAuthStore } from '../../store/authStore';

const statusConfig: Record<string, { text: string; color: string }> = {
  PENDING: { text: '待支付', color: 'warning' },
  PAID: { text: '已支付', color: 'processing' },
  SHIPPED: { text: '已发货', color: 'cyan' },
  COMPLETED: { text: '已完成', color: 'success' },
  CANCELLED: { text: '已取消', color: 'default' },
};

function mapOrderRow(entry: any) {
  const o = entry.order ?? entry;
  return {
    id: o.id,
    orderNo: o.orderNo,
    receiverName: o.receiverName,
    receiverPhone: o.receiverPhone,
    receiverAddress: o.receiverAddress,
    totalAmount: o.payAmount ?? o.totalAmount,
    status: ORDER_STATUS_MAP[o.status] ?? o.status,
    paymentMethod: o.paymentMethod,
    createdAt: o.createdAt,
    items: entry.items ?? [],
  };
}

const statusFilterOptions = [
  { value: '', label: '全部状态' },
  { value: '0', label: '待支付' },
  { value: '1', label: '已支付' },
  { value: '2', label: '已发货' },
  { value: '3', label: '已完成' },
  { value: '4', label: '已取消' },
];

export default function OrdersPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const user = useAuthStore((state) => state.user);
  const isManager = user?.role === 'ADMIN' || user?.role === 'MERCHANT';
  const isStorefrontRoute = location.pathname.startsWith('/store');
  const detailBasePath = isStorefrontRoute ? '/store/orders' : '/orders';
  const fromPath = `${location.pathname}${location.search}`;

  const fetchData = async (p = page, status = statusFilter) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page: p, size: 10 };
      if (status !== '') params.status = Number(status);
      const res = await orderApi.list(params);
      if (res.success) {
        const rawList: any[] = res.data?.list ?? [];
        setData(rawList.map(mapOrderRow));
        setTotal(res.data?.total ?? 0);
      }
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePay = async (id: number) => {
    try {
      await orderApi.pay(id);
      message.success('支付成功');
      fetchData();
    } catch {
      message.error('支付失败');
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await orderApi.cancel(id);
      message.success('订单已取消');
      fetchData();
    } catch {
      message.error('取消失败');
    }
  };

  const handleShip = async (id: number) => {
    try {
      await orderApi.ship(id);
      message.success('已标记发货');
      fetchData();
    } catch {
      message.error('操作失败');
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await orderApi.complete(id);
      message.success('订单已完成');
      fetchData();
    } catch {
      message.error('操作失败');
    }
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
    fetchData(1, val);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchData(p);
  };

  /* ──────────────────────────────────────────
   *  Storefront card layout
   * ────────────────────────────────────────── */
  if (isStorefrontRoute) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/store')}
            />
            <h1 className="text-2xl font-bold tracking-tight text-black">
              我的订单
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">共 {total} 笔</span>
            <Button onClick={() => navigate('/store')}>继续逛逛</Button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {statusFilterOptions.map((opt) => (
            <Button
              key={opt.value}
              size="small"
              type={statusFilter === opt.value ? 'primary' : 'default'}
              onClick={() => handleStatusChange(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        <Spin spinning={loading}>
          {data.length > 0 ? (
            <div className="space-y-4">
              {data.map((record) => {
                const cfg = statusConfig[record.status] ?? { text: record.status, color: 'default' };
                return (
                  <div
                    key={record.id}
                    className="bg-white border border-black overflow-hidden"
                  >
                    {/* Card header */}
                    <div className="flex items-center justify-between gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-xs text-gray-500 truncate">
                          {record.orderNo ?? `#${record.id}`}
                        </span>
                        <span className="text-xs text-gray-400">
                          {record.createdAt
                            ? new Date(record.createdAt).toLocaleDateString()
                            : ''}
                        </span>
                      </div>
                      <Tag color={cfg.color}>{cfg.text}</Tag>
                    </div>

                    {/* Card body */}
                    <div className="p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-sm text-gray-600">
                            收货人：{record.receiverName}
                          </div>
                          {record.items.length > 0 && (
                            <div className="text-xs text-gray-400 mt-1 truncate">
                              {record.items.map((i: any) => i.productName).join('、')}
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xl font-bold text-red-600">
                            ¥{record.totalAmount?.toFixed(2) ?? '0.00'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card actions */}
                    <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200">
                      <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`${detailBasePath}/${record.id}`, {
                          state: { from: fromPath },
                        })}
                      >
                        查看详情
                      </Button>
                      {record.status === 'PENDING' && (
                        <>
                          <Button
                            size="small"
                            type="primary"
                            onClick={() => handlePay(record.id)}
                          >
                            去支付
                          </Button>
                          <Button
                            size="small"
                            danger
                            onClick={() => handleCancel(record.id)}
                          >
                            取消订单
                          </Button>
                        </>
                      )}
                      {record.status === 'SHIPPED' && (
                        <Button
                          size="small"
                          type="primary"
                          onClick={() => handleComplete(record.id)}
                        >
                          确认收货
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-center mt-6">
                <Pagination
                  current={page}
                  total={total}
                  pageSize={10}
                  showSizeChanger={false}
                  onChange={handlePageChange}
                  showTotal={(t) => `共 ${t} 条`}
                />
              </div>
            </div>
          ) : (
            <div className="bg-white border border-black p-12">
              <Empty
                image={<ShoppingOutlined className="text-6xl text-gray-400" />}
                description="暂无订单"
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

  /* ──────────────────────────────────────────
   *  Backend table layout (admin / merchant)
   * ────────────────────────────────────────── */
  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      width: 180,
      render: (v: string, record: any) => (
        <span className="font-mono text-xs text-gray-600">
          {v ?? `#${record.id}`}
        </span>
      ),
    },
    {
      title: '收货人',
      dataIndex: 'receiverName',
      width: 100,
    },
    {
      title: '收货地址',
      dataIndex: 'receiverAddress',
      ellipsis: true,
    },
    {
      title: '联系电话',
      dataIndex: 'receiverPhone',
      width: 130,
    },
    {
      title: '应付金额',
      dataIndex: 'totalAmount',
      width: 110,
      render: (v: number) => (
        <span className="font-bold text-black">
          ¥{v?.toFixed(2) ?? '0.00'}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => {
        const cfg = statusConfig[v] ?? { text: v, color: 'default' };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '下单时间',
      dataIndex: 'createdAt',
      width: 120,
      render: (v: string) => (
        <span className="text-xs text-gray-500">
          {v ? new Date(v).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      title: '操作',
      width: 220,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`${detailBasePath}/${record.id}`, {
              state: { from: fromPath },
            })}
          >
            详情
          </Button>
          {!isManager && record.status === 'PENDING' && (
            <>
              <Button
                size="small"
                type="primary"
                onClick={() => handlePay(record.id)}
              >
                支付
              </Button>
              <Button
                size="small"
                danger
                onClick={() => handleCancel(record.id)}
              >
                取消
              </Button>
            </>
          )}
          {isManager && record.status === 'PAID' && (
            <Button size="small" onClick={() => handleShip(record.id)}>
              发货
            </Button>
          )}
          {!isManager && record.status === 'SHIPPED' && (
            <Button size="small" onClick={() => handleComplete(record.id)}>
              确认收货
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-black mb-6">
        {isManager ? '订单管理' : '我的订单'}
      </h1>

      <div className="bg-white border border-black p-6">
        <div className="mb-4">
          <Space wrap>
            <FilterOutlined className="text-gray-500" />
            <Select
              value={statusFilter}
              onChange={handleStatusChange}
              className="w-36"
              options={statusFilterOptions}
            />
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: 10,
            showTotal: (t) => `共 ${t} 条`,
            onChange: handlePageChange,
          }}
        />
      </div>
    </div>
  );
}
