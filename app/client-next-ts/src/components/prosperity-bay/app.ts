/* Presentation controller. The timeline owns the story; the scene owns the drawing. */
// @ts-nocheck
import SGContent from './content';
import { PROSPERITY_BAY_MARKUP } from './markup';
import SGOperations from './operations';
import SGScene from './scene';
import SGTimeline from './timeline';

export type ProsperityBayMountOptions = {
  chapter?: number;
  t?: number;
  pause?: boolean;
};

export function mountProsperityBay(
  root: HTMLElement,
  options: ProsperityBayMountOptions = {},
): () => void {
  root.innerHTML = PROSPERITY_BAY_MARKUP;
  const {chapters,sources,metaphor,objective,storyCallouts}=SGContent;
  const {getState,advance,adjacentStep,total}=SGTimeline;
  const $=id=>root.querySelector('#'+id);
  const scene=SGScene.create($('town'));
  const storyScene=SGScene.create($('story-town'));
  storyScene.draw(SGTimeline.getState(5,20),true);
  const markerLayer=document.createElementNS('http://www.w3.org/2000/svg','g');
  markerLayer.setAttribute('class','sg-story-markers');
  markerLayer.setAttribute('aria-hidden','true');
  storyCallouts.forEach(({point},i)=>{
    const [x,y]=storyScene.P(...point);
    const marker=document.createElementNS('http://www.w3.org/2000/svg','g');
    marker.setAttribute('transform',`translate(${x} ${y})`);
    marker.innerHTML=`<circle r="20"/><text text-anchor="middle" dy=".35em">${i+1}</text>`;
    markerLayer.append(marker);
    const li=document.createElement('li');
    const number=document.createElement('span'),body=document.createElement('div'),title=document.createElement('strong'),description=document.createElement('p');
    number.textContent=String(i+1).padStart(2,'0');title.textContent=storyCallouts[i].title;description.textContent=storyCallouts[i].description;
    body.append(title,description);li.append(number,body);$('story-callouts').append(li);
  });
  $('story-town').append(markerLayer);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=matchMedia('(max-width: 900px)');
  let chapter=Math.max(0,Math.min(5,(Number(options.chapter)||1)-1));
  let time=Math.max(0,Math.min(chapters[chapter].duration-.001,Number(options.t)||0));
  let manualPaused=Boolean(options.pause),exploring=false,wideMode=false,lastFrame=null,lastKey='',lastChapter=-1,idleTimer;
  let raf=0,stopped=false;
  const cameras={wide:[45,-10,1520,845],intro:[-480,-200,2100,1170],hall:[570,-35,590,415],bakery:[335,105,585,410],payout:[380,235,1050,490]};
  let view=cameras[chapter===0?'intro':getState(chapter,time).focus].slice();

  let lastView='';
  let apiOpen=true;
  function setApiOpen(open){
    apiOpen=open;$('api-panel').hidden=!open;$('workspace').classList.toggle('sg-api-open',open);
    $('api-toggle').setAttribute('aria-expanded',String(open));
    if(!open)$('api-toggle').focus();
    else if(matchMedia('(max-width: 1199px)').matches)$('api-panel').scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});
  }
  const onApiToggle=()=>setApiOpen(!apiOpen);
  const onApiClose=()=>setApiOpen(false);
  const onApiKeydown=e=>{if(e.key==='Escape'){e.stopPropagation();setApiOpen(false);}};
  $('api-toggle').addEventListener('click',onApiToggle);
  $('api-close').addEventListener('click',onApiClose);
  $('api-panel').addEventListener('keydown',onApiKeydown);
  function renderOperations(s){
    const flow=SGOperations.data[s.phase];
    $('api-family').textContent=flow.family;$('api-position').textContent=String(s.chapter+1).padStart(2,'0')+'.'+String(s.stepIndex+1).padStart(2,'0');
    $('api-title').textContent=flow.title;$('api-summary').textContent=flow.summary;$('api-note').textContent=flow.note;$('api-note').hidden=!flow.note;
    $('api-sequence').replaceChildren();$('api-empty').hidden=flow.ops.length>0;
    for(const [i,operation] of flow.ops.entries()){
      const li=document.createElement('li');li.className='sg-api-operation';
      const number=document.createElement('span');number.className='sg-api-number';number.textContent=String(i+1).padStart(2,'0');number.setAttribute('aria-hidden','true');
      const body=document.createElement('div'),request=document.createElement('div');request.className='sg-api-request';
      const method=document.createElement('span');method.className='sg-api-method';method.dataset.method=operation.method;method.textContent=operation.method;
      const resource=document.createElement('code');resource.textContent=operation.resource;
      const title=document.createElement('strong');title.textContent=operation.title;
      const description=document.createElement('p');description.textContent=operation.description;
      request.append(method,resource);body.append(request,title,description);
      if(operation.tag){const tag=document.createElement('span');tag.className='sg-api-tag';tag.textContent=operation.tag;body.append(tag);}
      li.append(number,body);$('api-sequence').append(li);
    }
    $('api-sources').replaceChildren();
    for(const key of flow.refs){const source=SGOperations.sources[key],a=document.createElement('a');a.href=source.url;a.textContent=source.label+' ↗';a.target='_blank';a.rel='noopener noreferrer';$('api-sources').append(a);}
    // Reset only this panel when the story changes, never the page or the town camera.
    $('api-panel').scrollTop=0;
  }
  const clock=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(Math.floor(s%60)).padStart(2,'0');
  const startTimes=chapters.map((_,i)=>chapters.slice(0,i).reduce((n,c)=>n+c.duration,0));
  const navButtons=chapters.map((c,i)=>{
    const b=document.createElement('button');b.className='sg-chapter-button';
    b.innerHTML='<span class="sg-dot">'+(i+1)+'</span><span>'+c.name+'</span>';
    b.setAttribute('aria-label','Chapter '+(i+1)+': '+c.title);
    b.addEventListener('click',()=>seek(i,0,false));$('chapter-nav').append(b);return b;
  });
  let stepButtons=[];
  const trust=document.createElement('span');trust.className='sg-trust';trust.setAttribute('aria-label','0 approved businesses');
  for(let i=0;i<5;i++)trust.append(document.createElement('i'));root.querySelector('.sg-era').append(trust);
  function buildSteps(c){
    $('chapter-steps').replaceChildren();
    stepButtons=c.steps.map((s,i)=>{
      const li=document.createElement('li'),b=document.createElement('button');b.className='sg-step';
      b.innerHTML='<span class="sg-step-index">'+(i+1)+'</span><span class="sg-step-text"><strong></strong><small></small></span>';
      b.querySelector('strong').textContent=s.label;b.querySelector('small').textContent=s.summary;
      b.setAttribute('aria-label','Step '+(i+1)+': '+s.label+'. Jump here and pause.');
      b.addEventListener('click',()=>seek(chapter,s.at+.1,true));li.append(b);$('chapter-steps').append(li);return b;
    });
  }
  const isPaused=()=>manualPaused||exploring||$('chapter-detail').open||$('story-detail').open;
  function updatePlayback(){
    const paused=isPaused();root.classList.toggle('sg-paused',paused);
    $('play-pause').setAttribute('aria-label',paused?'Play story':'Pause story');
    $('pause-icon').innerHTML=paused?'<path d="m9 5 10 7-10 7Z"/>':'<path d="M9 6v12M15 6v12"/>';
    $('playback-label').textContent=paused?'Story paused':'Story playing';
  }
  function touchIdle(){clearTimeout(idleTimer);if(exploring||$('chapter-detail').open||$('story-detail').open)idleTimer=setTimeout(()=>{exploring=false;if($('chapter-detail').open)$('chapter-detail').close();if($('story-detail').open)$('story-detail').close();updatePlayback();},30000);}
  function seek(i,t=0,pause=false){
    chapter=(i+chapters.length)%chapters.length;
    // Manual jumps skip the opening fade; the autoplay loop still uses it.
    time=chapter===0&&t<2?2:t;exploring=pause;lastKey='';
    if(!pause){clearTimeout(idleTimer);if($('chapter-detail').open)$('chapter-detail').close();}
    if(pause)touchIdle();render(0,true);updatePlayback();
  }
  function sourcesFor(keys){
    $('detail-sources').replaceChildren();keys.forEach(key=>{const a=document.createElement('a');a.href=sources[key].url;a.textContent=sources[key].label+' ↗';a.target='_blank';a.rel='noopener noreferrer';$('detail-sources').append(a);});
  }
  function openDetail(){
    const s=getState(chapter,time);$('detail-category').textContent='CHAPTER '+(chapter+1)+' · STEP '+(s.stepIndex+1);
    $('detail-title').textContent=s.step.label;$('detail-copy').textContent=s.step.detail;$('detail-term').textContent=s.step.term;sourcesFor(s.step.refs);
    exploring=false;$('chapter-detail').showModal();updatePlayback();touchIdle();
  }
  $('objective-title').textContent=objective.title;
  metaphor.forEach(([town,real])=>{
    const recap=document.createElement('div'),a=document.createElement('strong'),b=document.createElement('span');a.textContent=town;b.textContent=real;recap.append(a,b);$('finale-map').append(recap);
  });
  const onStoryButton=()=>{exploring=false;$('story-detail').showModal();updatePlayback();touchIdle();};
  $('story-button').addEventListener('click',onStoryButton);
  ['explore','step-detail'].forEach(id=>$(id).addEventListener('click',openDetail));$('town').addEventListener('click',openDetail);
  const onDialogClose=()=>{clearTimeout(idleTimer);exploring=false;updatePlayback();};
  ['chapter-detail','story-detail'].forEach(id=>{
    $(id).addEventListener('close',onDialogClose);
    ['pointerdown','keydown','wheel','scroll'].forEach(event=>$(id).addEventListener(event,touchIdle,{passive:true}));
  });
  const onCloseDetail=()=>$('chapter-detail').close();
  const onCloseStory=()=>$('story-detail').close();
  const onStoryBackdropClick=e=>{
    const dialog=$('story-detail');
    if(e.target!==dialog)return;
    const {left,right,top,bottom}=dialog.getBoundingClientRect();
    if(e.clientX<left||e.clientX>right||e.clientY<top||e.clientY>bottom)dialog.close();
  };
  $('close-detail').addEventListener('click',onCloseDetail);$('close-story').addEventListener('click',onCloseStory);
  $('story-detail').addEventListener('click',onStoryBackdropClick);
  function resume(){manualPaused=false;exploring=false;clearTimeout(idleTimer);if($('chapter-detail').open)$('chapter-detail').close();if($('story-detail').open)$('story-detail').close();updatePlayback();}
  $('resume-detail').addEventListener('click',resume);$('resume-story').addEventListener('click',resume);
  const onPlayPause=()=>{if(isPaused())resume();else{manualPaused=true;updatePlayback();}};
  $('play-pause').addEventListener('click',onPlayPause);
  const skipStep=direction=>{const target=adjacentStep(chapter,time,direction);seek(target.chapter,target.time,exploring);};
  $('previous-step').addEventListener('click',()=>skipStep(-1));
  $('next-step').addEventListener('click',()=>skipStep(1));
  const brand=root.querySelector('.sg-brand');
  const onBrand=e=>{e.preventDefault();resume();seek(0);};
  brand.addEventListener('click',onBrand);
  const onCamera=()=>{wideMode=!wideMode;$('camera-button').setAttribute('aria-pressed',String(wideMode));$('camera-label').textContent=wideMode?'Return to automatic camera':'Automatic camera';};
  $('camera-button').addEventListener('click',onCamera);
  const onFullscreen=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else $('playback-label').textContent='Use browser fullscreen';}catch{$('playback-label').textContent='Use browser fullscreen';}};
  $('fullscreen').addEventListener('click',onFullscreen);
  const onFullscreenChange=()=>$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen');
  const onKeydown=e=>{if($('chapter-detail').open||$('story-detail').open||/BUTTON|A|INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.code==='Space'){e.preventDefault();$('play-pause').click();}if(e.code==='ArrowRight')seek(chapter+1);if(e.code==='ArrowLeft')seek(chapter-1);};
  document.addEventListener('fullscreenchange',onFullscreenChange);
  document.addEventListener('keydown',onKeydown);
  function moveCamera(s,dt,snap){
    const key=wideMode?'wide':chapter===0?(mobile.matches?'wide':'intro'):s.focus;
    const target=cameras[key];const f=reduced.matches||snap?1:1-Math.exp(-dt*3.2);
    view=view.map((v,i)=>v+(target[i]-v)*f);const value=view.map(v=>v.toFixed(2)).join(' ');if(value!==lastView){$('town').setAttribute('viewBox',value);lastView=value;}
  }
  function render(dt,snap=false){
    if(stopped)return;
    const s=getState(chapter,time),c=chapters[chapter],key=chapter+':'+s.stepIndex;
    if(lastChapter!==chapter){
      root.querySelector('.sg-sidebar').dataset.stepCount=c.steps.length;
      $('chapter-category').textContent=c.category;$('chapter-number').textContent=String(chapter+1).padStart(2,'0')+' / 06';$('chapter-title').textContent=c.title;$('chapter-premise').textContent=c.premise;$('chapter-benefit').textContent=c.benefit;$('chapter-note').textContent=c.note;
      $('steps-label').textContent=chapter===0?'YOUR PATH THROUGH THE TOWN':'THIS CHAPTER’S STEPS';buildSteps(c);
      navButtons.forEach((b,i)=>{b.setAttribute('aria-current',i===chapter?'step':'false');b.style.setProperty('--progress',0);});lastChapter=chapter;
    }
    if(lastKey!==key){
      renderOperations(s);
      $('scene-caption').textContent=s.step.narration;$('callout-title').textContent=s.step.callout;$('callout-sub').textContent=s.step.term;
      $('callout-icon').textContent=s.phase==='missing'?'!':['approved','delivered','events'].includes(s.phase)?'✓':'◇';$('scene-callout').classList.toggle('is-amber',s.phase==='missing');
      $('step-counter').textContent=(s.stepIndex+1)+' / '+c.steps.length;$('caption-position').textContent=String(chapter+1).padStart(2,'0')+'.'+String(s.stepIndex+1).padStart(2,'0');
      stepButtons.forEach((b,i)=>{b.setAttribute('aria-current',i===s.stepIndex?'step':'false');b.classList.toggle('is-done',i<s.stepIndex);b.querySelector('.sg-step-index').textContent=i<s.stepIndex?'✓':i+1;});
      if(mobile.matches){const b=stepButtons[s.stepIndex],strip=$('chapter-steps');strip.scrollTo({left:Math.max(0,b.parentElement.offsetLeft-strip.offsetLeft-8),behavior:reduced.matches?'instant':'smooth'});}
      lastKey=key;
    }
    const benefitBeat=time>=c.duration-2.5;
    const caption=benefitBeat?c.benefit:s.step.narration;
    if($('scene-caption').textContent!==caption)$('scene-caption').textContent=caption;
    $('caption-label').textContent=benefitBeat?'WHAT THIS MAKES POSSIBLE':'NOW IN THE TOWN';
    $('era').textContent=chapter===1&&s.onboardingStatus!=='APPROVED'?'Quiet Square · Growing trust':c.era;
    const approvedCount=(s.onboardingStatus==='APPROVED'?1:0)+['florist','coffee','books','gym'].filter(id=>s.businesses[id]).length;
    trust.setAttribute('aria-label',approvedCount+' approved businesses');[...trust.children].forEach((bar,i)=>bar.classList.toggle('is-approved',i<approvedCount));
    $('camera-button').setAttribute('aria-label',wideMode?'Return to the automatic close-up camera':'Show the whole town');
    navButtons[chapter].style.setProperty('--progress',s.progress.toFixed(4));
    const now=clock(startTimes[chapter]+time)+' / '+clock(total);if($('loop-time').textContent!==now)$('loop-time').textContent=now;
    $('intro-cover').hidden=chapter!==0||mobile.matches;$('scene-ledger').hidden=chapter<2||chapter>4;
    const money=SGTimeline.money;
    for(const [id,value] of Object.entries({'ledger-balance':s.balanceCents,'ledger-orders':s.checkoutCents,'ledger-transit':s.inTransitCents,'ledger-received':s.receivedCents,'finale-funded':s.fundedCents,'finale-paid':s.receivedCents})){
      const text=money(value);if($(id).textContent!==text)$(id).textContent=text;
    }
    $('ledger-allocation').textContent='Allocated: '+money(s.fundedCents);
    $('ledger-status').textContent='Limited DDA · Remaining';
    const railNames={rtp:['RTP','Real-time*'],ach:['ACH','1–2 business days*'],wire:['Wire','Same business day*']};
    const rails=s.transfers.map(p=>`<span><i class="sg-rail-dot sg-${p.id}"></i><b>${railNames[p.id][0]} ${money(p.cents)}</b><em>${p.status==='received'?'✓ Received':p.status==='in-transit'?'In transit':'Scheduled'} · ${railNames[p.id][1]}</em></span>`).join('');
    if($('rail-legend').innerHTML!==rails)$('rail-legend').innerHTML=rails;
    $('rail-legend').hidden=chapter!==4;$('event-board').hidden=chapter!==5||s.phase!=='events';$('finale-card').hidden=chapter!==5||s.phase!=='recap';$('scene-callout').hidden=chapter===5&&['events','recap'].includes(s.phase);
    $('dusk-overlay').style.opacity=s.dusk;
    scene.draw(s,reduced.matches);moveCamera(s,dt,snap);
  }
  function frame(now){
    if(stopped)return;
    const dt=lastFrame===null?0:Math.min((now-lastFrame)/1000,.25);lastFrame=now;if(!isPaused()&&!document.hidden){const next=advance(chapter,time,dt);chapter=next.chapter;time=next.time;}render(document.hidden?0:dt);raf=requestAnimationFrame(frame);
  }
  const onVisibility=()=>{lastFrame=null;};
  const onReduced=()=>render(0,true);
  const onMobile=()=>render(0,true);
  document.addEventListener('visibilitychange',onVisibility);
  reduced.addEventListener('change',onReduced);mobile.addEventListener('change',onMobile);
  render(0,true);updatePlayback();raf=requestAnimationFrame(frame);

  return () => {
    stopped=true;
    cancelAnimationFrame(raf);
    clearTimeout(idleTimer);
    document.removeEventListener('visibilitychange',onVisibility);
    document.removeEventListener('fullscreenchange',onFullscreenChange);
    document.removeEventListener('keydown',onKeydown);
    reduced.removeEventListener('change',onReduced);
    mobile.removeEventListener('change',onMobile);
    if($('chapter-detail')?.open)$('chapter-detail').close();
    if($('story-detail')?.open)$('story-detail').close();
    $('story-detail').removeEventListener('click',onStoryBackdropClick);
    root.classList.remove('sg-paused');
  };
}
