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

    initMardColors(full = true) {
        const colors = [
            // A系列 - 黄色系 (26色)
            { name: 'MARD_A1', hex: '#FAF4C8', series: 'A', seriesName: '黄色系' },
            { name: 'MARD_A2', hex: '#FFFFD5', series: 'A', seriesName: '黄色系' },
            { name: 'MARD_A3', hex: '#FEFF8B', series: 'A', seriesName: '黄色系' },
            { name: 'MARD_A4', hex: '#FBED56', series: 'A', seriesName: '黄色系' },
            { name: 'MARD_A5', hex: '#F4D738', series: 'A', seriesName: '黄色系' },
            { name: 'MARD_A6', hex: '#FEAC4C', series: 'A', seriesName: '黄色系' },
            { name: 'MARD_A7', hex: '#FE8B4C', series: 'A', seriesName: '黄色系' },
            { name: 'MARD_A8', hex: '#FFDA45', series: 'A', seriesName: '黄色系' },
            { name: 'MARD_A9', hex: '#FF995B', series: 'A', seriesName: '黄色系' },
            { name: 'MARD_A10', hex: '#F77C31', series: 'A', seriesName: '黄色系' },
            { name: 'MARD_A11', hex: '#FFDD99', series: 'A', seriesName: '黄色系' },
            { name: 'MARD_A12', hex: '#FE9F72', series: 'A', seriesName: '黄色系' },
            { name: 'MARD_A13', hex: '#FFC365', series: 'A', seriesName: '黄色系' },
            { name: 'MARD_A14', hex: '#FD543D', series: 'A', seriesName: '黄色系' },
            { name: 'MARD_A15', hex: '#FFF365', series: 'A', seriesName: '黄色系' },
            { name: 'MARD_A16', hex: '#FFFF9F', series: 'A', seriesName: '黄色系' },
            { name: 'MARD_A17', hex: '#FFE36E', series: 'A', seriesName: '黄色系' },
            { name: 'MARD_A18', hex: '#FEBE7D', series: 'A', seriesName: '黄色系' },
            { name: 'MARD_A19', hex: '#FD7C72', series: 'A', seriesName: '黄色系' },
            { name: 'MARD_A20', hex: '#FFD568', series: 'A', seriesName: '黄色系' },
            { name: 'MARD_A21', hex: '#FFE395', series: 'A', seriesName: '黄色系' },
            { name: 'MARD_A22', hex: '#F4F57D', series: 'A', seriesName: '黄色系' },
            { name: 'MARD_A23', hex: '#E6C9B7', series: 'A', seriesName: '黄色系' },
            { name: 'MARD_A24', hex: '#F7F8A2', series: 'A', seriesName: '黄色系' },
            { name: 'MARD_A25', hex: '#FFD67D', series: 'A', seriesName: '黄色系' },
            { name: 'MARD_A26', hex: '#FFC830', series: 'A', seriesName: '黄色系' },
            // B系列 - 绿色系 (32色)
            { name: 'MARD_B1', hex: '#E6EE31', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B2', hex: '#63F347', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B3', hex: '#9EF780', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B4', hex: '#5DE035', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B5', hex: '#35E352', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B6', hex: '#65E2A6', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B7', hex: '#3DAF80', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B8', hex: '#1C9C4F', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B9', hex: '#27523A', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B10', hex: '#95D3C2', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B11', hex: '#5D722A', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B12', hex: '#166F41', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B13', hex: '#CAEB7B', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B14', hex: '#ADE946', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B15', hex: '#2E5132', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B16', hex: '#C5ED9C', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B17', hex: '#9BB13A', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B18', hex: '#E6EE49', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B19', hex: '#24B88C', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B20', hex: '#C2F0CC', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B21', hex: '#156A6B', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B22', hex: '#0B3C43', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B23', hex: '#303A21', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B24', hex: '#EEFCA5', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B25', hex: '#4E846D', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B26', hex: '#8D7A35', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B27', hex: '#CCE1AF', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B28', hex: '#9EE5B9', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B29', hex: '#C5E254', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B30', hex: '#E2FCB1', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B31', hex: '#B0E792', series: 'B', seriesName: '绿色系' },
            { name: 'MARD_B32', hex: '#9CAB5A', series: 'B', seriesName: '绿色系' },
            // C系列 - 蓝色系 (29色)
            { name: 'MARD_C1', hex: '#E8FFE7', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C2', hex: '#A9F9FC', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C3', hex: '#A0E2FB', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C4', hex: '#41CCFF', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C5', hex: '#01ACEB', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C6', hex: '#50AAF0', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C7', hex: '#3677D2', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C8', hex: '#0F54C0', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C9', hex: '#324BCA', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C10', hex: '#3EBCE2', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C11', hex: '#28DDDE', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C12', hex: '#1C334D', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C13', hex: '#CDE8FF', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C14', hex: '#D5FDFF', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C15', hex: '#22C4C6', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C16', hex: '#1557A8', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C17', hex: '#04D1F6', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C18', hex: '#1D3344', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C19', hex: '#1887A2', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C20', hex: '#176DAF', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C21', hex: '#BEDDFF', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C22', hex: '#67B4BE', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C23', hex: '#C8E2FF', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C24', hex: '#7CC4FF', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C25', hex: '#A9E5E5', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C26', hex: '#3CAED8', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C27', hex: '#D3DFFA', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C28', hex: '#BBCFED', series: 'C', seriesName: '蓝色系' },
            { name: 'MARD_C29', hex: '#34488E', series: 'C', seriesName: '蓝色系' },
            // D系列 - 紫色系 (26色)
            { name: 'MARD_D1', hex: '#AEB4F2', series: 'D', seriesName: '紫色系' },
            { name: 'MARD_D2', hex: '#858EDD', series: 'D', seriesName: '紫色系' },
            { name: 'MARD_D3', hex: '#2F54AF', series: 'D', seriesName: '紫色系' },
            { name: 'MARD_D4', hex: '#182A84', series: 'D', seriesName: '紫色系' },
            { name: 'MARD_D5', hex: '#B843C5', series: 'D', seriesName: '紫色系' },
            { name: 'MARD_D6', hex: '#AC7BDE', series: 'D', seriesName: '紫色系' },
            { name: 'MARD_D7', hex: '#8854B3', series: 'D', seriesName: '紫色系' },
            { name: 'MARD_D8', hex: '#E2D3FF', series: 'D', seriesName: '紫色系' },
            { name: 'MARD_D9', hex: '#D5B9F8', series: 'D', seriesName: '紫色系' },
            { name: 'MARD_D10', hex: '#361851', series: 'D', seriesName: '紫色系' },
            { name: 'MARD_D11', hex: '#B9BAE1', series: 'D', seriesName: '紫色系' },
            { name: 'MARD_D12', hex: '#DE9AD4', series: 'D', seriesName: '紫色系' },
            { name: 'MARD_D13', hex: '#B90095', series: 'D', seriesName: '紫色系' },
            { name: 'MARD_D14', hex: '#8B279B', series: 'D', seriesName: '紫色系' },
            { name: 'MARD_D15', hex: '#2F1F90', series: 'D', seriesName: '紫色系' },
            { name: 'MARD_D16', hex: '#E3E1EE', series: 'D', seriesName: '紫色系' },
            { name: 'MARD_D17', hex: '#C4D4F6', series: 'D', seriesName: '紫色系' },
            { name: 'MARD_D18', hex: '#A45EC7', series: 'D', seriesName: '紫色系' },
            { name: 'MARD_D19', hex: '#D8C3D7', series: 'D', seriesName: '紫色系' },
            { name: 'MARD_D20', hex: '#9C32B2', series: 'D', seriesName: '紫色系' },
            { name: 'MARD_D21', hex: '#9A009B', series: 'D', seriesName: '紫色系' },
            { name: 'MARD_D22', hex: '#333A95', series: 'D', seriesName: '紫色系' },
            { name: 'MARD_D23', hex: '#EBDAFC', series: 'D', seriesName: '紫色系' },
            { name: 'MARD_D24', hex: '#7786E5', series: 'D', seriesName: '紫色系' },
            { name: 'MARD_D25', hex: '#494FC7', series: 'D', seriesName: '紫色系' },
            { name: 'MARD_D26', hex: '#DFC2F8', series: 'D', seriesName: '紫色系' },
            // E系列 - 粉色系 (24色)
            { name: 'MARD_E1', hex: '#FDD3CC', series: 'E', seriesName: '粉色系' },
            { name: 'MARD_E2', hex: '#FEC0DF', series: 'E', seriesName: '粉色系' },
            { name: 'MARD_E3', hex: '#FFB7E7', series: 'E', seriesName: '粉色系' },
            { name: 'MARD_E4', hex: '#E8649E', series: 'E', seriesName: '粉色系' },
            { name: 'MARD_E5', hex: '#F551A2', series: 'E', seriesName: '粉色系' },
            { name: 'MARD_E6', hex: '#F13D74', series: 'E', seriesName: '粉色系' },
            { name: 'MARD_E7', hex: '#C63478', series: 'E', seriesName: '粉色系' },
            { name: 'MARD_E8', hex: '#FFDBE9', series: 'E', seriesName: '粉色系' },
            { name: 'MARD_E9', hex: '#E970CC', series: 'E', seriesName: '粉色系' },
            { name: 'MARD_E10', hex: '#D33793', series: 'E', seriesName: '粉色系' },
            { name: 'MARD_E11', hex: '#FCDDD2', series: 'E', seriesName: '粉色系' },
            { name: 'MARD_E12', hex: '#F78FC3', series: 'E', seriesName: '粉色系' },
            { name: 'MARD_E13', hex: '#B5006D', series: 'E', seriesName: '粉色系' },
            { name: 'MARD_E14', hex: '#FFD1BA', series: 'E', seriesName: '粉色系' },
            { name: 'MARD_E15', hex: '#F8C7C9', series: 'E', seriesName: '粉色系' },
            { name: 'MARD_E16', hex: '#FFF3EB', series: 'E', seriesName: '粉色系' },
            { name: 'MARD_E17', hex: '#FFE2EA', series: 'E', seriesName: '粉色系' },
            { name: 'MARD_E18', hex: '#FFC7DB', series: 'E', seriesName: '粉色系' },
            { name: 'MARD_E19', hex: '#FEBAD5', series: 'E', seriesName: '粉色系' },
            { name: 'MARD_E20', hex: '#D8C7D1', series: 'E', seriesName: '粉色系' },
            { name: 'MARD_E21', hex: '#BD9DA1', series: 'E', seriesName: '粉色系' },
            { name: 'MARD_E22', hex: '#B785A1', series: 'E', seriesName: '粉色系' },
            { name: 'MARD_E23', hex: '#937A8D', series: 'E', seriesName: '粉色系' },
            { name: 'MARD_E24', hex: '#E1BCE8', series: 'E', seriesName: '粉色系' },
            // F系列 - 红色系 (25色)
            { name: 'MARD_F1', hex: '#FD957B', series: 'F', seriesName: '红色系' },
            { name: 'MARD_F2', hex: '#FC3D46', series: 'F', seriesName: '红色系' },
            { name: 'MARD_F3', hex: '#F74941', series: 'F', seriesName: '红色系' },
            { name: 'MARD_F4', hex: '#FC283C', series: 'F', seriesName: '红色系' },
            { name: 'MARD_F5', hex: '#E7002F', series: 'F', seriesName: '红色系' },
            { name: 'MARD_F6', hex: '#943630', series: 'F', seriesName: '红色系' },
            { name: 'MARD_F7', hex: '#971937', series: 'F', seriesName: '红色系' },
            { name: 'MARD_F8', hex: '#BC0028', series: 'F', seriesName: '红色系' },
            { name: 'MARD_F9', hex: '#E2677A', series: 'F', seriesName: '红色系' },
            { name: 'MARD_F10', hex: '#8A4526', series: 'F', seriesName: '红色系' },
            { name: 'MARD_F11', hex: '#5A2121', series: 'F', seriesName: '红色系' },
            { name: 'MARD_F12', hex: '#FD4E6A', series: 'F', seriesName: '红色系' },
            { name: 'MARD_F13', hex: '#F35744', series: 'F', seriesName: '红色系' },
            { name: 'MARD_F14', hex: '#FFA9AD', series: 'F', seriesName: '红色系' },
            { name: 'MARD_F15', hex: '#D30022', series: 'F', seriesName: '红色系' },
            { name: 'MARD_F16', hex: '#FEC2A6', series: 'F', seriesName: '红色系' },
            { name: 'MARD_F17', hex: '#E69C79', series: 'F', seriesName: '红色系' },
            { name: 'MARD_F18', hex: '#D37C46', series: 'F', seriesName: '红色系' },
            { name: 'MARD_F19', hex: '#C1444A', series: 'F', seriesName: '红色系' },
            { name: 'MARD_F20', hex: '#CD9391', series: 'F', seriesName: '红色系' },
            { name: 'MARD_F21', hex: '#F7B4C6', series: 'F', seriesName: '红色系' },
            { name: 'MARD_F22', hex: '#FDC0D0', series: 'F', seriesName: '红色系' },
            { name: 'MARD_F23', hex: '#F67E66', series: 'F', seriesName: '红色系' },
            { name: 'MARD_F24', hex: '#E698AA', series: 'F', seriesName: '红色系' },
            { name: 'MARD_F25', hex: '#E54B4F', series: 'F', seriesName: '红色系' },
            // G系列 - 棕色系 (21色)
            { name: 'MARD_G1', hex: '#FFE2CE', series: 'G', seriesName: '棕色系' },
            { name: 'MARD_G2', hex: '#FFC4AA', series: 'G', seriesName: '棕色系' },
            { name: 'MARD_G3', hex: '#F4C3A5', series: 'G', seriesName: '棕色系' },
            { name: 'MARD_G4', hex: '#E1B383', series: 'G', seriesName: '棕色系' },
            { name: 'MARD_G5', hex: '#EDB045', series: 'G', seriesName: '棕色系' },
            { name: 'MARD_G6', hex: '#E99C17', series: 'G', seriesName: '棕色系' },
            { name: 'MARD_G7', hex: '#9D5B3E', series: 'G', seriesName: '棕色系' },
            { name: 'MARD_G8', hex: '#753832', series: 'G', seriesName: '棕色系' },
            { name: 'MARD_G9', hex: '#E6B483', series: 'G', seriesName: '棕色系' },
            { name: 'MARD_G10', hex: '#D98C39', series: 'G', seriesName: '棕色系' },
            { name: 'MARD_G11', hex: '#E0C593', series: 'G', seriesName: '棕色系' },
            { name: 'MARD_G12', hex: '#FFC890', series: 'G', seriesName: '棕色系' },
            { name: 'MARD_G13', hex: '#B7714A', series: 'G', seriesName: '棕色系' },
            { name: 'MARD_G14', hex: '#8D614C', series: 'G', seriesName: '棕色系' },
            { name: 'MARD_G15', hex: '#FCF9E0', series: 'G', seriesName: '棕色系' },
            { name: 'MARD_G16', hex: '#F2D9BA', series: 'G', seriesName: '棕色系' },
            { name: 'MARD_G17', hex: '#78524B', series: 'G', seriesName: '棕色系' },
            { name: 'MARD_G18', hex: '#FFE4CC', series: 'G', seriesName: '棕色系' },
            { name: 'MARD_G19', hex: '#E07935', series: 'G', seriesName: '棕色系' },
            { name: 'MARD_G20', hex: '#A94023', series: 'G', seriesName: '棕色系' },
            { name: 'MARD_G21', hex: '#B88558', series: 'G', seriesName: '棕色系' },
            // H系列 - 黑白灰系 (23色)
            { name: 'MARD_H1', hex: '#FDFBFF', series: 'H', seriesName: '黑白灰系' },
            { name: 'MARD_H2', hex: '#FEFFFF', series: 'H', seriesName: '黑白灰系' },
            { name: 'MARD_H3', hex: '#B6B1BA', series: 'H', seriesName: '黑白灰系' },
            { name: 'MARD_H4', hex: '#89858C', series: 'H', seriesName: '黑白灰系' },
            { name: 'MARD_H5', hex: '#48464E', series: 'H', seriesName: '黑白灰系' },
            { name: 'MARD_H6', hex: '#2F2B2F', series: 'H', seriesName: '黑白灰系' },
            { name: 'MARD_H7', hex: '#000000', series: 'H', seriesName: '黑白灰系' },
            { name: 'MARD_H8', hex: '#E7D6DB', series: 'H', seriesName: '黑白灰系' },
            { name: 'MARD_H9', hex: '#EDEDED', series: 'H', seriesName: '黑白灰系' },
            { name: 'MARD_H10', hex: '#EEE9EA', series: 'H', seriesName: '黑白灰系' },
            { name: 'MARD_H11', hex: '#CECDD5', series: 'H', seriesName: '黑白灰系' },
            { name: 'MARD_H12', hex: '#FFF5ED', series: 'H', seriesName: '黑白灰系' },
            { name: 'MARD_H13', hex: '#F5ECD2', series: 'H', seriesName: '黑白灰系' },
            { name: 'MARD_H14', hex: '#CFD7D3', series: 'H', seriesName: '黑白灰系' },
            { name: 'MARD_H15', hex: '#98A6A8', series: 'H', seriesName: '黑白灰系' },
            { name: 'MARD_H16', hex: '#1D1414', series: 'H', seriesName: '黑白灰系' },
            { name: 'MARD_H17', hex: '#F1EDED', series: 'H', seriesName: '黑白灰系' },
            { name: 'MARD_H18', hex: '#FFFDF0', series: 'H', seriesName: '黑白灰系' },
            { name: 'MARD_H19', hex: '#F6EFE2', series: 'H', seriesName: '黑白灰系' },
            { name: 'MARD_H20', hex: '#949FA3', series: 'H', seriesName: '黑白灰系' },
            { name: 'MARD_H21', hex: '#FFFBE1', series: 'H', seriesName: '黑白灰系' },
            { name: 'MARD_H22', hex: '#CACAD4', series: 'H', seriesName: '黑白灰系' },
            { name: 'MARD_H23', hex: '#9A9D94', series: 'H', seriesName: '黑白灰系' },
            // M系列 - 多彩系 (15色)
            { name: 'MARD_M1', hex: '#BCC6B8', series: 'M', seriesName: '多色彩系' },
            { name: 'MARD_M2', hex: '#8AA386', series: 'M', seriesName: '多色彩系' },
            { name: 'MARD_M3', hex: '#697D80', series: 'M', seriesName: '多色彩系' },
            { name: 'MARD_M4', hex: '#E3D2BC', series: 'M', seriesName: '多色彩系' },
            { name: 'MARD_M5', hex: '#D0CCAA', series: 'M', seriesName: '多色彩系' },
            { name: 'MARD_M6', hex: '#B0A782', series: 'M', seriesName: '多色彩系' },
            { name: 'MARD_M7', hex: '#B4A497', series: 'M', seriesName: '多色彩系' },
            { name: 'MARD_M8', hex: '#B38281', series: 'M', seriesName: '多色彩系' },
            { name: 'MARD_M9', hex: '#A58767', series: 'M', seriesName: '多色彩系' },
            { name: 'MARD_M10', hex: '#C5B2BC', series: 'M', seriesName: '多色彩系' },
            { name: 'MARD_M11', hex: '#9F7594', series: 'M', seriesName: '多色彩系' },
            { name: 'MARD_M12', hex: '#644749', series: 'M', seriesName: '多色彩系' },
            { name: 'MARD_M13', hex: '#D19066', series: 'M', seriesName: '多色彩系' },
            { name: 'MARD_M14', hex: '#C77362', series: 'M', seriesName: '多色彩系' },
            { name: 'MARD_M15', hex: '#757D78', series: 'M', seriesName: '多色彩系' },
            // P系列 - 扩展色系 (23色)
            { name: 'MARD_P1', hex: '#FCF7F8', series: 'P', seriesName: '扩展色系' },
            { name: 'MARD_P2', hex: '#B0A9AC', series: 'P', seriesName: '扩展色系' },
            { name: 'MARD_P3', hex: '#AFDCAB', series: 'P', seriesName: '扩展色系' },
            { name: 'MARD_P4', hex: '#FEA49F', series: 'P', seriesName: '扩展色系' },
            { name: 'MARD_P5', hex: '#EE8C3E', series: 'P', seriesName: '扩展色系' },
            { name: 'MARD_P6', hex: '#5FD0A7', series: 'P', seriesName: '扩展色系' },
            { name: 'MARD_P7', hex: '#EB9270', series: 'P', seriesName: '扩展色系' },
            { name: 'MARD_P8', hex: '#F0D958', series: 'P', seriesName: '扩展色系' },
            { name: 'MARD_P9', hex: '#D9D9D9', series: 'P', seriesName: '扩展色系' },
            { name: 'MARD_P10', hex: '#D9C7EA', series: 'P', seriesName: '扩展色系' },
            { name: 'MARD_P11', hex: '#F3ECC9', series: 'P', seriesName: '扩展色系' },
            { name: 'MARD_P12', hex: '#E6EEF2', series: 'P', seriesName: '扩展色系' },
            { name: 'MARD_P13', hex: '#AACBEF', series: 'P', seriesName: '扩展色系' },
            { name: 'MARD_P14', hex: '#337680', series: 'P', seriesName: '扩展色系' },
            { name: 'MARD_P15', hex: '#668575', series: 'P', seriesName: '扩展色系' },
            { name: 'MARD_P16', hex: '#FEBF45', series: 'P', seriesName: '扩展色系' },
            { name: 'MARD_P17', hex: '#FEA324', series: 'P', seriesName: '扩展色系' },
            { name: 'MARD_P18', hex: '#FEB89F', series: 'P', seriesName: '扩展色系' },
            { name: 'MARD_P19', hex: '#FFFEEC', series: 'P', seriesName: '扩展色系' },
            { name: 'MARD_P20', hex: '#FEBECF', series: 'P', seriesName: '扩展色系' },
            { name: 'MARD_P21', hex: '#ECBEBF', series: 'P', seriesName: '扩展色系' },
            { name: 'MARD_P22', hex: '#E4A89F', series: 'P', seriesName: '扩展色系' },
            { name: 'MARD_P23', hex: '#A56268', series: 'P', seriesName: '扩展色系' },
            // Q系列 - 荧光色系 (5色)
            { name: 'MARD_Q1', hex: '#F2A5E8', series: 'Q', seriesName: '荧光色系' },
            { name: 'MARD_Q2', hex: '#E9EC91', series: 'Q', seriesName: '荧光色系' },
            { name: 'MARD_Q3', hex: '#FFFF00', series: 'Q', seriesName: '荧光色系' },
            { name: 'MARD_Q4', hex: '#FFEBFA', series: 'Q', seriesName: '荧光色系' },
            { name: 'MARD_Q5', hex: '#76CEDE', series: 'Q', seriesName: '荧光色系' },
            // R系列 - 亮色系 (28色)
            { name: 'MARD_R1', hex: '#D50D21', series: 'R', seriesName: '亮色系' },
            { name: 'MARD_R2', hex: '#F92F83', series: 'R', seriesName: '亮色系' },
            { name: 'MARD_R3', hex: '#FD8324', series: 'R', seriesName: '亮色系' },
            { name: 'MARD_R4', hex: '#F8EC31', series: 'R', seriesName: '亮色系' },
            { name: 'MARD_R5', hex: '#35C75B', series: 'R', seriesName: '亮色系' },
            { name: 'MARD_R6', hex: '#238891', series: 'R', seriesName: '亮色系' },
            { name: 'MARD_R7', hex: '#19779D', series: 'R', seriesName: '亮色系' },
            { name: 'MARD_R8', hex: '#1A60C3', series: 'R', seriesName: '亮色系' },
            { name: 'MARD_R9', hex: '#9A56B4', series: 'R', seriesName: '亮色系' },
            { name: 'MARD_R10', hex: '#FFDB4C', series: 'R', seriesName: '亮色系' },
            { name: 'MARD_R11', hex: '#FFEBFA', series: 'R', seriesName: '亮色系' },
            { name: 'MARD_R12', hex: '#D8D5CE', series: 'R', seriesName: '亮色系' },
            { name: 'MARD_R13', hex: '#55514C', series: 'R', seriesName: '亮色系' },
            { name: 'MARD_R14', hex: '#9FE4DF', series: 'R', seriesName: '亮色系' },
            { name: 'MARD_R15', hex: '#77CEE9', series: 'R', seriesName: '亮色系' },
            { name: 'MARD_R16', hex: '#3ECFCA', series: 'R', seriesName: '亮色系' },
            { name: 'MARD_R17', hex: '#4A867A', series: 'R', seriesName: '亮色系' },
            { name: 'MARD_R18', hex: '#7FCD9D', series: 'R', seriesName: '亮色系' },
            { name: 'MARD_R19', hex: '#CDE55D', series: 'R', seriesName: '亮色系' },
            { name: 'MARD_R20', hex: '#E8C7B4', series: 'R', seriesName: '亮色系' },
            { name: 'MARD_R21', hex: '#AD6F3C', series: 'R', seriesName: '亮色系' },
            { name: 'MARD_R22', hex: '#6C372F', series: 'R', seriesName: '亮色系' },
            { name: 'MARD_R23', hex: '#FEB872', series: 'R', seriesName: '亮色系' },
            { name: 'MARD_R24', hex: '#F3C1C0', series: 'R', seriesName: '亮色系' },
            { name: 'MARD_R25', hex: '#C9675E', series: 'R', seriesName: '亮色系' },
            { name: 'MARD_R26', hex: '#D293BE', series: 'R', seriesName: '亮色系' },
            { name: 'MARD_R27', hex: '#EA8CB1', series: 'R', seriesName: '亮色系' },
            { name: 'MARD_R28', hex: '#9C87D6', series: 'R', seriesName: '亮色系' },
            // T系列 - 纯白系 (1色)
            { name: 'MARD_T1', hex: '#FFFFFF', series: 'T', seriesName: '纯白系' },
            // Y系列 - 特效色系 (5色)
            { name: 'MARD_Y1', hex: '#FD6FB4', series: 'Y', seriesName: '特效色系' },
            { name: 'MARD_Y2', hex: '#FEB481', series: 'Y', seriesName: '特效色系' },
            { name: 'MARD_Y3', hex: '#D7FAA0', series: 'Y', seriesName: '特效色系' },
            { name: 'MARD_Y4', hex: '#8BDBFA', series: 'Y', seriesName: '特效色系' },
            { name: 'MARD_Y5', hex: '#E987EA', series: 'Y', seriesName: '特效色系' },
            // ZG系列 - 特别色系 (8色)
            { name: 'MARD_ZG1', hex: '#DAABB3', series: 'ZG', seriesName: '特别色系' },
            { name: 'MARD_ZG2', hex: '#D6AA87', series: 'ZG', seriesName: '特别色系' },
            { name: 'MARD_ZG3', hex: '#C1BD8D', series: 'ZG', seriesName: '特别色系' },
            { name: 'MARD_ZG4', hex: '#96869F', series: 'ZG', seriesName: '特别色系' },
            { name: 'MARD_ZG5', hex: '#8490A6', series: 'ZG', seriesName: '特别色系' },
            { name: 'MARD_ZG6', hex: '#94BFE2', series: 'ZG', seriesName: '特别色系' },
            { name: 'MARD_ZG7', hex: '#E2A9D2', series: 'ZG', seriesName: '特别色系' },
            { name: 'MARD_ZG8', hex: '#AB91C0', series: 'ZG', seriesName: '特别色系' }
        ];

        const result = full ? colors : colors.slice(0, 221);

        for (const color of result) {
            const hex = color.hex.replace('#', '');
            color.r = parseInt(hex.substr(0, 2), 16);
            color.g = parseInt(hex.substr(2, 2), 16);
            color.b = parseInt(hex.substr(4, 2), 16);
            color.lab = this.rgbToLab(color.r, color.g, color.b);
        }

        return result;
    }

    initArtkalColors() {
        const colors = [
            // Artkal 316色 - A系列 (黄色)
            { name: 'A01', hex: '#FFF5C3', series: 'A', seriesName: '黄色系' },
            { name: 'A02', hex: '#FFFF9F', series: 'A', seriesName: '黄色系' },
            { name: 'A03', hex: '#FFF275', series: 'A', seriesName: '黄色系' },
            { name: 'A04', hex: '#FFE066', series: 'A', seriesName: '黄色系' },
            { name: 'A05', hex: '#FFCD00', series: 'A', seriesName: '黄色系' },
            { name: 'A06', hex: '#FFB900', series: 'A', seriesName: '黄色系' },
            { name: 'A07', hex: '#FFA300', series: 'A', seriesName: '黄色系' },
            { name: 'A08', hex: '#FF8C00', series: 'A', seriesName: '黄色系' },
            { name: 'A09', hex: '#FF6B00', series: 'A', seriesName: '黄色系' },
            { name: 'A10', hex: '#FF4500', series: 'A', seriesName: '黄色系' },
            { name: 'A11', hex: '#FFD4A3', series: 'A', seriesName: '黄色系' },
            { name: 'A12', hex: '#FFC080', series: 'A', seriesName: '黄色系' },
            { name: 'A13', hex: '#FFB366', series: 'A', seriesName: '黄色系' },
            { name: 'A14', hex: '#FFA64D', series: 'A', seriesName: '黄色系' },
            { name: 'A15', hex: '#FF9933', series: 'A', seriesName: '黄色系' },
            { name: 'A16', hex: '#FF8C1A', series: 'A', seriesName: '黄色系' },
            { name: 'A17', hex: '#FF7A00', series: 'A', seriesName: '黄色系' },
            { name: 'A18', hex: '#FF6600', series: 'A', seriesName: '黄色系' },
            // Artkal B系列 (绿色)
            { name: 'B01', hex: '#E8F5E9', series: 'B', seriesName: '绿色系' },
            { name: 'B02', hex: '#C8E6C9', series: 'B', seriesName: '绿色系' },
            { name: 'B03', hex: '#A5D6A7', series: 'B', seriesName: '绿色系' },
            { name: 'B04', hex: '#81C784', series: 'B', seriesName: '绿色系' },
            { name: 'B05', hex: '#66BB6A', series: 'B', seriesName: '绿色系' },
            { name: 'B06', hex: '#4CAF50', series: 'B', seriesName: '绿色系' },
            { name: 'B07', hex: '#43A047', series: 'B', seriesName: '绿色系' },
            { name: 'B08', hex: '#388E3C', series: 'B', seriesName: '绿色系' },
            { name: 'B09', hex: '#2E7D32', series: 'B', seriesName: '绿色系' },
            { name: 'B10', hex: '#1B5E20', series: 'B', seriesName: '绿色系' },
            { name: 'B11', hex: '#B9F6CA', series: 'B', seriesName: '绿色系' },
            { name: 'B12', hex: '#69F0AE', series: 'B', seriesName: '绿色系' },
            { name: 'B13', hex: '#00E676', series: 'B', seriesName: '绿色系' },
            { name: 'B14', hex: '#00C853', series: 'B', seriesName: '绿色系' },
            { name: 'B15', hex: '#00A844', series: 'B', seriesName: '绿色系' },
            // Artkal C系列 (蓝色)
            { name: 'C01', hex: '#E3F2FD', series: 'C', seriesName: '蓝色系' },
            { name: 'C02', hex: '#BBDEFB', series: 'C', seriesName: '蓝色系' },
            { name: 'C03', hex: '#90CAF9', series: 'C', seriesName: '蓝色系' },
            { name: 'C04', hex: '#64B5F6', series: 'C', seriesName: '蓝色系' },
            { name: 'C05', hex: '#42A5F5', series: 'C', seriesName: '蓝色系' },
            { name: 'C06', hex: '#2196F3', series: 'C', seriesName: '蓝色系' },
            { name: 'C07', hex: '#1E88E5', series: 'C', seriesName: '蓝色系' },
            { name: 'C08', hex: '#1976D2', series: 'C', seriesName: '蓝色系' },
            { name: 'C09', hex: '#1565C0', series: 'C', seriesName: '蓝色系' },
            { name: 'C10', hex: '#0D47A1', series: 'C', seriesName: '蓝色系' },
            { name: 'C11', hex: '#82B1FF', series: 'C', seriesName: '蓝色系' },
            { name: 'C12', hex: '#448AFF', series: 'C', seriesName: '蓝色系' },
            { name: 'C13', hex: '#2979FF', series: 'C', seriesName: '蓝色系' },
            { name: 'C14', hex: '#2962FF', series: 'C', seriesName: '蓝色系' },
            { name: 'C15', hex: '#004DFF', series: 'C', seriesName: '蓝色系' },
            // Artkal D系列 (红色)
            { name: 'D01', hex: '#FFEBEE', series: 'D', seriesName: '红色系' },
            { name: 'D02', hex: '#FFCDD2', series: 'D', seriesName: '红色系' },
            { name: 'D03', hex: '#EF9A9A', series: 'D', seriesName: '红色系' },
            { name: 'D04', hex: '#E57373', series: 'D', seriesName: '红色系' },
            { name: 'D05', hex: '#EF5350', series: 'D', seriesName: '红色系' },
            { name: 'D06', hex: '#F44336', series: 'D', seriesName: '红色系' },
            { name: 'D07', hex: '#E53935', series: 'D', seriesName: '红色系' },
            { name: 'D08', hex: '#D32F2F', series: 'D', seriesName: '红色系' },
            { name: 'D09', hex: '#C62828', series: 'D', seriesName: '红色系' },
            { name: 'D10', hex: '#B71C1C', series: 'D', seriesName: '红色系' },
            { name: 'D11', hex: '#FF8A80', series: 'D', seriesName: '红色系' },
            { name: 'D12', hex: '#FF5252', series: 'D', seriesName: '红色系' },
            { name: 'D13', hex: '#FF1744', series: 'D', seriesName: '红色系' },
            { name: 'D14', hex: '#D50000', series: 'D', seriesName: '红色系' },
            { name: 'D15', hex: '#C62828', series: 'D', seriesName: '红色系' },
            // Artkal E系列 (紫色)
            { name: 'E01', hex: '#F3E5F5', series: 'E', seriesName: '紫色系' },
            { name: 'E02', hex: '#E1BEE7', series: 'E', seriesName: '紫色系' },
            { name: 'E03', hex: '#CE93D8', series: 'E', seriesName: '紫色系' },
            { name: 'E04', hex: '#BA68C8', series: 'E', seriesName: '紫色系' },
            { name: 'E05', hex: '#AB47BC', series: 'E', seriesName: '紫色系' },
            { name: 'E06', hex: '#9C27B0', series: 'E', seriesName: '紫色系' },
            { name: 'E07', hex: '#8E24AA', series: 'E', seriesName: '紫色系' },
            { name: 'E08', hex: '#7B1FA2', series: 'E', seriesName: '紫色系' },
            { name: 'E09', hex: '#6A1B9A', series: 'E', seriesName: '紫色系' },
            { name: 'E10', hex: '#4A148C', series: 'E', seriesName: '紫色系' },
            { name: 'E11', hex: '#EA80FC', series: 'E', seriesName: '紫色系' },
            { name: 'E12', hex: '#E040FB', series: 'E', seriesName: '紫色系' },
            { name: 'E13', hex: '#D500F9', series: 'E', seriesName: '紫色系' },
            { name: 'E14', hex: '#AA00FF', series: 'E', seriesName: '紫色系' },
            { name: 'E15', hex: '#7B1FA2', series: 'E', seriesName: '紫色系' },
            // Artkal F系列 (粉色)
            { name: 'F01', hex: '#FCE4EC', series: 'F', seriesName: '粉色系' },
            { name: 'F02', hex: '#F8BBD0', series: 'F', seriesName: '粉色系' },
            { name: 'F03', hex: '#F48FB1', series: 'F', seriesName: '粉色系' },
            { name: 'F04', hex: '#F06292', series: 'F', seriesName: '粉色系' },
            { name: 'F05', hex: '#EC407A', series: 'F', seriesName: '粉色系' },
            { name: 'F06', hex: '#E91E63', series: 'F', seriesName: '粉色系' },
            { name: 'F07', hex: '#D81B60', series: 'F', seriesName: '粉色系' },
            { name: 'F08', hex: '#C2185B', series: 'F', seriesName: '粉色系' },
            { name: 'F09', hex: '#AD1457', series: 'F', seriesName: '粉色系' },
            { name: 'F10', hex: '#880E4F', series: 'F', seriesName: '粉色系' },
            { name: 'F11', hex: '#FF80AB', series: 'F', seriesName: '粉色系' },
            { name: 'F12', hex: '#FF4081', series: 'F', seriesName: '粉色系' },
            { name: 'F13', hex: '#F50057', series: 'F', seriesName: '粉色系' },
            { name: 'F14', hex: '#C51162', series: 'F', seriesName: '粉色系' },
            { name: 'F15', hex: '#AD1457', series: 'F', seriesName: '粉色系' },
            // Artkal G系列 (棕色)
            { name: 'G01', hex: '#EFEBE9', series: 'G', seriesName: '棕色系' },
            { name: 'G02', hex: '#D7CCC8', series: 'G', seriesName: '棕色系' },
            { name: 'G03', hex: '#BCAAA4', series: 'G', seriesName: '棕色系' },
            { name: 'G04', hex: '#A1887F', series: 'G', seriesName: '棕色系' },
            { name: 'G05', hex: '#8D6E63', series: 'G', seriesName: '棕色系' },
            { name: 'G06', hex: '#795548', series: 'G', seriesName: '棕色系' },
            { name: 'G07', hex: '#6D4C41', series: 'G', seriesName: '棕色系' },
            { name: 'G08', hex: '#5D4037', series: 'G', seriesName: '棕色系' },
            { name: 'G09', hex: '#4E342E', series: 'G', seriesName: '棕色系' },
            { name: 'G10', hex: '#3E2723', series: 'G', seriesName: '棕色系' },
            // Artkal H系列 (白色灰色)
            { name: 'H01', hex: '#FFFFFF', series: 'H', seriesName: '白灰色系' },
            { name: 'H02', hex: '#F5F5F5', series: 'H', seriesName: '白灰色系' },
            { name: 'H03', hex: '#EEEEEE', series: 'H', seriesName: '白灰色系' },
            { name: 'H04', hex: '#E0E0E0', series: 'H', seriesName: '白灰色系' },
            { name: 'H05', hex: '#BDBDBD', series: 'H', seriesName: '白灰色系' },
            { name: 'H06', hex: '#9E9E9E', series: 'H', seriesName: '白灰色系' },
            { name: 'H07', hex: '#757575', series: 'H', seriesName: '白灰色系' },
            { name: 'H08', hex: '#616161', series: 'H', seriesName: '白灰色系' },
            { name: 'H09', hex: '#424242', series: 'H', seriesName: '白灰色系' },
            { name: 'H10', hex: '#212121', series: 'H', seriesName: '白灰色系' },
            { name: 'H11', hex: '#000000', series: 'H', seriesName: '白灰色系' }
        ];

        for (const color of colors) {
            const hex = color.hex.replace('#', '');
            color.r = parseInt(hex.substr(0, 2), 16);
            color.g = parseInt(hex.substr(2, 2), 16);
            color.b = parseInt(hex.substr(4, 2), 16);
            color.lab = this.rgbToLab(color.r, color.g, color.b);
        }

        return colors;
    }

    initPerlerColors() {
        const colors = [
            // Perler 216色 - 经典色系
            { name: 'P1000', hex: '#FFFFFF', series: 'W', seriesName: '白色' },
            { name: 'P1001', hex: '#F0EFEB', series: 'W', seriesName: '米白' },
            { name: 'P1002', hex: '#F4F4F4', series: 'W', seriesName: '浅灰白' },
            { name: 'P1003', hex: '#E2E2E2', series: 'G', seriesName: '浅灰' },
            { name: 'P1004', hex: '#C4C4C4', series: 'G', seriesName: '灰色' },
            { name: 'P1005', hex: '#9B9B9B', series: 'G', seriesName: '中灰' },
            { name: 'P1006', hex: '#6E6E6E', series: 'G', seriesName: '深灰' },
            { name: 'P1007', hex: '#4A4A4A', series: 'G', seriesName: '暗灰' },
            { name: 'P1008', hex: '#2E2E2E', series: 'G', seriesName: '炭灰' },
            { name: 'P1009', hex: '#000000', series: 'B', seriesName: '黑色' },
            { name: 'P1100', hex: '#E8AA00', series: 'Y', seriesName: '鲜黄' },
            { name: 'P1101', hex: '#FFD326', series: 'Y', seriesName: '向日葵黄' },
            { name: 'P1102', hex: '#FFE44D', series: 'Y', seriesName: '浅黄' },
            { name: 'P1103', hex: '#FFF099', series: 'Y', seriesName: '柠檬黄' },
            { name: 'P1104', hex: '#FFFAD5', series: 'Y', seriesName: '奶油黄' },
            { name: 'P1105', hex: '#F3C806', series: 'Y', seriesName: '金丝雀黄' },
            { name: 'P1106', hex: '#DAA520', series: 'Y', seriesName: '暗金黄' },
            { name: 'P1107', hex: '#CC9544', series: 'Y', seriesName: '焦糖' },
            { name: 'P1108', hex: '#B8860B', series: 'Y', seriesName: '深金黄' },
            { name: 'P1109', hex: '#996600', series: 'Y', seriesName: '橄榄黄' },
            { name: 'P1200', hex: '#FF9900', series: 'O', seriesName: '橙色' },
            { name: 'P1201', hex: '#FFA033', series: 'O', seriesName: '浅橙' },
            { name: 'P1202', hex: '#FFB347', series: 'O', seriesName: '蜜橙' },
            { name: 'P1203', hex: '#FFCC80', series: 'O', seriesName: '杏橙' },
            { name: 'P1204', hex: '#FFDAB9', series: 'O', seriesName: '桃橙' },
            { name: 'P1205', hex: '#E67300', series: 'O', seriesName: '深橙' },
            { name: 'P1206', hex: '#CC6600', series: 'O', seriesName: '烧橙' },
            { name: 'P1207', hex: '#994C00', series: 'O', seriesName: '锈橙' },
            { name: 'P1208', hex: '#663300', series: 'O', seriesName: '深棕橙' },
            { name: 'P1209', hex: '#FF6600', series: 'O', seriesName: '亮橙' },
            { name: 'P1300', hex: '#CC0000', series: 'R', seriesName: '红色' },
            { name: 'P1301', hex: '#FF0000', series: 'R', seriesName: '鲜红' },
            { name: 'P1302', hex: '#FF3333', series: 'R', seriesName: '亮红' },
            { name: 'P1303', hex: '#FF6666', series: 'R', seriesName: '浅红' },
            { name: 'P1304', hex: '#FF9999', series: 'R', seriesName: '粉红' },
            { name: 'P1305', hex: '#FFCCCC', series: 'R', seriesName: '淡粉' },
            { name: 'P1306', hex: '#A80000', series: 'R', seriesName: '深红' },
            { name: 'P1307', hex: '#800000', series: 'R', seriesName: '酒红' },
            { name: 'P1308', hex: '#5C0000', series: 'R', seriesName: '暗红' },
            { name: 'P1309', hex: '#330000', series: 'R', seriesName: '深褐红' },
            { name: 'P1400', hex: '#CC0066', series: 'P', seriesName: '品红' },
            { name: 'P1401', hex: '#FF00CC', series: 'P', seriesName: '亮粉' },
            { name: 'P1402', hex: '#FF33CC', series: 'P', seriesName: '粉紫' },
            { name: 'P1403', hex: '#FF66CC', series: 'P', seriesName: '兰花粉' },
            { name: 'P1404', hex: '#FF99CC', series: 'P', seriesName: '浅粉' },
            { name: 'P1405', hex: '#FFCCE0', series: 'P', seriesName: '淡粉' },
            { name: 'P1406', hex: '#A6004F', series: 'P', seriesName: '深品红' },
            { name: 'P1407', hex: '#80003F', series: 'P', seriesName: '暗粉' },
            { name: 'P1408', hex: '#660033', series: 'P', seriesName: '酒红粉' },
            { name: 'P1409', hex: '#4D0026', series: 'P', seriesName: '深玫瑰' },
            { name: 'P1500', hex: '#9B00FF', series: 'V', seriesName: '紫色' },
            { name: 'P1501', hex: '#AA00FF', series: 'V', seriesName: '亮紫' },
            { name: 'P1502', hex: '#BB33FF', series: 'V', seriesName: '紫罗兰' },
            { name: 'P1503', hex: '#CC66FF', series: 'V', seriesName: '浅紫' },
            { name: 'P1504', hex: '#DD99FF', series: 'V', seriesName: '淡紫' },
            { name: 'P1505', hex: '#EECCFF', series: 'V', seriesName: '薰衣草' },
            { name: 'P1506', hex: '#7B00CC', series: 'V', seriesName: '深紫' },
            { name: 'P1507', hex: '#5C0099', series: 'V', seriesName: '暗紫' },
            { name: 'P1508', hex: '#440066', series: 'V', seriesName: '深靛紫' },
            { name: 'P1509', hex: '#2E0047', series: 'V', seriesName: '暗夜紫' },
            { name: 'P1600', hex: '#0000CC', series: 'B', seriesName: '蓝色' },
            { name: 'P1601', hex: '#0000FF', series: 'B', seriesName: '亮蓝' },
            { name: 'P1602', hex: '#3366FF', series: 'B', seriesName: '天蓝' },
            { name: 'P1603', hex: '#6699FF', series: 'B', seriesName: '浅蓝' },
            { name: 'P1604', hex: '#99CCFF', series: 'B', seriesName: '淡蓝' },
            { name: 'P1605', hex: '#CCDDFF', series: 'B', seriesName: '钢蓝' },
            { name: 'P1606', hex: '#000099', series: 'B', seriesName: '深蓝' },
            { name: 'P1607', hex: '#000066', series: 'B', seriesName: '靛蓝' },
            { name: 'P1608', hex: '#000044', series: 'B', seriesName: '暗蓝' },
            { name: 'P1609', hex: '#00002E', series: 'B', seriesName: '午夜蓝' },
            { name: 'P1700', hex: '#0066CC', series: 'L', seriesName: '湖蓝' },
            { name: 'P1701', hex: '#0099FF', series: 'L', seriesName: '亮湖蓝' },
            { name: 'P1702', hex: '#33CCFF', series: 'L', seriesName: '海蓝' },
            { name: 'P1703', hex: '#66CCFF', series: 'L', seriesName: '浅湖蓝' },
            { name: 'P1704', hex: '#99EEFF', series: 'L', seriesName: '冰蓝' },
            { name: 'P1705', hex: '#CCF5FF', series: 'L', seriesName: '天蓝灰' },
            { name: 'P1706', hex: '#004C99', series: 'L', seriesName: '深湖蓝' },
            { name: 'P1707', hex: '#003366', series: 'L', seriesName: '蓝绿' },
            { name: 'P1708', hex: '#002244', series: 'L', seriesName: '暗湖蓝' },
            { name: 'P1709', hex: '#001833', series: 'L', seriesName: '午夜湖蓝' },
            { name: 'P1800', hex: '#006633', series: 'T', seriesName: '蓝绿' },
            { name: 'P1801', hex: '#009966', series: 'T', seriesName: '亮青' },
            { name: 'P1802', hex: '#33CC99', series: 'T', seriesName: '薄荷绿' },
            { name: 'P1803', hex: '#66FF99', series: 'T', seriesName: '浅绿松石' },
            { name: 'P1804', hex: '#99FFCC', series: 'T', seriesName: '淡青绿' },
            { name: 'P1805', hex: '#CCFFEE', series: 'T', seriesName: '泡沫绿' },
            { name: 'P1806', hex: '#004D33', series: 'T', seriesName: '深海绿' },
            { name: 'P1807', hex: '#003322', series: 'T', seriesName: '松石绿' },
            { name: 'P1808', hex: '#002211', series: 'T', seriesName: '暗青' },
            { name: 'P1809', hex: '#001511', series: 'T', seriesName: '夜绿' },
            { name: 'P1900', hex: '#00CC00', series: 'G', seriesName: '绿色' },
            { name: 'P1901', hex: '#00FF00', series: 'G', seriesName: '亮绿' },
            { name: 'P1902', hex: '#33FF33', series: 'G', seriesName: '草绿' },
            { name: 'P1903', hex: '#66FF66', series: 'G', seriesName: '浅绿' },
            { name: 'P1904', hex: '#99FF99', series: 'G', seriesName: '淡绿' },
            { name: 'P1905', hex: '#CCFFCC', series: 'G', seriesName: '薄荷' },
            { name: 'P1906', hex: '#009900', series: 'G', seriesName: '深绿' },
            { name: 'P1907', hex: '#006600', series: 'G', seriesName: '森林绿' },
            { name: 'P1908', hex: '#004400', series: 'G', seriesName: '暗绿' },
            { name: 'P1909', hex: '#003300', series: 'G', seriesName: '夜绿' },
            { name: 'P2000', hex: '#66CC00', series: 'L', seriesName: '酸橙绿' },
            { name: 'P2001', hex: '#99FF00', series: 'L', seriesName: '亮黄绿' },
            { name: 'P2002', hex: '#CCFF33', series: 'L', seriesName: '柠檬绿' },
            { name: 'P2003', hex: '#DDFF66', series: 'L', seriesName: '浅黄绿' },
            { name: 'P2004', hex: '#EEFF99', series: 'L', seriesName: '淡黄绿' },
            { name: 'P2005', hex: '#F5FFCC', series: 'L', seriesName: '淡绿黄' },
            { name: 'P2006', hex: '#4D9900', series: 'L', seriesName: '橄榄绿' },
            { name: 'P2007', hex: '#3D7A00', series: 'L', seriesName: '苔藓绿' },
            { name: 'P2008', hex: '#2E5C00', series: 'L', seriesName: '暗黄绿' },
            { name: 'P2009', hex: '#1F3D00', series: 'L', seriesName: '森林黄绿' },
            { name: 'P2100', hex: '#CC9900', series: 'M', seriesName: '芥末黄' },
            { name: 'P2101', hex: '#E6B800', series: 'M', seriesName: '暗黄' },
            { name: 'P2102', hex: '#FFD700', series: 'M', seriesName: '金黄' },
            { name: 'P2103', hex: '#FFEB3B', series: 'M', seriesName: '明亮黄' },
            { name: 'P2104', hex: '#FFF176', series: 'M', seriesName: '浅黄' },
            { name: 'P2105', hex: '#FFF9C4', series: 'M', seriesName: '奶油' },
            { name: 'P2106', hex: '#A67B00', series: 'M', seriesName: '深芥末' },
            { name: 'P2107', hex: '#7B5B00', series: 'M', seriesName: '暗棕黄' },
            { name: 'P2108', hex: '#5C4200', series: 'M', seriesName: '深橄榄' },
            { name: 'P2109', hex: '#3D2B00', series: 'M', seriesName: '咖啡' },
            { name: 'P2200', hex: '#8B4513', series: 'N', seriesName: '棕色' },
            { name: 'P2201', hex: '#A0522D', series: 'N', seriesName: '浅棕' },
            { name: 'P2202', hex: '#CD853F', series: 'N', seriesName: '秘鲁棕' },
            { name: 'P2203', hex: '#DEB887', series: 'N', seriesName: '浅棕褐' },
            { name: 'P2204', hex: '#F5DEB3', series: 'N', seriesName: '小麦色' },
            { name: 'P2205', hex: '#FFE4C4', series: 'N', seriesName: '亚麻色' },
            { name: 'P2206', hex: '#6B3713', series: 'N', seriesName: '深棕' },
            { name: 'P2207', hex: '#522B0E', series: 'N', seriesName: '栗棕' },
            { name: 'P2208', hex: '#3D2009', series: 'N', seriesName: '咖啡棕' },
            { name: 'P2209', hex: '#291406', series: 'N', seriesName: '深咖啡' }
        ];

        for (const color of colors) {
            const hex = color.hex.replace('#', '');
            color.r = parseInt(hex.substr(0, 2), 16);
            color.g = parseInt(hex.substr(2, 2), 16);
            color.b = parseInt(hex.substr(4, 2), 16);
            color.lab = this.rgbToLab(color.r, color.g, color.b);
        }

        return colors;
    }

    initHamaColors() {
        const colors = [
            // Hama 450色 - 按系列分类
            // W系列 - 白色
            { name: 'H_W01', hex: '#FFFFFF', series: 'W', seriesName: '白色' },
            { name: 'H_W02', hex: '#F8F8F8', series: 'W', seriesName: '冷白' },
            { name: 'H_W03', hex: '#F0F0F0', series: 'W', seriesName: '灰白' },
            { name: 'H_W04', hex: '#E8E8E8', series: 'W', seriesName: '浅灰' },
            // G系列 - 灰色
            { name: 'H_G01', hex: '#C0C0C0', series: 'G', seriesName: '银色' },
            { name: 'H_G02', hex: '#A0A0A0', series: 'G', seriesName: '中灰' },
            { name: 'H_G03', hex: '#808080', series: 'G', seriesName: '深灰' },
            { name: 'H_G04', hex: '#606060', series: 'G', seriesName: '暗灰' },
            { name: 'H_G05', hex: '#404040', series: 'G', seriesName: '炭灰' },
            { name: 'H_G06', hex: '#202020', series: 'G', seriesName: '深炭灰' },
            // B系列 - 黑色
            { name: 'H_B01', hex: '#101010', series: 'B', seriesName: '黑色' },
            { name: 'H_B02', hex: '#000000', series: 'B', seriesName: '纯黑' },
            // Y系列 - 黄色
            { name: 'H_Y01', hex: '#FFF700', series: 'Y', seriesName: '亮黄' },
            { name: 'H_Y02', hex: '#FFE800', series: 'Y', seriesName: '柠檬黄' },
            { name: 'H_Y03', hex: '#FFD700', series: 'Y', seriesName: '金丝雀黄' },
            { name: 'H_Y04', hex: '#FFCC00', series: 'Y', seriesName: '向日葵黄' },
            { name: 'H_Y05', hex: '#FFB800', series: 'Y', seriesName: '琥珀黄' },
            { name: 'H_Y06', hex: '#FFA500', series: 'Y', seriesName: '橙黄' },
            { name: 'H_Y07', hex: '#FFFACD', series: 'Y', seriesName: '柠檬酥' },
            { name: 'H_Y08', hex: '#FFF8DC', series: 'Y', seriesName: '玉米丝' },
            { name: 'H_Y09', hex: '#FFFACD', series: 'Y', seriesName: '奶油黄' },
            { name: 'H_Y10', hex: '#F0E68C', series: 'Y', seriesName: '卡其黄' },
            // O系列 - 橙色
            { name: 'H_O01', hex: '#FF6600', series: 'O', seriesName: '亮橙' },
            { name: 'H_O02', hex: '#FF5800', series: 'O', seriesName: '深橙' },
            { name: 'H_O03', hex: '#FF4500', series: 'O', seriesName: '橙红' },
            { name: 'H_O04', hex: '#FF3300', series: 'O', seriesName: '朱红橙' },
            { name: 'H_O05', hex: '#FFA07A', series: 'O', seriesName: '鲑鱼橙' },
            { name: 'H_O06', hex: '#FF8C00', series: 'O', seriesName: '暗橙' },
            { name: 'H_O07', hex: '#FF7F50', series: 'O', seriesName: '珊瑚橙' },
            { name: 'H_O08', hex: '#FF6347', series: 'O', seriesName: '番茄橙' },
            { name: 'H_O09', hex: '#FF5722', series: 'O', seriesName: '深橘橙' },
            { name: 'H_O10', hex: '#FF6B35', series: 'O', seriesName: '烤橙' },
            // R系列 - 红色
            { name: 'H_R01', hex: '#FF0000', series: 'R', seriesName: '红色' },
            { name: 'H_R02', hex: '#EE0000', series: 'R', seriesName: '深红' },
            { name: 'H_R03', hex: '#DD0000', series: 'R', seriesName: '暗红' },
            { name: 'H_R04', hex: '#CC0000', series: 'R', seriesName: '酒红' },
            { name: 'H_R05', hex: '#BB0000', series: 'R', seriesName: '深酒红' },
            { name: 'H_R06', hex: '#FF2400', series: 'R', seriesName: '鲜红' },
            { name: 'H_R07', hex: '#FF4444', series: 'R', seriesName: '亮红' },
            { name: 'H_R08', hex: '#FF6666', series: 'R', seriesName: '浅红' },
            { name: 'H_R09', hex: '#FF8888', series: 'R', seriesName: '粉红' },
            { name: 'H_R10', hex: '#FFCCCC', series: 'R', seriesName: '淡粉' },
            // P系列 - 粉色
            { name: 'H_P01', hex: '#FF69B4', series: 'P', seriesName: '亮粉' },
            { name: 'H_P02', hex: '#FF85C1', series: 'P', seriesName: '深粉' },
            { name: 'H_P03', hex: '#FFA0D1', series: 'P', seriesName: '粉紫' },
            { name: 'H_P04', hex: '#FFB6C1', series: 'P', seriesName: '浅粉' },
            { name: 'H_P05', hex: '#FFC0CB', series: 'P', seriesName: '粉红' },
            { name: 'H_P06', hex: '#FFD1DC', series: 'P', seriesName: '泡泡糖粉' },
            { name: 'H_P07', hex: '#FFE4E1', series: 'P', seriesName: '薄荷粉' },
            { name: 'H_P08', hex: '#FFB0A0', series: 'P', seriesName: '杏粉' },
            { name: 'H_P09', hex: '#FF9AAA', series: 'P', seriesName: '玫瑰粉' },
            { name: 'H_P10', hex: '#E87E9C', series: 'P', seriesName: '覆盆子粉' },
            // V系列 - 紫色
            { name: 'H_V01', hex: '#8B00FF', series: 'V', seriesName: '紫色' },
            { name: 'H_V02', hex: '#9400D3', series: 'V', seriesName: '暗紫' },
            { name: 'H_V03', hex: '#800080', series: 'V', seriesName: '深紫' },
            { name: 'H_V04', hex: '#9932CC', series: 'V', seriesName: '兰花紫' },
            { name: 'H_V05', hex: '#BA55D3', series: 'V', seriesName: '中紫' },
            { name: 'H_V06', hex: '#DA70D6', series: 'V', seriesName: '兰花粉' },
            { name: 'H_V07', hex: '#EE82EE', series: 'V', seriesName: '淡紫' },
            { name: 'H_V08', hex: '#FF00FF', series: 'V', seriesName: '品红' },
            { name: 'H_V09', hex: '#FF1493', series: 'V', seriesName: '深粉紫' },
            { name: 'H_V10', hex: '#DB7093', series: 'V', seriesName: '淡紫红' },
            // U系列 - 蓝色
            { name: 'H_U01', hex: '#0000FF', series: 'U', seriesName: '蓝色' },
            { name: 'H_U02', hex: '#0000CD', series: 'U', seriesName: '深蓝' },
            { name: 'H_U03', hex: '#000080', series: 'U', seriesName: '藏青' },
            { name: 'H_U04', hex: '#4169E1', series: 'U', seriesName: '皇家蓝' },
            { name: 'H_U05', hex: '#6495ED', series: 'U', seriesName: '矢车菊蓝' },
            { name: 'H_U06', hex: '#87CEEB', series: 'U', seriesName: '天蓝' },
            { name: 'H_U07', hex: '#87CEFA', series: 'U', seriesName: '浅天蓝' },
            { name: 'H_U08', hex: '#ADD8E6', series: 'U', seriesName: '淡蓝' },
            { name: 'H_U09', hex: '#B0E0E6', series: 'U', seriesName: '粉蓝' },
            { name: 'H_U10', hex: '#E0FFFF', series: 'U', seriesName: '浅青' },
            // T系列 - 蓝绿/青色
            { name: 'H_T01', hex: '#00CED1', series: 'T', seriesName: '深青' },
            { name: 'H_T02', hex: '#00FFFF', series: 'T', seriesName: '青色' },
            { name: 'H_T03', hex: '#40E0D0', series: 'T', seriesName: '绿松石' },
            { name: 'H_T04', hex: '#48D1CC', series: 'T', seriesName: '中绿松石' },
            { name: 'H_T05', hex: '#7FFFD4', series: 'T', seriesName: '碧绿' },
            { name: 'H_T06', hex: '#AFEEEE', series: 'T', seriesName: '淡绿松石' },
            { name: 'H_T07', hex: '#00BFFF', series: 'T', seriesName: '深天蓝' },
            { name: 'H_T08', hex: '#00B0F0', series: 'T', seriesName: '亮蓝绿' },
            { name: 'H_T09', hex: '#009DCF', series: 'T', seriesName: '土库曼蓝' },
            { name: 'H_T10', hex: '#0077BE', series: 'T', seriesName: '绿松石蓝' },
            // C系列 - 青绿
            { name: 'H_C01', hex: '#008B8B', series: 'C', seriesName: '暗青' },
            { name: 'H_C02', hex: '#008080', series: 'C', seriesName: '青色' },
            { name: 'H_C03', hex: '#20B2AA', series: 'C', seriesName: '浅海绿' },
            { name: 'H_C04', hex: '#2E8B57', series: 'C', seriesName: '海绿' },
            { name: 'H_C05', hex: '#3CB371', series: 'C', seriesName: '中海绿' },
            { name: 'H_C06', hex: '#66CDAA', series: 'C', seriesName: '岛绿' },
            { name: 'H_C07', hex: '#8FBC8F', series: 'C', seriesName: '暗海绿' },
            { name: 'H_C08', hex: '#98FB98', series: 'C', seriesName: '淡绿' },
            { name: 'H_C09', hex: '#90EE90', series: 'C', seriesName: '亮绿' },
            { name: 'H_C10', hex: '#00FA9A', series: 'C', seriesName: '中绿' },
            // L系列 - 浅绿
            { name: 'H_L01', hex: '#00FF00', series: 'L', seriesName: '亮绿' },
            { name: 'H_L02', hex: '#32CD32', series: 'L', seriesName: '酸橙绿' },
            { name: 'H_L03', hex: '#3CB371', series: 'L', seriesName: '春绿' },
            { name: 'H_L04', hex: '#7CFC00', series: 'L', seriesName: '草绿' },
            { name: 'H_L05', hex: '#7FFF00', series: 'L', seriesName: '黄绿' },
            { name: 'H_L06', hex: '#ADFF2F', series: 'L', seriesName: '绿黄' },
            { name: 'H_L07', hex: '#9ACD32', series: 'L', seriesName: '黄褐绿' },
            { name: 'H_L08', hex: '#6B8E23', series: 'L', seriesName: '橄榄绿' },
            { name: 'H_L09', hex: '#556B2F', series: 'L', seriesName: '暗橄榄绿' },
            { name: 'H_L10', hex: '#228B22', series: 'L', seriesName: '森林绿' },
            // N系列 - 棕色
            { name: 'H_N01', hex: '#8B4513', series: 'N', seriesName: '棕色' },
            { name: 'H_N02', hex: '#A0522D', series: 'N', seriesName: '浅棕' },
            { name: 'H_N03', hex: '#8B4513', series: 'N', seriesName: '深棕' },
            { name: 'H_N04', hex: '#6B3E26', series: 'N', seriesName: '咖啡棕' },
            { name: 'H_N05', hex: '#5C3317', series: 'N', seriesName: '巧克力' },
            { name: 'H_N06', hex: '#D2691E', series: 'N', seriesName: '栗棕' },
            { name: 'H_N07', hex: '#CD853F', series: 'N', seriesName: '秘鲁棕' },
            { name: 'H_N08', hex: '#DEB887', series: 'N', seriesName: '浅棕褐' },
            { name: 'H_N09', hex: '#F5DEB3', series: 'N', seriesName: '小麦色' },
            { name: 'H_N10', hex: '#FFE4B5', series: 'N', seriesName: '鹿皮色' }
        ];

        for (const color of colors) {
            const hex = color.hex.replace('#', '');
            color.r = parseInt(hex.substr(0, 2), 16);
            color.g = parseInt(hex.substr(2, 2), 16);
            color.b = parseInt(hex.substr(4, 2), 16);
            color.lab = this.rgbToLab(color.r, color.g, color.b);
        }

        return colors;
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
    }

    setupEventListeners() {
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

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
        });

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

    generatePixelArt() {
        try {
            if (!this.originalImage) {
                showToast('请先上传图片', 'error');
                return;
            }

            const pixelSize = parseInt(this.pixelSizeSlider.value);
            const colorCount = parseInt(this.colorCountSlider.value);
            const gridSize = this.getGridSize();
            const showGrid = this.showGridCheckbox ? this.showGridCheckbox.checked : true;
            const coordSize = 28;

            const canvas = document.createElement('canvas');
            canvas.width = gridSize.width * pixelSize + coordSize;
            canvas.height = gridSize.height * pixelSize + coordSize;
            const ctx = canvas.getContext('2d');

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(this.originalImage, 0, 0, gridSize.width, gridSize.height);

            const imageData = ctx.getImageData(0, 0, gridSize.width, gridSize.height);
            const pixels = imageData.data;

            const colors = this.extractColors(pixels, colorCount);

            this.beadCountMap.clear();
            this.drawPixelArt(ctx, pixels, colors, gridSize.width, gridSize.height, pixelSize, showGrid, this.highlightColor);

            this.showPixelArt(canvas, gridSize.width, gridSize.height, pixelSize, coordSize);
            this.showColorPalette(colors);
            this.updateStats(colors, gridSize.width * gridSize.height, gridSize.width, gridSize.height);

            this.pixelCanvas = canvas;
            this.downloadPureBtn.disabled = false;
            this.downloadFullBtn.disabled = false;
            this.currentColors = colors;
            this.enableExportButton();
        } catch (error) {
            console.error('生成图纸出错:', error);
            showToast('生成失败: ' + error.message, 'error');
        }
    }

    extractColors(pixels, colorCount) {
        const selectedValue = this.paletteSelect ? this.paletteSelect.value : 'mard291';
        const currentPalette = this.palettes[selectedValue] || this.perlerColors;
        
        console.log('====== extractColors (K-Means) ======');
        console.log('当前选择的色卡:', selectedValue);
        console.log('色卡颜色数量:', currentPalette.length);

        const sampleColors = [];
        const sampleStep = 3;

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

        const kMeansClusters = this.kMeans(sampleColors, Math.min(colorCount, sampleColors.length));
        const clusterCenters = kMeansClusters.map(c => {
            const avgR = Math.round(c.reduce((sum, p) => sum + p.r, 0) / c.length);
            const avgG = Math.round(c.reduce((sum, p) => sum + p.g, 0) / c.length);
            const avgB = Math.round(c.reduce((sum, p) => sum + p.b, 0) / c.length);
            return { r: avgR, g: avgG, b: avgB, lab: this.rgbToLab(avgR, avgG, avgB), count: c.length };
        });

        clusterCenters.sort((a, b) => b.count - a.count);

        const selectedCount = Math.min(colorCount, currentPalette.length);
        const result = [];
        const usedHexes = new Set();

        for (const imgColor of clusterCenters) {
            if (result.length >= selectedCount) break;

            const closest = this.findClosestPerlerColor(imgColor, usedHexes, currentPalette);
            if (closest && !usedHexes.has(closest.hex)) {
                result.push(closest);
                usedHexes.add(closest.hex);
            }
        }

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

    kMeans(points, k, maxIterations = 20) {
        if (points.length < k) {
            k = points.length;
        }

        let centroids = [];
        const shuffled = [...points].sort(() => Math.random() - 0.5);
        for (let i = 0; i < k; i++) {
            centroids.push({ ...shuffled[i] });
        }

        let clusters;
        for (let iter = 0; iter < maxIterations; iter++) {
            clusters = Array.from({ length: k }, () => []);

            for (const point of points) {
                let nearestCentroidIdx = 0;
                let minDist = Infinity;

                for (let i = 0; i < centroids.length; i++) {
                    const dist = this.colorDistance(point, centroids[i]);
                    if (dist < minDist) {
                        minDist = dist;
                        nearestCentroidIdx = i;
                    }
                }

                clusters[nearestCentroidIdx].push(point);
            }

            let converged = true;
            for (let i = 0; i < k; i++) {
                if (clusters[i].length === 0) continue;

                const newCentroid = {
                    r: Math.round(clusters[i].reduce((sum, p) => sum + p.r, 0) / clusters[i].length),
                    g: Math.round(clusters[i].reduce((sum, p) => sum + p.g, 0) / clusters[i].length),
                    b: Math.round(clusters[i].reduce((sum, p) => sum + p.b, 0) / clusters[i].length)
                };

                if (this.colorDistance(newCentroid, centroids[i]) > 2) {
                    converged = false;
                }

                centroids[i] = newCentroid;
            }

            if (converged) {
                break;
            }
        }

        return clusters.filter(c => c.length > 0);
    }

    colorDistance(c1, c2) {
        const dr = c1.r - c2.r;
        const dg = c1.g - c2.g;
        const db = c1.b - c2.b;
        return dr * dr + dg * dg + db * db;
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

        console.log('findClosestPerlerColor 返回颜色:', closest);
        return closest;
    }

    drawPixelArt(ctx, pixels, colors, width, height, pixelSize, showGrid, highlightColor = null) {
        const coordSize = 28;
        const labelSize = 10;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.fillStyle = '#f0f0f5';
        ctx.fillRect(0, 0, width * pixelSize + coordSize, coordSize);
        ctx.fillRect(0, 0, coordSize, height * pixelSize + coordSize);

        ctx.fillStyle = '#333333';
        ctx.font = `bold ${labelSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let x = 0; x < width; x++) {
            if ((x + 1) % 10 === 0) {
                ctx.fillText(x + 1, coordSize + x * pixelSize + pixelSize / 2, coordSize - 6);
            } else if ((x + 1) % 5 === 0) {
                ctx.fillText('', coordSize + x * pixelSize + pixelSize / 2, coordSize - 8);
            }
        }

        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let y = 0; y < height; y++) {
            if ((y + 1) % 10 === 0) {
                ctx.fillText(y + 1, coordSize - 4, coordSize + y * pixelSize + pixelSize / 2);
            } else if ((y + 1) % 5 === 0) {
                ctx.fillText('', coordSize - 6, coordSize + y * pixelSize + pixelSize / 2);
            }
        }

        ctx.strokeStyle = '#e0e0e8';
        ctx.lineWidth = 1;
        for (let x = 0; x <= width; x++) {
            ctx.beginPath();
            ctx.moveTo(coordSize + x * pixelSize, coordSize);
            ctx.lineTo(coordSize + x * pixelSize, coordSize + height * pixelSize);
            ctx.stroke();
        }
        for (let y = 0; y <= height; y++) {
            ctx.beginPath();
            ctx.moveTo(coordSize, coordSize + y * pixelSize);
            ctx.lineTo(coordSize + width * pixelSize, coordSize + y * pixelSize);
            ctx.stroke();
        }

        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        for (let x = 5; x < width; x += 5) {
            ctx.beginPath();
            ctx.moveTo(coordSize + x * pixelSize, coordSize);
            ctx.lineTo(coordSize + x * pixelSize, coordSize + height * pixelSize);
            ctx.stroke();
        }
        for (let y = 5; y < height; y += 5) {
            ctx.beginPath();
            ctx.moveTo(coordSize, coordSize + y * pixelSize);
            ctx.lineTo(coordSize + width * pixelSize, coordSize + y * pixelSize);
            ctx.stroke();
        }

        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        const midX = Math.floor(width / 2);
        const midY = Math.floor(height / 2);
        
        ctx.beginPath();
        ctx.moveTo(coordSize + midX * pixelSize, coordSize);
        ctx.lineTo(coordSize + midX * pixelSize, coordSize + height * pixelSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(coordSize, coordSize + midY * pixelSize);
        ctx.lineTo(coordSize + width * pixelSize, coordSize + midY * pixelSize);
        ctx.stroke();

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
                <canvas id="pixelatedCanvas" width="${canvas.width}" height="${canvas.height}" style="cursor: crosshair; display: block;"></canvas>
                <div id="coordTooltip" style="position: absolute; background: rgba(26, 26, 46, 0.95); color: #f5f5f5; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; pointer-events: none; display: none; z-index: 100; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.2);"></div>
            </div>
        `;
        const destCanvas = document.getElementById('pixelatedCanvas');
        const tooltip = document.getElementById('coordTooltip');
        destCanvas.getContext('2d').drawImage(canvas, 0, 0);

        let lastHoveredCell = null;

        destCanvas.addEventListener('mousemove', (e) => {
            const rect = destCanvas.getBoundingClientRect();
            const scaleX = destCanvas.width / rect.width;
            const scaleY = destCanvas.height / rect.height;
            const mouseX = (e.clientX - rect.left) * scaleX;
            const mouseY = (e.clientY - rect.top) * scaleY;

            const gridX = Math.floor((mouseX - coordSize) / pixelSize);
            const gridY = Math.floor((mouseY - coordSize) / pixelSize);

            if (gridX >= 0 && gridX < width && gridY >= 0 && gridY < height) {
                const cellKey = `${gridX},${gridY}`;
                if (cellKey !== lastHoveredCell) {
                    lastHoveredCell = cellKey;
                    const pixelInfo = self.pixelData[gridY]?.[gridX];
                    const colorHex = pixelInfo?.color?.hex || '#cccccc';
                    const colorName = pixelInfo?.color?.name || '未填充';

                    tooltip.innerHTML = `<span style="color: ${colorHex}; font-size: 14px;">●</span> 坐标: (${gridX + 1}, ${gridY + 1}) | ${colorName}`;

                    let tooltipX = e.clientX - rect.left + 15;
                    let tooltipY = e.clientY - rect.top - 30;

                    if (tooltipX + 200 > rect.width) tooltipX = e.clientX - rect.left - 180;
                    if (tooltipY < 0) tooltipY = e.clientY - rect.top + 15;

                    tooltip.style.left = tooltipX + 'px';
                    tooltip.style.top = tooltipY + 'px';
                    tooltip.style.display = 'block';
                }
            } else {
                tooltip.style.display = 'none';
                lastHoveredCell = null;
            }
        });

        destCanvas.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
            lastHoveredCell = null;
        });

        destCanvas.addEventListener('click', (e) => {
            const rect = destCanvas.getBoundingClientRect();
            const scaleX = destCanvas.width / rect.width;
            const scaleY = destCanvas.height / rect.height;
            const clickX = (e.clientX - rect.left) * scaleX;
            const clickY = (e.clientY - rect.top) * scaleY;

            const gridX = Math.floor((clickX - coordSize) / pixelSize);
            const gridY = Math.floor((clickY - coordSize) / pixelSize);

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

                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, destCanvas.width, destCanvas.height);

                    ctx.fillStyle = '#f0f0f5';
                    ctx.fillRect(0, 0, width * pixelSize + coordSize, coordSize);
                    ctx.fillRect(0, 0, coordSize, height * pixelSize + coordSize);

                    ctx.fillStyle = '#333333';
                    ctx.font = `bold 10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    for (let x = 0; x < width; x++) {
                        if ((x + 1) % 10 === 0) {
                            ctx.fillText(x + 1, coordSize + x * pixelSize + pixelSize / 2, coordSize - 6);
                        }
                    }

                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'middle';
                    for (let y = 0; y < height; y++) {
                        if ((y + 1) % 10 === 0) {
                            ctx.fillText(y + 1, coordSize - 4, coordSize + y * pixelSize + pixelSize / 2);
                        }
                    }

                    ctx.strokeStyle = '#e0e0e8';
                    ctx.lineWidth = 1;
                    for (let x = 0; x <= width; x++) {
                        ctx.beginPath();
                        ctx.moveTo(coordSize + x * pixelSize, coordSize);
                        ctx.lineTo(coordSize + x * pixelSize, coordSize + height * pixelSize);
                        ctx.stroke();
                    }
                    for (let y = 0; y <= height; y++) {
                        ctx.beginPath();
                        ctx.moveTo(coordSize, coordSize + y * pixelSize);
                        ctx.lineTo(coordSize + width * pixelSize, coordSize + y * pixelSize);
                        ctx.stroke();
                    }

                    ctx.strokeStyle = '#333333';
                    ctx.lineWidth = 2;
                    for (let x = 5; x < width; x += 5) {
                        ctx.beginPath();
                        ctx.moveTo(coordSize + x * pixelSize, coordSize);
                        ctx.lineTo(coordSize + x * pixelSize, coordSize + height * pixelSize);
                        ctx.stroke();
                    }
                    for (let y = 5; y < height; y += 5) {
                        ctx.beginPath();
                        ctx.moveTo(coordSize, coordSize + y * pixelSize);
                        ctx.lineTo(coordSize + width * pixelSize, coordSize + y * pixelSize);
                        ctx.stroke();
                    }

                    ctx.strokeStyle = '#ff0000';
                    ctx.lineWidth = 3;
                    const midX = Math.floor(width / 2);
                    const midY = Math.floor(height / 2);
                    
                    ctx.beginPath();
                    ctx.moveTo(coordSize + midX * pixelSize, coordSize);
                    ctx.lineTo(coordSize + midX * pixelSize, coordSize + height * pixelSize);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(coordSize, coordSize + midY * pixelSize);
                    ctx.lineTo(coordSize + width * pixelSize, coordSize + midY * pixelSize);
                    ctx.stroke();

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
        });
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

        const html = sortedColors.map(color => `
            <div class="color-swatch" title="${color.name} (${color.count}颗)" onclick="copyColorInfo('${color.hex}', '${color.name}')">
                <div class="color-swatch-inner" style="background: ${color.hex};"></div>
                <div class="color-swatch-info">
                    <span class="hex-code">${color.name}</span>
                    <span class="bead-count">${color.count}颗</span>
                </div>
            </div>
        `).join('');

        this.colorPalette.innerHTML = html;
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

        const targetWidth = 2560;
        const targetHeight = 1440;
        const coordSize = 40;

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
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let x = 0; x < dataWidth; x++) {
            ctx.fillText(x + 1, offsetX + coordSize + x * pixelSize + pixelSize / 2, offsetY + coordSize / 2);
        }

        ctx.textAlign = 'right';
        for (let y = 0; y < dataHeight; y++) {
            ctx.fillText(y + 1, offsetX + coordSize - 4, offsetY + coordSize + y * pixelSize + pixelSize / 2);
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

        const targetWidth = 2560;
        const targetHeight = 1440;

        const dataWidth = this.pixelData[0].length;
        const dataHeight = this.pixelData.length;
        const coordSize = 40;
        const legendWidth = 180;

        const usedColors = this.currentColors.filter(c => this.beadCountMap.get(c.hex) > 0);
        
        console.log('====== downloadFullImage 调试信息 ======');
        console.log('usedColors 长度:', usedColors.length);
        console.log('usedColors 内容:', usedColors);

        const availableMainWidth = targetWidth - coordSize - legendWidth - 40;
        const availableMainHeight = targetHeight - coordSize - 40;

        const mainPixelSize = Math.min(Math.floor(availableMainWidth / dataWidth), Math.floor(availableMainHeight / dataHeight));
        const mainWidth = dataWidth * mainPixelSize;
        const mainHeight = dataHeight * mainPixelSize;

        const legendItemHeight = mainPixelSize;
        const perColumnCount = Math.floor(mainHeight / (mainPixelSize * 2)); // 每个颜色占两行格子高度
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
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let x = 0; x < dataWidth; x++) {
            ctx.fillText(x + 1, mainOffsetX + coordSize + x * mainPixelSize + mainPixelSize / 2, mainOffsetY + coordSize / 2);
        }

        ctx.textAlign = 'right';
        for (let y = 0; y < dataHeight; y++) {
            ctx.fillText(y + 1, mainOffsetX + coordSize - 4, mainOffsetY + coordSize + y * mainPixelSize + mainPixelSize / 2);
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
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = 'rgba(0,0,0,0.8)';
                    ctx.shadowBlur = 1;
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

        ctx.fillStyle = '#333333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        
        const selectedPaletteKey = this.paletteSelect ? this.paletteSelect.value : 'mard291';
        const selectedPaletteName = palettes[selectedPaletteKey] ? palettes[selectedPaletteKey].name : 'MARD 全色 291';
        ctx.fillText(`色号清单 (${selectedPaletteName})`, legendX, mainOffsetY + 25);

        ctx.fillStyle = '#333333';
        ctx.fillRect(legendX, mainOffsetY + 35, actualLegendWidth - 20, 1);

        const colorBoxSize = Math.min(mainPixelSize - 4, 16);
        
        usedColors.forEach((color, index) => {
            const col = Math.floor(index / perColumnCount);
            const row = index % perColumnCount;
            const y = mainOffsetY + coordSize + row * mainPixelSize + (mainPixelSize - colorBoxSize) / 2;
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
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            color: #f5f5f5;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 2000);
}

document.addEventListener('DOMContentLoaded', () => {
    new PixelArtGenerator();
    
    // 移动端导航菜单切换
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
    
    // 点击导航链接时关闭移动端菜单
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });
});