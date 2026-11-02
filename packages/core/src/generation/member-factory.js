(function initMemberFactory(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function createMember(context, spec) {
    const width = spec.widthMm || context.rules.sectionWidthMm;
    const depth = spec.depthMm || context.rules.sectionDepthMm;
    const index = context.members.length + 1;
    const member = {
      id: core.math.stableComponentId(context.input.projectId, context.input.wallId, context.input.version, index),
      role: spec.role,
      label: spec.label,
      materialCode: context.rules.materialCode,
      section: { widthMm: width, depthMm: depth },
      axis: spec.axis,
      lengthMm: core.math.round(spec.lengthMm, 2),
      position: {
        xMm: core.math.round(spec.xMm, 2),
        yMm: core.math.round(spec.yMm || 0, 2),
        zMm: core.math.round(spec.zMm, 2)
      },
      operations: spec.operations || ['CUT_90', 'LABEL'],
      toleranceMm: context.rules.manufacturingToleranceMm,
      source: spec.source || 'PARAMETRIC_GENERATOR',
      openingId: spec.openingId || null
    };

    if (member.axis === 'x') {
      member.bounds = {
        min: { x: member.position.xMm, y: member.position.yMm, z: member.position.zMm },
        max: { x: member.position.xMm + member.lengthMm, y: member.position.yMm + depth, z: member.position.zMm + width }
      };
    } else {
      member.bounds = {
        min: { x: member.position.xMm, y: member.position.yMm, z: member.position.zMm },
        max: { x: member.position.xMm + width, y: member.position.yMm + depth, z: member.position.zMm + member.lengthMm }
      };
    }

    context.members.push(member);
    return member;
  }

  core.memberFactory = { createMember };
})(typeof globalThis !== 'undefined' ? globalThis : window);
