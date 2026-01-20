import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CharacterService } from '@core/services/character.service';
import { CharacterSummary } from '@core/models';
import { CharacterCardComponent } from './components/character-card/character-card.component';

@Component({
  selector: 'app-characters',
  standalone: true,
  imports: [CommonModule, RouterLink, CharacterCardComponent],
  templateUrl: './characters.component.html',
  styleUrl: './characters.component.scss'
})
export class CharactersComponent implements OnInit {
  private readonly characterService = inject(CharacterService);

  characters = signal<CharacterSummary[]>([]);
  isLoading = signal(true);

  // Computed values for footer stats
  uniqueSpeciesCount = computed(() => {
    const species = new Set(this.characters().map(c => c.speciesId));
    return species.size;
  });

  averageLevel = computed(() => {
    const chars = this.characters();
    if (chars.length === 0) return '0';
    const total = chars.reduce((sum, c) => sum + c.level, 0);
    return (total / chars.length).toFixed(1);
  });

  ngOnInit(): void {
    this.loadCharacters();
  }

  private loadCharacters(): void {
    this.characterService.getCharacterList().subscribe({
      next: (characters) => {
        this.characters.set(characters);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load characters:', error);
        this.isLoading.set(false);
      }
    });
  }
}