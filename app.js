// ============================================================
// US Cloud PC - Web OS Interactive Controller
// ============================================================

(function () {
  'use strict';

  // Global State
  const state = {
    activeApp: null,
    highestZ: 100,
    windows: {},
    region: {
      name: '美国·洛杉矶 (US-West)',
      ip: '104.28.19.82',
      ping: 138,
      datacenter: 'Equinix LA3 - Los Angeles, CA'
    },
    metrics: {
      cpu: 14,
      ram: 3.8,
      ping: 138
    }
  };

  // Toast Notification helper
  function showToast(title, message, icon = 'fa-circle-info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <i class="fa-solid ${icon}" style="color: #38bdf8; font-size: 16px;"></i>
      <div>
        <div style="font-weight: 600; font-size: 13px;">${title}</div>
        <div style="color: #94a3b8; font-size: 11.5px; margin-top: 2px;">${message}</div>
      </div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'all 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // ================= Clock & Metrics System =================
  function initClock() {
    const timeEl = document.getElementById('clockTime');
    const dateEl = document.getElementById('clockDate');
    const updateTime = () => {
      const now = new Date();
      if (timeEl) {
        timeEl.textContent = now.toLocaleTimeString('zh-CN', { hour12: false });
      }
      if (dateEl) {
        dateEl.textContent = `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}`;
      }
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  function initMetricsSimulation() {
    const cpuMetric = document.getElementById('cpuMetric');
    const ramMetric = document.getElementById('ramMetric');
    const pingMetric = document.getElementById('pingVal');

    setInterval(() => {
      // Small fluctuation
      state.metrics.cpu = Math.floor(10 + Math.random() * 12);
      state.metrics.ram = (3.7 + Math.random() * 0.3).toFixed(1);
      const pingJitter = Math.floor(state.region.ping + (Math.random() * 6 - 3));

      if (cpuMetric) cpuMetric.textContent = `${state.metrics.cpu}%`;
      if (ramMetric) ramMetric.textContent = `${state.metrics.ram} / 16 GB`;
      if (pingMetric) pingMetric.textContent = `${pingJitter} ms`;
    }, 2800);
  }

  // ================= Window Management =================
  class WindowManager {
    constructor() {
      this.windows = {};
      this.init();
    }

    init() {
      const winElements = document.querySelectorAll('.app-window');
      winElements.forEach((el) => {
        const appId = el.dataset.appid;
        this.windows[appId] = {
          el,
          isMaximized: false,
          isMinimized: true,
          prevRect: null
        };

        // Window controls
        const btnMin = el.querySelector('.btn-min');
        const btnMax = el.querySelector('.btn-max');
        const btnClose = el.querySelector('.btn-close');

        if (btnMin) btnMin.addEventListener('click', (e) => { e.stopPropagation(); this.minimize(appId); });
        if (btnMax) btnMax.addEventListener('click', (e) => { e.stopPropagation(); this.toggleMaximize(appId); });
        if (btnClose) btnClose.addEventListener('click', (e) => { e.stopPropagation(); this.close(appId); });

        // Focus on click
        el.addEventListener('mousedown', () => this.bringToFront(appId));
        el.addEventListener('touchstart', () => this.bringToFront(appId), { passive: true });

        // Dragging
        const titlebar = el.querySelector('.window-titlebar');
        if (titlebar) {
          this.makeDraggable(el, titlebar, appId);
        }
      });
    }

    open(appId) {
      const win = this.windows[appId];
      if (!win) return;

      win.el.classList.remove('minimized');
      win.isMinimized = false;
      this.bringToFront(appId);

      // Taskbar active state
      this.updateTaskbarState(appId, true);

      // Auto center on mobile if needed
      if (window.innerWidth <= 768) {
        win.el.style.top = '0px';
        win.el.style.left = '0px';
        win.el.style.width = '100%';
        win.el.style.height = '100%';
      }
    }

    close(appId) {
      const win = this.windows[appId];
      if (!win) return;
      win.el.classList.add('minimized');
      win.isMinimized = true;
      this.updateTaskbarState(appId, false);
    }

    minimize(appId) {
      const win = this.windows[appId];
      if (!win) return;
      win.el.classList.add('minimized');
      win.isMinimized = true;
      this.updateTaskbarState(appId, false);
    }

    toggleMaximize(appId) {
      const win = this.windows[appId];
      if (!win) return;
      if (win.isMaximized) {
        win.el.classList.remove('maximized');
        win.isMaximized = false;
      } else {
        win.el.classList.add('maximized');
        win.isMaximized = true;
      }
      this.bringToFront(appId);
    }

    bringToFront(appId) {
      const win = this.windows[appId];
      if (!win) return;
      state.highestZ += 1;
      win.el.style.zIndex = state.highestZ;
      state.activeApp = appId;
    }

    updateTaskbarState(appId, isActive) {
      const btn = document.querySelector(`.tb-app-btn[data-app="${appId}"]`);
      if (btn) {
        if (isActive) btn.classList.add('active');
        else btn.classList.remove('active');
      }
    }

    makeDraggable(element, handle, appId) {
      let isDragging = false;
      let startX, startY, initialLeft, initialTop;

      const onMouseDown = (e) => {
        if (element.classList.contains('maximized')) return;
        if (window.innerWidth <= 768) return; // Disable drag on mobile

        isDragging = true;
        this.bringToFront(appId);
        startX = e.clientX || (e.touches && e.touches[0].clientX);
        startY = e.clientY || (e.touches && e.touches[0].clientY);

        const rect = element.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onMouseUp);
      };

      const onMouseMove = (e) => {
        if (!isDragging) return;
        const currentX = e.clientX || (e.touches && e.touches[0].clientX);
        const currentY = e.clientY || (e.touches && e.touches[0].clientY);
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;

        let newLeft = initialLeft + deltaX;
        let newTop = initialTop + deltaY;

        // Boundaries
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - 80));
        newLeft = Math.max(-element.offsetWidth + 100, Math.min(newLeft, window.innerWidth - 100));

        element.style.left = `${newLeft}px`;
        element.style.top = `${newTop}px`;
      };

      const onTouchMove = (e) => {
        if (isDragging) {
          e.preventDefault();
          onMouseMove(e);
        }
      };

      const onMouseUp = () => {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onMouseUp);
      };

      handle.addEventListener('mousedown', onMouseDown);
      handle.addEventListener('touchstart', onMouseDown, { passive: true });
    }
  }

  // ================= APP 1: Browser Logic =================
  function initBrowser(winMgr) {
    const browserBody = document.getElementById('browserBody');
    const browserUrl = document.getElementById('browserUrl');
    const bNavGo = document.getElementById('bNavGo');
    const bookmarks = document.querySelectorAll('.bm-item');

    function renderGooglePage(query = '') {
      browserUrl.value = query ? `https://www.google.com/search?q=${encodeURIComponent(query)}` : 'https://www.google.com';
      if (!query) {
        browserBody.innerHTML = `
          <div class="browser-card-hero">
            <div class="google-logo-mock">
              <span>G</span><span>o</span><span>o</span><span>g</span><span>l</span><span>e</span>
            </div>
            <div class="google-search-bar">
              <i class="fa-solid fa-magnifying-glass" style="color: #9aa0a6;"></i>
              <input type="text" id="mockSearchInput" placeholder="在 Google 上搜索或输入网址" autofocus>
              <i class="fa-solid fa-microphone" style="color: #4285f4; cursor: pointer;"></i>
            </div>
            <div style="display: flex; justify-content: center; gap: 10px; margin-top: 15px;">
              <button class="bar-btn" id="btnGoogleSearch" style="background:#f8f9fa; color:#3c4043; border: 1px solid #f8f9fa; padding: 7px 16px;">Google 搜索</button>
              <button class="bar-btn" id="btnGoogleLucky" style="background:#f8f9fa; color:#3c4043; border: 1px solid #f8f9fa; padding: 7px 16px;">手气不错</button>
            </div>
          </div>
          <div style="max-width: 680px; margin: 30px auto 0;">
            <div style="font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 10px;"><i class="fa-solid fa-fire text-danger"></i> 美国常用高频访问服务</div>
            <div class="browser-featured-grid">
              <div class="site-card" data-url="https://chatgpt.com">
                <div class="site-card-icon" style="background: #10a37f;"><i class="fa-solid fa-robot"></i></div>
                <div class="site-info">
                  <strong>ChatGPT</strong>
                  <span>原生美国 IP 无障碍流畅使用</span>
                </div>
              </div>
              <div class="site-card" data-url="https://www.youtube.com">
                <div class="site-card-icon" style="background: #ff0000;"><i class="fa-brands fa-youtube"></i></div>
                <div class="site-info">
                  <strong>YouTube</strong>
                  <span>4K 60FPS 极速秒开流媒体</span>
                </div>
              </div>
              <div class="site-card" data-url="https://github.com">
                <div class="site-card-icon" style="background: #24292f;"><i class="fa-brands fa-github"></i></div>
                <div class="site-info">
                  <strong>GitHub</strong>
                  <span>全球开发者代码库与 CI/CD</span>
                </div>
              </div>
              <div class="site-card" data-url="https://ipinfo.io">
                <div class="site-card-icon" style="background: #0284c7;"><i class="fa-solid fa-location-dot"></i></div>
                <div class="site-info">
                  <strong>IP 属地检测</strong>
                  <span>查看当前分配的原生美国住宅/机房 IP</span>
                </div>
              </div>
            </div>
          </div>
        `;

        const searchIn = document.getElementById('mockSearchInput');
        const searchBtn = document.getElementById('btnGoogleSearch');
        if (searchIn && searchBtn) {
          const doSearch = () => {
            if (searchIn.value.trim()) renderGooglePage(searchIn.value.trim());
          };
          searchBtn.addEventListener('click', doSearch);
          searchIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
        }
      } else {
        // Render search results
        browserBody.innerHTML = `
          <div style="max-width: 720px; margin: 10px auto; font-family: sans-serif;">
            <div style="font-size: 13px; color: #70757a; margin-bottom: 20px;">找到约 18,400,000 条结果 （用时 0.24 秒）</div>
            
            <div style="margin-bottom: 24px;">
              <div style="font-size: 12px; color: #202124;">https://antigravity.luch.dev &gt; us-cloud-pc</div>
              <a href="#" style="font-size: 19px; color: #1a0dab; text-decoration: none; font-weight: 500; display: block; margin: 3px 0 5px;">
                美国云电脑 (US Cloud PC) - 原生美国网络与 Windows 云桌面
              </a>
              <p style="font-size: 13.5px; color: #4d5156; line-height: 1.5;">
                专为跨境电商、海外开发、学术研究打造的高性能美国云电脑环境。具备原生洛杉矶/硅谷 BGP 线路、千兆下行带宽，免除网络延迟与连接烦恼。
              </p>
            </div>

            <div style="margin-bottom: 24px;">
              <div style="font-size: 12px; color: #202124;">https://oracle.com &gt; cloud &gt; free</div>
              <a href="#" style="font-size: 19px; color: #1a0dab; text-decoration: none; font-weight: 500; display: block; margin: 3px 0 5px;">
                Oracle Cloud 甲骨文永久免费服务器开通与配置
              </a>
              <p style="font-size: 13.5px; color: #4d5156; line-height: 1.5;">
                甲骨文提供最高 4核 24G 内存与 200G 免费引导卷，可自由安装 Windows 11 或 Ubuntu 桌面系统并配置 XRDP 远程连接。
              </p>
            </div>

            <div style="margin-bottom: 24px;">
              <div style="font-size: 12px; color: #202124;">https://aws.amazon.com &gt; lightsail</div>
              <a href="#" style="font-size: 19px; color: #1a0dab; text-decoration: none; font-weight: 500; display: block; margin: 3px 0 5px;">
                AWS Lightsail: 简单易用的虚拟私有服务器 (VPS)
              </a>
              <p style="font-size: 13.5px; color: #4d5156; line-height: 1.5;">
                在美西俄勒冈或美东弗吉尼亚一键启动 Windows Server 实例，首次注册支持免费试用体验。
              </p>
            </div>
            <button class="bar-btn" id="btnBackHome" style="background:#e2e8f0; color:#334155; margin-top: 10px;"><i class="fa-solid fa-arrow-left"></i> 返回 Google 首页</button>
          </div>
        `;
        const bBack = document.getElementById('btnBackHome');
        if (bBack) bBack.addEventListener('click', () => renderGooglePage());
      }

      // Hook click on featured cards
      document.querySelectorAll('.site-card').forEach(card => {
        card.addEventListener('click', () => {
          const url = card.dataset.url;
          renderTargetUrl(url);
        });
      });
    }

    function renderTargetUrl(url) {
      browserUrl.value = url;
      if (url.includes('chatgpt.com')) {
        browserBody.innerHTML = `
          <div style="background: #202123; color: #ececf1; min-height: 100%; border-radius: 8px; padding: 24px; display: flex; flex-direction: column; justify-content: space-between;">
            <div style="text-align: center; margin-top: 40px;">
              <div style="font-size: 32px; font-weight: 700; margin-bottom: 8px;">ChatGPT (US Node)</div>
              <div style="color: #10a37f; font-size: 13px;"><i class="fa-solid fa-circle-check"></i> 检测到原生美国网络环境，无任何地域限制</div>
            </div>
            <div style="max-width: 600px; margin: 40px auto 0; width: 100%;">
              <div style="background: #343541; padding: 12px 16px; border-radius: 8px; margin-bottom: 12px; font-size: 13px;">
                "你好！当前云电脑网络已配置为美国加州出口，你可以无缝使用 ChatGPT 4o、Claude 3.5 Sonnet、Midjourney 等全套海外 AI 服务。"
              </div>
            </div>
            <div style="max-width: 600px; margin: 0 auto; width: 100%; display: flex; gap: 8px;">
              <input type="text" placeholder="输入你想咨询的问题..." style="flex: 1; background: #40414f; border: 1px solid #565869; color: #fff; padding: 10px 14px; border-radius: 6px; outline: none;">
              <button class="btn-primary" style="width: 80px;" onclick="alert('已发送提示词！(演示模拟)')">发送</button>
            </div>
          </div>
        `;
      } else if (url.includes('ipinfo.io')) {
        browserBody.innerHTML = `
          <div style="max-width: 680px; margin: 20px auto; background: #0f172a; color: #f8fafc; border-radius: 12px; padding: 24px; border: 1px solid #334155;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 14px; margin-bottom: 16px;">
              <h3 style="margin: 0; font-size: 18px; color: #38bdf8;"><i class="fa-solid fa-shield-halved"></i> IP 属地与网络归属查询</h3>
              <span class="badge badge-us"><i class="fa-solid fa-check"></i> 美国本土原生</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 13px;">
              <div><strong>公网 IP 地址:</strong> <span style="color:#67e8f9; font-family: monospace;">${state.region.ip}</span></div>
              <div><strong>所在国家:</strong> <span>United States (美国) 🇺🇸</span></div>
              <div><strong>州/省份:</strong> <span>California (加利福尼亚州)</span></div>
              <div><strong>城市:</strong> <span>Los Angeles (洛杉矶)</span></div>
              <div><strong>网络运营商 (ISP):</strong> <span>Cogent Communications / Cloudflare Anycast</span></div>
              <div><strong>时区:</strong> <span>America/Los_Angeles (UTC-7 PST)</span></div>
              <div><strong>机房归属:</strong> <span>${state.region.datacenter}</span></div>
              <div><strong>DNS 泄漏测试:</strong> <span style="color: #4ade80;">安全 (无泄漏)</span></div>
            </div>
          </div>
        `;
      } else {
        browserBody.innerHTML = `
          <div style="text-align: center; padding: 50px 20px;">
            <i class="fa-solid fa-globe" style="font-size: 48px; color: #0284c7; margin-bottom: 16px;"></i>
            <h3>正在通过美国本地专线加载:</h3>
            <p style="color: #64748b; margin: 8px 0 20px; font-family: monospace;">${url}</p>
            <div class="tip-box" style="max-width: 500px; margin: 0 auto; text-align: left;">
              当前处于安全沙箱预览状态。在真实云电脑环境中，浏览器可直接全功能打开任意海外站点。
            </div>
            <button class="bar-btn" id="btnReturnGoogle" style="background:#0284c7; color:#fff; margin-top: 20px;">返回 Google 首页</button>
          </div>
        `;
        const retBtn = document.getElementById('btnReturnGoogle');
        if (retBtn) retBtn.addEventListener('click', () => renderGooglePage());
      }
    }

    // Default load
    renderGooglePage();

    if (bNavGo) {
      bNavGo.addEventListener('click', () => {
        const val = browserUrl.value.trim();
        if (val) renderTargetUrl(val.startsWith('http') ? val : `https://${val}`);
      });
    }

    if (browserUrl) {
      browserUrl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const val = browserUrl.value.trim();
          if (val) renderTargetUrl(val.startsWith('http') ? val : `https://${val}`);
        }
      });
    }

    bookmarks.forEach(bm => {
      bm.addEventListener('click', () => {
        const url = bm.dataset.url;
        renderTargetUrl(url);
      });
    });
  }

  // ================= APP 2: Terminal Logic =================
  function initTerminal() {
    const input = document.getElementById('terminalInput');
    const output = document.getElementById('terminalOutput');
    if (!input || !output) return;

    function appendLine(html, type = 'normal') {
      const div = document.createElement('div');
      div.className = `term-line ${type}`;
      div.innerHTML = html;
      output.appendChild(div);
      output.scrollTop = output.scrollHeight;
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = input.value.trim();
        input.value = '';
        if (!cmd) return;

        appendLine(`<span class="prompt-text">PS C:\\Users\\Admin&gt;</span> ${cmd}`);
        handleCommand(cmd.toLowerCase());
      }
    });

    function handleCommand(cmd) {
      if (cmd === 'help') {
        appendLine(`
可用命令列表:
  <span class="term-highlight">help</span>           - 显示帮助菜单
  <span class="term-highlight">curl ip / ifconfig</span>- 查询当前机器公网 IP 及地理位置
  <span class="term-highlight">neofetch / fastfetch</span>- 显示系统信息与硬件参数
  <span class="term-highlight">ping &lt;host&gt;</span>     - 测试美国网络与骨干路由延迟
  <span class="term-highlight">speedtest</span>       - 测试网络上下行带宽
  <span class="term-highlight">ls / dir</span>        - 列出当前目录文件
  <span class="term-highlight">whoami</span>          - 显示当前登录用户
  <span class="term-highlight">date</span>            - 显示美国服务器系统时间
  <span class="term-highlight">reboot</span>          - 重启云电脑实例
  <span class="term-highlight">clear / cls</span>     - 清屏
        `);
      } else if (cmd === 'clear' || cmd === 'cls') {
        output.innerHTML = '';
      } else if (cmd === 'curl ip' || cmd === 'ifconfig' || cmd.includes('ifconfig.me')) {
        appendLine(`
IP: <span class="term-highlight">${state.region.ip}</span>
Hostname: lax-core-gw01.cloud.local
Country: United States (US) 🇺🇸
Region: California (CA)
City: Los Angeles
Org: AS174 Cogent Communications / US Datacenter BGP
Status: <span class="term-success">Online & Connected</span>
        `);
      } else if (cmd === 'whoami') {
        appendLine('Administrator\\CloudHost-US-LAX');
      } else if (cmd === 'date') {
        appendLine(new Date().toUTCString() + ' (US-PST)');
      } else if (cmd === 'ls' || cmd === 'dir') {
        appendLine(`
    目录: C:\\Users\\Admin\\CloudPC

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a---          2026/10/11    08:24           4200 US_Cloud_Setup.txt
-a---          2026/10/11    09:15           1124 RDP_Credentials.txt
-a---          2026/10/11    09:30           2840 install_xrdp.sh
-a---          2026/10/11    10:02            860 US_Proxy_Config.json
        `);
      } else if (cmd.startsWith('ping')) {
        appendLine(`Pinging google.com [142.250.190.46] with 32 bytes of data:`);
        appendLine(`Reply from 142.250.190.46: bytes=32 time=1.2ms TTL=119`);
        appendLine(`Reply from 142.250.190.46: bytes=32 time=1.1ms TTL=119`);
        appendLine(`Reply from 142.250.190.46: bytes=32 time=1.3ms TTL=119`);
        appendLine(`Ping statistics for 142.250.190.46: Packets: Sent = 3, Received = 3, Lost = 0 (0% loss)`);
        appendLine(`<span class="term-success">美国本土骨干直连延迟: 平均 1.2ms (极速)</span>`);
      } else if (cmd === 'neofetch' || cmd === 'fastfetch') {
        appendLine(`
<span style="color:#00adef;">
       .---.          </span><span class="term-highlight">Admin@US-LAX-VM01</span>
<span style="color:#00adef;">      /     \\         </span>-----------------
<span style="color:#00adef;">     | () () |        </span><span style="color:#94a3b8;">OS:</span> Windows 11 Enterprise Cloud (24H2)
<span style="color:#00adef;">      \\  _  /         </span><span style="color:#94a3b8;">Host:</span> KVM Virtual Cloud Machine (US-West)
<span style="color:#00adef;">       \`---\`          </span><span style="color:#94a3b8;">Kernel:</span> 10.0.22631.3296
<span style="color:#00adef;">                      </span><span style="color:#94a3b8;">Uptime:</span> 14 days, 6 hours, 28 mins
<span style="color:#00adef;">                      </span><span style="color:#94a3b8;">CPU:</span> AMD EPYC 7763 (8 vCPU) @ 3.40GHz
<span style="color:#00adef;">                      </span><span style="color:#94a3b8;">GPU:</span> NVIDIA Cloud Virtual GPU (RTX Direct)
<span style="color:#00adef;">                      </span><span style="color:#94a3b8;">Memory:</span> 3890MiB / 16384MiB (23%)
<span style="color:#00adef;">                      </span><span style="color:#94a3b8;">Disk:</span> 38GiB / 256GiB NVMe SSD
<span style="color:#00adef;">                      </span><span style="color:#94a3b8;">Public IP:</span> ${state.region.ip} (USA)
`);
      } else if (cmd === 'speedtest') {
        appendLine('Testing bandwidth to Los Angeles, CA Speedtest Server...');
        setTimeout(() => appendLine('Latency: 1.8ms | Jitter: 0.2ms'), 400);
        setTimeout(() => appendLine('Download: <span class="term-success">942.85 Mbps</span>'), 900);
        setTimeout(() => appendLine('Upload:   <span class="term-success">468.20 Mbps</span>'), 1400);
      } else if (cmd === 'reboot') {
        appendLine('<span class="term-warning">System is rebooting... Please wait.</span>');
        setTimeout(() => {
          showToast('系统重启完成', '云电脑系统已重新载入并保持美西 IP。', 'fa-rotate-right');
          appendLine('<span class="term-success">Host rebooted successfully. All services active.</span>');
        }, 1500);
      } else {
        appendLine(`<span class="term-error">'${cmd}' 未识别为此系统的命令。键入 'help' 查看指令集。</span>`);
      }
    }
  }

  // ================= APP 3: Connector (RDP/SSH) =================
  function initConnector() {
    const btnConnect = document.getElementById('btnConnectNow');
    const btnDemo = document.getElementById('btnQuickDemo');
    const statusBox = document.getElementById('connStatusBox');
    const tabs = document.querySelectorAll('.c-tab');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const proto = tab.dataset.proto;
        const portInput = document.getElementById('connPort');
        if (portInput) {
          if (proto === 'rdp') portInput.value = '3389';
          else if (proto === 'ssh') portInput.value = '22';
          else if (proto === 'vnc') portInput.value = '5900';
        }
      });
    });

    if (btnConnect) {
      btnConnect.addEventListener('click', () => {
        const host = document.getElementById('connHost').value;
        statusBox.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-info"></i> 正在向 <strong>${host}</strong> 发起远程握手与身份验证...`;
        setTimeout(() => {
          statusBox.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> <strong>连接成功！</strong> 远程桌面会话已无缝映射到当前云工作台。`;
          showToast('远程桌面已就绪', `成功连接至 ${host} (美西骨干直连)`, 'fa-plug');
        }, 1200);
      });
    }

    if (btnDemo) {
      btnDemo.addEventListener('click', () => {
        showToast('演示实例启动', '已切换为洛杉矶高速图形桌面会话。', 'fa-play');
      });
    }
  }

  // ================= APP 4: Guide Content Logic =================
  function initGuide() {
    const guideContent = document.getElementById('guideContent');
    const tabButtons = document.querySelectorAll('.g-tab-btn');

    const guides = {
      free: `
        <h2><i class="fa-solid fa-gift" style="color: #f59e0b;"></i> 免费与低成本美国云电脑开通全览</h2>
        <p>如果你希望获得一台<strong>24小时不关机、拥有独立美国公网 IP</strong>的真实云电脑，以下为目前全球最主流、高性价比的正规方案：</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 18px 0;">
          <div style="background: rgba(15,23,42,0.6); padding: 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
            <strong style="color: #38bdf8; font-size: 14px;"><i class="fa-solid fa-crown"></i> 甲骨文 Oracle Cloud</strong>
            <p style="font-size: 12px; margin: 6px 0;">永久免费 (Always Free)，提供 4核 ARM + 24G 内存 + 200G 硬盘，性能极强，可一键安装 Windows 或 Ubuntu 桌面。</p>
            <span class="badge badge-us">首选推荐 · 0 元终身</span>
          </div>
          <div style="background: rgba(15,23,42,0.6); padding: 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
            <strong style="color: #f59e0b; font-size: 14px;"><i class="fa-brands fa-aws"></i> AWS Lightsail / EC2</strong>
            <p style="font-size: 12px; margin: 6px 0;">新用户提供 12 个月免费体验，支持美西俄勒冈、美东弗吉尼亚原生机房，开机即带正版 Windows Server 桌面。</p>
            <span class="badge badge-ip">全球第一 · 稳定合规</span>
          </div>
          <div style="background: rgba(15,23,42,0.6); padding: 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
            <strong style="color: #4ade80; font-size: 14px;"><i class="fa-solid fa-server"></i> Vultr / Kamatera</strong>
            <p style="font-size: 12px; margin: 6px 0;">支持按小时计费（最低 $2.5-$5/月），支持一键安装 Windows 10/11 原生镜像，国内连洛杉矶/硅谷速度极佳。</p>
            <span class="badge" style="background:#334155;">开箱即用 · 按小时计费</span>
          </div>
          <div style="background: rgba(15,23,42,0.6); padding: 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
            <strong style="color: #c084fc; font-size: 14px;"><i class="fa-solid fa-gamepad"></i> Shadow PC (云游戏电脑)</strong>
            <p style="font-size: 12px; margin: 6px 0;">带独立 GPU (RTX 系列)，专门用于 4K 60FPS 游戏、3D渲染与视频剪辑，提供类似本机的高清串流体验。</p>
            <span class="badge" style="background:#4c1d95;">独立显卡 · 极清串流</span>
          </div>
        </div>

        <div class="tip-box">
          <strong>新手提示:</strong> 注册海外云厂商一般需要一张支持外币的双币信用卡（Visa/Mastercard）用于通过身份实名验证。
        </div>
      `,
      oracle: `
        <h2><i class="fa-solid fa-cloud" style="color: #38bdf8;"></i> 甲骨文 Oracle Cloud 永久免费云电脑开通</h2>
        <p>甲骨文的 Always Free 配额是目前云厂商中最大方的福利，以下是完整流程：</p>
        <ol class="guide-steps">
          <li><strong>注册账户:</strong> 前往 <code style="color:#38bdf8;">oracle.com/cloud/free</code> 注册，主区域推荐选择 <strong>US West (San Jose 或 Phoenix)</strong>，到国内延迟较低。</li>
          <li><strong>创建计算实例:</strong> 架构选择 <strong>Ampere ARM</strong>，配置调为 <strong>4 OCPU + 24 GB 内存 + 100~200 GB 引导卷</strong>。</li>
          <li><strong>选择镜像:</strong> 可以选择 Ubuntu 22.04 / 24.04（后续一键安装 XFCE + XRDP 桌面），或使用 DD 脚本安装精简版 Windows 10/11。</li>
          <li><strong>开放安全列表端口:</strong> 在 VCN 虚拟云网络入站规则中，添加入站规则：放行 <strong>3389 端口 (RDP)</strong> 与 <strong>22 端口 (SSH)</strong>。</li>
          <li><strong>连接使用:</strong> 在手机或电脑上打开微软官方「Microsoft Remote Desktop」软件，输入你的甲骨文公网 IP 即可畅爽连接！</li>
        </ol>
      `,
      aws: `
        <h2><i class="fa-brands fa-aws" style="color: #f59e0b;"></i> AWS Lightsail / EC2 一键开启美西 Windows</h2>
        <p>亚马逊 AWS 是全球稳定性最高的云平台，非常适合新手 5 分钟极速上车：</p>
        <ol class="guide-steps">
          <li><strong>进入控制台:</strong> 登录 AWS 后，直接搜索进入 <strong>Lightsail</strong> (界面比 EC2 简洁许多)。</li>
          <li><strong>选择实例位置:</strong> 选择 <strong>美国西部 (俄勒冈 - us-west-2)</strong>。</li>
          <li><strong>选择平台与蓝图:</strong> 平台选择 <strong>Microsoft Windows</strong>，蓝图选择 <strong>Windows Server 2022 / 2019</strong>。</li>
          <li><strong>获取登录密码:</strong> 实例启动后（约 2 分钟），点击页面上的「连接」标签，选择「检索默认密码」。</li>
          <li><strong>浏览器直连或本地 RDP:</strong> 你可以直接在网页内点击「使用 RDP 客户端连接」，也可以将 IP 和密码填入本地远程桌面。</li>
        </ol>
      `,
      shadow: `
        <h2><i class="fa-solid fa-gamepad" style="color: #c084fc;"></i> Shadow PC 商业级高性能图形云电脑</h2>
        <p>如果你需要玩大型 3A 游戏、跑 Stable Diffusion 绘图，普通无显卡 VPS 会卡顿，此时 Shadow PC 是最佳选择：</p>
        <ul class="guide-steps">
          <li><strong>官方配置:</strong> Intel Xeon/AMD 处理器 + 16GB 内存 + NVIDIA GeForce RTX 3070Ti 等级显卡 + 512GB SSD。</li>
          <li><strong>串流协议:</strong> 自研的高效低延迟 H.265 / AV1 视频串流协议，支持原生 4K 分辨率、60-144 FPS。</li>
          <li><strong>外设支持:</strong> 手机、平板、轻薄笔记本均可安装 Shadow 客户端，并完美支持外接游戏手柄、鼠标侧键及双显示器。</li>
        </ul>
      `,
      script: `
        <h2><i class="fa-solid fa-code" style="color: #4ade80;"></i> Ubuntu 快速一键安装 Windows 风格图形桌面 (XRDP)</h2>
        <p>若你开通了纯 Linux 的美国 VPS，只需 SSH 连接后运行以下脚本，即可秒变图形桌面，支持微软远程桌面连接：</p>
        <div class="code-box">
          <button class="copy-btn" id="btnCopyScript"><i class="fa-regular fa-copy"></i> 复制代码</button>
# 1. 更新系统软件包
sudo apt update && sudo apt upgrade -y

# 2. 一键安装轻量级桌面环境 XFCE 与 XRDP 远程服务
sudo apt install -y xfce4 xfce4-goodies xrdp

# 3. 配置 XRDP 启动桌面
echo "xfce4-session" > ~/.xsession
sudo systemctl enable xrdp
sudo systemctl restart xrdp

# 4. 创建图形桌面登录用户 (或修改现有密码)
sudo passwd root
        </div>
        <p>执行完成后，即可使用系统的 3389 端口进行远程桌面连接！</p>
      `
    };

    function loadTab(guideKey) {
      tabButtons.forEach(btn => {
        if (btn.dataset.guide === guideKey) btn.classList.add('active');
        else btn.classList.remove('active');
      });
      guideContent.innerHTML = guides[guideKey] || guides.free;

      const btnCopy = document.getElementById('btnCopyScript');
      if (btnCopy) {
        btnCopy.addEventListener('click', () => {
          showToast('已复制脚本', '脚本已复制到系统剪贴板，可直接粘贴运行。', 'fa-copy');
        });
      }
    }

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        loadTab(btn.dataset.guide);
      });
    });

    loadTab('free');
  }

  // ================= APP 5: Speedtest Logic =================
  function initSpeedtest() {
    const btnStart = document.getElementById('btnStartSpeedtest');
    const dlSpeed = document.getElementById('dlSpeed');
    const ulSpeed = document.getElementById('ulSpeed');
    const dlBar = document.getElementById('dlBar');
    const ulBar = document.getElementById('ulBar');
    const pingEl = document.getElementById('speedPing');
    const jitterEl = document.getElementById('speedJitter');

    if (!btnStart) return;

    let isTesting = false;

    btnStart.addEventListener('click', () => {
      if (isTesting) return;
      isTesting = true;
      btnStart.disabled = true;
      btnStart.textContent = '测速中...';

      // Phase 1: Ping & Jitter
      pingEl.textContent = '1.8 ms';
      jitterEl.textContent = '0.3 ms';

      // Phase 2: Download test
      let step = 0;
      const dlInterval = setInterval(() => {
        step++;
        const currentSpeed = (Math.min(945, step * 48 + Math.random() * 20)).toFixed(2);
        dlSpeed.textContent = currentSpeed;
        dlBar.style.width = `${Math.min(100, (currentSpeed / 1000) * 100)}%`;

        if (step >= 20) {
          clearInterval(dlInterval);
          dlSpeed.textContent = '942.85';
          dlBar.style.width = '94.2%';

          // Phase 3: Upload test
          let uStep = 0;
          const ulInterval = setInterval(() => {
            uStep++;
            const uSpeed = (Math.min(480, uStep * 25 + Math.random() * 15)).toFixed(2);
            ulSpeed.textContent = uSpeed;
            ulBar.style.width = `${Math.min(100, (uSpeed / 500) * 100)}%`;

            if (uStep >= 20) {
              clearInterval(ulInterval);
              ulSpeed.textContent = '468.20';
              ulBar.style.width = '93.6%';
              btnStart.disabled = false;
              btnStart.textContent = '重新测速';
              isTesting = false;
              showToast('测速完成', '美国机房骨干线路千兆下行测试达标 (942.85 Mbps)', 'fa-gauge-simple-high');
            }
          }, 60);
        }
      }, 60);
    });
  }

  // ================= APP 6 & 7: Explorer & Notepad =================
  function initExplorerAndNotepad(winMgr) {
    const fileItems = document.querySelectorAll('.file-item');
    const notepadText = document.getElementById('notepadText');
    const btnSave = document.getElementById('btnSaveNotepad');

    fileItems.forEach(item => {
      item.addEventListener('dblclick', () => {
        const fileName = item.querySelector('.file-name').textContent;
        openFileInNotepad(fileName);
      });
      // Mobile tap support
      item.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          const fileName = item.querySelector('.file-name').textContent;
          openFileInNotepad(fileName);
        }
      });
    });

    function openFileInNotepad(fileName) {
      winMgr.open('notepad');
      const winNotepad = document.getElementById('win-notepad');
      if (winNotepad) {
        winNotepad.querySelector('.window-title').innerHTML = `<i class="fa-regular fa-file-lines"></i> 记事本 - ${fileName}`;
      }
      if (fileName.includes('RDP_Credentials')) {
        notepadText.value = `[US Cloud PC Remote Credentials]
Host: ${state.region.ip}
Port: 3389 (RDP)
Protocol: Remote Desktop Protocol 10.0
Username: Administrator
Password: US_Cloud_Pass_2026!#
Status: Active & Authorized
Created: 2026-10-11`;
      } else if (fileName.includes('install_xrdp')) {
        notepadText.value = `#!/bin/bash
# Automatic XRDP installer for US Ubuntu Cloud VM
set -e
echo "Installing desktop GUI..."
sudo apt update && sudo apt install -y xfce4 xfce4-goodies xrdp
echo "xfce4-session" > ~/.xsession
sudo systemctl enable xrdp && sudo systemctl restart xrdp
echo "Done! Cloud PC ready on port 3389."`;
      }
      showToast('文件已载入', `已在记事本中打开 ${fileName}`, 'fa-file-lines');
    }

    if (btnSave) {
      btnSave.addEventListener('click', () => {
        showToast('保存成功', '文档内容已保存至 C:\\Users\\Admin\\CloudPC', 'fa-floppy-disk');
      });
    }
  }

  // ================= APP 8: Settings (Node Switcher) =================
  function initSettings() {
    const nodeCards = document.querySelectorAll('.node-card');
    const displayIp = document.getElementById('displayIp');
    const badgeUs = document.querySelector('.badge-us');

    nodeCards.forEach(card => {
      card.addEventListener('click', () => {
        nodeCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        const regionName = card.dataset.name;
        const ip = card.dataset.ip;
        const ping = parseInt(card.dataset.ping, 10);

        state.region.name = regionName;
        state.region.ip = ip;
        state.region.ping = ping;

        if (displayIp) displayIp.innerHTML = `<i class="fa-solid fa-network-wired"></i> ${ip}`;
        if (badgeUs) badgeUs.innerHTML = `<i class="fa-solid fa-flag-usa"></i> ${regionName.split('·')[1] || regionName}`;

        showToast('节点切换成功', `已切换至 ${regionName} (IP: ${ip})`, 'fa-globe');
      });
    });

    const chkDark = document.getElementById('chkDarkMode');
    if (chkDark) {
      chkDark.addEventListener('change', (e) => {
        if (!e.target.checked) {
          document.body.style.filter = 'brightness(1.15)';
        } else {
          document.body.style.filter = 'none';
        }
      });
    }
  }

  // ================= Top Remote Bar & System Buttons =================
  function initSystemControls(winMgr) {
    const btnRestart = document.getElementById('btnRestart');
    const btnToggleFs = document.getElementById('btnToggleFs');
    const btnGuideHeader = document.getElementById('btnGuideHeader');
    const btnPower = document.getElementById('btnPower');

    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        showToast('正在重启云电脑', '实例正重新连接至美西机房...', 'fa-rotate-right');
        setTimeout(() => {
          showToast('重启完毕', '美国云电脑桌面已就绪。', 'fa-circle-check');
        }, 1500);
      });
    }

    if (btnToggleFs) {
      btnToggleFs.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
          btnToggleFs.innerHTML = '<i class="fa-solid fa-compress"></i> 退出全屏';
        } else {
          document.exitFullscreen().catch(() => {});
          btnToggleFs.innerHTML = '<i class="fa-solid fa-expand"></i> 全屏';
        }
      });
    }

    if (btnGuideHeader) {
      btnGuideHeader.addEventListener('click', () => {
        winMgr.open('guide');
      });
    }

    if (btnPower) {
      btnPower.addEventListener('click', () => {
        showToast('电源管理', '实例休眠与定时挂机保护已开启。', 'fa-power-off');
      });
    }
  }

  // ================= Desktop Icons & Start Menu Setup =================
  function initDesktopAndStart(winMgr) {
    const startMenu = document.getElementById('startMenu');
    const btnStart = document.getElementById('btnStart');

    // Desktop icons click
    document.querySelectorAll('.desktop-icon').forEach(icon => {
      icon.addEventListener('dblclick', () => {
        const app = icon.dataset.app;
        if (app) winMgr.open(app);
      });
      // Mobile tap
      icon.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          const app = icon.dataset.app;
          if (app) winMgr.open(app);
        }
      });
    });

    // Start menu toggle
    if (btnStart && startMenu) {
      btnStart.addEventListener('click', (e) => {
        e.stopPropagation();
        startMenu.classList.toggle('open');
      });

      document.addEventListener('click', (e) => {
        if (!startMenu.contains(e.target) && e.target !== btnStart) {
          startMenu.classList.remove('open');
        }
      });
    }

    // Start menu items click
    document.querySelectorAll('.start-item').forEach(item => {
      item.addEventListener('click', () => {
        const app = item.dataset.app;
        if (app) {
          winMgr.open(app);
          startMenu.classList.remove('open');
        }
      });
    });

    // Taskbar app buttons click
    document.querySelectorAll('.tb-app-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const app = btn.dataset.app;
        if (!app) return;
        const win = winMgr.windows[app];
        if (win && !win.isMinimized && state.activeApp === app) {
          winMgr.minimize(app);
        } else {
          winMgr.open(app);
        }
      });
    });
  }

  // ================= App Initialization =================
  document.addEventListener('DOMContentLoaded', () => {
    initClock();
    initMetricsSimulation();

    const winMgr = new WindowManager();

    initBrowser(winMgr);
    initTerminal();
    initConnector();
    initGuide();
    initSpeedtest();
    initExplorerAndNotepad(winMgr);
    initSettings();
    initSystemControls(winMgr);
    initDesktopAndStart(winMgr);

    // Open default apps for quick showcase
    setTimeout(() => {
      winMgr.open('guide');
      winMgr.open('browser');
      showToast('美国云电脑已就绪', '已自动连入洛杉矶数据中心，欢迎使用！', 'fa-cloud');
    }, 300);
  });
})();
