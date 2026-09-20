import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { val, label, hueToHex, lerp, clamp, HUES } from '../lib/util.js';

const S = (instruction, levels) => ({ type: 'score', instruction, levels });

export default {
  id: 'material',
  short: 'material',
  title: 'Language → material',
  tagline: 'A phrase scored on surface axes, driving a physical shader.',
  placeholder: 'moss on a stone wall',
  examples: ['moss on a stone wall', 'rusty hinge', 'wet silk', 'polished chrome', 'sun-bleached bark', 'fresh snow'],

  questions: () => ({
    roughness: S('How rough is this surface?', ['polished', 'smooth', 'fine_grain', 'coarse', 'jagged']),
    gloss:     S('How much does it reflect?', ['matte', 'satin', 'semi_gloss', 'glossy', 'mirror']),
    hardness:  S('How hard is it to the touch?', ['yielding', 'soft', 'firm', 'hard', 'rigid']),
    warmth:    S('How warm does it feel?', ['icy', 'cool', 'neutral', 'warm', 'hot']),
    wetness:   S('How wet is it?', ['bone_dry', 'dry', 'damp', 'wet', 'saturated']),
    metallic:  { type: 'noul', instruction: 'Is this surface metallic?' },
    hue:       { type: 'choice', instruction: 'What colour is this, primarily?', options: HUES },
  }),

  mount(root) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    root.append(renderer.domElement);
    Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block' });

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 5.3);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(3, 4, 5);
    scene.add(key, new THREE.AmbientLight(0xffffff, 0.75));

    // Fine noise bump so roughness reads as visible grain, not just a slider.
    const bump = (() => {
      // Deliberately coarse (128px, nearest-filtered): fine noise just aliases
      // into grey mush at render scale and reads as no texture at all.
      const N = 128;
      const c = document.createElement('canvas');
      c.width = c.height = N;
      const ctx = c.getContext('2d');
      const img = ctx.createImageData(N, N);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() < 0.5 ? 40 + Math.random() * 60 : 180 + Math.random() * 75;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.magFilter = THREE.NearestFilter;
      t.repeat.set(5, 3);
      return t;
    })();

    const material = new THREE.MeshPhysicalMaterial({
      color: '#8a8a8a', roughness: 0.6, metalness: 0, clearcoat: 0,
      sheen: 0, clearcoatRoughness: 0.4, roughnessMap: bump, bumpMap: bump, bumpScale: 0.02,
    });
    const mesh = new THREE.Mesh(new THREE.TorusKnotGeometry(1, 0.34, 220, 32), material);
    scene.add(mesh);

    // Targets are lerped toward, so a new phrase visibly *resolves*.
    const target = { rough: 0.6, metal: 0, coat: 0, coatRough: 0.4, sheen: 0, bump: 0.02, color: new THREE.Color('#8a8a8a') };
    let raf, stopped = false;

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = root;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(root);
    resize();

    const tick = () => {
      if (stopped) return;
      raf = requestAnimationFrame(tick);
      mesh.rotation.y += 0.0042;
      mesh.rotation.x += 0.0015;
      material.roughness = lerp(material.roughness, target.rough, 0.09);
      material.metalness = lerp(material.metalness, target.metal, 0.09);
      material.clearcoat = lerp(material.clearcoat, target.coat, 0.09);
      material.clearcoatRoughness = lerp(material.clearcoatRoughness, target.coatRough, 0.09);
      material.sheen = lerp(material.sheen, target.sheen, 0.09);
      material.bumpScale = lerp(material.bumpScale, target.bump, 0.09);
      material.color.lerp(target.color, 0.09);
      renderer.render(scene, camera);
    };
    tick();

    return {
      update(answers) {
        const rough = val(answers, 'roughness');
        const gloss = val(answers, 'gloss');
        const hard = val(answers, 'hardness');
        const warm = val(answers, 'warmth');
        const wet = val(answers, 'wetness');
        const metal = val(answers, 'metallic', 0);

        // Gloss and wetness both fight roughness — a wet rock is rough but shiny,
        // which is why clearcoat carries the shine instead of lowering roughness.
        target.rough = clamp(rough * (1 - gloss * 0.45) * (1 - wet * 0.2), 0.06, 1);
        target.metal = clamp(metal);
        // Clearcoat only earns its place when the phrase is actually glossy or
        // wet; left ungated it turns every surface into moulded plastic.
        target.coat = clamp(Math.max(0, gloss - 0.35) * 1.1 + Math.max(0, wet - 0.4) * 0.9);
        target.coatRough = clamp(rough * 0.8, 0.05, 1);
        target.sheen = clamp((1 - hard) * 0.9);
        target.bump = clamp(rough * 0.9, 0.01, 0.9);

        const hex = hueToHex(label(answers, 'hue') || 'grey', 0.18 + warm * 0.4, 0.3 + warm * 0.45);
        target.color.set(hex);

        return [
          ['roughness', label(answers, 'roughness')],
          ['gloss', label(answers, 'gloss')],
          ['hardness', label(answers, 'hardness')],
          ['warmth', label(answers, 'warmth')],
          ['wetness', label(answers, 'wetness')],
          ['metallic', `${Math.round(metal * 100)}%`],
          ['hue', label(answers, 'hue')],
        ];
      },
      destroy() {
        stopped = true;
        cancelAnimationFrame(raf);
        ro.disconnect();
        mesh.geometry.dispose();
        material.dispose();
        bump.dispose();
        pmrem.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      },
    };
  },
};
