/* Web worker: loads Pyodide and runs student code away from the page,
   so a runaway loop can be stopped by terminating the worker. */

let pyodide = null;
let runner = null;

self.emitCommands = (json) => self.postMessage({ type: "cmds", json });

async function init(cfg) {
  try {
    importScripts(cfg.pyodideURL + "pyodide.js");
    self.postMessage({ type: "status", text: "Loading Python…" });
    pyodide = await loadPyodide({ indexURL: cfg.pyodideURL });
    pyodide.setStdout({ batched: (s) => self.postMessage({ type: "stdout", text: s }) });
    pyodide.setStderr({ batched: (s) => self.postMessage({ type: "stderr", text: s }) });

    const [turtleSrc, runnerSrc] = await Promise.all([
      fetch(cfg.base + "py/turtle.py").then((r) => r.text()),
      fetch(cfg.base + "py/runner.py").then((r) => r.text()),
    ]);
    pyodide.FS.writeFile("/home/pyodide/turtle.py", turtleSrc);
    pyodide.FS.writeFile("/home/pyodide/playground_runner.py", runnerSrc);
    pyodide.runPython(`
import sys, importlib
sys.path.insert(0, "/home/pyodide")
sys.modules.pop("turtle", None)
import turtle
import playground_runner
from js import emitCommands
turtle._set_post(emitCommands)
`);
    runner = pyodide.pyimport("playground_runner");
    self.postMessage({ type: "ready", version: pyodide.version });
  } catch (err) {
    self.postMessage({ type: "fatal", text: String(err && err.message || err) });
  }
}

function run(code, runId) {
  if (!runner) return;
  let result;
  try {
    const r = runner.run(code);
    result = r.toJs({ dict_converter: Object.fromEntries });
    r.destroy();
  } catch (err) {
    result = { ok: false, type: "InternalError", msg: String(err), kind: "internal" };
  }
  self.postMessage({ type: "done", runId, result });
}

self.onmessage = (ev) => {
  const m = ev.data;
  if (m.type === "init") init(m.cfg);
  else if (m.type === "run") run(m.code, m.runId);
};
