/**
 * create.js — 拼豆王国 创作画板
 * 空白网格手绘 + 图片导入逐格修改
 */
/** 轻提示（独立版，不依赖 script.js） */
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2000);
}

class PixelEditor {
  constructor() {
    this.gridData = [];         // 2D: cell = { color: {hex,name} } | null
    this.gridWidth = 58;
    this.gridHeight = 58;
    this.currentTool = 'paint'; // paint | eraser | fill
    this.selectedColor = null;  // { hex, name }
    this.isDrawing = false;
    this.cellSize = 30;
    this._bbox = null;
    this._zoomFactor = 1.0;
    this._userZoomed = false;   // 用户是否手动缩放过（resize 时保持其绝对值）
    this._pinch = null;         // 双指缩放状态 { dist0, cs0 }
    this._touchPending = null;  // 单指延迟落笔的起点格子
    this._touchTimer = null;    // 单指延迟落笔定时器
    this._showCellLabels = true;

    this.initElements();
    this.setupEventListeners();
    this.resizeGrid(58, 58);
    // 窗口缩放时重算格子大小（保持用户当前的绝对格子大小）
    window.addEventListener('resize', () => {
      if (this.gridData.length) {
        this._updateCellSize(true);
        this._fitCanvasToWrap();
      }
    });
  }

  initElements() {
    this.canvas = document.getElementById('editorCanvas');
    this.canvasWrap = this.canvas.parentElement;
    this.ctx = this.canvas.getContext('2d');

    this.gridSizeSelect = document.getElementById('editorGridSize');
    this.customGridDiv = document.getElementById('editorCustomGrid');
    this.gridWInput = document.getElementById('editorGridW');
    this.gridHInput = document.getElementById('editorGridH');
    this.paletteSelect = document.getElementById('editorPalette');
    this.paletteGrid = document.getElementById('editorPaletteGrid');
    this.colorSwatch = document.getElementById('currentColorSwatch');
    this.colorName = document.getElementById('currentColorName');

    this.paintBtn = document.getElementById('paintTool');
    this.eraserBtn = document.getElementById('eraserTool');
    this.fillBtn = document.getElementById('fillTool');

    this.uploadArea = document.getElementById('editorUploadArea');
    this.imageInput = document.getElementById('editorImageInput');
    this.importColorsSlider = document.getElementById('editorImportColors');
    this.importColorVal = document.getElementById('editorImportColorVal');
    this.importBtn = document.getElementById('editorImportBtn');

    this.statsEl = document.getElementById('editorStats');
    this.downloadBtn = document.getElementById('editorDownloadBtn');
    this.clearBtn = document.getElementById('editorClearBtn');
    this.canvasTip = document.getElementById('canvasTip');

    this.importHeader = document.getElementById('importHeader');
    this.importBody = document.getElementById('importBody');
    this.statsHeader = document.getElementById('statsHeader');
    this.statsBody = document.getElementById('statsBody');

    this.importedImageData = null;
    this.beadSizeSelect = document.getElementById("editorBeadSize");
    this.physicalSizeEl = document.getElementById("editorPhysicalSize");

    // 裁剪弹窗
    this.cropModal = document.getElementById('cropModal');
    this.cropCloseBtn = document.getElementById('cropClose');
    this.cropStage = document.getElementById('cropStage');
    this.cropImage = document.getElementById('cropImage');
    this.cropMaskTop = document.getElementById('cropMaskTop');
    this.cropMaskBottom = document.getElementById('cropMaskBottom');
    this.cropMaskLeft = document.getElementById('cropMaskLeft');
    this.cropMaskRight = document.getElementById('cropMaskRight');
    this.cropSelectEl = document.getElementById('cropSelect');
    this.cropInfo = document.getElementById('cropInfo');
    this.cropResetBtn = document.getElementById('cropReset');
    this.cropConfirmBtn = document.getElementById('cropConfirm');
    this._cropSel = null;      // { left, top, width, height } 相对 stage 的显示坐标
    this._cropDragging = false;
    this._cropDragStart = null;

    // 创建悬浮提示
    this._hoverTimer = null;
    this._hoverCell = null;
    this._createTooltip();

    // 监听中间画布容器尺寸变化，让 canvas 始终铺满容器
    this._resizeObserver = new ResizeObserver(() => {
      this._fitCanvasToWrap();
    });
    this._resizeObserver.observe(this.canvasWrap);
  }

  setupEventListeners() {
    // 手机端自动折叠导入和统计
    if (window.innerWidth < 640) {
      if (this.importHeader) { this.importHeader.classList.add("collapsed-mobile"); this.importBody.classList.add("collapsed-mobile"); }
      if (this.statsHeader) { this.statsHeader.classList.add("collapsed-mobile"); this.statsBody.classList.add("collapsed-mobile"); }
    }
    // 网格尺寸
    this.gridSizeSelect.addEventListener('change', () => {
      const val = this.gridSizeSelect.value;
      this.customGridDiv.style.display = val === 'custom' ? 'flex' : 'none';
      if (val !== 'custom') {
        const [w, h] = val.split('x').map(Number);
        this.resizeGrid(w, h);
      }
    });
    this.gridWInput.addEventListener('change', () => {
      if (this.gridSizeSelect.value === 'custom') {
        const w = Math.max(5, Math.min(200, parseInt(this.gridWInput.value) || 20));
        const h = Math.max(5, Math.min(200, parseInt(this.gridHInput.value) || 20));
        this.resizeGrid(w, h);
      }
    });
    this.gridHInput.addEventListener('change', () => {
      if (this.gridSizeSelect.value === 'custom') {
        const w = Math.max(5, Math.min(200, parseInt(this.gridWInput.value) || 20));
        const h = Math.max(5, Math.min(200, parseInt(this.gridHInput.value) || 20));
        this.resizeGrid(w, h);
      }
    });

    // 色号标签开关
    const labelToggle = document.getElementById('labelToggleBtn');
    if (labelToggle) {
      labelToggle.addEventListener('click', () => {
        this._showCellLabels = !this._showCellLabels;
        labelToggle.classList.toggle('active', this._showCellLabels);
        this.render();
      });
    }

    // 色卡切换
    this.paletteSelect.addEventListener('change', () => {
      this.loadPalette();
      this._updateImportSliderMax();
    });

    // 豆子尺寸切换
    if (this.beadSizeSelect) {
      this.beadSizeSelect.addEventListener("change", () => this._updatePhysicalSize());
    }

    // 工具切换
    this.paintBtn.addEventListener('click', () => this.setTool('paint'));
    this.eraserBtn.addEventListener('click', () => this.setTool('eraser'));
    this.fillBtn.addEventListener('click', () => this.setTool('fill'));

    // 画布鼠标事件
    this.canvas.addEventListener('mousedown', (e) => this._onPointerDown(e));
    this.canvas.addEventListener('mousemove', (e) => this._onPointerMove(e));
    this.canvas.addEventListener('mouseup', () => this._onPointerUp());
    this.canvas.addEventListener('mouseleave', () => this._onPointerLeave());

    // 画布触控事件
    this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); this._onTouchStart(e); }, { passive: false });
    this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); this._onTouchMove(e); }, { passive: false });
    this.canvas.addEventListener('touchend', (e) => { e.preventDefault(); this._onTouchEnd(e); }, { passive: false });

    // 滚轮缩放：乘法步进（幅度随 deltaY 平滑变化）+ 以鼠标为锚点
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const steps = Math.max(0.2, Math.min(3, Math.abs(e.deltaY) / 100));
      const ratio = Math.pow(1.1, e.deltaY > 0 ? -steps : steps);
      this._zoomByFactor(ratio, e.clientX, e.clientY);
    }, { passive: false });

    // 缩放控件：+/− 以画布区中心为锚，百分比按钮恢复适应屏幕
    const zoomAtCenter = (ratio) => {
      const wrap = this.canvasWrap;
      const r = wrap.getBoundingClientRect();
      this._zoomByFactor(ratio, r.left + wrap.clientWidth / 2, r.top + wrap.clientHeight / 2);
    };
    const zoomIn = document.getElementById('createZoomIn');
    const zoomOut = document.getElementById('createZoomOut');
    const zoomReset = document.getElementById('createZoomBadge');
    if (zoomIn) zoomIn.addEventListener('click', () => zoomAtCenter(1.25));
    if (zoomOut) zoomOut.addEventListener('click', () => zoomAtCenter(1 / 1.25));
    if (zoomReset) zoomReset.addEventListener('click', () => this._resetZoom());

    // 上传图片
    this.uploadArea.addEventListener('click', () => this.imageInput.click());
    this.uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); this.uploadArea.classList.add('dragover'); });
    this.uploadArea.addEventListener('dragleave', () => this.uploadArea.classList.remove('dragover'));
    this.uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      this.uploadArea.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) this._loadImage(file);
    });
    this.imageInput.addEventListener('change', (e) => {
      if (e.target.files[0]) this._loadImage(e.target.files[0]);
    });

    // 导入颜色数量滑块
    this.importColorsSlider.addEventListener('input', () => {
      this.importColorVal.textContent = this.importColorsSlider.value;
    });

    // 导入按钮
    this.importBtn.addEventListener('click', () => this._applyImport());

    // 下载
    this.downloadBtn.addEventListener('click', () => this.download());

    // 清空
    this.clearBtn.addEventListener('click', () => {
      if (this.gridData.some(row => row.some(c => c !== null))) {
        if (!confirm('确认清空所有颜色？')) return;
      }
      this.clearGrid();
    });

    // 裁剪弹窗
    if (this.cropCloseBtn) {
      this.cropCloseBtn.addEventListener('click', () => this._closeCrop());
      this.cropModal.addEventListener('click', (e) => { if (e.target === this.cropModal) this._closeCrop(); });
      this.cropResetBtn.addEventListener('click', () => this._initCropSelect());
      this.cropConfirmBtn.addEventListener('click', () => this._confirmCrop());
      this.cropStage.addEventListener('pointerdown', (e) => this._cropPointerDown(e));
      window.addEventListener('pointermove', (e) => this._cropPointerMove(e));
      window.addEventListener('pointerup', () => this._cropPointerUp());
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.cropModal.classList.contains('show')) this._closeCrop();
      });
    }

    // 可折叠面板
    if (this.importHeader) {
      this.importHeader.addEventListener('click', () => {
        this.importHeader.classList.toggle('collapsed');
        this.importBody.classList.toggle('collapsed');
      });
    }
    if (this.statsHeader) {
      this.statsHeader.addEventListener('click', () => {
        this.statsHeader.classList.toggle('collapsed');
        this.statsBody.classList.toggle('collapsed');
      });
    }

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      if (e.key === 'p' || e.key === '1') this.setTool('paint');
      if (e.key === 'e' || e.key === '2') this.setTool('eraser');
      if (e.key === 'f' || e.key === '3') this.setTool('fill');
    });
  }

  _createTooltip() {
    if (!document.getElementById('editorTooltip')) {
      const el = document.createElement('div');
      el.id = 'editorTooltip';
      el.style.cssText = 'position:fixed;background:rgba(26,26,46,0.93);color:#f5f5f5;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;pointer-events:none;display:none;z-index:10000;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,0.25);backdrop-filter:blur(4px);';
      document.body.appendChild(el);
    }
    this._tooltipEl = document.getElementById('editorTooltip');
  }

  _showTooltip(x, y, cell, clientX, clientY) {
    const el = this._tooltipEl;
    if (!el) return;
    const colorHex = cell ? cell.hex : '#eee';
    const colorName = cell ? cell.name : '空';
    el.innerHTML = `<span style="color:${colorHex};font-size:14px">●</span> (${x+1},${y+1}) ${colorName}`;
    el.style.display = 'block';
    let tx = clientX + 15, ty = clientY - 35;
    if (tx + 200 > window.innerWidth) tx = clientX - 200;
    if (ty < 10) ty = clientY + 15;
    el.style.left = tx + 'px';
    el.style.top = ty + 'px';
  }

  _hideTooltip() {
    if (this._tooltipEl) this._tooltipEl.style.display = 'none';
  }

  // 更新导入颜色滑块上限（根据当前色卡）
  _updateImportSliderMax() {
    const brand = this.paletteSelect.value;
    const data = palettes[brand];
    if (!data) return;
    let total = 0;
    for (const s in data.series) {
      if (data.series[s].colors) total += data.series[s].colors.length;
    }
    this.importColorsSlider.max = total;
    this.importColorsSlider.value = total;  // 默认取色卡最大值
    this.importColorVal.textContent = this.importColorsSlider.value;
  }

  // ============ 网格管理 ============

  resizeGrid(w, h) {
    this.gridWidth = w;
    this.gridHeight = h;
    this._updateCellSize();

    // 重置数据
    this.gridData = [];
    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) row.push(null);
      this.gridData.push(row);
    }

    this._fitCanvasToWrap();
    this.updateStats();

    // 已导入图片时，网格大小变化后自动按新尺寸重新像素化，无需再次点击导入按钮
    if (this.importedImageData) {
      this._applyImport(true);
    }
  }

  clearGrid() {
    for (let y = 0; y < this.gridHeight; y++)
      for (let x = 0; x < this.gridWidth; x++)
        this.gridData[y][x] = null;
    this.render();
    this.updateStats();
  }

  // 自适应格子大小（根据视口实时计算）
  // keepUserZoom=true 时（窗口 resize）保留用户当前的绝对格子大小，仅同步比例
  _updateCellSize(keepUserZoom) {
    const w = this.gridWidth;
    const h = this.gridHeight;
    const isMobile = window.innerWidth < 1024;
    const sidebarW = isMobile ? 0 : 310;
    const headerH = 60;
    const pad = isMobile ? 60 : 40;
    // 工程视图：图案仅占容器约 70%，四周留出工程空白格
    const availW = (window.innerWidth - sidebarW - pad) * 0.7;
    const availH = (window.innerHeight - headerH - pad) * 0.7;
    const base = Math.max(8, Math.min(
      Math.floor(availW / w),
      Math.floor(availH / h),
      50
    ));
    this._baseCellSize = base;
    if (keepUserZoom && this._userZoomed) {
      // 保持用户当前格子大小不变，factor 反算（允许超过 [0.1,10] 范围）
      this.cellSize = Math.max(4, Math.min(80, this.cellSize));
      this._zoomFactor = this.cellSize / base;
    } else {
      this.cellSize = base;
      this._zoomFactor = 1;
      this._userZoomed = false;
    }
    this._applySize();
    this._updateZoomBadge();
  }

  // 按当前 cellSize 更新坐标区文字大小（工程视图不单独预留坐标轴像素条）
  _applySize() {
    this.coordSize = Math.max(10, Math.min(18, Math.floor(this.cellSize * 0.5)));
  }

  // 让 canvas 铺满中间容器，并重绘
  _fitCanvasToWrap() {
    const wrap = this.canvasWrap;
    if (!wrap) return;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (w === 0 || h === 0) return;
    this.canvas.width = w;
    this.canvas.height = h;
    this.render();
  }

  // 从 _zoomFactor 应用缩放（不重绘，由调用方决定是否 render）
  _applyZoom() {
    this.cellSize = Math.max(4, Math.min(80, Math.round(this._baseCellSize * this._zoomFactor)));
    this._applySize();
    this._updateZoomBadge();
  }

  // 缩放：ratio 为乘法系数（>1 放大，<1 缩小），clientX/Y 为锚点屏幕坐标（null 则用画布区中心）
  _zoomByFactor(ratio, clientX, clientY) {
    if (!this._baseCellSize) return;
    const s0 = this.cellSize;
    const W = this.gridWidth, H = this.gridHeight;
    const cw = this.canvas.width, ch = this.canvas.height;

    // 当前图案偏移（未手动设置过则用居中）
    const offsetX0 = this._lastOffsetX != null ? this._lastOffsetX : (cw - W * s0) / 2;
    const offsetY0 = this._lastOffsetY != null ? this._lastOffsetY : (ch - H * s0) / 2;

    // 锚点像素位置（相对于 canvas 显示区域）
    let apx, apy;
    if (clientX != null && clientY != null) {
      const rect = this.canvas.getBoundingClientRect();
      apx = clientX - rect.left;
      apy = clientY - rect.top;
    } else {
      apx = cw / 2;
      apy = ch / 2;
    }

    // 锚点对应的工程坐标
    const engX = (apx - offsetX0) / s0 + 1;
    const engY = (apy - offsetY0) / s0 + 1;

    // 应用新格子大小
    const newCS = Math.max(4, Math.min(80, Math.round(s0 * ratio)));
    if (newCS === s0) return;
    this._userZoomed = true;
    this.cellSize = newCS;
    this._zoomFactor = newCS / this._baseCellSize;
    this._applySize();
    this._updateZoomBadge();

    // 新偏移：让锚点工程坐标仍位于原屏幕位置
    this._lastOffsetX = apx - (engX - 1) * newCS;
    this._lastOffsetY = apy - (engY - 1) * newCS;

    this.render();
  }

  // 恢复适应屏幕（100%）
  _resetZoom() {
    this._userZoomed = false;
    this._zoomFactor = 1;
    this.cellSize = this._baseCellSize;
    this._applySize();
    this.render();
    this._updateZoomBadge();
  }

  _updateZoomBadge() {
    const badge = document.getElementById('createZoomBadge');
    if (badge) badge.textContent = Math.round(this._zoomFactor * 100) + '%';
  }

  // ============ 工具 ============

  setTool(tool) {
    this.currentTool = tool;
    [this.paintBtn, this.eraserBtn, this.fillBtn].forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });
    this.canvas.style.cursor = tool === 'fill' ? 'cell' : 'crosshair';
  }

  // ============ 画布交互 ============

  _getCellFromEvent(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const wrap = this.canvasWrap;
    const px = clientX - rect.left + wrap.scrollLeft;
    const py = clientY - rect.top + wrap.scrollTop;
    const s = this.cellSize;
    const offsetX = this._lastOffsetX;
    const offsetY = this._lastOffsetY;
    const ex = Math.floor((px - offsetX) / s) + 1;
    const ey = Math.floor((py - offsetY) / s) + 1;
    const x = ex - 1;
    const y = ey - 1;
    const inGrid = x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight;
    return { x, y, out: !inGrid };
  }

  _onPointerDown(e) {
    const { x, y, out } = this._getCellFromEvent(e.clientX, e.clientY);
    if (out) return;
    this.isDrawing = true;
    this._applyTool(x, y);
  }

  _onPointerMove(e) {
    const { x, y, out } = this._getCellFromEvent(e.clientX, e.clientY);
    if (out) {
      this._hideTooltip();
      return;
    }
    if (this.isDrawing) this._applyTool(x, y);
    // 绘制悬浮高亮
    this.render();
    this._drawHoverHighlight(x, y);
    // 悬浮提示（1秒后显示）
    const cellKey = `${x},${y}`;
    if (cellKey !== this._hoverCell) {
      this._hoverCell = cellKey;
      this._hideTooltip();
      clearTimeout(this._hoverTimer);
      this._hoverTimer = setTimeout(() => {
        const cell = this.gridData[y] && this.gridData[y][x];
        this._showTooltip(x, y, cell, e.clientX, e.clientY);
      }, 1000);
    }
  }

  _onPointerUp() {
    this.isDrawing = false;
  }

  _onPointerLeave() {
    this.isDrawing = false;
    this._hideTooltip();
    clearTimeout(this._hoverTimer);
    this._hoverCell = null;
  }

  _onTouchStart(e) {
    if (e.touches.length === 2) {
      this._beginPinch(e);
      return;
    }
    // 单指：延迟 80ms 再落笔——若期间第二指落下进入缩放，则不误画起点
    const touch = e.touches[0];
    const { x, y, out } = this._getCellFromEvent(touch.clientX, touch.clientY);
    this._touchPending = { x, y };
    clearTimeout(this._touchTimer);
    this._touchTimer = setTimeout(() => {
      this._touchTimer = null;
      this._touchPending = null;
      if (out) return;
      this.isDrawing = true;
      this._applyTool(x, y);
    }, 80);
  }

  _beginPinch(e) {
    clearTimeout(this._touchTimer);
    this._touchTimer = null;
    this._touchPending = null;
    this.isDrawing = false;
    const t0 = e.touches[0], t1 = e.touches[1];
    const dx = t0.clientX - t1.clientX;
    const dy = t0.clientY - t1.clientY;
    this._pinch = {
      dist0: Math.max(1, Math.sqrt(dx * dx + dy * dy)),
      cs0: this.cellSize
    };
  }

  _onTouchMove(e) {
    if (e.touches.length === 2 && this._pinch) {
      this._updatePinch(e);
      return;
    }
    // 单指移动：立即补画起点，保证拖动绘制无延迟
    if (this._touchPending) {
      const { x, y } = this._touchPending;
      this._touchPending = null;
      clearTimeout(this._touchTimer);
      this._touchTimer = null;
      if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
        this.isDrawing = true;
        this._applyTool(x, y);
      }
    }
    const touch = e.touches[0];
    const { x, y, out } = this._getCellFromEvent(touch.clientX, touch.clientY);
    if (out) return;
    if (this.isDrawing) this._applyTool(x, y);
  }

  _updatePinch(e) {
    const t0 = e.touches[0], t1 = e.touches[1];
    const dx = t0.clientX - t1.clientX;
    const dy = t0.clientY - t1.clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 10) return;
    const scale = dist / this._pinch.dist0;
    const newCS = Math.max(4, Math.min(80, Math.round(this._pinch.cs0 * scale)));
    if (newCS === this.cellSize) return;

    // 锚点：两指中心，缩放前后该中心下的内容保持不动
    const midX = (t0.clientX + t1.clientX) / 2;
    const midY = (t0.clientY + t1.clientY) / 2;
    const wrap = this.canvasWrap;
    const oldW = this.canvas.width, oldH = this.canvas.height;
    const rect = this.canvas.getBoundingClientRect();
    const contentX = (midX - rect.left) + wrap.scrollLeft;
    const contentY = (midY - rect.top) + wrap.scrollTop;

    this.cellSize = newCS;
    this._userZoomed = true;
    this._zoomFactor = this.cellSize / this._baseCellSize;
    this._applySize();
    this.render();
    this._updateZoomBadge();

    const newRect = this.canvas.getBoundingClientRect();
    const sX = this.canvas.width / oldW;
    const sY = this.canvas.height / oldH;
    wrap.scrollLeft = contentX * sX - (midX - newRect.left);
    wrap.scrollTop = contentY * sY - (midY - newRect.top);
  }

  _onTouchEnd(e) {
    clearTimeout(this._touchTimer);
    this._touchTimer = null;
    this._touchPending = null;
    if (e.touches.length < 2) this._pinch = null;
    if (e.touches.length < 2) this._onPointerUp();
  }

  _applyTool(x, y) {
    if (this.currentTool === 'paint') {
      if (!this.selectedColor) { showToast('请先在色板中选择颜色'); return; }
      this.gridData[y][x] = { ...this.selectedColor };
      this.render();
      this.updateStats();
    } else if (this.currentTool === 'eraser') {
      this.gridData[y][x] = null;
      this.render();
      this.updateStats();
    } else if (this.currentTool === 'fill') {
      if (!this.selectedColor) { showToast('请先在色板中选择颜色'); return; }
      this._floodFill(x, y);
      this.render();
      this.updateStats();
    }
    this._calcBoundingBox();
    this._updatePhysicalSize();
  }

  _floodFill(startX, startY) {
    const targetColor = this.gridData[startY][startX];
    const fillColor = this.selectedColor;
    if (!fillColor) return;
    // 如果点击的就是目标颜色，不做任何事
    if (targetColor && targetColor.hex === fillColor.hex) return;

    const visited = new Set();
    const queue = [[startX, startY]];
    while (queue.length > 0) {
      const [cx, cy] = queue.shift();
      const key = `${cx},${cy}`;
      if (visited.has(key)) continue;
      visited.add(key);
      const cell = this.gridData[cy] && this.gridData[cy][cx];
      // 填充条件：颜色值相同（比较 hex）或 都为空
      if ((cell && targetColor && cell.hex === targetColor.hex) || (!targetColor && cell === null)) {
        this.gridData[cy][cx] = { ...fillColor };
        for (const [nx, ny] of [[cx-1,cy],[cx+1,cy],[cx,cy-1],[cx,cy+1]]) {
          if (nx >= 0 && nx < this.gridWidth && ny >= 0 && ny < this.gridHeight) {
            queue.push([nx, ny]);
          }
        }
      }
    }
  }

  _drawHoverHighlight(x, y) {
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return;
    const ctx = this.ctx;
    const s = this.cellSize;
    const px = this._lastOffsetX + x * s;
    const py = this._lastOffsetY + y * s;
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 1, py + 1, s - 2, s - 2);
  }

  // ============ 渲染 ============

  render() {
    const ctx = this.ctx;
    const s = this.cellSize;
    const W = this.gridWidth;
    const H = this.gridHeight;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    // 背景铺满
    ctx.fillStyle = '#f7f8fb';
    ctx.fillRect(0, 0, cw, ch);

    // 图案居中偏移（工程坐标 (1,1) 对应图案左上角）
    const offsetX = (cw - W * s) / 2;
    const offsetY = (ch - H * s) / 2;
    this._lastOffsetX = offsetX;
    this._lastOffsetY = offsetY;

    // 可见工程坐标范围（以 1-based 工程坐标）
    const minEngX = Math.floor((0 - offsetX) / s) + 1;
    const maxEngX = Math.floor((cw - offsetX) / s) + 1;
    const minEngY = Math.floor((0 - offsetY) / s) + 1;
    const maxEngY = Math.floor((ch - offsetY) / s) + 1;

    // 工程网格背景线
    ctx.lineWidth = 1;
    for (let ex = minEngX; ex <= maxEngX; ex++) {
      const x = offsetX + (ex - 1) * s;
      ctx.strokeStyle = ex % 5 === 0 ? '#d0dceb' : '#eef2f9';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ch);
      ctx.stroke();
    }
    for (let ey = minEngY; ey <= maxEngY; ey++) {
      const y = offsetY + (ey - 1) * s;
      ctx.strokeStyle = ey % 5 === 0 ? '#d0dceb' : '#eef2f9';
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cw, y);
      ctx.stroke();
    }

    // 绘制图案内容（只绘制可见区域）
    const minDataX = Math.max(0, minEngX - 1);
    const maxDataX = Math.min(W - 1, maxEngX - 1);
    const minDataY = Math.max(0, minEngY - 1);
    const maxDataY = Math.min(H - 1, maxEngY - 1);

    for (let y = minDataY; y <= maxDataY; y++) {
      for (let x = minDataX; x <= maxDataX; x++) {
        const cell = this.gridData[y][x];
        if (!cell) continue;
        const px = offsetX + x * s;
        const py = offsetY + y * s;
        ctx.fillStyle = cell.hex;
        ctx.fillRect(px, py, s, s);
        // 色号标签
        if (this._showCellLabels && s >= 11 && cell.name) {
          const fz = Math.max(6, Math.min(Math.floor(s * 0.35), 12));
          ctx.font = `bold ${fz}px Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const hr = parseInt(cell.hex.slice(1,3),16);
          const hg = parseInt(cell.hex.slice(3,5),16);
          const hb = parseInt(cell.hex.slice(5,7),16);
          const lum = (0.299*hr + 0.587*hg + 0.114*hb)/255;
          ctx.fillStyle = lum > 0.5 ? '#000' : '#fff';
          ctx.shadowColor = lum > 0.5 ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)';
          ctx.shadowBlur = 3;
          ctx.fillText(cell.name, px + s/2, py + s/2);
          ctx.shadowBlur = 0;
        }
      }
    }

    // 坐标轴数字（步长 5，1-based 工程坐标）
    const labelColor = '#667799';
    const labelFont = `bold ${Math.max(9, Math.min(12, Math.floor(s/2.5)))}px Arial, sans-serif`;
    ctx.font = labelFont;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = labelColor;

    // 顶部坐标轴（y 轴负方向）
    const topY = Math.max(12, offsetY - 10);
    for (let ex = minEngX; ex <= maxEngX; ex++) {
      if (ex % 5 !== 0) continue;
      const x = offsetX + (ex - 1) * s + s / 2;
      if (x < 10 || x > cw - 10) continue;
      ctx.fillText(String(ex), x, topY);
    }

    // 左侧坐标轴（x 轴负方向）
    const leftX = Math.max(12, offsetX - 10);
    ctx.textAlign = 'right';
    for (let ey = minEngY; ey <= maxEngY; ey++) {
      if (ey % 5 !== 0) continue;
      const y = offsetY + (ey - 1) * s + s / 2;
      if (y < 10 || y > ch - 10) continue;
      ctx.fillText(String(ey), leftX, y);
    }

    // 图案红色边界框
    ctx.strokeStyle = '#ff4d4f';
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX, offsetY, W * s, H * s);
  }

  // ============ 色板 ============

  loadPalette() {
    const brand = this.paletteSelect.value;
    const paletteData = palettes[brand];
    if (!paletteData) return;

    this.paletteGrid.innerHTML = '';
    const allColors = [];
    for (const seriesKey in paletteData.series) {
      const series = paletteData.series[seriesKey];
      if (series && series.colors) {
        for (const c of series.colors) {
          allColors.push({ hex: c.hex, name: c.name });
        }
      }
    }

    for (const c of allColors) {
      const div = document.createElement('div');
      div.className = 'color-cell';
      div.style.background = c.hex;
      div.title = `${c.name} (${c.hex})`;
      div.dataset.hex = c.hex;
      div.dataset.name = c.name;
      // 色号标签
      const span = document.createElement('span');
      span.className = 'color-cell-label';
      span.textContent = c.name;
      const hr = parseInt(c.hex.slice(1,3),16);
      const hg = parseInt(c.hex.slice(3,5),16);
      const hb = parseInt(c.hex.slice(5,7),16);
      const lum = (0.299*hr + 0.587*hg + 0.114*hb)/255;
      span.style.color = lum > 0.5 ? '#000' : '#fff';
      div.appendChild(span);
      div.addEventListener('click', () => this.selectColor(c.hex, c.name));
      this.paletteGrid.appendChild(div);
    }

    // 默认选中第一个颜色
    if (allColors.length > 0 && !this.selectedColor) {
      this.selectColor(allColors[0].hex, allColors[0].name);
    }
  }

  selectColor(hex, name) {
    this.selectedColor = { hex, name };
    this.colorSwatch.style.background = hex;
    this.colorName.textContent = `${name} (${hex})`;
    // 高亮色板中的选中项
    this.paletteGrid.querySelectorAll('.color-cell').forEach(el => {
      el.classList.toggle('selected', el.dataset.hex === hex);
    });
  }

  // ============ 图片导入 ============

  _loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.importedImageData = { img, dataURL: e.target.result };
        this.importBtn.disabled = false;
        this._updateThumbnail(e.target.result);
        showToast('图片已加载，可裁剪后导入');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /** 在导入区显示缩略图 + 裁剪/重新选择按钮 */
  _updateThumbnail(dataURL, cropped) {
    const area = this.uploadArea;
    area.innerHTML = '';
    area.style.padding = '8px';
    const thumb = document.createElement('img');
    thumb.src = dataURL;
    thumb.style.maxWidth = '100%';
    thumb.style.maxHeight = '120px';
    thumb.style.borderRadius = '6px';
    thumb.style.display = 'block';
    thumb.style.margin = '0 auto';
    thumb.alt = '上传预览';
    area.appendChild(thumb);

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '6px';
    row.style.marginTop = '6px';

    const cropBtn = document.createElement('button');
    cropBtn.type = 'button';
    cropBtn.className = 'btn btn-secondary';
    cropBtn.style.flex = '1';
    cropBtn.style.padding = '5px 8px';
    cropBtn.style.fontSize = '0.75rem';
    cropBtn.textContent = '✂️ 裁剪';
    cropBtn.addEventListener('click', (e) => { e.stopPropagation(); this._openCrop(); });

    const reselectBtn = document.createElement('button');
    reselectBtn.type = 'button';
    reselectBtn.className = 'btn btn-secondary';
    reselectBtn.style.flex = '1';
    reselectBtn.style.padding = '5px 8px';
    reselectBtn.style.fontSize = '0.75rem';
    reselectBtn.textContent = '重新选择';
    reselectBtn.addEventListener('click', (e) => { e.stopPropagation(); this.imageInput.click(); });

    row.appendChild(cropBtn);
    row.appendChild(reselectBtn);
    area.appendChild(row);
    if (cropped) showToast('已裁剪，可导入像素化');
  }

  // ============ 图片裁剪 ============

  /** 打开裁剪弹窗 */
  _openCrop() {
    if (!this.importedImageData) return;
    this.cropImage.src = this.importedImageData.dataURL;
    this.cropModal.classList.add('show');
    document.body.style.overflow = 'hidden';
    // 图片可能已缓存导致 onload 不触发，双保险初始化
    this.cropImage.onload = () => this._initCropSelect();
    requestAnimationFrame(() => this._initCropSelect());
  }

  _closeCrop() {
    this.cropModal.classList.remove('show');
    document.body.style.overflow = '';
    this._cropDragging = false;
    this._cropDragStart = null;
    this._cropSel = null;
    this.cropImage.removeAttribute('src');
  }

  /** 图片在裁剪区内的实际显示矩形（相对 stage 的坐标） */
  _getImageDisplayRect() {
    const img = this.cropImage;
    const stage = this.cropStage;
    if (!img.naturalWidth || !img.clientWidth) return null;
    const stageRect = stage.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    return {
      left: imgRect.left - stageRect.left,
      top: imgRect.top - stageRect.top,
      width: imgRect.width,
      height: imgRect.height
    };
  }

  /** 初始化为全选 */
  _initCropSelect() {
    const rect = this._getImageDisplayRect();
    if (!rect) return;
    this._cropSel = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    this._updateCropOverlay();
  }

  _cropPointerDown(e) {
    const imgRect = this._getImageDisplayRect();
    if (!imgRect) return;
    const stageRect = this.cropStage.getBoundingClientRect();
    const x = e.clientX - stageRect.left;
    const y = e.clientY - stageRect.top;
    // 只允许在图片区域内开始框选
    if (x < imgRect.left || x > imgRect.left + imgRect.width ||
        y < imgRect.top || y > imgRect.top + imgRect.height) return;
    this._cropDragging = true;
    if (this.cropStage.setPointerCapture) this.cropStage.setPointerCapture(e.pointerId);
    this._cropDragStart = { x, y };
  }

  _cropPointerMove(e) {
    if (!this._cropDragging || !this._cropDragStart) return;
    const imgRect = this._getImageDisplayRect();
    if (!imgRect) return;
    const stageRect = this.cropStage.getBoundingClientRect();
    // 裁剪选区限制在图片范围内
    const x = Math.max(imgRect.left, Math.min(imgRect.left + imgRect.width, e.clientX - stageRect.left));
    const y = Math.max(imgRect.top, Math.min(imgRect.top + imgRect.height, e.clientY - stageRect.top));
    this._cropSel = {
      left: Math.min(this._cropDragStart.x, x),
      top: Math.min(this._cropDragStart.y, y),
      width: Math.abs(x - this._cropDragStart.x),
      height: Math.abs(y - this._cropDragStart.y)
    };
    this._updateCropOverlay();
  }

  _cropPointerUp() {
    if (!this._cropDragging) return;
    this._cropDragging = false;
    this._cropDragStart = null;
    // 误触产生的小选区恢复为全选
    if (this._cropSel && (this._cropSel.width < 4 || this._cropSel.height < 4)) {
      this._initCropSelect();
    }
  }

  /** 更新选区框、四块遮罩和尺寸信息 */
  _updateCropOverlay() {
    if (!this._cropSel) return;
    const s = this._cropSel;
    const stageW = this.cropStage.clientWidth;
    const stageH = this.cropStage.clientHeight;
    const right = s.left + s.width;
    const bottom = s.top + s.height;

    this.cropMaskTop.style.cssText = `left:0;top:0;width:${stageW}px;height:${s.top}px;`;
    this.cropMaskBottom.style.cssText = `left:0;top:${bottom}px;width:${stageW}px;height:${Math.max(0, stageH - bottom)}px;`;
    this.cropMaskLeft.style.cssText = `left:0;top:${s.top}px;width:${s.left}px;height:${s.height}px;`;
    this.cropMaskRight.style.cssText = `left:${right}px;top:${s.top}px;width:${Math.max(0, stageW - right)}px;height:${s.height}px;`;
    this.cropSelectEl.style.cssText = `left:${s.left}px;top:${s.top}px;width:${s.width}px;height:${s.height}px;`;

    // 换算为原图像素尺寸
    const img = this.cropImage;
    if (img.naturalWidth && img.clientWidth) {
      const pw = Math.round(s.width * img.naturalWidth / img.clientWidth);
      const ph = Math.round(s.height * img.naturalHeight / img.clientHeight);
      this.cropInfo.textContent = `选中 ${pw} × ${ph} px`;
    } else {
      this.cropInfo.textContent = '';
    }
  }

  /** 确认裁剪：按选区裁出图片并替换当前待导入图片 */
  _confirmCrop() {
    if (!this._cropSel || !this.cropImage.naturalWidth) return;
    const img = this.cropImage;
    const s = this._cropSel;
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;
    const sw = Math.max(1, Math.round(s.width * scaleX));
    const sh = Math.max(1, Math.round(s.height * scaleY));
    const sx = Math.max(0, Math.min(img.naturalWidth - sw, Math.round(s.left * scaleX)));
    const sy = Math.max(0, Math.min(img.naturalHeight - sh, Math.round(s.top * scaleY)));

    const cvs = document.createElement('canvas');
    cvs.width = sw;
    cvs.height = sh;
    const cctx = cvs.getContext('2d');
    cctx.imageSmoothingEnabled = true;
    cctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    const croppedURL = cvs.toDataURL('image/png');

    const newImg = new Image();
    newImg.onload = () => {
      this.importedImageData = { img: newImg, dataURL: croppedURL };
      this._updateThumbnail(croppedURL, true);
      this._closeCrop();
    };
    newImg.src = croppedURL;
  }

  _applyImport(auto) {
    if (!this.importedImageData) return;
    const img = this.importedImageData.img;
    const colorCount = parseInt(this.importColorsSlider.value);
    const w = this.gridWidth;
    const h = this.gridHeight;

    // 缩放到网格尺寸（最近邻）
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.imageSmoothingEnabled = false;
    tempCtx.drawImage(img, 0, 0, w, h);
    const imageData = tempCtx.getImageData(0, 0, w, h);
    const pixels = imageData.data;

    // 提取颜色（复用 generator 的逻辑需要借助实例）
    const palettesFlat = {};
    for (const key in palettes) {
      palettesFlat[key] = this._flattenPalette(key);
    }
    const selectedPalette = palettesFlat[this.paletteSelect.value] || palettesFlat['mard291'];

    // 采样像素
    const samples = [];
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i], g = pixels[i+1], b = pixels[i+2], a = pixels[i+3];
      if (a < 128) continue;
      samples.push({ r, g, b });
    }
    if (samples.length === 0) { showToast('图片无效', 'error'); return; }

    // K-means 聚类（简化版）
    const k = Math.min(colorCount, samples.length);
    const clusters = this._simpleKMeans(samples, k);
    const usedHexes = new Set();

    // 先把每个聚类映射到最近的豆色
    const grid = [];
    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const r = pixels[idx], g = pixels[idx+1], b = pixels[idx+2], a = pixels[idx+3];
        if (a < 128) {
          row.push(null);
        } else {
          const closest = this._findClosest({ r, g, b }, selectedPalette);
          row.push(closest ? { hex: closest.hex, name: closest.name } : null);
          if (closest) usedHexes.add(closest.hex);
        }
      }
      grid.push(row);
    }

    // 放入编辑网格
    for (let y = 0; y < Math.min(h, this.gridHeight); y++) {
      for (let x = 0; x < Math.min(w, this.gridWidth); x++) {
        this.gridData[y][x] = grid[y] && grid[y][x] ? { ...grid[y][x] } : null;
      }
    }

    this.render();
    this.updateStats();
    showToast(auto ? '网格已调整，已自动重新像素化' : '导入完成，可逐格修改颜色');
  }

  _flattenPalette(brand) {
    const data = palettes[brand];
    if (!data) return [];
    const colors = [];
    for (const s in data.series) {
      if (data.series[s].colors) colors.push(...data.series[s].colors);
    }
    return colors;
  }

  _findClosest(target, palette) {
    let closest = null, minDist = Infinity;
    for (const c of palette) {
      const r = parseInt(c.hex.slice(1,3), 16);
      const g = parseInt(c.hex.slice(3,5), 16);
      const b = parseInt(c.hex.slice(5,7), 16);
      // Lab 距离近似计算
      const dr = target.r - r, dg = target.g - g, db = target.b - b;
      const dist = dr*dr + dg*dg + db*db;
      if (dist < minDist) { minDist = dist; closest = c; }
    }
    return closest;
  }

  _simpleKMeans(points, k, maxIter = 15) {
    if (points.length <= k) return points.map(p => [p]);
    // 简单初始化：均匀选取
    const step = Math.floor(points.length / k);
    const centroids = [];
    for (let i = 0; i < k; i++) centroids.push({ ...points[Math.min(i * step, points.length-1)] });

    let clusters;
    for (let iter = 0; iter < maxIter; iter++) {
      clusters = Array.from({ length: k }, () => []);
      for (const p of points) {
        let minIdx = 0, minD = Infinity;
        for (let i = 0; i < k; i++) {
          const d = (p.r-centroids[i].r)**2 + (p.g-centroids[i].g)**2 + (p.b-centroids[i].b)**2;
          if (d < minD) { minD = d; minIdx = i; }
        }
        clusters[minIdx].push(p);
      }
      let moved = false;
      for (let i = 0; i < k; i++) {
        if (clusters[i].length === 0) continue;
        const avgR = Math.round(clusters[i].reduce((s,p) => s+p.r, 0) / clusters[i].length);
        const avgG = Math.round(clusters[i].reduce((s,p) => s+p.g, 0) / clusters[i].length);
        const avgB = Math.round(clusters[i].reduce((s,p) => s+p.b, 0) / clusters[i].length);
        if (centroids[i].r !== avgR || centroids[i].g !== avgG || centroids[i].b !== avgB) moved = true;
        centroids[i] = { r: avgR, g: avgG, b: avgB };
      }
      if (!moved) break;
    }
    return clusters.filter(c => c.length > 0);
  }

  // ============ 统计 ============

  updateStats() {
    const colorMap = new Map();
    let filled = 0;
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.gridData[y][x];
        if (cell) {
          filled++;
          colorMap.set(cell.hex, (colorMap.get(cell.hex) || 0) + 1);
        }
      }
    }

    const colorCount = colorMap.size;
    const sorted = [...colorMap.entries()].sort((a, b) => b[1] - a[1]);

    let html = `<p style="font-size:0.9rem;margin-bottom:6px">填充: <b>${filled}</b> / ${this.gridWidth * this.gridHeight} 格</p>`;
    html += `<p style="font-size:0.9rem;margin-bottom:6px">颜色: <b>${colorCount}</b> 种</p>`;

    if (sorted.length > 0) {
      html += `<div style="margin-top:8px;max-height:120px;overflow-y:auto;font-size:0.8rem">`;
      for (const [hex, count] of sorted) {
        const name = this._findColorName(hex);
        html += `<div style="display:flex;align-items:center;gap:6px;padding:2px 0">
          <span style="width:14px;height:14px;border-radius:3px;background:${hex};border:1px solid #ddd;flex-shrink:0"></span>
          <span>${name || hex}</span><span style="margin-left:auto;color:var(--text-muted)">${count}格</span>
        </div>`;
      }
      html += `</div>`;
    }
    this.statsEl.innerHTML = html;
  }

  // 计算亮度用于文字对比
  _lum(hex) {
    const r = parseInt(hex.slice(1,3),16)/255;
    const g = parseInt(hex.slice(3,5),16)/255;
    const b = parseInt(hex.slice(5,7),16)/255;
    return 0.299*r + 0.587*g + 0.114*b;
  }

  _findColorName(hex) {
    for (const brand in palettes) {
      for (const s in palettes[brand].series) {
        const colors = palettes[brand].series[s].colors;
        if (colors) {
          const found = colors.find(c => c.hex.toUpperCase() === hex.toUpperCase());
          if (found) return found.name;
        }
      }
    }
    return hex;
  }


  // ============ 实物尺寸 ============

  _calcBoundingBox() {
    this._bbox = { minX: Infinity, maxX: -1, minY: Infinity, maxY: -1 };
    if (!this.gridData || !this.gridData.length) return;
    for (let y = 0; y < this.gridData.length; y++) {
      for (let x = 0; x < this.gridData[y].length; x++) {
        if (this.gridData[y][x] !== null) {
          if (x < this._bbox.minX) this._bbox.minX = x;
          if (x > this._bbox.maxX) this._bbox.maxX = x;
          if (y < this._bbox.minY) this._bbox.minY = y;
          if (y > this._bbox.maxY) this._bbox.maxY = y;
        }
      }
    }
  }

  _updatePhysicalSize() {
    const beadMM = parseFloat(this.beadSizeSelect ? this.beadSizeSelect.value : 5);
    const bbox = this._bbox;
    if (!bbox || bbox.maxX < 0) {
      if (this.physicalSizeEl) this.physicalSizeEl.textContent = '—';
      return;
    }
    const wBeads = bbox.maxX - bbox.minX + 1;
    const hBeads = bbox.maxY - bbox.minY + 1;
    const wCM = ((wBeads * beadMM) / 10).toFixed(1);
    const hCM = ((hBeads * beadMM) / 10).toFixed(1);
    const label = wBeads + '×' + hBeads + ' 豆  ' + wCM + '×' + hCM + 'cm';
    if (this.physicalSizeEl) this.physicalSizeEl.textContent = label;
  }

  // ============ 下载 ============

  download() {
    if (!this.gridData.length) return;
    var W = this.gridWidth, H = this.gridHeight;
    var cs = 40, lw = 200;
    var T = {w: 3840, h: 2160};
    var ps = Math.max(10, Math.min(30, Math.floor((T.w - cs - lw - 80) / Math.max(W, H))));
    var mw = W * ps, mh = H * ps;
    var cvs = document.createElement('canvas');
    cvs.width = T.w; cvs.height = T.h;
    var ctx = cvs.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#f5f5f0'; ctx.fillRect(0, 0, T.w, T.h);
    var gx = Math.floor((T.w - mw - cs - lw - 40) / 2);
    var gy = Math.floor((T.h - mh - cs) / 2);
    var lx = gx + mw + cs + 20;
    ctx.fillStyle = '#e8e9f0'; ctx.fillRect(gx, gy, mw + cs, cs); ctx.fillRect(gx, gy, cs, mh + cs);
    var lfs = Math.max(7, Math.min(11, Math.floor(ps * 0.38)));
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var cell = this.gridData[y][x];
      var px = gx + cs + x * ps, py = gy + cs + y * ps;
      ctx.fillStyle = cell ? cell.hex : '#f5f5f5'; ctx.fillRect(px, py, ps - 1, ps - 1);
      if (cell && ps >= 12) {
        var lum = this._lum(cell.hex);
        ctx.shadowColor = lum > 0.5 ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 3;
        ctx.fillStyle = lum > 0.5 ? '#222' : '#fff'; ctx.font = lfs + 'px Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(cell.name, px + ps/2, py + ps/2);
        ctx.shadowBlur = 0;
      }
    }
    ctx.strokeStyle = '#e0e0e8'; ctx.lineWidth = 1;
    for (var x = 0; x <= W; x++) { ctx.beginPath(); ctx.moveTo(gx+cs+x*ps,gy+cs); ctx.lineTo(gx+cs+x*ps,gy+cs+mh); ctx.stroke(); }
    for (var y = 0; y <= H; y++) { ctx.beginPath(); ctx.moveTo(gx+cs,gy+cs+y*ps); ctx.lineTo(gx+cs+mw,gy+cs+y*ps); ctx.stroke(); }
    ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
    for (var x = 5; x < W; x += 5) { ctx.beginPath(); ctx.moveTo(gx+cs+x*ps,gy+cs); ctx.lineTo(gx+cs+x*ps,gy+cs+mh); ctx.stroke(); }
    for (var y = 5; y < H; y += 5) { ctx.beginPath(); ctx.moveTo(gx+cs,gy+cs+y*ps); ctx.lineTo(gx+cs+mw,gy+cs+y*ps); ctx.stroke(); }
    ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 3;
    var mx = Math.floor(W/2), my = Math.floor(H/2);
    ctx.beginPath(); ctx.moveTo(gx+cs+mx*ps,gy+cs); ctx.lineTo(gx+cs+mx*ps,gy+cs+mh); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(gx+cs,gy+cs+my*ps); ctx.lineTo(gx+cs+mw,gy+cs+my*ps); ctx.stroke();
    var dense = Math.max(W,H) < 30, step = dense ? 1 : 5;
    ctx.fillStyle = '#333'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (var x = 0; x < W; x++) { if ((x+1) % step === 0) ctx.fillText(x+1, gx+cs+x*ps+ps/2, gy+cs/2); }
    ctx.textAlign = 'right';
    for (var y = 0; y < H; y++) { if ((y+1) % step === 0) ctx.fillText(y+1, gx+cs-8, gy+cs+y*ps+ps/2); }
    var iy = gy + 25;
    ctx.fillStyle = '#333'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'left';
    ctx.fillText('🎨 拼豆创作', lx, iy); iy += 35;
    ctx.font = '16px Arial'; ctx.fillStyle = '#555';
    ctx.fillText('网格: ' + W + '×' + H, lx, iy); iy += 24;
    var beadMM2 = parseFloat(this.beadSizeSelect ? this.beadSizeSelect.value : 5);
    var bbox2 = this._bbox;
    if (bbox2 && bbox2.maxX >= 0) {
      var bw2 = bbox2.maxX - bbox2.minX + 1, bh2 = bbox2.maxY - bbox2.minY + 1;
      var wcm2 = ((bw2 * beadMM2) / 10).toFixed(1), hcm2 = ((bh2 * beadMM2) / 10).toFixed(1);
      ctx.fillText('实物: ' + wcm2 + '×' + hcm2 + 'cm (' + bw2 + '×' + bh2 + ' 豆, ' + beadMM2 + 'mm)', lx, iy); iy += 24;
    }
    var cm = new Map(), filled = 0;
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) { var c = this.gridData[y][x]; if (c) { filled++; cm.set(c.hex, (cm.get(c.hex)||0)+1); } }
    ctx.fillText('填充: ' + filled + '/' + (W*H) + '  |  颜色: ' + cm.size + '种', lx, iy); iy += 28;
    ctx.fillStyle = '#ddd'; ctx.fillRect(lx, iy, 180, 1); iy += 16;
    ctx.fillStyle = '#333'; ctx.font = 'bold 15px Arial';
    ctx.fillText('色号清单', lx, iy); iy += 22;
    var sorted = [...cm.entries()].sort(function(a,b) { return b[1]-a[1]; });
    var bs = 14;
    for (var i = 0; i < Math.min(sorted.length, 25); i++) {
      var hex = sorted[i][0], cnt = sorted[i][1];
      ctx.fillStyle = hex; ctx.fillRect(lx, iy-7, bs, bs);
      ctx.strokeStyle = '#999'; ctx.lineWidth = 0.5; ctx.strokeRect(lx, iy-7, bs, bs);
      ctx.fillStyle = '#333'; ctx.font = '13px Arial'; ctx.textAlign = 'left';
      ctx.fillText(this._findColorName(hex) + ' - ' + cnt + '颗', lx+bs+8, iy+2);
      iy += 17;
    }
    if (sorted.length > 25) { ctx.fillStyle = '#999'; ctx.font = '12px Arial'; ctx.fillText('...还有' + (sorted.length-25) + '种颜色', lx, iy); }
    cvs.toBlob(function(blob) {
      var link = document.createElement('a');
      link.download = 'pixel-art-full-' + Date.now() + '.png';
      link.href = URL.createObjectURL(blob); link.click();
      URL.revokeObjectURL(link.href);
      showToast('已下载全信息图');
    }, 'image/png');
  }
}

// DOM 就绪后初始化
document.addEventListener('DOMContentLoaded', () => {
  const editor = new PixelEditor();
  editor.loadPalette();
  // 挂载到全局方便调试
  window.pixelEditor = editor;
});
