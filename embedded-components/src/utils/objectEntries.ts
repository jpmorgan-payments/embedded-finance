type Entries<T> = {
  [K in keyof T]-?: [K, T[K]];
}[keyof T][];

// Object.entries() with type inference
export function objectEntries<T extends object>(obj: T): Entries<T> {
  return Object.entries(obj) as Entries<T>;
}

export function objectKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}
