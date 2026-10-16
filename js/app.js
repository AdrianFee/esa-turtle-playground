/* ESA Turtle Playground: main application. */
import { TurtleCanvas } from "./canvas.js";
import { explainError } from "./errors.js";
import { PALETTE, SWATCHES } from "./palette.js";

const PYODIDE_VERSION = "0.28.3";
const CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const BASE = new URL(".", location.href).href;
const MASCOT_NAME = "Pip";  // placeholder: the club will choose the turtle's name
const IS_MAC = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
const NARROW = window.matchMedia("(max-width: 1340px)");
const PHONE = window.matchMedia("(max-width: 760px)");

const $ = (sel) => document.querySelector(sel);
const LESSONS = window.LESSONS || [];
const CHALLENGES = window.CHALLENGES || [];
const ALL = [...LESSONS, ...CHALLENGES];

// ---------------------------------------------------------------- storage
const store = {
  get(k, d) { try { const v = localStorage.getItem("tp." + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("tp." + k, JSON.stringify(v)); } catch { /* ignore */ } },
};

// ---------------------------------------------------------------- state
let current = null;          // current lesson object
let worker = null;
let pyReady = false;
let runId = 0;
let running = false;
let cmdLog = [];
let hintIndex = 0;
let turbo = false;
let errorLine = null;

// ---------------------------------------------------------------- editor
const editor = CodeMirror.fromTextArea($("#code"), {
  mode: "python",
  lineNumbers: true,
  indentUnit: 4,
  tabSize: 4,
  indentWithTabs: false,
  matchBrackets: true,
  autoCloseBrackets: true,
  styleActiveLine: true,
  lineWrapping: true,
  extraKeys: {
    Tab: (cm) => {
      if (cm.somethingSelected()) cm.indentSelection("add");
      else cm.replaceSelection("    ", "end");
    },
    "Shift-Tab": (cm) => cm.indentSelection("subtract"),
    "Ctrl-Enter": () => run(),
    "Cmd-Enter": () => run(),
  },
});
editor.on("change", () => {
  if (current) store.set("code." + current.id, editor.getValue());
  clearErrorLine();
});

function clearErrorLine() {
  if (errorLine != null) {
    editor.removeLineClass(errorLine, "background", "cm-error-line");
    editor.removeLineClass(errorLine, "gutter", "cm-error-gutter");
    errorLine = null;
  }
}

function markErrorLine(n) {
  clearErrorLine();
  if (!n || n < 1) return;
  errorLine = n - 1;
  editor.addLineClass(errorLine, "background", "cm-error-line");
  editor.addLineClass(errorLine, "gutter", "cm-error-gutter");
  editor.scrollIntoView({ line: errorLine, ch: 0 }, 80);
}

function insertSnippet(snippet, block) {
  const cur = editor.getCursor();
  const lineText = editor.getLine(cur.line);
  const indent = (lineText.match(/^\s*/) || [""])[0];
  const lineHasContent = lineText.trim().length > 0;
  if (block) {
    const text = snippet.split("\n").map((l, i) => (l.length ? (i === 0 ? "" : indent) + l : l)).join("\n");
    if (lineHasContent) {
      editor.replaceRange("\n" + indent + text, { line: cur.line, ch: lineText.length });
    } else {
      editor.replaceRange(text, { line: cur.line, ch: 0 }, { line: cur.line, ch: lineText.length });
    }
  } else if (lineHasContent && cur.ch >= lineText.trimEnd().length) {
    editor.replaceRange("\n" + indent + snippet, { line: cur.line, ch: lineText.length });
  } else {
    editor.replaceSelection(snippet, "end");
  }
  editor.focus();
}

// ---------------------------------------------------------------- canvas
const canvas = new TurtleCanvas($("#canvas"), {
  width: 640, height: 480,
  onIdle: () => setRunning(false),
  onTitle: (t) => { $("#canvasTitle").textContent = t || "Drawing"; },
});

// ---------------------------------------------------------------- worker
async function pickPyodideURL() {
  if (window.PYODIDE_LOCAL) return BASE + "vendor/pyodide/";
  return CDN;
}

async function startWorker() {
  pyReady = false;
  setStatus("loading", "Loading…");
  const pyodideURL = await pickPyodideURL();
  worker = new Worker(BASE + "js/worker.js");
  worker.onmessage = onWorkerMessage;
  worker.onerror = (e) => setStatus("error", "Python failed to load: " + (e.message || "unknown error"));
  worker.postMessage({ type: "init", cfg: { pyodideURL, base: BASE } });
}

function onWorkerMessage(ev) {
  const m = ev.data;
  switch (m.type) {
    case "status": setStatus("loading", m.text); break;
    case "ready":
      pyReady = true;
      $("#status").title = `Pyodide ${m.version}`;
      setStatus("ready", "Ready to code");
      $("#run").disabled = false;
      break;
    case "fatal":
      setStatus("error", "Python couldn't load. Check the internet connection, then refresh the page. (" + m.text + ")");
      break;
    case "cmds": {
      if (m.runId !== undefined && m.runId !== runId) break;
      const cmds = JSON.parse(m.json);
      for (const c of cmds) cmdLog.push(c);
      canvas.push(cmds);
      break;
    }
    case "stdout": appendOutput(m.text, "out"); break;
    case "stderr": appendOutput(m.text, "err"); break;
    case "done":
      if (m.runId !== runId) break;
      canvas.programFinished();
      if (m.result.ok) {
        if (!cmdLog.length && !$("#output").textContent.trim()) {
          showNotice("It ran, but nothing was drawn or printed. Try adding a turtle command, like forward(100).");
        } else {
          runChecks();
        }
      } else {
        showError(m.result);
      }
      if (!canvas.running) setRunning(false);
      break;
  }
}

function setStatus(kind, text) {
  const el = $("#status");
  el.dataset.kind = kind;
  el.textContent = text;
}

// ---------------------------------------------------------------- running
function run() {
  if (!pyReady || running) return;
  const code = editor.getValue();
  runId += 1;
  cmdLog = [];
  clearErrorLine();
  clearOutput();
  hideResult();
  canvas.reset();
  canvas.turbo = turbo;
  canvas.programStarted();
  setRunning(true);
  worker.postMessage({ type: "run", code, runId });
}

function stop() {
  if (!running) return;
  runId += 1;
  canvas.halt();
  if (worker) worker.terminate();
  setRunning(false);
  appendOutput("Stopped.\n", "note");
  $("#run").disabled = true;
  startWorker();
}

function setRunning(v) {
  running = v;
  $("#run").classList.toggle("is-running", v);
  $("#run").disabled = v || !pyReady;
  $("#stop").disabled = !v;
  if (v) setStatus("running", "Running…");
  else if (pyReady) setStatus("ready", "Ready to code");
}

// ---------------------------------------------------------------- output panel
function clearOutput() {
  $("#output").textContent = "";
  $("#errorBox").hidden = true;
  $("#errorBox").innerHTML = "";
}

function appendOutput(text, cls) {
  const out = $("#output");
  const span = document.createElement("span");
  span.className = cls;
  span.textContent = text;
  out.appendChild(span);
  out.scrollTop = out.scrollHeight;
}

function showError(r) {
  const e = explainError(r);
  const box = $("#errorBox");
  box.hidden = false;
  box.classList.remove("notice");
  box.innerHTML = `
    <div class="err-title">${e.title}</div>
    ${e.lines.map((l) => `<p>${l}</p>`).join("")}
    ${r.text ? `<pre class="err-code">${r.line ? `<span class="ln">${r.line}</span>` : ""}${escapeHtml(r.text)}</pre>` : ""}
    <details><summary>Python's own words: <code>${escapeHtml(r.type)}</code></summary><pre>${escapeHtml(e.raw)}</pre></details>`;
  markErrorLine(r.line);
}

function showNotice(text) {
  const box = $("#errorBox");
  box.hidden = false;
  box.classList.add("notice");
  box.innerHTML = `<div class="err-title">${escapeHtml(text)}</div>`;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

// ---------------------------------------------------------------- lesson checks
function stats() {
  const lines = [], turns = [], colours = new Set();
  let fills = 0, bg = false, penupMoves = 0, dots = 0, circles = 0;
  for (const c of cmdLog) {
    if (c.t === "m") {
      if (c.circ) continue;
      if (c.pen) { lines.push(Math.hypot(c.x1 - c.x0, c.y1 - c.y0)); colours.add(c.c); }
      else penupMoves++;
    } else if (c.t === "r" && !c.circ) {
      turns.push(Math.abs(c.da));
    } else if (c.t === "f" && c.pts.length >= 3) fills++;
    else if (c.t === "bg") bg = true;
    else if (c.t === "d") dots++;
    else if (c.t === "circ") circles++;
  }
  return { lines, turns, colours, fills, bg, penupMoves, dots, circles };
}

function evaluateCheck(ch, code, s) {
  switch (ch.type) {
    case "code_has": return new RegExp(ch.pattern, "m").test(code);
    case "moves_min": return s.lines.length >= ch.n;
    case "turns": {
      const n = s.turns.filter((a) => Math.abs(a - ch.angle) < 0.6 || Math.abs((360 - a) - ch.angle) < 0.6).length;
      return n >= ch.min;
    }
    case "fills_min": return s.fills >= ch.n;
    case "colours_min": return s.colours.size >= ch.n;
    case "bg_changed": return s.bg;
    case "equal_sides": {
      const groups = new Map();
      for (const l of s.lines) { const k = Math.round(l * 2) / 2; groups.set(k, (groups.get(k) || 0) + 1); }
      return Math.max(0, ...groups.values()) >= ch.n;
    }
    case "function_defined": return /^\s*def\s+\w+\s*\(/m.test(code);
    case "penup_used": return s.penupMoves >= 1;
    case "dots_min": return s.dots >= ch.n;
    case "circles_min": return s.circles >= ch.n;
    default: return true;
  }
}

function runChecks() {
  if (!current || !current.checks) return;
  const code = editor.getValue();
  const s = stats();
  const failed = current.checks.find((ch) => !evaluateCheck(ch, code, s));
  const box = $("#checkResult");
  box.hidden = false;
  if (!failed) {
    box.className = "check pass";
    const done = new Set(store.get("done", []));
    const first = !done.has(current.id);
    done.add(current.id);
    store.set("done", [...done]);
    const next = nextLesson();
    box.innerHTML = `<div class="check-title">${first ? "That's it. Lesson done." : "Done again."}</div>
      <p>${escapeHtml(current.goal)}</p>
      ${next ? `<button class="btn btn-primary" id="nextBtn">Go to ${escapeHtml(lessonLabel(next))}</button>` : "<p>You've done the lot. Go back to Free draw and make something of your own.</p>"}`;
    const nb = $("#nextBtn");
    if (nb) nb.onclick = () => loadLesson(next.id);
    refreshLessonList();
    celebrate();
  } else {
    box.className = "check nudge";
    const canHint = current.hints && current.hints.length && (hintIndex < current.hints.length || current.solution);
    box.innerHTML = `<div class="check-title">It ran. Not finished yet.</div><p>${failed.fail}</p>
      ${canHint ? `<div class="check-actions"><button class="btn btn-small" id="nudgeHint">Give me a hint</button></div>` : ""}`;
    const nh = $("#nudgeHint");
    if (nh) nh.onclick = () => { if (hintIndex < current.hints.length) showHint(); else showSolution(); openLesson(true); };
  }
}

function hideResult() { $("#checkResult").hidden = true; }

function lessonLabel(l) {
  const i = LESSONS.indexOf(l);
  return i >= 0 ? `lesson ${i + 1}: ${l.title}` : `challenge: ${l.title}`;
}

function nextLesson() {
  const i = ALL.findIndex((l) => l.id === current.id);
  return ALL[i + 1] || null;
}

function celebrate() {
  // A short fountain of paper over the drawing, in the colours the student used.
  const layer = $("#confetti");
  layer.innerHTML = "";
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const s = stats();
  let colours = [...s.colours];
  for (const c of cmdLog) if (c.t === "f" && c.c) colours.push(c.c);
  colours = [...new Set(colours.filter((c) => c && !/^(white|#f{3,6})$/i.test(c)))];
  if (colours.length < 2) colours = ["#11704d", "#1b1a17", "#a4520e", "#7a3e9d"];

  const area = $("#canvas").getBoundingClientRect();
  const W = window.innerWidth, H = window.innerHeight, dpr = window.devicePixelRatio || 1;
  const cv = document.createElement("canvas");
  cv.width = W * dpr; cv.height = H * dpr;
  layer.appendChild(cv);
  const ctx = cv.getContext("2d");
  ctx.scale(dpr, dpr);

  const pieces = [];
  for (let i = 0; i < 90; i++) {
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.1;
    const sp = 420 + Math.random() * 420;
    pieces.push({
      x: area.left + area.width * (0.25 + Math.random() * 0.5), y: area.top + area.height,
      vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
      w: 6 + Math.random() * 6, h: 4 + Math.random() * 4,
      rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 14, wob: Math.random() * Math.PI * 2,
      c: colours[i % colours.length],
    });
  }
  const DUR = 2300, t0 = performance.now();
  let last = t0;
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    const t = now - t0;
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = t > DUR - 600 ? Math.max(0, (DUR - t) / 600) : 1;
    for (const p of pieces) {
      p.vy += 950 * dt;                       // gravity
      p.vx *= 1 - 1.8 * dt; p.vy *= 1 - 1.0 * dt;   // air drag
      p.wob += 7 * dt;
      p.x += (p.vx + Math.sin(p.wob) * 45) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, 0.25 + 0.75 * Math.abs(Math.cos(p.wob * 1.3)));  // tumbling
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (t < DUR) requestAnimationFrame(frame); else layer.innerHTML = "";
  }
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- lessons UI
function refreshLessonList() {
  const sel = $("#lessonSelect");
  const done = new Set(store.get("done", []));
  sel.innerHTML = "";
  const mk = (label, items) => {
    const g = document.createElement("optgroup");
    g.label = label;
    items.forEach((l, i) => {
      const o = document.createElement("option");
      o.value = l.id;
      o.textContent = `${label === "Lessons" ? i + 1 + ". " : ""}${l.title}${done.has(l.id) ? "  ✓" : ""}`;
      g.appendChild(o);
    });
    sel.appendChild(g);
  };
  mk("Lessons", LESSONS);
  mk("Challenges", CHALLENGES);
  if (current) sel.value = current.id;
  const n = ALL.filter((l) => done.has(l.id)).length;
  $("#progress").innerHTML = `<span class="long">${n} of ${ALL.length} stamped</span><span class="short">${n}/${ALL.length}</span>`;
  $("#progressBar").innerHTML = ALL.map((l) =>
    `<span class="stamp${done.has(l.id) ? " done" : ""}${CHALLENGES.includes(l) ? " challenge" : ""}" title="${escapeHtml(l.title)}"></span>`).join("");
}

function loadLesson(id, codeOverride) {
  const lesson = ALL.find((l) => l.id === id) || LESSONS[0];
  current = lesson;
  hintIndex = 0;
  store.set("last", lesson.id);
  const isChallenge = CHALLENGES.includes(lesson);
  $("#lessonKind").textContent = isChallenge ? "Challenge" : "";
  $("#lessonTitle").textContent = lesson.title;
  $("#lessonConcept").innerHTML = lesson.concept || "";
  $("#lessonConcept").hidden = !lesson.concept;
  $("#lessonGoal").innerHTML = lesson.goal;
  const steps = $("#lessonSteps");
  steps.innerHTML = (lesson.steps || []).map((s) => `<li>${s}</li>`).join("");
  steps.parentElement.hidden = !(lesson.steps && lesson.steps.length);
  $("#hintArea").innerHTML = "";
  $("#hintBtn").hidden = !(lesson.hints && lesson.hints.length);
  $("#hintBtn").textContent = "Give me a hint";
  $("#solutionBtn").hidden = true;
  hideResult();
  clearOutput();
  canvas.reset();
  const saved = store.get("code." + lesson.id, null);
  editor.setValue(codeOverride ?? saved ?? lesson.starter);
  editor.clearHistory();
  refreshLessonList();
  showTab(lesson.defaultToolboxTab || "move");
  if (NARROW.matches && !PHONE.matches) openLesson(true); else editor.focus();
}

function showHint() {
  if (!current.hints) return;
  if (hintIndex < current.hints.length) {
    const div = document.createElement("div");
    div.className = "hint";
    div.innerHTML = `<span class="hint-n">Hint ${hintIndex + 1}</span> ${current.hints[hintIndex]}`;
    $("#hintArea").appendChild(div);
    hintIndex++;
  }
  if (hintIndex >= current.hints.length) {
    $("#hintBtn").hidden = true;
    $("#solutionBtn").hidden = !current.solution;
  } else {
    $("#hintBtn").textContent = `Another hint (${current.hints.length - hintIndex} left)`;
  }
}

function showSolution() {
  const div = document.createElement("div");
  div.className = "hint solution";
  div.innerHTML = `<span class="hint-n">One way to do it</span><pre>${escapeHtml(current.solution)}</pre>
    <button class="btn btn-small" id="useSolution">Put this in my code</button>`;
  $("#hintArea").appendChild(div);
  $("#useSolution").onclick = () => { editor.setValue(current.solution); editor.focus(); };
  $("#solutionBtn").hidden = true;
}

// ---------------------------------------------------------------- palette
const TAB_KEYS = [...PALETTE.map((g) => g.colour), "colours"];

function showTab(key) {
  if (!TAB_KEYS.includes(key)) key = "move";
  for (const t of document.querySelectorAll(".pal-tab")) t.setAttribute("aria-selected", String(t.dataset.tab === key));
  for (const g of document.querySelectorAll(".pal-group")) g.classList.toggle("is-active", g.dataset.tab === key);
  store.set("tab", key);
}

function buildPalette() {
  const root = $("#palette");
  const help = (text) => { $("#palHelp").textContent = text; };
  const tabs = document.createElement("div");
  tabs.className = "pal-tabs";
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "Toolbox");
  const panels = document.createElement("div");
  panels.className = "pal-panels";
  const addTab = (key, label) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "pal-tab";
    b.dataset.tab = key;
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", "false");
    b.textContent = label;
    b.addEventListener("click", () => showTab(key));
    tabs.appendChild(b);
  };
  for (const group of PALETTE) {
    addTab(group.colour, group.group);
    const sec = document.createElement("div");
    sec.className = "pal-group pal-" + group.colour;
    sec.dataset.tab = group.colour;
    sec.setAttribute("role", "tabpanel");
    sec.innerHTML = `<h4>${group.group}</h4>`;
    const wrap = document.createElement("div");
    wrap.className = "pal-items";
    for (const it of group.items) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pal-item";
      b.textContent = it.label;
      b.title = it.help;
      b.addEventListener("click", () => { help(it.help); insertSnippet(it.snippet, it.block); });
      b.addEventListener("mouseenter", () => help(it.help));
      b.addEventListener("focus", () => help(it.help));
      wrap.appendChild(b);
    }
    sec.appendChild(wrap);
    panels.appendChild(sec);
  }
  addTab("colours", "Colours");
  const sw = document.createElement("div");
  sw.className = "pal-group pal-colours";
  sw.dataset.tab = "colours";
  sw.setAttribute("role", "tabpanel");
  sw.innerHTML = "<h4>Colours</h4>";
  const wrap = document.createElement("div");
  wrap.className = "swatches";
  for (const c of SWATCHES) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "swatch";
    b.style.background = c;
    b.title = c;
    b.setAttribute("aria-label", c);
    const text = `"${c}". Click to put the colour's name in your code.`;
    b.addEventListener("click", () => { help(text); editor.replaceSelection(`"${c}"`, "end"); editor.focus(); });
    b.addEventListener("mouseenter", () => help(text));
    b.addEventListener("focus", () => help(text));
    wrap.appendChild(b);
  }
  sw.appendChild(wrap);
  panels.appendChild(sw);
  root.appendChild(tabs);
  root.appendChild(panels);
  showTab(store.get("tab", "move"));
}

// ---------------------------------------------------------------- lesson drawer (narrow widths)
function openLesson(open) {
  document.body.classList.toggle("lesson-open", open);
  $("#lessonToggle").setAttribute("aria-expanded", String(open));
  if (open && NARROW.matches && !PHONE.matches) $("#lessonClose").focus();
}

/* The result banner lives in the lesson column at wide widths and above
   the editor at narrow widths, so "Done" and nudges are never hidden in
   a closed drawer. */
function placeResult() {
  const box = $("#checkResult");
  const slot = NARROW.matches && !PHONE.matches ? $("#resultWork") : $("#resultLesson");
  if (box.parentElement !== slot) slot.appendChild(box);
}

// ---------------------------------------------------------------- share / download
function downloadPy() {
  let code = editor.getValue();
  if (!/\b(done|mainloop|exitonclick)\s*\(\s*\)/.test(code)) code = code.replace(/\s*$/, "\n\ndone()\n");
  const header = `# Made in the ESA Turtle Playground\n# Open this file in Thonny and press Run.\n\n`;
  const blob = new Blob([header + code], { type: "text/x-python" });
  triggerDownload(URL.createObjectURL(blob), `${(current && current.id) || "turtle"}.py`);
}

function downloadPng() {
  triggerDownload(canvas.toDataURL(), `${(current && current.id) || "turtle"}.png`);
}

function triggerDownload(url, name) {
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
}

function encodeShare(code) {
  const bytes = new TextEncoder().encode(code);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeShare(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - b64.length % 4) % 4));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function share() {
  const url = `${location.origin}${location.pathname}#lesson=${current.id}&code=${encodeShare(editor.getValue())}`;
  try {
    await navigator.clipboard.writeText(url);
    flash($("#share"), "Link copied");
  } catch {
    prompt("Copy this link:", url);
  }
}

function flash(btn, text) {
  const old = btn.textContent;
  btn.textContent = text;
  setTimeout(() => { btn.textContent = old; }, 1600);
}

function readHash() {
  if (!location.hash.startsWith("#")) return null;
  const params = new URLSearchParams(location.hash.slice(1));
  if (!params.has("code")) return null;
  try {
    return { lesson: params.get("lesson") || "free", code: decodeShare(params.get("code")) };
  } catch { return null; }
}

// ---------------------------------------------------------------- wiring
function init() {
  buildPalette();
  $("#run").addEventListener("click", run);
  $("#stop").addEventListener("click", stop);
  $("#clearCanvas").addEventListener("click", () => { canvas.reset(); });
  $("#resetCode").addEventListener("click", () => {
    if (confirm("Start this lesson again with the starter code? Your changes will be lost.")) {
      editor.setValue(current.starter);
      editor.focus();
    }
  });
  $("#download").addEventListener("click", downloadPy);
  $("#savePng").addEventListener("click", downloadPng);
  $("#share").addEventListener("click", share);
  $("#turbo").addEventListener("click", () => {
    turbo = !turbo;
    canvas.turbo = turbo;
    $("#turbo").classList.toggle("is-on", turbo);
    $("#turbo").setAttribute("aria-pressed", String(turbo));
  });
  $("#hintBtn").addEventListener("click", showHint);
  $("#solutionBtn").addEventListener("click", showSolution);
  $("#lessonSelect").addEventListener("change", (e) => loadLesson(e.target.value));
  $("#fontUp").addEventListener("click", () => bumpFont(2));
  $("#fontDown").addEventListener("click", () => bumpFont(-2));
  $("#runKbd").textContent = IS_MAC ? "Cmd+Enter" : "Ctrl+Enter";
  $("#run").title = `Run your code (${IS_MAC ? "Cmd" : "Ctrl"}+Enter)`;
  $("#lessonToggle").addEventListener("click", () => openLesson(!document.body.classList.contains("lesson-open")));
  $("#lessonClose").addEventListener("click", () => { openLesson(false); editor.focus(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && document.body.classList.contains("lesson-open")) openLesson(false); });
  placeResult();
  NARROW.addEventListener("change", placeResult);
  PHONE.addEventListener("change", placeResult);

  const shared = readHash();
  if (shared) {
    loadLesson(shared.lesson, shared.code);
    history.replaceState(null, "", location.pathname);
  } else {
    loadLesson(store.get("last", LESSONS[0].id));
  }
  $("#run").disabled = true;
  startWorker();
}

function bumpFont(delta) {
  const el = document.querySelector(".CodeMirror");
  const cur = parseFloat(getComputedStyle(el).fontSize) || 16;
  const next = Math.min(28, Math.max(12, cur + delta));
  el.style.fontSize = next + "px";
  editor.refresh();
  store.set("font", next);
}

const savedFont = store.get("font", null);
if (savedFont) { document.querySelector(".CodeMirror").style.fontSize = savedFont + "px"; editor.refresh(); }

init();
