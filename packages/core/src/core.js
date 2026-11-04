(function initCoreWorkflow(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function resolveBudgetPrice(input, rules) {
    const budget = input.budgetInput;
    const timber = input.frameMaterial === 'TIMBER';
    const suffix = timber ? 'M3' : 'Kg';
    const value = budget['valueEurPer' + suffix + 'ExVat'];
    rules.budgetPrice.origin = timber ? 'TIMBER_DEMONSTRATION_DEFAULT' : 'HAUTS_DE_FRANCE_REFERENCE_DEFAULT';
    if (Number.isFinite(value) && value > 0) {
      const low = budget['lowerEurPer' + suffix + 'ExVat'];
      const high = budget['upperEurPer' + suffix + 'ExVat'];
      rules.budgetPrice = {
        ['valueEurPer' + suffix + 'ExVat']: value,
        ['lowerReferenceEurPer' + suffix + 'ExVat']: Number.isFinite(low) && low > 0 ? low : value,
        ['upperReferenceEurPer' + suffix + 'ExVat']: Number.isFinite(high) && high > 0 ? high : value,
        priceDate: budget.date || null, status: 'USER_COST_SCENARIO', sourceIds: [],
        method: budget.label || 'User-entered cost scenario',
        boundary: 'Material price only; scope to be confirmed by the supplied quotation.',
        limitation: budget.source || 'No source supplied.', origin: 'USER_OVERRIDE'
      };
    }
    const price = rules.budgetPrice;
    price.unit = timber ? 'm3' : 'kg';
    price.valueEurPerUnitExVat = price['valueEurPer' + suffix + 'ExVat'];
    price.lowerReferenceEurPerUnitExVat = price['lowerReferenceEurPer' + suffix + 'ExVat'];
    price.upperReferenceEurPerUnitExVat = price['upperReferenceEurPer' + suffix + 'ExVat'];
  }

  function runWorkflow(rawInput, ruleOverrides) {
    const started = Date.now();
    const input = core.project.normaliseInput(rawInput);
    const rules = core.engineering.createRules(ruleOverrides, input.frameMaterial, input);
    resolveBudgetPrice(input, rules);
    input.resolvedBudgetPrice = core.math.deepClone(rules.budgetPrice);
    const inputValidation = core.inputRules.validateInput(input, rules);
    const project = core.project.createProjectRecord(input, rules);

    if (!inputValidation.valid) {
      return {
        ok: false,
        project,
        input,
        rules,
        inputValidation,
        search: {
          searchSpaceSize: 0,
          searchSpace: [],
          evaluatedCandidateCount: 0,
          uniqueCandidateCount: 0,
          duplicateCandidates: [],
          candidates: [],
          validCandidates: [],
          rejectedCandidates: []
        },
        rankedCandidates: [],
        recommended: null,
        processingTimeMs: Date.now() - started
      };
    }

    const search = core.candidateSearch.searchCandidates(input, rules);
    const rankedCandidates = core.ranker.rankCandidates(search.candidates, input.priority);
    return {
      ok: rankedCandidates.length > 0,
      project,
      input,
      rules,
      inputValidation,
      search,
      rankedCandidates,
      recommended: rankedCandidates[0] || null,
      conclusionStatus: 'ENGINEERING_REVIEW_REQUIRED',
      processingTimeMs: Date.now() - started
    };
  }

  function runIfcWorkflow(ifcText, options, ruleOverrides) {
    const ifcModel = core.ifcImporter.parseIfc(ifcText);
    const settings = options || {};
    const input = core.ifcImporter.inputFromWall(ifcModel, settings.wallEntityId, settings.inputOverrides);
    const result = runWorkflow(input, ruleOverrides);
    result.ifcModel = ifcModel;
    result.ifcAudit = {
      schema: ifcModel.schema,
      entityCount: ifcModel.entityCount,
      buildingCount: ifcModel.buildings.length,
      storeyCount: ifcModel.storeys.length,
      wallCount: ifcModel.walls.length,
      warningCount: ifcModel.warnings.length,
      sourceFingerprint: ifcModel.sourceFingerprint
    };
    return result;
  }

  function runStepWorkflow(stepModel, mapping, inputOverrides, ruleOverrides) {
    const input = core.stepAdapter.inputFromModel(stepModel, mapping, inputOverrides);
    const result = runWorkflow(input, ruleOverrides);
    result.stepAudit = {
      format: stepModel.format,
      parser: stepModel.parser,
      fileName: stepModel.fileName,
      meshCount: stepModel.meshCount,
      vertexCount: stepModel.vertexCount,
      dimensionsMm: core.math.deepClone(stepModel.dimensionsMm),
      sourceFingerprint: stepModel.sourceFingerprint,
      conversionMode: 'BOUNDING_BOX_ENVELOPE'
    };
    return result;
  }

  function selectCandidate(result, candidateId) {
    return result.rankedCandidates.find((candidate) => candidate.id === candidateId) || result.recommended;
  }

  core.runWorkflow = runWorkflow;
  core.runIfcWorkflow = runIfcWorkflow;
  core.runStepWorkflow = runStepWorkflow;
  core.selectCandidate = selectCandidate;
  core.resolveBudgetPrice = resolveBudgetPrice;
})(typeof globalThis !== 'undefined' ? globalThis : window);
