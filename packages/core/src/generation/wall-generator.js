(function initWallGenerator(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};
  const createMember = (...args) => core.memberFactory.createMember(...args);

  function addVertical(context, role, label, xMm, zMm, lengthMm, source, openingId) {
    if (lengthMm <= 0) return null;
    return createMember(context, { role, label, axis: 'z', xMm, zMm, lengthMm, source, openingId });
  }

  function addHorizontal(context, role, label, xMm, zMm, lengthMm, source, openingId) {
    if (lengthMm <= 0) return null;
    return createMember(context, { role, label, axis: 'x', xMm, zMm, lengthMm, source, openingId });
  }

  function collidesWithReservedStud(x, reserved, tolerance) {
    return reserved.some((value) => Math.abs(value - x) <= tolerance);
  }

  function gridPositions(wallLength, spacing, offset, sectionWidth) {
    const positions = [];
    let x = offset;
    while (x < sectionWidth) x += spacing;
    while (x <= wallLength - sectionWidth) {
      positions.push(core.math.round(x, 3));
      x += spacing;
    }
    return positions;
  }

  function frameGeometry(opening, sectionWidth) {
    const left = opening.xMm;
    const right = opening.xMm + opening.widthMm;
    return {
      opening,
      left,
      right,
      bottom: opening.sillMm,
      top: opening.sillMm + opening.heightMm,
      kingLeft: left - 2 * sectionWidth,
      jackLeft: left - sectionWidth,
      jackRight: right,
      kingRight: right + sectionWidth
    };
  }

  function addBottomPlate(context, wallLength, door) {
    if (!door) {
      addHorizontal(context, 'bottom_plate', 'Lisse basse', 0, 0, wallLength, 'ENVELOPE');
      return;
    }
    const doorRight = door.xMm + door.widthMm;
    addHorizontal(context, 'bottom_plate', 'Lisse basse gauche (porte)', 0, 0, door.xMm, 'DOOR_FRAME', door.id);
    addHorizontal(context, 'bottom_plate', 'Lisse basse droite (porte)', doorRight, 0, wallLength - doorRight, 'DOOR_FRAME', door.id);
  }

  function addOpeningFrame(context, frame, option, fullStudZ, fullStudLength, sectionWidth) {
    const opening = frame.opening;
    const kind = opening.type === 'DOOR' ? 'porte' : 'fenêtre';
    const source = opening.type === 'DOOR' ? 'DOOR_FRAME' : 'WINDOW_FRAME';
    addVertical(context, 'king_stud', `Montant maître gauche — ${kind}`, frame.kingLeft, fullStudZ, fullStudLength, source, opening.id);
    addVertical(context, 'jack_stud', `Montant d’appui gauche — ${kind}`, frame.jackLeft, fullStudZ, frame.top - fullStudZ, source, opening.id);
    addVertical(context, 'jack_stud', `Montant d’appui droit — ${kind}`, frame.jackRight, fullStudZ, frame.top - fullStudZ, source, opening.id);
    addVertical(context, 'king_stud', `Montant maître droit — ${kind}`, frame.kingRight, fullStudZ, fullStudLength, source, opening.id);

    if (opening.type === 'WINDOW') {
      addHorizontal(context, 'sill', 'Traverse d’appui — fenêtre', frame.left, frame.bottom - sectionWidth, opening.widthMm, source, opening.id);
    }
    for (let layer = 0; layer < option.headerLayers; layer += 1) {
      addHorizontal(
        context,
        'header',
        `Linteau ${layer + 1} — ${kind}`,
        frame.left - sectionWidth,
        frame.top + layer * sectionWidth,
        opening.widthMm + 2 * sectionWidth,
        source,
        opening.id
      );
    }
  }

  function addGridStud(context, x, frames, option, fullStudZ, fullStudLength, topPlateStart, sectionWidth) {
    const protectedFrame = frames.find((frame) => x > frame.kingLeft - sectionWidth && x < frame.kingRight + sectionWidth);
    if (!protectedFrame) {
      addVertical(context, 'common_stud', 'Montant courant', x, fullStudZ, fullStudLength, 'GRID');
      return;
    }

    if (x < protectedFrame.left || x > protectedFrame.right - sectionWidth) return;
    const opening = protectedFrame.opening;
    const source = opening.type === 'DOOR' ? 'DOOR_GRID' : 'WINDOW_GRID';
    if (opening.type === 'WINDOW') {
      const lowerLength = protectedFrame.bottom - 2 * sectionWidth;
      addVertical(context, 'cripple_stud', 'Montant d’allège — fenêtre', x, fullStudZ, lowerLength, source, opening.id);
    }
    const upperZ = protectedFrame.top + option.headerLayers * sectionWidth;
    const upperLength = topPlateStart - upperZ;
    addVertical(context, 'cripple_stud', `Montant haut — ${opening.type === 'DOOR' ? 'porte' : 'fenêtre'}`, x, upperZ, upperLength, source, opening.id);
  }

  function generateWallCandidate(input, rules, option, candidateIndex) {
    const context = { input, rules, members: [] };
    const w = rules.sectionWidthMm;
    const wallLength = input.wallLengthMm;
    const wallHeight = input.wallHeightMm;
    const fullStudZ = w;
    const topPlateStart = wallHeight - 2 * w;
    const fullStudLength = topPlateStart - fullStudZ;
    const openings = core.project.createOpenings(input);
    const frames = openings.map((opening) => frameGeometry(opening, w));
    const door = openings.find((opening) => opening.type === 'DOOR');

    addBottomPlate(context, wallLength, door);
    addHorizontal(context, 'top_plate', 'Lisse haute 1', 0, wallHeight - 2 * w, wallLength, 'ENVELOPE');
    addHorizontal(context, 'top_plate', 'Lisse haute 2', 0, wallHeight - w, wallLength, 'ENVELOPE');

    addVertical(context, 'boundary_stud', 'Montant de rive gauche', 0, fullStudZ, fullStudLength, 'ENVELOPE');
    addVertical(context, 'boundary_stud', 'Montant de rive droit', wallLength - w, fullStudZ, fullStudLength, 'ENVELOPE');
    frames.forEach((frame) => addOpeningFrame(context, frame, option, fullStudZ, fullStudLength, w));

    const reserved = [0, wallLength - w];
    frames.forEach((frame) => reserved.push(frame.kingLeft, frame.jackLeft, frame.jackRight, frame.kingRight));
    gridPositions(wallLength, option.studSpacingMm, option.gridOffsetMm, w).forEach((x) => {
      if (collidesWithReservedStud(x, reserved, w * 0.75)) return;
      addGridStud(context, x, frames, option, fullStudZ, fullStudLength, topPlateStart, w);
    });

    return {
      id: `CAND-${core.math.pad(candidateIndex, 2)}`,
      option: core.math.deepClone(option),
      wall: {
        lengthMm: wallLength,
        heightMm: wallHeight,
        depthMm: rules.sectionDepthMm,
        openings: core.math.deepClone(openings)
      },
      members: context.members,
      assumptions: [
        'Ossature de démonstration : sections, entraxes et encadrements à valider par Avelis et un ingénieur qualifié.',
        'Assemblages, contreventement, charges, feu, acoustique et humidité hors du moteur de validation.',
        `Tolérance de fabrication supposée : ±${rules.manufacturingToleranceMm} mm.`
      ]
    };
  }

  core.wallGenerator = { generateWallCandidate, gridPositions, frameGeometry };
})(typeof globalThis !== 'undefined' ? globalThis : window);
