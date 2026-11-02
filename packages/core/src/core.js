(function initCoreWorkflow(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function mergeRules(overrides) {
    return Object.assign({}, core.math.deepClone(core.DEFAULT_RULES), overrides || {});
  }

  function runWorkflow(rawInput, ruleOverrides) {
    const started = Date.now();
    const input = core.project.normaliseInput(rawInput);
    const rules = mergeRules(ruleOverrides);
    const inputValidation = core.inputRules.validateInput(input, rules);
    const project = core.project.createProjectRecord(input, rules);

    if (!inputValidation.valid) {
      return {
        ok: false,
        project,
        input,
        rules,
        inputValidation,
        search: { searchSpaceSize: 0, candidates: [], validCandidates: [], rejectedCandidates: [] },
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
      processingTimeMs: Date.now() - started
    };
  }

  function selectCandidate(result, candidateId) {
    return result.rankedCandidates.find((candidate) => candidate.id === candidateId) || result.recommended;
  }

  core.runWorkflow = runWorkflow;
  core.selectCandidate = selectCandidate;
  core.mergeRules = mergeRules;
})(typeof globalThis !== 'undefined' ? globalThis : window);

