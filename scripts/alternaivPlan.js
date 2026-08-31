function showAlternativPlan () {
  const dialogDiv = document.getElementById('dialog')
  const dialogIframe = dialogDiv.querySelector('#iframe')
  const dialogButton = dialogDiv.querySelector('.alternativPlanClose')

  dialogIframe.style.display = 'Block'
  dialogButton.style.display = 'Block'

  altertivPlanLoad()
}

function closelternativPlan () {
  const dialogDiv = document.getElementById('dialog')
  const dialogIframe = dialogDiv.querySelector('#iframe')
  const dialogButton = dialogDiv.querySelector('.alternativPlanClose')

  dialogIframe.style.display = 'none'
  dialogButton.style.display = 'none'
}

async function altertivPlanLoad () {
  console.log('Hi')
  window.DiensteSettings.initSettingsAdjustment()

  const assignments = await window.Dienste.loadContent()
  if (!assignments || !assignments.length) return

  console.log(assignments)
}
