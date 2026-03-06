import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Popconfirm,
  App,
} from 'antd';
import { PlusOutlined, TagOutlined } from '@ant-design/icons';
import { brandApi } from '../../api';

export default function BrandsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await brandApi.list();
      if (res.success) {
        setData(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    await brandApi.delete(id);
    message.success('删除成功');
    fetchData();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingId) {
      await brandApi.update(editingId, values);
      message.success('更新成功');
    } else {
      await brandApi.create(values);
      message.success('创建成功');
    }
    setModalOpen(false);
    fetchData();
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: '品牌',
      dataIndex: 'name',
      render: (name: string) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
            {name?.charAt(0)}
          </div>
          <span className="font-medium text-slate-900">{name}</span>
        </div>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
      render: (v: string) => (
        <span className="text-slate-500">{v || '-'}</span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 120,
      render: (v: string) => (
        <span className="text-xs text-slate-400">
          {v ? new Date(v).toLocaleDateString() : '-'}
        </span>
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
            title="确认删除该品牌？"
            description="该品牌下的商品将失去品牌关联。"
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
          品牌管理
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          className="font-medium"
        >
          新增品牌
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <TagOutlined className="text-blue-600" />
            <span>{editingId ? '编辑品牌' : '新增品牌'}</span>
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
            label="品牌名称"
            rules={[{ required: true, message: '请输入品牌名称' }]}
          >
            <Input placeholder="例如：Apple" />
          </Form.Item>
          <Form.Item name="logoUrl" label="Logo 地址">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="description" label="品牌描述">
            <Input.TextArea rows={3} placeholder="简要描述该品牌" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
