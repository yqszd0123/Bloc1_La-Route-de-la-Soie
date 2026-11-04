(function initPrototypeView(global) {
  'use strict';

  const app = global.AvelisApp;
  const core = global.AvelisCore;
  const roleColors = core.ROLE_COLORS;

  function layerY(layer, wall, explodePercent) {
    const frameDepth = wall.displayDepthMm || wall.sourceThicknessMm || 100;
    const frameCenter = frameDepth / 2;
    const gap = Math.max(70, frameDepth * .7) * (explodePercent / 100);
    if (layer.side === 'EXTERIOR') return frameDepth + gap * layer.displayOrder;
    if (layer.side === 'INTERIOR') return -gap * layer.displayOrder;
    return frameCenter;
  }

  function surfacePrimitive(surface, layer, wall, explodePercent) {
    const y = layerY(layer, wall, explodePercent);
    return {
      type: 'polygon',
      points: [[surface.xMin, y, surface.zMin], [surface.xMax, y, surface.zMin], [surface.xMax, y, surface.zMax], [surface.xMin, y, surface.zMax]],
      fill: app.canvasGeometry.shade(layer.color, 1, layer.id === 'INSULATION' ? .76 : .9),
      stroke: app.canvasGeometry.shade(layer.color, .68, .72),
      lineWidth: 1.1,
      orderBias: layer.displayOrder * .001
    };
  }

  function renderLegend(model) {
    const container = document.getElementById('prototype-layer-list');
    if (!model) {
      container.innerHTML = '<div class="empty-state">Générez ou sélectionnez d’abord une solution acier.</div>';
      return;
    }
    container.innerHTML = model.layers.map((layer) => `
      <article class="prototype-layer-item ${layer.displayOnly ? 'is-display-only' : 'is-generated'}">
        <span class="prototype-layer-swatch" style="--layer-color:${layer.color}"></span>
        <div><strong>${layer.label}</strong><small>${layer.displayOnly ? 'Démonstration visuelle · aucun fichier généré' : 'Issu du modèle acier · présent dans les exports existants'}</small></div>
      </article>
    `).join('');
  }

  function render(candidate) {
    const canvas = document.getElementById('prototype-viewer');
    if (!canvas) return;
    if (!candidate) {
      app.canvasGeometry.render(canvas, [], { rotationDeg: app.state.prototypeRotationDeg });
      renderLegend(null);
      document.getElementById('prototype-caption').textContent = 'Aucune solution sélectionnée.';
      return;
    }

    const model = core.prototypeLayers.build(candidate, app.state.prototypeStage);
    const primitives = [];
    model.layers.forEach((layer) => {
      layer.surfaces.forEach((surface) => primitives.push(surfacePrimitive(surface, layer, model.wall, app.state.prototypeExplode)));
      layer.members.forEach((member) => primitives.push({
        type: 'box', bounds: member.bounds, color: roleColors[member.role] || '#6f8791', alpha: .98
      }));
    });
    app.canvasGeometry.render(canvas, primitives, { rotationDeg: app.state.prototypeRotationDeg, padding: 120 });
    renderLegend(model);
    document.querySelectorAll('.prototype-stage-button').forEach((button) => {
      const active = button.dataset.stage === model.stage.id;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const mode = app.state.prototypeExplode === 0 ? 'assemblée' : `éclatée à ${app.state.prototypeExplode} %`;
    document.getElementById('prototype-caption').textContent = `Étape ${model.stage.number}/4 · ${model.stage.label} · vue ${mode}`;
  }

  function bind(getCandidate) {
    document.querySelectorAll('.prototype-stage-button').forEach((button) => button.addEventListener('click', () => {
      app.state.prototypeStage = button.dataset.stage;
      render(getCandidate());
    }));
    document.getElementById('prototype-rotation-slider').addEventListener('input', (event) => {
      app.state.prototypeRotationDeg = Number(event.target.value);
      render(getCandidate());
    });
    document.getElementById('prototype-explode-slider').addEventListener('input', (event) => {
      app.state.prototypeExplode = Number(event.target.value);
      render(getCandidate());
    });
  }

  app.prototypeView = { bind, render };
})(window);
