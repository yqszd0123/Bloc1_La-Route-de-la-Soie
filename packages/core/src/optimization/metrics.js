(function initMetrics(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function memberVolumeMm3(member) {
    return member.lengthMm * member.section.widthMm * member.section.depthMm;
  }

  function computeStockProxy(candidate, rules) {
    let stockMm = 0;
    let usedMm = 0;
    candidate.members.forEach((member) => {
      const blanks = Math.ceil(member.lengthMm / rules.stockLengthMm);
      stockMm += blanks * rules.stockLengthMm;
      usedMm += member.lengthMm;
    });
    return {
      stockLengthMm: stockMm,
      usedLengthMm: usedMm,
      wasteLengthMm: stockMm - usedMm,
      disclaimer: 'Indicateur conservatif par pièce, sans optimisation combinatoire de débit.'
    };
  }

  function computeMetrics(candidate, rules) {
    const totalVolumeMm3 = candidate.members.reduce((sum, member) => sum + memberVolumeMm3(member), 0);
    const totalLengthMm = candidate.members.reduce((sum, member) => sum + member.lengthMm, 0);
    const componentCount = candidate.members.length;
    const cutCount = candidate.members.reduce((sum, member) => sum + (member.operations.includes('CUT_90') ? 2 : 0), 0);
    const uniqueLengths = new Set(candidate.members.map((member) => Math.round(member.lengthMm))).size;
    const specialMembers = candidate.members.filter((member) => ['header', 'sill', 'jack_stud'].includes(member.role)).length;
    const volumeM3 = totalVolumeMm3 / 1e9;
    const materialCostEur = volumeM3 * rules.timberCostEurPerM3;
    const manufacturingCostEur = cutCount * rules.cutCostEur + componentCount * rules.assemblyCostEurPerMember;
    const estimatedCostEur = materialCostEur + manufacturingCostEur;
    const manufacturingComplexity = componentCount + 0.35 * cutCount + 0.8 * uniqueLengths + 0.5 * specialMembers;
    const estimatedMachineTimeMin = cutCount * rules.cutTimeMin + componentCount * rules.handlingTimeMinPerMember;

    return {
      timberVolumeM3: core.math.round(volumeM3, 5),
      timberLengthM: core.math.round(totalLengthMm / 1000, 3),
      componentCount,
      cutCount,
      uniqueLengthCount: uniqueLengths,
      materialCostEur: core.math.round(materialCostEur, 2),
      manufacturingCostEur: core.math.round(manufacturingCostEur, 2),
      estimatedCostEur: core.math.round(estimatedCostEur, 2),
      manufacturingComplexity: core.math.round(manufacturingComplexity, 2),
      estimatedMachineTimeMin: core.math.round(estimatedMachineTimeMin, 2),
      stockProxy: computeStockProxy(candidate, rules)
    };
  }

  function aggregateBom(candidate) {
    const groups = new Map();
    candidate.members.forEach((member) => {
      const key = [member.role, member.section.widthMm, member.section.depthMm, member.lengthMm, member.materialCode].join('|');
      if (!groups.has(key)) {
        groups.set(key, {
          role: member.role,
          materialCode: member.materialCode,
          sectionWidthMm: member.section.widthMm,
          sectionDepthMm: member.section.depthMm,
          cutLengthMm: member.lengthMm,
          quantity: 0,
          componentIds: []
        });
      }
      const group = groups.get(key);
      group.quantity += 1;
      group.componentIds.push(member.id);
    });
    return Array.from(groups.values()).sort((a, b) => a.role.localeCompare(b.role) || a.cutLengthMm - b.cutLengthMm);
  }

  core.metrics = { computeMetrics, aggregateBom, memberVolumeMm3 };
})(typeof globalThis !== 'undefined' ? globalThis : window);

