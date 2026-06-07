/* Motor interactivo — Modo Fácil EIG
   Funciona leyendo el HTML: flashcards, "entendido", test y progreso.
   Guarda el progreso en localStorage por página (data-page del <body>). */
(function () {
  "use strict";
  const body = document.body;
  const pageId = body.dataset.page || location.pathname;
  const KEY = "eig-progress-" + pageId;

  let state = { concepts: [], quiz: false };
  try { Object.assign(state, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) {}
  if (!Array.isArray(state.concepts)) state.concepts = [];

  const concepts = Array.from(document.querySelectorAll(".concept[id]"));
  const quiz = document.querySelector(".quiz");
  const totalItems = concepts.length + (quiz ? 1 : 0);
  const fill = document.querySelector(".progress-fill");
  const label = document.querySelector(".progress-label");

  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  function doneCount() {
    let n = state.concepts.filter(id => document.getElementById(id)).length;
    if (quiz && state.quiz) n++;
    return n;
  }

  let celebrated = false;
  function updateProgress() {
    const n = doneCount();
    const pct = totalItems ? Math.round((n / totalItems) * 100) : 0;
    if (fill) fill.style.width = pct + "%";
    if (label) label.textContent = pct + "% · " + n + "/" + totalItems;
    if (pct === 100 && !celebrated) { celebrated = true; confetti(); }
  }

  function syncBtn(c, btn) {
    const done = c.classList.contains("done");
    btn.innerHTML = done
      ? '<span class="ico">✓</span> ¡Entendido!'
      : '<span class="ico">○</span> Marcar como entendido';
  }

  // --- Conceptos: botón "lo entiendo" ---
  concepts.forEach(c => {
    if (state.concepts.includes(c.id)) c.classList.add("done");
    const btn = c.querySelector(".understood");
    if (!btn) return;
    syncBtn(c, btn);
    btn.addEventListener("click", e => {
      e.preventDefault();
      const isDone = c.classList.toggle("done");
      if (isDone) { if (!state.concepts.includes(c.id)) state.concepts.push(c.id); }
      else { state.concepts = state.concepts.filter(x => x !== c.id); }
      syncBtn(c, btn);
      save();
      updateProgress();
    });
  });

  // --- Flashcards: girar al hacer clic ---
  document.querySelectorAll(".flashcard").forEach(fc => {
    fc.addEventListener("click", () => fc.classList.toggle("is-flipped"));
  });

  // --- Test ---
  if (quiz) {
    const qcards = Array.from(quiz.querySelectorAll(".qcard"));
    let answered = 0, correct = 0;
    qcards.forEach(qc => {
      const opts = Array.from(qc.querySelectorAll(".option"));
      const explain = qc.querySelector(".explain");
      opts.forEach(opt => {
        opt.addEventListener("click", () => {
          if (qc.dataset.answered) return;
          qc.dataset.answered = "1";
          const ok = opt.dataset.correct === "true";
          opt.classList.add(ok ? "correct" : "wrong");
          if (!ok) {
            const right = opts.find(o => o.dataset.correct === "true");
            if (right) right.classList.add("correct");
          }
          opts.forEach(o => (o.disabled = true));
          if (explain) explain.classList.add("show");
          answered++; if (ok) correct++;
          if (answered === qcards.length) {
            showResult(correct, qcards.length);
            if (!state.quiz) { state.quiz = true; save(); updateProgress(); }
          }
        });
      });
    });

    function showResult(c, t) {
      const box = quiz.querySelector(".quiz-result");
      if (!box) return;
      const pct = Math.round((c / t) * 100);
      const msg = pct === 100 ? "¡Perfecto! Te lo sabes 🎉"
        : pct >= 60 ? "¡Bien! Repasa los fallos y a por el examen 💪"
        : "Repasa los conceptos plegables y vuelve a intentarlo 📚";
      box.querySelector(".score").textContent = c + "/" + t;
      box.querySelector(".msg").textContent = msg;
      box.classList.add("show");
      box.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  // --- Confeti al llegar al 100% ---
  function confetti() {
    const colors = ["#2563eb", "#f59e0b", "#16a34a", "#dc2626", "#7c3aed", "#06b6d4"];
    const layer = document.createElement("div");
    layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden";
    document.body.appendChild(layer);
    for (let i = 0; i < 90; i++) {
      const p = document.createElement("div");
      const size = 7 + Math.random() * 8;
      p.style.cssText =
        "position:absolute;top:-20px;border-radius:2px;opacity:.95;" +
        "width:" + size + "px;height:" + size + "px;" +
        "background:" + colors[(Math.random() * colors.length) | 0] + ";" +
        "left:" + Math.random() * 100 + "%;" +
        "transform:rotate(" + Math.random() * 360 + "deg);";
      layer.appendChild(p);
      const fall = 700 + Math.random() * 1200;
      const drift = (Math.random() - 0.5) * 240;
      p.animate(
        [
          { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
          { transform: "translate(" + drift + "px," + (window.innerHeight + 60) + "px) rotate(" + (360 + Math.random() * 360) + "deg)", opacity: 1 }
        ],
        { duration: fall + 600, easing: "cubic-bezier(.3,.7,.5,1)", delay: Math.random() * 400 }
      );
    }
    setTimeout(() => layer.remove(), 3200);
  }

  updateProgress();
})();
