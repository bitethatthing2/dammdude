declare module 'lucide-react';
declare module 'zustand' {
  type SetState<T> = (
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: boolean
  ) => void;
  type GetState<T> = () => T;
  export function create<T>(
    initializer: (set: SetState<T>, get: GetState<T>) => T
  ): () => T;
}
declare module 'sonner';
declare module '@supabase/supabase-js'; 