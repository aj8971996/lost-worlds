import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CharacterService } from '@core/services/character.service';
import { ResolvedCharacter, OverallAlignment } from '@core/models/character.model';
import { ArmorSlot, ResourceCost } from '@core/models/equipment.model';
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

// Interface for aggregated school levels
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

  // Expanded abilities state (independent - multiple can be open)
  expandedAbilities = signal<Set<string>>(new Set());

  readonly armorSlots: ArmorSlot[] = ['head', 'shoulders', 'chest', 'arms', 'gloves', 'legs', 'boots'];

  // Focus to School mapping
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

  // Computed values for magic schools (aggregated from focuses)
  cosmicSchools = computed(() => this.getSchoolLevels(this.character()?.magic.cosmic));
  earthlySchools = computed(() => this.getSchoolLevels(this.character()?.magic.earthly));
  deadSchools = computed(() => this.getSchoolLevels(this.character()?.magic.dead));

  trainedSkillsCount = computed(() => {
    const char = this.character();
    if (!char) return 0;
    return char.resolvedSkills.filter(s => s.level > 0).length;
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
  // ABILITY EXPANSION (INDEPENDENT - MULTIPLE CAN BE OPEN)
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

  /**
   * Aggregates focus levels into school-level totals
   */
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

  /**
   * Get the college from an ability source
   */
  getAbilityCollege(ability: ResolvedAbility): string | null {
    if (hasCollegeAndFocus(ability.source)) {
      return ability.source.college || null;
    }
    return null;
  }

  /**
   * Get the focus name from an ability source
   */
  getAbilityFocus(ability: ResolvedAbility): string {
    if (hasCollegeAndFocus(ability.source)) {
      return this.formatFocusName(ability.source.focus);
    }
    return '';
  }

  /**
   * Get required level from an ability source
   */
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

  /**
   * Get formatted damage string for display - handles both old string format and new AbilityDamage
   */
  getDamageDisplay(ability: ResolvedAbility): string | null {
    if (!ability.damage) return null;
    
    if (typeof ability.damage === 'string') {
      return ability.damage;
    }
    
    return formatDamage(ability.damage);
  }

  /**
   * Get damage type for styling
   */
  getDamageType(ability: ResolvedAbility): string | null {
    if (!ability.damage || typeof ability.damage === 'string') {
      return null;
    }
    return (ability.damage as AbilityDamage).type;
  }

  /**
   * Get formatted healing string for display - handles both old string format and new AbilityHealing
   */
  getHealingDisplay(ability: ResolvedAbility): string | null {
    if (!ability.healing) return null;
    
    if (typeof ability.healing === 'string') {
      return ability.healing;
    }
    
    return formatHealing(ability.healing);
  }

  /**
   * Get summon creature name for display
   */
  getSummonName(ability: ResolvedAbility): string {
    return ability.summon?.creature?.name ?? 'Summon';
  }

  /**
   * Get a brief effect summary for the row preview
   */
  getEffectSummary(ability: ResolvedAbility): string | null {
    const effects = ability.effects;
    if (!effects) return null;

    // Dice modifiers - most common effect
    if (effects.diceModifiers?.length) {
      const mod = effects.diceModifiers[0];
      return `${mod.amount > 0 ? '+' : ''}${mod.amount} D20 ${mod.applies}`;
    }

    // Stat modifiers
    if (effects.statModifiers?.length) {
      const mod = effects.statModifiers[0];
      const statsText = mod.stats === 'all' ? 'all stats' : 
        Array.isArray(mod.stats) ? mod.stats.join(', ') : mod.stats;
      return `${mod.amount > 0 ? '+' : ''}${mod.amount} ${statsText}`;
    }

    // Movement
    if (effects.movement) {
      return `${effects.movement.amount > 0 ? '+' : ''}${effects.movement.amount} ft. movement`;
    }

    // Damage reduction
    if (effects.damageReduction) {
      return `${effects.damageReduction.dice} damage reduction`;
    }

    // Conditions applied
    if (effects.appliesConditions?.length) {
      return `Applies ${effects.appliesConditions[0].condition}`;
    }

    // Conditions removed
    if (effects.removesConditions?.length) {
      return `Removes ${effects.removesConditions[0]}`;
    }

    // Resistances granted
    if (effects.resistances?.length) {
      return `Resist ${effects.resistances[0]}`;
    }

    // Grants
    if (effects.grants?.length) {
      const grant = effects.grants[0];
      return grant.length > 25 ? grant.substring(0, 22) + '...' : grant;
    }

    // Special effects
    if (effects.special?.length) {
      const special = effects.special[0];
      return special.length > 25 ? special.substring(0, 22) + '...' : special;
    }

    return null;
  }

  // =========================================================================
  // ABILITY TYPE HELPERS
  // =========================================================================

  /**
   * Check if ability is a reaction
   */
  isReaction(ability: ResolvedAbility): boolean {
    return isReactionAbility(ability);
  }

  /**
   * Check if ability is a summon
   */
  isSummon(ability: ResolvedAbility): boolean {
    return isSummonAbility(ability);
  }

  /**
   * Check if ability has sanity cost
   */
  hasSanityCost(ability: ResolvedAbility): boolean {
    return !!ability.sanityCost && ability.sanityCost > 0;
  }

  /**
   * Check if ability has any costs
   */
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

  /**
   * Get the Material Symbols icon name for a resource/component type
   */
  getCostIcon(type: string): string {
    const icons: Record<string, string> = {
      // Universal
      'AP': 'schedule',
      'ST': 'directions_run',
      'HP': 'favorite',
      'SY': 'psychology',
      // Cosmic
      'SR': 'star',
      'LR': 'light_mode',
      'Hours': 'hourglass_empty',
      'VS': 'dark_mode',
      'RP': 'public',
      // Earthly
      'FP': 'adjust',
      'LS': 'eco',
      'CP': 'construction',
      'EP': 'whatshot',
      'SP': 'record_voice_over',
      'BP': 'fitness_center',
      // Dead
      'FE': 'skull',
      'DE': 'science',
      'DC': 'toll',
    };
    return icons[type] || 'toll';
  }

  /**
   * Get the full name for a resource/component type
   */
  getCostTypeName(type: string): string {
    const names: Record<string, string> = {
      // Universal
      'AP': 'Action Points',
      'ST': 'Stamina',
      'HP': 'Health',
      'SY': 'Sanity',
      // Cosmic
      'SR': 'Star Runes',
      'LR': 'Light Runes',
      'Hours': 'Hours',
      'VS': 'Void Shards',
      'RP': 'Realm Points',
      // Earthly
      'FP': 'Focus Points',
      'LS': 'Life Seeds',
      'CP': 'Craft Points',
      'EP': 'Elemental Points',
      'SP': 'Speech Points',
      'BP': 'Body Points',
      // Dead
      'FE': 'Funeral Essence',
      'DE': 'Decay Essence',
      'DC': 'Damned Coins',
    };
    return names[type] || type;
  }

  /**
   * Format component cost for display, including "per" costs
   */
  formatComponentCost(cost: ComponentCost): string {
    if (cost.per) {
      return `${cost.amount} ${cost.type} per ${cost.per}`;
    }
    return `${cost.amount} ${cost.type}`;
  }

  /**
   * Check if an ability has any resource costs (components, stamina, etc.)
   */
  hasResourceCosts(ability: ResolvedAbility): boolean {
    return !!(
      (ability.componentCost && ability.componentCost.length > 0) ||
      ability.staminaCost
    );
  }

  /**
   * Get all non-AP costs for an ability as a formatted array
   */
  getAbilityCosts(ability: ResolvedAbility): Array<{ type: string; amount: number; per?: string }> {
    const costs: Array<{ type: string; amount: number; per?: string }> = [];
    
    // Add stamina cost if present
    if (ability.staminaCost) {
      costs.push({ type: 'ST', amount: ability.staminaCost });
    }
    
    // Add sanity cost if present
    if (ability.sanityCost) {
      costs.push({ type: 'SY', amount: ability.sanityCost });
    }
    
    // Add component costs if present
    if (ability.componentCost && ability.componentCost.length > 0) {
      costs.push(...ability.componentCost);
    }
    
    return costs;
  }
}