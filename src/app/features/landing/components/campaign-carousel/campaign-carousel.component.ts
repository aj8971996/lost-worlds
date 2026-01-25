import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';

interface Campaign {
  readonly id: string;
  readonly label: string;
  readonly title: string;
  readonly subtitle: string;
  readonly status: 'available' | 'coming-soon';
  readonly bgGradient: string;
  readonly accentColor: string;
  readonly externalUrl: string | null;
}

@Component({
  selector: 'app-campaign-carousel',
  standalone: true,
  template: `
    <section class="campaigns-section">
      <!-- Dynamic background based on active campaign -->
      <div 
        class="campaigns-bg"
        [style.background]="activeCampaign().bgGradient"
      ></div>
      <div class="campaigns-grain"></div>
      <div class="campaigns-vignette"></div>

      <div class="campaigns-content">
        <header class="section-header">
          <span class="section-label">Campaign Books</span>
          <h2 class="section-title">Explore the Lost Worlds</h2>
          <p class="section-description">
            Journey through different eras of Earth's hidden magical history
          </p>
        </header>

        <!-- Campaign Cards -->
        <div class="campaigns-carousel">
          @for (campaign of campaigns(); track campaign.id; let i = $index) {
            <button
              type="button"
              class="campaign-card"
              [class.active]="i === activeIndex()"
              [class.coming-soon]="campaign.status === 'coming-soon'"
              [style.--accent]="campaign.accentColor"
              (click)="selectCampaign(i)"
            >
              <div class="card-inner">
                <p class="campaign-label">{{ campaign.label }}</p>
                
                <h3 class="campaign-title">{{ campaign.title }}</h3>
                
                <p class="campaign-subtitle">{{ campaign.subtitle }}</p>
                
                <!-- Diamond decoration -->
                <div class="campaign-divider">
                  <span class="divider-line"></span>
                  <span class="divider-diamond">◆</span>
                  <span class="divider-line"></span>
                </div>

                @if (campaign.status === 'available' && i === activeIndex()) {
                  <a 
                    [href]="campaign.externalUrl" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="campaign-cta"
                    (click)="$event.stopPropagation()"
                  >
                    Explore Campaign
                    <span class="material-symbols-outlined">arrow_outward</span>
                  </a>
                }
              </div>
            </button>
          }
        </div>

        <!-- Carousel Indicators -->
        <div class="carousel-indicators">
          @for (campaign of campaigns(); track campaign.id; let i = $index) {
            <button
              type="button"
              class="indicator"
              [class.active]="i === activeIndex()"
              [style.--accent]="activeCampaign().accentColor"
              (click)="selectCampaign(i)"
              [attr.aria-label]="'View ' + campaign.title"
            ></button>
          }
        </div>

        <!-- Requirements Footer -->
        <div class="requirements">
          <span class="requirements-label">Requirements:</span>
          <span class="requirement-item">
            <span class="material-symbols-outlined">menu_book</span>
            Rule Book
          </span>
          <span class="requirement-item">
            <span class="material-symbols-outlined">casino</span>
            Polyhedral Dice
          </span>
          <span class="requirement-item">
            <span class="material-symbols-outlined">group</span>
            2-4 Players
          </span>
          <span class="requirement-item">
            <span class="material-symbols-outlined">psychology</span>
            Imagination
          </span>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .campaigns-section {
      position: relative;
      padding: 5rem 1rem;
      overflow: hidden;

      @media (min-width: 768px) {
        padding: 6rem 1.5rem;
      }
    }

    // Dynamic gradient background
    .campaigns-bg {
      position: absolute;
      inset: 0;
      transition: background 0.8s ease;
    }

    // Film grain texture
    .campaigns-grain {
      position: absolute;
      inset: 0;
      opacity: 0.04;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
      pointer-events: none;
    }

    // Vignette overlay
    .campaigns-vignette {
      position: absolute;
      inset: 0;
      background: radial-gradient(
        ellipse at center,
        transparent 30%,
        rgba(0, 0, 0, 0.6) 100%
      );
      pointer-events: none;
    }

    // Content container
    .campaigns-content {
      position: relative;
      z-index: 10;
      max-width: 1100px;
      margin: 0 auto;
    }

    // Section Header
    .section-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .section-label {
      display: inline-block;
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 0.8125rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.25em;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 0.75rem;
    }

    .section-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: clamp(1.75rem, 4vw, 2.5rem);
      font-weight: 400;
      color: #ffffff;
      margin-bottom: 1rem;
      text-shadow: 0 2px 15px rgba(0, 0, 0, 0.3);
    }

    .section-description {
      font-size: 1.0625rem;
      color: rgba(255, 255, 255, 0.75);
    }

    // Campaign Carousel
    .campaigns-carousel {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      flex-wrap: wrap;
      margin-bottom: 2rem;

      @media (min-width: 768px) {
        gap: 2rem;
      }
    }

    // Campaign Card
    .campaign-card {
      --accent: var(--color-primary);
      
      width: 280px;
      height: 380px;
      padding: 0;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      background: transparent;
      transition: all 0.4s ease;
      
      &:hover:not(.active) {
        transform: translateY(-6px);
      }

      &.active {
        transform: scale(1.05);
        
        .card-inner {
          border-color: var(--accent);
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.5),
            0 0 0 1px var(--accent),
            0 0 30px -5px var(--accent);
        }
      }

      &.coming-soon {
        .campaign-title,
        .campaign-subtitle {
          opacity: 0.5;
        }
      }

      @media (min-width: 768px) {
        width: 300px;
        height: 400px;
      }
    }

    .card-inner {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 2rem 1.5rem;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      transition: all 0.4s ease;
    }

    .campaign-label {
      font-family: 'Inter', sans-serif;
      font-size: 0.625rem;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 1.5rem;
    }

    .campaign-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.625rem;
      font-weight: 400;
      color: #f5f2ed;
      margin-bottom: 0.625rem;
      line-height: 1.3;

      @media (min-width: 768px) {
        font-size: 1.875rem;
      }
    }

    .campaign-subtitle {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 1rem;
      font-style: italic;
      color: rgba(245, 242, 237, 0.6);
    }

    .campaign-divider {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1.5rem;
    }

    .divider-line {
      width: 24px;
      height: 1px;
      background: var(--accent);
      opacity: 0.5;
    }

    .divider-diamond {
      color: var(--accent);
      font-size: 0.625rem;
    }

    .campaign-cta {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      margin-top: 1.5rem;
      padding: 0.625rem 1.25rem;
      background-color: var(--accent);
      color: #ffffff;
      font-family: 'Inter', sans-serif;
      font-size: 0.8125rem;
      font-weight: 600;
      letter-spacing: 0.03em;
      text-decoration: none;
      border-radius: 2px;
      transition: all 0.25s ease;

      .material-symbols-outlined {
        font-size: 16px;
      }

      &:hover {
        filter: brightness(1.1);
        transform: translateY(-1px);
      }
    }

    // Carousel Indicators
    .carousel-indicators {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      margin-bottom: 3rem;
    }

    .indicator {
      width: 10px;
      height: 10px;
      padding: 0;
      border: none;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.3);
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background-color: rgba(255, 255, 255, 0.5);
      }

      &.active {
        width: 28px;
        border-radius: 5px;
        background-color: var(--accent);
      }
    }

    // Requirements
    .requirements {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 0.75rem 1.5rem;
      padding-top: 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
    }

    .requirements-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: rgba(255, 255, 255, 0.5);
      width: 100%;
      text-align: center;

      @media (min-width: 640px) {
        width: auto;
        text-align: left;
      }
    }

    .requirement-item {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.75);

      .material-symbols-outlined {
        font-size: 18px;
        color: var(--color-accent);
      }
    }
  `]
})
export class CampaignCarouselComponent implements OnInit, OnDestroy {
  protected readonly campaigns = signal<readonly Campaign[]>([
    {
      id: 'flamingo-shadow',
      label: 'A Lost Worlds Campaign',
      title: "The Flamingo's Shadow",
      subtitle: 'Las Vegas, 1946–1947',
      status: 'available',
      bgGradient: 'linear-gradient(145deg, #1a0a0a 0%, #2d1515 30%, #1a0a0a 100%)',
      accentColor: '#c9364a',
      externalUrl: 'https://flamingo.lostworldsrpg.com'
    },
    {
      id: 'campaign-two',
      label: 'A Lost Worlds Campaign',
      title: 'Coming Soon',
      subtitle: 'Campaign Two',
      status: 'coming-soon',
      bgGradient: 'linear-gradient(145deg, #021f3f 0%, #023167 50%, #021f3f 100%)',
      accentColor: '#4db6c9',
      externalUrl: null
    },
    {
      id: 'campaign-three',
      label: 'A Lost Worlds Campaign',
      title: 'Coming Soon',
      subtitle: 'Campaign Three',
      status: 'coming-soon',
      bgGradient: 'linear-gradient(145deg, #1a1a0a 0%, #2d2d15 50%, #1a1a0a 100%)',
      accentColor: '#d4a955',
      externalUrl: null
    }
  ]);

  protected readonly activeIndex = signal(0);
  
  protected readonly activeCampaign = computed(() => 
    this.campaigns()[this.activeIndex()]
  );

  private autoPlayInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.startAutoPlay();
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  protected selectCampaign(index: number): void {
    this.activeIndex.set(index);
    // Reset autoplay timer when user interacts
    this.stopAutoPlay();
    this.startAutoPlay();
  }

  private startAutoPlay(): void {
    this.autoPlayInterval = setInterval(() => {
      const nextIndex = (this.activeIndex() + 1) % this.campaigns().length;
      this.activeIndex.set(nextIndex);
    }, 6000);
  }

  private stopAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }
}