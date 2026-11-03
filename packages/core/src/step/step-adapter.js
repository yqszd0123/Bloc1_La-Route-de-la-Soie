(function initStepAdapter(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};
  const AXES = Object.freeze(['X', 'Y', 'Z']);

  function numericPositions(mesh) {
    const values = mesh && mesh.attributes && mesh.attributes.position && mesh.attributes.position.array;
    if (!values || typeof values.length !== 'number' || values.length % 3 !== 0) return [];
    return Array.from(values, Number).filter(Number.isFinite);
  }

  function modelFromOcct(result, fileName) {
    if (!result || result.success !== true || !Array.isArray(result.meshes) || !result.meshes.length) {
      throw new Error('Le fichier STEP n’a produit aucun maillage exploitable.');
    }
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    let vertexCount = 0;
    result.meshes.forEach((mesh) => {
      const positions = numericPositions(mesh);
      vertexCount += positions.length / 3;
      for (let index = 0; index < positions.length; index += 3) {
        for (let axis = 0; axis < 3; axis += 1) {
          min[axis] = Math.min(min[axis], positions[index + axis]);
          max[axis] = Math.max(max[axis], positions[index + axis]);
        }
      }
    });
    if (!vertexCount || min.some((value) => !Number.isFinite(value)) || max.some((value) => !Number.isFinite(value))) {
      throw new Error('Le maillage STEP ne contient pas de coordonnées 3D valides.');
    }
    const dimensionsMm = {
      X: core.math.round(max[0] - min[0], 3),
      Y: core.math.round(max[1] - min[1], 3),
      Z: core.math.round(max[2] - min[2], 3)
    };
    if (Object.values(dimensionsMm).some((value) => value <= 0)) {
      throw new Error('L’enveloppe STEP doit avoir trois dimensions strictement positives.');
    }
    const fingerprintSource = `${fileName || 'STEP'}|${result.meshes.length}|${vertexCount}|${AXES.map((axis) => dimensionsMm[axis]).join('|')}`;
    return {
      format: 'ISO 10303-21 STEP',
      parser: 'occt-import-js 0.0.23 / Open CASCADE Technology',
      fileName: fileName || 'model.step',
      unit: { name: 'millimetre', symbol: 'mm', factorToMm: 1 },
      meshCount: result.meshes.length,
      vertexCount,
      boundsMm: { min: { X: min[0], Y: min[1], Z: min[2] }, max: { X: max[0], Y: max[1], Z: max[2] } },
      dimensionsMm,
      sourceFingerprint: core.math.hash32(fingerprintSource),
      warnings: [
        'STEP ne porte pas les relations sémantiques IFC mur/ouverture : seule l’enveloppe géométrique est convertie.',
        'Les axes longueur/hauteur/épaisseur doivent être confirmés par l’utilisateur.',
        'Les perçages, assemblages, tôles dépliées et opérations machine ne sont pas déduits.'
      ]
    };
  }

  function inputFromModel(model, mapping, overrides) {
    if (!model || !model.dimensionsMm) throw new Error('Modèle STEP absent.');
    const axes = Object.assign({ length: 'X', height: 'Z', thickness: 'Y' }, mapping || {});
    const selected = [axes.length, axes.height, axes.thickness].map((axis) => String(axis || '').toUpperCase());
    if (selected.some((axis) => !AXES.includes(axis)) || new Set(selected).size !== 3) {
      throw new Error('Les axes STEP longueur, hauteur et épaisseur doivent être X, Y et Z sans doublon.');
    }
    const base = {
      sourceMode: 'STEP',
      projectId: 'AVELIS-STEP',
      typology: 'STEP_ENVELOPE_REFERENCE',
      wallId: core.math.slug(model.fileName).toUpperCase() || 'STEP-WALL',
      wallLengthMm: model.dimensionsMm[selected[0]],
      wallHeightMm: model.dimensionsMm[selected[1]],
      wallThicknessMm: model.dimensionsMm[selected[2]],
      openings: [],
      stepContext: {
        fileName: model.fileName,
        format: model.format,
        parser: model.parser,
        sourceFingerprint: model.sourceFingerprint,
        meshCount: model.meshCount,
        vertexCount: model.vertexCount,
        dimensionsMm: core.math.deepClone(model.dimensionsMm),
        axisMapping: { length: selected[0], height: selected[1], thickness: selected[2] },
        conversionMode: 'BOUNDING_BOX_ENVELOPE',
        warnings: model.warnings.slice()
      }
    };
    return Object.assign(base, overrides || {}, { sourceMode: 'STEP', stepContext: base.stepContext });
  }

  core.stepAdapter = { AXES, modelFromOcct, inputFromModel };
})(typeof globalThis !== 'undefined' ? globalThis : window);
