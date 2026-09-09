// Голосник — сайт: механіка 3D-колеса вікон

const WINDOW_COUNT = 5;
const ANGLE_STEP = 360 / WINDOW_COUNT;
const RADIUS = 420;

const wheel = document.getElementById('wheel');
const dotsWrap = document.getElementById('wheelDots');

if (wheel && dotsWrap) {
  const windows = wheel.querySelectorAll('.wheel-window');
  let currentIndex = 0;

  windows.forEach((el, i) => {
    el.style.transform = `rotateY(${i * ANGLE_STEP}deg) translateZ(${RADIUS}px)`;
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'wheel-dot';
    dot.setAttribute('aria-label', `Вікно ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  const dots = dotsWrap.querySelectorAll('.wheel-dot');

  function render() {
    wheel.style.transform = `rotateY(${-currentIndex * ANGLE_STEP}deg)`;
    windows.forEach((el, i) => el.classList.toggle('is-active', i === currentIndex));
    dots.forEach((d, i) => d.classList.toggle('is-active', i === currentIndex));
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
    wheel.style.transition = 'none';
  }

  function pointerMove(e) {
    if (!isDragging) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    dragDelta = x - startX;
    const dragAngle = dragDelta / 4;
    wheel.style.transform = `rotateY(${-currentIndex * ANGLE_STEP + dragAngle}deg)`;
  }

  function pointerUp() {
    if (!isDragging) return;
    isDragging = false;
    wheel.style.transition = '';
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

  render();
}
