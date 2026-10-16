/* The command toolbox shown beside the editor. Clicking an item inserts
   the snippet at the cursor. */

export const PALETTE = [
  {
    group: "Move", colour: "move",
    items: [
      { label: "forward(100)", snippet: "forward(100)", help: "Move forward 100 steps. Bigger number = longer line." },
      { label: "backward(100)", snippet: "backward(100)", help: "Move backwards 100 steps." },
      { label: "left(90)", snippet: "left(90)", help: "Turn left by 90 degrees. 90 is a square corner." },
      { label: "right(90)", snippet: "right(90)", help: "Turn right by 90 degrees." },
      { label: "goto(x, y)", snippet: "goto(0, 0)", help: "Jump to a position. (0, 0) is the middle of the screen." },
      { label: "home()", snippet: "home()", help: "Go back to the middle, facing right." },
      { label: "setheading(90)", snippet: "setheading(90)", help: "Face a direction: 0 right, 90 up, 180 left, 270 down." },
    ],
  },
  {
    group: "Pen", colour: "pen",
    items: [
      { label: "penup()", snippet: "penup()", help: "Lift the pen. Moving won't draw a line." },
      { label: "pendown()", snippet: "pendown()", help: "Put the pen down. Moving draws again." },
      { label: "pensize(5)", snippet: "pensize(5)", help: "How thick the line is." },
      { label: 'color("red")', snippet: 'color("red")', help: "Change the pen colour. Spell it the American way: color." },
      { label: 'bgcolor("black")', snippet: 'bgcolor("black")', help: "Change the background colour." },
      { label: "speed(10)", snippet: "speed(10)", help: "1 is slowest, 10 is fast, 0 is instant." },
    ],
  },
  {
    group: "Shapes", colour: "shape",
    items: [
      { label: "circle(50)", snippet: "circle(50)", help: "Draw a circle with radius 50. circle(50, 180) draws half a circle." },
      { label: "dot(20)", snippet: "dot(20)", help: "Draw a filled dot 20 pixels wide." },
      { label: "begin_fill()", snippet: "begin_fill()", help: "Start filling. Draw a shape, then end_fill()." },
      { label: "end_fill()", snippet: "end_fill()", help: "Fill in the shape you just drew." },
      { label: 'fillcolor("blue")', snippet: 'fillcolor("blue")', help: "The colour used when filling." },
      { label: "stamp()", snippet: "stamp()", help: "Leave a copy of the turtle behind." },
    ],
  },
  {
    group: "Repeat", colour: "loop",
    items: [
      { label: "for loop", snippet: "for i in range(4):\n    forward(100)\n    right(90)\n", help: "Repeat the indented lines 4 times.", block: true },
      { label: "square function", snippet: "def square(size):\n    for i in range(4):\n        forward(size)\n        right(90)\n", help: "Make your own command called square.", block: true },
      { label: "variable", snippet: "size = 100\n", help: "Store a number in a name so you can reuse it.", block: true },
    ],
  },
  {
    group: "Other", colour: "other",
    items: [
      { label: "hideturtle()", snippet: "hideturtle()", help: "Hide the turtle so you can see your picture." },
      { label: 'shape("turtle")', snippet: 'shape("turtle")', help: "turtle, arrow, circle, square, triangle or classic." },
      { label: 'write("Hi")', snippet: 'write("Hi")', help: "Write some text where the turtle is." },
      { label: 'print("Hi")', snippet: 'print("Hi")', help: "Show a message in the output box under the code." },
      { label: "clear()", snippet: "clear()", help: "Rub everything out." },
    ],
  },
];

export const SWATCHES = [
  "red", "orange", "yellow", "lime", "green", "cyan", "blue", "purple", "magenta", "pink",
  "brown", "gold", "silver", "gray", "black", "white",
  "lightblue", "skyblue", "navy", "teal", "salmon", "crimson", "violet", "turquoise",
];
