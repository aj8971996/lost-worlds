/**
 * Lost Worlds - Ability System
 * 
 * Abilities are prepared from a character's learned abilities.
 * Max prepared = 3 + Character Level
 * 
 * Abilities can be:
 * - Active (cost AP and/or components)
 * - Passive (always in effect)
 * - Ritual/Sustained (ongoing effects)
 */

import { ResourceCost } from './equipment.model';
import { MagicFocus, MagicCollege } from './magic.model';

// Ability source - where does this ability come from?
export type AbilitySource = 
  | { type: 'magic'; college: MagicCollege; focus: string; requiredLevel: number }
  | { type: 'skill'; skillId: string; requiredLevel: number }
  | { type: 'species'; speciesId: string }
  | { type: 'item'; itemId: string }
  | { type: 'innate' };  // Character-specific abilities

// Range specification
export type AbilityRange = 
  | 'self'
  | 'touch'
  | 'melee'
  | string;  // "30 ft", "60 ft", etc.

// Duration specification
export type AbilityDuration =
  | 'instant'
  | 'sustained'
  | 'concentration'
  | string;  // "30 minutes", "1 hour", "2 rounds"

// Target type
export type AbilityTarget =
  | 'self'
  | 'ally'
  | 'enemy'
  | 'creature'
  | 'object'
  | 'area'
  | 'special';

// Reference data: Ability template
export interface AbilityReference {
  id: string;
  name: string;
  source: AbilitySource;
  
  // Costs
  apCost: number | null;          // null for passive abilities
  componentCost?: ResourceCost[]; // Multiple component types possible
  staminaCost?: number;
  
  // Targeting
  range: AbilityRange;
  target: AbilityTarget;
  areaOfEffect?: string;          // "10 ft radius", "15 ft cone", etc.
  
  // Effects
  damage?: string;                // "2D8 + SPD", "3D8 + MIT"
  healing?: string;               // "1D10 + MAG"
  duration: AbilityDuration;
  description: string;            // Full effect description
  
  // Ability flags
  isPassive: boolean;             // Always active, no cost
  isRitual: boolean;              // Can be cast as ritual
  isSustained: boolean;           // Requires concentration/maintenance
  
  // Prerequisites beyond source requirements
  prerequisites?: {
    level?: number;
    stats?: Partial<Record<string, number>>;
    abilities?: string[];         // Other ability IDs required
  };
  
  notes?: string;
}

// Ability with choices (like Aspect of the Beast)
export interface AbilityChoice {
  id: string;
  name: string;
  effect: string;
  bonuses?: Record<string, number | string>;
}

export interface AbilityWithChoices extends AbilityReference {
  choices: AbilityChoice[];
}

// Instance data: Character's ability state (if tracking cooldowns, uses, etc.)
export interface AbilityInstance {
  refId: string;
  activeChoice?: string;          // For abilities with choices
  lastUsed?: string;              // ISO timestamp for cooldown tracking
  sustained?: boolean;            // Currently sustained/active
  currentDuration?: number;       // Remaining duration in rounds/minutes
}

// Resolved ability for UI
export interface ResolvedAbility extends AbilityReference {
  activeChoice?: string;
  lastUsed?: string;
  sustained?: boolean;
  currentDuration?: number;
  canUse?: boolean;               // Computed: has resources, not on cooldown
}

// Character's ability data
export interface CharacterAbilities {
  // IDs of prepared abilities (max 3 + level)
  prepared: string[];
  
  // Optional: Track state for abilities that need it
  abilityStates?: Record<string, AbilityInstance>;
}

// Utility to check if character can prepare more abilities
export function canPrepareMore(currentPrepared: number, characterLevel: number): boolean {
  const maxPrepared = 3 + characterLevel;
  return currentPrepared < maxPrepared;
}

export function getMaxPreparedAbilities(characterLevel: number): number {
  return 3 + characterLevel;
}
