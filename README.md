# Lost Worlds Manager

Version: **0.0.1**  
Build Status: **In Progress**

A browser-based campaign management tool for the **Lost Worlds** tabletop role-playing game system — a homebrew RPG developed collaboratively by our family. This application provides a central hub for managing player characters, combat, and ongoing campaign session notes, and is deployed via **GitHub Pages** using **Angular**.

---

## Features

### Landing & Introduction
A thematic entry point featuring:
- Hero section
- System synopsis
- Creation steps
- Feature overviews
- Calls-to-action

### Character Management
Manage character sheets and progression.

Directory:
```
src/app/features/characters/
```

### Combat Tracker
Tools for running tactical encounters.

Directory:
```
src/app/features/combat/
```

### Session Notes
Record narrative continuity across sessions.

Directory:
```
src/app/features/sessions/
```

---

## Technology Stack

- Angular
- GitHub Pages deployment
- SCSS (theme-based)
- Modular feature architecture

---

## Project Structure Overview

```
src/
├── app/
│   ├── core/
│   ├── features/
│   ├── layout/
│   └── shared/
├── environments/
└── styles/
```

---

## Development Setup

### Install Dependencies
```bash
npm install
```

### Local Development
```bash
ng serve
```

---

## Build & Deployment

### Build
```bash
ng build --configuration production
```

### GitHub Pages Deployment
```bash
ng deploy --base-href=/lost-worlds/
```

---

## Roadmap

Planned enhancements include:
- Items, skills, conditions, bestiary
- Dice roller
- Collaborative session tools
- Persistence layer improvements

---

## Contributions

Internal collaboration only at this stage.
Code contributions via feature branches and PRs.

---

## Acknowledgements

Designed to support collaborative world-building and campaign play.
