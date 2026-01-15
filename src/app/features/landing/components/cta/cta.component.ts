import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cta',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="cta-section">
      <div class="cta-bg"></div>
      <div class="cta-overlay"></div>
      
      <div class="cta-content">
        <h2 class="cta-title">Ready to Explore the Lost Worlds?</h2>
        <p class="cta-description">
          Begin your journey through hidden magical history. 
          Your story awaits in the theatre of imagination.
        </p>
        
        <div class="cta-actions">
          <a routerLink="/characters" class="btn btn-primary btn-lg">
            <span class="material-symbols-outlined">group_add</span>
            <span>View Characters</span>
          </a>
        </div>

        <div class="cta-requirements">
          <span class="requirements-label">Requirements:</span>
          <span class="requirements-item">
            <span class="material-symbols-outlined">menu_book</span>
            Rule Book
          </span>
          <span class="requirements-item">
            <span class="material-symbols-outlined">casino</span>
            Polyhedral Dice
          </span>
          <span class="requirements-item">
            <span class="material-symbols-outlined">group</span>
            2-4 Players
          </span>
          <span class="requirements-item">
            <span class="material-symbols-outlined">psychology</span>
            Imagination
          </span>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .cta-section {
      position: relative;
      padding: 5rem 1rem;
      overflow: hidden;

      @media (min-width: 768px) {
        padding: 6rem 1.5rem;
      }
    }

    // Animated gradient background
    .cta-bg {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        135deg,
        var(--palette-1) 0%,
        var(--palette-2) 50%,
        var(--palette-1) 100%
      );
      background-size: 400% 400%;
      animation: gradientShift 15s ease infinite;
    }

    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .cta-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        180deg,
        rgba(0, 0, 0, 0.1) 0%,
        rgba(0, 0, 0, 0.3) 100%
      );
    }

    .cta-content {
      position: relative;
      z-index: 1;
      max-width: 700px;
      margin: 0 auto;
      text-align: center;
    }

    .cta-title {
      font-size: clamp(1.5rem, 4vw, 2.25rem);
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 1rem;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }

    .cta-description {
      font-size: 1.125rem;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.7;
      margin-bottom: 2rem;
    }

    .cta-actions {
      margin-bottom: 2.5rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem 2rem;
      font-size: 1.0625rem;
      font-weight: 600;
      text-decoration: none;
      border-radius: 0.5rem;
      transition: all 0.2s ease;
      cursor: pointer;

      .material-symbols-outlined {
        font-size: 22px;
      }
    }

    .btn-primary {
      background-color: var(--palette-3);
      color: #1a1a1a;
      border: 2px solid var(--palette-3);

      &:hover {
        background-color: var(--palette-4);
        border-color: var(--palette-4);
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
      }
    }

    .btn-lg {
      padding: 1rem 2.5rem;
    }

    // Requirements
    .cta-requirements {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 0.75rem 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }

    .requirements-label {
      font-size: 0.8125rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: rgba(255, 255, 255, 0.6);
      width: 100%;

      @media (min-width: 640px) {
        width: auto;
      }
    }

    .requirements-item {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.8);

      .material-symbols-outlined {
        font-size: 18px;
        color: var(--palette-3);
      }
    }
  `]
})
export class CtaComponent {}
