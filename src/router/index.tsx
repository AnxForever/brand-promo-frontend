import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import AppLayout from '../components/AppLayout';
import AuthGuard from '../components/AuthGuard';
import { useAuthStore } from '../store/authStore';

const PageLoader = (
  <div className="flex items-center justify-center h-64">
    <Spin size="large" />
  </div>
);

function lazily(factory: () => Promise<{ default: React.ComponentType }>) {
  const Component = lazy(factory);
  return (
    <Suspense fallback={PageLoader}>
      <Component />
    </Suspense>
  );
}

function HomeRedirect() {
  const role = useAuthStore((state) => state.user?.role);
  return <Navigate to={role === 'ADMIN' ? '/dashboard' : '/store'} replace />;
}

const router = createBrowserRouter([
  {
    path: '/store',
    element: lazily(() => import('../pages/Products/Storefront')),
  },
  {
    path: '/store/products/:id',
    element: lazily(() => import('../pages/ProductDetail')),
  },
  {
    path: '/store/cart',
    element: (
      <AuthGuard>
        {lazily(() => import('../pages/Cart'))}
      </AuthGuard>
    ),
  },
  {
    path: '/store/favorites',
    element: (
      <AuthGuard>
        {lazily(() => import('../pages/Favorites'))}
      </AuthGuard>
    ),
  },
  {
    path: '/store/checkout',
    element: (
      <AuthGuard>
        {lazily(() => import('../pages/Checkout'))}
      </AuthGuard>
    ),
  },
  {
    path: '/store/orders',
    element: (
      <AuthGuard>
        {lazily(() => import('../pages/Orders'))}
      </AuthGuard>
    ),
  },
  {
    path: '/store/orders/:id',
    element: (
      <AuthGuard>
        {lazily(() => import('../pages/OrderDetail'))}
      </AuthGuard>
    ),
  },
  {
    path: '/login',
    element: lazily(() => import('../pages/Login')),
  },
  {
    path: '/403',
    element: lazily(() => import('../pages/Status/403')),
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <HomeRedirect /> },
      { path: 'dashboard', element: lazily(() => import('../pages/Dashboard')) },
      { path: 'products', element: lazily(() => import('../pages/Products')) },
      { path: 'products/:id', element: lazily(() => import('../pages/ProductDetail')) },
      {
        path: 'categories',
        element: (
          <AuthGuard roles={['ADMIN']}>
            {lazily(() => import('../pages/Categories'))}
          </AuthGuard>
        ),
      },
      {
        path: 'brands',
        element: (
          <AuthGuard roles={['ADMIN']}>
            {lazily(() => import('../pages/Brands'))}
          </AuthGuard>
        ),
      },
      {
        path: 'ads',
        element: (
          <AuthGuard roles={['ADMIN']}>
            {lazily(() => import('../pages/Ads'))}
          </AuthGuard>
        ),
      },
      { path: 'cart', element: lazily(() => import('../pages/Cart')) },
      { path: 'favorites', element: lazily(() => import('../pages/Favorites')) },
      { path: 'checkout', element: lazily(() => import('../pages/Checkout')) },
      { path: 'orders', element: lazily(() => import('../pages/Orders')) },
      { path: 'orders/:id', element: lazily(() => import('../pages/OrderDetail')) },
      { path: 'coupons', element: lazily(() => import('../pages/Coupons')) },
      {
        path: 'users',
        element: (
          <AuthGuard roles={['ADMIN']}>
            {lazily(() => import('../pages/Users'))}
          </AuthGuard>
        ),
      },
      { path: '*', element: lazily(() => import('../pages/Status/404')) },
    ],
  },
  {
    path: '*',
    element: lazily(() => import('../pages/Status/404')),
  },
]);

export default router;
