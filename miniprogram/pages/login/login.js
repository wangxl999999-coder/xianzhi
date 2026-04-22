const app = getApp();

Page({
  data: {
    username: '',
    password: '',
    canLogin: false,
    isLoggedIn: false,
    redirect: ''
  },

  onLoad(options) {
    if (options.redirect) {
      this.setData({
        redirect: decodeURIComponent(options.redirect)
      });
    }

    this.setData({
      isLoggedIn: app.globalData.isLoggedIn
    });
  },

  onShow() {
    this.setData({
      isLoggedIn: app.globalData.isLoggedIn
    });
  },

  checkCanLogin() {
    const { username, password } = this.data;
    const canLogin = username.trim().length > 0 && password.length >= 6;
    this.setData({ canLogin });
  },

  onUsernameInput(e) {
    this.setData({
      username: e.detail.value
    }, () => {
      this.checkCanLogin();
    });
  },

  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    }, () => {
      this.checkCanLogin();
    });
  },

  async handleLogin() {
    if (!this.data.canLogin) {
      wx.showToast({
        title: '请输入正确的用户名和密码',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '登录中...'
    });

    try {
      await app.login(this.data.username, this.data.password);

      wx.hideLoading();

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });

      setTimeout(() => {
        if (this.data.redirect) {
          wx.redirectTo({
            url: this.data.redirect
          });
        } else {
          wx.switchTab({
            url: '/pages/mine/mine'
          });
        }
      }, 1500);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({
        title: err.message || '登录失败',
        icon: 'error'
      });
    }
  },

  goToRegister() {
    wx.navigateTo({
      url: '/pages/register/register'
    });
  },

  goToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  handleLogout() {
    app.logout();
    this.setData({
      isLoggedIn: false,
      username: '',
      password: '',
      canLogin: false
    });
  }
});
