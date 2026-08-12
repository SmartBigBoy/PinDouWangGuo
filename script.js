function flattenPalette(paletteName) {
    const palette = palettes[paletteName];
    if (!palette || !palette.series) return [];
    const colors = [];
    for (const seriesKey in palette.series) {
        const series = palette.series[seriesKey];
        if (series && series.colors) {
            colors.push(...series.colors);
        }
    }
    return colors;
}

class PixelArtGenerator {
    constructor() {
        this.originalImage = null;
        this.currentImageDataURL = null;  // 用于裁剪弹窗恢复
        this.pixelCanvas = null;
        this.currentColors = [];
        this.beadCountMap = new Map();
        this.pixelData = [];
        this.highlightColor = null;
        this._showLabels = false;

        this.palettes = {
            mard291: flattenPalette('mard291'),
            mard221: flattenPalette('mard221'),
            artkal: flattenPalette('artkal'),
            artkalMini: flattenPalette('artkalMini'),
            perler: flattenPalette('perler'),
            hama: flattenPalette('hama')
        };
        this.perlerColors = this.palettes.mard291;
        
        this.initElements();
        this.setupEventListeners();
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }

    getPaletteColorCount(palette) {
        const paletteData = palettes[palette];
        if (!paletteData) return 291;
        
        let count = 0;
        for (const series of Object.values(paletteData.series)) {
            count += series.colors.length;
        }
        return count;
    }

    _updateSliderTrack(slider) {
        const min = slider.min || 0;
        const max = slider.max || 100;
        const pct = ((slider.value - min) / (max - min)) * 100;
        slider.style.setProperty('--pct', pct + '%');
    }

    rgbToLab(r, g, b) {
        let x, y, z;
        r /= 255; g /= 255; b /= 255;

        r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
        g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
        b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

        x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
        y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
        z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

        x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
        y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
        z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;

        return {
            l: (116 * y) - 16,
            a: 500 * (x - y),
            b: 200 * (y - z)
        };
    }

    initElements() {
        this.imageInput = document.getElementById('imageInput');
        this.originalImageContainer = document.getElementById('originalImage');
        this.pixelatedContainer = document.getElementById('pixelatedImage');
        this.pixelSizeSlider = document.getElementById('pixelSize');
        this.pixelSizeValue = document.getElementById('pixelSizeValue');
        this.colorCountSlider = document.getElementById('colorCount');
        this.colorCountValue = document.getElementById('colorCountValue');
        this.paletteSelect = document.getElementById('paletteSelect');
        this.gridSizeSelect = document.getElementById('gridSize');
        this.customGridDiv = document.getElementById('customGrid');
        this.gridWidthInput = document.getElementById('gridWidth');
        this.gridHeightInput = document.getElementById('gridHeight');
        this.generateBtn = document.getElementById('generateBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.colorPalette = document.getElementById('colorPalette');
        this.statsSection = document.getElementById('statsSection');
        this.totalBeadsEl = document.getElementById('totalBeads');
        this.colorCountUsedEl = document.getElementById('colorCountUsed');
        this.gridDimensionsEl = document.getElementById('gridDimensions');
        this.exportCsvBtn = document.getElementById('exportCsvBtn');
        this.downloadPureBtn = document.getElementById('downloadPureBtn');
        this.downloadFullBtn = document.getElementById('downloadFullBtn');
        this.beadSizeSelect = document.getElementById('beadSize');
        this.physicalSizeEl = document.getElementById('physicalSize');
        this.physicalDimensionsEl = document.getElementById('physicalDimensions');

        // 裁剪弹窗元素
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
        this._cropSel = null;
        this._cropDragging = false;
        this._cropDragStart = null;
    }

    setupEventListeners() {
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));

        // 上传区域：在原图框上拖拽 + 点击兜底
        const uploadTarget = this.originalImageContainer;
        uploadTarget.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadTarget.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadTarget.addEventListener('drop', (e) => this.handleDrop(e));
        uploadTarget.addEventListener('click', (e) => {
            // 仅在空态（未上传图片）且点击的不是 label 内部时，手动触发文件选择
            if (!this.originalImage && e.target === uploadTarget) {
                this.imageInput.click();
            }
        });
        uploadTarget.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.imageInput.click();
            }
        });

        // 更换图片按钮
        const replaceBtn = document.getElementById('replaceImageBtn');
        if (replaceBtn) {
            replaceBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.imageInput.click();
            });
        }

        this.pixelSizeSlider.addEventListener('input', (e) => {
            this.pixelSizeValue.textContent = e.target.value;
            this._updateSliderTrack(e.target);
            this.scheduleAutoGenerate();
        });

        this.colorCountSlider.addEventListener('input', (e) => {
            this.colorCountValue.textContent = e.target.value;
            this._updateSliderTrack(e.target);
            this.scheduleAutoGenerate();
        });

        if (this.paletteSelect) {
            this.paletteSelect.addEventListener('change', (e) => {
                const palette = e.target.value;
                const maxColors = this.getPaletteColorCount(palette);
                this.colorCountSlider.max = maxColors;

                const currentValue = parseInt(this.colorCountSlider.value);
                if (currentValue > maxColors) {
                    this.colorCountSlider.value = maxColors;
                    this.colorCountValue.textContent = maxColors;
                } else {
                    this.colorCountValue.textContent = currentValue;
                }
                this.scheduleAutoGenerate();
            });
        }

        this.gridSizeSelect.addEventListener('change', (e) => {
            this.customGridDiv.style.display = e.target.value === 'custom' ? 'inline-flex' : 'none';
            this.autoAdjustPixelSize();
            this.scheduleAutoGenerate();
        });

        if (this.gridWidthInput) {
            this.gridWidthInput.addEventListener('change', () => this.scheduleAutoGenerate());
        }
        if (this.gridHeightInput) {
            this.gridHeightInput.addEventListener('change', () => this.scheduleAutoGenerate());
        }

        if (this.beadSizeSelect) {
            this.beadSizeSelect.addEventListener('change', () => this._updatePhysicalSize());
        }

        // 色号显示切换
        const showLabelsBtn = document.getElementById('showLabelsBtn');
        if (showLabelsBtn) {
            showLabelsBtn.addEventListener('click', () => {
                this._showLabels = !this._showLabels;
                showLabelsBtn.classList.toggle('active', this._showLabels);
                if (this.pixelData.length) {
                    const p = this._currentRenderParams;
                    if (p) this._rerenderFromData(p.pixelSize, p.gridW, p.gridH, p.coordSize);
                }
            });
        }

        this.generateBtn.addEventListener('click', () => {
            clearTimeout(this._autoGenTimer);
            this.generatePixelArt();
        });
        this.clearBtn.addEventListener('click', () => this.clearAll());

        if (this.exportCsvBtn) {
            this.exportCsvBtn.addEventListener('click', () => this.exportCsv());
        }

        if (this.downloadPureBtn) {
            this.downloadPureBtn.addEventListener('click', () => this.downloadPureImage());
        }

        if (this.downloadFullBtn) {
            this.downloadFullBtn.addEventListener('click', () => this.downloadFullImage());
        }

        if (this.colorCountSlider && this.paletteSelect) {
            const initialPalette = this.paletteSelect.value || 'mard291';
            const maxColors = this.getPaletteColorCount(initialPalette);
            this.colorCountSlider.max = maxColors;
            if (parseInt(this.colorCountSlider.value) > maxColors) {
                this.colorCountSlider.value = maxColors;
                this.colorCountValue.textContent = maxColors;
            }
        }

        // 裁剪弹窗事件绑定
        if (this.cropModal) {
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
    }

    handleDragOver(e) {
        e.preventDefault();
        this.originalImageContainer.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.originalImageContainer.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.originalImageContainer.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            this.loadImage(files[0]);
        }
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            this.loadImage(file);
        }
    }

    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                if (img.width > 4096 || img.height > 4096) {
                    showToast(`图片尺寸 ${img.width}×${img.height} 较大，生成可能较慢`, 'warning');
                } else if (file.size > 5 * 1024 * 1024) {
                    showToast('图片超过 5MB，建议压缩后上传', 'warning');
                }
                this.originalImage = img;
                this.currentImageDataURL = e.target.result;
                this.showOriginalImage(e.target.result);
                this.scheduleAutoGenerate();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }


    showOriginalImage(src) {
        this.originalImageContainer.classList.add('has-image');
        // 保持容器高度原样（aspect-ratio:1 正方形），仅改为纵向排列让内容居中
        this.originalImageContainer.style.flexDirection = 'column';
        // 显示缩略图 + 裁剪/重新选择按钮（内联样式覆盖 .image-replace-btn 默认的 display:none）
        this.originalImageContainer.innerHTML = `
            <img src="${src}" alt="原图" style="display:block;max-width:100%;max-height:120px;margin:0 auto;border-radius:6px;">
            <input type="file" id="imageInput" accept="image/*" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.001; font-size: 0; cursor: pointer; z-index: 3;">
            <div style="display:flex;gap:6px;margin-top:10px;justify-content:center;">
                <button id="cropOriginBtn" title="裁剪图片" style="display:inline-flex;align-items:center;gap:4px;position:static;padding:6px 12px;border-radius:8px;font-size:0.8rem;font-weight:600;cursor:pointer;border:none;background:#f0f0f5;color:#333;">✂️ 裁剪</button>
                <button id="replaceImageBtn" title="更换图片" style="display:inline-flex;align-items:center;gap:4px;position:static;padding:6px 12px;border-radius:8px;font-size:0.8rem;font-weight:600;cursor:pointer;border:none;background:rgba(0,0,0,0.72);color:#fff;">📷 重新选择</button>
            </div>`;
        // 重新获取引用并绑定事件
        this.imageInput = document.getElementById('imageInput');
        if (this.imageInput) {
            this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        }
        const replaceBtn = document.getElementById('replaceImageBtn');
        if (replaceBtn) {
            replaceBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.imageInput.click();
            });
        }
        const cropBtn = document.getElementById('cropOriginBtn');
        if (cropBtn) {
            cropBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._openCrop();
            });
        }
        // 点击容器（非按钮区域）也可触发更换图片
        this.originalImageContainer.onclick = (e) => {
            if (e.target === this.originalImageContainer || e.target.tagName === 'IMG') {
                this.imageInput.click();
            }
        };
    }

    getGridSize() {
        const selected = this.gridSizeSelect.value;
        if (selected === 'custom') {
            return {
                width: Math.max(5, Math.min(200, parseInt(this.gridWidthInput.value) || 58)),
                height: Math.max(5, Math.min(200, parseInt(this.gridHeightInput.value) || 58))
            };
        }
        const [w, h] = selected.split('x').map(Number);
        return { width: w, height: h };
    }

    autoAdjustPixelSize() {
        const gridSize = this.getGridSize();
        const maxDim = Math.max(gridSize.width, gridSize.height);
        let suggested;
        if (maxDim <= 15) suggested = 30;
        else if (maxDim <= 32) suggested = 18;
        else if (maxDim <= 50) suggested = 12;
        else if (maxDim <= 80) suggested = 10;
        else suggested = 8;

        this.pixelSizeSlider.value = suggested;
        this.pixelSizeValue.textContent = suggested;
    }

    /** 防抖自动生成：参数变化后 300ms 无新变化才触发生成 */
    scheduleAutoGenerate() {
        if (!this.originalImage) return;
        if (this._generating) return;
        clearTimeout(this._autoGenTimer);
        this._autoGenTimer = setTimeout(() => this.generatePixelArt(), 300);
    }

    generatePixelArt() {
        if (!this.originalImage) {
            showToast('请先上传图片', 'error');
            return;
        }
        if (this._generating) return;
        this._generating = true;
        this.generateBtn.disabled = true;
        this.generateBtn.textContent = '⏳ 生成中';

        setTimeout(() => {
            try {
                const pixelSize = parseInt(this.pixelSizeSlider.value);
                const colorCount = parseInt(this.colorCountSlider.value);
                const gridSize = this.getGridSize();
                const coordSize = 30;

                const canvas = document.createElement('canvas');
                canvas.width = gridSize.width * pixelSize + coordSize * 2;
                canvas.height = gridSize.height * pixelSize + coordSize * 2;
                const ctx = canvas.getContext('2d');

                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(this.originalImage, 0, 0, gridSize.width, gridSize.height);

                const imageData = ctx.getImageData(0, 0, gridSize.width, gridSize.height);
                const pixels = imageData.data;

                const colors = this.extractColors(pixels, colorCount);

                this.beadCountMap.clear();
                this.drawPixelArt(ctx, pixels, colors, gridSize.width, gridSize.height, pixelSize, this.highlightColor);

                this.currentColors = colors;
                this._currentRenderParams = { pixelSize, gridW: gridSize.width, gridH: gridSize.height, coordSize };
                this.showPixelArt(canvas, gridSize.width, gridSize.height, pixelSize, coordSize);
                this.showColorPalette(colors);
                this._calcBoundingBox();
                this._updatePhysicalSize();
                const actualTotal = Array.from(this.beadCountMap.values()).reduce(function(a, b) { return a + b; }, 0);
                this.updateStats(colors, actualTotal, gridSize.width, gridSize.height);

                this.pixelCanvas = canvas;
                this.downloadPureBtn.disabled = false;
                this.downloadFullBtn.disabled = false;
                this.enableExportButton();
            } catch (error) {
                console.error('生成图纸出错:', error);
                showToast('生成失败: ' + error.message, 'error');
            } finally {
                this._generating = false;
                this.generateBtn.disabled = false;
                this.generateBtn.textContent = '🎨 生成';
            }
        }, 50);
    }

    extractColors(pixels, colorCount) {
        const selectedValue = this.paletteSelect ? this.paletteSelect.value : 'mard291';
        const currentPalette = this.palettes[selectedValue] || this.perlerColors;

        // 动态采样步长：小图全采样，大图跳采
        const totalPixels = pixels.length / 4;
        const sampleStep = totalPixels < 1000 ? 1 : (totalPixels < 5000 ? 2 : 3);
        const sampleColors = [];

        for (let i = 0; i < pixels.length; i += 4 * sampleStep) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];

            if (a < 128) continue;

            sampleColors.push({ r, g, b });
        }

        if (sampleColors.length === 0) {
            return currentPalette.slice(0, Math.min(colorCount, 5));
        }

        // k-means 聚类（k 多取 20%，给去重留余量）
        const k = Math.min(colorCount, sampleColors.length);
        const extraK = Math.min(Math.ceil(k * 1.2), currentPalette.length, sampleColors.length);
        const kMeansClusters = this.kMeans(sampleColors, extraK);
        const clusterCenters = kMeansClusters.map(c => {
            const avgR = Math.round(c.reduce((sum, p) => sum + p.r, 0) / c.length);
            const avgG = Math.round(c.reduce((sum, p) => sum + p.g, 0) / c.length);
            const avgB = Math.round(c.reduce((sum, p) => sum + p.b, 0) / c.length);
            return { r: avgR, g: avgG, b: avgB, lab: this.rgbToLab(avgR, avgG, avgB), count: c.length };
        });

        // 按簇大小降序排列，大簇优先匹配
        clusterCenters.sort((a, b) => b.count - a.count);

        const selectedCount = Math.min(colorCount, currentPalette.length);
        const result = [];
        const usedHexes = new Set();

        // 第一轮：每个簇中心找最近色，自动去重
        for (const imgColor of clusterCenters) {
            if (result.length >= selectedCount) break;
            const closest = this.findClosestPerlerColor(imgColor, usedHexes, currentPalette);
            if (closest) {
                result.push(closest);
                usedHexes.add(closest.hex);
            }
        }

        // 第二轮：如果还有空位，从未使用的颜色中补充
        if (result.length < selectedCount) {
            for (const perlerColor of currentPalette) {
                if (!usedHexes.has(perlerColor.hex)) {
                    result.push(perlerColor);
                    usedHexes.add(perlerColor.hex);
                    if (result.length >= selectedCount) break;
                }
            }
        }

        return result.slice(0, selectedCount);
    }

    /** k-means++ 初始化：按距离概率选取初始中心，避免随机不稳定 */
    _kmeansPlusPlusInit(points, k) {
        const centroids = [];
        // 第一个中心随机选
        centroids.push({ ...points[Math.floor(Math.random() * points.length)] });
        // 后续中心按距离平方概率选取
        for (let c = 1; c < k; c++) {
            const dists = points.map(p => {
                let minD = Infinity;
                for (const cent of centroids) {
                    const d = this.colorDistance(p, cent);
                    if (d < minD) minD = d;
                }
                return minD;
            });
            const totalDist = dists.reduce((a, b) => a + b, 0);
            let r = Math.random() * totalDist;
            for (let i = 0; i < dists.length; i++) {
                r -= dists[i];
                if (r <= 0) {
                    centroids.push({ ...points[i] });
                    break;
                }
            }
            if (r > 0) centroids.push({ ...points[points.length - 1] });
        }
        return centroids;
    }

    kMeans(points, k, maxIterations = 30) {
        if (points.length === 0) return [];
        if (points.length < k) k = points.length;

        // 预计算所有点的 Lab 值
        for (const p of points) {
            if (!p.lab) p.lab = this.rgbToLab(p.r, p.g, p.b);
        }

        // k-means++ 初始化
        let centroids = this._kmeansPlusPlusInit(points, k);
        // 确保质心也有 Lab
        for (const c of centroids) {
            if (!c.lab) c.lab = this.rgbToLab(c.r, c.g, c.b);
        }

        let clusters;
        for (let iter = 0; iter < maxIterations; iter++) {
            clusters = Array.from({ length: k }, () => []);

            // 分配每个点到最近质心
            for (const point of points) {
                let nearestIdx = 0;
                let minDist = Infinity;
                for (let i = 0; i < centroids.length; i++) {
                    const dist = this.colorDistance(point, centroids[i]);
                    if (dist < minDist) {
                        minDist = dist;
                        nearestIdx = i;
                    }
                }
                clusters[nearestIdx].push(point);
            }

            // 检查空簇：分裂最大簇
            for (let i = 0; i < k; i++) {
                if (clusters[i].length === 0) {
                    // 找到最大的簇来分裂
                    let largestIdx = 0;
                    for (let j = 1; j < k; j++) {
                        if (clusters[j].length > clusters[largestIdx].length) {
                            largestIdx = j;
                        }
                    }
                    if (clusters[largestIdx].length > 1) {
                        const half = Math.floor(clusters[largestIdx].length / 2);
                        clusters[i] = clusters[largestIdx].splice(half);
                    }
                }
            }

            // 更新质心
            let converged = true;
            for (let i = 0; i < k; i++) {
                if (clusters[i].length === 0) continue;

                const avgR = Math.round(clusters[i].reduce((sum, p) => sum + p.r, 0) / clusters[i].length);
                const avgG = Math.round(clusters[i].reduce((sum, p) => sum + p.g, 0) / clusters[i].length);
                const avgB = Math.round(clusters[i].reduce((sum, p) => sum + p.b, 0) / clusters[i].length);
                const newCentroid = {
                    r: avgR, g: avgG, b: avgB,
                    lab: this.rgbToLab(avgR, avgG, avgB)
                };

                if (this.colorDistance(newCentroid, centroids[i]) > 1.5) {
                    converged = false;
                }
                centroids[i] = newCentroid;
            }

            if (converged) break;
        }

        return clusters.filter(c => c.length > 0);
    }

    colorDistance(c1, c2) {
        // 统一使用 Lab 色差，与最终匹配保持一致
        if (c1.lab && c2.lab) {
            const dl = c1.lab.l - c2.lab.l;
            const da = c1.lab.a - c2.lab.a;
            const db = c1.lab.b - c2.lab.b;
            return dl * dl + da * da + db * db;
        }
        // 兜底：RGB 平方距离
        const dr = c1.r - c2.r;
        const dg = c1.g - c2.g;
        const db = c1.b - c2.b;
        return dr * dr + dg * dg + db * db;
    }

    /** 计算 hex 颜色的相对亮度 (0~1)，用于选择对比文字色 */
    _luminance(hex) {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return 0.299 * r + 0.587 * g + 0.114 * b;
    }

    findClosestPerlerColor(target, usedHexes, palette) {
        const currentPalette = palette || this.perlerColors;
        let closest = null;
        let minDistance = Infinity;

        for (const color of currentPalette) {
            if (usedHexes.has(color.hex)) continue;

            const distance = this.labDistance(target, color);
            if (distance < minDistance) {
                minDistance = distance;
                closest = color;
            }
        }

        return closest;
    }

    // ============ 共享网格绘制方法 ============

    _drawGridBackground(ctx, w, h, pixelSize, coordSize, offsetX = 0, offsetY = 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = '#e8e7ee';
        // 左
        ctx.fillRect(offsetX, offsetY, coordSize, h * pixelSize + coordSize * 2);
        // 右
        ctx.fillRect(offsetX + coordSize + w * pixelSize, offsetY, coordSize, h * pixelSize + coordSize * 2);
        // 上
        ctx.fillRect(offsetX, offsetY, w * pixelSize + coordSize * 2, coordSize);
        // 下
        ctx.fillRect(offsetX, offsetY + coordSize + h * pixelSize, w * pixelSize + coordSize * 2, coordSize);
    }

    _drawGridCoords(ctx, w, h, pixelSize, coordSize, fontSize = 14, offsetX = 0, offsetY = 0) {
        // 字号：自适应，不超过边框的 65%
        const maxByBorder = Math.floor(coordSize * 0.6);
        const dynamicSize = Math.max(10, Math.min(maxByBorder, Math.floor(pixelSize * 0.6)));
        // 步长：小网格（<600格）每格显示，中网格每5，大网格每10
        const total = w * h;
        const step = total < 600 ? 1 : (total < 3000 ? 5 : 10);

        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.font = '600 ' + dynamicSize + 'px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
        for (let x = step - 1; x < w; x += step) {
            const tx = offsetX + coordSize + x * pixelSize + pixelSize / 2;
            const ty = offsetY + coordSize / 2;
            ctx.fillStyle = '#333333';
            ctx.fillText(x + 1, tx, ty);
        }
        ctx.textAlign = 'right';
        for (let y = step - 1; y < h; y += step) {
            const tx = offsetX + coordSize - 5;
            const ty = offsetY + coordSize + y * pixelSize + pixelSize / 2;
            ctx.font = '600 ' + dynamicSize + 'px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
            ctx.fillStyle = '#333333';
            ctx.fillText(y + 1, tx, ty);
        }
    }

    _drawGridLines(ctx, w, h, pixelSize, coordSize, offsetX = 0, offsetY = 0) {
        ctx.strokeStyle = '#e0e0e8';
        ctx.lineWidth = 1;
        for (let x = 0; x <= w; x++) {
            ctx.beginPath();
            ctx.moveTo(offsetX + coordSize + x * pixelSize, offsetY + coordSize);
            ctx.lineTo(offsetX + coordSize + x * pixelSize, offsetY + coordSize + h * pixelSize);
            ctx.stroke();
        }
        for (let y = 0; y <= h; y++) {
            ctx.beginPath();
            ctx.moveTo(offsetX + coordSize, offsetY + coordSize + y * pixelSize);
            ctx.lineTo(offsetX + coordSize + w * pixelSize, offsetY + coordSize + y * pixelSize);
            ctx.stroke();
        }
        ctx.strokeStyle = '#c5c5cd';
        ctx.lineWidth = 1;
        for (let x = 5; x < w; x += 5) {
            ctx.beginPath();
            ctx.moveTo(offsetX + coordSize + x * pixelSize, offsetY + coordSize);
            ctx.lineTo(offsetX + coordSize + x * pixelSize, offsetY + coordSize + h * pixelSize);
            ctx.stroke();
        }
        for (let y = 5; y < h; y += 5) {
            ctx.beginPath();
            ctx.moveTo(offsetX + coordSize, offsetY + coordSize + y * pixelSize);
            ctx.lineTo(offsetX + coordSize + w * pixelSize, offsetY + coordSize + y * pixelSize);
            ctx.stroke();
        }
    }

    _drawGridBase(ctx, w, h, pixelSize, coordSize, offsetX = 0, offsetY = 0, fontSize = 14) {
        this._drawGridBackground(ctx, w, h, pixelSize, coordSize, offsetX, offsetY);
        this._drawGridCoords(ctx, w, h, pixelSize, coordSize, fontSize, offsetX, offsetY);
        this._drawGridLines(ctx, w, h, pixelSize, coordSize, offsetX, offsetY);
    }

    /** 在像素格四周画粗边框（需在像素块画完后调用） */
    _drawGridBorder(ctx, w, h, pixelSize, coordSize, offsetX = 0, offsetY = 0) {
        ctx.fillStyle = '#333333';
        const t = 3; // 边框厚度
        const x = offsetX + coordSize;
        const y = offsetY + coordSize;
        const gw = w * pixelSize;
        const gh = h * pixelSize;
        // 上
        ctx.fillRect(x, y - t, gw, t);
        // 下
        ctx.fillRect(x, y + gh, gw, t);
        // 左
        ctx.fillRect(x - t, y, t, gh);
        // 右
        ctx.fillRect(x + gw, y, t, gh);
        // 四角补齐
        ctx.fillRect(x - t, y - t, t, t);
        ctx.fillRect(x + gw, y - t, t, t);
        ctx.fillRect(x - t, y + gh, t, t);
        ctx.fillRect(x + gw, y + gh, t, t);
    }

    drawPixelArt(ctx, pixels, colors, width, height, pixelSize, highlightColor = null) {
        const coordSize = 30;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        this._drawGridBase(ctx, width, height, pixelSize, coordSize);

        this.pixelData = [];
        const defaultColor = colors.length > 0 ? colors[0] : { hex: '#cccccc', name: 'Default' };

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];
                const a = pixels[i + 3];

                let closestColor = defaultColor;
                let fillColor = '#f5f5f5';
                let isEmpty = true;

                if (a >= 128) {
                    closestColor = this.findClosestColor({ r, g, b }, colors);
                    isEmpty = false;

                    const key = closestColor.hex;
                    this.beadCountMap.set(key, (this.beadCountMap.get(key) || 0) + 1);

                    if (highlightColor && closestColor.hex === highlightColor) {
                        fillColor = closestColor.hex;
                    } else if (highlightColor) {
                        fillColor = closestColor.hex;
                        ctx.globalAlpha = 0.25;
                    } else {
                        fillColor = closestColor.hex;
                    }
                }

                ctx.fillStyle = fillColor;
                if (highlightColor && !isEmpty && closestColor.hex !== highlightColor) {
                    ctx.globalAlpha = 0.25;
                }
                ctx.fillRect(coordSize + x * pixelSize, coordSize + y * pixelSize, pixelSize - 1, pixelSize - 1);
                ctx.globalAlpha = 1.0;

                // 非空像素格内绘制颜色编号
                if (this._showLabels && !isEmpty && pixelSize >= 8 && closestColor.name) {
                    const fontSize = Math.max(6, Math.round(pixelSize * 0.35));
                    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    // 根据背景色亮度选黑/白文字
                    const hr = parseInt(closestColor.hex.slice(1, 3), 16);
                    const hg = parseInt(closestColor.hex.slice(3, 5), 16);
                    const hb = parseInt(closestColor.hex.slice(5, 7), 16);
                    const lum = (0.299 * hr + 0.587 * hg + 0.114 * hb) / 255;
                    ctx.fillStyle = lum > 0.5 ? '#000000' : '#ffffff';
                    ctx.shadowColor = lum > 0.5 ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)';
                    ctx.shadowBlur = 3;
                    ctx.fillText(
                        closestColor.name,
                        coordSize + x * pixelSize + pixelSize / 2,
                        coordSize + y * pixelSize + pixelSize / 2
                    );
                    ctx.shadowBlur = 0;
                }

                row.push({ color: closestColor, x, y, isEmpty });
            }
            this.pixelData.push(row);
        }
        this._drawGridBorder(ctx, width, height, pixelSize, coordSize);
    }

    dimColor(hex, factor) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const nr = Math.round(r * factor);
        const ng = Math.round(g * factor);
        const nb = Math.round(b * factor);
        return `rgb(${nr}, ${ng}, ${nb})`;
    }

    findClosestColor(target, colors) {
        let closest = colors[0];
        let minDistance = Infinity;

        if (!target.lab) {
            target.lab = this.rgbToLab(target.r, target.g, target.b);
        }

        for (const color of colors) {
            const distance = this.labDistance(target, color);
            if (distance < minDistance) {
                minDistance = distance;
                closest = color;
            }
        }

        return closest;
    }

    labDistance(c1, c2) {
        const getLab = (obj) => {
            if (obj.lab) return obj.lab;
            if (obj.r !== undefined && obj.g !== undefined && obj.b !== undefined) {
                return this.rgbToLab(obj.r, obj.g, obj.b);
            }
            if (obj.hex) {
                const r = parseInt(obj.hex.slice(1, 3), 16);
                const g = parseInt(obj.hex.slice(3, 5), 16);
                const b = parseInt(obj.hex.slice(5, 7), 16);
                return this.rgbToLab(r, g, b);
            }
            return { l: 0, a: 0, b: 0 };
        };

        const lab1 = getLab(c1);
        const lab2 = getLab(c2);

        return Math.sqrt(
            Math.pow(lab1.l - lab2.l, 2) +
            Math.pow(lab1.a - lab2.a, 2) +
            Math.pow(lab1.b - lab2.b, 2)
        );
    }

    showPixelArt(canvas, width, height, pixelSize, coordSize) {
        const self = this;
        // 存到实例上，供全屏重绘时切换分辨率
        self._px = pixelSize;
        self._cx = coordSize;
        this.pixelatedContainer.innerHTML = `
            <div class="pixel-canvas-wrapper" style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                <canvas id="pixelatedCanvas" width="${canvas.width}" height="${canvas.height}" style="cursor: crosshair; max-width: 100%; max-height: 100%; image-rendering: pixelated; image-rendering: crisp-edges;"></canvas>
                <div id="coordTooltip" style="position: absolute; background: rgba(26, 26, 46, 0.95); color: #f5f5f5; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; pointer-events: none; display: none; z-index: 100; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.2);"></div>
                <button class="fs-exit" id="fsExit" title="退出全屏 (Esc)">✕</button>
                <div class="fs-zoom-badge" id="fsZoomBadge" style="display: none; position: absolute; bottom: 72px; right: 12px; background: rgba(26,26,46,0.85); color: #fff; padding: 4px 10px; border-radius: 12px; font-size: 13px; font-weight: 600; pointer-events: none; z-index: 50;">100%</div>
                <div class="fs-color-bar" id="fsColorBar">
                    <button class="fs-btn" id="fsPrev">◀</button>
                    <div class="fs-color-info">
                        <span class="fs-color-dot" id="fsColorDot"></span>
                        <span class="fs-color-label" id="fsColorLabel">全部颜色</span>
                    </div>
                    <button class="fs-btn" id="fsNext">▶</button>
                    <button class="fs-btn fs-all" id="fsAll">全部</button>
                    <span class="fs-color-index" id="fsColorIndex"></span>
                </div>
            </div>
        `;
        const destCanvas = document.getElementById('pixelatedCanvas');
        const tooltip = document.getElementById('coordTooltip');
        destCanvas.getContext('2d').drawImage(canvas, 0, 0);

        const wrapper = destCanvas.parentElement;

        // 全屏平移状态（canvas 用 transform 定位，拖动画布查看超出视口的区域）
        let panning = false, panStartX = 0, panStartY = 0;
        let touchPanning = false;   // 触摸拖动平移标志
        let fsTx = 0, fsTy = 0;     // canvas 相对 wrapper 的位移（全屏）

        // 应用 canvas 位移（全屏时生效，非全屏清空）
        function updateTransform() {
            if (isFS()) {
                destCanvas.style.transform = `translate(${fsTx}px, ${fsTy}px)`;
            } else {
                destCanvas.style.transform = '';
            }
        }

        // 全屏时让画布在可用区域内居中
        function centerCanvas() {
            const availW = wrapper.clientWidth;
            const availH = wrapper.clientHeight - 56; // 底部导航
            fsTx = Math.max(0, (availW - destCanvas.width) / 2);
            fsTy = Math.max(0, (availH - destCanvas.height) / 2);
            updateTransform();
        }

        // 自适应缩放：让画布填满预览框且保持宽高比
        function fitCanvas() {
            const cw = destCanvas.width, ch = destCanvas.height;
            const ww = wrapper.clientWidth, wh = wrapper.clientHeight;
            if (!ww || !wh) return;
            const scale = Math.min(ww / cw, wh / ch);
            destCanvas.style.width  = (cw * scale) + 'px';
            destCanvas.style.height = (ch * scale) + 'px';
        }
        fitCanvas();

        // 全屏 —— 标题栏按钮
        const fullscreenBtn = document.getElementById('fullscreenTitleBtn');

        // 全屏工具函数
        const isFS = () =>
            document.fullscreenElement || document.webkitFullscreenElement;

        // 窗口 resize 时重新适配（非全屏状态），先清理旧监听
        if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
        this._resizeHandler = () => { if (!isFS()) fitCanvas(); };
        window.addEventListener('resize', this._resizeHandler);

        const exitFS = () => {
            const fn = document.exitFullscreen || document.webkitExitFullscreen;
            if (fn) fn.call(document);
        };

        if (fullscreenBtn) {
            fullscreenBtn.style.display = '';
            const requestFS = () => {
                const fn = wrapper.requestFullscreen || wrapper.webkitRequestFullscreen;
                if (fn) return fn.call(wrapper);
                showToast('浏览器不支持全屏', 'error');
            };
            const toggle = () => { if (isFS()) exitFS(); else requestFS(); };
            fullscreenBtn.onclick = toggle;

            // 全屏渲染（使用当前 self._px / self._cx）
            function renderFullRes() {
                const gW = width, gH = height;
                const pd = self.pixelData;
                if (!pd || !pd.length) return;
                const ps = self._px, cs = self._cx;

                destCanvas.width = gW * ps + cs * 2;
                destCanvas.height = gH * ps + cs * 2;
                // 允许放大超过视口，由 wrapper 滚动 + 锚点缩放控制查看区域
                destCanvas.style.width = destCanvas.width + 'px';
                destCanvas.style.height = destCanvas.height + 'px';
                const ctx = destCanvas.getContext('2d');
                ctx.imageSmoothingEnabled = false;
                self._drawGridBase(ctx, gW, gH, ps, cs);
                for (let y = 0; y < gH && y < pd.length; y++) {
                    for (let x = 0; x < gW && x < pd[y].length; x++) {
                        const p = pd[y][x];
                        if (!p || p.isEmpty) continue;
                        ctx.fillStyle = p.color.hex;
                        ctx.fillRect(cs + x * ps, cs + y * ps, ps - 1, ps - 1);
                        // 颜色编号
                        if (self._showLabels && ps >= 8 && p.color.name) {
                            const fz = Math.max(6, Math.round(ps * 0.35));
                            ctx.font = `bold ${fz}px Arial, sans-serif`;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            const hr2 = parseInt(p.color.hex.slice(1, 3), 16);
                            const hg2 = parseInt(p.color.hex.slice(3, 5), 16);
                            const hb2 = parseInt(p.color.hex.slice(5, 7), 16);
                            const lum2 = (0.299 * hr2 + 0.587 * hg2 + 0.114 * hb2) / 255;
                            ctx.fillStyle = lum2 > 0.5 ? '#000000' : '#ffffff';
                            ctx.shadowColor = lum2 > 0.5 ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)';
                            ctx.shadowBlur = 3;
                            ctx.fillText(p.color.name, cs + x * ps + ps / 2, cs + y * ps + ps / 2);
                            ctx.shadowBlur = 0;
                        }
                    }
                }
                self._drawGridBorder(ctx, gW, gH, ps, cs);
            }

            const onFSChange = () => {
                const inFs = isFS();
                fullscreenBtn.innerHTML = inFs ? '✕ 退出' : '⛶ 全屏';
                fullscreenBtn.title = inFs ? '退出全屏' : '全屏查看';
                const zoomBadge = document.getElementById('fsZoomBadge');
                if (zoomBadge) zoomBadge.style.display = inFs ? 'block' : 'none';
                if (inFs) {
                    // 进入全屏：保存原尺寸，计算最佳适配尺寸
                    self._origPx = self._px;
                    self._origCx = self._cx;
                    self._zoomPx = self._px;
                    self._zoomCx = self._cx;
                    const estCS = 48;
                    const maxW = window.innerWidth - estCS - 16;
                    const maxH = window.innerHeight - estCS - 68;
                    const newCS = 30;
                    const newPS = Math.max(10, Math.min(Math.floor((maxW - newCS * 2) / width), Math.floor((maxH - newCS * 2) / height)));
                    self._px = newPS;
                    self._cx = newCS;
                    self._zoomPx = newPS;
                    self._zoomCx = newCS;
                } else {
                    // 退出全屏：恢复原尺寸并复位位移
                    self._px = self._origPx || self._px;
                    self._cx = self._origCx || self._cx;
                    fsTx = 0;
                    fsTy = 0;
                    updateTransform();
                }
                renderFullRes();
                updateZoomBadge();
                if (inFs) {
                    centerCanvas();
                } else {
                    setTimeout(fitCanvas, 50);
                }
            };
            // 清除旧监听器，避免多次 showPixelArt 造成泄漏
            if (this._fsHandler) {
                document.removeEventListener('fullscreenchange', this._fsHandler);
                document.removeEventListener('webkitfullscreenchange', this._fsHandler);
            }
            this._fsHandler = onFSChange;
            document.addEventListener('fullscreenchange', this._fsHandler);
            document.addEventListener('webkitfullscreenchange', this._fsHandler);

            // 缩放比例显示更新
            function updateZoomBadge() {
                const badge = document.getElementById('fsZoomBadge');
                if (badge && self._zoomPx) {
                    const pct = Math.round(self._px / self._zoomPx * 100);
                    badge.textContent = pct + '%';
                }
            }

            // 全屏模式：鼠标滚轮缩放（以鼠标位置为锚点，悬停的局部区域保持不动）
            wrapper.addEventListener('wheel', (e) => {
                if (!isFS()) return;
                e.preventDefault();
                const rect = destCanvas.getBoundingClientRect();
                // 锚点内容坐标（相对 canvas 左上角，rect 已含 transform 位移）
                const contentX = e.clientX - rect.left;
                const contentY = e.clientY - rect.top;
                const zoomIn = e.deltaY < 0;
                const step = self._px >= 40 ? 5 : (self._px >= 20 ? 3 : 2);
                const newPS = Math.max(5, Math.min(100, self._px + (zoomIn ? step : -step)));
                if (newPS !== self._px) {
                    const oldPS = self._px;
                    const cs = self._cx;
                    self._px = newPS;
                    self._cx = 30;
                    renderFullRes();
                    updateZoomBadge();
                    // 锚点缩放：用格子内容比例（newPS/oldPS），先扣除坐标轴偏移 cs，
                    // 保证鼠标悬停的内容格子缩放后仍位于鼠标下方
                    const ratio = newPS / oldPS;
                    fsTx = fsTx + (contentX - cs) * (1 - ratio);
                    fsTy = fsTy + (contentY - cs) * (1 - ratio);
                    updateTransform();
                }
            }, { passive: false });

            // 全屏模式：鼠标拖动平移（画布超过视口后按住拖动查看局部）
            let panStartTx = 0, panStartTy = 0;
            const onPanDown = (e) => {
                if (!isFS() || e.button !== 0) return;
                if (e.target !== destCanvas) return;
                panning = true;
                panStartX = e.clientX;
                panStartY = e.clientY;
                panStartTx = fsTx;
                panStartTy = fsTy;
                wrapper.style.cursor = 'grabbing';
                tooltip.style.display = 'none';
            };
            const onPanMove = (e) => {
                if (!isFS() || !panning) return;
                fsTx = panStartTx + (e.clientX - panStartX);
                fsTy = panStartTy + (e.clientY - panStartY);
                updateTransform();
                tooltip.style.display = 'none';
            };
            const onPanUp = () => {
                if (!panning) return;
                panning = false;
                wrapper.style.cursor = '';
            };
            wrapper.addEventListener('pointerdown', onPanDown);
            // 清理旧监听，避免多次 showPixelArt 造成 window 级监听泄漏
            if (this._panMoveHandler) window.removeEventListener('pointermove', this._panMoveHandler);
            if (this._panUpHandler) window.removeEventListener('pointerup', this._panUpHandler);
            this._panMoveHandler = onPanMove;
            this._panUpHandler = onPanUp;
            window.addEventListener('pointermove', onPanMove);
            window.addEventListener('pointerup', onPanUp);

            // 全屏模式：触摸双指缩放
            let touchDist0 = 0, touchPx0 = 0;
            wrapper.addEventListener('touchstart', (e) => {
                if (!isFS() || e.touches.length !== 2) return;
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                touchDist0 = Math.sqrt(dx * dx + dy * dy);
                touchPx0 = self._px;
            }, { passive: true });
            wrapper.addEventListener('touchmove', (e) => {
                if (!isFS() || e.touches.length !== 2 || touchDist0 <= 0) return;
                e.preventDefault();
                const t0 = e.touches[0], t1 = e.touches[1];
                const midX = (t0.clientX + t1.clientX) / 2;
                const midY = (t0.clientY + t1.clientY) / 2;
                const rect = destCanvas.getBoundingClientRect();
                const contentX = midX - rect.left;
                const contentY = midY - rect.top;
                const dx = t0.clientX - t1.clientX;
                const dy = t0.clientY - t1.clientY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const scale = dist / touchDist0;
                const newPS = Math.max(5, Math.min(100, Math.round(touchPx0 * scale)));
                if (newPS !== self._px) {
                    const oldPS = self._px;
                    const cs = self._cx;
                    self._px = newPS;
                    self._cx = 30;
                    renderFullRes();
                    updateZoomBadge();
                    // 两指中心为锚点：用格子内容比例保持局部不动
                    const ratio = newPS / oldPS;
                    fsTx = fsTx + (contentX - cs) * (1 - ratio);
                    fsTy = fsTy + (contentY - cs) * (1 - ratio);
                    updateTransform();
                }
            }, { passive: false });
            wrapper.addEventListener('touchend', () => {
                touchDist0 = 0;
            });
        }

        // ========== 逐色导航（全屏底部） ==========
        const usedColors = (self.currentColors || [])
            .map(c => ({ ...c, count: self.beadCountMap.get(c.hex) || 0 }))
            .filter(c => c.count > 0)
            .sort((a, b) => b.count - a.count);

        let colorIndex = -1; // -1 = 显示全部

        // 核心重绘函数（提取自 handleCellClick）
        function redrawWithHighlight(hexColor) {
            self.highlightColor = hexColor || null;
            const ps = self._px, cs = self._cx;
            // 确保画布尺寸匹配当前缩放
            if (destCanvas.width !== width * ps + cs * 2 || destCanvas.height !== height * ps + cs * 2) {
                destCanvas.width = width * ps + cs * 2;
                destCanvas.height = height * ps + cs * 2;
                destCanvas.style.width = destCanvas.width + 'px';
                destCanvas.style.height = destCanvas.height + 'px';
            }
            const ctx = destCanvas.getContext('2d');
            ctx.clearRect(0, 0, destCanvas.width, destCanvas.height);
            self._drawGridBase(ctx, width, height, ps, cs);

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const pixel = self.pixelData[y][x];
                    const isEmpty = pixel.isEmpty || false;
                    const isHL = hexColor && pixel.color.hex === hexColor;

                    if (isEmpty) {
                        ctx.fillStyle = '#f5f5f5';
                        ctx.strokeStyle = '#e0e0e0';
                        ctx.lineWidth = 0.5;
                        ctx.globalAlpha = 1.0;
                    } else if (hexColor) {
                        ctx.fillStyle = pixel.color.hex;
                        ctx.strokeStyle = isHL ? pixel.color.hex : '#d0d0d8';
                        ctx.lineWidth = isHL ? 1.5 : 0.5;
                        ctx.globalAlpha = isHL ? 1.0 : 0.22;
                    } else {
                        ctx.fillStyle = pixel.color.hex;
                        ctx.strokeStyle = '#e0e0e0';
                        ctx.lineWidth = 0.5;
                        ctx.globalAlpha = 1.0;
                    }
                    ctx.fillRect(self._cx + x * self._px, self._cx + y * self._px, self._px - 1, self._px - 1);
                    ctx.strokeRect(self._cx + x * self._px, self._cx + y * self._px, self._px - 1, self._px - 1);
                    // 颜色编号（非空像素 + 非高亮淡化态时绘制）
                    if (self._showLabels && !isEmpty && self._px >= 8 && pixel.color.name && (!hexColor || isHL)) {
                        const fz3 = Math.max(6, Math.round(self._px * 0.35));
                        ctx.font = `bold ${fz3}px Arial, sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        const hr3 = parseInt(pixel.color.hex.slice(1, 3), 16);
                        const hg3 = parseInt(pixel.color.hex.slice(3, 5), 16);
                        const hb3 = parseInt(pixel.color.hex.slice(5, 7), 16);
                        const lum3 = (0.299 * hr3 + 0.587 * hg3 + 0.114 * hb3) / 255;
                        ctx.fillStyle = lum3 > 0.5 ? '#000000' : '#ffffff';
                        ctx.shadowColor = lum3 > 0.5 ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)';
                        ctx.shadowBlur = 3;
                        ctx.fillText(pixel.color.name, self._cx + x * self._px + self._px / 2, self._cx + y * self._px + self._px / 2);
                        ctx.shadowBlur = 0;
                    }
                }
            }
            ctx.globalAlpha = 1.0;

            if (hexColor) {
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const p = self.pixelData[y][x];
                        if (!p.isEmpty && p.color.hex === hexColor) {
                            ctx.strokeStyle = hexColor;
                            ctx.lineWidth = 3;
                            ctx.shadowColor = hexColor;
                            ctx.shadowBlur = 8;
                            ctx.strokeRect(self._cx + x * self._px + 1, self._cx + y * self._px + 1, self._px - 3, self._px - 3);
                            ctx.shadowBlur = 0;
                        }
                    }
                }
            }
            self._drawGridBorder(ctx, width, height, self._px, self._cx);
        }

        // 更新底部导航栏
        function updateColorBar() {
            const dot = document.getElementById('fsColorDot');
            const label = document.getElementById('fsColorLabel');
            const index = document.getElementById('fsColorIndex');
            if (colorIndex >= 0 && colorIndex < usedColors.length) {
                const c = usedColors[colorIndex];
                dot.style.background = c.hex;
                dot.style.borderColor = c.hex;
                label.textContent = `${c.name} · ${c.count}颗`;
                index.textContent = `${colorIndex + 1}/${usedColors.length}`;
            } else {
                dot.style.background = 'transparent';
                dot.style.borderColor = 'rgba(255,255,255,0.3)';
                label.textContent = '全部颜色';
                index.textContent = `${usedColors.length}色`;
            }
        }

        // 绑定导航按钮
        if (usedColors.length > 0) {
            document.getElementById('fsPrev').onclick = () => {
                colorIndex = colorIndex < 0 ? 0 : (colorIndex - 1 + usedColors.length) % usedColors.length;
                updateColorBar();
                redrawWithHighlight(usedColors[colorIndex].hex);
            };
            document.getElementById('fsNext').onclick = () => {
                colorIndex = colorIndex < 0 ? 0 : (colorIndex + 1) % usedColors.length;
                updateColorBar();
                redrawWithHighlight(usedColors[colorIndex].hex);
            };
            document.getElementById('fsAll').onclick = () => {
                colorIndex = -1;
                updateColorBar();
                redrawWithHighlight(null);
            };
        }
        // 退出全屏按钮（始终绑定）
        const fsExitBtn = document.getElementById('fsExit');
        if (fsExitBtn) fsExitBtn.onclick = exitFS;
        updateColorBar();

        // ========== 鼠标 / 触控坐标提示 + 点击高亮 ==========
        let lastHoveredCell = null;
        let touchStartX = 0, touchStartY = 0;

        function getGridFromEvent(clientX, clientY) {
            const rect = destCanvas.getBoundingClientRect();
            // 全屏下 object-fit: contain 会让画布居中留白，需计算实际绘制区域
            const natW = destCanvas.width;
            const natH = destCanvas.height;
            const dispW = rect.width;
            const dispH = rect.height;
            const ratio = Math.min(dispW / natW, dispH / natH);
            const drawW = natW * ratio;
            const drawH = natH * ratio;
            const offsetX2 = (dispW - drawW) / 2;
            const offsetY2 = (dispH - drawH) / 2;
            const scaleX = natW / drawW;
            const scaleY = natH / drawH;
            const x = ((clientX - rect.left) - offsetX2) * scaleX;
            const y = ((clientY - rect.top) - offsetY2) * scaleY;
            return {
                gridX: Math.floor((x - self._cx) / self._px),
                gridY: Math.floor((y - self._cx) / self._px),
                offsetX: clientX - rect.left,
                offsetY: clientY - rect.top,
                rect
            };
        }

        function updateTooltip(gridX, gridY, offsetX, offsetY, rect, cx, cy) {
            if (gridX >= 0 && gridX < width && gridY >= 0 && gridY < height) {
                const cellKey = `${gridX},${gridY}`;
                if (cellKey !== lastHoveredCell) {
                    lastHoveredCell = cellKey;
                    const pixelInfo = self.pixelData[gridY]?.[gridX];
                    const colorHex = pixelInfo?.color?.hex || '#cccccc';
                    const colorName = pixelInfo?.color?.name || '未填充';
                    tooltip.innerHTML = `<span style="color: ${colorHex}; font-size: 14px;">●</span> 坐标: (${gridX + 1}, ${gridY + 1}) | ${colorName}`;
                    tooltip.style.display = 'block';
                    // 用鼠标相对于 wrapper 的位置定位（避开全屏下 canvas 居中偏移）
                    const wRect = wrapper.getBoundingClientRect();
                    const mX = cx - wRect.left;
                    const mY = cy - wRect.top;
                    const tipW = tooltip.offsetWidth;
                    let tooltipX = mX + 10;
                    let tooltipY = mY - 28;
                    if (tooltipX + tipW + 6 > wRect.width) {
                        tooltipX = mX - tipW - 8;
                    }
                    if (tooltipY < 0) tooltipY = mY + 12;
                    tooltip.style.left = tooltipX + 'px';
                    tooltip.style.top = tooltipY + 'px';
                }
            } else {
                tooltip.style.display = 'none';
                lastHoveredCell = null;
            }
        }

        function handleCellClick(gridX, gridY) {
            if (gridX >= 0 && gridX < width && gridY >= 0 && gridY < height) {
                const pixel = self.pixelData[gridY]?.[gridX];
                if (!pixel || pixel.isEmpty) return;
                const hex = pixel.color?.hex;
                if (hex) {
                    if (self.highlightColor === hex) {
                        colorIndex = -1;
                        updateColorBar();
                        redrawWithHighlight(null);
                        showToast('已取消高亮，显示全图');
                    } else {
                        colorIndex = usedColors.findIndex(c => c.hex === hex);
                        if (colorIndex < 0) colorIndex = 0;
                        updateColorBar();
                        redrawWithHighlight(hex);
                        self.selectColorInPalette(hex);
                        showToast(`已高亮: ${hex}`);
                    }
                }
            }
        }
        destCanvas.addEventListener('mousemove', (e) => {
            if (panning) return;
            const { gridX, gridY, offsetX, offsetY, rect } = getGridFromEvent(e.clientX, e.clientY);
            updateTooltip(gridX, gridY, offsetX, offsetY, rect, e.clientX, e.clientY);
        });
        destCanvas.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
            lastHoveredCell = null;
        });
        destCanvas.addEventListener('click', (e) => {
            const { gridX, gridY } = getGridFromEvent(e.clientX, e.clientY);
            handleCellClick(gridX, gridY);
        });
        destCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchPanning = false;
            const { gridX, gridY, offsetX, offsetY, rect } = getGridFromEvent(touch.clientX, touch.clientY);
            updateTooltip(gridX, gridY, offsetX, offsetY, rect, touch.clientX, touch.clientY);
        }, { passive: false });
        destCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            // 全屏单指拖动超过阈值 → 平移查看局部（画布超过视口时）
            if (isFS() && e.touches.length === 1) {
                const dx = touch.clientX - touchStartX;
                const dy = touch.clientY - touchStartY;
                if (Math.hypot(dx, dy) > 15) {
                    touchPanning = true;
                    fsTx += dx;
                    fsTy += dy;
                    updateTransform();
                    touchStartX = touch.clientX;
                    touchStartY = touch.clientY;
                    tooltip.style.display = 'none';
                    return;
                }
            }
            const { gridX, gridY, offsetX, offsetY, rect } = getGridFromEvent(touch.clientX, touch.clientY);
            updateTooltip(gridX, gridY, offsetX, offsetY, rect, touch.clientX, touch.clientY);
        }, { passive: false });
        destCanvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            tooltip.style.display = 'none';
            if (!touchPanning && Math.hypot(touchStartX - (e.changedTouches[0]?.clientX || 0),
                          touchStartY - (e.changedTouches[0]?.clientY || 0)) < 15) {
                const { gridX, gridY } = getGridFromEvent(touchStartX, touchStartY);
                handleCellClick(gridX, gridY);
            }
            touchPanning = false;
            lastHoveredCell = null;
        }, { passive: false });
    }

    showColorPalette(colors) {
        if (colors.length === 0) {
            this.colorPalette.innerHTML = '<p class="placeholder">颜色将在这里显示</p>';
            return;
        }

        const sortedColors = colors.map(c => ({
            ...c,
            count: this.beadCountMap.get(c.hex) || 0
        })).sort((a, b) => b.count - a.count).filter(c => c.count > 0);

        const self = this;
        const html = sortedColors.map((color, i) => `
            <div class="color-swatch" tabindex="0" role="button"
                 title="${color.name} (${color.count}颗) — 点击替换颜色"
                 aria-label="${color.name}，${color.count}颗"
                 data-hex="${color.hex}"
                 data-name="${color.name}">
                <div class="color-swatch-inner" style="background: ${color.hex};" aria-hidden="true"></div>
                <div class="color-swatch-info">
                    <span class="hex-code">${color.name}</span>
                    <span class="bead-count">${color.count}颗</span>
                </div>
                <button class="swatch-replace" data-hex="${color.hex}" title="替换此颜色">↻</button>
            </div>
        `).join('');

        this.colorPalette.innerHTML = html;

        // 点击色块 → 弹出替换面板
        this.colorPalette.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                // 如果点的是替换按钮，走按钮逻辑
                if (e.target.closest('.swatch-replace')) return;
                const hex = swatch.dataset.hex;
                if (window._picker) window._picker(hex);
            });
        });

        // 替换按钮绑定事件
        this.colorPalette.querySelectorAll('.swatch-replace').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const hex = btn.dataset.hex;
                if (window._picker) window._picker(hex);
            });
        });
    }

    /** 检测非空像素的边界框（自动识别背景色并裁剪空白边距） */
    _calcBoundingBox() {
        this._bbox = { minX: Infinity, maxX: -1, minY: Infinity, maxY: -1 };
        if (!this.pixelData || !this.pixelData.length) return;

        const h = this.pixelData.length;
        const w = this.pixelData[0].length;

        // 从四角采样判断背景色（取出现最多的颜色）
        const cornerColors = [
            this.pixelData[0][0].color,
            this.pixelData[0][w-1].color,
            this.pixelData[h-1][0].color,
            this.pixelData[h-1][w-1].color
        ];
        const bgHex = cornerColors.reduce((a, b) =>
            cornerColors.filter(c => c.hex === a.hex).length >=
            cornerColors.filter(c => c.hex === b.hex).length ? a : b
        ).hex;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const pixel = this.pixelData[y][x];
                // 跳过透明像素 或 背景色像素
                if (pixel.isEmpty || pixel.color.hex === bgHex) continue;
                if (x < this._bbox.minX) this._bbox.minX = x;
                if (x > this._bbox.maxX) this._bbox.maxX = x;
                if (y < this._bbox.minY) this._bbox.minY = y;
                if (y > this._bbox.maxY) this._bbox.maxY = y;
            }
        }
    }

    /** 计算实物尺寸并更新 UI */
    _updatePhysicalSize() {
        const beadMM = parseFloat(this.beadSizeSelect?.value || 5);
        const bbox = this._bbox;
        if (!bbox || bbox.maxX < 0) {
            if (this.physicalSizeEl) { this.physicalSizeEl.style.display = 'none'; }
            if (this.physicalDimensionsEl) this.physicalDimensionsEl.textContent = '—';
            return;
        }
        const wBeads = bbox.maxX - bbox.minX + 1;
        const hBeads = bbox.maxY - bbox.minY + 1;
        const wCM = ((wBeads * beadMM) / 10).toFixed(1);
        const hCM = ((hBeads * beadMM) / 10).toFixed(1);
        const label = `${wBeads}×${hBeads} 豆  ${wCM}×${hCM}cm`;
        if (this.physicalSizeEl) { this.physicalSizeEl.textContent = label; this.physicalSizeEl.style.display = ''; }
        if (this.physicalDimensionsEl) this.physicalDimensionsEl.textContent = `${wCM}×${hCM}cm`;
    }

    updateStats(colors, total, gridWidth, gridHeight) {
        if (this.statsSection) {
            this.statsSection.style.display = 'block';
            this.statsSection.classList.add('show');
        }
        if (this.totalBeadsEl) {
            this.totalBeadsEl.textContent = total.toLocaleString();
        }
        if (this.colorCountUsedEl) {
            this.colorCountUsedEl.textContent = colors.length;
        }
        if (this.gridDimensionsEl) {
            this.gridDimensionsEl.textContent = `${gridWidth}×${gridHeight}`;
        }
    }

    enableExportButton() {
        if (this.exportCsvBtn) {
            this.exportCsvBtn.disabled = !this.currentColors.length;
        }
    }

    /**
     * 绘制品牌引流卡片：白底 + 品牌粉边框，左侧渐变图标 + 右侧「拼豆王国 / 域名」
     * 用于导出纯像素图与全信息图，方便引流
     */
    _drawBrandCard(ctx, x, y, w, h) {
        const iconSize = Math.round(h * 0.52);
        const iconX = x + Math.round(w * 0.07);
        const iconY = y + Math.round((h - iconSize) / 2);
        const textX = iconX + iconSize + Math.round(w * 0.055);
        const nameSize = Math.max(20, Math.round(h * 0.28));
        const urlSize = Math.max(13, Math.round(h * 0.18));

        // 卡片背景 + 品牌粉描边
        ctx.save();
        ctx.fillStyle = '#ffffff';
        this.roundRect(ctx, x, y, w, h, Math.round(h * 0.13));
        ctx.strokeStyle = '#F4A0B8';
        ctx.lineWidth = Math.max(2, Math.round(h * 0.024));
        ctx.stroke();

        // 品牌图标：粉→紫渐变圆角方块 + 白色豆点
        const grad = ctx.createLinearGradient(iconX, iconY, iconX + iconSize, iconY + iconSize);
        grad.addColorStop(0, '#F4A0B8');
        grad.addColorStop(1, '#8A6FE8');
        ctx.fillStyle = grad;
        this.roundRect(ctx, iconX, iconY, iconSize, iconSize, Math.round(iconSize * 0.22));
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, Math.round(iconSize * 0.2), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.65)';
        ctx.lineWidth = Math.max(2, Math.round(iconSize * 0.045));
        ctx.beginPath();
        ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, Math.round(iconSize * 0.36), 0, Math.PI * 2);
        ctx.stroke();

        // 品牌名 + 域名
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#D4528A';
        ctx.font = `bold ${nameSize}px "Microsoft YaHei", "PingFang SC", Arial, sans-serif`;
        ctx.fillText('拼豆王国', textX, y + h * 0.36);
        ctx.fillStyle = '#777777';
        ctx.font = `${urlSize}px "Courier New", Consolas, monospace`;
        ctx.fillText('https://pindou.skin', textX, y + h * 0.70);
        ctx.restore();
    }

    downloadPureImage() {
        if (!this.pixelData.length) return;

        const targetWidth = 3840;
        const targetHeight = 2160;
        const coordSize = 60;

        const dataWidth = this.pixelData[0].length;
        const dataHeight = this.pixelData.length;

        const availableWidth = targetWidth - coordSize;
        const availableHeight = targetHeight - coordSize;

        const pixelSize = Math.min(Math.floor(availableWidth / dataWidth), Math.floor(availableHeight / dataHeight));
        const actualWidth = dataWidth * pixelSize + coordSize;
        const actualHeight = dataHeight * pixelSize + coordSize;

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        ctx.fillStyle = '#f5f5f0';
        ctx.fillRect(0, 0, actualWidth, coordSize);
        ctx.fillRect(0, 0, coordSize, actualHeight);

        const offsetX = Math.floor((targetWidth - actualWidth) / 2);
        const offsetY = Math.floor((targetHeight - actualHeight) / 2);

        ctx.fillStyle = '#333333';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let x = 0; x < dataWidth; x++) {
            ctx.fillText(x + 1, offsetX + coordSize + x * pixelSize + pixelSize / 2, offsetY + coordSize / 2);
        }

        ctx.textAlign = 'right';
        for (let y = 0; y < dataHeight; y++) {
            ctx.fillText(y + 1, offsetX + coordSize - 6, offsetY + coordSize + y * pixelSize + pixelSize / 2);
        }

        ctx.strokeStyle = '#e0e0e8';
        ctx.lineWidth = 1;
        for (let x = 0; x <= dataWidth; x++) {
            ctx.beginPath();
            ctx.moveTo(offsetX + coordSize + x * pixelSize, offsetY + coordSize);
            ctx.lineTo(offsetX + coordSize + x * pixelSize, offsetY + coordSize + dataHeight * pixelSize);
            ctx.stroke();
        }
        for (let y = 0; y <= dataHeight; y++) {
            ctx.beginPath();
            ctx.moveTo(offsetX + coordSize, offsetY + coordSize + y * pixelSize);
            ctx.lineTo(offsetX + coordSize + dataWidth * pixelSize, offsetY + coordSize + y * pixelSize);
            ctx.stroke();
        }

        for (let y = 0; y < dataHeight; y++) {
            for (let x = 0; x < dataWidth; x++) {
                const pixel = this.pixelData[y][x];
                const pixelColor = pixel.color;
                const isEmpty = pixel.isEmpty || false;

                if (isEmpty) {
                    ctx.fillStyle = '#f5f5f5';
                } else {
                    ctx.fillStyle = pixelColor.hex;
                }

                ctx.fillRect(offsetX + coordSize + x * pixelSize, offsetY + coordSize + y * pixelSize, pixelSize - 1, pixelSize - 1);
            }
        }

        // 引流卡片：图纸右侧留白垂直居中（与全信息图同款 430 宽卡片），空间不足则底部居中
        const cardW = 430, cardH = 132;
        const rightGap = targetWidth - (offsetX + actualWidth);
        let brandX, brandY;
        if (rightGap >= cardW + 40) {
            brandX = offsetX + actualWidth + Math.floor((rightGap - cardW) / 2);
            brandY = Math.floor((targetHeight - cardH) / 2);
        } else {
            brandX = Math.floor((targetWidth - cardW) / 2);
            brandY = targetHeight - cardH - 28;
        }
        this._drawBrandCard(ctx, brandX, brandY, cardW, cardH);

        const link = document.createElement('a');
        link.download = `pixel-art-pure-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('已下载纯像素图');
    }

    downloadFullImage() {
        if (!this.pixelData.length) return;

        const targetWidth = 3840;
        const targetHeight = 2160;

        const dataWidth = this.pixelData[0].length;
        const dataHeight = this.pixelData.length;
        const coordSize = 60;

        const usedColors = this.currentColors.filter(c => this.beadCountMap.get(c.hex) > 0);

        // 引流卡片紧贴图例正下方，两张卡片宽度一致、外框同色
        const cardH = 132;
        const bottomBrand = cardH + 36;
        const contentH = targetHeight - bottomBrand;
        const beadMM = parseFloat(this.beadSizeSelect?.value || 5);
        const bbox = this._bbox;
        const hasInfo = !!(bbox && bbox.maxX >= 0);

        // ===== 右侧信息卡片尺寸（内容自适应，区域整体放大） =====
        const pad = 24;              // 卡片内边距
        const rowHeight = 40;        // 色号行高
        const boxSize = 24;          // 色块大小
        const headH = 88;            // 标题 + 副标题 + 分隔线 + 列表起点
        const infoH = hasInfo ? 96 : 16;  // 列表下方分隔线 + 实物尺寸信息块 + 底部
        const availableMainHeight = contentH - coordSize - 40;
        const maxRows = Math.max(1, Math.floor((availableMainHeight - headH - infoH) / rowHeight));
        const legendColumns = Math.max(1, Math.ceil(usedColors.length / maxRows));
        const legendRows = Math.max(1, Math.ceil(usedColors.length / legendColumns));
        // 统一卡片宽度：内容所需宽度（列宽 250）与最小宽度 430 取大
        const cardW = Math.max(legendColumns * 250 + pad * 2, 430);
        const colWidth = (cardW - pad * 2) / legendColumns;
        const legendH = headH + legendRows * rowHeight + infoH + pad;

        // ===== 主图尺寸（主图 + 图例整体居中于内容区） =====
        const availableMainWidth = targetWidth - coordSize - cardW - 60;
        const mainPixelSize = Math.max(8, Math.min(Math.floor(availableMainWidth / dataWidth), Math.floor(availableMainHeight / dataHeight)));
        const mainWidth = dataWidth * mainPixelSize;
        const mainHeight = dataHeight * mainPixelSize;

        const totalW = mainWidth + coordSize + 40 + cardW;
        const mainOffsetX = Math.floor((targetWidth - totalW) / 2);
        const mainOffsetY = Math.floor((contentH - mainHeight - coordSize) / 2);
        const legendX = mainOffsetX + mainWidth + coordSize + 24;
        // 卡片上边缘与效果图（网格图案区域）上边框对齐，不含坐标轴行
        const legendY = mainOffsetY + coordSize;

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        ctx.fillStyle = '#f5f5f0';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // 主图背景
        ctx.fillStyle = '#f5f5f0';
        this.roundRect(ctx, mainOffsetX, mainOffsetY, mainWidth + coordSize, mainHeight + coordSize, 6);

        ctx.fillStyle = '#f5f5f0';
        ctx.fillRect(mainOffsetX, mainOffsetY + coordSize, coordSize, mainHeight);
        ctx.fillRect(mainOffsetX + coordSize, mainOffsetY, mainWidth, coordSize);

        ctx.fillStyle = '#333333';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let x = 0; x < dataWidth; x++) {
            ctx.fillText(x + 1, mainOffsetX + coordSize + x * mainPixelSize + mainPixelSize / 2, mainOffsetY + coordSize / 2);
        }

        ctx.textAlign = 'right';
        for (let y = 0; y < dataHeight; y++) {
            ctx.fillText(y + 1, mainOffsetX + coordSize - 6, mainOffsetY + coordSize + y * mainPixelSize + mainPixelSize / 2);
        }

        ctx.font = `${Math.max(6, mainPixelSize * 0.35)}px Arial`;
        ctx.textAlign = 'center';

        for (let y = 0; y < dataHeight; y++) {
            for (let x = 0; x < dataWidth; x++) {
                const pixel = this.pixelData[y][x];
                const pixelColor = pixel.color;
                const isEmpty = pixel.isEmpty || false;

                if (isEmpty) {
                    ctx.fillStyle = '#ffffff';
                } else {
                    ctx.fillStyle = pixelColor.hex;
                }

                ctx.fillRect(mainOffsetX + coordSize + x * mainPixelSize, mainOffsetY + coordSize + y * mainPixelSize, mainPixelSize, mainPixelSize);

                if (!isEmpty && mainPixelSize >= 10) {
                    // 根据背景亮度选择对比文字色
                    const luminance = this._luminance(pixelColor.hex);
                    const textColor = luminance > 0.5 ? '#222222' : '#ffffff';
                    const outlineColor = luminance > 0.5 ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)';
                    ctx.font = `${Math.max(7, mainPixelSize * 0.35)}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    // 描边（外发光效果）
                    ctx.shadowColor = outlineColor;
                    ctx.shadowBlur = 3;
                    ctx.fillStyle = textColor;
                    ctx.fillText(pixelColor.name, mainOffsetX + coordSize + x * mainPixelSize + mainPixelSize / 2, mainOffsetY + coordSize + y * mainPixelSize + mainPixelSize / 2 + 2);
                    ctx.shadowBlur = 0;
                }
            }
        }

        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        for (let x = 0; x <= dataWidth; x++) {
            ctx.beginPath();
            ctx.moveTo(mainOffsetX + coordSize + x * mainPixelSize, mainOffsetY + coordSize);
            ctx.lineTo(mainOffsetX + coordSize + x * mainPixelSize, mainOffsetY + coordSize + mainHeight);
            ctx.stroke();
        }
        for (let y = 0; y <= dataHeight; y++) {
            ctx.beginPath();
            ctx.moveTo(mainOffsetX + coordSize, mainOffsetY + coordSize + y * mainPixelSize);
            ctx.lineTo(mainOffsetX + coordSize + mainWidth, mainOffsetY + coordSize + y * mainPixelSize);
            ctx.stroke();
        }

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        for (let x = 5; x < dataWidth; x += 5) {
            ctx.beginPath();
            ctx.moveTo(mainOffsetX + coordSize + x * mainPixelSize, mainOffsetY + coordSize);
            ctx.lineTo(mainOffsetX + coordSize + x * mainPixelSize, mainOffsetY + coordSize + mainHeight);
            ctx.stroke();
        }
        for (let y = 5; y < dataHeight; y += 5) {
            ctx.beginPath();
            ctx.moveTo(mainOffsetX + coordSize, mainOffsetY + coordSize + y * mainPixelSize);
            ctx.lineTo(mainOffsetX + coordSize + mainWidth, mainOffsetY + coordSize + y * mainPixelSize);
            ctx.stroke();
        }

        // ===== 右侧信息卡片 =====
        // 卡片背景（外框与引流卡片一致的品牌粉）
        ctx.fillStyle = '#FBF7F8';
        this.roundRect(ctx, legendX, legendY, cardW, legendH, 14);
        ctx.strokeStyle = '#F4A0B8';
        ctx.lineWidth = 2;
        ctx.stroke();

        const y0 = legendY + pad;
        const contentW = cardW - pad * 2;

        // 标题：色号清单（品牌色粗体），品牌名作为下方副标题，避免与标题重合
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#D4528A';
        ctx.font = 'bold 30px "Microsoft YaHei", "PingFang SC", Arial, sans-serif';
        ctx.fillText('色号清单', legendX + pad, y0 + 20);
        const selectedPaletteKey = this.paletteSelect ? this.paletteSelect.value : 'mard291';
        const selectedPaletteName = palettes[selectedPaletteKey] ? palettes[selectedPaletteKey].name : 'MARD 全色 291';
        ctx.fillStyle = '#333333';
        ctx.font = '19px "Microsoft YaHei", "PingFang SC", Arial, sans-serif';
        ctx.fillText(selectedPaletteName, legendX + pad, y0 + 46);

        // 分隔线
        ctx.strokeStyle = '#EAD6DB';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(legendX + pad, y0 + 64);
        ctx.lineTo(legendX + cardW - pad, y0 + 64);
        ctx.stroke();

        // 色号列表：色块 + 名称（左） + 数量（列内右对齐）
        const listY = y0 + 80;
        usedColors.forEach((color, index) => {
            const col = Math.floor(index / legendRows);
            const row = index % legendRows;
            const x = legendX + pad + col * colWidth;
            const y = listY + row * rowHeight;

            // 色块（圆角）
            ctx.fillStyle = color.hex;
            this.roundRect(ctx, x, y + (rowHeight - boxSize) / 2, boxSize, boxSize, 6);
            ctx.strokeStyle = 'rgba(0,0,0,0.25)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // 名称
            ctx.fillStyle = '#333333';
            ctx.font = '19px "Microsoft YaHei", "PingFang SC", Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(color.name, x + boxSize + 12, y + rowHeight / 2 + 1);

            // 数量（右对齐，字体颜色与色号一致）
            ctx.fillStyle = '#333333';
            ctx.font = '19px "Microsoft YaHei", "PingFang SC", Arial, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${this.beadCountMap.get(color.hex)}颗`, x + colWidth - 8, y + rowHeight / 2 + 1);
        });

        // 列表下方分隔线
        const listBottom = listY + legendRows * rowHeight + 12;
        ctx.strokeStyle = '#EAD6DB';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(legendX + pad, listBottom);
        ctx.lineTo(legendX + cardW - pad, listBottom);
        ctx.stroke();

        // 实物尺寸信息块（放在色号清单下方，字体与色号一致）
        if (hasInfo) {
            const wBeads = bbox.maxX - bbox.minX + 1;
            const hBeads = bbox.maxY - bbox.minY + 1;
            const wCM = ((wBeads * beadMM) / 10).toFixed(1);
            const hCM = ((hBeads * beadMM) / 10).toFixed(1);
            const infoY = listBottom + 16;
            ctx.fillStyle = '#FCE9EE';
            this.roundRect(ctx, legendX + pad, infoY, contentW, 58, 10);
            ctx.textAlign = 'left';
            ctx.fillStyle = '#333333';
            ctx.font = '19px "Microsoft YaHei", "PingFang SC", Arial, sans-serif';
            ctx.fillText(`📏 实物尺寸  ${wCM}×${hCM}cm`, legendX + pad + 18, infoY + 21);
            ctx.fillStyle = '#333333';
            ctx.font = '19px "Microsoft YaHei", "PingFang SC", Arial, sans-serif';
            ctx.fillText(`${wBeads}×${hBeads} 豆 · ${beadMM}mm/粒`, legendX + pad + 18, infoY + 42);
        }

        // 引流卡片：与色号清单卡片同宽、同外框色、紧贴其正下方
        const brandX = legendX;
        let brandY = legendY + legendH + 14;
        if (brandY + cardH > targetHeight - 16) brandY = targetHeight - cardH - 16;
        this._drawBrandCard(ctx, brandX, brandY, cardW, cardH);

        const link = document.createElement('a');
        link.download = `pixel-art-full-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('已下载全信息图');
    }

    exportCsv() {
        if (!this.currentColors.length) return;

        const width = this.pixelData[0]?.length || 0;
        const height = this.pixelData.length || 0;
        const totalBeads = Array.from(this.beadCountMap.values()).reduce((a, b) => a + b, 0);
        const colorCount = this.currentColors.length;

        const colorCoordMap = new Map();
        for (let y = 0; y < this.pixelData.length; y++) {
            for (let x = 0; x < this.pixelData[y].length; x++) {
                const pixel = this.pixelData[y][x];
                if (pixel.isEmpty) continue;
                const colorHex = pixel.color.hex;
                if (!colorCoordMap.has(colorHex)) {
                    colorCoordMap.set(colorHex, []);
                }
                colorCoordMap.get(colorHex).push(`(${x + 1},${y + 1})`);
            }
        }

        const sortedColors = this.currentColors.map(c => ({
            ...c,
            count: this.beadCountMap.get(c.hex) || 0
        })).sort((a, b) => b.count - a.count);

        const rows = [];
        rows.push(['=== 拼豆材料清单 ===']);
        rows.push(['']);
        rows.push(['豆板尺寸', `${width} × ${height}`]);
        rows.push(['总拼豆数量', totalBeads]);
        rows.push(['颜色种类', colorCount]);
        rows.push(['使用色卡', this.paletteSelect?.value || 'MARD 291色']);
        // 实物尺寸信息
        const beadMM = parseFloat(this.beadSizeSelect?.value || 5);
        const bbox = this._bbox;
        if (bbox && bbox.maxX >= 0) {
            const wBeads = bbox.maxX - bbox.minX + 1;
            const hBeads = bbox.maxY - bbox.minY + 1;
            const wCM = ((wBeads * beadMM) / 10).toFixed(1);
            const hCM = ((hBeads * beadMM) / 10).toFixed(1);
            rows.push(['豆子尺寸', `${beadMM}mm`]);
            rows.push(['实物尺寸', `${wCM} × ${hCM} cm`]);
            rows.push(['实物范围', `第${bbox.minX+1}-${bbox.maxX+1}列 × 第${bbox.minY+1}-${bbox.maxY+1}行`]);
        }
        rows.push(['']);
        rows.push(['=== 颜色明细 ===']);
        rows.push(['序号', '色号', 'HEX值', '色系', '数量', '坐标列表']);
        
        let index = 1;
        for (const color of sortedColors) {
            if (color.count > 0) {
                const coords = colorCoordMap.get(color.hex) || [];
                const coordStr = coords.join(' ');
                rows.push([index, color.name, color.hex, color.seriesName, color.count, coordStr]);
                index++;
            }
        }

        const csvContent = rows.map(row => row.map(cell => {
            if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
                return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
        }).join(',')).join('\n');

        const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `materials-list-${Date.now()}.csv`;
        link.click();
        showToast('已下载材料清单');
    }

    selectColorInPalette(hex) {
        if (!this.colorPalette) return;
        const swatches = this.colorPalette.querySelectorAll('.color-swatch');
        swatches.forEach(el => {
            const inner = el.querySelector('.color-swatch-inner');
            if (inner) {
                const bg = inner.style.backgroundColor;
                if (bg && 'rgb(' + parseInt(hex.slice(1,3),16) + ', ' + parseInt(hex.slice(3,5),16) + ', ' + parseInt(hex.slice(5,7),16) + ')' === bg) {
                    el.style.outline = '3px solid #333';
                    el.style.outlineOffset = '2px';
                    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } else {
                    el.style.outline = '';
                    el.style.outlineOffset = '';
                }
            }
        });
    }

    replaceColor(sourceHex, targetHex) {
        if (sourceHex === targetHex || !this.pixelData.length) return;

        // 从当前色库中查找目标颜色对象（而非仅 currentColors）
        var paletteKey = this.paletteSelect ? this.paletteSelect.value : 'mard291';
        var flatPalette = this.palettes[paletteKey] || this.perlerColors;
        var targetColor = null;
        for (var i = 0; i < flatPalette.length; i++) {
            if (flatPalette[i].hex === targetHex) { targetColor = flatPalette[i]; break; }
        }
        if (!targetColor) return;

        for (let y = 0; y < this.pixelData.length; y++) {
            for (let x = 0; x < this.pixelData[y].length; x++) {
                const p = this.pixelData[y][x];
                if (!p.isEmpty && p.color.hex === sourceHex) {
                    p.color = targetColor;
                }
            }
        }
        this.beadCountMap.clear();
        for (let y = 0; y < this.pixelData.length; y++) {
            for (let x = 0; x < this.pixelData[y].length; x++) {
                const p = this.pixelData[y][x];
                if (!p.isEmpty) {
                    this.beadCountMap.set(p.color.hex, (this.beadCountMap.get(p.color.hex) || 0) + 1);
                }
            }
        }
        // 重建 currentColors：从 pixelData 中收集实际使用的颜色
        var usedColors = [];
        var seenHexes = new Set();
        for (var y = 0; y < this.pixelData.length; y++) {
            for (var x = 0; x < this.pixelData[y].length; x++) {
                var px = this.pixelData[y][x];
                if (!px.isEmpty && !seenHexes.has(px.color.hex)) {
                    seenHexes.add(px.color.hex);
                    usedColors.push(px.color);
                }
            }
        }
        this.currentColors = usedColors;
        this.showColorPalette(this.currentColors);
        const p = this._currentRenderParams;
        if (p) {
            this._rerenderFromData(p.pixelSize, p.gridW, p.gridH, p.coordSize);
        }
    }

    _rerenderFromData(pixelSize, gw, gh, coordSize) {
        const w = gw, h = gh;
        const canvas = document.createElement('canvas');
        canvas.width = w * pixelSize + coordSize * 2;
        canvas.height = h * pixelSize + coordSize * 2;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        this._drawGridBase(ctx, w, h, pixelSize, coordSize);
        for (let y = 0; y < h && y < this.pixelData.length; y++) {
            for (let x = 0; x < w && x < this.pixelData[y].length; x++) {
                const p = this.pixelData[y][x];
                if (p && !p.isEmpty) {
                    ctx.fillStyle = p.color.hex;
                    ctx.fillRect(coordSize + x * pixelSize, coordSize + y * pixelSize, pixelSize - 1, pixelSize - 1);
                    // 颜色编号
                    if (this._showLabels && pixelSize >= 8 && p.color.name) {
                        const fz4 = Math.max(6, Math.round(pixelSize * 0.35));
                        ctx.font = `bold ${fz4}px Arial, sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        const hr4 = parseInt(p.color.hex.slice(1, 3), 16);
                        const hg4 = parseInt(p.color.hex.slice(3, 5), 16);
                        const hb4 = parseInt(p.color.hex.slice(5, 7), 16);
                        const lum4 = (0.299 * hr4 + 0.587 * hg4 + 0.114 * hb4) / 255;
                        ctx.fillStyle = lum4 > 0.5 ? '#000000' : '#ffffff';
                        ctx.shadowColor = lum4 > 0.5 ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)';
                        ctx.shadowBlur = 3;
                        ctx.fillText(p.color.name, coordSize + x * pixelSize + pixelSize / 2, coordSize + y * pixelSize + pixelSize / 2);
                        ctx.shadowBlur = 0;
                    }
                }
            }
        }
        this._drawGridBorder(ctx, w, h, pixelSize, coordSize);
        this.showPixelArt(canvas, w, h, pixelSize, coordSize);
        this.enableExportButton();
        const total = Array.from(this.beadCountMap.values()).reduce(function(a, b) { return a + b; }, 0);
        if (this.statsSection) {
            this.statsSection.style.display = 'block';
            this.statsSection.classList.add('show');
        }
        if (this.totalBeadsEl) this.totalBeadsEl.textContent = total.toLocaleString();
        if (this.colorCountUsedEl) this.colorCountUsedEl.textContent = this.currentColors.filter(c => this.beadCountMap.get(c.hex) > 0).length;
        if (this.gridDimensionsEl) this.gridDimensionsEl.textContent = w + '×' + h;
    }


    clearAll() {
        this.imageInput.value = '';
        this.originalImage = null;
        this.currentImageDataURL = null;
        this.pixelCanvas = null;
        this.currentColors = [];
        this.beadCountMap.clear();
        this.pixelData = [];
        this.highlightColor = null;
        this._bbox = null;
        clearTimeout(this._autoGenTimer);
        if (this.physicalSizeEl) { this.physicalSizeEl.style.display = 'none'; }
        if (this.physicalDimensionsEl) this.physicalDimensionsEl.textContent = '—';

        if (this.originalImageContainer) {
            this.originalImageContainer.classList.remove('has-image');
            // 恢复默认的 row + 正方形比例
            this.originalImageContainer.style.flexDirection = '';
            this.originalImageContainer.style.aspectRatio = '';
            this.originalImageContainer.innerHTML = `
                <input type="file" id="imageInput" accept="image/*" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.001; font-size: 0; cursor: pointer; z-index: 3;">
                <label for="imageInput" class="upload-prompt">
                    <span class="upload-icon" aria-hidden="true">📷</span>
                    <p>点击或拖拽上传图片</p>
                    <p class="hint">支持 JPG、PNG、GIF 格式</p>
                </label>
                <button class="image-replace-btn" id="replaceImageBtn" title="更换图片" aria-label="更换图片">📷 更换图片</button>
            `;
            // 重新获取 imageInput 引用并绑定事件
            this.imageInput = document.getElementById('imageInput');
            if (this.imageInput) {
                this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
            }
            const replaceBtn = document.getElementById('replaceImageBtn');
            if (replaceBtn) {
                replaceBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.imageInput.click();
                });
            }
        }

        this.pixelatedContainer.innerHTML = `
            <div class="placeholder">
                <span>🧩</span>
                <p>像素化效果将在这里显示</p>
            </div>
        `;
        this.colorPalette.innerHTML = '<p class="placeholder">颜色将在这里显示</p>';
        this.downloadPureBtn.disabled = true;
        this.downloadFullBtn.disabled = true;

        if (this.statsSection) {
            this.statsSection.style.display = 'none';
            this.statsSection.classList.remove('show');
        }

        this.enableExportButton();
    }

    // ============ 图片裁剪 ============

    /** 打开裁剪弹窗 */
    _openCrop() {
        if (!this.currentImageDataURL) return;
        this.cropImage.src = this.currentImageDataURL;
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

    /** 确认裁剪：按选区裁出图片并替换当前图片 */
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
            this.originalImage = newImg;
            this.currentImageDataURL = croppedURL;
            this.showOriginalImage(croppedURL);
            this._closeCrop();
            showToast('已裁剪，正在重新生成…');
            this.scheduleAutoGenerate();
        };
        newImg.src = croppedURL;
    }
}

function copyColorInfo(hex, name) {
    const text = `${name} (${hex})`;
    navigator.clipboard.writeText(text).then(() => {
        showToast(`已复制: ${text}`);
    }).catch(err => {
        console.error('复制失败:', err);
    });
}

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
    toast._timer = setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

document.addEventListener('DOMContentLoaded', () => {
    const gen = new PixelArtGenerator();
    window._generator = gen;

    // 颜色替换选择器
    window._picker = function(sourceHex) {
        var gen = window._generator;
        if (!gen || !gen.currentColors) return;

        // 移除已有面板
        var old = document.querySelector('.replace-picker-overlay');
        if (old) old.remove();

        // 获取当前色库及色系分组
        var paletteKey = gen.paletteSelect ? gen.paletteSelect.value : 'mard291';
        var paletteData = palettes[paletteKey];
        if (!paletteData || !paletteData.series) { showToast('色库数据不可用'); return; }

        var seriesKeys = Object.keys(paletteData.series);
        var srcName = '';
        for (var ci = 0; ci < gen.currentColors.length; ci++) {
            if (gen.currentColors[ci].hex === sourceHex) { srcName = gen.currentColors[ci].name; break; }
        }

        // 构建色系标签
        var tabsHtml = seriesKeys.map(function(sk) {
            return '<button class="replace-picker-tab" data-series="' + sk + '" title="' + paletteData.series[sk].name + '">' + sk + '</button>';
        }).join('');

        // 构建分组颜色网格（排除源颜色）
        var groupsHtml = seriesKeys.map(function(sk, idx) {
            var series = paletteData.series[sk];
            var colorItems = series.colors.filter(function(c) { return c.hex !== sourceHex; });
            var gridHtml = colorItems.map(function(c) {
                return '<button class="replace-picker-item" data-hex="' + c.hex + '" style="background:' + c.hex + ';" title="' + c.name + '"><span>' + c.name + '</span></button>';
            }).join('');
            return '<div class="replace-picker-series" data-series="' + sk + '"><div class="replace-picker-series-header" style="--series-color:' + (series.color || '#999') + ';">' + series.name + ' <span class="replace-picker-series-count">' + colorItems.length + '色</span></div><div class="replace-picker-grid">' + gridHtml + '</div></div>';
        }).join('');

        // 创建可视化替换面板
        var overlay = document.createElement('div');
        overlay.className = 'replace-picker-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;width:100%;height:100%;background:rgba(0,0,0,0.4);z-index:20000;display:flex;align-items:center;justify-content:center;';

        overlay.innerHTML =
            '<div class="replace-picker-box">' +
            '<h4>将 <b style="color:' + sourceHex + ';">' + srcName + '</b> 替换为 <span class="replace-picker-palette-name">' + paletteData.name + '</span></h4>' +
            '<div class="replace-picker-tabs">' + tabsHtml + '</div>' +
            '<div class="replace-picker-scroll">' + groupsHtml + '</div>' +
            '<button class="replace-picker-cancel">取消</button>' +
            '</div>';

        // 色系标签点击 → 滚动到对应分组
        overlay.querySelectorAll('.replace-picker-tab').forEach(function(tab) {
            tab.addEventListener('click', function() {
                var sk = tab.dataset.series;
                var target = overlay.querySelector('.replace-picker-series[data-series="' + sk + '"]');
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // 点击候选颜色执行替换
        overlay.querySelectorAll('.replace-picker-item').forEach(function(item) {
            item.addEventListener('click', function() {
                var targetHex = item.dataset.hex;
                gen.replaceColor(sourceHex, targetHex);
                showToast('已替换颜色');
                overlay.remove();
            });
        });

        // 取消按钮
        overlay.querySelector('.replace-picker-cancel').addEventListener('click', function() {
            overlay.remove();
        });

        // 点击背景关闭
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) overlay.remove();
        });

        document.body.appendChild(overlay);

        // 默认激活第一个标签
        var firstTab = overlay.querySelector('.replace-picker-tab');
        if (firstTab) firstTab.classList.add('active');

        // 滚动监听：高亮当前可见色系的标签
        var scrollArea = overlay.querySelector('.replace-picker-scroll');
        var allTabs = overlay.querySelectorAll('.replace-picker-tab');
        scrollArea.addEventListener('scroll', function() {
            var minDist = Infinity, activeSk = null;
            allTabs.forEach(function(tab) {
                var sk = tab.dataset.series;
                var el = overlay.querySelector('.replace-picker-series[data-series="' + sk + '"]');
                if (el) {
                    var rect = el.getBoundingClientRect();
                    var boxRect = scrollArea.getBoundingClientRect();
                    var dist = Math.abs(rect.top - boxRect.top);
                    if (dist < minDist) { minDist = dist; activeSk = sk; }
                }
            });
            allTabs.forEach(function(t) { t.classList.toggle('active', t.dataset.series === activeSk); });
        });
    };

    // 点击导航链接时关闭移动端菜单    // 点击导航链接时关闭移动端菜单
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu) navMenu.classList.remove('active');
        });
    });

});