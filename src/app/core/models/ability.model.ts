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
 * - Reaction (triggered by specific events)
 */

import { MagicCollege } from './magic.model';

// ============================================================================
// COMPONENT SYSTEM
// ============================================================================

/**
 * Component types used by different schools of magic.
 * Each school has its own component type with specific recharge conditions.
 */
export type ComponentType = 
  // Cosmic College
  | 'SR'      // Star Runes (School of Stars) - 3 per focus level, recharge under moonlight
  | 'LR'      // Light Runes (School of Light) - 3 per focus level, recharge in sunlight/moonlight
  | 'Hours'   // Time component (School of Time) - 24 per Time Piece, 1 piece per focus level
  | 'VS'      // Void Shards (School of Void)
  | 'RP'      // Realm Points (School of Realms)
  // Earthly College
  | 'FP'      // Focus Points (general Earthly magic)
  | 'LS'      // Life Seeds (School of Life)
  | 'CP'      // Craft Points (School of Craft)
  | 'EP'      // Elemental Points (School of Elements)
  | 'SP'      // Speech Points (School of Speech)
  | 'BP'      // Body Points (School of Body)
  // Dead College
  | 'FE'      // Funeral Essence (School of Endings)
  | 'DE'      // Decay Essence (School of Decay)
  | 'DC'      // Damned Coins (School of Damned)
  // Universal
  | 'SY';     // Sanity - used as secondary cost across all colleges

/**
 * Component cost for an ability.
 * Supports flat costs and scaling costs (e.g., "1 SR per 10 words")
 */
export interface ComponentCost {
  type: ComponentType;
  amount: number;
  /** For scaling costs like "1 SR per 10 words" */
  per?: string;
}

// ============================================================================
// DAMAGE & HEALING SYSTEM
// ============================================================================

/**
 * Types of damage that can be dealt
 */
export type DamageType = 
  | 'physical'
  | 'sanity'
  | 'necrotic'
  | 'radiant'
  | 'fire'
  | 'cold'
  | 'lightning'
  | 'poison'
  | 'psychic'
  | 'force'
  | 'true';    // Bypasses resistances

/**
 * Damage dealt by an ability
 */
export interface AbilityDamage {
  /** Dice formula: "3D12", "2D10", etc. */
  dice: string;
  /** Stat modifier to add: "AST", "MIT", "MAG", etc. */
  statModifier?: string;
  /** Additional flat bonus */
  flatBonus?: number;
  /** Type of damage dealt */
  type: DamageType;
  /** Bonus damage against specific targets */
  bonusAgainst?: {
    targets: string[];  // "undead", "corrupted", "demons", etc.
    bonusDice: string;
  };
}

/**
 * Healing provided by an ability
 */
export interface AbilityHealing {
  /** Dice formula: "2D10", "3D12", etc. */
  dice: string;
  /** Stat modifier to add */
  statModifier?: string;
  /** Additional flat bonus */
  flatBonus?: number;
  /** What resource is healed */
  target: 'hp' | 'stamina' | 'sanity' | 'maxHp';
  /** Conditional bonus healing */
  conditionalBonus?: {
    condition: string;
    bonusDice: string;
  };
}

// ============================================================================
// CONDITIONS SYSTEM
// ============================================================================

/**
 * Conditions that can be applied or removed by abilities
 */
export type ConditionType =
  // Negative conditions
  | 'bleeding'
  | 'burned'
  | 'blinded'
  | 'charmed'
  | 'confused'
  | 'constricted'
  | 'deafened'
  | 'doomed'
  | 'exposed'
  | 'frightened'
  | 'grappled'
  | 'marked-for-death'
  | 'oathbreaker'
  | 'paralyzed'
  | 'petrified'
  | 'poisoned'
  | 'prone'
  | 'restrained'
  | 'shocked'
  | 'slowed'
  | 'stunned'
  | 'terrified'
  | 'unconscious'
  // Positive conditions
  | 'blessed'
  | 'hasted'
  | 'invisible'
  | 'protected'
  | 'regenerating';

/**
 * Condition application details
 */
export interface ConditionEffect {
  condition: ConditionType;
  /** Duration in rounds, "until treated", "until rest", etc. */
  duration?: string;
  /** Stacks (e.g., Burned can stack) */
  stacks?: number;
  /** Save to resist or end early */
  save?: {
    stat: string;
    difficulty: number;
  };
}

// ============================================================================
// EFFECTS SYSTEM
// ============================================================================

/**
 * Dice pool modifications (+/- D20s)
 */
export interface DicePoolModifier {
  /** Number of dice to add (positive) or remove (negative) */
  amount: number;
  /** What rolls this affects */
  applies: 'attack' | 'defense' | 'all' | 'initiative' | string;
  /** Duration */
  duration?: string;
}

/**
 * Stat modifier changes
 */
export interface StatModifierEffect {
  /** Which stat(s) affected, or "all" */
  stats: string[] | 'all';
  /** Modifier change */
  amount: number;
  /** Duration */
  duration?: string;
}

/**
 * Movement modifications
 */
export interface MovementEffect {
  /** Feet added (positive) or removed (negative) */
  amount: number;
  /** Duration */
  duration?: string;
}

/**
 * Action Point modifications
 */
export interface APEffect {
  /** AP change (positive grants, negative removes) */
  amount: number;
  /** Affects current turn, next turn, or max AP */
  affects: 'current' | 'next' | 'max';
  /** Duration if ongoing */
  duration?: string;
}

/**
 * Structured effects that an ability can have
 */
export interface AbilityEffects {
  /** Dice pool modifiers granted/inflicted */
  diceModifiers?: DicePoolModifier[];
  /** Stat modifier changes */
  statModifiers?: StatModifierEffect[];
  /** Movement changes */
  movement?: MovementEffect;
  /** AP changes */
  ap?: APEffect;
  /** Conditions applied */
  appliesConditions?: ConditionEffect[];
  /** Conditions removed */
  removesConditions?: ConditionType[];
  /** Temporary HP granted */
  temporaryHp?: {
    dice: string;
    duration: string;
    /** What happens when temp HP expires */
    expiration?: string;
  };
  /** Special immunities or protections granted */
  grants?: string[];
  /** Damage reduction */
  damageReduction?: {
    dice: string;
    types?: DamageType[];
  };
  /** Resistances granted (damage halved) */
  resistances?: DamageType[];
  /** Damage increase on incoming attacks */
  damageIncrease?: string;
  /** Custom/freeform effects that don't fit other categories */
  special?: string[];
}

// ============================================================================
// SUMMON SYSTEM
// ============================================================================

/**
 * Attack available to a summoned creature
 */
export interface SummonAttack {
  name: string;
  type: 'physical' | 'ranged' | 'magical';
  damage: string;
  damageType?: DamageType;
  statModifiers?: string[];  // e.g., ["MIT", "AST"]
  apCost: number;
  /** Special effects on hit */
  special?: string;
  /** Usage limits */
  usesPerDay?: number;
  /** Targeting restrictions */
  targetRestriction?: string;
}

/**
 * Summoned creature stat block
 */
export interface SummonedCreature {
  id: string;
  name: string;
  hp: number;
  stamina: number;
  attacks: SummonAttack[];
  /** Passive abilities */
  passives?: string[];
  /** What causes the summon to fade/disappear */
  fadeCondition?: string;
  /** Additional notes */
  notes?: string;
}

/**
 * Summon data for abilities that create creatures
 */
export interface SummonData {
  /** Reference to creature definition */
  creatureId: string;
  /** Inline creature stats (for quick reference) */
  creature?: SummonedCreature;
  /** Duration if limited */
  duration?: string;
  /** Range at which creature can be summoned */
  summonRange?: string;
}

// ============================================================================
// TARGETING SYSTEM
// ============================================================================

/**
 * Range specification
 */
export type AbilityRange = 
  | 'self'
  | 'touch'
  | 'melee'
  | 'line-of-sight'
  | 'unlimited'
  | string;  // "30 ft", "60 ft", etc.

/**
 * Duration specification
 */
export type AbilityDuration =
  | 'instant'
  | 'sustained'
  | 'concentration'
  | 'until-dismissed'
  | 'until-rest'
  | 'until-destroyed'
  | 'until-triggered'
  | 'permanent'
  | string;  // "30 minutes", "1 hour", "3 rounds"

/**
 * Target type
 */
export type AbilityTarget =
  | 'self'
  | 'ally'
  | 'enemy'
  | 'creature'      // Any creature (ally or enemy)
  | 'object'
  | 'area'
  | 'corpse'
  | 'spirit'
  | 'special';

/**
 * Area of effect specification
 */
export interface AreaOfEffect {
  shape: 'radius' | 'cone' | 'line' | 'cube' | 'sphere' | 'wall' | 'dome';
  size: string;  // "15 ft", "30 ft radius", etc.
  /** For selective targeting within area */
  maxTargets?: number;
}

// ============================================================================
// ABILITY SOURCE
// ============================================================================

/**
 * Where an ability comes from
 */
export type AbilitySource = 
  | { 
      type: 'magic'; 
      college: MagicCollege; 
      school: string;
      focus: string; 
      requiredLevel: number;
    }
  | { 
      type: 'physical'; 
      college: MagicCollege;
      school: string; 
      focus: string; 
      requiredLevel: number;
    }
  | { type: 'skill'; skillId: string; requiredLevel: number }
  | { type: 'species'; speciesId: string }
  | { type: 'item'; itemId: string }
  | { type: 'innate' };

export type AbilitySourceType = 'magic' | 'physical' | 'skill' | 'species' | 'item' | 'innate';

// ============================================================================
// ABILITY TIMING
// ============================================================================

/**
 * When an ability can be used
 */
export type AbilityTiming = 
  | 'action'        // Normal action during turn
  | 'reaction'      // Triggered by specific event
  | 'free'          // No action cost
  | 'bonus';        // Bonus action

/**
 * Trigger condition for reaction abilities
 */
export interface ReactionTrigger {
  /** Event that triggers this ability */
  event: string;  // "ally attacked", "enemy casts spell", "ally would take damage", etc.
  /** Range at which trigger can be detected */
  range?: string;
  /** Any additional conditions */
  conditions?: string[];
}

// ============================================================================
// USAGE LIMITS
// ============================================================================

/**
 * Limits on how often an ability can be used
 */
export interface UsageLimit {
  uses: number;
  per: 'turn' | 'round' | 'combat' | 'short-rest' | 'long-rest' | 'day';
}

// ============================================================================
// MAIN ABILITY REFERENCE
// ============================================================================

/**
 * Complete ability reference data
 */
export interface AbilityReference {
  id: string;
  name: string;
  source: AbilitySource;
  
  // === Costs ===
  /** Action Point cost (null for passive/reaction abilities) */
  apCost: number | null;
  /** Primary component cost(s) */
  componentCost?: ComponentCost[];
  /** Sanity cost (separate from component cost) */
  sanityCost?: number;
  /** Stamina cost */
  staminaCost?: number;
  
  // === Targeting ===
  range: AbilityRange;
  target: AbilityTarget;
  areaOfEffect?: AreaOfEffect;
  /** Number of targets if not using area */
  targetCount?: number;
  
  // === Output ===
  /** Damage dealt */
  damage?: AbilityDamage;
  /** Healing provided */
  healing?: AbilityHealing;
  /** Structured effects */
  effects?: AbilityEffects;
  /** Summon data for summoning abilities */
  summon?: SummonData;
  
  // === Duration & Timing ===
  duration: AbilityDuration;
  /** When ability can be used */
  timing?: AbilityTiming;
  /** Trigger for reaction abilities */
  reactionTrigger?: ReactionTrigger;
  
  // === Ability Flags ===
  /** Always active, no cost */
  isPassive: boolean;
  /** Can be cast as ritual (extended time, no component cost) */
  isRitual: boolean;
  /** Requires ongoing concentration/maintenance */
  isSustained: boolean;
  /** Is a reaction ability */
  isReaction?: boolean;
  
  // === Limits ===
  /** Usage limits per rest/day */
  usageLimit?: UsageLimit;
  /** Requirements to maintain effect (e.g., "must move 10 ft. each turn") */
  maintenanceRequirement?: string;
  
  // === Text Fields ===
  /** Full effect description (flavor + mechanics) */
  description: string;
  /** Additional rules notes */
  notes?: string;
  
  // === Prerequisites ===
  prerequisites?: {
    level?: number;
    stats?: Partial<Record<string, number>>;
    abilities?: string[];
    other?: string[];
  };
  
  // === Delayed Effects ===
  /** Describes any delayed penalty or "debt" from using this ability */
  delayedEffect?: {
    description: string;
    timing: string;
    effect: string;
  };
}

// ============================================================================
// ABILITY WITH CHOICES
// ============================================================================

/**
 * Choice option for abilities like "Temporal Regression" with multiple modes
 */
export interface AbilityChoice {
  id: string;
  name: string;
  effect: string;
  /** Override any base ability properties */
  overrides?: Partial<AbilityReference>;
}

/**
 * Ability that has multiple usage modes/choices
 */
export interface AbilityWithChoices extends AbilityReference {
  choices: AbilityChoice[];
}

// ============================================================================
// INSTANCE DATA (Character State)
// ============================================================================

/**
 * Character's state for a specific ability
 */
export interface AbilityInstance {
  refId: string;
  /** Currently selected choice for abilities with choices */
  activeChoice?: string;
  /** Last time ability was used (for cooldown tracking) */
  lastUsed?: string;
  /** Is ability currently sustained/active */
  sustained?: boolean;
  /** Remaining duration in rounds/minutes */
  currentDuration?: number;
  /** Current uses remaining (for limited abilities) */
  usesRemaining?: number;
}

/**
 * Resolved ability for UI display
 */
export interface ResolvedAbility extends AbilityReference {
  activeChoice?: string;
  lastUsed?: string;
  sustained?: boolean;
  currentDuration?: number;
  usesRemaining?: number;
  /** Computed: has resources and not on cooldown */
  canUse?: boolean;
  /** Reason ability cannot be used */
  cannotUseReason?: string;
}

/**
 * Character's ability data
 */
export interface CharacterAbilities {
  /** IDs of prepared abilities (max 3 + level) */
  prepared: string[];
  /** Track state for abilities that need it */
  abilityStates?: Record<string, AbilityInstance>;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Type guard: check if source has college/school/focus
 */
export function hasCollegeAndFocus(source: AbilitySource): source is 
  | { type: 'magic'; college: MagicCollege; school: string; focus: string; requiredLevel: number }
  | { type: 'physical'; college: MagicCollege; school: string; focus: string; requiredLevel: number } {
  return source.type === 'magic' || source.type === 'physical';
}

/**
 * Check if character can prepare more abilities
 */
export function canPrepareMore(currentPrepared: number, characterLevel: number): boolean {
  const maxPrepared = 3 + characterLevel;
  return currentPrepared < maxPrepared;
}

/**
 * Get maximum number of prepared abilities for a character level
 */
export function getMaxPreparedAbilities(characterLevel: number): number {
  return 3 + characterLevel;
}

/**
 * Format damage for display
 */
export function formatDamage(damage: AbilityDamage): string {
  let result = damage.dice;
  if (damage.statModifier) {
    result += ` + ${damage.statModifier}`;
  }
  if (damage.flatBonus) {
    result += ` + ${damage.flatBonus}`;
  }
  return result;
}

/**
 * Format healing for display
 */
export function formatHealing(healing: AbilityHealing): string {
  let result = healing.dice;
  if (healing.statModifier) {
    result += ` + ${healing.statModifier}`;
  }
  if (healing.flatBonus) {
    result += ` + ${healing.flatBonus}`;
  }
  return result;
}

/**
 * Check if an ability is a reaction
 */
export function isReactionAbility(ability: AbilityReference): boolean {
  return ability.isReaction === true || ability.timing === 'reaction';
}

/**
 * Check if an ability deals sanity damage
 */
export function dealsSanityDamage(ability: AbilityReference): boolean {
  return ability.damage?.type === 'sanity';
}

/**
 * Check if an ability is a summon
 */
export function isSummonAbility(ability: AbilityReference): boolean {
  return ability.summon !== undefined;
}