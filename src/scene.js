import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const STORY_GAP = 12; // khoảng cách theo trục z giữa các khung ảnh
const PHOTO_W = 1.9;
const PHOTO_H = 2.375;

export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

const smooth = (t) => t * t * (3 - 2 * t);
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Cảnh 3D chạy nền: trái tim kính, khung ảnh câu chuyện, đôi nhẫn và cánh hoa rơi.
 * Camera bay dọc trục z theo `stage` (tính từ vị trí cuộn của các section [data-stage]).
 */
export function createScene({ canvas, storyPhotos, coverPhoto, manager }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  // Sương mù che các khung ảnh ở xa để mỗi lúc chỉ thấy một cảnh.
  scene.fog = new THREE.Fog(0xf9f1ec, 10.5, 19);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  scene.add(new THREE.AmbientLight(0xfff1ea, 0.6));
  const sun = new THREE.DirectionalLight(0xffe2d0, 1.6);
  sun.position.set(3, 5, 6);
  scene.add(sun);

  const loader = new THREE.TextureLoader(manager);

  // ---------- Trái tim ----------
  const heart = new THREE.Mesh(makeHeartGeometry(), new THREE.MeshPhysicalMaterial({
    color: 0xf3a9b8,
    roughness: 0.22,
    transmission: 0.55,
    thickness: 1.2,
    ior: 1.4,
    attenuationColor: new THREE.Color(0xd9566f),
    attenuationDistance: 1.6,
    clearcoat: 1,
    clearcoatRoughness: 0.2,
    iridescence: 0.25,
  }));
  scene.add(heart);

  // ---------- Khung ảnh câu chuyện ----------
  const polaroids = storyPhotos.map((src, i) => {
    const p = makePolaroid(loader, src);
    p.position.z = -STORY_GAP * (i + 1);
    p.userData.phase = i * 1.7;
    scene.add(p);
    return p;
  });

  // ---------- Đôi nhẫn + ảnh cưới ----------
  const unionZ = -STORY_GAP * (storyPhotos.length + 1);
  const cover = makePolaroid(loader, coverPhoto);
  cover.scale.setScalar(1.35);
  cover.position.set(0, 0.35, unionZ);
  cover.userData.phase = 0.4;
  scene.add(cover);

  const rings = new THREE.Group();
  rings.position.set(0, -0.15, unionZ + 3.2);
  const ringA = makeRing(0xe8c37c, true);
  const ringB = makeRing(0xeab3a2, false);
  rings.add(ringA, ringB);
  scene.add(rings);
  // Tư thế cuối: B đi xuyên qua lòng A nên hai nhẫn lồng vào nhau.
  const ringFinal = {
    a: { x: -0.25, y: -0.2, ry: 0 },
    b: { x: 0.15, y: 0.2, ry: Math.PI / 2 },
  };

  // ---------- Cánh hoa ----------
  const petalCount = window.innerWidth < 700 ? 70 : 150;
  const petals = new THREE.InstancedMesh(
    makePetalGeometry(),
    new THREE.MeshStandardMaterial({ color: 0xf5bcc8, roughness: 0.55, side: THREE.DoubleSide }),
    petalCount,
  );
  const petalData = Array.from({ length: petalCount }, () => spawnPetal({}, 0, true));
  scene.add(petals);
  const dummy = new THREE.Object3D();

  function spawnPetal(p, camZ, anywhere) {
    p.x = (Math.random() - 0.5) * 12;
    p.y = anywhere ? (Math.random() - 0.5) * 9 : 5 + Math.random() * 2;
    p.z = camZ - 2 - Math.random() * 18;
    p.rx = Math.random() * Math.PI;
    p.ry = Math.random() * Math.PI;
    p.vr = 0.4 + Math.random() * 0.8;
    p.vy = 0.25 + Math.random() * 0.35;
    p.sway = Math.random() * Math.PI * 2;
    p.s = 0.7 + Math.random() * 0.6;
    return p;
  }

  // ---------- Kịch bản camera theo stage ----------
  // stage 0..1: hero, 1..N+1: từng chương, N+1..N+2: đôi nhẫn.
  let keys = [];
  let narrow = false;

  function layout() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    narrow = camera.aspect < 0.85;

    polaroids.forEach((p, i) => {
      // Ảnh và chữ nằm hai bên; trên điện thoại ảnh ở trên, chữ ở dưới.
      p.position.x = narrow ? 0 : (i % 2 === 0 ? 1.55 : -1.55);
      p.position.y = narrow ? 0.85 : 0.05;
      p.scale.setScalar(narrow ? 0.72 : 1);
    });
    cover.position.y = narrow ? 0.6 : 0.35;
    cover.scale.setScalar(narrow ? 1.05 : 1.35);
    heart.scale.setScalar(narrow ? 0.7 : 0.85);

    // Lùi camera đủ xa để khung ảnh chiếm ~70% chiều cao màn hình.
    const frameH = (PHOTO_H + 0.65) * (narrow ? 0.72 : 1);
    const viewH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const camDist = Math.max(narrow ? 7.5 : 6, frameH / 0.7 / viewH);
    keys = [
      { s: 0, x: 0, y: 0, z: narrow ? 12 : 10 },
      { s: 0.45, x: 0, y: 0, z: narrow ? 12 : 10 },
      ...polaroids.map((p, i) => ({
        s: i + 1.5,
        x: p.position.x * 0.3,
        y: p.position.y * 0.5,
        z: p.position.z + camDist,
      })),
      { s: polaroids.length + 1.5, x: 0, y: 0.1, z: unionZ + (narrow ? 10 : 8) },
      { s: polaroids.length + 2, x: 0, y: 0.1, z: unionZ + (narrow ? 10 : 8) },
    ];
  }

  function cameraAt(stage) {
    let i = 0;
    while (i < keys.length - 2 && stage > keys[i + 1].s) i++;
    const a = keys[i];
    const b = keys[i + 1];
    const t = smooth(clamp01((stage - a.s) / (b.s - a.s)));
    return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t) };
  }

  // ---------- Vòng lặp ----------
  const clock = new THREE.Clock();
  let target = 0;
  let current = 0;
  let running = true;
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };

  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX / window.innerWidth - 0.5;
    pointer.y = e.clientY / window.innerHeight - 0.5;
  });
  window.addEventListener('resize', layout);
  layout();

  function tick() {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    current += (target - current) * Math.min(1, dt * 4);
    pointer.sx += (pointer.x - pointer.sx) * dt * 3;
    pointer.sy += (pointer.y - pointer.sy) * dt * 3;

    const cam = cameraAt(current);
    camera.position.set(cam.x + pointer.sx * 0.4, cam.y - pointer.sy * 0.3, cam.z);
    camera.lookAt(cam.x * 0.6, cam.y * 0.8, cam.z - 6);

    heart.rotation.y = t * 0.5 + current * 2;
    heart.rotation.x = Math.sin(t * 0.7) * 0.08;
    heart.position.y = Math.sin(t * 1.2) * 0.08 + (narrow ? 1.3 : 1.1);

    for (const p of [...polaroids, cover]) {
      // Ẩn khung ở ngoài tầm sương mù, nếu không sẽ lộ thành ô mờ lệch màu nền.
      p.visible = camera.position.z - p.position.z < scene.fog.far;
      p.rotation.z = Math.sin(t * 0.6 + p.userData.phase) * 0.05;
      p.rotation.y = Math.sin(t * 0.4 + p.userData.phase) * 0.08 - p.position.x * 0.08;
    }

    // Đôi nhẫn bay vào và lồng vào nhau.
    const u = smooth(clamp01((current - (polaroids.length + 1.05)) / 0.5));
    ringA.position.set(lerp(-3.5, ringFinal.a.x, u), lerp(1.8, ringFinal.a.y, u), lerp(-1.5, 0, u));
    ringB.position.set(lerp(3.5, ringFinal.b.x, u), lerp(-1.8, ringFinal.b.y, u), lerp(-1.5, 0, u));
    ringA.rotation.set(lerp(1.2, 0, u), lerp(-2, ringFinal.a.ry, u), 0);
    ringB.rotation.set(lerp(-1, 0, u), lerp(2.5, ringFinal.b.ry, u), 0);
    rings.rotation.y = Math.sin(t * 0.5) * 0.6;
    rings.rotation.x = Math.sin(t * 0.35) * 0.15;
    rings.scale.setScalar(narrow ? 0.85 : 1);

    for (let i = 0; i < petalCount; i++) {
      const p = petalData[i];
      p.y -= p.vy * dt;
      p.x += Math.sin(t * 0.8 + p.sway) * 0.004;
      p.rx += p.vr * dt;
      p.ry += p.vr * 0.7 * dt;
      if (p.y < -5 || p.z > camera.position.z + 1 || p.z < camera.position.z - 22) {
        spawnPetal(p, camera.position.z, p.z > camera.position.z + 1 || p.z < camera.position.z - 22);
      }
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rx, p.ry, 0);
      dummy.scale.setScalar(p.s);
      dummy.updateMatrix();
      petals.setMatrixAt(i, dummy.matrix);
    }
    petals.instanceMatrix.needsUpdate = true;

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  return {
    setStage(s) {
      target = s;
    },
    setRunning(on) {
      if (on === running) return;
      running = on;
      if (on) {
        clock.getDelta();
        requestAnimationFrame(tick);
      }
    },
  };
}

// ============================================================
//  Hình khối
// ============================================================

function makeHeartGeometry() {
  const shape = new THREE.Shape();
  const steps = 120;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    if (i === 0) shape.moveTo(x / 17, y / 17);
    else shape.lineTo(x / 17, y / 17);
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.35,
    bevelEnabled: true,
    bevelThickness: 0.28,
    bevelSize: 0.22,
    bevelSegments: 10,
    curveSegments: 64,
  });
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

function makePolaroid(loader, src) {
  const group = new THREE.Group();
  const frame = new THREE.Mesh(
    roundedRectGeometry(PHOTO_W + 0.3, PHOTO_H + 0.65, 0.16),
    new THREE.MeshStandardMaterial({ color: 0xfffbf7, roughness: 0.85, side: THREE.DoubleSide }),
  );
  frame.position.y = -0.17;
  group.add(frame);

  const mat = new THREE.MeshBasicMaterial({ color: 0xead7d3, toneMapped: false });
  const photo = new THREE.Mesh(roundedRectGeometry(PHOTO_W, PHOTO_H, 0.1), mat);
  photo.position.z = 0.021;
  group.add(photo);

  loader.load(src, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    coverFit(tex, PHOTO_W / PHOTO_H);
    mat.map = tex;
    mat.color.set(0xffffff);
    mat.needsUpdate = true;
  });
  return group;
}

// Hình chữ nhật bo góc, UV trải 0..1 như PlaneGeometry để gắn ảnh.
function roundedRectGeometry(w, h, r) {
  const x = -w / 2;
  const y = -h / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  const geo = new THREE.ShapeGeometry(shape, 8);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - x) / w, (pos.getY(i) - y) / h);
  return geo;
}

// Cắt ảnh kiểu "object-fit: cover" để ảnh ngang hay dọc đều không bị méo.
function coverFit(tex, aspect) {
  const img = tex.image;
  const imgAspect = img.width / img.height;
  if (imgAspect > aspect) {
    tex.repeat.set(aspect / imgAspect, 1);
    tex.offset.set((1 - tex.repeat.x) / 2, 0);
  } else {
    tex.repeat.set(1, imgAspect / aspect);
    tex.offset.set(0, (1 - tex.repeat.y) / 2);
  }
}

function makeRing(color, withDiamond) {
  const group = new THREE.Group();
  group.add(new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.075, 48, 128),
    new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness: 0.16, clearcoat: 0.6 }),
  ));
  if (withDiamond) {
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.15, 0),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0,
        transmission: 1,
        thickness: 0.4,
        ior: 2.4,
        dispersion: 4,
        iridescence: 0.4,
      }),
    );
    gem.scale.set(1, 1.15, 1);
    gem.position.y = 0.55 + 0.075 + 0.14;
    group.add(gem);
  }
  return group;
}

function makePetalGeometry() {
  const geo = new THREE.PlaneGeometry(0.16, 0.22, 4, 4);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    // Thu hẹp phần gốc và uốn cong để giống cánh hoa.
    const taper = 0.35 + 0.65 * ((y + 0.11) / 0.22);
    pos.setX(i, x * taper);
    pos.setZ(i, x * x * 6 + y * y * 1.5);
  }
  geo.computeVertexNormals();
  return geo;
}
