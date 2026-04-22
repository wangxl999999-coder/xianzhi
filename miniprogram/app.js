App({
  globalData: {
    userInfo: null,
    token: null,
    isLoggedIn: false,
    baseUrl: 'http://localhost:3000/api',
    location: {
      latitude: 39.9042,
      longitude: 116.4074
    },
    pendingCategory: null
  },

  onLaunch() {
    this.checkLoginStatus();
    this.getLocation();
  },

  checkLoginStatus() {
    try {
      const token = wx.getStorageSync('token');
      const userInfo = wx.getStorageSync('userInfo');
      if (token && userInfo) {
        this.globalData.token = token;
        this.globalData.userInfo = userInfo;
        this.globalData.isLoggedIn = true;
      }
    } catch (e) {
      console.error('读取登录状态失败:', e);
    }
  },

  getLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.globalData.location = {
          latitude: res.latitude,
          longitude: res.longitude
        };
      },
      fail: (err) => {
        console.warn('获取位置失败:', err);
      }
    });
  },

  login(username, password) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.globalData.baseUrl}/users/login`,
        method: 'POST',
        data: { username, password },
        success: (res) => {
          if (res.data.code === 200) {
            const { token, userInfo } = res.data.data;
            this.globalData.token = token;
            this.globalData.userInfo = userInfo;
            this.globalData.isLoggedIn = true;
            wx.setStorageSync('token', token);
            wx.setStorageSync('userInfo', userInfo);
            resolve(res.data);
          } else {
            reject(res.data);
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  register(username, password, nickname, phone, wechat) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.globalData.baseUrl}/users/register`,
        method: 'POST',
        data: { username, password, nickname, phone, wechat },
        success: (res) => {
          if (res.data.code === 200) {
            resolve(res.data);
          } else {
            reject(res.data);
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  logout() {
    this.globalData.token = null;
    this.globalData.userInfo = null;
    this.globalData.isLoggedIn = false;
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    wx.showToast({
      title: '已退出登录',
      icon: 'success'
    });
  },

  request(options) {
    const { url, method = 'GET', data = {}, needAuth = false } = options;
    const header = {
      'Content-Type': 'application/json'
    };

    if (needAuth && this.globalData.token) {
      header['Authorization'] = `Bearer ${this.globalData.token}`;
    }

    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.globalData.baseUrl}${url}`,
        method,
        data,
        header,
        success: (res) => {
          if (res.data.code === 200) {
            resolve(res.data);
          } else if (res.data.code === 401) {
            if (needAuth) {
              this.logout();
              wx.showModal({
                title: '提示',
                content: '登录已过期，请重新登录',
                showCancel: false,
                success: () => {
                  wx.redirectTo({
                    url: '/pages/login/login'
                  });
                }
              });
            }
            reject(res.data);
          } else {
            reject(res.data);
          }
        },
        fail: (err) => {
          console.error('网络请求失败:', err);
          wx.showToast({
            title: '网络错误',
            icon: 'error'
          });
          reject(err);
        }
      });
    });
  },

  uploadFile(filePath) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${this.globalData.baseUrl}/upload/image`,
        filePath: filePath,
        name: 'image',
        header: {
          'Authorization': `Bearer ${this.globalData.token}`
        },
        success: (res) => {
          const data = JSON.parse(res.data);
          if (data.code === 200) {
            resolve(data);
          } else {
            reject(data);
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  }
});
