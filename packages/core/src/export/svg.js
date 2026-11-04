(function initSvg(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function escapeXml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));
  }

  function svgForCandidate(candidate) {
    const margin = 180;
    const width = candidate.wall.lengthMm + margin * 2;
    const height = candidate.wall.heightMm + margin * 2;
    const parts = [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Élévation du mur ${escapeXml(candidate.id)}">`,
      '<rect width="100%" height="100%" fill="#f8f6f1"/>',
      `<g transform="translate(${margin} ${candidate.wall.heightMm + margin}) scale(1 -1)">`
    ];
    candidate.members.forEach((member) => {
      const b = member.bounds;
      const color = core.ROLE_COLORS[member.role] || '#b47b4e';
      parts.push(`<rect x="${b.min.x}" y="${b.min.z}" width="${b.max.x - b.min.x}" height="${b.max.z - b.min.z}" fill="${color}" stroke="#3b291f" stroke-width="5"><title>${escapeXml(member.id)} — ${escapeXml(member.label)}</title></rect>`);
    });
    candidate.wall.openings.forEach((opening) => {
      const isDoor = opening.type === 'DOOR';
      const fill = isDoor ? '#fff0d8' : '#dff4ff';
      const stroke = isDoor ? '#b45f18' : '#1976a3';
      const label = isDoor ? 'Porte' : 'Fenêtre';
      parts.push(`<rect x="${opening.xMm}" y="${opening.sillMm}" width="${opening.widthMm}" height="${opening.heightMm}" fill="${fill}" fill-opacity="0.8" stroke="${stroke}" stroke-width="8"><title>${label} ${escapeXml(opening.id)}</title></rect>`);
    });
    parts.push('</g>');
    parts.push(`<text x="${margin}" y="85" font-family="Arial,sans-serif" font-size="56" font-weight="700" fill="#182b36">${escapeXml(candidate.id)} — mur ${candidate.wall.lengthMm} × ${candidate.wall.heightMm} mm</text>`);
    parts.push(`<text x="${margin}" y="140" font-family="Arial,sans-serif" font-size="34" fill="#465b66">${escapeXml(candidate.option.studProfileId)} · ${escapeXml(candidate.option.gridStrategyLabel)} · ${candidate.layout.minimumBayMm}–${candidate.layout.maximumBayMm} mm réels</text>`);
    parts.push(`<line x1="${margin}" y1="${height - 70}" x2="${margin + candidate.wall.lengthMm}" y2="${height - 70}" stroke="#182b36" stroke-width="5"/>`);
    parts.push(`<text x="${margin + candidate.wall.lengthMm / 2}" y="${height - 85}" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" fill="#182b36">${candidate.wall.lengthMm} mm</text>`);
    parts.push('</svg>');
    return parts.join('\n');
  }

  core.svg = { svgForCandidate };
})(typeof globalThis !== 'undefined' ? globalThis : window);
