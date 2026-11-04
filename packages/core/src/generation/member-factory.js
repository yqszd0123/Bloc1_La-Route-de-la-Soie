(function initMemberFactory(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function profileEnvelopeWidth(profile) {
    return Math.max(profile.flange1Mm, profile.flange2Mm);
  }

  function createMember(context, spec) {
    const profile = spec.profileKind === 'track' ? context.trackProfile : context.studProfile;
    const envelopeWidthMm = profileEnvelopeWidth(profile);
    const semanticKey = [
      spec.role, spec.openingId || 'WALL', profile.id, spec.axis,
      core.math.round(spec.xMm, 3), core.math.round(spec.zMm, 3), core.math.round(spec.lengthMm, 3)
    ].join('|');
    const member = {
      id: core.math.stableComponentId(context.input.projectId, context.input.wallId, context.input.version, semanticKey),
      role: spec.role,
      label: spec.label,
      source: spec.source || 'PARAMETRIC_STEEL_PANEL_GENERATOR',
      openingId: spec.openingId || null,
      material: {
        id: context.rules.material.id,
        label: context.rules.material.label,
        status: context.rules.material.status,
        coating: profile.coating,
        minimumYieldStrengthNmm2: profile.minimumYieldStrengthNmm2
      },
      profile: core.math.deepClone(profile),
      representation: {
        kind: 'PROFILE_ENVELOPE',
        note: 'The viewer/DXF/STL uses the external profile envelope. Mass uses the manufacturer kg/m value; envelope volume is not used for quantities.'
      },
      sectionEnvelope: { inPlaneWidthMm: envelopeWidthMm, depthMm: profile.webDepthMm },
      axis: spec.axis,
      lengthMm: core.math.round(spec.lengthMm, 3),
      position: {
        xMm: core.math.round(spec.xMm, 3),
        yMm: core.math.round(spec.yMm || 0, 3),
        zMm: core.math.round(spec.zMm, 3)
      },
      operations: ['CUT_SQUARE', 'MARK_ID'],
      toleranceMm: null,
      manufacturingRelease: 'BLOCKED_PENDING_AVELIS_CAPABILITIES',
      qrPayload: `AVELIS|${context.input.projectId}|${context.input.wallId}|${context.input.version}|${core.math.hash32(semanticKey)}`
    };

    if (member.axis === 'x') {
      member.bounds = {
        min: { x: member.position.xMm, y: member.position.yMm, z: member.position.zMm },
        max: { x: member.position.xMm + member.lengthMm, y: member.position.yMm + profile.webDepthMm, z: member.position.zMm + envelopeWidthMm }
      };
    } else {
      member.bounds = {
        min: { x: member.position.xMm, y: member.position.yMm, z: member.position.zMm },
        max: { x: member.position.xMm + envelopeWidthMm, y: member.position.yMm + profile.webDepthMm, z: member.position.zMm + member.lengthMm }
      };
    }
    member.massKg = core.math.round(member.lengthMm / 1000 * profile.massKgPerM, 4);
    member.fabricationGeometry = {
      webDepthMm: profile.webDepthMm,
      flange1Mm: profile.flange1Mm,
      flange2Mm: profile.flange2Mm,
      lipMm: profile.lipMm || 0,
      nominalThicknessMm: profile.nominalThicknessMm,
      developedWidthApproxMm: core.engineering.developedWidthMm(profile),
      developedAreaApproxM2: core.math.round(core.engineering.developedWidthMm(profile) * member.lengthMm / 1e6, 6),
      method: 'Flat developed width × cut length; bend radii excluded.'
    };
    context.members.push(member);
    return member;
  }

  core.memberFactory = { createMember, profileEnvelopeWidth };
})(typeof globalThis !== 'undefined' ? globalThis : window);
