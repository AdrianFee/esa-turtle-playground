/* Turns a Python error report (from py/runner.py) into a plain-English
   explanation for an 8 to 12 year old. */

function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

function code(s) { return `<code>${esc(s)}</code>`; }

export function explainError(r) {
  const out = { title: "Something went wrong", lines: [], line: r.line, pyName: r.type, raw: r.tb || `${r.type}: ${r.msg}` };
  const L = out.lines;
  const msg = r.msg || "";
  const text = (r.text || "").trim();
  const where = r.line ? ` on line ${r.line}` : "";

  // ---- Errors we made friendly in Python already ----
  if (r.kind === "colour") {
    out.title = "Unknown colour";
    L.push(esc(msg));
    L.push(`Colours go in quotes, like ${code('"red"')} or ${code('"sky blue"')}. Click a colour swatch in the toolbox to see some names.`);
    return out;
  }
  if (r.kind === "argtype" || r.kind === "argvalue") {
    out.title = "That command needs something different inside the brackets";
    L.push(esc(msg));
    return out;
  }
  if (r.kind === "unsupported") {
    out.title = "Not in the playground";
    L.push(esc(msg));
    return out;
  }

  // ---- Syntax errors ----
  if (r.type === "IndentationError" || r.type === "TabError") {
    out.title = "Indentation problem" + where;
    if (/expected an indented block/.test(msg)) {
      L.push(`The line before line ${r.line} ends with a colon ${code(":")}, so the next line must be pushed in by 4 spaces.`);
      L.push(`Press <b>Tab</b> at the start of the line to indent it. Everything indented under a ${code("for")} runs each time round the loop.`);
    } else if (/unexpected indent/.test(msg)) {
      L.push(`Line ${r.line} is pushed in (indented) but it shouldn't be.`);
      L.push(`Only indent lines that belong inside a ${code("for")}, ${code("if")} or ${code("def")}. Delete the spaces at the start of the line.`);
    } else if (/unindent does not match/.test(msg)) {
      L.push(`The spaces at the start of line ${r.line} don't line up with the lines above it.`);
      L.push(`Lines inside the same block must all start in the same column. Use the Tab key, not the space bar.`);
    } else {
      L.push(esc(msg));
      L.push("Check the spaces at the start of each line. Lines inside a loop should all line up.");
    }
    return out;
  }

  if (r.type === "SyntaxError") {
    out.title = "Python couldn't read line " + (r.line ?? "?");
    if (r.kind === "misspelt_keyword" && r.suggestion) {
      L.push(`Is ${code(r.name)} meant to be ${code(r.suggestion)}? Python only understands exact spellings.`);
    } else if (/was never closed/.test(msg)) {
      const m = msg.match(/'(.)'/);
      const open = m ? m[1] : "(";
      const close = { "(": ")", "[": "]", "{": "}" }[open] || ")";
      L.push(`You opened a ${code(open)} but never closed it. Every ${code(open)} needs a matching ${code(close)}.`);
      L.push(`Count the brackets on that line: ${code(text)}`);
    } else if (/unmatched '(.)'/.test(msg)) {
      const m = msg.match(/unmatched '(.)'/);
      L.push(`There's an extra ${code(m[1])} that doesn't match anything. Take one away.`);
    } else if (/expected ':'/.test(msg)) {
      L.push(`Lines that start a ${code("for")}, ${code("if")}, ${code("while")} or ${code("def")} must end with a colon ${code(":")}.`);
      L.push(`For example: ${code("for i in range(4):")}`);
    } else if (/unterminated string/.test(msg) || /EOL while scanning/.test(msg)) {
      L.push(`A piece of text (a string) was started with a quote but never finished. Every opening ${code('"')} needs a closing ${code('"')}.`);
      L.push(`For example: ${code('color("red")')}`);
    } else if (/invalid decimal literal/.test(msg)) {
      L.push(`There's a number stuck to a word, like ${code("100forward")}. Numbers go inside brackets: ${code("forward(100)")}.`);
    } else if (/cannot assign|invalid syntax. Maybe you meant '=='|Maybe you meant '=='/.test(msg)) {
      L.push(`To compare two things use two equals signs ${code("==")}. One ${code("=")} means "store this in a variable".`);
    } else if (/Perhaps you forgot a comma/.test(msg)) {
      L.push(`Two things are next to each other with nothing between them. Did you forget a comma, or a bracket?`);
    } else if (/invalid character/.test(msg)) {
      L.push(`There's a strange character on that line, maybe a curly quote ${code("“")} copied from somewhere. Retype it with a normal ${code('"')} quote.`);
    } else if (/expected '\('/.test(msg)) {
      L.push(`After ${code("def")} and the function's name you need brackets: ${code("def square():")}`);
    } else if (/unexpected EOF|incomplete input/.test(msg)) {
      L.push(`The program ended too early. Did you leave a bracket open, or write a ${code("for")} with nothing inside it?`);
    } else {
      L.push(`Python got confused by: ${code(text || "(empty line)")}`);
      L.push(`Check for missing brackets ${code("()")}, missing quotes ${code('""')}, a missing colon ${code(":")}, or a misspelt word.`);
    }
    return out;
  }

  // ---- Name errors ----
  if (r.type === "NameError") {
    out.title = `Python doesn't know the word ${esc(r.name || "")}`.trim() + where;
    if (r.kind === "missing_import") {
      L.push(`${code(r.name)} is a turtle command, but you haven't told Python to load the turtle. Add this as the very first line:`);
      L.push(code("from turtle import *"));
    } else if (r.kind === "needs_turtle_dot") {
      L.push(`You wrote ${code("import turtle")}, so every command needs ${code("turtle.")} in front, like ${code("turtle." + r.name + "(...)")}.`);
      L.push(`Or change the first line to ${code("from turtle import *")} and you can leave the ${code("turtle.")} off.`);
    } else if (r.suggestion) {
      L.push(`Did you mean ${code(r.suggestion)}? Python needs the exact spelling, and capital letters matter.`);
    } else if (/^[A-Z]/.test(r.name || "")) {
      L.push(`Turtle commands are all lower-case: ${code((r.name || "").toLowerCase())}.`);
    } else {
      L.push(`Check the spelling. If ${code(r.name)} is a variable, you need to give it a value first, like ${code(r.name + " = 100")}.`);
      L.push(`If it's meant to be text, put quotes around it: ${code('"' + r.name + '"')}.`);
    }
    return out;
  }

  if (r.type === "AttributeError") {
    out.title = "That's not a turtle command" + where;
    if (r.kind === "turtle_attr" && r.suggestion) {
      L.push(`There's no command called ${code(r.name)}. Did you mean ${code(r.suggestion)}?`);
    } else if (r.kind === "turtle_attr") {
      L.push(`There's no turtle command called ${code(r.name)}. Have a look at the toolbox for the ones that exist.`);
    } else {
      L.push(esc(msg));
    }
    return out;
  }

  // ---- Type errors ----
  if (r.type === "TypeError") {
    out.title = "A command was given the wrong thing" + where;
    if (r.kind === "missing_arg") {
      L.push(`${code(r.name + "()")} needs something inside its brackets. For example ${code(exampleFor(r.name))}.`);
    } else if (r.kind === "too_many_args") {
      L.push(`${code(r.name + "()")} was given too many things inside its brackets. For example it should look like ${code(exampleFor(r.name))}.`);
    } else if (r.kind === "not_callable") {
      L.push(`You've put brackets after something that isn't a command. Maybe you used a command's name as a variable, like ${code("forward = 100")}?`);
      L.push(`Or you may have a number straight before a bracket, like ${code("4(")} instead of ${code("4 * (")}.`);
    } else if (r.kind === "mixed_types") {
      L.push(`You can't add text and numbers together. ${code('"5"')} (with quotes) is text, ${code("5")} is a number.`);
      L.push(`To print both use a comma: ${code('print("Score:", score)')}`);
    } else if (r.kind === "not_iterable") {
      L.push(`A ${code("for")} loop needs something to count through. To repeat 4 times write ${code("for i in range(4):")}.`);
    } else {
      L.push(esc(msg));
    }
    return out;
  }

  if (r.type === "ZeroDivisionError") {
    out.title = "Dividing by zero" + where;
    L.push("You can't divide a number by 0. Check your sums.");
    return out;
  }
  if (r.type === "RecursionError") {
    out.title = "A function is calling itself forever";
    L.push("A function that calls itself needs a way to stop. Check which function is calling itself.");
    return out;
  }
  if (r.type === "ValueError") {
    out.title = "Bad value" + where;
    L.push(esc(msg));
    return out;
  }
  if (r.type === "ModuleNotFoundError" || r.type === "ImportError") {
    const m = msg.match(/No module named '([^']+)'/);
    out.title = "Can't find that module";
    if (m) {
      L.push(`There's no module called ${code(m[1])}. The turtle one is spelt ${code("turtle")}: ${code("from turtle import *")}`);
    } else {
      L.push(esc(msg));
    }
    return out;
  }
  if (r.type === "InternalError") {
    out.title = "The playground hiccupped";
    L.push("Something went wrong inside the playground itself, not in your code. Press Run again. If it keeps happening, tell your teacher.");
    L.push(esc(msg));
    return out;
  }

  out.title = `${esc(r.type)}${where}`;
  L.push(esc(msg));
  return out;
}

function exampleFor(name) {
  const ex = {
    forward: "forward(100)", fd: "fd(100)", backward: "backward(50)", bk: "bk(50)", back: "back(50)",
    left: "left(90)", lt: "lt(90)", right: "right(90)", rt: "rt(90)", goto: "goto(100, 50)",
    circle: "circle(50)", dot: "dot(20)", pensize: "pensize(5)", pencolor: 'pencolor("red")',
    fillcolor: 'fillcolor("blue")', color: 'color("green")', bgcolor: 'bgcolor("black")',
    speed: "speed(10)", setheading: "setheading(90)", write: 'write("Hello")', shape: 'shape("turtle")',
    setx: "setx(50)", sety: "sety(50)", pencolour: 'pencolour("red")', colour: 'colour("red")',
  };
  return ex[name] || `${name}(...)`;
}
