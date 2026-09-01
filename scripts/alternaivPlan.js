async function showAlternativePlan() {
  var dialogDiv = document.getElementById('dialog')
  var dialogIframe = dialogDiv.querySelector('#iframe')
  var dialogButton = dialogDiv.querySelector('.alternativPlanClose')
  var delay = millis =>
    new Promise((resolve, reject) => {
      setTimeout(_ => resolve(), millis)
    })

  document.body.style.overflow = 'hidden'

  dialogIframe.style.display = 'block'

  requestAnimationFrame(() => {
    dialogIframe.classList.add('is-open')
  })

  if (!dialogIframe.src) {
    await new Promise(resolve => {
      dialogIframe.addEventListener('load', resolve, { once: true })
      dialogIframe.src = dialogIframe.dataset.src
    })
  }

  await delay(400)

  dialogButton.style.display = 'block'

  requestAnimationFrame(() => {
    dialogButton.classList.add('is-open')
  })
}
async function closeAlternativPlan() {
  var dialogDiv = document.getElementById('dialog')
  var dialogIframe = dialogDiv.querySelector('#iframe')
  var dialogButton = dialogDiv.querySelector('.alternativPlanClose')
  var delay = millis =>
    new Promise((resolve, reject) => {
      setTimeout(_ => resolve(), millis)
    })

  dialogButton.classList.remove('is-open')

  dialogButton.addEventListener(
    'transitionend',
    () => {
      dialogButton.style.display = 'none'
    },
    { once: true }
  )

  await delay(1100)

  dialogIframe.classList.remove('is-open')

  dialogIframe.addEventListener(
    'transitionend',
    () => {
      dialogIframe.style.display = 'none'
      document.body.style.overflow = ''
    },
    { once: true }
  )
}

async function altertivPlanLoad() {
  var i = 0
  var poolParent = document
    .getElementById('iframe')
    .contentWindow.document.getElementById('teamFree')
  var freeTeam = poolParent.querySelector('#innerTeam')

  var assignments = await window.Dienste.loadContent()
  if (!freeTeam) return

  assignments.forEach(({ role, name }) => {
    if (!name) return

    if (role === 'Frei') {
      i++

      var d = document.createElement('div')
      d.className = 'card'
      d.setAttribute('draggable', !reservedNames.includes(name))
      d.innerHTML = name
      freeTeam.appendChild(d)
      return
    }

    var el = document.querySelector(`.person[data-role="${role}"]`)
    if (!el) return
  })

  if (i > 0) {
    var t = document.querySelector('.freeTeamSpace')
    t.style.display = 'flex'
  }

  // importNotWorkingPeople()
}
