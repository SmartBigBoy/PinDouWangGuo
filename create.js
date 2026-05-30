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
    this.gridWidth = 29;
    this.gridHeight = 29;
    this.currentTool = 'paint'; // paint | eraser | fill
    this.selectedColor = null;  // { hex, name }
    this.isDrawing = false;
    this.cellSize = 30;
    this._bbox = null;

    this.initElements();
    this.setupEventListeners();
    this.resizeGrid(29, 29);
    // 窗口缩放时重算格子大小
    window.addEventListener('resize', () => {
      if (this.gridData.length) this._updateCellSize();
    });
  }

  initElements() {
    this.canvas = document.getElementById('editorCanvas');
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

    // 创建悬浮提示
    this._hoverTimer = null;
    this._hoverCell = null;
    this._createTooltip(); // 暂存上传图片的像素化结果
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
    this.canvas.addEventListener('touchend', (e) => { e.preventDefault(); this._onPointerUp(); }, { passive: false });

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
      this.resizeGrid(this.gridWidth, this.gridHeight);
    });

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

    this.render();
    this.updateStats();
  }

  clearGrid() {
    for (let y = 0; y < this.gridHeight; y++)
      for (let x = 0; x < this.gridWidth; x++)
        this.gridData[y][x] = null;
    this.render();
    this.updateStats();
  }

  // 自适应格子大小（根据视口实时计算）
  _updateCellSize() {
    const w = this.gridWidth;
    const h = this.gridHeight;
    const isMobile = window.innerWidth < 1024;
    const sidebarW = isMobile ? 0 : 310;
    const headerH = 60;
    const pad = isMobile ? 60 : 40;
    this.coordSize = Math.max(16, Math.min(28, Math.floor(this.cellSize * 0.9))); // 坐标区宽度
    const availW = window.innerWidth - sidebarW - pad - this.coordSize;
    const availH = window.innerHeight - headerH - pad - this.coordSize;
    this.cellSize = Math.max(10, Math.min(
      Math.floor(availW / w),
      Math.floor(availH / h),
      50
    ));
    this.coordSize = Math.max(16, Math.min(28, Math.floor(this.cellSize * 0.9)));
    this.canvas.width = w * this.cellSize + this.coordSize;
    this.canvas.height = h * this.cellSize + this.coordSize;
    if (this.canvasTip) this.canvasTip.style.display = 'none';
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
    const cs = this.coordSize || 0;
    const gridW = this.gridWidth;
    const gridH = this.gridHeight;
    const cellW = (rect.width - cs) / gridW;
    const cellH = (rect.height - cs) / gridH;
    const x = Math.floor(((clientX - rect.left) - cs) / cellW);
    const y = Math.floor(((clientY - rect.top) - cs) / cellH);
    return { x, y };
  }

  _onPointerDown(e) {
    const { x, y } = this._getCellFromEvent(e.clientX, e.clientY);
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return;
    this.isDrawing = true;
    this._applyTool(x, y);
  }

  _onPointerMove(e) {
    const { x, y } = this._getCellFromEvent(e.clientX, e.clientY);
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
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
    const touch = e.touches[0];
    const { x, y } = this._getCellFromEvent(touch.clientX, touch.clientY);
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return;
    this.isDrawing = true;
    this._applyTool(x, y);
  }

  _onTouchMove(e) {
    const touch = e.touches[0];
    const { x, y } = this._getCellFromEvent(touch.clientX, touch.clientY);
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return;
    if (this.isDrawing) this._applyTool(x, y);
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
    const cs = this.coordSize || 0;
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(cs + x * s + 1, cs + y * s + 1, s - 2, s - 2);
  }

  // ============ 渲染 ============

  render() {
    const ctx = this.ctx;
    const s = this.cellSize;
    const cs = this.coordSize || 24;
    const w = this.gridWidth;
    const h = this.gridHeight;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 背景
    ctx.fillStyle = '#f0f0f5';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 坐标区背景
    ctx.fillStyle = '#e8e9f0';
    ctx.fillRect(0, 0, w * s + cs, cs);
    ctx.fillRect(0, 0, cs, h * s + cs);

    // 绘制每个格子
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const cell = this.gridData[y][x];
        if (cell) {
          ctx.fillStyle = cell.hex;
          ctx.fillRect(cs + x * s, cs + y * s, s, s);
        }
      }
    }

    // 列坐标：小网格全显，大网格隔5显
    const dense = Math.max(w, h) < 30;
    const step = dense ? 1 : 5;
    ctx.fillStyle = '#555';
    ctx.font = `bold ${Math.max(8, Math.min(11, Math.floor(s/3)))}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let x = 0; x < w; x++) {
      if ((x + 1) % step === 0) {
        ctx.fillText(x + 1, cs + x * s + s/2, cs/2);
      }
    }

    // 行坐标
    ctx.textAlign = 'right';
    for (let y = 0; y < h; y++) {
      if ((y + 1) % step === 0) {
        ctx.fillText(y + 1, cs - 4, cs + y * s + s/2);
      }
    }

    // 网格线
    ctx.strokeStyle = '#e0e0e8';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= w; x++) {
      ctx.beginPath();
      ctx.moveTo(cs + x * s, cs);
      ctx.lineTo(cs + x * s, cs + h * s);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y++) {
      ctx.beginPath();
      ctx.moveTo(cs, cs + y * s);
      ctx.lineTo(cs + w * s, cs + y * s);
      ctx.stroke();
    }

    // 每5格粗线
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1.5;
    for (let x = 5; x < w; x += 5) {
      ctx.beginPath();
      ctx.moveTo(cs + x * s, cs);
      ctx.lineTo(cs + x * s, cs + h * s);
      ctx.stroke();
    }
    for (let y = 5; y < h; y += 5) {
      ctx.beginPath();
      ctx.moveTo(cs, cs + y * s);
      ctx.lineTo(cs + w * s, cs + y * s);
      ctx.stroke();
    }

    // 中心十字线
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    const midX = Math.floor(w / 2);
    const midY = Math.floor(h / 2);
    ctx.beginPath();
    ctx.moveTo(cs + midX * s, cs);
    ctx.lineTo(cs + midX * s, cs + h * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cs, cs + midY * s);
    ctx.lineTo(cs + w * s, cs + midY * s);
    ctx.stroke();
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
        // 在导入区域显示缩略图
        const area = this.uploadArea;
        area.innerHTML = '';
        area.style.padding = '8px';
        const thumb = document.createElement('img');
        thumb.src = e.target.result;
        thumb.style.maxWidth = '100%';
        thumb.style.maxHeight = '120px';
        thumb.style.borderRadius = '6px';
        thumb.style.display = 'block';
        thumb.style.margin = '0 auto';
        thumb.alt = '上传预览';
        area.appendChild(thumb);
        const label = document.createElement('div');
        label.style.fontSize = '0.75rem';
        label.style.color = 'var(--text-muted)';
        label.style.textAlign = 'center';
        label.style.marginTop = '4px';
        label.textContent = '点击重新选择';
        area.appendChild(label);
        showToast('图片已加载，点击"导入并像素化"');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  _applyImport() {
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
    showToast('导入完成，可逐格修改颜色');
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
      for (const [hex, count] of sorted.slice(0, 15)) {
        const name = this._findColorName(hex);
        html += `<div style="display:flex;align-items:center;gap:6px;padding:2px 0">
          <span style="width:14px;height:14px;border-radius:3px;background:${hex};border:1px solid #ddd;flex-shrink:0"></span>
          <span>${name || hex}</span><span style="margin-left:auto;color:var(--text-muted)">${count}格</span>
        </div>`;
      }
      if (sorted.length > 15) html += `<p style="color:var(--text-muted);margin-top:4px">...还有 ${sorted.length-15} 种颜色</p>`;
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
