(function initStepExport(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};
  const BOX_EDGES = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7]
  ];
  const BOX_FACES = [
    { origin: 0, normal: [0, 0, -1], reference: [1, 0, 0], edges: [[3, false], [2, false], [1, false], [0, false]] },
    { origin: 4, normal: [0, 0, 1], reference: [1, 0, 0], edges: [[4, true], [5, true], [6, true], [7, true]] },
    { origin: 0, normal: [0, -1, 0], reference: [1, 0, 0], edges: [[0, true], [9, true], [4, false], [8, false]] },
    { origin: 3, normal: [0, 1, 0], reference: [1, 0, 0], edges: [[11, true], [6, false], [10, false], [2, true]] },
    { origin: 0, normal: [-1, 0, 0], reference: [0, 1, 0], edges: [[8, true], [7, false], [11, false], [3, true]] },
    { origin: 1, normal: [1, 0, 0], reference: [0, 1, 0], edges: [[1, true], [10, true], [5, false], [9, false]] }
  ];

  function stepString(value) {
    return `'${String(value == null ? '' : value).replace(/'/g, "''").replace(/[^\x20-\x7E]/g, '_')}'`;
  }

  function stepNumber(value) {
    if (!Number.isFinite(Number(value))) throw new Error('STEP coordinates must be finite numbers.');
    let encoded = Number(value).toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
    if (!encoded.includes('.')) encoded += '.0';
    return encoded === '-0.0' ? '0.0' : encoded;
  }

  function isoTimestamp(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) throw new Error('STEP timestamp is invalid.');
    return date.toISOString().replace(/\.\d{3}Z$/, '');
  }

  function boxVertices(bounds) {
    if (!bounds || !bounds.min || !bounds.max) throw new Error('A member has no STEP-exportable bounds.');
    const { min, max } = bounds;
    if (!(max.x > min.x && max.y > min.y && max.z > min.z)) {
      throw new Error('A STEP solid must have strictly positive X, Y and Z dimensions.');
    }
    return [
      [min.x, min.y, min.z], [max.x, min.y, min.z], [max.x, max.y, min.z], [min.x, max.y, min.z],
      [min.x, min.y, max.z], [max.x, min.y, max.z], [max.x, max.y, max.z], [min.x, max.y, max.z]
    ];
  }

  function entityWriter() {
    const records = [];
    return {
      add(expression) {
        const id = records.length + 1;
        records.push(`#${id}=${expression};`);
        return id;
      },
      reference(id) { return `#${id}`; },
      records() { return records.slice(); }
    };
  }

  function addDirection(writer, values) {
    return writer.add(`DIRECTION('',(${values.map(stepNumber).join(',')}))`);
  }

  function addManifoldBox(writer, member) {
    const coordinates = boxVertices(member.bounds);
    const points = coordinates.map((point) => writer.add(
      `CARTESIAN_POINT('',(${point.map(stepNumber).join(',')}))`
    ));
    const vertices = points.map((point) => writer.add(`VERTEX_POINT('',${writer.reference(point)})`));
    const edges = BOX_EDGES.map(([startIndex, endIndex]) => {
      const start = coordinates[startIndex];
      const end = coordinates[endIndex];
      const length = Math.hypot(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
      const direction = addDirection(writer, [
        (end[0] - start[0]) / length,
        (end[1] - start[1]) / length,
        (end[2] - start[2]) / length
      ]);
      const vector = writer.add(`VECTOR('',${writer.reference(direction)},1.0)`);
      const line = writer.add(`LINE('',${writer.reference(points[startIndex])},${writer.reference(vector)})`);
      return writer.add(`EDGE_CURVE('',${writer.reference(vertices[startIndex])},${writer.reference(vertices[endIndex])},${writer.reference(line)},.T.)`);
    });
    const faces = BOX_FACES.map((face) => {
      const orientedEdges = face.edges.map(([edgeIndex, forward]) => writer.add(
        `ORIENTED_EDGE('',*,*,${writer.reference(edges[edgeIndex])},${forward ? '.T.' : '.F.'})`
      ));
      const loop = writer.add(`EDGE_LOOP('',(${orientedEdges.map(writer.reference).join(',')}))`);
      const bound = writer.add(`FACE_OUTER_BOUND('',${writer.reference(loop)},.T.)`);
      const normal = addDirection(writer, face.normal);
      const reference = addDirection(writer, face.reference);
      const placement = writer.add(`AXIS2_PLACEMENT_3D('',${writer.reference(points[face.origin])},${writer.reference(normal)},${writer.reference(reference)})`);
      const plane = writer.add(`PLANE('',${writer.reference(placement)})`);
      return writer.add(`ADVANCED_FACE('',(${writer.reference(bound)}),${writer.reference(plane)},.T.)`);
    });
    const shell = writer.add(`CLOSED_SHELL('',(${faces.map(writer.reference).join(',')}))`);
    return writer.add(`MANIFOLD_SOLID_BREP(${stepString(member.id)},${writer.reference(shell)})`);
  }

  function stepForCandidate(candidate, options) {
    if (!candidate || !Array.isArray(candidate.members) || !candidate.members.length) {
      throw new Error('A candidate with at least one member is required for STEP export.');
    }
    const metadata = options || {};
    const writer = entityWriter();
    const applicationContext = writer.add("APPLICATION_CONTEXT('configuration controlled 3d designs of mechanical parts and assemblies')");
    writer.add(`APPLICATION_PROTOCOL_DEFINITION('international standard','config_control_design',1994,${writer.reference(applicationContext)})`);
    const productContext = writer.add(`PRODUCT_CONTEXT('',${writer.reference(applicationContext)},'mechanical')`);
    const product = writer.add(`PRODUCT(${stepString(candidate.id)},${stepString(candidate.id)},'Avelis steel wall profile-envelope coordination model',(${writer.reference(productContext)}))`);
    const formation = writer.add(`PRODUCT_DEFINITION_FORMATION_WITH_SPECIFIED_SOURCE('','',${writer.reference(product)},.NOT_KNOWN.)`);
    const definitionContext = writer.add(`PRODUCT_DEFINITION_CONTEXT('part definition',${writer.reference(applicationContext)},'design')`);
    const definition = writer.add(`PRODUCT_DEFINITION('design','',${writer.reference(formation)},${writer.reference(definitionContext)})`);
    const definitionShape = writer.add(`PRODUCT_DEFINITION_SHAPE('','',${writer.reference(definition)})`);
    writer.add(`PRODUCT_RELATED_PRODUCT_CATEGORY('part','',(${writer.reference(product)}))`);

    const origin = writer.add("CARTESIAN_POINT('',(0.0,0.0,0.0))");
    const zAxis = writer.add("DIRECTION('',(0.0,0.0,1.0))");
    const xAxis = writer.add("DIRECTION('',(1.0,0.0,0.0))");
    const placement = writer.add(`AXIS2_PLACEMENT_3D('',${writer.reference(origin)},${writer.reference(zAxis)},${writer.reference(xAxis)})`);
    const lengthUnit = writer.add('(LENGTH_UNIT()NAMED_UNIT(*)SI_UNIT(.MILLI.,.METRE.))');
    const planeAngleUnit = writer.add('(NAMED_UNIT(*)PLANE_ANGLE_UNIT()SI_UNIT($,.RADIAN.))');
    const solidAngleUnit = writer.add('(NAMED_UNIT(*)SI_UNIT($,.STERADIAN.)SOLID_ANGLE_UNIT())');
    const uncertainty = writer.add(`UNCERTAINTY_MEASURE_WITH_UNIT(LENGTH_MEASURE(1.E-6),${writer.reference(lengthUnit)},'distance_accuracy_value','confusion accuracy')`);
    const context = writer.add(`(GEOMETRIC_REPRESENTATION_CONTEXT(3)GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT((${writer.reference(uncertainty)}))GLOBAL_UNIT_ASSIGNED_CONTEXT((${writer.reference(lengthUnit)},${writer.reference(planeAngleUnit)},${writer.reference(solidAngleUnit)}))REPRESENTATION_CONTEXT('',''))`);

    const solids = candidate.members.map((member) => addManifoldBox(writer, member));
    const shapeRepresentation = writer.add(`SHAPE_REPRESENTATION('',(${writer.reference(placement)}),${writer.reference(context)})`);
    const brepRepresentation = writer.add(`ADVANCED_BREP_SHAPE_REPRESENTATION('',(${solids.map(writer.reference).join(',')}),${writer.reference(context)})`);
    writer.add(`SHAPE_REPRESENTATION_RELATIONSHIP('','',${writer.reference(shapeRepresentation)},${writer.reference(brepRepresentation)})`);
    writer.add(`SHAPE_DEFINITION_REPRESENTATION(${writer.reference(definitionShape)},${writer.reference(shapeRepresentation)})`);

    const fileName = metadata.fileName || `${candidate.id}_profile_envelopes.step`;
    const header = [
      'ISO-10303-21;',
      'HEADER;',
      "FILE_DESCRIPTION(('Avelis Wall Flow profile-envelope coordination geometry'),'2;1');",
      `FILE_NAME(${stepString(fileName)},${stepString(isoTimestamp(metadata.timestamp))},('Avelis Wall Flow'),('Imagine & Make 2026 - Bloc 1'),'Avelis Wall Flow 2.2','Avelis Wall Flow','ENGINEERING_REVIEW_REQUIRED');`,
      "FILE_SCHEMA(('CONFIG_CONTROL_DESIGN'));",
      'ENDSEC;',
      'DATA;'
    ];
    return [...header, ...writer.records(), 'ENDSEC;', 'END-ISO-10303-21;', ''].join('\r\n');
  }

  core.stepExport = { stepForCandidate, boxVertices };
})(typeof globalThis !== 'undefined' ? globalThis : window);
