/**
 * Simple screen router
 */

const SCREENS = ['landing', 'setup', 'interview', 'report'];
let current = 'landing';

export function showScreen(screenName) {
  if (!SCREENS.includes(screenName)) {
    console.warn('Unknown screen:', screenName);
    return;
  }

  SCREENS.forEach(name => {
    const el = document.getElementById(`screen-${name}`);
    if (el) {
      el.classList.toggle('active', name === screenName);
    }
  });

  current = screenName;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function getCurrentScreen() {
  return current;
}
