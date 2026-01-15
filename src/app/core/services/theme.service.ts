import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'theme';
  
  // Signal to track current theme
  readonly theme = signal<Theme>(this.getInitialTheme());
  
  // Computed signals for convenience
  readonly isDark = () => this.theme() === 'dark';
  readonly isLight = () => this.theme() === 'light';
  
  constructor() {
    // Effect to apply theme changes to DOM and localStorage
    effect(() => {
      const currentTheme = this.theme();
      this.applyTheme(currentTheme);
      this.saveTheme(currentTheme);
    });
    
    // Listen for system theme changes
    this.watchSystemTheme();
  }
  
  /**
   * Toggle between light and dark themes
   */
  toggle(): void {
    this.theme.update(current => current === 'light' ? 'dark' : 'light');
  }
  
  /**
   * Set a specific theme
   */
  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }
  
  /**
   * Get the initial theme based on saved preference or system preference
   */
  private getInitialTheme(): Theme {
    // Check localStorage first
    if (typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        return savedTheme;
      }
    }
    
    // Fall back to system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    // Default to light
    return 'light';
  }
  
  /**
   * Apply theme to the document
   */
  private applyTheme(theme: Theme): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      
      // Update theme-color meta tag for mobile browsers
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', theme === 'dark' ? '#021f3f' : '#253a40');
      }
    }
  }
  
  /**
   * Save theme preference to localStorage
   */
  private saveTheme(theme: Theme): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, theme);
    }
  }
  
  /**
   * Watch for system theme changes
   */
  private watchSystemTheme(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      mediaQuery.addEventListener('change', (e) => {
        // Only auto-switch if user hasn't set a preference
        const savedTheme = localStorage.getItem(this.STORAGE_KEY);
        if (!savedTheme) {
          this.theme.set(e.matches ? 'dark' : 'light');
        }
      });
    }
  }
}
