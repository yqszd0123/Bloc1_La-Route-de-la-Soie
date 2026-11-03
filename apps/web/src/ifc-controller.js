(function initIfcController(global) {
  'use strict';

  const app = global.AvelisApp;
  const core = global.AvelisCore;

  function message(kind, text) {
    const container = document.getElementById('ifc-messages');
    container.innerHTML = '';
    const item = document.createElement('div');
    item.className = `message message--${kind}`;
    item.textContent = text;
    container.appendChild(item);
  }

  function renderModel(model, onSelect) {
    const card = document.getElementById('ifc-summary-card');
    card.hidden = false;
    document.getElementById('ifc-summary-pill').textContent = `${model.walls.length} mur(s) exploitable(s)`;
    const summary = document.getElementById('ifc-summary');
    summary.innerHTML = '';
    [
      `Schéma ${model.schema}`,
      `Unité ${model.unit.name}`,
      `${model.entityCount} entités`,
      `${model.buildings.length} bâtiment(s)`,
      `${model.storeys.length} étage(s)`,
      `${model.warnings.length} avertissement(s)`
    ].forEach((label) => {
      const chip = document.createElement('span');
      chip.textContent = label;
      summary.appendChild(chip);
    });
    const list = document.getElementById('ifc-wall-list');
    list.innerHTML = '';
    model.walls.forEach((wall) => {
      const storey = model.storeys.find((entry) => entry.entityId === wall.storeyId);
      const item = document.createElement('div');
      item.className = 'wall-item';
      const details = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = `${wall.name} · #${wall.entityId}`;
      const meta = document.createElement('span');
      meta.textContent = `${storey ? storey.name : 'Étage non relié'} · ${wall.lengthMm} × ${wall.heightMm} × ${wall.thicknessMm} mm · ${wall.openings.length} ouverture(s) · rotation ${wall.placement.rotationDeg}°`;
      details.append(title, meta);
      const button = document.createElement('button');
      button.className = 'button button--primary';
      button.type = 'button';
      button.textContent = 'Générer ce panneau';
      button.addEventListener('click', () => onSelect(wall.entityId));
      item.append(details, button);
      list.appendChild(item);
    });
  }

  function loadText(text, label, onSelect) {
    try {
      const model = core.ifcImporter.parseIfc(text);
      app.state.ifcText = text;
      app.state.ifcModel = model;
      renderModel(model, onSelect);
      message('success', `${label} lu avec succès : unités, hiérarchie, géométrie et relations de remplissage vérifiées.`);
    } catch (error) {
      app.state.ifcText = null;
      app.state.ifcModel = null;
      document.getElementById('ifc-summary-card').hidden = true;
      message('error', `Import IFC refusé : ${error.message}`);
    }
  }

  function bind(onSelect) {
    document.getElementById('ifc-file').addEventListener('change', async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      loadText(await file.text(), file.name, onSelect);
    });
    document.getElementById('load-official-ifc').addEventListener('click', async () => {
      try {
        const response = await fetch('../../test-data/ifc/wall-with-opening-and-window.ifc');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        loadText(await response.text(), 'wall-with-opening-and-window.ifc', onSelect);
      } catch (error) {
        message('error', `Le fichier officiel n’a pas pu être chargé (${error.message}). Lancez l’application avec START_APP.bat ou choisissez le fichier localement.`);
      }
    });
  }

  app.ifcController = { bind, loadText, renderModel };
})(window);
