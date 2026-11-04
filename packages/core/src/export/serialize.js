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

  function dimensionsForMember(member) {
    if (member.material.frameMaterial === 'TIMBER') return {
      length: member.lengthMm, sectionWidth: member.profile.sectionWidthMm, sectionDepth: member.profile.sectionDepthMm
    };
    return {
      length: member.lengthMm, sectionDepth: member.profile.webDepthMm,
      flange1: member.profile.flange1Mm, flange2: member.profile.flange2Mm,
      lip: member.profile.lipMm || 0, nominalThickness: member.profile.nominalThicknessMm,
      developedWidthApprox: member.fabricationGeometry.developedWidthApproxMm
    };
  }

  function timberColumns() {
    return [
      { label: 'section_width_mm', get: (row) => row.profile.sectionWidthMm },
      { label: 'section_depth_mm', get: (row) => row.profile.sectionDepthMm },
      { label: 'timber_volume_m3', get: (row) => row.volumeM3 },
      { label: 'reference_density_kg_m3', get: (row) => row.material.densityKgM3 }
    ];
  }

  function bomCsv(candidate) {
    return toCsv(candidate.bom, [
      { key: 'role' }, { key: 'profileId', label: 'profile_id' }, { key: 'manufacturerReference', label: 'manufacturer_reference' },
      { key: 'materialId', label: 'material_id' }, { key: 'cutLengthMm', label: 'cut_length_mm' },
      { key: 'massKgPerM', label: candidate.frameMaterial === 'TIMBER' ? 'estimated_mass_kg_per_m' : 'manufacturer_mass_kg_per_m' }, { key: 'quantity' },
      { key: 'totalLengthM', label: 'total_length_m' }, { key: 'totalMassKg', label: 'total_mass_kg' },
      ...(candidate.frameMaterial === 'TIMBER' ? [{ key: 'sectionWidthMm', label: 'section_width_mm' }, { key: 'sectionDepthMm', label: 'section_depth_mm' }, { key: 'totalVolumeM3', label: 'timber_volume_m3' }] : []),
      { label: 'component_ids', get: (row) => row.componentIds.join('|') }
    ]);
  }

  function cuttingListCsv(candidate) {
    return toCsv(core.assemblyPriority.orderedMembers(candidate), [
      { key: 'assemblyOrder', label: 'assembly_order' },
      { key: 'assemblyGroup', label: 'assembly_priority_group' },
      { key: 'id', label: 'component_id' }, { key: 'role' }, { key: 'label' }, { key: 'openingId', label: 'opening_id' },
      { label: 'profile_id', get: (row) => row.profile.id },
      { label: 'manufacturer_reference', get: (row) => row.profile.manufacturerReference },
      { key: 'lengthMm', label: 'cut_length_mm' },
      ...(candidate.frameMaterial === 'TIMBER' ? timberColumns() : [
      { label: 'web_depth_mm', get: (row) => row.fabricationGeometry.webDepthMm },
      { label: 'flange_1_mm', get: (row) => row.fabricationGeometry.flange1Mm },
      { label: 'flange_2_mm', get: (row) => row.fabricationGeometry.flange2Mm },
      { label: 'lip_mm', get: (row) => row.fabricationGeometry.lipMm },
      { label: 'nominal_thickness_mm', get: (row) => row.fabricationGeometry.nominalThicknessMm },
      { label: 'developed_width_approx_mm', get: (row) => row.fabricationGeometry.developedWidthApproxMm },
      { label: 'developed_area_approx_m2', get: (row) => row.fabricationGeometry.developedAreaApproxM2 }
      ]),
      { key: 'massKg', label: 'calculated_mass_kg' },
      { label: 'mass_kg_per_m', get: (row) => row.profile.massKgPerM },
      { label: 'operations', get: (row) => row.operations.join('|') },
      { key: 'toleranceMm', label: 'tolerance_mm_pending_avelis' },
      { key: 'manufacturingRelease', label: 'manufacturing_release' }
    ]);
  }

  function machineCsv(candidate) {
    return toCsv(core.assemblyPriority.orderedMembers(candidate), [
      { key: 'assemblyOrder', label: 'assembly_order' },
      { key: 'id', label: 'component_id' }, { key: 'role' },
      { label: 'profile', get: (row) => row.profile.manufacturerReference }, { key: 'lengthMm', label: 'cut_length_mm' },
      ...(candidate.frameMaterial === 'TIMBER' ? timberColumns() : [
      { label: 'nominal_thickness_mm', get: (row) => row.fabricationGeometry.nominalThicknessMm },
      { label: 'developed_area_approx_m2', get: (row) => row.fabricationGeometry.developedAreaApproxM2 }
      ]),
      { key: 'axis' }, { label: 'x_mm', get: (row) => row.position.xMm },
      { label: 'y_mm', get: (row) => row.position.yMm }, { label: 'z_mm', get: (row) => row.position.zMm },
      { key: 'qrPayload', label: 'qr_payload' }, { key: 'manufacturingRelease', label: 'release_status' }
    ]);
  }

  function labelsCsv(candidate) {
    return toCsv(core.assemblyPriority.orderedMembers(candidate), [
      { key: 'assemblyOrder', label: 'assembly_order' },
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
      { label: 'frame_material', get: (row) => row.frameMaterial },
      { label: result.input.frameMaterial === 'TIMBER' ? 'estimated_mass_kg' : 'steel_mass_kg', get: (row) => row.metrics.materialMassKg },
      { label: 'timber_volume_m3', get: (row) => row.metrics.timberVolumeM3 },
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
      frameMaterial: result.input.frameMaterial,
      source: result.project.source,
      geometry: {
        wallLengthMm: result.input.wallLengthMm,
        wallHeightMm: result.input.wallHeightMm,
        wallThicknessMm: result.input.wallThicknessMm,
        placement: result.input.placement,
        openings: result.input.openings
      },
      objective: result.input.priority,
      requestedOutputs: [result.input.frameMaterial === 'TIMBER' ? 'TIMBER_FRAME_MODEL' : 'STEEL_PANEL_MODEL', 'BOM', 'CUTTING_LIST', 'MANUFACTURING_NEUTRAL_DATA', 'FABLAB_STL', 'VALIDATION_REPORT']
    };
  }

  function noovResponse(result, candidate) {
    return {
      schema: 'avelis.noov.wall-design.response.v2',
      status: 'ENGINEERING_REVIEW_REQUIRED',
      project: result.project.identity,
      frameMaterial: result.input.frameMaterial,
      selectedCandidate: candidate.id,
      decisionScore: candidate.score,
      openings: candidate.wall.openings,
      metrics: candidate.metrics,
      components: core.assemblyPriority.orderedMembers(candidate).map((member) => ({
        id: member.id, role: member.role, profile: member.profile.manufacturerReference,
        assemblyOrder: member.assemblyOrder,
        assemblyGroup: member.assemblyGroup,
        lengthMm: member.lengthMm,
        sectionMm: candidate.frameMaterial === 'TIMBER' ? dimensionsForMember(member) : {
          webDepth: member.fabricationGeometry.webDepthMm, flange1: member.fabricationGeometry.flange1Mm,
          flange2: member.fabricationGeometry.flange2Mm, lip: member.fabricationGeometry.lipMm,
          nominalThickness: member.fabricationGeometry.nominalThicknessMm
        },
        ...(candidate.frameMaterial === 'TIMBER' ? { timberVolumeM3: member.volumeM3 } : { developedAreaApproxM2: member.fabricationGeometry.developedAreaApproxM2 }),
        massKg: member.massKg, position: member.position,
        axis: member.axis, openingId: member.openingId, qrPayload: member.qrPayload
      })),
      validation: candidate.validation,
      limitations: [result.rules.engineeringDisclaimer, result.rules.avelisDisclaimer]
    };
  }

  function manufacturingHandover(result, candidate) {
    const orderedMembers = core.assemblyPriority.orderedMembers(candidate);
    const priorityValidation = core.assemblyPriority.validate(candidate);
    const components = orderedMembers.map((member) => ({
      partId: member.id,
      partType: member.role,
      assemblyOrder: member.assemblyOrder,
      assemblyPriorityGroup: member.assemblyGroup,
      assemblyPrioritySourceId: member.assemblySourceId,
      materialId: result.rules.material.id,
      profileId: member.profile.id,
      manufacturerReference: member.profile.manufacturerReference,
      dimensionsMm: dimensionsForMember(member),
      ...(candidate.frameMaterial === 'TIMBER'
        ? { timberVolumeM3: member.volumeM3, referenceDensityKgM3: member.material.densityKgM3 }
        : { developedAreaApproxM2: member.fabricationGeometry.developedAreaApproxM2 }),
      calculatedMassKg: member.massKg,
      positionMm: { x: member.position.xMm, y: member.position.yMm, z: member.position.zMm },
      axis: member.axis,
      operations: member.operations,
      toleranceMm: null,
      qrPayload: member.qrPayload
    }));
    const assemblySequence = components.map((component, index) => ({
      stepId: `STICK-${core.math.pad(component.assemblyOrder, 3)}`,
      order: component.assemblyOrder,
      operation: candidate.frameMaterial === 'TIMBER' ? 'CUT_AND_PREPARE_TIMBER_ASSEMBLY' : 'ROLLFORM_AND_LOAD_IN_ASSEMBLY_ORDER',
      partIds: [component.partId],
      priorityGroup: component.assemblyPriorityGroup,
      dependsOn: index ? [`STICK-${core.math.pad(components[index - 1].assemblyOrder, 3)}`] : [],
      status: 'PROPOSED_PENDING_BLOC2_VALIDATION'
    }));
    return {
      schema: 'avelis.production.wall-handover.v2',
      schemaVersion: '2.0',
      releaseStatus: 'BLOCKED_PENDING_AVELIS_CAPABILITY_CONFIRMATION',
      project: result.project.identity,
      frameMaterial: result.input.frameMaterial,
      configurationId: `${result.input.projectId}-${result.input.wallId}`,
      revision: result.input.version,
      units: { length: 'mm', area: 'm2', mass: 'kg', ...(candidate.frameMaterial === 'TIMBER' ? { volume: 'm3' } : {}) },
      candidateId: candidate.id,
      material: result.rules.material,
      profiles: Array.from(new Set(candidate.members.map((member) => member.profile.id))).map((id) => core.engineering.getProfile(id)),
      components,
      toleranceMm: null,
      stockLengthMm: null,
      neutralFormats: ['CSV', 'JSON', 'DXF_ENVELOPE', 'STL_FABLAB'],
      assemblyPriority: {
        sourceId: priorityValidation.sourceId,
        frameType: priorityValidation.frameType,
        method: candidate.frameMaterial === 'TIMBER' ? 'Conceptual timber ordering: plates, boundary and opening studs, headers, sills, grid and top plates; to be validated by Bloc 2.' : 'FRAMECAD role priority extended deterministically to multiple openings from left to right; absent member types are skipped.',
        applicability: candidate.frameMaterial === 'TIMBER' ? 'Demonstration order; joints, fasteners, saw settings and actual assembly process are not specified.' : 'Reference loading/assembly order only; RFY export and Avelis/Torcy roll-former compatibility are not claimed.'
      },
      assemblySequence,
      interfaceChecks: {
        componentIdsUnique: new Set(components.map((component) => component.partId)).size === components.length,
        allSequencePartIdsExist: assemblySequence.every((step) => step.partIds.every((id) => components.some((component) => component.partId === id))),
        assemblyOrderContinuous: priorityValidation.continuous,
        assemblyOrderUnique: priorityValidation.unique,
        assemblyOrderComplete: priorityValidation.complete,
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
      frameMaterial: result.input.frameMaterial,
      candidateId: candidate.id,
      componentIds: candidate.members.map((member) => member.id),
      calculatedMaterialMassKg: candidate.metrics.materialMassKg,
      ...(candidate.frameMaterial === 'TIMBER' ? { timberVolumeM3: candidate.metrics.timberVolumeM3 } : { calculatedSteelMassKg: candidate.metrics.steelMassKg }),
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
