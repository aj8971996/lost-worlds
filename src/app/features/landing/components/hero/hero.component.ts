import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="hero">
      <div class="hero-bg"></div>
      <div class="hero-overlay"></div>
      
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="title-main">Lost Worlds</span>
        </h1>
        
        <div class="hero-divider">
          <span class="divider-line"></span>
          <span class="divider-icon material-symbols-outlined">auto_awesome</span>
          <span class="divider-line"></span>
        </div>
        
        <p class="hero-tagline">Where realms converge and history remembers</p>
        
        <p class="hero-description">
          A tabletop roleplaying game set across different eras of Earth's hidden magical history.
          Play as one of nine species, master three colleges of magic, and shape the fate of worlds.
        </p>
        
        <div class="hero-actions">
          <a routerLink="/characters" class="btn btn-primary btn-lg">
            <span class="material-symbols-outlined">person_add</span>
            <span>View Characters</span>
          </a>
          <a href="#synopsis" class="btn btn-secondary btn-lg">
            <span class="material-symbols-outlined">info</span>
            <span>Learn More</span>
          </a>
        </div>
      </div>
      
      <div class="hero-scroll-indicator">
        <span class="material-symbols-outlined">keyboard_arrow_down</span>
      </div>
    </section>
  `,
  styles: [`
    .hero {
      position: relative;
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    // Animated gradient background
    .hero-bg {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        135deg,
        var(--palette-1) 0%,
        var(--palette-2) 25%,
        var(--palette-1) 50%,
        var(--palette-2) 75%,
        var(--palette-1) 100%
      );
      background-size: 400% 400%;
      animation: gradientShift 15s ease infinite;
    }

    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    // Overlay for text readability
    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        180deg,
        transparent 0%,
        rgba(0, 0, 0, 0.2) 50%,
        rgba(0, 0, 0, 0.4) 100%
      );
    }

    // Content
    .hero-content {
      position: relative;
      z-index: 1;
      max-width: 800px;
      padding: 2rem 1.5rem;
      text-align: center;
      animation: fadeInUp 0.8s ease;

      @media (min-width: 768px) {
        padding: 3rem 2rem;
      }
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    // Title
    .hero-title {
      margin-bottom: 1.5rem;
    }

    .title-main {
      display: block;
      font-size: clamp(2.5rem, 8vw, 4.5rem);
      font-weight: 700;
      color: #ffffff;
      text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
      letter-spacing: -0.02em;
    }

    // Divider
    .hero-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .divider-line {
      width: 60px;
      height: 2px;
      background: linear-gradient(
        90deg,
        transparent,
        var(--palette-3),
        transparent
      );

      @media (min-width: 768px) {
        width: 100px;
      }
    }

    .divider-icon {
      color: var(--palette-3);
      font-size: 24px;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    // Tagline
    .hero-tagline {
      font-size: clamp(1.125rem, 3vw, 1.5rem);
      font-style: italic;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 1.5rem;
      letter-spacing: 0.02em;
    }

    // Description
    .hero-description {
      font-size: clamp(1rem, 2vw, 1.125rem);
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.7;
      max-width: 600px;
      margin: 0 auto 2rem;
    }

    // Actions
    .hero-actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: center;

      @media (min-width: 480px) {
        flex-direction: row;
        justify-content: center;
      }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 1.75rem;
      font-size: 1rem;
      font-weight: 600;
      text-decoration: none;
      border-radius: 0.5rem;
      transition: all 0.2s ease;
      cursor: pointer;

      .material-symbols-outlined {
        font-size: 20px;
      }
    }

    .btn-primary {
      background-color: var(--palette-3);
      color: #1a1a1a;
      border: 2px solid var(--palette-3);

      &:hover {
        background-color: var(--palette-4);
        border-color: var(--palette-4);
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
      }
    }

    .btn-secondary {
      background-color: transparent;
      color: #ffffff;
      border: 2px solid rgba(255, 255, 255, 0.5);

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.8);
        transform: translateY(-2px);
      }
    }

    .btn-lg {
      padding: 1rem 2rem;
      font-size: 1.0625rem;
    }

    // Scroll indicator
    .hero-scroll-indicator {
      position: absolute;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1;
      color: rgba(255, 255, 255, 0.6);
      animation: bounce 2s infinite;

      .material-symbols-outlined {
        font-size: 32px;
      }
    }

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% {
        transform: translateX(-50%) translateY(0);
      }
      40% {
        transform: translateX(-50%) translateY(-10px);
      }
      60% {
        transform: translateX(-50%) translateY(-5px);
      }
    }
  `]
})
export class HeroComponent {}
