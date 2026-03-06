import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import router from './router';

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#2563eb',
          colorBgContainer: '#ffffff',
          colorBgLayout: '#f8fafc',
          colorBorder: '#e5e7eb',
          colorText: '#0f172a',
          colorTextSecondary: '#64748b',
          borderRadius: 8,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
        },
        components: {
          Button: {
            borderRadius: 8,
            controlHeight: 38,
          },
          Input: {
            borderRadius: 8,
            controlHeight: 38,
          },
          Select: {
            borderRadius: 8,
            controlHeight: 38,
          },
          Card: {
            borderRadiusLG: 12,
          },
          Table: {
            borderRadius: 12,
            headerBg: '#f8fafc',
            rowHoverBg: '#f8fafc',
          },
          Modal: {
            borderRadiusLG: 12,
          },
        },
      }}
    >
      <AntApp>
        <RouterProvider router={router} />
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
