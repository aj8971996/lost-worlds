/**
 * Lost Worlds - Character Model (Species Updates)
 * 
 * Updated to support both pure species and mixed heritage
 */

import { CharacterStats, CharacterResources, CharacterComponents, CombatStats } from './stats.model';
import { CharacterMagic } from './magic.model';
import { CharacterEquipment, CharacterInventory, ResolvedEquipment, ResolvedInventory } from './equipment.model';
import { CharacterAbilities, ResolvedAbility } from './ability.model';
import { CharacterSkills, ResolvedSkill } from './skills.model';
import { SpeciesReference, PureSpeciesId } from './species.model';

// Re-export for convenience
export type { SpeciesReference, PureSpeciesId } from './species.model';

// ============================================================================
// SPECIES SELECTION
// ============================================================================

/**
 * Character's species can be pure or mixed heritage
 */
export type CharacterSpeciesSelection = 
  | { type: 'pure'; speciesId: PureSpeciesId }
  | { type: 'mixed'; mixedHeritageId: string };

// ============================================================================
// ALIGNMENT & PERSONALITY
// ============================================================================

export type AlignmentValue = 'heroic' | 'neutral' | 'villain';
export type OverallAlignment = 'hero' | 'undecided' | 'villain';

export interface AlignmentTraits {
  compassion: AlignmentValue;
  mercy: AlignmentValue;
  humility: AlignmentValue;
  forgiveness: AlignmentValue;
  protection: AlignmentValue;
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
  date?: string;
  xpGained: number;
  notes?: string;
}

// ============================================================================
// CURRENCY
// ============================================================================

export interface CharacterCurrency {
  era: string;
  wealth: number;
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
  species: CharacterSpeciesSelection;  // Updated to support mixed heritage
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
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// RESOLVED CHARACTER (FOR UI)
// ============================================================================

/**
 * Character with all references resolved.
 */
export interface ResolvedCharacter extends Omit<Character, 'species' | 'equipment' | 'inventory' | 'abilities'> {
  species: SpeciesReference;  // Resolved to actual species data
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

export interface CharacterSummary {
  id: string;
  name: string;
  level: number;
  species: CharacterSpeciesSelection;  // Updated
  player?: string;
}

// ============================================================================
// LEGACY SUPPORT
// ============================================================================

/**
 * Helper to convert legacy speciesId string to new format
 */
export function migrateSpeciesId(speciesId: string): CharacterSpeciesSelection {
  // Check if it's a mixed heritage ID (contains hyphen between two species)
  const parts = speciesId.split('-');
  
  if (parts.length === 2) {
    // Could be mixed heritage like "elf-cosmikin"
    const validSpecies = ['orc', 'goblin', 'gnome', 'dwarf', 'fairy', 'human', 'elf', 'giant', 'cosmikin'];
    
    if (validSpecies.includes(parts[0]) && validSpecies.includes(parts[1])) {
      return {
        type: 'mixed',
        mixedHeritageId: speciesId
      };
    }
  }
  
  // Default to pure species
  return {
    type: 'pure',
    speciesId: speciesId as PureSpeciesId
  };
}