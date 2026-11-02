(function initPackageBuilder(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function pretty(value) {
    return JSON.stringify(value, null, 2) + '\n';
  }

  function validationReport(result, candidate) {
    return {
      schema: 'avelis.quality.validation-report.v1',
      project: result.project.identity,
      candidateId: candidate.id,
      status: candidate.validation.valid ? 'VALID_WITHIN_POC_RULES' : 'REJECTED',
      checkedRuleCount: candidate.validation.checkedRuleCount,
      issues: candidate.validation.issues,
      dimensionalToleranceMm: result.rules.manufacturingToleranceMm,
      checksNotEvaluated: ['structural_strength', 'connections', 'bracing', 'fire', 'acoustics', 'thermal', 'moisture', 'regulatory_certification'],
      requiredNextReview: 'Validation par Avelis, le fabricant et un ingénieur structure qualifié avant usage réel.'
    };
  }

  function buildExportFiles(result, candidate, scale) {
    const selected = candidate || result.recommended;
    if (!selected) throw new Error('Aucun candidat valide à exporter.');
    const safeScale = Math.max(1, Number(scale) || result.input.prototypeScale || 15);
    const files = {
      '00_LIRE_MOI.txt': [
        'AVELIS WALL FLOW — paquet de fabrication conceptuel',
        `Projet : ${result.input.projectId} / ${result.input.wallId} / version ${result.input.version}`,
        `Candidat : ${selected.id} (rang ${selected.rank}, score ${selected.score})`,
        `Ouvertures : ${selected.wall.openings.map((opening) => opening.type).join(' + ')}`,
        `Prototype STL : échelle 1:${safeScale}`,
        '',
        'IMPORTANT : ces fichiers démontrent la continuité numérique et les contrôles implémentés.',
        'Ils ne constituent pas une certification structurelle ou réglementaire.',
        'Le format machine réel doit être confirmé avec Avelis.',
        '',
        'Le même modèle sémantique produit la géométrie, la BOM, les données machine, les interfaces et le rapport de validation.'
      ].join('\r\n'),
      '01_entree/noov_request_proposal.json': pretty(core.serialize.noovRequest(result)),
      '02_conception/recommended_design.json': pretty({ project: result.project, candidate: selected }),
      '02_conception/elevation.svg': core.svg.svgForCandidate(selected),
      '02_conception/model_3d_neutral.dxf': core.dxf.dxfForCandidate(selected),
      [`02_conception/prototype_scale_1_${safeScale}.stl`]: core.stl.stlForCandidate(selected, safeScale),
      '03_fabrication/bom.csv': core.serialize.bomCsv(selected),
      '03_fabrication/machine_members.csv': core.serialize.machineCsv(selected),
      '03_fabrication/production_handover.json': pretty(core.serialize.productionHandover(result, selected)),
      '04_qualite/validation_report.json': pretty(validationReport(result, selected)),
      '04_qualite/candidate_comparison.csv': core.serialize.comparisonCsv(result),
      '05_interfaces/noov_response_proposal.json': pretty(core.serialize.noovResponse(result, selected)),
      '05_interfaces/logistics_handover.json': pretty(core.serialize.logisticsHandover(result, selected))
    };
    return files;
  }

  function buildExportZip(result, candidate, scale) {
    return core.zip.createZip(buildExportFiles(result, candidate, scale));
  }

  core.packageBuilder = { buildExportFiles, buildExportZip, validationReport };
})(typeof globalThis !== 'undefined' ? globalThis : window);
