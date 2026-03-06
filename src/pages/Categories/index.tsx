import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Popconfirm,
  Tag,
  App,
} from 'antd';
import { PlusOutlined, AppstoreOutlined } from '@ant-design/icons';
import { categoryApi } from '../../api';

interface Category {
  id: number;
  name: string;
  parentId: number;
  sortOrder: number;
  icon?: string;
  status: number;
  children?: Category[];
}

export default function CategoriesPage() {
  const [data, setData] = useState<Category[]>([]);
  const [flatList, setFlatList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [treeRes, listRes] = await Promise.all([
        categoryApi.tree(),
        categoryApi.list(),
      ]);
      if (treeRes.success) setData(treeRes.data ?? []);
      if (listRes.success) setFlatList(listRes.data ?? []);
    } catch {
      setData([]);
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

  const handleEdit = (record: Category) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await categoryApi.delete(id);
      message.success('删除成功');
      fetchData();
    } catch {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editingId) {
        await categoryApi.update(editingId, values);
        message.success('更新成功');
      } else {
        await categoryApi.create(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchData();
    } catch {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '分类名称',
      dataIndex: 'name',
      render: (v: string) => (
        <div className="flex items-center gap-2">
          <AppstoreOutlined className="text-red-600" />
          <span className="font-bold text-black">{v}</span>
        </div>
      ),
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: number) => (
        <Tag color={v === 1 ? 'success' : 'error'}>
          {v === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      width: 160,
      render: (_: any, record: Category) => (
        <Space size="small">
          <Button size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除该分类？子分类也会一并删除"
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

  const parentOptions = [
    { value: 0, label: '顶级分类' },
    ...flatList
      .filter((c) => (c.parentId ?? 0) === 0)
      .map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-black">
          分类管理
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          className="font-bold"
        >
          新增分类
        </Button>
      </div>

      <div className="bg-white border border-black p-6">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={false}
          expandable={{ childrenColumnName: 'children' }}
        />
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <AppstoreOutlined className="text-red-600" />
            <span>{editingId ? '编辑分类' : '新增分类'}</span>
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
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="例如：手机数码" />
          </Form.Item>
          <Form.Item name="parentId" label="父分类" initialValue={0}>
            <Select options={parentOptions} />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="sortOrder" label="排序" initialValue={0}>
              <InputNumber min={0} className="w-full" />
            </Form.Item>
            <Form.Item name="status" label="状态" initialValue={1}>
              <Select
                options={[
                  { value: 1, label: '启用' },
                  { value: 0, label: '禁用' },
                ]}
              />
            </Form.Item>
          </div>
          <Form.Item name="icon" label="图标（可选）">
            <Input placeholder="例如：laptop" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
