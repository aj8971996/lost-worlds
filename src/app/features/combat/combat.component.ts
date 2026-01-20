import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiceCalculatorComponent } from './components/dice-calculator/dice-calculator.component';
import { InitiativeListComponent } from './components/initiative-list/initiative-list.component';

@Component({
  selector: 'app-combat',
  standalone: true,
  imports: [
    CommonModule,
    DiceCalculatorComponent,
    InitiativeListComponent
  ],
  templateUrl: './combat.component.html',
  styleUrl: './combat.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CombatComponent {}
