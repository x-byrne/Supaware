export class Controls {
  constructor(container) {
    this.container = container;
    this.state = { mode: 'index', range: 'All' };
    this.onChange = () => {};
    this.rangeSync = null;
  }
  render() {
    this.container.innerHTML = '';
    const modes = [
      { value: 'index', label: 'Indexed' },
      { value: 'growth', label: 'Growth' },
      { value: 'raw', label: 'Raw' }
    ];
    const ranges = ['1M', '3M', '6M', '1Y', '5Y', 'All'];
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.flexWrap = 'wrap';
    row.style.gap = '1rem';
    row.style.alignItems = 'center';
    const modeGroup = this._segmentedControl('mode', modes, this.state.mode);
    const rangeGroup = this._segmentedControl('range', ranges, this.state.range);
    row.appendChild(modeGroup);
    row.appendChild(rangeGroup);
    this.container.appendChild(row);
  }
  _segmentedControl(name, options, active) {
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.gap = '0.25rem';
    for (const opt of options) {
      const value = typeof opt === 'object' ? opt.value : opt;
      const label = typeof opt === 'object' ? opt.label : opt;
      const btn = document.createElement('button');
      btn.textContent = label;
      if (value === active || label === active) btn.classList.add('primary');
      btn.addEventListener('click', () => {
        wrap.querySelectorAll('button').forEach(b => b.classList.remove('primary'));
        btn.classList.add('primary');
        this.state[name] = value;
        this.onChange(this.state);
        if (name === 'range' && this.rangeSync) {
          this.rangeSync(value);
        }
      });
      wrap.appendChild(btn);
    }
    return wrap;
  }
}
