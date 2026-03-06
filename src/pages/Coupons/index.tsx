import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Tag,
  Popconfirm,
  Tabs,
  Card,
  App,
} from 'antd';
import { PlusOutlined, GiftOutlined } from '@ant-design/icons';
import { couponApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import dayjs from 'dayjs';

interface Coupon {
  id: number;
  name: string;
  discount: number;
  minAmount: number;
  startTime?: string;
  endTime?: string;
  total?: number;
  remaining?: number;
  status?: number;
}

interface MyCoupon {
  id: number;
  couponId: number;
  name: string;
  discount: number;
  minAmount: number;
  endTime?: string;
  used: boolean;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [myCoupons, setMyCoupons] = useState<MyCoupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await couponApi.list();
      if (res.success) {
        setCoupons(res.data ?? []);
      }
    } catch {
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyCoupons = async () => {
    try {
      const res = await couponApi.mine();
      if (res.success) {
        setMyCoupons(res.data ?? []);
      }
    } catch {
      setMyCoupons([]);
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchMyCoupons();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: Coupon) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      startTime: record.startTime ? dayjs(record.startTime) : null,
      endTime: record.endTime ? dayjs(record.endTime) : null,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await couponApi.delete(id);
      message.success('删除成功');
      fetchCoupons();
    } catch {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      startTime: values.startTime?.format('YYYY-MM-DD HH:mm:ss'),
      endTime: values.endTime?.format('YYYY-MM-DD HH:mm:ss'),
    };
    try {
      if (editingId) {
        await couponApi.update(editingId, payload);
        message.success('更新成功');
      } else {
        await couponApi.create(payload);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchCoupons();
    } catch {
      message.error('操作失败');
    }
  };

  const handleClaim = async (id: number) => {
    try {
      await couponApi.claim(id);
      message.success('领取成功');
      fetchCoupons();
      fetchMyCoupons();
    } catch {
      message.error('领取失败');
    }
  };

  // Admin table columns
  const adminColumns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: '优惠券名称',
      dataIndex: 'name',
      render: (v: string) => (
        <div className="flex items-center gap-2">
          <GiftOutlined className="text-orange-500" />
          <span className="font-medium text-slate-900">{v}</span>
        </div>
      ),
    },
    {
      title: '面额',
      dataIndex: 'discount',
      width: 100,
      render: (v: number) => (
        <span className="font-semibold text-orange-600">¥{v?.toFixed(2)}</span>
      ),
    },
    {
      title: '最低消费',
      dataIndex: 'minAmount',
      width: 110,
      render: (v: number) => (
        <span className="text-slate-500">满¥{v?.toFixed(2)}</span>
      ),
    },
    {
      title: '库存',
      width: 100,
      render: (_: any, record: Coupon) =>
        record.total != null ? (
          <span className="text-sm">
            {record.remaining ?? '-'}/{record.total}
          </span>
        ) : (
          <span className="text-slate-400">-</span>
        ),
    },
    {
      title: '有效期',
      width: 180,
      render: (_: any, record: Coupon) => (
        <span className="text-xs text-slate-400">
          {record.startTime
            ? `${dayjs(record.startTime).format('MM/DD')} - ${dayjs(record.endTime).format('MM/DD')}`
            : '-'}
        </span>
      ),
    },
    {
      title: '操作',
      width: 160,
      render: (_: any, record: Coupon) => (
        <Space size="small">
          <Button size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除该优惠券？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // User coupon cards
  const couponCards = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {coupons.map((coupon) => {
        const claimed = myCoupons.some((mc) => mc.couponId === coupon.id);
        const expired = coupon.endTime
          ? dayjs(coupon.endTime).isBefore(dayjs())
          : false;
        const soldOut =
          coupon.remaining != null && coupon.remaining <= 0;

        return (
          <Card
            key={coupon.id}
            className="rounded-xl border-gray-200 overflow-hidden"
            styles={{ body: { padding: 0 } }}
          >
            <div className="flex">
              {/* Left: Discount */}
              <div className="w-28 bg-gradient-to-br from-orange-500 to-orange-600 text-white flex flex-col items-center justify-center p-4 shrink-0">
                <span className="text-2xl font-bold">
                  ¥{coupon.discount}
                </span>
                <span className="text-xs opacity-80 mt-1">
                  满{coupon.minAmount}可用
                </span>
              </div>
              {/* Right: Info */}
              <div className="flex-1 p-4 flex flex-col">
                <h3 className="text-sm font-medium text-slate-900">
                  {coupon.name}
                </h3>
                <span className="text-xs text-slate-400 mt-1">
                  {coupon.endTime
                    ? `有效期至 ${dayjs(coupon.endTime).format('YYYY/MM/DD')}`
                    : '长期有效'}
                </span>
                {coupon.remaining != null && (
                  <span className="text-xs text-slate-400">
                    剩余 {coupon.remaining} 张
                  </span>
                )}
                <div className="mt-auto pt-2">
                  {claimed ? (
                    <Tag color="default" className="rounded-md">
                      已领取
                    </Tag>
                  ) : expired ? (
                    <Tag color="default" className="rounded-md">
                      已过期
                    </Tag>
                  ) : soldOut ? (
                    <Tag color="default" className="rounded-md">
                      已领完
                    </Tag>
                  ) : (
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => handleClaim(coupon.id)}
                    >
                      立即领取
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}

      {coupons.length === 0 && (
        <div className="col-span-full text-center py-12 text-slate-400">
          暂无可领取的优惠券
        </div>
      )}
    </div>
  );

  // My coupons list
  const myCouponList = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {myCoupons.map((mc) => (
        <Card
          key={mc.id}
          className={`rounded-xl border-gray-200 overflow-hidden ${mc.used ? 'opacity-50' : ''}`}
          styles={{ body: { padding: 0 } }}
        >
          <div className="flex">
            <div
              className={`w-28 text-white flex flex-col items-center justify-center p-4 shrink-0 ${
                mc.used
                  ? 'bg-gray-400'
                  : 'bg-gradient-to-br from-blue-500 to-blue-600'
              }`}
            >
              <span className="text-2xl font-bold">¥{mc.discount}</span>
              <span className="text-xs opacity-80 mt-1">
                满{mc.minAmount}可用
              </span>
            </div>
            <div className="flex-1 p-4">
              <h3 className="text-sm font-medium text-slate-900">{mc.name}</h3>
              <span className="text-xs text-slate-400 mt-1 block">
                {mc.endTime
                  ? `有效期至 ${dayjs(mc.endTime).format('YYYY/MM/DD')}`
                  : '长期有效'}
              </span>
              <div className="mt-2">
                {mc.used ? (
                  <Tag color="default" className="rounded-md">
                    已使用
                  </Tag>
                ) : (
                  <Tag color="blue" className="rounded-md">
                    可使用
                  </Tag>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}

      {myCoupons.length === 0 && (
        <div className="col-span-full text-center py-12 text-slate-400">
          暂无优惠券，快去领取吧
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          优惠券管理
        </h1>
        {isAdmin && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            className="font-medium"
          >
            新增优惠券
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <Tabs
          defaultActiveKey={isAdmin ? 'manage' : 'available'}
          items={[
            ...(isAdmin
              ? [
                  {
                    key: 'manage',
                    label: '优惠券列表',
                    children: (
                      <Table
                        columns={adminColumns}
                        dataSource={coupons}
                        rowKey="id"
                        loading={loading}
                        pagination={false}
                      />
                    ),
                  },
                ]
              : []),
            {
              key: 'available',
              label: '领券中心',
              children: couponCards,
            },
            {
              key: 'mine',
              label: '我的优惠券',
              children: myCouponList,
            },
          ]}
        />
      </div>

      {/* Admin Create/Edit Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <GiftOutlined className="text-orange-500" />
            <span>{editingId ? '编辑优惠券' : '新增优惠券'}</span>
          </div>
        }
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label="优惠券名称"
            rules={[{ required: true, message: '请输入优惠券名称' }]}
          >
            <Input placeholder="例如：新用户满减券" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="discount"
              label="优惠金额"
              rules={[{ required: true, message: '请输入优惠金额' }]}
            >
              <InputNumber
                min={0}
                precision={2}
                placeholder="0.00"
                prefix="¥"
                className="w-full"
              />
            </Form.Item>
            <Form.Item
              name="minAmount"
              label="最低消费"
              rules={[{ required: true, message: '请输入最低消费' }]}
            >
              <InputNumber
                min={0}
                precision={2}
                placeholder="0.00"
                prefix="¥"
                className="w-full"
              />
            </Form.Item>
          </div>
          <Form.Item name="total" label="发行总量">
            <InputNumber min={1} placeholder="不填则不限量" className="w-full" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="startTime" label="开始时间">
              <DatePicker showTime className="w-full" />
            </Form.Item>
            <Form.Item name="endTime" label="结束时间">
              <DatePicker showTime className="w-full" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
