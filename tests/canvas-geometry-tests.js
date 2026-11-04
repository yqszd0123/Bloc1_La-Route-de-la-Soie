'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {loadCore,root} = require('./load-core');
const core=loadCore();
const sandbox={window:{AvelisApp:{},devicePixelRatio:2}};
vm.runInNewContext(fs.readFileSync(process.env.CANVAS_GEOMETRY_SOURCE || path.join(root,'apps/web/src/canvas-geometry.js'),'utf8'),sandbox);
const geometry=sandbox.window.AvelisApp.canvasGeometry;
function canvas() {
  const fills=[];let paths=[];
  const context={setTransform(){},clearRect(){fills.length=0;},save(){},restore(){},
    beginPath(){paths=[];},moveTo(x,y){paths.push([[x,y]]);},lineTo(x,y){paths.at(-1).push([x,y]);},
    closePath(){},setLineDash(){},stroke(){},fill(){fills.push({color:this.fillStyle,paths});}};
  return {clientWidth:1000,clientHeight:650,getContext:()=>context,fills};
}
function inside(point,loop) {
  let odd=false;
  for(let i=0,j=loop.length-1;i<loop.length;j=i++) {
    const a=loop[i],b=loop[j];
    if((a[1]>point[1])!==(b[1]>point[1]) && point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0]) odd=!odd;
  }
  return odd;
}
function fillAt(c,point) {
  let last=null;
  for(const fill of c.fills) if(fill.paths.reduce((odd,p)=>odd!==inside(point,p),false)) last=fill.color;
  return last;
}

// Independent ray/AABB visibility oracle. The nearest surface, not its centre, wins.
function rayHit(point,direction,boxes) {
  let front=-Infinity,color=null;
  for(const box of boxes) {
    let lo=-Infinity,hi=Infinity,face=-1;
    for(let i=0;i<3;i++) {
      const axis=['x','y','z'][i],min=box.bounds.min[axis],max=box.bounds.max[axis];
      if(Math.abs(direction[i])<1e-9) {
        if(point[i]<min || point[i]>max) {hi=-Infinity;break;}
      } else {
        const a=(min-point[i])/direction[i],b=(max-point[i])/direction[i];
        lo=Math.max(lo,Math.min(a,b));
        if(Math.max(a,b)<hi) {hi=Math.max(a,b);face=i;}
      }
    }
    if(hi>=lo && hi>front && face>=0) {
      front=hi;
      color=geometry.shade(box.color,direction[face]>0?[.72,.82,1.05][face]:[.68,.9,.62][face]);
    }
  }
  return color;
}
function verifyScene(bounds,label) {
  const boxes=bounds.map((bounds,i)=>({type:'box',bounds,color:'#'+(((i+1)*2654435761)>>>8).toString(16).padStart(6,'0')}));
  let checked=0;
  for(const rotationDeg of [0,28,75,90,135,180,225,270,330]) {
    const c=canvas(),view=geometry.render(c,boxes,{rotationDeg,padding:90});
    assert.equal(c.width,2000);assert.equal(c.height,1300);
    const {yaw,pitch,transform:t}=view;
    const sx=[Math.cos(yaw),-Math.sin(yaw),0];
    const sy=[Math.sin(yaw)*Math.sin(pitch),Math.cos(yaw)*Math.sin(pitch),-Math.cos(pitch)];
    const d=[Math.sin(yaw)*Math.cos(pitch),Math.cos(yaw)*Math.cos(pitch),Math.sin(pitch)];
    const errors=[];
    for(let x=43.37;x<960;x+=13.71)for(let y=39.61;y<615;y+=11.93) {
      const u=(x-t.offsetX)/t.scale,v=(y-t.offsetY)/t.scale;
      const expected=rayHit(sx.map((s,i)=>s*u+sy[i]*v),d,boxes);
      const actual=fillAt(c,[x,y]);
      if(expected!==actual)errors.push({x,y,expected,actual});
      if(expected)checked++;
    }
    assert.equal(errors.length,0,`${label}, angle ${rotationDeg}: ${JSON.stringify(errors.slice(0,3))}; ${errors.length} incorrect pixels`);
  }
  return checked;
}
const rect=(x,y,z,w,d,h)=>({min:{x,y,z},max:{x:x+w,y:y+d,z:z+h}});
let checked=verifyScene([rect(0,0,0,1200,145,45),rect(0,0,45,45,145,1200),rect(1155,0,45,45,145,1200),rect(0,0,1245,1200,145,45)],'long plates and tall studs');
for(const frameMaterial of ['STEEL','TIMBER']) {
  const c=core.runWorkflow({...core.DEFAULT_INPUT,frameMaterial}).recommended;
  checked+=verifyScene(c.members.map(m=>m.bounds),frameMaterial+' door/window frame');
}
const preset=core.timberReference.preset();
const c=core.runWorkflow({...core.DEFAULT_INPUT,...preset.input,frameMaterial:'TIMBER',timberReferenceId:preset.id}).recommended;
checked+=verifyScene(c.members.map(m=>m.bounds),'Avelis mixed-depth frame');
const assembly=core.timberWallAssembly.build(c,'COMPLETE');
checked+=verifyScene(assembly.layers.flatMap(l=>[...l.members.map(m=>m.bounds),...(l.solids||[])]),'Avelis full material assembly');
checked+=verifyScene(assembly.layers.flatMap(l=> {
  const offset=({FRAME:0,INSULATION:-1,JOINERY:-2,RAIN_BARRIER:1,CLADDING:2}[l.id]||0)*c.wall.lengthMm*.45;
  return [...l.members.map(m=>m.bounds),...(l.solids||[])].map(b=>({min:{...b.min,y:b.min.y+offset},max:{...b.max,y:b.max.y+offset}}));
}),'Avelis exploded assembly');

// A holed sheet must expose the frame inside the hole; overlays remain above everything.
const cv=canvas();
const polygon={type:'polygon',points:[[0,200,0],[100,200,0],[100,200,100],[0,200,100]],
  holes:[[[25,200,25],[75,200,25],[75,200,75],[25,200,75]]],fill:'#abcdef'};
const view=geometry.render(cv,[{type:'box',bounds:rect(0,0,0,100,100,100),color:'#ff0000'},polygon],{rotationDeg:0,pitchDeg:0});
const pixel=(x,z)=>[x*view.transform.scale+view.transform.offsetX,-z*view.transform.scale+view.transform.offsetY];
assert.equal(fillAt(cv,pixel(50,50)),geometry.shade('#ff0000',.82));
assert.equal(fillAt(cv,pixel(10,50)),'#abcdef');
geometry.render(cv,[{...polygon,holes:[],fill:'#00ff00',overlay:true},{type:'box',bounds:rect(0,0,0,100,300,100),color:'#ff0000'}],{rotationDeg:0,pitchDeg:0});
assert.equal(fillAt(cv,pixel(50,50)),'#00ff00','annotations remain on top');
const one=canvas();geometry.render(one,[{type:'box',bounds:rect(0,0,0,100,100,100),color:'#ff0000'}],{rotationDeg:28});
assert.equal(one.fills.length,3,'back-facing faces culled');
assert.equal(geometry.render(one,[],{}),null);assert.equal(one.fills.length,0);
console.log(`PASS 3D occlusion: ${checked} occupied samples checked against independent ray casting, 9 angles × 6 steel/timber/material scenes; cutouts, overlays and back faces`);
