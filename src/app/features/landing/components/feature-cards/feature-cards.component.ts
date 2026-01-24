import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface FeatureCard {
  title: string;
  description: string;
  icon: string;
  path: string;
  accentColor: string;
}

@Component({
  selector: 'app-feature-cards',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="feature-cards-section">
      <div class="container">
        <header class="section-header">
          <span class="section-label">Tools & Resources</span>
          <h2 class="section-title">Everything You Need to Play</h2>
          <p class="section-description">
            Manage your party, track your battles, and chronicle your adventures
          </p>
        </header>

        <div class="cards-grid">
          @for (card of featureCards; track card.path) {
            <a [routerLink]="card.path" class="feature-card" [style.--accent]="card.accentColor">
              <div class="card-icon-wrapper">
                <span class="material-symbols-outlined card-icon">{{ card.icon }}</span>
              </div>
              <h3 class="card-title">{{ card.title }}</h3>
              <p class="card-description">{{ card.description }}</p>
              <div class="card-action">
                <span>Enter</span>
                <span class="material-symbols-outlined">arrow_forward</span>
              </div>
            </a>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .feature-cards-section {
      padding: 5rem 1rem;
      background-color: var(--color-bg);

      @media (min-width: 768px) {
        padding: 6rem 1.5rem;
      }
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    // Section Header
    .section-header {
      text-align: center;
      margin-bottom: 3rem;

      @media (min-width: 768px) {
        margin-bottom: 4rem;
      }
    }

    .section-label {
      display: inline-block;
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--color-primary);
      margin-bottom: 0.75rem;
    }

    .section-title {
      font-size: clamp(1.75rem, 4vw, 2.5rem);
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: 1rem;
    }

    .section-description {
      font-size: 1.125rem;
      color: var(--color-text-muted);
      max-width: 500px;
      margin: 0 auto;
    }

    // Cards Grid
    .cards-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;

      @media (min-width: 640px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (min-width: 1024px) {
        grid-template-columns: repeat(4, 1fr);
        gap: 1.5rem;
      }
    }

    // Feature Card
    .feature-card {
      --accent: var(--color-primary);
      
      display: flex;
      flex-direction: column;
      padding: 2rem;
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 1rem;
      text-decoration: none;
      transition: all 0.3s ease;
      cursor: pointer;

      &:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-card-hover);
        border-color: var(--accent);

        .card-icon-wrapper {
          background-color: var(--accent);
          
          .card-icon {
            color: white;
          }
        }

        .card-action {
          color: var(--accent);
          gap: 0.75rem;
        }
      }
    }

    .card-icon-wrapper {
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--color-surface-alt);
      border-radius: 0.75rem;
      margin-bottom: 1.5rem;
      transition: all 0.3s ease;
    }

    .card-icon {
      font-size: 32px;
      color: var(--accent);
      transition: color 0.3s ease;
    }

    .card-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 0.75rem;
    }

    .card-description {
      font-size: 0.9375rem;
      color: var(--color-text-muted);
      line-height: 1.6;
      flex: 1;
      margin-bottom: 1.5rem;
    }

    .card-action {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--color-text-muted);
      transition: all 0.3s ease;

      .material-symbols-outlined {
        font-size: 18px;
        transition: transform 0.3s ease;
      }
    }

    .feature-card:hover .card-action .material-symbols-outlined {
      transform: translateX(4px);
    }
  `]
})
export class FeatureCardsComponent {
  readonly featureCards: FeatureCard[] = [
    {
      title: 'Character Sheets',
      description: 'View and manage your party\'s character sheets. Track stats, abilities, skills, and inventory all in one place.',
      icon: 'person',
      path: '/characters',
      accentColor: 'var(--color-primary)'
    },
    {
      title: 'Ability Codex',
      description: 'Browse and search all abilities across schools of magic. Filter by college, stats used, and ability type.',
      icon: 'auto_fix_high',
      path: '/abilities',
      accentColor: '#9370db'
    },
    {
      title: 'Combat Tracker',
      description: 'Run smooth encounters with initiative tracking, HP management, status effects, and condition tracking.',
      icon: 'swords',
      path: '/combat',
      accentColor: 'var(--color-error)'
    },
    {
      title: 'Session Notes',
      description: 'Chronicle your adventures with session summaries, important events, and campaign progress tracking.',
      icon: 'menu_book',
      path: '/sessions',
      accentColor: 'var(--color-accent)'
    }
  ];
}