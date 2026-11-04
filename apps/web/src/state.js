(function initState(global) {
  'use strict';

  global.AvelisApp = global.AvelisApp || {};
  global.AvelisApp.state = {
    result: null,
    selectedCandidateId: null,
    rotationDeg: 28,
    showLabels: false,
    prototypeStage: 'COMPLETE',
    prototypeRotationDeg: 28,
    prototypeExplode: 100,
    ifcText: null,
    ifcModel: null,
    stepModel: null,
    stepFileName: null,
    activePage: 'config-page'
  };
})(window);
