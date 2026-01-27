/**
 * Lost Worlds - Equipment System
 * 
 * Equipment is split into Reference (template) and Instance (character's copy)
 * - Reference data lives in /data/reference/
 * - Instance data lives in character files
 * - Services resolve references at runtime
 * 
 * All equipment can have HP and be damaged.
 * 
 * Updated: Added comprehensive weapon types, armor materials, cosmic weapon sources,
 * and expanded consumable categories from the Lost Worlds Rule Book.
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
  cooldown?: string;          // "12 hours", "1 hour", "Passive", etc.
  usesPerCooldown?: number;   // How many times per cooldown period
}

// Damage reduction type
export interface DamageReduction {
  dice: string;       // "1D4", "1D8", "2D10", etc.
  check?: DefenseCheck;
}

// ============================================================================
// WEAPONS
// ============================================================================

// Weapon categories (Earthly vs Cosmic)
export type WeaponCategory = 'earthly' | 'cosmic';

// Cosmic entity sources for cosmic weapons
export type CosmicWeaponSource = 
  | 'kalaprae'     // The Artful Performer
  | 'nimietara'    // The Queen of Abundance
  | 'inrashu'      // The Subservient King of Scarcity
  | 'inishi'       // The Determined Artisan
  | 'varinalum';   // The Eternal Sentinel

// Weapon types from the Lost Worlds Rule Book
export type WeaponType = 
  // Bladed
  | 'sickle-blade'
  | 'long-sword'
  | 'short-sword'
  | 'dagger'
  // Impact
  | 'meteor-hammer'
  | 'war-hammer'
  | 'blunt'
  | 'axe'
  // Reach
  | 'polearm'
  // Ranged
  | 'bow'
  | 'crossbow'
  | 'thrown'
  // Firearms
  | 'pistol'
  | 'revolver'
  // Special
  | 'war-fan'
  | 'whip'
  | 'gauntlet'
  | 'shield'
  | 'improvised'
  // Legacy (for backwards compatibility)
  | 'sword'
  | 'club'
  | 'staff'
  | 'throwing'
  | '1h-weapon'
  | '2h-weapon'
  | 'unarmed';

// Reference data: Weapon template (lives in reference/weapons.json)
export interface WeaponReference {
  id: string;
  name: string;
  type: WeaponType;
  category: WeaponCategory;
  damage: string;             // "1D6 + SPD", "2D12 + MIT"
  range: string;              // "Melee", "30 ft", "15 ft"
  apCost: number;
  resourceCost?: ResourceCost;
  baseHp: number;             // All weapons have HP
  special?: string;           // Special effect description
  cost?: number;              // Base monetary cost
  levelRequirement?: number;  // Minimum level to use effectively
  cosmicSource?: CosmicWeaponSource;  // For cosmic weapons only
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
  | 'peacekeeper'
  | 'none';

// Armor material types
export type ArmorMaterial = 
  | 'cloth'
  | 'leather'
  | 'metal';

// Reference data: Armor template
export interface ArmorReference {
  id: string;
  name: string;
  slot: ArmorSlot;
  set?: ArmorSet;
  material?: ArmorMaterial;
  baseHp: number;
  damageReduction: DamageReduction;
  special?: EquipmentAbility;
  statBonus?: Partial<Record<StatAbbr, number>>;  // e.g., Elementalist Boots: +5 SPD
  cost?: number;
  levelRequirement?: number;
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
  cost?: number;
  levelRequirement?: number;
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

// Consumable sub-categories
export type ConsumableType = 
  | 'healing-potion'
  | 'vigor-potion'
  | 'clarity-potion'
  | 'speed-potion'
  | 'utility-potion'
  | 'food'
  | 'drink'
  | 'bandage';

// Resource type that can be restored
export type RestorableResource = 'HP' | 'ST' | 'SY';

// Restoration effect for consumables
export interface RestorationEffect {
  resource: RestorableResource;
  dice: string;        // "2D10", "4D10", etc.
  flatBonus?: number;  // Additional flat amount
}

// Temporary effect from consumables
export interface TemporaryEffect {
  type: 'movement' | 'ap' | 'stat' | 'special';
  stat?: StatAbbr;
  amount: number;       // Can be positive or negative
  duration: string;     // "5 minutes", "3 minutes", "1 turn"
  afterEffect?: {       // Effect that occurs after duration ends
    type: 'movement' | 'ap' | 'stat' | 'exhausted';
    amount?: number;
    duration?: string;
  };
}

// Reference data: Item template
export interface ItemReference {
  id: string;
  name: string;
  category: ItemCategory;
  consumableType?: ConsumableType;  // For consumables
  description?: string;
  effect?: string;                   // Text description of effect
  restoration?: RestorationEffect[]; // Structured restoration data
  temporaryEffects?: TemporaryEffect[]; // For potions with temporary buffs
  value?: number;                    // Base monetary value
  cost?: number;                     // Purchase cost (may differ from value)
  levelRequirement?: number;
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

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a weapon is cosmic
 */
export function isCosmicWeapon(weapon: WeaponReference): boolean {
  return weapon.category === 'cosmic';
}

/**
 * Get display name for cosmic source
 */
export function getCosmicSourceDisplayName(source: CosmicWeaponSource): string {
  const names: Record<CosmicWeaponSource, string> = {
    kalaprae: 'Kalaprae, the Artful Performer',
    nimietara: 'Nimietara, the Queen of Abundance',
    inrashu: 'Inrashu, the Subservient King of Scarcity',
    inishi: 'Inishi, the Determined Artisan',
    varinalum: 'Varinalum, the Eternal Sentinel'
  };
  return names[source];
}

/**
 * Get display name for armor material
 */
export function getArmorMaterialDisplayName(material: ArmorMaterial): string {
  const names: Record<ArmorMaterial, string> = {
    cloth: 'Cloth',
    leather: 'Leather',
    metal: 'Metal'
  };
  return names[material];
}

/**
 * Get display name for weapon type
 */
export function getWeaponTypeDisplayName(type: WeaponType): string {
  const names: Record<WeaponType, string> = {
    'sickle-blade': 'Sickle Blade',
    'long-sword': 'Long Sword',
    'short-sword': 'Short Sword',
    'dagger': 'Dagger',
    'meteor-hammer': 'Meteor Hammer',
    'war-hammer': 'War Hammer',
    'blunt': 'Blunt Weapon',
    'axe': 'Axe',
    'polearm': 'Polearm',
    'bow': 'Bow',
    'crossbow': 'Crossbow',
    'thrown': 'Thrown',
    'pistol': 'Pistol',
    'revolver': 'Revolver',
    'war-fan': 'War Fan',
    'whip': 'Whip',
    'gauntlet': 'Gauntlet',
    'shield': 'Shield',
    'improvised': 'Improvised',
    'sword': 'Sword',
    'club': 'Club',
    'staff': 'Staff',
    'throwing': 'Throwing',
    '1h-weapon': 'One-Handed Weapon',
    '2h-weapon': 'Two-Handed Weapon',
    'unarmed': 'Unarmed'
  };
  return names[type] || type;
}