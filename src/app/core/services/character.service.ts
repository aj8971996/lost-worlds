import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, catchError } from 'rxjs';
import { ReferenceDataService, AllReferenceData } from './reference-data.service';
import {
  Character,
  CharacterSummary,
  ResolvedCharacter,
  CharacterSpeciesSelection,
  migrateSpeciesId
} from '../models/character.model';
import { SpeciesReference } from '../models/species.model';
import {
  WeaponInstance,
  ArmorInstance,
  ItemInstance,
  AccessoryInstance,
  ResolvedWeapon,
  ResolvedArmor,
  ResolvedItem,
  ResolvedAccessory,
  ResolvedEquipment,
  ResolvedInventory,
  ArmorSlot
} from '../models/equipment.model';
import { ResolvedAbility } from '../models/ability.model';
import { ResolvedSkill, SkillId } from '../models/skills.model';
import { calculateMod } from '../models/stats.model';

/**
 * Raw character data that might have legacy species format
 */
interface RawCharacter extends Omit<Character, 'species'> {
  species: CharacterSpeciesSelection | string;  // Can be new format or legacy string
  speciesId?: string;  // Legacy field
}

/**
 * Service for loading characters and resolving all references.
 */
@Injectable({
  providedIn: 'root'
})
export class CharacterService {
  private readonly http = inject(HttpClient);
  private readonly refData = inject(ReferenceDataService);
  private readonly basePath = 'data/characters';

  // ============================================================================
  // LOADING
  // ============================================================================

  /**
   * Get list of all characters (summary only)
   */
  getCharacterList(): Observable<CharacterSummary[]> {
    return this.http.get<RawCharacter[]>(`${this.basePath}/index.json`).pipe(
      map(rawChars => rawChars.map(raw => this.normalizeCharacterSummary(raw))),
      catchError(error => {
        console.error('Failed to load character index', error);
        return of([]);
      })
    );
  }

  /**
   * Load raw character data (unresolved)
   */
  getCharacter(id: string): Observable<Character | null> {
    return this.http.get<RawCharacter>(`${this.basePath}/${id}.json`).pipe(
      map(raw => this.normalizeCharacter(raw)),
      catchError(error => {
        console.error(`Failed to load character: ${id}`, error);
        return of(null);
      })
    );
  }

  /**
   * Load character with all references resolved
   */
  getResolvedCharacter(id: string): Observable<ResolvedCharacter | null> {
    return forkJoin({
      character: this.getCharacter(id),
      refData: this.refData.loadAllReferenceData()
    }).pipe(
      map(({ character, refData }) => {
        if (!character) return null;
        return this.resolveCharacter(character, refData);
      })
    );
  }

  // ============================================================================
  // NORMALIZATION (Legacy Support)
  // ============================================================================

  /**
   * Normalize raw character data to current format
   * Handles legacy species format
   */
  private normalizeCharacter(raw: RawCharacter): Character {
    // Handle species migration
    let species: CharacterSpeciesSelection;
    
    if (typeof raw.species === 'string') {
      // Legacy format: just a string ID
      species = migrateSpeciesId(raw.species);
    } else if (raw.speciesId && typeof raw.speciesId === 'string') {
      // Legacy format: speciesId field
      species = migrateSpeciesId(raw.speciesId);
    } else {
      // New format: already a CharacterSpeciesSelection
      species = raw.species as CharacterSpeciesSelection;
    }

    const { speciesId, ...rest } = raw as any;
    
    return {
      ...rest,
      species
    } as Character;
  }

  /**
   * Normalize character summary from raw data
   */
  private normalizeCharacterSummary(raw: RawCharacter): CharacterSummary {
    let species: CharacterSpeciesSelection;
    
    if (typeof raw.species === 'string') {
      species = migrateSpeciesId(raw.species);
    } else if (raw.speciesId && typeof raw.speciesId === 'string') {
      species = migrateSpeciesId(raw.speciesId);
    } else {
      species = raw.species as CharacterSpeciesSelection;
    }

    return {
      id: raw.id,
      name: raw.name,
      level: raw.level,
      species,
      player: (raw as any).player
    };
  }

  // ============================================================================
  // RESOLUTION
  // ============================================================================

  private resolveCharacter(character: Character, refData: AllReferenceData): ResolvedCharacter {
    const species = this.resolveSpecies(character.species, refData);

    return {
      ...character,
      species,
      equipment: this.resolveEquipment(character.equipment, refData),
      inventory: this.resolveInventory(character.inventory, refData),
      abilities: {
        prepared: this.resolveAbilities(character.abilities.prepared, refData),
        maxPrepared: 3 + character.level
      },
      resolvedSkills: this.resolveSkills(character.skills, refData),
      computed: this.computeDerivedValues(character)
    };
  }

  /**
   * Resolve species selection to actual species data
   */
  private resolveSpecies(
    selection: CharacterSpeciesSelection,
    refData: AllReferenceData
  ): SpeciesReference {
    if (selection.type === 'pure') {
      const species = refData.species[selection.speciesId];
      if (species) return species;
      
      // Fallback for unknown species
      return this.unknownSpecies(selection.speciesId);
    } else {
      // Mixed heritage
      const species = refData.species[selection.mixedHeritageId];
      if (species) return species;
      
      // Fallback for unknown mixed heritage
      return this.unknownSpecies(selection.mixedHeritageId);
    }
  }

  private resolveEquipment(
    equipment: Character['equipment'],
    refData: AllReferenceData
  ): ResolvedEquipment {
    return {
      weapons: equipment.weapons.map(w => this.resolveWeapon(w, refData)),
      armor: this.resolveArmorSlots(equipment.armor, refData),
      accessories: equipment.accessories.map(a => this.resolveAccessory(a, refData))
    };
  }

  private resolveWeapon(instance: WeaponInstance, refData: AllReferenceData): ResolvedWeapon {
    const ref = refData.weapons[instance.refId];
    if (!ref) {
      return {
        id: instance.refId,
        name: `Unknown (${instance.refId})`,
        type: 'dagger',
        category: 'earthly',  // Default to earthly for unknown weapons
        damage: '1D4',
        range: 'Melee',
        apCost: 1,
        baseHp: 10,
        currentHp: instance.currentHp,
        maxHp: 10,
        quantity: instance.quantity
      };
    }

    return {
      ...ref,
      currentHp: instance.currentHp,
      maxHp: ref.baseHp,
      quantity: instance.quantity,
      customName: instance.customName,
      modifications: instance.modifications
    };
  }

  private resolveAccessory(instance: AccessoryInstance, refData: AllReferenceData): ResolvedAccessory {
    const ref = refData.accessories?.[instance.refId];
    if (!ref) {
      return {
        id: instance.refId,
        name: `Unknown (${instance.refId})`,
        baseHp: 10,
        effect: 'Unknown effect',
        currentHp: instance.currentHp,
        maxHp: 10
      };
    }

    return {
      ...ref,
      currentHp: instance.currentHp,
      maxHp: ref.baseHp
    };
  }

  private resolveArmorSlots(
    armor: Character['equipment']['armor'],
    refData: AllReferenceData
  ): Partial<Record<ArmorSlot, ResolvedArmor>> {
    const resolved: Partial<Record<ArmorSlot, ResolvedArmor>> = {};

    for (const [slot, instance] of Object.entries(armor)) {
      if (instance) {
        const ref = refData.armor[instance.refId];
        if (ref) {
          resolved[slot as ArmorSlot] = {
            ...ref,
            currentHp: instance.currentHp,
            maxHp: ref.baseHp,
            cooldownsUsed: instance.cooldownsUsed
          };
        }
      }
    }

    return resolved;
  }

  private resolveInventory(
    inventory: Character['inventory'],
    refData: AllReferenceData
  ): ResolvedInventory {
    return {
      consumables: inventory.consumables.map(i => this.resolveItem(i, refData)),
      general: inventory.general.map(i => this.resolveItem(i, refData))
    };
  }

  private resolveItem(instance: ItemInstance, refData: AllReferenceData): ResolvedItem {
    const ref = refData.items[instance.refId];
    if (!ref) {
      return {
        id: instance.refId,
        name: `Unknown (${instance.refId})`,
        category: 'general',
        stackable: true,
        quantity: instance.quantity
      };
    }

    return {
      ...ref,
      quantity: instance.quantity,
      customName: instance.customName
    };
  }

  private resolveAbilities(abilityIds: string[], refData: AllReferenceData): ResolvedAbility[] {
    return abilityIds.map(id => {
      const ref = refData.abilities[id];
      if (!ref) {
        return {
          id,
          name: `Unknown (${id})`,
          source: { type: 'innate' as const },
          apCost: 1,
          range: 'self',
          target: 'self',
          duration: 'instant',
          description: 'Unknown ability',
          isPassive: false,
          isRitual: false,
          isSustained: false
        };
      }
      return { ...ref };
    });
  }

  private resolveSkills(
    skills: Character['skills'],
    refData: AllReferenceData
  ): ResolvedSkill[] {
    return Object.entries(skills).map(([id, level]) => {
      const ref = refData.skills[id];
      return {
        id: id as SkillId,
        name: ref?.name || id,
        description: ref?.description || '',
        level: level || 0,
        bonusDice: level || 0
      };
    });
  }

  private computeDerivedValues(character: Character): ResolvedCharacter['computed'] {
    const stats = character.stats;
    
    // Calculate total armor HP
    let totalArmorHp = 0;
    for (const armor of Object.values(character.equipment.armor)) {
      if (armor) {
        totalArmorHp += armor.currentHp;
      }
    }

    // Get stat values for attack/defense calculations
    const spd = stats.physical.speed.value;
    const mit = stats.physical.might.value;
    const grt = stats.physical.grit.value;
    const knw = stats.mental.knowledge.value;
    const frs = stats.mental.foresight.value;
    const det = stats.mental.determination.value;
    const ast = stats.magical.astrology.value;
    const mag = stats.magical.magiks.value;

    return {
      totalArmorHp,
      attackBonuses: {
        physical: calculateMod(spd) + calculateMod(mit),
        ranged: calculateMod(spd) + calculateMod(knw),
        magical: calculateMod(ast) + calculateMod(mag)
      },
      defenseBonuses: {
        physical: calculateMod(spd) + calculateMod(grt),
        ranged: calculateMod(spd) + calculateMod(frs),
        magical: calculateMod(det) + calculateMod(frs)
      }
    };
  }

  private unknownSpecies(id: string): SpeciesReference {
    return {
      id,
      name: `Unknown (${id})`,
      description: 'Unknown species',
      modifiers: []
    } as any;
  }
}