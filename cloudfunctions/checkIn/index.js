// 打卡云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 计算两点之间的距离（米）
function calculateDistance(lat1, lng1, lat2, lng2) {
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
}

// 判断打卡状态
function getCheckInStatus(type, checkInTime) {
  const date = new Date(checkInTime);
  const hour = date.getHours();
  
  if (type === 'on') {
    // 上班打卡，9点后算迟到
    return hour > 9 ? 'late' : 'normal';
  } else {
    // 下班打卡，18点前算早退
    return hour < 18 ? 'early' : 'normal';
  }
}

exports.main = async (event, context) => {
  try {
    const { type, location } = event;
    const { lat, lng } = location;
    
    // 获取用户openid
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    
    // 公司位置配置（实际项目中应该从数据库或配置文件读取）
    const companyLocation = {
      lat: 31.2304,
      lng: 121.4737,
      radius: 500
    };
    
    // 计算距离
    const distance = calculateDistance(lat, lng, companyLocation.lat, companyLocation.lng);
    
    // 检查是否在打卡范围内
    if (distance > companyLocation.radius) {
      return {
        success: false,
        message: `不在打卡范围内，距离公司${Math.round(distance)}米`
      };
    }
    
    // 获取打卡状态
    const status = getCheckInStatus(type, Date.now());
    
    // 保存打卡记录
    const result = await db.collection('checkInRecords').add({
      data: {
        openid: openid,
        type,
        checkInTime: Date.now(),
        location: {
          lat,
          lng
        },
        status,
        createdAt: db.serverDate()
      }
    });
    
    return {
      success: true,
      message: '打卡成功',
      data: {
        _id: result._id,
        type,
        checkInTime: Date.now(),
        location: {
          lat,
          lng
        },
        status
      }
    };
  } catch (error) {
    console.error('打卡失败', error);
    return {
      success: false,
      message: '打卡失败，请稍后重试'
    };
  }
};