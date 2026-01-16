import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, shareReplay, of, catchError } from 'rxjs';
import {
  WeaponReference,
  ArmorReference,
  AccessoryReference,
  ItemReference
} from '../models/equipment.model';
import { AbilityReference } from '../models/ability.model';
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

  getAbilities(): Observable<Record<string, AbilityReference>> {
    if (!this.abilities$) {
      this.abilities$ = this.loadJson<Record<string, AbilityReference>>('abilities').pipe(
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
  // PRIVATE HELPERS
  // ============================================================================

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