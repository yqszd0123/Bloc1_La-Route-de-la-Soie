(function startApplication(global) {
  'use strict';

  const app = global.AvelisApp;
  const core = global.AvelisCore;
  const form = document.getElementById('configuration-form');
  const messages = document.getElementById('input-messages');
  const canvas = document.getElementById('wall-viewer');
  const prototypePageId = 'prototype-page';

  function showPage(pageId) {
    document.querySelectorAll('.app-page').forEach((page) => { page.hidden = page.id !== pageId; });
    document.querySelectorAll('.tab-button').forEach((button) => button.classList.toggle('is-active', button.dataset.page === pageId));
    app.state.activePage = pageId;
    if (pageId === 'design-page') requestAnimationFrame(redraw);
    if (pageId === prototypePageId) requestAnimationFrame(redrawPrototype);
  }

  function selectedCandidate() {
    return app.state.result ? core.selectCandidate(app.state.result, app.state.selectedCandidateId) : null;
  }

  function redraw() {
    app.viewer.render(canvas, selectedCandidate(), app.state.rotationDeg, app.state.showLabels);
  }

  function redrawPrototype() {
    app.prototypeView.render(selectedCandidate());
  }

  function selectCandidate(candidateId) {
    app.state.selectedCandidateId = candidateId;
    const candidate = selectedCandidate();
    app.resultsView.renderSelected(app.state.result, candidate);
    app.resultsView.renderTable(app.state.result, candidateId, selectCandidate);
    redraw();
    redrawPrototype();
  }

  function acceptResult(result, showDesign) {
    app.state.result = result;
    app.downloadController.enable(result.ok);
    if (!result.ok) {
      app.state.selectedCandidateId = null;
      app.resultsView.renderInvalid(result);
      redraw();
      redrawPrototype();
      if (showDesign) showPage('design-page');
      return;
    }
    selectCandidate(result.recommended.id);
    if (showDesign) showPage('design-page');
  }

  function runManual(showDesign) {
    const input = app.formController.readForm(form);
    const result = core.runWorkflow(input);
    app.formController.renderMessages(messages, result.inputValidation);
    acceptResult(result, showDesign);
  }

  function runIfcWall(wallEntityId) {
    if (!app.state.ifcText) return;
    try {
      const result = core.runIfcWorkflow(app.state.ifcText, { wallEntityId });
      acceptResult(result, true);
    } catch (error) {
      const container = document.getElementById('ifc-messages');
      container.innerHTML = `<div class="message message--error">Le mur IFC n’a pas pu être généré : ${error.message}</div>`;
    }
  }

  function runStepModel(model, mapping) {
    try {
      const result = core.runStepWorkflow(model, mapping);
      acceptResult(result, true);
    } catch (error) {
      const container = document.getElementById('step-messages');
      container.innerHTML = `<div class="message message--error">Le modèle STEP n’a pas pu être converti : ${error.message}</div>`;
    }
  }

  document.querySelectorAll('.tab-button').forEach((button) => button.addEventListener('click', () => showPage(button.dataset.page)));
  form.addEventListener('submit', (event) => { event.preventDefault(); runManual(true); });
  document.getElementById('reset-button').addEventListener('click', () => {
    app.formController.setFormValues(form, core.DEFAULT_INPUT);
    runManual(false);
  });
  document.getElementById('rotation-slider').addEventListener('input', (event) => { app.state.rotationDeg = Number(event.target.value); redraw(); });
  document.getElementById('labels-toggle').addEventListener('change', (event) => { app.state.showLabels = event.target.checked; redraw(); });
  global.addEventListener('resize', () => {
    if (app.state.activePage === 'design-page') redraw();
    if (app.state.activePage === prototypePageId) redrawPrototype();
  });

  app.formController.renderPresets(document.getElementById('preset-buttons'), form, () => runManual(false));
  app.formController.bindOpeningToggles(form, () => runManual(false));
  app.ifcController.bind(runIfcWall);
  app.stepController.bind(runStepModel);
  app.downloadController.bind();
  app.prototypeView.bind(selectedCandidate);
  app.formController.setFormValues(form, core.DEFAULT_INPUT);
  runManual(false);
  showPage('config-page');
})(window);
