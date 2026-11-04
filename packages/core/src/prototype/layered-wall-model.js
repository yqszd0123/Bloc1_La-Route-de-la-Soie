(function initLayeredWallModel(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  const STAGES = Object.freeze([
    Object.freeze({ id: 'FRAME', number: 1, label: 'Ossature nue', includedLayers: ['FRAME'] }),
    Object.freeze({ id: 'INSULATED', number: 2, label: 'Ossature + isolation', includedLayers: ['FRAME', 'INSULATION'] }),
    Object.freeze({ id: 'LINED', number: 3, label: 'Parois ajoutées', includedLayers: ['FRAME', 'INSULATION', 'EXTERIOR_BOARD', 'INTERIOR_BOARD'] }),
    Object.freeze({ id: 'COMPLETE', number: 4, label: 'Mur assemblé', includedLayers: ['FRAME', 'INSULATION', 'EXTERIOR_BOARD', 'INTERIOR_BOARD', 'EXTERIOR_FINISH', 'INTERIOR_FINISH'] })
  ]);

  const LAYERS = Object.freeze({
    FRAME: Object.freeze({
      id: 'FRAME', label: 'Ossature acier générée', color: '#557b6f', side: 'CENTER', displayOrder: 0,
      source: 'GENERATED_STEEL_MODEL', displayOnly: false, exportedByManufacturingWorkflow: true
    }),
    INSULATION: Object.freeze({
      id: 'INSULATION', label: 'Échantillon d’isolation à confirmer', color: '#d2aa55', side: 'CENTER', displayOrder: 1,
      source: 'PEDAGOGICAL_SAMPLE_TO_CONFIRM', displayOnly: true, exportedByManufacturingWorkflow: false
    }),
    EXTERIOR_BOARD: Object.freeze({
      id: 'EXTERIOR_BOARD', label: 'Panneau extérieur témoin à confirmer', color: '#6d8f89', side: 'EXTERIOR', displayOrder: 2,
      source: 'PEDAGOGICAL_SAMPLE_TO_CONFIRM', displayOnly: true, exportedByManufacturingWorkflow: false
    }),
    INTERIOR_BOARD: Object.freeze({
      id: 'INTERIOR_BOARD', label: 'Parement intérieur témoin à confirmer', color: '#c9c1b5', side: 'INTERIOR', displayOrder: 2,
      source: 'PEDAGOGICAL_SAMPLE_TO_CONFIRM', displayOnly: true, exportedByManufacturingWorkflow: false
    }),
    EXTERIOR_FINISH: Object.freeze({
      id: 'EXTERIOR_FINISH', label: 'Finition extérieure de démonstration', color: '#b9633c', side: 'EXTERIOR', displayOrder: 3,
      source: 'PEDAGOGICAL_SAMPLE_TO_CONFIRM', displayOnly: true, exportedByManufacturingWorkflow: false
    }),
    INTERIOR_FINISH: Object.freeze({
      id: 'INTERIOR_FINISH', label: 'Finition intérieure de démonstration', color: '#e6ddd0', side: 'INTERIOR', displayOrder: 3,
      source: 'PEDAGOGICAL_SAMPLE_TO_CONFIRM', displayOnly: true, exportedByManufacturingWorkflow: false
    })
  });

  function uniqueSorted(values) {
    return Array.from(new Set(values.filter(Number.isFinite))).sort((left, right) => left - right);
  }

  function pointInsideOpening(x, z, opening) {
    return x > opening.xMm && x < opening.xMm + opening.widthMm
      && z > opening.sillMm && z < opening.sillMm + opening.heightMm;
  }

  function surfaceCells(wall) {
    const openings = wall.openings || [];
    const xCuts = uniqueSorted([0, wall.lengthMm, ...openings.flatMap((opening) => [opening.xMm, opening.xMm + opening.widthMm])]);
    const zCuts = uniqueSorted([0, wall.heightMm, ...openings.flatMap((opening) => [opening.sillMm, opening.sillMm + opening.heightMm])]);
    const cells = [];

    for (let xIndex = 0; xIndex < xCuts.length - 1; xIndex += 1) {
      for (let zIndex = 0; zIndex < zCuts.length - 1; zIndex += 1) {
        const xMin = xCuts[xIndex];
        const xMax = xCuts[xIndex + 1];
        const zMin = zCuts[zIndex];
        const zMax = zCuts[zIndex + 1];
        if (xMax <= xMin || zMax <= zMin) continue;
        const centerX = (xMin + xMax) / 2;
        const centerZ = (zMin + zMax) / 2;
        if (openings.some((opening) => pointInsideOpening(centerX, centerZ, opening))) continue;
        cells.push({ xMin, xMax, zMin, zMax, areaMm2: (xMax - xMin) * (zMax - zMin) });
      }
    }
    return cells;
  }

  function cloneBounds(bounds) {
    return {
      min: { x: bounds.min.x, y: bounds.min.y, z: bounds.min.z },
      max: { x: bounds.max.x, y: bounds.max.y, z: bounds.max.z }
    };
  }

  function build(candidate, stageId) {
    if (!(candidate && candidate.wall && Array.isArray(candidate.members))) {
      throw new Error('Un candidat acier valide est requis pour la maquette en couches.');
    }
    const stage = STAGES.find((entry) => entry.id === (stageId || 'COMPLETE'));
    if (!stage) throw new Error(`Étape de maquette inconnue : ${stageId}`);

    const cells = surfaceCells(candidate.wall);
    const layers = stage.includedLayers.map((layerId) => {
      const definition = LAYERS[layerId];
      return {
        ...definition,
        members: layerId === 'FRAME'
          ? candidate.members.map((member) => ({ id: member.id, role: member.role, bounds: cloneBounds(member.bounds) }))
          : [],
        surfaces: layerId === 'FRAME' ? [] : cells.map((cell) => ({ ...cell }))
      };
    });

    return {
      purpose: 'PEDAGOGICAL_LAYERED_WALL_VISUALISATION',
      stage: { ...stage, includedLayers: [...stage.includedLayers] },
      wall: {
        id: candidate.wall.id,
        lengthMm: candidate.wall.lengthMm,
        heightMm: candidate.wall.heightMm,
        sourceThicknessMm: candidate.wall.sourceThicknessMm,
        displayDepthMm: candidate.wall.displayDepthMm,
        openings: (candidate.wall.openings || []).map((opening) => ({ ...opening }))
      },
      layers,
      exportPolicy: {
        status: 'DEMONSTRATION_ONLY_NOT_EXPORTED',
        manufacturingModelUnchanged: true,
        displayOnlyLayerIds: layers.filter((layer) => layer.displayOnly).map((layer) => layer.id),
        message: 'Les couches pédagogiques ne sont incluses ni dans IFC/STEP, ni dans la BOM, la liste de débit ou le ZIP.'
      }
    };
  }

  core.prototypeLayers = { STAGES, LAYERS, surfaceCells, build };
})(typeof globalThis !== 'undefined' ? globalThis : window);
