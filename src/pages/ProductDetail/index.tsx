import { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
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
  HeartFilled,
  HeartOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { browseHistoryApi, cartApi, favoriteApi, productApi, reviewApi } from '../../api';
import { useAuthStore } from '../../store/authStore';

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  basePrice?: number;
  promoPrice?: number;
  promoStartTime?: string;
  promoEndTime?: string;
  promoStatus?: number;
  promoActive?: number;
  category?: string;
  brandId?: number;
  brandName?: string;
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

function formatDateTime(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return String(date.getMonth() + 1).padStart(2, '0') + '/'
    + String(date.getDate()).padStart(2, '0') + ' '
    + String(date.getHours()).padStart(2, '0') + ':'
    + String(date.getMinutes()).padStart(2, '0');
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addingCart, setAddingCart] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [favoriting, setFavoriting] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [reviewForm] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isStorefrontRoute = location.pathname.startsWith('/store');
  const currentRoute = `${location.pathname}${location.search}`;
  const productDetailLocationState = location.state as { from?: string } | null;
  const fallbackReturnPath = isStorefrontRoute ? '/store' : '/products';
  const returnPath =
    productDetailLocationState?.from?.startsWith('/')
      ? productDetailLocationState.from
      : fallbackReturnPath;

  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const tasks = isLoggedIn
          ? [
              productApi.detail(Number(id)),
              reviewApi.listByProduct(Number(id)),
              favoriteApi.check(Number(id)),
            ]
          : [
              productApi.detail(Number(id)),
              reviewApi.listByProduct(Number(id)),
            ];
        const results = await Promise.allSettled(tasks);
        const [prodRes, reviewRes, favoriteRes] = results;
        if (prodRes.status === 'fulfilled' && prodRes.value.success) {
          setProduct(prodRes.value.data);
        }
        if (reviewRes.status === 'fulfilled' && reviewRes.value.success) {
          const list = reviewRes.value.data?.list ?? reviewRes.value.data ?? [];
          setReviews(list);
        }
        if (isLoggedIn && favoriteRes && favoriteRes.status === 'fulfilled' && favoriteRes.value.success) {
          setFavorited(!!favoriteRes.value.data?.favorited);
        } else {
          setFavorited(false);
        }
        if (isLoggedIn) {
          browseHistoryApi.record(Number(id)).catch(() => {});
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, isLoggedIn]);

  const handleAddToCart = async () => {
    if (!product) return;
    if (!isLoggedIn) {
      navigate('/login', { state: { from: currentRoute } });
      return;
    }
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

  const handleBuyNow = async () => {
    if (!product) return;
    if (!isLoggedIn) {
      navigate('/login', { state: { from: currentRoute } });
      return;
    }
    setAddingCart(true);
    try {
      await cartApi.add({ productId: product.id, quantity });
      const cartRes = await cartApi.list();
      if (!cartRes.success) {
        throw new Error('购物车读取失败');
      }
      const cartItems = cartRes.data ?? [];
      const target = cartItems.find((item: { productId: number }) => item.productId === product.id);
      if (!target) {
        throw new Error('未找到待结算商品');
      }
      await Promise.all(
        cartItems.map((item: { id: number; productId: number }) =>
          cartApi.updateChecked(item.id, item.productId === product.id ? 1 : 0),
        ),
      );
      navigate(isStorefrontRoute ? '/store/checkout' : '/checkout');
    } catch {
      message.error('立即购买失败');
    } finally {
      setAddingCart(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!product) return;
    if (!isLoggedIn) {
      navigate('/login', { state: { from: currentRoute } });
      return;
    }
    setFavoriting(true);
    try {
      if (favorited) {
        await favoriteApi.remove(product.id);
        setFavorited(false);
        message.success('已取消收藏');
      } else {
        await favoriteApi.add(product.id);
        setFavorited(true);
        message.success('收藏成功');
      }
    } catch {
      message.error(favorited ? '取消收藏失败' : '收藏失败');
    } finally {
      setFavoriting(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!id) return;
    if (!isLoggedIn) {
      navigate('/login', { state: { from: currentRoute } });
      return;
    }
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
  const displayOriginalPrice = product?.promoActive === 1 ? product.basePrice : product?.originalPrice;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(returnPath)}
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
                    {product.promoActive === 1 && (
                      <Tag color="volcano">限时折扣</Tag>
                    )}
                    <Tag color={product.status === 1 ? 'success' : 'error'}>
                      {product.status === 1 ? '在售' : '已下架'}
                    </Tag>
                  </div>

                  <div className="mt-4">
                    <span className="text-3xl font-bold text-red-600">
                      ¥{product.price?.toFixed(2)}
                    </span>
                    {displayOriginalPrice && displayOriginalPrice > product.price && (
                      <span className="text-sm text-gray-500 line-through ml-2">
                        ¥{displayOriginalPrice.toFixed(2)}
                      </span>
                    )}
                    {product.stock !== undefined && (
                      <span className="text-xs text-gray-500 ml-4">
                        库存 {product.stock}
                      </span>
                    )}
                  </div>

                  {product.promoStatus === 1 && product.promoStartTime && product.promoEndTime && (
                    <div className="mt-4 p-3 border border-red-200 bg-red-50 text-sm">
                      <div className="font-bold text-red-600">限时折扣活动</div>
                      <div className="text-gray-600 mt-1">
                        活动时间：{formatDateTime(product.promoStartTime)} - {formatDateTime(product.promoEndTime)}
                      </div>
                    </div>
                  )}

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
                    <div className="mt-4 flex flex-col md:flex-row gap-3">
                      <Button
                        size="large"
                        icon={favorited ? <HeartFilled /> : <HeartOutlined />}
                        className="font-bold w-full md:w-auto px-8"
                        loading={favoriting}
                        danger={favorited}
                        onClick={handleToggleFavorite}
                      >
                        {favorited ? '已收藏' : '收藏商品'}
                      </Button>
                      <Button
                        type="primary"
                        size="large"
                        icon={<ShoppingCartOutlined />}
                        className="font-bold w-full md:w-auto px-12"
                        loading={addingCart}
                        onClick={handleAddToCart}
                        disabled={product.status !== 1}
                      >
                        加入购物车
                      </Button>
                      <Button
                        size="large"
                        type="primary"
                        ghost
                        className="font-bold w-full md:w-auto px-10"
                        loading={addingCart}
                        onClick={handleBuyNow}
                      >
                        立即购买
                      </Button>
                    </div>
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
                <Button onClick={() => (isLoggedIn ? setReviewModalOpen(true) : navigate('/login', { state: { from: currentRoute } }))}>
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
