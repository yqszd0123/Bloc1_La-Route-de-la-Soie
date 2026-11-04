(function initFormController(global) {
  'use strict';

  const app = global.AvelisApp;
  const core = global.AvelisCore;
  const requiredNumbers = [
    'wallLengthMm', 'wallHeightMm', 'wallThicknessMm',
    'windowWidthMm', 'windowHeightMm', 'windowXMm', 'sillHeightMm',
    'doorWidthMm', 'doorHeightMm', 'doorXMm', 'prototypeScale', 'timberStudSpacingMm'
  ];
  const optionalNumbers = ['budgetPriceEurPerKgExVat', 'budgetLowEurPerKgExVat', 'budgetHighEurPerKgExVat', 'timberBudgetPriceEurPerM3ExVat', 'timberBudgetLowEurPerM3ExVat', 'timberBudgetHighEurPerM3ExVat'];

  function setFormValues(form, values) {
    Object.keys(values).forEach((key) => {
      const field = form.elements[key];
      if (!field) return;
      if (field.type === 'checkbox') field.checked = Boolean(values[key]);
      else field.value = values[key] == null ? '' : values[key];
    });
    syncOpeningFields(form, 'window');
    syncOpeningFields(form, 'door');
    app.materialController.sync(form);
  }

  function syncOpeningFields(form, kind) {
    const checkbox = form.elements[`${kind}Enabled`];
    const fields = document.getElementById(`${kind}-fields`);
    const enabled = Boolean(checkbox && checkbox.checked);
    if (fields) fields.hidden = !enabled;
    const section = fields && fields.closest('fieldset');
    if (section) section.classList.toggle('is-enabled', enabled);
  }

  function readForm(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    requiredNumbers.forEach((key) => { if (Object.hasOwn(data, key)) data[key] = Number(data[key]); });
    optionalNumbers.forEach((key) => { data[key] = data[key] === '' || data[key] == null ? null : Number(data[key]); });
    data.windowEnabled = Boolean(form.elements.windowEnabled.checked);
    data.doorEnabled = Boolean(form.elements.doorEnabled.checked);
    data.sourceMode = 'MANUAL';
    data.typology = 'REFERENCE';
    return data;
  }

  function bindOpeningToggles(form, onChange) {
    ['window', 'door'].forEach((kind) => {
      form.elements[`${kind}Enabled`].addEventListener('change', () => {
        syncOpeningFields(form, kind);
        if (onChange) onChange();
      });
      syncOpeningFields(form, kind);
    });
  }

  function renderPresets(container, form, onApply) {
    container.innerHTML = '';
    core.EXPERIMENT_PRESETS.forEach((preset) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = preset.label;
      button.title = `Provenance : ${preset.provenance}`;
      button.addEventListener('click', () => {
        setFormValues(form, Object.assign({}, core.DEFAULT_INPUT, preset.input, app.materialController.settings(form)));
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
      message.textContent = 'Géométrie cohérente : génération de l’ossature, métrés, comparaison et exports recalculés.';
      container.appendChild(message);
    }
  }

  app.formController = { setFormValues, readForm, renderPresets, renderMessages, syncOpeningFields, bindOpeningToggles };
})(window);
