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
  templateUrl: './creation-steps.component.html',
  styleUrl: './creation-steps.component.scss'
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
