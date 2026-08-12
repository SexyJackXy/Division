(function () {
  function getCheckboxes() {
    return {
      showWachabteilung: document.getElementById('showWachabteilung'),
      autoLoadTagdienst: document.getElementById('autoLoadTagdienst'),
      showArbeitsdienste: document.getElementById('showArbeitsdienste'),
    };
  }

  async function loadSettings() {
    const settings = await fetch ('/api/settings').then(r => r.json());
    const settingCheckboxes = getCheckboxes();

    Object.entries(settingCheckboxes).forEach(([key, el]) => {
      if (el) el.checked = !!settings[key];
    });

    return settings;
  }

  async function saveSettings() {
    const settingCheckboxes = getCheckboxes();
    const settings = {};
    Object.entries(settingCheckboxes).forEach(([key, el]) => {
      settings[key] = el ? el.checked : false;
    });

    const result = await fetch ('/api/settings',{
	method: 'POST',
	headers: { 'Content-Type': 'application/json'},
	body: JSON.stringify(settings)
	}).then(r => r.json());
    return result;
  }

  async function initSettingsAdjustment() {
    const settings = await fetch('/api/settings').then(r => r.json());
    const showWachabteilung = settings.showWachabteilung;
    const autoLoadTagdienst = settings.autoLoadTagdienst;
    const showArbeitsdienste = settings.showArbeitsdienste;
    
    console.log(settings);
    
    if(showArbeitsdienste === true){
      const workServices = document.getElementById('workServices');
      const workServicesTitle = document.getElementById('workServicesTitle')
      workServices.style.display = 'flex';
      workServicesTitle.style.display = 'block';
    }

    return settings;
  }

  function initSettingsPage() {
    loadSettings();

    const saveBtn = document.getElementById('Save');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const p = saveBtn.querySelector("p");
        const originalText = p ? p.textContent : null;

        await saveSettings();

        if (p) {
          p.textContent = "Gespeichert!";
          setTimeout(() => {
            p.textContent = originalText;
          }, 2000);
        }
      });
    }
  }

  // Nur auf der settings.html ausführen (Button existiert nur dort)
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('Save')) {
      initSettingsPage();
    }
  });

  // Sofort verfügbar machen, unabhängig von DOMContentLoaded-Reihenfolge
  window.DiensteSettings = {
    loadSettings,
    saveSettings,
    initSettingsAdjustment,
  };
})();
