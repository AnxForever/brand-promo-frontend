import { UserOutlined } from '@ant-design/icons';

export default function UsersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-black mb-6">
        用户管理
      </h1>
      <div className="bg-white border border-black p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 text-gray-500 flex items-center justify-center text-2xl mx-auto mb-4">
          <UserOutlined />
        </div>
        <p className="text-gray-600">用户管理功能开发中</p>
      </div>
    </div>
  );
}
