/**
 * Lost Worlds - Session Notes System
 * 
 * Session notes capture the narrative of each game session.
 * Each session includes:
 * - Preface (scene setting, introductions)
 * - Combat (action sequences, encounters)
 * - End (conclusions, hooks for next session)
 * 
 * Sessions reference characters by ID, resolved at runtime.
 */

import { CharacterSummary } from './character.model';

// ============================================================================
// SESSION (STORED DATA)
// ============================================================================

/**
 * Session as stored in JSON files.
 * Contains player references (IDs) to be resolved at runtime.
 */
export interface Session {
  // Identity
  id: string;                       // e.g., "session-zero", "session-one"
  sessionNumber: number;            // Sequential session number
  sessionDate: string;              // ISO date string (e.g., "2025-12-20")
  
  // Narrative sections
  sessionNotesPreface: string;      // Scene setting, introductions
  sessionNotesCombat: string;       // Combat encounters, action sequences
  sessionNotesEnd: string;          // Conclusions, plot hooks
  
  // Participants
  playerIds: string[];              // Character IDs who participated
  
  // Rewards
  experienceGained: number;         // XP awarded this session
  
  // Optional metadata
  title?: string;                   // Optional session title/name
  location?: string;                // Primary location(s) featured
  npcsIntroduced?: string[];        // Notable NPCs introduced
  itemsAcquired?: string[];         // Notable items gained
  notes?: string;                   // GM private notes
}

// ============================================================================
// RESOLVED SESSION (FOR UI)
// ============================================================================

/**
 * Session with all references resolved.
 * This is what components and templates work with.
 */
export interface ResolvedSession extends Omit<Session, 'playerIds'> {
  players: CharacterSummary[];      // Resolved character summaries
  
  // Computed values
  computed: {
    formattedDate: string;          // Human-readable date
    wordCount: number;              // Total words in notes
    hasAllSections: boolean;        // All note sections filled
  };
}

// ============================================================================
// SESSION SUMMARY (For listing)
// ============================================================================

/**
 * Minimal session info for list views.
 * Stored in sessions/index.json
 */
export interface SessionSummary {
  id: string;
  sessionNumber: number;
  sessionDate: string;
  title?: string;
  playerIds: string[];
  experienceGained: number;
}

// ============================================================================
// SESSION INDEX (Campaign overview)
// ============================================================================

/**
 * Campaign-level session tracking
 */
export interface SessionIndex {
  campaignName: string;
  totalSessions: number;
  totalExperience: number;
  sessions: SessionSummary[];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format a date string for display
 */
export function formatSessionDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

/**
 * Parse legacy date format (MMDDYYYY) to ISO string
 */
export function parseLegacyDate(legacyDate: number | string): string {
  const dateStr = String(legacyDate);
  if (dateStr.length === 8) {
    const month = dateStr.substring(0, 2);
    const day = dateStr.substring(2, 4);
    const year = dateStr.substring(4, 8);
    return `${year}-${month}-${day}`;
  }
  return String(legacyDate);
}

/**
 * Calculate word count across all note sections
 */
export function calculateWordCount(session: Session): number {
  const allText = [
    session.sessionNotesPreface,
    session.sessionNotesCombat,
    session.sessionNotesEnd
  ].join(' ');
  
  return allText.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Check if all note sections are filled
 */
export function hasAllSections(session: Session): boolean {
  return Boolean(
    session.sessionNotesPreface?.trim() &&
    session.sessionNotesCombat?.trim() &&
    session.sessionNotesEnd?.trim()
  );
}

/**
 * Calculate total XP from multiple sessions
 */
export function calculateTotalExperience(sessions: Session[]): number {
  return sessions.reduce((total, session) => total + session.experienceGained, 0);
}

/**
 * Get sessions for a specific player
 */
export function getSessionsForPlayer(sessions: Session[], playerId: string): Session[] {
  return sessions.filter(session => session.playerIds.includes(playerId));
}

/**
 * Sort sessions by session number
 */
export function sortSessionsByNumber(sessions: Session[], ascending = true): Session[] {
  return [...sessions].sort((a, b) => 
    ascending 
      ? a.sessionNumber - b.sessionNumber 
      : b.sessionNumber - a.sessionNumber
  );
}

/**
 * Create a session summary from a full session
 */
export function toSessionSummary(session: Session): SessionSummary {
  return {
    id: session.id,
    sessionNumber: session.sessionNumber,
    sessionDate: session.sessionDate,
    title: session.title,
    playerIds: session.playerIds,
    experienceGained: session.experienceGained
  };
}