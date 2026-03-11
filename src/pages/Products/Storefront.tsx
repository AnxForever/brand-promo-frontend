import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  App,
  Button,
  Empty,
  Input,
  Pagination,
  Select,
  Spin,
  Tag,
} from 'antd';
import {
  EyeOutlined,
  FireOutlined,
  HeartFilled,
  HeartOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { cartApi, favoriteApi, productApi, recommendApi } from '../../api';

interface StorefrontProduct {
  id: number;
  name: string;
  price: number;
  basePrice?: number;
  originalPrice?: number;
  promoActive?: number;
  promoStatus?: number;
  category?: string;
  brandName?: string;
  status: number;
  stock?: number;
  imageUrl?: string;
  description?: string;
  salesCount?: number;
  viewCount?: number;
}

const PAGE_SIZE = 12;

const sortOptions = [
  { value: 'newest', label: '最新上架' },
  { value: 'sales', label: '销量优先' },
  { value: 'price_asc', label: '价格升序' },
  { value: 'price_desc', label: '价格降序' },
];

export default function StorefrontProductsPage() {
  const [items, setItems] = useState<StorefrontProduct[]>([]);
  const [recommendations, setRecommendations] = useState<StorefrontProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [draftKeyword, setDraftKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState('newest');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { message } = App.useApp();

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const activePromoCount = useMemo(
    () => items.filter((item) => item.promoActive === 1).length,
    [items],
  );
  const inStockCount = useMemo(
    () => items.filter((item) => (item.stock ?? 0) > 0 && item.status === 1).length,
    [items],
  );

  const fetchProducts = async (
    nextPage = page,
    nextKeyword = keyword,
    nextCategory = categoryFilter,
    nextSort = sortBy,
  ) => {
    setLoading(true);
    try {
      const res = await productApi.list({
        page: nextPage,
        size: PAGE_SIZE,
        keyword: nextKeyword || undefined,
        category: nextCategory || undefined,
        sort: nextSort || undefined,
      });
      if (res.success) {
        setItems(res.data?.list ?? []);
        setTotal(res.data?.total ?? 0);
      } else {
        setItems([]);
        setTotal(0);
      }
    } catch {
      setItems([]);
      setTotal(0);
      message.error('商品列表加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1, '', undefined, 'newest');
    Promise.allSettled([
      productApi.categories(),
      recommendApi.list(),
      favoriteApi.list(),
    ]).then(([categoryRes, recommendRes, favoriteRes]) => {
      if (categoryRes.status === 'fulfilled' && categoryRes.value.success) {
        setCategories(categoryRes.value.data ?? []);
      }
      if (recommendRes.status === 'fulfilled' && recommendRes.value.success) {
        setRecommendations(recommendRes.value.data ?? []);
      }
      if (favoriteRes.status === 'fulfilled' && favoriteRes.value.success) {
        setFavoriteIds((favoriteRes.value.data ?? []).map((item: StorefrontProduct) => item.id));
      }
    });
  }, []);

  const handleSearch = () => {
    const nextKeyword = draftKeyword.trim();
    setPage(1);
    setKeyword(nextKeyword);
    fetchProducts(1, nextKeyword, categoryFilter, sortBy);
  };

  const handleReset = () => {
    setDraftKeyword('');
    setKeyword('');
    setCategoryFilter(undefined);
    setSortBy('newest');
    setPage(1);
    fetchProducts(1, '', undefined, 'newest');
  };

  const handleCategoryChange = (value: string | undefined) => {
    setCategoryFilter(value);
    setPage(1);
    fetchProducts(1, keyword, value, sortBy);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setPage(1);
    fetchProducts(1, keyword, categoryFilter, value);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    fetchProducts(nextPage, keyword, categoryFilter, sortBy);
  };

  const handleAddToCart = async (productId: number) => {
    setProcessingId(productId);
    try {
      await cartApi.add({ productId, quantity: 1 });
      message.success('已加入购物车');
    } catch {
      message.error('加入购物车失败');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleFavorite = async (productId: number) => {
    setProcessingId(productId);
    try {
      if (favoriteIdSet.has(productId)) {
        await favoriteApi.remove(productId);
        setFavoriteIds((current) => current.filter((id) => id !== productId));
        message.success('已取消收藏');
      } else {
        await favoriteApi.add(productId);
        setFavoriteIds((current) => [...current, productId]);
        message.success('收藏成功');
      }
    } catch {
      message.error(favoriteIdSet.has(productId) ? '取消收藏失败' : '收藏失败');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden border border-black bg-white">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            backgroundImage:
              'linear-gradient(135deg, rgba(229,57,53,0.12) 0%, rgba(229,57,53,0.02) 35%, rgba(0,0,0,0.04) 100%), linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)',
            backgroundSize: 'auto, 28px 28px, 28px 28px',
          }}
        />
        <div className="relative grid gap-8 lg:grid-cols-[1.45fr_0.95fr] p-6 md:p-8">
          <div>
            <Tag color="red" className="mb-4">Storefront</Tag>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-black leading-none">
              商品商城
            </h1>
            <p className="mt-4 max-w-2xl text-sm md:text-base text-gray-700 leading-7">
              从商品搜索、限时折扣到收藏、加购、下单，这里把现有商品相关能力串成了完整前台入口。
            </p>

            <div className="grid gap-3 sm:grid-cols-3 mt-6">
              <div className="border border-black bg-white/80 p-4">
                <div className="text-xs text-gray-500">当前列表</div>
                <div className="text-2xl font-bold text-black mt-1">{items.length}</div>
                <div className="text-xs text-gray-500 mt-1">本页可浏览商品</div>
              </div>
              <div className="border border-black bg-white/80 p-4">
                <div className="text-xs text-gray-500">活动商品</div>
                <div className="text-2xl font-bold text-red-600 mt-1">{activePromoCount}</div>
                <div className="text-xs text-gray-500 mt-1">限时折扣进行中</div>
              </div>
              <div className="border border-black bg-white/80 p-4">
                <div className="text-xs text-gray-500">可下单</div>
                <div className="text-2xl font-bold text-black mt-1">{inStockCount}</div>
                <div className="text-xs text-gray-500 mt-1">库存充足商品</div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_160px_auto_auto]">
              <Input
                value={draftKeyword}
                onChange={(e) => setDraftKeyword(e.target.value)}
                onPressEnter={handleSearch}
                placeholder="搜索商品名称或描述"
                prefix={<SearchOutlined className="text-gray-400" />}
              />
              <Select
                allowClear
                value={categoryFilter}
                placeholder="全部分类"
                onChange={handleCategoryChange}
                options={categories.map((item) => ({ value: item, label: item }))}
              />
              <Select
                value={sortBy}
                onChange={handleSortChange}
                options={sortOptions}
              />
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </div>

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  size="small"
                  type={categoryFilter == null ? 'primary' : 'default'}
                  onClick={() => handleCategoryChange(undefined)}
                >
                  全部
                </Button>
                {categories.slice(0, 8).map((item) => (
                  <Button
                    key={item}
                    size="small"
                    type={categoryFilter === item ? 'primary' : 'default'}
                    onClick={() => handleCategoryChange(item)}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="border border-black bg-black text-white p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-red-300">
                <FireOutlined />
                Today Picks
              </div>
              <h2 className="mt-3 text-2xl font-bold leading-tight">
                推荐商品和高转化入口已经接到前台。
              </h2>
              <p className="mt-3 text-sm text-gray-300 leading-7">
                用户现在可以从商品页直接完成浏览、收藏、加购和跳转详情，不再只能看到后台管理表格。
              </p>
            </div>

            <div className="grid gap-3 mt-6">
              {recommendations.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  className="text-left border border-white/30 p-4 hover:bg-white hover:text-black transition-colors duration-150"
                  onClick={() => navigate(`/products/${item.id}`)}
                >
                  <div className="text-xs text-red-300 mb-1">{item.category || '推荐商品'}</div>
                  <div className="font-bold">{item.name}</div>
                  <div className="mt-2 text-sm">¥{item.price?.toFixed(2)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {recommendations.length > 0 && (
        <section className="bg-white border border-black p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-black">今日推荐</h2>
              <p className="text-sm text-gray-500 mt-1">基于销量和热度的精选商品</p>
            </div>
            <Button type="text" onClick={() => navigate('/dashboard')}>
              查看更多推荐
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {recommendations.slice(0, 4).map((item) => (
              <button
                key={item.id}
                className="border border-black p-4 text-left hover:bg-gray-50 transition-colors duration-150"
                onClick={() => navigate(`/products/${item.id}`)}
              >
                <div className="flex items-center justify-between gap-2">
                  <Tag color={item.promoActive === 1 ? 'volcano' : 'default'}>
                    {item.promoActive === 1 ? '活动中' : '推荐'}
                  </Tag>
                  <span className="text-xs text-gray-500">
                    {item.salesCount ?? 0} 销量
                  </span>
                </div>
                <div className="mt-3 font-bold text-black line-clamp-2 min-h-[48px]">
                  {item.name}
                </div>
                <div className="mt-4 text-xl font-bold text-red-600">
                  ¥{item.price?.toFixed(2)}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="bg-white border border-black p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-black">全部商品</h2>
            <p className="text-sm text-gray-500 mt-1">
              共 {total} 件商品
              {keyword && <span>，当前关键词“{keyword}”</span>}
              {categoryFilter && <span>，分类 {categoryFilter}</span>}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            已收藏 <span className="font-bold text-black">{favoriteIds.length}</span> 件
          </div>
        </div>

        <Spin spinning={loading}>
          {items.length > 0 ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                {items.map((item) => {
                  const busy = processingId === item.id;
                  const favorited = favoriteIdSet.has(item.id);
                  const available = item.status === 1 && (item.stock ?? 0) > 0;
                  const priceToStrike =
                    item.promoActive === 1 && item.basePrice && item.basePrice > item.price
                      ? item.basePrice
                      : item.originalPrice;

                  return (
                    <div key={item.id} className="group border border-black overflow-hidden bg-white">
                      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[linear-gradient(135deg,#f1f1f1_0%,#e5e5e5_100%)]">
                            <ShoppingCartOutlined className="text-5xl text-gray-400" />
                          </div>
                        )}

                        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                          {item.category && <Tag>{item.category}</Tag>}
                          {item.promoActive === 1 && <Tag color="volcano">限时折扣</Tag>}
                          <Tag color={available ? 'success' : 'default'}>
                            {available ? '可下单' : '暂不可下单'}
                          </Tag>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="text-xs text-gray-500">
                            {item.brandName || '品牌待补充'}
                          </div>
                          <div className="text-xs text-gray-500">
                            浏览 {item.viewCount ?? 0}
                          </div>
                        </div>

                        <h3 className="text-lg font-bold text-black line-clamp-2 min-h-[56px]">
                          {item.name}
                        </h3>

                        <p className="mt-2 text-sm text-gray-600 line-clamp-2 min-h-[44px]">
                          {item.description || '暂无商品描述，点击详情查看完整信息。'}
                        </p>

                        <div className="mt-4 flex items-end justify-between gap-4">
                          <div>
                            <div className="text-2xl font-bold text-red-600">
                              ¥{item.price?.toFixed(2)}
                            </div>
                            {priceToStrike && priceToStrike > item.price && (
                              <div className="text-xs text-gray-500 line-through mt-1">
                                ¥{priceToStrike.toFixed(2)}
                              </div>
                            )}
                          </div>
                          <div className="text-right text-xs text-gray-500">
                            <div>库存 {item.stock ?? 0}</div>
                            <div>销量 {item.salesCount ?? 0}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-5">
                          <Button
                            icon={<EyeOutlined />}
                            onClick={() => navigate(`/products/${item.id}`)}
                          >
                            详情
                          </Button>
                          <Button
                            type="primary"
                            icon={<ShoppingCartOutlined />}
                            loading={busy}
                            disabled={!available}
                            onClick={() => handleAddToCart(item.id)}
                          >
                            加购
                          </Button>
                          <Button
                            icon={favorited ? <HeartFilled /> : <HeartOutlined />}
                            danger={favorited}
                            loading={busy}
                            onClick={() => handleToggleFavorite(item.id)}
                          >
                            {favorited ? '已藏' : '收藏'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center mt-8">
                <Pagination
                  current={page}
                  total={total}
                  pageSize={PAGE_SIZE}
                  showSizeChanger={false}
                  onChange={handlePageChange}
                  showTotal={(count) => `共 ${count} 条`}
                />
              </div>
            </>
          ) : (
            <div className="py-16">
              <Empty
                description="没有找到匹配的商品"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" onClick={handleReset}>
                  清空筛选
                </Button>
              </Empty>
            </div>
          )}
        </Spin>
      </section>
    </div>
  );
}
