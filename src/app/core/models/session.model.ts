/**
 * Lost Worlds - Session Notes System
 * 
 * Session notes capture the narrative of each game session.
 * Each session includes:
 * - Preface (scene setting, introductions)
 * - Combat (action sequences, encounters)
 * - End (conclusions, hooks for next session)
 * - NPCs Met (characters encountered)
 * - Locations Visited (places explored)
 * 
 * Sessions reference characters by ID, resolved at runtime.
 * Sessions belong to a Campaign for multi-campaign support.
 */

import { CharacterSummary } from './character.model';

// ============================================================================
// CAMPAIGN
// ============================================================================

/**
 * Campaign definition for grouping sessions
 */
export interface Campaign {
  id: string;                       // e.g., "flamingos-shadow-test-01"
  name: string;                     // e.g., "Flamingo's Shadow - Test - 01"
  description?: string;             // Campaign overview
  startDate?: string;               // ISO date string
  status: CampaignStatus;           // active, completed, hiatus
  setting?: string;                 // e.g., "1940s Las Vegas"
  imageUrl?: string;                // Campaign banner/logo
}

export type CampaignStatus = 'active' | 'completed' | 'hiatus';

/**
 * Minimal campaign info for list views
 */
export interface CampaignSummary {
  id: string;
  name: string;
  status: CampaignStatus;
  sessionCount?: number;
}

// ============================================================================
// NPCs
// ============================================================================

/**
 * NPC encountered during a session
 */
export interface SessionNpc {
  id: string;                       // Unique identifier for the NPC
  name: string;                     // NPC's name
  description?: string;             // Brief description or role
  affiliation?: string;             // Group/organization they belong to
  disposition?: NpcDisposition;     // How they relate to the party
  firstAppearance?: boolean;        // True if this is their first appearance
  imageUrl?: string;                // Optional portrait
}

export type NpcDisposition = 'friendly' | 'neutral' | 'hostile' | 'unknown';

// ============================================================================
// LOCATIONS
// ============================================================================

/**
 * Location visited during a session
 */
export interface SessionLocation {
  id: string;                       // Unique identifier for the location
  name: string;                     // Location name
  description?: string;             // Brief description
  type?: LocationType;              // Category of location
  region?: string;                  // Broader area (e.g., "Las Vegas Strip")
  firstVisit?: boolean;             // True if this is the first visit
  imageUrl?: string;                // Optional image
}

export type LocationType = 
  | 'casino' 
  | 'hotel' 
  | 'restaurant' 
  | 'church' 
  | 'fort' 
  | 'residence' 
  | 'business' 
  | 'outdoor' 
  | 'underground'
  | 'other';

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
  campaignId: string;               // Reference to parent campaign
  
  // Narrative sections
  sessionNotesPreface: string;      // Scene setting, introductions
  sessionNotesCombat: string;       // Combat encounters, action sequences
  sessionNotesEnd: string;          // Conclusions, plot hooks
  
  // Participants
  playerIds: string[];              // Character IDs who participated
  
  // World Building
  npcsMet: SessionNpc[];            // NPCs encountered this session
  locationsVisited: SessionLocation[]; // Locations visited this session
  
  // Rewards
  experienceGained: number;         // XP awarded this session
  
  // Optional metadata
  title?: string;                   // Optional session title/name
  notes?: string;                   // GM private notes
  itemsAcquired?: string[];         // Notable items gained
}

// ============================================================================
// RESOLVED SESSION (FOR UI)
// ============================================================================

/**
 * Session with all references resolved.
 * This is what components and templates work with.
 */
export interface ResolvedSession extends Omit<Session, 'playerIds' | 'campaignId'> {
  players: CharacterSummary[];      // Resolved character summaries
  campaign: CampaignSummary;        // Resolved campaign info
  
  // Computed values
  computed: {
    formattedDate: string;          // Human-readable date
    wordCount: number;              // Total words in notes
    hasAllSections: boolean;        // All note sections filled
    totalNpcs: number;              // Count of NPCs met
    totalLocations: number;         // Count of locations visited
    newNpcs: number;                // Count of first-appearance NPCs
    newLocations: number;           // Count of first-visit locations
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
  campaignId: string;
  title?: string;
  playerIds: string[];
  experienceGained: number;
  npcCount?: number;
  locationCount?: number;
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
 * Format a date string for compact display
 */
export function formatSessionDateShort(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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
 * Get sessions for a specific campaign
 */
export function getSessionsForCampaign(sessions: Session[], campaignId: string): Session[] {
  return sessions.filter(session => session.campaignId === campaignId);
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
    campaignId: session.campaignId,
    title: session.title,
    playerIds: session.playerIds,
    experienceGained: session.experienceGained,
    npcCount: session.npcsMet?.length ?? 0,
    locationCount: session.locationsVisited?.length ?? 0
  };
}

/**
 * Get unique NPCs across multiple sessions
 */
export function getUniqueNpcs(sessions: Session[]): SessionNpc[] {
  const npcMap = new Map<string, SessionNpc>();
  for (const session of sessions) {
    for (const npc of session.npcsMet || []) {
      if (!npcMap.has(npc.id)) {
        npcMap.set(npc.id, npc);
      }
    }
  }
  return Array.from(npcMap.values());
}

/**
 * Get unique locations across multiple sessions
 */
export function getUniqueLocations(sessions: Session[]): SessionLocation[] {
  const locationMap = new Map<string, SessionLocation>();
  for (const session of sessions) {
    for (const location of session.locationsVisited || []) {
      if (!locationMap.has(location.id)) {
        locationMap.set(location.id, location);
      }
    }
  }
  return Array.from(locationMap.values());
}

/**
 * Get disposition display text
 */
export function getDispositionLabel(disposition: NpcDisposition): string {
  const labels: Record<NpcDisposition, string> = {
    friendly: 'Friendly',
    neutral: 'Neutral',
    hostile: 'Hostile',
    unknown: 'Unknown'
  };
  return labels[disposition] || 'Unknown';
}

/**
 * Get location type display text
 */
export function getLocationTypeLabel(type: LocationType): string {
  const labels: Record<LocationType, string> = {
    casino: 'Casino',
    hotel: 'Hotel',
    restaurant: 'Restaurant',
    church: 'Church',
    fort: 'Fort',
    residence: 'Residence',
    business: 'Business',
    outdoor: 'Outdoor',
    underground: 'Underground',
    other: 'Other'
  };
  return labels[type] || 'Other';
}