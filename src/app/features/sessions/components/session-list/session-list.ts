import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
// Adjust these import paths based on your project structure
import { SessionService } from '../../../../core/services/session.service';
import { 
  SessionSummary, 
  CampaignSummary,
  formatSessionDate 
} from '../../../../core/models/session.model';

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './session-list.html',
  styleUrl: './session-list.scss',
})
export class SessionListComponent implements OnInit {
  private readonly sessionService = inject(SessionService);

  // State
  readonly sessions = signal<SessionSummary[]>([]);
  readonly campaigns = signal<CampaignSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly selectedCampaignId = signal<string | null>(null);

  // Computed values
  readonly filteredSessions = computed(() => {
    const campaignId = this.selectedCampaignId();
    const allSessions = this.sessions();
    
    if (!campaignId) {
      return allSessions;
    }
    
    return allSessions.filter(s => s.campaignId === campaignId);
  });

  readonly totalSessions = computed(() => this.filteredSessions().length);
  
  readonly totalXP = computed(() => 
    this.filteredSessions().reduce((sum, s) => sum + s.experienceGained, 0)
  );
  
  readonly totalNpcs = computed(() => 
    this.filteredSessions().reduce((sum, s) => sum + (s.npcCount ?? 0), 0)
  );
  
  readonly totalLocations = computed(() => 
    this.filteredSessions().reduce((sum, s) => sum + (s.locationCount ?? 0), 0)
  );
  
  readonly hasSessions = computed(() => this.filteredSessions().length > 0);
  
  readonly currentCampaign = computed(() => {
    const campaignId = this.selectedCampaignId();
    if (!campaignId) {
      // Return the first campaign if none selected
      const allCampaigns = this.campaigns();
      return allCampaigns.length > 0 ? allCampaigns[0] : null;
    }
    return this.campaigns().find(c => c.id === campaignId) ?? null;
  });

  // Sort state
  readonly sortOrder = signal<'asc' | 'desc'>('desc');
  
  readonly sortedSessions = computed(() => {
    const sorted = [...this.filteredSessions()];
    return this.sortOrder() === 'desc'
      ? sorted.sort((a, b) => b.sessionNumber - a.sessionNumber)
      : sorted.sort((a, b) => a.sessionNumber - b.sessionNumber);
  });

  ngOnInit(): void {
    this.loadSessions();
    this.loadCampaigns();
  }

  loadSessions(): void {
    this.loading.set(true);
    this.error.set(null);

    this.sessionService.getSessionList().subscribe({
      next: (sessions) => {
        this.sessions.set(sessions);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load sessions:', err);
        this.error.set('Failed to load session notes. Please try again.');
        this.loading.set(false);
      }
    });
  }

  loadCampaigns(): void {
    this.sessionService.getCampaignList().subscribe({
      next: (campaigns) => {
        this.campaigns.set(campaigns);
        // Auto-select first campaign if available
        if (campaigns.length > 0 && !this.selectedCampaignId()) {
          this.selectedCampaignId.set(campaigns[0].id);
        }
      },
      error: (err) => {
        console.error('Failed to load campaigns:', err);
      }
    });
  }

  selectCampaign(campaignId: string | null): void {
    this.selectedCampaignId.set(campaignId);
  }

  toggleSortOrder(): void {
    this.sortOrder.update(current => current === 'asc' ? 'desc' : 'asc');
  }

  formatDate(dateString: string): string {
    return formatSessionDate(dateString);
  }

  getSessionTitle(session: SessionSummary): string {
    return session.title || `Session ${session.sessionNumber}`;
  }

  trackBySessionId(_index: number, session: SessionSummary): string {
    return session.id;
  }

  trackByCampaignId(_index: number, campaign: CampaignSummary): string {
    return campaign.id;
  }
}