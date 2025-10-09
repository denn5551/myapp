export type UploadItem = {
  url: string;
  name?: string;
  mime?: string;
  size?: number;
};

type Listener = (items: UploadItem[]) => void;

class UploadsStore {
  private items: UploadItem[] = [];
  private listeners: Set<Listener> = new Set();

  get() { return this.items; }

  // Важно: cleanup возвращает void (а не boolean)
  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  private notify() { for (const fn of this.listeners) fn(this.items); }

  add(item: UploadItem) {
    if (!this.items.some(x => x.url === item.url)) {
      this.items = [...this.items, item];
      this.notify();
    }
  }

  addMany(items: UploadItem[]) {
    let changed = false;
    for (const it of items) {
      if (!this.items.some(x => x.url === it.url)) {
        this.items.push(it);
        changed = true;
      }
    }
    if (changed) this.notify();
  }

  remove(url: string) {
    const next = this.items.filter(x => x.url !== url);
    if (next.length !== this.items.length) {
      this.items = next;
      this.notify();
    }
  }

  clear() {
    if (this.items.length) {
      this.items = [];
      this.notify();
    }
  }
}

export const uploadsStore = new UploadsStore();
