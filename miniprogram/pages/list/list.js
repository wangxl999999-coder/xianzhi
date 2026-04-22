const app = getApp();

Page({
  data: {
    keyword: '',
    sortBy: 'newest',
    categories: [],
    currentCategoryId: '',
    currentCategoryName: '',
    showCategoryFilter: false,
    currentCondition: '',
    showConditionFilter: false,
    minPrice: '',
    maxPrice: '',
    showPriceFilter: false,
    items: [],
    loading: true,
    page: 1,
    pageSize: 10,
    hasMore: true,
    defaultImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=placeholder%20image%20secondhand%20item&image_size=square'
  },

  onLoad(options) {
    if (options.categoryId) {
      this.setData({
        currentCategoryId: options.categoryId,
        currentCategoryName: decodeURIComponent(options.categoryName || '')
      });
    }
    this.loadCategories();
    this.loadItems();
  },

  checkPendingCategory() {
    const pendingCategory = app.globalData.pendingCategory;
    if (pendingCategory) {
      this.setData({
        currentCategoryId: pendingCategory.id,
        currentCategoryName: pendingCategory.name || '',
        page: 1,
        items: [],
        hasMore: true
      });
      app.globalData.pendingCategory = null;
      this.loadItems();
    }
  },

  onShow() {
    this.checkPendingCategory();
    this.setData({
      page: 1,
      items: [],
      hasMore: true
    });
    this.loadItems();
  },

  onPullDownRefresh() {
    this.setData({
      page: 1,
      items: [],
      hasMore: true
    });
    this.loadItems().then(() => {
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

  async loadCategories() {
    try {
      const res = await app.request({
        url: '/categories',
        method: 'GET'
      });
      this.setData({
        categories: res.data || []
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
      const params = {
        page: this.data.page,
        pageSize: this.data.pageSize,
        sortBy: this.data.sortBy,
        latitude: location.latitude,
        longitude: location.longitude
      };

      if (this.data.keyword) {
        params.keyword = this.data.keyword;
      }
      if (this.data.currentCategoryId) {
        params.categoryId = this.data.currentCategoryId;
      }
      if (this.data.currentCondition) {
        params.condition = this.data.currentCondition;
      }
      if (this.data.minPrice !== '') {
        params.minPrice = this.data.minPrice;
      }
      if (this.data.maxPrice !== '') {
        params.maxPrice = this.data.maxPrice;
      }

      const res = await app.request({
        url: '/items',
        method: 'GET',
        data: params
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

  onKeywordInput(e) {
    this.setData({
      keyword: e.detail.value
    });
  },

  clearKeyword() {
    this.setData({
      keyword: '',
      page: 1,
      items: [],
      hasMore: true
    });
    this.loadItems();
  },

  onSearch() {
    this.setData({
      page: 1,
      items: [],
      hasMore: true
    });
    this.loadItems();
  },

  onSortChange(e) {
    const sort = e.currentTarget.dataset.sort;
    this.setData({
      sortBy: sort,
      page: 1,
      items: [],
      hasMore: true
    });
    this.loadItems();
  },

  toggleCategoryFilter() {
    if (!this.data.showCategoryFilter) {
      this.setData({
        tempCategoryId: this.data.currentCategoryId,
        tempCategoryName: this.data.currentCategoryName
      });
    }
    this.setData({
      showCategoryFilter: !this.data.showCategoryFilter,
      showConditionFilter: false,
      showPriceFilter: false
    });
  },

  onCategorySelect(e) {
    const { id, name } = e.currentTarget.dataset;
    this.setData({
      tempCategoryId: id,
      tempCategoryName: name || '全部分类'
    });
  },

  confirmCategoryFilter() {
    const tempCategoryId = this.data.tempCategoryId !== undefined ? this.data.tempCategoryId : this.data.currentCategoryId;
    const tempCategoryName = this.data.tempCategoryName !== undefined ? this.data.tempCategoryName : this.data.currentCategoryName;

    this.setData({
      currentCategoryId: tempCategoryId,
      currentCategoryName: tempCategoryId === '' ? '' : tempCategoryName,
      showCategoryFilter: false,
      page: 1,
      items: [],
      hasMore: true
    });
    this.loadItems();
  },

  toggleConditionFilter() {
    if (!this.data.showConditionFilter) {
      this.setData({
        tempCondition: this.data.currentCondition
      });
    }
    this.setData({
      showConditionFilter: !this.data.showConditionFilter,
      showCategoryFilter: false,
      showPriceFilter: false
    });
  },

  onConditionSelect(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({
      tempCondition: value
    });
  },

  confirmConditionFilter() {
    const tempCondition = this.data.tempCondition !== undefined ? this.data.tempCondition : this.data.currentCondition;

    this.setData({
      currentCondition: tempCondition,
      showConditionFilter: false,
      page: 1,
      items: [],
      hasMore: true
    });
    this.loadItems();
  },

  showPriceFilterPopup() {
    this.setData({
      showPriceFilter: true,
      showCategoryFilter: false,
      showConditionFilter: false,
      tempMinPrice: this.data.minPrice,
      tempMaxPrice: this.data.maxPrice
    });
  },

  hidePriceFilterPopup() {
    this.setData({
      showPriceFilter: false
    });
  },

  onMinPriceInput(e) {
    this.setData({
      tempMinPrice: e.detail.value
    });
  },

  onMaxPriceInput(e) {
    this.setData({
      tempMaxPrice: e.detail.value
    });
  },

  onPriceQuickSelect(e) {
    const { min, max } = e.currentTarget.dataset;
    this.setData({
      tempMinPrice: min,
      tempMaxPrice: max
    });
  },

  resetPriceFilter() {
    this.setData({
      tempMinPrice: '',
      tempMaxPrice: ''
    });
  },

  confirmPriceFilter() {
    this.setData({
      minPrice: this.data.tempMinPrice !== undefined ? this.data.tempMinPrice : this.data.minPrice,
      maxPrice: this.data.tempMaxPrice !== undefined ? this.data.tempMaxPrice : this.data.maxPrice,
      showPriceFilter: false,
      page: 1,
      items: [],
      hasMore: true
    });
    this.loadItems();
  },

  goToDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  }
});
