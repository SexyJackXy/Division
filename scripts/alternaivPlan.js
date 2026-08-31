async function showAlternativPlan () {
  const dialogDiv = document.getElementById('dialog')
  const dialogIframe = dialogDiv.querySelector('#iframe')
  const dialogButton = dialogDiv.querySelector('.alternativPlanClose')
  const delay = millis =>
    new Promise((resolve, reject) => {
      setTimeout(_ => resolve(), millis)
    })

  document.body.style.overflow = 'hidden'

  dialogIframe.style.display = 'block'

  requestAnimationFrame(() => {
    dialogIframe.classList.add('is-open')
  })

  altertivPlanLoad()

  await delay(400)

  dialogButton.style.display = 'block'

  requestAnimationFrame(() => {
    dialogButton.classList.add('is-open')
  })
}

async function closeAlternativPlan () {
  const dialogDiv = document.getElementById('dialog')
  const dialogIframe = dialogDiv.querySelector('#iframe')
  const dialogButton = dialogDiv.querySelector('.alternativPlanClose')
  const delay = millis =>
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

async function altertivPlanLoad () {
  //   window.DiensteSettings.initSettingsAdjustment()

  const assignments = await window.Dienste.loadContent()
  if (!assignments || !assignments.length) return

  console.log(assignments)
}
