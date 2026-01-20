import { 
  Component, 
  inject, 
  signal, 
  computed,
  ChangeDetectionStrategy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CombatService } from '../../services/combat.service';
import { CharacterService } from '../../../../core/services/character.service';
import { CharacterSummary, ResolvedCharacter } from '../../../../core/models/character.model';
import { InitiativeEntry } from '../../models/combat.model';

@Component({
  selector: 'app-initiative-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './initiative-list.component.html',
  styleUrl: './initiative-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InitiativeListComponent {
  private readonly combatService = inject(CombatService);
  private readonly characterService = inject(CharacterService);

  // Data
  readonly characters = signal<CharacterSummary[]>([]);
  readonly loadedCharacters = signal<Map<string, ResolvedCharacter>>(new Map());

  // Combat state from service
  readonly combatState = this.combatService.combatState;

  // Add entry form
  readonly showAddForm = signal(false);
  readonly newEntryName = signal('');
  readonly newEntryInitiative = signal<number | null>(null);
  readonly newEntryIsPlayer = signal(true);
  readonly selectedCharacterId = signal<string | null>(null);

  // Computed
  readonly sortedInitiative = computed(() => {
    return [...this.combatState().initiative].sort((a, b) => b.initiative - a.initiative);
  });

  readonly currentTurnEntry = computed(() => {
    return this.combatState().initiative.find(e => e.isCurrentTurn);
  });

  constructor() {
    this.loadCharacters();
  }

  private loadCharacters(): void {
    this.characterService.getCharacterList().subscribe(chars => {
      this.characters.set(chars);
    });
  }

  // ============================================================================
  // COMBAT CONTROLS
  // ============================================================================

  startCombat(): void {
    this.combatService.startCombat();
  }

  endCombat(): void {
    if (confirm('Are you sure you want to end combat? This will clear the initiative list.')) {
      this.combatService.endCombat();
    }
  }

  nextTurn(): void {
    this.combatService.nextTurn();
  }

  previousTurn(): void {
    this.combatService.previousTurn();
  }

  // ============================================================================
  // INITIATIVE MANAGEMENT
  // ============================================================================

  toggleAddForm(): void {
    this.showAddForm.update(v => !v);
    if (!this.showAddForm()) {
      this.resetAddForm();
    }
  }

  private resetAddForm(): void {
    this.newEntryName.set('');
    this.newEntryInitiative.set(null);
    this.newEntryIsPlayer.set(true);
    this.selectedCharacterId.set(null);
  }

  onCharacterSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const charId = select.value;

    if (!charId) {
      this.selectedCharacterId.set(null);
      this.newEntryName.set('');
      return;
    }

    this.selectedCharacterId.set(charId);
    
    // Find character name
    const char = this.characters().find(c => c.id === charId);
    if (char) {
      this.newEntryName.set(char.name);
      this.newEntryIsPlayer.set(true);
    }
  }

  rollInitiativeForCharacter(): void {
    const charId = this.selectedCharacterId();
    if (!charId) return;

    // Load character and roll
    this.characterService.getResolvedCharacter(charId).subscribe(char => {
      if (char) {
        const initiative = this.combatService.rollInitiative(char);
        this.newEntryInitiative.set(initiative);
        
        // Store for later reference
        this.loadedCharacters.update(map => {
          const newMap = new Map(map);
          newMap.set(charId, char);
          return newMap;
        });
      }
    });
  }

  addEntry(): void {
    const name = this.newEntryName().trim();
    const initiative = this.newEntryInitiative();

    if (!name || initiative === null) {
      return;
    }

    const entry: Omit<InitiativeEntry, 'isCurrentTurn'> = {
      id: crypto.randomUUID(),
      name,
      initiative,
      isPlayer: this.newEntryIsPlayer(),
      characterId: this.selectedCharacterId() || undefined
    };

    this.combatService.addToInitiative(entry);
    this.resetAddForm();
    this.showAddForm.set(false);
  }

  removeEntry(id: string): void {
    this.combatService.removeFromInitiative(id);
  }

  // Quick add NPC
  addQuickNpc(): void {
    const name = prompt('Enter NPC name:');
    if (!name) return;

    const initiativeStr = prompt('Enter initiative value:');
    if (!initiativeStr) return;

    const initiative = parseInt(initiativeStr, 10);
    if (isNaN(initiative)) {
      alert('Please enter a valid number for initiative.');
      return;
    }

    const entry: Omit<InitiativeEntry, 'isCurrentTurn'> = {
      id: crypto.randomUUID(),
      name,
      initiative,
      isPlayer: false
    };

    this.combatService.addToInitiative(entry);
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  getEntryIcon(entry: InitiativeEntry): string {
    if (entry.isPlayer) {
      return 'person';
    }
    return 'smart_toy';
  }
}
