import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, shareReplay, of, catchError } from 'rxjs';
import {
  WeaponReference,
  ArmorReference,
  AccessoryReference,
  ItemReference
} from '../models/equipment.model';
import { AbilityReference, hasCollegeAndFocus } from '../models/ability.model';
import { SkillReference } from '../models/skills.model';
import {
  PureSpeciesReference,
  MixedHeritageReference,
  SpeciesReference,
  PureSpeciesId,
  isPureSpecies,
  calculateMixedHeritageRules,
  getMixedHeritageName,
  getMixedHeritageComponentAccess
} from '../models/species.model';

/**
 * Service for loading and caching all reference data.
 * Reference data is loaded once and cached for the session.
 */
@Injectable({
  providedIn: 'root'
})
export class ReferenceDataService {
  private readonly http = inject(HttpClient);
  private readonly basePath = 'data/reference';

  // Ability files organized by college/school
  private readonly abilityFiles = [
    // Cosmic College
    'abilities/cosmic/stars',
    'abilities/cosmic/light',
    'abilities/cosmic/time',
    'abilities/cosmic/void',
    'abilities/cosmic/realms',
    // Earthly College
    'abilities/earthly/elements',
    'abilities/earthly/life',
    'abilities/earthly/speech',
    'abilities/earthly/body',
    'abilities/earthly/craft',
    // Dead College
    'abilities/dead/decay',
    'abilities/dead/damned',
    'abilities/dead/endings'
  ];

  // Cached observables
  private weapons$?: Observable<Record<string, WeaponReference>>;
  private armor$?: Observable<Record<string, ArmorReference>>;
  private accessories$?: Observable<Record<string, AccessoryReference>>;
  private items$?: Observable<Record<string, ItemReference>>;
  private abilities$?: Observable<Record<string, AbilityReference>>;
  private skills$?: Observable<Record<string, SkillReference>>;
  private pureSpecies$?: Observable<Record<string, PureSpeciesReference>>;
  private mixedHeritage$?: Observable<Record<string, MixedHeritageReference>>;
  private magicSchools$?: Observable<Record<string, unknown>>;

  // ============================================================================
  // INDIVIDUAL LOADERS
  // ============================================================================

  getWeapons(): Observable<Record<string, WeaponReference>> {
    if (!this.weapons$) {
      this.weapons$ = this.loadJson<Record<string, WeaponReference>>('weapons').pipe(
        shareReplay(1)
      );
    }
    return this.weapons$;
  }

  getArmor(): Observable<Record<string, ArmorReference>> {
    if (!this.armor$) {
      this.armor$ = this.loadJson<Record<string, ArmorReference>>('armor').pipe(
        shareReplay(1)
      );
    }
    return this.armor$;
  }

  getAccessories(): Observable<Record<string, AccessoryReference>> {
    if (!this.accessories$) {
      this.accessories$ = this.loadJson<Record<string, AccessoryReference>>('accessories').pipe(
        shareReplay(1)
      );
    }
    return this.accessories$;
  }

  getItems(): Observable<Record<string, ItemReference>> {
    if (!this.items$) {
      this.items$ = this.loadJson<Record<string, ItemReference>>('items').pipe(
        shareReplay(1)
      );
    }
    return this.items$;
  }

  getAbilities(): Observable<Record<string, AbilityReference>> {
    if (!this.abilities$) {
      this.abilities$ = this.loadAllAbilities().pipe(
        shareReplay(1)
      );
    }
    return this.abilities$;
  }

  getSkills(): Observable<Record<string, SkillReference>> {
    if (!this.skills$) {
      this.skills$ = this.loadJson<Record<string, SkillReference>>('skills').pipe(
        shareReplay(1)
      );
    }
    return this.skills$;
  }

  // ============================================================================
  // SPECIES LOADERS (UPDATED)
  // ============================================================================

  /**
   * Get pure species definitions
   */
  getPureSpecies(): Observable<Record<string, PureSpeciesReference>> {
    if (!this.pureSpecies$) {
      this.pureSpecies$ = this.loadJson<Record<string, PureSpeciesReference>>('species').pipe(
        shareReplay(1)
      );
    }
    return this.pureSpecies$;
  }

  /**
   * Get mixed heritage definitions
   */
  getMixedHeritage(): Observable<Record<string, MixedHeritageReference>> {
    if (!this.mixedHeritage$) {
      this.mixedHeritage$ = this.loadJson<Record<string, MixedHeritageReference>>('mixed-heritage').pipe(
        catchError(() => of({})), // File may not exist if no custom mixed heritage defined
        shareReplay(1)
      );
    }
    return this.mixedHeritage$;
  }

  /**
   * Get all species (both pure and mixed)
   */
  getAllSpecies(): Observable<Record<string, SpeciesReference>> {
    return forkJoin({
      pure: this.getPureSpecies(),
      mixed: this.getMixedHeritage()
    }).pipe(
      map(({ pure, mixed }) => ({ ...pure, ...mixed }))
    );
  }

  getMagicSchools(): Observable<Record<string, unknown>> {
    if (!this.magicSchools$) {
      this.magicSchools$ = this.loadJson<Record<string, unknown>>('magic-schools').pipe(
        shareReplay(1)
      );
    }
    return this.magicSchools$;
  }

  // ============================================================================
  // BULK LOADER
  // ============================================================================

  loadAllReferenceData(): Observable<AllReferenceData> {
    return forkJoin({
      weapons: this.getWeapons(),
      armor: this.getArmor(),
      accessories: this.getAccessories(),
      items: this.getItems(),
      abilities: this.getAbilities(),
      skills: this.getSkills(),
      species: this.getAllSpecies(),
      magicSchools: this.getMagicSchools()
    });
  }

  // ============================================================================
  // LOOKUP HELPERS
  // ============================================================================

  getWeaponById(id: string): Observable<WeaponReference | undefined> {
    return this.getWeapons().pipe(map(weapons => weapons[id]));
  }

  getArmorById(id: string): Observable<ArmorReference | undefined> {
    return this.getArmor().pipe(map(armor => armor[id]));
  }

  getAccessoryById(id: string): Observable<AccessoryReference | undefined> {
    return this.getAccessories().pipe(map(accessories => accessories[id]));
  }

  getItemById(id: string): Observable<ItemReference | undefined> {
    return this.getItems().pipe(map(items => items[id]));
  }

  getAbilityById(id: string): Observable<AbilityReference | undefined> {
    return this.getAbilities().pipe(map(abilities => abilities[id]));
  }

  getSkillById(id: string): Observable<SkillReference | undefined> {
    return this.getSkills().pipe(map(skills => skills[id]));
  }

  getSpeciesById(id: string): Observable<SpeciesReference | undefined> {
    return this.getAllSpecies().pipe(map(species => species[id]));
  }

  // ============================================================================
  // SPECIES-SPECIFIC HELPERS
  // ============================================================================

  /**
   * Get a pure species by ID
   */
  getPureSpeciesById(id: PureSpeciesId): Observable<PureSpeciesReference | undefined> {
    return this.getPureSpecies().pipe(map(species => species[id]));
  }

  /**
   * Get mixed heritage rules for two species
   */
  getMixedHeritageRulesFor(parent1Id: PureSpeciesId, parent2Id: PureSpeciesId): Observable<any> {
    return forkJoin({
      parent1: this.getPureSpeciesById(parent1Id),
      parent2: this.getPureSpeciesById(parent2Id)
    }).pipe(
      map(({ parent1, parent2 }) => {
        if (!parent1 || !parent2) {
          throw new Error('Species not found');
        }
        return calculateMixedHeritageRules(parent1, parent2);
      })
    );
  }

  /**
   * Create a mixed heritage species reference dynamically
   */
  createMixedHeritageSpecies(
    parent1Id: PureSpeciesId,
    parent2Id: PureSpeciesId,
    selectedModifiers: any[]
  ): Observable<MixedHeritageReference> {
    return forkJoin({
      parent1: this.getPureSpeciesById(parent1Id),
      parent2: this.getPureSpeciesById(parent2Id)
    }).pipe(
      map(({ parent1, parent2 }) => {
        if (!parent1 || !parent2) {
          throw new Error('Species not found');
        }

        const id = `${parent1Id}-${parent2Id}`;
        const name = getMixedHeritageName(parent1.name, parent2.name);
        const componentAccess = getMixedHeritageComponentAccess(parent1, parent2);

        // Combine traits from both parents
        const traits = [
          ...(parent1.traits || []),
          ...(parent2.traits || [])
        ];

        return {
          id,
          name,
          parent1: parent1Id,
          parent2: parent2Id,
          selectedModifiers,
          traits,
          componentAccess
        };
      })
    );
  }

  // ============================================================================
  // ABILITY-SPECIFIC HELPERS (unchanged from original)
  // ============================================================================

  getAbilitiesByCollege(college: 'cosmic' | 'earthly' | 'dead'): Observable<Record<string, AbilityReference>> {
    return this.getAbilities().pipe(
      map(abilities => {
        const filtered: Record<string, AbilityReference> = {};
        for (const [id, ability] of Object.entries(abilities)) {
          if (hasCollegeAndFocus(ability.source)) {
            if (ability.source.college === college) {
              filtered[id] = ability;
            }
          }
        }
        return filtered;
      })
    );
  }

  getAbilitiesBySchool(school: string): Observable<Record<string, AbilityReference>> {
    return this.getAbilities().pipe(
      map(abilities => {
        const filtered: Record<string, AbilityReference> = {};
        for (const [id, ability] of Object.entries(abilities)) {
          if (hasCollegeAndFocus(ability.source)) {
            if ('school' in ability.source && ability.source.school === school) {
              filtered[id] = ability;
            } else if (this.focusToSchool(ability.source.focus) === school) {
              filtered[id] = ability;
            }
          }
        }
        return filtered;
      })
    );
  }

  getAbilitiesByFocus(focus: string): Observable<Record<string, AbilityReference>> {
    return this.getAbilities().pipe(
      map(abilities => {
        const filtered: Record<string, AbilityReference> = {};
        for (const [id, ability] of Object.entries(abilities)) {
          if (hasCollegeAndFocus(ability.source)) {
            if (ability.source.focus === focus) {
              filtered[id] = ability;
            }
          }
        }
        return filtered;
      })
    );
  }

  getAbilitiesAtLevel(focus: string, level: number): Observable<Record<string, AbilityReference>> {
    return this.getAbilities().pipe(
      map(abilities => {
        const filtered: Record<string, AbilityReference> = {};
        for (const [id, ability] of Object.entries(abilities)) {
          if (hasCollegeAndFocus(ability.source)) {
            if (ability.source.focus === focus && ability.source.requiredLevel <= level) {
              filtered[id] = ability;
            }
          }
        }
        return filtered;
      })
    );
  }

  getAbilitiesBySchoolAtLevel(school: string, level: number): Observable<Record<string, AbilityReference>> {
    return this.getAbilitiesBySchool(school).pipe(
      map(abilities => {
        const filtered: Record<string, AbilityReference> = {};
        for (const [id, ability] of Object.entries(abilities)) {
          if (hasCollegeAndFocus(ability.source)) {
            if (ability.source.requiredLevel <= level) {
              filtered[id] = ability;
            }
          }
        }
        return filtered;
      })
    );
  }

  getSummonAbilities(): Observable<Record<string, AbilityReference>> {
    return this.getAbilities().pipe(
      map(abilities => {
        const filtered: Record<string, AbilityReference> = {};
        for (const [id, ability] of Object.entries(abilities)) {
          if (ability.summon) {
            filtered[id] = ability;
          }
        }
        return filtered;
      })
    );
  }

  getReactionAbilities(): Observable<Record<string, AbilityReference>> {
    return this.getAbilities().pipe(
      map(abilities => {
        const filtered: Record<string, AbilityReference> = {};
        for (const [id, ability] of Object.entries(abilities)) {
          if (ability.isReaction || ability.timing === 'reaction') {
            filtered[id] = ability;
          }
        }
        return filtered;
      })
    );
  }

  getAbilitiesByDamageType(damageType: string): Observable<Record<string, AbilityReference>> {
    return this.getAbilities().pipe(
      map(abilities => {
        const filtered: Record<string, AbilityReference> = {};
        for (const [id, ability] of Object.entries(abilities)) {
          if (ability.damage && typeof ability.damage === 'object' && ability.damage.type === damageType) {
            filtered[id] = ability;
          }
        }
        return filtered;
      })
    );
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private focusToSchool(focus: string): string | null {
    const mapping: Record<string, string> = {
      // Cosmic - Stars
      divination: 'stars', fate: 'stars', prophecy: 'stars', constellations: 'stars',
      // Cosmic - Light
      radiance: 'light', protection: 'light', purification: 'light',
      // Cosmic - Time
      acceleration: 'time', delay: 'time', future: 'time', past: 'time',
      // Cosmic - Void
      shadow: 'void', emptiness: 'void', concealment: 'void',
      // Cosmic - Realms
      plasma: 'realms', aether: 'realms', gravity: 'realms', ether: 'realms',
      // Earthly - Elements
      earth: 'elements', water: 'elements', fire: 'elements', air: 'elements',
      // Earthly - Life
      healing: 'life', growth: 'life', plants: 'life', beasts: 'life',
      // Earthly - Speech
      performance: 'speech', rhetoric: 'speech', jest: 'speech', verse: 'speech',
      // Earthly - Body
      strength: 'body', speed: 'body', endurance: 'body', 
      weaponArts: 'body', martialArts: 'body', senses: 'body',
      // Earthly - Craft
      weapons: 'craft', wards: 'craft', tools: 'craft', 
      items: 'craft', enchantment: 'craft',
      // Dead - Decay
      disease: 'decay', entropy: 'decay', withering: 'decay', rot: 'decay',
      // Dead - Damned
      pacts: 'damned', corruption: 'damned', infernal: 'damned',
      // Dead - Endings
      passage: 'endings', finality: 'endings', reaper: 'endings',
    };
    return mapping[focus] || null;
  }

  private loadAllAbilities(): Observable<Record<string, AbilityReference>> {
    const abilityLoaders = this.abilityFiles.map(file =>
      this.loadJson<Record<string, AbilityReference>>(file).pipe(
        catchError(error => {
          console.warn(`Ability file not found: ${file}.json`);
          return of({} as Record<string, AbilityReference>);
        })
      )
    );

    return forkJoin(abilityLoaders).pipe(
      map(abilityRecords => {
        const merged: Record<string, AbilityReference> = {};
        for (const record of abilityRecords) {
          Object.assign(merged, record);
        }
        return merged;
      })
    );
  }

  private loadJson<T>(filename: string): Observable<T> {
    return this.http.get<T>(`${this.basePath}/${filename}.json`).pipe(
      catchError(error => {
        console.error(`Failed to load reference data: ${filename}`, error);
        return of({} as T);
      })
    );
  }
}

// Type for all reference data combined
export interface AllReferenceData {
  weapons: Record<string, WeaponReference>;
  armor: Record<string, ArmorReference>;
  accessories: Record<string, AccessoryReference>;
  items: Record<string, ItemReference>;
  abilities: Record<string, AbilityReference>;
  skills: Record<string, SkillReference>;
  species: Record<string, SpeciesReference>;
  magicSchools: Record<string, unknown>;
}