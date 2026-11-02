(function initMath(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function round(value, digits) {
    const scale = 10 ** (digits == null ? 3 : digits);
    return Math.round((value + Number.EPSILON) * scale) / scale;
  }

  function nearlyEqual(a, b, tolerance) {
    return Math.abs(a - b) <= (tolerance == null ? 0.001 : tolerance);
  }

  function uniqueSorted(values, tolerance) {
    const tol = tolerance == null ? 0.01 : tolerance;
    return values
      .slice()
      .sort((a, b) => a - b)
      .filter((value, index, array) => index === 0 || Math.abs(value - array[index - 1]) > tol);
  }

  function slug(value) {
    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function pad(value, size) {
    return String(value).padStart(size || 3, '0');
  }

  function stableComponentId(projectId, wallId, version, index) {
    const safeVersion = String(version).replace(/[^0-9A-Za-z]+/g, '-');
    return [projectId, wallId, 'V' + safeVersion, 'C' + pad(index, 3)].join('-');
  }

  function normaliseMetric(value, min, max) {
    if (nearlyEqual(min, max)) return 0;
    return (value - min) / (max - min);
  }

  core.math = {
    clamp,
    round,
    nearlyEqual,
    uniqueSorted,
    slug,
    deepClone,
    pad,
    stableComponentId,
    normaliseMetric
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);

