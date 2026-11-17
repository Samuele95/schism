import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// The construct's signal layer: scanlines, chromatic split and tearing, used at the cut
// and nowhere else at full strength; a constant faint vignette and grain hold the frame together.
const SignalShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGlitch: { value: 0 },
    uScan: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime, uGlitch, uScan; uniform vec2 uRes; varying vec2 vUv;
    float h(float n){ return fract(sin(n)*43758.5453); }
    float h2(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
    void main(){
      vec2 uv = vUv;
      float g = uGlitch;
      float row = floor(uv.y * 48.0);
      float tick = floor(uTime * 24.0);
      float band = step(1.0 - g * 0.22, h(row * 1.7 + tick));
      uv.x += band * (h(row + tick * 3.1) - 0.5) * 0.08 * g;
      float off = 0.0025 + 0.006 * g;
      vec3 col;
      col.r = texture2D(tDiffuse, uv + vec2(off * g, 0.0)).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - vec2(off * g, 0.0)).b;
      float scan = 0.5 + 0.5 * sin(uv.y * uRes.y * 1.15);
      col *= 1.0 - (uScan * 0.22 + g * 0.15) * scan;
      col += vec3(0.9, 1.0, 0.95) * band * g * 0.04;
      float v = length((vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0));
      col *= mix(1.0, smoothstep(1.15, 0.25, v), 0.55);
      col += (h2(vUv * uRes + fract(uTime)) - 0.5) * 0.028;
      col = max(col, 0.0);
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export function buildPost(renderer, scene, camera, { bloom = true } = {}) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  let bloomPass = null;
  if (bloom) {
    bloomPass = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.5, 0.22);
    composer.addPass(bloomPass);
  }
  // tone map and convert to sRGB first, so grain and vignette act on display values (symmetric, no lift)
  composer.addPass(new OutputPass());
  const signal = new ShaderPass(SignalShader);
  composer.addPass(signal);
  return {
    composer, bloomPass, signal,
    setSize(w, h, pr) {
      composer.setPixelRatio(pr);
      composer.setSize(w, h);
      signal.uniforms.uRes.value.set(w * pr, h * pr);
    },
  };
}
