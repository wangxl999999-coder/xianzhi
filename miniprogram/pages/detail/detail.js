const app = getApp();

Page({
  data: {
    itemId: '',
    item: {},
    isFavorite: false,
    otherItems: [],
    currentUserId: null,
    defaultImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=placeholder%20image%20secondhand%20item&image_size=square',
    defaultAvatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=default%20user%20avatar%20simple%20friendly&image_size=square'
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        itemId: options.id
      });
      this.loadItemDetail();
    }

    if (app.globalData.isLoggedIn) {
      this.setData({
        currentUserId: app.globalData.userInfo.id
      });
    }
  },

  onShow() {
    if (app.globalData.isLoggedIn) {
      this.setData({
        currentUserId: app.globalData.userInfo.id
      });
    }
  },

  async loadItemDetail() {
    try {
      wx.showLoading({
        title: '加载中...'
      });

      const location = app.globalData.location;
      const res = await app.request({
        url: `/items/${this.data.itemId}`,
        method: 'GET',
        data: {
          latitude: location.latitude,
          longitude: location.longitude
        },
        needAuth: app.globalData.isLoggedIn
      });

      this.setData({
        item: res.data,
        isFavorite: res.data.isFavorite || false,
        otherItems: res.data.otherItems || []
      });

      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      console.error('加载详情失败:', err);
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'error'
      });
    }
  },

  async toggleFavorite() {
    if (!app.globalData.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }
        }
      });
      return;
    }

    try {
      const res = await app.request({
        url: '/favorites/toggle',
        method: 'POST',
        data: {
          itemId: this.data.itemId
        },
        needAuth: true
      });

      this.setData({
        isFavorite: res.data.isFavorite
      });

      wx.showToast({
        title: res.data.isFavorite ? '收藏成功' : '已取消收藏',
        icon: 'success'
      });
    } catch (err) {
      console.error('收藏操作失败:', err);
      wx.showToast({
        title: err.message || '操作失败',
        icon: 'error'
      });
    }
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    const images = this.data.item.images || [];

    wx.previewImage({
      current: url,
      urls: images
    });
  },

  makePhoneCall(e) {
    const phone = e.currentTarget.dataset.phone;
    if (!phone) {
      wx.showToast({
        title: '卖家未留下电话',
        icon: 'none'
      });
      return;
    }

    wx.makePhoneCall({
      phoneNumber: phone,
      fail: (err) => {
        console.error('拨打电话失败:', err);
      }
    });
  },

  copyWechat(e) {
    const wechat = e.currentTarget.dataset.wechat;
    if (!wechat) {
      return;
    }

    wx.setClipboardData({
      data: wechat,
      success: () => {
        wx.showToast({
          title: '已复制微信号',
          icon: 'success'
        });
      }
    });
  },

  contactSeller() {
    if (!app.globalData.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }
        }
      });
      return;
    }

    wx.showToast({
      title: '私信功能开发中',
      icon: 'none'
    });
  },

  goToPublisherItems(e) {
    const id = e.currentTarget.dataset.id;
    wx.showToast({
      title: '查看卖家主页功能开发中',
      icon: 'none'
    });
  },

  goToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  goToList() {
    wx.switchTab({
      url: '/pages/list/list'
    });
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.redirectTo({
      url: `/pages/detail/detail?id=${id}`
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
      return this.formatDate(time);
    }
  },

  formatDate(time) {
    if (!time) return '';
    const date = new Date(time);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  }
});
