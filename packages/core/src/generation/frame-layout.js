(function initFrameLayout(global) {
  'use strict';
  const core = global.AvelisCore = global.AvelisCore || {};
  const EPSILON = 0.001;

  function subtractIntervals(lengthMm, blocked) {
    let segments = [{ start: 0, end: lengthMm }];
    blocked.slice().sort((a, b) => a.start - b.start).forEach((cut) => {
      const next = [];
      segments.forEach((segment) => {
        if (cut.end <= segment.start || cut.start >= segment.end) {
          next.push(segment);
          return;
        }
        if (cut.start > segment.start) next.push({ start: segment.start, end: Math.min(cut.start, segment.end) });
        if (cut.end < segment.end) next.push({ start: Math.max(cut.end, segment.start), end: segment.end });
      });
      segments = next;
    });
    return segments.filter((segment) => segment.end - segment.start > EPSILON);
  }

  function uniqueSorted(values) {
    return values
      .slice()
      .sort((a, b) => a - b)
      .filter((value, index, sorted) => index === 0 || Math.abs(value - sorted[index - 1]) > EPSILON)
      .map((value) => core.math.round(value, 3));
  }

  function intervalCount(lengthMm, targetModuleMm) {
    return Math.max(1, Math.ceil((lengthMm - EPSILON) / targetModuleMm));
  }

  function uniformCenters(startMm, endMm, targetModuleMm) {
    const lengthMm = endMm - startMm;
    if (!(lengthMm > EPSILON)) return [];
    const count = intervalCount(lengthMm, targetModuleMm);
    const spacing = lengthMm / count;
    return Array.from({ length: Math.max(0, count - 1) }, (_, index) => (
      core.math.round(startMm + spacing * (index + 1), 3)
    ));
  }

  function symmetricModuleCenters(startMm, endMm, targetModuleMm) {
    const lengthMm = endMm - startMm;
    if (!(lengthMm > EPSILON)) return [];
    const count = intervalCount(lengthMm, targetModuleMm);
    if (count === 1) return [];

    const fullModuleIntervals = Math.max(0, count - 2);
    const edgeBayMm = (lengthMm - fullModuleIntervals * targetModuleMm) / 2;
    const centers = [startMm + edgeBayMm];
    for (let index = 0; index < fullModuleIntervals; index += 1) {
      centers.push(centers[centers.length - 1] + targetModuleMm);
    }
    return centers.map((center) => core.math.round(center, 3));
  }

  function boundaryCenters(wallLengthMm, studWidthMm) {
    return [studWidthMm / 2, wallLengthMm - studWidthMm / 2];
  }

  function openingJambCenters(openings, studWidthMm, leftBoundaryMm, rightBoundaryMm) {
    return openings.flatMap((opening) => [
      opening.xMm - studWidthMm / 2,
      opening.xMm + opening.widthMm + studWidthMm / 2
    ]).filter((center) => center > leftBoundaryMm + EPSILON && center < rightBoundaryMm - EPSILON);
  }

  function buildGridPlan(wallLengthMm, targetModuleMm, strategy, openings, studWidthMm) {
    const [leftBoundaryMm, rightBoundaryMm] = boundaryCenters(wallLengthMm, studWidthMm);
    let centers = [];
    let zones = [{ startMm: leftBoundaryMm, endMm: rightBoundaryMm }];

    if (strategy === 'SYMMETRIC_MODULE') {
      centers = symmetricModuleCenters(leftBoundaryMm, rightBoundaryMm, targetModuleMm);
    } else if (strategy === 'UNIFORM_BAYS') {
      centers = uniformCenters(leftBoundaryMm, rightBoundaryMm, targetModuleMm);
    } else if (strategy === 'OPENING_ZONED') {
      const anchors = uniqueSorted([
        leftBoundaryMm,
        ...openingJambCenters(openings, studWidthMm, leftBoundaryMm, rightBoundaryMm),
        rightBoundaryMm
      ]);
      zones = anchors.slice(0, -1).map((startMm, index) => ({ startMm, endMm: anchors[index + 1] }));
      centers = zones.flatMap((zone) => uniformCenters(zone.startMm, zone.endMm, targetModuleMm));
    } else {
      throw new Error(`Unknown grid strategy: ${strategy}`);
    }

    return {
      strategy,
      targetModuleMm,
      boundaryCentersMm: [leftBoundaryMm, rightBoundaryMm].map((value) => core.math.round(value, 3)),
      centersMm: uniqueSorted(centers),
      zones: zones.map((zone) => ({
        startMm: core.math.round(zone.startMm, 3),
        endMm: core.math.round(zone.endMm, 3)
      }))
    };
  }

  core.frameLayout = { subtractIntervals, uniqueSorted, buildGridPlan, symmetricModuleCenters, uniformCenters };
})(typeof globalThis !== 'undefined' ? globalThis : window);
