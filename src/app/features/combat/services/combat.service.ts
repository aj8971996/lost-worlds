import { Injectable, inject, computed, signal } from '@angular/core';
import { CharacterService } from '@core/index';
import { 
  Character, 
  CharacterSummary, 
  ResolvedCharacter 
} from '../../../core/models/character.model';
import { 
  calculateMod, 
  calculateDice, 
  StatAbbr, 
  STAT_NAMES 
} from '../../../core/models/stats.model';
import { CharacterSkills, SkillId } from '../../../core/models/skills.model';
import {
  RollCalculation,
  RollContext,
  DicePool,
  StatContribution,
  SkillContribution,
  AttackType,
  CombatFormula,
  getCombatFormula,
  STAT_KEY_TO_ABBR,
  STAT_ABBR_TO_KEY,
  DiceRollResult,
  CalculatorState,
  getDefaultCalculatorState,
  InitiativeEntry,
  CombatState
} from '../models/combat.model';
import { Observable, map, of } from 'rxjs';

/**
 * Service for handling all combat calculations and dice rolling.
 */
@Injectable({
  providedIn: 'root'
})
export class CombatService {
  private readonly characterService = inject(CharacterService);

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Calculator state
  readonly calculatorState = signal<CalculatorState>(getDefaultCalculatorState());

  // Combat encounter state
  readonly combatState = signal<CombatState>({
    isActive: false,
    round: 1,
    currentTurnIndex: 0,
    initiative: []
  });

  // Last calculation result
  readonly lastCalculation = signal<RollCalculation | null>(null);

  // Last roll result
  readonly lastRoll = signal<DiceRollResult | null>(null);

  // ============================================================================
  // STATE UPDATES
  // ============================================================================

  updateCalculatorState(updates: Partial<CalculatorState>): void {
    this.calculatorState.update(state => ({ ...state, ...updates }));
  }

  resetCalculator(): void {
    this.calculatorState.set(getDefaultCalculatorState());
    this.lastCalculation.set(null);
    this.lastRoll.set(null);
  }

  selectCharacter(characterId: string | null): void {
    this.updateCalculatorState({ 
      selectedCharacterId: characterId,
      selectedSkills: [] // Reset skills when character changes
    });
  }

  // CHANGED: Now accepts array of stats
  selectStats(stats: StatAbbr[]): void {
    this.updateCalculatorState({ selectedStats: stats });
  }

  selectAttackType(type: AttackType | null): void {
    this.updateCalculatorState({ selectedAttackType: type });
  }

  toggleSkill(skillId: string): void {
    this.calculatorState.update(state => {
      const skills = state.selectedSkills.includes(skillId)
        ? state.selectedSkills.filter(s => s !== skillId)
        : [...state.selectedSkills, skillId];
      return { ...state, selectedSkills: skills };
    });
  }

  setMode(mode: 'simple' | 'combat'): void {
    this.updateCalculatorState({ 
      mode,
      selectedStats: [],
      selectedAttackType: null
    });
  }

  setCombatTab(tab: 'attack' | 'defense'): void {
    this.updateCalculatorState({ combatTab: tab });
  }

  // ============================================================================
  // STAT VALUE EXTRACTION
  // ============================================================================

  /**
   * Get a stat's value from a character by abbreviation
   */

  getStatValue(character: Character | ResolvedCharacter, abbr: StatAbbr): number {
    const stats = character.stats;

    switch (abbr) {
      // Physical
      case 'MIT':
        return stats.physical.might.value;
      case 'GRT':
        return stats.physical.grit.value;
      case 'SPD':
        return stats.physical.speed.value;
      // Mental
      case 'KNW':
        return stats.mental.knowledge.value;
      case 'FRS':
        return stats.mental.foresight.value;
      case 'COR':
        return stats.mental.courage.value;
      case 'DET':
        return stats.mental.determination.value;
      // Magical
      case 'AST':
        return stats.magical.astrology.value;
      case 'MAG':
        return stats.magical.magiks.value;
      case 'NAT':
        return stats.magical.nature.value;
      default:
        return 0;
    }
  }

  /**
   * Create a stat contribution object
   */
  createStatContribution(character: Character | ResolvedCharacter, abbr: StatAbbr): StatContribution {
    const value = this.getStatValue(character, abbr);
    return {
      abbr,
      name: STAT_NAMES[abbr],
      value,
      dice: calculateDice(value),
      mod: calculateMod(value)
    };
  }

  // ============================================================================
  // SKILL HANDLING
  // ============================================================================

  /**
   * Get skill contributions for selected skills
   */
  getSkillContributions(
    skills: CharacterSkills, 
    selectedSkillIds: string[],
    skillNames: Record<string, string>
  ): SkillContribution[] {
    return selectedSkillIds
      .filter(id => skills[id as SkillId] !== undefined)
      .map(id => ({
        id: id as SkillId,
        name: skillNames[id] || id,
        level: skills[id as SkillId] || 0,
        bonusDice: skills[id as SkillId] || 0
      }));
  }

  // ============================================================================
  // DICE POOL CALCULATION
  // ============================================================================

  /**
   * Calculate a simple stat roll
   * CHANGED: Now accepts an array of StatAbbr instead of a single stat
   */
  calculateSimpleRoll(
    character: Character | ResolvedCharacter,
    stats: StatAbbr[],
    selectedSkills: string[] = [],
    skillNames: Record<string, string> = {},
    bonusDice: number = 0,
    bonusModifier: number = 0
  ): RollCalculation {
    // Create contributions for all selected stats
    const statContributions = stats.map(stat => this.createStatContribution(character, stat));
    
    const skillContributions = this.getSkillContributions(
      character.skills, 
      selectedSkills, 
      skillNames
    );

    // Calculate total dice and modifiers from all stats
    const totalStatDice = statContributions.reduce((sum, stat) => sum + stat.dice, 0);
    const totalStatMod = statContributions.reduce((sum, stat) => sum + stat.mod, 0);
    const totalSkillDice = skillContributions.reduce((sum, s) => sum + s.bonusDice, 0);

    const dicePool: DicePool = {
      baseDice: totalStatDice,
      secondaryDice: 0,
      skillDice: totalSkillDice,
      bonusDice: bonusDice,
      totalDice: totalStatDice + totalSkillDice + bonusDice,
      modifier: totalStatMod + bonusModifier
    };

    // Create description based on number of stats
    let description: string;
    if (stats.length === 1) {
      description = `${character.name} rolls ${STAT_NAMES[stats[0]]}`;
    } else {
      const statNames = stats.map(s => STAT_NAMES[s]).join(' + ');
      description = `${character.name} rolls ${statNames}`;
    }

    const calculation: RollCalculation = {
      context: { type: 'stat' },
      characterId: character.id,
      characterName: character.name,
      
      // For backward compatibility with single stat, set primaryStat if only one stat selected
      primaryStat: stats.length === 1 ? statContributions[0] : undefined,
      
      // NEW: Store all stat contributions
      primaryStats: statContributions,
      
      skills: skillContributions,
      dicePool,
      description
    };

    this.lastCalculation.set(calculation);
    return calculation;
  }

  /**
   * Calculate a combat roll (attack or defense)
   */
  calculateCombatRoll(
    character: Character | ResolvedCharacter,
    attackType: AttackType,
    isDefense: boolean,
    selectedSkills: string[] = [],
    skillNames: Record<string, string> = {},
    bonusDice: number = 0,
    bonusModifier: number = 0
  ): RollCalculation {
    const formula = getCombatFormula(attackType, isDefense);
    if (!formula) {
      throw new Error(`No combat formula found for ${attackType} ${isDefense ? 'defense' : 'attack'}`);
    }

    const primaryStat = this.createStatContribution(character, formula.primaryStat);
    const secondaryStat = this.createStatContribution(character, formula.secondaryStat);
    const skillContributions = this.getSkillContributions(
      character.skills, 
      selectedSkills, 
      skillNames
    );

    const totalSkillDice = skillContributions.reduce((sum, s) => sum + s.bonusDice, 0);

    const dicePool: DicePool = {
      baseDice: primaryStat.dice,
      secondaryDice: secondaryStat.dice,
      skillDice: totalSkillDice,
      bonusDice: bonusDice,
      totalDice: primaryStat.dice + secondaryStat.dice + totalSkillDice + bonusDice,
      modifier: primaryStat.mod + secondaryStat.mod + bonusModifier
    };

    const calculation: RollCalculation = {
      context: { 
        type: isDefense ? 'defense' : 'attack', 
        attackType,
        isDefense 
      },
      characterId: character.id,
      characterName: character.name,
      primaryStat,
      secondaryStat,
      skills: skillContributions,
      dicePool,
      description: `${character.name} - ${formula.label}`
    };

    this.lastCalculation.set(calculation);
    return calculation;
  }

  // ============================================================================
  // DICE ROLLING
  // ============================================================================

  /**
   * Roll dice based on a calculation
   */
  rollDice(calculation: RollCalculation): DiceRollResult {
    const { dicePool } = calculation;
    const rolls: number[] = [];

    // Roll all D20s
    for (let i = 0; i < dicePool.totalDice; i++) {
      rolls.push(Math.floor(Math.random() * 20) + 1);
    }

    const total = rolls.reduce((sum, r) => sum + r, 0);
    const finalResult = total + dicePool.modifier;

    // Check for criticals
    const isCritical = rolls.some(r => r === 20);
    const isFumble = rolls.length > 0 && rolls.every(r => r === 1);

    const result: DiceRollResult = {
      rolls,
      total,
      modifier: dicePool.modifier,
      finalResult,
      isCritical,
      isFumble
    };

    this.lastRoll.set(result);
    return result;
  }

  /**
   * Quick roll - calculate and roll in one step
   * CHANGED: Now accepts array of stats
   */
  quickRoll(
    character: Character | ResolvedCharacter,
    stats: StatAbbr[],
    selectedSkills: string[] = [],
    skillNames: Record<string, string> = {}
  ): { calculation: RollCalculation; result: DiceRollResult } {
    const calculation = this.calculateSimpleRoll(character, stats, selectedSkills, skillNames);
    const result = this.rollDice(calculation);
    return { calculation, result };
  }

  /**
   * Quick combat roll
   */
  quickCombatRoll(
    character: Character | ResolvedCharacter,
    attackType: AttackType,
    isDefense: boolean,
    selectedSkills: string[] = [],
    skillNames: Record<string, string> = {}
  ): { calculation: RollCalculation; result: DiceRollResult } {
    const calculation = this.calculateCombatRoll(
      character, 
      attackType, 
      isDefense, 
      selectedSkills, 
      skillNames
    );
    const result = this.rollDice(calculation);
    return { calculation, result };
  }

  // ============================================================================
  // INITIATIVE MANAGEMENT
  // ============================================================================

  startCombat(): void {
    this.combatState.update(state => ({
      ...state,
      isActive: true,
      round: 1,
      currentTurnIndex: 0
    }));
  }

  endCombat(): void {
    this.combatState.set({
      isActive: false,
      round: 1,
      currentTurnIndex: 0,
      initiative: []
    });
  }

  addToInitiative(entry: Omit<InitiativeEntry, 'isCurrentTurn'>): void {
    this.combatState.update(state => {
      const newEntry: InitiativeEntry = { ...entry, isCurrentTurn: false };
      const newInitiative = [...state.initiative, newEntry]
        .sort((a, b) => b.initiative - a.initiative);
      
      // Update current turn markers
      const updatedInitiative = newInitiative.map((e, i) => ({
        ...e,
        isCurrentTurn: i === state.currentTurnIndex
      }));

      return { ...state, initiative: updatedInitiative };
    });
  }

  removeFromInitiative(id: string): void {
    this.combatState.update(state => {
      const newInitiative = state.initiative.filter(e => e.id !== id);
      let newIndex = state.currentTurnIndex;
      
      // Adjust current turn index if needed
      if (newIndex >= newInitiative.length) {
        newIndex = 0;
      }

      const updatedInitiative = newInitiative.map((e, i) => ({
        ...e,
        isCurrentTurn: i === newIndex
      }));

      return { 
        ...state, 
        initiative: updatedInitiative,
        currentTurnIndex: newIndex
      };
    });
  }

  nextTurn(): void {
    this.combatState.update(state => {
      if (state.initiative.length === 0) return state;

      let nextIndex = (state.currentTurnIndex + 1) % state.initiative.length;
      let newRound = state.round;

      // If we've wrapped around, increment round
      if (nextIndex === 0) {
        newRound++;
      }

      const updatedInitiative = state.initiative.map((e, i) => ({
        ...e,
        isCurrentTurn: i === nextIndex
      }));

      return {
        ...state,
        currentTurnIndex: nextIndex,
        round: newRound,
        initiative: updatedInitiative
      };
    });
  }

  previousTurn(): void {
    this.combatState.update(state => {
      if (state.initiative.length === 0) return state;

      let prevIndex = state.currentTurnIndex - 1;
      let newRound = state.round;

      if (prevIndex < 0) {
        prevIndex = state.initiative.length - 1;
        if (newRound > 1) {
          newRound--;
        }
      }

      const updatedInitiative = state.initiative.map((e, i) => ({
        ...e,
        isCurrentTurn: i === prevIndex
      }));

      return {
        ...state,
        currentTurnIndex: prevIndex,
        round: newRound,
        initiative: updatedInitiative
      };
    });
  }

  /**
   * Roll initiative for a character
   */
  rollInitiative(character: Character | ResolvedCharacter): number {
    // Initiative is based on Speed + Initiative Modifier
    const speedValue = this.getStatValue(character, 'SPD');
    const speedDice = calculateDice(speedValue);
    const speedMod = calculateMod(speedValue);
    const initiativeMod = character.combat.initiativeMod || 0;

    // Roll speed dice
    let total = 0;
    for (let i = 0; i < speedDice; i++) {
      total += Math.floor(Math.random() * 20) + 1;
    }

    return total + speedMod + initiativeMod;
  }
}