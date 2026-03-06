import { useEffect, useState } from 'react';
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

export default function ProductsPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const fetchData = async (p = page, kw = keyword) => {
    setLoading(true);
    try {
      const res = await productApi.list({
        page: p,
        size: 10,
        keyword: kw || undefined,
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
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchData(1, keyword);
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
    { title: '商品名称', dataIndex: 'name', ellipsis: true },
    { title: '分类', dataIndex: 'category', width: 120 },
    {
      title: '价格',
      dataIndex: 'price',
      width: 100,
      render: (v: number) => (v != null ? `¥${v.toFixed(2)}` : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: number) => (
        <Tag
          color={v === 1 ? 'success' : 'error'}
          className="rounded-md"
        >
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
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          商品管理
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          className="font-medium"
        >
          新增商品
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <Space>
            <Input
              placeholder="搜索商品..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              className="w-64"
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
              options={[
                { value: 'Electronics', label: '电子产品' },
                { value: 'Fashion', label: '时尚服饰' },
                { value: 'Food', label: '食品' },
                { value: 'Sports', label: '运动户外' },
              ]}
            />
          </Form.Item>
          <Form.Item name="price" label="价格">
            <InputNumber
              min={0}
              precision={2}
              placeholder="0.00"
              className="w-full"
            />
          </Form.Item>
          <Form.Item name="description" label="商品描述">
            <Input.TextArea rows={3} placeholder="请输入商品描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
