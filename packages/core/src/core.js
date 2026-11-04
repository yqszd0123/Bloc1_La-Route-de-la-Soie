(function initCoreWorkflow(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function resolveBudgetPrice(input, rules) {
    const budget = input.budgetInput;
    if (!(budget && Number.isFinite(budget.valueEurPerKgExVat) && budget.valueEurPerKgExVat > 0)) {
      rules.budgetPrice.origin = 'HAUTS_DE_FRANCE_REFERENCE_DEFAULT';
      return;
    }
    const low = Number.isFinite(budget.lowerEurPerKgExVat) && budget.lowerEurPerKgExVat > 0
      ? budget.lowerEurPerKgExVat : budget.valueEurPerKgExVat;
    const high = Number.isFinite(budget.upperEurPerKgExVat) && budget.upperEurPerKgExVat > 0
      ? budget.upperEurPerKgExVat : budget.valueEurPerKgExVat;
    rules.budgetPrice = {
      valueEurPerKgExVat: budget.valueEurPerKgExVat,
      lowerReferenceEurPerKgExVat: Math.min(low, high),
      upperReferenceEurPerKgExVat: Math.max(low, high),
      priceDate: budget.date || null,
      status: 'USER_COST_SCENARIO',
      sourceIds: [],
      method: budget.label || 'User-entered cost scenario',
      boundary: 'User-entered material unit price; scope must be confirmed by the user-provided source.',
      limitation: budget.source || 'No source description supplied.',
      origin: 'USER_OVERRIDE'
    };
  }

  function runWorkflow(rawInput, ruleOverrides) {
    const started = Date.now();
    const input = core.project.normaliseInput(rawInput);
    const rules = core.engineering.createRules(ruleOverrides);
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
