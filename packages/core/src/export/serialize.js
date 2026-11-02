(function initSerializers(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function csvCell(value) {
    const text = value == null ? '' : String(value);
    return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function toCsv(rows, columns, delimiter) {
    const sep = delimiter || ';';
    const header = columns.map((column) => csvCell(column.label || column.key)).join(sep);
    const body = rows.map((row) => columns.map((column) => csvCell(column.get ? column.get(row) : row[column.key])).join(sep));
    return [header, ...body].join('\r\n') + '\r\n';
  }

  function bomCsv(candidate) {
    return toCsv(candidate.bom, [
      { key: 'role', label: 'role' },
      { key: 'materialCode', label: 'material_code' },
      { key: 'sectionWidthMm', label: 'section_width_mm' },
      { key: 'sectionDepthMm', label: 'section_depth_mm' },
      { key: 'cutLengthMm', label: 'cut_length_mm' },
      { key: 'quantity', label: 'quantity' },
      { label: 'component_ids', get: (row) => row.componentIds.join('|') }
    ]);
  }

  function machineCsv(candidate) {
    return toCsv(candidate.members, [
      { key: 'id', label: 'component_id' },
      { key: 'role', label: 'role' },
      { key: 'label', label: 'label' },
      { key: 'openingId', label: 'opening_id' },
      { key: 'materialCode', label: 'material_code' },
      { label: 'width_mm', get: (row) => row.section.widthMm },
      { label: 'depth_mm', get: (row) => row.section.depthMm },
      { key: 'lengthMm', label: 'cut_length_mm' },
      { key: 'axis', label: 'axis' },
      { label: 'x_mm', get: (row) => row.position.xMm },
      { label: 'y_mm', get: (row) => row.position.yMm },
      { label: 'z_mm', get: (row) => row.position.zMm },
      { label: 'operations', get: (row) => row.operations.join('|') },
      { key: 'toleranceMm', label: 'tolerance_mm' }
    ]);
  }

  function comparisonCsv(result) {
    return toCsv(result.rankedCandidates, [
      { key: 'rank', label: 'rank' },
      { key: 'id', label: 'candidate_id' },
      { label: 'stud_spacing_mm', get: (row) => row.option.studSpacingMm },
      { label: 'grid_offset_mm', get: (row) => row.option.gridOffsetMm },
      { label: 'header_layers', get: (row) => row.option.headerLayers },
      { label: 'timber_volume_m3', get: (row) => row.metrics.timberVolumeM3 },
      { label: 'component_count', get: (row) => row.metrics.componentCount },
      { label: 'complexity_index', get: (row) => row.metrics.manufacturingComplexity },
      { label: 'estimated_cost_eur', get: (row) => row.metrics.estimatedCostEur },
      { label: 'estimated_machine_time_min', get: (row) => row.metrics.estimatedMachineTimeMin },
      { key: 'score', label: 'weighted_score_lower_is_better' },
      { key: 'paretoOptimal', label: 'pareto_optimal' }
    ]);
  }

  function noovRequest(result) {
    const input = result.input;
    const openings = core.project.createOpenings(input).map((opening) => ({
      type: opening.type,
      id: opening.id,
      xMm: opening.xMm,
      sillMm: opening.sillMm,
      widthMm: opening.widthMm,
      heightMm: opening.heightMm
    }));
    return {
      schema: 'avelis.noov.wall-configuration.request.v1',
      status: 'INTERFACE_PROPOSAL_NOT_OFFICIAL_NOOV_FORMAT',
      project: { projectId: input.projectId, typology: input.typology, wallId: input.wallId, version: input.version },
      geometry: {
        wallLengthMm: input.wallLengthMm,
        wallHeightMm: input.wallHeightMm,
        openings
      },
      objective: input.priority,
      requestedOutputs: ['PARAMETRIC_MODEL', 'BOM', 'MACHINE_NEUTRAL_DATA', 'STL_PROTOTYPE', 'VALIDATION_REPORT']
    };
  }

  function noovResponse(result, candidate) {
    return {
      schema: 'avelis.noov.wall-design.response.v1',
      status: 'ENGINEERING_REVIEW_REQUIRED',
      project: result.project.identity,
      selectedCandidate: candidate.id,
      score: candidate.score,
      openings: candidate.wall.openings,
      metrics: candidate.metrics,
      components: candidate.members.map((member) => ({
        id: member.id,
        role: member.role,
        materialCode: member.materialCode,
        section: member.section,
        lengthMm: member.lengthMm,
        position: member.position,
        axis: member.axis,
        openingId: member.openingId
      })),
      validation: candidate.validation,
      disclaimer: result.rules.engineeringDisclaimer
    };
  }

  function productionHandover(result, candidate) {
    return {
      schema: 'avelis.production.wall-handover.v1',
      project: result.project.identity,
      candidateId: candidate.id,
      toleranceMm: result.rules.manufacturingToleranceMm,
      assemblySequence: [
        { step: 1, operation: 'POSITION_BOTTOM_PLATE', componentRoles: ['bottom_plate'] },
        { step: 2, operation: 'POSITION_BOUNDARY_AND_OPENING_STUDS', componentRoles: ['boundary_stud', 'king_stud', 'jack_stud'] },
        { step: 3, operation: 'POSITION_COMMON_AND_CRIPPLE_STUDS', componentRoles: ['common_stud', 'cripple_stud'] },
        { step: 4, operation: 'POSITION_OPENING_HORIZONTAL_FRAMING', componentRoles: ['sill', 'header'] },
        { step: 5, operation: 'POSITION_TOP_PLATES', componentRoles: ['top_plate'] },
        { step: 6, operation: 'QUALITY_CONTROL', checks: ['ID', 'DIMENSIONS', 'OPENING_CLEAR', 'SQUARING'] }
      ],
      machineData: { format: 'CSV_DXF_NEUTRAL', memberCount: candidate.members.length },
      cellsMustReturn: ['max_member_length_mm', 'supported_operations', 'positioning_accuracy_mm', 'rejected_component_ids', 'defect_codes']
    };
  }

  function logisticsHandover(result, candidate) {
    return {
      schema: 'avelis.logistics.wall-handover.v1',
      project: result.project.identity,
      candidateId: candidate.id,
      componentIds: candidate.members.map((member) => member.id),
      packageEnvelopeMm: { length: candidate.wall.lengthMm, height: candidate.wall.heightMm, depth: candidate.wall.depthMm },
      productionOrder: candidate.rank,
      traceability: { unit: 'COMPONENT_ID', version: result.input.version, status: 'DESIGN_VALIDATED_WITHIN_POC_RULES' },
      logisticsMustReturn: ['max_transport_envelope_mm', 'storage_orientation', 'delivery_sequence', 'defect_feedback']
    };
  }

  core.serialize = { toCsv, bomCsv, machineCsv, comparisonCsv, noovRequest, noovResponse, productionHandover, logisticsHandover };
})(typeof globalThis !== 'undefined' ? globalThis : window);
