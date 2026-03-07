import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-black mb-4">404</h1>
        <p className="text-lg text-gray-600 mb-8">
          页面不存在或已被移除
        </p>
        <Button type="primary" onClick={() => navigate('/dashboard')}>
          返回首页
        </Button>
      </div>
    </div>
  );
}
