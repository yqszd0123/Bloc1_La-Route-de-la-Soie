(function initPrototypeView(global) {
  'use strict';

  const app = global.AvelisApp;
  const core = global.AvelisCore;
  const hiddenTimberLayers = new Set();
  let timberView = 'COMPLETE';
  let timberExplode = 0;
  function timberOffset(layer,wall,explode) {
    const gap = Math.max(140,wall.lengthMm*.45)*explode/100;
    return ({FRAME:0,INSULATION:-1,JOINERY:-2,RAIN_BARRIER:1,CLADDING:2}[layer.id] || 0)*gap;
  }
  function shiftedBounds(bounds,offset) {
    return {min:{...bounds.min,y:bounds.min.y+offset},max:{...bounds.max,y:bounds.max.y+offset}};
  }
  function timberLayerBias(layer,wall,explode) {
    // Parallel material planes need consistent painter order across tiled faces.
    // Geometry/quantities remain at their physical coordinates in the core model.
    return layerY(layer,wall,explode)*Math.cos(app.state.prototypeRotationDeg*Math.PI/180)*10000;
  }
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
    if (layer.timberAssembly) return (layer.solids[0] ? (layer.solids[0].min.y+layer.solids[0].max.y)/2 : wall.displayDepthMm/2) + timberOffset(layer,wall,explodePercent);
    const frameDepth = wall.displayDepthMm || wall.sourceThicknessMm || 100;
    const frameCenter = frameDepth / 2;
    const gap = Math.max(140, frameDepth * 1.4) * (explodePercent / 100);
    if (layer.side === 'EXTERIOR') return frameDepth + gap * layer.displayOrder;
    if (layer.side === 'INTERIOR') return -gap * layer.displayOrder;
    return frameCenter;
  }

  function surfacePrimitive(surface, layer, wall, explodePercent) {
    const y = layer.timberAssembly && Number.isFinite(surface.yMm) ? surface.yMm+timberOffset(layer,wall,explodePercent) : layerY(layer, wall, explodePercent);
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
      orderBias: layer.timberAssembly ? timberLayerBias(layer,wall,explodePercent) : layer.displayOrder * .001
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
        ${model.frameMaterial === 'TIMBER' ? `<input type="checkbox" data-timber-layer="${layer.id}" aria-label="Afficher ${layer.label}" ${hiddenTimberLayers.has(layer.id)?'':'checked'}>` : ''}
        <div><strong>${layer.label}</strong><small>${layer.id === 'FRAME'
          ? 'Ossature · présente dans les exports de fabrication'
          : `${layer.parts.length} ${layer.id==='CLADDING'?'surface(s)':layer.id==='JOINERY'?'réservation(s)':'pièce(s)'} · ${layer.thicknessMm===null?'épaisseur non spécifiée':layer.thicknessMm+' mm'} · ${layer.referenceProduct}`}</small></div>
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
        <td>${part.geometryType === 'JOINERY_OPENING_ENVELOPE' ? 'Réservation de menuiserie' : part.geometryType === 'RECTANGLE' ? (model.frameMaterial==='TIMBER'?'Pièce rectangulaire':'Rectangle de cavité') : (model.frameMaterial==='TIMBER'?'Contour avec évidements':'Contour mural avec évidements')}</td>
        <td>${part.widthMm.toFixed(1)} × ${part.heightMm.toFixed(1)} × ${part.thicknessMm===null?'à définir':part.thicknessMm.toFixed(1)} mm</td>
        <td>${part.cutouts.length ? `${part.cutouts.length} · ${part.cutoutAreaM2.toFixed(3)} m²` : '0'}</td>
        <td>${part.netAreaM2.toFixed(3)} m²</td>
        <td>${part.volumeM3===null?'non spécifié':part.volumeM3.toFixed(4)+' m³'}</td>
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

  function drawLayerLabels(view, model, explode) {
    if (!(view && explode >= 18)) return;
    const anchors = model.layers.map((layer) => {
      const point = [model.wall.lengthMm / 2, layerY(layer, model.wall, explode), model.wall.heightMm];
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

    const isTimber = candidate.frameMaterial === 'TIMBER';
    const explode = isTimber ? timberExplode : app.state.prototypeExplode;
    document.getElementById('prototype-explode-slider').value=explode;
    const model = core.prototypeLayers.build(candidate, isTimber ? (timberView==='FRAME'?'FRAME':'COMPLETE') : app.state.prototypeStage);
    if (isTimber) model.layers.forEach((layer) => { layer.timberAssembly=true; });
    const visibleModel = {...model,layers:model.layers.filter((l)=>!isTimber || !hiddenTimberLayers.has(l.id))};
    const primitives = [];
    visibleModel.layers.forEach((layer) => {
      layer.surfaces.forEach((surface) => primitives.push(surfacePrimitive(surface, layer, model.wall, explode)));
      if (isTimber) (layer.solids || []).forEach((bounds)=>primitives.push({type:'box',bounds:shiftedBounds(bounds,timberOffset(layer,model.wall,explode)),color:layer.color,alpha:layer.id==='INSULATION'?.82:1,orderBias:timberLayerBias(layer,model.wall,explode)}));
      layer.members.forEach((member) => primitives.push({
        type: 'box', bounds: member.bounds, color: core.memberColor(member, candidate.frameMaterial), alpha: .98,
        orderBias: isTimber ? timberLayerBias(layer,model.wall,explode) : 0
      }));
    });
    const view = app.canvasGeometry.render(canvas, primitives, { rotationDeg: app.state.prototypeRotationDeg, padding: 170 });
    drawLayerLabels(view, visibleModel, explode);
    renderLegend(model);
    renderPartsSchedule(model);
    document.querySelectorAll('.prototype-stage-button').forEach((button) => {
      const active = button.dataset.stage === model.stage.id;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const mode = explode === 0 ? 'assemblée' : `éclatement ${explode}/200`;
    document.getElementById('prototype-caption').textContent = `Étape ${model.stage.number}/4 · ${model.stage.label} · vue ${mode}`;
    if (isTimber) document.getElementById('prototype-caption').textContent = `${model.stage.label} · ${mode} · cinq familles Avelis, produits de référence à confirmer`;
    document.querySelectorAll('[data-timber-view]').forEach((button)=>{
      button.classList.toggle('is-active',button.dataset.timberView===timberView);
      button.setAttribute('aria-pressed',String(button.dataset.timberView===timberView));
    });
  }

  function bind(getCandidate) {
    document.querySelectorAll('[data-timber-view]').forEach((button)=>button.addEventListener('click',()=>{
      timberView=button.dataset.timberView;
      hiddenTimberLayers.clear();
      timberExplode=timberView==='EXPLODED'?100:0;
      document.getElementById('prototype-explode-slider').value=timberExplode;
      render(getCandidate());
    }));
    document.getElementById('prototype-layer-list').addEventListener('change',(event)=>{
      const id=event.target.dataset.timberLayer;
      if(!id)return;
      if(event.target.checked)hiddenTimberLayers.delete(id);else hiddenTimberLayers.add(id);
      render(getCandidate());
    });
    document.querySelectorAll('.prototype-stage-button').forEach((button) => button.addEventListener('click', () => {
      app.state.prototypeStage = button.dataset.stage;
      render(getCandidate());
    }));
    document.getElementById('prototype-rotation-slider').addEventListener('input', (event) => {
      app.state.prototypeRotationDeg = Number(event.target.value);
      render(getCandidate());
    });
    document.getElementById('prototype-explode-slider').addEventListener('input', (event) => {
      if(getCandidate()?.frameMaterial==='TIMBER') timberExplode=Number(event.target.value);
      else app.state.prototypeExplode = Number(event.target.value);
      render(getCandidate());
    });
  }

  app.prototypeView = { bind, render };
})(window);
