// 打卡首页
const app = getApp()
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    // 用户信息
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },
    hasUserInfo: false,
    // 登录弹窗与头像昵称填写
    showLoginModal: false,
    tempAvatarPath: '',
    defaultAvatarUrl: defaultAvatarUrl,

    // 时间信息
    currentTime: '',
    
    // 打卡状态
    checkInStatus: '未打卡',
    hasCheckedInOn: false, // 是否已上班打卡
    hasCheckedInOff: false, // 是否已下班打卡
    canCheckIn: false, // 是否可以打卡
    
    // 位置信息
    locationInfo: '',
    isInCompanyRange: false, // 是否在公司范围内
    latitude: 0, // 当前纬度（用于地图显示）
    longitude: 0, // 当前经度（用于地图显示）
    markers: [], // 地图标记点
    
    // 错误信息
    errorMsg: ''
  },

  onLoad() {
    this.init()
    this.updateTime()
    setInterval(this.updateTime, 1000) // 每秒更新时间
  },

  onShow() {
    this.checkTodayCheckIn()
  },
  
  onUnload() {
    // 停止位置更新
    wx.stopLocationUpdate({
      success: () => {
        console.log('停止位置更新成功')
      },
      fail: (err) => {
        console.log('停止位置更新失败', err)
      }
    })
    // 移除位置变化监听
    wx.offLocationChange()
  },

  // 初始化
  init() {
    this.initUserInfo()
    this.getLocation()
  },

  // 更新当前时间
  updateTime() {
    const now = new Date()
    const timeStr = now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
    this.setData({
      currentTime: timeStr
    })
  },

  // 点击登录：弹出头像昵称填写弹窗（微信已不再通过 getUserProfile 返回真实昵称/头像）
  onLoginTap() {
    this.setData({
      showLoginModal: true,
      tempAvatarPath: ''
    })
  },

  onCloseLoginModal() {
    this.setData({ showLoginModal: false })
  },

  // 头像昵称填写能力：选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    if (!avatarUrl) return
    this.setData({ tempAvatarPath: avatarUrl })
  },

  // 头像昵称填写能力：表单提交（确定登录）
  onLoginFormSubmit(e) {
    const nickname = (e.detail.value && e.detail.value.nickname) ? e.detail.value.nickname.trim() : ''
    if (!nickname) {
      wx.showToast({ title: '请填写昵称', icon: 'none' })
      return
    }
    const tempAvatarPath = this.data.tempAvatarPath
    if (!tempAvatarPath) {
      wx.showToast({ title: '请选择头像', icon: 'none' })
      return
    }

    this.setData({ showLoginModal: false })

    wx.showLoading({ title: '登录中...' })

    // 将临时头像上传到云存储，得到永久链接
    const cloudPath = `avatars/${Date.now()}-${Math.random().toString(36).slice(2)}.png`
    wx.cloud.uploadFile({
      cloudPath,
      filePath: tempAvatarPath
    }).then(uploadRes => {
      const avatarUrl = uploadRes.fileID
      wx.login({
        success: (loginRes) => {
          if (loginRes.code) {
            this.getOpenIdAndSaveUserInfo(nickname, avatarUrl, loginRes.code)
          } else {
            wx.hideLoading()
            wx.showToast({ title: '登录失败，请重试', icon: 'none' })
          }
        },
        fail: () => {
          wx.hideLoading()
          wx.showToast({ title: '登录失败，请重试', icon: 'none' })
        }
      })
    }).catch(err => {
      console.error('头像上传失败', err)
      wx.hideLoading()
      wx.showToast({ title: '头像上传失败，请重试', icon: 'none' })
    })
  },
  
  // 获取openid并存储用户信息到云数据库
  getOpenIdAndSaveUserInfo(nickName, avatarUrl, code) {
    let appid = ''
    try {
      appid = wx.getAccountInfoSync().accountInfo.appId
    } catch (e) {
      console.warn('获取 appid 失败', e)
    }
    wx.cloud.callFunction({
      name: 'login',
      data: {
        code: code,
        appid: appid || undefined
      },
      success: (res) => {
        console.log('云函数返回结果：', res)
        wx.hideLoading()

        const result = res.result || {}
        let openid = result.openid || result.OPENID
        console.log('获取openid：', openid)

        if (!openid) {
          openid = 'mock_openid_' + Date.now()
          console.warn('云函数未返回 openid，已降级为临时标识。请检查云函数 login 是否已部署、云开发环境是否正常。')
        }
        
        // 构建用户信息对象
        const userData = {
          openid: openid,
          nickName: nickName,
          avatarUrl: avatarUrl,
          createTime: Date.now(),
          updateTime: Date.now()
        }
        
        // 构建用户信息对象（用于页面显示）
        const userInfo = {
          nickName: nickName,
          avatarUrl: avatarUrl
        }
        
        // 存储到云数据库
        const db = wx.cloud.database()
        db.collection('userInfo').add({
          data: userData,
          success: (addRes) => {
            console.log('用户信息存储成功：', addRes)
            
            // 更新全局用户信息
            app.globalData.userInfo = userInfo
            // 存储到本地缓存
            wx.setStorageSync('userInfo', userInfo)
            // 更新页面显示
            this.setData({
              userInfo: userInfo,
              hasUserInfo: true
            })
            
            wx.showToast({
              title: '登录成功',
              icon: 'success'
            })
          },
          fail: (err) => {
            console.log('用户信息存储失败：', err)
            app.globalData.userInfo = userInfo
            wx.setStorageSync('userInfo', userInfo)
            this.setData({
              userInfo: userInfo,
              hasUserInfo: true
            })
            wx.showToast({
              title: '登录成功（离线模式）',
              icon: 'success'
            })
          }
        })
      },
      fail: (err) => {
        console.log('获取openid失败：', err)
        wx.hideLoading()
        // 云函数调用失败时，使用模拟的openid
        const openid = 'mock_openid_' + Date.now()
        
        // 构建用户信息对象
        const userData = {
          openid: openid,
          nickName: nickName,
          avatarUrl: avatarUrl,
          createTime: Date.now(),
          updateTime: Date.now()
        }
        
        // 构建用户信息对象（用于页面显示）
        const userInfo = {
          nickName: nickName,
          avatarUrl: avatarUrl
        }
        
        // 存储到云数据库
        const db = wx.cloud.database()
        db.collection('userInfo').add({
          data: userData,
          success: (addRes) => {
            console.log('用户信息存储成功：', addRes)
            
            // 更新全局用户信息
            app.globalData.userInfo = userInfo
            // 存储到本地缓存
            wx.setStorageSync('userInfo', userInfo)
            // 更新页面显示
            this.setData({
              userInfo: userInfo,
              hasUserInfo: true
            })
            
            wx.showToast({
              title: '登录成功',
              icon: 'success'
            })
          },
          fail: (err) => {
            console.log('用户信息存储失败：', err)
            // 即使存储失败，也更新本地显示（允许离线使用）
            app.globalData.userInfo = userInfo
            wx.setStorageSync('userInfo', userInfo)
            this.setData({
              userInfo: userInfo,
              hasUserInfo: true
            })
            wx.showToast({
              title: '登录成功（离线模式）',
              icon: 'success'
            })
          }
        })
      }
    })
  },
  
  // 初始化用户信息
  initUserInfo() {
    const app = getApp()
    let userInfo = null
    
    // 优先从全局数据获取
    if (app.globalData.userInfo && app.globalData.userInfo.nickName && app.globalData.userInfo.avatarUrl) {
      userInfo = app.globalData.userInfo
    } else {
      const storedUserInfo = wx.getStorageSync('userInfo')
      if (storedUserInfo && storedUserInfo.nickName && storedUserInfo.avatarUrl) {
        userInfo = storedUserInfo
        app.globalData.userInfo = storedUserInfo
      }
    }

    // 微信接口不再返回真实昵称，占位昵称「微信用户」视为未完善信息
    const nick = (userInfo && userInfo.nickName) ? String(userInfo.nickName).trim() : ''
    const isPlaceholderNickname = nick === '' || nick === '微信用户'
    
    if (userInfo && userInfo.avatarUrl && nick && !isPlaceholderNickname) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      })
    } else {
      // 用户信息不完整，重置为未登录状态
      this.setData({
        userInfo: {
          avatarUrl: defaultAvatarUrl,
          nickName: '',
        },
        hasUserInfo: false
      })
    }
  },

  // 获取位置信息
  getLocation() {
    // 1. 先检查位置权限
    wx.getSetting({
      success: (res) => {
        // 检查是否已授权位置权限
        if (!res.authSetting['scope.userLocation']) {
          // 2. 未授权，弹出权限申请
          wx.authorize({
            scope: 'scope.userLocation',
            success: () => {
              // 授权成功后获取位置
              this.getLocationInfo()
            },
            fail: () => {
              // 用户拒绝授权，引导用户打开设置
              wx.showModal({
                title: '位置权限',
                content: '打卡需要获取您的位置信息，请在设置中开启位置权限',
                confirmText: '去设置',
                cancelText: '取消',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    wx.openSetting({
                      success: (settingRes) => {
                        if (settingRes.authSetting['scope.userLocation']) {
                          // 用户在设置中开启了权限
                          this.getLocationInfo()
                        } else {
                          this.setData({
                            errorMsg: '请授予小程序位置权限',
                            canCheckIn: false
                          })
                        }
                      }
                    })
                  } else {
                    this.setData({
                      errorMsg: '请授予小程序位置权限',
                      canCheckIn: false
                    })
                  }
                }
              })
            }
          })
        } else {
          // 已授权，直接获取位置
          this.getLocationInfo()
        }
      }
    })
  },
  
  // 获取位置信息（具体实现）
  getLocationInfo() {
    // 先尝试使用getLocation获取初始位置
    wx.getLocation({
      type: 'gcj02', // 使用gcj02坐标系（微信小程序推荐使用）
      altitude: true,
      success: (res) => {
        this.updateLocation(res)
        // 开启实时位置更新
        this.startLocationUpdate()
      },
      fail: (err) => {
        console.log('获取位置失败', err)
        // 根据错误信息显示不同的提示
        let errorMsg = '获取位置失败，请检查位置权限'
        if (err.errMsg.includes('auth deny')) {
          errorMsg = '请授予小程序位置权限'
        } else if (err.errMsg.includes('location failed')) {
          errorMsg = '请打开手机定位功能'
        }
        this.setData({
          errorMsg: errorMsg,
          canCheckIn: false
        })
      }
    })
  },
  
  // 开启实时位置更新
  startLocationUpdate() {
    wx.startLocationUpdate({
      success: () => {
        console.log('开启实时位置更新成功')
        // 监听位置变化
        wx.onLocationChange((res) => {
          this.updateLocation(res)
        })
      },
      fail: (err) => {
        console.log('开启实时位置更新失败', err)
        // 如果开启失败，尝试申请后台定位权限
        this.applyBackgroundLocationPermission()
      }
    })
  },
  
  // 申请后台定位权限
  applyBackgroundLocationPermission() {
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.userLocationBackground']) {
          wx.authorize({
            scope: 'scope.userLocationBackground',
            success: () => {
              // 授权成功后再次尝试开启实时位置更新
              this.startLocationUpdate()
            },
            fail: () => {
              wx.showModal({
                title: '位置权限',
                content: '打卡需要后台位置权限，请在设置中开启',
                confirmText: '去设置',
                cancelText: '取消',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    wx.openSetting()
                  }
                }
              })
            }
          })
        }
      }
    })
  },
  
  // 更新位置信息
  updateLocation(res) {
    const { latitude, longitude } = res

    const companyLocation = app.globalData.companyLocation || {}
    const companyLat = typeof companyLocation.lat === 'number' ? companyLocation.lat : 31.2304
    const companyLng = typeof companyLocation.lng === 'number' ? companyLocation.lng : 121.4737
    const companyTitle = companyLocation.name || '公司打卡点'
    
    // 更新地图标记点
    const markers = [
      {
        id: 0,
        latitude: latitude,
        longitude: longitude,
        title: '当前位置',
        iconPath: '/resources/location.png',
        width: 30,
        height: 30
      },
      {
        id: 1,
        latitude: companyLat,
        longitude: companyLng,
        title: companyTitle,
        iconPath: '/resources/company.png',
        width: 30,
        height: 30
      }
    ]
    
    this.setData({
      locationInfo: `纬度: ${latitude}, 经度: ${longitude}`,
      latitude: latitude,  // 存储纬度用于地图显示
      longitude: longitude, // 存储经度用于地图显示
      markers: markers // 更新地图标记点
    })
    this.checkLocationRange(latitude, longitude)
  },

  // 检查是否在公司范围内
  checkLocationRange(lat, lng) {
    const companyLocation = app.globalData.companyLocation
    if (!companyLocation || typeof companyLocation.lat !== 'number' || typeof companyLocation.lng !== 'number') {
      this.setData({
        isInCompanyRange: false,
        canCheckIn: false,
        errorMsg: '未配置公司位置'
      })
      return
    }

    const radius = companyLocation.radius || 500
    const distance = this.calculateDistance(lat, lng, companyLocation.lat, companyLocation.lng)
    
    if (distance <= radius) {
      this.setData({
        isInCompanyRange: true,
        canCheckIn: true,
        errorMsg: ''
      })
    } else {
      this.setData({
        isInCompanyRange: false,
        canCheckIn: false,
        errorMsg: `不在打卡范围内，距离公司${Math.round(distance)}米`
      })
    }
  },

  // 计算两点之间的距离（米）
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // 地球半径（米）
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  },

  // 检查今日打卡状态
  checkTodayCheckIn() {
    const db = wx.cloud.database()
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    db.collection('checkInRecords')
      .where({
        checkInTime: {
          $gte: startOfDay.getTime(),
          $lte: endOfDay.getTime()
        }
      })
      .get()
      .then(res => {
        const records = res.data
        let hasCheckedInOn = false
        let hasCheckedInOff = false

        records.forEach(record => {
          if (record.type === 'on') {
            hasCheckedInOn = true
          } else if (record.type === 'off') {
            hasCheckedInOff = true
          }
        })

        let checkInStatus = '未打卡'
        if (hasCheckedInOn && hasCheckedInOff) {
          checkInStatus = '已完成今日打卡'
        } else if (hasCheckedInOn) {
          checkInStatus = '已上班打卡'
        }

        this.setData({
          hasCheckedInOn,
          hasCheckedInOff,
          checkInStatus
        })
      })
      .catch(err => {
        console.log('检查打卡状态失败', err)
      })
  },

  // 打卡
  checkIn(e) {
    const type = e.currentTarget.dataset.type
    
    if (!this.data.canCheckIn) {
      wx.showToast({
        title: '无法打卡，请检查位置权限和打卡范围',
        icon: 'none'
      })
      return
    }

    // 获取当前位置
    wx.getLocation({
      type: 'wgs84',
      success: (res) => {
        const { latitude, longitude } = res
        
        // 调用云函数打卡
        wx.cloud.callFunction({
          name: 'checkIn',
          data: {
            type,
            location: {
              lat: latitude,
              lng: longitude
            },
            companyLocation: app.globalData.companyLocation || null
          }
        })
        .then(res => {
          if (res.result.success) {
            wx.showToast({
              title: res.result.message,
              icon: 'success'
            })
            // 重新检查打卡状态
            setTimeout(() => {
              this.checkTodayCheckIn()
            }, 1000)
          } else {
            wx.showToast({
              title: res.result.message,
              icon: 'none'
            })
          }
        })
        .catch(err => {
          console.log('打卡失败', err)
          wx.showToast({
            title: '打卡失败，请稍后重试',
            icon: 'none'
          })
        })
      },
      fail: (err) => {
        console.log('获取位置失败', err)
        wx.showToast({
          title: '获取位置失败，请检查位置权限',
          icon: 'none'
        })
      }
    })
  }
})
