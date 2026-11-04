(function initCandidateSearch(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function buildSearchSpace(rules) {
    return rules.profileSets.flatMap((profileSet) => rules.gridStrategies.map((gridStrategy) => ({
      profileSetId: profileSet.id,
      gridStrategy
    })));
  }

  function evaluateCandidate(input, rules, option, index) {
    const generator = input.frameMaterial === 'TIMBER' ? core.timberPanelGenerator : core.steelPanelGenerator;
    const candidate = generator.generateCandidate(input, rules, option, index + 1);
    candidate.validation = core.candidateRules.validateCandidate(candidate, rules);
    candidate.metrics = core.metrics.computeMetrics(candidate, rules);
    candidate.bom = core.metrics.aggregateBom(candidate);
    candidate.crossValidation = { massReconciliation: core.metrics.reconcileMass(candidate) };
    return candidate;
  }

  function geometrySignature(candidate) {
    return candidate.members.map((member) => [
      member.role,
      member.openingId || '',
      member.profile.id,
      member.axis,
      member.position.xMm,
      member.position.zMm,
      member.lengthMm
    ].join('|')).sort().join('\n');
  }

  function distinctCandidates(evaluatedCandidates) {
    const signatures = new Map();
    const candidates = [];
    const duplicateCandidates = [];
    evaluatedCandidates.forEach((candidate) => {
      const signature = geometrySignature(candidate);
      if (signatures.has(signature)) {
        duplicateCandidates.push({
          candidateId: candidate.id,
          duplicateOfCandidateId: signatures.get(signature),
          option: core.math.deepClone(candidate.option)
        });
        return;
      }
      signatures.set(signature, candidate.id);
      candidates.push(candidate);
    });
    return { candidates, duplicateCandidates };
  }

  function searchCandidates(input, rules) {
    const searchSpace = buildSearchSpace(rules);
    const evaluatedCandidates = searchSpace.map((option, index) => evaluateCandidate(input, rules, option, index));
    const distinct = distinctCandidates(evaluatedCandidates);
    return {
      searchSpaceSize: searchSpace.length,
      searchSpace,
      evaluatedCandidateCount: evaluatedCandidates.length,
      uniqueCandidateCount: distinct.candidates.length,
      duplicateCandidates: distinct.duplicateCandidates,
      candidates: distinct.candidates,
      validCandidates: distinct.candidates.filter((candidate) => candidate.validation.geometryValid),
      rejectedCandidates: distinct.candidates.filter((candidate) => !candidate.validation.geometryValid)
    };
  }

  core.candidateSearch = { buildSearchSpace, searchCandidates, geometrySignature, distinctCandidates };
})(typeof globalThis !== 'undefined' ? globalThis : window);
