/* Isometric art, preserved from the original Astra scene. */
// @ts-nocheck
import SGContent from './content';
import SGTimeline from './timeline';

const SGScene = { create(svg) {
  const labels=SGContent.labels;

  const P=(x,y,z=0)=>[775+(x-y)*.82,75+(x+y)*.41-z];
  const pt=(x,y,z=0)=>P(x,y,z).join(',');
  const poly=(coords,fill,extra='')=>`<polygon points="${coords.map(c=>pt(...c)).join(' ')}" fill="${fill}" ${extra}/>`;
  const line=(a,b,color,width=1,extra='')=>`<path d="M${pt(...a)}L${pt(...b)}" fill="none" stroke="${color}" stroke-width="${width}" ${extra}/>`;
  const flat=(x,y,w,d,z,fill,extra='')=>poly([[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z]],fill,extra);
  const box=(x,y,w,d,h,colors,z=0)=>flat(x,y,w,d,z+h,colors[0])+poly([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]],colors[1])+poly([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]],colors[2]);
  const txt=(x,y,z,text,size=12,color='#fff',extra='')=>`<text x="${P(x,y,z)[0]}" y="${P(x,y,z)[1]}" font-size="${size}" fill="${color}" ${extra}>${text}</text>`;
  const frontText=(x,y,z,text,size=11,color='#fff')=>`<text transform="translate(${pt(x,y,z)}) matrix(.82 .41 0 1 0 0)" font-weight="700" font-size="${size}" fill="${color}" letter-spacing="1">${text}</text>`;
  const sideText=(x,y,z,text,size=11,color='#fff')=>`<text transform="translate(${pt(x,y,z)}) matrix(.82 -.41 0 1 0 0)" font-weight="700" font-size="${size}" fill="${color}" letter-spacing="1">${text}</text>`;
  function tree(x,y,s=1,type='round'){
    const [a,b]=P(x,y);return `<g transform="translate(${a} ${b}) scale(${s})"><ellipse cx="9" cy="4" rx="23" ry="9" fill="#487d4a" opacity=".13"/><path d="M0 1v-31" stroke="#8d7751" stroke-width="6"/>${type==='pine'?'<path d="M-22-22 0-70 22-22Z" fill="#4e9568"/><path d="M0-70 22-22H0Z" fill="#377955"/>':'<ellipse cy="-38" rx="24" ry="28" fill="#619e67"/><ellipse cx="-7" cy="-45" rx="17" ry="22" fill="#7db471"/><ellipse cx="8" cy="-32" rx="16" ry="20" fill="#4e905f"/>'}</g>`;
  }
  function pot(x,y,color='#f59a76'){return box(x,y,13,13,13,['#f6cb9e','#cf986b','#ae7d58'])+`<circle cx="${P(x+7,y+7,25)[0]}" cy="${P(x+7,y+7,25)[1]}" r="12" fill="#6f9e5b"/><circle cx="${P(x+6,y+7,32)[0]}" cy="${P(x+6,y+7,32)[1]}" r="5" fill="${color}"/>`;}
  function person(x,y,c='#f47b5a',s=1){const[a,b]=P(x,y);return `<g transform="translate(${a} ${b}) scale(${s})"><ellipse cy="2" cx="3" rx="7" ry="3" fill="#456447" opacity=".16"/><path d="M-2-6v8m5-8v8" stroke="#426072" stroke-width="3.3" stroke-linecap="round"/><path d="M0-17v10" stroke="${c}" stroke-width="8" stroke-linecap="round"/><circle cy="-23" r="4.5" fill="#ba8259"/><path d="M-4-25q3-6 8 0" stroke="#504b3d" stroke-width="3" fill="none"/></g>`;}
  function lamp(x,y){const[a,b]=P(x,y);return `<g><ellipse cx="${a+3}" cy="${b+2}" rx="10" ry="3" fill="#527957" opacity=".12"/><path d="M${a} ${b}v-51q0-8 9-8h6" stroke="#4f7360" stroke-width="3" fill="none"/><rect x="${a+8}" y="${b-62}" width="13" height="5" rx="2" fill="#416d56"/><ellipse cx="${a+14}" cy="${b-55}" rx="5" ry="2" fill="#fff3b0"/></g>`;}
  function bench(x,y){return box(x,y,43,11,10,['#c99764','#a77e51','#916d44'])+line([x,y,12],[x+43,y,12],'#d1a674',6)+line([x+5,y+3,0],[x+5,y+3,20],'#62745b',2)+line([x+37,y+3,0],[x+37,y+3,20],'#62745b',2);}
  function building({id,x,y,w=120,d=95,h=80,roof='#ee865f',face='#ffefd1',side='#dfd8b7',sign='#476e58',story=0}){
    if(id==='coffee'){
      const cart=box(x,y,92,43,35,['#edcc8f','#e0b271','#bc9464'])+box(x-5,y-5,102,53,8,['#fff0c7','#dca45e','#bc9053'],72)+frontText(x+7,y+44,20,labels[id],10,'#65593b')+line([x+4,y+39,35],[x+4,y+39,75],'#9c8358',3)+line([x+88,y+39,35],[x+88,y+39,75],'#9c8358',3);
      const wheels=[P(x+17,y+44,0),P(x+75,y+44,0)].map(([a,b])=>`<circle cx="${a}" cy="${b}" r="7" fill="#72836a" stroke="#c3d2b1" stroke-width="2"/>`).join('');
      return `<g id="building-coffee" class="sg-building" data-story="5">${cart}${wheels}</g>`;
    }
    let a=flat(x-8,y-8,w+25,d+25,1,'#739367','opacity=".13"')+box(x,y,w,d,h,[roof,face,side]);
    a+=box(x-4,y-4,w+8,d+8,8,[roof,roof,sign],h);
    a+=flat(x+8,y+8,w-16,d-16,h+9,roof);
    // Raised roof detail and chimney, with real isometric faces.
    a+=box(x+w-26,y+12,14,18,22,['#f2e7cd','#d7c9ad','#b5ac91'],h+9);
    if(id==='bank'){
      a+=box(x+15,y+13,w-30,d-26,25,['#44747c','#315966','#244855'],h+8);
      for(let z=30;z<h-5;z+=29){ for(let u=17;u<w-15;u+=24) a+=poly([[x+u,y+d,z],[x+u+12,y+d,z],[x+u+12,y+d,z+16],[x+u,y+d,z+16]],'#9dc7c0'); for(let v=14;v<d-15;v+=25)a+=poly([[x+w,y+v,z],[x+w,y+v+13,z],[x+w,y+v+13,z+16],[x+w,y+v,z+16]],'#76a6aa'); }
      a+=frontText(x+10,y+d+1,h-12,labels[id],10,'#f9efd4');
      a+=line([x+w/2,y+d/2,h+34],[x+w/2,y+d/2,h+66],'#547766',2);
      const[q,r]=P(x+w/2,y+d/2,h+66);a+=`<path class="sg-flag" d="M${q} ${r}l25 4-4 13-21-5Z" fill="#f2c961"/>`;
    }else if(id==='hall'||id==='homebank'){
      a+=box(x-6,y+d, w+12,14,5,['#ebddbf','#c1ba9f','#a9ab8a']);
      for(let u=12;u<w-8;u+=30)a+=box(x+u,y+d+2,8,6,h-24,['#fff9df','#fff5d7','#daceb1'],5);
      a+=poly([[x-7,y-4,h+10],[x+w/2,y-4,h+45],[x+w+7,y-4,h+10]],'#779b84');
      a+=poly([[x-7,y+d+4,h+10],[x+w/2,y+d+4,h+45],[x+w+7,y+d+4,h+10]],'#c8d6bb');
      a+=poly([[x+w/2,y-4,h+45],[x+w+7,y-4,h+10],[x+w+7,y+d+4,h+10],[x+w/2,y+d+4,h+45]],'#7f9c80');
      a+=frontText(x+14,y+d+5,h-10,labels[id],id==='hall'?12:10,'#4d6a54');
      if(id==='hall'){const[q,r]=P(x+w/2,y+d+5,h+22);a+=`<ellipse cx="${q}" cy="${r}" rx="9" ry="10" fill="#fff9e3"/><path d="M${q} ${r-6}v6l5 3" fill="none" stroke="#5d795d" stroke-width="1.5"/>`;}
    }else{
      for(let u=11;u<w-20;u+=36){a+=poly([[x+u,y+d+.5,16],[x+u+24,y+d+.5,16],[x+u+24,y+d+.5,48],[x+u,y+d+.5,48]],'#477877');a+=line([x+u+12,y+d+1,18],[x+u+12,y+d+1,47],'#cce0c3',2);a+=line([x+u+1,y+d+1,29],[x+u+23,y+d+1,29],'#cce0c3',2);}
      for(let v=15;v<d-15;v+=32)a+=poly([[x+w+.5,y+v,22],[x+w+.5,y+v+20,22],[x+w+.5,y+v+20,49],[x+w+.5,y+v,49]],'#64918a');
      a+=poly([[x+6,y+d+1,57],[x+w-6,y+d+1,57],[x+w-6,y+d+1,76],[x+6,y+d+1,76]],sign);
      a+=frontText(x+13,y+d+2,63,labels[id],id==='bakery'?11:10);
      for(let u=5;u<w-5;u+=13){const col=Math.round((u-5)/13)%2===0?roof:'#fff5d9';a+=poly([[x+u,y+d,56],[x+u+13,y+d,56],[x+u+13,y+d+24,43],[x+u,y+d+24,43]],col);a+=poly([[x+u,y+d+24,43],[x+u+13,y+d+24,43],[x+u+13,y+d+24,37],[x+u,y+d+24,37]],col);}
      a+=pot(x-11,y+d+12,id==='florist'?'#f5a1b4':'#f5c15c')+pot(x+w+4,y+d+12);
    }
    return `<g id="building-${id}" class="sg-building" data-story="${story}">${a}</g>`;
  }
  let art=`<defs><filter id="island-shadow" x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur stdDeviation="16"/></filter><pattern id="water-grain" width="65" height="42" patternUnits="userSpaceOnUse"><path d="M8 15h11m23 19h15" stroke="#c2eee4" stroke-width="2" stroke-linecap="round" opacity=".55"/></pattern></defs>`;
  art+=`<ellipse cx="814" cy="696" rx="496" ry="61" fill="#6f9276" opacity=".16" filter="url(#island-shadow)"/>`;
  const land=[[-20,35],[90,-15],[720,-15],[855,100],[855,550],[705,705],[115,705],[-20,555]];
  const water=[[-90,-70],[640,-90],[1000,80],[1110,460],[920,740],[550,830],[120,800],[-80,490]];
  art+=poly(water,'#b1e2da')+poly(water,'url(#water-grain)');
  art+=poly(land.map(([x,y])=>[x,y,-21]),'#a8bb8b');
  art+=poly(land.map(([x,y])=>[x,y,-10]),'#e5dba7');
  art+=poly(land,'#bad99c');
  // Park lawns, paved lots, and the crossing town streets.
  art+=flat(16,28,296,207,1,'#b1d390')+flat(498,28,281,207,1,'#c3dfa8')+flat(16,353,291,270,1,'#c6dfa8')+flat(491,354,285,250,1,'#b1d292');
  art+=flat(-15,249,848,93,2,'#e5e5ce')+flat(336,-12,103,692,2,'#e5e5ce');
  art+=flat(-15,263,848,62,3,'#aec2ae')+flat(351,-12,73,692,3,'#aec2ae');
  art+=line([-15,292,4],[830,292,4],'#edf0d8',2,'stroke-dasharray="13 15"')+line([388,0,4],[388,680,4],'#edf0d8',2,'stroke-dasharray="13 15"');
  for(let u=0;u<6;u++){art+=flat(347+u*13,238,7,21,5,'#f5f4df')+flat(322,269+u*10,20,5,5,'#f5f4df');}
  // Waterfront promenade and rail route.
  art+=flat(59,640,667,28,4,'#e8ddb7');
  art+=line([77,650,6],[717,650,6],'#a69978',2)+line([77,660,6],[717,660,6],'#a69978',2);
  for(let u=81;u<717;u+=18)art+=line([u,647,6],[u,663,6],'#b8a582',3);
  art+=flat(798,347,122,32,5,'#c9aa7a');for(let u=800;u<920;u+=12)art+=line([u,347,6],[u,379,6],'#ad8e67',1);
  // Small grassy details: all deterministic so the town never flickers.
  for(let i=0;i<100;i++){let x=30+(i*137)%760,y=30+(i*89)%590;if((x>315&&x<452)||(y>235&&y<350))continue;art+=line([x,y,2],[x+5,y+2,2],i%3?'#a6c789':'#d5e6b1',2);}
  const bgTrees=[[20,45,1],[20,110,.85],[15,190,1],[105,25,.9],[190,5,1],[480,0,1],[570,0,.9],[735,30,1],[792,98,1.1],[795,182,.9],[810,229,.9],[770,582,1.1],[717,606,.8],[260,588,.9],[37,566,1],[33,482,.8]];
  bgTrees.forEach(([x,y,s],i)=>{art+=tree(x,y,s,i%3===0?'pine':'round')});
  const buildings=[
    {id:'bank',x:530,y:65,w:117,d:91,h:205,roof:'#406c73',face:'#315b65',side:'#244a58',sign:'#244953',story:0},
    {id:'hall',x:147,y:78,w:127,d:105,h:85,roof:'#769b87',face:'#eee8ce',side:'#d4d6b8',story:0},
    {id:'homebank',x:720,y:426,w:92,d:77,h:61,roof:'#719d89',face:'#f4ecd1',side:'#d1d8bc',story:4},
    {id:'florist',x:503,y:171,w:106,d:69,h:62,roof:'#dd9db3',face:'#faecd4',side:'#e3ccb1',sign:'#9d687d',story:5},
    {id:'coffee',x:656,y:188,w:108,d:59,h:65,roof:'#dfad65',face:'#f7e7c7',side:'#dcc5a2',sign:'#846d48',story:5},
    {id:'bakery',x:145,y:383,w:157,d:105,h:96,roof:'#f08460',face:'#fff0cc',side:'#e9cba6',sign:'#cb674d',story:1},
    {id:'books',x:459,y:399,w:117,d:85,h:86,roof:'#769fb1',face:'#f3edcf',side:'#d0d8c5',sign:'#53798a',story:5},
    {id:'gym',x:585,y:531,w:103,d:65,h:70,roof:'#d9b154',face:'#fff0ca',side:'#e2d2a0',sign:'#918344',story:5}
  ];
  // Render back-to-front by footprint for correct isometric occlusion.
  buildings.sort((a,b)=>(a.x+a.y)-(b.x+b.y)).forEach(b=>art+=building(b));
  // The central square: fountain, seating, planters, and cafe umbrellas.
  art+=flat(464,358,95,29,5,'#dce3bd');
  art+=box(69,504,66,66,8,['#ebe5c6','#c9c8a5','#acba98']);
  const[fx,fy]=P(102,537,12);art+=`<ellipse cx="${fx}" cy="${fy}" rx="33" ry="16" fill="#81c7c6" stroke="#f2ebd0" stroke-width="6"/><path d="M${fx} ${fy}v-27m0 10q-13-25-22 0m22 0q13-25 22 0" stroke="#d6f4e3" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="${fx}" cy="${fy-28}" rx="5" ry="3" fill="#f2fbdf"/>`;
  art+='<g id="cafe-tables">';
  [[670,375,'#ebad68'],[750,575,'#e5866b'],[490,553,'#8fb396']].forEach(([x,y,c])=>{let[a,b]=P(x,y);art+=`<ellipse cx="${a+7}" cy="${b+3}" rx="27" ry="12" fill="#5d895e" opacity=".12"/>`+box(x-9,y-9,22,22,18,['#e6cb95','#ba9b69','#a18660'])+line([x,y,0],[x,y,58],'#ba9b6b',3);art+=poly([[x-26,y-26,45],[x+26,y-26,45],[x,y,68]],c)+poly([[x+26,y-26,45],[x+26,y+26,45],[x,y,68]],'#fae6b6')+poly([[x+26,y+26,45],[x-26,y+26,45],[x,y,68]],c)+poly([[x-26,y+26,45],[x-26,y-26,45],[x,y,68]],'#fff0c9');});
  art+='</g>';
  [[295,195],[456,83],[465,253],[124,349],[318,494],[448,583],[711,629]].forEach(([x,y])=>art+=lamp(x,y));
  art+=bench(31,384)+bench(151,583)+bench(574,361)+bench(484,622);
  [[32,347,.85],[49,425,.9],[35,616,1.15],[204,616,.8],[451,351,.75],[564,583,.75],[820,527,.8]].forEach(([x,y,s])=>art+=tree(x,y,s));
  art+='<g id="town-visitors">';
  [[270,515,'#c9775b'],[297,537,'#648b9a'],[315,565,'#e9bf56'],[377,354,'#d38882'],[410,458,'#fff4d8'],[331,174,'#e5b951'],[462,231,'#ed9867'],[665,318,'#6a8fa6'],[735,393,'#cf786d'],[474,605,'#66829e'],[591,634,'#df9276'],[714,551,'#6b9674']].forEach(([x,y,c])=>art+=person(x,y,c));
  art+='</g>';
  // Quiet waterfront life.
  const boat=(x,y,s=1)=>{let[a,b]=P(x,y);return `<g class="sg-boat"><g transform="translate(${a} ${b}) scale(${s})"><ellipse cy="12" rx="39" ry="9" fill="#fff" opacity=".25"/><path d="m-32 0 18 16h27L34 0Z" fill="#fff4d7"/><path d="m-32 0 18 16h27l7-5h-30Z" fill="#dc997b"/><path d="M0 0v-61" stroke="#658b85" stroke-width="2"/><path d="M-3-57-27-9h24Z" fill="#fffcdf"/><path d="M3-51v42h24Z" fill="#edb768"/></g></g>`;};
  art+=boat(945,456,.9)+boat(665,791,.65);
  art+=`<g id="cargo-train">${box(95,645,45,21,17,['#f6edd2','#4c897b','#377566'],8)}${box(143,645,30,21,13,['#f4cc75','#dfa454','#bc8a43'],8)}${box(176,645,30,21,13,['#f4cc75','#dfa454','#bc8a43'],8)}${frontText(104,667,15,'▰ ▰',11,'#e8efd6')}</g>`;
  for(let i=0;i<9;i++){let[a,b]=P(900+i*21,87+i*68);art+=`<path class="sg-water-line" d="M${a-15} ${b}h28m-17 9h17" fill="none" stroke="#e0f2df" stroke-width="2" stroke-linecap="round"/>`;}
  art+=`<g class="sg-bird" fill="none" stroke="#7b9e88" stroke-width="2" stroke-linecap="round"><path d="M1160 130q7-8 14 0 7-8 14 0M1220 112q5-6 10 0 5-6 10 0M1270 161q6-7 12 0 6-7 12 0"/></g>`;
  art+=txt(895,612,0,'P R O S P E R I T Y   B A Y',12,'#629e98','transform="rotate(-27 '+P(895,612)[0]+' '+P(895,612)[1]+')" font-weight="500"');
  // Golden infrastructure beneath the everyday life of the town.
  const routeA=`M${pt(320,505,16)}L${pt(386,505,16)}L${pt(386,294,16)}L${pt(583,294,16)}L${pt(583,166,16)}`;
  const routeB=`M${pt(320,505,16)}L${pt(386,505,16)}L${pt(386,611,16)}L${pt(760,611,16)}L${pt(760,516,16)}`;
  art+=`<g id="money-grid"><path d="${routeA}" stroke="#fff2a9" stroke-width="10" opacity=".48" fill="none" stroke-linejoin="round"/><path class="sg-money-path" d="${routeA}" stroke="#e3b84c" stroke-width="3" fill="none"/><g id="payout-path"><path d="${routeB}" stroke="#fff2a9" stroke-width="10" opacity=".6" fill="none"/><path class="sg-money-path" d="${routeB}" stroke="#dfb447" stroke-width="3" fill="none"/></g><g id="moving-coin"><circle r="9" fill="#f4cc56" stroke="#fff2b1" stroke-width="3"/><text y="4" text-anchor="middle" fill="#ad8331" font-size="11" font-weight="700">$</text></g></g>`;
  art+=`<g id="vault">${box(191,504,84,40,33,['#e7ba52','#dba644','#c59438'])}${poly([[204,545,9],[261,545,9],[261,545,32],[204,545,32]],'#f5d478')}${frontText(222,546,17,'⊕',20,'#a47d34')}</g>`;
  const[rx,ry]=P(230,435,0);art+=`<ellipse id="focus-ring" class="sg-focus-ring" cx="${rx}" cy="${ry}" rx="115" ry="55" stroke="#f5cf62" stroke-width="3" fill="none"/>`;
  svg.insertAdjacentHTML('beforeend',art);
  // Story actors are independent from the terrain; all visibility is derived from the timeline.
  const localPerson=(color)=>`<ellipse cy="3" rx="10" ry="4" fill="#416548" opacity=".16"/><path d="M-4-8v10m8-10v10" stroke="#426072" stroke-width="4" stroke-linecap="round"/><rect x="-7" y="-28" width="14" height="22" rx="7" fill="${color}"/><circle cy="-34" r="7" fill="#c3926f"/><path d="M-6-37q6-8 12 0" stroke="#62533e" stroke-width="4" fill="none"/>`;
  const localPaper=`<rect x="-23" y="-55" width="46" height="57" rx="5" fill="#fffdf0" stroke="#becdad" stroke-width="2"/><rect x="-13" y="-44" width="17" height="5" rx="2" fill="#e7be5c"/><path d="M-13-30h26m-26 9h26m-26 9H5" stroke="#92a88a" stroke-width="3" stroke-linecap="round"/>`;
  const hallPoint=P(280,222,35),customerPoint=P(310,608,0);
  let effects=`<g id="rosie-cart">${localPerson('#e77e5b')}<g transform="translate(32 0)"><path d="m-15-20 32 0-4 19h-24Z" fill="#e1b15f"/><path d="M-18-23h-7v10" fill="none" stroke="#8c8767" stroke-width="3"/><circle cx="-9" cy="4" r="4" fill="#688064"/><circle cx="10" cy="4" r="4" fill="#688064"/><path d="M-7-20v-18h16v18" fill="#fff8df" stroke="#c9c6a0"/></g></g>`;
  effects+=`<g id="application-papers" transform="translate(${hallPoint})"><g transform="translate(-18 3) rotate(-12)">${localPaper}</g><g transform="translate(14 -8) rotate(7)">${localPaper}</g></g><g id="flying-document">${localPaper}</g>`;
  effects+=`<g id="review-lens" transform="translate(${hallPoint})"><circle cx="3" cy="-22" r="19" fill="#ddf2eabb" stroke="#587e74" stroke-width="5"/><path d="M16-8 32 8" stroke="#587e74" stroke-width="7" stroke-linecap="round"/></g>`;
  effects+=`<g id="missing-document" transform="translate(${hallPoint})"><circle cy="-20" r="25" fill="#f5d27f" stroke="#e2b957" stroke-width="2"/><text y="-10" text-anchor="middle" font-size="29" font-weight="700" fill="#84672d">!</text></g>`;
  effects+=`<g id="approval-seal" transform="translate(${hallPoint})"><circle cy="-20" r="30" fill="#478462" stroke="#eff7d7" stroke-width="5"/><path d="M-14-21-3-10 17-33" fill="none" stroke="#fff9dc" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  effects+=`<g id="checkout-customer">${localPerson('#638f9d')}</g><g id="risky-attempt">${localPerson('#a19c89')}<path d="M17-44h20v20H17Z" fill="#d68065"/><path d="m22-39 10 10m0-10-10 10" stroke="#fff5e3" stroke-width="3"/></g>`;
  effects+=`<g id="checkout-counter">${box(272,512,43,26,26,['#f4d79d','#d29162','#ac7757'])}${box(283,520,16,12,12,['#8bad8e','#416f62','#385c52'],26)}</g>`;
  effects+=`<g id="hosted-stall">${box(70,465,57,31,30,['#f5dfb3','#d9b875','#b79867'])}${poly([[65,459,70],[132,459,70],[132,503,60],[65,503,60]],'#dca158')}${poly([[65,503,60],[132,503,60],[132,503,52],[65,503,52]],'#fff1cb')}${poly([[68,494,0],[72,494,0],[72,494,58],[68,494,58]],'#a88350')}${poly([[125,494,0],[129,494,0],[129,494,58],[125,494,58]],'#a88350')}</g>`;
  effects+=`<g id="payment-card"><rect x="-20" y="-14" width="40" height="28" rx="5" fill="#fffbed" stroke="#65877c" stroke-width="2"/><path d="M-19-5h38" stroke="#446f72" stroke-width="6"/><rect x="-13" y="4" width="10" height="5" rx="2" fill="#e9c865"/></g>`;
  effects+=`<g id="payment-token"><path d="M-10-8v-8a10 10 0 0 1 20 0v8" fill="none" stroke="#a48133" stroke-width="5"/><rect x="-17" y="-10" width="34" height="29" rx="6" fill="#efd06e" stroke="#b29343" stroke-width="2"/><circle cy="3" r="4" fill="#9b8035"/><path d="M0 3v8" stroke="#9b8035" stroke-width="3"/></g>`;
  effects+=`<g id="identity-phone"><rect x="-14" y="-30" width="28" height="50" rx="6" fill="#395f64"/><rect x="-10" y="-23" width="20" height="34" rx="2" fill="#e7f3df"/><path d="m-6-6 4 5 9-13" stroke="#579164" stroke-width="3" fill="none"/><circle cy="15" r="2" fill="#adc9af"/></g>`;
  effects+=`<g id="security-gate">${box(319,524,6,9,40,['#89aa91','#577e6c','#466c5c'])}${box(349,524,6,9,40,['#89aa91','#577e6c','#466c5c'])}${poly([[319,525,29],[355,525,29],[355,525,35],[319,525,35]],'#e09a75')}</g>`;
  effects+=`<g id="express-vehicle"><rect x="-31" y="-20" width="62" height="24" rx="10" fill="#f9f7df" stroke="#5a8d85" stroke-width="2"/><path d="M-20-12h35" stroke="#648f90" stroke-width="7" stroke-linecap="round"/><path d="M-28 0h49" stroke="#64a897" stroke-width="4"/></g><g id="wire-courier"><rect x="-23" y="-23" width="33" height="26" rx="3" fill="#7396a2"/><path d="M10-14h15l8 11v6H10Z" fill="#a5bbc0"/><path d="M14-11h9l5 9H14Z" fill="#f2f2d3"/><circle cx="-12" cy="5" r="5" fill="#4e655f"/><circle cx="24" cy="5" r="5" fill="#4e655f"/></g>`;
  effects+=`<g id="linked-pin"><path d="M0 5C-35-25-20-49 0-49S35-25 0 5Z" fill="#6b9984" stroke="#fff8dc" stroke-width="3"/><circle cy="-28" r="8" fill="#f6eeb5"/></g>`;
  effects+=`<g id="new-shop-vaults">${buildings.filter(b=>b.story===5).map(b=>box(b.x+15,b.y+b.d+27,42,22,21,['#edcf78','#d2ac51','#b99945'])).join('')}</g>`;
  effects+=`<g id="city-bell"><path d="M-15 0q6-5 6-17a9 9 0 0 1 18 0q0 12 6 17Z" fill="#e6bc58" stroke="#9b8348" stroke-width="2"/><circle cy="4" r="4" fill="#9b8348"/><path d="M-24-23q-7 10-1 18M24-23q7 10 1 18" fill="none" stroke="#b5a769" stroke-width="2"/></g>`;
  effects+=`<g id="confetti">${Array.from({length:22},(_,i)=>`<rect x="${i*11-110}" y="${-(i*17)%80}" width="4" height="8" fill="${['#e7b651','#e98969','#71a88c'][i%3]}" transform="rotate(${i*21} ${i*11-110} ${-(i*17)%80})"/>`).join('')}</g>`;
  effects+='<g id="new-client-carts">'+['#d997b1','#7f9daf','#d9b965','#e69c65'].map((color,i)=>'<g transform="translate('+(i*38)+' '+(i*16)+')">'+localPerson(color)+'<rect x="12" y="-15" width="24" height="17" rx="2" fill="'+color+'"/><circle cx="17" cy="4" r="3" fill="#65785f"/><circle cx="31" cy="4" r="3" fill="#65785f"/></g>').join('')+'</g>';
  svg.insertAdjacentHTML('beforeend',effects);
  const ids=['new-client-carts','rosie-cart','application-papers','flying-document','review-lens','missing-document','approval-seal','checkout-customer','risky-attempt','checkout-counter','hosted-stall','payment-card','payment-token','identity-phone','security-gate','express-vehicle','wire-courier','linked-pin','new-shop-vaults','city-bell','confetti','cargo-train','cafe-tables','town-visitors','vault','money-grid','payout-path','moving-coin','focus-ring'];
  const nodes=Object.fromEntries(ids.map(id=>[id,svg.querySelector('#'+id)]));
  const buildingNodes=Object.fromEntries(buildings.map(b=>[b.id,svg.querySelector('#building-'+b.id)]));
  const show=(id,on)=>{nodes[id].style.display=on?'':'none';};
  const move=(id,x,y)=>nodes[id].setAttribute('transform',`translate(${x.toFixed(2)} ${y.toFixed(2)})`);
  const ease=SGTimeline.ease,clamp=SGTimeline.clamp;
  const route=svg.querySelector('#money-grid>path'),routeLength=route.getTotalLength();
  const payoutRoute=svg.querySelector('#payout-path>path'),payoutLength=payoutRoute.getTotalLength();
  function draw(s,reduced){
    const t=s.time,phase=s.phase,animate=v=>reduced?1:ease(v);
    for(const id in buildingNodes){
      const visible=id==='bank'||id==='hall'||(id==='homebank'?s.homebank:s.businesses[id]);
      buildingNodes[id].style.display=visible?'':'none';
      const start=id==='bakery'&&s.chapter===1?30.5:s.extraStarts[id];
      const popping=visible&&((id==='bakery'&&s.chapter===1)||(s.chapter===5&&s.extraStarts[id]));
      const p=popping?animate((t-start)/1.1):1;
      buildingNodes[id].setAttribute('transform',`translate(0 ${((1-p)*-40).toFixed(2)})`);
      buildingNodes[id].style.opacity=p;
    }
    ids.forEach(id=>show(id,false));
    show('vault',s.account);show('money-grid',s.account);show('payout-path',s.chapter>=4);show('town-visitors',s.visitors);show('cafe-tables',s.visitors);show('new-shop-vaults',s.newAccounts);
    if(s.chapter===2){const p=animate(t/2);move('vault',0,(1-p)*35);nodes.vault.style.opacity=p;}else{move('vault',0,0);nodes.vault.style.opacity=1;}
    if(s.newAccounts){const p=animate((t-12)/1.5);move('new-shop-vaults',0,(1-p)*30);nodes['new-shop-vaults'].style.opacity=p;}
    if(s.chapter===1){
      const p=animate(t/4),from=P(388,390),to=P(300,234);show('rosie-cart',t<29);move('rosie-cart',from[0]+(to[0]-from[0])*p,from[1]+(to[1]-from[1])*p);
      show('application-papers',['requirements','review','resubmit'].includes(phase));
      show('review-lens',['review','resubmit'].includes(phase));show('missing-document',phase==='missing');show('approval-seal',phase==='approved'&&s.stepTime<1.5);
      show('flying-document',['requirements','resubmit'].includes(phase)&&s.stepTime<3);
      const f=animate(s.stepTime/2);move('flying-document',to[0]+30+(hallPoint[0]-to[0]-30)*f,to[1]-35+(hallPoint[1]-to[1]+35)*f-(reduced?0:Math.sin(f*Math.PI)*50));
      show('confetti',phase==='approved'&&s.stepTime>=1.5&&s.stepTime<4.5);const b=P(230,435,120);move('confetti',b[0],b[1]+(s.stepTime-1.5)*12);
    }
    show('checkout-counter',s.chapter===3||(s.chapter===5&&t>=18));show('hosted-stall',s.chapter===3&&phase==='hosted');
    if(s.chapter===3){
      // Walk along the front promenade, then approach the stall from its open side.
      // The old diagonal crossed the account vault; these waypoints clear its footprint.
      const f=animate(s.stepTime/2.5),hosted=phase==='hosted';
      const path=hosted?[P(388,614),P(125,614),P(102,550)]:[P(388,614),customerPoint];
      const leg=hosted&&f<.72?0:hosted?1:0,local=hosted?(leg===0?f/.72:(f-.72)/.28):f;
      const from=path[leg],target=path[leg+1];
      const px=from[0]+(target[0]-from[0])*local,py=from[1]+(target[1]-from[1])*local;
      show('checkout-customer',phase!=='screen'&&phase!=='settle');move('checkout-customer',px,py);
      const briefToken=['dropin','hosted','link'].includes(phase)&&s.stepTime>=3.4;
      show('payment-card',['dropin','hosted','token'].includes(phase)&&(phase!=='token'||s.stepTime<1.4)&&!briefToken);move('payment-card',px+5,py-67);
      show('payment-token',briefToken||(phase==='token'&&s.stepTime>=1.4));move('payment-token',px+5,py-67);
      show('identity-phone',['identity','link'].includes(phase)&&!briefToken);move('identity-phone',px+16,py-55);
      show('security-gate',phase==='screen');show('risky-attempt',phase==='screen');const r=P(368,555);move('risky-attempt',r[0]+(reduced?0:Math.max(0,s.stepTime-2)*12),r[1]+(reduced?0:Math.max(0,s.stepTime-2)*4));
      if(phase==='settle'&&s.stepTime>=.5&&s.stepTime<3.1){show('moving-coin',true);const cp=route.getPointAtLength((1-animate((s.stepTime-.5)/2.5))*routeLength);move('moving-coin',cp.x,cp.y);}
    }
    if(s.chapter===4){
      const pin=P(765,470,110);show('linked-pin',phase==='linked');move('linked-pin',...pin);
      // The express uses the waterfront lane; the courier uses the inner road.
      // Distinct routes prevent the faster vehicle crossing through the courier at the bend.
      if(t>=6&&t<8){show('express-vehicle',true);const f=animate((t-6)/2);const p=f<.8?P(340+420*f/.8,625,20):P(760,625-109*(f-.8)/.2,20);move('express-vehicle',...p);}
      if(t>=6&&t<24){show('cargo-train',true);const p=animate((t-6)/18)*495;move('cargo-train',p*.82,p*.41);}
      if(t>=6&&t<22){show('wire-courier',true);const p=payoutRoute.getPointAtLength(animate((t-6)/16)*payoutLength);move('wire-courier',p.x,p.y+8);}
    }
    if(s.chapter===5){
      show('application-papers',phase==='arrivals');show('new-client-carts',phase==='arrivals');const arrivals=P(350,270,0);move('new-client-carts',arrivals[0]-(reduced?0:Math.max(0,4-t)*15),arrivals[1]+(reduced?0:Math.max(0,4-t)*7));
      show('city-bell',phase==='events');const b=P(212,148,140);nodes['city-bell'].setAttribute('transform',`translate(${b}) rotate(${reduced?0:Math.sin(s.stepTime*8)*12})`);
      show('confetti',phase==='expand'&&s.stepTime<4);const c=P(520,385,150);move('confetti',c[0],c[1]+s.stepTime*12);
      show('cargo-train',phase==='activity');if(phase==='activity'){const p=(reduced?1:(s.stepTime/6))*470;move('cargo-train',p*.82,p*.41);}
    }
    const focus=s.focus==='hall'?P(207,138):s.focus==='bakery'?P(230,445):s.focus==='payout'?P(765,470):null;
    show('focus-ring',!!focus);if(focus){nodes['focus-ring'].setAttribute('cx',focus[0]);nodes['focus-ring'].setAttribute('cy',focus[1]);nodes['focus-ring'].setAttribute('opacity','.35');}
  }
  return {P,draw};

}};

export default SGScene;
