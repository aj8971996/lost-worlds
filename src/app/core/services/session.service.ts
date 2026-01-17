import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, catchError, shareReplay } from 'rxjs';
// Adjust these import paths based on your project structure
import { CharacterService } from './character.service';
import {
  Session,
  SessionSummary,
  ResolvedSession,
  Campaign,
  CampaignSummary,
  SessionNpc,
  SessionLocation,
  formatSessionDate,
  calculateWordCount,
  hasAllSections,
  parseLegacyDate
} from '../models/session.model';
import { CharacterSummary } from '../models/character.model';

/**
 * Raw session data as it may appear in JSON (with legacy field names)
 */
interface RawSession {
  session_number?: number;
  sessionNumber?: number;
  session_date?: number | string;
  sessionDate?: string;
  campaign_id?: string;
  campaignId?: string;
  session_notes_preface?: string;
  sessionNotesPreface?: string;
  session_notes_combat?: string;
  sessionNotesCombat?: string;
  session_notes_end?: string;
  sessionNotesEnd?: string;
  players?: string[];
  playerIds?: string[];
  npcs_met?: RawSessionNpc[];
  npcsMet?: RawSessionNpc[];
  locations_visited?: RawSessionLocation[];
  locationsVisited?: RawSessionLocation[];
  'experience-gained'?: number;
  experienceGained?: number;
  title?: string;
  notes?: string;
  itemsAcquired?: string[];
  items_acquired?: string[];
}

interface RawSessionNpc {
  id: string;
  name: string;
  description?: string;
  affiliation?: string;
  disposition?: string;
  first_appearance?: boolean;
  firstAppearance?: boolean;
  image_url?: string;
  imageUrl?: string;
}

interface RawSessionLocation {
  id: string;
  name: string;
  description?: string;
  type?: string;
  region?: string;
  first_visit?: boolean;
  firstVisit?: boolean;
  image_url?: string;
  imageUrl?: string;
}

/**
 * Service for loading sessions and resolving all references.
 */
@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly http = inject(HttpClient);
  private readonly characterService = inject(CharacterService);
  private readonly basePath = 'data/sessions';

  // Cached character list for resolution
  private characterList$?: Observable<CharacterSummary[]>;
  private campaigns$?: Observable<Record<string, Campaign>>;

  // Default campaign for backward compatibility
  private readonly defaultCampaign: Campaign = {
    id: 'flamingos-shadow-test-01',
    name: "Flamingo's Shadow - Test - 01",
    description: 'A noir mystery set in 1940s Las Vegas',
    status: 'active',
    setting: '1940s Las Vegas'
  };

  // ============================================================================
  // CAMPAIGN LOADING
  // ============================================================================

  /**
   * Get all campaigns
   */
  getCampaigns(): Observable<Record<string, Campaign>> {
    if (!this.campaigns$) {
      this.campaigns$ = this.http.get<Record<string, Campaign>>(`${this.basePath}/campaigns.json`).pipe(
        catchError(() => {
          // Return default campaign if file doesn't exist
          return of({ [this.defaultCampaign.id]: this.defaultCampaign });
        }),
        shareReplay(1)
      );
    }
    return this.campaigns$;
  }

  /**
   * Get campaign list for display
   */
  getCampaignList(): Observable<CampaignSummary[]> {
    return forkJoin({
      campaigns: this.getCampaigns(),
      sessions: this.getSessionList()
    }).pipe(
      map(({ campaigns, sessions }) => {
        return Object.values(campaigns).map(campaign => ({
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          sessionCount: sessions.filter(s => s.campaignId === campaign.id).length
        }));
      })
    );
  }

  // ============================================================================
  // SESSION LOADING
  // ============================================================================

  /**
   * Get list of all sessions (summary only)
   */
  getSessionList(): Observable<SessionSummary[]> {
    return this.http.get<Record<string, RawSession>>(`${this.basePath}/sessions.json`).pipe(
      map(data => this.parseSessionIndex(data)),
      catchError(error => {
        console.error('Failed to load session index', error);
        return of([]);
      })
    );
  }

  /**
   * Get list of sessions for a specific campaign
   */
  getSessionListByCampaign(campaignId: string): Observable<SessionSummary[]> {
    return this.getSessionList().pipe(
      map(sessions => sessions.filter(s => s.campaignId === campaignId))
    );
  }

  /**
   * Load raw session data (unresolved)
   */
  getSession(id: string): Observable<Session | null> {
    return this.http.get<Record<string, RawSession>>(`${this.basePath}/sessions.json`).pipe(
      map(data => {
        const raw = data[id];
        if (!raw) return null;
        return this.normalizeSession(id, raw);
      }),
      catchError(error => {
        console.error(`Failed to load session: ${id}`, error);
        return of(null);
      })
    );
  }

  /**
   * Load session with all references resolved
   */
  getResolvedSession(id: string): Observable<ResolvedSession | null> {
    return forkJoin({
      session: this.getSession(id),
      characters: this.getCharacterList(),
      campaigns: this.getCampaigns()
    }).pipe(
      map(({ session, characters, campaigns }) => {
        if (!session) return null;
        return this.resolveSession(session, characters, campaigns);
      })
    );
  }

  /**
   * Load all sessions with references resolved
   */
  getAllResolvedSessions(): Observable<ResolvedSession[]> {
    return forkJoin({
      sessions: this.getSessionList(),
      characters: this.getCharacterList(),
      campaigns: this.getCampaigns()
    }).pipe(
      map(({ sessions, characters, campaigns }) => {
        return sessions.map(summary => {
          const session: Session = {
            id: summary.id,
            sessionNumber: summary.sessionNumber,
            sessionDate: summary.sessionDate,
            campaignId: summary.campaignId,
            sessionNotesPreface: '',
            sessionNotesCombat: '',
            sessionNotesEnd: '',
            playerIds: summary.playerIds,
            npcsMet: [],
            locationsVisited: [],
            experienceGained: summary.experienceGained,
            title: summary.title
          };
          return this.resolveSession(session, characters, campaigns);
        });
      })
    );
  }

  /**
   * Load all resolved sessions for a specific campaign
   */
  getResolvedSessionsByCampaign(campaignId: string): Observable<ResolvedSession[]> {
    return this.getAllResolvedSessions().pipe(
      map(sessions => sessions.filter(s => s.campaign.id === campaignId))
    );
  }

  // ============================================================================
  // RESOLUTION
  // ============================================================================

  private resolveSession(
    session: Session, 
    characters: CharacterSummary[],
    campaigns: Record<string, Campaign>
  ): ResolvedSession {
    // Resolve player IDs to character summaries
    const players = session.playerIds
      .map(id => characters.find(c => c.id === id))
      .filter((c): c is CharacterSummary => c !== undefined);

    // For any unresolved IDs, create placeholder summaries
    const unresolvedIds = session.playerIds.filter(
      id => !characters.find(c => c.id === id)
    );
    
    const placeholderPlayers: CharacterSummary[] = unresolvedIds.map(id => ({
      id,
      name: this.formatCharacterName(id),
      level: 1,
      speciesId: 'unknown'
    }));

    // Resolve campaign
    const campaign = campaigns[session.campaignId] || this.defaultCampaign;
    const campaignSummary: CampaignSummary = {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status
    };

    // Calculate computed values
    const npcsMet = session.npcsMet || [];
    const locationsVisited = session.locationsVisited || [];

    const { playerIds, campaignId, ...sessionWithoutRefs } = session;

    return {
      ...sessionWithoutRefs,
      players: [...players, ...placeholderPlayers],
      campaign: campaignSummary,
      npcsMet,
      locationsVisited,
      computed: {
        formattedDate: formatSessionDate(session.sessionDate),
        wordCount: calculateWordCount(session),
        hasAllSections: hasAllSections(session),
        totalNpcs: npcsMet.length,
        totalLocations: locationsVisited.length,
        newNpcs: npcsMet.filter(n => n.firstAppearance).length,
        newLocations: locationsVisited.filter(l => l.firstVisit).length
      }
    };
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private getCharacterList(): Observable<CharacterSummary[]> {
    if (!this.characterList$) {
      this.characterList$ = this.characterService.getCharacterList().pipe(
        shareReplay(1)
      );
    }
    return this.characterList$;
  }

  /**
   * Parse the sessions.json format into SessionSummary array
   */
  private parseSessionIndex(data: Record<string, RawSession>): SessionSummary[] {
    return Object.entries(data).map(([id, raw]) => {
      const session = this.normalizeSession(id, raw);
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
    }).sort((a, b) => a.sessionNumber - b.sessionNumber);
  }

  /**
   * Normalize raw JSON session to Session interface
   * Handles both snake_case and camelCase field names
   */
  private normalizeSession(id: string, raw: RawSession): Session {
    // Handle date format conversion
    let sessionDate: string;
    const rawDate = raw.session_date ?? raw.sessionDate;
    if (typeof rawDate === 'number') {
      sessionDate = parseLegacyDate(rawDate);
    } else if (typeof rawDate === 'string') {
      sessionDate = rawDate;
    } else {
      sessionDate = new Date().toISOString().split('T')[0];
    }

    // Normalize NPCs
    const rawNpcs = raw.npcs_met ?? raw.npcsMet ?? [];
    const npcsMet: SessionNpc[] = rawNpcs.map(npc => ({
      id: npc.id,
      name: npc.name,
      description: npc.description,
      affiliation: npc.affiliation,
      disposition: (npc.disposition as SessionNpc['disposition']) || 'unknown',
      firstAppearance: npc.first_appearance ?? npc.firstAppearance ?? false,
      imageUrl: npc.image_url ?? npc.imageUrl
    }));

    // Normalize locations
    const rawLocations = raw.locations_visited ?? raw.locationsVisited ?? [];
    const locationsVisited: SessionLocation[] = rawLocations.map(loc => ({
      id: loc.id,
      name: loc.name,
      description: loc.description,
      type: (loc.type as SessionLocation['type']) || 'other',
      region: loc.region,
      firstVisit: loc.first_visit ?? loc.firstVisit ?? false,
      imageUrl: loc.image_url ?? loc.imageUrl
    }));

    return {
      id,
      sessionNumber: raw.session_number ?? raw.sessionNumber ?? 0,
      sessionDate,
      campaignId: raw.campaign_id ?? raw.campaignId ?? this.defaultCampaign.id,
      sessionNotesPreface: raw.session_notes_preface ?? raw.sessionNotesPreface ?? '',
      sessionNotesCombat: raw.session_notes_combat ?? raw.sessionNotesCombat ?? '',
      sessionNotesEnd: raw.session_notes_end ?? raw.sessionNotesEnd ?? '',
      playerIds: raw.players ?? raw.playerIds ?? [],
      npcsMet,
      locationsVisited,
      experienceGained: raw['experience-gained'] ?? raw.experienceGained ?? 0,
      title: raw.title,
      notes: raw.notes,
      itemsAcquired: raw.itemsAcquired ?? raw.items_acquired
    };
  }

  /**
   * Convert kebab-case ID to readable name
   */
  private formatCharacterName(id: string): string {
    return id
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}