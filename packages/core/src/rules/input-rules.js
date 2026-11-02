(function initInputRules(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function issue(code, severity, message, field) {
    return { code, severity, message, field: field || null };
  }

  function fieldFor(opening, property) {
    if (opening.type === 'DOOR') {
      return { xMm: 'doorXMm', widthMm: 'doorWidthMm', heightMm: 'doorHeightMm' }[property];
    }
    return { xMm: 'windowXMm', widthMm: 'windowWidthMm', heightMm: 'windowHeightMm', sillMm: 'sillHeightMm' }[property];
  }

  function validateOpening(opening, input, rules, issues) {
    const isDoor = opening.type === 'DOOR';
    const label = isDoor ? 'porte' : 'fenêtre';
    const minWidth = isDoor ? rules.minDoorWidthMm : rules.minOpeningWidthMm;
    const maxWidth = isDoor ? rules.maxDoorWidthMm : rules.maxOpeningWidthMm;
    const minHeight = isDoor ? rules.minDoorHeightMm : rules.minOpeningHeightMm;
    const maxHeight = isDoor ? rules.maxDoorHeightMm : rules.maxOpeningHeightMm;
    const prefix = isDoor ? 'DOOR' : 'OPENING';

    if (opening.widthMm < minWidth || opening.widthMm > maxWidth) {
      issues.push(issue(`${prefix}_WIDTH_RANGE`, 'error', `La largeur de ${label} doit être comprise entre ${minWidth} et ${maxWidth} mm.`, fieldFor(opening, 'widthMm')));
    }
    if (opening.heightMm < minHeight || opening.heightMm > maxHeight) {
      issues.push(issue(`${prefix}_HEIGHT_RANGE`, 'error', `La hauteur de ${label} doit être comprise entre ${minHeight} et ${maxHeight} mm.`, fieldFor(opening, 'heightMm')));
    }

    const rightClearance = input.wallLengthMm - opening.xMm - opening.widthMm;
    if (opening.xMm < rules.minOpeningEdgeMm || rightClearance < rules.minOpeningEdgeMm) {
      issues.push(issue(`${prefix}_EDGE_CLEARANCE`, 'error', `La ${label} doit rester à au moins ${rules.minOpeningEdgeMm} mm des extrémités du mur.`, fieldFor(opening, 'xMm')));
    }
    const openingTop = opening.sillMm + opening.heightMm;
    if (input.wallHeightMm - openingTop < rules.minTopClearanceMm) {
      issues.push(issue(`${prefix}_TOP_CLEARANCE`, 'error', `Il faut au moins ${rules.minTopClearanceMm} mm entre la ${label} et le haut du mur.`, fieldFor(opening, 'heightMm')));
    }
    if (!isDoor && (opening.sillMm < rules.minSillHeightMm || opening.sillMm > rules.maxSillHeightMm)) {
      issues.push(issue('SILL_HEIGHT_RANGE', 'error', `La hauteur d'allège doit être comprise entre ${rules.minSillHeightMm} et ${rules.maxSillHeightMm} mm.`, fieldFor(opening, 'sillMm')));
    }
  }

  function openingsNeedSeparation(first, second, minimum) {
    const firstRight = first.xMm + first.widthMm;
    const secondRight = second.xMm + second.widthMm;
    const firstTop = first.sillMm + first.heightMm;
    const secondTop = second.sillMm + second.heightMm;
    const verticalOverlap = Math.min(firstTop, secondTop) - Math.max(first.sillMm, second.sillMm);
    if (verticalOverlap <= 0) return false;
    let horizontalGap = -1;
    if (firstRight <= second.xMm) horizontalGap = second.xMm - firstRight;
    else if (secondRight <= first.xMm) horizontalGap = first.xMm - secondRight;
    return horizontalGap < minimum;
  }

  function validateInput(input, rules) {
    const issues = [];
    const numericFields = [
      'wallLengthMm', 'wallHeightMm', 'windowWidthMm', 'windowHeightMm',
      'windowXMm', 'sillHeightMm', 'prototypeScale'
    ];
    if (input.doorEnabled) numericFields.push('doorWidthMm', 'doorHeightMm', 'doorXMm');
    numericFields.forEach((field) => {
      if (!Number.isFinite(input[field])) issues.push(issue('INPUT_NOT_NUMERIC', 'error', `${field} doit être numérique.`, field));
    });

    if (input.wallLengthMm < rules.minWallLengthMm || input.wallLengthMm > rules.maxWallLengthMm) {
      issues.push(issue('WALL_LENGTH_RANGE', 'error', `La longueur du mur doit être comprise entre ${rules.minWallLengthMm} et ${rules.maxWallLengthMm} mm.`, 'wallLengthMm'));
    }
    if (input.wallHeightMm < rules.minWallHeightMm || input.wallHeightMm > rules.maxWallHeightMm) {
      issues.push(issue('WALL_HEIGHT_RANGE', 'error', `La hauteur du mur doit être comprise entre ${rules.minWallHeightMm} et ${rules.maxWallHeightMm} mm.`, 'wallHeightMm'));
    }

    const openings = core.project.createOpenings(input);
    openings.forEach((opening) => validateOpening(opening, input, rules, issues));
    for (let first = 0; first < openings.length; first += 1) {
      for (let second = first + 1; second < openings.length; second += 1) {
        if (openingsNeedSeparation(openings[first], openings[second], rules.minOpeningSeparationMm)) {
          issues.push(issue('OPENING_SEPARATION', 'error', `Les ouvertures doivent être séparées d'au moins ${rules.minOpeningSeparationMm} mm pour leurs encadrements.`, fieldFor(openings[second], 'xMm')));
        }
      }
    }

    if (!/^[A-Z0-9][A-Z0-9_-]*$/.test(input.projectId)) {
      issues.push(issue('PROJECT_ID_FORMAT', 'error', 'Identifiant projet invalide : utiliser lettres, chiffres, tirets ou underscores.', 'projectId'));
    }
    if (!/^[A-Z0-9][A-Z0-9_-]*$/.test(input.wallId)) {
      issues.push(issue('WALL_ID_FORMAT', 'error', 'Identifiant mur invalide : utiliser lettres, chiffres, tirets ou underscores.', 'wallId'));
    }

    issues.push(issue('ENGINEERING_REVIEW_REQUIRED', 'warning', rules.engineeringDisclaimer));
    return {
      valid: issues.every((entry) => entry.severity !== 'error'),
      issues
    };
  }

  core.inputRules = { validateInput, openingsNeedSeparation };
})(typeof globalThis !== 'undefined' ? globalThis : window);
