import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReferenceDataService } from '@core/services/reference-data.service';
import { 
  AbilityReference, 
  AbilitySource, 
  AbilitySourceType, 
  hasCollegeAndFocus,
  AbilityDamage,
  AbilityHealing,
  ComponentCost,
  formatDamage,
  formatHealing,
  isReactionAbility,
  isSummonAbility
} from '@core/models/ability.model';
import { MagicCollege, MagicSchool } from '@core/models/magic.model';
import { StatAbbr, STAT_NAMES } from '@core/models/stats.model';

// Filter state interface
interface AbilityFilters {
  search: string;
  colleges: Set<string>;
  schools: Set<string>;
  stats: Set<StatAbbr>;
  sourceTypes: Set<string>;
  abilityTypes: Set<string>;
  apCost: Set<string>;
}

// Extended ability with parsed metadata for filtering
interface ParsedAbility extends AbilityReference {
  detectedStats: StatAbbr[];
  schoolId: string | null;
}

@Component({
  selector: 'app-abilities',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './abilities.html',
  styleUrl: './abilities.scss'
})
export class AbilitiesComponent implements OnInit {
  private readonly refData = inject(ReferenceDataService);

  // State
  abilities = signal<ParsedAbility[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  
  // Mobile filters drawer state
  isMobileFiltersOpen = signal(false);
  
  // Filter state
  filters = signal<AbilityFilters>({
    search: '',
    colleges: new Set(),
    schools: new Set(),
    stats: new Set(),
    sourceTypes: new Set(),
    abilityTypes: new Set(),
    apCost: new Set()
  });

  // Collapsible sections state
  expandedSections = signal<Set<string>>(new Set(['colleges', 'stats']));

  // Available filter options
  readonly colleges: { id: string; name: string; color: string }[] = [
    { id: 'cosmic', name: 'Cosmic', color: '#9370db' },
    { id: 'earthly', name: 'Earthly', color: '#4caf50' },
    { id: 'dead', name: 'Dead', color: '#b71c1c' }
  ];

  readonly sourceTypes: { id: string; name: string }[] = [
    { id: 'magic', name: 'Magic' },
    { id: 'physical', name: 'Physical' },
    { id: 'skill', name: 'Skill' },
    { id: 'species', name: 'Species' },
    { id: 'item', name: 'Item' },
    { id: 'innate', name: 'Innate' }
  ];

  readonly abilityTypes: { id: string; name: string }[] = [
    { id: 'active', name: 'Active' },
    { id: 'passive', name: 'Passive' },
    { id: 'ritual', name: 'Ritual' },
    { id: 'sustained', name: 'Sustained' },
    { id: 'reaction', name: 'Reaction' }
  ];

  readonly apCostOptions: { id: string; name: string }[] = [
    { id: '0', name: 'Free (0 AP)' },
    { id: '1', name: '1 AP' },
    { id: '2', name: '2 AP' },
    { id: '3+', name: '3+ AP' }
  ];

  readonly statOptions: StatAbbr[] = ['MIT', 'GRT', 'SPD', 'KNW', 'FRS', 'COR', 'DET', 'AST', 'MAG', 'NAT'];

  // Schools grouped by college for filter UI
  readonly schoolsByCollege: Record<string, { id: string; name: string }[]> = {
    cosmic: [
      { id: 'stars', name: 'School of Stars' },
      { id: 'light', name: 'School of Light' },
      { id: 'time', name: 'School of Time' },
      { id: 'void', name: 'School of Void' },
      { id: 'realms', name: 'School of Realms' }
    ],
    earthly: [
      { id: 'elements', name: 'School of Elements' },
      { id: 'life', name: 'School of Life' },
      { id: 'speech', name: 'School of Speech' },
      { id: 'body', name: 'School of Body' },
      { id: 'craft', name: 'School of Craft' }
    ],
    dead: [
      { id: 'decay', name: 'School of Decay' },
      { id: 'damned', name: 'School of Damned' },
      { id: 'endings', name: 'School of Endings' }
    ]
  };

  // Fallback: Focus to School mapping (for abilities that don't have school in source)
  private readonly focusToSchool: Record<string, { school: string; schoolName: string; college: string }> = {
    // Cosmic - Stars
    divination: { school: 'stars', schoolName: 'School of Stars', college: 'cosmic' },
    fate: { school: 'stars', schoolName: 'School of Stars', college: 'cosmic' },
    prophecy: { school: 'stars', schoolName: 'School of Stars', college: 'cosmic' },
    constellations: { school: 'stars', schoolName: 'School of Stars', college: 'cosmic' },
    // Cosmic - Light
    radiance: { school: 'light', schoolName: 'School of Light', college: 'cosmic' },
    protection: { school: 'light', schoolName: 'School of Light', college: 'cosmic' },
    purification: { school: 'light', schoolName: 'School of Light', college: 'cosmic' },
    // Cosmic - Time
    acceleration: { school: 'time', schoolName: 'School of Time', college: 'cosmic' },
    delay: { school: 'time', schoolName: 'School of Time', college: 'cosmic' },
    future: { school: 'time', schoolName: 'School of Time', college: 'cosmic' },
    past: { school: 'time', schoolName: 'School of Time', college: 'cosmic' },
    // Cosmic - Void
    shadow: { school: 'void', schoolName: 'School of Void', college: 'cosmic' },
    emptiness: { school: 'void', schoolName: 'School of Void', college: 'cosmic' },
    concealment: { school: 'void', schoolName: 'School of Void', college: 'cosmic' },
    // Cosmic - Realms
    plasma: { school: 'realms', schoolName: 'School of Realms', college: 'cosmic' },
    aether: { school: 'realms', schoolName: 'School of Realms', college: 'cosmic' },
    gravity: { school: 'realms', schoolName: 'School of Realms', college: 'cosmic' },
    ether: { school: 'realms', schoolName: 'School of Realms', college: 'cosmic' },
    // Earthly - Elements
    earth: { school: 'elements', schoolName: 'School of Elements', college: 'earthly' },
    water: { school: 'elements', schoolName: 'School of Elements', college: 'earthly' },
    fire: { school: 'elements', schoolName: 'School of Elements', college: 'earthly' },
    air: { school: 'elements', schoolName: 'School of Elements', college: 'earthly' },
    // Earthly - Life
    healing: { school: 'life', schoolName: 'School of Life', college: 'earthly' },
    growth: { school: 'life', schoolName: 'School of Life', college: 'earthly' },
    plants: { school: 'life', schoolName: 'School of Life', college: 'earthly' },
    beasts: { school: 'life', schoolName: 'School of Life', college: 'earthly' },
    // Earthly - Speech
    performance: { school: 'speech', schoolName: 'School of Speech', college: 'earthly' },
    rhetoric: { school: 'speech', schoolName: 'School of Speech', college: 'earthly' },
    jest: { school: 'speech', schoolName: 'School of Speech', college: 'earthly' },
    verse: { school: 'speech', schoolName: 'School of Speech', college: 'earthly' },
    // Earthly - Body
    strength: { school: 'body', schoolName: 'School of Body', college: 'earthly' },
    speed: { school: 'body', schoolName: 'School of Body', college: 'earthly' },
    endurance: { school: 'body', schoolName: 'School of Body', college: 'earthly' },
    weaponArts: { school: 'body', schoolName: 'School of Body', college: 'earthly' },
    martialArts: { school: 'body', schoolName: 'School of Body', college: 'earthly' },
    senses: { school: 'body', schoolName: 'School of Body', college: 'earthly' },
    // Earthly - Craft
    weapons: { school: 'craft', schoolName: 'School of Craft', college: 'earthly' },
    wards: { school: 'craft', schoolName: 'School of Craft', college: 'earthly' },
    tools: { school: 'craft', schoolName: 'School of Craft', college: 'earthly' },
    items: { school: 'craft', schoolName: 'School of Craft', college: 'earthly' },
    enchantment: { school: 'craft', schoolName: 'School of Craft', college: 'earthly' },
    // Dead - Decay
    disease: { school: 'decay', schoolName: 'School of Decay', college: 'dead' },
    entropy: { school: 'decay', schoolName: 'School of Decay', college: 'dead' },
    withering: { school: 'decay', schoolName: 'School of Decay', college: 'dead' },
    rot: { school: 'decay', schoolName: 'School of Decay', college: 'dead' },
    // Dead - Damned
    pacts: { school: 'damned', schoolName: 'School of Damned', college: 'dead' },
    corruption: { school: 'damned', schoolName: 'School of Damned', college: 'dead' },
    infernal: { school: 'damned', schoolName: 'School of Damned', college: 'dead' },
    // Dead - Endings
    passage: { school: 'endings', schoolName: 'School of Endings', college: 'dead' },
    finality: { school: 'endings', schoolName: 'School of Endings', college: 'dead' },
    reaper: { school: 'endings', schoolName: 'School of Endings', college: 'dead' },
  };

  // Computed: filtered abilities
  filteredAbilities = computed(() => {
    const all = this.abilities();
    const f = this.filters();
    
    return all.filter(ability => {
      // Search filter
      if (f.search) {
        const searchLower = f.search.toLowerCase();
        const matchesSearch = 
          ability.name.toLowerCase().includes(searchLower) ||
          ability.description.toLowerCase().includes(searchLower) ||
          (ability.notes?.toLowerCase().includes(searchLower) ?? false);
        if (!matchesSearch) return false;
      }

      // College filter
      if (f.colleges.size > 0) {
        const abilityCollege = this.getAbilityCollege(ability);
        if (!abilityCollege || !f.colleges.has(abilityCollege)) return false;
      }

      // School filter
      if (f.schools.size > 0) {
        if (!ability.schoolId || !f.schools.has(ability.schoolId)) return false;
      }

      // Stats filter
      if (f.stats.size > 0) {
        const hasMatchingStat = ability.detectedStats.some(stat => f.stats.has(stat));
        if (!hasMatchingStat) return false;
      }

      // Source type filter
      if (f.sourceTypes.size > 0) {
        if (!f.sourceTypes.has(ability.source.type)) return false;
      }

      // Ability type filter
      if (f.abilityTypes.size > 0) {
        const abilityTypeFlags = {
          active: !ability.isPassive && !ability.isRitual && !ability.isSustained && !isReactionAbility(ability),
          passive: ability.isPassive,
          ritual: ability.isRitual,
          sustained: ability.isSustained,
          reaction: isReactionAbility(ability)
        };
        const matchesType = Array.from(f.abilityTypes).some(
          type => abilityTypeFlags[type as keyof typeof abilityTypeFlags]
        );
        if (!matchesType) return false;
      }

      // AP Cost filter
      if (f.apCost.size > 0) {
        const apCost = ability.apCost;
        const matchesCost = Array.from(f.apCost).some(costFilter => {
          if (costFilter === '3+') return apCost !== null && apCost >= 3;
          return apCost === parseInt(costFilter, 10);
        });
        if (!matchesCost) return false;
      }

      return true;
    });
  });

  // Computed: active filter count
  activeFilterCount = computed(() => {
    const f = this.filters();
    return f.colleges.size + 
           f.schools.size + 
           f.stats.size + 
           f.sourceTypes.size + 
           f.abilityTypes.size + 
           f.apCost.size;
  });

  ngOnInit(): void {
    this.loadAbilities();
  }

  private loadAbilities(): void {
    this.refData.getAbilities().subscribe({
      next: (abilities) => {
        const parsed = Object.values(abilities).map(ability => this.parseAbility(ability));
        this.abilities.set(parsed);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load abilities:', err);
        this.error.set('Failed to load ability data.');
        this.isLoading.set(false);
      }
    });
  }

  private parseAbility(ability: AbilityReference): ParsedAbility {
    return {
      ...ability,
      detectedStats: this.detectStats(ability),
      schoolId: this.getSchoolFromAbility(ability)
    };
  }

  /**
   * Detect stat references in ability - handles both old string format and new structured format
   */
  private detectStats(ability: AbilityReference): StatAbbr[] {
    const stats = new Set<StatAbbr>();
    
    // Build text to search from description and notes
    const textParts: string[] = [
      ability.description,
      ability.notes || ''
    ];

    // Handle damage - could be string (legacy) or AbilityDamage object (new)
    if (ability.damage) {
      if (typeof ability.damage === 'string') {
        // Legacy format
        textParts.push(ability.damage);
      } else {
        // New structured format
        const dmg = ability.damage as AbilityDamage;
        textParts.push(dmg.dice);
        if (dmg.statModifier) {
          stats.add(dmg.statModifier as StatAbbr);
        }
      }
    }

    // Handle healing - could be string (legacy) or AbilityHealing object (new)
    if (ability.healing) {
      if (typeof ability.healing === 'string') {
        // Legacy format
        textParts.push(ability.healing);
      } else {
        // New structured format
        const heal = ability.healing as AbilityHealing;
        textParts.push(heal.dice);
        if (heal.statModifier) {
          stats.add(heal.statModifier as StatAbbr);
        }
      }
    }

    // Check effects for stat references
    if (ability.effects?.statModifiers) {
      for (const mod of ability.effects.statModifiers) {
        if (Array.isArray(mod.stats)) {
          // Specific stats listed
          for (const stat of mod.stats) {
            if (this.statOptions.includes(stat as StatAbbr)) {
              stats.add(stat as StatAbbr);
            }
          }
        }
        // "all" doesn't add specific stats to detection
      }
    }

    // Check summon attacks for stat modifiers
    if (ability.summon?.creature?.attacks) {
      for (const attack of ability.summon.creature.attacks) {
        if (attack.statModifiers) {
          for (const stat of attack.statModifiers) {
            if (this.statOptions.includes(stat as StatAbbr)) {
              stats.add(stat as StatAbbr);
            }
          }
        }
      }
    }

    const textToSearch = textParts.join(' ').toUpperCase();

    // Check for stat abbreviations in text
    for (const stat of this.statOptions) {
      if (stats.has(stat)) continue; // Already detected from structured data
      
      // Match stat abbreviation as whole word or in common patterns
      const patterns = [
        new RegExp(`\\b${stat}\\b`, 'i'),
        new RegExp(`\\+ ?${stat}`, 'i'),
        new RegExp(`${stat} (MODIFIER|MOD|CHECK|ROLL)`, 'i')
      ];
      
      if (patterns.some(p => p.test(textToSearch))) {
        stats.add(stat);
      }
    }

    // Also check full stat names
    const fullNameMap: Record<string, StatAbbr> = {
      'MIGHT': 'MIT',
      'GRIT': 'GRT',
      'SPEED': 'SPD',
      'KNOWLEDGE': 'KNW',
      'FORESIGHT': 'FRS',
      'COURAGE': 'COR',
      'DETERMINATION': 'DET',
      'ASTROLOGY': 'AST',
      'MAGIKS': 'MAG',
      'NATURE': 'NAT'
    };

    for (const [fullName, abbr] of Object.entries(fullNameMap)) {
      if (textToSearch.includes(fullName)) {
        stats.add(abbr);
      }
    }

    return Array.from(stats);
  }

  /**
   * Get school ID from ability - checks new format first, falls back to focus mapping
   */
  private getSchoolFromAbility(ability: AbilityReference): string | null {
    if (hasCollegeAndFocus(ability.source)) {
      // New format: school is directly on source
      if ('school' in ability.source && ability.source.school) {
        return ability.source.school;
      }
      // Fallback: derive from focus
      const focus = ability.source.focus;
      if (focus && this.focusToSchool[focus]) {
        return this.focusToSchool[focus].school;
      }
    }
    return null;
  }

  getAbilityCollege(ability: AbilityReference): string | null {
    if (hasCollegeAndFocus(ability.source)) {
      return ability.source.college || null;
    }
    return null;
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

  toggleFilter(category: keyof Omit<AbilityFilters, 'search'>, value: string): void {
    this.filters.update(f => {
      const newSet = new Set(f[category]);
      if (newSet.has(value as any)) {
        newSet.delete(value as any);
      } else {
        newSet.add(value as any);
      }
      return { ...f, [category]: newSet };
    });
  }

  isFilterActive(category: keyof Omit<AbilityFilters, 'search'>, value: string): boolean {
    return this.filters()[category].has(value as any);
  }

  clearAllFilters(): void {
    this.filters.set({
      search: '',
      colleges: new Set(),
      schools: new Set(),
      stats: new Set(),
      sourceTypes: new Set(),
      abilityTypes: new Set(),
      apCost: new Set()
    });
  }

  clearFilterCategory(category: keyof Omit<AbilityFilters, 'search'>): void {
    this.filters.update(f => ({ ...f, [category]: new Set() }));
  }

  // =========================================================================
  // UI HELPERS
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

  getCollegeColor(collegeId: string): string {
    const college = this.colleges.find(c => c.id === collegeId);
    return college?.color || '#888';
  }

  getStatName(abbr: StatAbbr): string {
    return STAT_NAMES[abbr] || abbr;
  }

  formatFocusName(focus: string): string {
    return focus
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  getSourceDisplayName(ability: AbilityReference): string {
    const source = ability.source;
    if (hasCollegeAndFocus(source)) {
      // Show school if available, otherwise focus
      if ('school' in source && source.school) {
        const schoolName = this.getSchoolDisplayName(source.school);
        return source.focus ? `${schoolName} · ${this.formatFocusName(source.focus)}` : schoolName;
      }
      return source.focus ? this.formatFocusName(source.focus) : source.type;
    }
    switch (source.type) {
      case 'skill':
        return `Skill: ${source.skillId}`;
      case 'species':
        return `Species: ${source.speciesId}`;
      case 'item':
        return `Item: ${source.itemId}`;
      case 'innate':
        return 'Innate';
      default:
        return 'Unknown';
    }
  }

  getSchoolDisplayName(schoolId: string): string {
    for (const college of Object.values(this.schoolsByCollege)) {
      const school = college.find(s => s.id === schoolId);
      if (school) return school.name;
    }
    return schoolId;
  }

  // =========================================================================
  // COST & DAMAGE DISPLAY HELPERS
  // =========================================================================

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
   * Get formatted damage string for display
   */
  getDamageDisplay(ability: AbilityReference): string | null {
    if (!ability.damage) return null;
    
    if (typeof ability.damage === 'string') {
      // Legacy format
      return ability.damage;
    }
    
    // New structured format
    return formatDamage(ability.damage);
  }

  /**
   * Get damage type for styling
   */
  getDamageType(ability: AbilityReference): string | null {
    if (!ability.damage || typeof ability.damage === 'string') {
      return null;
    }
    return ability.damage.type;
  }

  /**
   * Get formatted healing string for display
   */
  getHealingDisplay(ability: AbilityReference): string | null {
    if (!ability.healing) return null;
    
    if (typeof ability.healing === 'string') {
      // Legacy format
      return ability.healing;
    }
    
    // New structured format
    return formatHealing(ability.healing);
  }

  /**
   * Check if ability is a reaction
   */
  isReaction(ability: AbilityReference): boolean {
    return isReactionAbility(ability);
  }

  /**
   * Check if ability is a summon
   */
  isSummon(ability: AbilityReference): boolean {
    return isSummonAbility(ability);
  }

  /**
   * Check if ability has sanity cost
   */
  hasSanityCost(ability: AbilityReference): boolean {
    return !!ability.sanityCost && ability.sanityCost > 0;
  }
}