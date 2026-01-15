import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component')
      .then(m => m.LandingComponent),
    title: 'Lost Worlds | Where Realms Converge'
  },
  {
    path: 'characters',
    loadComponent: () => import('./features/characters/characters.component')
      .then(m => m.CharactersComponent),
    title: 'Characters | Lost Worlds'
  },
  {
    path: 'combat',
    loadComponent: () => import('./features/combat/combat.component')
      .then(m => m.CombatComponent),
    title: 'Combat Tracker | Lost Worlds'
  },
  {
    path: 'sessions',
    loadComponent: () => import('./features/sessions/sessions.component')
      .then(m => m.SessionsComponent),
    title: 'Session Notes | Lost Worlds'
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
