/**
 * common.js — 拼豆王国 共享工具函数
 * 跨页面复用的纯函数：颜色转换、Canvas 绘制、轻提示。
 * 需在 script.js / create.js 之前加载（依赖顺序：colors.js → common.js → 页面脚本）。
 */

/** sRGB → CIE Lab（D65），感知均匀色彩空间，用于色差匹配 */
function rgbToLab(r, g, b) {
    let x, y, z;
    r /= 255; g /= 255; b /= 255;

    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
    y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
    z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

    x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116;
    y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116;
    z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116;

    return {
        l: (116 * y) - 16,
        a: 500 * (x - y),
        b: 200 * (y - z)
    };
}

/** 圆角矩形（填充） */
function roundRect(ctx, x, y, width, height, radius) {
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

/** 计算 hex 颜色的相对亮度 (0~1)，用于选择对比文字色 */
function hexLuminance(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * 绘制品牌引流卡片：白底 + 品牌粉边框，左侧渐变图标 + 右侧「拼豆王国 / 域名」
 * 用于导出纯像素图与全信息图，方便引流
 */
function drawBrandCard(ctx, x, y, w, h) {
    const iconSize = Math.round(h * 0.52);
    const iconX = x + Math.round(w * 0.07);
    const iconY = y + Math.round((h - iconSize) / 2);
    const textX = iconX + iconSize + Math.round(w * 0.055);
    const nameSize = Math.max(20, Math.round(h * 0.28));
    const urlSize = Math.max(13, Math.round(h * 0.18));

    // 卡片背景 + 品牌粉描边
    ctx.save();
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, x, y, w, h, Math.round(h * 0.13));
    ctx.strokeStyle = '#F4A0B8';
    ctx.lineWidth = Math.max(2, Math.round(h * 0.024));
    ctx.stroke();

    // 品牌图标：粉→紫渐变圆角方块 + 白色豆点
    const grad = ctx.createLinearGradient(iconX, iconY, iconX + iconSize, iconY + iconSize);
    grad.addColorStop(0, '#F4A0B8');
    grad.addColorStop(1, '#8A6FE8');
    ctx.fillStyle = grad;
    roundRect(ctx, iconX, iconY, iconSize, iconSize, Math.round(iconSize * 0.22));
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

/** 轻提示（全局唯一实现） */
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
