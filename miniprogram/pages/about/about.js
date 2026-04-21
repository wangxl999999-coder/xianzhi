const app = getApp();

Page({
  data: {

  },

  onLoad() {

  },

  copyWechat() {
    wx.setClipboardData({
      data: 'xianzhi_community',
      success: () => {
        wx.showToast({
          title: '已复制微信号',
          icon: 'success'
        });
      }
    });
  },

  makePhoneCall() {
    wx.makePhoneCall({
      phoneNumber: '4001234567',
      fail: (err) => {
        console.error('拨打电话失败:', err);
      }
    });
  }
});
