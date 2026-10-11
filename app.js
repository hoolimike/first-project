// ============================================================
// US Proxy Node & Server Hub Controller
// ============================================================

(function () {
  'use strict';

  // Global Toast function
  function showToast(message, icon = 'fa-check') {
    const box = document.getElementById('toastBox');
    if (!box) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid ${icon}" style="color: #38bdf8;"></i> <span>${message}</span>`;
    box.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'all 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // Copy helper
  function copyText(text, successMsg = '已复制到剪贴板') {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => showToast(successMsg, 'fa-copy'));
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showToast(successMsg, 'fa-copy');
      } catch (e) {
        showToast('复制失败，请手动选择复制', 'fa-triangle-exclamation');
      }
      document.body.removeChild(textarea);
    }
  }

  // ================= 1. Step Tab Switching =================
  function initStepTabs() {
    const tabBtns = document.querySelectorAll('.step-tab-btn');
    const panes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        tabBtns.forEach(b => b.classList.remove('active'));
        panes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPane = document.getElementById(`pane-${targetTab}`);
        if (targetPane) {
          targetPane.classList.add('active');
          window.scrollTo({ top: 120, behavior: 'smooth' });
        }
      });
    });
  }

  // ================= 2. Script Tabs in Step 2 =================
  function initScriptTabs() {
    const sTabs = document.querySelectorAll('.s-tab');
    const sDetails = document.querySelectorAll('.script-detail');

    sTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const scriptId = tab.dataset.script;
        sTabs.forEach(t => t.classList.remove('active'));
        sDetails.forEach(d => d.classList.remove('active'));

        tab.classList.add('active');
        const targetDetail = document.getElementById(`sec-${scriptId}`);
        if (targetDetail) targetDetail.classList.add('active');
      });
    });

    // Code copy buttons
    document.querySelectorAll('.btn-copy-code').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          copyText(targetEl.textContent.trim(), '一键安装脚本已复制！可在 SSH 终端粘贴');
        }
      });
    });
  }

  // ================= 3. Node Generator & QR Code =================
  function initNodeGenerator() {
    const inName = document.getElementById('genName');
    const inIp = document.getElementById('genIp');
    const inPort = document.getElementById('genPort');
    const inUuid = document.getElementById('genUuid');
    const inPubkey = document.getElementById('genPubkey');
    const inSni = document.getElementById('genSni');

    const btnMake = document.getElementById('btnMakeNode');
    const btnRandomUuid = document.getElementById('btnGenRandomUuid');
    const btnCopyUrl = document.getElementById('btnCopyUrl');

    const outUrl = document.getElementById('nodeUrlOutput');
    const qrImg = document.getElementById('qrImg');

    // Generate random v4 UUID
    function generateUuid() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }

    if (btnRandomUuid) {
      btnRandomUuid.addEventListener('click', () => {
        const newUuid = generateUuid();
        if (inUuid) inUuid.value = newUuid;
        showToast('已生成全新随机 UUID 密钥', 'fa-arrows-rotate');
        buildNode();
      });
    }

    function buildNode() {
      const name = encodeURIComponent(inName.value.trim() || 'US-Server');
      const ip = inIp.value.trim() || '104.28.19.82';
      const port = inPort.value.trim() || '443';
      const uuid = inUuid.value.trim() || generateUuid();
      const pubkey = encodeURIComponent(inPubkey.value.trim() || '9s8df7ys9d8f7ys9df7y9s8df7y9s8d');
      const sni = inSni.value.trim() || 'gateway.icloud.com';

      // Construct standard VLESS-Reality link
      // vless://uuid@host:port?security=reality&sni=sni&fp=chrome&pbk=pubkey&type=tcp#name
      const vlessUrl = `vless://${uuid}@${ip}:${port}?security=reality&sni=${sni}&fp=chrome&pbk=${pubkey}&type=tcp#${name}`;

      if (outUrl) outUrl.value = vlessUrl;

      // Update QR Code
      if (qrImg) {
        const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(vlessUrl)}`;
        qrImg.src = qrApi;
      }
    }

    if (btnMake) {
      btnMake.addEventListener('click', () => {
        buildNode();
        showToast('节点链接与二维码已生成！手机可直接扫码', 'fa-wand-magic-sparkles');
      });
    }

    if (btnCopyUrl) {
      btnCopyUrl.addEventListener('click', () => {
        if (outUrl && outUrl.value) {
          copyText(outUrl.value, '节点链接已复制！可直接在小火箭/v2rayNG粘贴导入');
        }
      });
    }

    // Default generation on load
    buildNode();
  }

  // ================= Initialize All =================
  document.addEventListener('DOMContentLoaded', () => {
    initStepTabs();
    initScriptTabs();
    initNodeGenerator();
  });
})();
