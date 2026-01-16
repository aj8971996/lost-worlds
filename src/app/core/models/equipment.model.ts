/**
 * Lost Worlds - Equipment System
 * 
 * Equipment is split into Reference (template) and Instance (character's copy)
 * - Reference data lives in /data/reference/
 * - Instance data lives in character files
 * - Services resolve references at runtime
 * 
 * All equipment can have HP and be damaged.
 */

import { StatAbbr } from './stats.model';

// ============================================================================
// COMMON TYPES
// ============================================================================

// Resource cost for using abilities/equipment
export interface ResourceCost {
  type: 'ST' | 'HP' | 'SY' | 'FP' | 'LS' | 'VS' | 'AP';  // Stamina, Health, Sanity, or components
  amount: number;
}

// Defense check required to activate damage reduction
export interface DefenseCheck {
  stats: StatAbbr[];    // Stats to roll (e.g., ['MAG', 'FRS'])
  difficulty: number;   // Target difficulty (e.g., 10)
}

// Special ability on equipment with optional cooldown
export interface EquipmentAbility {
  name?: string;
  effect: string;
  cooldown?: string;          // "12 hours", "1 hour", etc.
  usesPerCooldown?: number;   // How many times per cooldown period
}

// Damage reduction type
export interface DamageReduction {
  dice: string;       // "1D4", "1D8", etc.
  check?: DefenseCheck;
}

// ============================================================================
// WEAPONS
// ============================================================================

// Weapon types observed in character sheets
export type WeaponType = 
  | 'dagger'
  | 'sword'
  | 'club'
  | 'staff'
  | 'throwing'
  | 'bow'
  | 'meteor-hammer'
  | '1h-weapon'
  | '2h-weapon'
  | 'unarmed';

// Reference data: Weapon template (lives in reference/weapons.json)
export interface WeaponReference {
  id: string;
  name: string;
  type: WeaponType;
  damage: string;             // "1D6 + SPD", "2D12 + MIT"
  range: string;              // "Melee", "30 ft", "15 ft"
  apCost: number;
  resourceCost?: ResourceCost;
  baseHp: number;             // All weapons have HP
  special?: string;           // Special effect description
  notes?: string;
}

// Instance data: Character's specific weapon (lives in character file)
export interface WeaponInstance {
  refId: string;              // Links to WeaponReference.id
  currentHp: number;
  quantity?: number;          // For stackable weapons (throwing knives)
  customName?: string;        // Override display name
  modifications?: string[];   // Future: enchantments, upgrades
}

// Resolved weapon: Reference + Instance merged (used in UI)
export interface ResolvedWeapon extends WeaponReference {
  currentHp: number;
  maxHp: number;              // From baseHp
  quantity?: number;
  customName?: string;
  modifications?: string[];
}

// ============================================================================
// ARMOR
// ============================================================================

// Armor slot locations
export type ArmorSlot = 
  | 'head'
  | 'shoulders'
  | 'chest'
  | 'arms'
  | 'gloves'
  | 'legs'
  | 'boots';

// Armor set types (for set bonuses if applicable)
export type ArmorSet = 
  | 'elementalist'
  | 'beast-handler'
  | 'none';

// Reference data: Armor template
export interface ArmorReference {
  id: string;
  name: string;
  slot: ArmorSlot;
  set?: ArmorSet;
  baseHp: number;
  damageReduction: DamageReduction;
  special?: EquipmentAbility;
  statBonus?: Partial<Record<StatAbbr, number>>;  // e.g., Elementalist Boots: +5 SPD
  notes?: string;
}

// Instance data: Character's equipped armor
export interface ArmorInstance {
  refId: string;
  currentHp: number;
  cooldownsUsed?: Record<string, string>;  // Track ability cooldowns (ability name -> last used timestamp)
}

// Resolved armor
export interface ResolvedArmor extends ArmorReference {
  currentHp: number;
  maxHp: number;
  cooldownsUsed?: Record<string, string>;
}

// Character's equipped armor by slot
export type EquippedArmor = Partial<Record<ArmorSlot, ArmorInstance>>;

// ============================================================================
// ACCESSORIES
// ============================================================================

// Reference data: Accessory template (non-slot equipment)
export interface AccessoryReference {
  id: string;
  name: string;
  baseHp: number;
  effect: string;
  special?: EquipmentAbility;
  notes?: string;
}

// Instance data
export interface AccessoryInstance {
  refId: string;
  currentHp: number;
}

// Resolved accessory
export interface ResolvedAccessory extends AccessoryReference {
  currentHp: number;
  maxHp: number;
}

// ============================================================================
// ITEMS (Non-equipment inventory)
// ============================================================================

// Item categories
export type ItemCategory = 'consumable' | 'component' | 'tool' | 'general';

// Reference data: Item template
export interface ItemReference {
  id: string;
  name: string;
  category: ItemCategory;
  description?: string;
  effect?: string;            // For consumables
  value?: number;             // Base monetary value
  stackable: boolean;
  notes?: string;
}

// Instance data: Character's inventory item
export interface ItemInstance {
  refId: string;
  quantity: number;
  customName?: string;
}

// Resolved item
export interface ResolvedItem extends ItemReference {
  quantity: number;
  customName?: string;
}

// ============================================================================
// CHARACTER EQUIPMENT STRUCTURE
// ============================================================================

// How equipment is stored in character data
export interface CharacterEquipment {
  weapons: WeaponInstance[];
  armor: EquippedArmor;
  accessories: AccessoryInstance[];
}

// How inventory is stored in character data
export interface CharacterInventory {
  consumables: ItemInstance[];
  general: ItemInstance[];
}

// Fully resolved equipment for UI use
export interface ResolvedEquipment {
  weapons: ResolvedWeapon[];
  armor: Partial<Record<ArmorSlot, ResolvedArmor>>;
  accessories: ResolvedAccessory[];
}

export interface ResolvedInventory {
  consumables: ResolvedItem[];
  general: ResolvedItem[];
}
