const app = getApp();

Page({
  data: {
    banners: [],
    categories: [],
    items: [],
    loading: true,
    page: 1,
    pageSize: 10,
    hasMore: true,
    defaultCategoryIcon: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=shopping%20bag%20simple%20icon%20red%20color&image_size=square',
    defaultImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=placeholder%20image%20secondhand%20item&image_size=square'
  },

  onLoad() {
    this.loadBanners();
    this.loadCategories();
    this.loadItems();
  },

  onShow() {
    this.loadItems();
  },

  onPullDownRefresh() {
    this.setData({
      page: 1,
      items: [],
      hasMore: true
    });
    Promise.all([
      this.loadBanners(),
      this.loadCategories(),
      this.loadItems()
    ]).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.setData({
        page: this.data.page + 1
      });
      this.loadItems();
    }
  },

  async loadBanners() {
    try {
      const res = await app.request({
        url: '/banners',
        method: 'GET'
      });
      this.setData({
        banners: res.data || []
      });
    } catch (err) {
      console.error('加载轮播图失败:', err);
    }
  },

  async loadCategories() {
    try {
      const res = await app.request({
        url: '/categories',
        method: 'GET'
      });
      this.setData({
        categories: (res.data || []).slice(0, 10)
      });
    } catch (err) {
      console.error('加载分类失败:', err);
    }
  },

  async loadItems() {
    if (!this.data.hasMore) return;

    this.setData({ loading: true });

    try {
      const location = app.globalData.location;
      const res = await app.request({
        url: '/items',
        method: 'GET',
        data: {
          page: this.data.page,
          pageSize: this.data.pageSize,
          latitude: location.latitude,
          longitude: location.longitude
        }
      });

      const newItems = res.data.list || [];
      const allItems = this.data.page === 1 ? newItems : [...this.data.items, ...newItems];
      const hasMore = newItems.length === this.data.pageSize;

      this.setData({
        items: allItems,
        hasMore: hasMore,
        loading: false
      });
    } catch (err) {
      console.error('加载闲置品失败:', err);
      this.setData({ loading: false });
    }
  },

  goToSearch() {
    wx.navigateTo({
      url: '/pages/list/list'
    });
  },

  goToList() {
    wx.switchTab({
      url: '/pages/list/list'
    });
  },

  goToCategory(e) {
    const { id, name } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/list/list?categoryId=${id}&categoryName=${encodeURIComponent(name)}`
    });
  },

  goToDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  }
});
