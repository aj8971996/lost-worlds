import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReferenceDataService } from '@core/services/reference-data.service';
import {
  WeaponReference,
  ArmorReference,
  ItemReference,
  AccessoryReference,
  WeaponType,
  WeaponCategory,
  CosmicWeaponSource,
  ArmorSlot,
  ArmorSet,
  ArmorMaterial,
  ItemCategory,
  ConsumableType,
  getWeaponTypeDisplayName,
  getCosmicSourceDisplayName,
  getArmorMaterialDisplayName,
  isCosmicWeapon
} from '@core/models/equipment.model';

// =========================================================================
// INTERFACES
// =========================================================================

// Unified equipment item for display
type EquipmentCategory = 'weapon' | 'armor' | 'item' | 'accessory';

interface DisplayEquipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  // Common fields
  baseHp: number;
  cost?: number;
  levelRequirement?: number;
  notes?: string;
  // Weapon fields
  weaponType?: WeaponType;
  weaponCategory?: WeaponCategory;
  cosmicSource?: CosmicWeaponSource;
  damage?: string;
  range?: string;
  apCost?: number;
  special?: string;
  // Armor fields
  armorSlot?: ArmorSlot;
  armorSet?: ArmorSet;
  armorMaterial?: ArmorMaterial;
  damageReduction?: string;
  armorSpecial?: string;
  statBonus?: Record<string, number>;
  // Item fields
  itemCategory?: ItemCategory;
  consumableType?: ConsumableType;
  description?: string;
  effect?: string;
  stackable?: boolean;
  // Accessory fields
  accessoryEffect?: string;
}

// Filter state interface
interface EquipmentFilters {
  search: string;
  categories: Set<EquipmentCategory>;
  // Weapon filters
  weaponTypes: Set<string>;
  weaponCategories: Set<WeaponCategory>;
  cosmicSources: Set<CosmicWeaponSource>;
  // Armor filters
  armorSlots: Set<ArmorSlot>;
  armorSets: Set<ArmorSet>;
  armorMaterials: Set<ArmorMaterial>;
  // Item filters
  itemCategories: Set<ItemCategory>;
  consumableTypes: Set<ConsumableType>;
}

// =========================================================================
// COMPONENT
// =========================================================================

@Component({
  selector: 'app-equipment-browser',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './equipment-browser.html',
  styleUrl: './equipment-browser.scss'
})
export class EquipmentBrowserComponent implements OnInit {
  private readonly refData = inject(ReferenceDataService);

  // Expose Object to template
  protected readonly Object = Object;

  // =========================================================================
  // STATE
  // =========================================================================

  equipment = signal<DisplayEquipment[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  // Mobile filters drawer state
  isMobileFiltersOpen = signal(false);

  // Expanded equipment state
  expandedEquipment = signal<Set<string>>(new Set());

  // Filter state
  filters = signal<EquipmentFilters>({
    search: '',
    categories: new Set(),
    weaponTypes: new Set(),
    weaponCategories: new Set(),
    cosmicSources: new Set(),
    armorSlots: new Set(),
    armorSets: new Set(),
    armorMaterials: new Set(),
    itemCategories: new Set(),
    consumableTypes: new Set()
  });

  // Collapsible filter sections state
  expandedSections = signal<Set<string>>(new Set(['categories', 'weaponTypes']));

  // =========================================================================
  // STATIC DATA
  // =========================================================================

  readonly mainCategories: { id: EquipmentCategory; name: string; icon: string; color: string }[] = [
    { id: 'weapon', name: 'Weapons', icon: 'swords', color: '#e74c3c' },
    { id: 'armor', name: 'Armor', icon: 'shield', color: '#3498db' },
    { id: 'item', name: 'Items', icon: 'inventory_2', color: '#2ecc71' },
    { id: 'accessory', name: 'Accessories', icon: 'diamond', color: '#9b59b6' }
  ];

  readonly weaponCategories: { id: WeaponCategory; name: string; color: string }[] = [
    { id: 'earthly', name: 'Earthly', color: '#4caf50' },
    { id: 'cosmic', name: 'Cosmic', color: '#9370db' }
  ];

  readonly weaponTypeGroups: { group: string; types: { id: string; name: string }[] }[] = [
    {
      group: 'Bladed',
      types: [
        { id: 'sickle-blade', name: 'Sickle Blade' },
        { id: 'long-sword', name: 'Long Sword' },
        { id: 'short-sword', name: 'Short Sword' },
        { id: 'dagger', name: 'Dagger' }
      ]
    },
    {
      group: 'Impact',
      types: [
        { id: 'meteor-hammer', name: 'Meteor Hammer' },
        { id: 'war-hammer', name: 'War Hammer' },
        { id: 'blunt', name: 'Blunt' },
        { id: 'axe', name: 'Axe' }
      ]
    },
    {
      group: 'Reach & Ranged',
      types: [
        { id: 'polearm', name: 'Polearm' },
        { id: 'bow', name: 'Bow' },
        { id: 'crossbow', name: 'Crossbow' },
        { id: 'thrown', name: 'Thrown' }
      ]
    },
    {
      group: 'Firearms',
      types: [
        { id: 'pistol', name: 'Pistol' },
        { id: 'revolver', name: 'Revolver' }
      ]
    },
    {
      group: 'Special',
      types: [
        { id: 'war-fan', name: 'War Fan' },
        { id: 'whip', name: 'Whip' },
        { id: 'gauntlet', name: 'Gauntlet' },
        { id: 'shield', name: 'Shield' },
        { id: 'improvised', name: 'Improvised' }
      ]
    }
  ];

  readonly cosmicSources: { id: CosmicWeaponSource; name: string; color: string }[] = [
    { id: 'kalaprae', name: 'Kalaprae', color: '#e91e63' },
    { id: 'nimietara', name: 'Nimietara', color: '#ff9800' },
    { id: 'inrashu', name: 'Inrashu', color: '#00bcd4' },
    { id: 'inishi', name: 'Inishi', color: '#8bc34a' },
    { id: 'varinalum', name: 'Varinalum', color: '#607d8b' }
  ];

  readonly armorSlots: { id: ArmorSlot; name: string }[] = [
    { id: 'head', name: 'Head' },
    { id: 'shoulders', name: 'Shoulders' },
    { id: 'chest', name: 'Chest' },
    { id: 'arms', name: 'Arms' },
    { id: 'gloves', name: 'Gloves' },
    { id: 'legs', name: 'Legs' },
    { id: 'boots', name: 'Boots' }
  ];

  readonly armorSets: { id: ArmorSet; name: string; color: string }[] = [
    { id: 'beast-handler', name: 'Beast Handler', color: '#8d6e63' },
    { id: 'elementalist', name: 'Elementalist', color: '#7e57c2' },
    { id: 'peacekeeper', name: 'Peacekeeper', color: '#546e7a' }
  ];

  readonly armorMaterials: { id: ArmorMaterial; name: string }[] = [
    { id: 'cloth', name: 'Cloth' },
    { id: 'leather', name: 'Leather' },
    { id: 'metal', name: 'Metal' }
  ];

  readonly itemCategories: { id: ItemCategory; name: string }[] = [
    { id: 'consumable', name: 'Consumable' },
    { id: 'component', name: 'Component' },
    { id: 'tool', name: 'Tool' },
    { id: 'general', name: 'General' }
  ];

  readonly consumableTypes: { id: ConsumableType; name: string }[] = [
    { id: 'healing-potion', name: 'Healing Potion' },
    { id: 'vigor-potion', name: 'Vigor Potion' },
    { id: 'clarity-potion', name: 'Clarity Potion' },
    { id: 'speed-potion', name: 'Speed Potion' },
    { id: 'utility-potion', name: 'Utility Potion' },
    { id: 'food', name: 'Food' },
    { id: 'drink', name: 'Drink' },
    { id: 'bandage', name: 'Bandage' }
  ];

  // =========================================================================
  // COMPUTED
  // =========================================================================

  filteredEquipment = computed(() => {
    const all = this.equipment();
    const f = this.filters();

    return all.filter(item => {
      // Search filter
      if (f.search) {
        const searchLower = f.search.toLowerCase();
        const matchesSearch =
          item.name.toLowerCase().includes(searchLower) ||
          (item.description?.toLowerCase().includes(searchLower) ?? false) ||
          (item.special?.toLowerCase().includes(searchLower) ?? false) ||
          (item.effect?.toLowerCase().includes(searchLower) ?? false) ||
          (item.notes?.toLowerCase().includes(searchLower) ?? false);
        if (!matchesSearch) return false;
      }

      // Build effective categories: explicit selections + implicit from sub-filters
      // This ensures that selecting a weapon type (e.g., "Sickle Blade") implicitly
      // filters to weapons only, rather than showing all armor/items too
      const hasWeaponSubFilters = f.weaponTypes.size > 0 || f.weaponCategories.size > 0 || f.cosmicSources.size > 0;
      const hasArmorSubFilters = f.armorSlots.size > 0 || f.armorSets.size > 0 || f.armorMaterials.size > 0;
      const hasItemSubFilters = f.itemCategories.size > 0 || f.consumableTypes.size > 0;

      const effectiveCategories = new Set(f.categories);
      if (hasWeaponSubFilters) effectiveCategories.add('weapon');
      if (hasArmorSubFilters) effectiveCategories.add('armor');
      if (hasItemSubFilters) effectiveCategories.add('item');

      // Apply category filter if any categories are selected (explicit or implicit)
      if (effectiveCategories.size > 0) {
        if (!effectiveCategories.has(item.category)) return false;
      }

      // Weapon-specific filters
      if (item.category === 'weapon') {
        if (f.weaponTypes.size > 0) {
          if (!item.weaponType || !f.weaponTypes.has(item.weaponType)) return false;
        }
        if (f.weaponCategories.size > 0) {
          if (!item.weaponCategory || !f.weaponCategories.has(item.weaponCategory)) return false;
        }
        if (f.cosmicSources.size > 0) {
          if (!item.cosmicSource || !f.cosmicSources.has(item.cosmicSource)) return false;
        }
      }

      // Armor-specific filters
      if (item.category === 'armor') {
        if (f.armorSlots.size > 0) {
          if (!item.armorSlot || !f.armorSlots.has(item.armorSlot)) return false;
        }
        if (f.armorSets.size > 0) {
          if (!item.armorSet || !f.armorSets.has(item.armorSet)) return false;
        }
        if (f.armorMaterials.size > 0) {
          if (!item.armorMaterial || !f.armorMaterials.has(item.armorMaterial)) return false;
        }
      }

      // Item-specific filters
      if (item.category === 'item') {
        if (f.itemCategories.size > 0) {
          if (!item.itemCategory || !f.itemCategories.has(item.itemCategory)) return false;
        }
        if (f.consumableTypes.size > 0) {
          if (!item.consumableType || !f.consumableTypes.has(item.consumableType)) return false;
        }
      }

      return true;
    });
  });

  activeFilterCount = computed(() => {
    const f = this.filters();
    return f.categories.size +
      f.weaponTypes.size +
      f.weaponCategories.size +
      f.cosmicSources.size +
      f.armorSlots.size +
      f.armorSets.size +
      f.armorMaterials.size +
      f.itemCategories.size +
      f.consumableTypes.size;
  });

  // Check if any weapon filters are active
  hasWeaponFilters = computed(() => {
    const f = this.filters();
    return f.categories.has('weapon') || f.weaponTypes.size > 0 || 
           f.weaponCategories.size > 0 || f.cosmicSources.size > 0;
  });

  // Check if any armor filters are active
  hasArmorFilters = computed(() => {
    const f = this.filters();
    return f.categories.has('armor') || f.armorSlots.size > 0 || 
           f.armorSets.size > 0 || f.armorMaterials.size > 0;
  });

  // Check if any item filters are active
  hasItemFilters = computed(() => {
    const f = this.filters();
    return f.categories.has('item') || f.itemCategories.size > 0 || 
           f.consumableTypes.size > 0;
  });

  // =========================================================================
  // LIFECYCLE
  // =========================================================================

  ngOnInit(): void {
    this.loadEquipment();
  }

  private loadEquipment(): void {
    this.refData.loadAllReferenceData().subscribe({
      next: (data) => {
        const items: DisplayEquipment[] = [];

        // Process weapons
        if (data.weapons) {
          for (const weapon of Object.values(data.weapons)) {
            items.push(this.mapWeapon(weapon));
          }
        }

        // Process armor
        if (data.armor) {
          for (const armor of Object.values(data.armor)) {
            items.push(this.mapArmor(armor));
          }
        }

        // Process items
        if (data.items) {
          for (const item of Object.values(data.items)) {
            items.push(this.mapItem(item));
          }
        }

        // Process accessories
        if (data.accessories) {
          for (const accessory of Object.values(data.accessories)) {
            items.push(this.mapAccessory(accessory));
          }
        }

        // Sort by name
        items.sort((a, b) => a.name.localeCompare(b.name));

        this.equipment.set(items);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load equipment:', err);
        this.error.set('Failed to load equipment data.');
        this.isLoading.set(false);
      }
    });
  }

  private mapWeapon(weapon: WeaponReference): DisplayEquipment {
    return {
      id: weapon.id,
      name: weapon.name,
      category: 'weapon',
      baseHp: weapon.baseHp,
      cost: weapon.cost,
      levelRequirement: weapon.levelRequirement,
      notes: weapon.notes,
      weaponType: weapon.type,
      weaponCategory: weapon.category,
      cosmicSource: weapon.cosmicSource,
      damage: weapon.damage,
      range: weapon.range,
      apCost: weapon.apCost,
      special: weapon.special
    };
  }

  private mapArmor(armor: ArmorReference): DisplayEquipment {
    return {
      id: armor.id,
      name: armor.name,
      category: 'armor',
      baseHp: armor.baseHp,
      cost: armor.cost,
      levelRequirement: armor.levelRequirement,
      notes: armor.notes,
      armorSlot: armor.slot,
      armorSet: armor.set,
      armorMaterial: armor.material,
      damageReduction: armor.damageReduction?.dice,
      armorSpecial: armor.special?.effect,
      statBonus: armor.statBonus as Record<string, number>
    };
  }

  private mapItem(item: ItemReference): DisplayEquipment {
    return {
      id: item.id,
      name: item.name,
      category: 'item',
      baseHp: 0,
      cost: item.cost,
      levelRequirement: item.levelRequirement,
      notes: item.notes,
      itemCategory: item.category,
      consumableType: item.consumableType,
      description: item.description,
      effect: item.effect,
      stackable: item.stackable
    };
  }

  private mapAccessory(accessory: AccessoryReference): DisplayEquipment {
    return {
      id: accessory.id,
      name: accessory.name,
      category: 'accessory',
      baseHp: accessory.baseHp,
      cost: accessory.cost,
      levelRequirement: accessory.levelRequirement,
      notes: accessory.notes,
      accessoryEffect: accessory.effect
    };
  }

  // =========================================================================
  // EQUIPMENT EXPANSION
  // =========================================================================

  toggleEquipmentExpanded(itemId: string): void {
    this.expandedEquipment.update(set => {
      const newSet = new Set(set);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }

  isEquipmentExpanded(itemId: string): boolean {
    return this.expandedEquipment().has(itemId);
  }

  // =========================================================================
  // MOBILE FILTER DRAWER METHODS
  // =========================================================================

  openMobileFilters(): void {
    this.isMobileFiltersOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeMobileFilters(): void {
    this.isMobileFiltersOpen.set(false);
    document.body.style.overflow = '';
  }

  // =========================================================================
  // FILTER METHODS
  // =========================================================================

  updateSearch(value: string): void {
    this.filters.update(f => ({ ...f, search: value }));
  }

  toggleFilter(category: keyof Omit<EquipmentFilters, 'search'>, value: string): void {
    this.filters.update(f => {
      const newSet = new Set(f[category] as Set<string>);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return { ...f, [category]: newSet };
    });
  }

  isFilterActive(category: keyof Omit<EquipmentFilters, 'search'>, value: string): boolean {
    return (this.filters()[category] as Set<string>).has(value);
  }

  clearAllFilters(): void {
    this.filters.set({
      search: '',
      categories: new Set(),
      weaponTypes: new Set(),
      weaponCategories: new Set(),
      cosmicSources: new Set(),
      armorSlots: new Set(),
      armorSets: new Set(),
      armorMaterials: new Set(),
      itemCategories: new Set(),
      consumableTypes: new Set()
    });
  }

  // =========================================================================
  // FILTER SECTION TOGGLE
  // =========================================================================

  toggleSection(sectionId: string): void {
    this.expandedSections.update(sections => {
      const newSections = new Set(sections);
      if (newSections.has(sectionId)) {
        newSections.delete(sectionId);
      } else {
        newSections.add(sectionId);
      }
      return newSections;
    });
  }

  isSectionExpanded(sectionId: string): boolean {
    return this.expandedSections().has(sectionId);
  }

  // =========================================================================
  // DISPLAY HELPERS
  // =========================================================================

  getCategoryIcon(category: EquipmentCategory): string {
    const cat = this.mainCategories.find(c => c.id === category);
    return cat?.icon || 'inventory_2';
  }

  getCategoryColor(category: EquipmentCategory): string {
    const cat = this.mainCategories.find(c => c.id === category);
    return cat?.color || '#888';
  }

  getWeaponTypeDisplay(type: WeaponType): string {
    return getWeaponTypeDisplayName(type);
  }

  getCosmicSourceDisplay(source: CosmicWeaponSource): string {
    return getCosmicSourceDisplayName(source);
  }

  getCosmicSourceShortName(source: CosmicWeaponSource): string {
    const names: Record<CosmicWeaponSource, string> = {
      kalaprae: 'Kalaprae',
      nimietara: 'Nimietara',
      inrashu: 'Inrashu',
      inishi: 'Inishi',
      varinalum: 'Varinalum'
    };
    return names[source];
  }

  getCosmicSourceColor(source: CosmicWeaponSource): string {
    const colors: Record<CosmicWeaponSource, string> = {
      kalaprae: '#e91e63',
      nimietara: '#ff9800',
      inrashu: '#00bcd4',
      inishi: '#8bc34a',
      varinalum: '#607d8b'
    };
    return colors[source];
  }

  getArmorMaterialDisplay(material: ArmorMaterial): string {
    return getArmorMaterialDisplayName(material);
  }

  getArmorSetColor(set: ArmorSet): string {
    const setData = this.armorSets.find(s => s.id === set);
    return setData?.color || '#888';
  }

  formatSlotName(slot: ArmorSlot): string {
    return slot.charAt(0).toUpperCase() + slot.slice(1);
  }

  formatSetName(set: ArmorSet): string {
    return set.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  formatConsumableType(type: ConsumableType): string {
    return type.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  // Get preview text for equipment row
  getPreviewText(item: DisplayEquipment): string {
    switch (item.category) {
      case 'weapon':
        return item.damage || '';
      case 'armor':
        return item.damageReduction ? `DR: ${item.damageReduction}` : '';
      case 'item':
        return item.effect?.substring(0, 40) + (item.effect && item.effect.length > 40 ? '...' : '') || '';
      case 'accessory':
        return item.accessoryEffect?.substring(0, 40) + (item.accessoryEffect && item.accessoryEffect.length > 40 ? '...' : '') || '';
      default:
        return '';
    }
  }
}