/* Minute Cryptic — game logic. */
(function () {
  'use strict';

  var P = window.PUZZLE;
  var STORE = 'mc:' + P.date + ':' + P.answer.length;

  var LETTERS = P.answer.replace(/[^A-Za-z]/g, '').toUpperCase().split('');
  var N = LETTERS.length;

  var state = {
    letters: new Array(N).fill(''),
    cursor: 0,
    revealed: {},        // hint id -> true
    revealedTypes: {},   // 'fodder' | 'indicator' | 'definition' -> true
    solved: false,
  };

  var $ = function (id) { return document.getElementById(id); };
  var grid = $('grid');
  var dotsEl = $('dots');
  var sheet = $('sheet');
  var sheetBody = $('sheet-body');
  var sheetBack = $('sheet-back');
  var checkBtn = $('check');
  var resultEl = $('result');
  var cells = [];
  var scrim;

  /* ── persistence ─────────────────────────────────────────────────────── */

  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {}
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORE);
      if (!raw) return;
      var s = JSON.parse(raw);
      if (s && Array.isArray(s.letters) && s.letters.length === N) {
        state.letters = s.letters;
        state.revealed = s.revealed || {};
        state.revealedTypes = s.revealedTypes || {};
        state.solved = !!s.solved;
        state.cursor = state.letters.indexOf('');
        if (state.cursor < 0) state.cursor = N - 1;
      }
    } catch (e) {}
  }

  /* ── header + clue ───────────────────────────────────────────────────── */

  function renderHeader() {
    $('date').textContent = P.date;
    $('byline').textContent = P.byline;
  }

  function renderClue() {
    var el = $('clue');
    el.textContent = '';
    P.clue.parts.forEach(function (part) {
      if (!part.type) {
        el.appendChild(document.createTextNode(part.text));
        return;
      }
      var span = document.createElement('span');
      span.className = 'hl';
      span.dataset.type = part.type;
      span.textContent = part.text;
      el.appendChild(span);
    });
    syncHighlights();
  }

  function syncHighlights() {
    [].forEach.call(document.querySelectorAll('.clue .hl'), function (span) {
      span.classList.toggle('on', !!state.revealedTypes[span.dataset.type]);
    });
  }

  /* ── grid ────────────────────────────────────────────────────────────── */

  function renderGrid() {
    grid.textContent = '';
    cells = [];
    var index = 0;
    P.enumeration.forEach(function (len) {
      var word = document.createElement('div');
      word.className = 'word';
      for (var i = 0; i < len; i++) {
        var cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = index;
        word.appendChild(cell);
        cells.push(cell);
        index++;
      }
      grid.appendChild(word);
    });
    sizeGrid();
    paintGrid();
  }

  /* Shrink the cells so the whole answer always fits the viewport. */
  function sizeGrid() {
    var avail = Math.min(window.innerWidth, 640) - 32;
    var gaps = (P.enumeration.length - 1) * 18;
    var max = Math.floor((avail - gaps) / N);
    document.documentElement.style.setProperty('--cell', Math.min(46, max) + 'px');
  }

  function paintGrid() {
    cells.forEach(function (cell, i) {
      cell.textContent = state.letters[i] || '';
      cell.classList.toggle('active', !state.solved && i === state.cursor);
    });
    grid.classList.toggle('correct', state.solved);
    var full = state.letters.every(function (l) { return l !== ''; });
    checkBtn.disabled = state.solved || !full;
    if (state.solved) checkBtn.textContent = 'solved';
  }

  /* ── typing ──────────────────────────────────────────────────────────── */

  function typeLetter(ch) {
    if (state.solved) return;
    grid.classList.remove('wrong');
    state.letters[state.cursor] = ch.toUpperCase();
    state.cursor = Math.min(state.cursor + 1, N - 1);
    resultEl.textContent = '';
    paintGrid();
    save();
  }

  function backspace() {
    if (state.solved) return;
    grid.classList.remove('wrong');
    if (state.letters[state.cursor]) {
      state.letters[state.cursor] = '';
    } else {
      state.cursor = Math.max(state.cursor - 1, 0);
      state.letters[state.cursor] = '';
    }
    resultEl.textContent = '';
    paintGrid();
    save();
  }

  function move(delta) {
    state.cursor = Math.max(0, Math.min(N - 1, state.cursor + delta));
    paintGrid();
  }

  grid.addEventListener('mousedown', function (e) {
    var cell = e.target.closest('.cell');
    if (!cell || state.solved) return;
    e.preventDefault();
    state.cursor = Number(cell.dataset.index);
    paintGrid();
  });

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (!sheet.hidden) {
      if (e.key === 'Escape') closeSheet();
      return;
    }
    if (/^[a-zA-Z]$/.test(e.key)) { e.preventDefault(); typeLetter(e.key); }
    else if (e.key === 'Backspace') { e.preventDefault(); backspace(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
    else if (e.key === 'Enter') { e.preventDefault(); check(); }
  });

  /* ── on-screen keyboard ──────────────────────────────────────────────── */

  var ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
  var BACKSPACE_SVG =
    '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">' +
    '<path d="M21 5H8.5L2.5 12l6 7H21a1.6 1.6 0 0 0 1.6-1.6V6.6A1.6 1.6 0 0 0 21 5z" ' +
    'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<path d="M18 9.5l-6 5M12 9.5l6 5" fill="none" stroke="currentColor" ' +
    'stroke-width="1.6" stroke-linecap="round"/></svg>';

  function renderKeyboard() {
    var kb = $('keyboard');
    kb.textContent = '';
    ROWS.forEach(function (row, r) {
      var rowEl = document.createElement('div');
      rowEl.className = 'kb-row';
      row.split('').forEach(function (ch) {
        var key = document.createElement('button');
        key.type = 'button';
        key.className = 'key';
        key.dataset.key = ch;
        key.textContent = ch;
        rowEl.appendChild(key);
      });
      if (r === ROWS.length - 1) {
        var bk = document.createElement('button');
        bk.type = 'button';
        bk.className = 'key';
        bk.dataset.key = '{bksp}';
        bk.setAttribute('aria-label', 'backspace');
        bk.innerHTML = BACKSPACE_SVG;
        rowEl.appendChild(bk);
      }
      kb.appendChild(rowEl);
    });
    kb.style.setProperty('--kb', '1');
    document.documentElement.style.setProperty(
      '--kb-height', kb.offsetHeight + 'px');

    kb.addEventListener('click', function (e) {
      var key = e.target.closest('.key');
      if (!key || !sheet.hidden) return;
      if (key.dataset.key === '{bksp}') backspace();
      else typeLetter(key.dataset.key);
    });
  }

  /* ── hint dots ───────────────────────────────────────────────────────── */

  var DOT_COUNT = 10;

  function renderDots() {
    dotsEl.textContent = '';
    var used = Object.keys(state.revealed).length;
    for (var i = 0; i < DOT_COUNT; i++) {
      var col = document.createElement('div');
      col.className = 'dot-col';
      var dot = document.createElement('div');
      dot.className = 'dot' + (i < used ? ' used' : '') +
        (i === P.par - 1 ? ' par' : '');
      col.appendChild(dot);
      if (i === P.par - 1) {
        var label = document.createElement('span');
        label.className = 'par-label';
        label.textContent = 'par';
        col.appendChild(label);
      }
      dotsEl.appendChild(col);
    }
  }

  /* ── sheet: hints, info, guide ───────────────────────────────────────── */

  function ensureScrim() {
    if (scrim) return scrim;
    scrim = document.createElement('div');
    scrim.className = 'scrim';
    scrim.hidden = true;
    scrim.addEventListener('click', closeSheet);
    document.body.appendChild(scrim);
    return scrim;
  }

  function openSheet(render, showBack) {
    ensureScrim().hidden = false;
    sheet.hidden = false;
    sheetBack.hidden = !showBack;
    sheetBody.textContent = '';
    render(sheetBody);
    sheet.scrollTop = 0;
  }

  function closeSheet() {
    sheet.hidden = true;
    if (scrim) scrim.hidden = true;
  }

  function para(parent, text, cls) {
    var p = document.createElement('p');
    if (cls) p.className = cls;
    p.textContent = text;
    parent.appendChild(p);
    return p;
  }

  function hintMenu(parent) {
    para(parent, 'hints', 'sheet-title');
    var list = document.createElement('div');
    list.className = 'hint-list';
    P.hints.forEach(function (hint) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'hint-item' + (state.revealed[hint.id] ? ' opened' : '');
      if (hint.reveals) item.dataset.reveals = hint.reveals;
      var label = document.createElement('span');
      label.textContent = hint.label;
      item.appendChild(label);
      var tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = state.revealed[hint.id] ? 'seen' : '+1';
      item.appendChild(tag);
      item.addEventListener('click', function () { openHint(hint); });
      list.appendChild(item);
    });
    parent.appendChild(list);
  }

  function openHint(hint) {
    if (!state.revealed[hint.id]) {
      state.revealed[hint.id] = true;
      if (hint.reveals) state.revealedTypes[hint.reveals] = true;
      if (hint.isAnswer) {
        state.revealedTypes.fodder = true;
        state.revealedTypes.indicator = true;
        state.revealedTypes.definition = true;
        state.letters = LETTERS.slice();
        state.solved = true;
        resultEl.textContent = 'revealed';
        paintGrid();
      }
      syncHighlights();
      renderDots();
      save();
    }
    openSheet(function (body) { para(body, hint.text); }, true);
  }

  sheetBack.addEventListener('click', function () {
    openSheet(hintMenu, false);
  });
  $('sheet-close').addEventListener('click', closeSheet);

  [].forEach.call(document.querySelectorAll('[data-open]'), function (btn) {
    btn.addEventListener('click', function () {
      var which = btn.dataset.open;
      if (which === 'hints') openSheet(hintMenu, false);
      else if (which === 'info') openSheet(infoSheet, false);
      else if (which === 'guide') openSheet(guideSheet, false);
    });
  });

  function infoSheet(body) {
    para(body, 'about this clue', 'sheet-title');
    para(body, P.date + ' — ' + P.byline.replace(/^By /, ''));
    para(body,
      'One cryptic clue a day. Every clue is a definition plus wordplay, and ' +
      'both point at the same answer. Type your answer into the grid and hit ' +
      'check — wrong guesses cost you nothing.');
    para(body,
      'Scoring works like golf: par is the number of hints a clue of this ' +
      'difficulty is expected to take. Par here is ' + P.par + '.');
  }

  function guideSheet(body) {
    para(body, 'how to play', 'sheet-title');
    para(body,
      'A cryptic clue reads like a sentence but works like a machine. Split it ' +
      'into two halves: a straight definition, almost always at one end, and ' +
      'wordplay that spells out the same answer a second way.');
    para(body,
      'In the wordplay, look for fodder — the letters you will be shuffling, ' +
      'hiding or beheading — and indicators, the words telling you what to do ' +
      'with them. "Wild", "confused" and "at sea" all shout anagram; ' +
      '"in" and "held by" suggest a container; "back" means a reversal.');
    para(body,
      'The number in brackets is the enumeration: how many letters, and how ' +
      'the answer breaks into words.');
  }

  /* ── check ───────────────────────────────────────────────────────────── */

  function check() {
    if (checkBtn.disabled) return;
    var guess = state.letters.join('');
    if (guess === LETTERS.join('')) {
      state.solved = true;
      grid.classList.remove('wrong');
      var used = Object.keys(state.revealed).length;
      resultEl.textContent = used <= P.par
        ? (used === P.par ? 'par!' : (P.par - used) + ' under par!')
        : (used - P.par) + ' over par';
      paintGrid();
      save();
    } else {
      grid.classList.add('wrong');
      resultEl.textContent = 'not quite';
      setTimeout(function () { grid.classList.remove('wrong'); }, 700);
    }
  }

  checkBtn.addEventListener('click', check);

  document.querySelector('.header .back').addEventListener('click', function () {
    if (!sheet.hidden) closeSheet();
  });

  window.addEventListener('resize', sizeGrid);

  /* ── boot ────────────────────────────────────────────────────────────── */

  load();
  renderHeader();
  renderClue();
  renderGrid();
  renderDots();
  renderKeyboard();
  if (state.solved) {
    resultEl.textContent = 'solved';
    paintGrid();
  }
})();
