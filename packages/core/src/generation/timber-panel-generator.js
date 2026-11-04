(function initTimberPanelGenerator(global) {
  'use strict';
  const core = global.AvelisCore = global.AvelisCore || {};

  function generateCandidate(input, rules, option, candidateIndex) {
    const set = rules.profileSets.find((entry) => entry.id === option.profileSetId);
    const profile = core.engineering.getProfile(set.studProfileId);
    const width = profile.sectionWidthMm;
    const { topPlateLayers, headerLayers } = rules.timberGeometry;
    const top = input.wallHeightMm - topPlateLayers * width;
    const context = { input, rules, studProfile: profile, trackProfile: profile, members: [] };
    const add = (role, label, axis, xMm, zMm, lengthMm, openingId) => {
      if (lengthMm <= 0) return;
      core.memberFactory.createMember(context, {
        role, label, axis, xMm, zMm, lengthMm, openingId,
        profileKind: 'stud', source: 'TIMBER_REFERENCE_GENERATOR'
      });
    };
    const doors = input.openings.filter((o) => o.type === 'DOOR')
      .map((o) => ({ start: o.xMm, end: o.xMm + o.widthMm }));
    core.frameLayout.subtractIntervals(input.wallLengthMm, doors).forEach((segment, i) => {
      add('bottom_plate', `Lisse basse ${i + 1}`, 'x', segment.start, 0, segment.end - segment.start);
    });
    for (let layer = 0; layer < topPlateLayers; layer += 1) {
      add('top_plate', 'Lisse haute ' + (layer + 1), 'x', 0, top + layer * width, input.wallLengthMm);
    }
    add('boundary_stud', 'Montant de rive gauche', 'z', 0, width, top - width);
    add('boundary_stud', 'Montant de rive droit', 'z', input.wallLengthMm - width, width, top - width);

    input.openings.forEach((o) => {
      const right = o.xMm + o.widthMm;
      const head = o.sillMm + o.heightMm;
      add('king_stud', 'Montant principal gauche', 'z', o.xMm - 2 * width, width, top - width, o.id);
      add('king_stud', 'Montant principal droit', 'z', right + width, width, top - width, o.id);
      add('jack_stud', 'Montant d’appui gauche', 'z', o.xMm - width, width, head - width, o.id);
      add('jack_stud', 'Montant d’appui droit', 'z', right, width, head - width, o.id);
      for (let layer = 0; layer < headerLayers; layer += 1) {
        add('header', `Linteau conceptuel ${layer + 1}`, 'x', o.xMm - width, head + layer * width, o.widthMm + 2 * width, o.id);
      }
      if (o.type !== 'DOOR') add('sill', 'Traverse d’allège', 'x', o.xMm, o.sillMm - width, o.widthMm, o.id);
    });

    const plan = core.frameLayout.buildGridPlan(input.wallLengthMm, rules.studSpacingMm, option.gridStrategy, input.openings, width);
    plan.centersMm.forEach((center) => {
      const x = center - width / 2;
      if (x < width - 0.001 || x + width > input.wallLengthMm - width + 0.001) return;
      // The full king/jack zone is reserved, including partially overlapping grid members.
      if (input.openings.some((o) => [
        [o.xMm - 2 * width, o.xMm], [o.xMm + o.widthMm, o.xMm + o.widthMm + 2 * width]
      ].some(([start, end]) => x < end - 0.001 && x + width > start + 0.001))) return;
      const cuts = input.openings.filter((o) => x < o.xMm + o.widthMm && x + width > o.xMm)
        .map((o) => ({ start: o.type === 'DOOR' ? 0 : o.sillMm - width, end: o.sillMm + o.heightMm + headerLayers * width, id: o.id }))
        .sort((a, b) => a.start - b.start);
      let start = width;
      cuts.forEach((cut) => {
        add('cripple_stud', 'Montant court sous ouverture', 'z', x, start, cut.start - start, cut.id);
        start = Math.max(start, cut.end);
      });
      add(cuts.length ? 'cripple_stud' : 'common_stud', cuts.length ? 'Montant court supérieur' : 'Montant courant', 'z', x, start, top - start, cuts.at(-1)?.id);
    });
    const centers = [...new Set(context.members.filter((m) => m.axis === 'z').map((m) => core.math.round(m.position.xMm + width / 2, 3)))].sort((a, b) => a - b);
    const bays = centers.slice(1).map((center, i) => core.math.round(center - centers[i], 3));
    const minimum = bays.length ? Math.min(...bays) : 0;
    const maximum = bays.length ? Math.max(...bays) : 0;
    const strategy = core.GRID_STRATEGIES[option.gridStrategy];
    return {
      id: `CAND-${core.math.pad(candidateIndex, 2)}`, frameMaterial: 'TIMBER',
      option: { ...option, gridStrategyLabel: strategy.label, studSpacingMm: rules.studSpacingMm, studProfileId: profile.id, trackProfileId: profile.id },
      layout: {
        strategy: plan.strategy, label: strategy.label, description: strategy.description, targetModuleMm: rules.studSpacingMm,
        zoneCount: plan.zones.length, gridCentersMm: plan.centersMm, actualStudCentersMm: centers,
        actualBaySpacingsMm: bays, minimumBayMm: minimum, maximumBayMm: maximum, spacingSpreadMm: core.math.round(maximum - minimum, 3)
      },
      wall: {
        lengthMm: input.wallLengthMm, heightMm: input.wallHeightMm, sourceThicknessMm: input.wallThicknessMm,
        displayDepthMm: profile.sectionDepthMm, placement: core.math.deepClone(input.placement), openings: core.math.deepClone(input.openings)
      },
      members: context.members, modelStatus: 'TIMBER_CONCEPT_ENGINEERING_REVIEW_REQUIRED',
      reviewItems: [
        'Sections, centres and the two-layer conceptual lintel are not sized for loads.',
        'Bracing, joints, fasteners, moisture and structural capacity require project-specific design.',
        'Timber dimensions, density and price are reference inputs, not confirmed Avelis production data.'
      ]
    };
  }
  core.timberPanelGenerator = { generateCandidate };
})(typeof globalThis !== 'undefined' ? globalThis : window);
