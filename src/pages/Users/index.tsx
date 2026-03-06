import { UserOutlined } from '@ant-design/icons';

export default function UsersPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mb-6">
        用户管理
      </h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center text-2xl mx-auto mb-4">
          <UserOutlined />
        </div>
        <p className="text-slate-500">用户管理功能开发中</p>
      </div>
    </div>
  );
}
