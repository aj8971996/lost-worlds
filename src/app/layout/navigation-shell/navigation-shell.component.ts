import {
  Component,
  signal,
  computed,
  ElementRef,
  ViewChild,
  HostListener,
  inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  exact: boolean;
}

@Component({
  selector: 'app-navigation-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './navigation-shell.component.html',
  styleUrl: './navigation-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavigationShellComponent {
  @ViewChild('contentArea') contentArea!: ElementRef<HTMLElement>;

  private readonly themeService = inject(ThemeService);

  // Navigation items - exact is now required boolean
  protected readonly primaryNav = signal<NavItem[]>([
    { label: 'Home', path: '/', icon: 'home', exact: true },
    { label: 'Characters', path: '/characters', icon: 'person', exact: false },
    { label: 'Create Character', path: '/create', icon: 'person_add', exact: false },
  ]);

  protected readonly toolsNav = signal<NavItem[]>([
    { label: 'Abilities Library', path: '/abilities', icon: 'auto_fix_high', exact: false },
    { label: 'Combat Tracker', path: '/combat', icon: 'swords', exact: false },
    { label: 'Session Notes', path: '/sessions', icon: 'menu_book', exact: false },
  ]);

  // State
  protected readonly navOpen = signal<boolean>(false);
  protected readonly isScrolled = signal<boolean>(false);

  // Theme - using actual ThemeService API
  protected readonly isDarkTheme = computed(() => 
    this.themeService.theme() === 'dark'
  );

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.navOpen()) {
      this.closeNav();
    }
  }

  protected onScroll(event: Event): void {
    const target = event.target as HTMLElement;
    this.isScrolled.set(target.scrollTop > 50);
  }

  protected toggleNav(): void {
    this.navOpen.update(open => !open);
    document.body.style.overflow = this.navOpen() ? 'hidden' : '';
  }

  protected closeNav(): void {
    this.navOpen.set(false);
    document.body.style.overflow = '';
  }

  protected toggleTheme(): void {
    this.themeService.toggle();
  }
}
