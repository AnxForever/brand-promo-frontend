import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Tag,
  App,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { adApi } from '../../api';
import dayjs from 'dayjs';

export default function AdsPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const fetchData = async (p = page) => {
    setLoading(true);
    try {
      const res = await adApi.list({ page: p, size: 10 });
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

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      startTime: record.startTime ? dayjs(record.startTime) : null,
      endTime: record.endTime ? dayjs(record.endTime) : null,
    });
    setModalOpen(true);
  };

  const handleStatusChange = async (id: number, status: number) => {
    await adApi.updateStatus(id, status);
    message.success('状态已更新');
    fetchData();
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      const payload = {
        ...values,
        startTime: values.startTime?.format('YYYY-MM-DD HH:mm:ss'),
        endTime: values.endTime?.format('YYYY-MM-DD HH:mm:ss'),
      };

      if (editingId) {
        await adApi.update(editingId, payload);
        message.success('更新成功');
      } else {
        await adApi.create(payload);
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

  const statusMap: Record<number, { text: string; color: string }> = {
    0: { text: '待审核', color: 'warning' },
    1: { text: '投放中', color: 'success' },
    2: { text: '已下线', color: 'default' },
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '广告标题', dataIndex: 'title', ellipsis: true },
    {
      title: '位置',
      dataIndex: 'position',
      width: 100,
      render: (v: string) => (
        <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 border border-black capitalize">
          {v}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: number) => {
        const s = statusMap[v] || { text: '未知', color: 'default' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '投放时段',
      width: 200,
      render: (_: any, record: any) => (
        <span className="text-xs text-gray-600">
          {record.startTime
            ? `${dayjs(record.startTime).format('MM/DD')} - ${dayjs(record.endTime).format('MM/DD')}`
            : '-'}
        </span>
      ),
    },
    {
      title: '操作',
      width: 200,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          {record.status === 0 && (
            <Button
              size="small"
              type="primary"
              onClick={() => handleStatusChange(record.id, 1)}
            >
              通过
            </Button>
          )}
          {record.status === 1 && (
            <Button
              size="small"
              danger
              onClick={() => handleStatusChange(record.id, 2)}
            >
              下线
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-black">
          广告管理
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          className="font-bold"
        >
          新增广告
        </Button>
      </div>

      <div className="bg-white border border-black p-6">
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
        title={editingId ? '编辑广告' : '新增广告'}
        open={modalOpen}
        onOk={handleSubmit}
        confirmLoading={submitting}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="title"
            label="广告标题"
            rules={[{ required: true, message: '请输入广告标题' }]}
          >
            <Input placeholder="请输入广告标题" />
          </Form.Item>
          <Form.Item name="position" label="投放位置">
            <Select
              placeholder="请选择投放位置"
              options={[
                { value: 'banner', label: '横幅 (Banner)' },
                { value: 'sidebar', label: '侧边栏 (Sidebar)' },
                { value: 'popup', label: '弹窗 (Popup)' },
              ]}
            />
          </Form.Item>
          <Form.Item name="imageUrl" label="广告图片">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="linkUrl" label="跳转链接">
            <Input placeholder="https://..." />
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
