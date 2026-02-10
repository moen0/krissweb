(() => {
  const canvas = document.getElementById('caustics');
  const gl = canvas.getContext('webgl');
  if (!gl) return;

  let mouse = { x: 0.5, y: 0.5 };
  let smoothMouse = { x: 0.5, y: 0.5 };

  document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX / window.innerWidth;
    mouse.y = 1.0 - e.clientY / window.innerHeight;
  });

  // Touch support
  document.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    mouse.x = t.clientX / window.innerWidth;
    mouse.y = 1.0 - t.clientY / window.innerHeight;
  }, { passive: true });

  const vertSrc = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fragSrc = `
    precision highp float;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_mouse;
    uniform float u_dark;

    // Attempt a realistic caustics look via layered refraction simulation
    // Uses multiple overlapping "wave" layers that create interference patterns

    float random(vec2 st) {
      return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    // Attempt smooth noise
    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    // Water surface height — multiple wave octaves
    float waterHeight(vec2 p, float t) {
      float h = 0.0;
      // Large slow waves
      h += sin(p.x * 1.8 + t * 0.6) * cos(p.y * 1.4 + t * 0.5) * 0.5;
      // Medium ripples
      h += sin(p.x * 3.5 - t * 0.9 + p.y * 2.0) * 0.25;
      h += cos(p.y * 4.1 + t * 0.7 - p.x * 1.5) * 0.25;
      // Small high-frequency detail
      h += sin(p.x * 7.0 + t * 1.2) * cos(p.y * 6.0 - t * 1.0) * 0.12;
      h += noise(p * 3.0 + t * 0.3) * 0.3;
      // Mouse influence — ripple emanating from cursor
      float d = length(p - u_mouse * 8.0);
      h += sin(d * 4.0 - t * 3.0) * exp(-d * 0.5) * 0.6;
      return h;
    }

    // Compute normal via central differences to simulate refraction
    vec3 waterNormal(vec2 p, float t) {
      float eps = 0.05;
      float hL = waterHeight(p - vec2(eps, 0.0), t);
      float hR = waterHeight(p + vec2(eps, 0.0), t);
      float hD = waterHeight(p - vec2(0.0, eps), t);
      float hU = waterHeight(p + vec2(0.0, eps), t);
      return normalize(vec3(hL - hR, hD - hU, eps * 4.0));
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      float aspect = u_resolution.x / u_resolution.y;
      vec2 p = uv * 8.0;
      p.x *= aspect;

      float t = u_time;

      // Compute refracted position on "floor"
      vec3 normal = waterNormal(p, t);
      // Snell's law approximation — refract downward through water
      float depth = 2.0; // distance from water surface to floor
      vec2 refracted = p + normal.xy * depth * 0.5;

      // Caustic intensity: overlap of multiple refraction layers
      float caustic = 0.0;

      // Layer 1
      vec3 n1 = waterNormal(refracted * 1.0, t * 1.0);
      caustic += pow(max(0.0, n1.z), 8.0);

      // Layer 2 — offset
      vec3 n2 = waterNormal(refracted * 1.3 + 2.5, t * 0.8);
      caustic += pow(max(0.0, n2.z), 8.0);

      // Layer 3
      vec3 n3 = waterNormal(refracted * 0.7 + 5.0, t * 1.2);
      caustic += pow(max(0.0, n3.z), 6.0);

      caustic /= 3.0;

      // Enhance contrast — make the bright caustic lines pop
      caustic = pow(caustic, 1.8) * 1.6;

      // Color tint — warm golden for light theme, cool blue for dark
      vec3 lightColor = mix(
        vec3(0.93, 0.88, 0.78),  // warm base
        vec3(1.0, 0.96, 0.85),   // bright caustic highlight
        caustic
      );

      vec3 darkColor = mix(
        vec3(0.08, 0.09, 0.12),  // dark base
        vec3(0.25, 0.45, 0.65),  // blue caustic highlight
        caustic
      );

      vec3 color = mix(lightColor, darkColor, u_dark);

      // Subtle vignette
      float vig = 1.0 - length((uv - 0.5) * 1.2);
      vig = smoothstep(0.0, 0.7, vig);
      color *= mix(0.7, 1.0, vig);

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  function createShader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  const vert = createShader(gl.VERTEX_SHADER, vertSrc);
  const frag = createShader(gl.FRAGMENT_SHADER, fragSrc);
  if (!vert || !frag) return;

  const program = gl.createProgram();
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return;
  }
  gl.useProgram(program);

  // Full-screen quad
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1
  ]), gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(program, 'u_resolution');
  const uTime = gl.getUniformLocation(program, 'u_time');
  const uMouse = gl.getUniformLocation(program, 'u_mouse');
  const uDark = gl.getUniformLocation(program, 'u_dark');

  function resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    // Use lower resolution for performance
    const w = Math.floor(window.innerWidth * dpr * 0.5);
    const h = Math.floor(window.innerHeight * dpr * 0.5);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  window.addEventListener('resize', resize);
  resize();

  const startTime = performance.now();

  function render() {
    const t = (performance.now() - startTime) / 1000.0;

    // Smooth mouse follow
    smoothMouse.x += (mouse.x - smoothMouse.x) * 0.03;
    smoothMouse.y += (mouse.y - smoothMouse.y) * 0.03;

    const isDark = document.documentElement.dataset.theme === 'dark' ? 1.0 : 0.0;

    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, t);
    gl.uniform2f(uMouse, smoothMouse.x, smoothMouse.y);
    gl.uniform1f(uDark, isDark);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
  }

  render();
})();
