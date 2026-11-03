(function initPackageBuilder(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function pretty(value) { return JSON.stringify(value, null, 2) + '\n'; }

  function validationReport(result, candidate) {
    return {
      schema: 'avelis.quality.validation-report.v2',
      project: result.project.identity,
      candidateId: candidate.id,
      geometryStatus: candidate.validation.geometryValid ? 'GEOMETRY_CHECKS_PASSED' : 'REJECTED',
      engineeringStatus: 'ENGINEERING_REVIEW_REQUIRED',
      manufacturingRelease: false,
      checkedRuleCount: candidate.validation.checkedRuleCount,
      issues: candidate.validation.issues,
      crossValidation: candidate.crossValidation,
      profileDensityCrossChecks: Array.from(new Set(candidate.members.map((member) => member.profile.id)))
        .map((profileId) => core.engineering.densityCrossCheck(core.engineering.getProfile(profileId))),
      checksNotEvaluated: [
        'structural_strength', 'stability_and_bracing', 'connections', 'fire', 'acoustics', 'thermal',
        'durability', 'project_regulatory_compliance', 'machine_compatibility', 'manufacturing_tolerances'
      ],
      requiredNextReview: 'Avelis, the selected manufacturer and a qualified structural engineer must approve project data before production or construction.'
    };
  }

  function buildExportFiles(result, candidate, scale) {
    const selected = candidate || result.recommended;
    if (!selected) throw new Error('No geometry-valid candidate is available for export.');
    const safeScale = Math.max(1, Number(scale) || result.input.prototypeScale || 20);
    const files = {
      '00_READ_ME.txt': [
        'AVELIS WALL FLOW 2.1 — IFC-to-manufacturing reference package',
        `Project: ${result.input.projectId} / ${result.input.wallId} / version ${result.input.version}`,
        `Candidate: ${selected.id} (rank ${selected.rank}, decision score ${selected.score})`,
        `Steel mass: ${selected.metrics.steelMassKg} kg`,
        `Budget material cost: ${selected.metrics.materialCostEstimateEurExVat} EUR ex VAT`,
        `Engineering status: ${selected.validation.engineeringStatus}`,
        '',
        'IMPORTANT: geometry checks and traceable quantity calculations are automated.',
        'This package is NOT a structural certificate and is NOT released to an Avelis machine.',
        'Profiles and prices are public reference inputs, not confirmed Avelis products or procurement data.',
        'STEP/DXF/STL geometry is a profile envelope for coordination and FabLab prototyping, not detailed sheet-metal production geometry.'
      ].join('\r\n'),
      '01_input/noov_request_proposal.json': pretty(core.serialize.noovRequest(result)),
      '01_input/source_context.json': pretty({ source: result.project.source, ifcAudit: result.ifcAudit || null, stepAudit: result.stepAudit || null }),
      '02_design/recommended_design.json': pretty({ project: result.project, candidate: selected }),
      '02_design/elevation.svg': core.svg.svgForCandidate(selected),
      '02_design/model_3d_profile_envelopes.step': core.stepExport.stepForCandidate(selected, {
        fileName: `${result.input.wallId}_${selected.id}_profile_envelopes.step`
      }),
      '02_design/model_3d_profile_envelopes.dxf': core.dxf.dxfForCandidate(selected),
      [`02_design/fablab/assembly_scale_1_${safeScale}.stl`]: core.stl.stlForCandidate(selected, safeScale),
      '03_manufacturing/bom.csv': core.serialize.bomCsv(selected),
      '03_manufacturing/cutting_list.csv': core.serialize.cuttingListCsv(selected),
      '03_manufacturing/machine_neutral_members.csv': core.serialize.machineCsv(selected),
      '03_manufacturing/component_labels.csv': core.serialize.labelsCsv(selected),
      '03_manufacturing/manufacturing_handover.json': pretty(core.serialize.manufacturingHandover(result, selected)),
      '04_quality/validation_report.json': pretty(validationReport(result, selected)),
      '04_quality/candidate_comparison.csv': core.serialize.comparisonCsv(result),
      '04_quality/engineering_data_snapshot.json': pretty(core.ENGINEERING_DATA),
      '05_interfaces/noov_response_proposal.json': pretty(core.serialize.noovResponse(result, selected)),
      '05_interfaces/logistics_handover.json': pretty(core.serialize.logisticsHandover(result, selected)),
      '05_interfaces/Bloc1_Bloc2_Interface_Schema.md': core.BLOC1_BLOC2_INTERFACE_MD
    };
    selected.members.forEach((member) => {
      files[`02_design/fablab/parts/${member.id}_scale_1_${safeScale}.stl`] = core.stl.stlForMember(member, safeScale);
    });
    return files;
  }

  function buildExportZip(result, candidate, scale) {
    return core.zip.createZip(buildExportFiles(result, candidate, scale));
  }

  core.packageBuilder = { buildExportFiles, buildExportZip, validationReport };
})(typeof globalThis !== 'undefined' ? globalThis : window);
