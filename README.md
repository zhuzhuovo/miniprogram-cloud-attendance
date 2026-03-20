# 员工打卡小程序（微信小程序·云开发）

面向公司内部或学习场景的轻量打卡小程序，使用微信原生语法与云开发能力，无需自建服务端即可完成位置校验、打卡记录存储与登录鉴权。

## 功能概览

- 打卡首页：显示当前时间、位置与打卡状态，支持上班/下班打卡，实时定位并校验是否在公司范围内，异常提示清晰。
- 历史记录：按「今日/本周/本月」筛选并倒序展示打卡记录。
- 设置页：展示头像昵称，支持修改公司位置（已加管理员验证码门槛）、清除缓存、关于信息。
- 登录与头像昵称：基于头像昵称填写能力；登录失败时自动降级为本地模拟 openid 以便离线体验。

## 技术栈

- 小程序前端：微信小程序原生（JavaScript、WXML、WXSS）
- 后端能力：微信云开发（云函数 + 云数据库 + 云存储）
- 依赖：仅使用官方 API，无第三方框架

## 目录结构

```
pages/            # 前端页面：index（打卡）、history、setting
cloudfunctions/   # 云函数：checkIn（打卡）、login（openid 获取）、verifyAdmin（TOTP 验证）
app.js            # 应用入口与全局配置（云环境、公司位置、打卡时间）
app.json          # 页面路由、TabBar、权限声明
app.wxss          # 全局样式
```

## 业务与规则

- 打卡范围：默认公司位置为武汉文华学院，半径 10km；可在设置页保存自定义位置（写入本地存储并同步到全局配置）。
- 打卡判定：
  - 上班（type=on）：09:00 后记为迟到。
  - 下班（type=off）：18:00 前记为早退。
- 定位与权限：在 app.json 声明前后台定位权限说明，首页进入时主动请求位置权限并提供引导。
- 登录：wx.login 获取 code，云函数 login 优先 getWXContext，否则使用 code2Session（需配置 APP_SECRET）。失败时使用 mock openid 降级存储，保证流程可测。
- 管理员验证码：设置页修改公司位置前需输入 6 位 TOTP（Google Authenticator 兼容，30s 步长，±1 窗口）。云函数 verifyAdmin 校验 `ADMIN_TOTP_SECRET`（Base32）。

## 部署与本地运行

1. 准备

- 安装微信开发者工具，申请小程序 AppID。
- 开通云开发，创建环境并记下环境 ID。

2. 导入项目

- 微信开发者工具选择「导入项目」，目录指向本仓库根目录，填写 AppID，后端服务选择云开发。

3. 配置云开发环境

- 在 app.js 中将 wx.cloud.init 的 env 改为你的环境 ID，并保留 traceUser=true。
- 若需后台定位，请在管理后台完善权限说明，确保前后台定位权限已配置。

4. 部署云函数

- 在云开发面板，右键 cloudfunctions/checkIn、cloudfunctions/login、cloudfunctions/verifyAdmin，选择「上传并部署」→「云端安装依赖」。
- login 云函数需配置 APP_SECRET：
  - 优先在云函数环境变量中设置 APP_SECRET；
  - 或在 cloudfunctions/login/config.json 写入 {"APP_SECRET": "xxx"}（开发调试兜底）。
- verifyAdmin 云函数需配置管理员密钥：
  - 在云函数环境变量设置 `ADMIN_TOTP_SECRET=你的Base32密钥`（可用 Google Authenticator 导入）。
  - 修改密钥后需重新部署 verifyAdmin 使其生效。

5. 初始化数据库

- 在云开发控制台新建集合：
  - checkInRecords（仅创建者可读写）。
  - userInfo（仅创建者可读写）。

6. 配置公司位置（可选）

- 设置页修改公司位置前需通过 TOTP 验证；验证通过 10 分钟内可重复修改，无需再次输入。
- 在设置页手动选择/输入经纬度，或直接在 app.js 的 globalData.companyLocation 修改默认 lat/lng/radius。

7. 预览与发布

- 在微信开发者工具点击「预览」扫码体验，验证打卡与记录展示后即可上传审核发布。

## 数据模型

- checkInRecords：
  - openid：用户标识（云函数写入）。
  - type：'on' | 'off'。
  - checkInTime：时间戳。
  - location：{ lat, lng }。
  - status：'normal' | 'late' | 'early'。
  - createdAt：服务端时间。
- userInfo：
  - openid、nickName、avatarUrl、createTime、updateTime。

## 云函数说明

- checkIn：校验距离（Haversine），超出半径返回提示；根据打卡类型判定迟到/早退；写入 checkInRecords 并回传状态。
- login：优先 getWXContext 获取 openid；缺失时用 code2Session（需 APP_SECRET）；失败则提示配置缺失并允许前端降级使用临时 openid。

## 页面交互提示

- 首页：未授权位置时弹窗引导；实时更新时钟与地图；按钮禁用状态避免重复打卡。
- 历史页：按时间范围查询并倒序展示，空列表提示。
- 设置页：本地读取用户信息，不强制授权；提供修改公司位置、清除缓存、关于信息入口。

## 常见问题

- 「不在打卡范围内」：检查公司经纬度与半径配置，或在设置页重新保存位置；确保手机定位已开启且精度高。
- 登录不返回 openid：确认 login 云函数部署成功并已配置 APP_SECRET；必要时检查云开发环境是否一致。
- 云函数部署失败：使用「云端安装依赖」，网络异常时重试或在本地重新 npm 安装后再部署。

## 许可证

MIT License
