import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterService } from '@core/services/character.service';
import { CharacterSummary } from '@core/models';
import { CharacterCardComponent } from './components/character-card/character-card.component';

@Component({
  selector: 'app-characters',
  standalone: true,
  imports: [CommonModule, CharacterCardComponent],
  template: `
    <div class="characters-page">
      <!-- Hero Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="header-icon" aria-hidden="true">
            <span class="material-symbols-outlined">auto_stories</span>
          </div>
          <h1 class="page-title">Character Repository</h1>
          <p class="page-subtitle">
            The heroes and wanderers traversing the Lost Worlds
          </p>
        </div>
        <div class="header-decoration" aria-hidden="true"></div>
      </header>

      <!-- Main Content -->
      <main class="page-content">
        <!-- Loading State -->
        @if (isLoading()) {
          <div class="loading-state">
            <div class="loading-spinner" aria-hidden="true">
              <span class="material-symbols-outlined">progress_activity</span>
            </div>
            <p>Summoning characters from the void...</p>
          </div>
        }

        <!-- Empty State -->
        @else if (characters().length === 0) {
          <div class="empty-state">
            <div class="empty-icon" aria-hidden="true">
              <span class="material-symbols-outlined">person_off</span>
            </div>
            <h2>No Characters Found</h2>
            <p>The repository is empty. Characters will appear here once added to the data files.</p>
          </div>
        }

        <!-- Character Grid -->
        @else {
          <div class="characters-grid stagger-children">
            @for (character of characters(); track character.id) {
              <app-character-card [character]="character" />
            }
          </div>
        }
      </main>

      <!-- Stats Footer -->
      @if (characters().length > 0) {
        <footer class="page-footer">
          <div class="stat-item">
            <span class="stat-value">{{ characters().length }}</span>
            <span class="stat-label">Total Characters</span>
          </div>
          <div class="divider" aria-hidden="true"></div>
          <div class="stat-item">
            <span class="stat-value">{{ uniqueSpeciesCount() }}</span>
            <span class="stat-label">Species</span>
          </div>
          <div class="divider" aria-hidden="true"></div>
          <div class="stat-item">
            <span class="stat-value">{{ averageLevel() }}</span>
            <span class="stat-label">Avg Level</span>
          </div>
        </footer>
      }
    </div>
  `,
  styles: [`
    @use '../../styles/abstracts/variables' as *;
    @use '../../styles/abstracts/mixins' as *;

    .characters-page {
      min-height: 100vh;
      background-color: var(--color-bg);
    }

    // =========================================================================
    // HEADER
    // =========================================================================

    .page-header {
      position: relative;
      padding: $spacing-12 $spacing-4 $spacing-10;
      background: var(--gradient-hero);
      overflow: hidden;

      @include respond-to('md') {
        padding: $spacing-16 $spacing-6 $spacing-12;
      }
    }

    .header-content {
      position: relative;
      z-index: 1;
      max-width: $breakpoint-lg;
      margin: 0 auto;
      text-align: center;
    }

    .header-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      margin-bottom: $spacing-4;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: $border-radius-xl;
      backdrop-filter: blur(8px);

      .material-symbols-outlined {
        font-size: 32px;
        color: var(--color-accent);
      }
    }

    .page-title {
      margin: 0 0 $spacing-3;
      font-family: $font-family-display;
      font-size: $font-size-4xl;
      font-weight: $font-weight-bold;
      color: #fff;
      letter-spacing: -0.02em;

      @include respond-to('md') {
        font-size: $font-size-5xl;
      }
    }

    .page-subtitle {
      margin: 0;
      font-size: $font-size-lg;
      color: rgba(255, 255, 255, 0.8);

      @include respond-to('md') {
        font-size: $font-size-xl;
      }
    }

    .header-decoration {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 120px;
      background: linear-gradient(to top, var(--color-bg), transparent);
      pointer-events: none;
    }

    // =========================================================================
    // CONTENT
    // =========================================================================

    .page-content {
      @include container;
      padding-top: $spacing-8;
      padding-bottom: $spacing-12;

      @include respond-to('md') {
        padding-top: $spacing-10;
        padding-bottom: $spacing-16;
      }
    }

    // =========================================================================
    // CHARACTER GRID
    // =========================================================================

    .characters-grid {
      display: grid;
      grid-template-columns: repeat(1, 1fr);
      gap: $spacing-6;

      @include respond-to('sm') {
        grid-template-columns: repeat(2, 1fr);
      }

      @include respond-to('lg') {
        grid-template-columns: repeat(3, 1fr);
      }

      @include respond-to('xl') {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    // =========================================================================
    // LOADING STATE
    // =========================================================================

    .loading-state {
      @include flex-column-center;
      padding: $spacing-16 $spacing-4;
      color: var(--color-text-muted);

      p {
        margin: $spacing-4 0 0;
        font-size: $font-size-lg;
      }
    }

    .loading-spinner {
      @include flex-center;
      width: 64px;
      height: 64px;

      .material-symbols-outlined {
        font-size: 48px;
        color: var(--color-primary);
        animation: spin 1.5s linear infinite;
      }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    // =========================================================================
    // EMPTY STATE
    // =========================================================================

    .empty-state {
      @include flex-column-center;
      padding: $spacing-16 $spacing-4;
      text-align: center;

      h2 {
        margin: $spacing-4 0 $spacing-2;
        font-size: $font-size-2xl;
        font-weight: $font-weight-semibold;
        color: var(--color-text);
      }

      p {
        margin: 0;
        max-width: 400px;
        color: var(--color-text-muted);
      }
    }

    .empty-icon {
      @include flex-center;
      width: 80px;
      height: 80px;
      background: var(--color-surface-alt);
      border-radius: $border-radius-xl;

      .material-symbols-outlined {
        font-size: 40px;
        color: var(--color-text-subtle);
      }
    }

    // =========================================================================
    // FOOTER STATS
    // =========================================================================

    .page-footer {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: $spacing-6;
      padding: $spacing-6 $spacing-4;
      background: var(--color-surface);
      border-top: $border-width-thin solid var(--color-border);

      @include respond-to('md') {
        gap: $spacing-10;
        padding: $spacing-8 $spacing-6;
      }
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .stat-value {
      font-size: $font-size-2xl;
      font-weight: $font-weight-bold;
      color: var(--color-accent);
      line-height: 1;

      @include respond-to('md') {
        font-size: $font-size-3xl;
      }
    }

    .stat-label {
      margin-top: $spacing-1;
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;

      @include respond-to('md') {
        font-size: $font-size-sm;
      }
    }

    .divider {
      width: 1px;
      height: 40px;
      background: var(--color-border);
    }
  `]
})
export class CharactersComponent implements OnInit {
  private readonly characterService = inject(CharacterService);

  characters = signal<CharacterSummary[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    this.loadCharacters();
  }

  private loadCharacters(): void {
    this.characterService.getCharacterList().subscribe({
      next: (characters) => {
        this.characters.set(characters);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load characters:', error);
        this.isLoading.set(false);
      }
    });
  }

  uniqueSpeciesCount(): number {
    const species = new Set(this.characters().map(c => c.speciesId));
    return species.size;
  }

  averageLevel(): string {
    const chars = this.characters();
    if (chars.length === 0) return '0';
    const total = chars.reduce((sum, c) => sum + c.level, 0);
    return (total / chars.length).toFixed(1);
  }
}
