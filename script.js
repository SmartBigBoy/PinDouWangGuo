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