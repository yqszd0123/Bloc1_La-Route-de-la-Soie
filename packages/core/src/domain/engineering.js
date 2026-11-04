(function initEngineeringDomain(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function catalog() {
    if (!core.ENGINEERING_DATA) throw new Error('Engineering data catalog is not loaded.');
    return core.ENGINEERING_DATA.catalog;
  }

  function getProfile(profileId) {
    const profile = catalog().profiles.find((entry) => entry.id === profileId);
    if (!profile) throw new Error(`Unknown sourced profile: ${profileId}`);
    return core.math.deepClone(profile);
  }

  function createRules(overrides) {
    const data = core.ENGINEERING_DATA;
    const price = data.referenceRules.hautsDeFranceSteelBudgetPrice;
    const rules = {
      id: 'CFS-REFERENCE-2026-11-03',
      label: 'Cold-formed steel reference workflow — engineering review required',
      status: data.scope.certificationStatus,
      material: core.math.deepClone(data.catalog.material),
      profileSets: core.math.deepClone(data.catalog.compatibleProfileSets),
      studSpacingMm: data.referenceRules.studSpacingMm.value,
      studSpacingStatus: data.referenceRules.studSpacingMm.status,
      gridStrategies: Object.keys(core.GRID_STRATEGIES),
      budgetPrice: core.math.deepClone(price),
      machineCapabilities: null,
      manufacturingToleranceMm: null,
      stockLengthMm: null,
      connectionLibrary: null,
      structuralLoadCases: null,
      engineeringDisclaimer: 'Reference-product geometry and quantity calculation only. Structural capacity, connections, bracing, fire, acoustics, thermal performance, durability and regulatory compliance require project-specific review.',
      avelisDisclaimer: 'Metsec products and public market prices are reference inputs only; Avelis has not confirmed these products, prices, Torcy equipment or process capabilities.'
    };
    return Object.assign(rules, overrides || {});
  }

  function developedWidthMm(profile) {
    return profile.webDepthMm + profile.flange1Mm + profile.flange2Mm + 2 * (profile.lipMm || 0);
  }

  function densityCrossCheck(profile) {
    const density = catalog().material.densityKgM3;
    const approximateKgPerM = developedWidthMm(profile) * profile.nominalThicknessMm * 1e-6 * density;
    const relativeDifference = Math.abs(approximateKgPerM - profile.massKgPerM) / profile.massKgPerM;
    return {
      profileId: profile.id,
      manufacturerMassKgPerM: profile.massKgPerM,
      flatWidthApproximationKgPerM: core.math.round(approximateKgPerM, 4),
      relativeDifferencePercent: core.math.round(relativeDifference * 100, 2),
      method: 'Flat developed-width × nominal thickness × 7850 kg/m³; bend radii and detailed coating geometry excluded.'
    };
  }

  core.engineering = { catalog, getProfile, createRules, developedWidthMm, densityCrossCheck };
})(typeof globalThis !== 'undefined' ? globalThis : window);
