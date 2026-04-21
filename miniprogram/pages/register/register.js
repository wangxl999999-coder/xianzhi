const app = getApp();

Page({
  data: {
    username: '',
    nickname: '',
    password: '',
    confirmPassword: '',
    phone: '',
    wechat: '',
    passwordStrength: 0,
    passwordsMatch: false,
    canRegister: false
  },

  onLoad() {

  },

  checkCanRegister() {
    const { username, password, confirmPassword } = this.data;
    const usernameValid = username.trim().length >= 2 && username.trim().length <= 50;
    const passwordValid = password.length >= 6 && password.length <= 20;
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

    const canRegister = usernameValid && passwordValid && passwordsMatch;

    this.setData({
      passwordStrength: passwordValid ? 1 : 0,
      passwordsMatch: passwordsMatch,
      canRegister: canRegister
    });
  },

  onUsernameInput(e) {
    this.setData({
      username: e.detail.value
    }, () => {
      this.checkCanRegister();
    });
  },

  onNicknameInput(e) {
    this.setData({
      nickname: e.detail.value
    });
  },

  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    }, () => {
      this.checkCanRegister();
    });
  },

  onConfirmPasswordInput(e) {
    this.setData({
      confirmPassword: e.detail.value
    }, () => {
      this.checkCanRegister();
    });
  },

  onPhoneInput(e) {
    this.setData({
      phone: e.detail.value
    });
  },

  onWechatInput(e) {
    this.setData({
      wechat: e.detail.value
    });
  },

  async handleRegister() {
    if (!this.data.canRegister) {
      if (this.data.username.trim().length < 2 || this.data.username.trim().length > 50) {
        wx.showToast({
          title: '用户名长度需在2-50个字符之间',
          icon: 'none'
        });
        return;
      }
      if (this.data.password.length < 6 || this.data.password.length > 20) {
        wx.showToast({
          title: '密码长度需在6-20个字符之间',
          icon: 'none'
        });
        return;
      }
      if (this.data.password !== this.data.confirmPassword) {
        wx.showToast({
          title: '两次输入的密码不一致',
          icon: 'none'
        });
        return;
      }
      return;
    }

    wx.showLoading({
      title: '注册中...'
    });

    try {
      await app.register(
        this.data.username,
        this.data.password,
        this.data.nickname || this.data.username,
        this.data.phone,
        this.data.wechat
      );

      wx.hideLoading();

      wx.showModal({
        title: '注册成功',
        content: '恭喜您注册成功，请登录',
        showCancel: false,
        success: () => {
          wx.redirectTo({
            url: '/pages/login/login'
          });
        }
      });
    } catch (err) {
      wx.hideLoading();
      wx.showToast({
        title: err.message || '注册失败',
        icon: 'error'
      });
    }
  },

  goToLogin() {
    wx.navigateBack();
  }
});
