// YEAR
const yEl = document.getElementById('y');
if (yEl) yEl.textContent = new Date().getFullYear();

/* =========================
   MOBILE MENU (A11y + UX)
   ========================= */
const burger = document.getElementById('burger');
const menu = document.getElementById('menu');
let lastFocusedEl = null;

function setMenu(open) {
  if (!burger || !menu) return;
  menu.classList.toggle('open', open);
  burger.classList.toggle('open', open);   // compatibilidad con CSS actual
  burger.classList.toggle('active', open); // para animación a "X"
  document.body.classList.toggle('no-scroll', open);
  burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  menu.setAttribute('aria-hidden', open ? 'false' : 'true');

  if (open) {
    lastFocusedEl = document.activeElement;
    const firstLink = menu.querySelector('a,button,[tabindex]:not([tabindex="-1"])');
    if (firstLink) firstLink.focus({ preventScroll: true });
  } else if (lastFocusedEl) {
    lastFocusedEl.focus({ preventScroll: true });
  }
}

if (burger && menu) {
  burger.setAttribute('aria-controls', 'menu');
  burger.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-hidden', 'true');

  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));

  // cerrar al hacer clic en enlaces
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  // cerrar con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false);
  });

  // cerrar al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!menu.classList.contains('open')) return;
    const clickInsideMenu = menu.contains(e.target) || burger.contains(e.target);
    if (!clickInsideMenu) setMenu(false);
  });

  // trap de foco dentro del panel
  menu.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusables = menu.querySelectorAll('a,button,input,textarea,select,[tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  });
}

/* =========================
   REVEAL ON SCROLL
   ========================= */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealEls = document.querySelectorAll('.reveal');

if (prefersReduced) {
  revealEls.forEach(el => { el.classList.add('in-view'); });
} else if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in-view'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));
}

/* =========================
   HERO PARALLAX (mouse)
   ========================= */
const spark = document.querySelector('.spark');
if (spark && !prefersReduced) {
  let raf = null, px = 0, py = 0, tx = 0, ty = 0;

  const animate = () => {
    px += (tx - px) * 0.1;
    py += (ty - py) * 0.1;
    spark.style.setProperty('--pX', px + 'px');
    spark.style.setProperty('--pY', py + 'px');
    raf = requestAnimationFrame(animate);
  };

  window.addEventListener('mousemove', (e) => {
    tx = (e.clientX / innerWidth - 0.5) * 40;
    ty = (e.clientY / innerHeight - 0.5) * 40;
    if (!raf) raf = requestAnimationFrame(animate);
  });
}

/* =========================
   COUNTERS + PROGRESS BARS
   ========================= */
function animateNumber(el, to, { duration = 1200, decimals = 0 } = {}) {
  const start = performance.now();
  const from = 0;
  const factor = Math.pow(10, decimals);
  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const val = from + (to - from) * t;
    el.textContent = (Math.round(val * factor) / factor).toFixed(decimals);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const counters = document.querySelectorAll('.counter');
const bars = document.querySelectorAll('[data-bar]');

if ('IntersectionObserver' in window) {
  const ioCounters = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const to = parseFloat(el.dataset.to || '0');
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      animateNumber(el, to, { decimals });
      obs.unobserve(el);
    });
  }, { threshold: 0.6 });
  counters.forEach(c => ioCounters.observe(c));

  const ioBars = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const span = e.target;
      const w = span.dataset.bar;
      span.style.transition = 'width 1000ms ease';
      requestAnimationFrame(() => { span.style.width = w + '%'; });
      obs.unobserve(span);
    });
  }, { threshold: 0.3 });
  bars.forEach(b => ioBars.observe(b));
}

/* =========================
   TESTIMONIALS CAROUSEL
   ========================= */
const track = document.getElementById('track');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');

if (track && prevBtn && nextBtn) {
  const slides = Array.from(track.children);
  let index = 0, timer = null, startX = null;

  function go(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
  }
  const play = () => { stop(); timer = setInterval(() => go(index + 1), 4500); };
  const stop = () => { if (timer) clearInterval(timer); };

  prevBtn.addEventListener('click', () => { stop(); go(index - 1); play(); });
  nextBtn.addEventListener('click', () => { stop(); go(index + 1); play(); });

  // teclado
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { prevBtn.click(); }
    if (e.key === 'ArrowRight') { nextBtn.click(); }
  });
  track.setAttribute('tabindex', '0');
  track.setAttribute('aria-live', 'polite');

  // pausa cuando no está visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else play();
  });

  // gesto táctil simple
  track.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; stop(); }, { passive: true });
  track.addEventListener('touchend', (e) => {
    if (startX == null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) dx > 0 ? prevBtn.click() : nextBtn.click();
    startX = null; play();
  });

  play();
}

/* =========================
   HEADER SCROLLED
   ========================= */
const header = document.querySelector('header');
if (header) {
  const onScroll = () => {
    if (window.scrollY > 10) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* =========================
   RESPONSIVE SIMULATOR (guard)
   ========================= */
const widthSim = document.getElementById('widthSim');
const deviceSim = document.getElementById('deviceSim');
if (widthSim && deviceSim) {
  widthSim.addEventListener('input', (e) => deviceSim.style.width = e.target.value + 'px');
}


/* =========================
CAROUSEL 3D (Portfolio)
========================= */
(function(){
const containers = document.querySelectorAll('.carousel3d-container');
if(!containers.length) return;


const lerp=(a,b,n)=>n*(a-b)+b;
const distZ=(w,len,gap)=> (w/2)/Math.tan(Math.PI/len)+gap;


function initCarousel3D(container){
const viewport = container.querySelector('.carousel3d-viewport');
const ring = container.querySelector('.carousel3d');
const items = container.querySelectorAll('.carousel3d-item');
const btnL = container.querySelector('.carousel3d-nav.left');
const btnR = container.querySelector('.carousel3d-nav.right');
if(!viewport||!ring||!items.length) return;


let isDown=false, curX=0, lastX=0, lastMove=0, move=0, rafId=null;


const onResize=()=>{
const rect = viewport.getBoundingClientRect();
const len = items.length; const deg = 360/len; const gap=20;
const tz = distZ(rect.width, len, gap);
container.style.width = (tz*2 + gap*len) + 'px';
container.style.height = Math.tan((90*Math.PI/180)/2)*1*tz + 'px';
items.forEach((it,i)=>{ it.style.setProperty('--rotatey', (deg*i)+'deg'); it.style.setProperty('--tz', tz+'px'); });
};


const getX=(x)=>{ curX=x; move = curX<lastX ? move-2 : move+2; lastX=curX; };


const update=()=>{ lastMove = lerp(move,lastMove,0.05); ring.style.setProperty('--rotatey', lastMove+'deg'); rafId=requestAnimationFrame(update); };


// mouse/touch
ring.addEventListener('mousedown',()=>{ isDown=true; ring.style.cursor='grabbing'; });
ring.addEventListener('mouseup',()=>{ isDown=false; ring.style.cursor='grab'; });
container.addEventListener('mouseleave',()=> isDown=false);
ring.addEventListener('mousemove',e=> isDown && getX(e.clientX));
ring.addEventListener('touchstart',()=>{ isDown=true; ring.style.cursor='grabbing'; },{passive:true});
ring.addEventListener('touchend',()=>{ isDown=false; ring.style.cursor='grab'; });
container.addEventListener('touchmove',e=> isDown && getX(e.touches[0].clientX),{passive:true});


// botones
if(btnL) btnL.addEventListener('click',()=>{ move-=60; });
if(btnR) btnR.addEventListener('click',()=>{ move+=60; });


// teclado
container.tabIndex=0;
container.addEventListener('keydown',(e)=>{ if(e.key==='ArrowLeft'){ move-=60; } if(e.key==='ArrowRight'){ move+=60; } });


// autoplay pausado al cambiar pestaña
document.addEventListener('visibilitychange',()=>{ if(document.hidden){ cancelAnimationFrame(rafId); rafId=null; } else if(!rafId){ update(); } });


window.addEventListener('resize', onResize);
onResize();
update();
}


containers.forEach(initCarousel3D);
})();
