/* Petit moteur autonome pour le portfolio (remplace le moteur de l'éditeur). */
(function () {
  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  var ONE = /^\{\{\s*([^}]+?)\s*\}\}$/;
  var EVENTS = { onclick: 'click', onmouseenter: 'mouseenter', onmouseleave: 'mouseleave', onmousemove: 'mousemove', onmousedown: 'mousedown', onmouseup: 'mouseup', onwheel: 'wheel', onscroll: 'scroll' };

  function lookup(path, ctx) {
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(path)) return parseFloat(path);
    var parts = path.split('.');
    var head = parts[0], v, c = ctx, found = false;
    while (c) { if (c.vars && Object.prototype.hasOwnProperty.call(c.vars, head)) { v = c.vars[head]; found = true; break; } c = c.parent; }
    if (!found) v = ctx.root.vals ? ctx.root.vals[head] : undefined;
    for (var i = 1; i < parts.length; i++) { if (v == null) return undefined; v = v[parts[i]]; }
    return v;
  }
  function interp(str, ctx) {
    return str.replace(HOLE, function (_, p) { var v = lookup(p, ctx); return v == null ? '' : String(v); });
  }

  // Build live DOM from a template node; returns {nodes, update}
  function build(tnode, ctx, parent, before) {
    var bindings = [];
    function walk(t, into, ref) {
      if (t.nodeType === 3) {
        var txt = t.nodeValue;
        var n = document.createTextNode(txt);
        into.insertBefore(n, ref);
        if (txt.indexOf('{{') >= 0) {
          var last;
          bindings.push(function (c) { var v = interp(txt, c); if (v !== last) { n.nodeValue = v; last = v; } });
        }
        return;
      }
      if (t.nodeType !== 1) return;
      var tag = t.localName;
      if (tag === 'sc-if') return scIf(t, into, ref);
      if (tag === 'sc-for') return scFor(t, into, ref);
      var el = document.createElementNS(t.namespaceURI, t.localName);
      for (var i = 0; i < t.attributes.length; i++) {
        (function (a) {
          var name = a.name, val = a.value, lname = name.toLowerCase();
          if (lname.indexOf('hint-') === 0) return;
          if (EVENTS[lname]) {
            var m = ONE.exec(val);
            if (!m) return;
            var holder = { c: null };
            bindings.push(function (c) { holder.c = c; });
            el.addEventListener(EVENTS[lname], function (e) { var fn = lookup(m[1], holder.c); if (typeof fn === 'function') fn(e); }, lname === 'onwheel' ? { passive: true } : false);
            return;
          }
          if (lname === 'ref') {
            var mr = ONE.exec(val), lastFn = null;
            if (mr) bindings.push(function (c) { var fn = lookup(mr[1], c); if (typeof fn === 'function' && fn !== lastFn) { lastFn = fn; fn(el); } });
            return;
          }
          if (val.indexOf('{{') >= 0) {
            var lastV;
            bindings.push(function (c) { var v = interp(val, c); if (v !== lastV) { el.setAttribute(name, v); lastV = v; } });
          } else {
            if (a.namespaceURI) el.setAttributeNS(a.namespaceURI, name, val); else el.setAttribute(name, val);
          }
        })(t.attributes[i]);
      }
      into.insertBefore(el, ref);
      var kids = (t.content && t.localName === 'template') ? t.content.childNodes : t.childNodes;
      for (var k = 0; k < kids.length; k++) walk(kids[k], el, null);
    }
    function scIf(t, into, ref) {
      var anchor = document.createComment('if');
      into.insertBefore(anchor, ref);
      var m = ONE.exec(t.getAttribute('value') || ''), inst = null;
      bindings.push(function (c) {
        var on = m ? !!lookup(m[1], c) : false;
        if (on && !inst) { inst = buildChildren(t, c, anchor.parentNode, anchor); }
        else if (!on && inst) { inst.remove(); inst = null; }
        if (inst) inst.update(c);
      });
    }
    function scFor(t, into, ref) {
      var anchor = document.createComment('for');
      into.insertBefore(anchor, ref);
      var m = ONE.exec(t.getAttribute('list') || ''), as = t.getAttribute('as') || 'item', items = [];
      bindings.push(function (c) {
        var list = (m ? lookup(m[1], c) : []) || [];
        while (items.length > list.length) items.pop().inst.remove();
        for (var i = 0; i < list.length; i++) {
          var vars = {}; vars[as] = list[i]; vars.$index = i;
          if (!items[i]) {
            var sub = { parent: c, vars: vars, root: c.root };
            items[i] = { ctx: sub, inst: buildChildren(t, sub, anchor.parentNode, anchor) };
          }
          items[i].ctx.vars = vars; items[i].ctx.parent = c;
          items[i].inst.update(items[i].ctx);
        }
      });
    }
    function buildChildren(t, c, into, ref) {
      var frag = document.createDocumentFragment();
      var sub = build(null, c, frag, null, t.childNodes);
      var nodes = Array.prototype.slice.call(frag.childNodes);
      into.insertBefore(frag, ref);
      return { update: sub.update, remove: function () { nodes.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); }); } };
    }
    var list = arguments[4] || (tnode ? tnode.childNodes : []);
    for (var i = 0; i < list.length; i++) walk(list[i], parent, before);
    return { update: function (c) { for (var j = 0; j < bindings.length; j++) bindings[j](c); } };
  }

  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (patch) {
    var s = Object.assign({}, this.state || {}, typeof patch === 'function' ? patch(this.state) : patch);
    this.state = s;
    this.__schedule && this.__schedule();
  };
  DCLogic.prototype.forceUpdate = function () { this.__schedule && this.__schedule(); };
  window.DCLogic = DCLogic;

  window.DC = {
    mount: function (Comp, tpl, host, propsSpec) {
      var props = {};
      Object.keys(propsSpec || {}).forEach(function (k) { if (k[0] !== '$' && propsSpec[k] && 'default' in propsSpec[k]) props[k] = propsSpec[k].default; });
      var comp = new Comp(props);
      comp.props = props; comp.state = comp.state || {};
      var root = { vals: {} };
      var ctx = { parent: null, vars: null, root: root };
      var content = tpl.content;
      var helmet = content.querySelector('helmet');
      var xdc = content.querySelector('x-dc') || content;
      if (helmet) { Array.prototype.slice.call(helmet.childNodes).forEach(function (n) { if (n.nodeType === 1) document.head.appendChild(document.importNode(n, true)); }); helmet.parentNode.removeChild(helmet); }
      var view = build(xdc, ctx, host, null);
      var pending = false;
      function render() { pending = false; root.vals = comp.renderVals() || {}; view.update(ctx); }
      comp.__schedule = function () { if (!pending) { pending = true; Promise.resolve().then(render); } };
      render();
      if (comp.componentDidMount) comp.componentDidMount();
    }
  };
})();
