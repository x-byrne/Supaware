export class ComparisonBuilder {
  constructor(container) {
    this.container = container;
    this.items = new Map();
    this.onRemove = () => {};
  }
  render() {
    this.container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexWrap = 'wrap';
    wrap.style.gap = '0.5rem';
    for (const [id, meta] of this.items) {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.innerHTML = `${meta.name} <button data-id="${id}">&times;</button>`;
      tag.querySelector('button').addEventListener('click', () => {
        this.items.delete(id);
        this.onRemove(id);
        this.render();
      });
      wrap.appendChild(tag);
    }
    this.container.appendChild(wrap);
  }
  add(id, meta) { this.items.set(id, meta); }
  remove(id) { this.items.delete(id); }
  clear() { this.items.clear(); }
}
