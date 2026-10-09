
const menuBtn = document.querySelector('.menu-btn');
const menu = document.querySelector('.menu-overlay');
if (menuBtn && menu) {
  menuBtn.addEventListener('click', () => {
    const open = menu.hidden;
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', open);
  });
}

document.querySelectorAll('.media').forEach(box => {
  const video = box.querySelector('video');
  if (!video) return;
  const playBtns = box.querySelectorAll('.play, [data-play]');
  const muteBtn = box.querySelector('[data-mute]');
  const time = box.querySelector('[data-time]');
  const fill = box.querySelector('.fill');
  const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

  playBtns.forEach(btn => btn.addEventListener('click', () => {
    video.paused ? video.play() : video.pause();
  }));
  video.addEventListener('play', () => box.classList.add('playing'));
  video.addEventListener('pause', () => box.classList.remove('playing'));
  video.addEventListener('timeupdate', () => {
    if (time) time.textContent = fmt(video.currentTime) + ' / ' + fmt(video.duration || 0);
    if (fill) fill.style.width = (video.currentTime / video.duration) * 100 + '%';
  });
  if (muteBtn) muteBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    muteBtn.textContent = video.muted ? 'Unmute' : 'Mute';
  });
  const fullBtn = box.querySelector('[data-full]');
  if (fullBtn) fullBtn.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (box.requestFullscreen) box.requestFullscreen();
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
  });

  const cueData = box.querySelector('script.cues');
  if (cueData) {
    const cues = JSON.parse(cueData.textContent);
    const caption = document.createElement('div');
    caption.className = 'caption';
    caption.hidden = true;
    box.appendChild(caption);
    let shown = null;
    const draw = () => {
      const t = video.currentTime;
      const cue = cues.find(c => t >= c[0] && t <= c[1]);
      caption.hidden = !cue;
      if (cue) {
        if (cue !== shown) {
          caption.innerHTML = '';
          cue[2].split(' ').forEach(word => {
            const span = document.createElement('span');
            span.textContent = word + ' ';
            caption.appendChild(span);
          });
        }
        const words = caption.children;
        const speaking = (cue[1] - cue[0]) * 0.8;
        const count = Math.ceil(words.length * Math.min(1, (t - cue[0]) / speaking));
        for (let i = 0; i < words.length; i++) words[i].classList.toggle('on', i < Math.max(1, count));
      }
      shown = cue || null;
      if (!video.paused) requestAnimationFrame(draw);
    };
    video.addEventListener('play', draw);
    video.addEventListener('seeked', draw);
  }
  const track = box.querySelector('.track');
  if (track) track.addEventListener('click', e => {
    if (!video.duration) return;
    const r = track.getBoundingClientRect();
    video.currentTime = ((e.clientX - r.left) / r.width) * video.duration;
  });
  video.addEventListener('play', () => {
    document.querySelectorAll('.media video').forEach(v => { if (v !== video) v.pause(); });
  });
});

const lightbox = document.querySelector('.lightbox');
const shots = [...document.querySelectorAll('a.shot')];
if (lightbox && shots.length) {
  const big = lightbox.querySelector('img');
  let current = 0;
  const show = i => {
    current = (i + shots.length) % shots.length;
    big.src = shots[current].href;
    big.alt = shots[current].querySelector('img').alt;
  };
  shots.forEach((shot, i) => shot.addEventListener('click', e => {
    e.preventDefault();
    show(i);
    lightbox.showModal();
  }));
  lightbox.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') show(current + 1);
    if (e.key === 'ArrowLeft') show(current - 1);
  });
  lightbox.addEventListener('click', e => { if (e.target !== big) lightbox.close(); });
}

const navLinks = [...document.querySelectorAll('.side-nav a[href^="#"]')];
const navTargets = navLinks.map(a => document.querySelector(a.getAttribute('href')));
if (navLinks.length) {
  const header = document.querySelector('.site-header');
  let clicked = null;
  const setCurrent = index => navLinks.forEach((a, i) => a.classList.toggle('current', i === index));
  const mark = () => {
    if (clicked !== null) return setCurrent(clicked);
    const line = (header ? header.offsetHeight : 0) + 40;
    let current = 0;
    navTargets.forEach((target, i) => {
      if (target && target.getBoundingClientRect().top <= line) current = i;
    });
    const page = document.documentElement;
    if (window.innerHeight + window.scrollY >= page.scrollHeight - 2) current = navLinks.length - 1;
    setCurrent(current);
  };
  navLinks.forEach((a, i) => a.addEventListener('click', () => { clicked = i; setCurrent(i); }));
  ['wheel', 'touchmove', 'keydown', 'mousedown'].forEach(type =>
    window.addEventListener(type, e => {
      if (type === 'mousedown' && e.target.closest('.side-nav')) return;
      clicked = null;
    }, { passive: true }));
  let waiting = false;
  window.addEventListener('scroll', () => {
    if (waiting) return;
    waiting = true;
    requestAnimationFrame(() => { waiting = false; mark(); });
  }, { passive: true });
  window.addEventListener('resize', mark);
  mark();
}

document.querySelectorAll('.media[data-youtube], .media[data-drive]').forEach(box => {
  box.addEventListener('click', () => {
    if (box.querySelector('iframe')) return;
    const frame = document.createElement('iframe');
    frame.src = box.dataset.drive
      ? 'https://drive.google.com/file/d/' + box.dataset.drive + '/preview'
      : 'https://www.youtube-nocookie.com/embed/' + box.dataset.youtube + '?autoplay=1&rel=0';
    frame.title = box.dataset.label;
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    box.innerHTML = '';
    box.appendChild(frame);
  });
});
