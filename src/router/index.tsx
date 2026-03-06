import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import AuthGuard from '../components/AuthGuard';
import LoginPage from '../pages/Login';
import DashboardPage from '../pages/Dashboard';
import ProductsPage from '../pages/Products';
import AdsPage from '../pages/Ads';
import UsersPage from '../pages/Users';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
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
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'ads', element: <AdsPage /> },
      {
        path: 'users',
        element: (
          <AuthGuard roles={['ADMIN']}>
            <UsersPage />
          </AuthGuard>
        ),
      },
    ],
  },
]);

export default router;
