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

  // ---- DXF 2D : silhouette de la face de l'ossature, indépendante de la caméra ----------------
  // Repère DXF : X = longueur du mur, Y = hauteur (axe z du modèle), unités = mm.
  // Les profilés sont projetés sur le plan x-z puis FUSIONNÉS (union) : seul le bord de la
  // silhouette est tracé. Là où un montant rejoint le cadre (lisses, jambages, linteau…), il n'y a
  // donc aucun trait de fermeture, et le fichier ne contient que des contours fermés de découpe :
  // le contour extérieur du cadre + un contour intérieur par vide (entre montants, ouvertures).
  const CUT_LAYER = 'CUT';
  const SNAP_MM = 0.01;   // deux cotes plus proches que cela sont considérées identiques

  function dxfPolyline(layer, points) {
    const lines = ['0', 'POLYLINE', '8', layer, '66', '1', '70', '1'];
    points.forEach(([x, y]) => {
      lines.push('0', 'VERTEX', '8', layer, '10', String(core.math.round(x, 3)), '20', String(core.math.round(y, 3)), '30', '0');
    });
    lines.push('0', 'SEQEND', '8', layer);
    return lines;
  }

  function clusterCuts(values) {
    const sorted = values.slice().sort((left, right) => left - right);
    const cuts = [];
    sorted.forEach((value) => { if (!cuts.length || value - cuts[cuts.length - 1] > SNAP_MM) cuts.push(value); });
    return cuts;
  }

  function snapIndex(cuts, value) {
    let best = 0;
    cuts.forEach((cut, index) => { if (Math.abs(cut - value) < Math.abs(cuts[best] - value)) best = index; });
    return best;
  }

  /**
   * Boucles fermées du bord de l'union des profilés projetés.
   * Grille formée par toutes les cotes des profilés ; une cellule est pleine si un profilé la couvre ;
   * les arêtes entre cellule pleine et cellule vide sont chaînées en boucles, puis les points
   * alignés sont supprimés pour ne garder que les vrais sommets.
   */
  function memberCutContours(candidate) {
    const members = candidate.members.map((member) => member.bounds)
      .filter((bounds) => bounds.max.x - bounds.min.x > SNAP_MM && bounds.max.z - bounds.min.z > SNAP_MM);
    if (!members.length) return [];
    const xs = clusterCuts(members.flatMap((bounds) => [bounds.min.x, bounds.max.x]));
    const zs = clusterCuts(members.flatMap((bounds) => [bounds.min.z, bounds.max.z]));
    const columns = xs.length - 1;
    const rows = zs.length - 1;
    const grid = Array.from({ length: columns }, () => new Array(rows).fill(false));
    members.forEach((bounds) => {
      const i0 = snapIndex(xs, bounds.min.x);
      const i1 = snapIndex(xs, bounds.max.x);
      const j0 = snapIndex(zs, bounds.min.z);
      const j1 = snapIndex(zs, bounds.max.z);
      for (let i = i0; i < i1; i += 1) for (let j = j0; j < j1; j += 1) grid[i][j] = true;
    });
    const filled = (i, j) => i >= 0 && j >= 0 && i < columns && j < rows && grid[i][j];

    // Arêtes orientées avec la matière à gauche.
    const edges = new Map();
    const addEdge = (from, to) => {
      const key = from.join(',');
      if (!edges.has(key)) edges.set(key, []);
      edges.get(key).push({ from, to, used: false });
    };
    for (let i = 0; i < columns; i += 1) {
      for (let j = 0; j < rows; j += 1) {
        if (!filled(i, j)) continue;
        if (!filled(i, j - 1)) addEdge([i, j], [i + 1, j]);
        if (!filled(i + 1, j)) addEdge([i + 1, j], [i + 1, j + 1]);
        if (!filled(i, j + 1)) addEdge([i + 1, j + 1], [i, j + 1]);
        if (!filled(i - 1, j)) addEdge([i, j + 1], [i, j]);
      }
    }

    const loops = [];
    edges.forEach((list) => list.forEach((start) => {
      if (start.used) return;
      const loop = [];
      let edge = start;
      while (edge && !edge.used) {
        edge.used = true;
        loop.push(edge.from);
        if (edge.to[0] === start.from[0] && edge.to[1] === start.from[1]) break;
        // At a corner shared by two disjoint regions, turn left to keep separate loops.
        // Taking the first available edge can create a self-touching figure of eight.
        const dx = edge.to[0] - edge.from[0], dz = edge.to[1] - edge.from[1];
        const nextEdges = (edges.get(edge.to.join(',')) || []).filter((next) => !next.used);
        const turn = (next) => dx * (next.to[1] - next.from[1]) - dz * (next.to[0] - next.from[0]);
        edge = nextEdges.sort((a, b) => turn(b) - turn(a))[0];
        if (!edge) throw new Error('DXF 2D: unclosed frame contour');
      }
      loops.push(loop);
    }));

    return loops.map((loop) => loop.filter((point, index) => {
      const previous = loop[(index + loop.length - 1) % loop.length];
      const next = loop[(index + 1) % loop.length];
      const collinear = (previous[0] === point[0] && point[0] === next[0]) || (previous[1] === point[1] && point[1] === next[1]);
      return !collinear;
    }).map(([i, j]) => [xs[i], zs[j]])).filter((loop) => loop.length >= 3);
  }

  function dxf2dForCandidate(candidate) {
    const contours = memberCutContours(candidate);
    const lines = [
      // R12 has no INSUNITS. Keep compatibility and explicitly document the coordinate unit.
      '999', 'Frame face silhouette; coordinates in mm; scale 1:1; X=wall length, Y=wall height',
      '0', 'SECTION', '2', 'HEADER', '9', '$ACADVER', '1', 'AC1009',
      '9', '$LUNITS', '70', '2', '9', '$LUPREC', '70', '3', '0', 'ENDSEC',
      '0', 'SECTION', '2', 'TABLES',
      '0', 'TABLE', '2', 'LTYPE', '70', '1',
      '0', 'LTYPE', '2', 'CONTINUOUS', '70', '0', '3', 'Solid line', '72', '65', '73', '0', '40', '0.0',
      '0', 'ENDTAB',
      '0', 'TABLE', '2', 'LAYER', '70', '1',
      '0', 'LAYER', '2', CUT_LAYER, '70', '0', '62', '7', '6', 'CONTINUOUS',
      '0', 'ENDTAB', '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES'
    ];
    contours.forEach((contour) => lines.push(...dxfPolyline(CUT_LAYER, contour)));
    lines.push('0', 'ENDSEC', '0', 'EOF');
    return lines.join('\r\n') + '\r\n';
  }

  core.dxf = { dxfForCandidate, dxf2dForCandidate, memberCutContours };
})(typeof globalThis !== 'undefined' ? globalThis : window);
