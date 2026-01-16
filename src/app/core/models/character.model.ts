/**
 * Lost Worlds - Character Model
 * 
 * Main character structure combining all subsystems.
 * Characters reference data from /data/reference/ files.
 */

import { CharacterStats, CharacterResources, CharacterComponents, CombatStats } from './stats.model';
import { CharacterMagic } from './magic.model';
import { CharacterEquipment, CharacterInventory, ResolvedEquipment, ResolvedInventory } from './equipment.model';
import { CharacterAbilities, ResolvedAbility } from './ability.model';
import { CharacterSkills, ResolvedSkill } from './skills.model';

// ============================================================================
// SPECIES
// ============================================================================

export interface SpeciesReference {
  id: string;
  name: string;
  description?: string;
  statBonuses?: Partial<Record<string, number>>;
  abilities?: string[];       // Innate ability IDs
  traits?: string[];          // Descriptive traits
  componentAccess?: string[]; // Which components this species can use
}

// ============================================================================
// ALIGNMENT & PERSONALITY
// ============================================================================

export type AlignmentValue = 'heroic' | 'neutral' | 'villain';
export type OverallAlignment = 'hero' | 'undecided' | 'villain';

export interface AlignmentTraits {
  compassion: AlignmentValue;   // Compassionate <-> Cruel
  mercy: AlignmentValue;        // Merciful <-> Ruthless
  humility: AlignmentValue;     // Humble <-> Arrogant
  forgiveness: AlignmentValue;  // Forgiving <-> Vindictive
  protection: AlignmentValue;   // Protective <-> Exploitative
}

export interface CharacterAlignment {
  overall: OverallAlignment;
  traits: AlignmentTraits;
}

// ============================================================================
// RELATIONSHIPS
// ============================================================================

export type RelationshipType = 'ally' | 'contact' | 'enemy' | 'neutral';

export interface Relationship {
  name: string;
  type: RelationshipType;
  notes?: string;
}

// ============================================================================
// SESSION LOG
// ============================================================================

export interface SessionLogEntry {
  session: number;
  date?: string;        // ISO date string
  xpGained: number;
  notes?: string;
}

// ============================================================================
// CURRENCY
// ============================================================================

export interface CharacterCurrency {
  era: string;          // Campaign setting (e.g., "Las Vegas", "Lost Vegas")
  wealth: number;       // Total wealth in setting's currency
}

// ============================================================================
// CHARACTER (STORED DATA)
// ============================================================================

/**
 * Character as stored in JSON files.
 * Contains references (IDs) to be resolved at runtime.
 */
export interface Character {
  // Identity
  id: string;
  name: string;
  level: number;
  xp: number;
  speciesId: string;          // Reference to species
  age: number;
  height: string;
  
  // Core stats
  stats: CharacterStats;
  resources: CharacterResources;
  components: CharacterComponents;
  combat: CombatStats;
  
  // Progression
  skills: CharacterSkills;
  magic: CharacterMagic;
  abilities: CharacterAbilities;
  
  // Equipment & Inventory
  equipment: CharacterEquipment;
  inventory: CharacterInventory;
  
  // Wealth
  currency: CharacterCurrency;
  
  // Narrative
  backstory?: string;
  appearance?: string;
  alignment: CharacterAlignment;
  relationships: Relationship[];
  sessionLog: SessionLogEntry[];
  
  // Metadata
  createdAt?: string;         // ISO timestamp
  updatedAt?: string;         // ISO timestamp
}

// ============================================================================
// RESOLVED CHARACTER (FOR UI)
// ============================================================================

/**
 * Character with all references resolved.
 * This is what components and templates work with.
 */
export interface ResolvedCharacter extends Omit<Character, 'speciesId' | 'equipment' | 'inventory' | 'abilities'> {
  species: SpeciesReference;
  equipment: ResolvedEquipment;
  inventory: ResolvedInventory;
  abilities: {
    prepared: ResolvedAbility[];
    maxPrepared: number;
  };
  resolvedSkills: ResolvedSkill[];
  
  // Computed values
  computed: {
    totalArmorHp: number;
    attackBonuses: {
      physical: number;
      ranged: number;
      magical: number;
    };
    defenseBonuses: {
      physical: number;
      ranged: number;
      magical: number;
    };
  };
}

// ============================================================================
// CHARACTER INDEX (For listing)
// ============================================================================

/**
 * Minimal character info for list views.
 * Stored in characters/index.json
 */
export interface CharacterSummary {
  id: string;
  name: string;
  level: number;
  speciesId: string;
  player?: string;            // Real-world player name
}
