const app = getApp();

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    defaultAvatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=default%20user%20avatar%20simple%20friendly&image_size=square'
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    this.checkLoginStatus();
    if (app.globalData.isLoggedIn) {
      this.loadUserInfo();
    }
  },

  checkLoginStatus() {
    this.setData({
      isLoggedIn: app.globalData.isLoggedIn,
      userInfo: app.globalData.userInfo
    });
  },

  async loadUserInfo() {
    try {
      const res = await app.request({
        url: '/users/info',
        method: 'GET',
        needAuth: true
      });

      app.globalData.userInfo = res.data;
      wx.setStorageSync('userInfo', res.data);

      this.setData({
        userInfo: res.data
      });
    } catch (err) {
      console.error('加载用户信息失败:', err);
    }
  },

  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  goToUserCenter() {
    wx.showToast({
      title: '个人中心功能开发中',
      icon: 'none'
    });
  },

  goToPublish() {
    wx.switchTab({
      url: '/pages/publish/publish'
    });
  },

  goToMyItems() {
    if (!this.data.isLoggedIn) {
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

    wx.navigateTo({
      url: '/pages/my-items/my-items'
    });
  },

  goToMyFavorites() {
    if (!this.data.isLoggedIn) {
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

    wx.navigateTo({
      url: '/pages/my-favorites/my-favorites'
    });
  },

  goToAbout() {
    wx.navigateTo({
      url: '/pages/about/about'
    });
  },

  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout();
          this.setData({
            isLoggedIn: false,
            userInfo: null
          });
        }
      }
    });
  }
});
