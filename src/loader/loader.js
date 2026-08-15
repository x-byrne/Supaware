import { parseCSV, dateToNum, interpolateSeries } from './parser.js';

export class DataLoader {
  constructor(basePath = '.') {
    this.basePath = basePath;
  }

  async load(id) {
    const ds = window.__catalog.get(id);
    if (!ds) throw new Error(`Unknown dataset: ${id}`);
    const url = `${this.basePath}/${ds.file}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${ds.file}: ${res.status}`);
    const text = await res.text();
    const rows = parseCSV(text);
    return rows.map(row => {
      const val = row[ds.column];
      const dateVal = row['Date'];
      return {
        date: dateVal,
        periodNum: dateToNum(dateVal),
        value: val === null || val === undefined ? null : parseFloat(val)
      };
    }).filter(r => r.periodNum !== null && r.value !== null && !isNaN(r.value));
  }
}
