/**
 * Lost Worlds - Species System
 * 
 * Handles pure species and mixed heritage characters.
 * Mixed heritage follows special rules from Character Creation section.
 */

import { StatAbbr } from './stats.model';

// ============================================================================
// PURE SPECIES
// ============================================================================

export type PureSpeciesId = 
  | 'orc'
  | 'goblin'
  | 'gnome'
  | 'dwarf'
  | 'fairy'
  | 'human'
  | 'elf'
  | 'giant'
  | 'cosmikin';

/**
 * Stat modifier (bonus or penalty)
 */
export interface StatModifier {
  stat: StatAbbr | 'HP' | 'STA' | 'SY';
  amount: number;  // Positive for bonuses, negative for penalties
}

/**
 * Pure species definition
 */
export interface PureSpeciesReference {
  id: PureSpeciesId;
  name: string;
  description: string;
  modifiers: StatModifier[];
  traits?: string[];
  componentAccess?: string[];
}

// ============================================================================
// MIXED HERITAGE
// ============================================================================

/**
 * A mixed heritage character combines two species
 */
export interface MixedHeritageReference {
  id: string;  // e.g., "elf-cosmikin" or "human-elf"
  name: string;  // e.g., "Half-Elf, Half-Cosmikin"
  parent1: PureSpeciesId;
  parent2: PureSpeciesId;
  selectedModifiers: StatModifier[];  // Manually chosen based on rules
  traits?: string[];
  componentAccess?: string[];
}

// ============================================================================
// UNIFIED SPECIES TYPE
// ============================================================================

/**
 * Species can be either pure or mixed heritage
 */
export type SpeciesReference = PureSpeciesReference | MixedHeritageReference;

/**
 * Type guard for pure species
 */
export function isPureSpecies(species: SpeciesReference): species is PureSpeciesReference {
  return (species as PureSpeciesReference).id in PURE_SPECIES_IDS;
}

/**
 * Type guard for mixed heritage
 */
export function isMixedHeritage(species: SpeciesReference): species is MixedHeritageReference {
  return !isPureSpecies(species);
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const PURE_SPECIES_IDS: Record<PureSpeciesId, true> = {
  orc: true,
  goblin: true,
  gnome: true,
  dwarf: true,
  fairy: true,
  human: true,
  elf: true,
  giant: true,
  cosmikin: true
};

// ============================================================================
// MIXED HERITAGE UTILITIES
// ============================================================================

/**
 * Rules for creating mixed heritage characters
 */
export interface MixedHeritageRules {
  maxBonuses: number;
  maxPenalties: number;
  sharedModifiers: StatModifier[];  // Automatically included
  conflicts: Array<{
    stat: StatAbbr | 'HP' | 'STA' | 'SY';
    parent1Modifier: StatModifier;
    parent2Modifier: StatModifier;
  }>;
  availableChoices: {
    bonuses: StatModifier[];
    penalties: StatModifier[];
  };
}

/**
 * Calculate the rules for mixing two species
 */
export function calculateMixedHeritageRules(
  parent1: PureSpeciesReference,
  parent2: PureSpeciesReference
): MixedHeritageRules {
  // Determine if one parent is human (special case)
  const hasHumanParent = parent1.id === 'human' || parent2.id === 'human';
  
  // Get all modifiers from both parents
  const p1Modifiers = parent1.modifiers;
  const p2Modifiers = parent2.modifiers;
  
  // Separate bonuses and penalties
  const p1Bonuses = p1Modifiers.filter(m => m.amount > 0);
  const p1Penalties = p1Modifiers.filter(m => m.amount < 0);
  const p2Bonuses = p2Modifiers.filter(m => m.amount > 0);
  const p2Penalties = p2Modifiers.filter(m => m.amount < 0);
  
  // Determine max selections based on rules
  let maxBonuses: number;
  let maxPenalties: number;
  
  if (hasHumanParent) {
    // Human parent: select only 2 bonuses and 2 penalties
    maxBonuses = 2;
    maxPenalties = 2;
  } else {
    // Non-human parents: use the higher count
    const maxFromParents = Math.max(
      p1Bonuses.length + p1Penalties.length,
      p2Bonuses.length + p2Penalties.length
    );
    // Typically 3 bonuses and 3 penalties for most species
    maxBonuses = Math.ceil(maxFromParents / 2);
    maxPenalties = Math.floor(maxFromParents / 2);
  }
  
  // Find shared modifiers (automatically included)
  const sharedModifiers: StatModifier[] = [];
  const conflicts: MixedHeritageRules['conflicts'] = [];
  
  // Check each stat for shared bonuses/penalties or conflicts
  const allStats: Set<StatAbbr | 'HP' | 'STA' | 'SY'> = new Set();
  [...p1Modifiers, ...p2Modifiers].forEach(m => allStats.add(m.stat));
  
  for (const stat of allStats) {
    const p1Mod = p1Modifiers.find(m => m.stat === stat);
    const p2Mod = p2Modifiers.find(m => m.stat === stat);
    
    if (p1Mod && p2Mod) {
      // Both parents affect this stat
      if ((p1Mod.amount > 0) === (p2Mod.amount > 0)) {
        // Same sign: shared modifier (use higher absolute value)
        const shared = Math.abs(p1Mod.amount) >= Math.abs(p2Mod.amount) ? p1Mod : p2Mod;
        sharedModifiers.push(shared);
      } else {
        // Opposite signs: conflict (must choose one)
        conflicts.push({
          stat,
          parent1Modifier: p1Mod,
          parent2Modifier: p2Mod
        });
      }
    }
  }
  
  // Build available choices (excluding shared and conflicted stats)
  const sharedStats = new Set(sharedModifiers.map(m => m.stat));
  const conflictStats = new Set(conflicts.map(c => c.stat));
  const excludedStats = new Set([...sharedStats, ...conflictStats]);
  
  const availableBonuses = [...p1Bonuses, ...p2Bonuses].filter(
    m => !excludedStats.has(m.stat)
  );
  const availablePenalties = [...p1Penalties, ...p2Penalties].filter(
    m => !excludedStats.has(m.stat)
  );
  
  return {
    maxBonuses,
    maxPenalties,
    sharedModifiers,
    conflicts,
    availableChoices: {
      bonuses: availableBonuses,
      penalties: availablePenalties
    }
  };
}

/**
 * Validate mixed heritage modifier selection
 */
export function validateMixedHeritageSelection(
  rules: MixedHeritageRules,
  selectedModifiers: StatModifier[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check that shared modifiers are included
  const selectedStats = new Set(selectedModifiers.map(m => m.stat));
  for (const shared of rules.sharedModifiers) {
    if (!selectedStats.has(shared.stat)) {
      errors.push(`Shared modifier for ${shared.stat} must be included`);
    }
  }
  
  // Check conflict resolution (only one side of each conflict)
  for (const conflict of rules.conflicts) {
    const hasP1 = selectedModifiers.some(
      m => m.stat === conflict.stat && m.amount === conflict.parent1Modifier.amount
    );
    const hasP2 = selectedModifiers.some(
      m => m.stat === conflict.stat && m.amount === conflict.parent2Modifier.amount
    );
    
    if (hasP1 && hasP2) {
      errors.push(`Cannot have both bonus and penalty for ${conflict.stat}`);
    } else if (!hasP1 && !hasP2) {
      errors.push(`Must choose one modifier for conflicted stat ${conflict.stat}`);
    }
  }
  
  // Check total counts
  const bonuses = selectedModifiers.filter(m => m.amount > 0);
  const penalties = selectedModifiers.filter(m => m.amount < 0);
  
  if (bonuses.length > rules.maxBonuses) {
    errors.push(`Too many bonuses: ${bonuses.length} > ${rules.maxBonuses}`);
  }
  
  if (penalties.length > rules.maxPenalties) {
    errors.push(`Too many penalties: ${penalties.length} > ${rules.maxPenalties}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create a display name for mixed heritage
 */
export function getMixedHeritageName(parent1Name: string, parent2Name: string): string {
  return `Half-${parent1Name}, Half-${parent2Name}`;
}

/**
 * Calculate component access for mixed heritage
 * Returns union of both parents' component access
 */
export function getMixedHeritageComponentAccess(
  parent1: PureSpeciesReference,
  parent2: PureSpeciesReference
): string[] {
  const access = new Set<string>();
  
  if (parent1.componentAccess) {
    parent1.componentAccess.forEach(c => access.add(c));
  }
  
  if (parent2.componentAccess) {
    parent2.componentAccess.forEach(c => access.add(c));
  }
  
  return Array.from(access);
}

/**
 * Calculate total modifier sum for display
 */
export function getModifierTotals(modifiers: StatModifier[]): { bonuses: number; penalties: number } {
  const bonuses = modifiers
    .filter(m => m.amount > 0)
    .reduce((sum, m) => sum + m.amount, 0);
  
  const penalties = modifiers
    .filter(m => m.amount < 0)
    .reduce((sum, m) => sum + m.amount, 0);
  
  return { bonuses, penalties };
}