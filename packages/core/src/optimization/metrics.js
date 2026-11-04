(function initMetrics(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function computeMetrics(candidate, rules) {
    const steelMassKg = candidate.members.reduce((sum, member) => sum + member.massKg, 0);
    const totalLengthMm = candidate.members.reduce((sum, member) => sum + member.lengthMm, 0);
    const componentCount = candidate.members.length;
    const cutCount = candidate.members.reduce((sum, member) => sum + (member.operations.includes('CUT_SQUARE') ? 2 : 0), 0);
    const uniqueLengthCount = new Set(candidate.members.map((member) => Math.round(member.lengthMm * 1000) / 1000)).size;
    const uniqueProfileCount = new Set(candidate.members.map((member) => member.profile.id)).size;
    const unitPrice = rules.budgetPrice.valueEurPerKgExVat;
    const lowPrice = rules.budgetPrice.lowerReferenceEurPerKgExVat;
    const highPrice = rules.budgetPrice.upperReferenceEurPerKgExVat;
    return {
      steelMassKg: core.math.round(steelMassKg, 3),
      totalProfileLengthM: core.math.round(totalLengthMm / 1000, 3),
      componentCount,
      cutCount,
      uniqueLengthCount,
      uniqueProfileCount,
      minimumStudBayMm: candidate.layout.minimumBayMm,
      maximumStudBayMm: candidate.layout.maximumBayMm,
      studBaySpreadMm: candidate.layout.spacingSpreadMm,
      materialCostEstimateEurExVat: core.math.round(steelMassKg * unitPrice, 2),
      materialCostRangeEurExVat: {
        low: core.math.round(steelMassKg * lowPrice, 2),
        high: core.math.round(steelMassKg * highPrice, 2)
      },
      priceBasis: {
        valueEurPerKgExVat: unitPrice,
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
          componentIds: []
        });
      }
      const row = groups.get(key);
      row.quantity += 1;
      row.totalLengthM += member.lengthMm / 1000;
      row.totalMassKg += member.massKg;
      row.componentIds.push(member.id);
    });
    return Array.from(groups.values()).map((row) => Object.assign(row, {
      totalLengthM: core.math.round(row.totalLengthM, 3),
      totalMassKg: core.math.round(row.totalMassKg, 3)
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
