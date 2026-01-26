import { 
  Component, 
  AfterViewInit, 
  OnDestroy, 
  ElementRef, 
  ViewChild 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from './components/hero/hero.component';
import { ToolsGridComponent } from './components/tools-grid/tools-grid.component';
import { SynopsisComponent } from './components/synopsis/synopsis.component';
import { CreationStepsComponent } from './components/creation-steps/creation-steps.component';
import { CampaignCarouselComponent } from './components/campaign-carousel/campaign-carousel.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    HeroComponent,
    ToolsGridComponent,
    SynopsisComponent,
    CreationStepsComponent,
    CampaignCarouselComponent,
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  @ViewChild('landingContainer') landingContainer!: ElementRef<HTMLElement>;

  private visibilityObserver: IntersectionObserver | null = null;

  ngAfterViewInit(): void {
    this.initVisibilityObserver();
  }

  ngOnDestroy(): void {
    this.visibilityObserver?.disconnect();
  }

  private initVisibilityObserver(): void {
    // Observe sections for fade-in animations
    this.visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { 
        threshold: 0.1,
        rootMargin: '0px 0px -10% 0px'
      }
    );

    // Observe all sections
    setTimeout(() => {
      const sections = this.landingContainer?.nativeElement?.querySelectorAll('.landing-section');
      sections?.forEach(section => {
        this.visibilityObserver!.observe(section);
      });
    }, 50);
  }
}
