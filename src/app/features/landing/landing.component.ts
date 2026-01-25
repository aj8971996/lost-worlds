import { Component } from '@angular/core';
import { HeroComponent } from './components/hero/hero.component';
import { ToolsGridComponent } from './components/tools-grid/tools-grid.component';
import { SynopsisComponent } from './components/synopsis/synopsis.component';
import { CreationStepsComponent } from './components/creation-steps/creation-steps.component';
import { CampaignCarouselComponent } from './components/campaign-carousel/campaign-carousel.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    HeroComponent,
    ToolsGridComponent,
    SynopsisComponent,
    CreationStepsComponent,
    CampaignCarouselComponent,
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent {}
