/* Lessons and challenges for the ESA Turtle Playground.
   To add a lesson, copy one of these objects and give it a new id.

   Check types (used to decide if a lesson is complete):
     code_has      { pattern }            regex the code must contain
     moves_min     { n }                  at least n pen-down lines drawn
     turns         { angle, min }         at least `min` turns of exactly `angle` degrees
     fills_min     { n }                  at least n filled shapes
     colours_min   { n }                  at least n different pen colours used in lines
     bg_changed    {}                     background colour changed
     equal_sides   { n }                  at least n pen-down lines of the same length
     function_defined {}                  code defines a function with def
     penup_used    {}                     at least one pen-up move
     dots_min      { n }
     circles_min   { n }                  circle() used n times
   Each check has a `fail` message shown if it isn't met.

   defaultToolboxTab: which toolbox tab opens with the lesson:
     move | pen | shape | loop | other | colours   (Move if missing)
*/

window.LESSONS = [
  {
    id: "hello",
    defaultToolboxTab: "move",
    title: "Hello, turtle",
    emoji: "🐢",
    concept: "Every turtle program starts with <code>from turtle import *</code>. That line wakes the turtle up. After that, each line is one command for the turtle.",
    goal: "Make the turtle draw a straight line.",
    steps: [
      "Press <b>Run</b> and watch what happens.",
      "Change <code>forward(100)</code> to <code>forward(200)</code>. Run it again. What changed?",
      "Add a second line: <code>backward(50)</code>.",
    ],
    starter: "from turtle import *\n\nforward(100)\n",
    hints: [
      "Each command goes on its own line. The brackets hold the number of steps.",
      "Remember: the first line <code>from turtle import *</code> must stay at the top.",
    ],
    solution: "from turtle import *\n\nforward(200)\nbackward(50)\n",
    checks: [
      { type: "code_has", pattern: "from\\s+turtle\\s+import\\s+\\*", fail: "Keep <code>from turtle import *</code> as the first line." },
      { type: "moves_min", n: 1, fail: "Use <code>forward(...)</code> to draw a line." },
      { type: "code_has", pattern: "backward\\s*\\(", fail: "Now add a <code>backward(50)</code> line." },
    ],
    notes: "First contact. Focus on Run, reading the output, and that each line is one instruction. Let them change the number and see the effect.",
  },
  {
    id: "turning",
    defaultToolboxTab: "move",
    title: "Turning corners",
    emoji: "↪️",
    concept: "<code>left(90)</code> and <code>right(90)</code> turn the turtle on the spot. The number is the angle in degrees. 90 is a square corner, 180 is a U-turn, 360 is a full spin.",
    goal: "Draw a letter L: a line going down, then a line going right.",
    steps: [
      "The turtle starts facing right. Turn it so it faces down (<code>right(90)</code>).",
      "Go forward to draw the tall part of the L.",
      "Turn left, then go forward to draw the bottom of the L.",
    ],
    starter: "from turtle import *\n\nright(90)\nforward(150)\n",
    hints: [
      "After going down, the turtle faces down. <code>left(90)</code> will make it face right.",
      "The whole thing is: <code>right(90)</code>, <code>forward(150)</code>, <code>left(90)</code>, <code>forward(100)</code>.",
    ],
    solution: "from turtle import *\n\nright(90)\nforward(150)\nleft(90)\nforward(100)\n",
    checks: [
      { type: "moves_min", n: 2, fail: "You need two lines: one down and one along." },
      { type: "turns", angle: 90, min: 2, fail: "Use <code>left(90)</code> or <code>right(90)</code> to turn a square corner twice." },
    ],
    notes: "Physical demo helps: stand up, face the window, turn right 90. Ask what left(90) then left(90) does.",
  },
  {
    id: "square",
    defaultToolboxTab: "move",
    title: "The square",
    emoji: "🟦",
    concept: "A square has 4 sides the same length and 4 corners of 90 degrees. So the turtle needs: forward, turn, forward, turn, forward, turn, forward, turn.",
    goal: "Draw a square with sides of 100.",
    steps: [
      "Write <code>forward(100)</code> then <code>right(90)</code>.",
      "Do that four times in total. Copying and pasting is fine.",
      "Run it. Does the turtle end up back where it started?",
    ],
    starter: "from turtle import *\n\nforward(100)\nright(90)\n",
    hints: [
      "You need 8 lines of commands: 4 forwards and 4 turns, taking it in turns.",
      "Copy the two lines you have and paste them three more times.",
    ],
    solution: "from turtle import *\n\nforward(100)\nright(90)\nforward(100)\nright(90)\nforward(100)\nright(90)\nforward(100)\nright(90)\n",
    checks: [
      { type: "equal_sides", n: 4, fail: "A square needs 4 lines that are all the same length." },
      { type: "turns", angle: 90, min: 3, fail: "Every corner of a square is a 90 degree turn." },
    ],
    notes: "Lots of repetition on purpose. It makes the for loop in lesson 6 feel like a relief.",
  },
  {
    id: "penup",
    defaultToolboxTab: "pen",
    title: "Pen up, pen down",
    emoji: "✏️",
    concept: "<code>penup()</code> lifts the pen off the paper so the turtle can move without drawing. <code>pendown()</code> puts it back.",
    goal: "Draw a dashed line: dash, gap, dash, gap, dash.",
    steps: [
      "Draw a dash with <code>forward(40)</code>.",
      "Lift the pen with <code>penup()</code>, move <code>forward(20)</code> for the gap, then <code>pendown()</code>.",
      "Repeat until you have 3 dashes.",
    ],
    starter: "from turtle import *\n\nforward(40)\npenup()\nforward(20)\npendown()\n",
    hints: [
      "After <code>pendown()</code> you can draw the next dash with <code>forward(40)</code>.",
      "The pattern is: forward, penup, forward, pendown, and then the same again.",
    ],
    solution: "from turtle import *\n\nforward(40)\npenup()\nforward(20)\npendown()\nforward(40)\npenup()\nforward(20)\npendown()\nforward(40)\n",
    checks: [
      { type: "penup_used", fail: "Use <code>penup()</code> before moving across a gap." },
      { type: "moves_min", n: 3, fail: "Draw at least 3 dashes." },
    ],
    notes: "Common bug: they forget pendown() and nothing appears. That's a good teachable moment, not a failure.",
  },
  {
    id: "colours",
    defaultToolboxTab: "colours",
    title: "Colours and thick pens",
    emoji: "🎨",
    concept: "<code>color(\"red\")</code> changes the pen colour. Colour names go inside quotes. <code>pensize(5)</code> makes the line thicker. Python spells it the American way: <b>color</b>, not colour.",
    goal: "Draw a thick square where every side is a different colour, on a dark background.",
    steps: [
      "Add <code>bgcolor(\"black\")</code> near the top.",
      "Add <code>pensize(8)</code>.",
      "Before each <code>forward(100)</code>, change the colour with <code>color(\"...\")</code>.",
    ],
    starter: "from turtle import *\n\nbgcolor(\"black\")\npensize(8)\n\ncolor(\"red\")\nforward(100)\nright(90)\n",
    hints: [
      "Click a colour swatch in the toolbox to put its name in your code.",
      "You need a <code>color(...)</code> line before each of the four sides.",
    ],
    solution: "from turtle import *\n\nbgcolor(\"black\")\npensize(8)\n\ncolor(\"red\")\nforward(100)\nright(90)\ncolor(\"yellow\")\nforward(100)\nright(90)\ncolor(\"lime\")\nforward(100)\nright(90)\ncolor(\"deepskyblue\")\nforward(100)\nright(90)\n",
    checks: [
      { type: "bg_changed", fail: "Change the background with <code>bgcolor(\"black\")</code>." },
      { type: "colours_min", n: 3, fail: "Use at least 3 different pen colours." },
      { type: "equal_sides", n: 4, fail: "Draw all 4 sides of the square." },
    ],
    notes: "Expect 'colour' spelled the British way. The error message will catch it. Also expect missing quotes: color(red).",
  },
  {
    id: "loops",
    defaultToolboxTab: "loop",
    title: "Loops",
    emoji: "🔁",
    concept: "Instead of writing the same lines four times, a <code>for</code> loop repeats them for you. The lines to repeat are pushed in by 4 spaces (indented). Python uses the indent to know what's inside the loop.<br><br><code>for i in range(4):</code><br>&nbsp;&nbsp;&nbsp;&nbsp;<code>forward(100)</code><br>&nbsp;&nbsp;&nbsp;&nbsp;<code>right(90)</code>",
    goal: "Draw a square using a for loop, with only 2 lines inside the loop.",
    steps: [
      "Type <code>for i in range(4):</code>. Don't forget the colon at the end.",
      "On the next line press Tab, then type <code>forward(100)</code>.",
      "Underneath, also indented, type <code>right(90)</code>.",
      "Run it. Then try changing 4 to 8 and 90 to 45. What shape do you get?",
    ],
    starter: "from turtle import *\n\nfor i in range(4):\n    \n",
    hints: [
      "The colon <code>:</code> at the end of the for line is essential.",
      "Both lines inside the loop must start with exactly 4 spaces. The editor does this for you if you press Tab.",
    ],
    solution: "from turtle import *\n\nfor i in range(4):\n    forward(100)\n    right(90)\n",
    checks: [
      { type: "code_has", pattern: "for\\s+\\w+\\s+in\\s+range\\s*\\(", fail: "Use a <code>for</code> loop with <code>range(...)</code>." },
      { type: "equal_sides", n: 4, fail: "The loop should draw 4 equal sides." },
      { type: "turns", angle: 90, min: 4, fail: "Turn 90 degrees inside the loop." },
    ],
    notes: "The big one. Indentation errors will be the main struggle. Insist on the Tab key, never the space bar.",
  },
  {
    id: "triangle",
    defaultToolboxTab: "loop",
    title: "Triangles and angles",
    emoji: "🔺",
    concept: "To draw a shape the turtle must turn a full 360 degrees in total by the time it gets back to the start. A square has 4 corners, so each turn is 360 ÷ 4 = 90. A triangle has 3 corners, so each turn is 360 ÷ 3 = 120.",
    goal: "Draw a triangle with a for loop.",
    steps: [
      "Start with your square loop.",
      "Change <code>range(4)</code> to <code>range(3)</code>.",
      "Change the turn to 120 degrees.",
    ],
    starter: "from turtle import *\n\nfor i in range(4):\n    forward(100)\n    right(90)\n",
    hints: [
      "360 divided by 3 is 120. The turtle turns 120, not 60.",
      "If you get a strange shape, check you changed both the 4 and the 90.",
    ],
    solution: "from turtle import *\n\nfor i in range(3):\n    forward(150)\n    right(120)\n",
    checks: [
      { type: "code_has", pattern: "range\\s*\\(\\s*3\\s*\\)", fail: "A triangle has 3 sides, so use <code>range(3)</code>." },
      { type: "turns", angle: 120, min: 3, fail: "Each corner of a triangle is a 120 degree turn (360 ÷ 3)." },
    ],
    notes: "Most will guess 60 degrees. Let them run it and see. The 'turtle must turn 360 in total' rule is worth saying out loud many times.",
  },
  {
    id: "fill",
    defaultToolboxTab: "shape",
    title: "Filling shapes",
    emoji: "🪣",
    concept: "To colour a shape in: choose a fill colour with <code>fillcolor(\"...\")</code>, call <code>begin_fill()</code>, draw the shape, then call <code>end_fill()</code>. Python fills it in when you call end_fill.",
    goal: "Draw a filled triangle and a filled circle.",
    steps: [
      "Put <code>begin_fill()</code> before the loop and <code>end_fill()</code> after it. Mind the indentation: end_fill is not inside the loop.",
      "Set a fill colour with <code>fillcolor(\"orange\")</code>.",
      "Lift the pen, move somewhere else, put the pen down, and draw a filled <code>circle(50)</code> too.",
    ],
    starter: "from turtle import *\n\nfillcolor(\"orange\")\nbegin_fill()\nfor i in range(3):\n    forward(120)\n    right(120)\n",
    hints: [
      "Nothing fills until you call <code>end_fill()</code>. Add it after the loop, not indented.",
      "For the circle: <code>penup()</code>, <code>goto(100, 0)</code>, <code>pendown()</code>, <code>begin_fill()</code>, <code>circle(50)</code>, <code>end_fill()</code>.",
    ],
    solution: "from turtle import *\n\nfillcolor(\"orange\")\nbegin_fill()\nfor i in range(3):\n    forward(120)\n    right(120)\nend_fill()\n\npenup()\ngoto(100, -100)\npendown()\nfillcolor(\"purple\")\nbegin_fill()\ncircle(50)\nend_fill()\n",
    checks: [
      { type: "code_has", pattern: "end_fill\\s*\\(", fail: "Add <code>end_fill()</code> after drawing the shape." },
      { type: "fills_min", n: 2, fail: "Draw two filled shapes: the triangle and a circle." },
    ],
    notes: "Classic bug: end_fill() indented inside the loop. It still works but fills triangles weirdly. Ask them to explain why.",
  },
  {
    id: "polygons",
    defaultToolboxTab: "loop",
    title: "Any shape you like",
    emoji: "⬡",
    concept: "A shape with <b>n</b> sides needs <b>n</b> turns of <b>360 ÷ n</b> degrees. We can store the number of sides in a <b>variable</b> and let Python do the division: <code>right(360 / sides)</code>.",
    goal: "Draw a hexagon (6 sides) using a variable called sides. Then change the variable to draw other shapes.",
    steps: [
      "Set <code>sides = 6</code> at the top.",
      "Use <code>range(sides)</code> in the loop.",
      "Turn by <code>360 / sides</code>.",
      "Try sides = 5, 8, 12, 36. What happens with a big number?",
    ],
    starter: "from turtle import *\n\nsides = 6\n\nfor i in range(sides):\n    forward(80)\n    right(90)\n",
    hints: [
      "Only the turn needs changing: <code>right(360 / sides)</code>.",
      "Python works out 360 / 6 = 60 for you.",
    ],
    solution: "from turtle import *\n\nsides = 6\n\nfor i in range(sides):\n    forward(80)\n    right(360 / sides)\n",
    checks: [
      { type: "code_has", pattern: "sides\\s*=\\s*\\d+", fail: "Make a variable: <code>sides = 6</code>." },
      { type: "code_has", pattern: "360\\s*/\\s*sides", fail: "Turn by <code>360 / sides</code>." },
      { type: "turns", angle: 60, min: 5, fail: "Set <code>sides = 6</code> to draw a hexagon first." },
    ],
    notes: "First real use of a variable and of arithmetic inside a bracket. A 36-sided shape looks like a circle: good discussion point.",
  },
  {
    id: "star",
    defaultToolboxTab: "loop",
    title: "Stars",
    emoji: "⭐",
    concept: "A 5-pointed star is 5 lines with a 144 degree turn after each one. The turtle spins round twice in total (5 × 144 = 720) which is what makes the lines cross over.",
    goal: "Draw a 5-pointed star, then make it a filled yellow star.",
    steps: [
      "Loop 5 times: forward, then <code>right(144)</code>.",
      "Add a fill colour and begin_fill / end_fill.",
      "Extra: hide the turtle at the end with <code>hideturtle()</code>.",
    ],
    starter: "from turtle import *\n\nfor i in range(5):\n    forward(150)\n    right(144)\n",
    hints: [
      "The star works with exactly 144. Try 150 or 100 and see what goes wrong.",
      "<code>begin_fill()</code> goes before the loop; <code>end_fill()</code> after it.",
    ],
    solution: "from turtle import *\n\ncolor(\"gold\")\nbegin_fill()\nfor i in range(5):\n    forward(150)\n    right(144)\nend_fill()\nhideturtle()\n",
    checks: [
      { type: "turns", angle: 144, min: 5, fail: "A 5-pointed star needs <code>right(144)</code> five times." },
      { type: "fills_min", n: 1, fail: "Fill the star in with begin_fill() and end_fill()." },
    ],
    notes: "144 feels like magic; the 720 explanation is for the ones who ask. Try 7-pointed stars (right(154.3)) with keen students.",
  },
  {
    id: "spiral",
    defaultToolboxTab: "loop",
    title: "Spirals",
    emoji: "🌀",
    concept: "The <code>i</code> in <code>for i in range(50):</code> is a variable that counts: 0, 1, 2, 3 ... up to 49. If you use <code>i</code> inside the loop, each time round is a little different. <code>forward(i * 5)</code> draws lines that get longer and longer.",
    goal: "Draw a square spiral that grows as it goes.",
    steps: [
      "Loop 50 times.",
      "Inside, use <code>forward(i * 5)</code> and <code>right(90)</code>.",
      "Try <code>right(91)</code> or <code>right(120)</code>. Try <code>speed(10)</code> to speed it up.",
    ],
    starter: "from turtle import *\n\nspeed(10)\n\nfor i in range(50):\n    forward(50)\n    right(90)\n",
    hints: [
      "The length of each line must depend on <code>i</code>, for example <code>forward(i * 5)</code>.",
      "Add <code>print(i)</code> inside the loop to see the counting in the output box.",
    ],
    solution: "from turtle import *\n\nspeed(10)\n\nfor i in range(50):\n    forward(i * 5)\n    right(90)\n",
    checks: [
      { type: "code_has", pattern: "forward\\s*\\(\\s*\\w+\\s*\\*", fail: "Use the loop variable inside forward, like <code>forward(i * 5)</code>." },
      { type: "moves_min", n: 30, fail: "Loop at least 30 times to see the spiral." },
    ],
    notes: "This is the first time the loop variable is used for something. print(i) in the loop helps make the counting visible.",
  },
  {
    id: "functions",
    defaultToolboxTab: "loop",
    title: "Make your own command",
    emoji: "🧩",
    concept: "A <b>function</b> is a command you invent. <code>def square(size):</code> starts one called square. The indented lines underneath are what it does. Afterwards <code>square(50)</code> runs those lines with size = 50.",
    goal: "Define a square function and use it to draw three squares of different sizes.",
    steps: [
      "Look at the function in the starter code. Run it. Nothing is drawn yet, because defining a function doesn't run it.",
      "Underneath (not indented) add <code>square(50)</code>.",
      "Add <code>square(100)</code> and <code>square(150)</code> too.",
    ],
    starter: "from turtle import *\n\ndef square(size):\n    for i in range(4):\n        forward(size)\n        right(90)\n\n",
    hints: [
      "Calling the function is just like using forward: write its name with a number in brackets.",
      "The calls go at the bottom, with no spaces at the start of the line.",
    ],
    solution: "from turtle import *\n\ndef square(size):\n    for i in range(4):\n        forward(size)\n        right(90)\n\nsquare(50)\nsquare(100)\nsquare(150)\n",
    checks: [
      { type: "function_defined", fail: "Keep the <code>def square(size):</code> function." },
      { type: "code_has", pattern: "^\\s*square\\s*\\(\\s*\\d+\\s*\\)", fail: "Call your function, e.g. <code>square(100)</code>, on a line with no indent." },
      { type: "moves_min", n: 12, fail: "Draw three squares (that's 12 lines)." },
    ],
    notes: "Two levels of indentation here. Draw the box diagram on the board: the def box contains the for box.",
  },
  {
    id: "flower",
    defaultToolboxTab: "shape",
    title: "Circles and flowers",
    emoji: "🌸",
    concept: "<code>circle(50)</code> draws a circle of radius 50. If you draw a circle, turn a little, draw another, and keep going all the way round, you get a flower.",
    goal: "Draw a flower out of 12 circles, then colour it in.",
    steps: [
      "Loop 12 times: <code>circle(60)</code> then <code>right(30)</code>. (12 × 30 = 360.)",
      "Add <code>speed(0)</code> at the top so it's instant.",
      "Use <code>color(...)</code> inside the loop to change colour every time. Can you use <code>i</code> to pick colours from a list?",
    ],
    starter: "from turtle import *\n\nspeed(0)\n\nfor i in range(12):\n    circle(60)\n    \n",
    hints: [
      "After each circle the turtle must turn: <code>right(30)</code>.",
      "A list of colours: <code>colours = [\"red\", \"orange\", \"yellow\"]</code> then <code>color(colours[i % 3])</code>.",
    ],
    solution: "from turtle import *\n\nspeed(0)\nbgcolor(\"black\")\ncolours = [\"red\", \"orange\", \"yellow\", \"lime\", \"cyan\", \"magenta\"]\n\nfor i in range(12):\n    color(colours[i % 6])\n    circle(60)\n    right(30)\nhideturtle()\n",
    checks: [
      { type: "circles_min", n: 6, fail: "Draw at least 6 circles with <code>circle(...)</code> in a loop." },
      { type: "turns", angle: 30, min: 6, fail: "Turn <code>right(30)</code> after each circle." },
    ],
    notes: "Lists and the % operator are stretch content; only the solution uses them. The core goal is the circle-and-turn loop.",
  },
  {
    id: "free",
    defaultToolboxTab: "move",
    title: "Free draw",
    emoji: "🖼️",
    concept: "You know enough now to draw anything. Use the toolbox to remind yourself of the commands. Save your picture with the <b>Download .py</b> button and open it in Thonny at home.",
    goal: "Draw whatever you like. When you're ready, try a challenge.",
    steps: [
      "Plan your picture on paper first.",
      "Use functions for parts you draw more than once.",
      "Use penup() and goto() to move between parts.",
    ],
    starter: "from turtle import *\n\nspeed(10)\n\n# Your drawing here\n",
    hints: ["There's no wrong answer here. Try combining shapes from earlier lessons."],
    solution: "from turtle import *\n\nspeed(0)\nbgcolor(\"midnightblue\")\n\ndef star(size, colour):\n    color(colour)\n    begin_fill()\n    for i in range(5):\n        forward(size)\n        right(144)\n    end_fill()\n\nimport random\nfor i in range(20):\n    penup()\n    goto(random.randint(-300, 300), random.randint(-220, 220))\n    pendown()\n    star(random.randint(5, 25), \"gold\")\nhideturtle()\n",
    checks: [
      { type: "moves_min", n: 5, fail: "Draw something with at least 5 lines." },
    ],
    notes: "Open ended. The solution shows random positions, which is a nice reveal for keen students.",
  },
];

window.CHALLENGES = [
  {
    id: "house",
    defaultToolboxTab: "shape",
    title: "House",
    emoji: "🏠",
    goal: "Draw a house: a square with a triangle roof on top. Extra: a door and a window.",
    starter: "from turtle import *\n\n# A square for the walls, a triangle for the roof\n",
    hints: [
      "Draw the square first. When the turtle finishes the square it is back at the bottom-left corner.",
      "Move up to the top-left corner (turn left, forward the side length), then turn right 30 degrees, and draw a triangle with 120 degree turns.",
    ],
    solution: "from turtle import *\n\nspeed(10)\nsize = 150\n\n# walls\nfillcolor(\"wheat\")\nbegin_fill()\nfor i in range(4):\n    forward(size)\n    left(90)\nend_fill()\n\n# roof\nleft(90)\nforward(size)\nright(30)\nfillcolor(\"firebrick\")\nbegin_fill()\nfor i in range(3):\n    forward(size)\n    right(120)\nend_fill()\n\n# door\npenup()\ngoto(60, 0)\npendown()\nsetheading(90)\nfillcolor(\"saddlebrown\")\nbegin_fill()\nforward(60)\nright(90)\nforward(30)\nright(90)\nforward(60)\nend_fill()\nhideturtle()\n",
    checks: [
      { type: "equal_sides", n: 4, fail: "Start with a square for the walls." },
      { type: "turns", angle: 120, min: 2, fail: "The roof is a triangle: 120 degree turns." },
    ],
  },
  {
    id: "rainbow",
    defaultToolboxTab: "shape",
    title: "Rainbow",
    emoji: "🌈",
    goal: "Draw a rainbow using half circles of different colours.",
    starter: "from turtle import *\n\nspeed(0)\npensize(15)\n\n# circle(100, 180) draws half a circle\n",
    hints: [
      "<code>circle(100, 180)</code> draws half a circle. Start with the turtle facing up (<code>setheading(90)</code>) and standing at the right-hand end.",
      "Each colour needs a smaller radius. Use a list of colours and a loop; move the starting point in by the same amount each time.",
    ],
    solution: "from turtle import *\n\nspeed(0)\npensize(15)\ncolours = [\"red\", \"orange\", \"yellow\", \"green\", \"blue\", \"indigo\", \"violet\"]\nradius = 200\n\nfor c in colours:\n    color(c)\n    penup()\n    goto(radius, -50)\n    setheading(90)\n    pendown()\n    circle(radius, 180)\n    radius = radius - 15\nhideturtle()\n",
    checks: [
      { type: "circles_min", n: 5, fail: "Draw at least 5 arcs with circle(...)." },
      { type: "colours_min", n: 5, fail: "Use at least 5 colours." },
    ],
  },
  {
    id: "initials",
    defaultToolboxTab: "move",
    title: "Your initials",
    emoji: "🔤",
    goal: "Write your initials in big letters using lines. Use penup() and goto() to jump between letters.",
    starter: "from turtle import *\n\npensize(6)\n\n# first letter\n",
    hints: [
      "Plan each letter on squared paper. Work out which corners it needs.",
      "<code>goto(x, y)</code> jumps to exact spots. Use <code>setheading(90)</code> to face straight up before each stroke.",
    ],
    solution: "from turtle import *\n\npensize(6)\nspeed(10)\n\n# E\npenup()\ngoto(-150, -50)\npendown()\nsetheading(90)\nforward(100)\nright(90)\nforward(60)\npenup()\ngoto(-150, 0)\npendown()\nforward(50)\npenup()\ngoto(-150, -50)\npendown()\nforward(60)\n\n# S\npenup()\ngoto(50, 30)\npendown()\nsetheading(90)\ncircle(25, 270)\ncircle(-25, 270)\nhideturtle()\n",
    checks: [
      { type: "penup_used", fail: "Use penup() and goto() to jump to the next letter." },
      { type: "moves_min", n: 4, fail: "Keep going: each letter needs several lines." },
    ],
  },
  {
    id: "traffic",
    title: "Traffic light",
    defaultToolboxTab: "shape",
    goal: "A traffic light: a tall grey box with a red, an amber and a green light inside it.",
    starter: "from turtle import *\n\nspeed(0)\n\n# the box\npenup()\ngoto(-40, 160)\npendown()\nfillcolor(\"dimgray\")\nbegin_fill()\nfor i in range(2):\n    forward(80)\n    right(90)\n    forward(280)\n    right(90)\nend_fill()\n\ndef light(y, colour):\n    # go to (0, y), choose the colour, draw a filled circle(30)\n    pass\n\n# light(60, \"red\")\n",
    hints: [
      "Inside <code>light</code>: <code>penup()</code>, <code>goto(0, y)</code>, <code>pendown()</code>, <code>color(colour)</code>, <code>begin_fill()</code>, <code>circle(30)</code>, <code>end_fill()</code>.",
      "Call it three times, one under the other: y = 60, y = -30 and y = -120.",
    ],
    solution: "from turtle import *\n\nspeed(0)\n\n# the box\npenup()\ngoto(-40, 160)\npendown()\nfillcolor(\"dimgray\")\nbegin_fill()\nfor i in range(2):\n    forward(80)\n    right(90)\n    forward(280)\n    right(90)\nend_fill()\n\ndef light(y, colour):\n    penup()\n    goto(0, y)\n    pendown()\n    color(colour)\n    begin_fill()\n    circle(30)\n    end_fill()\n\nlight(60, \"red\")\nlight(-30, \"orange\")\nlight(-120, \"lime\")\nhideturtle()\n",
    checks: [
      { type: "function_defined", fail: "Keep the <code>light</code> function and fill it in." },
      { type: "circles_min", n: 3, fail: "Three lights, so call <code>light(...)</code> three times." },
      { type: "fills_min", n: 3, fail: "Each light needs <code>begin_fill()</code> and <code>end_fill()</code> around its circle." },
    ],
    notes: "A gentle first use of a function with two inputs. Ask: what would light(0, \"blue\") draw?",
  },
  {
    id: "staircase",
    title: "Staircase",
    defaultToolboxTab: "loop",
    goal: "A staircase of 8 steps climbing from the bottom left to the top right.",
    starter: "from turtle import *\n\nspeed(0)\npenup()\ngoto(-200, -150)\npendown()\n\nstep = 40\n\n# one step is: along, up\nforward(step)\nleft(90)\nforward(step)\nright(90)\n",
    hints: [
      "The four lines after <code>step = 40</code> draw one step. Put them inside <code>for i in range(8):</code> and indent them.",
      "If the stairs go the wrong way, check that <code>left(90)</code> comes before the second <code>forward</code> and <code>right(90)</code> after it.",
    ],
    solution: "from turtle import *\n\nspeed(0)\npenup()\ngoto(-200, -150)\npendown()\n\nstep = 40\n\nfor i in range(8):\n    forward(step)\n    left(90)\n    forward(step)\n    right(90)\nhideturtle()\n",
    checks: [
      { type: "code_has", pattern: "for\\s+\\w+\\s+in\\s+range\\s*\\(", fail: "Use a <code>for</code> loop to repeat the step." },
      { type: "turns", angle: 90, min: 10, fail: "Every step has two square corners. Loop at least 8 times." },
      { type: "moves_min", n: 12, fail: "Each step is two lines, so 8 steps is 16 lines." },
    ],
    notes: "Good for spotting the pattern inside a loop. Extension: make step bigger each time with step = step + 5.",
  },
  {
    id: "snowflake",
    title: "Snowflake",
    defaultToolboxTab: "loop",
    goal: "A six-armed snowflake. Then give each arm little branches.",
    starter: "from turtle import *\n\nspeed(0)\ncolor(\"deepskyblue\")\npensize(3)\n\nfor i in range(6):\n    forward(120)\n    backward(120)\n    left(60)\n",
    hints: [
      "Make a function <code>def arm(length):</code> that goes forward, draws the branches, and comes back with <code>backward(length)</code>.",
      "A branch: <code>left(45)</code>, <code>forward(length / 3)</code>, <code>backward(length / 3)</code>, then <code>right(90)</code> and the same again, then <code>left(45)</code> to face the way you were.",
    ],
    solution: "from turtle import *\n\nspeed(0)\ncolor(\"deepskyblue\")\npensize(3)\n\ndef arm(length):\n    forward(length)\n    left(45)\n    forward(length / 3)\n    backward(length / 3)\n    right(90)\n    forward(length / 3)\n    backward(length / 3)\n    left(45)\n    backward(length)\n\nfor i in range(6):\n    arm(120)\n    left(60)\nhideturtle()\n",
    checks: [
      { type: "turns", angle: 60, min: 5, fail: "Six arms means six turns of 60 degrees (360 ÷ 6)." },
      { type: "moves_min", n: 24, fail: "Add branches to the arms: each arm needs more than one line." },
    ],
    notes: "The 'go out and come back' idea is new. Draw it on the board: the turtle must return to the centre before turning.",
  },
  {
    id: "target",
    title: "Target",
    defaultToolboxTab: "shape",
    goal: "An archery target: five filled rings, each one smaller than the last, with a gold centre.",
    starter: "from turtle import *\n\nspeed(0)\ncolours = [\"red\", \"white\", \"red\", \"white\", \"gold\"]\nradius = 150\n\n# for each colour: go to (0, -radius), draw a filled circle(radius),\n# then make radius smaller\n",
    hints: [
      "<code>for c in colours:</code> goes through the list one colour at a time. Use <code>color(\"black\", c)</code> for a black outline and a coloured fill.",
      "Each circle must start lower down so they share a centre: <code>goto(0, -radius)</code>. At the end of the loop, <code>radius = radius - 30</code>.",
    ],
    solution: "from turtle import *\n\nspeed(0)\ncolours = [\"red\", \"white\", \"red\", \"white\", \"gold\"]\nradius = 150\n\nfor c in colours:\n    penup()\n    goto(0, -radius)\n    pendown()\n    color(\"black\", c)\n    begin_fill()\n    circle(radius)\n    end_fill()\n    radius = radius - 30\nhideturtle()\n",
    checks: [
      { type: "circles_min", n: 4, fail: "Draw a circle for every colour in the list." },
      { type: "fills_min", n: 4, fail: "Fill each ring with <code>begin_fill()</code> and <code>end_fill()</code>." },
      { type: "code_has", pattern: "radius\\s*(=\\s*radius\\s*-|-=)", fail: "Make the radius smaller each time round: <code>radius = radius - 30</code>." },
    ],
    notes: "Order matters: big circles first or the small ones get covered. Let them try the list reversed and see.",
  },
  {
    id: "olympics",
    defaultToolboxTab: "shape",
    title: "Olympic rings",
    emoji: "🏅",
    goal: "Five rings: blue, black, red on top; yellow and green underneath, overlapping.",
    starter: "from turtle import *\n\nspeed(0)\npensize(8)\n\ndef ring(x, y, colour):\n    # move to x, y and draw a circle\n    pass\n",
    hints: [
      "Inside ring: penup(), goto(x, y), pendown(), color(colour), circle(50).",
      "The bottom rings sit halfway between the top ones and lower down: try x = -55 and 55, y = -50.",
    ],
    solution: "from turtle import *\n\nspeed(0)\npensize(8)\n\ndef ring(x, y, colour):\n    penup()\n    goto(x, y)\n    pendown()\n    color(colour)\n    circle(50)\n\nring(-110, 0, \"blue\")\nring(0, 0, \"black\")\nring(110, 0, \"red\")\nring(-55, -50, \"gold\")\nring(55, -50, \"green\")\nhideturtle()\n",
    checks: [
      { type: "function_defined", fail: "Finish the ring() function and use it 5 times." },
      { type: "circles_min", n: 5, fail: "Draw all five rings." },
      { type: "colours_min", n: 5, fail: "Each ring is a different colour." },
    ],
  },
  {
    id: "spirograph",
    title: "Spirograph",
    defaultToolboxTab: "shape",
    goal: "A spirograph: the same circle drawn again and again, turning a little each time, in changing colours.",
    starter: "from turtle import *\n\nspeed(0)\nbgcolor(\"black\")\ncolours = [\"red\", \"orange\", \"yellow\", \"lime\", \"cyan\", \"magenta\"]\n\nfor i in range(36):\n    circle(80)\n    \n",
    hints: [
      "After each circle, turn a little: <code>left(10)</code>. 36 turns of 10 is a full 360.",
      "Pick the colour from the list with <code>color(colours[i % 6])</code> inside the loop.",
    ],
    solution: "from turtle import *\n\nspeed(0)\nbgcolor(\"black\")\ncolours = [\"red\", \"orange\", \"yellow\", \"lime\", \"cyan\", \"magenta\"]\n\nfor i in range(36):\n    color(colours[i % 6])\n    circle(80)\n    left(10)\nhideturtle()\n",
    checks: [
      { type: "circles_min", n: 20, fail: "Keep the loop long: at least 20 circles." },
      { type: "turns", angle: 10, min: 20, fail: "Turn <code>left(10)</code> after every circle." },
      { type: "colours_min", n: 3, fail: "Change colour inside the loop using the list." },
    ],
    notes: "Try circle(80) with range(18) and left(20), or circle(40, 180) for petals. Speed(0) matters here.",
  },
  {
    id: "galaxy",
    defaultToolboxTab: "colours",
    title: "Colour spiral",
    emoji: "🌌",
    goal: "A spiral that changes colour as it grows. Use the loop variable to pick a colour from a list.",
    starter: "from turtle import *\n\nspeed(0)\nbgcolor(\"black\")\ncolours = [\"red\", \"yellow\", \"lime\", \"cyan\", \"blue\", \"magenta\"]\n\nfor i in range(120):\n    forward(i * 2)\n    left(59)\n",
    hints: [
      "<code>colours[i % 6]</code> picks colour 0, 1, 2, 3, 4, 5, 0, 1, ... as i counts up.",
      "Try <code>pensize(i / 20)</code> to make the line thicker as it goes.",
    ],
    solution: "from turtle import *\n\nspeed(0)\nbgcolor(\"black\")\ncolours = [\"red\", \"yellow\", \"lime\", \"cyan\", \"blue\", \"magenta\"]\n\nfor i in range(120):\n    color(colours[i % 6])\n    pensize(i / 20)\n    forward(i * 2)\n    left(59)\nhideturtle()\n",
    checks: [
      { type: "colours_min", n: 4, fail: "Change colour inside the loop using the list." },
      { type: "moves_min", n: 50, fail: "Keep the loop long so the spiral grows." },
    ],
  },
  {
    id: "honeycomb",
    title: "Honeycomb",
    defaultToolboxTab: "loop",
    goal: "A honeycomb: three rows of filled hexagons, with every other row shifted along. A loop inside a loop.",
    starter: "from turtle import *\n\nspeed(0)\ncolor(\"darkorange\", \"gold\")\n\ndef hexagon(x, y):\n    penup()\n    goto(x, y)\n    pendown()\n    begin_fill()\n    for i in range(6):\n        forward(40)\n        left(60)\n    end_fill()\n\nhexagon(0, 0)\n",
    hints: [
      "First a row: <code>for col in range(4):</code> then <code>hexagon(col * 85 - 160, 0)</code>.",
      "Then rows: <code>for row in range(3):</code> around it, with <code>y = row * 72 - 100</code>. Shift odd rows along by 42 with <code>(row % 2) * 42</code>.",
    ],
    solution: "from turtle import *\n\nspeed(0)\ncolor(\"darkorange\", \"gold\")\n\ndef hexagon(x, y):\n    penup()\n    goto(x, y)\n    pendown()\n    begin_fill()\n    for i in range(6):\n        forward(40)\n        left(60)\n    end_fill()\n\nfor row in range(3):\n    for col in range(4):\n        hexagon(col * 85 - 160 + (row % 2) * 42, row * 72 - 100)\nhideturtle()\n",
    checks: [
      { type: "function_defined", fail: "Keep the <code>hexagon</code> function." },
      { type: "fills_min", n: 8, fail: "Three rows of four is 12 hexagons. Use a loop inside a loop." },
      { type: "turns", angle: 60, min: 36, fail: "Each hexagon turns 60 degrees six times. Draw more hexagons." },
    ],
    notes: "Same idea as the chessboard with friendlier maths. The (row % 2) * 42 shift is the stretch part; a straight grid still passes.",
  },
  {
    id: "checker",
    defaultToolboxTab: "loop",
    title: "Chessboard",
    emoji: "♟️",
    goal: "An 8 by 8 chessboard of filled squares. This one is hard: you'll need a loop inside a loop.",
    starter: "from turtle import *\n\nspeed(0)\n\ndef box(x, y, colour):\n    penup()\n    goto(x, y)\n    pendown()\n    fillcolor(colour)\n    begin_fill()\n    for i in range(4):\n        forward(40)\n        right(90)\n    end_fill()\n\n# box(0, 0, \"black\")\n",
    hints: [
      "A loop for rows, and inside it a loop for columns: <code>for row in range(8):</code> then <code>for col in range(8):</code>.",
      "A square is black if <code>(row + col) % 2 == 0</code>, otherwise white. The position is <code>x = col * 40 - 160</code>, <code>y = row * 40 - 160</code>.",
    ],
    solution: "from turtle import *\n\nspeed(0)\n\ndef box(x, y, colour):\n    penup()\n    goto(x, y)\n    pendown()\n    fillcolor(colour)\n    begin_fill()\n    for i in range(4):\n        forward(40)\n        right(90)\n    end_fill()\n\nfor row in range(8):\n    for col in range(8):\n        if (row + col) % 2 == 0:\n            box(col * 40 - 160, row * 40 - 160, \"black\")\n        else:\n            box(col * 40 - 160, row * 40 - 160, \"white\")\nhideturtle()\n",
    checks: [
      { type: "fills_min", n: 32, fail: "A chessboard has 64 squares, at least 32 of them filled." },
    ],
  },
];
