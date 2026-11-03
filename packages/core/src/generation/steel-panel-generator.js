(function initSteelPanelGenerator(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function addVertical(context, role, label, xMm, zMm, lengthMm, source, openingId) {
    if (!(lengthMm > 0)) return null;
    return core.memberFactory.createMember(context, {
      role, label, axis: 'z', xMm, zMm, lengthMm, profileKind: 'stud', source, openingId
    });
  }

  function addHorizontal(context, role, label, xMm, zMm, lengthMm, source, openingId) {
    if (!(lengthMm > 0)) return null;
    return core.memberFactory.createMember(context, {
      role, label, axis: 'x', xMm, zMm, lengthMm, profileKind: 'track', source, openingId
    });
  }

  function subtractIntervals(lengthMm, blocked) {
    let segments = [{ start: 0, end: lengthMm }];
    blocked.slice().sort((a, b) => a.start - b.start).forEach((cut) => {
      const next = [];
      segments.forEach((segment) => {
        if (cut.end <= segment.start || cut.start >= segment.end) {
          next.push(segment);
          return;
        }
        if (cut.start > segment.start) next.push({ start: segment.start, end: Math.min(cut.start, segment.end) });
        if (cut.end < segment.end) next.push({ start: Math.max(cut.end, segment.start), end: segment.end });
      });
      segments = next;
    });
    return segments.filter((segment) => segment.end - segment.start > 0.001);
  }

  function gridCenters(wallLengthMm, spacingMm, strategy, openings) {
    let phase = spacingMm;
    if (strategy === 'OPENING_ALIGNED' && openings.length) {
      phase = ((openings[0].xMm % spacingMm) + spacingMm) % spacingMm;
      if (phase < 0.001) phase = spacingMm;
    }
    const centers = [];
    for (let center = phase; center < wallLengthMm - 0.001; center += spacingMm) {
      centers.push(core.math.round(center, 3));
    }
    return centers;
  }

  function centerInsideOpening(center, opening) {
    return center > opening.xMm + 0.001 && center < opening.xMm + opening.widthMm - 0.001;
  }

  function centerAtJamb(center, opening, studWidth) {
    return Math.abs(center - opening.xMm) < studWidth || Math.abs(center - (opening.xMm + opening.widthMm)) < studWidth;
  }

  function addOpeningFrame(context, opening, fullStudZ, fullStudLength, trackHeight, studWidth) {
    const right = opening.xMm + opening.widthMm;
    addVertical(context, 'opening_jamb', `Left jamb — ${opening.type}`, opening.xMm - studWidth, fullStudZ, fullStudLength, 'OPENING_FRAME', opening.id);
    addVertical(context, 'opening_jamb', `Right jamb — ${opening.type}`, right, fullStudZ, fullStudLength, 'OPENING_FRAME', opening.id);
    addHorizontal(context, 'opening_header', `Header track — ${opening.type}`, opening.xMm, opening.sillMm + opening.heightMm, opening.widthMm, 'OPENING_FRAME', opening.id);
    if (opening.type === 'WINDOW') {
      addHorizontal(context, 'window_sill', 'Window sill track', opening.xMm, opening.sillMm - trackHeight, opening.widthMm, 'OPENING_FRAME', opening.id);
    }
  }

  function addGridStud(context, center, fullStudZ, fullStudLength, topTrackZ, trackHeight, studWidth) {
    const opening = context.input.openings.find((entry) => centerInsideOpening(center, entry));
    if (context.input.openings.some((entry) => centerAtJamb(center, entry, studWidth))) return;
    const x = center - studWidth / 2;
    if (!opening) {
      addVertical(context, 'common_stud', 'Common stud', x, fullStudZ, fullStudLength, 'REFERENCE_GRID');
      return;
    }
    if (opening.type === 'WINDOW') {
      const lowerEnd = opening.sillMm - trackHeight;
      addVertical(context, 'cripple_stud', 'Window lower cripple stud', x, fullStudZ, lowerEnd - fullStudZ, 'OPENING_GRID', opening.id);
    }
    const upperStart = opening.sillMm + opening.heightMm + trackHeight;
    addVertical(context, 'cripple_stud', `Upper cripple stud — ${opening.type}`, x, upperStart, topTrackZ - upperStart, 'OPENING_GRID', opening.id);
  }

  function generateCandidate(input, rules, option, candidateIndex) {
    const profileSet = rules.profileSets.find((entry) => entry.id === option.profileSetId);
    if (!profileSet) throw new Error(`Unknown profile set: ${option.profileSetId}`);
    const context = {
      input,
      rules,
      studProfile: core.engineering.getProfile(profileSet.studProfileId),
      trackProfile: core.engineering.getProfile(profileSet.trackProfileId),
      members: []
    };
    const studWidth = core.memberFactory.profileEnvelopeWidth(context.studProfile);
    const trackHeight = core.memberFactory.profileEnvelopeWidth(context.trackProfile);
    const fullStudZ = trackHeight;
    const topTrackZ = input.wallHeightMm - trackHeight;
    const fullStudLength = topTrackZ - fullStudZ;

    const doors = input.openings.filter((opening) => opening.type === 'DOOR').map((opening) => ({
      start: opening.xMm,
      end: opening.xMm + opening.widthMm
    }));
    subtractIntervals(input.wallLengthMm, doors).forEach((segment, index) => {
      addHorizontal(context, 'bottom_track', `Bottom track ${index + 1}`, segment.start, 0, segment.end - segment.start, 'PANEL_ENVELOPE');
    });
    addHorizontal(context, 'top_track', 'Top track', 0, topTrackZ, input.wallLengthMm, 'PANEL_ENVELOPE');
    addVertical(context, 'boundary_stud', 'Left boundary stud', 0, fullStudZ, fullStudLength, 'PANEL_ENVELOPE');
    addVertical(context, 'boundary_stud', 'Right boundary stud', input.wallLengthMm - studWidth, fullStudZ, fullStudLength, 'PANEL_ENVELOPE');

    input.openings.forEach((opening) => addOpeningFrame(context, opening, fullStudZ, fullStudLength, trackHeight, studWidth));
    gridCenters(input.wallLengthMm, rules.studSpacingMm, option.gridStrategy, input.openings)
      .forEach((center) => addGridStud(context, center, fullStudZ, fullStudLength, topTrackZ, trackHeight, studWidth));

    return {
      id: `CAND-${core.math.pad(candidateIndex, 2)}`,
      option: Object.assign(core.math.deepClone(option), {
        studSpacingMm: rules.studSpacingMm,
        studProfileId: context.studProfile.id,
        trackProfileId: context.trackProfile.id
      }),
      wall: {
        lengthMm: input.wallLengthMm,
        heightMm: input.wallHeightMm,
        sourceThicknessMm: input.wallThicknessMm,
        displayDepthMm: Math.max(context.studProfile.webDepthMm, context.trackProfile.webDepthMm),
        placement: core.math.deepClone(input.placement),
        openings: core.math.deepClone(input.openings)
      },
      members: context.members,
      modelStatus: 'REFERENCE_GEOMETRY_ENGINEERING_REVIEW_REQUIRED',
      reviewItems: [
        'Profile capacity and stud centres must be verified against project loads and boundary conditions.',
        'Opening jambs, lintels, sills, bracing and connections require project-specific design.',
        'Machine limits, stock lengths, holes, fasteners and tolerances require Avelis/Bloc 2 confirmation.'
      ]
    };
  }

  core.steelPanelGenerator = { generateCandidate, gridCenters, subtractIntervals };
})(typeof globalThis !== 'undefined' ? globalThis : window);
