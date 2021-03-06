// Generated by CoffeeScript 1.6.2
(function() {
  (function() {
    "use strict";
    var $options, CodeMirror, Pos, attachInteractivity, deltaForNumber, editing, esprima, findLiterals, nextId, setInteractive;

    esprima = require("esprima");
    CodeMirror = global.CodeMirror;
    Pos = CodeMirror.Pos;
    exports.interactiveOptions = $options = {};
    editing = false;
    setInteractive = function(cm, changeObj) {
      var clsName, currentText, e, editableWidget, end, hasReloaded, key, mark, marks, newTree, pos, range, scrubbableLinks, start, syntax, toRun, val, widgets, _i, _len;

      if (!editing) {
        editing = true;
        scrubbableLinks = [];
        key = val = newTree = range = pos = start = end = void 0;
        hasReloaded = false;
        toRun = [];
        clsName = "scrub_widget";
        currentText = cm.getValue() || cm.options.value;
        marks = cm.getAllMarks();
        for (_i = 0, _len = marks.length; _i < _len; _i++) {
          mark = marks[_i];
          mark.clear();
        }
        try {
          syntax = findLiterals(cm, esprima.parse(currentText, {
            range: true
          }));
          widgets = [];
          $options.values = syntax.values;
          for (key in syntax.values) {
            val = syntax.values[key];
            start = val.start;
            end = val.end;
            editableWidget = document.createElement("span");
            editableWidget.className = clsName;
            editableWidget.textContent = val.value;
            editableWidget.id = key;
            widgets.push(editableWidget);
            range = cm.markText(start, end, {
              handleMouseEvents: true,
              replacedWith: editableWidget,
              shared: true,
              addToHistory: true
            });
            attachInteractivity(editableWidget, val, cm);
          }
        } catch (_error) {
          e = _error;
          console.log(e);
        }
        return editing = false;
      }
    };
    deltaForNumber = function(n) {
      var firstSig, lastDigit, s, specificity;

      if (n === 0) {
        return 1;
      }
      if (n === 1) {
        return 0.1;
      }
      lastDigit = function(n) {
        return Math.round((n / 10 - Math.floor(n / 10)) * 10);
      };
      firstSig = function(n) {
        var i;

        n = Math.abs(n);
        i = 0;
        while (lastDigit(n) === 0) {
          i++;
          n /= 10;
        }
        return i;
      };
      specificity = function(n) {
        var abs, fraction, s;

        s = 0;
        while (true) {
          abs = Math.abs(n);
          fraction = abs - Math.floor(abs);
          if (fraction < 0.000001) {
            return s;
          }
          s++;
          n = n * 10;
        }
      };
      s = specificity(n);
      if (s > 0) {
        return Math.pow(10, -s);
      } else {
        n = Math.abs(n);
        return Math.pow(10, Math.max(0, firstSig(n) - 1));
      }
    };
    attachInteractivity = function(ele, val, cm) {
      return ele.addEventListener("mousedown", function(e) {
        var delta, moved, mx, my, orig, originalEnd, originalStart, up;

        e.preventDefault();
        mx = e.pageX;
        my = e.pageY;
        orig = Number(ele.textContent);
        delta = deltaForNumber(orig);
        ele.classList.add("dragging");
        originalStart = val.start;
        originalEnd = val.end;
        moved = function(e) {
          var d, endOfString, endPos, lengthDiff, line, newNumberLength, newString, origNumber, origNumberLength, startOfString;

          e.preventDefault();
          if (delta.toFixed(5).toString() === "0.00000") {
            delta = 0.001;
          }
          d = Number((Math.round((e.pageX - mx) / 2) * delta + orig).toFixed(5));
          origNumber = ele.textContent;
          origNumberLength = origNumber.toString().length;
          newNumberLength = d.toString().length;
          lengthDiff = newNumberLength - origNumberLength;
          ele.textContent = d;
          $options.values[ele.id].value = d;
          line = cm.getLine(val.start.line);
          startOfString = line.substr(0, val.start.ch);
          endOfString = line.substr(val.end.ch, line.length);
          newString = startOfString + String(d) + endOfString;
          if (lengthDiff < 0) {
            endPos = newString.length - lengthDiff;
          } else if (lengthDiff > 0) {
            endPos = newString.length + lengthDiff;
          } else {
            endPos = newString.length;
          }
          cm.replaceRange(newString, Pos(val.start.line, 0), Pos(val.start.line, endPos));
          val.start = Pos(val.start.line, startOfString.length);
          val.end = Pos(val.start.line, (startOfString + String(d)).length);
          if ($options.onChange) {
            return $options.onChange($options.values);
          }
        };
        window.addEventListener("mousemove", moved);
        up = function(e) {
          window.removeEventListener("mousemove", moved);
          window.removeEventListener("mouseup", up);
          return ele.classList.remove("dragging");
        };
        return window.addEventListener("mouseup", up);
      });
    };
    findLiterals = function(cm, tree) {
      var markLiterals, nextId, prefix, recursiveWalk, _values;

      _values = {};
      prefix = "interactive_";
      nextId = 0;
      markLiterals = function(e) {
        var id;

        if (e.type === "Literal" && typeof e.value === "number") {
          if (nextId >= 2048) {
            nextId = 0;
          }
          id = nextId++;
          return _values[prefix + id] = {
            range: e.range,
            value: e.value,
            start: cm.posFromIndex(e.range[0]),
            end: cm.posFromIndex(e.range[1])
          };
        } else {
          return recursiveWalk(e, markLiterals);
        }
      };
      recursiveWalk = function(tree, f) {
        var i, key, len, val;

        i = void 0;
        key = void 0;
        val = void 0;
        if (tree instanceof Array) {
          len = tree.length;
          i = 0;
          while (i < len) {
            val = tree[i];
            if (typeof val === "object" && val !== null) {
              f(val);
            }
            i++;
          }
        } else {
          for (key in tree) {
            val = tree[key];
            if (typeof val === "object" && val !== null) {
              f(val);
            }
          }
        }
        return tree;
      };
      return {
        ast: recursiveWalk(tree, markLiterals),
        values: _values
      };
    };
    nextId = 1;
    return global.CodeMirror.defineOption("interactiveNumbers", {}, function(cm, val, old) {
      var prev;

      prev = old && old !== CodeMirror.Init;
      if (val) {
        $options = val;
        cm.on("change", setInteractive);
        return setInteractive(cm);
      }
    });
  })();

}).call(this);
