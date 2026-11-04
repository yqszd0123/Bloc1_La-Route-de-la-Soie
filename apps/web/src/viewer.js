(function initViewer(global) {
  'use strict';

  const app = global.AvelisApp;
  const colors = global.AvelisCore.ROLE_COLORS;

  function openingPoints(opening, y) {
    const right = opening.xMm + opening.widthMm;
    const top = opening.sillMm + opening.heightMm;
    return [
      [opening.xMm, y, opening.sillMm], [right, y, opening.sillMm],
      [right, y, top], [opening.xMm, y, top]
    ];
  }

  function render(canvas, candidate, rotationDeg, showLabels) {
    if (!candidate) {
      app.canvasGeometry.render(canvas, [], { rotationDeg });
      return;
    }
    const openings = candidate.wall.openings || [];
    const primitives = [
      ...openings.map((opening) => ({
        type: 'polygon', points: openingPoints(opening, 0),
        fill: opening.type === 'DOOR' ? 'rgba(236,151,78,.13)' : 'rgba(64,166,205,.13)',
        orderBias: -10000
      })),
      ...candidate.members.map((member) => ({
        type: 'box', bounds: member.bounds, color: global.AvelisCore.memberColor(member, candidate.frameMaterial)
      })),
      ...openings.map((opening) => ({
        type: 'polygon', points: openingPoints(opening, 0), fill: null,
        stroke: opening.type === 'DOOR' ? '#b45f18' : '#1976a3', lineWidth: 2, dash: [7, 5], overlay: true
      }))
    ];
    const view = app.canvasGeometry.render(canvas, primitives, { rotationDeg });
    if (!(showLabels && view && view.transform.scale > .08)) return;

    view.context.save();
    view.context.font = '11px system-ui';
    view.context.fillStyle = '#102d34';
    view.context.textAlign = 'center';
    candidate.members.forEach((member) => {
      const center = [
        (member.bounds.min.x + member.bounds.max.x) / 2,
        (member.bounds.min.y + member.bounds.max.y) / 2,
        (member.bounds.min.z + member.bounds.max.z) / 2
      ];
      const projected = app.canvasGeometry.projectPoint(center, view.yaw, view.pitch);
      view.context.fillText(
        member.id.split('-').slice(-1)[0],
        projected.x * view.transform.scale + view.transform.offsetX,
        projected.y * view.transform.scale + view.transform.offsetY
      );
    });
    view.context.restore();
  }

  app.viewer = { render };
})(window);
