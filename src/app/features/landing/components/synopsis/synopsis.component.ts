import { Component, signal } from '@angular/core';

interface Highlight {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

@Component({
  selector: 'app-synopsis',
  standalone: true,
  template: `
    <section id="synopsis" class="synopsis-section">
      <div class="container">
        <div class="synopsis-grid">
          <!-- Main Content -->
          <div class="synopsis-content">
            <span class="section-label">The Game</span>
            <h2 class="section-title">What is Lost Worlds?</h2>
            
            <div class="synopsis-text">
              <p>
                Lost Worlds is a tabletop roleplaying game set across different eras of Earth's 
                hidden magical history. This is not a world where magic belongs only to wizards 
                in towers or creatures from distant realms. Magic is woven into the fabric of 
                existence itself.
              </p>
              
              <p>
                The Cosmic Realms and the Earthly Realms have never held a single, stable 
                relationship. Throughout history, the two have drifted together and pulled 
                apart like tides governed by no single moon. There have been ages of unity 
                when cosmic beings walked openly among mortals. There have been ages of 
                separation when humanity forgot what it had lost.
              </p>
              
              <p>
                Your party will step into one of these turbulent eras and uncover truths 
                that history tried to bury. Will you fight to reunite the severed realms 
                or ensure they remain apart? Will your names echo through history like the 
                beings who gave form to abstract ideas?
              </p>
            </div>
          </div>

          <!-- Highlights Sidebar -->
          <aside class="synopsis-highlights">
            @for (highlight of highlights(); track highlight.title) {
              <div class="highlight-card">
                <div class="highlight-icon">
                  <span class="material-symbols-outlined">{{ highlight.icon }}</span>
                </div>
                <div class="highlight-content">
                  <h4 class="highlight-title">{{ highlight.title }}</h4>
                  <p class="highlight-description">{{ highlight.description }}</p>
                </div>
              </div>
            }
          </aside>
        </div>

        <!-- Core Features Row -->
        <div class="features-row">
          <div class="feature-card">
            <h3 class="feature-title">
              <span class="material-symbols-outlined">groups</span>
              Nine Playable Species
            </h3>
            <p class="feature-text">
              Human, Elf, Orc, Dwarf, Gnome, Goblin, Fairy, Giant, and Cosmikin. 
              Each carries magic differently, with unique stat bonuses and rich lore.
            </p>
          </div>

          <div class="feature-card">
            <h3 class="feature-title">
              <span class="material-symbols-outlined">auto_fix_high</span>
              Three Colleges of Magic
            </h3>
            <p class="feature-text">
              <strong>Earthly</strong> (elements, body, speech), 
              <strong>Cosmic</strong> (stars, light, time, void), and 
              <strong>Dead</strong> (decay, damned, endings).
            </p>
          </div>

          <div class="feature-card">
            <h3 class="feature-title">
              <span class="material-symbols-outlined">casino</span>
              Dice Pool System
            </h3>
            <p class="feature-text">
              Roll multiple D20s as your stats grow. Higher stats mean more dice, 
              creating dynamic and rewarding progression.
            </p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .synopsis-section {
      padding: 5rem 1rem;
      background-color: var(--color-surface);

      @media (min-width: 768px) {
        padding: 6rem 1.5rem;
      }
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    // Grid Layout
    .synopsis-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 3rem;
      margin-bottom: 4rem;

      @media (min-width: 1024px) {
        grid-template-columns: 1fr 320px;
        gap: 4rem;
      }
    }

    // Content
    .synopsis-content {
      max-width: 720px;
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
      font-size: clamp(1.75rem, 4vw, 2.25rem);
      font-weight: 500;
      color: var(--color-text);
      margin-bottom: 1.5rem;
    }

    .synopsis-text {
      p {
        font-size: 1.0625rem;
        line-height: 1.85;
        color: var(--color-text-muted);
        margin-bottom: 1.25rem;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }

    // Highlights Sidebar
    .synopsis-highlights {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .highlight-card {
      display: flex;
      gap: 1rem;
      padding: 1.25rem;
      background-color: var(--color-bg);
      border-radius: 0.625rem;
      border: 1px solid var(--color-border);
    }

    .highlight-icon {
      flex-shrink: 0;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--color-primary-subtle);
      border-radius: 0.5rem;

      .material-symbols-outlined {
        font-size: 22px;
        color: var(--color-primary);
      }
    }

    .highlight-content {
      flex: 1;
    }

    .highlight-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--color-text);
      margin-bottom: 0.25rem;
    }

    .highlight-description {
      font-size: 0.875rem;
      color: var(--color-text-muted);
      line-height: 1.5;
    }

    // Features Row
    .features-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;

      @media (min-width: 640px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (min-width: 1024px) {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .feature-card {
      padding: 1.5rem;
      background-color: var(--color-bg);
      border-radius: 0.625rem;
      border: 1px solid var(--color-border);
    }

    .feature-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1rem;
      font-weight: 500;
      color: var(--color-text);
      margin-bottom: 0.75rem;

      .material-symbols-outlined {
        font-size: 20px;
        color: var(--color-primary);
      }
    }

    .feature-text {
      font-size: 0.9375rem;
      color: var(--color-text-muted);
      line-height: 1.65;

      strong {
        color: var(--color-text);
        font-weight: 600;
      }
    }
  `]
})
export class SynopsisComponent {
  protected readonly highlights = signal<readonly Highlight[]>([
    {
      icon: 'history',
      title: 'Any Era',
      description: 'Play across different periods of magical history'
    },
    {
      icon: 'balance',
      title: 'Moral Choices',
      description: 'Unity vs. separation, loyalty vs. survival'
    },
    {
      icon: 'diversity_3',
      title: 'Rich Lore',
      description: 'Cosmic beings and ancient civilizations'
    },
    {
      icon: 'emoji_events',
      title: 'Flexible Play',
      description: '2-4 players recommended, any group size works'
    }
  ]);
}