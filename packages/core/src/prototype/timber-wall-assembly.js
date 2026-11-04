(function initTimberWallAssembly(global) {
  'use strict';
  const core = global.AvelisCore;
  const VISUALS = {
    FRAME:{id:'FRAME',label:'Ossature bois',color:'#b47b4e',side:'CENTER',displayOrder:0},
    INSULATION:{id:'INSULATION',label:'Isolant biosourcé',color:'#c6aa59',side:'CENTER',displayOrder:1},
    RAIN_BARRIER:{id:'RAIN_BARRIER',label:'Pare-pluie rigide',color:'#7960a3',side:'EXTERIOR',displayOrder:2},
    CLADDING:{id:'CLADDING',label:'Bardage ventilé',color:'#a86c40',side:'EXTERIOR',displayOrder:3},
    JOINERY:{id:'JOINERY',label:'Menuiseries sur mesure',color:'#6a9eaf',side:'CENTER',displayOrder:1}
  };
  const STAGES = [
    {id:'FRAME',number:1,label:'Vue structurelle',includedLayers:['FRAME']},
    {id:'INSULATED',number:2,label:'Ossature et isolant',includedLayers:['FRAME','INSULATION']},
    {id:'LINED',number:3,label:'Pare-pluie et menuiseries',includedLayers:['FRAME','INSULATION','RAIN_BARRIER','JOINERY']},
    {id:'COMPLETE',number:4,label:'Vue complète',includedLayers:['FRAME','INSULATION','RAIN_BARRIER','CLADDING','JOINERY']}
  ];
  const round = (value,n=6) => core.math.round(value,n);
  function clippedCuts(rect, openings) {
    return openings.map((o) => {
      const x = Math.max(rect.xMm,o.xMm), z = Math.max(rect.zMm,o.sillMm);
      const w = Math.min(rect.xMm+rect.widthMm,o.xMm+o.widthMm)-x;
      const h = Math.min(rect.zMm+rect.heightMm,o.sillMm+o.heightMm)-z;
      return {id:o.id,type:o.type,xMm:x,zMm:z,widthMm:w,heightMm:h,areaMm2:w*h};
    }).filter((c) => c.widthMm > 0 && c.heightMm > 0);
  }
  function solidsFor(part) {
    if (!(part.thicknessMm > 0)) return [];
    const xCuts = [...new Set([part.xMm,part.xMm+part.widthMm,...part.cutouts.flatMap((c) => [c.xMm,c.xMm+c.widthMm])])].sort((a,b)=>a-b);
    const zCuts = [...new Set([part.zMm,part.zMm+part.heightMm,...part.cutouts.flatMap((c) => [c.zMm,c.zMm+c.heightMm])])].sort((a,b)=>a-b);
    const solids=[];
    for (let x=0;x<xCuts.length-1;x+=1) for(let z=0;z<zCuts.length-1;z+=1) {
      const cx=(xCuts[x]+xCuts[x+1])/2,cz=(zCuts[z]+zCuts[z+1])/2;
      if (part.cutouts.some((c)=>cx>c.xMm && cx<c.xMm+c.widthMm && cz>c.zMm && cz<c.zMm+c.heightMm)) continue;
      solids.push({min:{x:xCuts[x],y:part.yMm,z:zCuts[z]},max:{x:xCuts[x+1],y:part.yMm+part.thicknessMm,z:zCuts[z+1]}});
    }
    return solids;
  }
  function part(candidate, layer, rect, thicknessMm, yMm, extra) {
    const cuts = rect.cutouts || [];
    const area = rect.widthMm*rect.heightMm;
    const cutArea = cuts.reduce((sum,c)=>sum+c.areaMm2,0);
    const id = 'MAT-'+layer.id+'-'+core.math.hash32([candidate.members[0].id.split('-').slice(0,-1).join('-'),rect.xMm,rect.zMm,rect.widthMm,rect.heightMm].join('|'));
    const result = {id,layerId:layer.id,layerLabel:layer.label,referenceProduct:layer.referenceProduct,sourceId:layer.sourceId,
      status:'REFERENCE_PRODUCT_OR_DIMENSIONS_PENDING_AVELIS_VALIDATION',geometryType:cuts.length?'CONTOUR_WITH_OPENINGS':'RECTANGLE',
      xMm:rect.xMm,zMm:rect.zMm,yMm,widthMm:rect.widthMm,heightMm:rect.heightMm,thicknessMm,
      cutouts:cuts,grossAreaM2:round(area/1e6),cutoutAreaM2:round(cutArea/1e6),netAreaM2:round((area-cutArea)/1e6),
      volumeM3:thicknessMm===null?null:round((area-cutArea)*thicknessMm/1e9,9),...extra};
    result.solids=solidsFor(result);
    return result;
  }
  function buildPartsSchedule(candidate) {
    const config=core.ENGINEERING_DATA.referenceRules.timber.wallAssembly, wall=candidate.wall;
    const baseDepth=wall.baseFrameDepthMm || wall.displayDepthMm;
    const outerDepth=wall.displayDepthMm;
    const layer=(id,reference)=>({...VISUALS[id],...reference,parts:[]});
    const insulation=layer('INSULATION',config.insulation);
    insulation.thicknessMm=baseDepth;
    insulation.geometryMode='CAVITY_RECTANGLES';
    insulation.installation={method:config.insulation.method,futureMethod:config.insulation.futureMethod,referenceWidthMm:580,
      note:'Découpe selon les cavités réelles ; pas de compression forcée à 580 mm. Le produit et le procédé de projection restent à valider.'};
    insulation.parts=core.prototypeLayers.cavityRectangles(candidate).map((r)=>part(candidate,insulation,
      {xMm:r.xMin,zMm:r.zMin,widthMm:r.widthMm,heightMm:r.heightMm},baseDepth,0));
    const rain=layer('RAIN_BARRIER',config.rainBarrier);
    rain.geometryMode='TILED_SHEETS_WITH_OPENINGS';
    rain.layoutStatus='INDICATIVE_CUTTING_LAYOUT_SUPPORTS_AND_FIXINGS_TO_CONFIRM';
    for(let x=0;x<wall.lengthMm;x+=config.rainBarrier.panelWidthMm) for(let z=0;z<wall.heightMm;z+=config.rainBarrier.panelHeightMm) {
      const r={xMm:x,zMm:z,widthMm:Math.min(config.rainBarrier.panelWidthMm,wall.lengthMm-x),heightMm:Math.min(config.rainBarrier.panelHeightMm,wall.heightMm-z)};
      r.cutouts=clippedCuts(r,wall.openings);
      const p=part(candidate,rain,r,rain.thicknessMm,outerDepth);
      if(p.netAreaM2>0) rain.parts.push(p);
    }
    const cladding=layer('CLADDING',config.cladding);
    cladding.geometryMode='WALL_CONTOUR_WITH_OPENINGS';
    cladding.quantityBasis='NET_AREA_NOT_PLANK_COUNT';
    const face={xMm:0,zMm:0,widthMm:wall.lengthMm,heightMm:wall.heightMm};
    face.cutouts=clippedCuts(face,wall.openings);
    cladding.parts=[part(candidate,cladding,face,cladding.thicknessMm,outerDepth+rain.thicknessMm+config.cavity.depthMm)];
    const joinery=layer('JOINERY',{...config.joinery,referenceProduct:'Menuiserie sur mesure — enveloppe de réservation, fournisseur à confirmer'});
    joinery.thicknessMm=null;
    joinery.parts=wall.openings.map((o)=>part(candidate,joinery,
      {xMm:o.xMm,zMm:o.sillMm,widthMm:o.widthMm,heightMm:o.heightMm},null,baseDepth/2,
      {openingId:o.id,openingType:o.type,geometryType:'JOINERY_OPENING_ENVELOPE',productSpecification:null,
        installationClearanceMm:null,performance:null,quantity:1}));
    const layers=[insulation,rain,cladding,joinery].map((l)=>({...l,partCount:l.parts.length,
      totalNetAreaM2:round(l.parts.reduce((s,p)=>s+p.netAreaM2,0)),
      totalVolumeM3:l.id==='JOINERY'?null:round(l.parts.reduce((s,p)=>s+p.volumeM3,0),9)}));
    const parts=layers.flatMap((l)=>l.parts);
    return {status:'AVELIS_COMPONENT_FAMILIES_WITH_UNCONFIRMED_REFERENCE_PRODUCTS',
      scope:'Matériaux hors ossature séparés du débit bois ; épaisseurs de référence à confirmer, menuiseries sans profil fabricant inventé.',
      taxonomySourceId:config.taxonomySourceId,ventilationCavity:{...config.cavity,yMinMm:outerDepth+rain.thicknessMm,yMaxMm:outerDepth+rain.thicknessMm+config.cavity.depthMm},
      layers,parts,totals:{partCount:parts.length,netAreaM2:round(parts.reduce((s,p)=>s+p.netAreaM2,0)),
        volumeM3:round(parts.reduce((s,p)=>s+(p.volumeM3||0),0),9),volumeExcludesUnspecifiedJoinery:true},
      validation:{insulationMatchesStudDepth:insulation.thicknessMm===baseDepth,cavityRectangleCount:insulation.parts.length,
        cavityMergedAreaM2:round(insulation.parts.reduce((s,p)=>s+p.netAreaM2,0)),sheetCutoutsMatchOpenings:true}};
  }
  function build(candidate,stageId) {
    const stage=STAGES.find((s)=>s.id===(stageId||'COMPLETE'));
    if(!stage)throw new Error('Étape bois inconnue');
    const schedule=buildPartsSchedule(candidate);
    const layers=stage.includedLayers.map((id)=>id==='FRAME'?{
      ...VISUALS.FRAME,scope:'TIMBER_MANUFACTURING_MODEL',members:candidate.members.map((m)=>({id:m.id,role:m.role,bounds:core.math.deepClone(m.bounds)})),parts:[],surfaces:[],solids:[]
    }:{...schedule.layers.find((l)=>l.id===id),members:[],
      surfaces:id==='JOINERY'?schedule.layers.find((l)=>l.id===id).parts.map((p)=>({partId:p.id,xMin:p.xMm,xMax:p.xMm+p.widthMm,zMin:p.zMm,zMax:p.zMm+p.heightMm,yMm:p.yMm,cutouts:[]})):[],
      solids:schedule.layers.find((l)=>l.id===id).parts.flatMap((p)=>p.solids)});
    return {purpose:'TIMBER_WALL_ASSEMBLY',frameMaterial:'TIMBER',stage,wall:core.math.deepClone(candidate.wall),layers,partsSchedule:schedule,
      exportPolicy:{status:'MATERIALS_BOM_SEPARATE_FROM_TIMBER_CUTTING',manufacturingModelUnchanged:true,prototypeCsvAvailable:true,
        message:'Les quatre familles hors ossature sont exportées séparément dans le ZIP. Le STEP, les STL et le débit portent sur les bois.'}};
  }
  function bomRows(candidate) {
    const schedule=buildPartsSchedule(candidate);
    return [{category:'FRAME',label:VISUALS.FRAME.label,quantity:candidate.members.length,unit:'piece',netAreaM2:null,volumeM3:candidate.metrics.timberVolumeM3,
      componentIds:candidate.members.map((m)=>m.id),status:'TIMBER_CUTTING_LIST',sourceId:'AVELIS_EMAIL_2026_11_04'},
      ...schedule.layers.map((l)=>({category:l.id,label:l.label,quantity:l.id==='CLADDING'?l.totalNetAreaM2:l.partCount,
        unit:l.id==='CLADDING'?'m2':l.id==='RAIN_BARRIER'?'reference_panel_piece':l.id==='JOINERY'?'opening_unit':'cavity_piece',
        thicknessMm:l.thicknessMm,netAreaM2:l.totalNetAreaM2,volumeM3:l.totalVolumeM3,componentIds:l.parts.map((p)=>p.id),
        status:l.id==='JOINERY'?'OPENING_ENVELOPE_NOT_PRODUCT_DIMENSIONS':'REFERENCE_SPECIFICATION_NOT_CONFIRMED_BY_AVELIS',sourceId:l.sourceId}))];
  }
  function bomCsv(candidate) {
    return core.serialize.toCsv(bomRows(candidate),[{key:'category'},{key:'label'},{key:'quantity'},{key:'unit'},{key:'thicknessMm',label:'thickness_mm'},
      {key:'netAreaM2',label:'net_area_m2'},{key:'volumeM3',label:'volume_m3'},
      {label:'component_ids',get:r=>r.componentIds.join('|')},{key:'status'},{key:'sourceId',label:'source_id'}]);
  }
  core.timberWallAssembly={STAGES,VISUALS,buildPartsSchedule,build,bomRows,bomCsv,solidsFor};
})(typeof globalThis !== 'undefined' ? globalThis : window);
