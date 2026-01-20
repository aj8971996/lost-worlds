/**
 * Lost Worlds - Magic System
 * 
 * Structure: College > School > Focus
 * - 3 Colleges (Cosmic, Earthly, Dead)
 * - 5 Schools per college (3 for Dead)
 * - 3-6 Focuses per school
 * 
 * Progression:
 * - 2 Focus Levels = 1 School Level
 * - Associates requires 2 School Levels, all other degrees require 4 School Levels
 * - Degree determines Focus Level Cap
 */

// Magic college types
export type MagicCollege = 'cosmic' | 'earthly' | 'dead';

// Degree progression
export type MagicDegree = 'none' | 'associates' | 'bachelors' | 'masters' | 'doctorate';

// Focus level caps by degree
export const DEGREE_FOCUS_CAP: Record<MagicDegree, number> = {
  none: 3,
  associates: 5,
  bachelors: 7,
  masters: 9,
  doctorate: 12
};

// School levels required for each degree
// Associates requires 2, all others require 4 (cumulative from previous)
export const DEGREE_REQUIREMENTS: Record<MagicDegree, number> = {
  none: 0,
  associates: 2,    // 2 school levels
  bachelors: 6,     // 2 + 4 = 6 school levels
  masters: 10,      // 6 + 4 = 10 school levels
  doctorate: 14     // 10 + 4 = 14 school levels
};

// School definitions by college
export type CosmicSchool = 'stars' | 'light' | 'time' | 'void' | 'realms';
export type EarthlySchool = 'elements' | 'life' | 'speech' | 'body' | 'craft';
export type DeadSchool = 'decay' | 'damned' | 'endings';
export type MagicSchool = CosmicSchool | EarthlySchool | DeadSchool;

// Focus definitions by school
export type StarsFocus = 'divination' | 'fate' | 'prophecy' | 'constellations';
export type LightFocus = 'radiance' | 'protection' | 'purification';
export type TimeFocus = 'acceleration' | 'delay' | 'future' | 'past';
export type VoidFocus = 'shadow' | 'emptiness' | 'concealment';
export type RealmsFocus = 'plasma' | 'aether' | 'gravity' | 'ether';

export type ElementsFocus = 'earth' | 'water' | 'fire' | 'air';
export type LifeFocus = 'healing' | 'growth' | 'plants' | 'beasts';
export type SpeechFocus = 'performance' | 'rhetoric' | 'jest' | 'verse';
export type BodyFocus = 'strength' | 'speed' | 'endurance' | 'weaponArts' | 'martialArts' | 'senses';
export type CraftFocus = 'weapons' | 'wards' | 'tools' | 'items' | 'enchantment';

export type DecayFocus = 'disease' | 'entropy' | 'withering' | 'rot';
export type DamnedFocus = 'pacts' | 'corruption' | 'infernal';
export type EndingsFocus = 'passage' | 'finality' | 'reaper';

export type MagicFocus = 
  | StarsFocus | LightFocus | TimeFocus | VoidFocus | RealmsFocus
  | ElementsFocus | LifeFocus | SpeechFocus | BodyFocus | CraftFocus
  | DecayFocus | DamnedFocus | EndingsFocus;

// Complete school structure for reference data
export interface SchoolDefinition {
  id: string;
  name: string;
  college: MagicCollege;
  focuses: FocusDefinition[];
}

export interface FocusDefinition {
  id: string;
  name: string;
  school: string;
  description?: string;
}

// Character's magic progression for a single college
export interface CollegeProgression {
  totalFocusLevels: number;   // Sum of all focus levels in this college
  totalSchoolLevels: number;  // totalFocusLevels / 2 (rounded down)
  degree: MagicDegree;
  focusLevelCap: number;      // Determined by degree
}

// Character's focus level investments (stored in character data)
// Key is focus ID, value is level
export type FocusLevels = Record<string, number>;

// Character's complete magic data
export interface CharacterMagic {
  cosmic: FocusLevels;
  earthly: FocusLevels;
  dead: FocusLevels;
}

// Utility functions
export function calculateSchoolLevels(focusLevels: number): number {
  return Math.floor(focusLevels / 2);
}

export function calculateDegree(schoolLevels: number): MagicDegree {
  if (schoolLevels >= DEGREE_REQUIREMENTS.doctorate) return 'doctorate';
  if (schoolLevels >= DEGREE_REQUIREMENTS.masters) return 'masters';
  if (schoolLevels >= DEGREE_REQUIREMENTS.bachelors) return 'bachelors';
  if (schoolLevels >= DEGREE_REQUIREMENTS.associates) return 'associates';
  return 'none';
}

export function calculateCollegeProgression(focusLevels: FocusLevels): CollegeProgression {
  const totalFocusLevels = Object.values(focusLevels).reduce((sum, level) => sum + level, 0);
  const totalSchoolLevels = calculateSchoolLevels(totalFocusLevels);
  const degree = calculateDegree(totalSchoolLevels);
  
  return {
    totalFocusLevels,
    totalSchoolLevels,
    degree,
    focusLevelCap: DEGREE_FOCUS_CAP[degree]
  };
}

// Component types associated with each college
export const COLLEGE_COMPONENTS: Record<MagicCollege, string[]> = {
  cosmic: ['voidShards'],
  earthly: ['focusPoints', 'lifeSeeds', 'craftPoints'],
  dead: ['deathEssence']  // Placeholder - adjust based on your system
};
