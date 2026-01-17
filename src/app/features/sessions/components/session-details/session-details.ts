import { Component, inject, signal, computed, effect, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
// Adjust these import paths based on your project structure
import { SessionService } from '../../../../core/services/session.service';
import { 
  ResolvedSession, 
  NpcDisposition, 
  LocationType,
  getDispositionLabel,
  getLocationTypeLabel 
} from '../../../../core/models/session.model';
import { CharacterSummary } from '../../../../core/models/character.model';

@Component({
  selector: 'app-session-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './session-details.html',
  styleUrl: './session-details.scss',
})
export class SessionDetailsComponent {
  private readonly sessionService = inject(SessionService);

  // Route param (using signal-based input)
  readonly sessionId = input.required<string>({ alias: 'id' });

  // State
  readonly session = signal<ResolvedSession | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // Computed values
  readonly hasSession = computed(() => this.session() !== null);
  readonly sessionTitle = computed(() => {
    const s = this.session();
    if (!s) return 'Session Notes';
    return s.title || `Session ${s.sessionNumber}`;
  });

  // Navigation
  readonly previousSessionId = signal<string | null>(null);
  readonly nextSessionId = signal<string | null>(null);

  constructor() {
    // Effect to reload session whenever sessionId changes
    effect(() => {
      const id = this.sessionId();
      if (id) {
        this.loadSession(id);
      }
    });
  }

  private loadSession(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    
    // Reset navigation while loading
    this.previousSessionId.set(null);
    this.nextSessionId.set(null);

    this.sessionService.getResolvedSession(id).subscribe({
      next: (session) => {
        if (session) {
          this.session.set(session);
          this.loadAdjacentSessions(session.sessionNumber, session.campaign.id);
        } else {
          this.error.set('Session not found');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load session:', err);
        this.error.set('Failed to load session. Please try again.');
        this.loading.set(false);
      }
    });
  }

  private loadAdjacentSessions(currentNumber: number, campaignId: string): void {
    this.sessionService.getSessionListByCampaign(campaignId).subscribe({
      next: (sessions) => {
        const sorted = [...sessions].sort((a, b) => a.sessionNumber - b.sessionNumber);
        const currentIndex = sorted.findIndex(s => s.sessionNumber === currentNumber);
        
        if (currentIndex > 0) {
          this.previousSessionId.set(sorted[currentIndex - 1].id);
        } else {
          this.previousSessionId.set(null);
        }
        
        if (currentIndex >= 0 && currentIndex < sorted.length - 1) {
          this.nextSessionId.set(sorted[currentIndex + 1].id);
        } else {
          this.nextSessionId.set(null);
        }
      },
      error: (err) => {
        console.error('Failed to load adjacent sessions:', err);
      }
    });
  }

  getPlayerInitials(player: CharacterSummary): string {
    return player.name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  trackByPlayerId(_index: number, player: CharacterSummary): string {
    return player.id;
  }

  getDispositionLabel(disposition: NpcDisposition): string {
    return getDispositionLabel(disposition);
  }

  getLocationTypeLabel(type: LocationType): string {
    return getLocationTypeLabel(type);
  }
}