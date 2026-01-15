import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="header">
      <div class="header-container">
        <!-- Logo / Brand -->
        <a routerLink="/" class="brand">
          <span class="brand-icon material-symbols-outlined">public</span>
          <span class="brand-text">Lost Worlds</span>
        </a>

        <!-- Desktop Navigation -->
        <nav class="nav-desktop">
          @for (item of navItems; track item.path) {
            <a 
              [routerLink]="item.path" 
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.path === '/' }"
              class="nav-link"
            >
              <span class="material-symbols-outlined">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>

        <!-- Actions -->
        <div class="header-actions">
          <!-- Theme Toggle -->
          <button 
            class="theme-toggle" 
            (click)="themeService.toggle()"
            [attr.aria-label]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <span class="material-symbols-outlined">
              {{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}
            </span>
          </button>

          <!-- Mobile Menu Toggle -->
          <button 
            class="mobile-menu-toggle"
            (click)="toggleMobileMenu()"
            [attr.aria-expanded]="mobileMenuOpen()"
            aria-label="Toggle menu"
          >
            <span class="material-symbols-outlined">
              {{ mobileMenuOpen() ? 'close' : 'menu' }}
            </span>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation -->
      @if (mobileMenuOpen()) {
        <nav class="nav-mobile">
          @for (item of navItems; track item.path) {
            <a 
              [routerLink]="item.path" 
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.path === '/' }"
              class="nav-link"
              (click)="closeMobileMenu()"
            >
              <span class="material-symbols-outlined">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>
      }
    </header>
  `,
  styles: [`
    .header {
      position: sticky;
      top: 0;
      z-index: 100;
      background-color: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      backdrop-filter: blur(8px);
    }

    .header-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1280px;
      margin: 0 auto;
      padding: 0.75rem 1rem;

      @media (min-width: 768px) {
        padding: 0.75rem 1.5rem;
      }

      @media (min-width: 1024px) {
        padding: 1rem 2rem;
      }
    }

    // Brand
    .brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      color: var(--color-text);
      font-weight: 600;
      font-size: 1.125rem;
      transition: color 0.2s ease;

      &:hover {
        color: var(--color-primary);
      }
    }

    .brand-icon {
      font-size: 28px;
      color: var(--color-primary);
    }

    .brand-text {
      @media (max-width: 400px) {
        display: none;
      }
    }

    // Desktop Navigation
    .nav-desktop {
      display: none;
      align-items: center;
      gap: 0.25rem;

      @media (min-width: 768px) {
        display: flex;
      }
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.875rem;
      color: var(--color-text-muted);
      text-decoration: none;
      font-size: 0.9375rem;
      font-weight: 500;
      border-radius: 0.5rem;
      transition: all 0.2s ease;

      .material-symbols-outlined {
        font-size: 20px;
      }

      &:hover {
        color: var(--color-text);
        background-color: var(--color-surface-alt);
      }

      &.active {
        color: var(--color-primary);
        background-color: var(--color-primary-subtle);
      }
    }

    // Header Actions
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .theme-toggle,
    .mobile-menu-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      padding: 0;
      color: var(--color-text-muted);
      background: transparent;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        color: var(--color-text);
        background-color: var(--color-surface-alt);
      }

      .material-symbols-outlined {
        font-size: 22px;
      }
    }

    .mobile-menu-toggle {
      @media (min-width: 768px) {
        display: none;
      }
    }

    // Mobile Navigation
    .nav-mobile {
      display: flex;
      flex-direction: column;
      padding: 0.5rem 1rem 1rem;
      border-top: 1px solid var(--color-border);
      animation: slideDown 0.2s ease;

      @media (min-width: 768px) {
        display: none;
      }

      .nav-link {
        padding: 0.75rem 1rem;
        font-size: 1rem;
        border-radius: 0.5rem;
      }
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class HeaderComponent {
  readonly themeService = inject(ThemeService);
  readonly mobileMenuOpen = signal(false);

  readonly navItems: NavItem[] = [
    { label: 'Home', path: '/', icon: 'home' },
    { label: 'Characters', path: '/characters', icon: 'person' },
    { label: 'Combat', path: '/combat', icon: 'swords' },
    { label: 'Sessions', path: '/sessions', icon: 'menu_book' }
  ];

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(open => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
