console.log("Test")

(function () {
  const K = 'dienste_csv';
  const reservedNames = [
    "Frei",
    "1. Dispo",
    "2. Dispo",
    "3. Dispo",
    "LD 1",
    "FüAss",
    "LF 1 Fü",
    "LF 1 Ma",
    "LF 1 ATF",
    "LF 1 ATM",
    "LF 1 WTF",
    "LF 1 WTM",
    "LF 2 Fü",
    "LF 2 Ma",
    "LF 2 ATF",
    "LF 2 ATM",
    "LF 2 WTF",
    "LF 2 WTM",
    "Fahrzeugführer",
    "Maschinist",
    "Kantine",
    "Wäsche",
    "Getränke",
    "ZAW",
    "ZSW",
    "Abrufschicht"
  ];



  function saveCsvFromFile(file) {
    file.arrayBuffer().then(b => {
      let t = decodeBest(b);
      if (t.charCodeAt(0) === 0xFEFF) t = t.slice(1);

      console.log("FINAL TEXT:");
      console.log(t);

      localStorage.setItem(K, t);
    });
  }

  function decodeBest(b) {
    return pick(
      new TextDecoder('utf-8').decode(b),
      new TextDecoder('windows-1252').decode(b),
      new TextDecoder('utf-16le').decode(b)
    );
  }

  function pick(...v) {
    let best = v[0], s = -1e9;

    for (const t of v) {
      let sc = 0;
      if (t.includes(';')) sc += 5;
      if (t.includes(',')) sc += 2;
      if (/[a-zA-Z]{3,}/.test(t)) sc += 5;
      if (t.includes('�')) sc -= 10;

      if (sc > s) (s = sc, best = t);
    }
    return best;
  }

  function saveCsvText(t) {
    console.log("🔥 WIRD IN LOCALSTORAGE GESCHREIBEN:");
    console.log(t);

    localStorage.setItem(K, t);

    console.log("🔥 JETZT IM LOCALSTORAGE:");
    console.log(localStorage.getItem(K));
  }

  function getCsv() {
    return localStorage.getItem(K);
  }

  function clearStoredCsv() {
    localStorage.removeItem(K);
    console.log("Reset all roles → 'Frei'");
    document.querySelectorAll('.person').forEach(e => e.textContent = 'Frei');
  }

  function parseCsv(t) {
    if (!t) return [];
    return t.split(/\r?\n/).filter(Boolean).flatMap(l =>
      l.split(';').map(s => s.trim()).reduce((a, _, i, arr) => {
        if (i % 2 === 0 && arr[i] && arr[i + 1]) {
          a.push({ role: arr[i], name: arr[i + 1] });
        }
        return a;
      }, [])
    );
  }

  function renderAssignments(a) {
    console.log("Rendering assignments:", a.length);

    const c = document.getElementById('teamSection');

    a.forEach(({ role, name }) => {
      if (role === "Frei") {
        if (!c) return;

        const d = document.createElement('div');
        d.className = 'card';
        d.setAttribute("draggable", "true");
        d.innerHTML = name;
        c.appendChild(d);
        return;
      }

      const el = document.querySelector(`.person[data-role="${role}"]`);
      if (!el) return;

      el.textContent = name;
      updatePersonColor(el)
    });
  }

  function convertPdfToCsv(file) {
    // var wshShell = new ActiveXObject("WScript.Shell");
    // wshShell.Run("..\\start.bat");

    var runnableScript = exec('..\\start.bat"',
      (error, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        if (error !== null) {
          console.log(`exec error: ${error}`);
        }
      });
  }

  function initDragAndDrop() {
    let dragged = null;

    const pool = document.getElementById("teamSection");

    function clearHighlights() {
      document.querySelectorAll(".person.drop-target")
        .forEach(el => el.classList.remove("drop-target"));
    }

    // =========================
    // 🟦 DRAG START (CAPTURE PHASE!)
    // =========================
    document.addEventListener("dragstart", e => {
      const card = e.target.closest(".card");
      const person = e.target.closest(".person");

      const toDraggingText = e.target.textContent;


      if (card) {
        dragged = card;
        card.classList.add("dragging");
        return;
      }

      if (person) {
        dragged = person;
        person.classList.add("dragging");
        return;
      }
    }, true);

    // =========================
    // 🟦 DRAG END
    // =========================
    document.addEventListener("dragend", e => {
      const el = e.target.closest(".card, .person");
      if (!el) return;

      el.classList.remove("dragging");
      clearHighlights();
      dragged = null;
    });

    // =========================
    // 🟩 PERSON DROP
    // =========================
    document.addEventListener("dragover", e => {
      const target = e.target.closest(".person");
      if (!target) return;

      e.preventDefault();

      clearHighlights();
      target.classList.add("drop-target");
    });

    document.addEventListener("drop", e => {
      const target = e.target.closest(".person");
      if (!target || !dragged) return;

      e.preventDefault();
      e.stopPropagation();

      if (dragged === target) return;

      e.preventDefault();

      const pool = document.getElementById("teamSection");

      const isCard = dragged.classList.contains("card");
      const isPerson = dragged.classList.contains("person");

      // =====================
      // CARD → PERSON
      // =====================
      if (isCard) {

        const old = target.textContent;

        // Namen einsetzen
        target.textContent = dragged.textContent;
        updatePersonColor(target);

        console.log("draggedText: ", old, "targetText:", target);

        // Alte Person zurück in Pool
        if (old && !reservedNames.includes(old)) {

          const c = document.createElement("div");
          c.className = "card";
          c.setAttribute("draggable", "true");
          c.textContent = old;

          pool.appendChild(c);
        }

        // Ursprüngliche Card entfernen
        dragged.remove();
      }

      // =====================
      // PERSON → PERSON
      // =====================
      else if (isPerson) {
        const draggedText = dragged.innerText;
        const targetText = target.innerText;

        console.log("draggedText: ", draggedText, "targetText:", targetText);

        // Inhalte tauschen
        dragged.innerText = targetText;
        target.innerText = draggedText;

        updatePersonColor(dragged);
        updatePersonColor(target);
      }
      dragged = null;
    });

    // =========================
    // 🟨 DROP BACK IN POOL
    // =========================
    document.addEventListener("dragover", e => {
      const cardZone = e.target.closest("#teamSection");

      if (!cardZone) return;
      clearHighlights();
      e.preventDefault();
    });

    document.addEventListener("drop", e => {
      const cardZone = e.target.closest("#teamSection");
      if (!cardZone || !dragged) return;

      if (dragged.classList.contains("person")) {

        if (reservedNames.includes(dragged.textContent.trim())) {
          return;
        }

        const newCard = document.createElement("div");
        newCard.className = "card";
        newCard.setAttribute("draggable", "true");
        newCard.textContent = dragged.textContent;

        pool.appendChild(newCard);

        dragged.textContent = "Frei";
        updatePersonColor(dragged);
      }
    });
  }

  function updatePersonColor(el) {
    const text = el.textContent.trim();

    console.log(text)

    if (!reservedNames.includes(text)) {
      el.style.backgroundColor = "#B6D5FB";
    } else {
      el.style.backgroundColor = "";
    }
  }

  window.Dienste = {
    saveCsvFromFile,
    convertPdfToCsv,
    saveCsvText,
    getCsv,
    clearStoredCsv,
    parseCsv,
    renderAssignments,
    initDragAndDrop
  };

})();