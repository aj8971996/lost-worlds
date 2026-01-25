import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface ToolCard {
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly path: string;
  readonly accentColor: string;
}

@Component({
  selector: 'app-tools-grid',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="tools-section">
      <div class="container">
        <header class="section-header">
          <span class="section-label">Tools & Resources</span>
          <h2 class="section-title">Everything You Need to Play</h2>
          <p class="section-description">
            Manage your party, track your battles, and chronicle your adventures
          </p>
        </header>

        <div class="tools-grid">
          @for (tool of tools(); track tool.path) {
            <a 
              [routerLink]="tool.path" 
              class="tool-card"
              [style.--card-accent]="tool.accentColor"
            >
              <div class="card-icon-wrapper">
                <span class="material-symbols-outlined">{{ tool.icon }}</span>
              </div>
              <h3 class="card-title">{{ tool.title }}</h3>
              <p class="card-description">{{ tool.description }}</p>
              <span class="card-action">
                <span>Enter</span>
                <span class="material-symbols-outlined arrow">arrow_forward</span>
              </span>
            </a>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .tools-section {
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
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--color-primary);
      margin-bottom: 0.75rem;
    }

    .section-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: clamp(1.75rem, 4vw, 2.5rem);
      font-weight: 500;
      color: var(--color-text);
      margin-bottom: 1rem;
    }

    .section-description {
      font-size: 1.0625rem;
      color: var(--color-text-muted);
      max-width: 500px;
      margin: 0 auto;
    }

    // Tools Grid
    .tools-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;

      @media (min-width: 640px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (min-width: 1024px) {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    // Tool Card
    .tool-card {
      --card-accent: var(--color-primary);
      
      display: flex;
      flex-direction: column;
      padding: 1.75rem;
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 0.75rem;
      text-decoration: none;
      transition: all 0.3s ease;
      cursor: pointer;

      &:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-card-hover);
        border-color: var(--card-accent);

        .card-icon-wrapper {
          background-color: var(--card-accent);
          
          .material-symbols-outlined {
            color: white;
          }
        }

        .card-action {
          color: var(--card-accent);
          
          .arrow {
            transform: translateX(4px);
          }
        }
      }
    }

    .card-icon-wrapper {
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--color-surface-alt);
      border-radius: 0.625rem;
      margin-bottom: 1.25rem;
      transition: all 0.3s ease;

      .material-symbols-outlined {
        font-size: 28px;
        color: var(--card-accent);
        transition: color 0.3s ease;
      }
    }

    .card-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.1875rem;
      font-weight: 500;
      color: var(--color-text);
      margin-bottom: 0.625rem;
    }

    .card-description {
      font-size: 0.9375rem;
      color: var(--color-text-muted);
      line-height: 1.6;
      flex: 1;
      margin-bottom: 1.25rem;
    }

    .card-action {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text-muted);
      transition: color 0.3s ease;

      .arrow {
        font-size: 16px;
        transition: transform 0.3s ease;
      }
    }
  `]
})
export class ToolsGridComponent {
  protected readonly tools = signal<readonly ToolCard[]>([
    {
      title: 'Character Sheets',
      description: 'View and manage your party\'s character sheets. Track stats, abilities, skills, and inventory.',
      icon: 'person',
      path: '/characters',
      accentColor: 'var(--color-primary)'
    },
    {
      title: 'The Lost Worlds Library',
      description: 'Browse and search all abilities across schools of magic. Filter by college, stats, and type.',
      icon: 'auto_fix_high',
      path: '/abilities',
      accentColor: '#9370db'
    },
    {
      title: 'Combat Tracker',
      description: 'Run smooth encounters with initiative tracking, HP management, and condition tracking.',
      icon: 'swords',
      path: '/combat',
      accentColor: 'var(--color-error)'
    },
    {
      title: 'Session Notes',
      description: 'Chronicle your adventures with session summaries, important events, and progress tracking.',
      icon: 'menu_book',
      path: '/sessions',
      accentColor: 'var(--color-accent)'
    }
  ]);
}