"""
Runs a student's program and turns any error into something the web page
can explain in plain English.

The page receives a dictionary like:
  {"ok": True}
or
  {"ok": False, "type": "NameError", "msg": "...", "line": 3, "text": "  foward(100)",
   "suggestion": "forward", "kind": "name", "name": "foward", "hint": "...", "tb": "..."}
"""

import sys
import traceback
import difflib
import keyword
import builtins
import re
import turtle as _turtle

FILENAME = "my_turtle.py"

_KEYWORDS = [k for k in keyword.kwlist if k not in ("async", "await", "nonlocal", "yield", "assert", "del", "global", "lambda", "with", "as", "is", "raise", "try", "except", "finally", "pass", "class")]
_COMMON_BUILTINS = ["print", "range", "int", "str", "float", "len", "list", "input", "round", "abs", "min", "max", "sum"]
_TURTLE_NAMES = list(_turtle.__all__)
_ALL_KNOWN = sorted(set(_KEYWORDS + _COMMON_BUILTINS + _TURTLE_NAMES + ["random", "randint", "choice", "time", "sleep", "math"]))


def _unsupported_input(*a, **k):
    err = RuntimeError("input() doesn't work in the playground yet. Try it in Thonny!")
    err.playground_kind = "unsupported"
    raise err


def _student_line(tb):
    """Find the last line number that belongs to the student's own file."""
    line = None
    for frame in traceback.extract_tb(tb):
        if frame.filename == FILENAME:
            line = frame.lineno
    return line


def _line_text(code, lineno):
    if lineno is None:
        return ""
    lines = code.split("\n")
    if 1 <= lineno <= len(lines):
        return lines[lineno - 1]
    return ""


def _close(name, candidates, cutoff=0.72):
    m = difflib.get_close_matches(name, candidates, n=1, cutoff=cutoff)
    return m[0] if m else None


def _uses_turtle_import(code):
    return re.search(r"^\s*(from\s+turtle\s+import|import\s+turtle)", code, re.M) is not None


def _syntax_error(e, code):
    lineno = e.lineno
    text = (e.text or _line_text(code, lineno)).rstrip("\n")
    result = {
        "ok": False, "type": type(e).__name__, "msg": e.msg or "", "line": lineno,
        "col": e.offset, "text": text, "kind": "syntax", "suggestion": None, "tb": "".join(traceback.format_exception_only(type(e), e)),
    }
    # Look for misspelt keywords / commands on the offending line.
    words = re.findall(r"[A-Za-z_]\w*", text)
    for w in words:
        if w in _ALL_KNOWN:
            continue
        guess = _close(w, _KEYWORDS + _COMMON_BUILTINS, cutoff=0.75)
        # "fro i in range(4):" is a mangled for, not a mangled from
        if guess in ("from", "for") and re.search(r"\bin\b", text):
            guess = "for"
        if guess and guess != w:
            result["suggestion"] = guess
            result["name"] = w
            result["kind"] = "misspelt_keyword"
            break
    # Detect "for i in range(4)" missing colon etc. is handled by the page using msg.
    return result


def _runtime_error(e, code):
    tb = e.__traceback__
    lineno = _student_line(tb)
    text = _line_text(code, lineno)
    result = {
        "ok": False, "type": type(e).__name__, "msg": str(e), "line": lineno, "text": text,
        "kind": getattr(e, "playground_kind", None), "suggestion": getattr(e, "playground_suggestion", None),
        "tb": "".join(traceback.format_exception(type(e), e, tb)),
    }
    if isinstance(e, NameError) and result["kind"] is None:
        name = getattr(e, "name", None)
        if name is None:
            m = re.search(r"name '([^']+)'", str(e))
            name = m.group(1) if m else None
        result["name"] = name
        if name:
            if name in _TURTLE_NAMES and not _uses_turtle_import(code):
                result["kind"] = "missing_import"
            elif name in _TURTLE_NAMES and re.search(r"^\s*import\s+turtle", code, re.M):
                result["kind"] = "needs_turtle_dot"
            else:
                result["kind"] = "name"
                candidates = [c for c in _ALL_KNOWN + list(_user_names(code)) if c != name]
                result["suggestion"] = _close(name, candidates)
    elif isinstance(e, AttributeError) and result["kind"] is None:
        m = re.search(r"has no attribute '([^']+)'", str(e))
        attr = m.group(1) if m else None
        result["name"] = attr
        if "module 'turtle'" in str(e) and attr:
            result["kind"] = "turtle_attr"
            result["suggestion"] = _close(attr, _TURTLE_NAMES)
        elif "'Turtle' object" in str(e) and attr:
            result["kind"] = "turtle_attr"
            result["suggestion"] = _close(attr, _TURTLE_NAMES)
        else:
            result["kind"] = "attr"
    elif isinstance(e, TypeError) and result["kind"] is None:
        msg = str(e)
        m = re.match(r"(?:\w+\.)?(\w+)\(\) missing (\d+) required positional argument", msg)
        if m:
            result["kind"] = "missing_arg"
            result["name"] = m.group(1)
        m = re.match(r"(?:\w+\.)?(\w+)\(\) takes (\d+) positional arguments? but (\d+) (?:was|were) given", msg)
        if m:
            result["kind"] = "too_many_args"
            result["name"] = m.group(1)
            # method calls count 'self'; module-level wrappers don't, so just report
            result["expected"] = int(m.group(2))
            result["given"] = int(m.group(3))
        if "not callable" in msg:
            result["kind"] = "not_callable"
        if "unsupported operand" in msg or "can only concatenate" in msg or "must be str, not" in msg:
            result["kind"] = "mixed_types"
        if "object is not iterable" in msg:
            result["kind"] = "not_iterable"
    return result


def _user_names(code):
    names = set()
    for m in re.finditer(r"^\s*(?:def\s+([A-Za-z_]\w*)\s*\(|([A-Za-z_]\w*)\s*=[^=])", code, re.M):
        names.add(m.group(1) or m.group(2))
    return names


def run(code):
    _turtle._reset_all()
    try:
        compiled = compile(code, FILENAME, "exec")
    except SyntaxError as e:          # includes IndentationError, TabError
        return _syntax_error(e, code)
    g = {"__name__": "__main__", "__builtins__": builtins}
    builtins.input = _unsupported_input
    try:
        exec(compiled, g)
    except BaseException as e:        # noqa: BLE001 - we want everything
        _turtle._flush()
        return _runtime_error(e, code)
    _turtle._flush()
    return {"ok": True}
