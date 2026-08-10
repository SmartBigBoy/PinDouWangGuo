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
        this.pixelCanvas = null;
        this.currentColors = [];
        this.beadCountMap = new Map();
        this.pixelData = [];
        this.highlightColor = null;

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
        this.showGridCheckbox = document.getElementById('showGrid');
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
            this.scheduleAutoGenerate();
        });

        this.colorCountSlider.addEventListener('input', (e) => {
            this.colorCountValue.textContent = e.target.value;
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
            this.customGridDiv.style.display = e.target.value === 'custom' ? 'flex' : 'none';
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

        this.generateBtn.addEventListener('click', () => {
            clearTimeout(this._autoGenTimer);
            this.generatePixelArt();
        });
        this.clearBtn.addEventListener('click', () => this.clearAll());

        if (this.showGridCheckbox) {
            this.showGridCheckbox.addEventListener('change', () => {
                if (this.originalImage) this.scheduleAutoGenerate();
            });
        }

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
                this.showOriginalImage(e.target.result);
                this.scheduleAutoGenerate();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }


    showOriginalImage(src) {
        this.originalImageContainer.classList.add('has-image');
        // 保留隐藏的 file input，确保更换图片时可正常触发文件选择
        this.originalImageContainer.innerHTML = '<img src="' + src + '" alt="原图">' +
            '<input type="file" id="imageInput" accept="image/*" style="position: absolute; inset: 0; opacity: 0; cursor: pointer; z-index: 3;">' +
            '<button class="image-replace-btn" id="replaceImageBtn" title="更换图片" aria-label="更换图片">📷 更换图片</button>';
        // 重新获取 imageInput 引用并绑定 change 事件
        this.imageInput = document.getElementById('imageInput');
        if (this.imageInput) {
            this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        }
        // 重新绑定更换按钮
        const replaceBtn = document.getElementById('replaceImageBtn');
        if (replaceBtn) {
            replaceBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.imageInput.click();
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
                width: Math.max(5, Math.min(200, parseInt(this.gridWidthInput.value) || 29)),
                height: Math.max(5, Math.min(200, parseInt(this.gridHeightInput.value) || 29))
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
        else if (maxDim <= 64) suggested = 10;
        else if (maxDim <= 104) suggested = 8;
        else suggested = 5;

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
        this.generateBtn.textContent = '⏳ 生成中...';

        setTimeout(() => {
            try {
                const pixelSize = parseInt(this.pixelSizeSlider.value);
                const colorCount = parseInt(this.colorCountSlider.value);
                const gridSize = this.getGridSize();
                const showGrid = this.showGridCheckbox ? this.showGridCheckbox.checked : true;
                const coordSize = 60;

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
                this.drawPixelArt(ctx, pixels, colors, gridSize.width, gridSize.height, pixelSize, showGrid, this.highlightColor);

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
                this.generateBtn.textContent = '🎨 生成图纸';
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

    _drawGridCoords(ctx, w, h, pixelSize, coordSize, fontSize = 22, offsetX = 0, offsetY = 0) {
        // 动态字号：保底 fontSize，上限 32px
        const dynamicSize = Math.max(fontSize, Math.min(32, Math.floor(pixelSize * 0.55)));
        // 步长：小网格（<600格）每格显示，中网格每5，大网格每10
        const total = w * h;
        const step = total < 600 ? 1 : (total < 3000 ? 5 : 10);

        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.font = 'bold ' + dynamicSize + 'px Arial, sans-serif';
        for (let x = step - 1; x < w; x += step) {
            const tx = offsetX + coordSize + x * pixelSize + pixelSize / 2;
            const ty = offsetY + coordSize / 2;
            ctx.fillStyle = '#000000';
            ctx.fillText(x + 1, tx, ty);
        }
        ctx.textAlign = 'right';
        for (let y = step - 1; y < h; y += step) {
            const tx = offsetX + coordSize - 8;
            const ty = offsetY + coordSize + y * pixelSize + pixelSize / 2;
            ctx.font = 'bold ' + dynamicSize + 'px Arial, sans-serif';
            ctx.fillStyle = '#000000';
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
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
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

    _drawCenterCross(ctx, w, h, pixelSize, coordSize, offsetX = 0, offsetY = 0) {
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        const midX = Math.floor(w / 2);
        const midY = Math.floor(h / 2);
        ctx.beginPath();
        ctx.moveTo(offsetX + coordSize + midX * pixelSize, offsetY + coordSize);
        ctx.lineTo(offsetX + coordSize + midX * pixelSize, offsetY + coordSize + h * pixelSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(offsetX + coordSize, offsetY + coordSize + midY * pixelSize);
        ctx.lineTo(offsetX + coordSize + w * pixelSize, offsetY + coordSize + midY * pixelSize);
        ctx.stroke();
    }

    _drawGridBase(ctx, w, h, pixelSize, coordSize, offsetX = 0, offsetY = 0, fontSize = 22) {
        this._drawGridBackground(ctx, w, h, pixelSize, coordSize, offsetX, offsetY);
        this._drawGridCoords(ctx, w, h, pixelSize, coordSize, fontSize, offsetX, offsetY);
        this._drawGridLines(ctx, w, h, pixelSize, coordSize, offsetX, offsetY);
        this._drawCenterCross(ctx, w, h, pixelSize, coordSize, offsetX, offsetY);
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

    drawPixelArt(ctx, pixels, colors, width, height, pixelSize, showGrid, highlightColor = null) {
        const coordSize = 60;

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
                let gridColor = '#e0e0e0';
                let isEmpty = true;

                if (a >= 128) {
                    closestColor = this.findClosestColor({ r, g, b }, colors);
                    isEmpty = false;

                    const key = closestColor.hex;
                    this.beadCountMap.set(key, (this.beadCountMap.get(key) || 0) + 1);

                    if (highlightColor && closestColor.hex === highlightColor) {
                        fillColor = closestColor.hex;
                        gridColor = closestColor.hex;
                    } else if (highlightColor) {
                        fillColor = closestColor.hex;
                        gridColor = '#e0e0e0';
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

                if (showGrid) {
                    ctx.strokeStyle = gridColor;
                    ctx.lineWidth = highlightColor ? 1.5 : 0.5;
                    if (highlightColor && !isEmpty && closestColor.hex === highlightColor) {
                        ctx.globalAlpha = 1.0;
                    } else if (highlightColor && !isEmpty) {
                        ctx.globalAlpha = 0.2;
                    }
                    ctx.strokeRect(coordSize + x * pixelSize, coordSize + y * pixelSize, pixelSize - 1, pixelSize - 1);
                    ctx.globalAlpha = 1.0;
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
            <div class="pixel-canvas-wrapper" style="position: relative; display: inline-block;">
                <canvas id="pixelatedCanvas" width="${canvas.width}" height="${canvas.height}" style="cursor: crosshair; display: block; image-rendering: pixelated; image-rendering: crisp-edges;"></canvas>
                <div id="coordTooltip" style="position: absolute; background: rgba(26, 26, 46, 0.95); color: #f5f5f5; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; pointer-events: none; display: none; z-index: 100; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.2);"></div>
                <button class="fs-exit" id="fsExit" title="退出全屏 (Esc)">✕</button>
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

        // 全屏 —— 标题栏按钮
        const fullscreenBtn = document.getElementById('fullscreenTitleBtn');
        const wrapper = destCanvas.parentElement;

        // 全屏工具函数（提出 if 块，供底部导航栏共用）
        const isFS = () =>
            document.fullscreenElement || document.webkitFullscreenElement;
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
            destCanvas.ondblclick = toggle;

            // 全屏时重新高分辨率绘制
            function renderFullRes(entering) {
                const gW = width, gH = height;
                const pd = self.pixelData;
                if (!pd || !pd.length) return;

                if (entering) {
                    self._origPx = self._px;
                    self._origCx = self._cx;
                    // 根据视口计算最佳像素尺寸（保证画布刚好填满屏幕）
                    const newCS = 48;
                    const maxW = window.innerWidth - newCS - 16;
                    const maxH = window.innerHeight - newCS - 68;
                    const newPS = Math.max(10, Math.min(Math.floor(maxW / gW), Math.floor(maxH / gH)));
                    self._px = newPS;
                    self._cx = newCS;
                } else {
                    self._px = self._origPx || self._px;
                    self._cx = self._origCx || self._cx;
                }

                destCanvas.width = gW * self._px + self._cx * 2;
                destCanvas.height = gH * self._px + self._cx * 2;
                const ctx = destCanvas.getContext('2d');
                ctx.imageSmoothingEnabled = false;
                self._drawGridBase(ctx, gW, gH, self._px, self._cx);
                for (let y = 0; y < gH && y < pd.length; y++) {
                    for (let x = 0; x < gW && x < pd[y].length; x++) {
                        const p = pd[y][x];
                        if (!p || p.isEmpty) continue;
                        ctx.fillStyle = p.color.hex;
                        ctx.fillRect(self._cx + x * self._px, self._cx + y * self._px, self._px - 1, self._px - 1);
                    }
                }
                self._drawGridBorder(ctx, gW, gH, self._px, self._cx);
            }

            const onFSChange = () => {
                const inFs = isFS();
                fullscreenBtn.innerHTML = inFs ? '✕ 退出' : '⛶ 全屏';
                fullscreenBtn.title = inFs ? '退出全屏' : '全屏查看';
                renderFullRes(inFs);
            };
            // 清除旧监听器，避免多次 showPixelArt 造成泄漏
            if (this._fsHandler) {
                document.removeEventListener('fullscreenchange', this._fsHandler);
                document.removeEventListener('webkitfullscreenchange', this._fsHandler);
            }
            this._fsHandler = onFSChange;
            document.addEventListener('fullscreenchange', this._fsHandler);
            document.addEventListener('webkitfullscreenchange', this._fsHandler);
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
            const ctx = destCanvas.getContext('2d');
            ctx.clearRect(0, 0, destCanvas.width, destCanvas.height);
            self._drawGridBase(ctx, width, height, self._px, self._cx);

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
            const { gridX, gridY, offsetX, offsetY, rect } = getGridFromEvent(touch.clientX, touch.clientY);
            updateTooltip(gridX, gridY, offsetX, offsetY, rect, touch.clientX, touch.clientY);
        }, { passive: false });
        destCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const { gridX, gridY, offsetX, offsetY, rect } = getGridFromEvent(touch.clientX, touch.clientY);
            updateTooltip(gridX, gridY, offsetX, offsetY, rect, touch.clientX, touch.clientY);
        }, { passive: false });
        destCanvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            tooltip.style.display = 'none';
            if (Math.hypot(touchStartX - (e.changedTouches[0]?.clientX || 0),
                          touchStartY - (e.changedTouches[0]?.clientY || 0)) < 15) {
                const { gridX, gridY } = getGridFromEvent(touchStartX, touchStartY);
                handleCellClick(gridX, gridY);
            }
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
            if (this.physicalSizeEl) this.physicalSizeEl.textContent = '—';
            if (this.physicalDimensionsEl) this.physicalDimensionsEl.textContent = '—';
            return;
        }
        const wBeads = bbox.maxX - bbox.minX + 1;
        const hBeads = bbox.maxY - bbox.minY + 1;
        const wCM = ((wBeads * beadMM) / 10).toFixed(1);
        const hCM = ((hBeads * beadMM) / 10).toFixed(1);
        const label = `${wBeads}×${hBeads} 豆  ${wCM}×${hCM}cm`;
        if (this.physicalSizeEl) this.physicalSizeEl.textContent = label;
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
        const legendWidth = 180;

        const usedColors = this.currentColors.filter(c => this.beadCountMap.get(c.hex) > 0);
        
        const availableMainWidth = targetWidth - coordSize - legendWidth - 40;
        const availableMainHeight = targetHeight - coordSize - 40;

        const mainPixelSize = Math.min(Math.floor(availableMainWidth / dataWidth), Math.floor(availableMainHeight / dataHeight));
        const mainWidth = dataWidth * mainPixelSize;
        const mainHeight = dataHeight * mainPixelSize;

        const legendItemHeight = mainPixelSize;
        const perColumnCount = Math.max(1, Math.floor((mainHeight - 60) / (mainPixelSize * 2))); // 每个颜色占两行格子高度
        const legendColumns = Math.ceil(usedColors.length / perColumnCount);
        const legendFontSize = Math.max(8, mainPixelSize * 0.35);
        const legendColWidth = Math.max(120, legendFontSize * 10 + 30);
        const actualLegendWidth = legendColumns * legendColWidth + 20;
        const legendMinHeight = mainHeight + coordSize;

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        ctx.fillStyle = '#f5f5f0';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        const mainOffsetX = Math.floor((targetWidth - mainWidth - coordSize - actualLegendWidth) / 2);
        const mainOffsetY = Math.floor((targetHeight - mainHeight - coordSize) / 2);

        const legendX = mainOffsetX + mainWidth + coordSize + 15;
        const legendHeight = mainHeight + coordSize;

        ctx.fillStyle = '#f5f5f0';
        this.roundRect(ctx, legendX - 10, mainOffsetY, actualLegendWidth + 20, legendHeight, 6);

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

        // 实物尺寸信息
        let infoY = mainOffsetY + 22;
        const beadMM = parseFloat(this.beadSizeSelect?.value || 5);
        const bbox = this._bbox;
        if (bbox && bbox.maxX >= 0) {
            const wBeads = bbox.maxX - bbox.minX + 1;
            const hBeads = bbox.maxY - bbox.minY + 1;
            const wCM = ((wBeads * beadMM) / 10).toFixed(1);
            const hCM = ((hBeads * beadMM) / 10).toFixed(1);
            ctx.fillStyle = '#333333';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`📏 实物尺寸: ${wCM}×${hCM}cm`, legendX, infoY);
            ctx.font = '14px Arial';
            ctx.fillText(`(${wBeads}×${hBeads} 豆 · ${beadMM}mm/粒)`, legendX, infoY + 16);
            infoY += 40;
        }

        ctx.fillStyle = '#333333';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';

        const selectedPaletteKey = this.paletteSelect ? this.paletteSelect.value : 'mard291';
        const selectedPaletteName = palettes[selectedPaletteKey] ? palettes[selectedPaletteKey].name : 'MARD 全色 291';
        ctx.fillText(`色号清单 (${selectedPaletteName})`, legendX, infoY);

        ctx.fillStyle = '#333333';
        ctx.fillRect(legendX, infoY + 12, actualLegendWidth - 20, 1);

        const colorBoxSize = Math.min(mainPixelSize - 4, 16);
        
        usedColors.forEach((color, index) => {
            const col = Math.floor(index / perColumnCount);
            const row = index % perColumnCount;
            const y = infoY + 25 + row * mainPixelSize + (mainPixelSize - colorBoxSize) / 2;
            const x = legendX + col * legendColWidth;

            ctx.fillStyle = color.hex;
            ctx.fillRect(x, y, colorBoxSize, colorBoxSize);
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, colorBoxSize, colorBoxSize);

            ctx.fillStyle = '#333333';
            ctx.font = `${Math.max(8, mainPixelSize * 0.35)}px Arial`;
            ctx.textAlign = 'left';
            ctx.fillText(`${color.name} - ${this.beadCountMap.get(color.hex)}颗`, x + colorBoxSize + 4, y + colorBoxSize / 2 + 3);
        });

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
            if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('
'))) {
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
        this.pixelCanvas = null;
        this.currentColors = [];
        this.beadCountMap.clear();
        this.pixelData = [];
        this.highlightColor = null;
        this._bbox = null;
        clearTimeout(this._autoGenTimer);
        if (this.physicalSizeEl) this.physicalSizeEl.textContent = '—';
        if (this.physicalDimensionsEl) this.physicalDimensionsEl.textContent = '—';

        if (this.originalImageContainer) {
            this.originalImageContainer.classList.remove('has-image');
            this.originalImageContainer.innerHTML = `
                <input type="file" id="imageInput" accept="image/*" style="position: absolute; inset: 0; opacity: 0; cursor: pointer; z-index: 3;">
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