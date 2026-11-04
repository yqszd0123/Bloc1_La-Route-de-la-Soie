(function initCandidateRules(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function issue(code, severity, message, componentId, sourceId) {
    return { code, severity, message, componentId: componentId || null, sourceId: sourceId || null };
  }

  function overlapsClearOpening(member, opening, tolerance) {
    const tol = tolerance == null ? 0.001 : tolerance;
    const overlapX = Math.min(member.bounds.max.x, opening.xMm + opening.widthMm) - Math.max(member.bounds.min.x, opening.xMm);
    const overlapZ = Math.min(member.bounds.max.z, opening.sillMm + opening.heightMm) - Math.max(member.bounds.min.z, opening.sillMm);
    return overlapX > tol && overlapZ > tol;
  }

  function validateCandidate(candidate, rules) {
    const issues = [];
    const timber = candidate.frameMaterial === 'TIMBER';
    const ids = new Set();
    candidate.members.forEach((member) => {
      if (ids.has(member.id)) issues.push(issue('DUPLICATE_COMPONENT_ID', 'error', `Duplicate stable ID: ${member.id}.`, member.id));
      ids.add(member.id);
      if (!(member.lengthMm > 0)) issues.push(issue('NON_POSITIVE_LENGTH', 'error', 'Component length is not positive.', member.id));
      if (!Number.isFinite(member.massKg) || member.massKg <= 0) issues.push(issue('INVALID_MEMBER_MASS', 'error', 'Component mass calculation failed.', member.id));
      const collision = candidate.wall.openings.find((opening) => overlapsClearOpening(member, opening));
      if (collision) issues.push(issue('MEMBER_IN_CLEAR_OPENING', 'error', `${member.id} crosses clear opening ${collision.id}.`, member.id));
      if (member.bounds.min.x < -0.001 || member.bounds.max.x > candidate.wall.lengthMm + 0.001 || member.bounds.min.z < -0.001 || member.bounds.max.z > candidate.wall.heightMm + 0.001) {
        issues.push(issue('MEMBER_OUTSIDE_WALL', 'error', `${member.id} extends outside the wall envelope.`, member.id));
      }
      if (!member.profile.sourceId || (timber
        ? !['SCHILLIGER_TIMBER_C24', 'AVELIS_EMAIL_2026_11_04'].includes(member.profile.sourceId)
        : member.profile.sourceId !== 'METSEC_COMPONENTS_2026')) {
        issues.push(issue('UNTRACEABLE_PROFILE', 'error', `${member.id} has no approved source record.`, member.id));
      }
    });

    [timber ? 'top_plate' : 'top_track', 'boundary_stud'].forEach((role) => {
      if (!candidate.members.some((member) => member.role === role)) {
        issues.push(issue('MISSING_PANEL_ROLE', 'error', `Required panel role is missing: ${role}.`));
      }
    });
    candidate.wall.openings.forEach((opening) => {
      const frame = candidate.members.filter((member) => member.openingId === opening.id);
      if (timber && frame.filter((m) => m.role === 'jack_stud').length !== 2) issues.push(issue('TIMBER_JACKS_INCOMPLETE', 'error', 'Deux montants d’appui sont requis.'));
      if (frame.filter((member) => member.role === (timber ? 'king_stud' : 'opening_jamb')).length !== 2) {
        issues.push(issue('OPENING_JAMBS_INCOMPLETE', 'error', `${opening.id} requires exactly two jamb members.`));
      }
      if (frame.filter((member) => member.role === (timber ? 'header' : 'opening_header')).length !== (timber ? rules.timberGeometry.headerLayers : 1)) {
        issues.push(issue('OPENING_HEADER_INCOMPLETE', 'error', `${opening.id} requires one header member.`));
      }
      if (opening.type === 'WINDOW' && frame.filter((member) => member.role === (timber ? 'sill' : 'window_sill')).length !== 1) {
        issues.push(issue('WINDOW_SILL_INCOMPLETE', 'error', `${opening.id} requires one sill member.`));
      }
    });

    if (timber) {
      if (candidate.members.filter((m) => m.role === 'top_plate').length !== rules.timberGeometry.topPlateLayers) issues.push(issue('TIMBER_TOP_PLATES', 'error', 'Deux lisses hautes sont requises.'));
      for (let i = 0; i < candidate.members.length; i += 1) {
        for (let j = i + 1; j < candidate.members.length; j += 1) {
          const a = candidate.members[i], b = candidate.members[j];
          if (['x', 'y', 'z'].every((axis) => Math.min(a.bounds.max[axis], b.bounds.max[axis]) - Math.max(a.bounds.min[axis], b.bounds.min[axis]) > 0.001)) {
            issues.push(issue('TIMBER_MEMBERS_OVERLAP', 'error', 'Deux pièces de bois occupent le même volume.', a.id));
          }
        }
      }
    }
    issues.push(issue('STRUCTURAL_ANALYSIS_NOT_RUN', 'review', 'No structural safety conclusion: project actions, restraints, bracing and connection properties are not available.', null, timber ? 'TIMBER_POC_ASSEMBLY' : 'AFNOR_NF_EN_1993_1_3_NA'));
    issues.push(issue('MACHINE_RELEASE_BLOCKED', 'review', 'No machine-ready release: Torcy equipment, supported operations, stock lengths and tolerances are not confirmed.'));
    issues.push(issue('REFERENCE_PRODUCT_NOT_AVELIS', 'review', rules.avelisDisclaimer, null, timber ? 'SCHILLIGER_TIMBER_C24' : 'METSEC_COMPONENTS_2026'));
    return {
      geometryValid: issues.every((entry) => entry.severity !== 'error'),
      valid: issues.every((entry) => entry.severity !== 'error'),
      engineeringStatus: 'ENGINEERING_REVIEW_REQUIRED',
      manufacturingRelease: false,
      checkedRuleCount: 7 + candidate.wall.openings.length * 3,
      issues
    };
  }

  core.candidateRules = { validateCandidate, overlapsClearOpening };
})(typeof globalThis !== 'undefined' ? globalThis : window);
