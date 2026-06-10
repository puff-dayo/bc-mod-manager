import {LocalStorage} from "@/infrastructure/storage/LocalStorage";

/**
 * Persistence base classes built on top of {@link LocalStorage}.
 *
 * They remove the "read array → find / upsert / filter → write array" boilerplate
 * that every aggregate's persistence used to re-implement. Three shapes cover all
 * of the app's stored data:
 *  - {@link CollectionRepository}: an array of entities addressed by a derived key.
 *  - {@link DocumentRepository}: a single document merged with defaults.
 *  - {@link KeyValueRepository}: a `Record<string, V>` map.
 */

/**
 * A localStorage-backed collection of entities, addressed by a key derived from
 * each entity (a single `id` field, a composite key, etc).
 */
export abstract class CollectionRepository<T> {
  protected abstract readonly storageKey: string;

  /** Derive the unique key for an entity (e.g. `e.id`, or `${a}_${b}`). */
  protected abstract keyOf(entity: T): string;

  /** Read the full collection (empty array when nothing is stored). */
  getAll(): T[] {
    return LocalStorage.getItem<T[]>(this.storageKey) ?? [];
  }

  /** Find a single entity by its key, or null. */
  findByKey(key: string): T | null {
    return this.getAll().find(e => this.keyOf(e) === key) ?? null;
  }

  /** Insert or replace an entity by key. Callers stamp timestamps beforehand. */
  upsert(entity: T): void {
    const all = this.getAll();
    const index = all.findIndex(e => this.keyOf(e) === this.keyOf(entity));
    if (index !== -1) {
      all[index] = entity;
    } else {
      all.push(entity);
    }
    this.saveAll(all);
  }

  /** Remove an entity by key. Returns false when nothing matched. */
  removeByKey(key: string): boolean {
    const all = this.getAll();
    const filtered = all.filter(e => this.keyOf(e) !== key);
    if (filtered.length === all.length) {
      return false;
    }
    this.saveAll(filtered);
    return true;
  }

  /** Replace the entire collection with an empty array. */
  clear(): void {
    this.saveAll([]);
  }

  /** Persist the full collection. */
  saveAll(all: T[]): void {
    LocalStorage.setItem(this.storageKey, all);
  }
}

/**
 * A localStorage-backed single document that is always merged over a set of
 * defaults on read, so missing keys fall back to their default value.
 */
export abstract class DocumentRepository<T extends object> {
  protected abstract readonly storageKey: string;
  protected abstract readonly defaults: T;

  /** Read the document with defaults filled in for missing keys. */
  get(): T {
    const stored = LocalStorage.getItem<Partial<T>>(this.storageKey);
    return {...this.defaults, ...(stored ?? {})};
  }

  /** Persist the full document. */
  set(next: T): void {
    LocalStorage.setItem(this.storageKey, next);
  }
}

/**
 * A localStorage-backed `Record<string, V>` map.
 */
export abstract class KeyValueRepository<V> {
  protected abstract readonly storageKey: string;

  private map(): Record<string, V> {
    return LocalStorage.getItem<Record<string, V>>(this.storageKey) ?? {};
  }

  /** Read a value by key, or null when the key is absent. */
  get(key: string): V | null {
    const map = this.map();
    return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null;
  }

  /** Set a value, or delete the key when value is null. */
  set(key: string, value: V | null): void {
    const map = this.map();
    if (value === null) {
      delete map[key];
    } else {
      map[key] = value;
    }
    LocalStorage.setItem(this.storageKey, map);
  }
}
