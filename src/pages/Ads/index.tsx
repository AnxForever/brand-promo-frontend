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
  message,
  Tag,
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
  const [form] = Form.useForm();

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

  useEffect(() => { fetchData(); }, []);

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
    message.success('Status updated');
    fetchData();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      startTime: values.startTime?.format('YYYY-MM-DD HH:mm:ss'),
      endTime: values.endTime?.format('YYYY-MM-DD HH:mm:ss'),
    };

    if (editingId) {
      await adApi.update(editingId, payload);
      message.success('Updated');
    } else {
      await adApi.create(payload);
      message.success('Created');
    }
    setModalOpen(false);
    fetchData();
  };

  const statusMap: Record<number, { text: string; color: string }> = {
    0: { text: 'Pending', color: 'orange' },
    1: { text: 'Active', color: 'green' },
    2: { text: 'Offline', color: 'default' },
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: 'Title', dataIndex: 'title' },
    { title: 'Position', dataIndex: 'position' },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (v: number) => {
        const s = statusMap[v] || { text: 'Unknown', color: 'default' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    { title: 'Start', dataIndex: 'startTime' },
    { title: 'End', dataIndex: 'endTime' },
    {
      title: 'Actions',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(record)}>Edit</Button>
          {record.status === 0 && (
            <Button size="small" type="primary" onClick={() => handleStatusChange(record.id, 1)}>
              Approve
            </Button>
          )}
          {record.status === 1 && (
            <Button size="small" onClick={() => handleStatusChange(record.id, 2)}>
              Offline
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Advertisement
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
        title={editingId ? 'Edit Ad' : 'Create Ad'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="position" label="Position">
            <Select
              options={[
                { value: 'banner', label: 'Banner' },
                { value: 'sidebar', label: 'Sidebar' },
                { value: 'popup', label: 'Popup' },
              ]}
            />
          </Form.Item>
          <Form.Item name="imageUrl" label="Image URL">
            <Input />
          </Form.Item>
          <Form.Item name="linkUrl" label="Link URL">
            <Input />
          </Form.Item>
          <Form.Item name="startTime" label="Start Time">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="endTime" label="End Time">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
