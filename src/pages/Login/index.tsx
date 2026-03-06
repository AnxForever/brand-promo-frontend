import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authApi } from '../../api';
import { useAuthStore } from '../../store/authStore';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const { message } = App.useApp();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authApi.login(values);
      if (res.success) {
        login(res.data);
        message.success('登录成功');
        navigate('/dashboard');
      } else {
        message.error(res.message || '登录失败');
      }
    } catch {
      message.error('登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white text-lg font-bold mb-4">
              BP
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              品牌推广管理系统
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              请登录您的账号
            </p>
          </div>

          <Form onFinish={onFinish} size="large" layout="vertical">
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined className="text-slate-400" />}
                placeholder="用户名"
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-slate-400" />}
                placeholder="密码"
              />
            </Form.Item>
            <Form.Item className="mb-2">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="h-10 font-medium"
              >
                登 录
              </Button>
            </Form.Item>
          </Form>

          <p className="text-xs text-slate-400 text-center mt-4">
            默认账号: admin / admin123
          </p>
        </div>
      </div>
    </div>
  );
}
