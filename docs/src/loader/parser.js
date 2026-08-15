export function parseCSV(text) {
  const rows = [];
  let cur = '';
  let inQ = false;
  const cells = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += ch;
    } else {
      if (ch === '"') { inQ = true; }
      else if (ch === ',') { cells.push(cur.trim()); cur = ''; }
      else if (ch === '\r' || ch === '\n') {
        cells.push(cur.trim()); cur = '';
        if (cells.some(c => c !== '')) rows.push(cells.splice(0));
      } else cur += ch;
    }
  }
  if (cur || cells.length) cells.push(cur.trim());
  if (cells.some(c => c !== '')) rows.push(cells);
  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map(r => {
    const row = {};
    headers.forEach((h, i) => {
      const v = r[i];
      row[h] = v === '' || v === undefined ? null : isNaN(v) ? v : parseFloat(v);
    });
    return row;
  });
}

export function dateToNum(d) {
  if (!d) return null;
  const parts = String(d).split('/');
  if (parts.length === 3) {
    const dd = parseInt(parts[0], 10);
    const mm = parseInt(parts[1], 10) - 1;
    const yy = parseInt(parts[2], 10);
    const date = new Date(yy, mm, dd);
    return date.getTime();
  }
  return null;
}

export function dateLabel(num) {
  if (num === null || num === undefined) return '';
  const d = new Date(num);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function interpolateSeries(rows, targetNums, valueKey = 'value') {
  if (!rows || rows.length === 0) return [];
  const points = rows
    .map(r => ({ num: r.periodNum, val: r[valueKey] }))
    .filter(p => p.num !== null && p.val !== null && !isNaN(p.val))
    .sort((a, b) => a.num - b.num);
  if (points.length === 0) return [];
  const result = [];
  for (const tn of targetNums) {
    if (tn < points[0].num || tn > points[points.length - 1].num) continue;
    let i = 0;
    while (i < points.length - 1 && points[i + 1].num < tn) i++;
    if (points[i].num === tn) {
      result.push({ period: tn, label: dateLabel(tn), value: points[i].val });
    } else if (i < points.length - 1) {
      const t = (tn - points[i].num) / (points[i + 1].num - points[i].num);
      const v = points[i].val + t * (points[i + 1].val - points[i].val);
      result.push({ period: tn, label: dateLabel(tn), value: Math.round(v * 10000) / 10000 });
    }
  }
  return result;
}
