import { DataCatalog } from '../loader/catalog.js';
import { DataLoader } from '../loader/loader.js';
import { ComparisonManager } from '../charts/comparisonManager.js';
import { DatasetPicker } from './datasetPicker.js';
import { ComparisonBuilder } from './comparisonBuilder.js';
import { Controls } from './controls.js';
import { RangeSlider } from './rangeSlider.js';

export class App {
  constructor() {
    this.catalog = null;
    this.loader = null;
    this.comparison = null;
    this.picker = null;
    this.builder = null;
    this.controls = null;
    this.rangeSlider = null;
  }
  async mount(el) {
    this.el = el;
    await this._initData();
    this._initUI();
  }
  async _initData() {
    this.catalog = await DataCatalog.fromJSON('./datasets.json');
    window.__catalog = this.catalog;
    this.loader = new DataLoader();
    this.comparison = new ComparisonManager(this.catalog, this.loader);
  }
  _initUI() {
    this.el.innerHTML = `
      <header class="app-header">
        <h1><span>Super</span>Vis</h1>
        <p class="app-sub">Australian Superannuation Performance Visualisation</p>
      </header>
      <main class="app-main">
        <div class="grid grid-2">
          <div class="card">
            <h2>Select Series</h2>
            <div id="dataset-picker"></div>
          </div>
          <div class="card">
            <h2>Comparison</h2>
            <div id="comparison-builder"></div>
          </div>
        </div>
        <div class="card">
          <h2>Controls</h2>
          <div id="controls"></div>
        </div>
        <div class="card">
          <h2>Period</h2>
          <div id="range-slider"></div>
        </div>
        <div class="card">
          <h2>Chart</h2>
          <div class="chart-container"><canvas id="main-chart"></canvas></div>
        </div>
        <div class="card">
          <h2>Returns Distribution</h2>
          <div class="chart-container"><canvas id="returns-chart"></canvas></div>
        </div>
      </main>
    `;
    this.picker = new DatasetPicker(this.catalog, document.getElementById('dataset-picker'));
    this.picker.render();
    this.builder = new ComparisonBuilder(document.getElementById('comparison-builder'));
    this.controls = new Controls(document.getElementById('controls'));
    this.controls.render();
    this.rangeSlider = new RangeSlider(document.getElementById('range-slider'));
    this._wireEvents();
  }
  _wireEvents() {
    this.picker.onChange = (ids) => {
      this.builder.clear();
      for (const id of ids) {
        const meta = this.catalog.get(id);
        if (meta) this.builder.add(id, meta);
      }
      this.builder.render();
      this._renderChart();
    };
    this.controls.onChange = () => this._renderChart();
    this.rangeSlider.onChange = () => this._renderChart();
  }
  async _renderChart() {
    if (!this.picker.selected.size) return;
    this.comparison.clear();
    for (const id of this.picker.selected) {
      this.comparison.addSeries(id, []);
    }
    const from = new Date(this.rangeSlider.from, 0, 1).getTime();
    const to = new Date(this.rangeSlider.to, 11, 31).getTime();
    await this.comparison.render('main-chart', this.controls.state.mode, from, to);
    this._renderReturnsChart(from, to);
  }
  async _renderReturnsChart(from, to) {
    if (!this.picker.selected.size) return;
    const ids = Array.from(this.picker.selected);
    const allData = await this.comparison._ensureDataLoaded();
    const labels = [];
    const datasets = [];

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const meta = this.catalog.get(id);
      const rows = allData[id].filter(r => r.period >= from && r.period <= to);
      if (rows.length < 2) continue;
      const totalReturn = ((rows[rows.length - 1].value / rows[0].value) - 1) * 100;
      labels.push(meta.name);
      datasets.push({
        label: meta.name,
        data: [parseFloat(totalReturn.toFixed(2))],
        backgroundColor: PALETTE[i % PALETTE.length] + '33',
        borderColor: PALETTE[i % PALETTE.length],
        borderWidth: 2,
        borderRadius: 4
      });
    }

    const canvas = document.getElementById('returns-chart');
    if (!canvas) return;
    if (window.returnsChart) window.returnsChart.destroy();
    window.returnsChart = new Chart(canvas, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: datasets.length > 1 },
          tooltip: {
            callbacks: {
              label: ctx => ` Total Return: ${ctx.parsed.y > 0 ? '+' : ''}${ctx.parsed.y.toFixed(2)}%`
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: 'rgba(26,24,18,0.06)' },
            ticks: {
              font: { family: "'DM Mono', monospace", size: 11 },
              callback: v => `${v > 0 ? '+' : ''}${v.toFixed(0)}%`
            }
          }
        }
      }
    });
  }
}

const PALETTE = ['#2a9d8f', '#e76f51', '#264653', '#e9c46a', '#8ab17d', '#f4a261', '#457b9d', '#d62828', '#1d3557', '#f77f00'];
