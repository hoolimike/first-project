# 🇺🇸 US Cloud PC - 美国云电脑系统

这是一个高仿真、全交互式的**美国云电脑 (Web Cloud PC)** 网页操作系统。它不仅提供原生美西数据中心视角的桌面操作体验，还内置了**远程桌面客户端 (Web RDP/SSH)** 以及**真实海外云电脑（Oracle / AWS / Shadow）开通与搭建完全指南**。

在线体验预览链接：[点击访问云电脑](https://antigravity.luch.dev/site/7c3e5732-a60a-46ec-bc9f-5abaf2b1f04b/1d12f73fbad56f568320d788/)

---

## 🌟 核心特性

1. **Windows 11 拟态桌面环境**:
   - 包含开始菜单、任务栏、时钟日历、实时硬件资源监控（CPU / RAM / 延迟）。
   - 支持多窗口拖拽、最大化、最小化、层叠交互，移动端自适应。

2. **🌐 内置美西浏览器 (Google Chrome)**:
   - 预设 Google 搜索、ChatGPT、YouTube、GitHub、IP 属地检测及 X/Twitter 快捷入口。
   - 交互式模拟搜索与原生美国网络出口环境演示。

3. **💻 PowerShell / Bash 云终端**:
   - 支持高频运维命令：`neofetch` / `fastfetch`、`curl ifconfig.me`、`ping`、`speedtest`、`ls`、`whoami`、`reboot` 等。

4. **🖥️ 远程桌面连接器 (Web RDP / SSH / VNC)**:
   - 可输入真实的 VPS IP、端口（3389 / 22 / 5900）、账号与密码，连接真实云服务器。

5. **📖 真实美国云电脑开通全流程指南**:
   - **甲骨文 Oracle Cloud**: 终身免费 4C 24G 实例配置教程。
   - **AWS Lightsail / EC2**: 12 个月免费体验与正版 Windows Server 极速开通。
   - **Shadow PC**: 独显 4K 60FPS 游戏与设计串流云电脑介绍。
   - **一键脚本**: Ubuntu / Debian 一键安装 XRDP 图形桌面。

6. **🚀 美国骨干网络测速 (Speedtest)**:
   - 实时动态模拟洛杉矶 Equinix LA3 节点的千兆带宽下行与上行测速。

7. **⚙️ 全球多节点切换**:
   - 支持在美西·洛杉矶、美东·弗吉尼亚、美西·硅谷及亚太·东京节点之间快速切换。

---

## 📁 项目结构

- [`index.html`](file:///home/agent/workspace/index.html): 主页面结构与各个云应用的窗口模板
- [`style.css`](file:///home/agent/workspace/style.css): Windows 11 Fluent 玻璃拟态设计样式表及响应式移动端适配
- [`app.js`](file:///home/agent/workspace/app.js): 窗口管理器、应用逻辑交互及实时数据模拟
- [`README.md`](file:///home/agent/workspace/README.md): 项目说明文档
