export class ChartManager {
  constructor() {
    this.instances = new Map();
  }
  create(canvasId, config) {
    if (this.instances.has(canvasId)) {
      this.instances.get(canvasId).destroy();
    }
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const defaults = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { font: { family: "'DM Sans', sans-serif" }, usePointStyle: true, pointStyle: 'circle' } },
        tooltip: {
          backgroundColor: 'rgba(26,24,18,0.95)',
          titleFont: { family: "'DM Mono', monospace", size: 12 },
          bodyFont: { family: "'DM Sans', sans-serif", size: 13 },
          padding: 12,
          cornerRadius: 6,
        }
      },
      scales: {
        x: { grid: { color: 'rgba(26,24,18,0.06)' }, ticks: { font: { family: "'DM Mono', monospace", size: 11 } } },
        y: { grid: { color: 'rgba(26,24,18,0.06)' }, ticks: { font: { family: "'DM Mono', monospace", size: 11 } } }
      }
    };
    const merged = {
      ...defaults,
      ...config,
      options: { ...defaults.options, ...(config.options || {}) },
      plugins: { ...defaults.plugins, ...(config.plugins || {}) }
    };
    const chart = new Chart(canvas, merged);
    this.instances.set(canvasId, chart);
    return chart;
  }
  update(canvasId, config) {
    const chart = this.instances.get(canvasId);
    if (!chart) return this.create(canvasId, config);
    if (config.data) chart.data = config.data;
    if (config.options) chart.options = { ...chart.options, ...config.options };
    chart.update();
    return chart;
  }
  destroy(canvasId) {
    const chart = this.instances.get(canvasId);
    if (chart) { chart.destroy(); this.instances.delete(canvasId); }
  }
}
