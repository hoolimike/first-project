# 🇺🇸 美国 IP 代理节点与服务器搭建中心 (US Proxy & Node Hub)

本项目为你提供将手机或电脑网络环境完整切换为**美国原生 IP**的保姆级完整方案。

在线工具与配置中心：[点击打开配置中心](https://antigravity.luch.dev/site/7c3e5732-a60a-46ec-bc9f-5abaf2b1f04b/1d12f73fbad56f568320d788/)

---

## 💡 核心原理与必要三要素

让手机变成美国环境必须满足三个要素：
1. **拥有 1 台位于美国的云服务器 (VPS)**：提供真实的美国本土公网 IP 地址。
2. **在服务器上部署代理服务协议**：推荐当前最抗封锁的 **VLESS-Reality** 或极速 **Hysteria 2**，或可视化 **3X-UI** 面板。
3. **手机客户端连接**：苹果手机使用 **Shadowrocket (小火箭)**，安卓手机使用 **v2rayNG** 或 **Clash Meta** 扫码导入。

---

## 🚀 完整四步闭环操作

### 第一步：获取一台便宜的美国 VPS (带美国公网 IP)
- **新手首选**：[RackNerd](https://www.racknerd.com)（每年仅约 $11~$14 美元，支持国内支付宝扫码付款，洛杉矶/西雅图机房，原生美国 IP）。
- **永久 0 元**：[甲骨文云 Oracle Cloud](https://www.oracle.com/cloud/free/)（Always Free 永久免费，需外币信用卡）。
- **极速 CN2 专线**：[搬瓦工 BandwagonHost](https://bwh88.net)（中美顶级专线，延迟低）。

### 第二步：登录 VPS 运行一键脚本
使用 SSH 连接你的服务器，运行以下一键脚本部署可视化管理面板：
```bash
# 一键安装 3X-UI 网页管理面板 (小白首选)
bash <(curl -Ls https://raw.githubusercontent.com/mhsanaei/3x-ui/master/install.sh)
```
安装后在浏览器打开 `http://你的美国IP:2053`，点击「添加入站」选择 VLESS 协议，即可直接获取节点二维码。

### 第三步：生成节点链接与二维码
在在线工具的第三步中输入你的 VPS IP 与 UUID，网页会自动生成：
- 标准 `vless://...` 节点分享链接
- 手机客户端扫码专用的二维码图片

### 第四步：手机端扫码连接
- **苹果 iOS**：使用美区 Apple ID 下载 **Shadowrocket (小火箭)**，点击右上角扫描二维码即可一键添加并启动。
- **安卓 Android**：下载安装 **v2rayNG**，点击「+」扫描二维码导入，点击连接即可全局变身美国网络。
- **验证效果**：手机打开浏览器访问 `ipinfo.io`，查看国家是否显示为 `United States 🇺🇸`。

---

## 📁 项目文件结构

- [`index.html`](file:///home/agent/workspace/index.html)：美国 IP 节点与服务器中心主界面
- [`style.css`](file:///home/agent/workspace/style.css)：现代化暗色极客风格与移动端响应式样式表
- [`app.js`](file:///home/agent/workspace/app.js)：节点链接合成、实时二维码生成与一键复制逻辑
- [`manifest.json`](file:///home/agent/workspace/manifest.json)：PWA 移动端配置
- [`README.md`](file:///home/agent/workspace/README.md)：项目操作指南
