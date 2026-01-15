import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-combat',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-container">
      <div class="placeholder-content">
        <div class="placeholder-icon">
          <span class="material-symbols-outlined">swords</span>
        </div>
        
        <h1 class="placeholder-title">Combat Tracker</h1>
        
        <p class="placeholder-description">
          This page will help you run smooth combat encounters. 
          Track initiative, manage HP, and handle status effects.
        </p>

        <div class="placeholder-features">
          <div class="feature-item">
            <span class="material-symbols-outlined">format_list_numbered</span>
            <span>Initiative Order</span>
          </div>
          <div class="feature-item">
            <span class="material-symbols-outlined">favorite</span>
            <span>HP Tracking</span>
          </div>
          <div class="feature-item">
            <span class="material-symbols-outlined">local_fire_department</span>
            <span>Status Effects</span>
          </div>
          <div class="feature-item">
            <span class="material-symbols-outlined">timer</span>
            <span>Round Counter</span>
          </div>
        </div>

        <div class="placeholder-status">
          <span class="status-badge">Coming Soon</span>
        </div>

        <a routerLink="/" class="back-link">
          <span class="material-symbols-outlined">arrow_back</span>
          <span>Back to Home</span>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      min-height: calc(100vh - 140px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      background-color: var(--color-bg);
    }

    .placeholder-content {
      text-align: center;
      max-width: 500px;
    }

    .placeholder-icon {
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      background-color: var(--color-error-subtle);
      border-radius: 1rem;

      .material-symbols-outlined {
        font-size: 40px;
        color: var(--color-error);
      }
    }

    .placeholder-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: 1rem;
    }

    .placeholder-description {
      font-size: 1.0625rem;
      color: var(--color-text-muted);
      line-height: 1.7;
      margin-bottom: 2rem;
    }

    .placeholder-features {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.75rem;
      margin-bottom: 2rem;
    }

    .feature-item {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 1rem;
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 9999px;
      font-size: 0.875rem;
      color: var(--color-text-muted);

      .material-symbols-outlined {
        font-size: 18px;
        color: var(--color-error);
      }
    }

    .placeholder-status {
      margin-bottom: 2rem;
    }

    .status-badge {
      display: inline-block;
      padding: 0.5rem 1.25rem;
      background-color: var(--color-accent-subtle);
      color: var(--color-accent);
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: 9999px;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 500;
      transition: gap 0.2s ease;

      &:hover {
        gap: 0.75rem;
      }

      .material-symbols-outlined {
        font-size: 20px;
      }
    }
  `]
})
export class CombatComponent {}
