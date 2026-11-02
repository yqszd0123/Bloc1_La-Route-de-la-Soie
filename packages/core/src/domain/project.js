(function initProjectDomain(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function numberValue(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  function booleanValue(value, fallback) {
    if (value === true || value === 'true' || value === 'on' || value === 1 || value === '1') return true;
    if (value === false || value === 'false' || value === 0 || value === '0' || value == null) return false;
    return fallback;
  }

  function normaliseInput(rawInput) {
    const defaults = core.DEFAULT_INPUT;
    const raw = rawInput || {};
    return {
      projectId: String(raw.projectId || defaults.projectId).trim().toUpperCase(),
      typology: String(raw.typology || defaults.typology).trim().toUpperCase(),
      wallId: String(raw.wallId || defaults.wallId).trim().toUpperCase(),
      version: String(raw.version || defaults.version).trim(),
      wallLengthMm: numberValue(raw.wallLengthMm, defaults.wallLengthMm),
      wallHeightMm: numberValue(raw.wallHeightMm, defaults.wallHeightMm),
      windowWidthMm: numberValue(raw.windowWidthMm, defaults.windowWidthMm),
      windowHeightMm: numberValue(raw.windowHeightMm, defaults.windowHeightMm),
      windowXMm: numberValue(raw.windowXMm, defaults.windowXMm),
      sillHeightMm: numberValue(raw.sillHeightMm, defaults.sillHeightMm),
      doorEnabled: booleanValue(raw.doorEnabled, defaults.doorEnabled),
      doorWidthMm: numberValue(raw.doorWidthMm, defaults.doorWidthMm),
      doorHeightMm: numberValue(raw.doorHeightMm, defaults.doorHeightMm),
      doorXMm: numberValue(raw.doorXMm, defaults.doorXMm),
      priority: core.PRIORITY_WEIGHTS[raw.priority] ? raw.priority : defaults.priority,
      prototypeScale: Math.max(1, numberValue(raw.prototypeScale, defaults.prototypeScale))
    };
  }

  function createProjectRecord(input, rules) {
    return {
      schemaVersion: '1.0',
      software: { name: 'Avelis Wall Flow', version: core.VERSION },
      identity: {
        projectId: input.projectId,
        typology: input.typology,
        wallId: input.wallId,
        version: input.version
      },
      configuration: core.math.deepClone(input),
      ruleProfile: {
        id: rules.profileId,
        label: rules.profileLabel,
        disclaimer: rules.engineeringDisclaimer
      }
    };
  }

  function createOpenings(input) {
    const openings = [{
      id: 'WINDOW-01',
      type: 'WINDOW',
      xMm: input.windowXMm,
      sillMm: input.sillHeightMm,
      widthMm: input.windowWidthMm,
      heightMm: input.windowHeightMm
    }];
    if (input.doorEnabled) {
      openings.push({
        id: 'DOOR-01',
        type: 'DOOR',
        xMm: input.doorXMm,
        sillMm: 0,
        widthMm: input.doorWidthMm,
        heightMm: input.doorHeightMm
      });
    }
    return openings.sort((a, b) => a.xMm - b.xMm);
  }

  core.project = { normaliseInput, createProjectRecord, createOpenings };
})(typeof globalThis !== 'undefined' ? globalThis : window);
