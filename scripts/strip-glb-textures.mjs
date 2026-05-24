// Strip-down a GLB: remove all images / textures / texture-references on materials,
// emit a slim GLB that preserves geometry + node hierarchy + a single plain material.
//
// Usage: node scripts/strip-glb-textures.mjs <input.glb> <output.glb>

import fs from 'node:fs';
import path from 'node:path';

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error('Usage: node scripts/strip-glb-textures.mjs <input.glb> <output.glb>');
  process.exit(1);
}

const buf = fs.readFileSync(inPath);

const magic = buf.toString('utf8', 0, 4);
if (magic !== 'glTF') { console.error('Not a GLB file'); process.exit(1); }

const jsonLen = buf.readUInt32LE(12);
const jsonChunkType = buf.toString('utf8', 16, 20);
if (jsonChunkType !== 'JSON') { console.error('Expected JSON chunk first'); process.exit(1); }

const json = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));
const binChunkStart = 20 + jsonLen;
const binLen = buf.readUInt32LE(binChunkStart);
const binData = buf.subarray(binChunkStart + 8, binChunkStart + 8 + binLen);

// Identify bufferViews used by geometry — accessors + sparse + Draco extension
// (must keep Draco BVs or the mesh data is lost when stripping a compressed GLB).
const geomBVs = new Set();
(json.accessors || []).forEach((acc) => {
  if (typeof acc.bufferView === 'number') geomBVs.add(acc.bufferView);
  if (acc.sparse) {
    if (typeof acc.sparse.indices?.bufferView === 'number') geomBVs.add(acc.sparse.indices.bufferView);
    if (typeof acc.sparse.values?.bufferView === 'number') geomBVs.add(acc.sparse.values.bufferView);
  }
});
(json.meshes || []).forEach((m) => {
  (m.primitives || []).forEach((p) => {
    const draco = p.extensions?.KHR_draco_mesh_compression;
    if (draco && typeof draco.bufferView === 'number') geomBVs.add(draco.bufferView);
  });
});

// Repack BIN with only geometry bufferViews
const oldBVs = json.bufferViews || [];
const newBVs = [];
const bvMap = new Map();
const chunks = [];
let offset = 0;
oldBVs.forEach((bv, i) => {
  if (!geomBVs.has(i)) return;
  const start = bv.byteOffset || 0;
  const slice = binData.subarray(start, start + bv.byteLength);
  chunks.push(slice);
  const padLen = (4 - (slice.length % 4)) % 4;
  if (padLen) chunks.push(Buffer.alloc(padLen));
  const newBv = { buffer: 0, byteOffset: offset, byteLength: bv.byteLength };
  if (typeof bv.byteStride === 'number') newBv.byteStride = bv.byteStride;
  if (typeof bv.target === 'number') newBv.target = bv.target;
  newBVs.push(newBv);
  bvMap.set(i, newBVs.length - 1);
  offset += slice.length + padLen;
});
const newBin = Buffer.concat(chunks);

// Remap accessors to new bufferView indices
(json.accessors || []).forEach((acc) => {
  if (typeof acc.bufferView === 'number') acc.bufferView = bvMap.get(acc.bufferView);
  if (acc.sparse) {
    if (typeof acc.sparse.indices?.bufferView === 'number')
      acc.sparse.indices.bufferView = bvMap.get(acc.sparse.indices.bufferView);
    if (typeof acc.sparse.values?.bufferView === 'number')
      acc.sparse.values.bufferView = bvMap.get(acc.sparse.values.bufferView);
  }
});

json.bufferViews = newBVs;
json.buffers = [{ byteLength: newBin.length }];

// Drop all images + textures + samplers
delete json.images;
delete json.textures;
delete json.samplers;

// Strip texture references from materials and normalize them to a single matte material
(json.materials || []).forEach((mat) => {
  if (mat.pbrMetallicRoughness) {
    delete mat.pbrMetallicRoughness.baseColorTexture;
    delete mat.pbrMetallicRoughness.metallicRoughnessTexture;
    mat.pbrMetallicRoughness.baseColorFactor = [0.04, 0.04, 0.04, 1];
    mat.pbrMetallicRoughness.metallicFactor = 0.1;
    mat.pbrMetallicRoughness.roughnessFactor = 0.9;
  } else {
    mat.pbrMetallicRoughness = {
      baseColorFactor: [0.04, 0.04, 0.04, 1],
      metallicFactor: 0.1,
      roughnessFactor: 0.9,
    };
  }
  delete mat.normalTexture;
  delete mat.occlusionTexture;
  delete mat.emissiveTexture;
});

// Write GLB
const jsonStr = JSON.stringify(json);
const jsonBuf = Buffer.from(jsonStr, 'utf8');
const jsonPad = (4 - (jsonBuf.length % 4)) % 4;
const paddedJson = jsonPad ? Buffer.concat([jsonBuf, Buffer.alloc(jsonPad, 0x20)]) : jsonBuf;

const binPad = (4 - (newBin.length % 4)) % 4;
const paddedBin = binPad ? Buffer.concat([newBin, Buffer.alloc(binPad, 0)]) : newBin;

const total = 12 + 8 + paddedJson.length + 8 + paddedBin.length;
const out = Buffer.alloc(total);
out.write('glTF', 0);
out.writeUInt32LE(2, 4);
out.writeUInt32LE(total, 8);
// JSON chunk
out.writeUInt32LE(paddedJson.length, 12);
out.write('JSON', 16);
paddedJson.copy(out, 20);
// BIN chunk
const binChunkOffset = 20 + paddedJson.length;
out.writeUInt32LE(paddedBin.length, binChunkOffset);
out[binChunkOffset + 4] = 0x42; // B
out[binChunkOffset + 5] = 0x49; // I
out[binChunkOffset + 6] = 0x4e; // N
out[binChunkOffset + 7] = 0x00; // \0
paddedBin.copy(out, binChunkOffset + 8);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out);

console.log(`Stripped: ${(buf.length / 1024).toFixed(0)} KB → ${(out.length / 1024).toFixed(0)} KB`);
console.log(`Meshes preserved: ${json.meshes?.length || 0}`);
console.log(`Nodes preserved: ${json.nodes?.length || 0}`);
console.log(`Materials: ${json.materials?.length || 0} (textures removed, set to matte grey)`);
