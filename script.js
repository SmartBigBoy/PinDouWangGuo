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
        this.uploadArea = document.getElementById('uploadArea');
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
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        this.uploadArea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.imageInput.click();
            }
        });

        this.pixelSizeSlider.addEventListener('input', (e) => {
            this.pixelSizeValue.textContent = e.target.value;
        });

        this.colorCountSlider.addEventListener('input', (e) => {
            this.colorCountValue.textContent = e.target.value;
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
            });
        }

        this.gridSizeSelect.addEventListener('change', (e) => {
            this.customGridDiv.style.display = e.target.value === 'custom' ? 'flex' : 'none';
            this.autoAdjustPixelSize();
        });

        if (this.beadSizeSelect) {
            this.beadSizeSelect.addEventListener('change', () => this._updatePhysicalSize());
        }

        this.generateBtn.addEventListener('click', () => this.generatePixelArt());
        this.clearBtn.addEventListener('click', () => this.clearAll());

        if (this.showGridCheckbox) {
            this.showGridCheckbox.addEventListener('change', () => {
                if (this.originalImage) this.generatePixelArt();
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
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
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
                this.originalImage = img;
                this.showOriginalImage(e.target.result);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    showOriginalImage(src) {
        this.originalImageContainer.innerHTML = `<img src="${src}" alt="原图">`;
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
                const coordSize = 28;

                const canvas = document.createElement('canvas');
                canvas.width = gridSize.width * pixelSize + coordSize;
                canvas.height = gridSize.height * pixelSize + coordSize;
                const ctx = canvas.getContext('2d');

                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(this.originalImage, 0, 0, gridSize.width, gridSize.height);

                const imageData = ctx.getImageData(0, 0, gridSize.width, gridSize.height);
                const pixels = imageData.data;

                const colors = this.extractColors(pixels, colorCount);

                this.beadCountMap.clear();
                this.drawPixelArt(ctx, pixels, colors, gridSize.width, gridSize.height, pixelSize, showGrid, this.highlightColor);

                this.showPixelArt(canvas, gridSize.width, gridSize.height, pixelSize, coordSize);
                this.showColorPalette(colors);
                this._calcBoundingBox();
                this._updatePhysicalSize();
                this.updateStats(colors, gridSize.width * gridSize.height, gridSize.width, gridSize.height);

                this.pixelCanvas = canvas;
                this.downloadPureBtn.disabled = false;
                this.downloadFullBtn.disabled = false;
                this.currentColors = colors;
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
        ctx.fillStyle = '#f0f0f5';
        ctx.fillRect(offsetX, offsetY, w * pixelSize + coordSize, coordSize);
        ctx.fillRect(offsetX, offsetY, coordSize, h * pixelSize + coordSize);
    }

    _drawGridCoords(ctx, w, h, pixelSize, coordSize, fontSize = 10, offsetX = 0, offsetY = 0) {
        ctx.fillStyle = '#333333';
        ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let x = 0; x < w; x++) {
            if ((x + 1) % 10 === 0) {
                ctx.fillText(x + 1, offsetX + coordSize + x * pixelSize + pixelSize / 2, offsetY + coordSize - 6);
            }
        }
        ctx.textAlign = 'right';
        for (let y = 0; y < h; y++) {
            if ((y + 1) % 10 === 0) {
                ctx.fillText(y + 1, offsetX + coordSize - 4, offsetY + coordSize + y * pixelSize + pixelSize / 2);
            }
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

    _drawGridBase(ctx, w, h, pixelSize, coordSize, offsetX = 0, offsetY = 0, fontSize = 10) {
        this._drawGridBackground(ctx, w, h, pixelSize, coordSize, offsetX, offsetY);
        this._drawGridCoords(ctx, w, h, pixelSize, coordSize, fontSize, offsetX, offsetY);
        this._drawGridLines(ctx, w, h, pixelSize, coordSize, offsetX, offsetY);
        this._drawCenterCross(ctx, w, h, pixelSize, coordSize, offsetX, offsetY);
    }

    drawPixelArt(ctx, pixels, colors, width, height, pixelSize, showGrid, highlightColor = null) {
        const coordSize = 28;

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
                        fillColor = '#ffffff';
                        gridColor = '#ffffff';
                    } else {
                        fillColor = closestColor.hex;
                    }
                }

                ctx.fillStyle = fillColor;
                ctx.fillRect(coordSize + x * pixelSize, coordSize + y * pixelSize, pixelSize - 1, pixelSize - 1);

                if (showGrid) {
                    ctx.strokeStyle = gridColor;
                    ctx.lineWidth = highlightColor ? 1.5 : 0.5;
                    ctx.strokeRect(coordSize + x * pixelSize, coordSize + y * pixelSize, pixelSize - 1, pixelSize - 1);
                }

                row.push({ color: closestColor, x, y, isEmpty });
            }
            this.pixelData.push(row);
        }
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
        this.pixelatedContainer.innerHTML = `
            <div class="pixel-canvas-wrapper" style="position: relative; display: inline-block;">
                <canvas id="pixelatedCanvas" width="${canvas.width}" height="${canvas.height}" style="cursor: crosshair; display: block; image-rendering: pixelated; image-rendering: crisp-edges;"></canvas>
                <button class="fullscreen-btn" id="fullscreenBtn" title="全屏查看" aria-label="全屏查看拼豆效果">⛶</button>
                <div id="coordTooltip" style="position: absolute; background: rgba(26, 26, 46, 0.95); color: #f5f5f5; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; pointer-events: none; display: none; z-index: 100; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.2);"></div>
            </div>
        `;
        const destCanvas = document.getElementById('pixelatedCanvas');
        const tooltip = document.getElementById('coordTooltip');
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        destCanvas.getContext('2d').drawImage(canvas, 0, 0);

        // 全屏切换
        const wrapper = destCanvas.parentElement;
        const toggleFullscreen = () => {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                wrapper.requestFullscreen();
            }
        };
        fullscreenBtn.addEventListener('click', toggleFullscreen);
        // 双击 canvas 也触发全屏
        destCanvas.addEventListener('dblclick', toggleFullscreen);
        // 全屏变化时更新按钮文字
        document.addEventListener('fullscreenchange', () => {
            fullscreenBtn.textContent = document.fullscreenElement ? '✕' : '⛶';
            fullscreenBtn.title = document.fullscreenElement ? '退出全屏' : '全屏查看';
        });

        let lastHoveredCell = null;
        let touchStartX = 0, touchStartY = 0;

        // 鼠标/触控 → 网格坐标转换
        function getGridFromEvent(clientX, clientY) {
            const rect = destCanvas.getBoundingClientRect();
            const scaleX = destCanvas.width / rect.width;
            const scaleY = destCanvas.height / rect.height;
            const x = (clientX - rect.left) * scaleX;
            const y = (clientY - rect.top) * scaleY;
            return {
                gridX: Math.floor((x - coordSize) / pixelSize),
                gridY: Math.floor((y - coordSize) / pixelSize),
                offsetX: clientX - rect.left,
                offsetY: clientY - rect.top,
                rect
            };
        }

        function updateTooltip(gridX, gridY, offsetX, offsetY, rect) {
            if (gridX >= 0 && gridX < width && gridY >= 0 && gridY < height) {
                const cellKey = `${gridX},${gridY}`;
                if (cellKey !== lastHoveredCell) {
                    lastHoveredCell = cellKey;
                    const pixelInfo = self.pixelData[gridY]?.[gridX];
                    const colorHex = pixelInfo?.color?.hex || '#cccccc';
                    const colorName = pixelInfo?.color?.name || '未填充';

                    tooltip.innerHTML = `<span style="color: ${colorHex}; font-size: 14px;">●</span> 坐标: (${gridX + 1}, ${gridY + 1}) | ${colorName}`;

                    let tooltipX = offsetX + 15;
                    let tooltipY = offsetY - 30;

                    if (tooltipX + 200 > rect.width) tooltipX = offsetX - 180;
                    if (tooltipY < 0) tooltipY = offsetY + 15;

                    tooltip.style.left = tooltipX + 'px';
                    tooltip.style.top = tooltipY + 'px';
                    tooltip.style.display = 'block';
                }
            } else {
                tooltip.style.display = 'none';
                lastHoveredCell = null;
            }
        }

        function handleCellClick(gridX, gridY) {
            if (gridX >= 0 && gridX < width && gridY >= 0 && gridY < height) {
                const clickedColorHex = self.pixelData[gridY]?.[gridX]?.color?.hex;

                if (clickedColorHex) {
                    if (self.highlightColor === clickedColorHex) {
                         self.highlightColor = null;
                         showToast('已取消高亮，显示全图');
                     } else {
                         self.highlightColor = clickedColorHex;
                         showToast(`已高亮: ${clickedColorHex}`);
                     }

                    const ctx = destCanvas.getContext('2d');
                    ctx.clearRect(0, 0, destCanvas.width, destCanvas.height);

                    self._drawGridBase(ctx, width, height, pixelSize, coordSize);

                    for (let y = 0; y < height; y++) {
                        for (let x = 0; x < width; x++) {
                            const pixel = self.pixelData[y][x];
                            const pixelColor = pixel.color;
                            const isEmpty = pixel.isEmpty || false;
                            const isHighlighted = self.highlightColor && pixelColor.hex === self.highlightColor;

                            if (isEmpty) {
                                ctx.fillStyle = '#f5f5f5';
                                ctx.strokeStyle = '#e0e0e0';
                                ctx.lineWidth = 0.5;
                            } else if (self.highlightColor) {
                                ctx.fillStyle = isHighlighted ? pixelColor.hex : '#ffffff';
                                ctx.strokeStyle = isHighlighted ? pixelColor.hex : '#e0e0e0';
                                ctx.lineWidth = isHighlighted ? 1.5 : 0.5;
                            } else {
                                ctx.fillStyle = pixelColor.hex;
                                ctx.strokeStyle = '#e0e0e0';
                                ctx.lineWidth = 0.5;
                            }

                            ctx.fillRect(
                                coordSize + x * pixelSize,
                                coordSize + y * pixelSize,
                                pixelSize - 1,
                                pixelSize - 1
                            );

                            ctx.strokeRect(
                                coordSize + x * pixelSize,
                                coordSize + y * pixelSize,
                                pixelSize - 1,
                                pixelSize - 1
                            );
                         }
                     }

                    if (self.highlightColor) {
                    for (let y = 0; y < height; y++) {
                            for (let x = 0; x < width; x++) {
                                if (self.pixelData[y][x].color.hex === self.highlightColor) {
                                    const color = self.pixelData[y][x].color;
                                    ctx.strokeStyle = color.hex;
                                    ctx.lineWidth = 3;
                                    ctx.shadowColor = color.hex;
                                    ctx.shadowBlur = 8;
                                    ctx.strokeRect(
                                        coordSize + x * pixelSize + 1,
                                        coordSize + y * pixelSize + 1,
                                        pixelSize - 3,
                                        pixelSize - 3
                                    );
                                    ctx.shadowBlur = 0;
                                }
                            }
                        }
                    }
                }
            }
        }

        // 鼠标事件
        destCanvas.addEventListener('mousemove', (e) => {
            const { gridX, gridY, offsetX, offsetY, rect } = getGridFromEvent(e.clientX, e.clientY);
            updateTooltip(gridX, gridY, offsetX, offsetY, rect);
        });

        destCanvas.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
            lastHoveredCell = null;
        });

        destCanvas.addEventListener('click', (e) => {
            const { gridX, gridY } = getGridFromEvent(e.clientX, e.clientY);
            handleCellClick(gridX, gridY);
        });

        // 触控事件
        destCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            const { gridX, gridY, offsetX, offsetY, rect } = getGridFromEvent(touch.clientX, touch.clientY);
            updateTooltip(gridX, gridY, offsetX, offsetY, rect);
        }, { passive: false });

        destCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const { gridX, gridY, offsetX, offsetY, rect } = getGridFromEvent(touch.clientX, touch.clientY);
            updateTooltip(gridX, gridY, offsetX, offsetY, rect);
        }, { passive: false });

        destCanvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            tooltip.style.display = 'none';
            // 只在 touchstart/touchend 距离较小时视为点击（防误触）
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

        const html = sortedColors.map((color, i) => `
            <div class="color-swatch" tabindex="0" role="button"
                 title="${color.name} (${color.count}颗)"
                 aria-label="${color.name}，${color.count}颗，点击复制色号"
                 onclick="copyColorInfo('${color.hex}', '${color.name}')"
                 onkeydown="if(event.key==='Enter'||event.key===' ')copyColorInfo('${color.hex}', '${color.name}')">
                <div class="color-swatch-inner" style="background: ${color.hex};" aria-hidden="true"></div>
                <div class="color-swatch-info">
                    <span class="hex-code">${color.name}</span>
                    <span class="bead-count">${color.count}颗</span>
                </div>
            </div>
        `).join('');

        this.colorPalette.innerHTML = html;
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
            if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
                return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
        }).join(',')).join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `materials-list-${Date.now()}.csv`;
        link.click();
        showToast('已下载材料清单');
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
        if (this.physicalSizeEl) this.physicalSizeEl.textContent = '—';
        if (this.physicalDimensionsEl) this.physicalDimensionsEl.textContent = '—';

        this.originalImageContainer.innerHTML = `
            <div class="placeholder">
                <span>🖼️</span>
                <p>请先上传图片</p>
            </div>
        `;
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
    new PixelArtGenerator();

    // 点击导航链接时关闭移动端菜单
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu) navMenu.classList.remove('active');
        });
    });
});