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
  message,
  Popconfirm,
  Tag,
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

  const fetchData = async (p = page, kw = keyword) => {
    setLoading(true);
    try {
      const res = await productApi.list({ page: p, size: 10, keyword: kw || undefined });
      if (res.success) {
        setData(res.data.list);
        setTotal(res.data.total);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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
    message.success('Deleted');
    fetchData();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingId) {
      await productApi.update(editingId, values);
      message.success('Updated');
    } else {
      await productApi.create(values);
      message.success('Created');
    }
    setModalOpen(false);
    fetchData();
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: 'Name', dataIndex: 'name' },
    { title: 'Category', dataIndex: 'category' },
    {
      title: 'Price',
      dataIndex: 'price',
      render: (v: number) => v != null ? `$${v.toFixed(2)}` : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (v: number) => (
        <Tag color={v === 1 ? 'green' : 'red'}>{v === 1 ? 'On Shelf' : 'Off Shelf'}</Tag>
      ),
    },
    {
      title: 'Actions',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(record)}>Edit</Button>
          <Popconfirm title="Delete this product?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="Search products..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 250 }}
          />
          <Button icon={<SearchOutlined />} onClick={handleSearch}>Search</Button>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Product
        </Button>
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
          onChange: (p) => { setPage(p); fetchData(p); },
        }}
      />

      <Modal
        title={editingId ? 'Edit Product' : 'Add Product'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="Category">
            <Select
              allowClear
              options={[
                { value: 'Electronics', label: 'Electronics' },
                { value: 'Fashion', label: 'Fashion' },
                { value: 'Food', label: 'Food' },
                { value: 'Sports', label: 'Sports' },
              ]}
            />
          </Form.Item>
          <Form.Item name="price" label="Price">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
