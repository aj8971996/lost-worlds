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
import { SpeciesReference } from '../models/character.model';

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

  // Cached observables (shareReplay ensures single load)
  private weapons$?: Observable<Record<string, WeaponReference>>;
  private armor$?: Observable<Record<string, ArmorReference>>;
  private accessories$?: Observable<Record<string, AccessoryReference>>;
  private items$?: Observable<Record<string, ItemReference>>;
  private abilities$?: Observable<Record<string, AbilityReference>>;
  private skills$?: Observable<Record<string, SkillReference>>;
  private species$?: Observable<Record<string, SpeciesReference>>;
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

  /**
   * Load all abilities from multiple school files and merge them.
   * Files are organized by college/school for maintainability.
   */
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

  getSpecies(): Observable<Record<string, SpeciesReference>> {
    if (!this.species$) {
      this.species$ = this.loadJson<Record<string, SpeciesReference>>('species').pipe(
        shareReplay(1)
      );
    }
    return this.species$;
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

  /**
   * Load all reference data at once.
   * Useful for initial app load or ensuring all data is cached.
   */
  loadAllReferenceData(): Observable<AllReferenceData> {
    return forkJoin({
      weapons: this.getWeapons(),
      armor: this.getArmor(),
      accessories: this.getAccessories(),
      items: this.getItems(),
      abilities: this.getAbilities(),
      skills: this.getSkills(),
      species: this.getSpecies(),
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
    return this.getSpecies().pipe(map(species => species[id]));
  }

  // ============================================================================
  // ABILITY-SPECIFIC HELPERS
  // ============================================================================

  /**
   * Get abilities filtered by college
   */
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

  /**
   * Get abilities filtered by school
   * Supports both new format (school in source) and legacy (derived from focus)
   */
  getAbilitiesBySchool(school: string): Observable<Record<string, AbilityReference>> {
    return this.getAbilities().pipe(
      map(abilities => {
        const filtered: Record<string, AbilityReference> = {};
        for (const [id, ability] of Object.entries(abilities)) {
          if (hasCollegeAndFocus(ability.source)) {
            // Check new format first
            if ('school' in ability.source && ability.source.school === school) {
              filtered[id] = ability;
            }
            // Fallback to focus-based school detection
            else if (this.focusToSchool(ability.source.focus) === school) {
              filtered[id] = ability;
            }
          }
        }
        return filtered;
      })
    );
  }

  /**
   * Get abilities filtered by focus
   */
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

  /**
   * Get abilities available at a specific focus level
   */
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

  /**
   * Get abilities for a school at a specific level
   */
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

  /**
   * Get all summon abilities
   */
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

  /**
   * Get all reaction abilities
   */
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

  /**
   * Get abilities that deal a specific damage type
   */
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

  /**
   * Map focus to school (legacy support)
   */
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

  /**
   * Load all ability files and merge them into a single record
   */
  private loadAllAbilities(): Observable<Record<string, AbilityReference>> {
    const abilityLoaders = this.abilityFiles.map(file =>
      this.loadJson<Record<string, AbilityReference>>(file).pipe(
        catchError(error => {
          // Log but don't fail - file might not exist yet
          console.warn(`Ability file not found: ${file}.json`);
          return of({} as Record<string, AbilityReference>);
        })
      )
    );

    return forkJoin(abilityLoaders).pipe(
      map(abilityRecords => {
        // Merge all ability records into one
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