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
    this.selectedIds = new Set();
    this._rendering = false;
    this._dataLoaded = false;
  }

  async mount(el) {
    this.el = el;
    window.addEventListener('error', (e) => {
      console.error('Global error:', e.error);
      this._showError(String(e.error));
    });
    try {
      await this._initData();
      this._initUI();
      this._selectDefaults();
      this._hideLoading();
    } catch (err) {
      console.error('App mount failed:', err);
      this._showError(err.message);
      this._hideLoading();
    }
  }

  _hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  _showError(msg) {
    const box = document.getElementById('error-box');
    if (box) {
      box.textContent = `Error: ${msg}`;
      box.classList.add('visible');
    }
  }

  _selectDefaults() {
    const defaults = ['high_growth', 'balanced'];
    this._updateSelection(defaults);
  }

  _updateSelection(ids) {
    try {
      console.log('_updateSelection called with:', ids);
      this.selectedIds = new Set(ids);
      this.picker.setSelected(ids);
      this.builder.clear();
      for (const id of ids) {
        const meta = this.catalog.get(id);
        if (meta) this.builder.add(id, meta);
      }
      this.builder.render();
      this._renderChart();
    } catch (err) {
      console.error('_updateSelection failed:', err);
      this._showError(err.message);
    }
  }

  _initData() {
    console.log('Loading datasets config...');
    return DataCatalog.fromJSON('./datasets.json').then(catalog => {
      this.catalog = catalog;
      window.__catalog = catalog;
      console.log('Catalog loaded:', Object.keys(catalog.datasets).length, 'datasets');
      this.loader = new DataLoader();
      this.comparison = new ComparisonManager(catalog, this.loader);
      this._dataLoaded = true;
    });
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
    this.picker.onChange = (ids) => {
      console.log('Picker changed:', ids);
      this._updateSelection(ids);
    };

    this.builder = new ComparisonBuilder(document.getElementById('comparison-builder'));
    this.builder.onRemove = (id) => {
      console.log('Removing series:', id);
      const next = new Set(this.selectedIds);
      next.delete(id);
      this._updateSelection(Array.from(next));
    };

    this.controls = new Controls(document.getElementById('controls'));
    this.controls.render();
    this.controls.onChange = () => {
      console.log('Controls changed:', this.controls.state);
      this._renderChart();
    };

    this.rangeSlider = new RangeSlider(document.getElementById('range-slider'));
    this.rangeSlider.onChange = () => {
      console.log('Range changed:', this.rangeSlider.from, '-', this.rangeSlider.to);
      this._renderChart();
    };
  }

  async _renderChart() {
    if (this._rendering) {
      console.log('Render in progress, skipping');
      return;
    }
    if (!this.selectedIds.size) {
      console.log('No series selected, skipping render');
      return;
    }
    if (!this._dataLoaded) {
      console.log('Data not loaded yet, skipping render');
      return;
    }
    this._rendering = true;
    console.log('Rendering chart with series:', Array.from(this.selectedIds));
    
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    try {
      this.comparison.clear();
      for (const id of this.selectedIds) {
        this.comparison.addSeries(id, []);
      }
      const from = new Date(this.rangeSlider.from, 0, 1).getTime();
      const to = new Date(this.rangeSlider.to, 11, 31).getTime();
      
      const chart = await this.comparison.render('main-chart', this.controls.state.mode, from, to);
      console.log('Main chart rendered:', chart ? 'success' : 'no chart returned');
      
      if (chart) {
        this._renderReturnsChart(from, to);
      }
    } catch (err) {
      console.error('Chart render failed:', err);
      this._showError(err.message);
    } finally {
      this._rendering = false;
    }
  }

  async _renderReturnsChart(from, to) {
    if (!this.selectedIds.size) return;
    const ids = Array.from(this.selectedIds);
    try {
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
      console.log('Returns chart rendered');
    } catch (err) {
      console.error('Returns chart render failed:', err);
    }
  }
}

const PALETTE = ['#2a9d8f', '#e76f51', '#264653', '#e9c46a', '#8ab17d', '#f4a261', '#457b9d', '#d62828', '#1d3557', '#f77f00'];
