(function initRanker(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  const METRICS = ['steelMassKg', 'componentCount', 'uniqueLengthCount'];

  function dominates(first, second) {
    const noWorse = METRICS.every((metric) => first.metrics[metric] <= second.metrics[metric]);
    const better = METRICS.some((metric) => first.metrics[metric] < second.metrics[metric]);
    return noWorse && better;
  }

  function markParetoFront(candidates) {
    candidates.forEach((candidate) => {
      candidate.paretoOptimal = !candidates.some((other) => other.id !== candidate.id && dominates(other, candidate));
    });
  }

  function metricRanges(candidates, names) {
    return Object.fromEntries(names.map((name) => [
      name,
      [Math.min(...candidates.map((candidate) => candidate.metrics[name])), Math.max(...candidates.map((candidate) => candidate.metrics[name]))]
    ]));
  }

  function rankCandidates(candidates, priority) {
    const valid = candidates.filter((candidate) => candidate.validation.geometryValid);
    if (!valid.length) return [];
    const selectedPriority = core.PRIORITIES[priority] || core.PRIORITIES.balanced;
    const names = selectedPriority.metrics;
    const ranges = metricRanges(valid, names);
    valid.forEach((candidate) => {
      const normalized = Object.fromEntries(names.map((name) => [
        name,
        core.math.round(core.math.normaliseMetric(candidate.metrics[name], ...ranges[name]), 5)
      ]));
      const values = Object.values(normalized);
      candidate.score = core.math.round(100 * values.reduce((sum, value) => sum + value, 0) / values.length, 2);
      candidate.scoreBreakdown = {
        method: 'Equal-weight arithmetic mean of min-max normalized available metrics; lower is better.',
        priority,
        normalized
      };
    });
    markParetoFront(valid);
    valid.sort((a, b) => a.score - b.score || a.metrics.steelMassKg - b.metrics.steelMassKg || a.id.localeCompare(b.id));
    valid.forEach((candidate, index) => { candidate.rank = index + 1; });
    return valid;
  }

  core.ranker = { rankCandidates, markParetoFront, dominates };
})(typeof globalThis !== 'undefined' ? globalThis : window);
