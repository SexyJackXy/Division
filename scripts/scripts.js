const cookies = 'dienste_csv'
const reservedNames = [
  'ALvD',
  'DD',
  'LD 2',
  'HLD',
  'EAL',
  'BvD',
  'LFüGr',
  'Schichtführer',
  'Frei',
  '1. Dispo',
  '2. Dispo',
  '3. Dispo',
  'LD 1',
  'FüAss',
  'LF 1 Fü',
  'LF 1 Ma',
  'LF 1 ATF',
  'LF 1 ATM',
  'LF 1 WTF',
  'LF 1 WTM',
  'LF 2 Fü',
  'LF 2 Ma',
  'LF 2 ATF',
  'LF 2 ATM',
  'LF 2 WTF',
  'LF 2 WTM',
  'LF 2 Ma',
  'Schw.Retter',
  'DLK1 Fü',
  'DLK1 Ma',
  'SoFzg Fü',
  'SoFzg Ma',
  'KEF Fü',
  'KEF Ma',
  'Fwk Fü',
  'Fwk Ma',
  'Maschinist',
  'Kantine',
  'Wäsche',
  'Getränke',
  'ZAW',
  'ZSW',
  'Abrufschicht'
]

function readFromFile (file) {
  file.arrayBuffer().then(b => {
    const candidates = [
      new TextDecoder('utf-8').decode(b),
      new TextDecoder('windows-1252').decode(b),
      new TextDecoder('utf-16le').decode(b)
    ]

    let t = candidates[0],
      best = -1e9

    for (const c of candidates) {
      let sc = 0
      if (c.includes('{')) sc += 5
      if (c.includes(',')) sc += 2
      if (/[a-zA-Z]{3,}/.test(c)) sc += 5
      if (c.includes('�')) sc -= 10
      if (sc > best) (best = sc), (t = c)
    }

    if (t.charCodeAt(0) === 0xfeff) t = t.slice(1)

    const parsed = parseContent(t)

    localStorage.setItem(cookies, JSON.stringify(parsed))
  })

  return 'Datei ' + file.name + ' erfolgreich hochgeladen'
}

function parseContent (t) {
  if (!t) return []
  try {
    const data = JSON.parse(t)
    if (!Array.isArray(data)) return []

    return data
      .filter(e => e && typeof e.role === 'string')
      .map(e => ({ role: e.role.trim(), name: (e.name || '').trim() }))
  } catch (e) {
    console.error('Parse Error:', e)
    return []
  }
}

function clearCookies () {
  localStorage.removeItem(cookies)
  document.querySelectorAll('.person').forEach(e => (e.textContent = 'Frei'))

  return 'Einteilung Zurückgesetzt'
}

function serializeAssignments () {
  const result = []

  document.querySelectorAll('.person[data-role]').forEach(el => {
    const role = el.dataset.role
    const text = el.textContent.trim()
    const name = reservedNames.includes(text) ? '' : text
    result.push({ role, name })
  })

  document.querySelectorAll('#teamFree .card').forEach(el => {
    const name = el.textContent.trim()
    if (name) result.push({ role: 'Frei', name })
  })

  return result
}

let saveTimer = null

// Speichert den aktuellen Stand (leicht verzögert, damit bei schnellen
// Mehrfachänderungen nicht jede einzelne einen eigenen Request auslöst).
function scheduleSave () {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    const data = serializeAssignments()
    localStorage.setItem(cookies, JSON.stringify(data))

    try {
      await fetch('/api/save-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      })
    } catch (e) {
      console.warn(
        'Änderung konnte nicht auf dem Server gespeichert werden:',
        e
      )
    }
  }, 400)
}

function temporaryScheduleSave () {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    const data = serializeAssignments()
    localStorage.setItem(cookies, JSON.stringify(data))

    try {
      await fetch('/api/save-temporary-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      })
    } catch (e) {
      console.warn(
        'Änderung konnte nicht auf dem Server gespeichert werden:',
        e
      )
    }
  }, 400)
}

function updatePersonColor (el) {
  const text = el.textContent.trim()

  if (!reservedNames.includes(text)) {
    el.style.backgroundColor = '#B6D5FB'
    el.draggable = true
  } else {
    el.style.backgroundColor = ''
    el.draggable = false
  }
}

async function logout () {
  try {
    const res = await fetch('/api/logout', { method: 'POST' })
    const data = await res.json()
    window.location.href = data.redirect || 'login.html'
  } catch (e) {
    console.error('Logout fehlgeschlagen:', e)
    window.location.href = 'login.html'
  }
}

async function exportNotWorkingPeople (movedEl) {
  const parent = movedEl.parentElement
  const departmentShort = parent.parentElement.id
  const person = movedEl.textContent.trim()

  const data = { name: person, department: departmentShort }

  try {
    const res = await fetch('/api/export-not-working-person', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await res.json()
  } catch (e) {
    console.error('Export fehlgeschlagen:', e)
  }
}

async function importNotWorkingPeople () {
  const res = await fetch('/api/import-not-working-persons', {
    credentials: 'include' // oder 'same-origin'
  })
  const result = await res.json()

  if (result.length > 0) {
    const poolParent = document.getElementById('teamFree')
    const freeTeam = poolParent.querySelector('#innerTeam')

    result.forEach(({ department, name }) => {
      if (!name) return

      const div = document.createElement('div')
      div.className = 'card'
      div.setAttribute('draggable', !reservedNames.includes(name))
      div.innerHTML = name
      // div.style.backgroundColor = '#ffcdd2'
      div.setAttribute('id', department)
      freeTeam.appendChild(div)
      return
    })
  }
}

window.Dienste = {
  readFromFile,
  clearCookies,
  parseContent,
  logout,
  importNotWorkingPeople
}

// Werden von core.js / dragLogic.js als globale Bezeichner genutzt
window.reservedNames = reservedNames
window.updatePersonColor = updatePersonColor
window.scheduleSave = scheduleSave
window.temporaryScheduleSave = temporaryScheduleSave
window.exportNotWorkingPeople = exportNotWorkingPeople
