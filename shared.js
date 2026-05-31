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
        </div>
    </footer>`;
  },

  /** 统计代码 HTML (百度 + Google) */
  getAnalyticsHTML() {
    return `
    <!-- 百度统计 -->
    <script>
    var _hmt = _hmt || [];
    (function() {
      var hm = document.createElement("script");
      hm.src = "https://hm.baidu.com/hm.js?d222a52a2278471724ac0e485cc182ec";
      var s = document.getElementsByTagName("script")[0];
      s.parentNode.insertBefore(hm, s);
    })();
    <\/script>
    <!-- Google tag (gtag.js) -->
    <meta name="baidu-site-verification" content="codeva-eEiOyMiFJh" />
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-6CF7YT06DK"><\/script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-6CF7YT06DK');
    <\/script>`;
  },

  /** 注入导航栏到 #navbar-placeholder，并初始化汉堡菜单 */
  initNavbar() {
    const placeholder = document.getElementById('navbar-placeholder');
    if (!placeholder) return;
    placeholder.innerHTML = this.getNavbarHTML();

    const toggle = document.getElementById('navToggle');
    const menu = document.querySelector('.nav-menu');
    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        const expanded = menu.classList.toggle('active');
        toggle.setAttribute('aria-expanded', expanded);
      });
    }
  },

  /** 注入页脚到 #footer-placeholder */
  initFooter() {
    const placeholder = document.getElementById('footer-placeholder');
    if (!placeholder) return;
    placeholder.innerHTML = this.getFooterHTML();
  },

  /** 注入统计代码到 #analytics-placeholder */
  initAnalytics() {
    const placeholder = document.getElementById('analytics-placeholder');
    if (!placeholder) return;
    placeholder.innerHTML = this.getAnalyticsHTML();
  },

  /** 一键初始化所有 */
  initAll() {
    this.initNavbar();
    this.initFooter();
    this.initAnalytics();
  }
};

// DOM 就绪后自动初始化
document.addEventListener('DOMContentLoaded', () => SHARED.initAll());
