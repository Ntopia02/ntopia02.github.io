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
    thumb: 0
  }));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  let cardWidth = 220;
  let gap = 7;
  let selected = null;
  let dismissal;
  let dragging = false;

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
    row.rail.style.setProperty('--thumb-width', `${row.thumb}px`);
    row.rail.style.setProperty('--thumb-x', `${row.max ? row.offset / row.max * (row.width - row.thumb) : 0}px`);
    row.rail.setAttribute('aria-valuemax', String(Math.round(row.max)));
    row.rail.setAttribute('aria-valuenow', String(Math.round(row.offset)));
    row.rail.setAttribute('aria-disabled', String(row.max === 0));
    const first = Math.floor(row.offset / (cardWidth + gap)) + 1;
    const last = Math.min(row.cards.length, Math.ceil((row.offset + row.width) / (cardWidth + gap)));
    row.rail.setAttribute('aria-valuetext', `第 ${first} 至 ${last} 项，共 ${row.cards.length} 项`);
  }

  function layout() {
    const style = getComputedStyle(document.documentElement);
    cardWidth = parseFloat(style.getPropertyValue('--card-width'));
    gap = parseFloat(style.getPropertyValue('--card-gap'));
    const height = parseFloat(style.getPropertyValue('--card-height'));
    const rowGap = parseFloat(style.getPropertyValue('--row-gap'));
    const depth = parseFloat(style.getPropertyValue('--depth'));
    const x = parseFloat(style.getPropertyValue('--angle-x')) * Math.PI / 180;
    const z = Math.abs(parseFloat(style.getPropertyValue('--angle-z'))) * Math.PI / 180;
    const planeHeight = Math.max(1, rows.length - 1) * (height + rowGap) + height + 30;
    const available = stage.clientWidth - (innerWidth <= 600 ? 52 : 88);
    const width = Math.max(120, Math.min(680, (available - Math.sin(z) * planeHeight) / Math.cos(z)));
    const top = Math.cos(x) * Math.sin(z) * width + Math.sin(x) * (depth + 24) + 38;
    stage.style.setProperty('--scene-top', `${top}px`);
    stage.style.setProperty('--scene-width', `${width}px`);
    stage.style.setProperty('--stage-height', `${top + Math.cos(x) * Math.cos(z) * planeHeight + 20}px`);
    rows.forEach(row => {
      const total = row.cards.length * (cardWidth + gap) - gap;
      row.width = Math.min(width, total);
      row.element.style.width = `${row.width}px`;
      row.max = Math.max(0, total - row.width);
      row.thumb = row.max ? Math.max(36, row.width * row.width / total) : row.width;
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
      row.offset = event.key === 'Home' ? 0 : event.key === 'End' ? row.max : row.offset + changes[event.key];
      render(row);
    });
    row.rail.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !row.max) return;
      event.preventDefault();
      const project = axis(row);
      const startPointer = project(event);
      if (!event.target.closest('.rail-thumb')) {
        row.offset = clamp((startPointer * row.width - row.thumb / 2) / (row.width - row.thumb), 0, 1) * row.max;
        render(row);
      }
      const startOffset = row.offset;
      dragging = true;
      row.element.classList.add('is-dragging');
      row.rail.focus({ preventScroll: true });
      row.rail.setPointerCapture(event.pointerId);
      const move = pointer => {
        row.offset = startOffset + (project(pointer) - startPointer) * row.width / (row.width - row.thumb) * row.max;
        render(row);
      };
      const end = () => {
        dragging = false;
        row.element.classList.remove('is-dragging');
        row.rail.removeEventListener('pointermove', move);
        row.rail.removeEventListener('lostpointercapture', end);
      };
      row.rail.addEventListener('pointermove', move);
      row.rail.addEventListener('lostpointercapture', end);
    });

    row.track.addEventListener('wheel', event => {
      if (!row.max || (!event.shiftKey && Math.abs(event.deltaX) <= Math.abs(event.deltaY))) return;
      const delta = (event.shiftKey ? event.deltaY || event.deltaX : event.deltaX) * (event.deltaMode === 1 ? 16 : 1);
      const next = clamp(row.offset + delta, 0, row.max);
      if (next === row.offset) return;
      event.preventDefault();
      row.offset = next;
      render(row);
    }, { passive: false });

    // Horizontal swipes browse a row; vertical gestures keep normal page scrolling.
    let touch;
    let suppressClick = false;
    row.track.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch') return;
      const project = axis(row);
      touch = { id: event.pointerId, x: event.clientX, y: event.clientY, start: project(event), offset: row.offset, project };
      suppressClick = false;
    });
    row.track.addEventListener('pointermove', event => {
      if (!touch || event.pointerId !== touch.id || !row.max) return;
      if (!dragging && Math.abs(event.clientX - touch.x) < 10) return;
      if (!dragging && Math.abs(event.clientY - touch.y) > Math.abs(event.clientX - touch.x)) return;
      dragging = true;
      suppressClick = true;
      row.track.setPointerCapture(event.pointerId);
      row.offset = touch.offset - (touch.project(event) - touch.start) * row.width;
      render(row);
    });
    const endTouch = () => { touch = null; dragging = false; };
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
