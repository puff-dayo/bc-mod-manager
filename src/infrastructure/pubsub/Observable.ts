/**
 * Options controlling an {@link Observable}'s subscribe/notify semantics.
 */
export interface ObservableOptions<T> {
  /** When true, a new subscriber is immediately invoked with the current snapshot. */
  emitOnSubscribe: boolean;
  /** Produces the snapshot to emit on subscribe. Required when emitOnSubscribe is true. */
  getSnapshot?: () => T;
  /**
   * Where a listener's thrown error is reported. When omitted, listener errors
   * are NOT caught (they propagate and abort the remaining listeners) — this
   * preserves call sites that historically did not guard their listeners.
   */
  onListenerError?: (error: unknown) => void;
}

/**
 * A tiny subscribe/notify primitive that replaces the hand-rolled
 * `listeners: Set<>` + `subscribe()` + `notify()` boilerplate that several
 * stateful services used to each re-implement.
 *
 * A static service holds one of these as a `private static` field and delegates
 * its public `subscribe()` to it, calling `notify()` when its state changes.
 */
export class Observable<T> {
  private readonly listeners = new Set<(value: T) => void>();
  private readonly options: ObservableOptions<T>;

  constructor(options: ObservableOptions<T>) {
    this.options = options;
  }

  /**
   * Register a listener. When `emitOnSubscribe` is set, it is invoked once
   * immediately with the current snapshot. Returns an unsubscribe function.
   */
  subscribe(listener: (value: T) => void): () => void {
    this.listeners.add(listener);
    if (this.options.emitOnSubscribe) {
      listener(this.options.getSnapshot!());
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Notify all current listeners with a value. */
  notify(value: T): void {
    const onListenerError = this.options.onListenerError;
    if (onListenerError) {
      this.listeners.forEach(listener => {
        try {
          listener(value);
        } catch (error) {
          onListenerError(error);
        }
      });
    } else {
      this.listeners.forEach(listener => listener(value));
    }
  }
}
