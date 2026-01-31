import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CharacterService } from '@core/services/character.service';
import { ResolvedCharacter, OverallAlignment } from '@core/models/character.model';
import { 
  ArmorSlot, 
  ResourceCost,
  ResolvedWeapon,
  ResolvedArmor,
  ResolvedItem,
  ResolvedAccessory,
  WeaponCategory,
  CosmicWeaponSource,
  ArmorMaterial,
  ArmorSet,
  getCosmicSourceDisplayName,
  getArmorMaterialDisplayName,
  getWeaponTypeDisplayName,
  isCosmicWeapon
} from '@core/models/equipment.model';
import { 
  AbilitySource, 
  ComponentCost, 
  ResolvedAbility, 
  AbilityDamage, 
  AbilityHealing,
  formatDamage,
  formatHealing,
  isReactionAbility,
  isSummonAbility,
  hasCollegeAndFocus
} from '@core/models/ability.model';
import { calculateMod, calculateDice } from '@core/models/stats.model';
import { calculateCollegeProgression, FocusLevels, MagicCollege } from '@core/models/magic.model';

interface SchoolLevel {
  schoolId: string;
  schoolName: string;
  totalLevels: number;
  focuses: { id: string; level: number }[];
}

@Component({
  selector: 'app-character-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './character-detail.component.html',
  styleUrl: './character-detail.component.scss'
})
export class CharacterDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly characterService = inject(CharacterService);

  character = signal<ResolvedCharacter | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  expandedAbilities = signal<Set<string>>(new Set());
  expandedWeapons = signal<Set<string>>(new Set());
  expandedItems = signal<Set<string>>(new Set());

  readonly armorSlots: ArmorSlot[] = ['head', 'shoulders', 'chest', 'arms', 'gloves', 'legs', 'boots'];

  private readonly focusToSchool: Record<string, { school: string; schoolName: string }> = {
    // Cosmic - Stars
    divination: { school: 'stars', schoolName: 'School of Stars' },
    fate: { school: 'stars', schoolName: 'School of Stars' },
    prophecy: { school: 'stars', schoolName: 'School of Stars' },
    constellations: { school: 'stars', schoolName: 'School of Stars' },
    // Cosmic - Light
    radiance: { school: 'light', schoolName: 'School of Light' },
    protection: { school: 'light', schoolName: 'School of Light' },
    purification: { school: 'light', schoolName: 'School of Light' },
    // Cosmic - Time
    acceleration: { school: 'time', schoolName: 'School of Time' },
    delay: { school: 'time', schoolName: 'School of Time' },
    future: { school: 'time', schoolName: 'School of Time' },
    past: { school: 'time', schoolName: 'School of Time' },
    // Cosmic - Void
    shadow: { school: 'void', schoolName: 'School of Void' },
    emptiness: { school: 'void', schoolName: 'School of Void' },
    concealment: { school: 'void', schoolName: 'School of Void' },
    // Cosmic - Realms
    plasma: { school: 'realms', schoolName: 'School of Realms' },
    aether: { school: 'realms', schoolName: 'School of Realms' },
    gravity: { school: 'realms', schoolName: 'School of Realms' },
    ether: { school: 'realms', schoolName: 'School of Realms' },
    // Earthly - Elements
    earth: { school: 'elements', schoolName: 'School of Elements' },
    water: { school: 'elements', schoolName: 'School of Elements' },
    fire: { school: 'elements', schoolName: 'School of Elements' },
    air: { school: 'elements', schoolName: 'School of Elements' },
    // Earthly - Life
    healing: { school: 'life', schoolName: 'School of Life' },
    growth: { school: 'life', schoolName: 'School of Life' },
    plants: { school: 'life', schoolName: 'School of Life' },
    beasts: { school: 'life', schoolName: 'School of Life' },
    // Earthly - Speech
    performance: { school: 'speech', schoolName: 'School of Speech' },
    rhetoric: { school: 'speech', schoolName: 'School of Speech' },
    jest: { school: 'speech', schoolName: 'School of Speech' },
    verse: { school: 'speech', schoolName: 'School of Speech' },
    // Earthly - Body
    strength: { school: 'body', schoolName: 'School of Body' },
    speed: { school: 'body', schoolName: 'School of Body' },
    endurance: { school: 'body', schoolName: 'School of Body' },
    weaponArts: { school: 'body', schoolName: 'School of Body' },
    martialArts: { school: 'body', schoolName: 'School of Body' },
    senses: { school: 'body', schoolName: 'School of Body' },
    // Earthly - Craft
    weapons: { school: 'craft', schoolName: 'School of Craft' },
    wards: { school: 'craft', schoolName: 'School of Craft' },
    tools: { school: 'craft', schoolName: 'School of Craft' },
    items: { school: 'craft', schoolName: 'School of Craft' },
    enchantment: { school: 'craft', schoolName: 'School of Craft' },
    // Dead - Decay
    disease: { school: 'decay', schoolName: 'School of Decay' },
    entropy: { school: 'decay', schoolName: 'School of Decay' },
    withering: { school: 'decay', schoolName: 'School of Decay' },
    rot: { school: 'decay', schoolName: 'School of Decay' },
    // Dead - Damned
    pacts: { school: 'damned', schoolName: 'School of Damned' },
    corruption: { school: 'damned', schoolName: 'School of Damned' },
    infernal: { school: 'damned', schoolName: 'School of Damned' },
    // Dead - Endings
    passage: { school: 'endings', schoolName: 'School of Endings' },
    finality: { school: 'endings', schoolName: 'School of Endings' },
    reaper: { school: 'endings', schoolName: 'School of Endings' },
  };

  cosmicSchools = computed(() => this.getSchoolLevels(this.character()?.magic.cosmic));
  earthlySchools = computed(() => this.getSchoolLevels(this.character()?.magic.earthly));
  deadSchools = computed(() => this.getSchoolLevels(this.character()?.magic.dead));

  trainedSkillsCount = computed(() => {
    const char = this.character();
    if (!char) return 0;
    return char.resolvedSkills.filter(s => s.level > 0).length;
  });

  // Computed: separate cosmic and earthly weapons
  cosmicWeapons = computed(() => {
    const char = this.character();
    if (!char) return [];
    return char.equipment.weapons.filter(w => w.category === 'cosmic');
  });

  earthlyWeapons = computed(() => {
    const char = this.character();
    if (!char) return [];
    return char.equipment.weapons.filter(w => w.category === 'earthly');
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCharacter(id);
    } else {
      this.error.set('No character ID provided');
      this.isLoading.set(false);
    }
  }

  private loadCharacter(id: string): void {
    this.characterService.getResolvedCharacter(id).subscribe({
      next: (character) => {
        if (character) {
          this.character.set(character);
        } else {
          this.error.set(`Character "${id}" could not be found.`);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load character:', err);
        this.error.set('Failed to load character data.');
        this.isLoading.set(false);
      }
    });
  }

  // =========================================================================
  // EXPANSION TOGGLES
  // =========================================================================

  toggleAbilityExpanded(abilityId: string): void {
    this.expandedAbilities.update(set => {
      const newSet = new Set(set);
      if (newSet.has(abilityId)) {
        newSet.delete(abilityId);
      } else {
        newSet.add(abilityId);
      }
      return newSet;
    });
  }

  isAbilityExpanded(abilityId: string): boolean {
    return this.expandedAbilities().has(abilityId);
  }

  toggleWeaponExpanded(weaponId: string): void {
    this.expandedWeapons.update(set => {
      const newSet = new Set(set);
      if (newSet.has(weaponId)) {
        newSet.delete(weaponId);
      } else {
        newSet.add(weaponId);
      }
      return newSet;
    });
  }

  isWeaponExpanded(weaponId: string): boolean {
    return this.expandedWeapons().has(weaponId);
  }

  toggleItemExpanded(itemId: string): void {
    this.expandedItems.update(set => {
      const newSet = new Set(set);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }

  isItemExpanded(itemId: string): boolean {
    return this.expandedItems().has(itemId);
  }

  // =========================================================================
  // WEAPON HELPERS
  // =========================================================================

  isCosmicWeapon(weapon: ResolvedWeapon): boolean {
    return weapon.category === 'cosmic';
  }

  getWeaponCategoryDisplay(category: WeaponCategory): string {
    return category === 'cosmic' ? 'Cosmic' : 'Earthly';
  }

  getCosmicSourceName(source: CosmicWeaponSource): string {
    return getCosmicSourceDisplayName(source);
  }

  getWeaponTypeName(type: string): string {
    return getWeaponTypeDisplayName(type as any);
  }

  hasWeaponSpecial(weapon: ResolvedWeapon): boolean {
    return !!weapon.special || !!weapon.cosmicSource || !!weapon.notes;
  }

  getWeaponHpPercent(weapon: ResolvedWeapon): number {
    return this.getResourcePercent(weapon.currentHp, weapon.maxHp);
  }

  // =========================================================================
  // ARMOR HELPERS
  // =========================================================================

  getArmorMaterialName(material: ArmorMaterial | undefined): string {
    if (!material) return '';
    return getArmorMaterialDisplayName(material);
  }

  getArmorSetName(set: ArmorSet | undefined): string {
    if (!set || set === 'none') return '';
    const names: Record<ArmorSet, string> = {
      'elementalist': 'Elementalist',
      'beast-handler': 'Beast Handler',
      'peacekeeper': 'Peacekeeper',
      'none': ''
    };
    return names[set] || '';
  }

  hasArmorSpecial(armor: ResolvedArmor): boolean {
    return !!armor.special || !!armor.statBonus || !!armor.notes;
  }

  formatDamageReduction(armor: ResolvedArmor): string {
    if (!armor.damageReduction) return '';
    const dr = armor.damageReduction;
    let result = dr.dice;
    if (dr.check) {
      result += ` (${dr.check.stats.join('/')} vs ${dr.check.difficulty})`;
    }
    return result;
  }

  getArmorStatBonuses(armor: ResolvedArmor): string[] {
    if (!armor.statBonus) return [];
    return Object.entries(armor.statBonus).map(([stat, value]) => 
      `${value > 0 ? '+' : ''}${value} ${stat}`
    );
  }

  // =========================================================================
  // ITEM HELPERS
  // =========================================================================

  hasItemDetails(item: ResolvedItem): boolean {
    return !!item.description || !!item.effect || 
          (item.restoration?.length ?? 0) > 0 ||
          (item.temporaryEffects?.length ?? 0) > 0;
  }

  formatRestoration(item: ResolvedItem): string[] {
    if (!item.restoration) return [];
    return item.restoration.map(r => {
      let result = `${r.dice}`;
      if (r.flatBonus) result += ` + ${r.flatBonus}`;
      result += ` ${r.resource}`;
      return result;
    });
  }

  formatTemporaryEffects(item: ResolvedItem): string[] {
    if (!item.temporaryEffects) return [];
    return item.temporaryEffects.map(effect => {
      let result = `${effect.amount > 0 ? '+' : ''}${effect.amount}`;
      if (effect.stat) result += ` ${effect.stat}`;
      else if (effect.type === 'movement') result += ' ft. movement';
      else if (effect.type === 'ap') result += ' AP';
      result += ` (${effect.duration})`;
      return result;
    });
  }

  getConsumableIcon(item: ResolvedItem): string {
    if (!item.consumableType) return 'science';
    const icons: Record<string, string> = {
      'healing-potion': 'healing',
      'vigor-potion': 'directions_run',
      'clarity-potion': 'psychology',
      'speed-potion': 'speed',
      'utility-potion': 'science',
      'food': 'restaurant',
      'drink': 'local_cafe',
      'bandage': 'medical_services'
    };
    return icons[item.consumableType] || 'science';
  }

  // =========================================================================
  // ACCESSORY HELPERS
  // =========================================================================

  hasAccessorySpecial(accessory: ResolvedAccessory): boolean {
    return !!accessory.special;
  }

  getAccessorySpecialCooldown(accessory: ResolvedAccessory): string {
    if (!accessory.special?.cooldown) return '';
    return accessory.special.cooldown;
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  getResourcePercent(current: number, max: number): number {
    if (max <= 0) return 0;
    return Math.min(100, Math.max(0, (current / max) * 100));
  }

  getMod(value: number): number {
    return calculateMod(value);
  }

  getDice(value: number): number {
    return calculateDice(value);
  }

  formatMod(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`;
  }

  hasComponents(): boolean {
    const char = this.character();
    if (!char) return false;
    return !!(char.components.focusPoints || char.components.lifeSeeds || 
              char.components.voidShards || char.components.craftPoints);
  }

  hasMagicFocuses(): boolean {
    return this.cosmicSchools().length > 0 || 
           this.earthlySchools().length > 0 || 
           this.deadSchools().length > 0;
  }

  private getSchoolLevels(focuses: FocusLevels | undefined): SchoolLevel[] {
    if (!focuses) return [];
    
    const schoolMap = new Map<string, SchoolLevel>();
    
    for (const [focusId, level] of Object.entries(focuses)) {
      if (level <= 0) continue;
      
      const schoolInfo = this.focusToSchool[focusId];
      if (!schoolInfo) continue;
      
      const existing = schoolMap.get(schoolInfo.school);
      if (existing) {
        existing.totalLevels += level;
        existing.focuses.push({ id: focusId, level });
      } else {
        schoolMap.set(schoolInfo.school, {
          schoolId: schoolInfo.school,
          schoolName: schoolInfo.schoolName,
          totalLevels: level,
          focuses: [{ id: focusId, level }]
        });
      }
    }
    
    return Array.from(schoolMap.values());
  }

  getCollegeDegree(college: MagicCollege): string {
    const char = this.character();
    if (!char) return 'None';
    
    const focuses = char.magic[college];
    const progression = calculateCollegeProgression(focuses);
    
    const degreeNames: Record<string, string> = {
      'none': 'None',
      'associates': "Associate's",
      'bachelors': "Bachelor's",
      'masters': "Master's",
      'doctorate': 'Doctorate'
    };
    
    return degreeNames[progression.degree] || 'None';
  }

  getAlignmentIcon(alignment: OverallAlignment): string {
    const icons: Record<OverallAlignment, string> = {
      'hero': 'shield_person',
      'villain': 'skull',
      'undecided': 'help'
    };
    return icons[alignment] || 'help';
  }

  formatAlignment(alignment: OverallAlignment): string {
    const names: Record<OverallAlignment, string> = {
      'hero': 'Hero',
      'villain': 'Villain',
      'undecided': 'Undecided'
    };
    return names[alignment] || alignment;
  }

  formatWeaponType(type: string): string {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  formatArmorSlot(slot: ArmorSlot): string {
    return slot.charAt(0).toUpperCase() + slot.slice(1);
  }

  formatFocusName(id: string): string {
    if (!id) return '';
    return id.split(/(?=[A-Z])/).join(' ')
      .split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
  }

  // =========================================================================
  // ABILITY SOURCE HELPERS
  // =========================================================================

  formatAbilitySource(source: AbilitySource): string {
    if (hasCollegeAndFocus(source)) {
      const collegeName = source.college.charAt(0).toUpperCase() + source.college.slice(1);
      const schoolName = source.school ? this.formatFocusName(source.school) : '';
      const focusName = this.formatFocusName(source.focus);
      if (schoolName) {
        return `${collegeName} · ${schoolName} · ${focusName}`;
      }
      return `${collegeName} Magic - ${focusName}`;
    }
    switch (source.type) {
      case 'skill':
        return `Skill: ${source.skillId}`;
      case 'species':
        return `Species: ${source.speciesId}`;
      case 'item':
        return `Item: ${source.itemId}`;
      case 'innate':
        return 'Innate Ability';
      default:
        return 'Unknown Source';
    }
  }

  getAbilityCollege(ability: ResolvedAbility): string | null {
    if (hasCollegeAndFocus(ability.source)) {
      return ability.source.college || null;
    }
    return null;
  }

  getAbilityFocus(ability: ResolvedAbility): string {
    if (hasCollegeAndFocus(ability.source)) {
      return this.formatFocusName(ability.source.focus);
    }
    return '';
  }

  getRequiredLevel(ability: ResolvedAbility): number {
    const source = ability.source;
    if (hasCollegeAndFocus(source)) {
      return source.requiredLevel;
    }
    if ('requiredLevel' in source) {
      return (source as any).requiredLevel ?? 1;
    }
    return 1;
  }

  // =========================================================================
  // ABILITY OUTPUT DISPLAY HELPERS
  // =========================================================================

  getDamageDisplay(ability: ResolvedAbility): string | null {
    if (!ability.damage) return null;
    
    if (typeof ability.damage === 'string') {
      return ability.damage;
    }
    
    return formatDamage(ability.damage);
  }

  getDamageType(ability: ResolvedAbility): string | null {
    if (!ability.damage || typeof ability.damage === 'string') {
      return null;
    }
    return (ability.damage as AbilityDamage).type;
  }

  getHealingDisplay(ability: ResolvedAbility): string | null {
    if (!ability.healing) return null;
    
    if (typeof ability.healing === 'string') {
      return ability.healing;
    }
    
    return formatHealing(ability.healing);
  }

  getSummonName(ability: ResolvedAbility): string {
    return ability.summon?.creature?.name ?? 'Summon';
  }

  getEffectSummary(ability: ResolvedAbility): string | null {
    const effects = ability.effects;
    if (!effects) return null;

    if (effects.diceModifiers?.length) {
      const mod = effects.diceModifiers[0];
      return `${mod.amount > 0 ? '+' : ''}${mod.amount} D20 ${mod.applies}`;
    }

    if (effects.statModifiers?.length) {
      const mod = effects.statModifiers[0];
      const statsText = mod.stats === 'all' ? 'all stats' : 
        Array.isArray(mod.stats) ? mod.stats.join(', ') : mod.stats;
      return `${mod.amount > 0 ? '+' : ''}${mod.amount} ${statsText}`;
    }

    if (effects.movement) {
      return `${effects.movement.amount > 0 ? '+' : ''}${effects.movement.amount} ft. movement`;
    }

    if (effects.damageReduction) {
      return `${effects.damageReduction.dice} damage reduction`;
    }

    if (effects.appliesConditions?.length) {
      return `Applies ${effects.appliesConditions[0].condition}`;
    }

    if (effects.removesConditions?.length) {
      return `Removes ${effects.removesConditions[0]}`;
    }

    if (effects.resistances?.length) {
      return `Resist ${effects.resistances[0]}`;
    }

    if (effects.grants?.length) {
      const grant = effects.grants[0];
      return grant.length > 25 ? grant.substring(0, 22) + '...' : grant;
    }

    if (effects.special?.length) {
      const special = effects.special[0];
      return special.length > 25 ? special.substring(0, 22) + '...' : special;
    }

    return null;
  }

  // =========================================================================
  // ABILITY TYPE HELPERS
  // =========================================================================

  isReaction(ability: ResolvedAbility): boolean {
    return isReactionAbility(ability);
  }

  isSummon(ability: ResolvedAbility): boolean {
    return isSummonAbility(ability);
  }

  hasSanityCost(ability: ResolvedAbility): boolean {
    return !!ability.sanityCost && ability.sanityCost > 0;
  }

  hasAnyCosts(ability: ResolvedAbility): boolean {
    return !!(
      ability.staminaCost ||
      ability.sanityCost ||
      (ability.componentCost && ability.componentCost.length > 0)
    );
  }

  // =========================================================================
  // COST FORMATTING METHODS
  // =========================================================================

  getCostIcon(type: string): string {
    const icons: Record<string, string> = {
      'AP': 'schedule',
      'ST': 'directions_run',
      'HP': 'favorite',
      'SY': 'psychology',
      'SR': 'star',
      'LR': 'light_mode',
      'Hours': 'hourglass_empty',
      'VS': 'dark_mode',
      'RP': 'public',
      'FP': 'adjust',
      'LS': 'eco',
      'CP': 'construction',
      'EP': 'whatshot',
      'SP': 'record_voice_over',
      'BP': 'fitness_center',
      'FE': 'skull',
      'DE': 'science',
      'DC': 'toll',
    };
    return icons[type] || 'toll';
  }

  getCostTypeName(type: string): string {
    const names: Record<string, string> = {
      'AP': 'Action Points',
      'ST': 'Stamina',
      'HP': 'Health',
      'SY': 'Sanity',
      'SR': 'Star Runes',
      'LR': 'Light Runes',
      'Hours': 'Hours',
      'VS': 'Void Shards',
      'RP': 'Realm Points',
      'FP': 'Focus Points',
      'LS': 'Life Seeds',
      'CP': 'Craft Points',
      'EP': 'Elemental Points',
      'SP': 'Speech Points',
      'BP': 'Body Points',
      'FE': 'Funeral Essence',
      'DE': 'Decay Essence',
      'DC': 'Damned Coins',
    };
    return names[type] || type;
  }

  formatComponentCost(cost: ComponentCost): string {
    if (cost.per) {
      return `${cost.amount} ${cost.type} per ${cost.per}`;
    }
    return `${cost.amount} ${cost.type}`;
  }

  hasResourceCosts(ability: ResolvedAbility): boolean {
    return !!(
      (ability.componentCost && ability.componentCost.length > 0) ||
      ability.staminaCost
    );
  }

  getAbilityCosts(ability: ResolvedAbility): Array<{ type: string; amount: number; per?: string }> {
    const costs: Array<{ type: string; amount: number; per?: string }> = [];
    
    if (ability.staminaCost) {
      costs.push({ type: 'ST', amount: ability.staminaCost });
    }
    
    if (ability.sanityCost) {
      costs.push({ type: 'SY', amount: ability.sanityCost });
    }
    
    if (ability.componentCost && ability.componentCost.length > 0) {
      costs.push(...ability.componentCost);
    }
    
    return costs;
  }
}