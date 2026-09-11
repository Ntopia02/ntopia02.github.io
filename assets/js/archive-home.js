(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  if (!reduceMotion.matches) {
    let frame;

    window.addEventListener('pointermove', (event) => {
      if (frame) return;

      frame = window.requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--mouse-x', `${event.clientX}px`);
        document.documentElement.style.setProperty('--mouse-y', `${event.clientY}px`);
        frame = null;
      });
    }, { passive: true });
  }

  if (!finePointer.matches || reduceMotion.matches) return;

  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;

      card.style.setProperty('--tilt-x', `${(x * 3.5).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${(y * -3.5).toFixed(2)}deg`);
    });

    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
    });
  });
})();
