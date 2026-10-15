/**
 * Lightweight celebratory particle confetti burst effect without external dependencies
 */
export function fireConfetti() {
  if (typeof window === 'undefined') return;

  const count = 40;
  const colors = ['#10b981', '#34d399', '#6ee7b7', '#f59e0b', '#3b82f6', '#ec4899'];
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.inset = '0';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '9999';
  container.style.overflow = 'hidden';
  document.body.appendChild(container);

  const particles: HTMLElement[] = [];

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    const size = Math.random() * 8 + 6;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    el.style.position = 'absolute';
    el.style.width = `${size}px`;
    el.style.height = `${size * (Math.random() > 0.5 ? 1 : 1.5)}px`;
    el.style.backgroundColor = color;
    el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    el.style.left = '50%';
    el.style.top = '50%';
    el.style.opacity = '1';
    el.style.transform = 'translate(-50%, -50%)';
    el.style.transition = 'all 1.2s cubic-bezier(0.25, 1, 0.5, 1)';
    
    container.appendChild(el);
    particles.push(el);

    // Random velocity vector
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 240 + 100;
    const destX = Math.cos(angle) * distance;
    const destY = Math.sin(angle) * distance - 80;
    const rotate = Math.random() * 720 - 360;

    requestAnimationFrame(() => {
      el.style.transform = `translate(calc(-50% + ${destX}px), calc(-50% + ${destY}px)) rotate(${rotate}deg)`;
      el.style.opacity = '0';
    });
  }

  setTimeout(() => {
    container.remove();
  }, 1400);
}
