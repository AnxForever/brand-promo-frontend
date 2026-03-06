import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  InputNumber,
  Select,
  Popconfirm,
  Tag,
  App,
} from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { productApi } from '../../api';

const sortOptions = [
  { value: '', label: '默认排序' },
  { value: 'price_asc', label: '价格升序' },
  { value: 'price_desc', label: '价格降序' },
  { value: 'sales', label: '销量优先' },
  { value: 'newest', label: '最新上架' },
];

export default function ProductsPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const navigate = useNavigate();

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
        setData(res.data.list);
        setTotal(res.data.total);
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
    setModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    await productApi.delete(id);
    message.success('删除成功');
    fetchData();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingId) {
      await productApi.update(editingId, values);
      message.success('更新成功');
    } else {
      await productApi.create(values);
      message.success('创建成功');
    }
    setModalOpen(false);
    fetchData();
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: '商品名称',
      dataIndex: 'name',
      ellipsis: true,
      render: (v: string, record: any) => (
        <a
          className="text-red-600 hover:underline cursor-pointer font-bold"
          onClick={() => navigate(`/products/${record.id}`)}
        >
          {v}
        </a>
      ),
    },
    { title: '分类', dataIndex: 'category', width: 120 },
    {
      title: '价格',
      dataIndex: 'price',
      width: 100,
      render: (v: number) => (v != null ? `¥${v.toFixed(2)}` : '-'),
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
      render: (_: any, record: any) => (
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
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
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
            <Form.Item name="price" label="价格">
              <InputNumber
                min={0}
                precision={2}
                placeholder="0.00"
                className="w-full"
              />
            </Form.Item>
            <Form.Item name="stock" label="库存">
              <InputNumber
                min={0}
                placeholder="0"
                className="w-full"
              />
            </Form.Item>
          </div>
          <Form.Item name="description" label="商品描述">
            <Input.TextArea rows={3} placeholder="请输入商品描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
