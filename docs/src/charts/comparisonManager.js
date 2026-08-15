import { ChartManager } from './chartManager.js';
import { rebase } from '../transforms/rebase.js';
import { growth } from '../transforms/growth.js';
import { ratio } from '../transforms/ratio.js';

const PALETTE = ['#2a9d8f', '#e76f51', '#264653', '#e9c46a', '#8ab17d', '#f4a261', '#457b9d', '#d62828', '#1d3557', '#f77f00'];

export class ComparisonManager {
  constructor(catalog, loader) {
    this.catalog = catalog;
    this.loader = loader;
    this.chartManager = new ChartManager();
    this.series = new Map();
    this.benchmarkId = null;
    this._allData = null;
  }

  async _ensureDataLoaded() {
    if (this._allData) return this._allData;
    const ds = this.catalog.get('high_growth');
    const url = `./${ds.file}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load data: ${res.status}`);
    const text = await res.text();
    const { parseCSV, dateToNum } = await import('../loader/parser.js');
    const rows = parseCSV(text);
    const result = {};
    for (const key of Object.keys(this.catalog.datasets)) {
      const meta = this.catalog.get(key);
      result[key] = rows
        .map(row => ({
          period: dateToNum(row['Date']),
          label: row['Date'],
          value: row[meta.column] === null ? null : parseFloat(row[meta.column])
        }))
        .filter(r => r.period !== null && r.value !== null && !isNaN(r.value));
    }
    this._allData = result;
    return result;
  }

  addSeries(id, transformPipeline = []) {
    const ds = this.catalog.get(id);
    if (!ds) throw new Error(`Unknown dataset: ${id}`);
    this.series.set(id, { id, transformPipeline, meta: ds });
  }
  removeSeries(id) { this.series.delete(id); }
  clear() { this.series.clear(); this.benchmarkId = null; }
  setBenchmark(id) { this.benchmarkId = id; }

  async render(canvasId, mode = 'index', from, to) {
    const ids = Array.from(this.series.keys());
    if (!ids.length) return null;
    const allData = await this._ensureDataLoaded();
    const targetNums = this._commonTimeline(ids.map(id => allData[id]));
    const datasets = [];
    const benchmark = this.benchmarkId ? allData[this.benchmarkId] : allData[ids[0]];

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const meta = this.series.get(id).meta;
      let rows = allData[id];
      const pipeline = this.series.get(id).transformPipeline;
      for (const fn of pipeline) {
        if (fn === 'rebase') rows = rebase(rows);
        else if (fn === 'growth') rows = growth(rows, 1);
        else if (fn === 'ratio' && this.benchmarkId && id !== this.benchmarkId) rows = ratio(rows, benchmark);
      }
      if (mode === 'index') rows = rebase(rows);
      else if (mode === 'growth') rows = growth(rows, 1);
      else if (mode === 'ratio' && this.benchmarkId && id !== this.benchmarkId) rows = ratio(rows, benchmark);

      if (from !== undefined && to !== undefined) {
        rows = rows.filter(r => r.period >= from && r.period <= to);
      }

      const color = this._assignColor(i, id);
      datasets.push({
        label: meta.name,
        data: rows.map(r => ({ x: r.label, y: r.value })),
        borderColor: color,
        backgroundColor: color + '15',
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.1
      });
    }

    return this.chartManager.create(canvasId, {
      type: 'line',
      data: { datasets },
      options: {
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: datasets.length > 1 } }
      }
    });
  }

  _commonTimeline(rowsArrays) {
    const nums = new Set();
    for (const rows of rowsArrays) {
      for (const r of rows) {
        if (r.period !== null) nums.add(r.period);
      }
    }
    return Array.from(nums).sort((a, b) => a - b);
  }

  _assignColor(i, id) {
    if (id === this.benchmarkId) return '#1a1812';
    return PALETTE[i % PALETTE.length];
  }
}
