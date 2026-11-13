/* =========================================================
   Scheikunde oefenen – H3 (3 havo, Chemie Overal)
   Vanilla JS single page app. Gegevens per gebruiker in localStorage.
   ========================================================= */
(function () {
  "use strict";

  /* ---------------- Hulpfuncties ---------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const gcd = (a, b) => b ? gcd(b, a % b) : a;

  /* k items trekken zonder teruglegging, met gewicht (Efraimidis–Spirakis) */
  function weightedSample(items, k, weightFn) {
    return items
      .map(it => ({ it, key: Math.pow(Math.random(), 1 / weightFn(it)) }))
      .sort((a, b) => b.key - a.key)
      .slice(0, k)
      .map(x => x.it);
  }
  /* bevat een formule alleen niet-metalen? */
  const onlyNonMetals = f => Object.keys(parseFormula(f)).every(e => NONMETAL_SYMBOLS.includes(e));
  const weightOf = ok => ok ? NONMETAL_WEIGHT : 1;
  const pct = (a, b) => b ? Math.round((a / b) * 100) : 0;

  /* formule → HTML met subscripts, bv. Ca(OH)2 → Ca(OH)<sub>2</sub> */
  function fHTML(f) {
    return esc(f).replace(/([A-Za-z)\]])(\d+)/g, "$1<sub>$2</sub>");
  }

  /* formule → { element: aantal }, ondersteunt haakjes */
  function parseFormula(f) {
    let i = 0;
    function group() {
      const counts = {};
      while (i < f.length && f[i] !== ")") {
        let part;
        if (f[i] === "(") { i++; part = group(); i++; }
        else {
          const m = /^[A-Z][a-z]?/.exec(f.slice(i));
          if (!m) throw new Error("Ongeldige formule: " + f);
          i += m[0].length; part = { [m[0]]: 1 };
        }
        const n = /^\d+/.exec(f.slice(i));
        const mult = n ? parseInt(n[0], 10) : 1;
        if (n) i += n[0].length;
        for (const k in part) counts[k] = (counts[k] || 0) + part[k] * mult;
      }
      return counts;
    }
    return group();
  }

  function sideCounts(species, coefs) {
    const tot = {};
    species.forEach((s, k) => {
      const c = parseFormula(s);
      for (const el in c) tot[el] = (tot[el] || 0) + c[el] * coefs[k];
    });
    return tot;
  }

  function elementOrder(rx) {
    const seen = [];
    [...rx.r, ...rx.p].forEach(s => Object.keys(parseFormula(s)).forEach(e => { if (!seen.includes(e)) seen.push(e); }));
    return seen;
  }

  function equationHTML(rx, coefs) {
    const term = (s, k) => {
      const c = coefs ? coefs[k] : null;
      return `<span class="term">${c && c !== 1 ? `<b class="coef-shown">${c}</b>&nbsp;` : ""}<span class="formula">${fHTML(s)}</span></span>`;
    };
    const left = rx.r.map((s, k) => term(s, k)).join(' <span class="op">+</span> ');
    const right = rx.p.map((s, k) => term(s, k + rx.r.length)).join(' <span class="op">+</span> ');
    return `${left} <span class="arrow">→</span> ${right}`;
  }

  const SUBS = { "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9" };
  const cleanFormula = s => String(s).replace(/[₀-₉]/g, c => SUBS[c]).replace(/\s+/g, "");

  /* namen vergelijken: hoofdletters, spaties, streepjes en klinkerbotsingen negeren */
  function normName(s) {
    return String(s).toLowerCase().trim()
      .replace(/[\s\-‐–_]/g, "")
      .replace(/jodium/g, "jood")
      .replace(/([ao])oxide/g, "oxide");
  }

  /* ---------------- Opslag (per gebruiker) ---------------- */
  const STORE_KEY = "scheikunde-h3-oefenen-v1";
  let store = { current: null, users: {} };
  let storageOK = true;

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && d.users) store = d;
      }
    } catch (e) { storageOK = false; }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); }
    catch (e) { storageOK = false; }
  }
  /* Eén leerling per browser: alles komt onder één vaste sleutel te staan. */
  const DEFAULT_USER = "leerling";
  function user() { return store.users[store.current]; }
  function ensureUser() {
    if (!store.current || !store.users[store.current]) store.current = DEFAULT_USER;
    if (!store.users[store.current]) store.users[store.current] = { created: Date.now(), rounds: [], stats: {} };
    save();
  }

  function recordAnswer(q, correct) {
    const u = user(); if (!u) return;
    const s = u.stats[q.id] || (u.stats[q.id] = { right: 0, wrong: 0, last: null });
    if (correct) s.right++; else s.wrong++;
    s.last = correct ? 1 : 0; s.ts = Date.now();
    save();
  }

  function recordRound(r) {
    const u = user(); if (!u || !r.results.length) return;
    u.rounds.push({
      ts: r.started, end: Date.now(), mode: r.mode, label: r.label,
      score: r.results.filter(x => x.correct).length, total: r.results.length,
      planned: r.questions.length,
      items: r.results.map(x => ({ id: x.id, p: x.promptText, g: x.given, e: x.expected, c: x.correct }))
    });
    if (u.rounds.length > 300) u.rounds = u.rounds.slice(-300);
    save();
  }

  /* ---------------- Vragen bouwen ---------------- */
  const KIND_LABEL = { bal: "Kloppend maken", f2n: "Formule → naam", n2f: "Naam → formule" };

  function molecularName(f, pretty = true) {
    const parts = [...f.matchAll(/([A-Z][a-z]?)(\d*)/g)].map(m => [m[1], m[2] ? +m[2] : 1]);
    const [[e1, n1], [e2, n2]] = parts;
    const first = (n1 > 1 ? PREFIXES[n1] : "") + FIRST_NAME[e1];
    let pre2 = PREFIXES[n2], second = SECOND_NAME[e2];
    const joint = pretty && /o$/.test(pre2) && /^o/.test(second) ? "-" : "";
    return { name: first + pre2 + joint + second, e1, n1, e2, n2, first, pre2, second };
  }

  function molecularSteps(f, dir) {
    const m = molecularName(f);
    const el1 = ELEMENT_BY_SYMBOL[m.e1].name, el2 = ELEMENT_BY_SYMBOL[m.e2].name;
    const steps = [];
    if (dir === "f2n") {
      steps.push(`${fHTML(f)} bestaat uit twee niet-metalen: een <b>moleculaire stof</b>. Je geeft het aantal atomen aan met telwoorden (mono, di, tri, tetra, penta, hexa).`);
      steps.push(m.n1 > 1
        ? `Eerste element: <b>${m.e1}</b> = ${el1}, ${m.n1} atomen → <i>${PREFIXES[m.n1]}</i> + ${FIRST_NAME[m.e1]} = <b>${m.first}</b>.`
        : `Eerste element: <b>${m.e1}</b> = ${el1}, 1 atoom → bij het eerste element laat je <i>mono</i> weg → <b>${m.first}</b>.`);
      const part2 = m.pre2 + (m.pre2.endsWith("o") && m.second.startsWith("o") ? "-" : "") + m.second;
      steps.push(`Tweede element: <b>${m.e2}</b> = ${el2}, ${m.n2 === 1 ? "1 atoom" : m.n2 + " atomen"} → <i>${m.pre2}</i> + ${m.second} = <b>${part2}</b>. Het tweede element krijgt de uitgang <i>-ide</i> (${el2} → ${m.second})${m.n2 === 1 ? "; hier schrijf je <i>mono</i> wél" : ""}.`);
      steps.push(`Samen: <b>${m.name}</b>.`);
    } else {
      steps.push(`Knip de naam in stukken: <b>${m.n1 > 1 ? PREFIXES[m.n1] + " · " : ""}${FIRST_NAME[m.e1]}</b> + <b>${m.pre2} · ${m.second}</b>.`);
      steps.push(`${FIRST_NAME[m.e1]} = <b>${m.e1}</b>; ${m.n1 > 1 ? `<i>${PREFIXES[m.n1]}</i> = ${m.n1}` : "geen telwoord = 1"} → <b>${fHTML(m.e1 + (m.n1 > 1 ? m.n1 : ""))}</b>.`);
      steps.push(`${m.second} komt van ${el2} = <b>${m.e2}</b>; <i>${m.pre2}</i> = ${m.n2} → <b>${fHTML(m.e2 + (m.n2 > 1 ? m.n2 : ""))}</b>.`);
      steps.push(`Formule: <b>${fHTML(f)}</b>. Let op: het aantal schrijf je als index (klein, rechtsonder); 1 schrijf je niet op.`);
    }
    return steps;
  }

  const ELEMENT_ALT = { U: ["uranium"], Ti: ["titanium"], I: ["jodium"], Sb: ["stibium"], As: ["arsenicum"] };

  /* bouw een vraag op basis van zijn id, bv. "bal:r17", "f2n:mol:N2O4", "n2f:el:Fe" */
  function buildQuestion(id) {
    const [kind, ...rest] = id.split(":");
    if (kind === "bal") {
      const rx = REACTIONS.find(x => x.id === rest[0]);
      if (!rx) return null;
      return { id, kind, rx, lvl: rx.lvl, title: "Maak de reactievergelijking kloppend", promptText: `${rx.r.join(" + ")} → ${rx.p.join(" + ")}`, expected: rx.c };
    }
    const [cat, key] = rest;
    let f, names, steps, prompt, hint = "";
    if (cat === "mol") {
      if (!MOLECULAR.includes(key)) return null;
      f = key; names = [molecularName(f).name];
      steps = molecularSteps(f, kind);
    } else if (cat === "el") {
      const e = ELEMENT_BY_SYMBOL[key]; if (!e) return null;
      f = key; names = [e.name, ...(ELEMENT_ALT[key] || [])];
      steps = kind === "f2n"
        ? [`<b>${key}</b> is het symbool van het element <b>${e.name}</b> (atoomnummer ${e.z}). Zoek het op in het periodiek systeem als je het niet meer weet.`]
        : [`Het symbool van ${e.name} is <b>${key}</b>.`, `Een symbool begint altijd met een <b>hoofdletter</b>; een eventuele tweede letter is een kleine letter (Co = kobalt, CO = koolstofmono-oxide!).`];
    } else if (cat === "di") {
      const e = ELEMENT_BY_SYMBOL[key]; if (!e || !e.diatomic) return null;
      f = key + "2"; names = [e.name, ...(ELEMENT_ALT[key] || [])];
      steps = [`De stof ${e.name} bestaat uit moleculen van <b>twee</b> atomen: ${fHTML(f)}.`,
        `Zeven elementen komen als twee-atomige moleculen voor: ${["H2", "N2", "O2", "F2", "Cl2", "Br2", "I2"].map(fHTML).join(", ")}. Ezelsbruggetje: <b>HONClBrIF</b>.`];
    } else if (cat === "tr") {
      const t = TRIVIAL.find(x => x.f === key); if (!t) return null;
      f = key; names = [t.n, ...t.alt];
      steps = [`<b>${t.n}</b> = ${fHTML(f)}. Dit is een triviale naam: die leer je uit je hoofd.`, t.info];
    } else return null;

    const catLabel = { mol: "moleculaire stof", el: "element", di: "twee-atomige stof", tr: "triviale naam" }[cat];
    if (kind === "f2n") {
      prompt = cat === "el" ? `Wat is de naam van het element <span class="formula big">${fHTML(f)}</span>?`
        : `Geef de naam van de stof <span class="formula big">${fHTML(f)}</span>.`;
      if (cat === "mol") hint = "Gebruik telwoorden: mono, di, tri, tetra, penta, hexa.";
    } else {
      prompt = cat === "el" ? `Wat is het symbool van het element <b class="big">${esc(names[0])}</b>?`
        : `Geef de formule van <b class="big">${esc(names[0])}</b>.`;
      hint = "Typ cijfers gewoon achter het symbool (N2O4); ze worden automatisch klein gezet.";
    }
    return {
      id, kind, cat, catLabel, f, names, steps, prompt, hint,
      title: KIND_LABEL[kind],
      promptText: kind === "f2n" ? f : names[0],
      expected: kind === "f2n" ? names[0] : f
    };
  }

  function namingPool(cats, dirs) {
    const ids = [];
    dirs.forEach(d => {
      if (cats.includes("mol")) MOLECULAR.filter(f => SECOND_NAME[f.match(/([A-Z][a-z]?)\d*$/)[1]]).forEach(f => ids.push(`${d}:mol:${f}`));
      if (cats.includes("el")) COMMON_ELEMENTS.forEach(s => ids.push(`${d}:el:${s}`));
      if (cats.includes("di")) DIATOMIC.forEach(s => ids.push(`${d}:di:${s}`));
      if (cats.includes("tr")) TRIVIAL.forEach(t => ids.push(`${d}:tr:${t.f}`));
    });
    return ids;
  }

  /* ---------------- Antwoorden controleren ---------------- */
  function checkBalance(q, raw) {
    const rx = q.rx;
    const coefs = [];
    for (const v of raw) {
      const t = v.trim();
      if (t === "") { coefs.push(1); continue; }
      if (!/^\d+$/.test(t) || +t < 1) return { invalid: "Vul alleen hele getallen van 1 of hoger in (een leeg vakje telt als 1)." };
      coefs.push(+t);
    }
    const n = rx.r.length;
    const L = sideCounts(rx.r, coefs.slice(0, n)), R = sideCounts(rx.p, coefs.slice(n));
    const els = elementOrder(rx);
    const balanced = els.every(e => (L[e] || 0) === (R[e] || 0));
    const g = coefs.reduce(gcd);
    const correct = balanced && g === 1;
    let msg = "";
    if (balanced && g > 1) msg = `Je vergelijking klopt wel, maar het moeten de <b>kleinste gehele getallen</b> zijn. Je kunt alles nog door ${g} delen.`;
    else if (!balanced) {
      const wrong = els.filter(e => (L[e] || 0) !== (R[e] || 0));
      msg = `Met jouw coëfficiënten klopt het aantal ${wrong.map(e => `<b>${e}</b>`).join(", ")}-atomen niet links en rechts.`;
    }
    return { correct, coefs, L, R, msg, given: coefs.join(" ") };
  }

  function checkText(q, raw) {
    const ans = raw.trim();
    if (!ans) return { invalid: "Vul eerst een antwoord in." };
    if (q.kind === "f2n") {
      const ok = q.names.some(n => normName(n) === normName(ans));
      let msg = "";
      if (!ok && q.cat === "mol") {
        const a = normName(ans);
        if (/^mono/.test(a)) msg = "Let op: bij het <b>eerste</b> element laat je <i>mono</i> weg.";
        else if (a.endsWith(normName(molecularName(q.f).second)) === false) msg = `Het tweede element krijgt de uitgang <b>-ide</b> (${esc(molecularName(q.f).second)}).`;
      }
      return { correct: ok, given: ans, msg };
    }
    const a = cleanFormula(ans);
    const ok = a === q.f;
    let msg = "";
    if (!ok) {
      if (a.toLowerCase() === q.f.toLowerCase()) msg = "Let op de <b>hoofdletters</b> en kleine letters!";
      else {
        try {
          const pa = parseFormula(a), pe = parseFormula(q.f);
          const same = Object.keys(pe).length === Object.keys(pa).length && Object.keys(pe).every(k => pa[k] === pe[k]);
          if (same) msg = "De juiste atomen, maar in de verkeerde volgorde. Schrijf de elementen in de volgorde van de naam.";
        } catch (e) { msg = "Dit is geen geldige formule."; }
      }
    }
    return { correct: ok, given: a, msg };
  }

  /* ---------------- Weergave ---------------- */
  const app = $("#app");
  let round = null;     // huidige oefenronde
  let view = "home";

  const settings = {
    type: "bal", lvl: "1", count: 10,
    dirs: ["f2n", "n2f"], cats: ["mol"]
  };
  try { Object.assign(settings, JSON.parse(localStorage.getItem(STORE_KEY + "-settings") || "{}")); } catch (e) { /* geen opslag */ }
  const saveSettings = () => { try { localStorage.setItem(STORE_KEY + "-settings", JSON.stringify(settings)); } catch (e) { /* */ } };

  function setNav() {
    document.querySelectorAll(".nav-btn[data-nav]").forEach(b => b.classList.toggle("active", b.dataset.nav === view || (view === "quiz" && b.dataset.nav === "home") || (view === "result" && b.dataset.nav === "home")));
  }

  function go(v) {
    if (round && view === "quiz" && v !== "quiz") {
      if (round.results.length && !round.saved) { recordRound(round); round.saved = true; }
      round = null;
    }
    view = v;
    setNav();
    ({ home: renderHome, history: renderHistory, quiz: renderQuestion, result: renderResult }[view] || renderHome)();
    window.scrollTo(0, 0);
  }

  /* ---- Startscherm ---- */
  function renderHome() {
    const u = user();
    const wrongIds = Object.entries(u.stats).filter(([id, s]) => s.last === 0 && buildQuestion(id)).map(([id]) => id);
    const chk = (arr, v) => arr.includes(v) ? "checked" : "";
    app.innerHTML = `
      <section class="hero">
        <h1>Wat ga je oefenen?</h1>
        <p class="muted">Kies een onderdeel. Na elke vraag zie je meteen of je antwoord goed is, met de uitwerking. Je scores worden automatisch bewaard in deze browser.</p>
        ${!storageOK ? `<p class="warn">Let op: deze browser staat opslaan niet toe (bijvoorbeeld in een privévenster). Je scores worden niet bewaard.</p>` : ""}
      </section>

      <div class="grid-2">
        <section class="card mode ${settings.type === "bal" ? "selected" : ""}" data-type="bal">
          <div class="mode-head">
            <span class="mode-icon">⚖️</span>
            <div><h2>Reactievergelijkingen kloppend maken</h2>
            <p class="muted">Zet de juiste coëfficiënten voor de formules.</p></div>
          </div>
          <div class="example">2 H<sub>2</sub> + O<sub>2</sub> → 2 H<sub>2</sub>O</div>
          <fieldset><legend>Niveau</legend>
            <div class="seg">
              ${[["1", "Makkelijk"], ["2", "Gemiddeld"], ["3", "Moeilijk"], ["mix", "Alles door elkaar"]].map(([v, l]) =>
                `<label><input type="radio" name="lvl" value="${v}" ${settings.lvl === v ? "checked" : ""}><span>${l}</span></label>`).join("")}
            </div>
          </fieldset>
        </section>

        <section class="card mode ${settings.type === "name" ? "selected" : ""}" data-type="name">
          <div class="mode-head">
            <span class="mode-icon">🏷️</span>
            <div><h2>Systematische naamgeving</h2>
            <p class="muted">Van formule naar naam en andersom.</p></div>
          </div>
          <div class="example">N<sub>2</sub>O<sub>4</sub> ⇄ distikstoftetraoxide</div>
          <fieldset><legend>Richting</legend>
            <div class="seg">
              <label><input type="checkbox" name="dir" value="f2n" ${chk(settings.dirs, "f2n")}><span>Formule → naam</span></label>
              <label><input type="checkbox" name="dir" value="n2f" ${chk(settings.dirs, "n2f")}><span>Naam → formule</span></label>
            </div>
          </fieldset>
          <fieldset><legend>Soort stoffen</legend>
            <div class="seg">
              <label><input type="checkbox" name="cat" value="mol" ${chk(settings.cats, "mol")}><span>Moleculaire stoffen (di, tri…)</span></label>
              <label><input type="checkbox" name="cat" value="el" ${chk(settings.cats, "el")}><span>Elementen</span></label>
              <label><input type="checkbox" name="cat" value="di" ${chk(settings.cats, "di")}><span>H<sub>2</sub>, O<sub>2</sub>, Cl<sub>2</sub>…</span></label>
              <label><input type="checkbox" name="cat" value="tr" ${chk(settings.cats, "tr")}><span>Triviale namen</span></label>
            </div>
          </fieldset>
        </section>
      </div>

      <section class="card start-bar">
        <label class="count">Aantal vragen
          <select id="count">${[5, 10, 15, 20].map(n => `<option ${settings.count === n ? "selected" : ""}>${n}</option>`).join("")}</select>
        </label>
        <p id="start-err" class="err" hidden></p>
        <button class="btn primary big" id="start">Start oefenronde</button>
      </section>

      ${wrongIds.length ? `
      <section class="card retry">
        <div><h2 class="h-sm">Oefen je fouten</h2>
        <p class="muted">Er ${wrongIds.length === 1 ? "is 1 vraag" : `zijn ${wrongIds.length} vragen`} die je de laatste keer fout had.</p></div>
        <button class="btn accent" id="retry">Oefen ${Math.min(wrongIds.length, 20)} foute vragen</button>
      </section>` : ""}

      <section class="card tips">
        <h2 class="h-sm">Telwoorden</h2>
        <div class="prefix-table">
          ${PREFIXES.slice(1).map((p, i) => `<span><b>${i + 1}</b> ${p}</span>`).join("")}
        </div>
        <h2 class="h-sm">Komen nooit alleen voor (twee-atomig)</h2>
        <p class="muted small">Als element schrijf je deze altijd met een 2.</p>
        <div class="prefix-table">
          ${DIATOMIC.map(s => `<span><b>${fHTML(s + "2")}</b> ${ELEMENT_BY_SYMBOL[s].name}</span>`).join("")}
        </div>
        <h2 class="h-sm">Andere naam aan het eind (-ide)</h2>
        <p class="muted small">Staat dit element als tweede in de naam, dan krijgt het een andere naam.</p>
        <div class="prefix-table">
          ${Object.entries(SECOND_NAME).map(([s, n]) => `<span><b>${s}</b> ${ELEMENT_BY_SYMBOL[s].name} → ${n}</span>`).join("")}
        </div>
      </section>`;

    app.querySelectorAll(".mode").forEach(card => card.addEventListener("click", () => {
      settings.type = card.dataset.type; saveSettings();
      app.querySelectorAll(".mode").forEach(c => c.classList.toggle("selected", c === card));
    }));
    app.querySelectorAll('input[name="lvl"]').forEach(r => r.onchange = () => { settings.lvl = r.value; saveSettings(); });
    app.querySelectorAll('input[name="dir"]').forEach(r => r.onchange = () => { settings.dirs = [...app.querySelectorAll('input[name="dir"]:checked')].map(x => x.value); saveSettings(); });
    app.querySelectorAll('input[name="cat"]').forEach(r => r.onchange = () => { settings.cats = [...app.querySelectorAll('input[name="cat"]:checked')].map(x => x.value); saveSettings(); });
    $("#count").onchange = e => { settings.count = +e.target.value; saveSettings(); };
    $("#start").onclick = startRound;
    if ($("#retry")) $("#retry").onclick = () => beginRound("retry", "Fouten oefenen", shuffle(wrongIds).slice(0, 20));
  }

  function startRound() {
    const err = $("#start-err");
    let ids, label;
    if (settings.type === "bal") {
      const pool = REACTIONS.filter(r => settings.lvl === "mix" || String(r.lvl) === settings.lvl);
      let picked = shuffle(weightedSample(pool, settings.count, r => weightOf([...r.r, ...r.p].every(onlyNonMetals))));
      if (settings.lvl === "mix") picked.sort((a, b) => a.lvl - b.lvl);
      ids = picked.map(r => "bal:" + r.id);
      label = "Kloppend maken · " + ({ "1": "makkelijk", "2": "gemiddeld", "3": "moeilijk", mix: "alles" }[settings.lvl]);
    } else {
      if (!settings.dirs.length || !settings.cats.length) {
        if (!err) return go("home");
        err.textContent = "Kies minstens één richting en één soort stoffen."; err.hidden = false; return;
      }
      ids = shuffle(weightedSample(namingPool(settings.cats, settings.dirs), settings.count, id => {
        const key = id.split(":")[2];
        return weightOf(id.includes(":el:") ? NONMETAL_SYMBOLS.includes(key) : onlyNonMetals(key));
      }));
      label = "Naamgeving · " + settings.dirs.map(d => KIND_LABEL[d].toLowerCase()).join(" + ");
    }
    beginRound(settings.type, label, ids);
  }

  function beginRound(mode, label, ids) {
    const questions = ids.map(buildQuestion).filter(Boolean);
    if (!questions.length) return;
    round = { mode, label, questions, idx: 0, results: [], started: Date.now(), answered: false };
    go("quiz");
  }

  /* ---- Vraag ---- */
  function renderQuestion() {
    if (!round) return go("home");
    const q = round.questions[round.idx];
    const n = round.questions.length;
    const score = round.results.filter(r => r.correct).length;
    let body;
    if (q.kind === "bal") {
      const all = [...q.rx.r, ...q.rx.p];
      const box = k => `<input class="coef" data-k="${k}" inputmode="numeric" maxlength="2" autocomplete="off" aria-label="coëfficiënt voor ${esc(all[k])}">`;
      const term = (s, k) => `<span class="term">${box(k)}<span class="formula">${fHTML(s)}</span></span>`;
      body = `
        <p class="desc">${esc(q.rx.d)}</p>
        <div class="equation" id="eq">
          ${q.rx.r.map((s, k) => term(s, k)).join('<span class="op">+</span>')}
          <span class="arrow">→</span>
          ${q.rx.p.map((s, k) => term(s, k + q.rx.r.length)).join('<span class="op">+</span>')}
        </div>
        <p class="hint">Vul de coëfficiënten in (kleinste gehele getallen). Een leeg vakje telt als 1.</p>`;
    } else {
      body = `
        <p class="prompt">${q.prompt}</p>
        <div class="answer-row">
          <input id="answer" class="answer ${q.kind === "n2f" ? "formula-input" : ""}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${q.kind === "n2f" ? (q.cat === "el" ? "Symbool" : "Formule, bv. CO2") : "Naam"}">
          ${q.kind === "n2f" ? `<span class="preview" id="preview" aria-live="polite"></span>` : ""}
        </div>
        ${q.hint ? `<p class="hint">${q.hint}</p>` : ""}`;
    }

    app.innerHTML = `
      <section class="quiz">
        <div class="quiz-top">
          <button class="btn ghost small" id="quit">← Stoppen</button>
          <div class="progress" aria-label="Voortgang"><div style="width:${pct(round.idx, n)}%"></div></div>
          <span class="counter">Vraag ${round.idx + 1} / ${n} · <b>${score}</b> goed</span>
        </div>
        <article class="card question">
          <div class="q-meta">
            <span class="tag">${esc(KIND_LABEL[q.kind])}</span>
            ${q.kind === "bal" ? `<span class="tag lvl lvl${q.lvl}">${["", "makkelijk", "gemiddeld", "moeilijk"][q.lvl]}</span>` : `<span class="tag soft">${esc(q.catLabel)}</span>`}
          </div>
          ${q.kind === "bal" ? `<h2>${esc(q.title)}</h2>` : ""}
          <form id="qform" autocomplete="off">
            ${body}
            <div class="actions"><button class="btn primary" id="check" type="submit">Controleer</button></div>
          </form>
          <p class="err" id="qerr" hidden></p>
          <div id="feedback"></div>
        </article>
      </section>`;

    $("#quit").onclick = () => {
      if (!round.results.length || confirm("Wil je stoppen? Je antwoorden tot nu toe worden opgeslagen.")) go("home");
    };
    const form = $("#qform");
    form.onsubmit = e => { e.preventDefault(); if (round.answered) nextQuestion(); else submit(q); };

    if (q.kind === "bal") {
      const inputs = [...app.querySelectorAll(".coef")];
      inputs.forEach((inp, i) => {
        inp.addEventListener("input", () => { inp.value = inp.value.replace(/\D/g, ""); });
        inp.addEventListener("keydown", e => {
          if (e.key === "ArrowRight" && inp.selectionStart === inp.value.length && inputs[i + 1]) { e.preventDefault(); inputs[i + 1].focus(); }
          if (e.key === "ArrowLeft" && inp.selectionStart === 0 && inputs[i - 1]) { e.preventDefault(); inputs[i - 1].focus(); }
        });
      });
      inputs[0].focus();
    } else {
      const a = $("#answer");
      if (q.kind === "n2f") a.addEventListener("input", () => {
        const v = cleanFormula(a.value);
        $("#preview").innerHTML = /^[A-Za-z0-9()]+$/.test(v) && /\d/.test(v) ? "= " + `<span class="formula">${fHTML(v)}</span>` : "";
      });
      a.focus();
    }
  }

  function submit(q) {
    const errEl = $("#qerr");
    let res;
    if (q.kind === "bal") res = checkBalance(q, [...app.querySelectorAll(".coef")].map(i => i.value));
    else res = checkText(q, $("#answer").value);
    if (res.invalid) { errEl.innerHTML = res.invalid; errEl.hidden = false; return; }
    errEl.hidden = true;

    round.answered = true;
    const expected = q.kind === "bal" ? q.expected.join(" ") : q.expected;
    round.results.push({ id: q.id, correct: res.correct, given: res.given, expected, promptText: q.promptText, kind: q.kind });
    recordAnswer(q, res.correct);

    app.querySelectorAll("#qform input").forEach(i => { i.readOnly = true; });
    if (q.kind === "bal") {
      const eq = [...app.querySelectorAll(".coef")];
      eq.forEach((inp, k) => inp.classList.add(inp.value === "" && q.expected[k] === 1 || +inp.value === q.expected[k] ? "ok" : "bad"));
    } else {
      $("#answer").classList.add(res.correct ? "ok" : "bad");
    }

    const last = round.idx === round.questions.length - 1;
    $("#check").textContent = last ? "Bekijk je score →" : "Volgende vraag →";

    $("#feedback").innerHTML = `
      <div class="fb ${res.correct ? "good" : "wrong"}">
        <div class="fb-head">
          <span class="fb-icon">${res.correct ? "✓" : "✗"}</span>
          <strong>${res.correct ? pick(["Goed zo!", "Helemaal goed!", "Juist!", "Top!"]) : "Helaas, dat is niet goed."}</strong>
        </div>
        ${res.msg ? `<p>${res.msg}</p>` : ""}
        ${q.kind === "bal" ? balanceSolution(q, res) : textSolution(q, res)}
      </div>`;
    $("#check").focus();
  }
  const pick = a => a[Math.floor(Math.random() * a.length)];

  function balanceSolution(q, res) {
    const rx = q.rx, c = q.expected, n = rx.r.length;
    const els = elementOrder(rx);
    const L = sideCounts(rx.r, c.slice(0, n)), R = sideCounts(rx.p, c.slice(n));
    const L1 = sideCounts(rx.r, rx.r.map(() => 1)), R1 = sideCounts(rx.p, rx.p.map(() => 1));
    const detail = (species, coefs, el) => species
      .map((s, k) => { const a = parseFormula(s)[el]; return a ? `${coefs[k]}×${a}` : null; })
      .filter(Boolean).join(" + ");
    const allSpecies = [...rx.r, ...rx.p];

    // volgorde waarin je de elementen het handigst kloppend maakt
    const occurrences = el => allSpecies.filter(s => parseFormula(s)[el]).length;
    const isFree = el => allSpecies.some(s => s === el || s === el + "2" || s === el + "4");
    const isOH = el => el === "O" || el === "H";
    const orderTip = els.slice().sort((a, b) =>
      (isOH(a) - isOH(b)) || (isFree(a) - isFree(b)) || (occurrences(a) - occurrences(b)));

    const rows = els.map(e => {
      const yours = !res.correct ? `<td class="${(res.L[e] || 0) === (res.R[e] || 0) ? "" : "bad-cell"}">${res.L[e] || 0} / ${res.R[e] || 0}</td>` : "";
      return `<tr><th>${e}</th><td>${L1[e] || 0} / ${R1[e] || 0}</td>${yours}<td>${detail(rx.r, c.slice(0, n), e)} = <b>${L[e]}</b></td><td>${detail(rx.p, c.slice(n), e)} = <b>${R[e]}</b></td><td class="okc">✓</td></tr>`;
    }).join("");

    return `
      <div class="solution">
        <h3>Juiste antwoord</h3>
        <div class="equation solved">${equationHTML(rx, c)}</div>
        <details ${res.correct ? "" : "open"}>
          <summary>Uitwerking in stappen</summary>
          <ol class="steps">
            <li>Verander <b>nooit</b> de formules (de kleine indexcijfers); je mag alleen <b>coëfficiënten</b> (grote getallen) ervoor zetten.</li>
            <li>Tel eerst de atomen zonder coëfficiënten (kolom <i>start</i>). Daar zie je wat er niet klopt.</li>
            <li>Maak de elementen één voor één kloppend. Handige volgorde hier: <b>${orderTip.join(" → ")}</b>. Bewaar O en H meestal voor het laatst, en ook elementen die als losse stof voorkomen (zoals O<sub>2</sub>, H<sub>2</sub> of een metaal): daar kun je de coëfficiënt vrij kiezen zonder iets anders te verstoren.</li>
            ${rx.r.includes("O2") && rx.p.includes("H2O") && rx.lvl === 3 ? `<li>Kom je uit op een half molecuul O<sub>2</sub> (bijv. 3½ O<sub>2</sub>)? Vermenigvuldig dan <b>alle</b> coëfficiënten met 2.</li>` : ""}
            <li>Controleer tot slot of alle atomen links en rechts gelijk zijn, en of je de kleinste gehele getallen hebt:</li>
          </ol>
          <div class="table-wrap"><table class="count-table">
            <thead><tr><th>atoom</th><th>start<br><small>links / rechts</small></th>${!res.correct ? "<th>jouw antwoord<br><small>links / rechts</small></th>" : ""}<th>links</th><th>rechts</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
          </table></div>
        </details>
      </div>`;
  }

  function textSolution(q, res) {
    const answer = q.kind === "f2n" ? `<b>${esc(q.names[0])}</b>${q.names.length > 1 ? ` <span class="muted">(ook goed: ${q.names.slice(1).map(esc).join(", ")})</span>` : ""}`
      : `<span class="formula big">${fHTML(q.f)}</span>`;
    const given = !res.correct ? `<p class="muted">Jouw antwoord: ${q.kind === "n2f" ? `<span class="formula">${fHTML(res.given)}</span>` : esc(res.given)}</p>` : "";
    return `
      <div class="solution">
        ${given}
        <h3>Juiste antwoord</h3>
        <p class="answer-show">${answer}</p>
        <details ${res.correct ? "" : "open"}>
          <summary>Uitwerking</summary>
          <ol class="steps">${q.steps.map(s => `<li>${s}</li>`).join("")}</ol>
        </details>
      </div>`;
  }

  function nextQuestion() {
    if (round.idx < round.questions.length - 1) {
      round.idx++; round.answered = false; renderQuestion();
    } else {
      recordRound(round); round.saved = true;
      const r = round; round = null; lastRound = r; go("result");
    }
  }

  /* ---- Resultaat ---- */
  let lastRound = null;
  function renderResult() {
    const r = lastRound;
    if (!r) return go("home");
    const score = r.results.filter(x => x.correct).length, n = r.results.length, p = pct(score, n);
    const msg = p === 100 ? "Perfect! Alles goed." : p >= 80 ? "Heel goed gedaan!" : p >= 55 ? "Voldoende! Bekijk je fouten nog even." : "Blijf oefenen, je wordt er steeds beter in!";
    const wrong = r.results.filter(x => !x.correct).map(x => x.id);
    app.innerHTML = `
      <section class="card result">
        <div class="score-ring" style="--p:${p}"><span>${score}<small>/${n}</small></span></div>
        <div>
          <h1>${msg}</h1>
          <p class="muted">${esc(r.label)} · ${p}% goed</p>
          <div class="row wrap">
            <button class="btn primary" id="again">Nieuwe ronde</button>
            ${wrong.length ? `<button class="btn accent" id="redo">Oefen de ${wrong.length} foute vragen opnieuw</button>` : ""}
            <button class="btn ghost" data-nav="history">Naar geschiedenis</button>
          </div>
        </div>
      </section>
      <section class="card">
        <h2 class="h-sm">Overzicht</h2>
        ${itemsList(r.results.map(x => ({ id: x.id, p: x.promptText, g: x.given, e: x.expected, c: x.correct })))}
      </section>`;
    $("#again").onclick = () => {
      if (r.mode === "retry") go("home");
      else { settings.type = r.mode; startRound(); }
    };
    if ($("#redo")) $("#redo").onclick = () => beginRound("retry", "Fouten oefenen", shuffle(wrong));
  }

  function itemDisplay(it) {
    const kind = it.id.split(":")[0];
    if (kind === "bal") {
      const rx = REACTIONS.find(x => x.id === it.id.split(":")[1]);
      if (!rx) return { q: esc(it.p), g: esc(it.g), e: esc(it.e) };
      const toCoefs = s => String(s).split(" ").map(Number);
      return { q: equationHTML(rx, null), g: equationHTML(rx, toCoefs(it.g)), e: equationHTML(rx, toCoefs(it.e)) };
    }
    if (kind === "f2n") return { q: `<span class="formula">${fHTML(it.p)}</span>`, g: esc(it.g), e: esc(it.e) };
    return { q: esc(it.p), g: `<span class="formula">${fHTML(it.g)}</span>`, e: `<span class="formula">${fHTML(it.e)}</span>` };
  }

  function itemsList(items) {
    return `<ul class="items">${items.map(it => {
      const d = itemDisplay(it);
      return `<li class="${it.c ? "ok" : "bad"}">
        <span class="mark">${it.c ? "✓" : "✗"}</span>
        <div><div class="iq">${d.q}</div>
        ${it.c ? `<div class="ia">${d.e}</div>` : `<div class="ia"><span class="lbl">jij:</span> ${d.g}</div><div class="ia"><span class="lbl">goed:</span> ${d.e}</div>`}
        </div></li>`;
    }).join("")}</ul>`;
  }

  /* ---- Geschiedenis ---- */
  function renderHistory() {
    const u = user();
    const rounds = u.rounds.slice().reverse();
    const stats = Object.entries(u.stats);
    const sum = pred => stats.filter(([id]) => pred(id)).reduce((a, [, s]) => [a[0] + s.right, a[1] + s.right + s.wrong], [0, 0]);
    const [allR, allT] = sum(() => true);
    const part = [["bal", "Kloppend maken"], ["f2n", "Formule → naam"], ["n2f", "Naam → formule"]]
      .map(([k, l]) => { const [r, t] = sum(id => id.startsWith(k + ":")); return { l, r, t }; });
    const best = u.rounds.length ? Math.max(...u.rounds.map(r => pct(r.score, r.total))) : 0;
    const hard = stats.filter(([id, s]) => s.wrong > 0 && buildQuestion(id))
      .sort((a, b) => (b[1].wrong - b[1].right * 0.5) - (a[1].wrong - a[1].right * 0.5)).slice(0, 10);
    const recent = u.rounds.slice(-20);

    app.innerHTML = `
      <section class="hero">
        <h1>Jouw geschiedenis</h1>
        <p class="muted">Alles wordt bewaard in deze browser.</p>
      </section>

      ${!u.rounds.length && !stats.length ? `<section class="card"><p>Je hebt nog niets geoefend. <button class="btn primary small" data-nav="home">Begin met oefenen</button></p></section>` : `
      <div class="stat-grid">
        <div class="stat"><b>${u.rounds.length}</b><span>rondes</span></div>
        <div class="stat"><b>${allT}</b><span>vragen beantwoord</span></div>
        <div class="stat"><b>${pct(allR, allT)}%</b><span>goed</span></div>
        <div class="stat"><b>${best}%</b><span>beste ronde</span></div>
      </div>

      <div class="grid-2">
        <section class="card">
          <h2 class="h-sm">Per onderdeel</h2>
          ${part.map(p => `
            <div class="bar-row"><span>${p.l}</span>
              <div class="bar"><div style="width:${pct(p.r, p.t)}%"></div></div>
              <span class="num">${p.t ? pct(p.r, p.t) + "%" : "–"} <small>(${p.r}/${p.t})</small></span></div>`).join("")}
        </section>
        <section class="card">
          <h2 class="h-sm">Laatste ${recent.length} rondes</h2>
          <div class="spark" role="img" aria-label="Scores van de laatste rondes">
            ${recent.map(r => { const p = pct(r.score, r.total); return `<div class="sbar ${p >= 80 ? "hi" : p >= 55 ? "mid" : "lo"}" style="height:${Math.max(p, 4)}%" title="${new Date(r.ts).toLocaleDateString("nl-NL")} · ${r.score}/${r.total}"></div>`; }).join("")}
          </div>
          <div class="spark-axis"><span>ouder</span><span>nieuwer</span></div>
        </section>
      </div>

      ${hard.length ? `
      <section class="card">
        <div class="row space"><h2 class="h-sm">Hier ging het vaak mis</h2>
        <button class="btn accent small" id="practice-hard">Oefen deze vragen</button></div>
        <ul class="hard">${hard.map(([id, s]) => {
          const q = buildQuestion(id);
          const label = q.kind === "bal" ? equationHTML(q.rx, null) : q.kind === "f2n" ? `<span class="formula">${fHTML(q.f)}</span> → ?` : `${esc(q.names[0])} → ?`;
          return `<li><span class="tag soft">${KIND_LABEL[q.kind]}</span><span class="hq">${label}</span><span class="hs">${s.wrong}× fout, ${s.right}× goed</span></li>`;
        }).join("")}</ul>
      </section>` : ""}

      <section class="card">
        <h2 class="h-sm">Alle rondes</h2>
        <div class="rounds">
          ${rounds.map(r => `
            <details class="round">
              <summary>
                <span class="rdate">${new Date(r.ts).toLocaleString("nl-NL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                <span class="rlabel">${esc(r.label)}${r.total < r.planned ? ` <small class="muted">(gestopt na ${r.total})</small>` : ""}</span>
                <span class="rscore ${pct(r.score, r.total) >= 80 ? "hi" : pct(r.score, r.total) >= 55 ? "mid" : "lo"}">${r.score}/${r.total}</span>
              </summary>
              ${itemsList(r.items)}
            </details>`).join("")}
        </div>
      </section>`}

      <section class="card data-tools">
        <h2 class="h-sm">Gegevens</h2>
        <p class="muted">Een back-up maken of op een andere computer verder? Exporteer je geschiedenis en importeer het bestand daar.</p>
        <div class="row wrap">
          <button class="btn ghost" id="export">Exporteer (bestand)</button>
          <label class="btn ghost">Importeer<input type="file" id="import" accept="application/json,.json" hidden></label>
          <button class="btn danger" id="wipe">Wis mijn geschiedenis</button>
        </div>
      </section>`;

    if ($("#practice-hard")) $("#practice-hard").onclick = () => beginRound("retry", "Moeilijke vragen", shuffle(hard.map(h => h[0])));
    $("#export").onclick = () => {
      const blob = new Blob([JSON.stringify({ app: STORE_KEY, data: u }, null, 1)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `scheikunde-h3-geschiedenis-${new Date().toISOString().slice(0, 10)}.json`;
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    $("#import").onchange = e => {
      const file = e.target.files[0]; if (!file) return;
      file.text().then(t => {
        const d = JSON.parse(t);
        if (!d || d.app !== STORE_KEY || !d.data || !Array.isArray(d.data.rounds)) throw new Error();
        if ((u.rounds.length || Object.keys(u.stats).length) && !confirm("Je huidige geschiedenis in deze browser wordt vervangen door het bestand. Doorgaan?")) return;
        store.users[store.current] = d.data; save(); go("history");
      }).catch(() => alert("Dit bestand kon niet worden ingelezen."));
    };
    $("#wipe").onclick = () => {
      if (confirm("Weet je zeker dat je je hele geschiedenis wilt wissen? Dit kan niet ongedaan worden gemaakt.")) {
        store.users[store.current] = { created: Date.now(), rounds: [], stats: {} }; save(); go("history");
      }
    };
  }

  /* ---------------- Periodiek systeem ---------------- */
  const panel = $("#pse-panel"), grid = $("#pse-grid"), detail = $("#pse-detail");
  const CAT_LABEL = { metaal: "metaal", halfmetaal: "halfmetaal", nietmetaal: "niet-metaal", edelgas: "edelgas" };

  function buildPSE() {
    let html = "";
    for (let g = 1; g <= 18; g++) html += `<div class="pse-label" style="grid-row:1;grid-column:${g + 1}">${g}</div>`;
    for (let p = 1; p <= 7; p++) html += `<div class="pse-label" style="grid-row:${p + 1};grid-column:1">${p}</div>`;
    ELEMENTS.forEach(e => {
      const row = e.row >= 9 ? e.row + 1 : e.row + 1; // rij 8 = ruimte
      html += `<button class="el ${e.cat} ${e.diatomic ? "diat" : ""}" style="grid-row:${row};grid-column:${e.col + 1}" data-sym="${e.sym}" title="${e.name}">
        <span class="z">${e.z}</span><span class="s">${e.sym}</span><span class="n">${e.name}</span></button>`;
    });
    html += `<div class="el placeholder" style="grid-row:7;grid-column:4">57–71</div><div class="el placeholder" style="grid-row:8;grid-column:4">89–103</div>`;
    html += `<div class="pse-gap" style="grid-row:9;grid-column:1 / -1"></div>`;
    grid.innerHTML = html;
    grid.addEventListener("click", e => {
      const b = e.target.closest("[data-sym]"); if (!b) return;
      grid.querySelectorAll(".el.sel").forEach(x => x.classList.remove("sel"));
      b.classList.add("sel");
      const el = ELEMENT_BY_SYMBOL[b.dataset.sym];
      detail.innerHTML = `
        <div class="pd-card ${el.cat}"><span class="z">${el.z}</span><span class="s">${el.sym}</span></div>
        <div><b class="pd-name">${el.name}</b>
        <div class="muted">Atoomnummer ${el.z} · atoommassa ${el.mass} u · ${CAT_LABEL[el.cat]}</div>
        ${el.diatomic ? `<div class="pd-note">Komt als stof voor als twee-atomige moleculen: <span class="formula">${fHTML(el.sym + "2")}</span></div>` : ""}
        ${el.row <= 7 ? `<div class="muted">Groep ${el.col} · periode ${el.row}</div>` : `<div class="muted">${el.row === 9 ? "Lanthaniden" : "Actiniden"} · periode ${el.row - 3}</div>`}</div>`;
    });
  }

  function togglePSE(open) {
    const willOpen = open ?? panel.hidden;
    panel.hidden = !willOpen;
    document.body.classList.toggle("pse-open", willOpen);
    $("#pse-toggle").setAttribute("aria-expanded", String(willOpen));
    $("#pse-toggle").classList.toggle("active", willOpen);
  }
  $("#pse-toggle").onclick = () => togglePSE();
  $("#pse-close").onclick = () => togglePSE(false);
  $("#pse-search").addEventListener("input", e => {
    const v = e.target.value.trim().toLowerCase();
    grid.querySelectorAll(".el[data-sym]").forEach(b => {
      const el = ELEMENT_BY_SYMBOL[b.dataset.sym];
      const hit = v && (el.sym.toLowerCase() === v || el.name.includes(v) || String(el.z) === v);
      b.classList.toggle("hit", !!hit);
      b.classList.toggle("dim", !!v && !hit);
    });
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !panel.hidden) togglePSE(false); });

  /* ---------------- Navigatie ---------------- */
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-nav]");
    if (!t) return;
    e.preventDefault();
    if (view === "quiz" && round && round.results.length && t.dataset.nav !== "quiz" &&
        !confirm("Wil je deze ronde stoppen? Je antwoorden tot nu toe worden opgeslagen.")) return;
    go(t.dataset.nav);
  });

  load();
  ensureUser();
  buildPSE();
  go("home");
})();
