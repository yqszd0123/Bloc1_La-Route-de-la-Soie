(function initProjectDomain(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function numberValue(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  function booleanValue(value, fallback) {
    if (value === true || value === 'true' || value === 'on' || value === 1 || value === '1') return true;
    if (value === false || value === 'false' || value === 0 || value === '0') return false;
    return fallback;
  }

  function openingFromRaw(raw, index) {
    return {
      id: String(raw.id || `OPENING-${core.math.pad(index + 1, 2)}`).trim().toUpperCase(),
      guid: raw.guid || null,
      type: String(raw.type || 'OPENING').trim().toUpperCase(),
      xMm: numberValue(raw.xMm, 0),
      sillMm: numberValue(raw.sillMm, 0),
      widthMm: numberValue(raw.widthMm, 0),
      heightMm: numberValue(raw.heightMm, 0),
      source: raw.source || 'MANUAL_INPUT',
      sourceRef: raw.sourceRef || null
    };
  }

  function openingsFromForm(raw, defaults) {
    const openings = [];
    if (booleanValue(raw.windowEnabled, defaults.windowEnabled)) {
      openings.push(openingFromRaw({
        id: 'WINDOW-01', type: 'WINDOW', xMm: raw.windowXMm, sillMm: raw.sillHeightMm,
        widthMm: raw.windowWidthMm, heightMm: raw.windowHeightMm,
        source: raw.sourceMode === 'IFC' ? 'IFC' : 'MANUAL_INPUT'
      }, openings.length));
    }
    if (booleanValue(raw.doorEnabled, defaults.doorEnabled)) {
      openings.push(openingFromRaw({
        id: 'DOOR-01', type: 'DOOR', xMm: raw.doorXMm, sillMm: 0,
        widthMm: raw.doorWidthMm, heightMm: raw.doorHeightMm,
        source: raw.sourceMode === 'IFC' ? 'IFC' : 'MANUAL_INPUT'
      }, openings.length));
    }
    return openings;
  }

  function normaliseInput(rawInput) {
    const defaults = core.DEFAULT_INPUT;
    const raw = rawInput || {};
    const merged = Object.assign({}, defaults, raw);
    const openings = Array.isArray(raw.openings)
      ? raw.openings.map(openingFromRaw)
      : openingsFromForm(merged, defaults);
    return {
      sourceMode: String(raw.sourceMode || defaults.sourceMode).toUpperCase(),
      projectId: String(raw.projectId || defaults.projectId).trim().toUpperCase(),
      typology: String(raw.typology || defaults.typology).trim().toUpperCase(),
      wallId: String(raw.wallId || defaults.wallId).trim().toUpperCase(),
      wallGuid: raw.wallGuid || null,
      version: String(raw.version || defaults.version).trim(),
      wallLengthMm: numberValue(raw.wallLengthMm, defaults.wallLengthMm),
      wallHeightMm: numberValue(raw.wallHeightMm, defaults.wallHeightMm),
      wallThicknessMm: numberValue(raw.wallThicknessMm, defaults.wallThicknessMm),
      placement: raw.placement ? core.math.deepClone(raw.placement) : { xMm: 0, yMm: 0, zMm: 0, rotationDeg: 0 },
      openings: openings.sort((a, b) => a.xMm - b.xMm || a.sillMm - b.sillMm),
      budgetInput: {
        valueEurPerKgExVat: numberValue(raw.budgetPriceEurPerKgExVat, null),
        lowerEurPerKgExVat: numberValue(raw.budgetLowEurPerKgExVat, null),
        upperEurPerKgExVat: numberValue(raw.budgetHighEurPerKgExVat, null),
        label: String(raw.budgetPriceLabel || '').trim(),
        date: String(raw.budgetPriceDate || '').trim(),
        source: String(raw.budgetPriceSource || '').trim()
      },
      priority: core.PRIORITIES[raw.priority] ? raw.priority : defaults.priority,
      prototypeScale: Math.max(1, numberValue(raw.prototypeScale, defaults.prototypeScale)),
      ifcContext: raw.ifcContext ? core.math.deepClone(raw.ifcContext) : null,
      stepContext: raw.stepContext ? core.math.deepClone(raw.stepContext) : null
    };
  }

  function createProjectRecord(input, rules) {
    return {
      schemaVersion: '2.0',
      software: { name: 'Avelis Wall Flow', version: core.VERSION },
      identity: {
        projectId: input.projectId,
        typology: input.typology,
        wallId: input.wallId,
        wallGuid: input.wallGuid,
        version: input.version
      },
      source: { mode: input.sourceMode, ifc: input.ifcContext, step: input.stepContext },
      configuration: core.math.deepClone(input),
      ruleProfile: {
        id: rules.id,
        label: rules.label,
        status: rules.status,
        disclaimer: rules.engineeringDisclaimer
      }
    };
  }

  core.project = { normaliseInput, createProjectRecord, openingFromRaw };
})(typeof globalThis !== 'undefined' ? globalThis : window);
