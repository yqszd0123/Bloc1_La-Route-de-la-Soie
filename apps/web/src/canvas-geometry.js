(function initCanvasGeometry(global) {
  'use strict';

  const app = global.AvelisApp;
  const BOX_FACES = [
    { ids: [0, 1, 5, 4], shade: .9 }, { ids: [1, 2, 6, 5], shade: .72 },
    { ids: [2, 3, 7, 6], shade: .82 }, { ids: [3, 0, 4, 7], shade: .68 },
    { ids: [4, 5, 6, 7], shade: 1.05 }, { ids: [0, 3, 2, 1], shade: .62 }
  ];

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

  function expandPrimitive(primitive) {
    if (primitive.type !== 'box') return [primitive];
    const vertices = boxVertices(primitive.bounds);
    return BOX_FACES.map((face) => ({
      type: 'polygon',
      points: face.ids.map((id) => vertices[id]),
      fill: shade(primitive.color, face.shade, primitive.alpha),
      stroke: primitive.stroke || 'rgba(24,45,54,.42)',
      lineWidth: primitive.lineWidth || 1,
      orderBias: primitive.orderBias || 0,
      overlay: false
    }));
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
    if (polygon.fill) {
      context.fillStyle = polygon.fill;
      context.fill();
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
    const polygons = primitives.flatMap(expandPrimitive).map((primitive) => {
      const projected = primitive.points.map((point) => projectPoint(point, yaw, pitch));
      return {
        ...primitive,
        projected,
        depth: projected.reduce((sum, point) => sum + point.depth, 0) / projected.length + (primitive.orderBias || 0)
      };
    });
    const allPoints = polygons.flatMap((polygon) => polygon.projected);
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

    polygons.filter((polygon) => !polygon.overlay).sort((left, right) => left.depth - right.depth)
      .forEach((polygon) => drawPolygon(viewport.context, polygon, transform));
    polygons.filter((polygon) => polygon.overlay).sort((left, right) => left.depth - right.depth)
      .forEach((polygon) => drawPolygon(viewport.context, polygon, transform));
    return { context: viewport.context, transform, yaw, pitch, width: viewport.width, height: viewport.height };
  }

  app.canvasGeometry = { shade, projectPoint, boxVertices, render };
})(window);
