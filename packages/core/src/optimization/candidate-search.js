(function initCandidateSearch(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function buildSearchSpace(rules) {
    return rules.profileSets.flatMap((profileSet) => rules.gridStrategies.map((gridStrategy) => ({
      profileSetId: profileSet.id,
      gridStrategy
    })));
  }

  function searchCandidates(input, rules) {
    const searchSpace = buildSearchSpace(rules);
    const candidates = searchSpace.map((option, index) => {
      const candidate = core.steelPanelGenerator.generateCandidate(input, rules, option, index + 1);
      candidate.validation = core.candidateRules.validateCandidate(candidate, rules);
      candidate.metrics = core.metrics.computeMetrics(candidate, rules);
      candidate.bom = core.metrics.aggregateBom(candidate);
      candidate.crossValidation = { massReconciliation: core.metrics.reconcileMass(candidate) };
      return candidate;
    });
    return {
      searchSpaceSize: searchSpace.length,
      searchSpace,
      candidates,
      validCandidates: candidates.filter((candidate) => candidate.validation.geometryValid),
      rejectedCandidates: candidates.filter((candidate) => !candidate.validation.geometryValid)
    };
  }

  core.candidateSearch = { buildSearchSpace, searchCandidates };
})(typeof globalThis !== 'undefined' ? globalThis : window);
