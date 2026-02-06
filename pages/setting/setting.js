// 个人设置页
Page({
  data: {
    userInfo: {}, // 用户信息
    isAdmin: false // 是否为管理员
  },

  onLoad() {
    // 页面加载时只获取本地存储的用户信息，不自动触发授权
    this.getUserInfoFromStorage()
    this.checkAdmin()
  },
  
  onShow() {
    // 页面显示时只获取本地存储的用户信息，不自动触发授权
    this.getUserInfoFromStorage()
  },

  // 从本地存储获取用户信息（占位昵称「微信用户」不视为已登录）
  getUserInfoFromStorage() {
    const app = getApp()
    let userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    const nick = (userInfo && userInfo.nickName) ? String(userInfo.nickName).trim() : ''
    if (userInfo && userInfo.avatarUrl && nick && nick !== '微信用户') {
      this.setData({ userInfo })
    } else {
      this.setData({ userInfo: {} })
    }
  },

  // 跳转首页进行登录（首页使用头像昵称填写能力获取真实昵称与头像）
  goToIndexLogin() {
    wx.switchTab({
      url: '/pages/index/index'
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
        const result = res.result || {}
        let openid = result.openid || result.OPENID
        if (!openid) {
          openid = 'mock_openid_' + Date.now()
          console.warn('云函数未返回 openid，已降级为临时标识')
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
            const app = getApp()
            app.globalData.userInfo = userInfo
            // 存储到本地缓存
            wx.setStorageSync('userInfo', userInfo)
            // 更新页面显示
            this.setData({
              userInfo: userInfo
            })
            
            wx.showToast({
              title: '登录成功',
              icon: 'success'
            })
          },
          fail: (err) => {
            console.log('用户信息存储失败：', err)
            wx.showToast({
              title: '登录失败，请重试',
              icon: 'none'
            })
          }
        })
      },
      fail: (err) => {
        console.log('获取openid失败：', err)
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
            const app = getApp()
            app.globalData.userInfo = userInfo
            // 存储到本地缓存
            wx.setStorageSync('userInfo', userInfo)
            // 更新页面显示
            this.setData({
              userInfo: userInfo
            })
            
            wx.showToast({
              title: '登录成功',
              icon: 'success'
            })
          },
          fail: (err) => {
            console.log('用户信息存储失败：', err)
            wx.showToast({
              title: '登录失败，请重试',
              icon: 'none'
            })
          }
        })
      }
    })
  },
  
  // 获取openid并存储到云数据库
  getOpenIdAndSave(userInfo) {
    // 调用wx.login获取code
    wx.login({
      success: res => {
        if (res.code) {
          // 这里应该调用云函数获取openid
          // 简化处理：使用模拟的openid
          const openid = 'mock_openid_' + Date.now()
          
          // 构建用户信息对象
          const userData = {
            openid: openid,
            avatarUrl: userInfo.avatarUrl,
            nickName: userInfo.nickName,
            createTime: Date.now(),
            updateTime: Date.now()
          }
          
          // 存储到云数据库
          const db = wx.cloud.database()
          db.collection('userInfo').add({
            data: userData,
            success: res => {
              console.log('用户信息存储成功：', res)
            },
            fail: err => {
              console.log('用户信息存储失败：', err)
            }
          })
        }
      }
    })
  },

  // 检查是否为管理员（这里简化处理，实际项目中应该从数据库或云函数判断）
  checkAdmin() {
    // 这里可以根据用户openid或其他标识判断是否为管理员
    // 简化处理：暂时设为false
    this.setData({
      isAdmin: false
    })
  },

  // 修改打卡范围
  modifyCheckInRange() {
    wx.navigateTo({
      url: '../setting/modify-range/modify-range'
    })
  },

  // 清除本地缓存
  clearCache() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除本地缓存吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          wx.showToast({
            title: '缓存已清除',
            icon: 'success'
          })
        }
      }
    })
  },

  // 显示关于信息
  showAbout() {
    wx.showModal({
      title: '关于',
      content: '员工打卡小程序 v1.0.0\n\n基于微信小程序云开发\n\n© 2026 公司内部使用',
      showCancel: false
    })
  }
})