import { 
  Component, 
  inject, 
  signal, 
  computed, 
  OnInit,
  ChangeDetectionStrategy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CharacterService } from '../../../../core/services/character.service';
import { ReferenceDataService } from '../../../../core/services/reference-data.service';
import { CombatService } from '../../services/combat.service';
import { 
  Character, 
  CharacterSummary, 
  ResolvedCharacter 
} from '../../../../core/models/character.model';
import { StatAbbr, STAT_NAMES } from '../../../../core/models/stats.model';
import { 
  AttackType, 
  COMBAT_FORMULAS,
  STAT_CATEGORIES,
  RollCalculation,
  DiceRollResult
} from '../../models/combat.model';
import { forkJoin } from 'rxjs';

interface StatOption {
  abbr: StatAbbr;
  name: string;
  value: number;
  dice: number;
  mod: number;
}

interface SkillOption {
  id: string;
  name: string;
  level: number;
  selected: boolean;
}

@Component({
  selector: 'app-dice-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dice-calculator.component.html',
  styleUrl: './dice-calculator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiceCalculatorComponent implements OnInit {
  private readonly characterService = inject(CharacterService);
  private readonly refDataService = inject(ReferenceDataService);
  private readonly combatService = inject(CombatService);

  // Data
  readonly characters = signal<CharacterSummary[]>([]);
  readonly selectedCharacter = signal<ResolvedCharacter | null>(null);
  readonly skillNames = signal<Record<string, string>>({});
  readonly isLoading = signal(false);

  // UI State
  readonly mode = signal<'simple' | 'combat'>('simple');
  readonly combatTab = signal<'attack' | 'defense'>('attack');
  
  // CHANGED: selectedStat is now a Set to support multiple selections
  readonly selectedStats = signal<Set<StatAbbr>>(new Set());
  
  readonly selectedAttackType = signal<AttackType | null>(null);
  readonly selectedSkills = signal<Set<string>>(new Set());
  readonly bonusDice = signal(0);
  readonly bonusModifier = signal(0);

  // Results
  readonly currentCalculation = signal<RollCalculation | null>(null);
  readonly rollResult = signal<DiceRollResult | null>(null);
  readonly rollHistory = signal<Array<{ calculation: RollCalculation; result: DiceRollResult }>>([]);

  // Animation state
  readonly isRolling = signal(false);

  // Computed values
  readonly statOptions = computed<{ physical: StatOption[]; mental: StatOption[]; magical: StatOption[] }>(() => {
    const character = this.selectedCharacter();
    if (!character) {
      return { physical: [], mental: [], magical: [] };
    }

    const createOption = (abbr: StatAbbr): StatOption => {
      const value = this.combatService.getStatValue(character, abbr);
      const contribution = this.combatService.createStatContribution(character, abbr);
      return {
        abbr,
        name: STAT_NAMES[abbr],
        value: contribution.value,
        dice: contribution.dice,
        mod: contribution.mod
      };
    };

    return {
      physical: STAT_CATEGORIES.physical.map(createOption),
      mental: STAT_CATEGORIES.mental.map(createOption),
      magical: STAT_CATEGORIES.magical.map(createOption)
    };
  });

  readonly skillOptions = computed<SkillOption[]>(() => {
    const character = this.selectedCharacter();
    const names = this.skillNames();
    const selected = this.selectedSkills();

    if (!character) return [];

    return Object.entries(character.skills)
      .filter(([_, level]) => level && level > 0)
      .map(([id, level]) => ({
        id,
        name: names[id] || this.formatSkillName(id),
        level: level || 0,
        selected: selected.has(id)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly attackFormulas = computed(() => 
    COMBAT_FORMULAS.filter(f => !f.isDefense)
  );

  readonly defenseFormulas = computed(() => 
    COMBAT_FORMULAS.filter(f => f.isDefense)
  );

  readonly canRoll = computed(() => {
    if (!this.selectedCharacter()) return false;
    
    if (this.mode() === 'simple') {
      // CHANGED: Now requires at least one stat to be selected
      return this.selectedStats().size > 0;
    } else {
      return this.selectedAttackType() !== null;
    }
  });

  readonly totalDicePreview = computed(() => {
    const calc = this.currentCalculation();
    if (!calc) return 0;
    return calc.dicePool.totalDice;
  });

  readonly totalModifierPreview = computed(() => {
    const calc = this.currentCalculation();
    if (!calc) return 0;
    return calc.dicePool.modifier;
  });

  readonly statCategories: ('physical' | 'mental' | 'magical')[] = ['physical', 'mental', 'magical'];

  ngOnInit(): void {
    this.loadCharacters();
    this.loadSkillNames();
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  private loadCharacters(): void {
    this.characterService.getCharacterList().subscribe(characters => {
      this.characters.set(characters);
    });
  }

  private loadSkillNames(): void {
    this.refDataService.getSkills().subscribe(skills => {
      const names: Record<string, string> = {};
      for (const [id, skill] of Object.entries(skills)) {
        names[id] = skill.name;
      }
      this.skillNames.set(names);
    });
  }

  // ============================================================================
  // CHARACTER SELECTION
  // ============================================================================

  onCharacterSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const characterId = select.value;

    if (!characterId) {
      this.selectedCharacter.set(null);
      this.resetSelections();
      return;
    }

    this.isLoading.set(true);
    this.characterService.getResolvedCharacter(characterId).subscribe(character => {
      this.selectedCharacter.set(character);
      this.resetSelections();
      this.isLoading.set(false);
    });
  }

  private resetSelections(): void {
    this.selectedStats.set(new Set());
    this.selectedAttackType.set(null);
    this.selectedSkills.set(new Set());
    this.bonusDice.set(0);
    this.bonusModifier.set(0);
    this.currentCalculation.set(null);
    this.rollResult.set(null);
  }

  // ============================================================================
  // MODE & TAB SELECTION
  // ============================================================================

  setMode(mode: 'simple' | 'combat'): void {
    this.mode.set(mode);
    this.selectedStats.set(new Set());
    this.selectedAttackType.set(null);
    this.currentCalculation.set(null);
    this.rollResult.set(null);
  }

  setCombatTab(tab: 'attack' | 'defense'): void {
    this.combatTab.set(tab);
    this.selectedAttackType.set(null);
    this.currentCalculation.set(null);
    this.rollResult.set(null);
  }

  // ============================================================================
  // STAT & ATTACK TYPE SELECTION
  // ============================================================================

  // CHANGED: Toggle stat selection instead of single select
  toggleStat(abbr: StatAbbr): void {
    this.selectedStats.update(stats => {
      const newStats = new Set(stats);
      if (newStats.has(abbr)) {
        newStats.delete(abbr);
      } else {
        newStats.add(abbr);
      }
      return newStats;
    });
    this.rollResult.set(null);
    this.updateCalculation();
  }

  // NEW: Check if a stat is selected
  isStatSelected(abbr: StatAbbr): boolean {
    return this.selectedStats().has(abbr);
  }

  // NEW: Clear all selected stats
  clearStats(): void {
    this.selectedStats.set(new Set());
    this.rollResult.set(null);
    this.updateCalculation();
  }

  selectAttackType(type: AttackType): void {
    this.selectedAttackType.set(type);
    this.rollResult.set(null);
    this.updateCalculation();
  }

  // ============================================================================
  // SKILL SELECTION
  // ============================================================================

  toggleSkill(skillId: string): void {
    this.selectedSkills.update(skills => {
      const newSkills = new Set(skills);
      if (newSkills.has(skillId)) {
        newSkills.delete(skillId);
      } else {
        newSkills.add(skillId);
      }
      return newSkills;
    });
    this.updateCalculation();
  }

  // ============================================================================
  // BONUS ADJUSTMENTS
  // ============================================================================

  adjustBonusDice(delta: number): void {
    this.bonusDice.update(v => Math.max(0, v + delta));
    this.updateCalculation();
  }

  adjustBonusModifier(delta: number): void {
    this.bonusModifier.update(v => v + delta);
    this.updateCalculation();
  }

  // ============================================================================
  // CALCULATION
  // ============================================================================

  private updateCalculation(): void {
    const character = this.selectedCharacter();
    if (!character) {
      this.currentCalculation.set(null);
      return;
    }

    const selectedSkillIds = Array.from(this.selectedSkills());
    const names = this.skillNames();

    if (this.mode() === 'simple') {
      // CHANGED: Pass array of selected stats instead of single stat
      const stats = Array.from(this.selectedStats());
      if (stats.length === 0) {
        this.currentCalculation.set(null);
        return;
      }

      const calc = this.combatService.calculateSimpleRoll(
        character,
        stats,
        selectedSkillIds,
        names,
        this.bonusDice(),
        this.bonusModifier()
      );
      this.currentCalculation.set(calc);
    } else {
      const attackType = this.selectedAttackType();
      if (!attackType) {
        this.currentCalculation.set(null);
        return;
      }

      const calc = this.combatService.calculateCombatRoll(
        character,
        attackType,
        this.combatTab() === 'defense',
        selectedSkillIds,
        names,
        this.bonusDice(),
        this.bonusModifier()
      );
      this.currentCalculation.set(calc);
    }
  }

  // ============================================================================
  // ROLLING
  // ============================================================================

  roll(): void {
    const calculation = this.currentCalculation();
    if (!calculation) return;

    // Trigger rolling animation
    this.isRolling.set(true);
    this.rollResult.set(null);

    // Simulate rolling delay for animation
    setTimeout(() => {
      const result = this.combatService.rollDice(calculation);
      this.rollResult.set(result);
      this.isRolling.set(false);

      // Add to history
      this.rollHistory.update(history => [
        { calculation, result },
        ...history.slice(0, 9) // Keep last 10 rolls
      ]);
    }, 600);
  }

  clearHistory(): void {
    this.rollHistory.set([]);
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private formatSkillName(id: string): string {
    return id
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  formatModifier(mod: number): string {
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }

  getStatsForCategory(category: 'physical' | 'mental' | 'magical'): StatOption[] {
    return this.statOptions()[category];
  }

  getStatCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      physical: 'Physical',
      mental: 'Mental',
      magical: 'Magical'
    };
    return labels[category] || category;
  }
}