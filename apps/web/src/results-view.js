(function initResultsView(global) {
  'use strict';

  const app = global.AvelisApp;

  function text(id, value) {
    document.getElementById(id).textContent = value;
  }

  function renderMetrics(result, candidate) {
    if (!candidate) return;
    text('metric-time', `${result.processingTimeMs} ms`);
    text('metric-volume', candidate.metrics.timberVolumeM3.toFixed(4));
    text('metric-components', candidate.metrics.componentCount);
    text('metric-complexity', candidate.metrics.manufacturingComplexity.toFixed(1));
    text('metric-cost', `${candidate.metrics.estimatedCostEur.toFixed(2)} €`);
    text('metric-rules', candidate.validation.checkedRuleCount);
  }

  function renderTable(result, selectedId, onSelect) {
    const body = document.getElementById('candidate-table-body');
    body.innerHTML = '';
    result.rankedCandidates.forEach((candidate) => {
      const row = document.createElement('tr');
      row.className = candidate.id === selectedId ? 'is-selected' : '';
      row.innerHTML = [
        `<td><span class="rank-badge">${candidate.rank}</span></td>`,
        `<td>${candidate.id}${candidate.paretoOptimal ? '<span class="pareto">PARETO</span>' : ''}</td>`,
        `<td>${candidate.option.studSpacingMm} mm</td>`,
        `<td>${candidate.option.gridOffsetMm} mm</td>`,
        `<td>${candidate.option.headerLayers}</td>`,
        `<td>${candidate.metrics.timberVolumeM3.toFixed(4)} m³</td>`,
        `<td>${candidate.metrics.componentCount}</td>`,
        `<td>${candidate.metrics.manufacturingComplexity.toFixed(1)}</td>`,
        `<td>${candidate.metrics.estimatedCostEur.toFixed(2)} €</td>`,
        `<td>${candidate.score.toFixed(2)}</td>`
      ].join('');
      row.addEventListener('click', () => onSelect(candidate.id));
      body.appendChild(row);
    });
    text('candidate-count', `${result.rankedCandidates.length} candidats valides / ${result.search.searchSpaceSize}`);
  }

  function renderBom(candidate) {
    const container = document.getElementById('bom-summary');
    container.innerHTML = '';
    const byRole = new Map();
    candidate.members.forEach((member) => byRole.set(member.role, (byRole.get(member.role) || 0) + 1));
    Array.from(byRole.entries()).sort().forEach(([role, count]) => {
      const item = document.createElement('div');
      item.className = 'bom-item';
      item.innerHTML = `<strong>${count} × ${role.replace(/_/g, ' ')}</strong><span>IDs uniques · section ${candidate.members.find((m) => m.role === role).section.widthMm} × ${candidate.members.find((m) => m.role === role).section.depthMm} mm</span>`;
      container.appendChild(item);
    });
  }

  function renderValidation(candidate) {
    const container = document.getElementById('validation-summary');
    container.innerHTML = '';
    const success = document.createElement('div');
    success.className = 'validation-row';
    success.innerHTML = `<span class="validation-icon">✓</span><span><strong>${candidate.validation.checkedRuleCount} contrôles exécutés</strong><br>Aucun composant dans les ouvertures, encadrements complets, IDs uniques et limites machine respectées.</span>`;
    container.appendChild(success);
    candidate.validation.issues.forEach((issue) => {
      const row = document.createElement('div');
      row.className = 'validation-row is-review';
      row.innerHTML = `<span class="validation-icon">!</span><span><strong>${issue.code}</strong><br>${issue.message}</span>`;
      container.appendChild(row);
    });
  }

  function renderSelected(result, candidate) {
    text('candidate-title', `${candidate.id} · rang ${candidate.rank} · score ${candidate.score}`);
    const openingLabel = candidate.wall.openings.map((opening) => opening.type === 'DOOR' ? 'porte' : 'fenêtre').join(' + ');
    text('viewer-caption', `${openingLabel} · entraxe ${candidate.option.studSpacingMm} mm · ${candidate.option.headerLayers} couche(s) de linteau`);
    renderMetrics(result, candidate);
    renderBom(candidate);
    renderValidation(candidate);
  }

  function renderInvalid(result) {
    text('candidate-title', 'Configuration bloquée');
    text('viewer-caption', 'Corrigez les paramètres pour générer de nouveaux candidats.');
    ['metric-time', 'metric-volume', 'metric-components', 'metric-complexity', 'metric-cost'].forEach((id) => text(id, '—'));
    text('metric-rules', 'bloqué');
    text('candidate-count', '0 candidat — saisie invalide');
    document.getElementById('candidate-table-body').innerHTML = '';
    document.getElementById('bom-summary').innerHTML = '<div class="empty-state">Aucune nomenclature ni aucun fichier ne sont produits.</div>';
    const errors = result.inputValidation.issues.filter((issue) => issue.severity === 'error');
    document.getElementById('validation-summary').innerHTML = errors.map((error) => `<div class="validation-row is-error"><span class="validation-icon">×</span><span><strong>${error.code}</strong><br>${error.message}</span></div>`).join('');
  }

  app.resultsView = { renderTable, renderSelected, renderInvalid };
})(window);
