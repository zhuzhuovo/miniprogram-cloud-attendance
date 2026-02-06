// 打卡历史页
Page({
  data: {
    records: [], // 打卡记录列表
    dateRange: ['今日', '本周', '本月'], // 日期筛选范围
    dateIndex: 0 // 当前选中的筛选范围
  },

  onLoad() {
    this.getCheckInRecords()
  },

  onShow() {
    this.getCheckInRecords()
  },

  // 日期筛选变化
  bindDateChange(e) {
    this.setData({
      dateIndex: e.detail.value
    })
    this.getCheckInRecords()
  },

  // 获取打卡记录
  getCheckInRecords() {
    const db = wx.cloud.database()
    const _ = db.command
    const now = new Date()
    let startDate = new Date()
    
    // 根据筛选范围设置开始日期
    switch (this.data.dateIndex) {
      case 0: // 今日
        startDate.setHours(0, 0, 0, 0)
        break
      case 1: // 本周
        const dayOfWeek = now.getDay() || 7 // 调整为周一为1
        startDate.setDate(now.getDate() - dayOfWeek + 1)
        startDate.setHours(0, 0, 0, 0)
        break
      case 2: // 本月
        startDate.setDate(1)
        startDate.setHours(0, 0, 0, 0)
        break
    }

    // 查询打卡记录
    db.collection('checkInRecords')
      .where({
        checkInTime: _.gte(startDate.getTime())
      })
      .orderBy('checkInTime', 'desc')
      .get()
      .then(res => {
        this.setData({
          records: res.data
        })
      })
      .catch(err => {
        console.error('获取打卡记录失败', err)
        wx.showToast({
          title: '获取记录失败',
          icon: 'none'
        })
      })
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }
})