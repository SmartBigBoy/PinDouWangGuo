/**
 * shared.js — 拼豆王国 共享组件
 * 导航栏、页脚、统计代码的集中管理
 */

const SHARED = {
  /** 获取当前页面标识：index / colors / about / library / materials */
  _currentPage() {
    const path = location.pathname.split('/').pop() || 'index.html';
    if (path === '' || path === 'index.html') return 'index';
    return path.replace('.html', '');
  },

  /** 导航栏 HTML */
  getNavbarHTML() {
    const page = this._currentPage();
    const isIndex = page === 'index';
    const links = [
      { id: 'index',    label: '首页',     href: isIndex ? '#home' : 'index.html' },
      { id: 'generator',label: '生成器',   href: isIndex ? '#generator' : 'index.html#generator' },
      { id: 'create',   label: '创作',     href: 'create.html' },
      { id: 'shop',     label: '购物',     href: 'shop.html' },
      { id: 'colors',   label: '色卡',     href: 'colors.html' },
      { id: 'about',    label: '拼豆历史', href: 'about.html' },
      { id: 'library',  label: '素材库',   href: 'library.html' },
    ];

    const navLinks = links.map(link =>
      `<a href="${link.href}" class="nav-link${page === link.id ? ' active' : ''}">${link.label}</a>`
    ).join('\n                ');

    return `
    <nav class="navbar" role="navigation" aria-label="主导航">
        <div class="nav-container">
            <div class="nav-brand">
                <a href="index.html" class="brand-link" aria-label="回到首页">
                    <img src="logo.svg" alt="拼豆王国" class="brand-icon" width="36" height="36">
                    <span class="brand-text">拼豆王国</span>
                </a>
            </div>
            <div class="nav-menu" role="menubar">
                ${navLinks}
            </div>
            <button class="nav-toggle" id="navToggle" aria-label="切换导航菜单" aria-expanded="false">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </div>
    </nav>`;
  },

  /** 页脚 HTML */
  getFooterHTML() {
    return `
    <footer class="footer" role="contentinfo">
        <div class="footer-content">
            <div class="footer-brand">
                <span class="brand-icon" aria-hidden="true">🎨</span>
                <span class="brand-text">拼豆王国</span>
            </div>
            <p>© 2025 拼豆王国 | 使用时请确保图片版权合规</p>
            <p><a href="#" id="donateBtn" class="donate-link">❤️ 支持作者</a></p>
        </div>
    </footer>

    <!-- 捐款模态框 -->
    <div id="donateModal" class="modal">
        <div class="modal-content donate-modal">
            <span class="modal-close" id="donateClose">&times;</span>
            <h2>❤️ 支持作者</h2>
            <p>如果这个工具对你有帮助，欢迎扫码支持！</p>
            <div class="donate-qrcode">
                <img src="images/wechat_donate.png" alt="微信收款码">
            </div>
            <p class="donate-tip">长按识别二维码转账</p>
        </div>
    </div>`;
  },


  /** 注入导航栏到 #navbar-placeholder */
  initNavbar() {
    const placeholder = document.getElementById('navbar-placeholder');
    if (!placeholder) return;
    placeholder.innerHTML = this.getNavbarHTML();
  },

  /** 移动端汉堡菜单：全局事件委托，避免被页面其他元素拦截 */
  initNavToggle() {
    document.addEventListener('click', (e) => {
      const toggle = e.target.closest('#navToggle');
      if (!toggle) return;
      const menu = document.querySelector('.nav-menu');
      if (!menu) return;
      const expanded = menu.classList.toggle('active');
      toggle.setAttribute('aria-expanded', expanded);
    });
  },

  /** 注入页脚到 #footer-placeholder */
  initFooter() {
    const placeholder = document.getElementById('footer-placeholder');
    if (!placeholder) return;
    placeholder.innerHTML = this.getFooterHTML();
    this.initDonateModal();
  },

  /** 初始化捐款模态框 */
  initDonateModal() {
    const modal = document.getElementById('donateModal');
    const btn = document.getElementById('donateBtn');
    const close = document.getElementById('donateClose');

    if (!modal || !btn || !close) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    });

    close.addEventListener('click', () => {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
    });
  },

  /** 注入统计代码到 <head>（百度统计已直接写在各 HTML 的 <head> 中） */
  initAnalytics() {
    const scripts = [];
    scripts.push({
      type: 'google',
      src: 'https://www.googletagmanager.com/gtag/js?id=G-6CF7YT06DK'
    });
    scripts.push({
      type: 'google-config',
      code: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-6CF7YT06DK');`
    });

    // meta: baidu-site-verification
    const meta = document.createElement('meta');
    meta.name = 'baidu-site-verification';
    meta.content = 'codeva-eEiOyMiFJh';
    document.head.appendChild(meta);

    for (const s of scripts) {
      const el = document.createElement('script');
      if (s.src) {
        el.src = s.src;
        el.async = true;
      }
      if (s.code) {
        el.textContent = s.code;
      }
      document.head.appendChild(el);
    }
  },

  /** 一键初始化所有 */
  initAll() {
    this.initNavbar();
    this.initNavToggle();
    this.initFooter();
    this.initAnalytics();
  }
};

// DOM 就绪后自动初始化
document.addEventListener('DOMContentLoaded', () => SHARED.initAll());
