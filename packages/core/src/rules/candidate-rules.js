(function initCandidateRules(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function issue(code, severity, message, componentId) {
    return { code, severity, message, componentId: componentId || null };
  }

  function overlapsClearOpening(member, opening, tolerance) {
    const b = member.bounds;
    const overlapX = Math.min(b.max.x, opening.xMm + opening.widthMm) - Math.max(b.min.x, opening.xMm);
    const overlapZ = Math.min(b.max.z, opening.sillMm + opening.heightMm) - Math.max(b.min.z, opening.sillMm);
    return overlapX > tolerance && overlapZ > tolerance;
  }

  function validateCandidate(candidate, rules) {
    const issues = [];
    const ids = new Set();
    const openings = candidate.wall.openings;

    candidate.members.forEach((member) => {
      if (ids.has(member.id)) issues.push(issue('DUPLICATE_COMPONENT_ID', 'error', `Identifiant dupliqué : ${member.id}.`, member.id));
      ids.add(member.id);
      if (!(member.lengthMm > 0)) issues.push(issue('NON_POSITIVE_LENGTH', 'error', 'Longueur de composant non positive.', member.id));
      if (member.lengthMm > rules.maxMachineMemberLengthMm) {
        issues.push(issue('MACHINE_LENGTH_LIMIT', 'error', `Le composant dépasse ${rules.maxMachineMemberLengthMm} mm.`, member.id));
      }
      const collidedOpening = openings.find((opening) => overlapsClearOpening(member, opening, 0.01));
      if (collidedOpening) {
        issues.push(issue('MEMBER_IN_OPENING', 'error', `Un composant traverse le vide ${collidedOpening.type === 'DOOR' ? 'de la porte' : 'de la fenêtre'}.`, member.id));
      }
      const b = member.bounds;
      if (b.min.x < -0.01 || b.max.x > candidate.wall.lengthMm + 0.01 || b.min.z < -0.01 || b.max.z > candidate.wall.heightMm + 0.01) {
        issues.push(issue('MEMBER_OUTSIDE_ENVELOPE', 'error', 'Un composant dépasse l’enveloppe du mur.', member.id));
      }
    });

    const requiredRoles = ['bottom_plate', 'top_plate', 'boundary_stud', 'king_stud', 'jack_stud', 'sill', 'header'];
    requiredRoles.forEach((role) => {
      if (!candidate.members.some((member) => member.role === role)) {
        issues.push(issue('MISSING_REQUIRED_ROLE', 'error', `Composant obligatoire absent : ${role}.`));
      }
    });

    openings.forEach((opening) => {
      const frameMembers = candidate.members.filter((member) => member.openingId === opening.id);
      const kingCount = frameMembers.filter((member) => member.role === 'king_stud').length;
      const jackCount = frameMembers.filter((member) => member.role === 'jack_stud').length;
      const headerCount = frameMembers.filter((member) => member.role === 'header').length;
      if (kingCount < 2 || jackCount < 2 || headerCount < candidate.option.headerLayers) {
        issues.push(issue('INCOMPLETE_OPENING_FRAME', 'error', `Encadrement incomplet pour ${opening.id}.`));
      }
      if (opening.type === 'WINDOW' && !frameMembers.some((member) => member.role === 'sill')) {
        issues.push(issue('MISSING_WINDOW_SILL', 'error', `Traverse d’appui absente pour ${opening.id}.`));
      }
    });

    const allowedSpacing = rules.allowedStudSpacingsMm.includes(candidate.option.studSpacingMm);
    if (!allowedSpacing) issues.push(issue('UNAPPROVED_STUD_SPACING', 'error', 'Entraxe non présent dans le catalogue de démonstration.'));
    if (candidate.members.length > 1000) issues.push(issue('RESOURCE_LIMIT', 'error', 'Nombre de composants anormalement élevé.'));

    issues.push(issue('STRUCTURAL_SCOPE', 'review', rules.engineeringDisclaimer));
    return {
      valid: issues.every((entry) => entry.severity !== 'error'),
      checkedRuleCount: 8 + openings.length * 2,
      issues
    };
  }

  core.candidateRules = { validateCandidate, overlapsClearOpening };
})(typeof globalThis !== 'undefined' ? globalThis : window);
