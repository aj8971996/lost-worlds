import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, catchError, shareReplay } from 'rxjs';
// Adjust these import paths based on your project structure
import { CharacterService } from './character.service';
import {
  Session,
  SessionSummary,
  ResolvedSession,
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
  session_notes_preface?: string;
  sessionNotesPreface?: string;
  session_notes_combat?: string;
  sessionNotesCombat?: string;
  session_notes_end?: string;
  sessionNotesEnd?: string;
  players?: string[];
  playerIds?: string[];
  'experience-gained'?: number;
  experienceGained?: number;
  title?: string;
  location?: string;
  npcsIntroduced?: string[];
  itemsAcquired?: string[];
  notes?: string;
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

  // ============================================================================
  // LOADING
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
      characters: this.getCharacterList()
    }).pipe(
      map(({ session, characters }) => {
        if (!session) return null;
        return this.resolveSession(session, characters);
      })
    );
  }

  /**
   * Load all sessions with references resolved
   */
  getAllResolvedSessions(): Observable<ResolvedSession[]> {
    return forkJoin({
      sessions: this.getSessionList(),
      characters: this.getCharacterList()
    }).pipe(
      map(({ sessions, characters }) => {
        // Get full sessions and resolve them
        return sessions.map(summary => {
          // Create a minimal session from summary for resolution
          const session: Session = {
            id: summary.id,
            sessionNumber: summary.sessionNumber,
            sessionDate: summary.sessionDate,
            sessionNotesPreface: '',
            sessionNotesCombat: '',
            sessionNotesEnd: '',
            playerIds: summary.playerIds,
            experienceGained: summary.experienceGained,
            title: summary.title
          };
          return this.resolveSession(session, characters);
        });
      })
    );
  }

  // ============================================================================
  // RESOLUTION
  // ============================================================================

  private resolveSession(session: Session, characters: CharacterSummary[]): ResolvedSession {
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

    const { playerIds, ...sessionWithoutPlayerIds } = session;

    return {
      ...sessionWithoutPlayerIds,
      players: [...players, ...placeholderPlayers],
      computed: {
        formattedDate: formatSessionDate(session.sessionDate),
        wordCount: calculateWordCount(session),
        hasAllSections: hasAllSections(session)
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
        title: session.title,
        playerIds: session.playerIds,
        experienceGained: session.experienceGained
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

    return {
      id,
      sessionNumber: raw.session_number ?? raw.sessionNumber ?? 0,
      sessionDate,
      sessionNotesPreface: raw.session_notes_preface ?? raw.sessionNotesPreface ?? '',
      sessionNotesCombat: raw.session_notes_combat ?? raw.sessionNotesCombat ?? '',
      sessionNotesEnd: raw.session_notes_end ?? raw.sessionNotesEnd ?? '',
      playerIds: raw.players ?? raw.playerIds ?? [],
      experienceGained: raw['experience-gained'] ?? raw.experienceGained ?? 0,
      title: raw.title,
      location: raw.location,
      npcsIntroduced: raw.npcsIntroduced,
      itemsAcquired: raw.itemsAcquired,
      notes: raw.notes
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