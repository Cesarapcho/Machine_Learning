/* Challenge UPCH · V3.1. Los datos y planes son resultados del notebook
   Challenge_UPCH_Reabastecimiento_Luricocha_TRASLADOS_PRIORIDADES.ipynb.
   El diagrama resalta el plan obtenido; no recrea una traza no exportada. */
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const PLACES = {
 Huayllay:{need:5,km:2,travel:2,priority:1,code:'00003666'},
 'Azángaro':{need:4,km:5,travel:5,priority:3,code:'00003664'},
 Pampay:{need:3,km:8,travel:8,priority:2,code:'00025031'}
};
const EMPTY=Array(4).fill(null).map(()=>['Sin entrega',0]);
const ALGS=[
 {id:'dfs',name:'DFS',tag:'Profundidad',verb:'Ir hasta el final.',desc:'Sigue una rama; acepta el primer plan completo.',cost:184,effort:5,unit:'estados',time:'0,04',plan:EMPTY},
 {id:'bfs',name:'BFS',tag:'Anchura',verb:'Ir por niveles.',desc:'Prueba primero decisiones cercanas al inicio.',cost:184,effort:137,unit:'estados',time:'2,39',plan:EMPTY},
 {id:'bf',name:'BF',tag:'Probar todo',verb:'Comparar todos.',desc:'Examina todos los planes completos permitidos.',cost:70,effort:4993,unit:'planes completos',time:'102,65',plan:[['Azángaro',3],['Pampay',3],['Azángaro',1],['Huayllay',2]]},
 {id:'hill',name:'Hill Climbing',tag:'Mejorar',verb:'Mejorar cerca.',desc:'Cambia el plan mientras encuentra un vecino mejor.',cost:73,effort:102,unit:'vecinos',time:'4,44',plan:[['Azángaro',3],['Pampay',3],['Huayllay',3],['Sin entrega',0]]},
 {id:'astar',name:'A*',tag:'Estimar',verb:'Costo + estimación.',desc:'Combina el costo recorrido con lo que puede faltar.',cost:70,effort:55,unit:'estados',time:'0,75',plan:[['Azángaro',3],['Pampay',3],['Azángaro',1],['Huayllay',2]]}
];
const PIPE=[
 ['Problema','Hay más solicitudes que stock.','?',['12 solicitados','9 disponibles','3 faltan como mínimo']],
 ['Datos','Usamos tres destinos reales; cantidades y costos simulados.','09',['3 destinos','1 medicamento','Costos simulados']],
 ['Representación','Cada estado resume lo que queda y lo que ya se entregó.','{}',['Stock','Pendientes','Entregas']],
 ['Espacio de estados','Cada entrega abre distintas alternativas.','⑂',['Estado inicial','10 opciones iniciales','4 oportunidades']],
 ['DFS / BFS','Dos formas de recorrer las mismas decisiones.','↝',['DFS · pila','BFS · cola','Primer plan']],
 ['BF','Compara los planes completos del escenario.','∞',['4.993 planes','70 puntos','Probar todo']],
 ['Hill Climbing','Mejora el plan con cambios cercanos.','↗',['102 vecinos','73 puntos','Mejora local']],
 ['A*','Combina el costo recorrido y una estimación.','★',['g(n) + h(n)','55 estados','70 puntos']],
 ['Resultados','Comparamos costo, búsqueda y medicamentos pendientes.','≠',['5 algoritmos','4 entregas','Costo y pendientes']]
];
let active='dfs',step=0,playing=false,playTimer=null,place='Huayllay';
const selected=()=>ALGS.find(a=>a.id===active);
const quantity=plan=>plan.reduce((n,a)=>n+a[1],0);
const sum=obj=>Object.values(obj).reduce((a,b)=>a+b,0);
function snapshot(plan,upto=4){let needs=Object.fromEntries(Object.entries(PLACES).map(([n,v])=>[n,v.need]));let stock=9;for(let i=0;i<upto;i++){let [n,q]=plan[i];if(q){needs[n]-=q;stock-=q;}}return {needs,stock,pending:sum(needs)};}
function tooltip(el,text){const tip=$('#tooltip');const move=e=>{tip.textContent=text;tip.classList.add('visible');let x=e.clientX+14,y=e.clientY+16;if(x+245>innerWidth)x=e.clientX-245;if(y+90>innerHeight)y=e.clientY-90;tip.style.left=Math.max(8,x)+'px';tip.style.top=Math.max(8,y)+'px';};el.addEventListener('pointermove',move);el.addEventListener('pointerleave',()=>tip.classList.remove('visible'));el.addEventListener('blur',()=>tip.classList.remove('visible'));}
function renderMap(){const p=PLACES[place];$$('.map-stop').forEach(b=>{b.classList.toggle('active',b.dataset.place===place);b.setAttribute('aria-pressed',String(b.dataset.place===place))});$('#placeName').textContent=place;$('#placeDistance').textContent=p.km;$('#placeCost').textContent=p.travel+' puntos';$('#placePriority').textContent=p.priority+' · relativa';$('#placeNeed').textContent=p.need+' frascos';$('#placeText').textContent=`${p.km} km y ${p.travel} puntos simulados por viaje; prioridad ${p.priority}.`}
$$('.map-stop').forEach(b=>{b.addEventListener('click',()=>{place=b.dataset.place;renderMap()});b.addEventListener('pointerenter',()=>{place=b.dataset.place;renderMap()})});
function renderPipeline(){
 const host=$('#pipelineGrid');
 host.innerHTML=PIPE.map(([name,summary,mark,chips],i)=>`
 <button type="button" class="pipe-card" data-i="${i}" aria-pressed="false" aria-label="${name}: girar tarjeta para ver el resumen">
  <span class="pipe-card-inner">
   <span class="pipe-face pipe-front" aria-hidden="false">
    <small>${String(i+1).padStart(2,'0')} / 09</small>
    <span class="pipe-mark" aria-hidden="true">${mark}</span>
    <strong>${name}</strong><span class="pipe-more" aria-hidden="true">↗</span>
    <span class="pipe-action">VER RESUMEN ↗</span>
   </span>
   <span class="pipe-face pipe-back" aria-hidden="true">
    <small>${String(i+1).padStart(2,'0')} / 09 · EN BREVE</small>
    <strong>${name}</strong>
    <span class="pipe-summary">${summary}</span>
    <span class="pipe-chips">${chips.map(c=>`<span>${c}</span>`).join('')}</span>
    <span class="pipe-action">↶ VOLVER</span>
   </span>
  </span>
 </button>`).join('');
 const close=(button)=>{button.classList.remove('is-flipped');button.setAttribute('aria-pressed','false');button.querySelector('.pipe-front').setAttribute('aria-hidden','false');button.querySelector('.pipe-back').setAttribute('aria-hidden','true');};
 $$('.pipe-card').forEach(button=>{
  button.addEventListener('click',()=>{
   const opening=!button.classList.contains('is-flipped');
   $$('.pipe-card').forEach(close);
   if(opening){button.classList.add('is-flipped');button.setAttribute('aria-pressed','true');button.querySelector('.pipe-front').setAttribute('aria-hidden','true');button.querySelector('.pipe-back').setAttribute('aria-hidden','false');}
   $('#pipeCaption').textContent=opening?`${PIPE[+button.dataset.i][0]} · ${PIPE[+button.dataset.i][1]}`:'Haz clic para girar una tarjeta · vuelve a hacer clic para cerrarla.';
  });
  button.addEventListener('pointermove',event=>{const rect=button.getBoundingClientRect();button.style.setProperty('--mx',((event.clientX-rect.left)/rect.width*100)+'%');button.style.setProperty('--my',((event.clientY-rect.top)/rect.height*100)+'%');});
 });
}
const NS='http://www.w3.org/2000/svg';
function svg(tag,attrs,parent){const el=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));if(parent)parent.appendChild(el);return el}
function text(g,x,y,string,cls=''){const el=svg('text',{x,y,class:cls},g);el.textContent=string;return el}
function edge(g,x1,y1,x2,y2,on){svg('path',{d:`M${x1} ${y1} C${(x1+x2)/2} ${y1},${(x1+x2)/2} ${y2},${x2} ${y2}`,class:'state-edge'+(on?' selected':'')},g)}
function node(g,x,y,w,title,detail,cl='',note='',h=68){
 const group=svg('g',{class:'state-node '+cl,tabindex:note?'0':'-1',role:note?'button':'img','aria-label':note||`${title}: ${detail}`},g);
 svg('rect',{x,y,width:w,height:h,rx:h<45?8:11},group);
 text(group,x+12,y+(h<45?15:26),title,h<45?'compact-title':'');
 text(group,x+12,y+(h<45?29:49),detail,h<45?'sub compact-sub':'sub');
 if(note){const announce=()=>{$('#diagramInfo').textContent=note};group.addEventListener('click',announce);group.addEventListener('pointerenter',announce);group.addEventListener('focus',announce);group.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();announce()}})}
 return group;
}
function actionLabel([n,q]){return q?`${n} · ${q}`:'Sin entrega'}
function renderDiagram(){
 const a=selected(),p=a.plan,root=$('#stateSvg');root.replaceChildren();
 const current=snapshot(p,step);
 const opts=[['Sin entrega',0],...Object.entries(PLACES).flatMap(([n,v])=>Array.from({length:Math.min(3,v.need)},(_,i)=>[n,i+1]))];
 const first=opts.findIndex(([n,q])=>n===p[0][0]&&q===p[0][1]);
 const firstX=271, firstW=184, optH=36, optStart=56, optGap=43;
 const startY=222, centerY=256;
 const coords=[null,null,{x:585,w:161},{x:815,w:161},{x:1045,w:168}];
 text(root,23,29,'INICIO','heading');
 text(root,firstX,29,'PRIMERA DECISIÓN','heading');
 text(root,585,29,'SEGUNDA','heading');
 text(root,815,29,'TERCERA','heading');
 text(root,1045,29,'CUARTA','heading');
 opts.forEach((opt,i)=>edge(root,221,centerY,firstX,optStart+optGap*i+optH/2,step>0&&i===first));
 edge(root,firstX+firstW,optStart+optGap*first+optH/2,coords[2].x,centerY,step>=2);
 edge(root,coords[2].x+coords[2].w,centerY,coords[3].x,centerY,step>=3);
 edge(root,coords[3].x+coords[3].w,centerY,coords[4].x,centerY,step>=4);
 node(root,18,startY,203,'ESTADO INICIAL','9 en origen · 12 pendientes',step===0?'selected':'');
 opts.forEach((opt,i)=>{
  const state=snapshot([opt],1);
  node(root,firstX,optStart+optGap*i,firstW,actionLabel(opt),`${state.stock} stock · ${state.pending} faltan`,step>=1&&i===first?'selected':'option',`Si eliges ${actionLabel(opt)}: ${state.stock} en origen, ${state.pending} pendientes.`,optH);
 });
 for(let k=2;k<=4;k++){
  const state=snapshot(p,k),{x,w}=coords[k];
  node(root,x,startY,w,actionLabel(p[k-1]),`${state.stock} stock · ${state.pending} faltan`,step>=k?'selected':'future',`Después de ${k} decisiones: ${state.stock} en origen; ${state.pending} pendientes.`);
 }
 $('#diagramStage').textContent=step===0?'ANTES DE ENTREGAR · 0/4':`OPORTUNIDAD ${step} / 4`;
 $('#diagramInfo').textContent=step===0?'9 en origen · 12 pendientes.':`${actionLabel(p[step-1])}: ${current.stock} en origen · ${current.pending} pendientes.`;
 $('#stepBack').disabled=step===0;$('#stepNext').disabled=step===4;
}
function pause(){playing=false;clearInterval(playTimer);$('#stepPlay').textContent='▶ Reproducir'}
function setStep(n){step=Math.max(0,Math.min(4,n));renderDiagram();if(step>=4)pause()}
$('#stepBack').addEventListener('click',()=>{pause();setStep(step-1)});$('#stepNext').addEventListener('click',()=>{pause();setStep(step+1)});$('#stepReset').addEventListener('click',()=>{pause();setStep(0)});$('#stepPlay').addEventListener('click',()=>{if(playing){pause();return}if(step===4)step=0;playing=true;$('#stepPlay').textContent='Ⅱ Pausar';renderDiagram();playTimer=setInterval(()=>setStep(step+1),1150)});
function visual(kind){const v={dfs:'M30 145L100 145L100 44L176 44L176 145L254 145L254 44L320 44',bfs:'M30 90L100 90M100 28L100 150M100 28L210 28M100 90L210 90M100 150L210 150M210 28L319 28M210 90L319 90M210 150L319 150',bf:'M25 40H330M25 83H330M25 126H330M25 169H330',hill:'M25 170L100 137L180 105L235 114L320 45',astar:'M26 171L100 129L175 139L236 65L320 24'};return `<svg viewBox="0 0 360 190"><path d="${v[kind]}" fill="none" stroke="#47805a" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><circle cx="320" cy="${kind==='astar'?24:kind==='hill'?45:44}" r="13" fill="#c5e379"/></svg>`}
function renderPickers(){for(let id of ['mainPicker','resultsPicker']){const host=$('#'+id);host.innerHTML=ALGS.map(a=>`<button data-alg="${a.id}" class="${a.id===active?'active':''}" aria-pressed="${a.id===active}">${a.name}</button>`).join('');$$('#'+id+' button').forEach(b=>b.addEventListener('click',()=>choose(b.dataset.alg)))}}
function renderAlgs(){const a=selected();$('#algorithmCards').innerHTML=ALGS.map((x,i)=>`<button class="alg-card ${x.id===active?'active':''}" data-alg="${x.id}" aria-pressed="${x.id===active}"><small>${String(i+1).padStart(2,'0')} / 05</small><strong>${x.name}</strong><span>${x.tag} ↗</span></button>`).join('');$$('.alg-card').forEach(b=>{b.addEventListener('click',()=>choose(b.dataset.alg));b.addEventListener('pointerenter',()=>choose(b.dataset.alg))});$('#algorithmTag').textContent=a.name.toUpperCase()+' / '+a.tag.toUpperCase();$('#algorithmVisual').innerHTML=visual(a.id);$('#algorithmVerb').textContent=a.verb;$('#algorithmExplanation').textContent=a.desc;$('#algorithmCost').textContent=a.cost}
function rowChart(host,values,maximum,formatter,onchoose){host.innerHTML=values.map(v=>`<button class="chart-row ${v.id===active?'active':''}" data-alg="${v.id}" aria-pressed="${v.id===active}" title="${v.note||''}"><span>${v.label}</span><span class="bar-rail"><span class="bar-fill" style="width:${Math.max(0,v.value/maximum*100)}%"></span></span><b>${formatter(v)}</b></button>`).join('');$$('#'+host.id+' button').forEach(b=>{b.addEventListener('click',()=>onchoose(b.dataset.alg));b.addEventListener('pointerenter',()=>onchoose(b.dataset.alg));tooltip(b,values.find(v=>v.id===b.dataset.alg).note)})}
function renderResults(){const a=selected(),s=snapshot(a.plan);$('#metricCost').textContent=a.cost;$('#metricEffort').textContent=a.effort.toLocaleString('es-PE');$('#metricEffortUnit').textContent=a.unit;$('#metricTime').textContent=a.time;$('#metricPending').textContent=s.pending;rowChart($('#costChart'),ALGS.map(x=>({id:x.id,label:x.name,value:x.cost,note:`${x.name}: ${x.cost} puntos simulados`})),184,v=>v.value,choose);rowChart($('#effortChart'),ALGS.map(x=>({id:x.id,label:x.name,value:Math.log10(x.effort+1),note:`${x.name}: ${x.effort.toLocaleString('es-PE')} ${x.unit}`})),Math.log10(4994),v=>ALGS.find(a=>a.id===v.id).effort.toLocaleString('es-PE'),choose);$('#pendingChart').innerHTML=Object.entries(PLACES).map(([n,v])=>`<div class="pending-item" tabindex="0" title="${n}: antes ${v.need}, después ${s.needs[n]}"><div><span>${n}</span><span>${s.needs[n]} / ${v.need} pendientes</span></div><div class="pending-rail"><span style="width:${100*s.needs[n]/v.need}%"></span></div></div>`).join('');rowTravel();$('#planName').textContent=a.name;$('#planSteps').innerHTML=a.plan.map(([n,q],i)=>`<div class="plan-step" title="Oportunidad ${i+1}: ${q?q+' frascos para '+n:'sin entrega'}"><small>${String(i+1).padStart(2,'0')} / ENTREGA</small><strong>${q?n:'Sin entrega'}</strong><span>${q?q+' frascos · '+PLACES[n].travel+' puntos de traslado':'0 frascos · 0 traslado'}</span></div>`).join('');$('#planSummary').textContent=`${quantity(a.plan)} frascos enviados · ${s.pending} pendientes · ${a.cost} puntos de costo total.`;renderPickers()}
function rowTravel(){const host=$('#travelChart');host.innerHTML=Object.entries(PLACES).map(([n,v])=>`<button class="chart-row ${n===place?'active':''}" data-place="${n}" title="${n}: ${v.km} km simulados; ${v.travel} puntos por traslado"><span>${n}</span><span class="bar-rail"><span class="bar-fill" style="width:${100*v.travel/8}%"></span></span><b>${v.travel}</b></button>`).join('');$$('#travelChart button').forEach(b=>{b.addEventListener('click',()=>{place=b.dataset.place;renderMap();rowTravel()});b.addEventListener('pointerenter',()=>{place=b.dataset.place;renderMap()});tooltip(b,`${b.dataset.place}: ${PLACES[b.dataset.place].km} km simulados y ${PLACES[b.dataset.place].travel} puntos de traslado`)})}
function choose(id){if(active!==id){pause();active=id;step=0;renderDiagram();renderPickers();renderAlgs();renderResults();}else{renderPickers()}}
$('#sourceToggle').addEventListener('click',()=>{const p=$('#sourcesBody');p.hidden=!p.hidden;$('#sourceToggle').setAttribute('aria-expanded',String(!p.hidden));$('#sourceToggle span').textContent=p.hidden?'＋':'−'});
function initMotion(){const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;if(!reduce&&'IntersectionObserver' in window){let o=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');o.unobserve(e.target)}}),{threshold:.07});$$('.reveal').forEach(e=>o.observe(e))}else $$('.reveal').forEach(e=>e.classList.add('visible'));const update=()=>{$('#progress').style.width=100*scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)+'%'};addEventListener('scroll',update,{passive:true});addEventListener('resize',update);update();if(!reduce&&matchMedia('(pointer:fine)').matches){const art=$('.tilt');art.addEventListener('pointermove',e=>{const b=art.getBoundingClientRect();const x=(e.clientX-b.left)/b.width-.5,y=(e.clientY-b.top)/b.height-.5;art.style.transform=`perspective(1200px) rotateY(${x*2}deg) rotateX(${-y*2}deg)`});art.addEventListener('pointerleave',()=>art.style.transform='')}}
renderMap();renderPipeline();renderPickers();renderAlgs();renderDiagram();renderResults();initMotion();
