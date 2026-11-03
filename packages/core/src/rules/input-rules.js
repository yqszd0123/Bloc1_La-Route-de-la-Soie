(function initInputRules(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function issue(code, severity, message, field, sourceId) {
    return { code, severity, message, field: field || null, sourceId: sourceId || null };
  }

  function rectanglesOverlap(first, second) {
    const overlapX = Math.min(first.xMm + first.widthMm, second.xMm + second.widthMm) - Math.max(first.xMm, second.xMm);
    const overlapZ = Math.min(first.sillMm + first.heightMm, second.sillMm + second.heightMm) - Math.max(first.sillMm, second.sillMm);
    return overlapX > 0.001 && overlapZ > 0.001;
  }

  function validateInput(input, rules) {
    const issues = [];
    ['wallLengthMm', 'wallHeightMm', 'wallThicknessMm', 'prototypeScale'].forEach((field) => {
      if (!Number.isFinite(input[field]) || input[field] <= 0) {
        issues.push(issue('POSITIVE_NUMBER_REQUIRED', 'error', `${field} must be a positive number.`, field));
      }
    });
    if (!/^[A-Z0-9][A-Z0-9_-]*$/.test(input.projectId)) {
      issues.push(issue('PROJECT_ID_FORMAT', 'error', 'Project ID may contain letters, numbers, hyphens and underscores.', 'projectId'));
    }
    if (!/^[A-Z0-9][A-Z0-9_-]*$/.test(input.wallId)) {
      issues.push(issue('WALL_ID_FORMAT', 'error', 'Wall ID may contain letters, numbers, hyphens and underscores.', 'wallId'));
    }
    if (!input.openings.length) {
      issues.push(issue('NO_OPENING', 'review', 'A wall without an opening is valid for geometry processing; no opening-frame rules will run.'));
    }

    input.openings.forEach((opening, index) => {
      ['xMm', 'sillMm', 'widthMm', 'heightMm'].forEach((field) => {
        const allowZero = field === 'xMm' || field === 'sillMm';
        if (!Number.isFinite(opening[field]) || opening[field] < 0 || (!allowZero && opening[field] <= 0)) {
          issues.push(issue('OPENING_NUMBER_INVALID', 'error', `${opening.id}: ${field} is invalid.`, `openings[${index}].${field}`));
        }
      });
      if (opening.xMm + opening.widthMm > input.wallLengthMm + 0.001 || opening.sillMm + opening.heightMm > input.wallHeightMm + 0.001) {
        issues.push(issue('OPENING_OUTSIDE_WALL', 'error', `${opening.id} extends outside the wall envelope.`, `openings[${index}]`));
      }
      if (opening.sillMm + opening.heightMm >= input.wallHeightMm - 0.001) {
        issues.push(issue('OPENING_HEAD_ZONE_REQUIRED', 'error', `${opening.id} reaches the panel top; this framed-panel workflow requires a positive zone above every opening.`, `openings[${index}].heightMm`));
      }
      if (opening.type === 'DOOR' && opening.sillMm !== 0) {
        issues.push(issue('DOOR_SILL_NOT_ZERO', 'error', `${opening.id}: a door opening must start at wall base in this panel workflow.`, `openings[${index}].sillMm`));
      }
      if (opening.type === 'DOOR' && opening.widthMm < core.ENGINEERING_DATA.referenceRules.doorNominalWidthMm.value) {
        issues.push(issue('DOOR_WIDTH_REGULATORY_REVIEW', 'warning', `${opening.id}: ${opening.widthMm} mm is below the 900 mm nominal reference for relevant accessible housing doors; confirm applicability and clear passage.`, `openings[${index}].widthMm`, 'LEGIFRANCE_ACCESSIBILITY_2015'));
      }
    });
    for (let first = 0; first < input.openings.length; first += 1) {
      for (let second = first + 1; second < input.openings.length; second += 1) {
        if (rectanglesOverlap(input.openings[first], input.openings[second])) {
          issues.push(issue('OPENINGS_OVERLAP', 'error', `${input.openings[first].id} overlaps ${input.openings[second].id}.`, 'openings'));
        }
      }
    }
    if (input.sourceMode === 'IFC' && !input.ifcContext) {
      issues.push(issue('IFC_CONTEXT_MISSING', 'error', 'IFC source mode requires parsed IFC provenance.', 'sourceMode'));
    }
    if (input.sourceMode === 'STEP' && !input.stepContext) {
      issues.push(issue('STEP_CONTEXT_MISSING', 'error', 'STEP source mode requires Open CASCADE parsing provenance.', 'sourceMode'));
    }
    if (input.sourceMode === 'STEP') {
      issues.push(issue('STEP_ENVELOPE_ONLY', 'review', 'STEP is converted from its checked bounding envelope; semantic openings and manufacturing features are not inferred.', 'sourceMode', 'OCCT_IMPORT_JS_0_0_23'));
    }
    issues.push(issue('REFERENCE_PRODUCT', 'review', rules.avelisDisclaimer, null, 'METSEC_COMPONENTS_2026'));
    issues.push(issue('ENGINEERING_REVIEW_REQUIRED', 'review', rules.engineeringDisclaimer, null, 'AFNOR_NF_EN_1993_1_3_NA'));
    return { valid: issues.every((entry) => entry.severity !== 'error'), issues };
  }

  core.inputRules = { validateInput, rectanglesOverlap };
})(typeof globalThis !== 'undefined' ? globalThis : window);
