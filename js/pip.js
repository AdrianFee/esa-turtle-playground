/* Pip, the playground turtle. One set of shapes, two renderers:
   - drawPipSprite(ctx, opts): the canvas sprite. Draws in "sprite units"
     centred on the origin, facing up (negative y). The caller translates,
     rotates for the heading and scales, exactly as for the other shapes.
   - pipSVG(opts) / faceSVG(state) / stampSVG(opts): SVG markup for the
     header mascot, the banner faces and the passport stamps.

   Style: few shapes, a thick ink outline, a bit of character in the eyes.
   The shell takes the turtle's fill colour and its outline the pen
   colour, as a real turtle sprite does. Head, legs and tail are always
   Pip-green with an ink outline, so head and tail stay readable whatever
   colours the child picks. A pale halo behind the ink keeps the outline
   visible on dark backgrounds.

   The name is a placeholder: the club will choose it (MASCOT_NAME in app.js). */

export const PIP = {
  ink: "#1e2430",
  limb: "#5cb86a",        // head, legs, tail
  limbDark: "#2e8a44",    // the brand shell colour for the header mascot
  halo: "rgba(255,255,255,0.85)",
  cream: "#fbf6ec",
  sun: "#f2b32b",
  accent: "#167a50",
  soft: "#4a5160",
};

// Geometry in sprite units. Up is negative y.
const G = {
  shell: { cx: 0, cy: 1.5, rx: 9, ry: 10.5 },
  head: { cx: 0, cy: -13, rx: 4.6, ry: 5.2 },
  patch: { cx: 0, cy: -13.5, rx: 3.4, ry: 3.7 },   // cream face patch: keeps the face readable when the shell is green too
  eyes: [[-1.9, -14.2], [1.9, -14.2]],
  eyeR: 1.2,
  mouth: { cx: 0, cy: -11.4, r: 1.7 },
  legs: [[-7.5, -5.5, Math.PI / 4], [7.5, -5.5, -Math.PI / 4], [-7.5, 7.5, -Math.PI / 4], [7.5, 7.5, Math.PI / 4]],
  leg: { rx: 5.2, ry: 3.3 },
  tail: [[-2.6, 9], [0, 17], [2.6, 9]],
  hex: [[0, -5.5], [4.8, -2.7], [4.8, 2.7], [0, 5.5], [-4.8, 2.7], [-4.8, -2.7]],
  rim: [[0, -9.8], [7.6, -4.4], [7.6, 6.6], [0, 11.3], [-7.6, 6.6], [-7.6, -4.4]],
  outline: 1.3,
  halo: 3.4,
};

// ---------------------------------------------------------------- canvas

export function drawPipSprite(c, { fill = "black", stroke = "black", eyes = "open" } = {}) {
  const ell = (x, y, rx, ry, rot) => {
    c.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot));
    c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  };
  const outline = (colour) => {
    c.lineJoin = "round"; c.lineCap = "round";
    c.strokeStyle = PIP.halo; c.lineWidth = G.halo; c.stroke();
    c.strokeStyle = colour; c.lineWidth = G.outline; c.stroke();
  };

  // Legs, tail and head: always Pip-green with an ink outline.
  c.beginPath();
  for (const [x, y, rot] of G.legs) ell(x, y, G.leg.rx, G.leg.ry, rot);
  c.moveTo(G.tail[0][0], G.tail[0][1]); c.lineTo(G.tail[1][0], G.tail[1][1]); c.lineTo(G.tail[2][0], G.tail[2][1]); c.closePath();
  ell(G.head.cx, G.head.cy, G.head.rx, G.head.ry, 0);
  c.fillStyle = PIP.limb; c.fill();
  outline(PIP.ink);

  // Shell: the turtle's fill colour, outlined in its pen colour.
  c.beginPath();
  ell(G.shell.cx, G.shell.cy, G.shell.rx, G.shell.ry, 0);
  c.fillStyle = fill; c.fill();
  outline(stroke);

  // Plates: a light and a dark line on top of each other, so they show on any fill.
  c.beginPath();
  const cy = G.shell.cy;
  c.moveTo(G.hex[0][0], G.hex[0][1] + cy);
  for (let i = 1; i < 6; i++) c.lineTo(G.hex[i][0], G.hex[i][1] + cy);
  c.closePath();
  for (let i = 0; i < 6; i++) { c.moveTo(G.hex[i][0], G.hex[i][1] + cy); c.lineTo(G.rim[i][0], G.rim[i][1] + cy); }
  c.strokeStyle = "rgba(255,255,255,0.5)"; c.lineWidth = 1.7; c.stroke();
  c.strokeStyle = "rgba(30,36,48,0.45)"; c.lineWidth = 0.8; c.stroke();

  // Cream face patch, then the face.
  c.beginPath();
  ell(G.patch.cx, G.patch.cy, G.patch.rx, G.patch.ry, 0);
  c.fillStyle = PIP.cream; c.fill();
  if (eyes === "closed") {
    c.beginPath();
    for (const [x, y] of G.eyes) { c.moveTo(x - 1.2, y); c.lineTo(x + 1.2, y); }
    c.strokeStyle = PIP.ink; c.lineWidth = 0.9; c.stroke();
  } else {
    c.beginPath();
    for (const [x, y] of G.eyes) { c.moveTo(x + G.eyeR, y); c.arc(x, y, G.eyeR, 0, Math.PI * 2); }
    c.fillStyle = PIP.ink; c.fill();
    c.beginPath();
    for (const [x, y] of G.eyes) { c.moveTo(x - 0.1, y - 0.45); c.arc(x - 0.4, y - 0.45, 0.42, 0, Math.PI * 2); }
    c.fillStyle = "#ffffff"; c.fill();
  }
  c.beginPath();
  c.arc(G.mouth.cx, G.mouth.cy, G.mouth.r, Math.PI * 0.15, Math.PI * 0.85);
  c.strokeStyle = PIP.ink; c.lineWidth = 0.8; c.stroke();
}

// ---------------------------------------------------------------- svg

const ellSVG = (x, y, rx, ry, deg, attrs) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${deg} ${x} ${y})" ${attrs}/>`;

/* Body parts for the header mascot. The body is drawn facing up and
   rotated to face right; the head is drawn separately, upright, so Pip
   looks out at the viewer and the expressions read the right way up. */
function limbsSVG() {
  const limbAttrs = `fill="${PIP.limb}" stroke="${PIP.ink}" stroke-width="${G.outline}" stroke-linejoin="round"`;
  const legs = G.legs.map(([x, y, rot]) => ellSVG(x, y, G.leg.rx, G.leg.ry, rot * 180 / Math.PI, limbAttrs)).join("");
  const tail = `<polygon points="${G.tail.map((p) => p.join(",")).join(" ")}" ${limbAttrs}/>`;
  return legs + tail;
}

function shellSVG(shell, pen) {
  const shellEl = ellSVG(G.shell.cx, G.shell.cy, G.shell.rx, G.shell.ry, 0, `fill="${shell}" stroke="${pen}" stroke-width="${G.outline}"`);
  const cy = G.shell.cy;
  const d = `M${G.hex.map((p) => `${p[0]},${p[1] + cy}`).join(" L")} Z ${G.hex.map((p, i) => `M${p[0]},${p[1] + cy} L${G.rim[i][0]},${G.rim[i][1] + cy}`).join(" ")}`;
  return shellEl + `<path d="${d}" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.7"/><path d="${d}" fill="none" stroke="rgba(30,36,48,0.45)" stroke-width="0.8"/>`;
}

function headSVG(state) {
  // Upright head, centred on the origin, slightly larger than the sprite's so the face has room.
  const limbAttrs = `fill="${PIP.limb}" stroke="${PIP.ink}" stroke-width="${G.outline}"`;
  const eyes = [[-2.1, -1.4], [2.1, -1.4]];
  const mouth = { cx: 0, cy: 1.5, r: 1.7 };
  return ellSVG(0, 0, 5.2, 5.6, 0, limbAttrs) + ellSVG(0, -0.4, 3.9, 4.2, 0, `fill="${PIP.cream}"`) + faceParts(state, eyes, mouth, 1);
}

/* The face, shared by the sprite (top-down) and the banner face (front
   view). k scales the features for the larger banner face. */
function faceParts(state, eyes, mouth, k) {
  const ink = PIP.ink;
  const [[lx, ly], [rx, ry]] = eyes;
  const r = G.eyeR * k;
  let out = "";
  if (state === "happy") {
    // Closed, smiling eyes and a wide smile.
    out += `<path d="M${lx - 1.4 * k},${ly + 0.4 * k} q${1.4 * k},${-1.8 * k} ${2.8 * k},0 M${rx - 1.4 * k},${ry + 0.4 * k} q${1.4 * k},${-1.8 * k} ${2.8 * k},0" fill="none" stroke="${ink}" stroke-width="${1 * k}" stroke-linecap="round"/>`;
    out += `<path d="M${mouth.cx - 2.4 * k},${mouth.cy - 0.6 * k} q${2.4 * k},${3.2 * k} ${4.8 * k},0" fill="none" stroke="${ink}" stroke-width="${0.9 * k}" stroke-linecap="round"/>`;
  } else if (state === "oops") {
    // Wide eyes looking off to one side, brows at two heights, a small round mouth. Puzzled, not sad.
    out += `<circle cx="${lx}" cy="${ly}" r="${r * 1.35}" fill="#ffffff" stroke="${ink}" stroke-width="${0.7 * k}"/><circle cx="${rx}" cy="${ry}" r="${r * 1.35}" fill="#ffffff" stroke="${ink}" stroke-width="${0.7 * k}"/>`;
    out += `<circle cx="${lx + 0.7 * k}" cy="${ly - 0.2 * k}" r="${r * 0.7}" fill="${ink}"/><circle cx="${rx + 0.7 * k}" cy="${ry - 0.2 * k}" r="${r * 0.7}" fill="${ink}"/>`;
    out += `<path d="M${lx - 1.3 * k},${ly - 2.3 * k} l${2.4 * k},${-0.5 * k} M${rx - 1.1 * k},${ry - 3.3 * k} l${2.4 * k},${0.3 * k}" fill="none" stroke="${ink}" stroke-width="${0.9 * k}" stroke-linecap="round"/>`;
    out += `<circle cx="${mouth.cx + 0.6 * k}" cy="${mouth.cy + 0.2 * k}" r="${1 * k}" fill="none" stroke="${ink}" stroke-width="${0.8 * k}"/>`;
  } else if (state === "thinking") {
    // Eyes up and to one side, one brow raised, a flat little mouth: "hmm".
    out += `<circle cx="${lx}" cy="${ly}" r="${r}" fill="${ink}"/><circle cx="${rx}" cy="${ry}" r="${r}" fill="${ink}"/>`;
    out += `<circle cx="${lx - 0.35 * k}" cy="${ly - 0.5 * k}" r="${0.42 * k}" fill="#ffffff"/><circle cx="${rx - 0.35 * k}" cy="${ry - 0.5 * k}" r="${0.42 * k}" fill="#ffffff"/>`;
    out += `<path d="M${rx - 1.2 * k},${ry - 2.9 * k} l${2.4 * k},${-0.4 * k}" fill="none" stroke="${ink}" stroke-width="${0.9 * k}" stroke-linecap="round"/>`;
    out += `<path d="M${mouth.cx - 1.4 * k},${mouth.cy + 0.6 * k} l${2.8 * k},0" fill="none" stroke="${ink}" stroke-width="${0.8 * k}" stroke-linecap="round"/>`;
  } else {
    // idle and running: open eyes with a highlight, small smile.
    const dy = state === "running" ? -0.4 * k : 0;
    out += `<circle cx="${lx}" cy="${ly + dy}" r="${r}" fill="${ink}"/><circle cx="${rx}" cy="${ry + dy}" r="${r}" fill="${ink}"/>`;
    out += `<circle cx="${lx - 0.4 * k}" cy="${ly - 0.45 * k + dy}" r="${0.42 * k}" fill="#ffffff"/><circle cx="${rx - 0.4 * k}" cy="${ry - 0.45 * k + dy}" r="${0.42 * k}" fill="#ffffff"/>`;
    out += `<path d="M${mouth.cx - 1.6 * k},${mouth.cy} q${1.6 * k},${2.2 * k} ${3.2 * k},0" fill="none" stroke="${ink}" stroke-width="${0.8 * k}" stroke-linecap="round"/>`;
  }
  return out;
}

/** The header mascot: Pip seen from above, facing right. States: idle, running, oops, happy. */
export function pipSVG({ state = "idle", size = 40, shell = PIP.limbDark, pen = PIP.ink, cls = "" } = {}) {
  let extras = "";
  if (state === "oops") {
    extras = `<text x="15" y="-9" font-family="Fredoka, 'Atkinson Hyperlegible Next', sans-serif" font-weight="600" font-size="12" fill="${PIP.ink}">?</text>`;
  }
  if (state === "running") {
    extras = `<path d="M-18,-5 h5 M-19,0 h6 M-18,5 h5" fill="none" stroke="${PIP.soft}" stroke-width="1.3" stroke-linecap="round"/>`;
  }
  // Body faces right (rotate 90 maps "up" to "right"); the head sits where the rotated neck is, drawn upright.
  return `<svg class="pip ${cls}" data-state="${state}" viewBox="-21 -21 42 42" width="${size}" height="${size}" aria-hidden="true">` +
    `<g class="pip-body"><g transform="rotate(90)">${limbsSVG()}</g>` +
    `<g class="pip-head" transform="translate(13.5 0)">${headSVG(state)}</g>` +
    `<g transform="rotate(90)">${shellSVG(shell, pen)}</g></g>${extras}</svg>`;
}

/** Pip's face, front view, for the done / nudge / error banners. States: happy, thinking, oops. */
export function faceSVG(state = "happy", size = 32) {
  const eyes = [[-2.4, -1.2], [2.4, -1.2]];
  const mouth = { cx: 0, cy: 1.8, r: 2 };
  const k = 1.15;
  let extras = "";
  if (state === "oops") extras = `<text x="6.5" y="-5" font-family="Fredoka, 'Atkinson Hyperlegible Next', sans-serif" font-weight="600" font-size="8" fill="${PIP.ink}">?</text>`;
  return `<svg class="pip-face" data-state="${state}" viewBox="-10 -10 20 20" width="${size}" height="${size}" aria-hidden="true">` +
    `<circle cx="0" cy="0.4" r="7.4" fill="${PIP.limb}" stroke="${PIP.ink}" stroke-width="1.3"/>` +
    `<ellipse cx="0" cy="0.2" rx="5.5" ry="5.7" fill="${PIP.cream}"/>` +
    faceParts(state, eyes, mouth, k) + extras + `</svg>`;
}

/** A passport stamp. Empty: a dashed ring with the lesson number. Stamped: sun disc, green ring, Pip's footprint. */
export function stampSVG({ done = false, label = "", size = 40, challenge = false } = {}) {
  const shape = challenge
    ? `<rect x="5" y="5" width="30" height="30" rx="8"`
    : `<circle cx="20" cy="20" r="15.5"`;
  if (!done) {
    return `<svg class="stamp-svg" viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true">` +
      `${shape} fill="none" stroke="${PIP.soft}" stroke-width="4" stroke-dasharray="5 3.5"/>` +
      (label ? `<text x="20" y="25" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="600" font-size="14" fill="${PIP.soft}">${label}</text>` : "") +
      `</svg>`;
  }
  // footprint: a pad and four toes
  const foot = `<ellipse cx="20" cy="23" rx="5" ry="4.2" fill="${PIP.ink}"/>` +
    [[-6, 16.5], [-2.2, 14], [2.2, 14], [6, 16.5]].map(([dx, y]) => `<circle cx="${20 + dx}" cy="${y}" r="2" fill="${PIP.ink}"/>`).join("");
  return `<svg class="stamp-svg is-done" viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true">` +
    `${shape} fill="${PIP.sun}" stroke="${PIP.accent}" stroke-width="5"/>` + foot + `</svg>`;
}
