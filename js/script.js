// Голосник — сайт: механіка колеса вікон (coverflow: картки завжди лицем до глядача)

const WINDOW_COUNT = 5;

const wheel = document.getElementById('wheel');
const dotsWrap = document.getElementById('wheelDots');

if (wheel && dotsWrap) {
  const windows = Array.from(wheel.querySelectorAll('.wheel-window'));
  let currentIndex = 0;
  let offset = 0; // px зсуву для сусідньої картки, рахується від реальної ширини картки

  windows.forEach((el, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'wheel-dot';
    dot.setAttribute('aria-label', `Вікно ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  const dots = dotsWrap.querySelectorAll('.wheel-dot');

  // Найкоротша "відстань" по колу з 5 елементів: -2..2
  function deltaFor(i) {
    let d = i - currentIndex;
    if (d > WINDOW_COUNT / 2) d -= WINDOW_COUNT;
    if (d < -WINDOW_COUNT / 2) d += WINDOW_COUNT;
    return d;
  }

  function layoutFor(delta) {
    if (delta === 0) return { x: 0, scale: 1, opacity: 1, blur: 0, z: 5 };
    const side = delta > 0 ? 1 : -1;
    if (Math.abs(delta) === 1) return { x: side * offset, scale: 0.72, opacity: 0.55, blur: 1, z: 3 };
    // delta === ±2: задня картка — повністю прибрана, ніби ще за фоном
    return { x: side * offset, scale: 0.5, opacity: 0, blur: 2, z: 1 };
  }

  // Висота активної картки — динамічно вниз до крапок-індикаторів
  function computeActiveHeight() {
    const wheelTop = wheel.getBoundingClientRect().top;
    const dotsTop = dotsWrap.getBoundingClientRect().top;
    const gapAboveDots = 24;
    const available = dotsTop - gapAboveDots - wheelTop;
    return Math.max(320, Math.round(available));
  }

  function render(dragBoost = 0) {
    const activeHeight = computeActiveHeight();
    windows.forEach((el, i) => {
      const d = deltaFor(i);
      const layout = layoutFor(d);
      const x = layout.x + dragBoost;
      el.style.transform = `translateX(${x}px) scale(${layout.scale})`;
      el.style.opacity = layout.opacity;
      el.style.filter = layout.blur ? `blur(${layout.blur}px)` : '';
      el.style.zIndex = layout.z;
      el.style.pointerEvents = layout.opacity === 0 ? 'none' : '';
      el.classList.toggle('is-active', d === 0);
      // тільки активна картка тягнеться вниз; бокові лишаються як є (CSS-висота)
      el.style.height = d === 0 ? `${activeHeight}px` : '';
    });
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === currentIndex));
  }

  function measureOffset() {
    const cardW = windows[0] ? windows[0].offsetWidth : 320;
    const viewport = wheel.closest('.wheel-viewport');
    const vw = viewport ? viewport.offsetWidth : window.innerWidth;
    const neighborHalf = (cardW * 0.72) / 2;
    const navReserve = 44 + 40; // кнопка-стрілка + відступ від неї
    // тягнемо сусідню картку майже до стрілки, лишаючи невеликий проміжок
    const toEdge = vw / 2 - navReserve - neighborHalf;
    offset = Math.max(Math.round(cardW * 0.82), Math.round(toEdge));
  }

  function goTo(index) {
    currentIndex = (index + WINDOW_COUNT) % WINDOW_COUNT;
    render();
  }

  const prevBtn = document.querySelector('.wheel-nav--prev');
  const nextBtn = document.querySelector('.wheel-nav--next');
  if (prevBtn) prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(currentIndex + 1));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') goTo(currentIndex - 1);
    if (e.key === 'ArrowRight') goTo(currentIndex + 1);
  });

  let isDragging = false;
  let startX = 0;
  let dragDelta = 0;

  function pointerDown(e) {
    isDragging = true;
    startX = e.touches ? e.touches[0].clientX : e.clientX;
    wheel.classList.add('is-dragging');
  }

  function pointerMove(e) {
    if (!isDragging) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    dragDelta = x - startX;
    render(dragDelta);
  }

  function pointerUp() {
    if (!isDragging) return;
    isDragging = false;
    wheel.classList.remove('is-dragging');
    if (Math.abs(dragDelta) > 40) {
      goTo(currentIndex + (dragDelta < 0 ? 1 : -1));
    } else {
      render();
    }
    dragDelta = 0;
  }

  wheel.addEventListener('mousedown', pointerDown);
  wheel.addEventListener('touchstart', pointerDown, { passive: true });
  window.addEventListener('mousemove', pointerMove);
  window.addEventListener('touchmove', pointerMove, { passive: true });
  window.addEventListener('mouseup', pointerUp);
  window.addEventListener('touchend', pointerUp);

  window.addEventListener('resize', () => { measureOffset(); render(); });

  measureOffset();
  render();
}
