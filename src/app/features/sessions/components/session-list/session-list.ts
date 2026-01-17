import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
// Adjust these import paths based on your project structure
import { SessionService } from '../../../../core/services/session.service';
import { SessionSummary, formatSessionDate } from '../../../../core/models/session.model';

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
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // Computed values
  readonly totalSessions = computed(() => this.sessions().length);
  readonly totalXP = computed(() => 
    this.sessions().reduce((sum, s) => sum + s.experienceGained, 0)
  );
  readonly hasSessions = computed(() => this.sessions().length > 0);

  // Sort state
  readonly sortOrder = signal<'asc' | 'desc'>('desc');
  readonly sortedSessions = computed(() => {
    const sorted = [...this.sessions()];
    return this.sortOrder() === 'desc'
      ? sorted.sort((a, b) => b.sessionNumber - a.sessionNumber)
      : sorted.sort((a, b) => a.sessionNumber - b.sessionNumber);
  });

  ngOnInit(): void {
    this.loadSessions();
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
}