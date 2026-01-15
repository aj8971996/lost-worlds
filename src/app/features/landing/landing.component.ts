import { Component } from '@angular/core';
import { HeroComponent } from './components/hero/hero.component';
import { FeatureCardsComponent } from './components/feature-cards/feature-cards.component';
import { SynopsisComponent } from './components/synopsis/synopsis.component';
import { CreationStepsComponent } from './components/creation-steps/creation-steps.component';
import { CtaComponent } from './components/cta/cta.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    HeroComponent,
    FeatureCardsComponent,
    SynopsisComponent,
    CreationStepsComponent,
    CtaComponent
  ],
  template: `
    <div class="landing-page">
      <app-hero />
      <app-feature-cards />
      <app-synopsis />
      <app-creation-steps />
      <app-cta />
    </div>
  `,
  styles: [`
    .landing-page {
      display: flex;
      flex-direction: column;
    }
  `]
})
export class LandingComponent {}
