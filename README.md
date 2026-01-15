# Lost Worlds - Phase 2 Setup Files

This package contains the landing page, navigation, and routing components for your Lost Worlds Angular project.

## Contents

```
lost-worlds-phase2/
├── src/
│   └── app/
│       ├── app.component.ts              # Root component with shell layout
│       ├── app.routes.ts                 # Route configuration
│       ├── core/
│       │   └── services/
│       │       └── theme.service.ts      # Theme toggle (if not from Phase 1)
│       ├── features/
│       │   ├── landing/
│       │   │   ├── landing.component.ts  # Main landing page
│       │   │   └── components/
│       │   │       ├── hero/             # Animated gradient hero
│       │   │       ├── feature-cards/    # Navigation cards
│       │   │       ├── synopsis/         # What is Lost Worlds
│       │   │       ├── creation-steps/   # Character creation timeline
│       │   │       └── cta/              # Call to action
│       │   ├── characters/
│       │   │   └── characters.component.ts  # Placeholder page
│       │   ├── combat/
│       │   │   └── combat.component.ts      # Placeholder page
│       │   └── sessions/
│       │       └── sessions.component.ts    # Placeholder page
│       └── layout/
│           ├── header/
│           │   └── header.component.ts   # Navigation header
│           └── footer/
│               └── footer.component.ts   # Page footer
```

## Installation Instructions

### Step 1: Copy Files to Your Project

Copy all the files maintaining the directory structure:

```bash
# Copy everything from src/app to your project
cp -r src/app/* /path/to/your/lost-worlds/src/app/
```

Or manually copy each file/folder.

### Step 2: Verify app.routes.ts

Make sure `src/app/app.routes.ts` is in place. This file defines all the routes.

### Step 3: Update app.config.ts (if needed)

Ensure your `src/app/app.config.ts` includes the router provider:

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes)
  ]
};
```

### Step 4: Run the Application

```bash
ng serve
```

Open http://localhost:4200 to see your new landing page!

## Features Included

### Landing Page Sections

| Section | Description |
|---------|-------------|
| **Hero** | Full-screen animated gradient with title, tagline, and CTAs |
| **Feature Cards** | Three navigation cards for Characters, Combat, Sessions |
| **Synopsis** | "What is Lost Worlds?" section with highlights sidebar |
| **Creation Steps** | 6-step character creation timeline with quick reference |
| **CTA** | Final call to action with requirements list |

### Navigation

| Route | Component | Status |
|-------|-----------|--------|
| `/` | LandingComponent | ✅ Complete |
| `/characters` | CharactersComponent | 📋 Placeholder |
| `/combat` | CombatComponent | 📋 Placeholder |
| `/sessions` | SessionsComponent | 📋 Placeholder |

### Header Features

- Sticky navigation with blur backdrop
- Desktop navigation links with active state
- Mobile hamburger menu with smooth animation
- Theme toggle (light/dark mode)
- Responsive logo

## Component Structure

```
Landing Page
├── HeroComponent
│   ├── Animated gradient background
│   ├── Title: "Lost Worlds"
│   ├── Tagline: "Where realms converge..."
│   ├── Description paragraph
│   └── CTA buttons
├── FeatureCardsComponent
│   ├── Characters card → /characters
│   ├── Combat card → /combat
│   └── Sessions card → /sessions
├── SynopsisComponent
│   ├── Main description text
│   ├── Highlights sidebar
│   └── Info row (Species, Magic, Dice)
├── CreationStepsComponent
│   ├── 6-step vertical timeline
│   └── Quick reference box
└── CtaComponent
    ├── Gradient background
    ├── Final CTA button
    └── Requirements list
```

## Customization

### Changing the Tagline

Edit `src/app/features/landing/components/hero/hero.component.ts`:

```typescript
<p class="hero-tagline">Your new tagline here</p>
```

### Adding New Feature Cards

Edit `src/app/features/landing/components/feature-cards/feature-cards.component.ts`:

```typescript
readonly featureCards: FeatureCard[] = [
  // Add new cards to this array
  {
    title: 'New Feature',
    description: 'Description here',
    icon: 'icon_name',
    path: '/new-route',
    accentColor: 'var(--color-info)'
  }
];
```

### Modifying Character Creation Steps

Edit `src/app/features/landing/components/creation-steps/creation-steps.component.ts`:

```typescript
readonly creationSteps: CreationStep[] = [
  // Modify the steps array
];
```

## Next Steps

After Phase 2 is complete, you can:

1. **Build out Character Sheets** - Replace the placeholder with actual character data display
2. **Build Combat Tracker** - Implement initiative and HP tracking
3. **Build Session Notes** - Create session logging functionality
4. **Add Data Service** - Create a service to load JSON data from `public/data/`
5. **Add Character Models** - Define TypeScript interfaces for character data

---

*Tagline: "Where realms converge and history remembers"*
