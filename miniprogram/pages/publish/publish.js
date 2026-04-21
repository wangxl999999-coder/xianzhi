const app = getApp();

Page({
  data: {
    images: [],
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    condition: '',
    conditionList: ['全新', '几乎全新', '轻微使用', '明显使用'],
    categoryId: '',
    categoryName: '',
    categories: [],
    showCategory: false,
    pickupMethod: '',
    pickupList: ['自提', '邮寄', '均可'],
    address: '',
    latitude: null,
    longitude: null,
    phone: '',
    wechat: '',
    canSubmit: false
  },

  onLoad() {
    this.loadCategories();
    this.checkLogin();
  },

  onShow() {
    this.checkLogin();
  },

  checkLogin() {
    if (!app.globalData.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再发布',
        showCancel: false,
        success: () => {
          wx.redirectTo({
            url: '/pages/login/login?redirect=/pages/publish/publish'
          });
        }
      });
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

  checkCanSubmit() {
    const { images, title, price, condition, categoryId, pickupMethod } = this.data;
    const canSubmit = images.length > 0 &&
      title.trim().length > 0 &&
      price !== '' && parseFloat(price) >= 0 &&
      condition !== '' &&
      categoryId !== '' &&
      pickupMethod !== '';

    this.setData({ canSubmit });
  },

  chooseImage() {
    const { images } = this.data;
    const maxCount = 9 - images.length;

    if (maxCount <= 0) {
      wx.showToast({
        title: '最多上传9张图片',
        icon: 'none'
      });
      return;
    }

    wx.chooseMedia({
      count: maxCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        wx.showLoading({
          title: '上传中...'
        });

        const newImages = [];
        for (const file of res.tempFiles) {
          try {
            const uploadRes = await app.uploadFile(file.tempFilePath);
            newImages.push(uploadRes.data.url);
          } catch (err) {
            console.error('图片上传失败:', err);
            wx.showToast({
              title: '图片上传失败',
              icon: 'error'
            });
          }
        }

        wx.hideLoading();

        const allImages = [...images, ...newImages];
        this.setData({
          images: allImages
        }, () => {
          this.checkCanSubmit();
        });
      }
    });
  },

  previewImage(e) {
    const { url, index } = e.currentTarget.dataset;
    const { images } = this.data;

    wx.previewImage({
      current: url,
      urls: images
    });
  },

  deleteImage(e) {
    const { index } = e.currentTarget.dataset;
    const { images } = this.data;

    wx.showModal({
      title: '提示',
      content: '确定删除这张图片吗？',
      success: (res) => {
        if (res.confirm) {
          images.splice(index, 1);
          this.setData({
            images: [...images]
          }, () => {
            this.checkCanSubmit();
          });
        }
      }
    });
  },

  onTitleInput(e) {
    this.setData({
      title: e.detail.value
    }, () => {
      this.checkCanSubmit();
    });
  },

  onDescriptionInput(e) {
    this.setData({
      description: e.detail.value
    });
  },

  onPriceInput(e) {
    this.setData({
      price: e.detail.value
    }, () => {
      this.checkCanSubmit();
    });
  },

  onOriginalPriceInput(e) {
    this.setData({
      originalPrice: e.detail.value
    });
  },

  onConditionSelect(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({
      condition: value
    }, () => {
      this.checkCanSubmit();
    });
  },

  showCategoryPicker() {
    this.setData({
      showCategory: true
    });
  },

  hideCategoryPicker() {
    this.setData({
      showCategory: false
    });
  },

  onCategorySelect(e) {
    const { id, name } = e.currentTarget.dataset;
    this.setData({
      categoryId: id,
      categoryName: name,
      showCategory: false
    }, () => {
      this.checkCanSubmit();
    });
  },

  onPickupSelect(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({
      pickupMethod: value
    }, () => {
      this.checkCanSubmit();
    });
  },

  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          address: res.name || res.address,
          latitude: res.latitude,
          longitude: res.longitude
        });
      },
      fail: (err) => {
        console.error('选择位置失败:', err);
        if (err.errMsg.includes('auth')) {
          wx.showModal({
            title: '提示',
            content: '需要授权位置信息才能选择取货位置',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        }
      }
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

  async submitForm() {
    if (!this.data.canSubmit) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    const { title, price, originalPrice, description, condition, categoryId, pickupMethod, images, address, latitude, longitude, phone, wechat } = this.data;

    if (!phone && !wechat) {
      wx.showToast({
        title: '请至少填写一种联系方式',
        icon: 'none'
      });
      return;
    }

    const userInfo = app.globalData.userInfo;
    const submitPhone = phone || userInfo.phone;
    const submitWechat = wechat || userInfo.wechat;

    if (!submitPhone && !submitWechat) {
      wx.showToast({
        title: '请至少填写一种联系方式',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '发布中...'
    });

    try {
      const params = {
        title: title.trim(),
        price: parseFloat(price),
        description: description.trim() || null,
        condition: condition,
        categoryId: parseInt(categoryId),
        pickupMethod: pickupMethod,
        images: images,
        phone: submitPhone || null,
        wechat: submitWechat || null
      };

      if (originalPrice) {
        params.originalPrice = parseFloat(originalPrice);
      }

      if (address) {
        params.address = address;
        params.latitude = latitude;
        params.longitude = longitude;
      }

      const res = await app.request({
        url: '/items',
        method: 'POST',
        data: params,
        needAuth: true
      });

      wx.hideLoading();

      wx.showModal({
        title: '发布成功',
        content: '您的闲置品已成功发布',
        showCancel: false,
        success: () => {
          this.setData({
            images: [],
            title: '',
            description: '',
            price: '',
            originalPrice: '',
            condition: '',
            categoryId: '',
            categoryName: '',
            pickupMethod: '',
            address: '',
            latitude: null,
            longitude: null,
            phone: '',
            wechat: '',
            canSubmit: false
          });

          wx.switchTab({
            url: '/pages/index/index'
          });
        }
      });
    } catch (err) {
      wx.hideLoading();
      console.error('发布失败:', err);
      wx.showToast({
        title: err.message || '发布失败',
        icon: 'error'
      });
    }
  }
});
