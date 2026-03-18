// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 初始化云开发环境
    wx.cloud.init({
      env: 'cloud1-3g41ctlnd6ba594a', // 请替换为你的云开发环境ID
      traceUser: true
    })
    console.log('云开发环境初始化成功')

    // 自动登录逻辑
    this.autoLogin()
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
  
  globalData: {
    userInfo: null,
    // 公司打卡范围配置
    companyLocation: {
      lat: 30.4936, // 公司纬度
      lng: 114.4404, // 公司经度//当前位置模拟文华学院信息学部
      radius: 500 // 允许偏差半径（米）
    },
    // 打卡时间配置
    checkInTime: {
      onWork: 6, // 上班时间（小时）
      offWork: 24 // 下班时间（小时）
    }
  }
})
