import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CharacterService } from '@core/services/character.service';
import { ResolvedCharacter } from '@core/models';

@Component({
  selector: 'app-character-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="character-detail-page">
      <!-- Back Navigation -->
      <nav class="back-nav">
        <a routerLink="/characters" class="back-link">
          <span class="material-symbols-outlined">arrow_back</span>
          <span>Back to Repository</span>
        </a>
      </nav>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-state">
          <div class="loading-spinner">
            <span class="material-symbols-outlined">progress_activity</span>
          </div>
          <p>Loading character sheet...</p>
        </div>
      }

      <!-- Error State -->
      @else if (error()) {
        <div class="error-state">
          <span class="material-symbols-outlined">error</span>
          <h2>Character Not Found</h2>
          <p>{{ error() }}</p>
          <a routerLink="/characters" class="btn btn-primary">
            Return to Repository
          </a>
        </div>
      }

      <!-- Character Sheet (Placeholder) -->
      @else if (character()) {
        <div class="character-sheet">
          <header class="sheet-header">
            <h1 class="character-name">{{ character()!.name }}</h1>
            <div class="character-meta">
              <span class="meta-item">
                <span class="label">Level</span>
                <span class="value">{{ character()!.level }}</span>
              </span>
              <span class="meta-item">
                <span class="label">Species</span>
                <span class="value">{{ character()!.species.name }}</span>
              </span>
              <span class="meta-item">
                <span class="label">XP</span>
                <span class="value">{{ character()!.xp }}</span>
              </span>
            </div>
          </header>

          <div class="sheet-placeholder">
            <span class="material-symbols-outlined">construction</span>
            <h2>Character Sheet Coming Soon</h2>
            <p>
              The full character sheet layout is under construction. 
              For now, here's a preview of {{ character()!.name }}'s data.
            </p>
          </div>

          <!-- Quick Stats Preview -->
          <div class="stats-preview">
            <div class="stat-group">
              <h3>Physical Stats</h3>
              <div class="stat-row">
                <span class="stat-name">Might</span>
                <span class="stat-value">{{ character()!.stats.physical.might.value }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-name">Grit</span>
                <span class="stat-value">{{ character()!.stats.physical.grit.value }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-name">Speed</span>
                <span class="stat-value">{{ character()!.stats.physical.speed.value }}</span>
              </div>
            </div>

            <div class="stat-group">
              <h3>Resources</h3>
              <div class="stat-row">
                <span class="stat-name">Health</span>
                <span class="stat-value">{{ character()!.resources.health.current }} / {{ character()!.resources.health.max }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-name">Stamina</span>
                <span class="stat-value">{{ character()!.resources.stamina.current }} / {{ character()!.resources.stamina.max }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-name">Sanity</span>
                <span class="stat-value">{{ character()!.resources.sanity.current }} / {{ character()!.resources.sanity.max }}</span>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @use '../../../../styles/abstracts/variables' as *;
    @use '../../../../styles/abstracts/mixins' as *;

    .character-detail-page {
      min-height: 100vh;
      padding: $spacing-4;
      background-color: var(--color-bg);

      @include respond-to('md') {
        padding: $spacing-6;
      }
    }

    // Back Navigation
    .back-nav {
      max-width: $breakpoint-lg;
      margin: 0 auto $spacing-6;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: $spacing-2;
      padding: $spacing-2 $spacing-3;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
      color: var(--color-text-muted);
      text-decoration: none;
      background: var(--color-surface);
      border: $border-width-thin solid var(--color-border);
      border-radius: $border-radius-base;
      @include transition(color, border-color, background-color);

      &:hover {
        color: var(--color-text);
        border-color: var(--color-border-strong);
        background: var(--color-surface-alt);
      }

      .material-symbols-outlined {
        font-size: 18px;
      }
    }

    // Loading & Error States
    .loading-state,
    .error-state {
      @include flex-column-center;
      padding: $spacing-16;
      text-align: center;

      .material-symbols-outlined {
        font-size: 48px;
        color: var(--color-primary);
        margin-bottom: $spacing-4;
      }

      h2 {
        margin: 0 0 $spacing-2;
        font-size: $font-size-xl;
        color: var(--color-text);
      }

      p {
        margin: 0 0 $spacing-6;
        color: var(--color-text-muted);
      }
    }

    .loading-spinner .material-symbols-outlined {
      animation: spin 1.5s linear infinite;
    }

    .error-state .material-symbols-outlined {
      color: var(--color-error);
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    // Character Sheet
    .character-sheet {
      max-width: $breakpoint-lg;
      margin: 0 auto;
      background: var(--color-surface);
      border: $border-width-thin solid var(--color-border);
      border-radius: $border-radius-xl;
      overflow: hidden;
    }

    .sheet-header {
      padding: $spacing-8;
      background: var(--gradient-hero);
      text-align: center;
    }

    .character-name {
      margin: 0 0 $spacing-4;
      font-family: $font-family-display;
      font-size: $font-size-4xl;
      font-weight: $font-weight-bold;
      color: #fff;
    }

    .character-meta {
      display: flex;
      justify-content: center;
      gap: $spacing-8;
      flex-wrap: wrap;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      align-items: center;

      .label {
        font-size: $font-size-xs;
        font-weight: $font-weight-medium;
        color: rgba(255, 255, 255, 0.7);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .value {
        font-size: $font-size-xl;
        font-weight: $font-weight-bold;
        color: var(--color-accent);
      }
    }

    // Placeholder
    .sheet-placeholder {
      @include flex-column-center;
      padding: $spacing-12;
      text-align: center;
      border-bottom: $border-width-thin solid var(--color-border);

      .material-symbols-outlined {
        font-size: 48px;
        color: var(--color-accent);
        margin-bottom: $spacing-4;
      }

      h2 {
        margin: 0 0 $spacing-2;
        font-size: $font-size-xl;
        font-weight: $font-weight-semibold;
        color: var(--color-text);
      }

      p {
        margin: 0;
        max-width: 400px;
        color: var(--color-text-muted);
      }
    }

    // Stats Preview
    .stats-preview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: $spacing-6;
      padding: $spacing-6;
    }

    .stat-group {
      h3 {
        margin: 0 0 $spacing-3;
        font-size: $font-size-sm;
        font-weight: $font-weight-semibold;
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      padding: $spacing-2 0;
      border-bottom: $border-width-thin solid var(--color-border);

      &:last-child {
        border-bottom: none;
      }
    }

    .stat-name {
      font-size: $font-size-sm;
      color: var(--color-text);
    }

    .stat-value {
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;
      color: var(--color-primary);
    }
  `]
})
export class CharacterDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly characterService = inject(CharacterService);

  character = signal<ResolvedCharacter | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCharacter(id);
    } else {
      this.error.set('No character ID provided');
      this.isLoading.set(false);
    }
  }

  private loadCharacter(id: string): void {
    this.characterService.getResolvedCharacter(id).subscribe({
      next: (character) => {
        if (character) {
          this.character.set(character);
        } else {
          this.error.set(`Character "${id}" could not be found.`);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load character:', err);
        this.error.set('Failed to load character data.');
        this.isLoading.set(false);
      }
    });
  }
}
