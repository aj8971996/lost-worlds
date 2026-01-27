import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component')
      .then(m => m.LandingComponent),
    title: 'Lost Worlds | Where Realms Converge'
  },
  {
    path: 'create',
    loadComponent: () => import('./features/create-character/create-character.component')
      .then(m => m.CreateCharacterComponent)
  },
  {
    path: 'characters',
    loadComponent: () => import('./features/characters/characters.component')
      .then(m => m.CharactersComponent),
    title: 'Character Repository | Lost Worlds'
  },
  {
    path: 'characters/:id',
    loadComponent: () => import('./features/characters/components/character-detail/character-detail.component')
      .then(m => m.CharacterDetailComponent),
    title: 'Character Sheet | Lost Worlds'
  },
  {
    path: 'abilities',
    loadComponent: () => import('./features/abilities/abilities')
      .then(m => m.AbilitiesComponent),
    title: 'Ability Codex | Lost Worlds'
  },
  {
    path: 'equipment',
    loadComponent: () => import('./features/equipment-browser/equipment-browser')
      .then(m => m.EquipmentBrowserComponent),
    title: 'Equipment Armory | Lost Worlds'
  },
  {
    path: 'combat',
    loadComponent: () => import('./features/combat/combat.component')
      .then(m => m.CombatComponent),
    title: 'Combat Tracker | Lost Worlds'
  },
  {
    path: 'sessions',
    loadComponent: () => import('./features/sessions/components/session-list/session-list')
      .then(m => m.SessionListComponent),
    title: 'Session Notes | Lost Worlds'
  },
  {
    path: 'sessions/:id',
    loadComponent: () => import('./features/sessions/components/session-details/session-details')
      .then(m => m.SessionDetailsComponent),
    title: 'Session Details | Lost Worlds'
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];