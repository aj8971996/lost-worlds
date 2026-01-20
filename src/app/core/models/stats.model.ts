/**
 * Lost Worlds - Stats System
 * 
 * 10 stats across 3 categories (Physical, Mental, Magical)
 * Each stat has a bonus (external modifier) and value (calculated)
 * Mod and Dice are derived from value
 */

// Stat abbreviations used throughout the system
export type PhysicalStatAbbr = 'MIT' | 'GRT' | 'SPD';
export type MentalStatAbbr = 'KNW' | 'FRS' | 'COR' | 'DET';
export type MagicalStatAbbr = 'AST' | 'MAG' | 'NAT';
export type StatAbbr = PhysicalStatAbbr | MentalStatAbbr | MagicalStatAbbr;

// Full stat names mapped to abbreviations
export const STAT_NAMES: Record<StatAbbr, string> = {
  MIT: 'Might',
  GRT: 'Grit',
  SPD: 'Speed',
  KNW: 'Knowledge',
  FRS: 'Foresight',
  COR: 'Courage',
  DET: 'Determination',
  AST: 'Astrology',
  MAG: 'Magiks',
  NAT: 'Nature'
};

// Individual stat with bonus and value (mod/dice are calculated)
export interface Stat {
  bonus: number;  // External modifier (from species, items, etc.)
  value: number;  // Base value + bonus = final value
}

// Stat categories
export interface PhysicalStats {
  might: Stat;
  grit: Stat;
  speed: Stat;
}

export interface MentalStats {
  knowledge: Stat;
  foresight: Stat;
  courage: Stat;
  determination: Stat;
}

export interface MagicalStats {
  astrology: Stat;
  magiks: Stat;
  nature: Stat;
}

// Complete stat block
export interface CharacterStats {
  physical: PhysicalStats;
  mental: MentalStats;
  magical: MagicalStats;
}

// Resource pools (Health, Stamina, Sanity)
export interface Resource {
  current: number;
  max: number;
}

export interface CharacterResources {
  health: Resource;
  armorHp: Resource;      // Separate armor HP pool
  stamina: Resource;
  sanity: Resource;
}

// Magic components by type
export interface CharacterComponents {
  focusPoints?: Resource;   // Earthly magic
  lifeSeeds?: Resource;     // Earthly magic (School of Life)
  voidShards?: Resource;    // Cosmic magic
  craftPoints?: Resource;  // Earthly Magic
  // Dead magic components can be added as needed
}

// Combat-derived values
export interface CombatStats {
  actionPoints: number;     // Typically 6 AP/turn
  baseMovement: number;     // In feet
  initiativeMod: number;
}

// Utility functions for stat calculations
export function calculateMod(value: number): number {
  if (value < 0) {
    // Negative values: -1 to -4 range
    return Math.max(-4, Math.floor(value / 10));
  }
  // 0-9: +0, 10-19: +1, etc., max +10
  return Math.min(10, Math.floor(value / 10));
}

export function calculateDice(value: number): number {
  if (value < 0) return 1;
  // 0-19: 1D20, 20-39: 2D20, etc., max 6D20 at 100
  return Math.min(6, 1 + Math.floor(value / 20));
}

// Attack/Defense formula types
export type AttackType = 'physical' | 'ranged' | 'magical';

export const ATTACK_FORMULAS: Record<AttackType, { attack: StatAbbr[]; defense: StatAbbr[] }> = {
  physical: { attack: ['SPD', 'MIT'], defense: ['SPD', 'GRT'] },
  ranged: { attack: ['SPD', 'KNW'], defense: ['SPD', 'FRS'] },
  magical: { attack: ['AST', 'MAG'], defense: ['DET', 'FRS'] }  // Note: AST or NAT + MAG
};
