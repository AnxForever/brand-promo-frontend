import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import AuthGuard from '../components/AuthGuard';
import LoginPage from '../pages/Login';
import DashboardPage from '../pages/Dashboard';
import ProductsPage from '../pages/Products';
import ProductDetailPage from '../pages/ProductDetail';
import AdsPage from '../pages/Ads';
import BrandsPage from '../pages/Brands';
import UsersPage from '../pages/Users';
import CartPage from '../pages/Cart';
import CheckoutPage from '../pages/Checkout';
import OrdersPage from '../pages/Orders';
import OrderDetailPage from '../pages/OrderDetail';
import CouponsPage from '../pages/Coupons';

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
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'brands', element: <BrandsPage /> },
      { path: 'ads', element: <AdsPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'orders/:id', element: <OrderDetailPage /> },
      { path: 'coupons', element: <CouponsPage /> },
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
