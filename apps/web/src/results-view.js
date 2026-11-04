(function initResultsView(global) {
  'use strict';
  const app = global.AvelisApp;
  const core = global.AvelisCore;
  const timber = (candidate) => candidate.frameMaterial === 'TIMBER';
  const escape = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fixed = (value, places) => Number.isFinite(value) ? value.toFixed(places) : '—';
  function text(id, value) { const el = document.getElementById(id); if (el) el.textContent = value; }
  function cells(values) { return values.map((value) => '<td>' + value + '</td>').join(''); }
  function evidenceRow(label, value) { return '<div><strong>' + escape(label) + '</strong><span>' + escape(value) + '</span></div>'; }

  function renderMetrics(result, candidate) {
    const m = candidate.metrics;
    text('metric-time', result.processingTimeMs + ' ms');
    text('metric-mass', timber(candidate) ? fixed(m.timberVolumeM3, 4) + ' m³' : fixed(m.materialMassKg, 2) + ' kg');
    text('metric-material-note', timber(candidate) ? 'Masse estimée ' + fixed(m.materialMassKg, 2) + ' kg · ' + result.rules.material.densityKgM3 + ' kg/m³' : 'kg · longueur × kg/m fabricant');
    text('metric-cost', fixed(m.materialCostEstimateEurExVat, 2) + ' €');
    text('metric-components', m.componentCount);
    text('metric-length', fixed(m.totalProfileLengthM, 2) + ' m');
    text('metric-rules', candidate.validation.checkedRuleCount);
    const price = m.priceBasis;
    text('metric-cost-basis', fixed(price.valueEurPerUnitExVat, 2) + (timber(candidate) ? ' €/m³ HT · ' : ' €/kg HT · ') +
      (price.status === 'USER_COST_SCENARIO' ? 'saisie équipe' : timber(candidate) ? 'hypothèse de démonstration' : 'référence régionale'));
  }

  function renderTable(result, selectedId, onSelect) {
    const body = document.getElementById('candidate-table-body');
    body.innerHTML = '';
    result.rankedCandidates.forEach((candidate) => {
      const row = document.createElement('tr');
      row.className = candidate.id === selectedId ? 'is-selected' : '';
      const quantity = timber(candidate)
        ? fixed(candidate.metrics.timberVolumeM3, 4) + ' m³<br><small>' + fixed(candidate.metrics.materialMassKg, 2) + ' kg estimés</small>'
        : fixed(candidate.metrics.materialMassKg, 2) + ' kg';
      row.innerHTML = cells([
        '<span class="rank-badge">' + candidate.rank + '</span>',
        escape(candidate.id) + (candidate.paretoOptimal ? '<span class="pareto">PARETO</span>' : ''),
        escape(timber(candidate) ? [...new Set(candidate.members.map((m)=>m.profile.id))].join(' + ') : candidate.option.studProfileId + ' + ' + candidate.option.trackProfileId),
        '<strong>' + escape(candidate.option.gridStrategyLabel) + '</strong><br><small>' + fixed(candidate.layout.minimumBayMm, 0) + '–' + fixed(candidate.layout.maximumBayMm, 0) + ' mm réels</small>',
        quantity, candidate.metrics.componentCount, candidate.metrics.uniqueLengthCount,
        fixed(candidate.metrics.materialCostEstimateEurExVat, 2) + ' €', fixed(candidate.score, 2)
      ]);
      row.addEventListener('click', () => onSelect(candidate.id));
      body.appendChild(row);
    });
    text('candidate-count', result.rankedCandidates.length + ' distinctes / ' + result.search.searchSpaceSize + ' combinaisons · ' + result.search.duplicateCandidates.length + ' doublon(s)');
  }

  function renderBom(candidate) {
    const container = document.getElementById('bom-summary');
    container.innerHTML = '';
    candidate.bom.forEach((row) => {
      const item = document.createElement('div'); item.className = 'bom-item';
      item.innerHTML = '<strong>' + row.quantity + ' × ' + escape(row.role.replace(/_/g, ' ')) + '</strong><span>' +
        escape(row.manufacturerReference) + ' · ' + row.cutLengthMm + ' mm<br>' +
        fixed(row.totalLengthM, 3) + ' m · ' + fixed(row.totalMassKg, 3) + ' kg' +
        (timber(candidate) ? ' · ' + fixed(row.totalVolumeM3, 5) + ' m³' : '') + '</span>';
      container.appendChild(item);
    });
    if (timber(candidate)) core.timberWallAssembly.bomRows(candidate).filter((r)=>r.category!=='FRAME').forEach((row)=>{
      const item=document.createElement('div'); item.className='bom-item';
      item.innerHTML='<strong>'+escape(row.label)+'</strong><span>'+escape(row.quantity)+' '+escape(({cavity_piece:'pièces de cavité',reference_panel_piece:'pièces de panneau',opening_unit:'menuiserie(s)',m2:'m²'}[row.unit]||row.unit))+' · '+fixed(row.netAreaM2,3)+' m²<br>Matériau séparé du débit bois · référence à confirmer</span>';
      container.appendChild(item);
    });
  }

  function renderValidation(candidate) {
    const container = document.getElementById('validation-summary');
    container.innerHTML = '<div class="validation-row"><span class="validation-icon">✓</span><span><strong>Géométrie et traçabilité contrôlées</strong><br>IDs, sections, longueurs, cadres, enveloppe et ouvertures.</span></div>' +
      '<div class="validation-row"><span class="validation-icon">✓</span><span>BOM ↔ composants : ' + escape(candidate.crossValidation.massReconciliation.status) +
      ' · écart ' + fixed(candidate.crossValidation.massReconciliation.absoluteDifferenceKg, 4) + ' kg</span></div>';
    candidate.validation.issues.forEach((issue) => {
      const row = document.createElement('div'); row.className = 'validation-row ' + (issue.severity === 'error' ? 'is-error' : 'is-review');
      row.innerHTML = '<span class="validation-icon">!</span><span><strong>' + escape(issue.code) + '</strong><br>' + escape(issue.message) + '</span>';
      container.appendChild(row);
    });
  }

  function renderManufacturing(candidate) {
    const body = document.getElementById('manufacturing-table-body'); body.innerHTML = '';
    core.assemblyPriority.orderedMembers(candidate).forEach((member) => {
      const geometry = member.fabricationGeometry;
      const row = document.createElement('tr');
      row.innerHTML = cells([
        '<span class="rank-badge">' + member.assemblyOrder + '</span>', escape(member.id), escape(member.role),
        escape(member.profile.manufacturerReference),
        timber(candidate) ? geometry.sectionWidthMm + ' × ' + geometry.sectionDepthMm + ' mm' : geometry.webDepthMm + ' × ' + geometry.flange1Mm + '/' + geometry.flange2Mm + ' mm',
        fixed(member.lengthMm, 1) + ' mm',
        fixed(timber(candidate) ? geometry.sectionWidthMm : geometry.nominalThicknessMm, 1) + ' mm',
        timber(candidate) ? fixed(member.volumeM3, 5) + ' m³' : fixed(geometry.developedAreaApproxM2, 4) + ' m²',
        fixed(member.massKg, 3) + ' kg', escape(member.qrPayload)
      ]);
      body.appendChild(row);
    });
    text('manufacturing-count', candidate.members.length + ' pièces · ordre 1–' + candidate.members.length);
  }

  function renderEngineering(result, candidate) {
    const material = result.rules.material;
    document.getElementById('material-evidence').innerHTML = '<div class="evidence-list">' + [
      evidenceRow('Référence', material.id), evidenceRow('Statut', material.status),
      evidenceRow('Masse volumique', material.densityKgM3 + ' kg/m³'),
      ...(timber(candidate)
        ? [evidenceRow('Classe de référence', material.strengthClass), evidenceRow('Masse', 'Estimation volume × densité moyenne ; pas une pesée')]
        : [evidenceRow('Limite élastique mini', material.minimumYieldStrengthNmm2 + ' N/mm²'), evidenceRow('Revêtement', material.coating)]),
      evidenceRow('Usage', 'Référence non confirmée par Avelis ; dimensionnement structurel requis')
    ].join('') + '</div>';
    const budget = result.rules.budgetPrice;
    const unit = timber(candidate) ? ' €/m³ HT' : ' €/kg HT';
    document.getElementById('budget-evidence').innerHTML = '<div class="evidence-list">' + [
      evidenceRow('Origine', budget.origin === 'USER_OVERRIDE' ? 'Scénario saisi' : timber(candidate) ? 'Hypothèse de démonstration' : 'Estimation Hauts-de-France'),
      evidenceRow('Prix central', fixed(budget.valueEurPerUnitExVat, 2) + unit),
      evidenceRow('Fourchette', fixed(budget.lowerReferenceEurPerUnitExVat, 2) + '–' + fixed(budget.upperReferenceEurPerUnitExVat, 2) + unit),
      evidenceRow('Date', budget.priceDate || 'non renseignée'), evidenceRow('Périmètre', budget.boundary), evidenceRow('Limite', budget.limitation)
    ].join('') + '</div>';
    const checks = [...new Set(candidate.members.map((m) => m.profile.id))].map((id) => core.engineering.densityCrossCheck(core.engineering.getProfile(id)));
    document.getElementById('cross-validation-evidence').innerHTML = '<div class="evidence-list">' + [
      evidenceRow('BOM / pièces', candidate.crossValidation.massReconciliation.status),
      ...checks.map((check) => evidenceRow(check.profileId, timber(candidate) ? 'Cohérence section × longueur × densité ; pas de mesure indépendante' : 'Écart ' + fixed(check.relativeDifferencePercent, 2) + ' % vs approximation densité')),
      evidenceRow('Entrée', result.ifcAudit ? 'IFC · ' + result.ifcAudit.wallCount + ' mur(s)' : result.stepAudit ? 'STEP · ' + result.stepAudit.meshCount + ' maillage(s)' : 'Mode manuel')
    ].join('') + '</div>';
    document.getElementById('unresolved-evidence').innerHTML = core.ENGINEERING_DATA.unresolvedAvelisInputs.map((entry) => '<div class="unresolved-item"><strong>' + escape(entry.id) + '</strong><span>' + escape(entry.description) + '</span></div>').join('');
    document.getElementById('source-evidence').innerHTML = Object.entries(core.ENGINEERING_DATA.sources).map(([id, source]) => '<div class="source-item"><strong>' + escape(id) + '</strong><span>' + escape(source.title) + '</span>' +
      (source.url ? '<a href="' + escape(source.url) + '" target="_blank" rel="noopener">Ouvrir</a>' : '<span>Hypothèse documentée</span>') + '</div>').join('');
  }

  function renderSelected(result, candidate) {
    text('candidate-title', (timber(candidate) ? 'Bois C24' : 'Acier') + ' · ' + candidate.id + ' · rang ' + candidate.rank + ' · score ' + candidate.score);
    const openings = candidate.wall.openings.map((o) => o.type.toLowerCase()).join(' + ') || 'sans ouverture';
    text('viewer-caption', openings + ' · ' + candidate.option.gridStrategyLabel + ' · module cible ' + candidate.option.studSpacingMm + ' mm');
    text('result-source-label', 'Source ' + result.input.sourceMode + ' :');
    text('scope-warning-text', (timber(candidate) ? 'Bois C24, sections et linteaux conceptuels. ' : '') + 'Géométrie et quantités contrôlées ; calcul structurel et libération machine requis.');
    if(candidate.reference) text('scope-warning-text',candidate.reference.message+' Les cotes de baie sont des valeurs de travail. Fonction des pièces basses à confirmer.');
    renderMetrics(result, candidate); renderBom(candidate); renderValidation(candidate); renderManufacturing(candidate); renderEngineering(result, candidate);
  }

  function renderInvalid(result) {
    text('candidate-title', 'Configuration bloquée'); text('viewer-caption', 'Corrigez la géométrie pour recalculer.');
    ['metric-time', 'metric-mass', 'metric-cost', 'metric-components', 'metric-length', 'metric-rules'].forEach((id) => text(id, '—'));
    text('candidate-count', '0 solution'); text('manufacturing-count', '—');
    ['candidate-table-body', 'manufacturing-table-body', 'bom-summary', 'material-evidence', 'budget-evidence', 'cross-validation-evidence'].forEach((id) => { document.getElementById(id).innerHTML = ''; });
    const errors = [...result.inputValidation.issues, ...result.search.rejectedCandidates.flatMap((c) => c.validation.issues)].filter((i) => i.severity === 'error');
    document.getElementById('validation-summary').innerHTML = errors.map((error) => '<div class="validation-row is-error"><span class="validation-icon">×</span><span><strong>' + escape(error.code) + '</strong><br>' + escape(error.message) + '</span></div>').join('');
  }
  app.resultsView = { renderTable, renderSelected, renderInvalid };
})(window);
