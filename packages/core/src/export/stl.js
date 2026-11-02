(function initStl(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  const FACE_TRIANGLES = [
    [0, 1, 2], [0, 2, 3], [4, 6, 5], [4, 7, 6],
    [0, 4, 5], [0, 5, 1], [1, 5, 6], [1, 6, 2],
    [2, 6, 7], [2, 7, 3], [3, 7, 4], [3, 4, 0]
  ];

  function vertices(bounds, scale) {
    const x0 = bounds.min.x / scale;
    const y0 = bounds.min.y / scale;
    const z0 = bounds.min.z / scale;
    const x1 = bounds.max.x / scale;
    const y1 = bounds.max.y / scale;
    const z1 = bounds.max.z / scale;
    return [
      [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
      [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]
    ];
  }

  function normal(a, b, c) {
    const ux = b[0] - a[0]; const uy = b[1] - a[1]; const uz = b[2] - a[2];
    const vx = c[0] - a[0]; const vy = c[1] - a[1]; const vz = c[2] - a[2];
    const nx = uy * vz - uz * vy; const ny = uz * vx - ux * vz; const nz = ux * vy - uy * vx;
    const length = Math.hypot(nx, ny, nz) || 1;
    return [nx / length, ny / length, nz / length];
  }

  function stlForCandidate(candidate, scale) {
    const safeScale = Math.max(1, Number(scale) || 15);
    const lines = [`solid avelis_${candidate.id}_scale_1_${safeScale}`];
    candidate.members.forEach((member) => {
      const points = vertices(member.bounds, safeScale);
      FACE_TRIANGLES.forEach((indices) => {
        const triangle = indices.map((index) => points[index]);
        const n = normal(...triangle);
        lines.push(`  facet normal ${n.map((value) => value.toFixed(6)).join(' ')}`);
        lines.push('    outer loop');
        triangle.forEach((point) => lines.push(`      vertex ${point.map((value) => value.toFixed(6)).join(' ')}`));
        lines.push('    endloop');
        lines.push('  endfacet');
      });
    });
    lines.push(`endsolid avelis_${candidate.id}_scale_1_${safeScale}`);
    return lines.join('\n') + '\n';
  }

  core.stl = { stlForCandidate };
})(typeof globalThis !== 'undefined' ? globalThis : window);

