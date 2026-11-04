(function initTimberReference(global) {
  'use strict';
  const core = global.AvelisCore;
  function preset() { return core.ENGINEERING_DATA.referenceRules.timber.referencePreset; }
  function describe(input) {
    if (!input.timberReferenceId) return null;
    const p = preset(), expected = p.input, door = input.openings.find((o) => o.type === 'DOOR');
    const same = ['wallLengthMm','wallHeightMm','wallThicknessMm','timberSection','timberStudSpacingMm'].every((key) => input[key] === expected[key])
      && input.openings.length === 1 && door && door.xMm === expected.doorXMm && door.sillMm === expected.timberDoorBaseMm
      && door.widthMm === expected.doorWidthMm && door.heightMm === expected.doorHeightMm;
    return { id:p.id, sourceId:p.sourceId, exactReproduction:false,
      status:same ? 'AVELIS_REFERENCE_DRAFT_PENDING_VERIFICATION' : 'MODIFIED_FROM_AVELIS_REFERENCE_UNVERIFIED',
      message:same ? 'Référence Avelis — reconstruction provisoire, cotes de baie et éléments bas à vérifier.'
        : 'Basé sur le dessin de référence Avelis, avec paramètres modifiés — ne reproduit pas le plan original.',
      confirmed:core.math.deepClone(core.ENGINEERING_DATA.sources[p.sourceId].rawData),
      assumptions:core.math.deepClone(p.defaultAssumptions), unresolved:[...p.unresolved] };
  }
  core.timberReference = {preset,describe};
})(typeof globalThis !== 'undefined' ? globalThis : window);
