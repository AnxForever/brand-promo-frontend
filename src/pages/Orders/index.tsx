import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Table, Button, Tag, Space, Select, App } from 'antd';
import { EyeOutlined, FilterOutlined } from '@ant-design/icons';
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
              state: { from: `${location.pathname}${location.search}` },
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
        {isStorefrontRoute ? '我的订单' : isManager ? '订单管理' : '我的订单'}
      </h1>

      <div className="bg-white border border-black p-6">
        <div className="mb-4">
          <Space wrap>
            <FilterOutlined className="text-gray-500" />
            <Select
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setPage(1);
                fetchData(1, val);
              }}
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
            onChange: (p) => {
              setPage(p);
              fetchData(p);
            },
          }}
        />
      </div>
    </div>
  );
}
