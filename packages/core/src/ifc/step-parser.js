(function initStepParser(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  function stripComments(text) {
    return String(text).replace(/\/\*[\s\S]*?\*\//g, ' ');
  }

  function splitTopLevel(text) {
    const parts = [];
    let start = 0;
    let depth = 0;
    let quoted = false;
    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      if (char === "'") {
        if (quoted && text[index + 1] === "'") { index += 1; continue; }
        quoted = !quoted;
      } else if (!quoted) {
        if (char === '(') depth += 1;
        else if (char === ')') depth -= 1;
        else if (char === ',' && depth === 0) {
          parts.push(text.slice(start, index).trim());
          start = index + 1;
        }
      }
    }
    parts.push(text.slice(start).trim());
    return parts;
  }

  function parseValue(raw) {
    const value = raw.trim();
    if (!value || value === '$' || value === '*') return null;
    if (/^#\d+$/.test(value)) return { ref: Number(value.slice(1)) };
    if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replace(/''/g, "'");
    if (/^\.[A-Z0-9_]+\.$/i.test(value)) return value.slice(1, -1).toUpperCase();
    if (value.startsWith('(') && value.endsWith(')')) return splitTopLevel(value.slice(1, -1)).map(parseValue);
    const typed = value.match(/^([A-Z][A-Z0-9_]*)\((.*)\)$/is);
    if (typed) return { type: typed[1].toUpperCase(), value: parseValue(typed[2]) };
    const number = Number(value);
    if (Number.isFinite(number)) return number;
    return value;
  }

  function parseRecords(cleanText) {
    const records = new Map();
    const matcher = /#(\d+)\s*=\s*([A-Z][A-Z0-9_]*)\s*\(/ig;
    let match;
    while ((match = matcher.exec(cleanText))) {
      let depth = 1;
      let quoted = false;
      let end = matcher.lastIndex;
      for (; end < cleanText.length && depth > 0; end += 1) {
        const char = cleanText[end];
        if (char === "'") {
          if (quoted && cleanText[end + 1] === "'") { end += 1; continue; }
          quoted = !quoted;
        } else if (!quoted) {
          if (char === '(') depth += 1;
          else if (char === ')') depth -= 1;
        }
      }
      if (depth !== 0) throw new Error(`Unclosed IFC entity #${match[1]}.`);
      const argumentsText = cleanText.slice(matcher.lastIndex, end - 1);
      const record = {
        id: Number(match[1]),
        type: match[2].toUpperCase(),
        args: splitTopLevel(argumentsText).map(parseValue),
        raw: cleanText.slice(match.index, end)
      };
      records.set(record.id, record);
      matcher.lastIndex = end;
    }
    return records;
  }

  function parse(text) {
    const source = String(text || '');
    if (!/^\s*ISO-10303-21\s*;/i.test(source)) throw new Error('Not an ISO 10303-21 IFC STEP file.');
    const schemaMatch = source.match(/FILE_SCHEMA\s*\(\s*\(\s*'([^']+)'/i);
    if (!schemaMatch) throw new Error('IFC FILE_SCHEMA is missing.');
    const clean = stripComments(source);
    const records = parseRecords(clean);
    if (!records.size) throw new Error('IFC DATA section contains no parsed entities.');
    return {
      schema: schemaMatch[1].toUpperCase(),
      records,
      byType(type) {
        const expected = String(type).toUpperCase();
        return Array.from(records.values()).filter((record) => record.type === expected);
      },
      get(reference) {
        const id = typeof reference === 'number' ? reference : reference && reference.ref;
        return id == null ? null : records.get(id) || null;
      }
    };
  }

  core.ifcStep = { parse, parseValue, splitTopLevel, stripComments };
})(typeof globalThis !== 'undefined' ? globalThis : window);
