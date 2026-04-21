const app = getApp();

Page({
  data: {
    items: [],
    currentStatus: '',
    loading: true,
    page: 1,
    pageSize: 10,
    hasMore: true,
    defaultImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=placeholder%20image%20secondhand%20item&image_size=square'
  },

  onLoad() {
    this.loadItems();
  },

  onShow() {
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

  async loadItems() {
    if (!this.data.hasMore) return;

    this.setData({ loading: true });

    try {
      const params = {
        page: this.data.page,
        pageSize: this.data.pageSize
      };

      if (this.data.currentStatus) {
        params.status = this.data.currentStatus;
      }

      const res = await app.request({
        url: '/users/my-items',
        method: 'GET',
        data: params,
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
      console.error('加载我的发布失败:', err);
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

  onStatusChange(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({
      currentStatus: status,
      page: 1,
      items: [],
      hasMore: true
    });
    this.loadItems();
  },

  async toggleStatus(e) {
    const { id, status, action } = e.currentTarget.dataset;

    wx.showModal({
      title: '提示',
      content: `确定要${action}该商品吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await app.request({
              url: `/items/${id}`,
              method: 'PUT',
              data: {
                status: parseInt(status)
              },
              needAuth: true
            });

            wx.showToast({
              title: `${action}成功`,
              icon: 'success'
            });

            this.setData({
              page: 1,
              items: [],
              hasMore: true
            });
            this.loadItems();
          } catch (err) {
            console.error('更新状态失败:', err);
            wx.showToast({
              title: err.message || '操作失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  async markSold(e) {
    const { id } = e.currentTarget.dataset;

    wx.showModal({
      title: '提示',
      content: '确定要标记为已售出吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await app.request({
              url: `/items/${id}`,
              method: 'PUT',
              data: {
                status: 2
              },
              needAuth: true
            });

            wx.showToast({
              title: '标记成功',
              icon: 'success'
            });

            this.setData({
              page: 1,
              items: [],
              hasMore: true
            });
            this.loadItems();
          } catch (err) {
            console.error('标记售出失败:', err);
            wx.showToast({
              title: err.message || '操作失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  async deleteItem(e) {
    const { id } = e.currentTarget.dataset;

    wx.showModal({
      title: '提示',
      content: '确定要删除该商品吗？删除后无法恢复',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...'
          });

          try {
            await app.request({
              url: `/items/${id}`,
              method: 'DELETE',
              needAuth: true
            });

            wx.hideLoading();
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });

            this.setData({
              page: 1,
              items: [],
              hasMore: true
            });
            this.loadItems();
          } catch (err) {
            wx.hideLoading();
            console.error('删除失败:', err);
            wx.showToast({
              title: err.message || '删除失败',
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

  goToPublish() {
    wx.switchTab({
      url: '/pages/publish/publish'
    });
  },

  getStatusText(status) {
    switch (status) {
      case 1: return '在售';
      case 2: return '已售出';
      case 3: return '已下架';
      default: return '未知';
    }
  },

  getStatusClass(status) {
    switch (status) {
      case 1: return 'sale';
      case 2: return 'sold';
      case 3: return 'offline';
      default: return '';
    }
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
