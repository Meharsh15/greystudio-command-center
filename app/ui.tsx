'use client';

import {useEffect,useRef,useState,type ReactNode} from 'react';

type Dash = any;

const money=(n:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(n)||0);
const today=()=>new Date().toISOString().slice(0,10);
const timeLabel=(v:string)=>new Date(v).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});

const shortcuts=[
  ['MT','Money Transfer'],['PS','Passport'],['X/P','Xerox / Print'],['FR','Frames'],['PH','Photo'],
  ['ST','Stationery'],['GD','Design'],['WEB','Website'],['VID','Video'],['OT','Other']
] as const;

const fallback={
  today:today(),
  todayCash:{income:0,expense:0,net:0},
  month:{income:0,expense:0,net:0,survival:28300,remaining:28300,daysLeft:0,runrate:0},
  debts:{total:675000,paid:0,remaining:675000,monthlyTarget:56250,items:[]},
  balances:{cashCounter:null,bank:null,aeps:null,closingDate:null},
  closing:[],transactions:[],tasks:[],clients:[],shop:[],
  plan:{
    survivalMonthly:28300,
    expenses:{shopRent:6800,shopSupplies:3000,groceries:5000,fuel:3500,emi1:2900,emi2:4100,emi3:3000,emiTotal:10000},
    incomeReality:{jobSalary:36000,cooperativeDeduction:26166,bankCreditAfterDeduction:10474,usableJobIncome:0,salaryBasedGap:17826},
    targets:{counterNetMin:18000,counterNetMax:22000,studioCashMin:75000,studioCashMax:85000,debtTotal:675000,debtMonthly:56250,profitMin:200000,profitMax:500000},
    goldRateSite:{visitorsMin:4000,visitorsMax:6000},
    roadmap:{
      defense:'Counter services protect rent, supplies and essentials',
      growth:'High-ticket B2B website, branding and commercial video work',
      monetization:'Gold-rate website via display ads, affiliate partnerships and local jeweler sponsorships'
    }
  }
};

export default function CommandCenter(){
  const [data,setData]=useState<Dash|null>(null);
  const [tab,setTab]=useState('Home');
  const [workTab,setWorkTab]=useState<'Tasks'|'Clients'>('Tasks');
  const [refreshing,setRefreshing]=useState(false);

  const load=async()=>{
    try{
      setRefreshing(true);
      const r=await fetch('/api/dashboard',{cache:'no-store'});
      if(r.status===401){location.href='/login';return;}
      if(r.ok)setData(await r.json());
    }finally{setRefreshing(false)}
  };

  useEffect(()=>{void load()},[]);
  const d=data??fallback;
  const go=(next:string)=>{setTab(next);window.scrollTo({top:0,behavior:'smooth'});};
  const lock=async()=>{await fetch('/api/logout',{method:'POST'});location.href='/login';};
  const desktopNav=['Home','Add','Closing','Work','Plan','Debt','Shop','AI'];

  return <div className="appShell">
    <aside className="desktopSidebar">
      <Brand/>
      <div className="sideSectionLabel">COMMAND</div>
      <nav className="sideNav">{desktopNav.map(x=><NavButton key={x} label={x} active={tab===x} onClick={()=>go(x)}/>)}</nav>
      <div className="sideBottom"><div className="syncDot"><span className={refreshing?'pulseDot':''}/>{refreshing?'Updating…':'Live data'}</div><button className="sideLock" onClick={lock}>Lock</button></div>
    </aside>

    <main className="appMain">
      <header className="appHeader">
        <div><div className="appKicker">GREYSTUDIO</div><h1>{tab==='Add'?'Quick Add':tab==='Closing'?'Daily Closing':tab==='Work'?workTab:tab}</h1><div className="appDate">{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short'})}</div></div>
        <div className="headerActions"><button className="refreshButton" onClick={()=>void load()} aria-label="Refresh">↻</button><button className="headerLock" onClick={lock}>Lock</button></div>
      </header>

      {tab==='Home'&&<Home d={d} go={go}/>}
      {tab==='Add'&&<Quick d={d} reload={load}/>}
      {tab==='Closing'&&<Closing d={d} reload={load}/>}
      {tab==='Work'&&<Work d={d} reload={load} section={workTab} setSection={setWorkTab}/>}
      {tab==='Plan'&&<Plan d={d}/>}
      {tab==='Debt'&&<Debt d={d} reload={load}/>}
      {tab==='Shop'&&<Shop d={d} reload={load}/>}
      {tab==='AI'&&<Advisor/>}
      {tab==='More'&&<More go={go}/>}
    </main>

    <nav className="mobileBar">
      {['Home','Add','Closing','Work','More'].map(x=><button key={x} className={tab===x?'active':''} onClick={()=>go(x)}><span className="mobileIcon">{x==='Home'?'⌂':x==='Add'?'+':x==='Closing'?'□':x==='Work'?'✓':'⋯'}</span><span>{x}</span></button>)}
    </nav>
  </div>;
}

function Brand(){return <div className="brandBlock"><div className="brandMark">G</div><div><div className="brandName">GreyStudio</div><div className="brandSub">Command Center</div></div></div>}
function NavButton({label,active,onClick}:{label:string;active:boolean;onClick:()=>void}){return <button className={'sideNavButton '+(active?'active':'')} onClick={onClick}><span className="navBullet"/>{label}</button>}

function Home({d,go}:{d:Dash;go:(x:string)=>void}){
  const debtPct=d.debts.total?Math.min(100,d.debts.paid/d.debts.total*100):0;
  const baselinePct=d.month.survival?Math.min(100,Math.max(0,d.month.net/d.month.survival*100)):0;
  const tracked=(d.balances.cashCounter??0)+(d.balances.bank??0)+(d.balances.aeps??0);

  return <div className="screen">
    <section className="welcomeRow">
      <div><div className="eyebrow">TODAY AT A GLANCE</div><h2>Run the shop. Build the agency.</h2><p className="muted">Capture cash quickly, check the real numbers and keep the next important action visible.</p></div>
      <button className="heroAction" onClick={()=>go('Add')}>＋ New entry</button>
    </section>

    <section className="cashStrip">
      <Metric label="Today in" value={money(d.todayCash.income)} tone="good"/>
      <Metric label="Today out" value={money(d.todayCash.expense)} tone="bad"/>
      <Metric label="Today net" value={money(d.todayCash.net)} tone={d.todayCash.net>=0?'good':'bad'}/>
      <Metric label="This month" value={money(d.month.net)} tone={d.month.net>=0?'good':'bad'}/>
    </section>

    <section className="balanceStrip">
      <BalanceMini label="Cash Counter" value={d.balances.cashCounter} onClick={()=>go('Closing')}/>
      <BalanceMini label="Bank" value={d.balances.bank} onClick={()=>go('Closing')}/>
      <BalanceMini label="AEPS" value={d.balances.aeps} onClick={()=>go('Closing')}/>
      <div className="balanceMini total"><span>Tracked total</span><strong>{tracked?money(tracked):'—'}</strong><small>{d.balances.closingDate?'Closing '+d.balances.closingDate:'Add your first closing'}</small></div>
    </section>

    <section className="gridMain">
      <div className="stack">
        <Panel title="Survival plan" action="Plan" onAction={()=>go('Plan')}>
          <div className="bigProgress"><div><strong>{money(d.month.net)}</strong><span> / {money(d.month.survival)}</span></div><span>{Math.round(baselinePct)}%</span></div>
          <div className="progressTrack"><span style={{width:baselinePct+'%'}}/></div>
          <div className="hintLine">{d.month.remaining>0?money(d.month.remaining)+' still needed':'Baseline covered'} · {d.month.daysLeft} days left · need {money(d.month.runrate)}/day</div>
        </Panel>
        <Panel title="Recent money" action="Quick add" onAction={()=>go('Add')}>
          <div className="activityList">{d.transactions.slice(0,8).map((t:any)=><div className="activity" key={String(t.id)}><div><strong>{t.reason||t.category||'Cash movement'}</strong><small>{timeLabel(t.occurred_at)} · {t.raw}</small></div><b className={t.direction==='in'?'good':'bad'}>{t.direction==='in'?'+':'−'}{money(t.amount)}</b></div>)}{!d.transactions.length&&<Empty text="No cash entries yet. Your first entry takes seconds."/>}</div>
        </Panel>
      </div>
      <div className="stack">
        <Panel title="Debt" action="Open" onAction={()=>go('Debt')}>
          <div className="debtHero"><div><small>Remaining</small><strong>{money(d.debts.remaining)}</strong></div><div className="debtRing"><span>{Math.round(debtPct)}%</span></div></div>
          <div className="progressTrack"><span style={{width:debtPct+'%'}}/></div>
          <div className="hintLine">{money(d.debts.monthlyTarget)}/month target · 12-month plan</div>
        </Panel>
        <Panel title="Work queue" action="Open" onAction={()=>go('Work')}>
          {d.tasks.filter((x:any)=>x.status!=='done').slice(0,5).map((t:any)=><div className="compactTask" key={String(t.id)}><span className={'priorityDot '+t.priority}/><div><strong>{t.title}</strong><small>{t.area} · {t.due_date||'No due date'}</small></div></div>)}
          {!d.tasks.filter((x:any)=>x.status!=='done').length&&<Empty text="No open tasks."/>}
        </Panel>
      </div>
    </section>

    <section className="quickLinks">
      <button onClick={()=>go('Add')}><strong>＋</strong><span>Cash entry</span><small>Native keypad</small></button>
      <button onClick={()=>go('Closing')}><strong>□</strong><span>Daily closing</span><small>Counter · Bank · AEPS</small></button>
      <button onClick={()=>go('Work')}><strong>✓</strong><span>Work queue</span><small>Tasks & clients</small></button>
      <button onClick={()=>go('AI')}><strong>✦</strong><span>Advisor</span><small>Numbers & decisions</small></button>
    </section>
  </div>;
}

function Metric({label,value,tone}:{label:string;value:string;tone?:string}){return <div className="metric"><span>{label}</span><strong className={tone}>{value}</strong></div>}
function BalanceMini({label,value,onClick}:{label:string;value:number|null;onClick:()=>void}){return <button className="balanceMini" onClick={onClick}><span>{label}</span><strong>{value==null?'—':money(value)}</strong><small>Daily closing</small></button>}
function Panel({title,action,onAction,children}:{title:string;action?:string;onAction?:()=>void;children:ReactNode}){return <section className="panel"><div className="panelHead"><h3>{title}</h3>{action&&<button onClick={onAction}>{action} →</button>}</div>{children}</section>}
function Empty({text}:{text:string}){return <div className="empty">{text}</div>}

function Quick({d,reload}:{d:Dash;reload:()=>void}){
  const [amount,setAmount]=useState('');
  const [direction,setDirection]=useState<'in'|'out'|null>(null);
  const [reason,setReason]=useState('');
  const [status,setStatus]=useState('');
  const [saving,setSaving]=useState(false);
  const amountRef=useRef<HTMLInputElement>(null);
  const reasonRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{amountRef.current?.focus()},[]);

  const focusReason=()=>setTimeout(()=>reasonRef.current?.focus(),30);
  const choose=(dir:'in'|'out')=>{
    if(!amount||Number(amount)<=0){setStatus('Enter amount first');amountRef.current?.focus();return}
    setDirection(dir);setStatus('');focusReason();
  };

  const changeAmount=(raw:string)=>{
    const q=raw.trim().match(/^([+-]?\\d+(?:\\.\\d+)?)\\s*([vVpP+-])\\s*(.*)$/);
    if(q){
      const value=q[1].replace(/^\\+/,'');
      const dir=(q[2].toLowerCase()==='v'||q[2]==='+')?'in':'out';
      setAmount(value);setDirection(dir);setReason(q[3]?.trim()||'');setStatus('');focusReason();return;
    }
    const clean=raw.replace(/[^0-9.]/g,'');
    const parts=clean.split('.');
    setAmount(parts.length>1?parts[0]+'.'+parts.slice(1).join(''):clean);setStatus('');
  };

  const submit=async()=>{
    if(!amount||Number(amount)<=0){setStatus('Enter an amount');amountRef.current?.focus();return}
    if(!direction){setStatus('Choose RECEIVE (+) or PAID (-)');return}
    setSaving(true);setStatus('');
    try{
      const input=amount+(direction==='in'?'+':'-')+(reason.trim()?' '+reason.trim():'');
      const r=await fetch('/api/transactions',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({input})});
      const j=await r.json();
      if(!r.ok)throw new Error(j.error||'Could not save');
      setStatus('✓ Saved '+money(Number(amount))+(reason.trim()?' · '+reason.trim():''));
      setAmount('');setDirection(null);setReason('');void reload();setTimeout(()=>amountRef.current?.focus(),40);
    }catch(e){setStatus(e instanceof Error?e.message:'Could not save')}
    finally{setSaving(false)}
  };

  return <div className="screen">
    <section className="entryLayout">
      <div className="entryCard">
        <div className="entryTop"><div><div className="eyebrow">COUNTER MODE</div><h2>Fast cash entry</h2><p className="muted">The amount field uses your phone's normal number keyboard. On desktop, use the keyboard.</p></div><div className="codeBadge">100+ · 100-<br/>100v · 100p</div></div>

        <label className="amountLabel">AMOUNT</label>
        <div className="amountBox"><span>₹</span><input ref={amountRef} type="text" inputMode="decimal" enterKeyHint="next" autoComplete="off" value={amount} onChange={e=>changeAmount(e.target.value)} onKeyDown={e=>{if(e.key==='+'){e.preventDefault();choose('in')}else if(e.key==='-'){e.preventDefault();choose('out')}else if(e.key==='Enter'&&direction){e.preventDefault();submit()}}} placeholder="0" aria-label="Amount"/></div>

        {!direction&&<div className="directionGrid"><button className="receiveButton" onClick={()=>choose('in')}><strong>＋ RECEIVE</strong><span>Cash In · v</span></button><button className="paidButton" onClick={()=>choose('out')}><strong>− PAID</strong><span>Cash Out · p</span></button></div>}

        {direction&&<div className="reasonBox">
          <div className="reasonHeader"><span>{direction==='in'?'RECEIVED FROM':'PAID FOR'}</span><button onClick={()=>{setDirection(null);setReason('');setTimeout(()=>amountRef.current?.focus(),20)}}>Change +/−</button></div>
          <input ref={reasonRef} className="reasonInputBig" type="text" inputMode="text" enterKeyHint="done" value={reason} onChange={e=>setReason(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();submit()}}} placeholder="Type name / service or use a shortcut" autoComplete="off"/>
          <div className="shortcutLabel">SHORTCUTS</div>
          <div className="shortcutChips">{shortcuts.map(([code,label])=><button key={code} onClick={()=>{setReason(label);reasonRef.current?.focus()}} className={reason===label?'selected':''}><b>{code}</b><span>{label}</span></button>)}</div>
          <div className="entryActions"><button className="saveButton" onClick={submit} disabled={saving}>{saving?'Saving…':'Save Entry ↵'}</button><button className="clearButton" onClick={()=>{setAmount('');setDirection(null);setReason('');setStatus('');amountRef.current?.focus()}}>Clear</button></div>
          <div className="keyboardHint">Phone: native text keyboard · Desktop: Enter to save · Reason optional</div>
        </div>}

        {!direction&&<div className="entryHint">Desktop: type amount and press + or −. Phone: the number keypad opens from the amount field. After +/−, your normal text keyboard opens for the name/service.</div>}
        {status&&<div className={status.startsWith('✓')?'saveStatus':'errorStatus'}>{status}</div>}
      </div>

      <div className="sideEntryPanel">
        <Panel title="Quick examples"><div className="example"><b>20+</b><span>received, no reason</span></div><div className="example"><b>100v PS</b><span>passport received</span></div><div className="example"><b>150p</b><span>paid, no reason</span></div><div className="example"><b>250- paper</b><span>expense with note</span></div></Panel>
        <Panel title="Today"><Metric label="Received" value={money(d.todayCash.income)} tone="good"/><Metric label="Paid" value={money(d.todayCash.expense)} tone="bad"/><Metric label="Net" value={money(d.todayCash.net)} tone={d.todayCash.net>=0?'good':'bad'}/></Panel>
      </div>
    </section>
  </div>;
}

function Closing({d,reload}:{d:Dash;reload:()=>void}){
  const latest=d.closing?.[0];const todayRecord=latest?.closing_date===today()?latest:null;
  const [x,setX]=useState({date:today(),cashCounter:todayRecord?String(todayRecord.cash_counter):'',bank:todayRecord?String(todayRecord.bank_balance):'',aeps:todayRecord?String(todayRecord.aeps_balance):'',notes:todayRecord?.notes||''});
  const [status,setStatus]=useState('');
  const save=async()=>{setStatus('');const r=await fetch('/api/closing',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(x)});const j=await r.json();if(r.ok){setStatus('✓ Closing saved');reload()}else setStatus(j.error||'Could not save')};
  return <div className="screen"><section className="closingHeader"><div><div className="eyebrow">END OF DAY</div><h2>Count everything before you close.</h2><p className="muted">Balance snapshot only: Cash Counter, Bank and AEPS stay separate from sales.</p></div><span className="statusPill">{d.balances.closingDate?'Last: '+d.balances.closingDate:'No closing yet'}</span></section><div className="closingGrid"><section className="closingCard"><div className="closingDate"><label>Closing date</label><input type="date" value={x.date} onChange={e=>setX({...x,date:e.target.value})}/></div><div className="closingInputs"><BalanceInput title="Cash Counter" value={x.cashCounter} set={v=>setX({...x,cashCounter:v})}/><BalanceInput title="Bank Account" value={x.bank} set={v=>setX({...x,bank:v})}/><BalanceInput title="AEPS Account" value={x.aeps} set={v=>setX({...x,aeps:v})}/></div><div className="field"><label>Closing note</label><textarea value={x.notes} onChange={e=>setX({...x,notes:e.target.value})} placeholder="Counted / checked / any difference…"/></div><button className="wideSave" onClick={save}>Save daily closing</button>{status&&<div className={status.startsWith('✓')?'saveStatus':'errorStatus'}>{status}</div>}</section><Panel title="Closing history"><div className="historyList">{(d.closing||[]).slice(0,20).map((r:any)=><div className="historyRow" key={String(r.id)}><b>{r.closing_date}</b><span>{money(r.cash_counter)}</span><span>{money(r.bank_balance)}</span><span>{money(r.aeps_balance)}</span></div>)}</div></Panel></div></div>;
}
function BalanceInput({title,value,set}:{title:string;value:string;set:(v:string)=>void}){return <div className="balanceInput"><label>{title}</label><div><span>₹</span><input type="number" inputMode="decimal" min="0" value={value} onChange={e=>set(e.target.value)} placeholder="0"/></div></div>}

function Work({d,reload,section,setSection}:{d:Dash;reload:()=>void;section:'Tasks'|'Clients';setSection:(x:'Tasks'|'Clients')=>void}){return <div className="screen"><div className="segmented"><button className={section==='Tasks'?'active':''} onClick={()=>setSection('Tasks')}>Tasks</button><button className={section==='Clients'?'active':''} onClick={()=>setSection('Clients')}>Clients</button></div>{section==='Tasks'?<Tasks d={d} reload={reload}/>:<Clients d={d} reload={reload}/>}</div>}

function Tasks({d,reload}:{d:Dash;reload:()=>void}){
 const [x,setX]=useState({title:'',priority:'high',due_date:'',area:'business'});
 const add=async()=>{if(!x.title.trim())return;await fetch('/api/tasks',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(x)});setX({...x,title:''});reload()};
 const done=async(id:number)=>{await fetch('/api/tasks',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id,status:'done'})});reload()};
 return <div className="workGrid"><section className="panel formPanel"><div className="panelHead"><h3>New task</h3></div><div className="formStack"><Field label="What needs doing?" value={x.title} set={v=>setX({...x,title:v})}/><div className="formSplit"><SelectField label="Priority" value={x.priority} set={v=>setX({...x,priority:v})} options={['high','medium','low']}/><SelectField label="Area" value={x.area} set={v=>setX({...x,area:v})} options={['business','shop','finance','life']}/></div><Field label="Due date" value={x.due_date} set={v=>setX({...x,due_date:v})} type="date"/></div><button className="wideSave" onClick={add}>Add task</button></section><section className="panel"><div className="panelHead"><h3>Work queue</h3><span className="countPill">{d.tasks.filter((t:any)=>t.status!=='done').length} open</span></div>{d.tasks.map((t:any)=><div className="workRow" key={String(t.id)}><div><strong>{t.title}</strong><small>{t.area} · {t.priority} · {t.due_date||'No due date'}</small></div>{t.status==='done'?<span className="donePill">Done</span>:<button className="smallAction" onClick={()=>done(Number(t.id))}>Done</button>}</div>)}</section></div>;
}

function Clients({d,reload}:{d:Dash;reload:()=>void}){
 const [x,setX]=useState({name:'',service:'Website / Branding',value:'',status:'lead',next_action:''});
 const add=async()=>{if(!x.name.trim())return;await fetch('/api/clients',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(x)});setX({...x,name:'',value:'',next_action:''});reload()};
 return <div className="workGrid"><section className="panel formPanel"><div className="panelHead"><h3>New prospect</h3></div><div className="formStack"><Field label="Client / business" value={x.name} set={v=>setX({...x,name:v})}/><Field label="Service" value={x.service} set={v=>setX({...x,service:v})}/><Field label="Potential value" value={x.value} set={v=>setX({...x,value:v})} type="number"/><SelectField label="Stage" value={x.status} set={v=>setX({...x,status:v})} options={['lead','contacted','proposal','won','lost']}/><Field label="Next action" value={x.next_action} set={v=>setX({...x,next_action:v})}/></div><button className="wideSave" onClick={add}>Add prospect</button></section><section className="panel"><div className="panelHead"><h3>Agency pipeline</h3></div>{d.clients.map((c:any)=><div className="workRow" key={String(c.id)}><div><strong>{c.name}</strong><small>{c.service||'Service TBD'} · {c.status}</small></div><b>{money(c.value)}</b></div>)}{!d.clients.length&&<Empty text="No prospects yet."/>}</section></div>;
}

function Plan({d}:{d:Dash}){
 const p=d.plan;
 return <div className="screen"><section className="planTop"><div><div className="eyebrow">YOUR OPERATING PLAN</div><h2>Defend cash. Clear debt. Build the agency.</h2><p className="muted">Your supplied planning numbers, kept visible and separate from actual recorded cash.</p></div><div className="targetBox"><small>Long-term profit</small><strong>{money(p.targets.profitMin)}–{money(p.targets.profitMax)}</strong><span>per month</span></div></section><div className="planCards"><Metric label="Survival / month" value={money(p.survivalMonthly)}/><Metric label="Debt target" value={money(p.targets.debtTotal)}/><Metric label="Debt pace" value={money(p.targets.debtMonthly)}/><Metric label="Studio cash target" value={money(p.targets.studioCashMin)+'–'+money(p.targets.studioCashMax)}/></div><div className="planGrid"><Panel title="Monthly essential outflow"><PlanRow a="Shop rent" v={p.expenses.shopRent}/><PlanRow a="Shop supplies" v={p.expenses.shopSupplies}/><PlanRow a="Groceries" v={p.expenses.groceries}/><PlanRow a="Fuel" v={p.expenses.fuel}/><PlanRow a="EMI 1" v={p.expenses.emi1}/><PlanRow a="EMI 2" v={p.expenses.emi2}/><PlanRow a="EMI 3" v={p.expenses.emi3}/><div className="planTotal"><span>Total</span><strong>{money(p.survivalMonthly)}</strong></div></Panel><Panel title="Income reality"><PlanRow a="Job salary" v={p.incomeReality.jobSalary}/><PlanRow a="Co-op deduction" v={p.incomeReality.cooperativeDeduction}/><PlanRow a="Bank credit after deduction" v={p.incomeReality.bankCreditAfterDeduction}/><PlanRow a="Usable job income in plan" v={p.incomeReality.usableJobIncome}/><div className="noteBox">Salary-based gap reference: <b>{money(p.incomeReality.salaryBasedGap)}</b>.</div></Panel><Panel title="Growth roadmap"><Road num="01" title="Defense" text={p.roadmap.defense}/><Road num="02" title="Growth engine" text={p.roadmap.growth}/><Road num="03" title="Digital monetization" text={p.roadmap.monetization}/><div className="noteBox">Gold-rate site planning traffic: <b>{p.goldRateSite.visitorsMin.toLocaleString('en-IN')}–{p.goldRateSite.visitorsMax.toLocaleString('en-IN')}</b> monthly visitors.</div></Panel><Panel title="Targets"><PlanRowRange a="Walk-in counter net / month" min={p.targets.counterNetMin} max={p.targets.counterNetMax}/><PlanRowRange a="Studio cash / month" min={p.targets.studioCashMin} max={p.targets.studioCashMax}/><PlanRow a="Survival + debt arithmetic" v={p.survivalMonthly+p.targets.debtMonthly}/><PlanRow a="Agency profit floor" v={p.targets.profitMin}/><PlanRow a="Agency profit stretch" v={p.targets.profitMax}/></Panel></div></div>;
}
function PlanRow({a,v}:{a:string;v:number}){return <div className="planRow"><span>{a}</span><strong>{money(v)}</strong></div>}
function PlanRowRange({a,min,max}:{a:string;min:number;max:number}){return <div className="planRow"><span>{a}</span><strong>{money(min)}–{money(max)}</strong></div>}
function Road({num,title,text}:{num:string;title:string;text:string}){return <div className="road"><b>{num}</b><div><strong>{title}</strong><p>{text}</p></div></div>}

function Debt({d,reload}:{d:Dash;reload:()=>void}){return <div className="screen"><section className="planTop"><div><div className="eyebrow">DEBT CONTROL</div><h2>{money(d.debts.remaining)} remaining</h2><p className="muted">Planning pace: {money(d.debts.monthlyTarget)} principal per month.</p></div><div className="targetBox"><small>Paid</small><strong>{money(d.debts.paid)}</strong><span>of {money(d.debts.total)}</span></div></section><div className="debtList">{d.debts.items.map((x:any)=><DebtRow key={String(x.id)} x={x} reload={reload}/>)}</div></div>}
function DebtRow({x,reload}:{x:any;reload:()=>void}){const [p,setP]=useState(String(x.paid));const save=async()=>{await fetch('/api/debts',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id:Number(x.id),paid:p})});reload()};return <div className="panel debtRow"><div><strong>{x.name}</strong><small>{money(x.principal)} principal · deadline {x.deadline||'—'}</small></div><div className="debtEdit"><input value={p} inputMode="decimal" onChange={e=>setP(e.target.value)}/><button className="smallAction" onClick={save}>Update paid</button></div></div>}

function Shop({d,reload}:{d:Dash;reload:()=>void}){const [x,setX]=useState({date:today(),footfall:'',notes:''});const save=async()=>{await fetch('/api/shop',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(x)});reload()};return <div className="screen"><section className="workGrid"><section className="panel formPanel"><div className="panelHead"><h3>Daily shop pulse</h3></div><div className="formStack"><Field label="Date" value={x.date} set={v=>setX({...x,date:v})} type="date"/><Field label="Footfall" value={x.footfall} set={v=>setX({...x,footfall:v})} type="number"/><div className="field"><label>Notes</label><textarea value={x.notes} onChange={e=>setX({...x,notes:e.target.value})}/></div></div><button className="wideSave" onClick={save}>Save shop day</button></section><section className="panel"><div className="panelHead"><h3>Recent shop days</h3></div>{d.shop.map((s:any)=><div className="workRow" key={String(s.id)}><div><strong>{s.date}</strong><small>{s.notes||'No notes'}</small></div><b>{s.footfall}</b></div>)}</section></section></div>}

function Advisor(){const [q,setQ]=useState('');const [answer,setAnswer]=useState('');const [busy,setBusy]=useState(false);const ask=async()=>{if(!q.trim())return;setBusy(true);try{const r=await fetch('/api/ai',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:q})});const j=await r.json();setAnswer(j.answer||j.error||'No response')}finally{setBusy(false)}};return <div className="screen"><section className="aiGrid"><section className="panel"><div className="eyebrow">AI ADVISOR</div><h2>Ask about the next move.</h2><p className="muted">Cash flow, debt pace, pricing, client acquisition, shop priorities or the agency plan.</p><textarea className="aiQuestion" value={q} onChange={e=>setQ(e.target.value)} placeholder="What should I focus on tomorrow?"/><button className="wideSave" onClick={ask} disabled={busy}>{busy?'Thinking…':'Ask advisor'}</button></section><section className="panel"><div className="panelHead"><h3>Advisor response</h3><span className="countPill">Context aware</span></div><div className="aiAnswer">{answer||'Your response will appear here.'}</div></section></section></div>}

function More({go}:{go:(x:string)=>void}){return <div className="screen"><section className="moreGrid">{[['Plan','Your complete financial plan'],['Debt','Repayment control'],['Shop','Footfall and shop pulse'],['AI','Ask the advisor']].map(([title,desc])=><button key={title} onClick={()=>go(title)} className="moreCard"><strong>{title}</strong><span>{desc}</span><b>Open →</b></button>)}</section></div>}

function Field({label,value,set,type='text'}:{label:string;value:string;set:(x:string)=>void;type?:string}){return <div className="field"><label>{label}</label><input type={type} value={value} onChange={e=>set(e.target.value)}/></div>}
function SelectField({label,value,set,options}:{label:string;value:string;set:(x:string)=>void;options:string[]}){return <div className="field"><label>{label}</label><select value={value} onChange={e=>set(e.target.value)}>{options.map(o=><option key={o}>{o}</option>)}</select></div>}
