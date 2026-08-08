(function () {
  const cookies = 'dienste_csv';
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

function readFromFile(file) {
    file.arrayBuffer().then(b => {
      const candidates = [
        new TextDecoder('utf-8').decode(b),
        new TextDecoder('windows-1252').decode(b),
        new TextDecoder('utf-16le').decode(b)
      ];

      let t = candidates[0], best = -1e9;

      for (const c of candidates) {
        let sc = 0;
        if (c.includes('{')) sc += 5;
        if (c.includes(',')) sc += 2;
        if (/[a-zA-Z]{3,}/.test(c)) sc += 5;
        if (c.includes('�')) sc -= 10;
        if (sc > best) (best = sc, t = c);
      }

      if (t.charCodeAt(0) === 0xFEFF) t = t.slice(1);

      console.log(t);

      const parsed = parseContent(t);

      console.log("FINAL DATA:");
      console.log(parsed);

      localStorage.setItem(cookies, JSON.stringify(parsed));
    });

    return "Datei " + file.name + " erfolgreich hochgeladen"
  }

  function parseContent(t) {
    if (!t) return [];
    try {
      const data = JSON.parse(t);
      if (!Array.isArray(data)) return [];

      return data
        .filter(e => e && typeof e.role === 'string')
        .map(e => ({ role: e.role.trim(), name: (e.name || '').trim() }));
    } catch (e) {
      console.error("Parse Error:", e);
      return [];
    }
  }

  function getContent() {
    const raw = localStorage.getItem(cookies);
    return raw ? JSON.parse(raw) : [];
  }

  function clearCookies() {
    localStorage.removeItem(cookies);
    document.querySelectorAll('.person').forEach(e => e.textContent = 'Frei');

    return "Einteilung Zurückgesetzt"
  }

function renderAssignments(a) {
  const c = document.getElementById('teamSection');
  if (!c) return;

  c.style.display = "none"; // Default: nichts drin -> versteckt

  a.forEach(({ role, name }) => {
    if (!name) return;

    if (role === "Frei") {
      const d = document.createElement('div');
      d.className = 'card';
      d.setAttribute("draggable", "true");
      d.innerHTML = name;
      c.appendChild(d);
      c.style.display = "flex"; // Sobald was reinkommt -> sichtbar
      return;
    }

    const el = document.querySelector(`.person[data-role="${role}"]`);
    if (!el) return;

    el.textContent = name;
    updatePersonColor(el);
  });
}

  function initDragAndDrop() {
    let dragged = null;

    const pool = document.getElementById("teamSection");

    function clearHighlights() {
      document.querySelectorAll(".drop-target")
        .forEach(el => el.classList.remove("drop-target"));
    }

    // Drag Start
    document.addEventListener("dragstart", e => {
      const element = e.target.closest(".card, .person");

      if (!element) return;

      dragged = element;
      dragged.classList.add("dragging");
    }, true);

    // Drag End
    document.addEventListener("dragend", e => {
      const element = e.target.closest(".card, .person");

      if (!element) return;

      element.classList.remove("dragging");
      clearHighlights();
      dragged = null;
    });

    // Drag Over
    document.addEventListener("dragover", e => {
      const target = e.target.closest(
        ".person, .abteilungspersonal, #teamSection"
      );

      if (!target) return;

      e.preventDefault();

      clearHighlights();
      target.classList.add("drop-target");
    });

    // Drop
    document.addEventListener("drop", e => {
      if (!dragged) return;

      clearHighlights();

      const personTarget = e.target.closest(".person");
      const departmentTarget = e.target.closest(".abteilungspersonal");
      const poolTarget = e.target.closest("#teamSection");

      // CARD -> PERSON
      if (
        dragged.classList.contains("card") &&
        personTarget
      ) {
        if (personTarget.textContent.trim() !== "Frei") {
          return;
        }

        personTarget.textContent = dragged.textContent;
        updatePersonColor(personTarget);

        dragged.remove();
      }

      // PERSON -> PERSON (tauschen)
      else if (
        dragged.classList.contains("person") &&
        personTarget &&
        dragged !== personTarget
      ) {
        const temp = dragged.textContent;

        dragged.textContent = personTarget.textContent;
        personTarget.textContent = temp;

        updatePersonColor(dragged);
        updatePersonColor(personTarget);
      }

      // CARD -> ABTEILUNG
      else if (
        dragged.classList.contains("card") &&
        departmentTarget
      ) {
        departmentTarget.appendChild(dragged);
      }

      // PERSON -> POOL
      else if (
        dragged.classList.contains("person") &&
        poolTarget
      ) {
        const name = dragged.textContent.trim();

        if (
          name !== "Frei" &&
          !reservedNames.includes(name)
        ) {
          const newCard = document.createElement("div");

          newCard.className = "card";
          newCard.draggable = true;
          newCard.textContent = name;

          pool.appendChild(newCard);

          dragged.textContent = "Frei";
          updatePersonColor(dragged);
        }
      }

      // CARD -> POOL
      else if (
        dragged.classList.contains("card") &&
        poolTarget
      ) {
        pool.appendChild(dragged);
      }

      dragged = null;
    });
  }

  function updatePersonColor(el) {
    const text = el.textContent.trim();

    // console.log(text)

    if (!reservedNames.includes(text)) {
      el.style.backgroundColor = "#B6D5FB";
    } else {
      el.style.backgroundColor = "";
    }
  }

  function initDeleteButtons() {
    const deleteBtns = document.querySelectorAll('.close');
    const pool = document.getElementById("teamSection");

    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (event) => {
        const parent = event.target.parentElement;
        const persons = parent.querySelectorAll('.person');

        persons.forEach(p => {
          const oldPerson = p.innerHTML;
          const c = document.createElement("div");

          console.log(p);
          p.style.backgroundColor = "#D1D5DB"
          p.textContent = "Frei"
          c.className = "card";
          c.setAttribute("draggable", "true");
          c.textContent = oldPerson;

          pool.appendChild(c);
        });
      });
    });
  }

  window.Dienste = {
    readFromFile,
    getContent,
    clearCookies,
    parseContent,
    renderAssignments,
    initDragAndDrop,
    initDeleteButtons
  };

})();