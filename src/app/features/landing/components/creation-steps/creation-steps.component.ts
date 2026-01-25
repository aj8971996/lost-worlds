import { Component, signal } from '@angular/core';

interface CreationStep {
  readonly number: number;
  readonly title: string;
  readonly description: string;
  readonly details: readonly string[];
}

interface QuickReference {
  readonly label: string;
  readonly value: string;
}

@Component({
  selector: 'app-creation-steps',
  standalone: true,
  template: `
    <section class="creation-section">
      <div class="container">
        <header class="section-header">
          <span class="section-label">Getting Started</span>
          <h2 class="section-title">Character Creation</h2>
          <p class="section-description">
            Create your adventurer in six straightforward steps
          </p>
        </header>

        <div class="timeline">
          @for (step of creationSteps(); track step.number) {
            <div class="timeline-item">
              <div class="timeline-marker">
                <span class="step-number">{{ step.number }}</span>
              </div>
              
              <div class="timeline-content">
                <h3 class="step-title">{{ step.title }}</h3>
                <p class="step-description">{{ step.description }}</p>
                
                <ul class="step-details">
                  @for (detail of step.details; track detail) {
                    <li>{{ detail }}</li>
                  }
                </ul>
              </div>
            </div>
          }
        </div>

        <!-- Quick Reference -->
        <div class="quick-reference">
          <h3 class="reference-title">
            <span class="material-symbols-outlined">lightbulb</span>
            Quick Reference
          </h3>
          <div class="reference-grid">
            @for (ref of quickReferences(); track ref.label) {
              <div class="reference-item">
                <span class="reference-label">{{ ref.label }}</span>
                <span class="reference-value">{{ ref.value }}</span>
              </div>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .creation-section {
      padding: 5rem 1rem;
      background-color: var(--color-bg);

      @media (min-width: 768px) {
        padding: 6rem 1.5rem;
      }
    }

    .container {
      max-width: 900px;
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
      font-size: clamp(1.75rem, 4vw, 2.25rem);
      font-weight: 500;
      color: var(--color-text);
      margin-bottom: 1rem;
    }

    .section-description {
      font-size: 1.0625rem;
      color: var(--color-text-muted);
    }

    // Timeline
    .timeline {
      position: relative;
      padding-left: 2rem;

      @media (min-width: 768px) {
        padding-left: 3rem;
      }

      // Vertical line
      &::before {
        content: '';
        position: absolute;
        left: 15px;
        top: 0;
        bottom: 0;
        width: 2px;
        background: linear-gradient(
          180deg,
          var(--color-primary) 0%,
          var(--color-primary) 85%,
          transparent 100%
        );

        @media (min-width: 768px) {
          left: 23px;
        }
      }
    }

    .timeline-item {
      position: relative;
      padding-bottom: 2.5rem;

      &:last-child {
        padding-bottom: 0;
      }
    }

    .timeline-marker {
      position: absolute;
      left: -2rem;
      top: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--color-primary);
      border-radius: 50%;
      box-shadow: 0 0 0 4px var(--color-bg);

      @media (min-width: 768px) {
        left: -3rem;
        width: 48px;
        height: 48px;
      }
    }

    .step-number {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 0.875rem;
      font-weight: 600;
      color: white;

      @media (min-width: 768px) {
        font-size: 1.125rem;
      }
    }

    .timeline-content {
      padding: 0.25rem 0 0 1rem;

      @media (min-width: 768px) {
        padding: 0.5rem 0 0 1.5rem;
      }
    }

    .step-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.125rem;
      font-weight: 500;
      color: var(--color-text);
      margin-bottom: 0.5rem;

      @media (min-width: 768px) {
        font-size: 1.25rem;
      }
    }

    .step-description {
      font-size: 0.9375rem;
      color: var(--color-text-muted);
      margin-bottom: 0.75rem;
      line-height: 1.6;
    }

    .step-details {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.75rem;
        background-color: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: 9999px;
        font-size: 0.8125rem;
        color: var(--color-text-muted);

        &::before {
          content: '';
          width: 4px;
          height: 4px;
          background-color: var(--color-primary);
          border-radius: 50%;
          margin-right: 0.5rem;
        }
      }
    }

    // Quick Reference
    .quick-reference {
      margin-top: 3rem;
      padding: 1.5rem;
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 0.75rem;

      @media (min-width: 768px) {
        padding: 2rem;
      }
    }

    .reference-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1rem;
      font-weight: 500;
      color: var(--color-text);
      margin-bottom: 1.25rem;

      .material-symbols-outlined {
        font-size: 20px;
        color: var(--color-accent);
      }
    }

    .reference-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;

      @media (min-width: 480px) {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .reference-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .reference-label {
      font-size: 0.8125rem;
      color: var(--color-text-subtle);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .reference-value {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--color-text);
    }
  `]
})
export class CreationStepsComponent {
  protected readonly creationSteps = signal<readonly CreationStep[]>([
    {
      number: 1,
      title: 'Character Origins',
      description: 'Establish who your character is and their place in the world.',
      details: ['Choose Species', 'Name & Age', 'Background', 'Mixed Heritage (optional)']
    },
    {
      number: 2,
      title: 'Assign Stats & Levels',
      description: 'Roll for resources and distribute your starting stat points.',
      details: ['Roll 3D100 for HP/SY/ST', 'Distribute 30 stat points', 'Choose 2 Focus Levels']
    },
    {
      number: 3,
      title: 'Choose Abilities',
      description: 'Select your magical abilities from your chosen Focuses.',
      details: ['Ready System (3 + Level)', 'Access all Focus abilities', 'Swap daily']
    },
    {
      number: 4,
      title: 'Choose Skills',
      description: 'Allocate skill levels to represent your non-magical expertise.',
      details: ['2 starting skill levels', '17 skills available', 'Extra D20 per level']
    },
    {
      number: 5,
      title: 'Starting Inventory',
      description: 'Equip your character using the Cost Level budget system.',
      details: ['Beginner\'s Sack (free)', 'Budget by campaign type', 'Era-appropriate gear']
    },
    {
      number: 6,
      title: 'Ready to Play',
      description: 'Your character is complete and ready to begin their adventure!',
      details: ['Review character sheet', 'Join your party', 'Begin the journey']
    }
  ]);

  protected readonly quickReferences = signal<readonly QuickReference[]>([
    { label: 'Starting Resources', value: '3D100 for HP, SY, ST' },
    { label: 'Starting Stat Points', value: '30 points to distribute' },
    { label: 'Starting Focus Levels', value: '2 levels to assign' },
    { label: 'Starting Skill Levels', value: '2 levels to assign' }
  ]);
}