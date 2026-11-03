(function initStepController(global) {
  'use strict';

  const app = global.AvelisApp;
  const core = global.AvelisCore;
  let parserPromise = null;

  function message(kind, text) {
    const container = document.getElementById('step-messages');
    container.innerHTML = '';
    const item = document.createElement('div');
    item.className = `message message--${kind}`;
    item.textContent = text;
    container.appendChild(item);
  }

  function parser() {
    if (typeof global.occtimportjs !== 'function') throw new Error('Le moteur Open CASCADE n’est pas chargé.');
    if (!parserPromise) {
      parserPromise = global.occtimportjs({
        locateFile: (name) => `../../third_party/occt-import-js/dist/${name}`
      });
    }
    return parserPromise;
  }

  function renderModel(model) {
    const card = document.getElementById('step-summary-card');
    card.hidden = false;
    document.getElementById('step-summary-pill').textContent = `${model.meshCount} maillage(s)`;
    const summary = document.getElementById('step-summary');
    summary.innerHTML = '';
    [
      model.fileName,
      `X ${model.dimensionsMm.X} mm`,
      `Y ${model.dimensionsMm.Y} mm`,
      `Z ${model.dimensionsMm.Z} mm`,
      `${model.vertexCount} sommets`,
      `empreinte ${model.sourceFingerprint}`
    ].forEach((label) => {
      const chip = document.createElement('span');
      chip.textContent = label;
      summary.appendChild(chip);
    });
  }

  async function loadBytes(bytes, fileName) {
    message('warning', `Lecture de ${fileName} par Open CASCADE…`);
    try {
      const engine = await parser();
      const parsed = engine.ReadStepFile(new Uint8Array(bytes), { linearUnit: 'millimeter' });
      const model = core.stepAdapter.modelFromOcct(parsed, fileName);
      app.state.stepModel = model;
      app.state.stepFileName = fileName;
      renderModel(model);
      message('success', `${fileName} lu : ${model.meshCount} maillage(s), ${model.vertexCount} sommets et enveloppe X/Y/Z calculée en millimètres.`);
    } catch (error) {
      app.state.stepModel = null;
      document.getElementById('step-summary-card').hidden = true;
      message('error', `Import STEP refusé : ${error.message}`);
    }
  }

  function axisMapping() {
    return {
      length: document.getElementById('step-length-axis').value,
      height: document.getElementById('step-height-axis').value,
      thickness: document.getElementById('step-thickness-axis').value
    };
  }

  function bind(onGenerate) {
    document.getElementById('step-file').addEventListener('change', async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      await loadBytes(await file.arrayBuffer(), file.name);
    });
    document.getElementById('load-official-step').addEventListener('click', async () => {
      try {
        const response = await fetch('../../test-data/step/cube.stp');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await loadBytes(await response.arrayBuffer(), 'cube.stp');
      } catch (error) {
        message('error', `Le STEP de test n’a pas pu être chargé (${error.message}). Lancez l’application avec START_APP.bat ou choisissez le fichier localement.`);
      }
    });
    document.getElementById('generate-step-panel').addEventListener('click', () => {
      if (!app.state.stepModel) return;
      try {
        onGenerate(app.state.stepModel, axisMapping());
      } catch (error) {
        message('error', `Conversion STEP refusée : ${error.message}`);
      }
    });
  }

  app.stepController = { bind, loadBytes, renderModel, axisMapping };
})(window);
