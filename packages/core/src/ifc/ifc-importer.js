(function initIfcImporter(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  const WALL_TYPES = new Set(['IFCWALL', 'IFCWALLSTANDARDCASE', 'IFCWALLELEMENTEDCASE']);

  function refId(value) { return value && typeof value.ref === 'number' ? value.ref : null; }
  function listRefs(value) { return Array.isArray(value) ? value.map(refId).filter((id) => id != null) : []; }
  function scalar(value) { return value && typeof value === 'object' && Object.hasOwn(value, 'value') ? scalar(value.value) : value; }
  function numeric(value) { const number = Number(scalar(value)); return Number.isFinite(number) ? number : null; }

  function vector(values, fallback) {
    if (!Array.isArray(values)) return fallback.slice();
    const result = values.map(numeric);
    return fallback.map((defaultValue, index) => result[index] == null ? defaultValue : result[index]);
  }

  function normalize(value, fallback) {
    const length = Math.hypot(...value);
    return length > 1e-12 ? value.map((entry) => entry / length) : fallback.slice();
  }

  function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  function identity() {
    return [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
  }

  function multiply(a, b) {
    return a.map((row, r) => row.map((_, c) => row.reduce((sum, entry, k) => sum + entry * b[k][c], 0)));
  }

  function inverseRigid(matrix) {
    const result = identity();
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) result[row][col] = matrix[col][row];
    }
    const translation = [matrix[0][3], matrix[1][3], matrix[2][3]];
    for (let row = 0; row < 3; row += 1) {
      result[row][3] = -(result[row][0] * translation[0] + result[row][1] * translation[1] + result[row][2] * translation[2]);
    }
    return result;
  }

  function pointRecord(model, reference) {
    const record = model.get(reference);
    return record && record.type === 'IFCCARTESIANPOINT' ? vector(record.args[0], [0, 0, 0]) : [0, 0, 0];
  }

  function directionRecord(model, reference, fallback) {
    const record = model.get(reference);
    return record && record.type === 'IFCDIRECTION' ? normalize(vector(record.args[0], fallback), fallback) : fallback.slice();
  }

  function axisPlacementMatrix(model, reference) {
    const record = model.get(reference);
    if (!record) return identity();
    if (record.type === 'IFCAXIS2PLACEMENT2D') {
      const location2d = pointRecord(model, record.args[0]);
      const x2d = directionRecord(model, record.args[1], [1, 0]);
      const x = normalize([x2d[0], x2d[1], 0], [1, 0, 0]);
      const z = [0, 0, 1];
      const y = normalize(cross(z, x), [0, 1, 0]);
      return [[x[0], y[0], z[0], location2d[0]], [x[1], y[1], z[1], location2d[1]], [x[2], y[2], z[2], location2d[2] || 0], [0, 0, 0, 1]];
    }
    if (record.type !== 'IFCAXIS2PLACEMENT3D') return identity();
    const location = pointRecord(model, record.args[0]);
    const z = directionRecord(model, record.args[1], [0, 0, 1]);
    let x = directionRecord(model, record.args[2], [1, 0, 0]);
    const y = normalize(cross(z, x), [0, 1, 0]);
    x = normalize(cross(y, z), [1, 0, 0]);
    return [[x[0], y[0], z[0], location[0]], [x[1], y[1], z[1], location[1]], [x[2], y[2], z[2], location[2]], [0, 0, 0, 1]];
  }

  function placementMatrix(model, reference, cache, stack) {
    const id = refId(reference);
    if (id == null) return identity();
    if (cache.has(id)) return cache.get(id);
    if (stack.has(id)) throw new Error(`Cyclic IfcLocalPlacement at #${id}.`);
    stack.add(id);
    const record = model.get(id);
    if (!record || record.type !== 'IFCLOCALPLACEMENT') return identity();
    const parent = placementMatrix(model, record.args[0], cache, stack);
    const local = axisPlacementMatrix(model, record.args[1]);
    const result = multiply(parent, local);
    cache.set(id, result);
    stack.delete(id);
    return result;
  }

  function unitInfo(model) {
    const project = model.byType('IFCPROJECT')[0];
    const assignment = project && model.get(project.args[8]);
    const unitRecords = assignment && assignment.type === 'IFCUNITASSIGNMENT' ? listRefs(assignment.args[0]).map((id) => model.get(id)) : [];
    const length = unitRecords.find((record) => record && record.type === 'IFCSIUNIT' && record.args[1] === 'LENGTHUNIT');
    if (!length) throw new Error('IFC length unit is missing or unsupported.');
    const prefix = length.args[2] || null;
    const name = length.args[3];
    if (name !== 'METRE') throw new Error(`Unsupported IFC length SI unit: ${name}.`);
    const prefixToMetre = { EXA: 1e18, PETA: 1e15, TERA: 1e12, GIGA: 1e9, MEGA: 1e6, KILO: 1e3, HECTO: 1e2, DECA: 1e1, DECI: 1e-1, CENTI: 1e-2, MILLI: 1e-3, MICRO: 1e-6, NANO: 1e-9 };
    const metres = prefix == null ? 1 : prefixToMetre[prefix];
    if (metres == null) throw new Error(`Unsupported IFC SI prefix: ${prefix}.`);
    return { unitType: 'LENGTHUNIT', name: prefix ? `${prefix}METRE` : 'METRE', factorToMm: metres * 1000, sourceEntityId: length.id };
  }

  function polylineBounds(model, reference) {
    const polyline = model.get(reference);
    if (!polyline || polyline.type !== 'IFCPOLYLINE') return null;
    const points = listRefs(polyline.args[0]).map((id) => pointRecord(model, { ref: id }));
    if (!points.length) return null;
    return {
      minX: Math.min(...points.map((point) => point[0])), maxX: Math.max(...points.map((point) => point[0])),
      minY: Math.min(...points.map((point) => point[1])), maxY: Math.max(...points.map((point) => point[1]))
    };
  }

  function profileBounds(model, reference) {
    const profile = model.get(reference);
    if (!profile) return null;
    if (profile.type === 'IFCARBITRARYCLOSEDPROFILEDEF') return polylineBounds(model, profile.args[2]);
    if (profile.type === 'IFCRECTANGLEPROFILEDEF') {
      const width = numeric(profile.args[3]);
      const height = numeric(profile.args[4]);
      if (width == null || height == null) return null;
      return { minX: -width / 2, maxX: width / 2, minY: -height / 2, maxY: height / 2 };
    }
    return null;
  }

  function productBodySolid(model, product) {
    const definition = model.get(product.args[6]);
    if (!definition || definition.type !== 'IFCPRODUCTDEFINITIONSHAPE') return null;
    const representations = listRefs(definition.args[2]).map((id) => model.get(id)).filter(Boolean);
    const body = representations.find((record) => record.type === 'IFCSHAPEREPRESENTATION' && String(record.args[1]).toUpperCase() === 'BODY');
    if (!body) return null;
    const items = listRefs(body.args[3]).map((id) => model.get(id)).filter(Boolean);
    const solid = items.find((record) => record.type === 'IFCEXTRUDEDAREASOLID');
    if (!solid) return null;
    const bounds = profileBounds(model, solid.args[0]);
    const depth = numeric(solid.args[3]);
    if (!bounds || depth == null) return null;
    return { entityId: solid.id, bounds, depth };
  }

  function productPlacement(model, product, cache) {
    return placementMatrix(model, product.args[5], cache, new Set());
  }

  function productIdentity(record) {
    return { entityId: record.id, entityType: record.type, guid: record.args[0] || null, name: record.args[2] || `${record.type} #${record.id}` };
  }

  function parseIfc(text) {
    const model = core.ifcStep.parse(text);
    if (!/^IFC(2X3|4)/.test(model.schema)) throw new Error(`Unsupported IFC schema: ${model.schema}.`);
    const unit = unitInfo(model);
    const factor = unit.factorToMm;
    const placementCache = new Map();
    const warnings = [];
    const projectRecord = model.byType('IFCPROJECT')[0];
    const project = projectRecord ? productIdentity(projectRecord) : { entityId: null, entityType: 'IFCPROJECT', guid: null, name: 'IFC Project' };

    const aggregateParent = new Map();
    model.byType('IFCRELAGGREGATES').forEach((relation) => {
      const parentId = refId(relation.args[4]);
      listRefs(relation.args[5]).forEach((childId) => aggregateParent.set(childId, parentId));
    });
    const spatialContainer = new Map();
    model.byType('IFCRELCONTAINEDINSPATIALSTRUCTURE').forEach((relation) => {
      const containerId = refId(relation.args[5]);
      listRefs(relation.args[4]).forEach((elementId) => spatialContainer.set(elementId, containerId));
    });
    const openingByWall = new Map();
    model.byType('IFCRELVOIDSELEMENT').forEach((relation) => {
      const wallId = refId(relation.args[4]);
      const openingId = refId(relation.args[5]);
      if (wallId != null && openingId != null) {
        if (!openingByWall.has(wallId)) openingByWall.set(wallId, []);
        openingByWall.get(wallId).push(openingId);
      }
    });
    const fillerByOpening = new Map();
    model.byType('IFCRELFILLSELEMENT').forEach((relation) => {
      const openingId = refId(relation.args[4]);
      const fillerId = refId(relation.args[5]);
      if (openingId != null && fillerId != null) fillerByOpening.set(openingId, fillerId);
    });

    const buildings = model.byType('IFCBUILDING').map((record) => Object.assign(productIdentity(record), { storeyIds: [] }));
    const buildingById = new Map(buildings.map((entry) => [entry.entityId, entry]));
    const storeys = model.byType('IFCBUILDINGSTOREY').map((record) => {
      const item = Object.assign(productIdentity(record), {
        buildingId: aggregateParent.get(record.id) || null,
        elevationMm: numeric(record.args[9]) == null ? null : numeric(record.args[9]) * factor,
        wallIds: []
      });
      const building = buildingById.get(item.buildingId);
      if (building) building.storeyIds.push(item.entityId);
      return item;
    });
    const storeyById = new Map(storeys.map((entry) => [entry.entityId, entry]));

    const walls = Array.from(model.records.values()).filter((record) => WALL_TYPES.has(record.type)).map((record) => {
      const solid = productBodySolid(model, record);
      if (!solid) {
        warnings.push({ code: 'UNSUPPORTED_WALL_GEOMETRY', entityId: record.id, message: 'Wall has no supported Body/IfcExtrudedAreaSolid representation.' });
        return null;
      }
      const wallWorld = productPlacement(model, record, placementCache);
      const wallInverse = inverseRigid(wallWorld);
      const wallIdentity = productIdentity(record);
      const storeyId = spatialContainer.get(record.id) || null;
      const openingRecords = (openingByWall.get(record.id) || []).map((id) => model.get(id)).filter(Boolean);
      const openings = openingRecords.map((openingRecord, index) => {
        const openingSolid = productBodySolid(model, openingRecord);
        if (!openingSolid) {
          warnings.push({ code: 'UNSUPPORTED_OPENING_GEOMETRY', entityId: openingRecord.id, message: 'Opening has no supported Body/IfcExtrudedAreaSolid representation.' });
          return null;
        }
        const openingWorld = productPlacement(model, openingRecord, placementCache);
        const relative = multiply(wallInverse, openingWorld);
        const filler = model.get(fillerByOpening.get(openingRecord.id));
        const type = filler && filler.type === 'IFCDOOR' ? 'DOOR' : filler && filler.type === 'IFCWINDOW' ? 'WINDOW' : 'OPENING';
        const widthMm = (openingSolid.bounds.maxX - openingSolid.bounds.minX) * factor;
        const heightMm = openingSolid.depth * factor;
        return {
          id: `${type}-${core.math.pad(index + 1, 2)}`,
          guid: openingRecord.args[0] || null,
          type,
          xMm: core.math.round(relative[0][3] * factor + openingSolid.bounds.minX * factor, 3),
          sillMm: core.math.round(relative[2][3] * factor, 3),
          widthMm: core.math.round(widthMm, 3),
          heightMm: core.math.round(heightMm, 3),
          source: 'IFC',
          sourceRef: { openingEntityId: openingRecord.id, fillerEntityId: filler ? filler.id : null, fillerType: filler ? filler.type : null }
        };
      }).filter(Boolean);
      const wall = Object.assign(wallIdentity, {
        storeyId,
        lengthMm: core.math.round((solid.bounds.maxX - solid.bounds.minX) * factor, 3),
        thicknessMm: core.math.round((solid.bounds.maxY - solid.bounds.minY) * factor, 3),
        heightMm: core.math.round(solid.depth * factor, 3),
        placement: {
          xMm: core.math.round(wallWorld[0][3] * factor, 3),
          yMm: core.math.round(wallWorld[1][3] * factor, 3),
          zMm: core.math.round(wallWorld[2][3] * factor, 3),
          rotationDeg: core.math.round(Math.atan2(wallWorld[1][0], wallWorld[0][0]) * 180 / Math.PI, 4)
        },
        openings
      });
      const storey = storeyById.get(storeyId);
      if (storey) storey.wallIds.push(wall.entityId);
      return wall;
    }).filter(Boolean);

    if (!walls.length) throw new Error('No supported IfcWall geometry was found.');
    return {
      schema: model.schema,
      unit,
      project,
      buildings,
      storeys,
      walls,
      warnings,
      entityCount: model.records.size,
      sourceFingerprint: core.math.hash32(text)
    };
  }

  function inputFromWall(ifcModel, wallEntityId, baseInput) {
    const wall = ifcModel.walls.find((entry) => entry.entityId === Number(wallEntityId)) || ifcModel.walls[0];
    if (!wall) throw new Error('IFC wall selection is empty.');
    const projectName = core.math.slug(ifcModel.project.name || 'ifc-project').toUpperCase() || 'IFC-PROJECT';
    return Object.assign({}, core.DEFAULT_INPUT, baseInput || {}, {
      sourceMode: 'IFC',
      projectId: projectName,
      typology: 'IFC',
      wallId: `IFC-WALL-${wall.entityId}`,
      wallGuid: wall.guid,
      wallLengthMm: wall.lengthMm,
      wallHeightMm: wall.heightMm,
      wallThicknessMm: wall.thicknessMm,
      placement: wall.placement,
      openings: core.math.deepClone(wall.openings),
      ifcContext: {
        schema: ifcModel.schema,
        sourceFingerprint: ifcModel.sourceFingerprint,
        projectEntityId: ifcModel.project.entityId,
        wallEntityId: wall.entityId,
        storeyEntityId: wall.storeyId,
        lengthUnit: ifcModel.unit,
        parser: 'AVELIS_IFC_STEP_SUBSET_V2',
        limitations: 'Supports IFC2x3/IFC4 walls and openings represented by local placements plus Body/IfcExtrudedAreaSolid with polyline or rectangle profiles.'
      }
    });
  }

  core.ifcImporter = { parseIfc, inputFromWall, multiply, inverseRigid };
})(typeof globalThis !== 'undefined' ? globalThis : window);
