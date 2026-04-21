const app = getApp();

Page({
  data: {
    items: [],
    loading: true,
    page: 1,
    pageSize: 10,
    hasMore: true,
    defaultImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=placeholder%20image%20secondhand%20item&image_size=square'
  },

  onLoad() {
    this.loadFavorites();
  },

  onShow() {
    this.setData({
      page: 1,
      items: [],
      hasMore: true
    });
    this.loadFavorites();
  },

  onPullDownRefresh() {
    this.setData({
      page: 1,
      items: [],
      hasMore: true
    });
    this.loadFavorites().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.setData({
        page: this.data.page + 1
      });
      this.loadFavorites();
    }
  },

  async loadFavorites() {
    if (!this.data.hasMore) return;

    this.setData({ loading: true });

    try {
      const location = app.globalData.location;
      const res = await app.request({
        url: '/favorites/my',
        method: 'GET',
        data: {
          page: this.data.page,
          pageSize: this.data.pageSize,
          latitude: location.latitude,
          longitude: location.longitude
        },
        needAuth: true
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
      console.error('加载我的收藏失败:', err);
      this.setData({ loading: false });

      if (err.code === 401) {
        wx.showModal({
          title: '提示',
          content: '请先登录',
          showCancel: false,
          success: () => {
            wx.redirectTo({
              url: '/pages/login/login'
            });
          }
        });
      }
    }
  },

  async cancelFavorite(e) {
    const { id, index } = e.currentTarget.dataset;

    wx.showModal({
      title: '提示',
      content: '确定要取消收藏吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await app.request({
              url: '/favorites/toggle',
              method: 'POST',
              data: {
                itemId: id
              },
              needAuth: true
            });

            wx.showToast({
              title: '已取消收藏',
              icon: 'success'
            });

            const items = [...this.data.items];
            items.splice(index, 1);
            this.setData({ items });
          } catch (err) {
            console.error('取消收藏失败:', err);
            wx.showToast({
              title: err.message || '操作失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  goToDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  goToList() {
    wx.switchTab({
      url: '/pages/list/list'
    });
  },

  formatTime(time) {
    if (!time) return '';
    const date = new Date(time);
    const now = new Date();
    const diff = now - date;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const month = 30 * day;

    if (diff < minute) {
      return '刚刚';
    } else if (diff < hour) {
      return `${Math.floor(diff / minute)}分钟前`;
    } else if (diff < day) {
      return `${Math.floor(diff / hour)}小时前`;
    } else if (diff < month) {
      return `${Math.floor(diff / day)}天前`;
    } else {
      const year = date.getFullYear();
      const m = date.getMonth() + 1;
      const d = date.getDate();
      return `${year}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    }
  }
});
