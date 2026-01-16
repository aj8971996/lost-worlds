import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

/**
 * Service for loading static JSON data files from public/data/
 * 
 * Data files are stored in:
 * - public/data/characters/ - Character sheet data
 * - public/data/combat/ - Combat encounter data
 * - public/data/sessions/ - Session notes
 * - public/data/reference/ - Game reference data (rules, tables, etc.)
 * 
 * When you update these JSON files and push to main,
 * GitHub Actions will automatically rebuild and deploy.
 */
@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly http = inject(HttpClient);
  
  // Base path for data files - works in both dev and production
  private readonly basePath = 'data';

  /**
   * Load a specific data file
   * @param category - Subfolder (characters, combat, sessions, reference)
   * @param filename - JSON filename without extension
   */
  load<T>(category: string, filename: string): Observable<T | null> {
    return this.http.get<T>(`${this.basePath}/${category}/${filename}.json`).pipe(
      catchError(error => {
        console.error(`Failed to load ${category}/${filename}:`, error);
        return of(null);
      })
    );
  }

  /**
   * Load all items from a category index file
   * Convention: Each category has an index.json listing all items
   */
  loadIndex<T>(category: string): Observable<T[] | null> {
    return this.load<T[]>(category, 'index');
  }

  // Convenience methods for each data type
  loadCharacter<T>(id: string): Observable<T | null> {
    return this.load<T>('characters', id);
  }

  loadAllCharacters<T>(): Observable<T[] | null> {
    return this.loadIndex<T>('characters');
  }

  loadSession<T>(id: string): Observable<T | null> {
    return this.load<T>('sessions', id);
  }

  loadAllSessions<T>(): Observable<T[] | null> {
    return this.loadIndex<T>('sessions');
  }

  loadCombatEncounter<T>(id: string): Observable<T | null> {
    return this.load<T>('combat', id);
  }

  loadReference<T>(name: string): Observable<T | null> {
    return this.load<T>('reference', name);
  }
}
