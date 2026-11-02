(function startApplication(global) {
  'use strict';

  const app = global.AvelisApp;
  const core = global.AvelisCore;
  const form = document.getElementById('configuration-form');
  const messages = document.getElementById('input-messages');
  const canvas = document.getElementById('wall-viewer');

  function selectedCandidate() {
    return app.state.result ? core.selectCandidate(app.state.result, app.state.selectedCandidateId) : null;
  }

  function redraw() {
    app.viewer.render(canvas, selectedCandidate(), app.state.rotationDeg, app.state.showLabels);
  }

  function selectCandidate(candidateId) {
    app.state.selectedCandidateId = candidateId;
    const candidate = selectedCandidate();
    app.resultsView.renderSelected(app.state.result, candidate);
    app.resultsView.renderTable(app.state.result, candidateId, selectCandidate);
    redraw();
  }

  function run() {
    const input = app.formController.readForm(form);
    const result = core.runWorkflow(input);
    app.state.result = result;
    app.formController.renderMessages(messages, result.inputValidation);
    app.downloadController.enable(result.ok);
    if (!result.ok) {
      app.state.selectedCandidateId = null;
      app.resultsView.renderInvalid(result);
      redraw();
      return;
    }
    selectCandidate(result.recommended.id);
  }

  form.addEventListener('submit', (event) => { event.preventDefault(); run(); });
  document.getElementById('reset-button').addEventListener('click', () => { app.formController.setFormValues(form, core.DEFAULT_INPUT); run(); });
  document.getElementById('rotation-slider').addEventListener('input', (event) => { app.state.rotationDeg = Number(event.target.value); redraw(); });
  document.getElementById('labels-toggle').addEventListener('change', (event) => { app.state.showLabels = event.target.checked; redraw(); });
  global.addEventListener('resize', redraw);
  app.formController.renderPresets(document.getElementById('preset-buttons'), form, run);
  app.formController.bindDoorToggle(form, run);
  app.downloadController.bind();
  app.formController.setFormValues(form, core.DEFAULT_INPUT);
  run();
})(window);
