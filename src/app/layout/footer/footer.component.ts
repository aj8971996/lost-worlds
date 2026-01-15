import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-brand">
          <span class="material-symbols-outlined">public</span>
          <span>Lost Worlds</span>
        </div>
        
        <p class="footer-tagline">Where realms converge and history remembers</p>
        
        <p class="footer-copyright">
          © {{ currentYear }} Lost Worlds TTRPG. All rights reserved.
        </p>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      flex-shrink: 0;
      background-color: var(--color-surface);
      border-top: 1px solid var(--color-border);
      padding: 2rem 1rem;
      margin-top: auto;
    }

    .footer-container {
      max-width: 1280px;
      margin: 0 auto;
      text-align: center;
    }

    .footer-brand {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      font-size: 1.125rem;
      color: var(--color-text);
      margin-bottom: 0.5rem;

      .material-symbols-outlined {
        font-size: 24px;
        color: var(--color-primary);
      }
    }

    .footer-tagline {
      font-style: italic;
      color: var(--color-text-muted);
      margin-bottom: 1rem;
    }

    .footer-copyright {
      font-size: 0.875rem;
      color: var(--color-text-subtle);
    }
  `]
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();
}
