(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // スクロール表示（失敗しても3秒後に必ず表示）
  const els = $$('.reveal');
  const showAll = () => els.forEach(e => e.classList.add('is-in'));
  if (reduce || !('IntersectionObserver' in window)) showAll();
  else {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach(e => io.observe(e));
    setTimeout(() => $$('.reveal:not(.is-in)').forEach(e => { if (e.getBoundingClientRect().top < innerHeight) e.classList.add('is-in'); }), 3000);
  }

  // 線と各ステップが順に現れる（1回だけ）
  $$('[data-draw]').forEach(list => {
    if (reduce || !('IntersectionObserver' in window)) return;
    const items = $$('li', list);
    list.style.setProperty('--draw', 0);
    items.forEach(li => { li.style.setProperty('--o', 0); li.style.setProperty('--y', '16px'); });
    new IntersectionObserver((es, ob) => {
      if (!es[0].isIntersecting) return;
      list.style.setProperty('--draw', 1);
      items.forEach((li, i) => setTimeout(() => { li.style.setProperty('--o', 1); li.style.setProperty('--y', 0); }, 100 * i));
      ob.disconnect();
    }, { threshold: .25 }).observe(list);
  });

  // ごく軽いパララックス（PC・ホバー端末のみ、枠内に収める）
  if (!reduce && matchMedia('(min-width: 900px) and (hover: hover)').matches) {
    const imgs = $$('.parallax img');
    let tick = false;
    const run = () => { imgs.forEach(im => { const r = im.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; im.style.transform = `scale(1.08) translateY(${(p * -12).toFixed(1)}px)`; }); tick = false; };
    if (imgs.length) addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(run); } }, { passive: true }), run();
  }

  // 日程ナビの現在位置
  const links = $$('[data-day]');
  if (links.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('is-on', a.dataset.day === e.target.dataset.dayPanel)); }), { rootMargin: '-45% 0px -45% 0px' });
    $$('[data-day-panel]').forEach(p => io.observe(p));
  }

  // 背景動画：停止ボタン・画面外で停止
  const v = document.querySelector('.hero-video'), vb = document.querySelector('.video-toggle');
  if (v) {
    if (reduce) { v.pause(); v.removeAttribute('autoplay'); vb && vb.remove(); }
    else {
      let user = false;
      if (vb) {
        vb.removeAttribute('aria-pressed');
        const sync = () => { vb.textContent = v.paused ? '動画を再生' : '動画を停止'; };
        v.addEventListener('play', sync); v.addEventListener('pause', sync); sync();
        vb.addEventListener('click', () => { if (v.paused) { user = false; v.play().catch(() => {}); } else { user = true; v.pause(); } });
      }
      new IntersectionObserver(es => { if (es[0].isIntersecting) { if (!user) v.play().catch(() => {}); } else v.pause(); }).observe(v);
    }
  }

  // セクション内の動画：画面に入ったら再生、外れたら停止（動きを減らす設定では静止画のまま）
  const lv = $$('[data-lazy-video]');
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  const allVideos = () => [...lv, document.querySelector('.hero-video')].filter(Boolean);
  mq.addEventListener && mq.addEventListener('change', () => { if (mq.matches) allVideos().forEach(v => { v.dataset.userPaused = '1'; v.pause(); }); });
  if (lv.length && 'IntersectionObserver' in window) {
    lv.forEach(el => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'vbtn';
      const sync = () => { b.textContent = el.paused ? '動画を再生' : '動画を停止'; };
      el.addEventListener('play', sync); el.addEventListener('pause', sync); sync();
      b.addEventListener('click', () => { if (el.paused) { delete el.dataset.userPaused; el.preload = 'auto'; el.play().catch(() => {}); } else { el.dataset.userPaused = '1'; el.pause(); } });
      el.parentElement.appendChild(b);
      if (reduce) el.dataset.userPaused = '1';
    });
    const vo = new IntersectionObserver(es => es.forEach(e => { const el = e.target; if (e.isIntersecting) { if (el.dataset.userPaused || mq.matches) return; if (el.preload !== 'auto') el.preload = 'auto'; el.play().catch(() => {}); } else el.pause(); }), { threshold: .2 });
    lv.forEach(el => vo.observe(el));
  }

  // 08 マーカー：画面に入ったら線を引く
  const marks = $$('.mark');
  if (reduce || !('IntersectionObserver' in window)) marks.forEach(m => m.classList.add('is-marked'));
  else {
    const mo = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-marked'); mo.unobserve(e.target); } }), { rootMargin: '0px 0px -15% 0px' });
    marks.forEach(m => mo.observe(m));
  }
  // 07 プログレスバー
  const bar = document.querySelector('[data-progress]');
  if (bar && !reduce) {
    let ticking = false;
    const upd = () => { const h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`; ticking = false; };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  // 開始前は申込ボタンを止める
  $$('[data-stage-cta][data-start]').forEach(a => { if (Date.now() < Date.parse(a.dataset.start)) { const s = document.createElement('span'); s.className = a.className.replace('btn-main', 'btn-off'); s.setAttribute('aria-disabled', 'true'); s.textContent = '受付開始前です'; a.replaceWith(s); } });

  // 実在の締切がある時だけ残り時間。締切後は申込ボタンを止める（価格は自動で切り替えない）
  $$('.countdown[data-end]').forEach(el => {
    const end = Date.parse(el.dataset.end), out = el.querySelector('[data-left]');
    const upd = () => {
      const ms = end - Date.now();
      if (ms <= 0) {
        out.textContent = 'この募集段階の受付は終了しました';
        $$('[data-stage-cta]').forEach(a => { const s = document.createElement('span'); s.className = a.className.replace('btn-main', 'btn-off'); s.setAttribute('aria-disabled', 'true'); s.textContent = '受付終了・次の募集のご案内をお待ちください'; a.replaceWith(s); });
        return;
      }
      const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60;
      out.textContent = `締切まで あと${d}日${h}時間${m}分`;
      setTimeout(upd, 30000);
    };
    upd();
  });

  // スマホの固定CTA：ファーストビューと最後のCTA、FAQ表示中は出さない
  const dock = document.querySelector('[data-dock]');
  if (dock && 'IntersectionObserver' in window) {
    const vis = new Set();
    const io = new IntersectionObserver(es => { es.forEach(e => e.isIntersecting ? vis.add(e.target) : vis.delete(e.target)); const on = vis.size === 0; dock.classList.toggle('is-on', on); dock.inert = !on; });
    ['.hero', '.final', '.faq', '.site-foot'].forEach(s => { const t = document.querySelector(s); t && io.observe(t); });
  }
})();
