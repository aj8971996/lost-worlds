import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReferenceDataService, AllReferenceData } from '@core/services/reference-data.service';
import { 
  Character, 
  CharacterSpeciesSelection, 
  SpeciesReference 
} from '@core/models/character.model';
import { 
  WeaponReference, 
  ArmorReference, 
  AccessoryReference,
  ItemReference,
  ArmorSlot 
} from '@core/models/equipment.model';
import { 
  AbilityReference, 
  hasCollegeAndFocus,
  ComponentType,
  formatDamage,
  formatHealing
} from '@core/models/ability.model';
import { SkillReference, SkillId } from '@core/models/skills.model';
import { 
  MagicCollege, 
  FocusLevels,
  calculateCollegeProgression
} from '@core/models/magic.model';
import { calculateMod, calculateDice } from '@core/models/stats.model';
import { PureSpeciesId } from '@core/models/species.model';

// ============================================================================
// INTERFACES
// ============================================================================

interface WizardStep {
  id: string;
  label: string;
  icon: string;
}

interface StatInput {
  key: string;
  label: string;
  abbr: string;
  category: 'physical' | 'mental' | 'magical';
  bonus: number;
  value: number;
}

interface SkillInput {
  id: SkillId;
  name: string;
  description: string;
  level: number;
  category?: string;
}

interface FocusInput {
  id: string;
  name: string;
  school: string;
  schoolName: string;
  college: MagicCollege;
  level: number;
}

interface WeaponSelection {
  refId: string;
  quantity: number;
  currentHp: number;
}

interface ArmorSelection {
  slot: ArmorSlot;
  refId: string;
  currentHp: number;
}

interface AccessorySelection {
  refId: string;
  currentHp: number;
}

interface ItemSelection {
  refId: string;
  quantity: number;
  category: 'consumable' | 'general';
}

// Component pool calculated from school investments
interface ComponentPool {
  type: ComponentType;
  name: string;
  icon: string;
  school: string;
  schoolName: string;
  college: MagicCollege;
  max: number;
  current: number;
  perLevel: number;
  rechargeCondition: string;
}

// ============================================================================
// COMPONENT CONFIGURATION - Maps schools to their component types
// ============================================================================

const SCHOOL_COMPONENT_CONFIG: Record<string, {
  type: ComponentType;
  name: string;
  icon: string;
  perLevel: number;
  rechargeCondition: string;
}> = {
  // Cosmic Schools
  stars: { 
    type: 'SR', 
    name: 'Star Runes', 
    icon: 'star',
    perLevel: 3, 
    rechargeCondition: 'Under moonlight'
  },
  light: { 
    type: 'LR', 
    name: 'Light Runes', 
    icon: 'light_mode',
    perLevel: 3, 
    rechargeCondition: 'In sunlight or moonlight'
  },
  time: { 
    type: 'Hours', 
    name: 'Hours', 
    icon: 'schedule',
    perLevel: 24, 
    rechargeCondition: '1 Time Piece per focus level'
  },
  void: { 
    type: 'VS', 
    name: 'Void Shards', 
    icon: 'dark_mode',
    perLevel: 3, 
    rechargeCondition: 'In complete darkness'
  },
  realms: { 
    type: 'RP', 
    name: 'Realm Points', 
    icon: 'public',
    perLevel: 3, 
    rechargeCondition: 'At planar nexus points'
  },
  // Earthly Schools
  elements: { 
    type: 'EP', 
    name: 'Elemental Points', 
    icon: 'whatshot',
    perLevel: 3, 
    rechargeCondition: 'Near elemental source'
  },
  life: { 
    type: 'LS', 
    name: 'Life Seeds', 
    icon: 'eco',
    perLevel: 3, 
    rechargeCondition: 'In natural environment'
  },
  speech: { 
    type: 'SP', 
    name: 'Speech Points', 
    icon: 'record_voice_over',
    perLevel: 3, 
    rechargeCondition: 'After performance or rest'
  },
  body: { 
    type: 'BP', 
    name: 'Body Points', 
    icon: 'fitness_center',
    perLevel: 3, 
    rechargeCondition: 'After physical rest'
  },
  craft: { 
    type: 'CP', 
    name: 'Craft Points', 
    icon: 'construction',
    perLevel: 3, 
    rechargeCondition: 'At workbench or forge'
  },
  // Dead Schools
  decay: { 
    type: 'DE', 
    name: 'Decay Essence', 
    icon: 'science',
    perLevel: 3, 
    rechargeCondition: 'Near death or decay'
  },
  damned: { 
    type: 'DC', 
    name: 'Damned Coins', 
    icon: 'toll',
    perLevel: 3, 
    rechargeCondition: 'Through dark pacts'
  },
  endings: { 
    type: 'FE', 
    name: 'Funeral Essence', 
    icon: 'skull',
    perLevel: 3, 
    rechargeCondition: 'Near graves or after death'
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

@Component({
  selector: 'app-create-character',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-character.component.html',
  styleUrl: './create-character.component.scss'
})
export class CreateCharacterComponent implements OnInit {
  private readonly refData = inject(ReferenceDataService);

  // =========================================================================
  // STATE
  // =========================================================================

  isLoading = signal(true);
  currentStep = signal(0);
  
  // Reference Data
  allReferenceData = signal<AllReferenceData | null>(null);
  speciesList = signal<SpeciesReference[]>([]);
  skillsList = signal<SkillReference[]>([]);
  weaponsList = signal<WeaponReference[]>([]);
  armorList = signal<ArmorReference[]>([]);
  accessoriesList = signal<AccessoryReference[]>([]);
  itemsList = signal<ItemReference[]>([]);
  allAbilities = signal<AbilityReference[]>([]);

  // Wizard Steps
  readonly steps: WizardStep[] = [
    { id: 'identity', label: 'Identity', icon: 'person' },
    { id: 'stats', label: 'Stats', icon: 'analytics' },
    { id: 'skills', label: 'Skills', icon: 'psychology' },
    { id: 'magic', label: 'Magic', icon: 'auto_awesome' },
    { id: 'abilities', label: 'Abilities', icon: 'bolt' },
    { id: 'equipment', label: 'Equipment', icon: 'shield' },
    { id: 'inventory', label: 'Inventory', icon: 'inventory_2' },
    { id: 'review', label: 'Review', icon: 'fact_check' }
  ];

  // === STEP 1: Identity ===
  characterName = signal('');
  selectedSpeciesId = signal('');
  characterLevel = signal(1);
  characterAge = signal(25);
  characterHeight = signal('5.5 ft');
  characterXp = signal(0);

  // === STEP 2: Stats ===
  stats = signal<StatInput[]>([
    { key: 'might', label: 'Might', abbr: 'MIT', category: 'physical', bonus: 0, value: 0 },
    { key: 'grit', label: 'Grit', abbr: 'GRT', category: 'physical', bonus: 0, value: 0 },
    { key: 'speed', label: 'Speed', abbr: 'SPD', category: 'physical', bonus: 0, value: 0 },
    { key: 'knowledge', label: 'Knowledge', abbr: 'KNW', category: 'mental', bonus: 0, value: 0 },
    { key: 'foresight', label: 'Foresight', abbr: 'FRS', category: 'mental', bonus: 0, value: 0 },
    { key: 'courage', label: 'Courage', abbr: 'COR', category: 'mental', bonus: 0, value: 0 },
    { key: 'determination', label: 'Determination', abbr: 'DET', category: 'mental', bonus: 0, value: 0 },
    { key: 'astrology', label: 'Astrology', abbr: 'AST', category: 'magical', bonus: 0, value: 0 },
    { key: 'magiks', label: 'Magiks', abbr: 'MAG', category: 'magical', bonus: 0, value: 0 },
    { key: 'nature', label: 'Nature', abbr: 'NAT', category: 'magical', bonus: 0, value: 0 }
  ]);

  // Resources
  healthMax = signal(200);
  healthCurrent = signal(200);
  staminaMax = signal(185);
  staminaCurrent = signal(185);
  sanityMax = signal(144);
  sanityCurrent = signal(144);

  // Combat
  actionPoints = signal(6);
  baseMovement = signal(30);
  initiativeMod = signal(0);

  // === STEP 3: Skills ===
  skills = signal<SkillInput[]>([]);
  
  totalSkillPointsAllocated = computed(() => {
    return this.skills().reduce((sum, s) => sum + s.level, 0);
  });

  availableSkillPoints = computed(() => {
    return this.characterLevel() - this.totalSkillPointsAllocated();
  });

  // === STEP 4: Magic Focuses ===
  magicFocuses = signal<FocusInput[]>([]);

  totalFocusLevels = computed(() => {
    return this.magicFocuses().reduce((sum, f) => sum + f.level, 0);
  });

  availableFocusPoints = computed(() => {
    return (this.characterLevel() * 2) - this.totalFocusLevels();
  });

  // Computed: Get focuses grouped by college
  cosmicFocuses = computed(() => this.magicFocuses().filter(f => f.college === 'cosmic'));
  earthlyFocuses = computed(() => this.magicFocuses().filter(f => f.college === 'earthly'));
  deadFocuses = computed(() => this.magicFocuses().filter(f => f.college === 'dead'));

  // =========================================================================
  // COMPUTED: Component Pools based on school investments
  // =========================================================================

  /** Calculate total focus levels per school */
  schoolFocusLevels = computed(() => {
    const schools: Record<string, number> = {};
    for (const focus of this.magicFocuses()) {
      if (focus.level > 0) {
        schools[focus.school] = (schools[focus.school] || 0) + focus.level;
      }
    }
    return schools;
  });

  /** Generate component pools based on school investments */
  componentPools = computed((): ComponentPool[] => {
    const pools: ComponentPool[] = [];
    const schoolLevels = this.schoolFocusLevels();

    for (const [schoolId, totalLevel] of Object.entries(schoolLevels)) {
      const config = SCHOOL_COMPONENT_CONFIG[schoolId];
      if (!config) continue;

      const focus = this.magicFocuses().find(f => f.school === schoolId);
      if (!focus) continue;

      const max = totalLevel * config.perLevel;
      pools.push({
        type: config.type,
        name: config.name,
        icon: config.icon,
        school: schoolId,
        schoolName: focus.schoolName,
        college: focus.college,
        max,
        current: max,
        perLevel: config.perLevel,
        rechargeCondition: config.rechargeCondition
      });
    }

    const collegeOrder: Record<MagicCollege, number> = { cosmic: 0, earthly: 1, dead: 2 };
    return pools.sort((a, b) => {
      const collegeDiff = collegeOrder[a.college] - collegeOrder[b.college];
      if (collegeDiff !== 0) return collegeDiff;
      return a.name.localeCompare(b.name);
    });
  });

  hasComponents = computed(() => this.componentPools().length > 0);
  cosmicComponents = computed(() => this.componentPools().filter(c => c.college === 'cosmic'));
  earthlyComponents = computed(() => this.componentPools().filter(c => c.college === 'earthly'));
  deadComponents = computed(() => this.componentPools().filter(c => c.college === 'dead'));

  // =========================================================================
  // COMPUTED: College Progression (Degrees)
  // =========================================================================

  cosmicProgression = computed(() => {
    const focuses: FocusLevels = {};
    for (const f of this.cosmicFocuses()) {
      if (f.level > 0) focuses[f.id] = f.level;
    }
    return calculateCollegeProgression(focuses);
  });

  earthlyProgression = computed(() => {
    const focuses: FocusLevels = {};
    for (const f of this.earthlyFocuses()) {
      if (f.level > 0) focuses[f.id] = f.level;
    }
    return calculateCollegeProgression(focuses);
  });

  deadProgression = computed(() => {
    const focuses: FocusLevels = {};
    for (const f of this.deadFocuses()) {
      if (f.level > 0) focuses[f.id] = f.level;
    }
    return calculateCollegeProgression(focuses);
  });

  // === STEP 5: Abilities ===
  selectedAbilityIds = signal<string[]>([]);
  abilitySearchQuery = signal('');
  abilityCollegeFilter = signal<string>('all');
  abilitySchoolFilter = signal<string>('all');
  expandedAbilities = signal<Set<string>>(new Set());

  availableAbilities = computed(() => {
    const abilities = this.allAbilities();
    const focuses = this.magicFocuses();
    
    const focusLevelMap = new Map<string, number>();
    for (const focus of focuses) {
      if (focus.level > 0) {
        focusLevelMap.set(focus.id, focus.level);
      }
    }

    return abilities.filter(ability => {
      if (!hasCollegeAndFocus(ability.source)) {
        return true;
      }
      const focusId = ability.source.focus;
      const requiredLevel = ability.source.requiredLevel;
      const currentLevel = focusLevelMap.get(focusId) || 0;
      return currentLevel >= requiredLevel;
    });
  });

  filteredAbilities = computed(() => {
    let abilities = this.availableAbilities();
    const query = this.abilitySearchQuery().toLowerCase();
    const collegeFilter = this.abilityCollegeFilter();
    const schoolFilter = this.abilitySchoolFilter();

    if (query) {
      abilities = abilities.filter(a => 
        a.name.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query)
      );
    }

    if (collegeFilter !== 'all') {
      abilities = abilities.filter(a => {
        if (hasCollegeAndFocus(a.source)) {
          return a.source.college === collegeFilter;
        }
        return false;
      });
    }

    if (schoolFilter !== 'all') {
      abilities = abilities.filter(a => {
        if (hasCollegeAndFocus(a.source)) {
          return a.source.school === schoolFilter;
        }
        return false;
      });
    }

    return abilities;
  });

  availableSchools = computed(() => {
    const schools = new Set<string>();
    for (const focus of this.magicFocuses()) {
      if (focus.level > 0) {
        schools.add(focus.school);
      }
    }
    return Array.from(schools);
  });

  maxPreparedAbilities = computed(() => 3 + this.characterLevel());

  // === STEP 6: Equipment ===
  selectedWeapons = signal<WeaponSelection[]>([]);
  selectedArmor = signal<ArmorSelection[]>([]);
  selectedAccessories = signal<AccessorySelection[]>([]);
  equipmentTab = signal<'weapons' | 'armor' | 'accessories'>('weapons');

  totalArmorHp = computed(() => {
    return this.selectedArmor().reduce((sum, a) => sum + a.currentHp, 0);
  });

  // === STEP 7: Inventory ===
  selectedItems = signal<ItemSelection[]>([]);
  currencyEra = signal('Las Vegas');
  currencyWealth = signal(0);

  // =========================================================================
  // LIFECYCLE
  // =========================================================================

  ngOnInit(): void {
    this.loadReferenceData();
  }

  private loadReferenceData(): void {
    this.refData.loadAllReferenceData().subscribe({
      next: (data) => {
        this.allReferenceData.set(data);
        this.speciesList.set(Object.values(data.species));
        this.skillsList.set(Object.values(data.skills));
        this.weaponsList.set(Object.values(data.weapons));
        this.armorList.set(Object.values(data.armor));
        this.accessoriesList.set(Object.values(data.accessories));
        this.itemsList.set(Object.values(data.items));
        this.allAbilities.set(Object.values(data.abilities));
        this.initializeSkills(data.skills);
        this.initializeMagicFocuses(data.magicSchools);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load reference data:', err);
        this.isLoading.set(false);
      }
    });
  }

  private initializeSkills(skillsData: Record<string, SkillReference>): void {
    const skillInputs: SkillInput[] = Object.values(skillsData).map(skill => ({
      id: skill.id as SkillId,
      name: skill.name,
      description: skill.description,
      level: 0,
      category: skill.category
    }));
    this.skills.set(skillInputs);
  }

  private initializeMagicFocuses(magicSchools: Record<string, unknown>): void {
    const focuses: FocusInput[] = [];
    
    for (const [collegeId, collegeData] of Object.entries(magicSchools)) {
      const college = collegeData as { schools: Record<string, { id: string; name: string; focuses: { id: string; name: string }[] }> };
      
      for (const [schoolId, school] of Object.entries(college.schools || {})) {
        for (const focus of school.focuses || []) {
          focuses.push({
            id: focus.id,
            name: focus.name,
            school: schoolId,
            schoolName: school.name,
            college: collegeId as MagicCollege,
            level: 0
          });
        }
      }
    }
    this.magicFocuses.set(focuses);
  }

  // =========================================================================
  // NAVIGATION
  // =========================================================================

  nextStep(): void {
    if (this.currentStep() < this.steps.length - 1) {
      this.currentStep.update(s => s + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update(s => s - 1);
    }
  }

  goToStep(index: number): void {
    this.currentStep.set(index);
  }

  // =========================================================================
  // STAT HELPERS
  // =========================================================================

  updateStatValue(index: number, value: number): void {
    this.stats.update(stats => {
      const newStats = [...stats];
      newStats[index] = { ...newStats[index], value };
      return newStats;
    });
  }

  updateStatBonus(index: number, bonus: number): void {
    this.stats.update(stats => {
      const newStats = [...stats];
      newStats[index] = { ...newStats[index], bonus };
      return newStats;
    });
  }

  getStatMod(value: number): number {
    return calculateMod(value);
  }

  getStatDice(value: number): number {
    return calculateDice(value);
  }

  formatMod(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`;
  }

  getStatsByCategory(category: 'physical' | 'mental' | 'magical'): StatInput[] {
    return this.stats().filter(s => s.category === category);
  }

  // =========================================================================
  // SKILL HELPERS
  // =========================================================================

  incrementSkill(skillId: SkillId): void {
    if (this.availableSkillPoints() <= 0) return;
    this.skills.update(skills => {
      return skills.map(s => {
        if (s.id === skillId && s.level < 10) {
          return { ...s, level: s.level + 1 };
        }
        return s;
      });
    });
  }

  decrementSkill(skillId: SkillId): void {
    this.skills.update(skills => {
      return skills.map(s => {
        if (s.id === skillId && s.level > 0) {
          return { ...s, level: s.level - 1 };
        }
        return s;
      });
    });
  }

  // =========================================================================
  // MAGIC FOCUS HELPERS
  // =========================================================================

  incrementFocus(focusId: string): void {
    if (this.availableFocusPoints() <= 0) return;
    const focus = this.magicFocuses().find(f => f.id === focusId);
    if (!focus) return;

    let progression;
    switch (focus.college) {
      case 'cosmic': progression = this.cosmicProgression(); break;
      case 'earthly': progression = this.earthlyProgression(); break;
      case 'dead': progression = this.deadProgression(); break;
    }

    if (focus.level >= progression.focusLevelCap) return;

    this.magicFocuses.update(focuses => {
      return focuses.map(f => {
        if (f.id === focusId) {
          return { ...f, level: f.level + 1 };
        }
        return f;
      });
    });
  }

  decrementFocus(focusId: string): void {
    this.magicFocuses.update(focuses => {
      return focuses.map(f => {
        if (f.id === focusId && f.level > 0) {
          return { ...f, level: f.level - 1 };
        }
        return f;
      });
    });
  }

  getFocusesBySchool(schoolId: string): FocusInput[] {
    return this.magicFocuses().filter(f => f.school === schoolId);
  }

  getSchoolsForCollege(college: MagicCollege): { id: string; name: string }[] {
    const schools: Record<string, string> = {};
    for (const focus of this.magicFocuses()) {
      if (focus.college === college) {
        schools[focus.school] = focus.schoolName;
      }
    }
    return Object.entries(schools).map(([id, name]) => ({ id, name }));
  }

  getSchoolTotalFocusLevels(schoolId: string): number {
    return this.schoolFocusLevels()[schoolId] || 0;
  }

  getSchoolComponent(schoolId: string): typeof SCHOOL_COMPONENT_CONFIG[string] | undefined {
    return SCHOOL_COMPONENT_CONFIG[schoolId];
  }

  getDegreeDisplayName(degree: string): string {
    const names: Record<string, string> = {
      none: 'Novice',
      associates: 'Associate',
      bachelors: 'Bachelor',
      masters: 'Master',
      doctorate: 'Doctorate'
    };
    return names[degree] || degree;
  }

  // =========================================================================
  // ABILITY HELPERS
  // =========================================================================

  toggleAbilitySelection(abilityId: string): void {
    this.selectedAbilityIds.update(ids => {
      if (ids.includes(abilityId)) {
        return ids.filter(id => id !== abilityId);
      } else if (ids.length < this.maxPreparedAbilities()) {
        return [...ids, abilityId];
      }
      return ids;
    });
  }

  isAbilitySelected(abilityId: string): boolean {
    return this.selectedAbilityIds().includes(abilityId);
  }

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

  getAbilityCollege(ability: AbilityReference): string {
    if (hasCollegeAndFocus(ability.source)) {
      return ability.source.college;
    }
    return 'innate';
  }

  getAbilitySchool(ability: AbilityReference): string {
    if (hasCollegeAndFocus(ability.source)) {
      return ability.source.school || '';
    }
    return '';
  }

  getAbilityFocus(ability: AbilityReference): string {
    if (hasCollegeAndFocus(ability.source)) {
      return ability.source.focus;
    }
    return '';
  }

  getAbilityRequiredLevel(ability: AbilityReference): number {
    if (hasCollegeAndFocus(ability.source)) {
      return ability.source.requiredLevel;
    }
    return 0;
  }

  getDamageDisplay(ability: AbilityReference): string | null {
    if (!ability.damage) return null;
    if (typeof ability.damage === 'string') return ability.damage;
    return formatDamage(ability.damage);
  }

  getHealingDisplay(ability: AbilityReference): string | null {
    if (!ability.healing) return null;
    if (typeof ability.healing === 'string') return ability.healing;
    return formatHealing(ability.healing);
  }

  getCostIcon(type: string): string {
    const icons: Record<string, string> = {
      'AP': 'schedule', 'ST': 'directions_run', 'HP': 'favorite', 'SY': 'psychology',
      'SR': 'star', 'LR': 'light_mode', 'Hours': 'hourglass_empty', 'VS': 'dark_mode',
      'RP': 'public', 'FP': 'adjust', 'LS': 'eco', 'CP': 'construction',
      'EP': 'whatshot', 'SP': 'record_voice_over', 'BP': 'fitness_center',
      'FE': 'skull', 'DE': 'science', 'DC': 'toll'
    };
    return icons[type] || 'toll';
  }

  onCollegeFilterChange(college: string): void {
    this.abilityCollegeFilter.set(college);
    this.abilitySchoolFilter.set('all');
  }

  // =========================================================================
  // EQUIPMENT HELPERS
  // =========================================================================

  addWeapon(weapon: WeaponReference): void {
    this.selectedWeapons.update(weapons => {
      const existing = weapons.find(w => w.refId === weapon.id);
      if (existing) {
        return weapons.map(w => 
          w.refId === weapon.id 
            ? { ...w, quantity: (w.quantity || 1) + 1 }
            : w
        );
      }
      return [...weapons, { refId: weapon.id, quantity: 1, currentHp: weapon.baseHp }];
    });
  }

  removeWeapon(refId: string): void {
    this.selectedWeapons.update(weapons => weapons.filter(w => w.refId !== refId));
  }

  equipArmor(armor: ArmorReference): void {
    this.selectedArmor.update(armors => {
      const filtered = armors.filter(a => a.slot !== armor.slot);
      return [...filtered, { slot: armor.slot, refId: armor.id, currentHp: armor.baseHp }];
    });
  }

  unequipArmor(slot: ArmorSlot): void {
    this.selectedArmor.update(armors => armors.filter(a => a.slot !== slot));
  }

  getArmorInSlot(slot: ArmorSlot): ArmorSelection | undefined {
    return this.selectedArmor().find(a => a.slot === slot);
  }

  addAccessory(accessory: AccessoryReference): void {
    this.selectedAccessories.update(acc => {
      if (acc.find(a => a.refId === accessory.id)) return acc;
      return [...acc, { refId: accessory.id, currentHp: accessory.baseHp }];
    });
  }

  removeAccessory(refId: string): void {
    this.selectedAccessories.update(acc => acc.filter(a => a.refId !== refId));
  }

  getWeaponById(refId: string): WeaponReference | undefined {
    return this.weaponsList().find(w => w.id === refId);
  }

  getArmorById(refId: string): ArmorReference | undefined {
    return this.armorList().find(a => a.id === refId);
  }

  getAccessoryById(refId: string): AccessoryReference | undefined {
    return this.accessoriesList().find(a => a.id === refId);
  }

  readonly armorSlots: ArmorSlot[] = ['head', 'shoulders', 'chest', 'arms', 'gloves', 'legs', 'boots'];

  getArmorForSlot(slot: ArmorSlot): ArmorReference[] {
    return this.armorList().filter(a => a.slot === slot);
  }

  // =========================================================================
  // INVENTORY HELPERS
  // =========================================================================

  addItem(item: ItemReference, category: 'consumable' | 'general'): void {
    this.selectedItems.update(items => {
      const existing = items.find(i => i.refId === item.id);
      if (existing) {
        return items.map(i => 
          i.refId === item.id 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...items, { refId: item.id, quantity: 1, category }];
    });
  }

  removeItem(refId: string): void {
    this.selectedItems.update(items => items.filter(i => i.refId !== refId));
  }

  getItemById(refId: string): ItemReference | undefined {
    return this.itemsList().find(i => i.id === refId);
  }

  getConsumables(): ItemSelection[] {
    return this.selectedItems().filter(i => i.category === 'consumable');
  }

  getGeneralItems(): ItemSelection[] {
    return this.selectedItems().filter(i => i.category === 'general');
  }

  // =========================================================================
  // CHARACTER GENERATION
  // =========================================================================

  generateCharacter(): Character {
    const statsArray = this.stats();
    
    const characterStats = {
      physical: {
        might: { bonus: statsArray.find(s => s.key === 'might')?.bonus || 0, value: statsArray.find(s => s.key === 'might')?.value || 0 },
        grit: { bonus: statsArray.find(s => s.key === 'grit')?.bonus || 0, value: statsArray.find(s => s.key === 'grit')?.value || 0 },
        speed: { bonus: statsArray.find(s => s.key === 'speed')?.bonus || 0, value: statsArray.find(s => s.key === 'speed')?.value || 0 }
      },
      mental: {
        knowledge: { bonus: statsArray.find(s => s.key === 'knowledge')?.bonus || 0, value: statsArray.find(s => s.key === 'knowledge')?.value || 0 },
        foresight: { bonus: statsArray.find(s => s.key === 'foresight')?.bonus || 0, value: statsArray.find(s => s.key === 'foresight')?.value || 0 },
        courage: { bonus: statsArray.find(s => s.key === 'courage')?.bonus || 0, value: statsArray.find(s => s.key === 'courage')?.value || 0 },
        determination: { bonus: statsArray.find(s => s.key === 'determination')?.bonus || 0, value: statsArray.find(s => s.key === 'determination')?.value || 0 }
      },
      magical: {
        astrology: { bonus: statsArray.find(s => s.key === 'astrology')?.bonus || 0, value: statsArray.find(s => s.key === 'astrology')?.value || 0 },
        magiks: { bonus: statsArray.find(s => s.key === 'magiks')?.bonus || 0, value: statsArray.find(s => s.key === 'magiks')?.value || 0 },
        nature: { bonus: statsArray.find(s => s.key === 'nature')?.bonus || 0, value: statsArray.find(s => s.key === 'nature')?.value || 0 }
      }
    };

    const skills: Record<string, number> = {};
    for (const skill of this.skills()) {
      if (skill.level > 0) {
        skills[skill.id] = skill.level;
      }
    }

    const cosmicFocuses: FocusLevels = {};
    const earthlyFocuses: FocusLevels = {};
    const deadFocuses: FocusLevels = {};

    for (const focus of this.magicFocuses()) {
      if (focus.level > 0) {
        switch (focus.college) {
          case 'cosmic': cosmicFocuses[focus.id] = focus.level; break;
          case 'earthly': earthlyFocuses[focus.id] = focus.level; break;
          case 'dead': deadFocuses[focus.id] = focus.level; break;
        }
      }
    }

    const weapons = this.selectedWeapons().map(w => ({
      refId: w.refId,
      quantity: w.quantity,
      currentHp: w.currentHp
    }));

    const armor: Record<string, { refId: string; currentHp: number }> = {};
    for (const a of this.selectedArmor()) {
      armor[a.slot] = { refId: a.refId, currentHp: a.currentHp };
    }

    const accessories = this.selectedAccessories().map(a => ({
      refId: a.refId,
      currentHp: a.currentHp
    }));

    const consumables = this.getConsumables().map(i => ({
      refId: i.refId,
      quantity: i.quantity
    }));

    const general = this.getGeneralItems().map(i => ({
      refId: i.refId,
      quantity: i.quantity
    }));

    // Build components from computed pools
    const components: Record<string, { current: number; max: number }> = {};
    for (const pool of this.componentPools()) {
      const key = this.getComponentKey(pool.type);
      components[key] = { current: pool.current, max: pool.max };
    }

    const characterId = this.characterName()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');

    // Create species selection - use new format
    const species: CharacterSpeciesSelection = {
      type: 'pure',
      speciesId: this.selectedSpeciesId() as PureSpeciesId
    };

    const character: Character = {
      id: characterId,
      name: this.characterName(),
      level: this.characterLevel(),
      xp: this.characterXp(),
      species, // Updated to use CharacterSpeciesSelection
      age: this.characterAge(),
      height: this.characterHeight(),
      stats: characterStats,
      resources: {
        health: { current: this.healthCurrent(), max: this.healthMax() },
        armorHp: { current: this.totalArmorHp(), max: this.totalArmorHp() },
        stamina: { current: this.staminaCurrent(), max: this.staminaMax() },
        sanity: { current: this.sanityCurrent(), max: this.sanityMax() }
      },
      components: components as any,
      combat: {
        actionPoints: this.actionPoints(),
        baseMovement: this.baseMovement(),
        initiativeMod: this.initiativeMod()
      },
      skills,
      magic: {
        cosmic: cosmicFocuses,
        earthly: earthlyFocuses,
        dead: deadFocuses
      },
      abilities: {
        prepared: this.selectedAbilityIds()
      },
      equipment: {
        weapons,
        armor,
        accessories
      },
      inventory: {
        consumables,
        general
      },
      currency: {
        era: this.currencyEra(),
        wealth: this.currencyWealth()
      },
      backstory: '',
      appearance: '',
      alignment: {
        overall: 'undecided',
        traits: {
          compassion: 'neutral',
          mercy: 'neutral',
          humility: 'neutral',
          forgiveness: 'neutral',
          protection: 'neutral'
        }
      },
      relationships: [],
      sessionLog: []
    };

    return character;
  }

  private getComponentKey(type: ComponentType): string {
    const keyMap: Record<ComponentType, string> = {
      'SR': 'starRunes',
      'LR': 'lightRunes',
      'Hours': 'hours',
      'VS': 'voidShards',
      'RP': 'realmPoints',
      'FP': 'focusPoints',
      'LS': 'lifeSeeds',
      'CP': 'craftPoints',
      'EP': 'elementalPoints',
      'SP': 'speechPoints',
      'BP': 'bodyPoints',
      'FE': 'funeralEssence',
      'DE': 'decayEssence',
      'DC': 'damnedCoins',
      'SY': 'sanity'
    };
    return keyMap[type] || type.toLowerCase();
  }

  downloadCharacter(): void {
    const character = this.generateCharacter();
    const json = JSON.stringify(character, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${character.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // =========================================================================
  // VALIDATION
  // =========================================================================

  isStepValid(stepIndex: number): boolean {
    switch (stepIndex) {
      case 0: return this.characterName().trim().length > 0 && this.selectedSpeciesId().length > 0;
      case 1: return true;
      case 2: return true;
      case 3: return true;
      case 4: return true;
      case 5: return true;
      case 6: return true;
      case 7: return this.isStepValid(0);
      default: return false;
    }
  }

  canProceed(): boolean {
    return this.isStepValid(this.currentStep());
  }

  getSelectedSpecies(): SpeciesReference | undefined {
    return this.speciesList().find(s => s.id === this.selectedSpeciesId());
  }

  getAbilityById(id: string): AbilityReference | undefined {
    return this.allAbilities().find(a => a.id === id);
  }
}