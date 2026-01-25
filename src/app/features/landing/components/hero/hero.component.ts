import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="hero">
      <!-- Animated background layers -->
      <div class="hero-bg"></div>
      <div class="hero-grain"></div>
      <div class="hero-vignette"></div>
      
      <div class="hero-content">
        <!-- Eyebrow -->
        <p class="hero-eyebrow">Enter the Lost Worlds</p>
        
        <!-- Main Title -->
        <h1 class="hero-title">Lost Worlds</h1>
        
        <!-- Decorative divider -->
        <div class="hero-divider">
          <span class="divider-line"></span>
          <span class="divider-diamond">◆</span>
          <span class="divider-line"></span>
        </div>
        
        <!-- Tagline -->
        <p class="hero-tagline">Where realms converge and history remembers</p>
        
        <!-- Description -->
        <p class="hero-description">
          A tabletop roleplaying game set across different eras of Earth's hidden magical history.
          Play as one of nine species, master three colleges of magic, and shape the fate of worlds.
        </p>
        
        <!-- Actions -->
        <div class="hero-actions">
          <a routerLink="/characters" class="btn btn-primary">
            <span class="material-symbols-outlined">person_add</span>
            <span>View Characters</span>
          </a>
          <a href="#synopsis" class="btn btn-secondary">
            <span class="material-symbols-outlined">info</span>
            <span>Learn More</span>
          </a>
        </div>
      </div>
      
      <!-- Scroll indicator -->
      <div class="hero-scroll-indicator">
        <span class="material-symbols-outlined">keyboard_double_arrow_down</span>
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

    // Animated gradient background - using palette colors
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
      animation: gradientShift 20s ease infinite;
    }

    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    // Film grain texture overlay
    .hero-grain {
      position: absolute;
      inset: 0;
      opacity: 0.04;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
      pointer-events: none;
    }

    // Vignette overlay for depth
    .hero-vignette {
      position: absolute;
      inset: 0;
      background: radial-gradient(
        ellipse at center,
        transparent 40%,
        rgba(0, 0, 0, 0.5) 100%
      );
      pointer-events: none;
    }

    // Content container
    .hero-content {
      position: relative;
      z-index: 10;
      max-width: 800px;
      padding: 2rem 1.5rem;
      text-align: center;
      animation: fadeInUp 1s ease;

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

    // Eyebrow text
    .hero-eyebrow {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 0.875rem;
      font-weight: 600;
      letter-spacing: 0.35em;
      text-transform: uppercase;
      color: var(--color-accent);
      margin-bottom: 1.5rem;

      @media (min-width: 768px) {
        font-size: 1rem;
      }
    }

    // Main title
    .hero-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: clamp(3rem, 10vw, 5.5rem);
      font-weight: 400;
      color: var(--color-accent);
      letter-spacing: -0.02em;
      line-height: 1.1;
      margin-bottom: 1.5rem;
      text-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
    }

    // Decorative divider
    .hero-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .divider-line {
      width: 60px;
      height: 1px;
      background: linear-gradient(
        90deg,
        transparent,
        var(--color-accent),
        transparent
      );

      @media (min-width: 768px) {
        width: 100px;
      }
    }

    .divider-diamond {
      color: var(--color-accent);
      font-size: 0.875rem;
      animation: pulse 3s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    // Tagline
    .hero-tagline {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: clamp(1.125rem, 3vw, 1.5rem);
      font-style: italic;
      color: rgba(255, 255, 255, 0.85);
      margin-bottom: 1.5rem;
      letter-spacing: 0.02em;
    }

    // Description
    .hero-description {
      font-size: clamp(0.9375rem, 2vw, 1.0625rem);
      color: rgba(255, 255, 255, 0.75);
      line-height: 1.8;
      max-width: 600px;
      margin: 0 auto 2.5rem;
    }

    // Action buttons
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
      padding: 0.9375rem 1.75rem;
      font-size: 0.9375rem;
      font-weight: 600;
      text-decoration: none;
      border-radius: 0.375rem;
      transition: all 0.25s ease;
      cursor: pointer;

      .material-symbols-outlined {
        font-size: 20px;
      }
    }

    .btn-primary {
      background-color: var(--color-accent);
      color: var(--color-text-inverse);
      border: 2px solid var(--color-accent);

      &:hover {
        background-color: var(--color-accent-hover);
        border-color: var(--color-accent-hover);
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.35);
      }
    }

    .btn-secondary {
      background-color: transparent;
      color: var(--color-accent);
      border: 2px solid rgba(255, 255, 255, 0.4);

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.7);
        transform: translateY(-2px);
      }
    }

    // Scroll indicator
    .hero-scroll-indicator {
      position: absolute;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10;
      color: rgba(255, 255, 255, 0.5);
      animation: bounce 2.5s infinite;

      .material-symbols-outlined {
        font-size: 28px;
      }
    }

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% {
        transform: translateX(-50%) translateY(0);
      }
      40% {
        transform: translateX(-50%) translateY(-12px);
      }
      60% {
        transform: translateX(-50%) translateY(-6px);
      }
    }
  `]
})
export class HeroComponent {}