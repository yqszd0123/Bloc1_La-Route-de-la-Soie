(function initLayeredWallModel(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};
  const EPSILON = 1e-6;

  const STAGES = Object.freeze([
    Object.freeze({ id: 'FRAME', number: 1, label: 'Ossature nue', includedLayers: ['FRAME'] }),
    Object.freeze({ id: 'INSULATED', number: 2, label: 'Ossature + isolation', includedLayers: ['FRAME', 'INSULATION'] }),
    Object.freeze({ id: 'LINED', number: 3, label: 'Parois ajoutées', includedLayers: ['FRAME', 'INSULATION', 'EXTERIOR_BOARD', 'INTERIOR_BOARD'] }),
    Object.freeze({ id: 'COMPLETE', number: 4, label: 'Mur assemblé', includedLayers: ['FRAME', 'INSULATION', 'EXTERIOR_BOARD', 'INTERIOR_BOARD', 'EXTERIOR_FINISH', 'INTERIOR_FINISH'] })
  ]);

  const LAYERS = Object.freeze({
    FRAME: Object.freeze({ id: 'FRAME', label: 'Ossature acier générée', color: '#557b6f', side: 'CENTER', displayOrder: 0 }),
    INSULATION: Object.freeze({ id: 'INSULATION', label: 'Isolant biosourcé', color: '#d2aa55', side: 'CENTER', displayOrder: 1 }),
    EXTERIOR_BOARD: Object.freeze({ id: 'EXTERIOR_BOARD', label: 'Panneau extérieur', color: '#6d8f89', side: 'EXTERIOR', displayOrder: 2 }),
    INTERIOR_BOARD: Object.freeze({ id: 'INTERIOR_BOARD', label: 'Parement intérieur', color: '#c9c1b5', side: 'INTERIOR', displayOrder: 2 }),
    EXTERIOR_FINISH: Object.freeze({ id: 'EXTERIOR_FINISH', label: 'Finition extérieure', color: '#b9633c', side: 'EXTERIOR', displayOrder: 3 }),
    INTERIOR_FINISH: Object.freeze({ id: 'INTERIOR_FINISH', label: 'Finition intérieure', color: '#e6ddd0', side: 'INTERIOR', displayOrder: 3 })
  });

  const PART_PREFIX = Object.freeze({
    INSULATION: 'INS', EXTERIOR_BOARD: 'PEXT', INTERIOR_BOARD: 'PINT',
    EXTERIOR_FINISH: 'FEXT', INTERIOR_FINISH: 'FINT'
  });

  function uniqueSorted(values) {
    return Array.from(new Set(values.filter(Number.isFinite).map((value) => core.math.round(value, 6))))
      .sort((left, right) => left - right);
  }

  function clip(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function cloneBounds(bounds) {
    return {
      min: { x: bounds.min.x, y: bounds.min.y, z: bounds.min.z },
      max: { x: bounds.max.x, y: bounds.max.y, z: bounds.max.z }
    };
  }

  function rectangleFromMember(member, wall) {
    return {
      kind: member.material.frameMaterial === 'TIMBER' ? 'TIMBER_MEMBER' : 'STEEL_MEMBER', id: member.id,
      xMin: clip(member.bounds.min.x, 0, wall.lengthMm),
      xMax: clip(member.bounds.max.x, 0, wall.lengthMm),
      zMin: clip(member.bounds.min.z, 0, wall.heightMm),
      zMax: clip(member.bounds.max.z, 0, wall.heightMm)
    };
  }

  function rectangleFromOpening(opening, wall) {
    return {
      kind: 'OPENING', id: opening.id,
      xMin: clip(opening.xMm, 0, wall.lengthMm),
      xMax: clip(opening.xMm + opening.widthMm, 0, wall.lengthMm),
      zMin: clip(opening.sillMm, 0, wall.heightMm),
      zMax: clip(opening.sillMm + opening.heightMm, 0, wall.heightMm)
    };
  }

  function containsPoint(rectangle, x, z) {
    return x > rectangle.xMin + EPSILON && x < rectangle.xMax - EPSILON
      && z > rectangle.zMin + EPSILON && z < rectangle.zMax - EPSILON;
  }

  function projectedObstacles(candidate) {
    const wall = candidate.wall;
    return [
      ...candidate.members.map((member) => rectangleFromMember(member, wall)),
      ...(wall.openings || []).map((opening) => rectangleFromOpening(opening, wall))
    ].filter((rectangle) => rectangle.xMax - rectangle.xMin > EPSILON && rectangle.zMax - rectangle.zMin > EPSILON);
  }

  function cavityRectangles(candidate) {
    const wall = candidate.wall;
    const obstacles = projectedObstacles(candidate);
    const xCuts = uniqueSorted([0, wall.lengthMm, ...obstacles.flatMap((entry) => [entry.xMin, entry.xMax])]);
    const zCuts = uniqueSorted([0, wall.heightMm, ...obstacles.flatMap((entry) => [entry.zMin, entry.zMax])]);
    const completed = [];
    let active = new Map();

    for (let zIndex = 0; zIndex < zCuts.length - 1; zIndex += 1) {
      const zMin = zCuts[zIndex];
      const zMax = zCuts[zIndex + 1];
      const centerZ = (zMin + zMax) / 2;
      const spans = [];
      let span = null;

      for (let xIndex = 0; xIndex < xCuts.length - 1; xIndex += 1) {
        const xMin = xCuts[xIndex];
        const xMax = xCuts[xIndex + 1];
        const centerX = (xMin + xMax) / 2;
        const free = !obstacles.some((obstacle) => containsPoint(obstacle, centerX, centerZ));
        if (free && span && Math.abs(span.xMax - xMin) < EPSILON) {
          span.xMax = xMax;
        } else if (free) {
          span = { xMin, xMax, zMin, zMax };
          spans.push(span);
        } else {
          span = null;
        }
      }

      const next = new Map();
      spans.forEach((entry) => {
        const key = `${entry.xMin}|${entry.xMax}`;
        const previous = active.get(key);
        if (previous && Math.abs(previous.zMax - entry.zMin) < EPSILON) {
          previous.zMax = entry.zMax;
          next.set(key, previous);
        } else {
          next.set(key, entry);
        }
      });
      active.forEach((entry, key) => { if (!next.has(key)) completed.push(entry); });
      active = next;
    }
    active.forEach((entry) => completed.push(entry));

    return completed
      .filter((entry) => entry.xMax - entry.xMin > EPSILON && entry.zMax - entry.zMin > EPSILON)
      .map((entry) => ({
        ...entry,
        widthMm: core.math.round(entry.xMax - entry.xMin, 3),
        heightMm: core.math.round(entry.zMax - entry.zMin, 3),
        areaMm2: core.math.round((entry.xMax - entry.xMin) * (entry.zMax - entry.zMin), 3)
      }))
      .sort((left, right) => left.xMin - right.xMin || left.zMin - right.zMin || left.widthMm - right.widthMm);
  }

  function studDepthMm(candidate) {
    const stud = candidate.members.find((member) => member.profile && ['STUD_C', 'TIMBER_RECTANGLE'].includes(member.profile.family));
    if (!stud) throw new Error('Aucun montant ne permet de déterminer l’épaisseur de l’isolant.');
    return stud.sectionEnvelope.depthMm;
  }

  function cutoutsForWall(wall) {
    return (wall.openings || []).map((opening) => ({
      id: opening.id, type: opening.type, xMm: opening.xMm, zMm: opening.sillMm,
      widthMm: opening.widthMm, heightMm: opening.heightMm,
      areaMm2: opening.widthMm * opening.heightMm
    }));
  }

  function createPart(layer, index, geometry, thicknessMm) {
    const grossAreaMm2 = geometry.widthMm * geometry.heightMm;
    const cutoutAreaMm2 = (geometry.cutouts || []).reduce((sum, cutout) => sum + cutout.areaMm2, 0);
    const netAreaMm2 = grossAreaMm2 - cutoutAreaMm2;
    return {
      id: `${PART_PREFIX[layer.id]}-${String(index + 1).padStart(3, '0')}`,
      layerId: layer.id,
      layerLabel: layer.label,
      referenceProduct: layer.referenceProduct,
      sourceId: layer.sourceId,
      status: 'REFERENCE_PRODUCT_NOT_CONFIRMED_BY_AVELIS',
      geometryType: layer.geometryMode === 'STEEL_CAVITY_RECTANGLES' ? 'RECTANGLE' : 'WALL_CONTOUR_WITH_OPENINGS',
      xMm: geometry.xMin || 0,
      zMm: geometry.zMin || 0,
      widthMm: core.math.round(geometry.widthMm, 3),
      heightMm: core.math.round(geometry.heightMm, 3),
      thicknessMm: core.math.round(thicknessMm, 3),
      cutouts: (geometry.cutouts || []).map((cutout) => ({ ...cutout })),
      grossAreaM2: core.math.round(grossAreaMm2 / 1e6, 6),
      cutoutAreaM2: core.math.round(cutoutAreaMm2 / 1e6, 6),
      netAreaM2: core.math.round(netAreaMm2 / 1e6, 6),
      volumeM3: core.math.round(netAreaMm2 / 1e6 * thicknessMm / 1000, 8)
    };
  }

  function buildPartsSchedule(candidate) {
    if (candidate.frameMaterial === 'TIMBER') return core.timberWallAssembly.buildPartsSchedule(candidate);
    const reference = core.ENGINEERING_DATA.catalog.prototypeLayers;
    if (!(reference && Array.isArray(reference.layers))) throw new Error('Le catalogue des couches de référence n’est pas chargé.');
    const cavityGeometry = cavityRectangles(candidate);
    const cutouts = cutoutsForWall(candidate.wall);
    const selectedStudDepthMm = studDepthMm(candidate);
    const layerSchedules = reference.layers.map((layer) => {
      const thicknessMm = layer.thicknessRule === 'MATCH_SELECTED_STUD_WEB' ? selectedStudDepthMm : layer.referenceThicknessMm;
      const geometries = layer.geometryMode === 'STEEL_CAVITY_RECTANGLES'
        ? cavityGeometry
        : [{ xMin: 0, zMin: 0, widthMm: candidate.wall.lengthMm, heightMm: candidate.wall.heightMm, cutouts }];
      const parts = geometries.map((geometry, index) => createPart(layer, index, geometry, thicknessMm));
      const source = core.ENGINEERING_DATA.sources[layer.sourceId];
      const supported = layer.thicknessRule !== 'MATCH_SELECTED_STUD_WEB'
        || ((source.rawData && source.rawData.supportedThicknessMm) || []).includes(thicknessMm);
      return {
        ...layer,
        thicknessMm,
        thicknessStatus: supported ? 'SOURCE_SUPPORTED_REFERENCE_THICKNESS' : 'PRODUCT_THICKNESS_TO_CONFIRM',
        partCount: parts.length,
        totalNetAreaM2: core.math.round(parts.reduce((sum, part) => sum + part.netAreaM2, 0), 6),
        totalVolumeM3: core.math.round(parts.reduce((sum, part) => sum + part.volumeM3, 0), 8),
        parts
      };
    });
    const parts = layerSchedules.flatMap((layer) => layer.parts);
    const cavityMergedAreaM2 = core.math.round(cavityGeometry.reduce((sum, rectangle) => sum + rectangle.areaMm2, 0) / 1e6, 6);
    return {
      status: reference.status,
      scope: reference.scope,
      layers: layerSchedules,
      parts,
      totals: {
        partCount: parts.length,
        netAreaM2: core.math.round(parts.reduce((sum, part) => sum + part.netAreaM2, 0), 6),
        volumeM3: core.math.round(parts.reduce((sum, part) => sum + part.volumeM3, 0), 8)
      },
      validation: {
        insulationMatchesStudDepth: layerSchedules.find((layer) => layer.id === 'INSULATION').thicknessMm === selectedStudDepthMm,
        cavityRectangleCount: cavityGeometry.length,
        cavityMergedAreaM2,
        sheetCutoutsMatchOpenings: layerSchedules.filter((layer) => layer.geometryMode === 'WALL_CONTOUR_WITH_OPENINGS')
          .every((layer) => layer.parts[0].cutouts.length === cutouts.length)
      }
    };
  }

  function surfaceFromPart(part) {
    return {
      partId: part.id,
      xMin: part.xMm,
      xMax: part.xMm + part.widthMm,
      zMin: part.zMm,
      zMax: part.zMm + part.heightMm,
      cutouts: part.cutouts.map((cutout) => ({ ...cutout }))
    };
  }

  function build(candidate, stageId) {
    if (candidate && candidate.frameMaterial === 'TIMBER') return core.timberWallAssembly.build(candidate, stageId);
    if (!(candidate && candidate.wall && Array.isArray(candidate.members))) {
      throw new Error('Un candidat valide est requis pour la maquette en couches.');
    }
    const stage = STAGES.find((entry) => entry.id === (stageId || 'COMPLETE'));
    if (!stage) throw new Error(`Étape de maquette inconnue : ${stageId}`);
    const partsSchedule = buildPartsSchedule(candidate);

    const layers = stage.includedLayers.map((layerId) => {
      const visual = { ...LAYERS[layerId] };
      if (layerId === 'FRAME' && candidate.frameMaterial === 'TIMBER') { visual.label = 'Ossature bois générée'; visual.color = '#b47b4e'; }
      if (layerId === 'FRAME') {
        return {
          ...visual,
          scope: candidate.frameMaterial === 'TIMBER' ? 'TIMBER_MANUFACTURING_MODEL' : 'STEEL_MANUFACTURING_MODEL',
          members: candidate.members.map((member) => ({ id: member.id, role: member.role, bounds: cloneBounds(member.bounds) })),
          surfaces: [], parts: []
        };
      }
      const schedule = partsSchedule.layers.find((entry) => entry.id === layerId);
      return {
        ...visual,
        scope: 'LAYERED_PROTOTYPE_PART',
        referenceProduct: schedule.referenceProduct,
        sourceId: schedule.sourceId,
        thicknessMm: schedule.thicknessMm,
        thicknessStatus: schedule.thicknessStatus,
        members: [],
        parts: schedule.parts.map((part) => ({ ...part, cutouts: part.cutouts.map((cutout) => ({ ...cutout })) })),
        surfaces: schedule.parts.map(surfaceFromPart)
      };
    });

    return {
      purpose: 'LAYERED_WALL_PROTOTYPE_PART_SCHEDULE',
      frameMaterial: candidate.frameMaterial,
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
      partsSchedule,
      exportPolicy: {
        status: candidate.frameMaterial === 'TIMBER' ? 'PROTOTYPE_PARTS_CSV_SEPARATE_FROM_TIMBER_MANUFACTURING' : 'PROTOTYPE_PARTS_CSV_SEPARATE_FROM_STEEL_MANUFACTURING',
        manufacturingModelUnchanged: true,
        prototypeCsvAvailable: true,
        message: 'Les pièces de couches sont exportées dans un CSV dédié, sans modifier IFC/STEP, la BOM de l’ossature, la liste de débit ou le ZIP de fabrication.'
      }
    };
  }

  function partsCsv(model) {
    return core.serialize.toCsv(model.partsSchedule.parts, [
      { key: 'id', label: 'part_id' }, { key: 'layerId', label: 'layer_id' },
      { key: 'layerLabel', label: 'layer_label' }, { key: 'referenceProduct', label: 'reference_product' },
      { key: 'geometryType', label: 'geometry_type' }, { key: 'xMm', label: 'x_mm' }, { key: 'zMm', label: 'z_mm' },
      ...(model.frameMaterial === 'TIMBER' ? [{key:'yMm',label:'y_mm'},{key:'openingId',label:'opening_id'}] : []),
      { key: 'widthMm', label: 'width_mm' }, { key: 'heightMm', label: 'height_mm' }, { key: 'thicknessMm', label: 'thickness_mm' },
      { key: 'grossAreaM2', label: 'gross_area_m2' }, { key: 'cutoutAreaM2', label: 'cutout_area_m2' },
      { key: 'netAreaM2', label: 'net_area_m2' }, { key: 'volumeM3', label: 'volume_m3' },
      { label: 'cutouts', get: (part) => part.cutouts.map((cutout) => `${cutout.id}:${cutout.xMm},${cutout.zMm},${cutout.widthMm},${cutout.heightMm}`).join('|') },
      { key: 'sourceId', label: 'source_id' }, { key: 'status' }
    ]);
  }

  core.prototypeLayers = {
    STAGES, LAYERS, projectedObstacles, cavityRectangles, buildPartsSchedule, build, partsCsv
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
