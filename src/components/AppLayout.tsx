import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  GiftOutlined,
  NotificationOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TagOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/products', icon: <ShoppingOutlined />, label: '商品管理' },
  { key: '/categories', icon: <AppstoreOutlined />, label: '分类管理' },
  { key: '/brands', icon: <TagOutlined />, label: '品牌管理' },
  { key: '/ads', icon: <NotificationOutlined />, label: '广告管理' },
  { key: '/cart', icon: <ShoppingCartOutlined />, label: '购物车' },
  { key: '/orders', icon: <FileTextOutlined />, label: '订单管理' },
  { key: '/coupons', icon: <GiftOutlined />, label: '优惠券管理' },
  { key: '/users', icon: <UserOutlined />, label: '用户管理' },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const selectedKey = '/' + location.pathname.split('/')[1];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const dropdownItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        className="border-r-2 border-black"
        style={{ background: '#fff' }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b-2 border-black px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
              BP
            </div>
            {!collapsed && (
              <span className="text-base font-bold tracking-tight text-black whitespace-nowrap">
                品牌推广系统
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          className="border-none mt-2 font-sans"
          style={{ background: 'transparent' }}
        />
      </Sider>

      <Layout>
        {/* Header */}
        <Header
          className="flex items-center justify-between px-6 border-b-2 border-black"
          style={{ background: '#fff', height: 64, lineHeight: '64px', padding: '0 24px' }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="text-black"
          />
          <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
            <div className="flex items-center gap-2 cursor-pointer px-2 py-1 hover:bg-gray-100 transition-opacity duration-150">
              <Avatar
                size={32}
                icon={<UserOutlined />}
                className="bg-red-600"
                style={{ borderRadius: 0 }}
              />
              <div className="hidden sm:block">
                <span className="text-sm font-bold text-black">{user?.username}</span>
                <span className="text-xs text-gray-600 ml-1.5 bg-gray-100 border border-black px-1.5 py-0.5">
                  {user?.role}
                </span>
              </div>
            </div>
          </Dropdown>
        </Header>

        {/* Content */}
        <Content className="p-6">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
