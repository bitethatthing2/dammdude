declare module 'lodash' {
  export function groupBy<T>(
    collection: T[],
    iteratee?: string | ((value: T) => string | number)
  ): Record<string, T[]>;
  
  export function sumBy<T>(
    collection: T[],
    iteratee?: string | ((value: T) => number)
  ): number;
  
  export function orderBy<T>(
    collection: T[],
    iteratees?: string | string[] | ((value: T) => unknown) | ((value: T) => unknown)[],
    orders?: ('asc' | 'desc')[]
  ): T[];
  
  export function uniqBy<T>(
    array: T[],
    iteratee?: string | ((value: T) => unknown)
  ): T[];
  
  export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait?: number,
    options?: {
      leading?: boolean;
      maxWait?: number;
      trailing?: boolean;
    }
  ): T & {
    cancel: () => void;
    flush: () => ReturnType<T>;
  };
  
  export function isEmpty(value: unknown): boolean;
  export function isEqual(value: unknown, other: unknown): boolean;
  export function cloneDeep<T>(value: T): T;
  export function merge<T, U>(object: T, ...sources: U[]): T & U;
  export function get<T>(object: unknown, path: string | string[], defaultValue?: T): T;
  export function set<T>(object: T, path: string | string[], value: unknown): T;
  export function has(object: unknown, path: string | string[]): boolean;
  export function pick<T, K extends keyof T>(object: T, ...paths: K[]): Pick<T, K>;
  export function omit<T, K extends keyof T>(object: T, ...paths: K[]): Omit<T, K>;
}