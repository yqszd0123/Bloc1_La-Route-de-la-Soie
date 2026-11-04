(function initResultsView(global) {
  'use strict';

  const app = global.AvelisApp;
  const core = global.AvelisCore;

  function text(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function renderMetrics(result, candidate) {
    text('metric-time', `${result.processingTimeMs} ms`);
    text('metric-mass', `${candidate.metrics.steelMassKg.toFixed(2)} kg`);
    text('metric-cost', `${candidate.metrics.materialCostEstimateEurExVat.toFixed(2)} €`);
    text('metric-components', candidate.metrics.componentCount);
    text('metric-length', `${candidate.metrics.totalProfileLengthM.toFixed(2)} m`);
    text('metric-rules', candidate.validation.checkedRuleCount);
    const basis = candidate.metrics.priceBasis;
    text('metric-cost-basis', `${basis.valueEurPerKgExVat.toFixed(2)} €/kg HT · ${basis.status === 'USER_COST_SCENARIO' ? 'saisie équipe' : 'référence régionale'}`);
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
        `<td>${candidate.option.studProfileId} + ${candidate.option.trackProfileId}</td>`,
        `<td><strong>${candidate.option.gridStrategyLabel}</strong><br><small>${candidate.layout.minimumBayMm.toFixed(0)}–${candidate.layout.maximumBayMm.toFixed(0)} mm réels</small></td>`,
        `<td>${candidate.metrics.steelMassKg.toFixed(2)} kg</td>`,
        `<td>${candidate.metrics.componentCount}</td>`,
        `<td>${candidate.metrics.uniqueLengthCount}</td>`,
        `<td>${candidate.metrics.materialCostEstimateEurExVat.toFixed(2)} €</td>`,
        `<td>${candidate.score.toFixed(2)}</td>`
      ].join('');
      row.addEventListener('click', () => onSelect(candidate.id));
      body.appendChild(row);
    });
    const duplicates = result.search.duplicateCandidates.length;
    text('candidate-count', `${result.rankedCandidates.length} distinctes / ${result.search.searchSpaceSize} combinaisons${duplicates ? ` · ${duplicates} doublon(s) retiré(s)` : ''}`);
  }

  function renderBom(candidate) {
    const container = document.getElementById('bom-summary');
    container.innerHTML = '';
    candidate.bom.forEach((row) => {
      const item = document.createElement('div');
      item.className = 'bom-item';
      item.innerHTML = `<strong>${row.quantity} × ${row.role.replace(/_/g, ' ')}</strong><span>${row.manufacturerReference} · ${row.cutLengthMm} mm<br>${row.totalLengthM.toFixed(3)} m · ${row.totalMassKg.toFixed(3)} kg</span>`;
      container.appendChild(item);
    });
  }

  function renderValidation(candidate) {
    const container = document.getElementById('validation-summary');
    container.innerHTML = '';
    const geometry = document.createElement('div');
    geometry.className = 'validation-row';
    geometry.innerHTML = `<span class="validation-icon">✓</span><span><strong>${candidate.validation.checkedRuleCount} contrôles géométriques et de traçabilité</strong><br>IDs uniques, longueurs positives, profils sourcés, enveloppe et vides contrôlés.</span>`;
    container.appendChild(geometry);
    const reconciliation = document.createElement('div');
    reconciliation.className = 'validation-row';
    reconciliation.innerHTML = `<span class="validation-icon">✓</span><span><strong>BOM ↔ composants : ${candidate.crossValidation.massReconciliation.status}</strong><br>Écart ${candidate.crossValidation.massReconciliation.absoluteDifferenceKg.toFixed(4)} kg.</span>`;
    container.appendChild(reconciliation);
    candidate.validation.issues.forEach((issue) => {
      const row = document.createElement('div');
      row.className = `validation-row ${issue.severity === 'error' ? 'is-error' : 'is-review'}`;
      row.innerHTML = `<span class="validation-icon">!</span><span><strong>${issue.code}</strong><br>${issue.message}</span>`;
      container.appendChild(row);
    });
  }

  function renderManufacturing(candidate) {
    const body = document.getElementById('manufacturing-table-body');
    body.innerHTML = '';
    core.assemblyPriority.orderedMembers(candidate).forEach((member) => {
      const row = document.createElement('tr');
      const geometry = member.fabricationGeometry;
      row.innerHTML = `<td><span class="rank-badge" title="${member.assemblyGroup}">${member.assemblyOrder}</span></td><td>${member.id}</td><td>${member.role}</td><td>${member.profile.manufacturerReference}</td><td>${geometry.webDepthMm} × ${geometry.flange1Mm}/${geometry.flange2Mm} mm</td><td>${member.lengthMm.toFixed(1)} mm</td><td>${geometry.nominalThicknessMm.toFixed(1)} mm</td><td>${geometry.developedAreaApproxM2.toFixed(4)} m²</td><td>${member.massKg.toFixed(3)} kg</td><td>${member.qrPayload}</td>`;
      body.appendChild(row);
    });
    text('manufacturing-count', `${candidate.members.length} pièces · ordre 1–${candidate.members.length}`);
  }

  function evidenceRow(label, value) { return `<div><strong>${label}</strong><span>${value}</span></div>`; }

  function renderEngineering(result, candidate) {
    const material = result.rules.material;
    document.getElementById('material-evidence').innerHTML = `<div class="evidence-list">${[
      evidenceRow('Référence', material.id), evidenceRow('Statut', material.status),
      evidenceRow('Masse volumique', `${material.densityKgM3} kg/m³`),
      evidenceRow('Limite élastique mini', `${material.minimumYieldStrengthNmm2} N/mm²`),
      evidenceRow('Revêtement', material.coating), evidenceRow('Usage', 'Produit public de référence, non confirmé Avelis')
    ].join('')}</div>`;

    const budget = result.rules.budgetPrice;
    document.getElementById('budget-evidence').innerHTML = `<div class="evidence-list">${[
      evidenceRow('Origine', budget.origin === 'USER_OVERRIDE' ? 'Scénario saisi' : 'Estimation Hauts-de-France'),
      evidenceRow('Prix central', `${budget.valueEurPerKgExVat.toFixed(2)} €/kg HT`),
      evidenceRow('Fourchette', `${budget.lowerReferenceEurPerKgExVat.toFixed(2)}–${budget.upperReferenceEurPerKgExVat.toFixed(2)} €/kg HT`),
      evidenceRow('Date', budget.priceDate || 'non renseignée'), evidenceRow('Périmètre', budget.boundary)
    ].join('')}</div>`;

    const profileIds = Array.from(new Set(candidate.members.map((member) => member.profile.id)));
    const checks = profileIds.map((id) => core.engineering.densityCrossCheck(core.engineering.getProfile(id)));
    document.getElementById('cross-validation-evidence').innerHTML = `<div class="evidence-list">${[
      evidenceRow('BOM / pièces', candidate.crossValidation.massReconciliation.status),
      ...checks.map((check) => evidenceRow(check.profileId, `écart ${check.relativeDifferencePercent.toFixed(2)} % vs approximation densité`)),
      evidenceRow('Entrée', result.ifcAudit
        ? `IFC · ${result.ifcAudit.entityCount} entités · ${result.ifcAudit.wallCount} mur(s)`
        : result.stepAudit
          ? `STEP · ${result.stepAudit.meshCount} maillage(s) · ${result.stepAudit.vertexCount} sommets`
          : 'Mode manuel')
    ].join('')}</div>`;

    const unresolved = document.getElementById('unresolved-evidence');
    unresolved.innerHTML = '';
    core.ENGINEERING_DATA.unresolvedAvelisInputs.forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'unresolved-item';
      item.innerHTML = `<strong>${entry.id}</strong><span>${entry.description}</span>`;
      unresolved.appendChild(item);
    });

    const sourceList = document.getElementById('source-evidence');
    sourceList.innerHTML = '';
    Object.entries(core.ENGINEERING_DATA.sources).forEach(([id, source]) => {
      const item = document.createElement('div');
      item.className = 'source-item';
      const link = source.url ? `<a href="${source.url}" target="_blank" rel="noopener">Ouvrir</a>` : '<span>Document interne</span>';
      item.innerHTML = `<strong>${id}</strong><span>${source.title}</span>${link}`;
      sourceList.appendChild(item);
    });
  }

  function renderSelected(result, candidate) {
    text('candidate-title', `${candidate.id} · rang ${candidate.rank} · score ${candidate.score}`);
    const openingLabel = candidate.wall.openings.length ? candidate.wall.openings.map((opening) => opening.type.toLowerCase()).join(' + ') : 'sans ouverture';
    text('viewer-caption', `${openingLabel} · ${candidate.option.gridStrategyLabel} · ${candidate.layout.minimumBayMm.toFixed(0)}–${candidate.layout.maximumBayMm.toFixed(0)} mm réels · module cible ${candidate.option.studSpacingMm} mm`);
    const sourceLabels = { IFC: 'Source IFC :', STEP: 'Source STEP :', MANUAL: 'Source manuelle :' };
    const sourceScopes = {
      IFC: 'dimensions, placements et ouvertures extraits du fichier. ',
      STEP: 'enveloppe Open CASCADE et axes confirmés ; aucune ouverture sémantique déduite. ',
      MANUAL: ''
    };
    text('result-source-label', sourceLabels[result.input.sourceMode] || 'Source :');
    text('scope-warning-text', `${sourceScopes[result.input.sourceMode] || ''}Géométrie et quantités contrôlées ; calcul structurel et libération machine requis.`);
    renderMetrics(result, candidate);
    renderBom(candidate);
    renderValidation(candidate);
    renderManufacturing(candidate);
    renderEngineering(result, candidate);
  }

  function renderInvalid(result) {
    text('candidate-title', 'Configuration bloquée');
    text('viewer-caption', 'Corrigez la géométrie pour recalculer.');
    ['metric-time', 'metric-mass', 'metric-cost', 'metric-components', 'metric-length', 'metric-rules'].forEach((id) => text(id, '—'));
    text('candidate-count', '0 solution');
    text('manufacturing-count', '—');
    document.getElementById('candidate-table-body').innerHTML = '';
    document.getElementById('manufacturing-table-body').innerHTML = '';
    document.getElementById('bom-summary').innerHTML = '<div class="empty-state">Aucun fichier n’est produit.</div>';
    const errors = result.inputValidation.issues.filter((issue) => issue.severity === 'error');
    document.getElementById('validation-summary').innerHTML = errors.map((error) => `<div class="validation-row is-error"><span class="validation-icon">×</span><span><strong>${error.code}</strong><br>${error.message}</span></div>`).join('');
  }

  app.resultsView = { renderTable, renderSelected, renderInvalid };
})(window);
