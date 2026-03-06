import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Spin } from 'antd';
import { ShoppingOutlined, UserOutlined, NotificationOutlined } from '@ant-design/icons';
import { statsApi } from '../../api';

interface OverviewData {
  userCount: number;
  productCount: number;
  adCount: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsApi.overview().then((res) => {
      if (res.success) setData(res.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <h2>Dashboard</h2>
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Users"
              value={data?.userCount ?? 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Products"
              value={data?.productCount ?? 0}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Ads"
              value={data?.adCount ?? 0}
              prefix={<NotificationOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
