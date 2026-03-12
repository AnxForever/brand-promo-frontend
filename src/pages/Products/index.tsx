import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import dayjs, { type Dayjs } from 'dayjs';
import {
  App,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { productApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import StorefrontProductsPage from './Storefront';

interface ProductRecord {
  id: number;
  name: string;
  category?: string;
  price: number;
  basePrice?: number;
  stock?: number;
  salesCount?: number;
  status: number;
  description?: string;
  promoPrice?: number;
  promoStartTime?: string;
  promoEndTime?: string;
  promoStatus?: number;
  promoActive?: number;
}

interface ProductFormValues {
  name: string;
  category?: string;
  price?: number;
  stock?: number;
  description?: string;
  promoStatus?: number;
  promoPrice?: number;
  promoStartTime?: Dayjs;
  promoEndTime?: Dayjs;
}

const sortOptions = [
  { value: '', label: '默认排序' },
  { value: 'price_asc', label: '价格升序' },
  { value: 'price_desc', label: '价格降序' },
  { value: 'sales', label: '销量优先' },
  { value: 'newest', label: '最新上架' },
];

function formatPromoPeriod(record: ProductRecord): string {
  if (!record.promoStartTime || !record.promoEndTime) return '未设置时间';
  return `${dayjs(record.promoStartTime).format('MM/DD HH:mm')} - ${dayjs(record.promoEndTime).format('MM/DD HH:mm')}`;
}

function ManagerProductsPage() {
  const [data, setData] = useState<ProductRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<ProductFormValues>();
  const promoStatus = Form.useWatch('promoStatus', form);
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const currentRoute = `${location.pathname}${location.search}`;

  const fetchData = async (p = page, kw = keyword, cat = categoryFilter, sort = sortBy) => {
    setLoading(true);
    try {
      const res = await productApi.list({
        page: p,
        size: 10,
        keyword: kw || undefined,
        category: cat || undefined,
        sort: sort || undefined,
      });
      if (res.success) {
        setData(res.data.list ?? []);
        setTotal(res.data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    productApi.categories().then((res) => {
      if (res.success) setCategories(res.data ?? []);
    }).catch(() => {});
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchData(1, keyword, categoryFilter, sortBy);
  };

  const handleCategoryChange = (val: string | undefined) => {
    setCategoryFilter(val);
    setPage(1);
    fetchData(1, keyword, val, sortBy);
  };

  const handleSortChange = (val: string) => {
    setSortBy(val);
    setPage(1);
    fetchData(1, keyword, categoryFilter, val);
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ promoStatus: 0 });
    setModalOpen(true);
  };

  const handleEdit = (record: ProductRecord) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      price: record.basePrice ?? record.price,
      promoStartTime: record.promoStartTime ? dayjs(record.promoStartTime) : undefined,
      promoEndTime: record.promoEndTime ? dayjs(record.promoEndTime) : undefined,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await productApi.delete(id);
      message.success('删除成功');
      fetchData();
    } catch (err: any) {
      message.error(err?.message || '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      const payload = {
        ...values,
        promoStartTime: values.promoStartTime?.format('YYYY-MM-DD HH:mm:ss'),
        promoEndTime: values.promoEndTime?.format('YYYY-MM-DD HH:mm:ss'),
      } as Record<string, unknown>;

      if (values.promoStatus === 1) {
        if (values.promoPrice == null) {
          message.warning('请填写活动价');
          return;
        }
        if (!values.promoStartTime || !values.promoEndTime) {
          message.warning('请完整选择活动时间');
          return;
        }
        if (values.price != null && values.promoPrice >= values.price) {
          message.warning('活动价需低于基础售价');
          return;
        }
        if (values.promoEndTime.isBefore(values.promoStartTime)) {
          message.warning('活动结束时间需晚于开始时间');
          return;
        }
      }

      if (values.promoStatus !== 1) {
        payload.promoPrice = null;
        payload.promoStartTime = null;
        payload.promoEndTime = null;
      }

      if (editingId) {
        await productApi.update(editingId, payload);
        message.success('更新成功');
      } else {
        await productApi.create(payload);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.message || '操作失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: '商品名称',
      dataIndex: 'name',
      ellipsis: true,
      render: (v: string, record: ProductRecord) => (
        <a
          className="text-red-600 hover:underline cursor-pointer font-bold"
          onClick={() => navigate(`/products/${record.id}`, {
            state: { from: currentRoute },
          })}
        >
          {v}
        </a>
      ),
    },
    { title: '分类', dataIndex: 'category', width: 120 },
    {
      title: '价格',
      dataIndex: 'price',
      width: 150,
      render: (v: number, record: ProductRecord) => (
        <div>
          <div className="font-bold text-red-600">¥{v?.toFixed(2)}</div>
          {record.promoActive === 1 && record.basePrice && record.basePrice > v && (
            <div className="text-xs text-gray-500 line-through">
              ¥{record.basePrice.toFixed(2)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '促销',
      width: 180,
      render: (_: unknown, record: ProductRecord) => {
        if (record.promoStatus !== 1 || !record.promoPrice) {
          return <span className="text-gray-400 text-xs">未开启</span>;
        }
        return (
          <div>
            <Tag color={record.promoActive === 1 ? 'volcano' : 'gold'}>
              {record.promoActive === 1 ? '限时折扣中' : '已配置'}
            </Tag>
            <div className="text-xs text-gray-500 mt-1">¥{record.promoPrice.toFixed(2)}</div>
            <div className="text-xs text-gray-400">{formatPromoPeriod(record)}</div>
          </div>
        );
      },
    },
    {
      title: '库存',
      dataIndex: 'stock',
      width: 80,
      render: (v: number) => v ?? '-',
    },
    {
      title: '销量',
      dataIndex: 'salesCount',
      width: 80,
      render: (v: number) => v ?? 0,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: number) => (
        <Tag color={v === 1 ? 'success' : 'error'}>
          {v === 1 ? '上架' : '下架'}
        </Tag>
      ),
    },
    {
      title: '操作',
      width: 160,
      render: (_: unknown, record: ProductRecord) => (
        <Space size="small">
          <Button size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除该商品？"
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-black">
          商品管理
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          className="font-bold"
        >
          新增商品
        </Button>
      </div>

      <div className="bg-white border border-black p-6">
        <div className="mb-4">
          <Space wrap>
            <Input
              placeholder="搜索商品..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              className="w-64"
            />
            <Select
              allowClear
              placeholder="全部分类"
              value={categoryFilter}
              onChange={handleCategoryChange}
              className="w-40"
              options={categories.map((c) => ({ value: c, label: c }))}
            />
            <Select
              value={sortBy}
              onChange={handleSortChange}
              className="w-36"
              options={sortOptions}
            />
            <Button icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
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

      <Modal
        title={editingId ? '编辑商品' : '新增商品'}
        open={modalOpen}
        onOk={handleSubmit}
        confirmLoading={submitting}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
        width={720}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="name" label="商品名称" rules={[{ required: true, message: '请输入商品名称' }]}>
            <Input placeholder="请输入商品名称" />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Select
              allowClear
              placeholder="请选择分类"
              options={categories.map((c) => ({ value: c, label: c }))}
            />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="price" label="基础售价" rules={[{ required: true, message: '请输入基础售价' }]}>
              <InputNumber min={0} precision={2} placeholder="0.00" className="w-full" />
            </Form.Item>
            <Form.Item name="stock" label="库存">
              <InputNumber min={0} placeholder="0" className="w-full" />
            </Form.Item>
          </div>
          <Form.Item name="description" label="商品描述">
            <Input.TextArea rows={3} placeholder="请输入商品描述" />
          </Form.Item>

          <div className="border border-gray-300 p-4 bg-gray-50">
            <h3 className="text-sm font-bold text-black mb-3">限时折扣</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item name="promoStatus" label="活动状态" initialValue={0}>
                <Select
                  options={[
                    { value: 0, label: '关闭' },
                    { value: 1, label: '开启' },
                  ]}
                />
              </Form.Item>
              <Form.Item
                name="promoPrice"
                label="活动价"
                rules={promoStatus === 1 ? [{ required: true, message: '请输入活动价' }] : []}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  placeholder="0.00"
                  className="w-full"
                  disabled={promoStatus !== 1}
                />
              </Form.Item>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item name="promoStartTime" label="开始时间">
                <DatePicker
                  showTime
                  className="w-full"
                  format="YYYY-MM-DD HH:mm:ss"
                  disabled={promoStatus !== 1}
                />
              </Form.Item>
              <Form.Item name="promoEndTime" label="结束时间">
                <DatePicker
                  showTime
                  className="w-full"
                  format="YYYY-MM-DD HH:mm:ss"
                  disabled={promoStatus !== 1}
                />
              </Form.Item>
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default function ProductsPage() {
  const role = useAuthStore((state) => state.user?.role);
  const isManager = role === 'ADMIN' || role === 'MERCHANT';

  return isManager ? <ManagerProductsPage /> : <StorefrontProductsPage />;
}
