# 小程序配置说明文档

## 一、微信小程序管理后台配置

### 1. 用户信息接口开通步骤

1. **登录微信小程序管理后台**
   - 访问 https://mp.weixin.qq.com/
   - 使用小程序管理员账号登录

2. **进入开发管理**
   - 左侧菜单选择「开发管理」
   - 点击「接口设置」选项卡

3. **开通用户信息相关接口**
   - 找到「用户信息」接口
   - 点击「开通」按钮
   - 阅读并同意相关协议
   - 完成开通流程

4. **配置用户信息授权弹窗**
   - 在小程序代码中，使用 `wx.getUserProfile` 接口时，需要设置 `desc` 参数，用于向用户说明授权用途
   - 示例：
     ```javascript
     wx.getUserProfile({
       desc: '用于完善个人资料',
       success: res => {
         // 处理用户信息
       }
     })
     ```

### 2. 位置接口开通步骤

1. **进入开发管理**
   - 左侧菜单选择「开发管理」
   - 点击「接口设置」选项卡

2. **开通位置相关接口**
   - 找到「位置」接口
   - 点击「开通」按钮
   - 阅读并同意相关协议
   - 完成开通流程

3. **配置位置权限说明**
   - 在小程序代码中，使用 `wx.getLocation` 接口前，需要先使用 `wx.getSetting` 检查权限状态
   - 未授权时，需要使用 `wx.authorize` 申请权限
   - 示例：
     ```javascript
     wx.getSetting({
       success: res => {
         if (!res.authSetting['scope.userLocation']) {
           wx.authorize({
             scope: 'scope.userLocation',
             success: () => {
               // 授权成功，获取位置
             }
           })
         }
       }
     })
     ```

4. **配置 request 合法域名**
   - 如果需要将位置信息发送到后端服务器，需要在「开发管理」→「开发设置」中配置合法域名

## 二、云开发环境配置

### 1. 用户信息存储集合设计

**集合名称：** `userInfo`

**字段设计：**

| 字段名 | 类型 | 说明 | 是否必填 |
|-------|------|------|----------|
| _id | String | 记录ID（自动生成） | 否 |
| openid | String | 用户唯一标识 | 是 |
| avatarUrl | String | 用户头像URL | 是 |
| nickName | String | 用户昵称 | 是 |
| createTime | Number | 创建时间戳 | 是 |
| updateTime | Number | 更新时间戳 | 是 |

**示例数据：**

```javascript
{
  "_id": "cloud://cloud1-0g9x6v1i312f338e.636c-cloud1-0g9x6v1i312f338e-1324354657",
  "openid": "oABCDEFG123456789",
  "avatarUrl": "https://wx.qlogo.cn/mmopen/vi_32/...",
  "nickName": "张三",
  "createTime": 1620000000000,
  "updateTime": 1620000000000
}
```

### 2. 打卡记录集合设计

**集合名称：** `checkInRecords`

**字段设计：**

| 字段名 | 类型 | 说明 | 是否必填 |
|-------|------|------|----------|
| _id | String | 记录ID（自动生成） | 否 |
| openid | String | 用户唯一标识 | 是 |
| type | String | 打卡类型（on:上班，off:下班） | 是 |
| checkInTime | Number | 打卡时间戳 | 是 |
| location | Object | 打卡位置信息 | 是 |
| location.lat | Number | 纬度 | 是 |
| location.lng | Number | 经度 | 是 |
| isInCompanyRange | Boolean | 是否在公司范围内 | 是 |

**示例数据：**

```javascript
{
  "_id": "cloud://cloud1-0g9x6v1i312f338e.636c-cloud1-0g9x6v1i312f338e-1324354658",
  "openid": "oABCDEFG123456789",
  "type": "on",
  "checkInTime": 1620000000000,
  "location": {
    "lat": 31.2304,
    "lng": 121.4737
  },
  "isInCompanyRange": true
}
```

## 三、项目配置文件说明

### 1. app.json 配置

确保在 `app.json` 文件中添加以下配置：

```json
{
  "pages": [
    "pages/index/index",
    "pages/history/history",
    "pages/setting/setting",
    "pages/logs/logs"
  ],
  "window": {
    "backgroundTextStyle": "light",
    "navigationBarBackgroundColor": "#fff",
    "navigationBarTitleText": "员工打卡",
    "navigationBarTextStyle": "black"
  },
  "sitemapLocation": "sitemap.json",
  "requiredBackgroundModes": ["location"]
}
```

### 2. project.config.json 配置

确保在 `project.config.json` 文件中正确配置云开发环境：

```json
{
  "description": "员工打卡小程序",
  "packOptions": {
    "ignore": []
  },
  "setting": {
    "urlCheck": true,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "preloadBackgroundData": false,
    "minified": true,
    "newFeature": false,
    "coverView": true,
    "nodeModules": false,
    "autoAudits": false,
    "showShadowRootInWxmlPanel": true,
    "scopeDataCheck": false,
    "uglifyFileName": false,
    "checkInvalidKey": true,
    "checkSiteMap": true,
    "uploadWithSourceMap": true,
    "compileHotReLoad": false,
    "lazyloadPlaceholderEnable": false,
    "useMultiFrameRuntime": true,
    "useApiHook": true,
    "useApiHostProcess": true,
    "babelSetting": {
      "ignore": [],
      "disablePlugins": [],
      "outputPath": ""
    },
    "enableEngineNative": false,
    "useIsolateContext": true,
    "userConfirmedBundleSwitch": false,
    "packNpmManually": false,
    "packNpmRelationList": [],
    "minifyWXSS": true,
    "minifyWXML": true,
    "showES6CompileOption": false,
    "showAdvancedOpCompressOptions": false
  },
  "compileType": "miniprogram",
  "libVersion": "2.19.4",
  "appid": "你的小程序AppID",
  "projectname": "员工打卡",
  "debugOptions": {
    "hidedInDevtools": []
  },
  "scripts": {},
  "staticServerOptions": {
    "baseURL": "",
    "servePath": ""
  },
  "isGameTourist": false,
  "condition": {
    "search": {
      "list": []
    },
    "conversation": {
      "list": []
    },
    "game": {
      "list": []
    },
    "plugin": {
      "list": []
    },
    "gamePlugin": {
      "list": []
    },
    "miniprogram": {
      "list": []
    }
  },
  "cloudfunctionTemplateRoot": "cloudfunctions/",
  "cloudfunctionRoot": "cloudfunctions",
  "cloudEnv": "cloud1-0g9x6v1i312f338e"
}
```

## 四、资源文件说明

### 1. 地图标记图标

需要在项目根目录创建 `resources` 文件夹，并添加以下图标文件：

- `location.png`：当前位置标记图标
- `company.png`：公司打卡点标记图标

**推荐尺寸：** 60x60px

**获取方式：**
1. 可以使用微信小程序提供的默认图标
2. 也可以自定义图标，确保图标清晰可见

## 五、常见问题解决方案

### 1. 位置权限申请失败

**问题现象：** 用户拒绝授权位置权限后，无法再次申请

**解决方案：**
- 在代码中，当用户拒绝授权后，使用 `wx.openSetting` 引导用户到设置页面开启权限
- 示例代码已在 `index.js` 文件中实现

### 2. 地图不显示

**问题现象：** 地图组件未渲染或显示空白

**解决方案：**
- 确保已正确获取到经纬度信息
- 确保 `latitude` 和 `longitude` 属性已正确绑定到地图组件
- 检查小程序是否已开通位置接口

### 3. 登录状态丢失

**问题现象：** 小程序重启后，登录状态丢失，需要重新授权

**解决方案：**
- 已在 `app.js` 中实现登录状态持久化，使用 `wx.setStorageSync` 存储用户信息
- 小程序启动时，会自动从本地存储恢复登录状态

### 4. 打卡按钮不可用

**问题现象：** 打卡按钮处于灰色禁用状态

**解决方案：**
- 检查用户是否已登录
- 检查是否已获取到位置信息
- 检查是否在公司范围内
- 检查是否已完成当天打卡

## 六、测试步骤

1. **功能测试**
   - 启动小程序，检查是否自动弹出登录授权弹窗
   - 授权登录后，检查设置页是否显示用户头像和昵称
   - 检查地图是否显示当前位置和公司打卡点
   - 检查打卡按钮是否在获取位置后启用
   - 测试上班打卡和下班打卡功能

2. **权限测试**
   - 首次使用时，检查是否弹出位置权限申请
   - 拒绝授权后，检查是否引导用户到设置页面
   - 在设置中开启权限后，检查是否能正常获取位置

3. **边界测试**
   - 测试不在公司范围内的情况
   - 测试已完成当天打卡的情况
   - 测试手机定位关闭的情况

## 七、注意事项

1. **用户隐私保护**
   - 严格遵守微信小程序用户隐私保护指引
   - 仅在必要时获取用户信息和位置信息
   - 对获取的用户信息进行安全存储

2. **接口调用规范**
   - 遵守微信小程序接口调用频率限制
   - 对接口调用失败进行合理的错误处理
   - 避免在短时间内频繁调用同一接口

3. **性能优化**
   - 减少不必要的接口调用
   - 合理使用本地存储，减少网络请求
   - 优化地图组件的渲染性能

4. **兼容性处理**
   - 考虑不同微信版本的兼容性
   - 对低版本微信进行合理的降级处理
   - 测试不同手机型号的适配情况

---

**配置完成后，小程序应能正常实现自动登录、地图显示、位置获取和打卡功能。**