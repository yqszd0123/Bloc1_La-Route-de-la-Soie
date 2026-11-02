(function initRanker(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function markParetoFront(candidates) {
    candidates.forEach((candidate) => {
      candidate.paretoOptimal = !candidates.some((other) => {
        if (other.id === candidate.id) return false;
        const noWorse =
          other.metrics.timberVolumeM3 <= candidate.metrics.timberVolumeM3 &&
          other.metrics.manufacturingComplexity <= candidate.metrics.manufacturingComplexity &&
          other.metrics.estimatedCostEur <= candidate.metrics.estimatedCostEur;
        const strictlyBetter =
          other.metrics.timberVolumeM3 < candidate.metrics.timberVolumeM3 ||
          other.metrics.manufacturingComplexity < candidate.metrics.manufacturingComplexity ||
          other.metrics.estimatedCostEur < candidate.metrics.estimatedCostEur;
        return noWorse && strictlyBetter;
      });
    });
  }

  function rankCandidates(candidates, priority) {
    const valid = candidates.filter((candidate) => candidate.validation.valid);
    if (!valid.length) return [];
    const weights = core.PRIORITY_WEIGHTS[priority] || core.PRIORITY_WEIGHTS.balanced;
    const ranges = {
      material: [Math.min(...valid.map((c) => c.metrics.timberVolumeM3)), Math.max(...valid.map((c) => c.metrics.timberVolumeM3))],
      complexity: [Math.min(...valid.map((c) => c.metrics.manufacturingComplexity)), Math.max(...valid.map((c) => c.metrics.manufacturingComplexity))],
      cost: [Math.min(...valid.map((c) => c.metrics.estimatedCostEur)), Math.max(...valid.map((c) => c.metrics.estimatedCostEur))]
    };

    valid.forEach((candidate) => {
      const material = core.math.normaliseMetric(candidate.metrics.timberVolumeM3, ...ranges.material);
      const complexity = core.math.normaliseMetric(candidate.metrics.manufacturingComplexity, ...ranges.complexity);
      const cost = core.math.normaliseMetric(candidate.metrics.estimatedCostEur, ...ranges.cost);
      candidate.scoreBreakdown = {
        material: core.math.round(material, 4),
        complexity: core.math.round(complexity, 4),
        cost: core.math.round(cost, 4),
        weights: core.math.deepClone(weights)
      };
      candidate.score = core.math.round(100 * (weights.material * material + weights.complexity * complexity + weights.cost * cost), 2);
    });

    markParetoFront(valid);
    valid.sort((a, b) => a.score - b.score || a.metrics.timberVolumeM3 - b.metrics.timberVolumeM3 || a.id.localeCompare(b.id));
    valid.forEach((candidate, index) => { candidate.rank = index + 1; });
    return valid;
  }

  core.ranker = { rankCandidates, markParetoFront };
})(typeof globalThis !== 'undefined' ? globalThis : window);

