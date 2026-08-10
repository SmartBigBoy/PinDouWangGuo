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