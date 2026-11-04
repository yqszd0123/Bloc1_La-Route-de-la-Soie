(function initMetrics(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function computeMetrics(candidate, rules) {
    const timber = candidate.frameMaterial === 'TIMBER';
    const volumeM3 = candidate.members.reduce((sum, member) => sum + (member.volumeM3 || 0), 0);
    const steelMassKg = candidate.members.reduce((sum, member) => sum + member.massKg, 0);
    const totalLengthMm = candidate.members.reduce((sum, member) => sum + member.lengthMm, 0);
    const componentCount = candidate.members.length;
    const cutCount = candidate.members.reduce((sum, member) => sum + (member.operations.includes('CUT_SQUARE') ? 2 : 0), 0);
    const uniqueLengthCount = new Set(candidate.members.map((member) => Math.round(member.lengthMm * 1000) / 1000)).size;
    const uniqueProfileCount = new Set(candidate.members.map((member) => member.profile.id)).size;
    const quantity = timber ? volumeM3 : steelMassKg;
    const unitPrice = rules.budgetPrice.valueEurPerUnitExVat;
    const lowPrice = rules.budgetPrice.lowerReferenceEurPerUnitExVat;
    const highPrice = rules.budgetPrice.upperReferenceEurPerUnitExVat;
    return {
      ...(timber ? { timberVolumeM3: core.math.round(volumeM3, 8) } : { steelMassKg: core.math.round(steelMassKg, 3) }),
      frameMaterial: candidate.frameMaterial,
      materialMassKg: core.math.round(steelMassKg, 3),
      materialQuantity: core.math.round(quantity, timber ? 8 : 3),
      materialQuantityUnit: timber ? 'm3' : 'kg',
      totalProfileLengthM: core.math.round(totalLengthMm / 1000, 3),
      componentCount,
      cutCount,
      uniqueLengthCount,
      uniqueProfileCount,
      minimumStudBayMm: candidate.layout.minimumBayMm,
      maximumStudBayMm: candidate.layout.maximumBayMm,
      studBaySpreadMm: candidate.layout.spacingSpreadMm,
      materialCostEstimateEurExVat: core.math.round(quantity * unitPrice, 2),
      materialCostRangeEurExVat: {
        low: core.math.round(quantity * lowPrice, 2),
        high: core.math.round(quantity * highPrice, 2)
      },
      priceBasis: {
        ...(timber ? { valueEurPerM3ExVat: unitPrice } : { valueEurPerKgExVat: unitPrice }),
        unit: timber ? 'm3' : 'kg', valueEurPerUnitExVat: unitPrice,
        date: rules.budgetPrice.priceDate,
        status: rules.budgetPrice.status,
        boundary: rules.budgetPrice.boundary
      },
      machineTimeMin: null,
      carbonKgCo2e: null,
      unavailableMetrics: ['machineTimeMin: Avelis equipment cycle data missing', 'carbonKgCo2e: applicable product EPD missing']
    };
  }

  function aggregateBom(candidate) {
    const groups = new Map();
    candidate.members.forEach((member) => {
      const key = [member.role, member.profile.id, member.lengthMm].join('|');
      if (!groups.has(key)) {
        groups.set(key, {
          role: member.role,
          profileId: member.profile.id,
          manufacturerReference: member.profile.manufacturerReference,
          materialId: member.material.id,
          cutLengthMm: member.lengthMm,
          massKgPerM: member.profile.massKgPerM,
          quantity: 0,
          totalLengthM: 0,
          totalMassKg: 0,
          sectionWidthMm: member.profile.sectionWidthMm || null,
          sectionDepthMm: member.sectionEnvelope.depthMm,
          totalVolumeM3: 0,
          componentIds: []
        });
      }
      const row = groups.get(key);
      row.quantity += 1;
      row.totalLengthM += member.lengthMm / 1000;
      row.totalMassKg += member.massKg;
      row.totalVolumeM3 += member.volumeM3 || 0;
      row.componentIds.push(member.id);
    });
    return Array.from(groups.values()).map((row) => Object.assign(row, {
      totalLengthM: core.math.round(row.totalLengthM, 3),
      totalMassKg: core.math.round(row.totalMassKg, 3),
      totalVolumeM3: core.math.round(row.totalVolumeM3, 8)
    })).sort((a, b) => a.role.localeCompare(b.role) || a.profileId.localeCompare(b.profileId) || a.cutLengthMm - b.cutLengthMm);
  }

  function reconcileMass(candidate) {
    const memberMass = candidate.members.reduce((sum, member) => sum + member.massKg, 0);
    const bomMass = candidate.bom.reduce((sum, row) => sum + row.totalMassKg, 0);
    return {
      memberSumKg: core.math.round(memberMass, 3),
      bomSumKg: core.math.round(bomMass, 3),
      absoluteDifferenceKg: core.math.round(Math.abs(memberMass - bomMass), 4),
      status: Math.abs(memberMass - bomMass) <= 0.01 ? 'MATCH' : 'MISMATCH'
    };
  }

  core.metrics = { computeMetrics, aggregateBom, reconcileMass };
})(typeof globalThis !== 'undefined' ? globalThis : window);
