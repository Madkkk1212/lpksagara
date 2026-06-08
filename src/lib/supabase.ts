import { createClient } from '@supabase/supabase-js'

// Fully functional in-memory storage generator
const createInMemoryStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const key in store) delete store[key]; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] || null
  };
};

const inMemoryStorage = createInMemoryStorage();
const inMemorySessionStorage = createInMemoryStorage();

// Shim window.sessionStorage and window.localStorage if the browser blocks access to them
if (typeof window !== 'undefined') {
  const checkAndShim = (type: 'localStorage' | 'sessionStorage', mock: any) => {
    try {
      const storage = window[type];
      const testKey = '__storage_test__';
      storage.setItem(testKey, testKey);
      storage.removeItem(testKey);
    } catch (e) {
      console.warn(`[Storage Shim] Native ${type} is blocked/unavailable. Overriding with in-memory mockup.`);
      try {
        Object.defineProperty(window, type, {
          value: mock,
          configurable: true,
          writable: true,
          enumerable: true
        });
      } catch (err) {
        try {
          (window as any)[type] = mock;
        } catch (assignErr) {
          console.error(`[Storage Shim] Failed to assign mock ${type}:`, assignErr);
        }
      }
    }
  };

  checkAndShim('localStorage', inMemoryStorage);
  checkAndShim('sessionStorage', inMemorySessionStorage);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  if (typeof window === 'undefined') {
    console.warn("Supabase credentials missing during build. DB features will be disabled.")
  }
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
  {
    auth: {
      persistSession: false,
      storage: inMemoryStorage,
      detectSessionInUrl: false
    },
    realtime: {
      sessionStorage: inMemoryStorage
    }
  } as any
)
