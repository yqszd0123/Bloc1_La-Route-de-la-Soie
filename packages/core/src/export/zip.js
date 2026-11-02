(function initZip(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};
  const encoder = new TextEncoder();

  function crc32(bytes) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i += 1) {
      crc ^= bytes[i];
      for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xEDB88320 : 0);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function u16(value) {
    const bytes = new Uint8Array(2);
    new DataView(bytes.buffer).setUint16(0, value, true);
    return bytes;
  }

  function u32(value) {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value >>> 0, true);
    return bytes;
  }

  function concat(chunks) {
    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const output = new Uint8Array(total);
    let offset = 0;
    chunks.forEach((chunk) => { output.set(chunk, offset); offset += chunk.length; });
    return output;
  }

  function bytesOf(value) {
    if (value instanceof Uint8Array) return value;
    if (value instanceof ArrayBuffer) return new Uint8Array(value);
    return encoder.encode(String(value));
  }

  function createZip(files) {
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    Object.keys(files).sort().forEach((name) => {
      const nameBytes = encoder.encode(name.replace(/\\/g, '/'));
      const data = bytesOf(files[name]);
      const crc = crc32(data);
      const localHeader = concat([
        u32(0x04034B50), u16(20), u16(0x0800), u16(0), u16(0), u16(0),
        u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), nameBytes
      ]);
      localParts.push(localHeader, data);
      const centralHeader = concat([
        u32(0x02014B50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0),
        u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), u16(0),
        u16(0), u16(0), u32(0), u32(offset), nameBytes
      ]);
      centralParts.push(centralHeader);
      offset += localHeader.length + data.length;
    });
    const localData = concat(localParts);
    const centralData = concat(centralParts);
    const end = concat([
      u32(0x06054B50), u16(0), u16(0), u16(centralParts.length), u16(centralParts.length),
      u32(centralData.length), u32(localData.length), u16(0)
    ]);
    return concat([localData, centralData, end]);
  }

  core.zip = { crc32, createZip, bytesOf };
})(typeof globalThis !== 'undefined' ? globalThis : window);

