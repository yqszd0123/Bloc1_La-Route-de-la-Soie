(function initDownloadController(global) {
  'use strict';

  const app = global.AvelisApp;
  const core = global.AvelisCore;

  function download(name, data, type) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: type || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function current() {
    const result = app.state.result;
    return { result, candidate: result ? core.selectCandidate(result, app.state.selectedCandidateId) : null };
  }

  function enable(enabled) {
    ['download-design', 'download-stl', 'download-package', 'download-bom'].forEach((id) => { document.getElementById(id).disabled = !enabled; });
  }

  function bind() {
    document.getElementById('download-design').addEventListener('click', () => {
      const { result, candidate } = current();
      download(`${result.input.wallId}_${candidate.id}.json`, JSON.stringify({ project: result.project, candidate }, null, 2), 'application/json');
    });
    document.getElementById('download-stl').addEventListener('click', () => {
      const { result, candidate } = current();
      download(`${result.input.wallId}_${candidate.id}_scale_1_${result.input.prototypeScale}.stl`, core.stl.stlForCandidate(candidate, result.input.prototypeScale), 'model/stl');
    });
    document.getElementById('download-bom').addEventListener('click', () => {
      const { result, candidate } = current();
      download(`${result.input.wallId}_${candidate.id}_BOM.csv`, core.serialize.bomCsv(candidate), 'text/csv;charset=utf-8');
    });
    document.getElementById('download-package').addEventListener('click', () => {
      const { result, candidate } = current();
      const bytes = core.packageBuilder.buildExportZip(result, candidate, result.input.prototypeScale);
      download(`${result.input.projectId}_${result.input.wallId}_${candidate.id}.zip`, bytes, 'application/zip');
    });
  }

  app.downloadController = { bind, enable };
})(window);

