/**
 * Lost Worlds - Skills System
 * 
 * 17 defined skills
 * Each skill: level 0-10, grants +D20 equal to level
 * Characters gain +1 skill level to distribute per character level
 */

// All skill IDs in the system
export type SkillId =
  | 'master-lockpicker'
  | 'great-performer'
  | 'best-cook'
  | 'bartender'
  | 'bandaid-maker'
  | 'earthly-diagnoser'
  | 'cosmic-diagnoser'
  | 'earthly-historian'
  | 'cosmic-historian'
  | 'lore-master'
  | 'earthly-botanist'
  | 'cosmic-botanist'
  | 'earthly-beast-master'
  | 'cosmic-beast-master'
  | 'vehicular-variety'
  | 'codebreaker'
  | 'noblemen';

// Reference data: Skill definition
export interface SkillReference {
  id: SkillId;
  name: string;
  description: string;
  category?: 'general' | 'knowledge' | 'social' | 'survival';
  associatedStat?: string;  // Primary stat used with this skill
}

// Character's skill levels (stored in character data)
// Key is skill ID, value is level (0-10)
export type CharacterSkills = Partial<Record<SkillId, number>>;

// Resolved skill for UI display
export interface ResolvedSkill extends SkillReference {
  level: number;
  bonusDice: number;  // Equal to level
}

// Constants
export const MAX_SKILL_LEVEL = 10;

// Utility functions
export function getSkillBonusDice(level: number): number {
  return Math.min(level, MAX_SKILL_LEVEL);
}

export function getAvailableSkillPoints(characterLevel: number, allocatedPoints: number): number {
  // +1 skill level per character level
  return characterLevel - allocatedPoints;
}

export function getTotalAllocatedSkillPoints(skills: CharacterSkills): number {
  return Object.values(skills).reduce((sum, level) => sum + (level || 0), 0);
}
