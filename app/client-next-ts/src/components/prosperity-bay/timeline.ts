/* Pure state derivation: stepping backward, jumping, and looping cannot leave old actors behind. */
// @ts-nocheck
import SGContent from './content';

const SGTimeline = ((content) => {
  const chapters=content.chapters;
  const total=chapters.reduce((n,c)=>n+c.duration,0);
  const clamp=n=>Math.max(0,Math.min(1,n));
  const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
  // Integer cents throughout. These fictional events are the only source of monetary state.
  const orders=[{id:'dropin',cents:150000,at:5},{id:'hosted',cents:250000,at:10},{id:'link',cents:450000,at:15}];
  const payouts=[{id:'rtp',cents:200000,depart:6,arrive:8},{id:'ach',cents:300000,depart:6,arrive:24},{id:'wire',cents:350000,depart:6,arrive:22}];
  const totalCents=orders.reduce((sum,o)=>sum+o.cents,0);
  const dollarFormat=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
  const money=cents=>dollarFormat.format(cents/100);
  function getState(chapter,time){
    chapter=Math.max(0,Math.min(chapters.length-1,Math.trunc(Number(chapter)||0)));
    const c=chapters[chapter];time=Math.max(0,Math.min(c.duration-0.0001,Number(time)||0));
    const stepIndex=c.steps.reduce((found,s,i)=>time>=s.at?i:found,0);
    const step=c.steps[stepIndex],stepTime=time-step.at;
    const stepDuration=(c.steps[stepIndex+1]?.at??c.duration)-step.at;
    const onboardingStatus=chapter===0?'NEW':chapter===1?['NEW','NEW','REVIEW_IN_PROGRESS','INFORMATION_REQUESTED','REVIEW_IN_PROGRESS','APPROVED'][stepIndex]:'APPROVED';
    const bakery=chapter>1||(chapter===1&&time>=30.5);
    const extraStarts={florist:6.5,coffee:7.3,books:8.1,gym:8.9};
    const businesses={bakery,florist:false,coffee:false,books:false,gym:false};
    if(chapter===5)for(const id in extraStarts)businesses[id]=time>=extraStarts[id];
    const funded=chapter>3||(chapter===3&&time>=33);
    const checkoutCents=orders.filter(o=>chapter>3||(chapter===3&&time>=o.at)).reduce((sum,o)=>sum+o.cents,0);
    const fundedCents=funded?totalCents:0;
    const transfers=payouts.map(p=>({...p,status:chapter>4||(chapter===4&&time>=p.arrive)?'received':chapter===4&&time>=p.depart?'in-transit':'scheduled'}));
    const debitedCents=transfers.filter(p=>p.status!=='scheduled').reduce((sum,p)=>sum+p.cents,0);
    const receivedCents=transfers.filter(p=>p.status==='received').reduce((sum,p)=>sum+p.cents,0);
    const balanceCents=fundedCents-debitedCents,inTransitCents=debitedCents-receivedCents;
    return {chapter,time,stepIndex,step,stepTime,stepDuration,progress:time/c.duration,stepProgress:stepTime/stepDuration,onboardingStatus,businesses,bakery,extraStarts,
      focus:step.focus,account:chapter>2||(chapter===2&&time>=1),homebank:chapter>=4,newAccounts:chapter===5&&time>=12,
      balance:balanceCents/100,checkoutTotal:checkoutCents/100,balanceCents,checkoutCents,fundedCents,debitedCents,receivedCents,inTransitCents,transfers,
      visitors:chapter===5&&time>=18,phase:step.key,dusk:chapter===5&&time>=33?ease((time-33)/2):chapter===0?1-ease(time/2):0,
      bankActive:chapter>0||time>7};
  }
  function advance(chapter,time,delta){let next=(chapters.slice(0,chapter).reduce((n,c)=>n+c.duration,0)+time+Math.max(0,delta))%total;for(let i=0;i<chapters.length;i++){if(next<chapters[i].duration)return {chapter:i,time:next};next-=chapters[i].duration;}return {chapter:0,time:0};}
  return {getState,advance,total,clamp,ease,orders,payouts,totalCents,money};
})(SGContent);

export default SGTimeline;
