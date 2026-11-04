(function initCanvasGeometry(global) {
  'use strict';

  const app = global.AvelisApp;
  // Chaque face porte sa normale sortante : elle sert à éliminer les faces arrière.
  const BOX_FACES = [
    { ids: [0, 1, 5, 4], shade: .9, normal: [0, -1, 0] }, { ids: [1, 2, 6, 5], shade: .72, normal: [1, 0, 0] },
    { ids: [2, 3, 7, 6], shade: .82, normal: [0, 1, 0] }, { ids: [3, 0, 4, 7], shade: .68, normal: [-1, 0, 0] },
    { ids: [4, 5, 6, 7], shade: 1.05, normal: [0, 0, 1] }, { ids: [0, 3, 2, 1], shade: .62, normal: [0, 0, -1] }
  ];
  const AXES = ['x', 'y', 'z'];
  const EPS_MM = 1e-3;

  function hexToRgb(hex) {
    const value = parseInt(hex.slice(1), 16);
    return { r: value >> 16, g: (value >> 8) & 255, b: value & 255 };
  }

  function shade(hex, factor, alpha) {
    const rgb = hexToRgb(hex);
    const values = [rgb.r, rgb.g, rgb.b].map((value) => Math.max(0, Math.min(255, Math.round(value * factor))));
    return alpha === undefined
      ? `rgb(${values[0]},${values[1]},${values[2]})`
      : `rgba(${values[0]},${values[1]},${values[2]},${alpha})`;
  }

  function projectPoint(point, yaw, pitch) {
    const [x, y, z] = point;
    const rotatedX = Math.cos(yaw) * x - Math.sin(yaw) * y;
    const depth = Math.sin(yaw) * x + Math.cos(yaw) * y;
    return {
      x: rotatedX,
      y: -z * Math.cos(pitch) + depth * Math.sin(pitch),
      depth: depth * Math.cos(pitch) + z * Math.sin(pitch)
    };
  }

  function boxVertices(bounds) {
    return [
      [bounds.min.x, bounds.min.y, bounds.min.z], [bounds.max.x, bounds.min.y, bounds.min.z],
      [bounds.max.x, bounds.max.y, bounds.min.z], [bounds.min.x, bounds.max.y, bounds.min.z],
      [bounds.min.x, bounds.min.y, bounds.max.z], [bounds.max.x, bounds.min.y, bounds.max.z],
      [bounds.max.x, bounds.max.y, bounds.max.z], [bounds.min.x, bounds.max.y, bounds.max.z]
    ];
  }

  // Direction pointant vers l'observateur, dans le repère monde (x, y, z).
  // Cohérente avec projectPoint : « profondeur » = produit scalaire avec ce vecteur.
  function viewDirection(yaw, pitch) {
    return [Math.sin(yaw) * Math.cos(pitch), Math.cos(yaw) * Math.cos(pitch), Math.sin(pitch)];
  }

  function expandBox(primitive, direction) {
    const vertices = boxVertices(primitive.bounds);
    return BOX_FACES
      .filter((face) => face.normal[0] * direction[0] + face.normal[1] * direction[1] + face.normal[2] * direction[2] > 1e-9)
      .map((face) => ({
        type: 'polygon',
        points: face.ids.map((id) => vertices[id]),
        fill: shade(primitive.color, face.shade, primitive.alpha),
        stroke: primitive.stroke || 'rgba(24,45,54,.42)',
        lineWidth: primitive.lineWidth || 1,
        overlay: false
      }));
  }

  function pointsBounds(points) {
    const bounds = { min: { x: Infinity, y: Infinity, z: Infinity }, max: { x: -Infinity, y: -Infinity, z: -Infinity } };
    points.forEach((point) => AXES.forEach((axis, index) => {
      bounds.min[axis] = Math.min(bounds.min[axis], point[index]);
      bounds.max[axis] = Math.max(bounds.max[axis], point[index]);
    }));
    return bounds;
  }

  /**
   * Transforme les primitives en « éléments » triables : un élément = un solide (boîte)
   * ou une surface plane, avec son volume englobant aligné sur les axes.
   * Les polygones à contour sans overlay forment des éléments plats (épaisseur nulle).
   */
  function buildItems(primitives, direction, yaw, pitch) {
    const items = [];
    const overlays = [];
    primitives.forEach((primitive) => {
      if (primitive.type === 'box') {
        const bounds = primitive.bounds;
        items.push({ polygons: expandBox(primitive, direction), bounds, corners: boxVertices(bounds), bias: primitive.orderBias || 0 });
        return;
      }
      if (primitive.overlay) { overlays.push(primitive); return; }
      items.push({ polygons: [primitive], bounds: pointsBounds(primitive.points), corners: primitive.points, bias: primitive.orderBias || 0 });
    });

    items.forEach((item) => {
      const projected = item.corners.map((point) => projectPoint(point, yaw, pitch));
      item.screen = {
        minX: Math.min(...projected.map((point) => point.x)), maxX: Math.max(...projected.map((point) => point.x)),
        minY: Math.min(...projected.map((point) => point.y)), maxY: Math.max(...projected.map((point) => point.y))
      };
      const center = AXES.map((axis) => (item.bounds.min[axis] + item.bounds.max[axis]) / 2);
      item.depth = projectPoint(center, yaw, pitch).depth + item.bias;
    });
    return { items, overlays };
  }

  /**
   * Compare deux éléments : retourne -1 si `a` doit être dessiné avant `b` (a est derrière),
   * 1 si après, 0 si aucun plan axial ne les sépare (solides qui se pénètrent),
   * null si les plans imposent des sens opposés : aucun rayon ne traverse les deux solides.
   */
  function compareBySeparatingPlane(a, b, direction) {
    let order = 0;
    let conflict = false;
    AXES.forEach((axis, index) => {
      const weight = Math.abs(direction[index]);
      if (weight < 1e-9) return;
      let axisOrder = 0;
      if (a.bounds.max[axis] <= b.bounds.min[axis] + EPS_MM) {
        axisOrder = direction[index] > 0 ? -1 : 1;
      } else if (b.bounds.max[axis] <= a.bounds.min[axis] + EPS_MM) {
        axisOrder = direction[index] > 0 ? 1 : -1;
      }
      if (axisOrder && order && axisOrder !== order) conflict = true;
      if (axisOrder) order = axisOrder;
    });
    return conflict ? null : order;
  }

  function screenOverlap(a, b) {
    return a.screen.minX < b.screen.maxX - .01 && b.screen.minX < a.screen.maxX - .01
      && a.screen.minY < b.screen.maxY - .01 && b.screen.minY < a.screen.maxY - .01;
  }

  /** Tri topologique : tout élément est dessiné après ceux qu'il masque. */
  function sortItems(items, direction) {
    const count = items.length;
    const behind = items.map(() => []);   // behind[i] = indices à dessiner après i
    const blockers = new Array(count).fill(0);
    for (let i = 0; i < count; i += 1) {
      for (let j = i + 1; j < count; j += 1) {
        if (!screenOverlap(items[i], items[j])) continue;
        let order = compareBySeparatingPlane(items[i], items[j], direction);
        // Screen rectangles can overlap even when the projected solids do not.
        // Do not introduce false dependencies/cycles between those items.
        if (order === null) continue;
        if (order === 0) order = items[i].depth <= items[j].depth ? -1 : 1;   // solides imbriqués : repli sur la profondeur
        if (order < 0) { behind[i].push(j); blockers[j] += 1; } else { behind[j].push(i); blockers[i] += 1; }
      }
    }
    const done = new Array(count).fill(false);
    const sorted = [];
    for (let step = 0; step < count; step += 1) {
      let pick = -1;
      for (let i = 0; i < count; i += 1) {
        if (done[i]) continue;
        if (pick < 0) { pick = i; continue; }
        const better = blockers[i] < blockers[pick]
          || (blockers[i] === blockers[pick] && items[i].depth < items[pick].depth);
        if (better) pick = i;
      }
      done[pick] = true;
      sorted.push(items[pick]);
      behind[pick].forEach((next) => { blockers[next] -= 1; });
    }
    return sorted;
  }

  function setupCanvas(canvas) {
    const context = canvas.getContext('2d');
    const ratio = global.devicePixelRatio || 1;
    const width = canvas.clientWidth || 1200;
    const height = canvas.clientHeight || 650;
    if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    return { context, width, height };
  }

  function drawPolygon(context, polygon, transform) {
    context.save();
    context.beginPath();
    polygon.projected.forEach((point, index) => {
      const x = point.x * transform.scale + transform.offsetX;
      const y = point.y * transform.scale + transform.offsetY;
      if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
    });
    if (polygon.closed !== false) context.closePath();
    (polygon.projectedHoles || []).forEach((hole) => {
      hole.forEach((point, index) => {
        const x = point.x * transform.scale + transform.offsetX;
        const y = point.y * transform.scale + transform.offsetY;
        if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
      });
      context.closePath();
    });
    if (polygon.fill) {
      context.fillStyle = polygon.fill;
      context.fill('evenodd');
    }
    if (polygon.stroke) {
      context.strokeStyle = polygon.stroke;
      context.lineWidth = polygon.lineWidth || 1;
      context.setLineDash(polygon.dash || []);
      context.stroke();
    }
    context.restore();
  }

  function render(canvas, primitives, options) {
    const viewport = setupCanvas(canvas);
    if (!primitives.length) return null;
    const settings = options || {};
    const yaw = ((settings.rotationDeg || 0) * Math.PI) / 180;
    const pitch = ((settings.pitchDeg === undefined ? 16 : settings.pitchDeg) * Math.PI) / 180;
    const direction = viewDirection(yaw, pitch);
    const built = buildItems(primitives, direction, yaw, pitch);
    const ordered = sortItems(built.items, direction);

    const project = (polygon) => ({
      ...polygon,
      projected: polygon.points.map((point) => projectPoint(point, yaw, pitch)),
      projectedHoles: (polygon.holes || []).map((hole) => hole.map((point) => projectPoint(point, yaw, pitch)))
    });
    const drawable = ordered.map((item) => item.polygons.map(project));
    const overlays = built.overlays.map(project);

    // Cadrage calculé sur tous les sommets (y compris faces masquées) : l'échelle ne saute pas pendant la rotation.
    const allPoints = [
      ...built.items.flatMap((item) => item.corners.map((point) => projectPoint(point, yaw, pitch))),
      ...overlays.flatMap((polygon) => polygon.projected)
    ];
    const minX = Math.min(...allPoints.map((point) => point.x));
    const maxX = Math.max(...allPoints.map((point) => point.x));
    const minY = Math.min(...allPoints.map((point) => point.y));
    const maxY = Math.max(...allPoints.map((point) => point.y));
    const padding = settings.padding || 90;
    const scale = Math.min(
      (viewport.width - padding) / (maxX - minX || 1),
      (viewport.height - padding) / (maxY - minY || 1)
    );
    const transform = {
      scale,
      offsetX: (viewport.width - (maxX - minX) * scale) / 2 - minX * scale,
      offsetY: (viewport.height - (maxY - minY) * scale) / 2 - minY * scale
    };

    drawable.forEach((polygons) => polygons.forEach((polygon) => drawPolygon(viewport.context, polygon, transform)));
    overlays.forEach((polygon) => drawPolygon(viewport.context, polygon, transform));
    return { context: viewport.context, transform, yaw, pitch, width: viewport.width, height: viewport.height };
  }

  app.canvasGeometry = { shade, projectPoint, boxVertices, render };
})(window);
