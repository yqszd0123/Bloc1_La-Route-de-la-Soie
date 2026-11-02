(function initFormController(global) {
  'use strict';

  const app = global.AvelisApp;
  const core = global.AvelisCore;

  function setFormValues(form, values) {
    Object.keys(values).forEach((key) => {
      const field = form.elements[key];
      if (!field) return;
      if (field.type === 'checkbox') field.checked = Boolean(values[key]);
      else field.value = values[key];
    });
    syncDoorFields(form);
  }

  function syncDoorFields(form) {
    const enabled = Boolean(form.elements.doorEnabled && form.elements.doorEnabled.checked);
    const fields = document.getElementById('door-fields');
    if (fields) fields.hidden = !enabled;
    const section = fields && fields.closest('fieldset');
    if (section) section.classList.toggle('is-enabled', enabled);
  }

  function readForm(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    ['wallLengthMm', 'wallHeightMm', 'windowWidthMm', 'windowHeightMm', 'windowXMm', 'sillHeightMm', 'doorWidthMm', 'doorHeightMm', 'doorXMm', 'prototypeScale'].forEach((key) => {
      data[key] = Number(data[key]);
    });
    data.doorEnabled = Boolean(form.elements.doorEnabled.checked);
    data.typology = 'T1';
    return data;
  }

  function bindDoorToggle(form, onChange) {
    form.elements.doorEnabled.addEventListener('change', () => {
      syncDoorFields(form);
      if (onChange) onChange();
    });
    syncDoorFields(form);
  }

  function renderPresets(container, form, onApply) {
    container.innerHTML = '';
    core.EXPERIMENT_PRESETS.forEach((preset, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `Variante ${String.fromCharCode(65 + index)}`;
      button.title = preset.label;
      button.addEventListener('click', () => {
        setFormValues(form, Object.assign({}, core.DEFAULT_INPUT, preset.input));
        onApply();
      });
      container.appendChild(button);
    });
  }

  function renderMessages(container, validation) {
    container.innerHTML = '';
    if (!validation) return;
    validation.issues.filter((entry) => entry.severity !== 'review').forEach((entry) => {
      const message = document.createElement('div');
      message.className = `message message--${entry.severity === 'error' ? 'error' : 'warning'}`;
      message.textContent = entry.message;
      container.appendChild(message);
    });
    if (validation.valid) {
      const message = document.createElement('div');
      message.className = 'message message--success';
      message.textContent = 'Configuration cohérente : recherche multicritère exécutée sans ressaisie.';
      container.appendChild(message);
    }
  }

  app.formController = { setFormValues, readForm, renderPresets, renderMessages, syncDoorFields, bindDoorToggle };
})(window);
