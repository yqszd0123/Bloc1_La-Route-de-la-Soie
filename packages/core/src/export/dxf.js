(function initDxf(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  const FACES = [
    [0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4],
    [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]
  ];

  function vertices(bounds) {
    const { min, max } = bounds;
    return [
      [min.x, min.y, min.z], [max.x, min.y, min.z], [max.x, max.y, min.z], [min.x, max.y, min.z],
      [min.x, min.y, max.z], [max.x, min.y, max.z], [max.x, max.y, max.z], [min.x, max.y, max.z]
    ];
  }

  function dxf3dFace(layer, face) {
    const lines = ['0', '3DFACE', '8', layer];
    face.forEach((point, index) => {
      const group = 10 + index;
      lines.push(String(group), String(core.math.round(point[0], 3)));
      lines.push(String(group + 10), String(core.math.round(point[1], 3)));
      lines.push(String(group + 20), String(core.math.round(point[2], 3)));
    });
    return lines;
  }

  function dxfForCandidate(candidate) {
    const lines = ['0', 'SECTION', '2', 'HEADER', '9', '$ACADVER', '1', 'AC1009', '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES'];
    candidate.members.forEach((member) => {
      const points = vertices(member.bounds);
      const layer = member.role.toUpperCase().slice(0, 30);
      FACES.forEach((indices) => lines.push(...dxf3dFace(layer, indices.map((index) => points[index]))));
    });
    lines.push('0', 'ENDSEC', '0', 'EOF');
    return lines.join('\r\n') + '\r\n';
  }

  core.dxf = { dxfForCandidate };
})(typeof globalThis !== 'undefined' ? globalThis : window);

