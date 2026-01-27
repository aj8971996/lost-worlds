import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface ToolCard {
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly path: string;
  readonly accentColor: string;
}

@Component({
  selector: 'app-tools-grid',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './tools-grid.component.html',
  styleUrl: './tools-grid.component.scss'
})
export class ToolsGridComponent {
  protected readonly tools = signal<readonly ToolCard[]>([
    {
      title: 'Create Character',
      description: 'Forge a new hero with the character creation wizard. Build stats, choose abilities, and equip your adventurer.',
      icon: 'person_add',
      path: '/create',
      accentColor: '#10b981'
    },
    {
      title: 'Character Sheets',
      description: 'View and manage your party\'s character sheets. Track stats, abilities, skills, and inventory.',
      icon: 'person',
      path: '/characters',
      accentColor: 'var(--color-primary)'
    },
    {
      title: 'The Lost Worlds Library',
      description: 'Browse and search all abilities across schools of magic. Filter by college, stats, and type.',
      icon: 'auto_fix_high',
      path: '/abilities',
      accentColor: '#9370db'
    },
    {
      title: 'Equipment Armory',
      description: 'Explore weapons, armor, and items. Filter by type, cosmic source, armor set, and more.',
      icon: 'inventory_2',
      path: '/equipment',
      accentColor: '#e74c3c'
    },
    {
      title: 'Combat Tracker',
      description: 'Run smooth encounters with initiative tracking, HP management, and condition tracking.',
      icon: 'swords',
      path: '/combat',
      accentColor: 'var(--color-error)'
    },
    {
      title: 'Session Notes',
      description: 'Chronicle your adventures with session summaries, important events, and progress tracking.',
      icon: 'menu_book',
      path: '/sessions',
      accentColor: 'var(--color-accent)'
    }
  ]);
}