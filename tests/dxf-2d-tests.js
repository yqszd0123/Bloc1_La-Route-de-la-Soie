'use strict';
const assert = require('node:assert/strict');
const { loadCore } = require('./load-core');
const core = loadCore();
const rect = (x, z, width, height, y = 0, depth = 145) => ({bounds: {
  min: {x, y, z}, max: {x:x+width, y:y+depth, z:z+height}
}});
const signedArea = (loop) => loop.reduce((sum, p, i) => {
  const q = loop[(i+1)%loop.length]; return sum + p[0]*q[1] - q[0]*p[1];
}, 0) / 2;

// Independent sweep of projected rectangles: expected union area, including overlaps.
function unionArea(members) {
  const xs = [...new Set(members.flatMap(m => [m.bounds.min.x,m.bounds.max.x]))].sort((a,b)=>a-b);
  let area = 0;
  for (let i=1;i<xs.length;i++) {
    const middle=(xs[i-1]+xs[i])/2;
    const intervals=members.filter(m=>m.bounds.min.x<middle && m.bounds.max.x>middle)
      .map(m=>[m.bounds.min.z,m.bounds.max.z]).sort((a,b)=>a[0]-b[0]);
    let end=-Infinity, height=0;
    for (const [lo,hi] of intervals) { height+=Math.max(0,hi-Math.max(lo,end));end=Math.max(end,hi); }
    area+=(xs[i]-xs[i-1])*height;
  }
  return area;
}

// Read actual DXF entity records, not the intermediate contour objects.
function readPolylines(text) {
  const lines=text.trimEnd().split(/\r?\n/); assert.equal(lines.length%2,0);
  const entities=[];let record;
  for (let i=0;i<lines.length;i+=2) {
    if (lines[i]==='0') {record={type:lines[i+1],groups:{}};entities.push(record);}
    else if(record) record.groups[lines[i]]=lines[i+1];
  }
  assert.equal(entities.at(-1).type,'EOF');
  assert.equal(entities.some(e=>e.type==='3DFACE'),false);
  const loops=[];let current;
  for(const e of entities) {
    if(e.type==='POLYLINE') {
      assert.equal(e.groups[70],'1');assert.equal(e.groups[8],'CUT');
      assert.equal(current,undefined);current=[];
    } else if(e.type==='VERTEX') {
      assert.ok(current);assert.equal(e.groups[30],'0');
      current.push([Number(e.groups[10]),Number(e.groups[20])]);
    } else if(e.type==='SEQEND') {assert.ok(current);loops.push(current);current=undefined;}
  }
  assert.equal(current,undefined);return loops;
}

function check(members) {
  const loops=readPolylines(core.dxf.dxf2dForCandidate({members}));
  for(const loop of loops) {
    assert.ok(loop.length>=4);
    assert.equal(new Set(loop.map(p=>p.join(','))).size,loop.length,'no self-touching loops');
    loop.forEach((p,i)=>{
      const q=loop[(i+1)%loop.length];
      assert.ok(p.every(Number.isFinite));
      assert.ok((p[0]===q[0]) !== (p[1]===q[1]),'nonzero orthogonal contour edge');
    });
  }
  assert.ok(Math.abs(loops.reduce((s,l)=>s+signedArea(l),0)-unionArea(members))<.1,'union area preserved');
  return loops;
}

// Joint seams disappear; overlap along depth also becomes a single outline.
assert.deepEqual(check([rect(0,0,100,10),rect(10,10,10,100)]),[
  [[0,0],[100,0],[100,10],[20,10],[20,110],[10,110],[10,10],[0,10]]
]);
assert.equal(check([rect(0,0,100,100),rect(25,25,50,50,200,160)]).length,1);
// Opposite diagonal contacts must form two simple closed loops in either orientation.
for(const pair of [[rect(0,0,10,10),rect(10,10,10,10)], [rect(0,10,10,10),rect(10,0,10,10)]])
  assert.equal(check(pair).length,2);
assert.equal(check([rect(0,0,10,10),rect(30,40,10,10)]).length,2);
assert.deepEqual(core.dxf.memberCutContours({members:[]}),[]);
const snapped=core.dxf.memberCutContours({members:[rect(0,0,10,10),rect(10.005,0,9.995,10)]});
assert.equal(snapped.length,1);assert.equal(signedArea(snapped[0]),200);
check([rect(.125,.375,42.5,60.25)]);

const preset=core.timberReference.preset();
const cases=[...['STEEL','TIMBER'].flatMap(frameMaterial=>[
  {...core.DEFAULT_INPUT,frameMaterial,windowEnabled:false,doorEnabled:false},
  ...core.EXPERIMENT_PRESETS.map(p=>({...core.DEFAULT_INPUT,...p.input,frameMaterial}))
]),{...core.DEFAULT_INPUT,...preset.input,frameMaterial:'TIMBER',timberReferenceId:preset.id}];
let candidates=0;
for(const input of cases) {
  const result=core.runWorkflow(input);assert.ok(result.ok);
  for(const candidate of result.rankedCandidates) {
    const loops=check(candidate.members);const points=loops.flat();
    assert.equal(Math.max(...points.map(p=>p[0])),candidate.wall.lengthMm);
    assert.equal(Math.max(...points.map(p=>p[1])),candidate.wall.heightMm);
    assert.ok(loops.some(l=>signedArea(l)<0),'internal frame cavities retained');
    const files=core.packageBuilder.buildExportFiles(result,candidate,20);
    assert.equal(files['02_design/model_2d_frame_face.dxf'],core.dxf.dxf2dForCandidate(candidate));
    assert.ok(files['02_design/model_3d_profile_envelopes.dxf'].includes('3DFACE'));
    candidates++;
  }
}
console.log(`PASS DXF 2D: seams, overlaps, diagonal contacts, fractional dimensions, empty input; ${candidates} steel/timber/reference candidates at full scale in ZIP`);
