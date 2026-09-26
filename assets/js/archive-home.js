(() => {
  const stage = document.querySelector('.archive-stage');
  if (!stage) return;
  const scene = document.querySelector('.archive-scene');
  const preview = document.querySelector('.article-preview');
  const image = preview.querySelector('.preview-cover');
  const previewLink = preview.querySelector('.preview-link');
  const rows = [...scene.querySelectorAll('.archive-row')].map(element => ({
    element,
    cards: [...element.querySelectorAll('.archive-card')],
    track: element.querySelector('.row-track'),
    rail: element.querySelector('.row-scrollbar'),
    offset: 0,
    max: 0,
    width: 0,
    thumb: 0,
    elastic: 0,
    spring: 0,
    wheelTimer: 0
  }));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  let cardWidth = 220;
  let gap = 7;
  let selected = null;
  let dismissal;
  let dragging = false;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function stopSpring(row) {
    cancelAnimationFrame(row.spring);
    clearTimeout(row.wheelTimer);
    row.spring = 0;
    row.element.classList.remove('is-springing');
  }

  // Keep the real scroll offset bounded. Only the visible row stretches beyond
  // its endpoints, with progressively stronger resistance (including short rows).
  function dragTo(row, rawOffset) {
    row.offset = clamp(rawOffset, 0, row.max);
    const excess = rawOffset - row.offset;
    const limit = Math.min(42, cardWidth * .19);
    row.elastic = Math.sign(excess) * limit * (1 - Math.exp(-Math.abs(excess) * .38 / limit));
    render(row);
  }

  function rawOffset(row) {
    const limit = Math.min(42, cardWidth * .19);
    return row.offset - Math.sign(row.elastic) * limit / .38 * Math.log(Math.max(.001, 1 - Math.abs(row.elastic) / limit));
  }

  function springBack(row) {
    stopSpring(row);
    if (reducedMotion.matches || Math.abs(row.elastic) < .1) {
      row.elastic = 0;
      render(row);
      return;
    }
    row.element.classList.add('is-springing');
    let velocity = 0;
    let previous = performance.now();
    function tick(now) {
      const dt = Math.min((now - previous) / 1000, 1 / 30);
      previous = now;
      velocity += (-230 * row.elastic - 24 * velocity) * dt;
      row.elastic += velocity * dt;
      if (Math.abs(row.elastic) < .08 && Math.abs(velocity) < .4) {
        row.elastic = 0;
        row.spring = 0;
        row.element.classList.remove('is-springing');
        render(row);
      } else {
        render(row);
        row.spring = requestAnimationFrame(tick);
      }
    }
    row.spring = requestAnimationFrame(tick);
  }

  function clearPreview() {
    if (dragging) return;
    selected?.classList.remove('is-selected');
    selected = null;
    preview.hidden = true;
    rows.forEach(row => row.element.classList.remove('is-active'));
  }

  function select(card, row) {
    clearTimeout(dismissal);
    if (selected === card) return;
    selected?.classList.remove('is-selected');
    selected = card;
    card.classList.add('is-selected');
    rows.forEach(item => item.element.classList.toggle('is-active', item === row));
    const data = card.dataset;
    previewLink.textContent = data.title;
    previewLink.href = card.href;
    preview.querySelector('.preview-category').textContent = data.category;
    preview.querySelector('.preview-description').textContent = data.description;
    const date = preview.querySelector('.preview-date');
    date.hidden = !data.date;
    date.textContent = data.date;
    if (data.date) date.dateTime = data.date.replaceAll('.', '-');
    else date.removeAttribute('datetime');
    image.hidden = true;
    if (data.cover) {
      image.src = data.cover;
      image.alt = data.title;
      image.hidden = false;
    } else {
      image.removeAttribute('src');
      image.alt = '';
    }
    preview.hidden = false;
  }
  image.addEventListener('error', () => { image.hidden = true; });

  function render(row) {
    row.offset = clamp(row.offset, 0, row.max);
    row.track.style.setProperty('--elastic-x', `${-row.elastic}px`);
    row.cards.forEach((card, index) => {
      const originalLeft = index * (cardWidth + gap) - row.offset;
      const left = Math.max(0, originalLeft);
      const right = Math.min(row.width, originalLeft + cardWidth);
      const visible = right > left;
      card.style.visibility = visible ? 'visible' : 'hidden';
      card.style.left = `${left}px`;
      card.style.width = `${Math.max(0, right - left)}px`;
      card.style.setProperty('--crop-left', `${Math.max(0, -originalLeft)}px`);
      card.querySelector('.block-side').style.visibility = visible && originalLeft >= 0 ? 'visible' : 'hidden';
      if (!visible && selected === card) {
        const nearest = row.cards[clamp(Math.round(row.offset / (cardWidth + gap)), 0, row.cards.length - 1)];
        select(nearest, row);
      }
    });
    const compression = Math.min(row.thumb * .3, Math.abs(row.elastic) * .7);
    const thumbWidth = row.thumb - compression;
    const position = row.max ? row.offset / row.max * (row.width - row.thumb) : 0;
    const atEnd = row.max ? row.offset === row.max : row.elastic > 0;
    row.rail.style.setProperty('--thumb-width', `${thumbWidth}px`);
    row.rail.style.setProperty('--thumb-x', `${position + (atEnd ? compression : 0)}px`);
    row.rail.setAttribute('aria-valuemax', String(Math.round(row.max)));
    row.rail.setAttribute('aria-valuenow', String(Math.round(row.offset)));
    const first = Math.floor(row.offset / (cardWidth + gap)) + 1;
    const last = Math.min(row.cards.length, Math.ceil((row.offset + row.width) / (cardWidth + gap)));
    row.rail.setAttribute('aria-valuetext', row.max ? `第 ${first} 至 ${last} 项，共 ${row.cards.length} 项` : `全部 ${row.cards.length} 项，可拖动回弹`);
  }

  function layout() {
    const style = getComputedStyle(document.documentElement);
    cardWidth = parseFloat(style.getPropertyValue('--card-width'));
    gap = parseFloat(style.getPropertyValue('--card-gap'));
    const height = parseFloat(style.getPropertyValue('--card-height'));
    const rowGap = parseFloat(style.getPropertyValue('--row-gap'));
    const titleSpace = parseFloat(style.getPropertyValue('--title-space'));
    const railOffset = parseFloat(style.getPropertyValue('--rail-offset'));
    const railHeight = parseFloat(style.getPropertyValue('--rail-hit-height'));
    const depth = parseFloat(style.getPropertyValue('--depth'));
    const x = parseFloat(style.getPropertyValue('--angle-x')) * Math.PI / 180;
    const z = Math.abs(parseFloat(style.getPropertyValue('--angle-z'))) * Math.PI / 180;
    const planeHeight = Math.max(0, rows.length - 1) * (titleSpace + height + rowGap) + titleSpace + height + railOffset + railHeight;
    const available = stage.clientWidth - (innerWidth <= 600 ? 44 : 64);
    const width = Math.max(100, Math.min(680, (available - Math.sin(z) * planeHeight) / Math.cos(z)));
    const top = Math.cos(x) * Math.sin(z) * width + Math.sin(x) * (depth + 24) + 38;
    stage.style.setProperty('--scene-top', `${top}px`);
    stage.style.setProperty('--scene-width', `${width}px`);
    stage.style.setProperty('--stage-height', `${top + Math.cos(x) * Math.cos(z) * planeHeight + 20}px`);
    rows.forEach(row => {
      stopSpring(row);
      row.elastic = 0;
      const total = row.cards.length * (cardWidth + gap) - gap;
      row.width = Math.min(width, total);
      row.element.style.width = `${row.width}px`;
      row.max = Math.max(0, total - row.width);
      row.thumb = row.max ? Math.min(row.width, Math.max(44, row.width * row.width / total)) : row.width;
      render(row);
    });
  }

  // Project pointer movement onto the rail's actual screen-space axis, so a
  // diagonal drag maps correctly even after responsive changes to the scene.
  function axis(row) {
    const start = row.rail.querySelector('.rail-start').getBoundingClientRect();
    const end = row.rail.querySelector('.rail-end').getBoundingClientRect();
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    return event => ((event.clientX - start.x) * dx + (event.clientY - start.y) * dy) / lengthSquared;
  }

  rows.forEach(row => {
    row.cards.forEach((card, index) => {
      let alreadySelectedOnTouch = false;
      card.addEventListener('pointerdown', event => {
        if (event.pointerType === 'touch') alreadySelectedOnTouch = selected === card;
      });
      card.addEventListener('pointerenter', event => {
        if (event.pointerType !== 'touch' && !dragging) select(card, row);
      });
      card.addEventListener('focus', () => {
        stopSpring(row);
        row.elastic = 0;
        const left = index * (cardWidth + gap);
        if (left < row.offset) row.offset = left;
        else if (left + cardWidth > row.offset + row.width) row.offset = left + cardWidth - row.width;
        render(row);
        select(card, row);
      });
      card.addEventListener('click', event => {
        if (event.detail && (event.pointerType === 'touch' || matchMedia('(pointer: coarse)').matches) && !alreadySelectedOnTouch) {
          event.preventDefault();
          select(card, row);
        }
      });
    });

    row.rail.addEventListener('keydown', event => {
      const step = cardWidth + gap;
      const changes = { ArrowRight: step, ArrowDown: step, ArrowLeft: -step, ArrowUp: -step, PageDown: row.width, PageUp: -row.width };
      if (!(event.key in changes) && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();
      stopSpring(row);
      dragTo(row, event.key === 'Home' ? 0 : event.key === 'End' ? row.max : row.offset + changes[event.key]);
      springBack(row);
    });
    row.rail.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      event.preventDefault();
      stopSpring(row);
      const project = axis(row);
      const startPointer = project(event);
      if (row.max && !event.target.closest('.rail-thumb')) {
        row.offset = clamp((startPointer * row.width - row.thumb / 2) / (row.width - row.thumb), 0, 1) * row.max;
        row.elastic = 0;
        render(row);
      }
      const startOffset = rawOffset(row);
      const gain = row.max ? row.max / (row.width - row.thumb) : 1;
      dragging = true;
      row.element.classList.add('is-dragging');
      row.rail.focus({ preventScroll: true });
      row.rail.setPointerCapture(event.pointerId);
      const move = pointer => {
        dragTo(row, startOffset + (project(pointer) - startPointer) * row.width * gain);
      };
      const end = pointer => {
        if (pointer.pointerId !== event.pointerId) return;
        dragging = false;
        row.element.classList.remove('is-dragging');
        row.rail.removeEventListener('pointermove', move);
        row.rail.removeEventListener('pointerup', end);
        row.rail.removeEventListener('pointercancel', end);
        row.rail.removeEventListener('lostpointercapture', end);
        window.removeEventListener('pointerup', end);
        window.removeEventListener('pointercancel', end);
        if (row.rail.hasPointerCapture(event.pointerId)) row.rail.releasePointerCapture(event.pointerId);
        springBack(row);
      };
      row.rail.addEventListener('pointermove', move);
      row.rail.addEventListener('pointerup', end);
      row.rail.addEventListener('pointercancel', end);
      row.rail.addEventListener('lostpointercapture', end);
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
    });

    row.track.addEventListener('wheel', event => {
      if (!event.shiftKey && Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      const delta = (event.shiftKey ? event.deltaY || event.deltaX : event.deltaX) * (event.deltaMode === 1 ? 16 : 1);
      event.preventDefault();
      const next = rawOffset(row) + delta;
      stopSpring(row);
      dragTo(row, next);
      row.element.classList.add('is-springing');
      row.wheelTimer = setTimeout(() => springBack(row), 100);
    }, { passive: false });

    // Horizontal swipes browse a row; vertical gestures keep normal page scrolling.
    let touch;
    let suppressClick = false;
    row.track.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch') return;
      stopSpring(row);
      const project = axis(row);
      touch = { id: event.pointerId, x: event.clientX, y: event.clientY, start: project(event), offset: rawOffset(row), project };
      suppressClick = false;
    });
    row.track.addEventListener('pointermove', event => {
      if (!touch || event.pointerId !== touch.id) return;
      if (!dragging && Math.abs(event.clientX - touch.x) < 10) return;
      if (!dragging && Math.abs(event.clientY - touch.y) > Math.abs(event.clientX - touch.x)) return;
      dragging = true;
      row.element.classList.add('is-dragging');
      suppressClick = true;
      row.track.setPointerCapture(event.pointerId);
      dragTo(row, touch.offset - (touch.project(event) - touch.start) * row.width);
    });
    const endTouch = () => {
      if (!touch) return;
      touch = null;
      dragging = false;
      row.element.classList.remove('is-dragging');
      springBack(row);
    };
    row.track.addEventListener('pointerup', endTouch);
    row.track.addEventListener('pointercancel', endTouch);
    row.track.addEventListener('click', event => {
      if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; }
    }, true);
  });

  const workspace = document.querySelector('.archive-workspace');
  workspace.addEventListener('pointerenter', () => clearTimeout(dismissal));
  workspace.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'touch') dismissal = setTimeout(clearPreview, 200);
  });
  workspace.addEventListener('focusout', event => {
    if (!workspace.contains(event.relatedTarget)) clearPreview();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') clearPreview(); });
  document.addEventListener('pointerdown', event => {
    if (!workspace.contains(event.target)) clearPreview();
  });
  document.documentElement.classList.add('archive-enhanced');
  layout();
  new ResizeObserver(layout).observe(stage);
})();
