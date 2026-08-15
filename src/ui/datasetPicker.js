export class DatasetPicker {
  constructor(catalog, container) {
    this.catalog = catalog;
    this.container = container;
    this.selected = new Set();
    this.onChange = () => {};
  }
  render() {
    const groups = this.catalog.listByCategory();
    this.container.innerHTML = '';
    for (const [cat, items] of groups) {
      const section = document.createElement('div');
      section.innerHTML = `<h3 style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);margin-bottom:0.5rem;">${cat}</h3>`;
      const list = document.createElement('div');
      list.style.display = 'flex';
      list.style.flexWrap = 'wrap';
      list.style.gap = '0.5rem';
      for (const item of items) {
        const btn = document.createElement('button');
        btn.textContent = item.name;
        btn.dataset.id = item.id;
        btn.addEventListener('click', () => {
          if (this.selected.has(item.id)) {
            this.selected.delete(item.id);
            btn.classList.remove('primary');
          } else {
            this.selected.add(item.id);
            btn.classList.add('primary');
          }
          this.onChange(Array.from(this.selected));
        });
        list.appendChild(btn);
      }
      section.appendChild(list);
      this.container.appendChild(section);
    }
  }
  setSelected(ids) { this.selected = new Set(ids); }
}
