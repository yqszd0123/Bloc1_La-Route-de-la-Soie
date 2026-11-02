(function initViewer(global) {
  'use strict';

  const app = global.AvelisApp;
  const colors = global.AvelisCore.ROLE_COLORS;

  function hexToRgb(hex) {
    const value = parseInt(hex.slice(1), 16);
    return { r: value >> 16, g: (value >> 8) & 255, b: value & 255 };
  }

  function shade(hex, factor) {
    const rgb = hexToRgb(hex);
    return `rgb(${Math.round(rgb.r * factor)},${Math.round(rgb.g * factor)},${Math.round(rgb.b * factor)})`;
  }

  function projectPoint(point, yaw, pitch) {
    const [x, y, z] = point;
    const rx = Math.cos(yaw) * x - Math.sin(yaw) * y;
    const depth = Math.sin(yaw) * x + Math.cos(yaw) * y;
    const py = -z * Math.cos(pitch) + depth * Math.sin(pitch);
    return { x: rx, y: py, depth: depth * Math.cos(pitch) + z * Math.sin(pitch) };
  }

  function projectedVertices(bounds, yaw, pitch) {
    return [
      [bounds.min.x, bounds.min.y, bounds.min.z], [bounds.max.x, bounds.min.y, bounds.min.z],
      [bounds.max.x, bounds.max.y, bounds.min.z], [bounds.min.x, bounds.max.y, bounds.min.z],
      [bounds.min.x, bounds.min.y, bounds.max.z], [bounds.max.x, bounds.min.y, bounds.max.z],
      [bounds.max.x, bounds.max.y, bounds.max.z], [bounds.min.x, bounds.max.y, bounds.max.z]
    ].map((point) => projectPoint(point, yaw, pitch));
  }

  const faces = [
    { ids: [0, 1, 5, 4], shade: .9 }, { ids: [1, 2, 6, 5], shade: .72 },
    { ids: [2, 3, 7, 6], shade: .82 }, { ids: [3, 0, 4, 7], shade: .68 },
    { ids: [4, 5, 6, 7], shade: 1.05 }, { ids: [0, 3, 2, 1], shade: .62 }
  ];

  function render(canvas, candidate, rotationDeg, showLabels) {
    const ctx = canvas.getContext('2d');
    const ratio = global.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth || 1200;
    const cssHeight = canvas.clientHeight || 650;
    if (canvas.width !== Math.round(cssWidth * ratio) || canvas.height !== Math.round(cssHeight * ratio)) {
      canvas.width = Math.round(cssWidth * ratio);
      canvas.height = Math.round(cssHeight * ratio);
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    if (!candidate) return;

    const yaw = (rotationDeg * Math.PI) / 180;
    const pitch = 16 * Math.PI / 180;
    const projected = candidate.members.map((member) => ({ member, points: projectedVertices(member.bounds, yaw, pitch) }));
    const allPoints = projected.flatMap((entry) => entry.points);
    const minX = Math.min(...allPoints.map((p) => p.x)); const maxX = Math.max(...allPoints.map((p) => p.x));
    const minY = Math.min(...allPoints.map((p) => p.y)); const maxY = Math.max(...allPoints.map((p) => p.y));
    const scale = Math.min((cssWidth - 90) / (maxX - minX || 1), (cssHeight - 90) / (maxY - minY || 1));
    const offsetX = (cssWidth - (maxX - minX) * scale) / 2 - minX * scale;
    const offsetY = (cssHeight - (maxY - minY) * scale) / 2 - minY * scale;

    const openingShapes = candidate.wall.openings.map((opening) => {
      const right = opening.xMm + opening.widthMm;
      const top = opening.sillMm + opening.heightMm;
      return {
        opening,
        points: [
          [opening.xMm, 0, opening.sillMm], [right, 0, opening.sillMm],
          [right, 0, top], [opening.xMm, 0, top]
        ].map((point) => projectPoint(point, yaw, pitch))
      };
    });
    openingShapes.forEach(({ opening, points }) => {
      ctx.beginPath();
      points.forEach((point, index) => {
        const x = point.x * scale + offsetX; const y = point.y * scale + offsetY;
        if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = opening.type === 'DOOR' ? 'rgba(236,151,78,.13)' : 'rgba(64,166,205,.13)';
      ctx.fill();
    });

    const renderFaces = [];
    projected.forEach((entry) => {
      faces.forEach((face) => {
        const pts = face.ids.map((id) => entry.points[id]);
        renderFaces.push({
          member: entry.member,
          points: pts,
          depth: pts.reduce((sum, p) => sum + p.depth, 0) / pts.length,
          shade: face.shade
        });
      });
    });
    renderFaces.sort((a, b) => a.depth - b.depth);
    renderFaces.forEach((face) => {
      const base = colors[face.member.role] || '#b67c4f';
      ctx.beginPath();
      face.points.forEach((p, index) => {
        const x = p.x * scale + offsetX; const y = p.y * scale + offsetY;
        if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = shade(base, face.shade);
      ctx.fill();
      ctx.strokeStyle = 'rgba(48,34,26,.42)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    openingShapes.forEach(({ opening, points }) => {
      ctx.beginPath();
      points.forEach((point, index) => {
        const x = point.x * scale + offsetX; const y = point.y * scale + offsetY;
        if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = opening.type === 'DOOR' ? '#b45f18' : '#1976a3';
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    if (showLabels && scale > .08) {
      ctx.font = '11px system-ui';
      ctx.fillStyle = '#102d34';
      ctx.textAlign = 'center';
      projected.forEach((entry) => {
        const center = entry.points.reduce((acc, p) => ({ x: acc.x + p.x / 8, y: acc.y + p.y / 8 }), { x: 0, y: 0 });
        ctx.fillText(entry.member.id.split('-').slice(-1)[0], center.x * scale + offsetX, center.y * scale + offsetY);
      });
    }
  }

  app.viewer = { render };
})(window);
