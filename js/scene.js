/* 3D 인장(印章). 평소에는 화면 밖(위)에 있다가, 신청 서식이 열리면 내려와 종이에 찍힌다.
   cine.js 가 window.__sealState 를 스크롤에 맞춰 바꾸고, 여기서는 그 값을 부드럽게 따라간다. */
(() => {
  const canvas = document.getElementById('scene');
  if (!canvas || !window.THREE) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { canvas.remove(); return; }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { canvas.remove(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  /* 조명: 왼쪽 위 등불(키), 오른쪽 아래 약한 반사(필), 뒤쪽 차가운 림 */
  scene.add(new THREE.AmbientLight(0xffe2bd, 0.18));
  const key = new THREE.SpotLight(0xffd39a, 3.0, 60, Math.PI / 5, 0.65, 1.1);
  key.position.set(-5, 8, 7); scene.add(key);
  const fill = new THREE.PointLight(0xffc98a, 0.45, 30); fill.position.set(4, -3, 5); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xbfcfff, 0.7); rim.position.set(6, 2, -6); scene.add(rim);

  /* 환경맵: 어두운 방 + 왼쪽 위 따뜻한 창(등불) 한 줄. 돌의 유광 반사에만 쓰인다 */
  (function makeEnv() {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256;
    const g = c.getContext('2d');
    const base = g.createLinearGradient(0, 0, 0, 256);
    base.addColorStop(0, '#2a2420'); base.addColorStop(0.5, '#0d0b0a'); base.addColorStop(1, '#050404');
    g.fillStyle = base; g.fillRect(0, 0, 512, 256);
    const lamp = g.createRadialGradient(150, 70, 4, 150, 70, 120);
    lamp.addColorStop(0, 'rgba(255,224,170,1)'); lamp.addColorStop(0.25, 'rgba(255,200,130,.7)'); lamp.addColorStop(1, 'rgba(255,190,120,0)');
    g.fillStyle = lamp; g.fillRect(0, 0, 512, 256);
    const cool = g.createRadialGradient(420, 120, 4, 420, 120, 90);
    cool.addColorStop(0, 'rgba(190,205,255,.55)'); cool.addColorStop(1, 'rgba(190,205,255,0)');
    g.fillStyle = cool; g.fillRect(0, 0, 512, 256);
    const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding; tex.mapping = THREE.EquirectangularReflectionMapping;
    const rt = new THREE.WebGLCubeRenderTarget(256).fromEquirectangularTexture(renderer, tex);
    scene.environment = rt.texture;
  })();

  /* 돌 결: 노이즈 범프 */
  const bump = (function makeBump() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'); const img = g.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) { const v = 96 + Math.random() * 64; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 4); return t;
  })();

  /* 2026-10-15 대표님 결정: 돌 인장과 붉은 인주 대신 황동 엠보서와 금박 자국 */
  const faceTex = new THREE.TextureLoader().load('assets/seal-gold.webp', t => { t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; });
  const brass = new THREE.MeshPhysicalMaterial({
    color: 0xb48a4a, roughness: 0.26, metalness: 1.0, clearcoat: 0.6, clearcoatRoughness: 0.18,
    envMapIntensity: 1.25, bumpMap: bump, bumpScale: 0.004
  });
  const face = new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.35, metalness: 0.9, envMapIntensity: 1.1 });
  const W = 1.5, H = 3.0;
  // CylinderGeometry 재질 순서: 옆면, 윗면, 바닥 → 바닥이 금박 문양 면
  const seal = new THREE.Mesh(new THREE.CylinderGeometry(W * 0.5, W * 0.56, H * 0.42, 64), [brass, brass, face]);
  seal.position.y = -H * 0.29;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(W * 0.16, W * 0.22, H * 0.42, 48), brass);
  neck.position.y = H * 0.12; seal.add(neck);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(W * 0.3, 48, 32), new THREE.MeshPhysicalMaterial({ color: 0x1a1512, roughness: 0.22, clearcoat: 1, envMapIntensity: 1 }));
  cap.position.y = H * 0.42; seal.add(cap);
  const group = new THREE.Group(); group.add(seal); scene.add(group);

  /* 평소 위치는 화면 위 바깥. mix 가 1로 가면 종이의 도장 자리로 내려온다 */
  const state = window.__sealState = { nx: 0.3, ny: 1.6, s: 0.9, rx: -1.2, ry: 0.3, rz: 0.06, mix: 0, press: 0 };
  const cur = { x: 0, y: 6, s: 0.9, rx: -1.2, ry: 0.3, rz: 0.06 };
  let vw = 1, vh = 1, halfW = 1, halfH = 1;
  function resize() {
    vw = window.innerWidth; vh = window.innerHeight;
    renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh; camera.updateProjectionMatrix();
    halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    halfW = halfH * camera.aspect;
  }
  window.addEventListener('resize', resize); resize();

  const target = document.querySelector('.stamp-target');
  const shadow = document.getElementById('sealShadow');
  const lerp = (a, b, t) => a + (b - a) * t;
  const t0 = performance.now();
  let visible = true;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = (now - t0) / 1000;
    let tx = state.nx * halfW, ty = state.ny * halfH, ts = state.s, trx = state.rx, tryy = state.ry, trz = state.rz;
    if (state.mix > 0 && target) {
      const r = target.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const wx = ((cx / vw) * 2 - 1) * halfW, wy = -((cy / vh) * 2 - 1) * halfH;
      const ws = (r.width * (2 * halfW / vw)) / W * 1.04;
      tx = lerp(tx, wx, state.mix); ty = lerp(ty, wy, state.mix); ts = lerp(ts, ws, state.mix);
      trx = lerp(trx, -Math.PI / 2, state.mix); tryy = lerp(tryy, 0, state.mix); trz = lerp(trz, -0.122, state.mix);
    }
    const k = 0.09;
    cur.x = lerp(cur.x, tx, k); cur.y = lerp(cur.y, ty, k); cur.s = lerp(cur.s, ts, k);
    cur.rx = lerp(cur.rx, trx, k); cur.ry = lerp(cur.ry, tryy, k); cur.rz = lerp(cur.rz, trz, k);
    const idle = 1 - state.mix;
    const lift = state.mix * (1 - state.press);
    group.position.set(cur.x + Math.sin(t * 0.7) * 0.04 * idle, cur.y + Math.sin(t * 0.9) * 0.07 * idle, lift * 1.5);
    group.scale.setScalar(cur.s);
    group.rotation.set(cur.rx + Math.sin(t * 0.5) * 0.03 * idle, cur.ry + Math.sin(t * 0.4) * 0.05 * idle, cur.rz);
    if (shadow) {
      // 떠 있을수록 그림자는 넓고 옅게, 빛 반대쪽(오른쪽 아래)으로 밀린다
      shadow.style.opacity = (state.mix * (0.6 - lift * 0.42)).toFixed(3);
      shadow.style.transform = `translate(${(lift * 16).toFixed(1)}px, ${(lift * 20).toFixed(1)}px) scale(${(1 + lift * 0.45).toFixed(3)})`;
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
})();
