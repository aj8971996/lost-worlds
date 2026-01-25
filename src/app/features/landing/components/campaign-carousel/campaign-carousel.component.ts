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
  templateUrl: './campaign-carousel.component.html',
  styleUrl: './campaign-carousel.component.scss'
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
