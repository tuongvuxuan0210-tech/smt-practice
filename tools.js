/* Công cụ luyện: CAD → Mount, Teaching AOI, Phán định ảnh */
window.LAST_RESULT={};
/* ---------- tiện ích ---------- */
const $=s=>document.querySelector(s);
function rng(seed){let a=(seed>>>0)||1;const next=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  return{next,uni:(x,y)=>x+(y-x)*next(),int:(x,y)=>Math.floor(x+(y-x+1)*next()),pick:a=>a[Math.floor(next()*a.length)],
  norm:(m,s)=>{let u=0;while(u===0)u=next();const v=next();return m+s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)},sign:()=>next()<.5?-1:1}}
const r2=v=>Math.round(v*100)/100, f2=v=>r2(v).toFixed(2), f1=v=>(Math.round(v*10)/10).toFixed(1);
const newSeed=()=>Math.floor(Math.random()*90000)+10000;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const natSort=(a,b)=>{const pa=a.match(/^([A-Z]+)(\d+)$/),pb=b.match(/^([A-Z]+)(\d+)$/);return pa[1]===pb[1]?pa[2]-pb[2]:pa[1]<pb[1]?-1:1};

/* ================= TAB 1: CAD → MOUNT ================= */
const PKG={
 '0402':{tape:0,pre:['R','C'],w:1.0,h:0.5},
 '0603':{tape:0,pre:['R','C'],w:1.6,h:0.8},
 'SOD-123':{tape:180,pre:['D'],w:3.7,h:1.6},
 'SOT-23':{tape:180,pre:['Q'],w:2.9,h:2.4},
 'TANT-B':{tape:180,pre:['C'],w:3.5,h:2.8},
 'SOIC-8':{tape:90,pre:['U'],w:4.9,h:6.0},
 'SOT-223':{tape:270,pre:['U'],w:6.5,h:7.0},
 'QFN-32':{tape:0,pre:['U'],w:5,h:5}};
const VALS={R:['10k','1k','4.7k','100R','22R','47k'],C:['100nF','10nF','1uF','4.7uF'],D:['1N4148W','B5819W'],Q:['MMBT3904','AO3401'],U:['LM358','NE555','AMS1117-3.3','STM32F030','24C02']};
const VAL_BY_PKG={'TANT-B':['10uF/16V','22uF/10V'],'SOIC-8':['LM358','NE555','24C02'],'SOT-223':['AMS1117-3.3'],'QFN-32':['STM32F030','ATmega328P']};
const BOMOPT=['OK','Thiếu trong CAD','Không có trong BOM','Sai package','DNP – bỏ khỏi chương trình'];
let CAD=null;

function genCad(seed,level){
  const r=rng(seed);
  const W=+r.uni(60,140).toFixed(1),H=+r.uni(40,100).toFixed(1);
  const ox=r2(r.uni(80,180)),oy=r2(r.uni(40,120));
  const fx=r2(r.uni(3,6)),fy=r2(r.uni(3,6));
  const n=level===1?8:level===2?10:12;
  const keys=Object.keys(PKG),cnt={},comps=[];
  for(let i=0;i<n;i++){
    const pk=r.pick(keys),pre=r.pick(PKG[pk].pre);cnt[pre]=(cnt[pre]||0)+1;
    const val=VAL_BY_PKG[pk]?r.pick(VAL_BY_PKG[pk]):r.pick(VALS[pre]);
    const x=r2(r.uni(8,W-8)),y=r2(r.uni(8,H-8));
    const side=level>=2&&r.next()<.35?'B':'T';
    const rot=level===3&&r.next()<.25?r.pick([45,135,225,315]):r.pick([0,90,180,270]);
    comps.push({ref:pre+cnt[pre],pk,val,side,x,y,rot,cadX:r2(ox+x),cadY:r2(oy+y)});
  }
  if(level>=2&&!comps.some(c=>c.side==='B')){comps[n-1].side='B';comps[n-2].side='B';}
  if(level>=2&&!comps.some(c=>c.side==='T')){comps[0].side='T';}
  let bom=null,bomKey=null;
  if(level>=2){
    bom=comps.map(c=>({ref:c.ref,val:c.val,pk:c.pk,dnp:false}));bomKey={};
    comps.forEach(c=>bomKey[c.ref]='OK');
    const idx=[...Array(n).keys()].sort(()=>r.next()-.5);
    const [b,c,d]=idx;
    // Ref có trong BOM nhưng thiếu trong CAD
    cnt.R=(cnt.R||0)+1;const ghost='R'+cnt.R;bom.push({ref:ghost,val:'10k',pk:'0603',dnp:false});bomKey[ghost]='Thiếu trong CAD';
    // Ref có trong CAD nhưng không có trong BOM
    bom=bom.filter(x=>x.ref!==comps[b].ref);bomKey[comps[b].ref]='Không có trong BOM';
    // Sai package
    const e=bom.find(x=>x.ref===comps[c].ref);const others=keys.filter(k=>k!==e.pk&&PKG[k].pre.some(p=>e.ref.startsWith(p)));
    e.pk=others.length?r.pick(others):(e.pk==='0603'?'0805':'0603');bomKey[e.ref]='Sai package';
    // DNP
    const g=bom.find(x=>x.ref===comps[d].ref);g.dnp=true;bomKey[g.ref]='DNP – bỏ khỏi chương trình';
    bom.sort((p,q)=>natSort(p.ref,q.ref));
  }
  let panel=null;
  if(level===3){
    const cols=r.int(2,3),rows=r.int(2,3),gx=+r.uni(2,4).toFixed(1),gy=+r.uni(2,4).toFixed(1),px=+r.uni(4,9).toFixed(1),py=+r.uni(4,9).toFixed(1);
    const tops=comps.filter(c=>c.side==='T');const qs=[];
    for(let i=0;i<3;i++){qs.push({c:r.pick(tops),k:r.int(2,cols*rows)});}
    panel={cols,rows,gx,gy,px,py,stepX:r2(W+gx),stepY:r2(H+gy),qs};
  }
  return{seed,level,W,H,ox,oy,fx,fy,fidX:r2(ox+fx),fidY:r2(oy+fy),comps,bom,bomKey,panel};
}
function cadAnswers(cad,conv){
  return cad.comps.map(c=>{
    const lx=r2(c.cadX-cad.ox),ly=r2(c.cadY-cad.oy);
    const xm=c.side==='T'?lx:r2(cad.W-lx);
    let th=c.side==='T'?c.rot:(conv==='A'?(360-c.rot)%360:(540-c.rot)%360);
    if(cad.level>=2)th=(th-PKG[c.pk].tape+360)%360;
    return{x:xm,y:ly,a:th};
  });
}
function renderCad(seed){
  const level=+$('#cadLevel').value;$('#cadSeed').value=seed;
  CAD=genCad(seed,level);const c=CAD;
  let info=`<div><span>Kích thước board</span><b>${f1(c.W)} × ${f1(c.H)} mm</b></div>`;
  if(level===1)info+=`<div><span>Góc dưới-trái board trong hệ CAD</span><b>(${f2(c.ox)}, ${f2(c.oy)})</b></div>`;
  else info+=`<div><span>FID1 trong hệ CAD</span><b>(${f2(c.fidX)}, ${f2(c.fidY)})</b></div><div><span>FID1 cách góc dưới-trái board</span><b>X ${f2(c.fx)} · Y ${f2(c.fy)}</b></div>`;
  info+=`<div><span>Mã đề · mức</span><b>${seed} · ${['','Dễ','Vừa','Khó'][level]}</b></div>`;
  $('#cadInfo').innerHTML=info;
  const rules=[];
  rules.push('Gốc chương trình máy là góc dưới-trái của board, nhìn từ mặt đang gắp. Đơn vị mm, góc CAD đo ngược chiều kim đồng hồ, nhìn từ mặt Top.');
  rules.push(level===1?'X máy = X CAD − X gốc; Y máy = Y CAD − Y gốc.':'Tự suy ra gốc board từ tọa độ FID1. Mặt Top: X máy = X CAD − X gốc; Y máy = Y CAD − Y gốc.');
  if(level>=2){rules.push(`Mặt Bottom: board lật trái-phải. X máy = W − (X CAD − X gốc); Y máy giữ nguyên; góc sau khi lật θ' theo quy ước đang chọn: ${$('#cadConv').value==='A'?'(360 − θ) mod 360':'(180 − θ) mod 360'}.`);
    rules.push('Góc máy = (góc sau khi xét mặt − góc trong tape + 360) mod 360.');}
  else rules.push('Mức Dễ: góc máy = góc CAD.');
  rules.push('Làm tròn 2 chữ số thập phân; sai số cho phép ±0,01 mm.');
  if(level===3)rules.push('Panel: board con đánh số từ trái sang phải, từ dưới lên trên; board 1 ở góc dưới-trái. Tọa độ panel = gốc board 1 + (cột − 1) × step X, (hàng − 1) × step Y + tọa độ máy trên board.');
  $('#cadRules').innerHTML=rules.map(x=>`<li>${x}</li>`).join('');
  $('#tapeWrap').style.display=level>=2?'':'none';
  $('#tapeTbl').innerHTML='<tr><th>Package</th><th>Góc trong tape</th></tr>'+Object.keys(PKG).map(k=>`<tr><td>${k}</td><td class="m">${PKG[k].tape}°</td></tr>`).join('');
  $('#cadTbl').innerHTML='<tr><th>Ref</th><th>Value</th><th>Package</th><th>Mặt</th><th>X CAD</th><th>Y CAD</th><th>θ CAD</th><th>X máy</th><th>Y máy</th><th>Góc máy</th></tr>'+
    c.comps.map((p,i)=>`<tr><td><b>${p.ref}</b></td><td>${esc(p.val)}</td><td>${p.pk}</td><td><span class="pill p${p.side}">${p.side==='T'?'Top':'Bottom'}</span></td><td class="m">${f2(p.cadX)}</td><td class="m">${f2(p.cadY)}</td><td class="m">${p.rot}°</td>
    <td><input class="num" data-k="x${i}"></td><td><input class="num" data-k="y${i}"></td><td><input class="num" data-k="a${i}"></td></tr>`).join('');
  $('#bomCard').style.display=c.bom?'':'none';
  if(c.bom){
    $('#bomTbl').innerHTML='<tr><th>Ref</th><th>Value</th><th>Package</th><th>Ghi chú</th></tr>'+c.bom.map(b=>`<tr><td><b>${b.ref}</b></td><td>${esc(b.val)}</td><td>${b.pk}</td><td>${b.dnp?'DNP':''}</td></tr>`).join('');
    const refs=Object.keys(c.bomKey).sort(natSort);
    $('#bomAns').innerHTML='<tr><th>Ref</th><th>Kết luận</th></tr>'+refs.map(rf=>`<tr><td><b>${rf}</b></td><td><select data-b="${rf}">${BOMOPT.map(o=>`<option>${o}</option>`).join('')}</select></td></tr>`).join('');
  }
  $('#panelCard').style.display=c.panel?'':'none';
  if(c.panel){const p=c.panel;
    $('#panelInfo').innerHTML=`<div><span>Bố trí</span><b>${p.cols} cột × ${p.rows} hàng</b></div><div><span>Step X · Step Y</span><b>${f2(p.stepX)} · ${f2(p.stepY)}</b></div><div><span>Gốc board 1 trong panel</span><b>(${f1(p.px)}, ${f1(p.py)})</b></div>`;
    $('#panelTbl').innerHTML='<tr><th>Câu</th><th>Board số</th><th>Ref</th><th>X panel</th><th>Y panel</th></tr>'+p.qs.map((q,i)=>`<tr><td>${i+1}</td><td class="m">${q.k}</td><td><b>${q.c.ref}</b> (Top)</td><td><input class="num" data-k="px${i}"></td><td><input class="num" data-k="py${i}"></td></tr>`).join('');}
  $('#cadScore').textContent='';$('#cadSave').hidden=true;
  drawCad();
}
function drawCad(){
  const cv=$('#cadCv'),g=cv.getContext('2d'),c=CAD;g.clearRect(0,0,cv.width,cv.height);
  const pad=40,s=Math.min((cv.width-2*pad)/c.W,(cv.height-2*pad)/c.H);
  const X=x=>pad+x*s,Y=y=>cv.height-pad-y*s;
  g.fillStyle='#2f6b4f';g.fillRect(X(0),Y(c.H),c.W*s,c.H*s);
  g.strokeStyle='#1d4434';g.lineWidth=2;g.strokeRect(X(0),Y(c.H),c.W*s,c.H*s);
  // gốc
  g.fillStyle='#d97706';g.beginPath();g.arc(X(0),Y(0),5,0,7);g.fill();
  g.font='12px "Be Vietnam Pro"';g.fillStyle='#7a4a05';g.fillText(c.level===1?`gốc board = CAD (${f2(c.ox)}, ${f2(c.oy)})`:'gốc board = ?',X(0)+6,Y(0)+18);
  // fiducial
  [[c.fx,c.fy],[c.W-c.fx,c.H-c.fy]].forEach(([x,y],i)=>{g.fillStyle='#e8c35a';g.beginPath();g.arc(X(x),Y(y),5,0,7);g.fill();g.strokeStyle='#fff';g.lineWidth=1;g.beginPath();g.arc(X(x),Y(y),9,0,7);g.stroke();g.fillStyle='#fff';g.fillText('FID'+(i+1),X(x)+11,Y(y)+4);});
  // trục
  g.strokeStyle='#888';g.lineWidth=1;g.beginPath();g.moveTo(X(0),Y(0)+22);g.lineTo(X(0)+40,Y(0)+22);g.moveTo(X(0)-22,Y(0));g.lineTo(X(0)-22,Y(0)-40);g.stroke();
  g.fillStyle='#666';g.fillText('X',X(0)+44,Y(0)+26);g.fillText('Y',X(0)-26,Y(0)-44);
  c.comps.forEach(p=>{
    const w=Math.max(PKG[p.pk].w*s,10),h=Math.max(PKG[p.pk].h*s,6);
    g.save();g.translate(X(p.x),Y(p.y));g.rotate(-p.rot*Math.PI/180);
    if(p.side==='T'){g.fillStyle='#e9eef0';g.fillRect(-w/2,-h/2,w,h);g.strokeStyle='#22313a';g.lineWidth=1;g.strokeRect(-w/2,-h/2,w,h);}
    else{g.setLineDash([4,3]);g.strokeStyle='#ffd7b0';g.lineWidth=1.6;g.strokeRect(-w/2,-h/2,w,h);g.setLineDash([]);}
    g.fillStyle=p.side==='T'?'#c0392b':'#ffb27a';g.beginPath();g.arc(-w/2+3,0,2.6,0,7);g.fill();
    g.restore();
    g.fillStyle='#fff';g.font='600 11px "Be Vietnam Pro"';g.fillText(p.ref,X(p.x)+w/2+3,Y(p.y)-h/2-2);
  });
}
function checkCad(show){
  const c=CAD,ans=cadAnswers(c,$('#cadConv').value);let tot=0,ok=0;
  const mark=(el,good,txt)=>{tot++;if(good)ok++;let sp=el.parentNode.querySelector('.ans');if(!sp){sp=document.createElement('span');sp.className='ans';el.parentNode.appendChild(sp);}
    if(show){sp.textContent='→ '+txt;sp.style.color='var(--mute)';return;}
    el.classList.toggle('ok',good);el.classList.toggle('bad',!good);sp.textContent=good?'':'→ '+txt;sp.style.color='';};
  const num=v=>v.trim()===''?NaN:parseFloat(v.replace(',','.'));
  ans.forEach((a,i)=>{
    const ex=document.querySelector(`[data-k="x${i}"]`),ey=document.querySelector(`[data-k="y${i}"]`),ea=document.querySelector(`[data-k="a${i}"]`);
    mark(ex,Math.abs(num(ex.value)-a.x)<=0.011,f2(a.x));mark(ey,Math.abs(num(ey.value)-a.y)<=0.011,f2(a.y));
    const va=num(ea.value);mark(ea,!isNaN(va)&&((va%360)+360)%360===a.a,a.a+'°');
  });
  if(c.bom)document.querySelectorAll('[data-b]').forEach(sel=>{const k=c.bomKey[sel.dataset.b];mark(sel,sel.value===k,k);});
  if(c.panel){const p=c.panel;p.qs.forEach((q,i)=>{const idx=c.comps.indexOf(q.c),a=ans[idx];const ci=(q.k-1)%p.cols,ri=Math.floor((q.k-1)/p.cols);
    const X=r2(p.px+ci*p.stepX+a.x),Y=r2(p.py+ri*p.stepY+a.y);const ex=document.querySelector(`[data-k="px${i}"]`),ey=document.querySelector(`[data-k="py${i}"]`);
    mark(ex,Math.abs(num(ex.value)-X)<=0.011,f2(X));mark(ey,Math.abs(num(ey.value)-Y)<=0.011,f2(Y));});}
  if(show){$('#cadScore').textContent='Đang hiện đáp án (không tính điểm).';return;}
  const pct=Math.round(ok/tot*100);
  window.LAST_RESULT.cad={code:['','CAD-02','CAD-03','CAD-06'][c.level],result:`${pct}% (${ok}/${tot})`,pass:pct>=90,note:`Mã đề ${c.seed}, mức ${['','Dễ','Vừa','Khó'][c.level]}`};$('#cadSave').hidden=false;
  $('#cadScore').innerHTML=`Đúng ${ok}/${tot} ô · <span style="color:${pct>=90?'var(--ok)':'var(--bad)'}">${pct}%</span> ${pct>=90?'– Đạt':'– Chưa đạt (mục tiêu ≥ 90%)'}`;
}
$('#cadNew').onclick=()=>renderCad(newSeed());
$('#cadLoad').onclick=()=>renderCad(+$('#cadSeed').value||newSeed());
$('#cadLevel').onchange=()=>renderCad(+$('#cadSeed').value||newSeed());
$('#cadConv').onchange=()=>renderCad(+$('#cadSeed').value||newSeed());
$('#cadCheck').onclick=()=>checkCad(false);
$('#cadShow').onclick=()=>checkCad(true);

/* ================= TAB 2: TEACHING AOI ================= */
const AP=[
 {id:'chip',name:'Chip 0603',nom:450,count:20,pol:false,ic:false,offSpec:100,rotSpec:3,offB:28,rotB:.6,defects:['offset','skew','missing','tombstone','insufficient','excess']},
 {id:'sot',name:'SOT-23',nom:1000,count:4,pol:true,ic:false,offSpec:120,rotSpec:3,offB:32,rotB:.7,defects:['offset','skew','missing','polarity','insufficient']},
 {id:'soic',name:'SOIC-8',nom:1500,count:2,pol:true,ic:true,offSpec:100,rotSpec:2,offB:26,rotB:.4,defects:['offset','skew','missing','polarity','bridge','lifted','insufficient']},
 {id:'qfp',name:'QFP-44',nom:1400,count:1,pol:true,ic:true,offSpec:70,rotSpec:1.5,offB:17,rotB:.3,defects:['offset','skew','missing','polarity','bridge','lifted','insufficient']}];
const DN={offset:'Lệch',skew:'Xoay',missing:'Thiếu linh kiện',tombstone:'Dựng bia',insufficient:'Thiếu thiếc',excess:'Thừa thiếc',polarity:'Ngược cực',bridge:'Cầu thiếc',lifted:'Chân nhấc'};
const DCHK={offset:'Lệch',skew:'Xoay',missing:'Cao thấp',tombstone:'Cao vượt',insufficient:'Thiếc ít',excess:'Thiếc nhiều',polarity:'Cực tính',bridge:'Cầu thiếc',lifted:'Chân nhấc'};
const FEAT=[
 {k:'off',n:'Lệch X/Y lớn nhất (µm)',g:p=>Math.max(Math.abs(p.dx),Math.abs(p.dy)),t:['offMax'],sp:a=>[a.offSpec]},
 {k:'rot',n:'Xoay (°, trị tuyệt đối)',g:p=>Math.abs(p.rot),t:['rotMax'],sp:a=>[a.rotSpec]},
 {k:'h',n:'Chiều cao thân (µm)',g:p=>p.h,t:['hMin','hMax'],sp:a=>[a.nom*.5,a.nom*1.5]},
 {k:'pol',n:'Khớp cực tính (%)',g:p=>p.pol,t:['polMin'],sp:()=>[60],need:'pol'},
 {k:'vol',n:'Thể tích thiếc (%)',g:p=>p.vol,t:['volMin','volMax'],sp:()=>[60,150]},
 {k:'bri',n:'Cầu thiếc (µm²)',g:p=>p.bri,t:['briMax'],sp:()=>[300],need:'ic'},
 {k:'lift',n:'Chân nhấc (µm)',g:p=>p.lift,t:['liftMax'],sp:()=>[80],need:'ic'}];
const TCOL=[['offMax','Lệch max (µm)'],['rotMax','Xoay max (°)'],['hMin','Cao min (µm)'],['hMax','Cao max (µm)'],['polMin','Cực tính min (%)'],['volMin','Thiếc min (%)'],['volMax','Thiếc max (%)'],['briMax','Cầu thiếc max (µm²)'],['liftMax','Chân nhấc max (µm)']];
const DEF_T={offMax:300,rotMax:15,hMin:0,hMax:5000,polMin:0,volMin:0,volMax:400,briMax:5000,liftMax:500};
const applies=(a,k)=>!((k==='polMin'&&!a.pol)||((k==='briMax'||k==='liftMax')&&!a.ic));
const specT=a=>({offMax:a.offSpec,rotMax:a.rotSpec,hMin:a.nom*.5,hMax:a.nom*1.5,polMin:60,volMin:60,volMax:150,briMax:300,liftMax:80});
let AOI=null;
function refName(a,i){if(a.id==='chip')return(i<10?'R':'C')+(i%10+1);if(a.id==='sot')return'Q'+(i+1);if(a.id==='soic')return'U'+(i+1);return'U3';}
function goodPart(r,a,P){return{dx:r.norm(P.mx,P.offS),dy:r.norm(P.my,P.offS),rot:r.norm(0,P.rotS),h:r.norm(a.nom,a.nom*.04),
  pol:a.pol?Math.min(100,Math.max(0,r.norm(84,7))):null,vol:r.norm(P.volM,P.volS),bri:a.ic?(r.next()<.8?0:r.uni(0,380)):null,lift:a.ic?Math.max(0,r.norm(30,14)):null,defect:null};}
function applyDefect(r,p,a,t){p.defect=t;
  if(t==='offset'){const v=r.sign()*a.offSpec*r.uni(1.15,2);if(r.next()<.5)p.dx=v;else p.dy=v;}
  else if(t==='skew')p.rot=r.sign()*a.rotSpec*r.uni(1.25,3);
  else if(t==='missing'){p.h=r.uni(0,60);if(a.pol)p.pol=r.uni(5,35);p.vol=r.norm(100,10);if(a.ic){p.bri=0;p.lift=0;}}
  else if(t==='tombstone'){p.h=a.nom*r.uni(2.2,3.4);p.vol=r.uni(35,55);}
  else if(t==='polarity')p.pol=r.uni(10,40);
  else if(t==='bridge')p.bri=r.uni(450,2000);
  else if(t==='lifted'){p.lift=r.uni(110,250);p.vol=r.norm(85,6);}
  else if(t==='insufficient')p.vol=r.uni(15,48);
  else if(t==='excess')p.vol=r.uni(165,230);}
function genAoi(seed){
  const r=rng(seed),proc={};
  AP.forEach(a=>{proc[a.id]={mx:0,my:0,offS:a.offB*r.uni(.85,1.25),rotS:a.rotB*r.uni(.8,1.3),volM:100,volS:r.uni(12,16)};});
  const golden=[];for(let b=0;b<20;b++)AP.forEach(a=>{for(let i=0;i<a.count;i++)golden.push({...goodPart(r,a,proc[a.id]),pk:a.id});});
  const drift={},dsx=r.sign(),dsy=r.sign(),dX=r.uni(5,15),dY=r.uni(0,10),dV=r.uni(-8,8);
  AP.forEach(a=>{const P=proc[a.id];drift[a.id]={...P,mx:dsx*dX,my:dsy*dY,offS:P.offS*1.1,volM:100+dV,volS:P.volS*1.08};});
  const lot=[];for(let b=0;b<50;b++)AP.forEach(a=>{for(let i=0;i<a.count;i++)lot.push({...goodPart(r,a,drift[a.id]),pk:a.id,board:b+1,ref:refName(a,i)});});
  const K=r.int(15,22),used=new Set();
  for(let k=0;k<K;k++){let idx;do{idx=Math.floor(r.next()*lot.length)}while(used.has(idx));used.add(idx);
    const p=lot[idx],a=AP.find(x=>x.id===p.pk);applyDefect(r,p,a,r.pick(a.defects));}
  return{seed,golden,lot,drift:{dX:dsx*dX,dY:dsy*dY,dV}};
}
function buildThr(){
  $('#specTbl').innerHTML='<tr><th>Linh kiện</th><th>Lệch NG &gt; (µm)</th><th>Xoay NG &gt; (°)</th><th>Cao danh định (µm)</th></tr>'+AP.map(a=>`<tr><td>${a.name}</td><td class="m">${a.offSpec}</td><td class="m">${a.rotSpec}</td><td class="m">${a.nom}</td></tr>`).join('');
  $('#thrTbl').innerHTML='<tr><th>Linh kiện</th>'+TCOL.map(c=>`<th>${c[1]}</th>`).join('')+'</tr>'+AP.map(a=>`<tr><td><b>${a.name}</b></td>`+TCOL.map(([k])=>`<td><input class="num" type="number" step="any" data-t="${a.id}.${k}" value="${applies(a,k)?DEF_T[k]:''}" ${applies(a,k)?'':'disabled'}></td>`).join('')+'</tr>').join('');
  document.querySelectorAll('[data-t]').forEach(i=>i.oninput=drawHist);
  $('#hPkg').innerHTML=AP.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');
  $('#hPkg').onchange=()=>{fillFeat();drawHist();};fillFeat();$('#hFeat').onchange=drawHist;
}
function fillFeat(){const a=AP.find(x=>x.id===$('#hPkg').value);$('#hFeat').innerHTML=FEAT.filter(f=>!f.need||a[f.need]).map(f=>`<option value="${f.k}">${f.n}</option>`).join('');}
function readThr(){const T={};AP.forEach(a=>{T[a.id]={};TCOL.forEach(([k])=>{const v=parseFloat(document.querySelector(`[data-t="${a.id}.${k}"]`).value);T[a.id][k]=applies(a,k)?(isNaN(v)?DEF_T[k]:v):null;});});return T;}
function setThr(fn){AP.forEach(a=>TCOL.forEach(([k])=>{if(applies(a,k)){const v=fn(a)[k];document.querySelector(`[data-t="${a.id}.${k}"]`).value=Math.round(v*100)/100;}}));drawHist();}
function drawHist(){
  if(!AOI)return;const cv=$('#histCv'),g=cv.getContext('2d');g.clearRect(0,0,cv.width,cv.height);
  const a=AP.find(x=>x.id===$('#hPkg').value),f=FEAT.find(x=>x.k===$('#hFeat').value);if(!f)return;
  const vals=AOI.golden.filter(p=>p.pk===a.id).map(f.g);const T=readThr()[a.id];
  const thr=f.t.map(k=>T[k]),sp=f.sp(a);
  let lo=Math.min(...vals),hi=Math.max(...vals);const mean=vals.reduce((s,v)=>s+v,0)/vals.length,sd=Math.sqrt(vals.reduce((s,v)=>s+(v-mean)**2,0)/vals.length);
  const extra=[...sp,...thr].filter(v=>v!=null&&isFinite(v));const span=hi-lo||1;
  extra.forEach(v=>{if(v>=lo-span*1.5&&v<=hi+span*1.5){lo=Math.min(lo,v);hi=Math.max(hi,v);}});
  if(f.k==='off'||f.k==='rot'||f.k==='bri'||f.k==='lift')lo=0;
  const L=40,Rr=cv.width-12,Tp=14,B=cv.height-28,bins=40,bw=(hi-lo)/bins||1,cnt=new Array(bins).fill(0);
  vals.forEach(v=>{cnt[Math.min(bins-1,Math.max(0,Math.floor((v-lo)/bw)))]++;});const mx=Math.max(...cnt);
  const X=v=>L+(v-lo)/(hi-lo||1)*(Rr-L);
  g.fillStyle='#5b8f7b';cnt.forEach((n,i)=>{const h=n/mx*(B-Tp);g.fillRect(X(lo+i*bw)+1,B-h,(Rr-L)/bins-2,h);});
  g.strokeStyle='#99a49f';g.beginPath();g.moveTo(L,B);g.lineTo(Rr,B);g.stroke();
  g.fillStyle='#5d6964';g.font='11px "JetBrains Mono"';[lo,(lo+hi)/2,hi].forEach(v=>{g.fillText(f1(v),X(v)-12,B+14);});
  const vline=(v,col,dash)=>{if(v==null||!isFinite(v)||v<lo||v>hi)return;g.strokeStyle=col;g.lineWidth=2;g.setLineDash(dash?[5,4]:[]);g.beginPath();g.moveTo(X(v),Tp-4);g.lineTo(X(v),B);g.stroke();g.setLineDash([]);};
  sp.forEach(v=>vline(v,'#bb3326',true));thr.forEach(v=>vline(v,'#d97706',false));
  const offscreen=thr.filter(v=>v!=null&&(v<lo||v>hi));
  $('#statLine').innerHTML=`n = ${vals.length} · trung bình ${f1(mean)} · σ ${f2(sd)} · min ${f1(Math.min(...vals))} · max ${f1(Math.max(...vals))} · μ ± 4σ: ${f1(mean-4*sd)} … ${f1(mean+4*sd)}`+(offscreen.length?` · <span style="color:var(--amb)">ngưỡng ${offscreen.map(f1).join(', ')} nằm ngoài khung hình</span>`:'');
}
function flagsOf(p,a,T){const f=[];
  if(Math.max(Math.abs(p.dx),Math.abs(p.dy))>T.offMax)f.push('Lệch');
  if(Math.abs(p.rot)>T.rotMax)f.push('Xoay');
  if(p.h<T.hMin)f.push('Cao thấp');if(p.h>T.hMax)f.push('Cao vượt');
  if(a.pol&&p.pol<T.polMin)f.push('Cực tính');
  if(p.vol<T.volMin)f.push('Thiếc ít');if(p.vol>T.volMax)f.push('Thiếc nhiều');
  if(a.ic&&p.bri>T.briMax)f.push('Cầu thiếc');if(a.ic&&p.lift>T.liftMax)f.push('Chân nhấc');return f;}
const vals=p=>`lệch ${f1(Math.max(Math.abs(p.dx),Math.abs(p.dy)))} µm · xoay ${f2(Math.abs(p.rot))}° · cao ${Math.round(p.h)} · thiếc ${Math.round(p.vol)}%`+(p.pol!=null?` · cực ${Math.round(p.pol)}%`:'')+(p.bri!=null?` · cầu ${Math.round(p.bri)}`:'')+(p.lift!=null?` · nhấc ${Math.round(p.lift)}`:'');
function runAoi(){
  const T=readThr(),CH=['Lệch','Xoay','Cao thấp','Cao vượt','Cực tính','Thiếc ít','Thiếc nhiều','Cầu thiếc','Chân nhấc'];
  const by={};CH.forEach(c=>by[c]={ng:0,real:0,fc:0});
  let defects=0,caught=0,right=0,fc=0;const esc=[],fcs=[],fcBoards=new Set();
  AOI.lot.forEach(p=>{const a=AP.find(x=>x.id===p.pk),f=flagsOf(p,a,T[a.id]);
    f.forEach(c=>{by[c].ng++;if(p.defect)by[c].real++;else by[c].fc++;});
    if(p.defect){defects++;if(f.length){caught++;if(f.includes(DCHK[p.defect]))right++;}else esc.push(p);}
    else if(f.length){fc++;fcs.push({p,f});fcBoards.add(p.board);}});
  const n=AOI.lot.length,fcp=fc/n*100,pass=esc.length===0&&fcp<=1;
  let h=`<div class="verdict ${pass?'pass':'fail'}">${pass?'Đạt: không lọt lỗi và false call trong giới hạn.':esc.length?`Chưa đạt: lọt ${esc.length} lỗi thật ra công đoạn sau.`:`Chưa đạt: false call ${fcp.toFixed(2)}% vượt mức 1%.`}</div>
  <div class="kpis"><div class="kpi"><b>${n}</b><span>Điểm kiểm tra</span></div><div class="kpi"><b>${defects}</b><span>Lỗi thật trong lot</span></div>
  <div class="kpi grn"><b>${caught}</b><span>Bắt được (${right} đúng loại)</span></div><div class="kpi ${esc.length?'red':'grn'}"><b>${esc.length}</b><span>Lỗi lọt</span></div>
  <div class="kpi ${fcp>1?'amb':'grn'}"><b>${fc}</b><span>False call · ${fcp.toFixed(2)}%</span></div><div class="kpi"><b>${fcBoards.size}/50</b><span>Board có false call</span></div></div>
  <h4>Theo từng kiểm tra</h4><div class="scroll"><table><tr><th>Kiểm tra</th><th>Số NG báo</th><th>NG thật</th><th>False call</th></tr>${CH.map(c=>`<tr><td>${c}</td><td class="m">${by[c].ng}</td><td class="m">${by[c].real}</td><td class="m" style="${by[c].fc?'color:var(--amb);font-weight:600':''}">${by[c].fc}</td></tr>`).join('')}</table></div>`;
  if(esc.length)h+=`<h4 style="color:var(--bad)">Lỗi lọt</h4><div class="scroll"><table><tr><th>Board</th><th>Ref</th><th>Loại</th><th>Lỗi thật</th><th>Giá trị đo</th></tr>${esc.map(p=>`<tr><td class="m">${p.board}</td><td>${p.ref}</td><td>${AP.find(a=>a.id===p.pk).name}</td><td><b>${DN[p.defect]}</b></td><td class="note">${vals(p)}</td></tr>`).join('')}</table></div>`;
  if(fcs.length)h+=`<h4 style="color:var(--amb)">False call (tối đa 25 dòng)</h4><div class="scroll"><table><tr><th>Board</th><th>Ref</th><th>Loại</th><th>Bị báo</th><th>Giá trị đo</th></tr>${fcs.slice(0,25).map(({p,f})=>`<tr><td class="m">${p.board}</td><td>${p.ref}</td><td>${AP.find(a=>a.id===p.pk).name}</td><td><b>${f.join(', ')}</b></td><td class="note">${vals(p)}</td></tr>`).join('')}</table></div>`;
  h+=`<p class="note" style="margin-top:10px">Độ trôi của lot so với board mẫu: lệch X ${f1(AOI.drift.dX)} µm, lệch Y ${f1(AOI.drift.dY)} µm, thể tích thiếc ${AOI.drift.dV>0?'+':''}${f1(AOI.drift.dV)}%, độ tản rộng hơn khoảng 10%. Ở máy thật, đây là lý do không đặt ngưỡng sát mép phân bố của board mẫu.</p>`;
  window.LAST_RESULT.aoi={code:'AOI-02',result:`${pass?'Đạt':'Chưa đạt'} · lọt ${esc.length} · FC ${fcp.toFixed(2)}%`,pass,note:`Mã lot ${AOI.seed}`};$('#aoiSave').hidden=false;
  $('#aoiResBody').innerHTML=h;$('#aoiRes').style.display='';$('#aoiRes').scrollIntoView({behavior:'smooth',block:'start'});
}
function newAoi(seed){$('#aoiSeed').value=seed;$('#aoiSave').hidden=true;AOI=genAoi(seed);$('#aoiRes').style.display='none';drawHist();}
buildThr();
$('#aoiNew').onclick=()=>newAoi(newSeed());$('#aoiLoad').onclick=()=>newAoi(+$('#aoiSeed').value||newSeed());
$('#thrSpec').onclick=()=>setThr(specT);$('#thrReset').onclick=()=>setThr(()=>DEF_T);$('#aoiRun').onclick=runAoi;

/* ================= TAB 3: PHÁN ĐỊNH ẢNH ================= */
const JCLS=['OK','Thiếu linh kiện','Lệch','Xoay','Dựng bia','Cầu thiếc','Thiếu thiếc','Ngược cực','Chân nhấc'];
const JALLOW={chip:['Thiếu linh kiện','Lệch','Xoay','Dựng bia','Thiếu thiếc'],tant:['Thiếu linh kiện','Lệch','Ngược cực','Thiếu thiếc'],soic:['Thiếu linh kiện','Lệch','Xoay','Ngược cực','Cầu thiếc','Chân nhấc','Thiếu thiếc']};
const JEXP={'OK':'Không lỗi: lệch/xoay nhỏ, đủ fillet. Bụi trên solder mask hay khác màu thân không phải lỗi lắp ráp, nên đây là false call.',
 'Thiếu linh kiện':'Chỉ còn thiếc trên pad, không thấy thân linh kiện.',
 'Lệch':'Thân/chân lệch khỏi pad khoảng hơn 50% bề rộng (vượt mức side overhang cho phép của IPC-A-610 class 2).',
 'Xoay':'Linh kiện xoay so với footprint, đầu cực/chân lệch khỏi pad.',
 'Dựng bia':'Một đầu linh kiện dựng đứng trên một pad, pad kia chỉ có thiếc (tombstone).',
 'Cầu thiếc':'Thiếc nối liền hai pad kề nhau.',
 'Thiếu thiếc':'Có pad không thành fillet, lộ rõ bề mặt pad mạ vàng.',
 'Ngược cực':'Dấu cực (vạch trên tantalum / chấm pin 1) ngược với ký hiệu trên silkscreen.',
 'Chân nhấc':'Một chân không có fillet và có bóng đổ dưới đầu chân, tức chân bị nhấc khỏi pad.'};
let JUD=null;
function genJud(seed){const r=rng(seed),items=[];
  for(let i=0;i<12;i++){const t=r.pick(['chip','chip','chip','chip','tant','tant','tant','soic','soic','soic','soic']);
    const cls=r.next()<.4?'OK':r.pick(JALLOW[t]);const big=t!=='soic';
    const it={t,cls,seed:Math.floor(r.next()*1e9),dx:0,dy:0,rot:0,dust:r.next()<(cls==='OK'?.5:.2),res:r.next()<.5,bodyTone:r.uni(-18,18),side:r.sign(),idx:r.int(0,2)};
    if(cls==='OK'){it.dx=big?r.uni(-5,5):r.uni(-2.5,2.5);it.dy=big?r.uni(-5,5):r.uni(-2,2);it.rot=big?r.uni(-1.5,1.5):r.uni(-.8,.8);}
    else{it.dx=big?r.uni(-2,2):r.uni(-1,1);it.dy=big?r.uni(-2,2):r.uni(-1,1);it.rot=r.uni(-.6,.6);}
    if(cls==='Lệch'){if(big){if(r.next()<.7)it.dy=r.sign()*r.uni(20,26);else it.dx=r.sign()*r.uni(15,19);}else it.dx=r.sign()*r.uni(9,12);}
    if(cls==='Xoay')it.rot=r.sign()*(big?r.uni(9,15):r.uni(4.5,7));
    items.push(it);}
  return items;}
function drawJud(cv,it){
  const g=cv.getContext('2d'),W=cv.width,H=cv.height,cx=W/2,cy=H/2,r=rng(it.seed);
  g.fillStyle='#1c5a3b';g.fillRect(0,0,W,H);
  for(let i=0;i<160;i++){g.fillStyle=`rgba(255,255,255,${r.uni(.015,.05)})`;g.fillRect(r.uni(0,W),r.uni(0,H),2,2);}
  const pad=(x,y,w,h)=>{const gr=g.createLinearGradient(x-w/2,y-h/2,x+w/2,y+h/2);gr.addColorStop(0,'#e7c25c');gr.addColorStop(1,'#b98f2e');g.fillStyle=gr;g.fillRect(x-w/2,y-h/2,w,h);};
  const fil=(x,y,w,h)=>{const gr=g.createRadialGradient(x,y,1,x,y,Math.max(w,h)*.7);gr.addColorStop(0,'#f6f6f4');gr.addColorStop(.6,'#c9cbcc');gr.addColorStop(1,'#8f9496');g.fillStyle=gr;const rr=Math.min(w,h)*.3;g.beginPath();g.roundRect?g.roundRect(x-w/2,y-h/2,w,h,rr):g.rect(x-w/2,y-h/2,w,h);g.fill();};
  const paste=(x,y,w,h)=>{g.fillStyle='#8d9092';g.fillRect(x-w/2+2,y-h/2+2,w-4,h-4);for(let i=0;i<w*h/10;i++){g.fillStyle=`rgba(${r.next()<.5?'255,255,255':'40,40,40'},.25)`;g.fillRect(x-w/2+2+r.next()*(w-5),y-h/2+2+r.next()*(h-5),1.4,1.4);}};
  const silk=()=>{g.strokeStyle='#eef2ee';g.fillStyle='#eef2ee';g.lineWidth=2;};
  const body=(fn)=>{g.save();g.translate(cx+it.dx,cy+it.dy);g.rotate(it.rot*Math.PI/180);fn();g.restore();};
  const tone=(base)=>{const v=Math.max(0,Math.min(255,base+it.bodyTone));return`rgb(${v},${v},${v})`;};
  const C=it.cls;
  if(it.t==='chip'){
    const P=[[cx-46,cy],[cx+46,cy]],pw=34,ph=46;
    silk();g.beginPath();g.moveTo(cx-24,cy-34);g.lineTo(cx+24,cy-34);g.moveTo(cx-24,cy+34);g.lineTo(cx+24,cy+34);g.stroke();
    P.forEach(([x,y])=>pad(x,y,pw,ph));
    if(C==='Thiếu linh kiện'){P.forEach(([x,y])=>paste(x,y,pw,ph));}
    else if(C==='Dựng bia'){const s=it.side<0?0:1,[sx,sy]=P[s],[ox,oy]=P[1-s];
      fil(sx,sy,pw-2,ph-2);fil(ox,oy,pw-6,ph-10);
      g.fillStyle='rgba(0,0,0,.45)';g.fillRect(sx-12+(s?-6:6),sy-18+5,26,40);
      g.fillStyle='#d9d9d9';g.fillRect(sx-13,sy-20,26,40);g.strokeStyle='#888';g.lineWidth=1;g.strokeRect(sx-13,sy-20,26,40);}
    else{P.forEach(([x,y],i)=>{const ins=C==='Thiếu thiếc'&&(i===0?it.side<0:it.side>0);if(!ins)fil(x,y,pw-2,ph-2);else{g.fillStyle='#bfc2c3';g.fillRect(x+(i?-pw/2:pw/2-5),y-ph/2+4,4,ph-8);}});
      body(()=>{g.fillStyle='rgba(0,0,0,.35)';g.fillRect(-50,-17,104,40);g.fillStyle='#d6d6d6';g.fillRect(-52,-20,22,40);g.fillRect(30,-20,22,40);
        if(it.res){g.fillStyle=tone(34);g.fillRect(-30,-20,60,40);g.fillStyle='#e8e8e8';g.font='600 14px "JetBrains Mono"';g.textAlign='center';g.fillText('103',0,5);}
        else{g.fillStyle=`rgb(${180+it.bodyTone},${142+it.bodyTone},${92+it.bodyTone})`;g.fillRect(-30,-20,60,40);}});}
  }
  if(it.t==='tant'){
    const P=[[cx-52,cy],[cx+52,cy]],pw=38,ph=50;
    silk();g.beginPath();g.moveTo(cx-30,cy-38);g.lineTo(cx+30,cy-38);g.moveTo(cx-30,cy+38);g.lineTo(cx+30,cy+38);g.stroke();
    g.beginPath();g.moveTo(cx-92,cy-30);g.lineTo(cx-80,cy-30);g.moveTo(cx-86,cy-36);g.lineTo(cx-86,cy-24);g.stroke();
    P.forEach(([x,y])=>pad(x,y,pw,ph));
    if(C==='Thiếu linh kiện')P.forEach(([x,y])=>paste(x,y,pw,ph));
    else{P.forEach(([x,y],i)=>{const ins=C==='Thiếu thiếc'&&(i===0?it.side<0:it.side>0);if(!ins)fil(x,y,pw-2,ph-2);else{g.fillStyle='#bfc2c3';g.fillRect(x+(i?-pw/2:pw/2-5),y-ph/2+5,4,ph-10);}});
      body(()=>{g.fillStyle='rgba(0,0,0,.35)';g.fillRect(-54,-23,112,52);g.fillStyle='#cfcfcf';g.fillRect(-58,-15,12,30);g.fillRect(46,-15,12,30);
        g.fillStyle=`rgb(${208+it.bodyTone/2},${138+it.bodyTone/2},${24})`;g.fillRect(-46,-26,92,52);
        const sx=C==='Ngược cực'?28:-40;g.fillStyle='#5e360a';g.fillRect(sx,-26,12,52);
        g.fillStyle='#3a2406';g.font='600 13px "JetBrains Mono"';g.textAlign='center';g.fillText('106',4,5);});}
  }
  if(it.t==='soic'){
    const xs=[-39,-13,13,39],pads=[];xs.forEach(x=>{pads.push([cx+x,cy+41]);});xs.forEach(x=>{pads.push([cx+x,cy-41]);});
    silk();g.strokeRect(cx-58,cy-24,116,48);g.beginPath();g.arc(cx-58,cy+64,3.5,0,7);g.fill();
    pads.forEach(([x,y])=>pad(x,y,16,28));
    if(C==='Thiếu linh kiện'){pads.forEach(([x,y])=>paste(x,y,16,28));}
    else{
      const insSet=new Set(C==='Thiếu thiếc'?[it.idx,it.idx+4]:[]),lift=C==='Chân nhấc'?it.idx+(it.side>0?4:0):-1;
      pads.forEach(([x,y],i)=>{if(!insSet.has(i)&&i!==lift)fil(x,y+(i<4?5:-5),14,14);});
      if(C==='Cầu thiếc'){const row=it.side>0?1:-1,a=xs[it.idx],b=xs[it.idx+1];fil(cx+(a+b)/2,cy+row*46,b-a+14,12);}
      body(()=>{
        xs.forEach((x,j)=>{[[1,j],[-1,j+4]].forEach(([sg,idx])=>{const lifted=idx===lift;
          if(lifted){g.fillStyle='rgba(0,0,0,.55)';g.fillRect(x-4,sg>0?33:-50,12,17);}
          g.fillStyle=lifted?'#f2f2f2':'#c4c4c4';g.fillRect(x-5,sg>0?29:-47,10,lifted?15:18);});});
        g.fillStyle='rgba(0,0,0,.35)';g.fillRect(-53,-26,112,58);
        g.fillStyle=tone(30);g.fillRect(-56,-29,112,58);
        const dot=C==='Ngược cực'?[44,-17]:[-44,17];g.fillStyle='#4d4d4d';g.beginPath();g.arc(dot[0],dot[1],4.5,0,7);g.fill();
        g.fillStyle='#8a8a8a';g.font='600 12px "JetBrains Mono"';g.textAlign='center';g.fillText('LM358',0,-2);});
    }
  }
  if(it.dust){for(let k=0;k<r.int(1,3);k++){const ang=r.uni(0,6.28),rad=r.uni(70,95);g.fillStyle='rgba(236,234,222,.9)';g.beginPath();g.arc(cx+Math.cos(ang)*rad,cy+Math.sin(ang)*rad*.8,r.uni(1.5,3),0,7);g.fill();}}
}
function newJud(seed){$('#judSeed').value=seed;JUD=genJud(seed);$('#judScore').textContent='';$('#judSave').hidden=true;
  $('#judGrid').innerHTML=JUD.map((it,i)=>`<div class="jitem" id="ji${i}"><div class="note">Ảnh ${i+1} · ${it.t==='chip'?'Chip':it.t==='tant'?'Tụ tantalum':'SOIC-8'}</div><canvas width="230" height="170"></canvas><select><option value="">— chọn —</option>${JCLS.map(c=>`<option>${c}</option>`).join('')}</select><div class="ex"></div></div>`).join('');
  JUD.forEach((it,i)=>drawJud(document.querySelector(`#ji${i} canvas`),it));}
function checkJud(){let ok=0;JUD.forEach((it,i)=>{const el=$('#ji'+i),v=el.querySelector('select').value,good=v===it.cls;if(good)ok++;
  el.classList.add('done');el.style.borderColor=good?'var(--ok)':'var(--bad)';el.querySelector('.ex').innerHTML=`<b style="color:${good?'var(--ok)':'var(--bad)'}">${good?'Đúng':'Sai'} · Đáp án: ${it.cls}.</b> ${JEXP[it.cls]}`;});
  window.LAST_RESULT.jud={code:'AOI-01',result:`${ok}/12`,pass:ok>=11,note:`Phán định ảnh, mã đề ${$('#judSeed').value}`};$('#judSave').hidden=false;
  $('#judScore').innerHTML=`Đúng ${ok}/12 · ${ok>=11?'<span style="color:var(--ok)">Đạt</span>':'<span style="color:var(--bad)">Chưa đạt (mục tiêu ≥ 11/12)</span>'}`;}
$('#judNew').onclick=()=>newJud(newSeed());$('#judLoad').onclick=()=>newJud(+$('#judSeed').value||newSeed());$('#judCheck').onclick=checkJud;
