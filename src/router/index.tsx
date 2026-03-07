import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import AppLayout from '../components/AppLayout';
import AuthGuard from '../components/AuthGuard';

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

const router = createBrowserRouter([
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
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: lazily(() => import('../pages/Dashboard')) },
      { path: 'products', element: lazily(() => import('../pages/Products')) },
      { path: 'products/:id', element: lazily(() => import('../pages/ProductDetail')) },
      { path: 'categories', element: lazily(() => import('../pages/Categories')) },
      { path: 'brands', element: lazily(() => import('../pages/Brands')) },
      { path: 'ads', element: lazily(() => import('../pages/Ads')) },
      { path: 'cart', element: lazily(() => import('../pages/Cart')) },
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
