(function initCandidateSearch(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function buildSearchSpace(rules) {
    const options = [];
    rules.allowedStudSpacingsMm.forEach((spacing) => {
      rules.gridOffsetRatios.forEach((ratio) => {
        rules.headerLayers.forEach((headerLayers) => {
          options.push({
            studSpacingMm: spacing,
            gridOffsetMm: core.math.round(spacing * ratio, 2),
            gridOffsetRatio: ratio,
            headerLayers
          });
        });
      });
    });
    return options.slice(0, rules.maxCandidates);
  }

  function searchCandidates(input, rules) {
    const searchSpace = buildSearchSpace(rules);
    const candidates = searchSpace.map((option, index) => {
      const candidate = core.wallGenerator.generateWallCandidate(input, rules, option, index + 1);
      candidate.validation = core.candidateRules.validateCandidate(candidate, rules);
      candidate.metrics = core.metrics.computeMetrics(candidate, rules);
      candidate.bom = core.metrics.aggregateBom(candidate);
      return candidate;
    });
    return {
      searchSpaceSize: searchSpace.length,
      candidates,
      validCandidates: candidates.filter((candidate) => candidate.validation.valid),
      rejectedCandidates: candidates.filter((candidate) => !candidate.validation.valid)
    };
  }

  core.candidateSearch = { buildSearchSpace, searchCandidates };
})(typeof globalThis !== 'undefined' ? globalThis : window);

