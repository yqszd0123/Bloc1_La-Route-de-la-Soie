(function initSteelPanelGenerator(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};
  const EPSILON = 0.001;

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

  const { subtractIntervals, uniqueSorted, buildGridPlan, symmetricModuleCenters, uniformCenters } = core.frameLayout;

  function centerInsideOpening(center, opening) {
    return center > opening.xMm + EPSILON && center < opening.xMm + opening.widthMm - EPSILON;
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

  function verticalCenter(member) {
    return member.position.xMm + member.sectionEnvelope.inPlaneWidthMm / 2;
  }

  function layoutSummary(context, plan, strategyDefinition) {
    const verticalRoles = new Set(['boundary_stud', 'common_stud', 'cripple_stud', 'opening_jamb']);
    const centersMm = uniqueSorted(context.members
      .filter((member) => member.axis === 'z' && verticalRoles.has(member.role))
      .map(verticalCenter));
    const baySpacingsMm = centersMm.slice(1).map((center, index) => (
      core.math.round(center - centersMm[index], 3)
    ));
    const minimumBayMm = baySpacingsMm.length ? Math.min(...baySpacingsMm) : null;
    const maximumBayMm = baySpacingsMm.length ? Math.max(...baySpacingsMm) : null;
    return {
      strategy: plan.strategy,
      label: strategyDefinition.label,
      description: strategyDefinition.description,
      targetModuleMm: plan.targetModuleMm,
      zoneCount: plan.zones.length,
      gridCentersMm: plan.centersMm,
      actualStudCentersMm: centersMm,
      actualBaySpacingsMm: baySpacingsMm,
      minimumBayMm,
      maximumBayMm,
      spacingSpreadMm: minimumBayMm == null ? null : core.math.round(maximumBayMm - minimumBayMm, 3)
    };
  }

  function generateCandidate(input, rules, option, candidateIndex) {
    const profileSet = rules.profileSets.find((entry) => entry.id === option.profileSetId);
    if (!profileSet) throw new Error(`Unknown profile set: ${option.profileSetId}`);
    const strategyDefinition = core.GRID_STRATEGIES[option.gridStrategy];
    if (!strategyDefinition) throw new Error(`Unknown grid strategy: ${option.gridStrategy}`);

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
    const gridPlan = buildGridPlan(
      input.wallLengthMm,
      rules.studSpacingMm,
      option.gridStrategy,
      input.openings,
      studWidth
    );
    gridPlan.centersMm.forEach((center) => {
      addGridStud(context, center, fullStudZ, fullStudLength, topTrackZ, trackHeight, studWidth);
    });

    const layout = layoutSummary(context, gridPlan, strategyDefinition);
    return {
      id: `CAND-${core.math.pad(candidateIndex, 2)}`,
      frameMaterial: 'STEEL',
      option: Object.assign(core.math.deepClone(option), {
        gridStrategyLabel: strategyDefinition.label,
        studSpacingMm: rules.studSpacingMm,
        studProfileId: context.studProfile.id,
        trackProfileId: context.trackProfile.id
      }),
      layout,
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

  core.steelPanelGenerator = {
    generateCandidate,
    buildGridPlan,
    symmetricModuleCenters,
    uniformCenters,
    subtractIntervals
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
