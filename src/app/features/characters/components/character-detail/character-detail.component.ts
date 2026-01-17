import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CharacterService } from '@core/services/character.service';
import { ResolvedCharacter, OverallAlignment } from '@core/models/character.model';
import { ArmorSlot } from '@core/models/equipment.model';
import { AbilitySource } from '@core/models/ability.model';
import { calculateMod, calculateDice } from '@core/models/stats.model';
import { calculateCollegeProgression, FocusLevels, MagicCollege } from '@core/models/magic.model';

@Component({
  selector: 'app-character-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './character-detail.component.html',
  styleUrl: './character-detail.component.scss'
})
export class CharacterDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly characterService = inject(CharacterService);

  character = signal<ResolvedCharacter | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  readonly armorSlots: ArmorSlot[] = ['head', 'shoulders', 'chest', 'arms', 'gloves', 'legs', 'boots'];

  // Computed values for magic focuses
  cosmicFocuses = computed(() => this.getFocusesArray(this.character()?.magic.cosmic));
  earthlyFocuses = computed(() => this.getFocusesArray(this.character()?.magic.earthly));
  deadFocuses = computed(() => this.getFocusesArray(this.character()?.magic.dead));

  trainedSkillsCount = computed(() => {
    const char = this.character();
    if (!char) return 0;
    return char.resolvedSkills.filter(s => s.level > 0).length;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCharacter(id);
    } else {
      this.error.set('No character ID provided');
      this.isLoading.set(false);
    }
  }

  private loadCharacter(id: string): void {
    this.characterService.getResolvedCharacter(id).subscribe({
      next: (character) => {
        if (character) {
          this.character.set(character);
        } else {
          this.error.set(`Character "${id}" could not be found.`);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load character:', err);
        this.error.set('Failed to load character data.');
        this.isLoading.set(false);
      }
    });
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  getResourcePercent(current: number, max: number): number {
    if (max <= 0) return 0;
    return Math.min(100, Math.max(0, (current / max) * 100));
  }

  getMod(value: number): number {
    return calculateMod(value);
  }

  getDice(value: number): number {
    return calculateDice(value);
  }

  formatMod(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`;
  }

  hasComponents(): boolean {
    const char = this.character();
    if (!char) return false;
    return !!(char.components.focusPoints || char.components.lifeSeeds || char.components.voidShards);
  }

  hasMagicFocuses(): boolean {
    return this.cosmicFocuses().length > 0 || 
           this.earthlyFocuses().length > 0 || 
           this.deadFocuses().length > 0;
  }

  private getFocusesArray(focuses: FocusLevels | undefined): { id: string; level: number }[] {
    if (!focuses) return [];
    return Object.entries(focuses)
      .filter(([_, level]) => level > 0)
      .map(([id, level]) => ({ id, level }));
  }

  getCollegeDegree(college: MagicCollege): string {
    const char = this.character();
    if (!char) return 'None';
    
    const focuses = char.magic[college];
    const progression = calculateCollegeProgression(focuses);
    
    const degreeNames: Record<string, string> = {
      'none': 'None',
      'associates': "Associate's",
      'bachelors': "Bachelor's",
      'masters': "Master's",
      'doctorate': 'Doctorate'
    };
    
    return degreeNames[progression.degree] || 'None';
  }

  getAlignmentIcon(alignment: OverallAlignment): string {
    const icons: Record<OverallAlignment, string> = {
      'hero': 'shield_person',
      'villain': 'skull',
      'undecided': 'help'
    };
    return icons[alignment] || 'help';
  }

  formatAlignment(alignment: OverallAlignment): string {
    const names: Record<OverallAlignment, string> = {
      'hero': 'Hero',
      'villain': 'Villain',
      'undecided': 'Undecided'
    };
    return names[alignment] || alignment;
  }

  formatWeaponType(type: string): string {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  formatArmorSlot(slot: ArmorSlot): string {
    return slot.charAt(0).toUpperCase() + slot.slice(1);
  }

  formatFocusName(id: string): string {
    return id.split(/(?=[A-Z])/).join(' ')
      .split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
  }

  formatAbilitySource(source: AbilitySource): string {
    switch (source.type) {
      case 'magic':
        return `${source.college.charAt(0).toUpperCase() + source.college.slice(1)} Magic - ${source.focus}`;
      case 'skill':
        return `Skill: ${source.skillId}`;
      case 'species':
        return `Species: ${source.speciesId}`;
      case 'item':
        return `Item: ${source.itemId}`;
      case 'innate':
        return 'Innate Ability';
      default:
        return 'Unknown Source';
    }
  }
}