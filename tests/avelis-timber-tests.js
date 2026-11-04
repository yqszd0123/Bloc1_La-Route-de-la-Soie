'use strict';
const assert=require('node:assert/strict');
const {loadCore}=require('./load-core');
const core=loadCore();
let count=0;
function test(name,fn){try{fn();console.log('PASS '+name);count++;}catch(e){console.error('FAIL '+name,e);process.exitCode=1;}}
const base={...core.DEFAULT_INPUT,frameMaterial:'TIMBER'};
const preset=core.timberReference.preset();
const referenceInput={...base,...preset.input,timberReferenceId:preset.id};
function overlap(a,b){return ['x','y','z'].every(k=>Math.min(a.max[k],b.max[k])-Math.max(a.min[k],b.min[k])>1e-3);}
test('Avelis preset uses verified envelope and explicitly provisional opening defaults',()=>{
  const r=core.runWorkflow(referenceInput);assert.ok(r.ok);
  assert.equal(r.input.wallLengthMm,2720);assert.equal(r.input.wallHeightMm,2963);
  const c=r.recommended,o=c.wall.openings[0];assert.equal(o.heightMm,2000);assert.equal(o.sillMm,302);
  assert.equal(c.reference.confirmed.doorClearHeightMm,null);assert.equal(c.reference.exactReproduction,false);
  assert.equal(c.reference.status,'AVELIS_REFERENCE_DRAFT_PENDING_VERIFICATION');
  assert.equal(c.members.filter(m=>m.role==='top_plate').length,1);
  assert.ok(c.members.some(m=>m.role==='opening_base_member' && m.profile.sectionDepthMm===160));
  assert.ok(c.members.some(m=>m.role==='cripple_stud' && m.bounds.max.z<o.sillMm));
  assert.equal(c.members.some(m=>m.role==='sill'),false);
  const edited=core.runWorkflow({...referenceInput,doorHeightMm:2100});assert.ok(edited.ok);
  assert.equal(edited.recommended.reference.status,'MODIFIED_FROM_AVELIS_REFERENCE_UNVERIFIED');
});
test('mixed 145/160 sections match CAD bounds, length, quantities and component IDs',()=>{
  const r=core.runWorkflow(referenceInput),c=r.recommended;
  assert.equal(c.wall.displayDepthMm,160);assert.equal(c.wall.baseFrameDepthMm,145);
  const handover=core.serialize.manufacturingHandover(r,c);
  c.members.forEach(m=>{
    const depth=m.openingId?160:145;
    assert.equal(m.profile.sectionDepthMm,depth);
    assert.equal(m.sectionEnvelope.inPlaneWidthMm,45);
    assert.equal(m.bounds.max.y-m.bounds.min.y,depth);
    const width=m.axis==='x'?m.bounds.max.z-m.bounds.min.z:m.bounds.max.x-m.bounds.min.x;
    assert.equal(width,45);
    const exported=handover.components.find(p=>p.partId===m.id);
    assert.equal(exported.dimensionsMm.sectionDepth,depth);
    assert.equal(exported.dimensionsMm.length,m.lengthMm);
  });
  assert.ok(c.bom.some(r=>r.profileId==='TIMBER-45-160'));
  assert.ok(Math.abs(c.members.reduce((s,m)=>s+m.volumeM3,0)-c.metrics.timberVolumeM3)<1e-7);
  assert.equal(new Set(c.members.map(m=>m.id)).size,c.members.length);
});
test('generic wall types keep working with 625 mm and do not inherit Avelis lower members',()=>{
  const cases=[{windowEnabled:false,doorEnabled:false},...core.EXPERIMENT_PRESETS.map(p=>p.input)];
  cases.forEach(input=>{
    const r=core.runWorkflow({...base,...input,timberStudSpacingMm:625});assert.ok(r.ok);
    r.rankedCandidates.forEach(c=>{
      assert.equal(c.reference,null);assert.equal(c.members.filter(m=>m.role==='top_plate').length,2);
      assert.equal(c.members.some(m=>m.role==='opening_base_member'),false);
      c.members.forEach(m=>{if(m.openingId && c.wall.openings.find(o=>o.id===m.openingId).type==='DOOR')assert.equal(m.profile.id,'TIMBER-45-160');});
    });
  });
});
test('window positions and widths have king/jack/header/sill and both cripple zones without collisions',()=>{
  for(const x of [200,450,725,1200])for(const width of [50,200,625,1000])for(const sill of [300,800]){
    const r=core.runWorkflow({...base,wallLengthMm:3600,wallHeightMm:2800,windowXMm:x,windowWidthMm:width,windowHeightMm:900,sillHeightMm:sill,timberStudSpacingMm:625});
    assert.ok(r.ok,JSON.stringify({x,width,sill}));
    r.rankedCandidates.forEach(c=>{
      for(const role of ['king_stud','jack_stud','header','sill'])assert.ok(c.members.some(m=>m.role===role));
      assert.ok(c.members.some(m=>m.role==='cripple_stud'&&m.bounds.max.z<=sill-45+.001));
      assert.ok(c.members.some(m=>m.role==='cripple_stud'&&m.bounds.min.z>=sill+990-.001));
      for(let i=0;i<c.members.length;i++)for(let j=i+1;j<c.members.length;j++)assert.equal(overlap(c.members[i].bounds,c.members[j].bounds),false);
    });
  }
});
test('five material families: real cavity solids, exact face cutouts and opening-specific joinery',()=>{
  for(const input of [base,referenceInput,{...base,...core.EXPERIMENT_PRESETS[2].input}]){
    const c=core.runWorkflow(input).recommended, model=core.timberWallAssembly.build(c),s=model.partsSchedule;
    assert.deepEqual(model.layers.map(l=>l.id).sort(),['FRAME','INSULATION','RAIN_BARRIER','CLADDING','JOINERY'].sort());
    const ins=s.layers.find(l=>l.id==='INSULATION');
    for(const p of ins.parts)for(const solid of p.solids){
      c.members.forEach(m=>assert.equal(overlap(solid,m.bounds),false));
      c.wall.openings.forEach(o=>assert.equal(overlap(solid,{min:{x:o.xMm,y:0,z:o.sillMm},max:{x:o.xMm+o.widthMm,y:160,z:o.sillMm+o.heightMm}}),false));
    }
    const area=(c.wall.lengthMm*c.wall.heightMm-c.wall.openings.reduce((s,o)=>s+o.widthMm*o.heightMm,0))/1e6;
    for(const id of ['RAIN_BARRIER','CLADDING']){
      const l=s.layers.find(l=>l.id===id);
      assert.ok(Math.abs(l.totalNetAreaM2-area)<1e-5);
      const solidVolume=l.parts.flatMap(p=>p.solids).reduce((s,b)=>s+(b.max.x-b.min.x)*(b.max.y-b.min.y)*(b.max.z-b.min.z)/1e9,0);
      assert.ok(Math.abs(solidVolume-l.totalVolumeM3)<1e-7);
    }
    assert.equal(s.ventilationCavity.yMaxMm-s.ventilationCavity.yMinMm,20);
    const joinery=s.layers.find(l=>l.id==='JOINERY');assert.equal(joinery.parts.length,c.wall.openings.length);
    joinery.parts.forEach(p=>{const o=c.wall.openings.find(o=>o.id===p.openingId);assert.equal(p.heightMm,o.heightMm);assert.equal(p.xMm,o.xMm);assert.equal(p.thicknessMm,null);assert.equal(p.volumeM3,null);});
    assert.equal(new Set([...c.members.map(m=>m.id),...s.parts.map(p=>p.id)]).size,c.members.length+s.parts.length);
  }
});
test('manufacturing package separates wall materials and retains one numbered STL per timber member',()=>{
  const r=core.runWorkflow(referenceInput),c=r.recommended,files=core.packageBuilder.buildExportFiles(r);
  assert.ok(files['06_wall_materials/materials_bom.csv'].includes('JOINERY'));
  assert.equal(files['03_manufacturing/cutting_list.csv'].includes('JOINERY'),false);
  assert.ok(files['03_manufacturing/bom.csv'].includes('TIMBER-45-160'));
  c.members.forEach(m=>{
    const name=Object.keys(files).find(p=>p.includes('/parts/'+m.id+'_'));
    assert.ok(name);assert.ok(files[name].includes('solid '+m.id));
    const vertices=[...files[name].matchAll(/vertex ([\d.-]+) ([\d.-]+) ([\d.-]+)/g)].map(m=>m.slice(1).map(Number));
    ['x','y','z'].forEach((axis,i)=>{assert.ok(Math.abs(Math.min(...vertices.map(v=>v[i]))-m.bounds.min[axis]/20)<1e-6);assert.ok(Math.abs(Math.max(...vertices.map(v=>v[i]))-m.bounds.max[axis]/20)<1e-6);});
  });
  assert.equal((files['02_design/model_3d_profile_envelopes.step'].match(/MANIFOLD_SOLID_BREP\(/g)||[]).length,c.members.length);
  assert.equal(Object.values(files).some(f=>/\bNaN\b|\bundefined\b/.test(f)),false);
});
console.log(count+' Avelis timber tests passed');
