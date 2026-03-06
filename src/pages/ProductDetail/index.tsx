import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  InputNumber,
  Rate,
  Spin,
  Tag,
  Divider,
  List,
  Progress,
  Form,
  Input,
  Modal,
  App,
} from 'antd';
import {
  ArrowLeftOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { productApi, cartApi, reviewApi, browseHistoryApi } from '../../api';

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  category?: string;
  brandId?: number;
  status: number;
  stock?: number;
  salesCount?: number;
  viewCount?: number;
  imageUrl?: string;
  images?: string | string[];
  specs?: string | Record<string, string>;
}

interface Review {
  id: number;
  username: string;
  rating: number;
  content: string;
  createdAt: string;
}

function parseImages(product: Product): string[] {
  if (Array.isArray(product.images)) return product.images;
  if (typeof product.images === 'string' && product.images.startsWith('[')) {
    try { return JSON.parse(product.images); } catch { /* ignore */ }
  }
  return product.imageUrl ? [product.imageUrl] : [];
}

function parseSpecs(product: Product): Record<string, string> {
  if (typeof product.specs === 'object' && product.specs !== null && !Array.isArray(product.specs)) {
    return product.specs as Record<string, string>;
  }
  if (typeof product.specs === 'string' && product.specs.startsWith('{')) {
    try { return JSON.parse(product.specs); } catch { /* ignore */ }
  }
  return {};
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addingCart, setAddingCart] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [reviewForm] = Form.useForm();
  const navigate = useNavigate();
  const { message } = App.useApp();

  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const [prodRes, reviewRes] = await Promise.allSettled([
          productApi.detail(Number(id)),
          reviewApi.listByProduct(Number(id)),
        ]);
        if (prodRes.status === 'fulfilled' && prodRes.value.success) {
          setProduct(prodRes.value.data);
        }
        if (reviewRes.status === 'fulfilled' && reviewRes.value.success) {
          const list = reviewRes.value.data?.list ?? reviewRes.value.data ?? [];
          setReviews(list);
        }
        browseHistoryApi.record(Number(id)).catch(() => {});
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingCart(true);
    try {
      await cartApi.add({ productId: product.id, quantity });
      message.success('已加入购物车');
    } catch {
      message.error('加入购物车失败');
    } finally {
      setAddingCart(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!id) return;
    const values = await reviewForm.validateFields();
    try {
      await reviewApi.create(Number(id), {
        rating: values.rating,
        content: values.content,
      });
      message.success('评价提交成功');
      setReviewModalOpen(false);
      reviewForm.resetFields();
      const res = await reviewApi.listByProduct(Number(id));
      if (res.success) {
        setReviews(res.data?.list ?? res.data ?? []);
      }
    } catch {
      message.error('评价提交失败');
    }
  };

  const ratingDist = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    return { star, count, pct: reviews.length ? (count / reviews.length) * 100 : 0 };
  });
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  const images = product ? parseImages(product) : [];
  const specs = product ? parseSpecs(product) : {};

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/products')}
        />
        <h1 className="text-2xl font-bold tracking-tight text-black">
          商品详情
        </h1>
      </div>

      <Spin spinning={loading}>
        {product && (
          <div className="space-y-6">
            {/* Top Section: Image + Info */}
            <div className="bg-white border border-black p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Image Gallery */}
                <div>
                  <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden mb-3">
                    {images.length > 0 ? (
                      <img
                        src={images[currentImage]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingCartOutlined className="text-6xl text-gray-400" />
                    )}
                  </div>
                  {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          className={`w-16 h-16 overflow-hidden border-2 shrink-0 transition-opacity duration-150 ${
                            idx === currentImage
                              ? 'border-red-600'
                              : 'border-transparent hover:border-gray-400'
                          }`}
                          onClick={() => setCurrentImage(idx)}
                        >
                          <img
                            src={img}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex flex-col">
                  <h2 className="text-xl font-bold text-black">
                    {product.name}
                  </h2>

                  <div className="flex items-center gap-2 mt-2">
                    {product.category && (
                      <Tag>{product.category}</Tag>
                    )}
                    {product.brandName && (
                      <Tag color="red">{product.brandName}</Tag>
                    )}
                    <Tag color={product.status === 1 ? 'success' : 'error'}>
                      {product.status === 1 ? '在售' : '已下架'}
                    </Tag>
                  </div>

                  <div className="mt-4">
                    <span className="text-3xl font-bold text-red-600">
                      ¥{product.price?.toFixed(2)}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-sm text-gray-500 line-through ml-2">
                        ¥{product.originalPrice.toFixed(2)}
                      </span>
                    )}
                    {product.stock !== undefined && (
                      <span className="text-xs text-gray-500 ml-4">
                        库存 {product.stock}
                      </span>
                    )}
                  </div>

                  {product.description && (
                    <p className="text-sm text-gray-600 mt-4 leading-relaxed">
                      {product.description}
                    </p>
                  )}

                  {/* Specs */}
                  {Object.keys(specs).length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-700 mb-2">
                        商品参数
                      </h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        {Object.entries(specs).map(([k, v]) => (
                          <div key={k} className="flex">
                            <span className="text-gray-500 w-20 shrink-0">
                              {k}
                            </span>
                            <span className="text-gray-700">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pt-6">
                    <Divider className="my-4" />
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">数量</span>
                      <InputNumber
                        min={1}
                        max={99}
                        value={quantity}
                        onChange={(v) => setQuantity(v ?? 1)}
                      />
                    </div>
                    <Button
                      type="primary"
                      size="large"
                      icon={<ShoppingCartOutlined />}
                      className="mt-4 font-bold w-full md:w-auto px-12"
                      loading={addingCart}
                      onClick={handleAddToCart}
                      disabled={product.status !== 1}
                    >
                      加入购物车
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white border border-black p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-black">
                  用户评价（{reviews.length}）
                </h2>
                <Button onClick={() => setReviewModalOpen(true)}>
                  写评价
                </Button>
              </div>

              {/* Rating Summary */}
              {reviews.length > 0 && (
                <div className="flex gap-8 mb-6 p-4 bg-gray-50 border border-gray-300">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-black">
                      {avgRating.toFixed(1)}
                    </div>
                    <Rate disabled allowHalf value={avgRating} className="text-sm" />
                    <div className="text-xs text-gray-500 mt-1">
                      {reviews.length} 条评价
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    {ratingDist.map((d) => (
                      <div key={d.star} className="flex items-center gap-2 text-sm">
                        <span className="w-8 text-gray-600 text-right">
                          {d.star}星
                        </span>
                        <Progress
                          percent={d.pct}
                          showInfo={false}
                          strokeColor="#e53935"
                          className="flex-1 m-0"
                        />
                        <span className="w-8 text-xs text-gray-500">
                          {d.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review List */}
              <List
                dataSource={reviews}
                locale={{ emptyText: '暂无评价' }}
                renderItem={(item) => (
                  <List.Item className="px-0">
                    <div className="w-full">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 bg-red-50 text-red-600 flex items-center justify-center">
                          <UserOutlined className="text-xs" />
                        </div>
                        <span className="text-sm font-bold text-gray-700">
                          {item.username}
                        </span>
                        <Rate
                          disabled
                          value={item.rating}
                          className="text-xs"
                        />
                        <span className="text-xs text-gray-500 ml-auto">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString()
                            : ''}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 ml-9">
                        {item.content}
                      </p>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          </div>
        )}
      </Spin>

      {/* Review Modal */}
      <Modal
        title="写评价"
        open={reviewModalOpen}
        onOk={handleSubmitReview}
        onCancel={() => setReviewModalOpen(false)}
        destroyOnHidden
      >
        <Form form={reviewForm} layout="vertical" className="mt-4">
          <Form.Item
            name="rating"
            label="评分"
            rules={[{ required: true, message: '请选择评分' }]}
          >
            <Rate />
          </Form.Item>
          <Form.Item
            name="content"
            label="评价内容"
            rules={[{ required: true, message: '请输入评价内容' }]}
          >
            <Input.TextArea rows={4} placeholder="分享您的使用感受..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
