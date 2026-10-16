"""
Browser turtle for the ESA Turtle Playground.

This module replaces Python's normal `turtle` module when code runs in the
playground.  It keeps the same names and behaviour as the real module, but
instead of drawing in a Tk window it sends drawing commands to the web page,
which animates them on an HTML canvas.

Anything a student learns here (forward, left, penup, begin_fill, loops ...)
works exactly the same way in Thonny.
"""

import math
import json
import difflib

# --------------------------------------------------------------------------
# Plumbing: commands are batched into a list and posted to the page as JSON.
# --------------------------------------------------------------------------

_buffer = []
_post = None          # JS function, set by the runner
_BATCH = 150


def _set_post(fn):
    global _post
    _post = fn


def _emit(cmd):
    _buffer.append(cmd)
    if len(_buffer) >= _BATCH:
        _flush()


def _flush():
    global _buffer
    if _buffer and _post is not None:
        _post(json.dumps(_buffer))
        _buffer = []


# --------------------------------------------------------------------------
# Colours
# --------------------------------------------------------------------------

_CSS_COLORS = set("""
aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond
blue blueviolet brown burlywood cadetblue chartreuse chocolate coral
cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray
darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid
darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey
darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue
firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod
gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki
lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan
lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon
lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue
lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue
mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen
mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin
navajowhite navy oldlace olive olivedrab orange orangered orchid
palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru
pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown
salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray
slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet
wheat white whitesmoke yellow yellowgreen
""".split())

# A few Tk names that CSS doesn't have.
_TK_EXTRA = {
    "navyblue": "navy", "lightgoldenrod": "#eedd82", "darkslateblue": "darkslateblue",
    "violetred": "#d02090", "mediumgoldenrod": "#d0c050", "lightyellow": "lightyellow",
}

_colormode = 1.0


def colormode(cmode=None):
    """Set colour mode to 1.0 (r, g, b between 0 and 1) or 255."""
    global _colormode
    if cmode is None:
        return _colormode
    if cmode == 1.0 or cmode == 1:
        _colormode = 1.0
    elif cmode == 255:
        _colormode = 255
    else:
        raise ValueError("colormode() must be 1.0 or 255")


def _colour_error(name):
    names = sorted(_CSS_COLORS)
    guess = difflib.get_close_matches(str(name).lower().replace(" ", ""), names, n=1, cutoff=0.6)
    msg = f"I don't know the colour '{name}'."
    if guess:
        msg += f" Did you mean '{guess[0]}'?"
    err = ValueError(msg)
    err.playground_kind = "colour"
    err.playground_suggestion = guess[0] if guess else None
    return err


def _to_color(*args):
    """Turn whatever the student typed into a CSS colour string."""
    if len(args) == 1:
        c = args[0]
    else:
        c = args
    if isinstance(c, str):
        s = c.strip().lower()
        if s.startswith("#"):
            h = s[1:]
            if len(h) in (3, 6) and all(ch in "0123456789abcdef" for ch in h):
                return s
            raise _colour_error(c)
        squashed = s.replace(" ", "").replace("-", "").replace("_", "")
        if squashed in _CSS_COLORS:
            return squashed
        if squashed in _TK_EXTRA:
            return _TK_EXTRA[squashed]
        # British spellings
        if squashed == "grey":
            return "grey"
        raise _colour_error(c)
    if isinstance(c, (tuple, list)) and len(c) == 3:
        try:
            r, g, b = [float(v) for v in c]
        except (TypeError, ValueError):
            raise _colour_error(c)
        if _colormode == 1.0:
            if not all(0 <= v <= 1 for v in (r, g, b)):
                err = ValueError(
                    f"The colour {tuple(c)} is out of range. In this mode each number "
                    "must be between 0 and 1, or call colormode(255) first to use 0 to 255.")
                err.playground_kind = "colour"
                raise err
            r, g, b = r * 255, g * 255, b * 255
        else:
            if not all(0 <= v <= 255 for v in (r, g, b)):
                err = ValueError(f"The colour {tuple(c)} is out of range. Each number must be between 0 and 255.")
                err.playground_kind = "colour"
                raise err
        return "rgb(%d,%d,%d)" % (round(r), round(g), round(b))
    raise _colour_error(c)


# --------------------------------------------------------------------------
# Helpers for friendly argument errors
# --------------------------------------------------------------------------

def _num(value, fname, what="a number"):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        err = TypeError(
            f"{fname}() needs {what} inside the brackets, like {fname}(100). "
            f"You gave it {value!r}, which is {_describe(value)}.")
        err.playground_kind = "argtype"
        raise err
    return value


def _describe(v):
    if isinstance(v, str):
        return "text (it has quotes around it)"
    if isinstance(v, bool):
        return "True/False"
    if isinstance(v, (list, tuple)):
        return "a list"
    if v is None:
        return "nothing (None)"
    return "a " + type(v).__name__


_SPEEDS = {"fastest": 0, "fast": 10, "normal": 6, "slow": 3, "slowest": 1}

_SHAPES = ("arrow", "turtle", "circle", "square", "triangle", "classic")


# --------------------------------------------------------------------------
# The Turtle
# --------------------------------------------------------------------------

_turtles = []
_next_id = [0]


class Turtle:
    """A turtle that draws on the playground canvas."""

    def __init__(self, shape="turtle", visible=True):
        _next_id[0] += 1
        self._id = _next_id[0]
        _turtles.append(self)
        self._x = 0.0
        self._y = 0.0
        self._heading = 0.0
        self._pen = True
        self._pencolor = "black"
        self._fillcolor = "black"
        self._pensize = 1
        self._speed = 3
        self._visible = visible
        self._shape = shape if shape in _SHAPES else "turtle"
        self._filling = False
        self._fillpoints = []
        self._in_circle = False
        _emit({"t": "new", "id": self._id, "shape": self._shape, "vis": self._visible,
               "c": self._pencolor, "f": self._fillcolor})

    # ----- movement -------------------------------------------------------

    def _goto(self, x, y):
        cmd = {"t": "m", "id": self._id, "x0": self._x, "y0": self._y, "x1": x, "y1": y,
               "pen": self._pen, "c": self._pencolor, "w": self._pensize, "h": self._heading}
        if self._in_circle:
            cmd["circ"] = 1
        _emit(cmd)
        self._x, self._y = x, y
        if self._filling:
            self._fillpoints.append((x, y))

    def forward(self, distance):
        """Move the turtle forward by distance."""
        distance = _num(distance, "forward")
        a = math.radians(self._heading)
        self._goto(self._x + distance * math.cos(a), self._y + distance * math.sin(a))
    fd = forward

    def backward(self, distance):
        """Move the turtle backward by distance."""
        distance = _num(distance, "backward")
        self.forward(-distance)
    bk = back = backward

    def _turn(self, angle):
        self._heading = (self._heading + angle) % 360
        cmd = {"t": "r", "id": self._id, "h": self._heading, "da": angle}
        if self._in_circle:
            cmd["circ"] = 1
        _emit(cmd)

    def left(self, angle):
        """Turn turtle left by angle degrees."""
        self._turn(_num(angle, "left"))
    lt = left

    def right(self, angle):
        """Turn turtle right by angle degrees."""
        self._turn(-_num(angle, "right"))
    rt = right

    def goto(self, x, y=None):
        """Move turtle to an absolute position."""
        if y is None:
            if isinstance(x, (tuple, list)) and len(x) == 2:
                x, y = x
            elif isinstance(x, Vec2D):
                x, y = x
            else:
                err = TypeError("goto() needs two numbers, like goto(100, 50).")
                err.playground_kind = "argtype"
                raise err
        _num(x, "goto")
        _num(y, "goto")
        self._goto(float(x), float(y))
    setpos = setposition = goto

    def setx(self, x):
        self._goto(float(_num(x, "setx")), self._y)

    def sety(self, y):
        self._goto(self._x, float(_num(y, "sety")))

    def setheading(self, to_angle):
        """Point the turtle in a direction (0 = right, 90 = up)."""
        to_angle = _num(to_angle, "setheading")
        self._turn(((to_angle - self._heading) + 180) % 360 - 180)
    seth = setheading

    def home(self):
        """Go back to the middle, facing right."""
        self.goto(0, 0)
        self.setheading(0)

    def circle(self, radius, extent=None, steps=None):
        """Draw a circle (or part of one) with the given radius."""
        radius = _num(radius, "circle")
        if extent is None:
            extent = 360
        extent = _num(extent, "circle", "an angle")
        if steps is None:
            frac = abs(extent) / 360
            steps = 1 + int(min(11 + abs(radius) / 6.0, 59.0) * frac)
        w = 1.0 * extent / steps
        w2 = 0.5 * w
        l = 2.0 * radius * math.sin(math.radians(w2))
        if radius < 0:
            l, w, w2 = -l, -w, -w2
        _emit({"t": "circ", "id": self._id, "r": radius, "e": extent})
        self._in_circle = True
        try:
            self._turn(w2)
            for _ in range(steps):
                self.forward(l)
                self._turn(w)
            self._turn(-w2)
        finally:
            self._in_circle = False

    def dot(self, size=None, *color):
        """Draw a round dot, size pixels across."""
        if size is None:
            size = max(self._pensize + 4, 2 * self._pensize)
        if isinstance(size, str) and not color:
            # dot("red") -> default size, red
            color = (size,)
            size = max(self._pensize + 4, 2 * self._pensize)
        size = _num(size, "dot")
        c = _to_color(*color) if color else self._pencolor
        _emit({"t": "d", "id": self._id, "x": self._x, "y": self._y, "s": size, "c": c})

    def stamp(self):
        """Stamp a copy of the turtle shape onto the canvas."""
        _emit({"t": "s", "id": self._id, "x": self._x, "y": self._y, "h": self._heading,
               "shape": self._shape, "c": self._pencolor, "f": self._fillcolor})
        return self._id

    def write(self, arg, move=False, align="left", font=("Arial", 8, "normal")):
        """Write text at the turtle's position."""
        text = str(arg)
        try:
            family, size, style = font
        except Exception:
            family, size, style = "Arial", 8, "normal"
        _emit({"t": "w", "id": self._id, "x": self._x, "y": self._y, "text": text,
               "align": align, "font": [str(family), int(size), str(style)], "c": self._pencolor})

    # ----- pen state --------------------------------------------------------

    def penup(self):
        """Lift the pen: moving will not draw."""
        self._pen = False
    pu = up = penup

    def pendown(self):
        """Put the pen down: moving will draw."""
        self._pen = True
    pd = down = pendown

    def isdown(self):
        return self._pen

    def pensize(self, width=None):
        """Set how thick the line is."""
        if width is None:
            return self._pensize
        width = _num(width, "pensize")
        if width < 0:
            width = 0
        self._pensize = width
        return None
    width = pensize

    def pencolor(self, *args):
        """Set the colour of the pen, e.g. pencolor("red")."""
        if not args:
            return self._pencolor
        self._pencolor = _to_color(*args)
        _emit({"t": "pc", "id": self._id, "c": self._pencolor})

    def fillcolor(self, *args):
        """Set the colour used by begin_fill() / end_fill()."""
        if not args:
            return self._fillcolor
        self._fillcolor = _to_color(*args)
        _emit({"t": "fc", "id": self._id, "c": self._fillcolor})

    def color(self, *args):
        """Set pen colour (and fill colour). color("red") or color("red", "blue")."""
        if not args:
            return self._pencolor, self._fillcolor
        if len(args) == 2 and not isinstance(args[0], (int, float)):
            self.pencolor(args[0])
            self.fillcolor(args[1])
        else:
            self.pencolor(*args)
            self.fillcolor(*args)
    colour = color
    pencolour = pencolor
    fillcolour = fillcolor

    def begin_fill(self):
        """Start remembering a shape to fill in. Call end_fill() when done."""
        self._filling = True
        self._fillpoints = [(self._x, self._y)]
        _emit({"t": "fb", "id": self._id})

    def end_fill(self):
        """Fill in the shape drawn since begin_fill()."""
        if not self._filling:
            return
        self._filling = False
        pts = [[round(x, 2), round(y, 2)] for x, y in self._fillpoints]
        _emit({"t": "f", "id": self._id, "pts": pts, "c": self._fillcolor})
        self._fillpoints = []

    def filling(self):
        return self._filling

    def speed(self, speed=None):
        """How fast the turtle moves: 1 = slowest, 10 = fast, 0 = instant."""
        if speed is None:
            return self._speed
        if isinstance(speed, str):
            if speed not in _SPEEDS:
                err = ValueError(
                    f"speed() doesn't understand '{speed}'. Use a number from 0 to 10, "
                    "or one of 'slowest', 'slow', 'normal', 'fast', 'fastest'.")
                err.playground_kind = "argvalue"
                raise err
            speed = _SPEEDS[speed]
        speed = _num(speed, "speed")
        if speed > 10 or speed < 0.5:
            speed = 0
        self._speed = int(round(speed))
        _emit({"t": "sp", "id": self._id, "v": self._speed})

    # ----- appearance --------------------------------------------------------

    def hideturtle(self):
        """Make the turtle invisible (the drawing stays)."""
        self._visible = False
        _emit({"t": "v", "id": self._id, "vis": False})
    ht = hideturtle

    def showturtle(self):
        """Make the turtle visible again."""
        self._visible = True
        _emit({"t": "v", "id": self._id, "vis": True})
    st = showturtle

    def isvisible(self):
        return self._visible

    def shape(self, name=None):
        """Change what the turtle looks like: "turtle", "arrow", "circle", "square", "triangle", "classic"."""
        if name is None:
            return self._shape
        if name not in _SHAPES:
            err = ValueError(
                f"There is no shape called '{name}'. Try one of: " + ", ".join(_SHAPES) + ".")
            err.playground_kind = "argvalue"
            raise err
        self._shape = name
        _emit({"t": "sh", "id": self._id, "shape": name})

    def shapesize(self, stretch_wid=None, stretch_len=None, outline=None):
        if stretch_wid is None and stretch_len is None:
            return (1, 1, 1)
        w = stretch_wid if stretch_wid is not None else 1
        l = stretch_len if stretch_len is not None else w
        _emit({"t": "ss", "id": self._id, "w": float(w), "l": float(l)})
    turtlesize = shapesize

    # ----- state queries ----------------------------------------------------

    def position(self):
        return Vec2D(self._x, self._y)
    pos = position

    def xcor(self):
        return self._x

    def ycor(self):
        return self._y

    def heading(self):
        return self._heading

    def distance(self, x, y=None):
        if y is None:
            if isinstance(x, Turtle):
                x, y = x._x, x._y
            else:
                x, y = x
        return math.hypot(self._x - x, self._y - y)

    def towards(self, x, y=None):
        if y is None:
            if isinstance(x, Turtle):
                x, y = x._x, x._y
            else:
                x, y = x
        return math.degrees(math.atan2(y - self._y, x - self._x)) % 360

    # ----- clearing -----------------------------------------------------------

    def clear(self):
        """Rub out everything this turtle drew (the turtle stays where it is)."""
        _emit({"t": "clr", "id": self._id})

    def reset(self):
        """Rub out this turtle's drawing and send it home."""
        self.clear()
        self._x = self._y = 0.0
        self._heading = 0.0
        self._pen = True
        self._pencolor = "black"
        self._fillcolor = "black"
        self._pensize = 1
        self._filling = False
        self._visible = True
        _emit({"t": "reset", "id": self._id})

    # ----- things that exist in the real module but do nothing here ---------

    def degrees(self, fullcircle=360.0):
        pass

    def radians(self):
        pass

    def tilt(self, angle):
        pass

    def settiltangle(self, angle):
        pass

    def getscreen(self):
        return _screen

    def undo(self):
        pass

    def onclick(self, *a, **k):
        pass

    def ondrag(self, *a, **k):
        pass

    def onrelease(self, *a, **k):
        pass

    def clone(self):
        t = Turtle(self._shape, self._visible)
        t._x, t._y, t._heading = self._x, self._y, self._heading
        t._pen, t._pencolor, t._fillcolor, t._pensize, t._speed = (
            self._pen, self._pencolor, self._fillcolor, self._pensize, self._speed)
        _emit({"t": "clone", "id": t._id, "x": t._x, "y": t._y, "h": t._heading,
               "c": t._pencolor, "f": t._fillcolor})
        return t

    def __repr__(self):
        return f"<Turtle at ({self._x:.0f}, {self._y:.0f}) heading {self._heading:.0f}>"


Pen = Turtle
RawTurtle = Turtle
RawPen = Turtle


class Vec2D(tuple):
    """A 2D point that behaves like (x, y)."""
    def __new__(cls, x, y):
        return tuple.__new__(cls, (x, y))

    def __add__(self, other):
        return Vec2D(self[0] + other[0], self[1] + other[1])

    def __sub__(self, other):
        return Vec2D(self[0] - other[0], self[1] - other[1])

    def __repr__(self):
        return "(%.2f,%.2f)" % self


# --------------------------------------------------------------------------
# The Screen
# --------------------------------------------------------------------------

class _Screen:
    def __init__(self):
        self._bg = "white"
        self._title = ""

    def bgcolor(self, *args):
        """Change the background colour of the canvas."""
        if not args:
            return self._bg
        self._bg = _to_color(*args)
        _emit({"t": "bg", "c": self._bg})

    def title(self, titlestring):
        """Give the drawing a title."""
        self._title = str(titlestring)
        _emit({"t": "title", "text": self._title})

    def tracer(self, n=None, delay=None):
        """tracer(0) turns animation off so drawings appear instantly."""
        if n is None:
            return 1
        _emit({"t": "tr", "n": int(n)})

    def update(self):
        _flush()

    def delay(self, d=None):
        return 10

    def clear(self):
        """Rub out everything."""
        _emit({"t": "clrall"})
    clearscreen = clear

    def reset(self):
        for t in _turtles:
            t.reset()
    resetscreen = reset

    def setup(self, width=None, height=None, startx=None, starty=None):
        pass

    def screensize(self, *a, **k):
        return (640, 480)

    def window_width(self):
        return 640

    def window_height(self):
        return 480

    def colormode(self, cmode=None):
        return colormode(cmode)

    def bgpic(self, *a):
        return "nopic"

    def mainloop(self):
        _flush()
    done = mainloop

    def exitonclick(self):
        _flush()

    def bye(self):
        _flush()

    def listen(self, *a, **k):
        pass

    def onkey(self, *a, **k):
        pass
    onkeypress = onkeyrelease = onkey

    def onclick(self, *a, **k):
        pass
    onscreenclick = onclick

    def ontimer(self, *a, **k):
        pass

    def textinput(self, title, prompt):
        err = RuntimeError("textinput() and input() don't work in the playground yet. Try it in Thonny!")
        err.playground_kind = "unsupported"
        raise err

    def numinput(self, title, prompt, default=None, minval=None, maxval=None):
        err = RuntimeError("numinput() and input() don't work in the playground yet. Try it in Thonny!")
        err.playground_kind = "unsupported"
        raise err

    def turtles(self):
        return list(_turtles)

    def register_shape(self, *a, **k):
        pass
    addshape = register_shape

    def getcanvas(self):
        return None

    def getshapes(self):
        return list(_SHAPES)

    def mode(self, *a):
        return "standard"


_screen = _Screen()


def Screen():
    """Return the (single) drawing screen."""
    return _screen


TurtleScreen = _Screen


# --------------------------------------------------------------------------
# Module-level functions that act on a default turtle, like the real module.
# --------------------------------------------------------------------------

_default = [None]


def _get_default():
    if _default[0] is None:
        _default[0] = Turtle()
    return _default[0]


def getturtle():
    return _get_default()
getpen = getturtle


def getscreen():
    return _screen


_TURTLE_METHODS = [
    "forward", "fd", "backward", "bk", "back", "left", "lt", "right", "rt", "goto",
    "setpos", "setposition", "setx", "sety", "setheading", "seth", "home", "circle",
    "dot", "stamp", "write", "penup", "pu", "up", "pendown", "pd", "down", "isdown",
    "pensize", "width", "pencolor", "fillcolor", "color", "colour", "pencolour",
    "fillcolour", "begin_fill", "end_fill", "filling", "speed", "hideturtle", "ht",
    "showturtle", "st", "isvisible", "shape", "shapesize", "turtlesize", "position",
    "pos", "xcor", "ycor", "heading", "distance", "towards", "clear", "reset",
    "degrees", "radians", "tilt", "settiltangle", "undo", "onclick", "ondrag",
    "onrelease", "clone",
]

_SCREEN_METHODS = [
    "bgcolor", "title", "tracer", "update", "delay", "clearscreen", "resetscreen",
    "setup", "screensize", "window_width", "window_height", "bgpic", "mainloop",
    "done", "exitonclick", "bye", "listen", "onkey", "onkeypress", "onkeyrelease",
    "onscreenclick", "ontimer", "textinput", "numinput", "turtles", "register_shape",
    "addshape", "getcanvas", "getshapes", "mode",
]


def _make_turtle_func(name):
    method = getattr(Turtle, name)

    def func(*args, **kwargs):
        return method(_get_default(), *args, **kwargs)
    func.__name__ = name
    func.__doc__ = method.__doc__
    return func


def _make_screen_func(name):
    method = getattr(_Screen, name)

    def func(*args, **kwargs):
        return method(_screen, *args, **kwargs)
    func.__name__ = name
    func.__doc__ = method.__doc__
    return func


for _name in _TURTLE_METHODS:
    globals()[_name] = _make_turtle_func(_name)
for _name in _SCREEN_METHODS:
    globals()[_name] = _make_screen_func(_name)
del _name

__all__ = (_TURTLE_METHODS + _SCREEN_METHODS +
           ["Turtle", "Pen", "RawTurtle", "RawPen", "Screen", "TurtleScreen", "Vec2D",
            "colormode", "getturtle", "getpen", "getscreen"])


class TurtleGraphicsError(Exception):
    pass


class Terminator(Exception):
    pass


# --------------------------------------------------------------------------
# Reset between runs (called by the runner)
# --------------------------------------------------------------------------

def _reset_all():
    global _buffer, _colormode
    _buffer = []
    _colormode = 1.0
    _turtles.clear()
    _next_id[0] = 0
    _default[0] = None
    _screen._bg = "white"
    _screen._title = ""
