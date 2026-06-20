(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const settingCheckboxes = {
      showWachabteilung: document.getElementById('showWachabteilung'),
      autoLoadTagdienst: document.getElementById('autoLoadTagdienst'),
      showArbeitsdienste: document.getElementById('showArbeitsdienste'),
    };

    async function loadSettings() {
      const settings = await window.electronAPI.loadSettings();

      Object.entries(settingCheckboxes).forEach(([key, el]) => {
        if (el) el.checked = !!settings[key];
      });

      return settings;
    }

    async function saveSettings() {
      const settings = {};
      Object.entries(settingCheckboxes).forEach(([key, el]) => {
        settings[key] = el ? el.checked : false;
      });

      const result = await window.electronAPI.saveSettings(settings);
      return result;
    }

    async function initSettingsAdjustment() {
      const settings = await window.electronAPI.loadSettings();
      console.log("test");
      console.log(settings);

      const teamSection = document.getElementById('teamSection');
      if (teamSection) {
        teamSection.style.display = settings.showWachabteilung === false ? 'none' : '';
      }

      return settings;
    }

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

    window.DiensteSettings = {
      loadSettings,
      saveSettings,
      initSettingsAdjustment,
    };
  });
})();