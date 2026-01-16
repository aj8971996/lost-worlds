import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CharacterSummary } from '@core/models';

@Component({
  selector: 'app-character-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <article 
      class="character-card" 
      [routerLink]="['/characters', character.id]"
      [attr.aria-label]="'View ' + character.name + ' character sheet'">
      
      <!-- Decorative frame corners -->
      <span class="frame-corner frame-corner--tl" aria-hidden="true"></span>
      <span class="frame-corner frame-corner--tr" aria-hidden="true"></span>
      <span class="frame-corner frame-corner--bl" aria-hidden="true"></span>
      <span class="frame-corner frame-corner--br" aria-hidden="true"></span>
      
      <!-- Level badge -->
      <div class="level-badge" [attr.aria-label]="'Level ' + character.level">
        <span class="level-badge__value">{{ character.level }}</span>
        <span class="level-badge__label">LVL</span>
      </div>
      
      <!-- Portrait area -->
      <div class="portrait">
        <div class="portrait__frame">
          <span class="portrait__initial">{{ initial() }}</span>
        </div>
        <div class="portrait__glow" aria-hidden="true"></div>
      </div>
      
      <!-- Character info -->
      <div class="character-info">
        <h3 class="character-name">{{ character.name }}</h3>
        <p class="character-species">{{ formatSpecies(character.speciesId) }}</p>
        @if (character.player) {
          <p class="character-player">
            <span class="material-symbols-outlined icon-sm" aria-hidden="true">person</span>
            {{ character.player }}
          </p>
        }
      </div>
      
      <!-- View prompt -->
      <div class="view-prompt" aria-hidden="true">
        <span>View Character</span>
        <span class="material-symbols-outlined">arrow_forward</span>
      </div>
    </article>
  `,
  styles: [`
    @use 'styles/abstracts/variables' as *;
    @use 'styles/abstracts/mixins' as *;

    .character-card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: $spacing-6;
      background: linear-gradient(
        145deg,
        var(--color-surface) 0%,
        var(--color-surface-alt) 100%
      );
      border: $border-width-thin solid var(--color-border);
      border-radius: $border-radius-xl;
      cursor: pointer;
      overflow: hidden;
      @include transition(transform, box-shadow, border-color);

      // Subtle inner glow
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(
          ellipse at 50% 0%,
          var(--color-accent-subtle) 0%,
          transparent 60%
        );
        opacity: 0;
        @include transition(opacity);
        pointer-events: none;
      }

      &:hover {
        transform: translateY(-4px);
        border-color: var(--color-accent);
        box-shadow: 
          var(--shadow-card-hover),
          0 0 30px -10px var(--color-accent);

        &::before {
          opacity: 1;
        }

        .portrait__glow {
          opacity: 0.6;
          transform: scale(1.2);
        }

        .view-prompt {
          opacity: 1;
          transform: translateY(0);
        }

        .frame-corner {
          border-color: var(--color-accent);
        }
      }

      &:focus-visible {
        @include focus-ring;
      }
    }

    // Decorative corner frames
    .frame-corner {
      position: absolute;
      width: 16px;
      height: 16px;
      border-color: var(--color-border-strong);
      border-style: solid;
      @include transition(border-color);

      &--tl {
        top: 8px;
        left: 8px;
        border-width: 2px 0 0 2px;
        border-radius: 4px 0 0 0;
      }

      &--tr {
        top: 8px;
        right: 8px;
        border-width: 2px 2px 0 0;
        border-radius: 0 4px 0 0;
      }

      &--bl {
        bottom: 8px;
        left: 8px;
        border-width: 0 0 2px 2px;
        border-radius: 0 0 0 4px;
      }

      &--br {
        bottom: 8px;
        right: 8px;
        border-width: 0 2px 2px 0;
        border-radius: 0 0 4px 0;
      }
    }

    // Level badge
    .level-badge {
      position: absolute;
      top: $spacing-4;
      right: $spacing-4;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: $spacing-2 $spacing-3;
      background: var(--color-surface-elevated);
      border: $border-width-thin solid var(--color-border);
      border-radius: $border-radius-base;
      
      &__value {
        font-size: $font-size-xl;
        font-weight: $font-weight-bold;
        color: var(--color-accent);
        line-height: 1;
      }

      &__label {
        font-size: $font-size-xs;
        font-weight: $font-weight-medium;
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }

    // Portrait section
    .portrait {
      position: relative;
      margin-bottom: $spacing-4;

      &__frame {
        @include flex-center;
        width: 80px;
        height: 80px;
        background: linear-gradient(
          135deg,
          var(--color-primary-subtle) 0%,
          var(--color-surface-alt) 100%
        );
        border: $border-width-base solid var(--color-border-strong);
        border-radius: 50%;
        overflow: hidden;
      }

      &__initial {
        font-family: $font-family-display;
        font-size: $font-size-3xl;
        font-weight: $font-weight-bold;
        color: var(--color-primary);
        text-transform: uppercase;
      }

      &__glow {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 100px;
        height: 100px;
        transform: translate(-50%, -50%) scale(0.8);
        background: radial-gradient(
          circle,
          var(--color-primary) 0%,
          transparent 70%
        );
        border-radius: 50%;
        opacity: 0;
        filter: blur(20px);
        pointer-events: none;
        @include transition(opacity, transform);
      }
    }

    // Character info
    .character-info {
      text-align: center;
      margin-bottom: $spacing-4;
    }

    .character-name {
      margin: 0 0 $spacing-1;
      font-family: $font-family-display;
      font-size: $font-size-lg;
      font-weight: $font-weight-semibold;
      color: var(--color-text);
      line-height: $line-height-tight;
    }

    .character-species {
      margin: 0 0 $spacing-2;
      font-size: $font-size-sm;
      color: var(--color-accent);
      font-weight: $font-weight-medium;
    }

    .character-player {
      display: inline-flex;
      align-items: center;
      gap: $spacing-1;
      margin: 0;
      padding: $spacing-1 $spacing-3;
      font-size: $font-size-xs;
      color: var(--color-text-muted);
      background: var(--color-surface-alt);
      border-radius: $border-radius-full;

      .material-symbols-outlined {
        font-size: 14px;
      }
    }

    // View prompt (shows on hover)
    .view-prompt {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      margin-top: auto;
      padding-top: $spacing-3;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
      color: var(--color-primary);
      opacity: 0;
      transform: translateY(8px);
      @include transition(opacity, transform);

      .material-symbols-outlined {
        font-size: 18px;
      }
    }
  `]
})
export class CharacterCardComponent {
  @Input({ required: true }) character!: CharacterSummary;

  initial = computed(() => {
    return this.character?.name?.charAt(0) || '?';
  });

  formatSpecies(speciesId: string): string {
    // Convert kebab-case to Title Case
    return speciesId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
