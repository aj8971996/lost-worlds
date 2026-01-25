import { Component, signal } from '@angular/core';

interface Highlight {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

@Component({
  selector: 'app-synopsis',
  standalone: true,
  templateUrl: './synopsis.component.html',
  styleUrl: './synopsis.component.scss'
})
export class SynopsisComponent {
  protected readonly highlights = signal<readonly Highlight[]>([
    {
      icon: 'history',
      title: 'Any Era',
      description: 'Play across different periods of magical history'
    },
    {
      icon: 'balance',
      title: 'Moral Choices',
      description: 'Unity vs. separation, loyalty vs. survival'
    },
    {
      icon: 'diversity_3',
      title: 'Rich Lore',
      description: 'Cosmic beings and ancient civilizations'
    },
    {
      icon: 'emoji_events',
      title: 'Flexible Play',
      description: '2-4 players recommended, any group size works'
    }
  ]);
}
