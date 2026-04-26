// scene-aaa.jsx — Cinematic AAA-style stylized fantasy open world
// 1500m+ scale, 5-layer mountains, hero tree + distant tower, postprocessing, wildlife
const { useEffect: useEffectAAA, useRef: useRefAAA, useState: useStateAAA } = React;

function SceneAAA({ tweaks, active }) {
  const mountRef = useRefAAA(null);
  const [showHint, setShowHint] = useStateAAA(true);
  const [altitude, setAltitude] = useStateAAA(0);

  useEffectAAA(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const w = mount.clientWidth, h = mount.clientHeight;

    const tod = tweaks.timeOfDay || 'afternoon';
    const PALETTES = {
      dawn: {
        sky:[0xeec1a0, 0xfaeacb, 0xb88da0],
        hor:0xf5b388, fog:0xe6cdb6,
        grass:[0x8caa56, 0xb8d070], grassEdge:0xfff0c8,
        ground:0x5e4d36, rock:0x6e6258, snow:0xfff8ee,
        sun:0xffd9a8, sunPos:[180, 75, -200], sunInt:1.4,
        amb:0.55, hemiSky:0xfacb9f, hemiGr:0x6a5b40,
        expo:1.05, bloom:0.55, fogD:0.0028,
      },
      noon: {
        sky:[0x3e7fcf, 0xa2cce8, 0xd6e9ee],
        hor:0xe2eef0, fog:0xc8dceb,
        grass:[0x6ea83a, 0xa3cd5e], grassEdge:0xfff7c8,
        ground:0x6d5a3a, rock:0x807468, snow:0xffffff,
        sun:0xfffce8, sunPos:[60, 240, -90], sunInt:2.0,
        amb:0.7, hemiSky:0x9ec8e4, hemiGr:0x6e603e,
        expo:1.10, bloom:0.35, fogD:0.0022,
      },
      // ★ HERO PALETTE — Late afternoon, golden warm sun
      afternoon: {
        sky:[0x4a86c8, 0xbcd6e6, 0xf3d4a8],
        hor:0xfacf9a, fog:0xd8c7a8,
        grass:[0x6ea336, 0xb6d260], grassEdge:0xfff4c0,
        ground:0x5e4a2c, rock:0x7a6a58, snow:0xfff6e0,
        sun:0xffd28a, sunPos:[260, 110, -80], sunInt:1.85,
        amb:0.62, hemiSky:0xc0d8ec, hemiGr:0x6a583a,
        expo:1.08, bloom:0.55, fogD:0.0024,
      },
      dusk: {
        sky:[0x402a5a, 0xc46d68, 0xf2a070],
        hor:0xf2a070, fog:0xc88a78,
        grass:[0x6a7a3c, 0x95a04c], grassEdge:0xffc88a,
        ground:0x4a3a26, rock:0x5a4a48, snow:0xf2dcc8,
        sun:0xff9560, sunPos:[300, 28, -60], sunInt:1.6,
        amb:0.5, hemiSky:0x8a5a78, hemiGr:0x4a3624,
        expo:0.96, bloom:0.7, fogD:0.0035,
      },
      night: {
        sky:[0x080d1e, 0x1a2244, 0x2a3460],
        hor:0x303a5c, fog:0x18203a,
        grass:[0x2a3624, 0x3e4a32], grassEdge:0x90a8c4,
        ground:0x20191a, rock:0x2a2628, snow:0xc8d2e0,
        sun:0xb0c2e8, sunPos:[120, 180, -120], sunInt:0.5,
        amb:0.4, hemiSky:0x2a3458, hemiGr:0x18191e,
        expo:0.7, bloom:0.85, fogD:0.0030,
      },
    };
    const palette = PALETTES[tod];

    // ────────── Renderer
    const dpr = tweaks.fpsPreset === 'high' ? Math.min(window.devicePixelRatio, 2)
               : tweaks.fpsPreset === 'low' ? 0.7 : 1;
    const renderer = new THREE.WebGLRenderer({
      antialias: tweaks.fpsPreset !== 'low',
      powerPreference:'high-performance',
      stencil:false,
    });
    renderer.setPixelRatio(dpr);
    renderer.setSize(w,h);
    if (THREE.SRGBColorSpace !== undefined) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else if (THREE.sRGBEncoding !== undefined) {
      renderer.outputEncoding = THREE.sRGBEncoding;
    }
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = palette.expo;
    renderer.shadowMap.enabled = tweaks.fpsPreset !== 'low';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // ────────── Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(palette.sky[1]);
    const fogD = palette.fogD * (tweaks.fogDensity ?? 1);
    scene.fog = new THREE.FogExp2(palette.fog, fogD);
    const camera = new THREE.PerspectiveCamera(58, w/h, 0.5, 4500);

    // ────────── Lighting
    scene.add(new THREE.HemisphereLight(palette.hemiSky, palette.hemiGr, palette.amb));
    const sun = new THREE.DirectionalLight(palette.sun, palette.sunInt);
    const sunDirN = new THREE.Vector3(...palette.sunPos).normalize();
    const sunOffset = new THREE.Vector3().copy(sunDirN).multiplyScalar(180);
    sun.castShadow = tweaks.fpsPreset !== 'low';
    const SHADOW_SIZE = tweaks.fpsPreset === 'high' ? 2048 : 1024;
    sun.shadow.mapSize.set(SHADOW_SIZE, SHADOW_SIZE);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far  = 280;
    sun.shadow.camera.left = -80; sun.shadow.camera.right = 80;
    sun.shadow.camera.top  =  80; sun.shadow.camera.bottom = -80;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.05;
    scene.add(sun);
    scene.add(sun.target);
    const fill = new THREE.DirectionalLight(palette.hemiSky, 0.25);
    fill.position.copy(sunDirN).clone().multiplyScalar(-150);
    fill.position.y = 80;
    scene.add(fill);

    // ────────── Sky
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite:false, fog:false,
      uniforms: {
        topColor:{value: new THREE.Color(palette.sky[0])},
        midColor:{value: new THREE.Color(palette.sky[1])},
        botColor:{value: new THREE.Color(palette.sky[2])},
        horColor:{value: new THREE.Color(palette.hor)},
        sunDir:{value: sunDirN.clone()},
        sunColor:{value: new THREE.Color(palette.sun)},
        sunIntensity:{value: tod==='night' ? 0.35 : 1.0},
      },
      vertexShader:`varying vec3 vW;
        void main(){ vec4 wp = modelMatrix*vec4(position,1.0); vW=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }`,
      fragmentShader:`
        uniform vec3 topColor, midColor, botColor, horColor, sunColor, sunDir;
        uniform float sunIntensity;
        varying vec3 vW;
        void main(){
          vec3 d = normalize(vW);
          float h = clamp(d.y, -0.2, 1.0);
          vec3 c;
          if (h < 0.12)      c = mix(horColor, botColor, smoothstep(-0.05, 0.12, h));
          else if (h < 0.55) c = mix(botColor, midColor, smoothstep(0.12, 0.55, h));
          else               c = mix(midColor, topColor, smoothstep(0.55, 1.0, h));
          vec3 sd = normalize(sunDir);
          float sa = max(dot(d, sd), 0.0);
          c += sunColor * pow(sa,    6.0) * 0.45 * sunIntensity;
          c += sunColor * pow(sa,   96.0) * 1.6  * sunIntensity;
          c += sunColor * pow(sa, 2200.0) * 4.0  * sunIntensity;
          float horizF = 1.0 - smoothstep(0.0, 0.35, h);
          c = mix(c, c + vec3(0.02,0.04,0.08)*horizF, 0.4*horizF);
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(2200, 64, 32), skyMat));

    // ────────── Noise
    const hash = (x,z) => { const s = Math.sin(x*127.1 + z*311.7) * 43758.5453; return s - Math.floor(s); };
    const valueNoise = (x,z) => {
      const xi=Math.floor(x), zi=Math.floor(z); const xf=x-xi, zf=z-zi;
      const a=hash(xi,zi), b=hash(xi+1,zi), c=hash(xi,zi+1), d=hash(xi+1,zi+1);
      const u=xf*xf*(3-2*xf), v=zf*zf*(3-2*zf);
      return a*(1-u)*(1-v) + b*u*(1-v) + c*(1-u)*v + d*u*v;
    };
    const fbm = (x,z, oct=5) => {
      let v=0,a=1,f=1,n=0;
      for (let i=0;i<oct;i++){ v += a*valueNoise(x*f,z*f); n+=a; a*=0.5; f*=2; }
      return v/n;
    };

    // ────────── World
    const WORLD = 1600;
    const TSEG  = tweaks.fpsPreset === 'high' ? 280 : tweaks.fpsPreset === 'low' ? 140 : 200;
    const HERO_X = 38, HERO_Z = -22;
    const TOWER_X = -460, TOWER_Z = -780;

    const heightFn = (x,z) => {
      const big   = (fbm(x*0.0015, z*0.0015, 4) - 0.5) * 80;
      const mid   = (fbm(x*0.006,  z*0.006,  4) - 0.5) * 18;
      const small = (fbm(x*0.025,  z*0.025,  3) - 0.5) * 3.0;
      const dist  = Math.hypot(x, z);
      // Gentle valley — only 4m bowl, not 12m
      const bowl  = -Math.exp(-(dist*dist)/(420*420)) * 4;
      const rim   = Math.max(0, dist-580) * 0.32 * (0.6 + fbm(x*0.0018, z*0.0018, 4));
      return big + mid + small + bowl + rim;
    };

    // ────────── Terrain
    const terrGeo = new THREE.PlaneGeometry(WORLD, WORLD, TSEG, TSEG);
    terrGeo.rotateX(-Math.PI/2);
    const tpos = terrGeo.attributes.position;
    const tcol = new Float32Array(tpos.count*3);
    const cGrassLow  = new THREE.Color(palette.grass[0]);
    const cGrassHigh = new THREE.Color(palette.grass[1]);
    const cRock      = new THREE.Color(palette.rock);
    const cSnow      = new THREE.Color(palette.snow);
    const cDirt      = new THREE.Color(palette.ground);
    for (let i=0; i<tpos.count; i++){
      const x = tpos.getX(i), z = tpos.getZ(i);
      const y = heightFn(x,z);
      tpos.setY(i, y);
      const gMix = THREE.MathUtils.clamp(fbm(x*0.012, z*0.012, 3), 0, 1);
      let col = cGrassLow.clone().lerp(cGrassHigh, gMix);
      const tint = (fbm(x*0.04, z*0.04, 2) - 0.5) * 0.08;
      col.r = THREE.MathUtils.clamp(col.r + tint, 0, 1);
      col.g = THREE.MathUtils.clamp(col.g + tint*0.6, 0, 1);
      if (y > 35) col.lerp(cRock, THREE.MathUtils.clamp((y-35)/12, 0, 1));
      if (y > 65) col.lerp(cSnow, THREE.MathUtils.clamp((y-65)/15, 0, 1));
      // Dirt only in *very* deep depressions (essentially never visible from start)
      if (y < -28) col.lerp(cDirt, THREE.MathUtils.clamp((-28-y)/4, 0, 1));
      tcol[i*3]=col.r; tcol[i*3+1]=col.g; tcol[i*3+2]=col.b;
    }
    terrGeo.setAttribute('color', new THREE.BufferAttribute(tcol, 3));
    terrGeo.computeVertexNormals();
    const terrMat = new THREE.MeshStandardMaterial({ vertexColors:true, roughness:0.95, metalness:0.0 });
    const terrain = new THREE.Mesh(terrGeo, terrMat);
    terrain.receiveShadow = true;
    scene.add(terrain);

    // ────────── 5-layer distant mountain rings (aerial perspective via fog tint)
    const buildMountainLayer = (radius, peak, segments, freq, baseColor, tintColor, opacity, yOff) => {
      const g = new THREE.PlaneGeometry(radius*2, radius*2, segments, segments);
      g.rotateX(-Math.PI/2);
      const p = g.attributes.position;
      const colors = new Float32Array(p.count*3);
      for (let i=0;i<p.count;i++){
        const x=p.getX(i), z=p.getZ(i);
        const r=Math.hypot(x,z);
        let y = -10;
        if (r > radius*0.55){
          const t = (r - radius*0.55) / (radius*0.45);
          y = Math.pow(t, 1.4) * peak * (0.5 + fbm(x*freq, z*freq, 4));
        }
        p.setY(i, y);
        const tt = THREE.MathUtils.clamp(y/peak, 0, 1);
        const c = new THREE.Color(baseColor).lerp(new THREE.Color(tintColor), tt);
        colors[i*3]=c.r; colors[i*3+1]=c.g; colors[i*3+2]=c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      g.computeVertexNormals();
      const m = new THREE.MeshStandardMaterial({
        vertexColors:true, roughness:1.0, metalness:0.0,
        transparent: opacity<1, opacity, fog:true,
      });
      const mesh = new THREE.Mesh(g, m);
      mesh.position.y = yOff;
      mesh.renderOrder = -2;
      return { mesh, geom:g, mat:m };
    };

    // 5 layers — each progressively further, taller, more atmospherically tinted
    const M = [
      buildMountainLayer( 900,  120, 90,  0.0030, palette.rock, palette.snow, 1.0,  -25),
      buildMountainLayer(1300,  220, 80,  0.0022, 0x6e7080,    palette.snow, 0.95, -40),
      buildMountainLayer(1700,  320, 70,  0.0016, 0x8a96a8,    0xeaf0f6,     0.85, -60),
      buildMountainLayer(2100,  390, 60,  0.0012, 0xa6b4c2,    0xf2f5f8,     0.7,  -80),
      buildMountainLayer(2500,  430, 50,  0.0009, 0xbcc8d4,    0xf8f8f8,     0.5, -100),
    ];
    M.forEach(L => scene.add(L.mesh));

    // ────────── Find start position on a high-ish vantage point
    let startX = 0, startZ = 0, startY = -999;
    for (let i=0; i<600; i++){
      const tx = (Math.random()-0.5)*200;
      const tz = (Math.random()-0.5)*200;
      const ty = heightFn(tx,tz);
      if (ty > startY && ty < 25) { startX=tx; startZ=tz; startY=ty; }
    }
    // Hard fallback: just compute heightFn at origin
    if (startY < -20 || !isFinite(startY)) {
      startX = 12; startZ = -8;
      startY = heightFn(startX, startZ);
    }
    // Nudge player slightly above ground to guarantee visibility
    startY = Math.max(startY, 1);

    // ────────── HERO TREE — large painterly tree, rule-of-thirds
    const heroGroup = new THREE.Group();
    {
      const heroY = heightFn(HERO_X, HERO_Z);
      const trunkH = 14;
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 1.4, trunkH, 10),
        new THREE.MeshStandardMaterial({ color:0x4a3622, roughness:0.95, flatShading:true }),
      );
      trunk.position.y = trunkH/2;
      trunk.castShadow = true; trunk.receiveShadow = true;
      heroGroup.add(trunk);
      // Branches (a few cylinders angling upward)
      for (let b=0; b<5; b++){
        const len = 5 + Math.random()*3;
        const br = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.4, len, 6),
          trunk.material,
        );
        br.position.y = trunkH*0.6 + Math.random()*3;
        const ang = (b/5)*Math.PI*2 + Math.random()*0.3;
        br.position.x = Math.cos(ang)*1.5;
        br.position.z = Math.sin(ang)*1.5;
        br.rotation.z = Math.cos(ang) * 0.6;
        br.rotation.x = Math.sin(ang) * 0.6;
        br.castShadow = true;
        heroGroup.add(br);
      }
      // Volumetric foliage — multiple layered icospheres for painterly canopy
      const fcols = [0x4a6e2c, 0x5a8030, 0x6a8e3a, 0x3e5e26];
      for (let k=0; k<14; k++){
        const sz = 3.5 + Math.random()*3.5;
        const fmat = new THREE.MeshStandardMaterial({
          color: fcols[(Math.random()*fcols.length)|0],
          roughness: 0.85, flatShading: true,
        });
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(sz, 1), fmat);
        m.position.set(
          (Math.random()-0.5)*7,
          trunkH + 2 + Math.random()*5,
          (Math.random()-0.5)*7,
        );
        m.castShadow = true;
        heroGroup.add(m);
      }
      heroGroup.position.set(HERO_X, heroY, HERO_Z);
      scene.add(heroGroup);
    }

    // ────────── DISTANT TOWER — silhouette mass on the horizon, rule-of-thirds left
    {
      const ty = heightFn(TOWER_X, TOWER_Z);
      const towerMat = new THREE.MeshStandardMaterial({ color:0x4a4458, roughness:0.9 });
      const baseHeight = 70;
      const base = new THREE.Mesh(new THREE.CylinderGeometry(14, 18, 14, 8), towerMat);
      base.position.set(TOWER_X, ty + 7, TOWER_Z);
      scene.add(base);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(8, 12, baseHeight, 8), towerMat);
      shaft.position.set(TOWER_X, ty + 14 + baseHeight/2, TOWER_Z);
      scene.add(shaft);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(11, 22, 8), towerMat);
      cap.position.set(TOWER_X, ty + 14 + baseHeight + 11, TOWER_Z);
      scene.add(cap);
      // Hint of broken battlement
      for (let k=0; k<6; k++){
        const a = (k/6)*Math.PI*2;
        const m = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2), towerMat);
        m.position.set(TOWER_X + Math.cos(a)*9, ty + 14 + baseHeight + 2, TOWER_Z + Math.sin(a)*9);
        scene.add(m);
      }
    }

    // ────────── Grass (instanced, taller blades, denser near origin)
    const grassCount = tweaks.fpsPreset === 'high' ? 120000 : tweaks.fpsPreset === 'low' ? 22000 : 55000;
    const bladeGeo = new THREE.BufferGeometry();
    const bv = new Float32Array([
      -0.06, 0.00, 0,   0.06, 0.00, 0,   0.04, 0.22, 0,
      -0.06, 0.00, 0,   0.04, 0.22, 0,  -0.04, 0.22, 0,
      -0.04, 0.22, 0,   0.04, 0.22, 0,   0.00, 0.55, 0,
    ]);
    bladeGeo.setAttribute('position', new THREE.BufferAttribute(bv, 3));
    bladeGeo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([
      0,0, 1,0, 1,0.4,
      0,0, 1,0.4, 0,0.4,
      0,0.4, 1,0.4, 0.5,1
    ]), 2));
    bladeGeo.computeVertexNormals();
    const grassMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        time:{value:0}, windStr:{value: tweaks.windStrength||1},
        topColor:{value: new THREE.Color(palette.grass[1]).multiplyScalar(1.30)},
        botColor:{value: new THREE.Color(palette.grass[0]).multiplyScalar(0.78)},
        edgeColor:{value: new THREE.Color(palette.grassEdge)},
        fogColor:{value: new THREE.Color(palette.fog)}, fogDensity:{value:fogD},
        sunColor:{value: new THREE.Color(palette.sun)},
        sunDir:{value: sunDirN.clone()},
      },
      vertexShader:`
        uniform float time, windStr;
        varying float vY; varying float vDist; varying vec2 vUv;
        void main(){
          vec4 mv = modelMatrix*instanceMatrix*vec4(position,1.0);
          // Layered wind: large sway + small flutter
          float w1 = sin(time*1.2 + mv.x*0.30 + mv.z*0.40) * 0.22 * windStr;
          float w2 = sin(time*3.5 + mv.x*1.1  + mv.z*0.9 ) * 0.06 * windStr;
          mv.x += (w1 + w2) * position.y;
          mv.z += (w1*0.6) * position.y;
          vY = position.y; vUv = uv;
          vec4 mvp = viewMatrix*mv; vDist = length(mvp.xyz);
          gl_Position = projectionMatrix*mvp;
        }`,
      fragmentShader:`
        uniform vec3 topColor, botColor, edgeColor, fogColor, sunColor, sunDir;
        uniform float fogDensity;
        varying float vY, vDist; varying vec2 vUv;
        void main(){
          vec3 c = mix(botColor, topColor, clamp(vY/0.55, 0.0, 1.0));
          // Subsurface tip glow
          c += edgeColor * smoothstep(0.42, 0.55, vY) * 0.55;
          float fogF = 1.0 - exp(-fogDensity*fogDensity*vDist*vDist);
          c = mix(c, fogColor, clamp(fogF,0.0,1.0));
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    const grass = new THREE.InstancedMesh(bladeGeo, grassMat, grassCount);
    grass.frustumCulled = false;
    const dummy = new THREE.Object3D();
    let placedGrass = 0;
    for (let i=0; i<grassCount && placedGrass<grassCount; i++){
      let x, z;
      if (i < grassCount*0.55) {
        const r = Math.sqrt(Math.random()) * 18;
        const ang = Math.random()*Math.PI*2;
        x = startX + Math.cos(ang)*r; z = startZ + Math.sin(ang)*r;
      } else if (i < grassCount*0.85) {
        const r = 18 + Math.sqrt(Math.random()) * 60;
        const ang = Math.random()*Math.PI*2;
        x = startX + Math.cos(ang)*r; z = startZ + Math.sin(ang)*r;
      } else {
        const r = Math.sqrt(Math.random()) * 200;
        const ang = Math.random()*Math.PI*2;
        x = Math.cos(ang)*r; z = Math.sin(ang)*r;
      }
      const y = heightFn(x,z);
      if (y > 36 || y < -22) continue;
      // skip near hero tree base so it reads cleanly
      const dh = Math.hypot(x-HERO_X, z-HERO_Z);
      if (dh < 4) continue;
      dummy.position.set(x, y, z);
      dummy.rotation.y = Math.random()*Math.PI*2;
      const s = 0.7 + Math.random()*0.5;
      dummy.scale.set(s*1.5, 0.85 + Math.random()*0.55, s*1.5);
      dummy.updateMatrix();
      grass.setMatrixAt(placedGrass++, dummy.matrix);
    }
    grass.count = placedGrass;
    grass.instanceMatrix.needsUpdate = true;
    scene.add(grass);

    // ────────── Mid-distance trees (clusters)
    const trunkColors = [0x4a3624, 0x3e2c1e, 0x52382a];
    const foliageColors = [0x4a6e2c, 0x5a8030, 0x6a8e3a, 0x3e5e26, 0x547030];
    const treeCount = tweaks.fpsPreset === 'low' ? 50 : tweaks.fpsPreset === 'high' ? 180 : 110;
    const treeGroup = new THREE.Group();
    for (let i=0; i<treeCount; i++){
      const r = 50 + Math.random()*340;
      const ang = Math.random()*Math.PI*2;
      const x = Math.cos(ang)*r, z = Math.sin(ang)*r;
      const y = heightFn(x,z);
      if (y > 22 || y < -8) continue;
      // avoid placing inside hero tree
      if (Math.hypot(x-HERO_X, z-HERO_Z) < 18) continue;

      const t = new THREE.Group();
      const trunkH = 5 + Math.random()*5;
      const tmat = new THREE.MeshStandardMaterial({
        color: trunkColors[(Math.random()*trunkColors.length)|0],
        roughness:0.95, flatShading:true,
      });
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.65, trunkH, 7), tmat);
      trunk.position.y = trunkH/2;
      trunk.castShadow = true;
      t.add(trunk);
      const fcol = foliageColors[(Math.random()*foliageColors.length)|0];
      const fmat = new THREE.MeshStandardMaterial({ color:fcol, flatShading:true, roughness:0.85 });
      const blobs = 4 + (Math.random()*4|0);
      for (let b=0; b<blobs; b++){
        const sz = 1.8 + Math.random()*1.8;
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(sz, 0), fmat);
        m.position.set(
          (Math.random()-0.5)*3.0,
          trunkH + 0.6 + Math.random()*3.5,
          (Math.random()-0.5)*3.0,
        );
        m.castShadow = true;
        t.add(m);
      }
      t.position.set(x, y, z);
      const sc = 0.9 + Math.random()*0.7;
      t.scale.set(sc, sc, sc);
      t.rotation.y = Math.random()*Math.PI*2;
      treeGroup.add(t);
    }
    scene.add(treeGroup);

    // ────────── Rocks
    const rockMat = new THREE.MeshStandardMaterial({ color: palette.rock, flatShading:true, roughness:0.9 });
    for (let i=0; i<60; i++){
      const r = 25 + Math.random()*300;
      const ang = Math.random()*Math.PI*2;
      const x = Math.cos(ang)*r, z = Math.sin(ang)*r;
      const y = heightFn(x,z);
      if (y < -5) continue;
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8 + Math.random()*2.2, 0), rockMat);
      m.position.set(x, y + 0.3, z);
      m.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
      m.scale.set(1+Math.random()*0.7, 0.7+Math.random()*0.5, 1+Math.random()*0.7);
      m.castShadow = true;
      scene.add(m);
    }

    // ────────── Volumetric clouds
    const cloudGroup = new THREE.Group();
    const cloudCanvas = document.createElement('canvas');
    cloudCanvas.width = cloudCanvas.height = 128;
    const cctx = cloudCanvas.getContext('2d');
    const cgrad = cctx.createRadialGradient(64,64,0, 64,64,64);
    cgrad.addColorStop(0, 'rgba(255,255,255,1)');
    cgrad.addColorStop(0.4, 'rgba(255,255,255,0.7)');
    cgrad.addColorStop(0.8, 'rgba(255,255,255,0.15)');
    cgrad.addColorStop(1, 'rgba(255,255,255,0)');
    cctx.fillStyle = cgrad; cctx.fillRect(0,0,128,128);
    const cloudTex = new THREE.CanvasTexture(cloudCanvas);
    const cloudColor = tod==='night' ? 0x6a7090 : (tod==='dusk' ? 0xfdc8a0 : (tod==='dawn' ? 0xfde4c8 : 0xffffff));
    const cloudMat = new THREE.SpriteMaterial({
      map: cloudTex, color: cloudColor,
      transparent:true, opacity:0.78, depthWrite:false, fog:false,
    });
    for (let c=0; c<26; c++){
      const cx = (Math.random()-0.5)*1800;
      const cz = (Math.random()-0.5)*1800;
      const cy = 180 + Math.random()*160;
      for (let p=0; p<12; p++){
        const s = new THREE.Sprite(cloudMat);
        s.position.set(cx + (Math.random()-0.5)*80, cy + (Math.random()-0.5)*16, cz + (Math.random()-0.5)*80);
        const sc = 70 + Math.random()*100;
        s.scale.set(sc, sc*0.55, 1);
        cloudGroup.add(s);
      }
    }
    scene.add(cloudGroup);

    // ────────── Wildlife: BIRDS (V-formation flock far in sky)
    const birdGroup = new THREE.Group();
    const birdMat = new THREE.MeshBasicMaterial({ color: tod==='night' ? 0x202028 : 0x1c1e22, fog:true });
    const birdGeom = new THREE.BufferGeometry();
    // Two triangles forming a wide chevron silhouette
    const bvs = new Float32Array([
      -1.4, 0, 0,  -0.2, 0, -0.15,  0, 0, 0,
       1.4, 0, 0,   0.2, 0, -0.15,  0, 0, 0,
    ]);
    birdGeom.setAttribute('position', new THREE.BufferAttribute(bvs, 3));
    birdGeom.computeVertexNormals();
    const birds = [];
    const flockOrigin = new THREE.Vector3(-200, 95, 250);
    for (let i=0; i<14; i++){
      const m = new THREE.Mesh(birdGeom, birdMat);
      const row = Math.floor(i/2), col = (i%2===0?-1:1);
      m.position.set(flockOrigin.x + col*row*4 - row*2, flockOrigin.y + (Math.random()-0.5)*4, flockOrigin.z + row*4);
      m.userData = { phase: Math.random()*Math.PI*2, speed: 0.9 + Math.random()*0.3, baseY: m.position.y };
      birdGroup.add(m);
      birds.push(m);
    }
    scene.add(birdGroup);

    // ────────── Wildlife: PETALS / LEAVES drifting (high-density particle cloud)
    const petalCount = tweaks.fpsPreset==='low' ? 60 : tweaks.fpsPreset==='high' ? 220 : 140;
    const petalGeom = new THREE.PlaneGeometry(0.18, 0.22);
    const petalColors = tod==='night'
      ? [0xb0c0e0, 0x9aa8c8]
      : [0xfff2c8, 0xffd8a8, 0xf8c89a, 0xffe6b8];
    const petalMatPool = petalColors.map(c =>
      new THREE.MeshBasicMaterial({ color:c, side:THREE.DoubleSide, transparent:true, opacity:0.92, fog:true }));
    const petals = [];
    for (let i=0; i<petalCount; i++){
      const m = new THREE.Mesh(petalGeom, petalMatPool[(Math.random()*petalMatPool.length)|0]);
      // distributed in a wide volume around start
      m.position.set(
        startX + (Math.random()-0.5)*120,
        startY + 1 + Math.random()*15,
        startZ + (Math.random()-0.5)*120,
      );
      m.userData = {
        phaseX: Math.random()*Math.PI*2,
        phaseY: Math.random()*Math.PI*2,
        speedY: 0.4 + Math.random()*0.5,
        speedX: 0.6 + Math.random()*0.6,
        spinSpeed: (Math.random()-0.5) * 4,
        baseY: m.position.y,
      };
      scene.add(m);
      petals.push(m);
    }

    // ────────── Wildlife: BUTTERFLIES (day) or FIREFLIES (night/dusk)
    const isFireflyTime = tod==='night' || tod==='dusk';
    const critterCount = tweaks.fpsPreset==='low' ? 14 : 36;
    const critters = [];
    if (isFireflyTime) {
      // glowing fireflies
      const ffGeom = new THREE.SphereGeometry(0.10, 8, 6);
      const ffMat  = new THREE.MeshBasicMaterial({ color:0xfff09a, fog:true });
      for (let i=0; i<critterCount; i++){
        const m = new THREE.Mesh(ffGeom, ffMat);
        m.position.set(startX + (Math.random()-0.5)*40, startY + 0.5 + Math.random()*4, startZ + (Math.random()-0.5)*40);
        m.userData = { ox: m.position.x, oz: m.position.z, oy: m.position.y, phase: Math.random()*Math.PI*2 };
        scene.add(m);
        critters.push(m);
      }
    } else {
      // butterflies — two-tri quads colored
      const bGeom = new THREE.BufferGeometry();
      bGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
        -0.2,0,0,  0,0,0.05,  0,0.18,0,
         0.2,0,0,  0,0,0.05,  0,0.18,0,
      ]),3));
      bGeom.computeVertexNormals();
      const bcols = [0xff8a4a, 0xfddc6c, 0xa6e0ff, 0xf0a8e4];
      for (let i=0; i<critterCount; i++){
        const mat = new THREE.MeshBasicMaterial({ color: bcols[(Math.random()*bcols.length)|0], side:THREE.DoubleSide, fog:true });
        const m = new THREE.Mesh(bGeom, mat);
        m.position.set(startX + (Math.random()-0.5)*30, startY + 0.5 + Math.random()*2.5, startZ + (Math.random()-0.5)*30);
        m.userData = { ox: m.position.x, oz: m.position.z, oy: m.position.y, phase: Math.random()*Math.PI*2, sc:0.8+Math.random()*0.6 };
        m.scale.setScalar(m.userData.sc);
        scene.add(m);
        critters.push(m);
      }
    }

    // ────────── FLAGS / CLOTH — long banners on poles, waving
    const flagGroup = new THREE.Group();
    const flagPositions = [
      [HERO_X+9,  HERO_Z+6 ],
      [HERO_X-7,  HERO_Z+9 ],
      [HERO_X+12, HERO_Z-8 ],
    ];
    const flagColors = [0xc44a3a, 0xd9a44a, 0x4a6ec4];
    const flags = [];
    flagPositions.forEach((pos, k) => {
      const [fx, fz] = pos;
      const fy = heightFn(fx, fz);
      const poleH = 9;
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, poleH, 6),
        new THREE.MeshStandardMaterial({ color:0x3a2e22, roughness:0.85 }),
      );
      pole.position.set(fx, fy + poleH/2, fz);
      pole.castShadow = true;
      flagGroup.add(pole);
      // Banner — vertical strip with custom shader for cloth wave
      const bw = 0.6, bh = 4.5, bSeg = 12;
      const bg = new THREE.PlaneGeometry(bw, bh, 1, bSeg);
      // Pivot at top of cloth
      bg.translate(bw/2, -bh/2, 0);
      const bMat = new THREE.ShaderMaterial({
        uniforms: {
          time:{value:0}, windStr:{value: tweaks.windStrength||1},
          color:{value: new THREE.Color(flagColors[k])},
          fogColor:{value: new THREE.Color(palette.fog)}, fogDensity:{value:fogD},
        },
        side: THREE.DoubleSide,
        vertexShader:`
          uniform float time, windStr;
          varying vec2 vUv; varying float vDist;
          void main(){
            vec3 p = position;
            float t = -p.y / 4.5; // 0 top, 1 bottom
            float w = sin(time*4.0 + p.y*1.5) * 0.25 * windStr;
            p.x += w * t;
            p.z += sin(time*3.0 + p.y*1.0) * 0.18 * windStr * t;
            vUv = uv;
            vec4 mv = modelMatrix*vec4(p,1.0);
            vec4 vp = viewMatrix*mv; vDist = length(vp.xyz);
            gl_Position = projectionMatrix*vp;
          }`,
        fragmentShader:`
          uniform vec3 color, fogColor;
          uniform float fogDensity;
          varying vec2 vUv; varying float vDist;
          void main(){
            // simple cloth shading via UV
            vec3 c = color * (0.85 + 0.15*vUv.x);
            float fogF = 1.0 - exp(-fogDensity*fogDensity*vDist*vDist);
            c = mix(c, fogColor, clamp(fogF,0.0,1.0));
            gl_FragColor = vec4(c, 1.0);
          }`,
      });
      const banner = new THREE.Mesh(bg, bMat);
      banner.position.set(fx, fy + poleH - 0.2, fz);
      flagGroup.add(banner);
      flags.push(bMat);
    });
    scene.add(flagGroup);

    // ────────── Player
    const player = new THREE.Group();
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xc8b48a });
    const cloakMat = new THREE.MeshLambertMaterial({ color: 0x6a3a3a });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.7, 4, 8), cloakMat);
    body.position.y = 0.7;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), bodyMat);
    head.position.y = 1.25;
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.14, 16), cloakMat);
    hat.position.y = 1.36;
    player.add(body); player.add(head); player.add(hat);
    player.traverse(o => { if (o.isMesh) o.castShadow = true; });
    // ALWAYS set player y to current ground height so it's never underground
    const groundAtStart = heightFn(startX, startZ);
    player.position.set(startX, groundAtStart + 0.05, startZ);
    scene.add(player);

    // ────────── Camera rig (TPS, slightly low angle for scale)
    const camRig = { yaw: Math.PI*0.1, pitch: -0.10, dist: 11, vy: 0, grounded: true };
    const updateCam = () => {
      const px = player.position.x, py = player.position.y + 1.7, pz = player.position.z;
      const cx = px + Math.sin(camRig.yaw) * Math.cos(camRig.pitch) * camRig.dist;
      const cz = pz + Math.cos(camRig.yaw) * Math.cos(camRig.pitch) * camRig.dist;
      const cy = py + Math.sin(camRig.pitch) * camRig.dist + 1.6;
      const ground = heightFn(cx, cz) + 0.8;
      camera.position.set(cx, Math.max(cy, ground), cz);
      camera.lookAt(px, py, pz);
    };

    // ────────── Postprocessing disabled (no external deps)
    let composer = null;
    let bloomPass = null;
    if (false && tweaks.cinematic && THREE.EffectComposer) {
      composer = new THREE.EffectComposer(renderer);
      // OutputColorSpace handling: r149 doesn't have OutputPass; do encoding via grade pass
      composer.addPass(new THREE.RenderPass(scene, camera));
      bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(w, h),
        palette.bloom,   // strength
        0.7,             // radius
        0.85,            // threshold (only highlights bloom)
      );
      composer.addPass(bloomPass);
      // Color grading + vignette + subtle DoF (cheap depth-blur fake)
      const gradePass = new THREE.ShaderPass({
        uniforms: {
          tDiffuse:{value:null},
          warmTint:{value: new THREE.Color(0xffe0b8)},
          coolTint:{value: new THREE.Color(0x9eb8d8)},
          vignette:{value: 0.85},
          saturate:{value: 1.08},
        },
        vertexShader:`varying vec2 vUv;
          void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader:`
          uniform sampler2D tDiffuse;
          uniform vec3 warmTint, coolTint;
          uniform float vignette, saturate;
          varying vec2 vUv;
          void main(){
            vec4 t = texture2D(tDiffuse, vUv);
            vec3 c = t.rgb;
            // Split-tone: warm highlights, cool shadows
            float lum = dot(c, vec3(0.299, 0.587, 0.114));
            c = mix(c * coolTint, c * warmTint, smoothstep(0.25, 0.85, lum));
            // Saturate
            vec3 g = vec3(dot(c, vec3(0.299,0.587,0.114)));
            c = mix(g, c, saturate);
            // Vignette (very subtle)
            vec2 uv = vUv - 0.5;
            float v = 1.0 - dot(uv, uv) * (1.0 - vignette) * 1.2;
            c *= clamp(v, 0.0, 1.0);
            gl_FragColor = vec4(c, t.a);
          }`,
      });
      composer.addPass(gradePass);
      gradePass.renderToScreen = true;
    }

    // ────────── Input
    const move = { f:false, b:false, l:false, r:false, sprint:false };
    const onKD = (e) => {
      if (e.code==='KeyW'||e.code==='ArrowUp') move.f=true;
      if (e.code==='KeyS'||e.code==='ArrowDown') move.b=true;
      if (e.code==='KeyA'||e.code==='ArrowLeft') move.l=true;
      if (e.code==='KeyD'||e.code==='ArrowRight') move.r=true;
      if (e.code.startsWith('Shift')) move.sprint=true;
      if (e.code==='Space' && camRig.grounded) {
        camRig.vy = 7.0; camRig.grounded = false; e.preventDefault();
      }
    };
    const onKU = (e) => {
      if (e.code==='KeyW'||e.code==='ArrowUp') move.f=false;
      if (e.code==='KeyS'||e.code==='ArrowDown') move.b=false;
      if (e.code==='KeyA'||e.code==='ArrowLeft') move.l=false;
      if (e.code==='KeyD'||e.code==='ArrowRight') move.r=false;
      if (e.code.startsWith('Shift')) move.sprint=false;
    };
    let dragging = false;
    const onMD = () => { dragging = true; renderer.domElement.style.cursor='grabbing'; };
    const onMU = () => { dragging = false; renderer.domElement.style.cursor=''; };
    const onMM = (e) => {
      if (document.pointerLockElement === renderer.domElement) {
        camRig.yaw -= e.movementX * 0.0028;
        camRig.pitch = Math.max(-0.6, Math.min(0.5, camRig.pitch - e.movementY*0.0028));
      } else if (dragging) {
        camRig.yaw -= e.movementX * 0.005;
        camRig.pitch = Math.max(-0.6, Math.min(0.5, camRig.pitch - e.movementY*0.005));
      }
    };
    const onWheel = (e) => {
      e.preventDefault();
      camRig.dist = Math.max(2.5, Math.min(18, camRig.dist + e.deltaY * 0.012));
    };
    const onClick = () => { renderer.domElement.requestPointerLock?.(); setShowHint(false); };
    renderer.domElement.addEventListener('click', onClick);
    renderer.domElement.addEventListener('mousedown', onMD);
    window.addEventListener('mouseup', onMU);
    window.addEventListener('mousemove', onMM);
    window.addEventListener('keydown', onKD);
    window.addEventListener('keyup', onKU);
    renderer.domElement.addEventListener('wheel', onWheel, { passive:false });

    const ro = new ResizeObserver(() => {
      const W = mount.clientWidth, H = mount.clientHeight;
      renderer.setSize(W,H);
      composer && composer.setSize(W, H);
      camera.aspect = W/H; camera.updateProjectionMatrix();
    });
    ro.observe(mount);

    // ────────── Tick
    const clock = new THREE.Clock();
    let raf;
    let altReportT = 0;
    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      grassMat.uniforms.time.value = t;
      flags.forEach(fm => fm.uniforms.time.value = t);

      // Slow cloud drift
      cloudGroup.position.x = Math.sin(t*0.015)*40;
      cloudGroup.position.z = Math.cos(t*0.012)*30;

      // Birds — circle + flap-bob
      birds.forEach((m, i) => {
        m.userData.phase += dt * m.userData.speed;
        const ph = m.userData.phase;
        const radius = 120 + i*1.2;
        m.position.x = flockOrigin.x + Math.cos(ph*0.1)*radius;
        m.position.z = flockOrigin.z + Math.sin(ph*0.1)*radius;
        m.position.y = m.userData.baseY + Math.sin(ph*4)*0.4;
        m.rotation.y = -ph*0.1 + Math.PI/2;
      });

      // Petals — drift on wind, gentle fall+rise
      const wind = (tweaks.windStrength||1) * 1.6;
      petals.forEach(m => {
        m.userData.phaseX += dt * m.userData.speedX;
        m.userData.phaseY += dt * m.userData.speedY;
        m.position.x += Math.sin(m.userData.phaseX)*0.04*wind + 0.02*wind;
        m.position.z += Math.cos(m.userData.phaseX*0.7)*0.04*wind;
        m.position.y = m.userData.baseY + Math.sin(m.userData.phaseY)*0.6;
        m.rotation.z += dt * m.userData.spinSpeed * 0.5;
        m.rotation.y += dt * m.userData.spinSpeed * 0.3;
        // wrap around start
        const dx = m.position.x - startX, dz = m.position.z - startZ;
        if (dx > 70)  m.position.x -= 140;
        if (dx < -70) m.position.x += 140;
        if (dz > 70)  m.position.z -= 140;
        if (dz < -70) m.position.z += 140;
      });

      // Critters
      critters.forEach((m, i) => {
        m.userData.phase += dt * (1.5 + (i%3)*0.3);
        const ph = m.userData.phase;
        m.position.x = m.userData.ox + Math.sin(ph*0.7) * 3.5;
        m.position.z = m.userData.oz + Math.cos(ph*0.5) * 3.2;
        m.position.y = m.userData.oy + Math.sin(ph*1.2) * 0.5 + (isFireflyTime?0.4:0);
        if (!isFireflyTime) {
          // butterfly wing flap via rapid scale in X
          const flap = 0.6 + Math.abs(Math.sin(t*22 + i))*0.4;
          m.scale.x = m.userData.sc * flap;
        } else {
          // firefly twinkle via opacity-ish scale pulse
          const pulse = 0.85 + Math.sin(t*6 + i)*0.15;
          m.scale.setScalar(pulse);
        }
      });

      // ────────── Movement
      const speed = (move.sprint ? 11 : 5) * dt;
      const dir = new THREE.Vector3();
      if (move.f) dir.z -= 1;
      if (move.b) dir.z += 1;
      if (move.l) dir.x -= 1;
      if (move.r) dir.x += 1;
      const moving = dir.lengthSq() > 0;
      if (moving) {
        dir.normalize().applyEuler(new THREE.Euler(0, camRig.yaw, 0));
        player.position.x += dir.x * speed;
        player.position.z += dir.z * speed;
        const targetYaw = Math.atan2(dir.x, dir.z);
        let delta = targetYaw - player.rotation.y;
        while (delta > Math.PI) delta -= Math.PI*2;
        while (delta < -Math.PI) delta += Math.PI*2;
        player.rotation.y += delta * Math.min(1, dt*10);
      }

      // Jump physics
      const ground = heightFn(player.position.x, player.position.z);
      if (!camRig.grounded) {
        camRig.vy -= 22 * dt;
        player.position.y += camRig.vy * dt;
        if (player.position.y <= ground) {
          player.position.y = ground; camRig.vy = 0; camRig.grounded = true;
        }
      } else {
        // Walking bob
        player.position.y = ground + (moving ? Math.abs(Math.sin(t*8))*0.05 : 0);
      }

      // Sun + shadow follow
      sun.target.position.copy(player.position);
      sun.position.set(
        player.position.x + sunOffset.x,
        player.position.y + sunOffset.y + 30,
        player.position.z + sunOffset.z,
      );

      // Demo / Cinematic auto-orbit camera
      if (tweaks.demoMode) {
        camRig.yaw += dt * 0.06;
      }

      updateCam();

      // Altitude HUD throttle
      altReportT += dt;
      if (altReportT > 0.3) {
        altReportT = 0;
        setAltitude(player.position.y);
      }

      if (composer) composer.render(); else renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('click', onClick);
      renderer.domElement.removeEventListener('mousedown', onMD);
      window.removeEventListener('mouseup', onMU);
      window.removeEventListener('mousemove', onMM);
      window.removeEventListener('keydown', onKD);
      window.removeEventListener('keyup', onKU);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      [terrGeo, bladeGeo, petalGeom, birdGeom].forEach(g=>g.dispose());
      M.forEach(L => { L.geom.dispose(); L.mat.dispose(); });
      [terrMat, grassMat, skyMat, rockMat, bodyMat, cloakMat, cloudMat, birdMat].forEach(m=>m.dispose());
      petalMatPool.forEach(m=>m.dispose());
    };
  }, [tweaks.timeOfDay, tweaks.fpsPreset, tweaks.fogDensity, tweaks.windStrength, tweaks.cinematic]);

  const lang = tweaks.language;
  const poem = lang === 'ja'
    ? '風が、まだ見ぬ地平を呼んでいる。'
    : 'The wind calls toward an unseen horizon.';

  return (
    <div ref={mountRef} style={{position:'relative', width:'100%', height:'100%', overflow:'hidden', background:'#bcd6e6'}}>
      {tweaks.showHUD && (
        <>
          <div style={{position:'absolute', inset:0, pointerEvents:'none',
            background:'radial-gradient(ellipse at center, transparent 50%, rgba(8,12,24,0.42) 100%)'}}/>
          <div style={hudStyleAAA.compass}>
            <span style={{opacity:0.5}}>W</span>
            <span style={{opacity:1, fontSize:16, color:'#fff'}}>N</span>
            <span style={{opacity:0.5}}>E</span>
          </div>
          <div style={hudStyleAAA.alt}>
            <div style={hudStyleAAA.label}>{lang==='ja'?'高度':'ALT'}</div>
            <div style={hudStyleAAA.bigNum}>{Math.round(altitude)}<span style={hudStyleAAA.unit}>m</span></div>
          </div>
          <div style={hudStyleAAA.poem}>{poem}</div>
        </>
      )}
      {showHint && (
        <div style={hudStyleAAA.hint}>
          <div style={{fontSize:14, opacity:0.95, letterSpacing:'0.2em', marginBottom:8}}>
            {lang==='ja'?'クリックで操作開始':'CLICK TO PLAY'}
          </div>
          <div style={{fontSize:11, opacity:0.65, letterSpacing:'0.25em', fontFamily:'ui-monospace,Menlo,monospace'}}>
            WASD&nbsp;·&nbsp;MOUSE&nbsp;·&nbsp;SHIFT&nbsp;·&nbsp;SPACE&nbsp;·&nbsp;WHEEL
          </div>
        </div>
      )}
      <div style={hudStyleAAA.tag}>A · OPEN SKIES — 開かれた空</div>
    </div>
  );
}

const hudStyleAAA = {
  compass: {position:'absolute', top:24, left:'50%', transform:'translateX(-50%)',
            display:'flex', gap:18, color:'#fff', fontFamily:'ui-monospace,Menlo,monospace',
            fontSize:13, letterSpacing:'0.4em', textShadow:'0 1px 4px rgba(0,0,0,0.7)', pointerEvents:'none'},
  alt:    {position:'absolute', top:24, left:24, color:'#fff',
           fontFamily:'ui-monospace,Menlo,monospace', textShadow:'0 1px 4px rgba(0,0,0,0.7)', pointerEvents:'none'},
  label:  {fontSize:10, opacity:0.7, letterSpacing:'0.3em'},
  bigNum: {fontSize:24, fontWeight:300, marginTop:4, letterSpacing:'0.05em'},
  unit:   {fontSize:11, opacity:0.6, marginLeft:4},
  poem:   {position:'absolute', bottom:36, left:0, right:0, textAlign:'center', color:'#fff',
           fontFamily:'"Hiragino Mincho ProN","Yu Mincho",serif', fontSize:22, fontWeight:300,
           letterSpacing:'0.15em', textShadow:'0 2px 12px rgba(0,0,0,0.85)', pointerEvents:'none'},
  hint:   {position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', color:'#fff',
           textAlign:'center', padding:'18px 28px', background:'rgba(0,0,0,0.45)', backdropFilter:'blur(6px)',
           borderRadius:8, border:'1px solid rgba(255,255,255,0.25)', pointerEvents:'none',
           fontFamily:'-apple-system,system-ui,sans-serif'},
  tag:    {position:'absolute', bottom:14, left:14, color:'rgba(255,255,255,0.7)',
           fontFamily:'ui-monospace,Menlo,monospace', fontSize:10, letterSpacing:'0.3em', pointerEvents:'none'},
};

window.SceneAAA = SceneAAA;
