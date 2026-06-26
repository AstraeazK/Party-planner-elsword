function syncViewportHeight() {
  const root = document.documentElement;
  const header = document.querySelector('header.app-header');
  const headerHeight = header ? header.getBoundingClientRect().height : 0;
  root.style.setProperty('--app-viewport-height', `${window.innerHeight}px`);
  root.style.setProperty('--app-header-height', `${headerHeight}px`);
}

window.addEventListener('resize', syncViewportHeight);
window.addEventListener('orientationchange', syncViewportHeight);
window.addEventListener('load', syncViewportHeight);
document.addEventListener('DOMContentLoaded', syncViewportHeight);
