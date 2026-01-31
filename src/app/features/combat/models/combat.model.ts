/**
 * Lost Worlds - Combat System Models
 * 
 * Defines all types for dice rolling, combat calculations,
 * and initiative tracking.
 */

import { StatAbbr } from '../../../core/models/stats.model';
import { SkillId } from '../../../core/models/skills.model';

// ============================================================================
// ROLL TYPES
// ============================================================================

export type RollType = 'stat' | 'attack' | 'defense' | 'skill' | 'custom';
export type AttackType = 'physical' | 'ranged' | 'magical';

// Roll context - what kind of roll is being made
export interface RollContext {
  type: RollType;
  attackType?: AttackType;
  isDefense?: boolean;
}

// ============================================================================
// DICE CALCULATION
// ============================================================================

export interface DicePool {
  baseDice: number;           // D20s from primary stat(s)
  secondaryDice: number;      // D20s from secondary stat (combat only)
  skillDice: number;          // Bonus D20s from skills
  bonusDice: number;          // Any additional bonus dice
  totalDice: number;          // Sum of all dice
  modifier: number;           // Total flat modifier to add to roll
}

export interface StatContribution {
  abbr: StatAbbr;
  name: string;
  value: number;
  dice: number;
  mod: number;
}

export interface SkillContribution {
  id: SkillId | string;
  name: string;
  level: number;
  bonusDice: number;
}

// Complete breakdown of a roll calculation
export interface RollCalculation {
  context: RollContext;
  characterId: string;
  characterName: string;
  
  // Stat contributions
  // CHANGED: primaryStat can now be undefined, using primaryStats array instead for multi-stat rolls
  primaryStat?: StatContribution;
  
  // NEW: Array of primary stats for simple rolls with multiple stats
  primaryStats?: StatContribution[];
  
  secondaryStat?: StatContribution;
  
  // Skill contributions
  skills: SkillContribution[];
  
  // Final pool
  dicePool: DicePool;
  
  // Description for display
  description: string;
}

// ============================================================================
// COMBAT FORMULAS
// ============================================================================

export interface CombatFormula {
  type: AttackType;
  isDefense: boolean;
  primaryStat: StatAbbr;
  secondaryStat: StatAbbr;
  label: string;
  description: string;
}

// All combat formulas defined
export const COMBAT_FORMULAS: CombatFormula[] = [
  // Attacks
  {
    type: 'physical',
    isDefense: false,
    primaryStat: 'SPD',
    secondaryStat: 'MIT',
    label: 'Physical Attack',
    description: 'Melee attacks using Speed + Might'
  },
  {
    type: 'ranged',
    isDefense: false,
    primaryStat: 'SPD',
    secondaryStat: 'KNW',
    label: 'Ranged Attack',
    description: 'Ranged attacks using Speed + Knowledge'
  },
  {
    type: 'magical',
    isDefense: false,
    primaryStat: 'AST',
    secondaryStat: 'MAG',
    label: 'Magical Attack',
    description: 'Magical attacks using Astrology + Magiks'
  },
  // Defenses
  {
    type: 'physical',
    isDefense: true,
    primaryStat: 'SPD',
    secondaryStat: 'GRT',
    label: 'Physical Defense',
    description: 'Defending melee attacks using Speed + Grit'
  },
  {
    type: 'ranged',
    isDefense: true,
    primaryStat: 'SPD',
    secondaryStat: 'FRS',
    label: 'Ranged Defense',
    description: 'Defending ranged attacks using Speed + Foresight'
  },
  {
    type: 'magical',
    isDefense: true,
    primaryStat: 'DET',
    secondaryStat: 'FRS',
    label: 'Magical Defense',
    description: 'Defending magical attacks using Determination + Foresight'
  }
];

// Helper to get combat formula
export function getCombatFormula(type: AttackType, isDefense: boolean): CombatFormula | undefined {
  return COMBAT_FORMULAS.find(f => f.type === type && f.isDefense === isDefense);
}

// ============================================================================
// STAT MAPPINGS
// ============================================================================

// Map stat keys from character data to abbreviations
export const STAT_KEY_TO_ABBR: Record<string, StatAbbr> = {
  might: 'MIT',
  grit: 'GRT',
  speed: 'SPD',
  knowledge: 'KNW',
  foresight: 'FRS',
  courage: 'COR',
  determination: 'DET',
  astrology: 'AST',
  magiks: 'MAG',
  nature: 'NAT'
};

export const STAT_ABBR_TO_KEY: Record<StatAbbr, string> = {
  MIT: 'might',
  GRT: 'grit',
  SPD: 'speed',
  KNW: 'knowledge',
  FRS: 'foresight',
  COR: 'courage',
  DET: 'determination',
  AST: 'astrology',
  MAG: 'magiks',
  NAT: 'nature'
};

// Stat categories for grouping in UI
export const STAT_CATEGORIES = {
  physical: ['MIT', 'GRT', 'SPD'] as StatAbbr[],
  mental: ['KNW', 'FRS', 'COR', 'DET'] as StatAbbr[],
  magical: ['AST', 'MAG', 'NAT'] as StatAbbr[]
};

// ============================================================================
// INITIATIVE
// ============================================================================

export interface InitiativeEntry {
  id: string;
  name: string;
  initiative: number;
  isPlayer: boolean;
  isCurrentTurn: boolean;
  characterId?: string;
  notes?: string;
}

export interface CombatState {
  isActive: boolean;
  round: number;
  currentTurnIndex: number;
  initiative: InitiativeEntry[];
}

// ============================================================================
// ROLL RESULT (for displaying results)
// ============================================================================

export interface DiceRollResult {
  rolls: number[];            // Individual die results
  total: number;              // Sum of all dice
  modifier: number;           // Modifier applied
  finalResult: number;        // total + modifier
  isCritical?: boolean;       // Natural 20 on any die
  isFumble?: boolean;         // Natural 1 on all dice
}

// ============================================================================
// UI STATE
// ============================================================================

export type CalculatorMode = 'simple' | 'combat';
export type CombatTab = 'attack' | 'defense';

export interface CalculatorState {
  mode: CalculatorMode;
  combatTab: CombatTab;
  selectedCharacterId: string | null;
  
  // CHANGED: Now an array of stats instead of a single stat
  selectedStats: StatAbbr[];
  
  selectedAttackType: AttackType | null;
  selectedSkills: string[];
  customBonusDice: number;
  customModifier: number;
}

// Default calculator state
export function getDefaultCalculatorState(): CalculatorState {
  return {
    mode: 'simple',
    combatTab: 'attack',
    selectedCharacterId: null,
    selectedStats: [],
    selectedAttackType: null,
    selectedSkills: [],
    customBonusDice: 0,
    customModifier: 0
  };
}