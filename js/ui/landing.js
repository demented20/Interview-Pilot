/**
 * Landing page logic
 */
import { showScreen } from './router.js';

export function initLanding() {
  // Global fallback so the button works even if module loading is delayed
  window.__goSetup = () => showScreen('setup');

  const btn = document.getElementById('btn-get-started');
  if (btn) {
    btn.addEventListener('click', () => {
      showScreen('setup');
    });
  }

  // Optional: animate hero on load
  animateHero();
}

export function animateHero() {
  const hero = document.querySelector('.hero-content');
  if (hero) {
    hero.classList.add('animate-fade-up');
  }
}
