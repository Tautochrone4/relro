/* ---- scroll reveal ---- */
(function(){
  var els = document.querySelectorAll('.rv');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    els.forEach(function(e){ e.classList.add('in'); }); return;
  }
  var io = new IntersectionObserver(function(en){
    en.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .15 });
  els.forEach(function(e){ io.observe(e); });
})();

/* ---- deterministic pseudo-hashes, shared by the nav and the tree ---- */
function relroHash(seed, n){
  var s = '', c = '0123456789abcdef';
  seed = (seed * 2654435761 + 40503) >>> 0;
  for (var i = 0; i < n; i++){
    seed = (seed * 1664525 + 1013904223) >>> 0;
    s += c[(seed >>> 19) & 15];
  }
  return s;
}

/* ---- stamp each section with its node identity ---- */
(function(){
  var LEAVES = ['review','update','work','stack','fleet-sec','about','contact'];
  LEAVES.forEach(function(id, i){
    var sec = document.getElementById(id);
    if (!sec) return;
    var eyebrow = sec.querySelector('.eyebrow');
    if (!eyebrow || sec.querySelector('.node-id')) return;
    var stamp = document.createElement('span');
    stamp.className = 'node-id';
    stamp.style.marginTop = '10px';
    stamp.style.display = 'flex';
    stamp.innerHTML = '<span class="nid-path">node ' + (i+1) + ' / 7</span>' +
                      '<span class="nid-hash">' + relroHash(i + 3, 8) + '</span>';
    eyebrow.parentNode.insertBefore(stamp, eyebrow.nextSibling);
  });
})();

/* ---- climbing the hash tree: scroll = camera rising along one proof path ---- */
(function(){
  var cv = document.getElementById('bgTree');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = window.innerWidth < 700;

  var DEPTH = small ? 7 : 8;        // level 0 = data blocks, top level = root
  var N     = 1 << (DEPTH - 1);
  var SEP   = 460;
  var SPREAD= 2900;
  var LEAF  = small ? 21 : 37;      // the block we climb from

  var nodes = [], path = [], W = 0, H = 0, DPR = 1, F = 900;
  var TOP = (DEPTH - 1) * SEP, START = -1750;
  var camX = 0, camZ = 0, camY = START, targetY = START;

  function makeTree(){
    nodes = [];
    var leaves = [];
    for (var i = 0; i < N; i++){
      var r = SPREAD * Math.sqrt((i + .5) / N), a = i * 2.39996323;
      leaves.push({ x:r*Math.cos(a), z:r*Math.sin(a), y:0, l:0, i:i, p:null, h:relroHash(i + 11, 8) });
    }
    nodes.push(leaves);
    for (var l = 1; l < DEPTH; l++){
      var prev = nodes[l-1], row = [];
      for (var j = 0; j < prev.length / 2; j++){
        var c1 = prev[j*2], c2 = prev[j*2+1];
        var n = { x:(c1.x+c2.x)/2, z:(c1.z+c2.z)/2, y:l*SEP, l:l, i:j, p:null,
                  h: relroHash(l * 977 + j + 5, 8) };
        c1.p = n; c2.p = n; row.push(n);
      }
      nodes.push(row);
    }
    path = []; var idx = LEAF;
    for (var k = 0; k < DEPTH; k++){ path.push(nodes[k][idx]); idx = idx >> 1; }
  }

  function resize(){
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    F = Math.max(W, H) * 0.78;
  }

  function progress(){
    var max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }

  function placeCamera(y){
    var lf = Math.max(0, Math.min(DEPTH - 1.001, y / SEP));
    var l = Math.floor(lf), t = lf - l;
    var a = path[l], b = path[Math.min(DEPTH - 1, l + 1)];
    var e = t * t * (3 - 2 * t);
    camX = a.x + (b.x - a.x) * e;
    camZ = a.z + (b.z - a.z) * e;
  }

  function draw(){
    ctx.clearRect(0, 0, W, H);
    var cxs = W / 2, cys = H * 0.52;
    var NEAR = 70, FAR = SEP * 7.5;
    var items = [];

    for (var l = 0; l < DEPTH; l++){
      for (var i = 0; i < nodes[l].length; i++){
        var n = nodes[l][i], d = n.y - camY;
        if (d < NEAR || d > FAR) continue;
        var s = F / d;
        items.push({
          n:n, d:d, s:s,
          sx: cxs + (n.x - camX) * s,
          sy: cys + (n.z - camZ) * s,
          r: Math.max(.6, (l === 0 ? 16 : 20 + l * 5) * s),
          fog: Math.max(0, 1 - d / FAR),
          on: path.indexOf(n) > -1
        });
      }
    }
    items.sort(function(a, b){ return b.d - a.d; });

    for (var k = 0; k < items.length; k++){
      var it = items[k], nd = it.n;
      if (!nd.p) continue;
      var pd = nd.p.y - camY;
      if (pd < NEAR) continue;
      var ps = F / pd;
      var lit = it.on && path.indexOf(nd.p) > -1;
      ctx.beginPath();
      ctx.moveTo(it.sx, it.sy);
      ctx.lineTo(cxs + (nd.p.x - camX) * ps, cys + (nd.p.z - camZ) * ps);
      ctx.strokeStyle = lit ? 'rgba(47,95,191,' + (.8 * it.fog + .2) + ')'
                            : 'rgba(118,134,154,' + (.42 * it.fog + .1) + ')';
      ctx.lineWidth = lit ? Math.max(1.2, 2.75 * it.s) : Math.max(.5, 1.2 * it.s);
      ctx.stroke();
    }

    for (var k2 = 0; k2 < items.length; k2++){
      var q = items[k2];
      ctx.beginPath();
      ctx.arc(q.sx, q.sy, q.r, 0, 6.2832);
      if (q.on){
        ctx.shadowColor = 'rgba(47,95,191,.45)';
        ctx.shadowBlur = Math.min(60, q.r * 2.4);
        ctx.fillStyle = 'rgba(47,95,191,' + (.45 * q.fog + .55) + ')';
      } else {
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(122,138,158,' + (.55 * q.fog + .15) + ')';
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // hashes, drawn only where a node is close enough to read
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    var cand = [];
    for (var k3 = 0; k3 < items.length; k3++){
      var m = items[k3];
      if (m.sx < -40 || m.sx > W - 20 || m.sy < 14 || m.sy > H - 14) continue;   // on screen only
      if (m.r < 2.6 || m.r > 170) continue;
      var fs = Math.max(8, Math.min(15, 46 * m.s));
      if (fs < 8.5) continue;
      cand.push({ m:m, fs:fs });
    }
    cand.sort(function(a, b){ return (b.m.on - a.m.on) || (b.m.r - a.m.r); });

    var placed = [], drawn = 0;
    for (var k4 = 0; k4 < cand.length && drawn < 16; k4++){
      var c = cand[k4], m2 = c.m;
      var tx = m2.sx + m2.r + Math.max(4, c.fs * .45), ty = m2.sy;
      var clash = false;
      for (var q = 0; q < placed.length; q++){
        if (Math.abs(placed[q][0] - tx) < 150 && Math.abs(placed[q][1] - ty) < 26){ clash = true; break; }
      }
      if (clash) continue;
      ctx.font = c.fs + 'px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillStyle = m2.on ? 'rgba(47,95,191,' + (.35 * m2.fog + .6) + ')'
                            : 'rgba(126,142,160,' + (.5 * m2.fog + .38) + ')';
      ctx.fillText(m2.n.h, tx, ty);
      placed.push([tx, ty]); drawn++;
    }
  }

  var raf = null;
  function loop(){
    targetY = START + progress() * (TOP - 250 - START);
    var delta = targetY - camY;
    camY += delta * 0.085;
    placeCamera(camY);
    draw();
    if (Math.abs(delta) < 0.6 || document.hidden){ raf = null; return; }
    raf = requestAnimationFrame(loop);
  }
  function kick(){ if (!raf && !document.hidden) raf = requestAnimationFrame(loop); }

  makeTree(); resize();

  if (reduce){
    camY = TOP * 0.42; placeCamera(camY); draw();
    window.addEventListener('scroll', function(){
      camY = START + progress() * (TOP - 250 - START);
      placeCamera(camY); draw();
    }, { passive:true });
  } else if (document.documentElement.getAttribute('data-bg') === 'still') {
    camY = TOP * 0.38; placeCamera(camY); draw();        // article pages: one quiet frame
  } else {
    camY = START; placeCamera(camY); draw(); kick();
    window.addEventListener('scroll', kick, { passive:true });
    document.addEventListener('visibilitychange', function(){
      if (document.hidden){ if (raf) cancelAnimationFrame(raf); raf = null; } else { kick(); }
    });
  }

  var rt;
  window.addEventListener('resize', function(){
    clearTimeout(rt);
    rt = setTimeout(function(){ resize(); placeCamera(camY); draw(); }, 150);
  });
})();
