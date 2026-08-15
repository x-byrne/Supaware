export function rebase(rows, idx = 0) {
  if (!rows || rows.length === 0) return rows;
  const base = rows[idx].value;
  if (base === null || base === 0) return rows;
  return rows.map(r => ({ ...r, value: (r.value / base) * 100 }));
}

export function growth(rows, lag = 1) {
  if (!rows || rows.length === 0) return rows;
  return rows.map((r, i) => {
    if (i < lag || r.value === null) return { ...r, value: null };
    const prev = rows[i - lag].value;
    if (prev === null || prev === 0) return { ...r, value: null };
    return { ...r, value: ((r.value / prev) - 1) * 100 };
  }).filter(r => r.value !== null);
}

export function ratio(rows, benchmark) {
  if (!rows || rows.length === 0) return rows;
  const map = new Map(benchmark.map(r => [r.period, r.value]));
  return rows.map(r => {
    const bVal = map.get(r.period);
    if (bVal === null || bVal === 0 || r.value === null) return { ...r, value: null };
    return { ...r, value: r.value / bVal };
  }).filter(r => r.value !== null);
}
