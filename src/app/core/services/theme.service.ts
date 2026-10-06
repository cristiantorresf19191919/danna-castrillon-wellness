import { Injectable, signal, computed, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storageKey = 'danna_wellness_theme';
  readonly theme = signal<ThemeMode>(this.getInitialTheme());
  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    // Synchronize DOM whenever theme signal changes
    effect(() => {
      const current = this.theme();
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        if (current === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        
        // Update browser theme-color meta tag
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
          metaTheme.setAttribute('content', current === 'dark' ? '#0B1915' : '#123C32');
        }

        // Persist to localStorage
        try {
          localStorage.setItem(this.storageKey, current);
        } catch {
          // Ignore private browsing storage restrictions
        }
      }
    });
  }

  toggleTheme(): void {
    this.theme.update(t => (t === 'light' ? 'dark' : 'light'));
  }

  setTheme(mode: ThemeMode): void {
    this.theme.set(mode);
  }

  private getInitialTheme(): ThemeMode {
    if (typeof window === 'undefined') {
      return 'light';
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
    } catch {
      // Fallback
    }

    // Default to system preference if available
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }
}
