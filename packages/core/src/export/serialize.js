(function initSerializers(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function csvCell(value) {
    const text = value == null ? '' : String(value);
    return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function toCsv(rows, columns, delimiter) {
    const separator = delimiter || ';';
    const header = columns.map((column) => csvCell(column.label || column.key)).join(separator);
    const body = rows.map((row) => columns.map((column) => csvCell(column.get ? column.get(row) : row[column.key])).join(separator));
    return [header, ...body].join('\r\n') + '\r\n';
  }

  function bomCsv(candidate) {
    return toCsv(candidate.bom, [
      { key: 'role' }, { key: 'profileId', label: 'profile_id' }, { key: 'manufacturerReference', label: 'manufacturer_reference' },
      { key: 'materialId', label: 'material_id' }, { key: 'cutLengthMm', label: 'cut_length_mm' },
      { key: 'massKgPerM', label: 'manufacturer_mass_kg_per_m' }, { key: 'quantity' },
      { key: 'totalLengthM', label: 'total_length_m' }, { key: 'totalMassKg', label: 'total_mass_kg' },
      { label: 'component_ids', get: (row) => row.componentIds.join('|') }
    ]);
  }

  function cuttingListCsv(candidate) {
    return toCsv(candidate.members, [
      { key: 'id', label: 'component_id' }, { key: 'role' }, { key: 'label' }, { key: 'openingId', label: 'opening_id' },
      { label: 'profile_id', get: (row) => row.profile.id },
      { label: 'manufacturer_reference', get: (row) => row.profile.manufacturerReference },
      { key: 'lengthMm', label: 'cut_length_mm' }, { key: 'massKg', label: 'calculated_mass_kg' },
      { label: 'mass_kg_per_m', get: (row) => row.profile.massKgPerM },
      { label: 'operations', get: (row) => row.operations.join('|') },
      { key: 'toleranceMm', label: 'tolerance_mm_pending_avelis' },
      { key: 'manufacturingRelease', label: 'manufacturing_release' }
    ]);
  }

  function machineCsv(candidate) {
    return toCsv(candidate.members, [
      { key: 'id', label: 'component_id' }, { key: 'role' },
      { label: 'profile', get: (row) => row.profile.manufacturerReference }, { key: 'lengthMm', label: 'cut_length_mm' },
      { key: 'axis' }, { label: 'x_mm', get: (row) => row.position.xMm },
      { label: 'y_mm', get: (row) => row.position.yMm }, { label: 'z_mm', get: (row) => row.position.zMm },
      { key: 'qrPayload', label: 'qr_payload' }, { key: 'manufacturingRelease', label: 'release_status' }
    ]);
  }

  function labelsCsv(candidate) {
    return toCsv(candidate.members, [
      { key: 'id', label: 'component_id' }, { key: 'role' },
      { label: 'profile', get: (row) => row.profile.manufacturerReference },
      { key: 'lengthMm', label: 'length_mm' }, { key: 'qrPayload', label: 'qr_payload' }
    ]);
  }

  function comparisonCsv(result) {
    return toCsv(result.rankedCandidates, [
      { key: 'rank' }, { key: 'id', label: 'candidate_id' },
      { label: 'profile_set', get: (row) => row.option.profileSetId },
      { label: 'grid_strategy', get: (row) => row.option.gridStrategy },
      { label: 'grid_strategy_label', get: (row) => row.option.gridStrategyLabel },
      { label: 'stud_spacing_mm', get: (row) => row.option.studSpacingMm },
      { label: 'minimum_actual_bay_mm', get: (row) => row.layout.minimumBayMm },
      { label: 'maximum_actual_bay_mm', get: (row) => row.layout.maximumBayMm },
      { label: 'steel_mass_kg', get: (row) => row.metrics.steelMassKg },
      { label: 'component_count', get: (row) => row.metrics.componentCount },
      { label: 'unique_length_count', get: (row) => row.metrics.uniqueLengthCount },
      { label: 'material_cost_eur_ex_vat', get: (row) => row.metrics.materialCostEstimateEurExVat },
      { key: 'score', label: 'decision_score_lower_is_better' }, { key: 'paretoOptimal', label: 'pareto_optimal' },
      { label: 'engineering_status', get: (row) => row.validation.engineeringStatus }
    ]);
  }

  function noovRequest(result) {
    return {
      schema: 'avelis.noov.wall-configuration.request.v2',
      status: 'INTERFACE_PROPOSAL_NOT_OFFICIAL_NOOV_FORMAT',
      project: result.project.identity,
      source: result.project.source,
      geometry: {
        wallLengthMm: result.input.wallLengthMm,
        wallHeightMm: result.input.wallHeightMm,
        wallThicknessMm: result.input.wallThicknessMm,
        placement: result.input.placement,
        openings: result.input.openings
      },
      objective: result.input.priority,
      requestedOutputs: ['STEEL_PANEL_MODEL', 'BOM', 'CUTTING_LIST', 'MANUFACTURING_NEUTRAL_DATA', 'FABLAB_STL', 'VALIDATION_REPORT']
    };
  }

  function noovResponse(result, candidate) {
    return {
      schema: 'avelis.noov.wall-design.response.v2',
      status: 'ENGINEERING_REVIEW_REQUIRED',
      project: result.project.identity,
      selectedCandidate: candidate.id,
      decisionScore: candidate.score,
      openings: candidate.wall.openings,
      metrics: candidate.metrics,
      components: candidate.members.map((member) => ({
        id: member.id, role: member.role, profile: member.profile.manufacturerReference,
        lengthMm: member.lengthMm, massKg: member.massKg, position: member.position,
        axis: member.axis, openingId: member.openingId, qrPayload: member.qrPayload
      })),
      validation: candidate.validation,
      limitations: [result.rules.engineeringDisclaimer, result.rules.avelisDisclaimer]
    };
  }

  function manufacturingHandover(result, candidate) {
    const sequenceDefinitions = [
      { stepId: 'STEP-01', order: 1, operation: 'SET_BOTTOM_TRACK_SEGMENTS', roles: ['bottom_track'], dependsOn: [] },
      { stepId: 'STEP-02', order: 2, operation: 'SET_BOUNDARY_AND_OPENING_JAMBS', roles: ['boundary_stud', 'opening_jamb'], dependsOn: ['STEP-01'] },
      { stepId: 'STEP-03', order: 3, operation: 'SET_COMMON_AND_CRIPPLE_STUDS', roles: ['common_stud', 'cripple_stud'], dependsOn: ['STEP-01'] },
      { stepId: 'STEP-04', order: 4, operation: 'SET_OPENING_HORIZONTAL_MEMBERS', roles: ['window_sill', 'opening_header'], dependsOn: ['STEP-02', 'STEP-03'] },
      { stepId: 'STEP-05', order: 5, operation: 'SET_TOP_TRACK', roles: ['top_track'], dependsOn: ['STEP-02', 'STEP-03', 'STEP-04'] },
      { stepId: 'STEP-06', order: 6, operation: 'DIMENSIONAL_AND_ID_CONTROL', roles: [], dependsOn: ['STEP-05'] }
    ];
    const components = candidate.members.map((member) => ({
      partId: member.id,
      partType: member.role,
      materialId: result.rules.material.id,
      profileId: member.profile.id,
      manufacturerReference: member.profile.manufacturerReference,
      dimensionsMm: {
        length: member.lengthMm,
        sectionDepth: member.profile.webDepthMm,
        nominalThickness: member.profile.nominalThicknessMm
      },
      calculatedMassKg: member.massKg,
      positionMm: { x: member.position.xMm, y: member.position.yMm, z: member.position.zMm },
      axis: member.axis,
      operations: member.operations,
      toleranceMm: null,
      qrPayload: member.qrPayload
    }));
    const assemblySequence = sequenceDefinitions.map((step) => ({
      stepId: step.stepId,
      order: step.order,
      operation: step.operation,
      partIds: step.roles.length ? components.filter((component) => step.roles.includes(component.partType)).map((component) => component.partId) : components.map((component) => component.partId),
      dependsOn: step.dependsOn,
      status: 'PROPOSED_PENDING_BLOC2_VALIDATION'
    }));
    return {
      schema: 'avelis.production.wall-handover.v2',
      schemaVersion: '2.0',
      releaseStatus: 'BLOCKED_PENDING_AVELIS_CAPABILITY_CONFIRMATION',
      project: result.project.identity,
      configurationId: `${result.input.projectId}-${result.input.wallId}`,
      revision: result.input.version,
      units: { length: 'mm', mass: 'kg' },
      candidateId: candidate.id,
      material: result.rules.material,
      profiles: Array.from(new Set(candidate.members.map((member) => member.profile.id))).map((id) => core.engineering.getProfile(id)),
      components,
      toleranceMm: null,
      stockLengthMm: null,
      neutralFormats: ['CSV', 'JSON', 'DXF_ENVELOPE', 'STL_FABLAB'],
      assemblySequence,
      interfaceChecks: {
        componentIdsUnique: new Set(components.map((component) => component.partId)).size === components.length,
        allSequencePartIdsExist: assemblySequence.every((step) => step.partIds.every((id) => components.some((component) => component.partId === id))),
        bomMassMatchesGeometry: candidate.crossValidation.massReconciliation.status === 'MATCH'
      },
      requiredFromAvelisOrBloc2: [
        'machine_identifier', 'supported_profile_catalog', 'stock_lengths_mm', 'supported_operations',
        'hole_and_fastener_rules', 'positioning_accuracy_mm', 'manufacturing_tolerances_mm', 'native_machine_file_schema'
      ]
    };
  }

  function logisticsHandover(result, candidate) {
    return {
      schema: 'avelis.logistics.wall-handover.v2',
      project: result.project.identity,
      candidateId: candidate.id,
      componentIds: candidate.members.map((member) => member.id),
      calculatedSteelMassKg: candidate.metrics.steelMassKg,
      panelEnvelopeMm: { length: candidate.wall.lengthMm, height: candidate.wall.heightMm, depth: candidate.wall.displayDepthMm },
      traceability: { unit: 'STABLE_COMPONENT_ID', qrPayloadField: 'qrPayload', version: result.input.version },
      requiredFromLogistics: ['transport_envelope_mm', 'package_mass_limit_kg', 'storage_orientation', 'delivery_sequence', 'damage_feedback_schema']
    };
  }

  core.serialize = {
    toCsv, bomCsv, cuttingListCsv, machineCsv, labelsCsv, comparisonCsv,
    noovRequest, noovResponse, manufacturingHandover, logisticsHandover
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
