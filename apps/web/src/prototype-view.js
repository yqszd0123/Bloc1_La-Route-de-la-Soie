(function initPrototypeView(global) {
  'use strict';

  const app = global.AvelisApp;
  const core = global.AvelisCore;
  const roleColors = core.ROLE_COLORS;
  const layerShortLabels = {
    FRAME: 'Ossature',
    INSULATION: 'Isolation témoin',
    EXTERIOR_BOARD: 'Panneau extérieur',
    INTERIOR_BOARD: 'Parement intérieur',
    EXTERIOR_FINISH: 'Finition extérieure',
    INTERIOR_FINISH: 'Finition intérieure'
  };

  function layerY(layer, wall, explodePercent) {
    const frameDepth = wall.displayDepthMm || wall.sourceThicknessMm || 100;
    const frameCenter = frameDepth / 2;
    const gap = Math.max(140, frameDepth * 1.4) * (explodePercent / 100);
    if (layer.side === 'EXTERIOR') return frameDepth + gap * layer.displayOrder;
    if (layer.side === 'INTERIOR') return -gap * layer.displayOrder;
    return frameCenter;
  }

  function surfacePrimitive(surface, layer, wall, explodePercent) {
    const y = layerY(layer, wall, explodePercent);
    return {
      type: 'polygon',
      points: [[surface.xMin, y, surface.zMin], [surface.xMax, y, surface.zMin], [surface.xMax, y, surface.zMax], [surface.xMin, y, surface.zMax]],
      holes: (surface.cutouts || []).map((cutout) => [
        [cutout.xMm, y, cutout.zMm], [cutout.xMm + cutout.widthMm, y, cutout.zMm],
        [cutout.xMm + cutout.widthMm, y, cutout.zMm + cutout.heightMm], [cutout.xMm, y, cutout.zMm + cutout.heightMm]
      ]),
      fill: app.canvasGeometry.shade(layer.color, 1, layer.id === 'INSULATION' ? .76 : .9),
      stroke: app.canvasGeometry.shade(layer.color, .68, .72),
      lineWidth: 1.1,
      orderBias: layer.displayOrder * .001
    };
  }

  function renderLegend(model) {
    const container = document.getElementById('prototype-layer-list');
    if (!model) {
      container.innerHTML = '<div class="empty-state">Générez ou sélectionnez d’abord une solution.</div>';
      return;
    }
    container.innerHTML = model.layers.map((layer) => `
      <article class="prototype-layer-item ${layer.id === 'FRAME' ? 'is-generated' : 'is-calculated'}">
        <span class="prototype-layer-swatch" style="--layer-color:${layer.color}"></span>
        <div><strong>${layer.label}</strong><small>${layer.id === 'FRAME'
          ? 'Ossature · présente dans les exports de fabrication'
          : `${layer.parts.length} pièce(s) · ${layer.thicknessMm} mm · ${layer.referenceProduct}`}</small></div>
      </article>
    `).join('');
  }

  function renderPartsSchedule(model) {
    const body = document.getElementById('prototype-parts-body');
    const metrics = document.getElementById('prototype-parts-metrics');
    if (!model) {
      body.innerHTML = '';
      metrics.innerHTML = '<div class="empty-state">Aucune pièce calculée.</div>';
      document.getElementById('prototype-parts-count').textContent = '—';
      return;
    }
    const schedule = model.partsSchedule;
    body.innerHTML = schedule.parts.map((part) => `
      <tr>
        <td>${part.id}</td>
        <td><strong>${part.layerLabel}</strong><br><small>${part.referenceProduct}</small></td>
        <td>${part.geometryType === 'RECTANGLE' ? 'Rectangle de cavité' : 'Contour mural avec évidements'}</td>
        <td>${part.widthMm.toFixed(1)} × ${part.heightMm.toFixed(1)} × ${part.thicknessMm.toFixed(1)} mm</td>
        <td>${part.cutouts.length ? `${part.cutouts.length} · ${part.cutoutAreaM2.toFixed(3)} m²` : '0'}</td>
        <td>${part.netAreaM2.toFixed(3)} m²</td>
        <td>${part.volumeM3.toFixed(4)} m³</td>
      </tr>
    `).join('');
    const insulation = schedule.layers.find((layer) => layer.id === 'INSULATION');
    metrics.innerHTML = `
      <article><span>Pièces totales</span><strong>${schedule.totals.partCount}</strong></article>
      <article><span>Rectangles d’isolant</span><strong>${insulation.partCount}</strong><small>vides entre profilés</small></article>
      <article><span>Surface nette cumulée</span><strong>${schedule.totals.netAreaM2.toFixed(3)} m²</strong></article>
      <article><span>Volume cumulé</span><strong>${schedule.totals.volumeM3.toFixed(4)} m³</strong></article>
    `;
    document.getElementById('prototype-parts-count').textContent = `${schedule.totals.partCount} pièces`;
  }

  function drawLayerLabels(view, model) {
    if (!(view && app.state.prototypeExplode >= 18)) return;
    const anchors = model.layers.map((layer) => {
      const point = [model.wall.lengthMm / 2, layerY(layer, model.wall, app.state.prototypeExplode), model.wall.heightMm];
      const projected = app.canvasGeometry.projectPoint(point, view.yaw, view.pitch);
      return {
        layer,
        anchorX: projected.x * view.transform.scale + view.transform.offsetX,
        anchorY: projected.y * view.transform.scale + view.transform.offsetY
      };
    }).sort((left, right) => left.anchorX - right.anchorX);

    const context = view.context;
    context.save();
    context.font = '700 11px system-ui';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    anchors.forEach((entry, index) => {
      const labelX = anchors.length === 1 ? view.width / 2 : 80 + index * ((view.width - 160) / (anchors.length - 1));
      const labelY = 24 + (index % 2) * 24;
      const elbowY = Math.max(labelY + 18, entry.anchorY - 20);
      context.beginPath();
      context.moveTo(entry.anchorX, entry.anchorY);
      context.lineTo(entry.anchorX, elbowY);
      context.lineTo(labelX, labelY + 9);
      context.strokeStyle = 'rgba(16,45,52,.55)';
      context.lineWidth = 1;
      context.stroke();
      context.beginPath();
      context.arc(entry.anchorX, entry.anchorY, 2.6, 0, Math.PI * 2);
      context.fillStyle = entry.layer.color;
      context.fill();
      const label = layerShortLabels[entry.layer.id] || entry.layer.label;
      const textWidth = context.measureText(label).width;
      context.fillStyle = 'rgba(255,255,255,.92)';
      context.fillRect(labelX - textWidth / 2 - 6, labelY - 9, textWidth + 12, 18);
      context.fillStyle = '#16343b';
      context.fillText(label, labelX, labelY);
    });
    context.restore();
  }

  function render(candidate) {
    const canvas = document.getElementById('prototype-viewer');
    if (!canvas) return;
    if (!candidate) {
      app.canvasGeometry.render(canvas, [], { rotationDeg: app.state.prototypeRotationDeg });
      renderLegend(null);
      renderPartsSchedule(null);
      document.getElementById('prototype-caption').textContent = 'Aucune solution sélectionnée.';
      return;
    }

    const model = core.prototypeLayers.build(candidate, app.state.prototypeStage);
    const primitives = [];
    model.layers.forEach((layer) => {
      layer.surfaces.forEach((surface) => primitives.push(surfacePrimitive(surface, layer, model.wall, app.state.prototypeExplode)));
      layer.members.forEach((member) => primitives.push({
        type: 'box', bounds: member.bounds, color: core.memberColor(member, candidate.frameMaterial), alpha: .98
      }));
    });
    const view = app.canvasGeometry.render(canvas, primitives, { rotationDeg: app.state.prototypeRotationDeg, padding: 170 });
    drawLayerLabels(view, model);
    renderLegend(model);
    renderPartsSchedule(model);
    document.querySelectorAll('.prototype-stage-button').forEach((button) => {
      const active = button.dataset.stage === model.stage.id;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const mode = app.state.prototypeExplode === 0 ? 'assemblée' : `éclatement ${app.state.prototypeExplode}/200`;
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
