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
          colorPrimary: '#e53935',
          colorBgContainer: '#ffffff',
          colorBgLayout: '#f5f5f5',
          colorBorder: '#000000',
          colorText: '#111111',
          colorTextSecondary: '#555555',
          borderRadius: 0,
          fontFamily:
            "'Helvetica Neue', Helvetica, Arial, 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
        },
        components: {
          Button: {
            borderRadius: 0,
            controlHeight: 38,
            primaryShadow: 'none',
          },
          Input: {
            borderRadius: 0,
            controlHeight: 38,
            activeShadow: 'none',
          },
          Select: {
            borderRadius: 0,
            controlHeight: 38,
          },
          Card: {
            borderRadiusLG: 0,
          },
          Table: {
            borderRadius: 0,
            headerBg: '#fafafa',
            rowHoverBg: '#fafafa',
          },
          Modal: {
            borderRadiusLG: 0,
          },
          InputNumber: {
            borderRadius: 0,
          },
          DatePicker: {
            borderRadius: 0,
          },
          Pagination: {
            borderRadius: 0,
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
