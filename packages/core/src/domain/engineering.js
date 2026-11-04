(function initEngineeringDomain(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function catalog() {
    if (!core.ENGINEERING_DATA) throw new Error('Engineering data catalog is not loaded.');
    return core.ENGINEERING_DATA.catalog;
  }

  function getProfile(profileId) {
    const profile = [...catalog().profiles, ...catalog().timber.profiles].find((entry) => entry.id === profileId);
    if (!profile) throw new Error(`Unknown sourced profile: ${profileId}`);
    return core.math.deepClone(profile);
  }

  function createRules(overrides, frameMaterial, input) {
    const data = core.ENGINEERING_DATA;
    const timber = frameMaterial === 'TIMBER';
    const selectedCatalog = timber ? data.catalog.timber : data.catalog;
    const timberRules = data.referenceRules.timber;
    const price = timber ? timberRules.budgetPrice : data.referenceRules.hautsDeFranceSteelBudgetPrice;
    const rules = {
      frameMaterial: timber ? 'TIMBER' : 'STEEL',
      id: timber ? 'TIMBER-CONCEPT-2026-11-04' : 'CFS-REFERENCE-2026-11-03',
      label: timber ? 'Timber frame concept — engineering review required' : 'Cold-formed steel reference workflow — engineering review required',
      status: data.scope.certificationStatus,
      material: core.math.deepClone(selectedCatalog.material),
      profileSets: core.math.deepClone(selectedCatalog.compatibleProfileSets.filter((set) => !timber || !input || input.timberSection === 'ALL' || set.id === input.timberSection)),
      studSpacingMm: timber ? (input && input.timberStudSpacingMm || timberRules.defaultStudSpacingMm) : data.referenceRules.studSpacingMm.value,
      studSpacingStatus: timber ? timberRules.status : data.referenceRules.studSpacingMm.status,
      timberGeometry: timber ? { topPlateLayers: input && input.timberReferenceId ? timberRules.referencePreset.topPlateLayers : timberRules.topPlateLayers, headerLayers: timberRules.headerLayers } : null,
      gridStrategies: Object.keys(core.GRID_STRATEGIES),
      budgetPrice: core.math.deepClone(price),
      machineCapabilities: null,
      manufacturingToleranceMm: null,
      stockLengthMm: null,
      connectionLibrary: null,
      structuralLoadCases: null,
      engineeringDisclaimer: 'Reference-product geometry and quantity calculation only. Structural capacity, connections, bracing, fire, acoustics, thermal performance, durability and regulatory compliance require project-specific review.',
      avelisDisclaimer: timber ? 'C24 density and dimensions are public references. Sections, centres, doubled conceptual lintels, 620 EUR/m³ scenario and assembly order are not approved Avelis designs or prices.' : 'Metsec products and public market prices are reference inputs only; Avelis has not confirmed these products, prices, Torcy equipment or process capabilities.'
    };
    return Object.assign(rules, overrides || {});
  }

  function developedWidthMm(profile) {
    if (profile.family === 'TIMBER_RECTANGLE') return null;
    return profile.webDepthMm + profile.flange1Mm + profile.flange2Mm + 2 * (profile.lipMm || 0);
  }

  function densityCrossCheck(profile) {
    if (profile.family === 'TIMBER_RECTANGLE') {
      return { profileId: profile.id, referenceMassKgPerM: profile.massKgPerM,
        volumeBasedKgPerM: profile.sectionWidthMm * profile.sectionDepthMm / 1e6 * catalog().timber.material.densityKgM3,
        relativeDifferencePercent: 0, independentCheck: false,
        method: 'Section × mean density 420 kg/m³; formula consistency, not independent measurement.' };
    }
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
