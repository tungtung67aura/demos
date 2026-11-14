// v8 · Jefes nuevos: datos de presentación y efectos telegrafiados (ondas con huecos, líneas de lance,
// conos, fuego en el piso). Todo con pools fijos: no crea nada durante la partida.
import * as THREE from 'https://esm.sh/three@0.160.0';

// orden de aparición en la campaña (oleada → jefe) y textos de la tarjeta de presentación
export const JEFES_INFO = {
  anzuelo: { nombre: 'Don Anzuelo', epiteto: 'el de la Escollera', tip: 'Cuando marca la línea en el piso, salí de costado: si te engancha, te arrastra' },
  patovica: { nombre: 'El Patovica del Cordón', epiteto: 'portero del boliche', tip: 'Hacelo chocar contra un auto y pegale mientras está mareado' },
  garrafero: { nombre: 'El Garrafero', epiteto: 'reparto a domicilio', tip: 'Mirá el círculo rojo y salí. Cuando prende la carga de la espalda, tirale a las garrafas' },
  bengala: { nombre: 'El Bengala', epiteto: 'de la tribuna Amsterdam', tip: 'No pises el fuego. Cuando llama a la barra, cubrite la espalda' },
  lubolo: { nombre: 'El Lubolo Mayor', epiteto: 'primer tambor de la llamada', tip: 'Cada golpe del tambor larga una onda: metete en el hueco' },
  tablado: { nombre: 'Don Tablado', epiteto: 'director de murga', tip: 'Cuando abre los brazos, salí del cono. Si canta la retirada, viene el coro' },
  cerro: { nombre: 'El Zombi del Cerro', epiteto: 'bajó de la Fortaleza', tip: 'Las piedras marcan dónde caen. Si levanta la pata, alejate' }
};
export const ORDEN_JEFES = ['anzuelo', 'patovica', 'garrafero', 'bengala', 'lubolo', 'tablado', 'cerro'];

const aditivo = (color, op = 0.6) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -6 });

// anillo con huecos: el fragment descarta los ángulos libres (hasta 3 huecos)
function matOnda() {
  return new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(0xff5a20) }, op: { value: 1 }, huecos: { value: new THREE.Vector3(9, 9, 9) }, ancho: { value: 0.5 } },
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 color; uniform float op; uniform vec3 huecos; uniform float ancho; varying vec2 vP;
      float dif(float a, float b){ float d = abs(a - b); return min(d, 6.2831853 - d); }
      void main(){ float a = atan(vP.y, vP.x); if (a < 0.0) a += 6.2831853;
        float m = min(dif(a, huecos.x), min(dif(a, huecos.y), dif(a, huecos.z)));
        if (m < ancho) discard;
        float borde = smoothstep(ancho, ancho + 0.08, m);
        gl_FragColor = vec4(color * (1.2 + 0.6 * borde), op * borde); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
  });
}

export function crearJefesFx(scene) {
  // ondas del tambor (anillo de 1 m de radio, grosor fijo en metros: se rehace la escala en x/z)
  const ondas = [];
  for (let i = 0; i < 4; i++) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.94, 1, 72, 1).rotateX(-Math.PI / 2), matOnda());
    m.visible = false; m.frustumCulled = false; scene.add(m);
    ondas.push({ m, vivo: false, r: 0, v: 0, rMax: 0, x: 0, y: 0, z: 0, h: [9, 9, 9], dano: 0, pego: false, ancho: 0.5 });
  }
  // líneas en el piso (lance del anzuelo, embestida): plano de 1 m que se estira
  const lineas = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0, 0, -0.5), aditivo(0xff2a10, 0.5));
    m.visible = false; scene.add(m); lineas.push({ m, t: 0, tot: 1 });
  }
  // conos (sector) en el piso
  const conos = [], geoCono = {};
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(1, 24, Math.PI / 2 - 0.5, 1).rotateX(-Math.PI / 2), aditivo(0xffc030, 0.4));
    m.visible = false; scene.add(m); conos.push({ m, t: 0, tot: 1 });
  }
  // fuego en el piso (bengalas, garrafas): disco brillante que titila; las llamas las emite el juego
  const fuegos = [];
  const geoF = new THREE.CircleGeometry(1, 20).rotateX(-Math.PI / 2);
  for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(geoF, aditivo(0xff5a10, 0.45)); m.visible = false; scene.add(m);
    fuegos.push({ m, t: 0, x: 0, y: 0, z: 0, r: 1, dano: 0, eT: 0, deJugador: false });
  }
  // tanza del anzuelo: línea fina entre el jefe y el gancho
  const tanzaG = new THREE.BufferGeometry(); tanzaG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const tanza = new THREE.Line(tanzaG, new THREE.LineBasicMaterial({ color: 0xe8f0ff, transparent: true, opacity: 0.85 })); tanza.visible = false; tanza.frustumCulled = false; scene.add(tanza);
  const gancho = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 5, 10, Math.PI * 1.4), new THREE.MeshStandardMaterial({ color: 0xc8ccd4, metalness: 0.9, roughness: 0.3 }));
  gancho.visible = false; scene.add(gancho);

  const fx = {
    onda(x, y, z, huecos, vel, rMax, dano, ancho = 0.5, color = 0xff5a20) {
      const o = ondas.find(w => !w.vivo) || ondas[0];
      o.vivo = true; o.r = 0.6; o.v = vel; o.rMax = rMax; o.x = x; o.y = y; o.z = z; o.dano = dano; o.pego = false; o.ancho = ancho;
      o.h[0] = huecos[0] ?? 9; o.h[1] = huecos[1] ?? 9; o.h[2] = huecos[2] ?? 9;
      const u = o.m.material.uniforms; u.huecos.value.set(o.h[0], o.h[1], o.h[2]); u.ancho.value = ancho; u.color.value.setHex(color);
      o.m.position.set(x, y + 0.12, z); o.m.visible = true; return o;
    },
    linea(x, y, z, ang, largo, ancho, t, color = 0xff2a10) {
      const l = lineas.find(w => w.t <= 0) || lineas[0];
      l.t = l.tot = t; l.m.position.set(x, y + 0.1, z); l.m.rotation.y = ang; l.m.scale.set(ancho, 1, largo); l.m.material.color.setHex(color); l.m.visible = true; return l;
    },
    cono(x, y, z, ang, apertura, r, t) {
      const c = conos.find(w => w.t <= 0) || conos[0];
      c.t = c.tot = t; c.m.position.set(x, y + 0.11, z); c.m.rotation.y = ang; c.m.scale.set(r, 1, r);
      const k = apertura.toFixed(2); c.m.geometry = geoCono[k] || (geoCono[k] = new THREE.CircleGeometry(1, 24, Math.PI / 2 - apertura / 2, apertura).rotateX(-Math.PI / 2)); // una geometría por apertura (se cachea)
      c.m.visible = true; return c;
    },
    fuego(x, y, z, r, t, dano, deJugador = false) {
      let f = fuegos.find(w => w.t <= 0); if (!f) { f = fuegos[0]; for (const w of fuegos) if (w.t < f.t) f = w; }
      f.t = t; f.x = x; f.y = y; f.z = z; f.r = r; f.dano = dano; f.deJugador = deJugador; f.eT = 0;
      f.m.position.set(x, y + 0.07, z); f.m.scale.set(r, 1, r); f.m.visible = true; return f;
    },
    get fuegos() { return fuegos; },
    tanza(desde, hasta) {
      if (!desde) { tanza.visible = false; gancho.visible = false; return; }
      const a = tanzaG.attributes.position.array; a[0] = desde.x; a[1] = desde.y; a[2] = desde.z; a[3] = hasta.x; a[4] = hasta.y; a[5] = hasta.z;
      tanzaG.attributes.position.needsUpdate = true; tanza.visible = true; gancho.visible = true; gancho.position.copy(hasta); gancho.rotation.y += 0.3;
    },
    // avanza todo. golpeOnda(o) se llama cuando una onda alcanza al jugador fuera de un hueco.
    // llama(x,y,z) para que el juego emita partículas de fuego; enFuego(f) cada 0,25 s por foco
    sim(dt, jx, jz, golpeOnda, llama, enFuego) {
      for (let _o = 0; _o < ondas.length; _o++) { const o = ondas[_o]; {
        if (!o.vivo) continue;
        const r0 = o.r; o.r += o.v * dt;
        const k = o.r / o.rMax; o.m.scale.set(o.r, 1, o.r); o.m.material.uniforms.op.value = Math.min(1, (1 - k) * 2.2);
        if (!o.pego) {
          const dx = jx - o.x, dz = jz - o.z, d = Math.hypot(dx, dz);
          if (d >= r0 - 0.35 && d <= o.r + 0.35) {
            let a = Math.atan2(dz, dx); if (a < 0) a += Math.PI * 2;
            let m = 9; for (const h of o.h) { if (h > 7) continue; let q = Math.abs(a - h); q = Math.min(q, Math.PI * 2 - q); m = Math.min(m, q); }
            o.pego = true; // pase lo que pase, esta onda ya lo cruzó una vez
            if (m >= o.ancho + 0.3 / Math.max(1, d)) golpeOnda(o, dx / (d || 1), dz / (d || 1)); // en el hueco (con ~30 cm de gracia) no pega
          }
        }
        if (o.r >= o.rMax) { o.vivo = false; o.m.visible = false; }
      } }
      for (let _l = 0; _l < lineas.length; _l++) { const l = lineas[_l]; if (l.t > 0) { l.t -= dt; l.m.material.opacity = 0.25 + 0.35 * Math.abs(Math.sin(l.t * 18)); if (l.t <= 0) l.m.visible = false; } }
      for (let _c = 0; _c < conos.length; _c++) { const c = conos[_c]; if (c.t > 0) { c.t -= dt; c.m.material.opacity = 0.18 + 0.3 * (1 - c.t / c.tot); if (c.t <= 0) c.m.visible = false; } }
      for (let _f = 0; _f < fuegos.length; _f++) { const f = fuegos[_f]; {
        if (f.t <= 0) continue;
        f.t -= dt; f.m.material.opacity = Math.min(1, f.t) * (0.32 + 0.12 * Math.sin(f.t * 23 + f.x));
        if ((f.eT -= dt) <= 0) { f.eT = 0.25; const a = Math.random() * 6.28, rr = Math.random() * f.r * 0.8; llama(f.x + Math.cos(a) * rr, f.y + 0.1, f.z + Math.sin(a) * rr); if (Math.random() < 0.6) llama(f.x + Math.cos(a + 3) * rr * 0.6, f.y + 0.1, f.z + Math.sin(a + 3) * rr * 0.6); enFuego(f); }
        if (f.t <= 0) f.m.visible = false;
      } }
    },
    limpiar() { for (const o of ondas) { o.vivo = false; o.m.visible = false; } for (const l of lineas) { l.t = 0; l.m.visible = false; } for (const c of conos) { c.t = 0; c.m.visible = false; } for (const f of fuegos) { f.t = 0; f.m.visible = false; } tanza.visible = false; gancho.visible = false; },
    get activos() { let n = 0; for (const o of ondas) n += o.vivo; for (const f of fuegos) n += f.t > 0; return n; }
  };
  return fx;
}
