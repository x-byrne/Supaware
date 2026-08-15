export class RangeSlider {
  constructor(container, onChange) {
    this.container = container;
    const now = new Date();
    const currentYear = now.getFullYear();
    this.min = 2010;
    this.max = currentYear;
    this.from = this.max - 1;
    this.to = this.max;
    this.onChange = onChange || (() => {});
    this.render();
  }
  render() {
    this.container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'range-slider';
    const track = document.createElement('div');
    track.className = 'track';
    const fill = document.createElement('div');
    fill.className = 'track-fill';
    const fromPct = ((this.from - this.min) / (this.max - this.min)) * 100;
    const toPct = ((this.to - this.min) / (this.max - this.min)) * 100;
    fill.style.left = fromPct + '%';
    fill.style.width = (toPct - fromPct) + '%';
    const fromInput = document.createElement('input');
    fromInput.type = 'range';
    fromInput.min = this.min;
    fromInput.max = this.max;
    fromInput.value = this.from;
    fromInput.addEventListener('input', () => {
      this.from = parseInt(fromInput.value, 10);
      if (this.from > this.to) this.from = this.to;
      this._updateFill(fill);
      this.onChange({ from: this.from, to: this.to });
    });
    const toInput = document.createElement('input');
    toInput.type = 'range';
    toInput.min = this.min;
    toInput.max = this.max;
    toInput.value = this.to;
    toInput.addEventListener('input', () => {
      this.to = parseInt(toInput.value, 10);
      if (this.to < this.from) this.to = this.from;
      this._updateFill(fill);
      this.onChange({ from: this.from, to: this.to });
    });
    const label = document.createElement('div');
    label.style.fontFamily = "var(--mono)";
    label.style.fontSize = '0.8rem';
    label.style.color = 'var(--muted)';
    label.textContent = `${this.from} – ${this.to}`;
    const updateLabel = () => { label.textContent = `${this.from} – ${this.to}`; };
    fromInput.addEventListener('input', updateLabel);
    toInput.addEventListener('input', updateLabel);
    wrap.append(track, fill, fromInput, toInput);
    this.container.appendChild(wrap);
    this.container.appendChild(label);
  }
  _updateFill(fill) {
    const newFromPct = ((this.from - this.min) / (this.max - this.min)) * 100;
    const newToPct = ((this.to - this.min) / (this.max - this.min)) * 100;
    fill.style.left = newFromPct + '%';
    fill.style.width = (newToPct - newFromPct) + '%';
  }
}
