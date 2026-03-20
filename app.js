// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 初始化云开发环境
    wx.cloud.init({
      env: 'cloud1-5g2qfiwh4aee55e6', // 请替换为你的云开发环境ID
      traceUser: true
    })
    console.log('云开发环境初始化成功')

    // 自动登录逻辑
    this.autoLogin()

    // 恢复已保存的公司位置
    this.restoreCompanyLocation()
  },
  
  // 自动登录函数
  autoLogin() {
    const storedUserInfo = wx.getStorageSync('userInfo')
    const nick = (storedUserInfo && storedUserInfo.nickName) ? String(storedUserInfo.nickName).trim() : ''
    const valid = storedUserInfo && storedUserInfo.avatarUrl && nick && nick !== '微信用户'
    if (valid) {
      this.globalData.userInfo = storedUserInfo
      console.log('已从本地存储恢复登录状态')
      return
    }
    if (storedUserInfo) {
      console.log('检测到不完整或占位用户信息，清除本地存储')
      wx.removeStorageSync('userInfo')
      this.globalData.userInfo = null
    }
    
    // 2. 获取用户登录凭证（仅获取code，不自动获取用户信息）
    wx.login({
      success: res => {
        if (res.code) {
          console.log('获取登录凭证成功：', res.code)
          // 注意：wx.getUserProfile 只能在用户点击事件中调用
          // 这里不自动获取用户信息，需要用户在页面中主动点击授权
        } else {
          console.log('登录失败：', res.errMsg)
        }
      },
      fail: err => {
        console.log('wx.login失败：', err)
      }
    })
  },

  // 从本地缓存恢复公司位置配置
  restoreCompanyLocation() {
    const storedLocation = wx.getStorageSync('companyLocation')
    if (!storedLocation) return

    const parsedLat = Number(storedLocation.lat)
    const parsedLng = Number(storedLocation.lng)
    const parsedRadius = storedLocation.radius == null ? undefined : Number(storedLocation.radius)
    const hasValidLatLng = isFinite(parsedLat) && isFinite(parsedLng) && Math.abs(parsedLat) <= 90 && Math.abs(parsedLng) <= 180
    const hasValidRadius = parsedRadius == null || (isFinite(parsedRadius) && parsedRadius > 0)

    if (hasValidLatLng && hasValidRadius) {
      // 保留已有半径等配置，优先使用存储值；同时确保经纬度是 number
      this.globalData.companyLocation = Object.assign({}, this.globalData.companyLocation, storedLocation, {
        lat: parsedLat,
        lng: parsedLng,
        radius: parsedRadius == null ? this.globalData.companyLocation.radius : parsedRadius
      })
      console.log('已加载自定义公司位置', this.globalData.companyLocation)
    }
  },
  
  globalData: {
    userInfo: null,
    // 公司打卡范围配置
    companyLocation: {
      // 武汉市 文华学院（默认值，便于测试）
      lat: 30.494505,
      lng: 114.439999,
      // 直径 20km => 半径 10km
      radius: 10000
    },
    // 打卡时间配置
    checkInTime: {
      onWork: 6, // 上班时间（小时）
      offWork: 24 // 下班时间（小时）
    }
  }
})
