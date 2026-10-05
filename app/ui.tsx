'use client';
import {useEffect,useState} from 'react';

type Dash=any;
const money=(n:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(n)||0);
const today=()=>new Date().toISOString().slice(0,10);

export default function CommandCenter(){
 const [d,setD]=useState<Dash|null>(null);const [tab,setTab]=useState('Home');const [quick,setQuick]=useState('');const [message,setMessage]=useState('');const [ai,setAi]=useState('');const [busy,setBusy]=useState(false);
 const load=async()=>{const r=await fetch('/api/dashboard',{cache:'no-store'});if(r.status===401){location.href='/login';return;}if(r.ok)setD(await r.json());};
 useEffect(()=>{load()},[]);
 const log=async()=>{if(!quick.trim())return;const r=await fetch('/api/transactions',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({input:quick})});const j=await r.json();setMessage(r.ok?'Saved '+money(j.transaction.amount)+' '+(j.transaction.direction==='in'?'in':'out')+(j.transaction.reason?' · '+j.transaction.reason:''):j.error||'Could not save');if(r.ok){setQuick('');load();}};
 const lock=async()=>{await fetch('/api/logout',{method:'POST'});location.href='/login';};
 if(!d)return <main className="main"><div className="card">Loading GreyStudio Command Center…</div></main>;
 const nav=['Home','Quick','Closing','Plan','Tasks','Clients','Debt','Shop','AI'];const debtPct=d.debts.total?Math.min(100,d.debts.paid/d.debts.total*100):0;const survivalPct=d.month.survival?Math.min(100,Math.max(0,d.month.net/d.month.survival*100)):0;
 return <div className="shell">
  <aside className="sidebar"><Brand/><nav className="nav">{nav.map(x=><button key={x} className={tab===x?'active':''} onClick={()=>setTab(x)}>{x}</button>)}</nav><div className="footerNote">Private · Turso-backed<br/>Daily control center</div></aside>
  <main className="main"><header className="topbar"><div><div className="pageTitle">GreyStudio</div><div className="pageSub">Finance · shop · agency · life</div></div><button className="btn secondary" onClick={lock}>Lock</button></header>
   {tab==='Home'&&<><section className="card hero"><div><div className="eyebrow">TODAY'S COMMAND PANEL</div><h1>Control the cash. Build the agency.</h1><p className="muted">Capture every cash movement, protect the survival baseline, push high-margin work and keep debt visible.</p></div><div className="quickHome"><button className="btn primary bigLaunch" onClick={()=>setTab('Quick')}>Open Counter Calculator</button><div className="quickHint">MT · PS · X/P · FR · PH · ST · GD · WEB · VID</div></div>{message&&<div className={message.startsWith('Saved')?'green':'red'} style={{marginTop:10,fontSize:12}}>{message}</div>}</section>
    <div className="grid kpiGrid"><K l="Month in" v={money(d.month.income)} h="cash received"/><K l="Month out" v={money(d.month.expense)} h="cash paid"/><K l="Net cash" v={money(d.month.net)} h="this month" c={d.month.net>=0?'green':'red'}/><K l="Survival gap" v={money(d.month.remaining)} h={d.month.daysLeft+' days left'} c={d.month.remaining?'yellow':'green'}/><K l="Debt left" v={money(d.debts.remaining)} h={Math.round(debtPct)+'% repaid'} c={d.debts.remaining?'yellow':'green'}/></div>
    <div className="grid three balanceGrid" style={{marginTop:14}}>
      <BalanceCard title="Cash Counter" value={d.balances.cashCounter} sub={d.balances.closingDate?'Closing · '+d.balances.closingDate:'No closing recorded'}/>
      <BalanceCard title="Bank Balance" value={d.balances.bank} sub={d.balances.closingDate?'Same closing · '+d.balances.closingDate:'No closing recorded'}/>
      <BalanceCard title="AEPS Balance" value={d.balances.aeps} sub={d.balances.closingDate?'Same closing · '+d.balances.closingDate:'No closing recorded'}/>
    </div>
    <div className="grid two" style={{marginTop:14}}><Progress title="Survival defense" pct={survivalPct} text={d.month.remaining?money(d.month.remaining)+' still needed this month':'Baseline covered for this month'} /><Progress title="Debt liquidation" pct={debtPct} text={money(d.debts.paid)+' paid · target '+money(d.debts.monthlyTarget)+'/month'}/></div>
    <div className="grid three" style={{marginTop:14}}><ListCard title="Recent cashflow"><List rows={d.transactions.slice(0,7).map((t:any)=>({a:t.reason||t.category||'Quick entry',b:new Date(t.occurred_at).toLocaleString('en-IN'),v:(t.direction==='in'?'+':'-')+money(t.amount),c:t.direction==='in'?'green':'red'}))}/></ListCard><ListCard title="Priority tasks"><List rows={d.tasks.filter((t:any)=>t.status!=='done').slice(0,6).map((t:any)=>({a:t.title,b:t.area+' · '+t.priority,v:t.due_date||'No date'}))}/></ListCard><ListCard title="Pipeline"><List rows={d.clients.slice(0,6).map((c:any)=>({a:c.name,b:(c.service||'Service TBD')+' · '+c.status,v:money(c.value)}))}/></ListCard></div>
   </>}
   {tab==='Quick'&&<Quick d={d} reload={load}/>}
   {tab==='Tasks'&&<Tasks d={d} reload={load}/>}
   {tab==='Clients'&&<Clients d={d} reload={load}/>}
   {tab==='Debt'&&<Debt d={d} reload={load}/>}
   {tab==='Shop'&&<Shop d={d} reload={load}/>}
   {tab==='AI'&&<Advisor value={ai} setValue={setAi} busy={busy} setBusy={setBusy}/>}
  </main><div className="mobileNav">{nav.map(x=><button key={x} className={tab===x?'active':''} onClick={()=>setTab(x)}>{x}</button>)}</div>
 </div>
}
function Brand(){return <div className="brand"><div className="brandMark">G</div><div><div className="brandTitle">GreyStudio</div><div className="brandSub">Command Center</div></div></div>}
function K({l,v,h,c}:{l:string;v:string;h:string;c?:string}){return <div className="card kpi"><div className="label">{l}</div><div className={'value '+(c||'')}>{v}</div><div className="hint">{h}</div></div>}
function Progress({title,pct,text}:{title:string;pct:number;text:string}){return <div className="card"><div className="sectionHead"><h3>{title}</h3><small>{Math.round(pct)}%</small></div><div className="bar"><span style={{width:pct+'%'}}/></div><p className="muted small">{text}</p></div>}
function ListCard({title,children}:{title:string;children:React.ReactNode}){return <div className="card"><div className="sectionHead"><h3>{title}</h3></div>{children}</div>}
function List({rows}:{rows:any[]}){return <div className="list">{rows.length?rows.map((r,i)=><div className="row" key={i}><div className="rowMain"><div className="rowTitle">{r.a}</div><div className="rowMeta">{r.b}</div></div><strong className={r.c||''}>{r.v}</strong></div>):<div className="empty">No records yet</div>}</div>}

function BalanceCard({title,value,sub}:{title:string;value:number|null;sub:string}){return <div className="card balanceCard"><div className="label">{title}</div><div className="balanceValue">{value==null?'Not set':money(value)}</div><div className="hint">{sub}</div></div>}
function Closing({d,reload}:{d:Dash;reload:()=>void}){
  const latest=d.closing?.[0];
  const initial=latest?.closing_date===today()?latest:null;
  const [x,setX]=useState({date:today(),cashCounter:initial?String(initial.cash_counter):'',bank:initial?String(initial.bank_balance):'',aeps:initial?String(initial.aeps_balance):'',notes:initial?.notes||''});
  const [msg,setMsg]=useState('');
  const save=async()=>{
    setMsg('');
    const r=await fetch('/api/closing',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(x)});
    const j=await r.json();
    if(r.ok){setMsg('Daily closing saved');reload();}else setMsg(j.error||'Could not save closing');
  };
  return <div className="grid two">
    <div className="card">
      <div className="sectionHead"><div><h3>Daily closing</h3><div className="muted small">Record the actual end-of-day balances separately from sales and expenses.</div></div><span className="badge">3 accounts</span></div>
      <div className="formGrid">
        <Field label="Closing date" value={x.date} set={v=>setX({...x,date:v})} type="date"/>
        <Field label="Cash Counter" value={x.cashCounter} set={v=>setX({...x,cashCounter:v})} type="number"/>
        <Field label="Bank Account" value={x.bank} set={v=>setX({...x,bank:v})} type="number"/>
        <Field label="AEPS Account" value={x.aeps} set={v=>setX({...x,aeps:v})} type="number"/>
        <div className="field full"><label>Closing note</label><textarea value={x.notes} onChange={e=>setX({...x,notes:e.target.value})} placeholder="Cash counted, bank checked, AEPS checked…"/></div>
      </div>
      <button className="btn primary" style={{marginTop:12}} onClick={save}>Save daily closing</button>
      {msg&&<div className={msg==='Daily closing saved'?'green':'red'} style={{marginTop:10,fontSize:12}}>{msg}</div>}
    </div>
    <ListCard title="Closing history">
      <table className="table"><thead><tr><th>Date</th><th>Counter</th><th>Bank</th><th>AEPS</th></tr></thead><tbody>
        {(d.closing||[]).map((x:any)=><tr key={String(x.id)}><td>{x.closing_date}</td><td>{money(x.cash_counter)}</td><td>{money(x.bank_balance)}</td><td>{money(x.aeps_balance)}</td></tr>)}
      </tbody></table>
    </ListCard>
  </div>;
}

function Plan({d}:{d:Dash}){
  const p=d.plan;
  return <div className="planPage">
    <div className="planHero card">
      <div>
        <div className="eyebrow">GREYSTUDIO FINANCIAL PLAN</div>
        <h2>Protect the baseline → clear debt → build the agency.</h2>
        <p className="muted">This page keeps the financial plan you supplied visible beside the live cashflow. Planning values are stored as assumptions and can be updated later.</p>
      </div>
      <div className="planHeroMetric"><span>Long-term profit target</span><strong>{money(p.targets.profitMin)}–{money(p.targets.profitMax)} / month</strong></div>
    </div>

    <div className="grid four planGrid">
      <K l="Monthly survival" v={money(p.survivalMonthly)} h="essential cash baseline"/>
      <K l="Debt target" v={money(p.targets.debtTotal)} h="12-month plan"/>
      <K l="Debt/month" v={money(p.targets.debtMonthly)} h="planned principal pace"/>
      <K l="Studio cash target" v={money(p.targets.studioCashMin)+'–'+money(p.targets.studioCashMax)} h="survival + debt generation"/>
    </div>

    <div className="grid two">
      <ListCard title="Essential monthly outflow">
        <div className="planRows">
          <PlanRow a="Shop rent" v={p.expenses.shopRent}/>
          <PlanRow a="Shop supplies / ink / paper / stationery" v={p.expenses.shopSupplies}/>
          <PlanRow a="House groceries" v={p.expenses.groceries}/>
          <PlanRow a="Fuel" v={p.expenses.fuel}/>
          <PlanRow a="EMI 1" v={p.expenses.emi1}/>
          <PlanRow a="EMI 2" v={p.expenses.emi2}/>
          <PlanRow a="EMI 3" v={p.expenses.emi3}/>
          <div className="planTotal"><span>Total baseline</span><strong>{money(p.survivalMonthly)}</strong></div>
        </div>
      </ListCard>

      <ListCard title="Income reality">
        <div className="planRows">
          <PlanRow a="Job salary" v={p.incomeReality.jobSalary}/>
          <PlanRow a="Co-operative loan deduction" v={p.incomeReality.cooperativeDeduction}/>
          <PlanRow a="Bank credit after deduction" v={p.incomeReality.bankCreditAfterDeduction}/>
          <PlanRow a="Usable job income for daily plan" v={p.incomeReality.usableJobIncome}/>
          <div className="noteBox"><strong>Salary-based gap:</strong> {money(p.incomeReality.salaryBasedGap)} before the plan treats usable daily income as ₹0.</div>
          <div className="noteBox"><strong>Operating reality:</strong> GreyStudio is expected to fund the full {money(p.survivalMonthly)} baseline.</div>
        </div>
      </ListCard>
    </div>

    <div className="grid two">
      <ListCard title="Targets & milestones">
        <div className="planRows">
          <PlanRowRange a="Walk-in counter net / month" min={p.targets.counterNetMin} max={p.targets.counterNetMax}/>
          <PlanRowRange a="Studio cash generation / month" min={p.targets.studioCashMin} max={p.targets.studioCashMax}/>
          <PlanRow a="Debt principal / month" v={p.targets.debtMonthly}/>
          <PlanRowRange a="Long-term agency profit / month" min={p.targets.profitMin} max={p.targets.profitMax}/>
          <div className="noteBox">Baseline daily defense reference from the plan: approximately ₹950–₹1,000/day net.</div>
        </div>
      </ListCard>

      <ListCard title="Growth roadmap">
        <div className="roadmap">
          <Road n="01" title="Defense" text={p.roadmap.defense}/>
          <Road n="02" title="Growth engine" text={p.roadmap.growth}/>
          <Road n="03" title="Digital monetization" text={p.roadmap.monetization}/>
          <div className="noteBox"><strong>Gold-rate site:</strong> {p.goldRateSite.visitorsMin.toLocaleString('en-IN')}–{p.goldRateSite.visitorsMax.toLocaleString('en-IN')} monthly visitors in the supplied plan, with monetization through ads, affiliate partnerships and local jeweler sponsorships.</div>
        </div>
      </ListCard>
    </div>

    <div className="card planHint">
      <strong>Live planning hint:</strong> {d.month.daysLeft} days left in the current month · {money(d.month.remaining)} remaining against the survival baseline · current run-rate needed {money(d.month.runrate)}/day · live debt remaining {money(d.debts.remaining)}.
    </div>
  </div>;
}
function PlanRow({a,v}:{a:string;v:number}){return <div className="planRow"><span>{a}</span><strong>{money(v)}</strong></div>}
function PlanRowRange({a,min,max}:{a:string;min:number;max:number}){return <div className="planRow"><span>{a}</span><strong>{money(min)}–{money(max)}</strong></div>}
function Road({n,title,text}:{n:string;title:string;text:string}){return <div className="road"><span>{n}</span><div><strong>{title}</strong><p>{text}</p></div></div>}

function Quick({d,reload}:{d:Dash;reload:()=>void}){
  const [amount,setAmount]=useState('');
  const [direction,setDirection]=useState<'in'|'out'|null>(null);
  const [reason,setReason]=useState('');
  const [msg,setMsg]=useState('');
  const [saving,setSaving]=useState(false);

  const keys=['7','8','9','4','5','6','1','2','3','00','0','.'];
  const shortcuts=[
    ['MT','Money Transfer'],['PS','Passport Photos'],['X/P','Xerox / Print'],['FR','Photo Frames'],
    ['PH','Photography'],['ST','Stationery'],['GD','Graphic Design'],['WEB','Website Development'],
    ['VID','Video Editing'],['OT','Other']
  ];

  const press=(key:string)=>{
    setMsg('');
    if(key==='.') { if(!amount.includes('.')) setAmount(amount+'.'); return; }
    setAmount(amount+key);
  };
  const back=()=>setAmount(amount.slice(0,-1));
  const clear=()=>{setAmount('');setDirection(null);setReason('');setMsg('');};

  const chooseDirection=(dir:'in'|'out')=>{
    if(!amount || Number(amount)<=0){setMsg('Enter an amount first');return;}
    setDirection(dir);setMsg('');
  };

  const submit=async()=>{
    if(!amount || Number(amount)<=0){setMsg('Enter an amount first');return;}
    if(!direction){setMsg('Choose RECEIVE (+) or PAID (-)');return;}
    setSaving(true);setMsg('');
    try{
      const input=amount+(direction==='in'?'+':'-')+(reason.trim()?' '+reason.trim():'');
      const r=await fetch('/api/transactions',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({input})});
      const j=await r.json();
      if(!r.ok) throw new Error(j.error||'Could not save');
      setMsg('✓ Saved '+money(Number(amount))+' '+(direction==='in'?'received':'paid')+(reason.trim()?' · '+reason.trim():''));
      clear();reload();
    }catch(e){setMsg(e instanceof Error?e.message:'Could not save');}
    finally{setSaving(false);}
  };

  const activeShortcut=shortcuts.find(x=>x[1]===reason)?.[0];

  return <div className="quickPage">
    <div className="card calcCard">
      <div className="sectionHead">
        <div><div className="eyebrow">FAST ENTRY</div><h2>Counter Calculator</h2><div className="muted small">Enter the amount, choose + / −, then type a name or use a shortcut.</div></div>
        <span className="badge">{direction==='in'?'RECEIVE +':direction==='out'?'PAID −':'READY'}</span>
      </div>

      <div className="calcDisplay">
        <div className="calcLabel">{direction==='in'?'MONEY RECEIVED':direction==='out'?'MONEY PAID':'AMOUNT'}</div>
        <div className="calcAmount">{amount?'₹'+amount:'₹0'}</div>
        <div className="calcStatus">{direction?('Reason / name '+(reason?'· '+reason:'')):'Tap + or − after entering amount'}</div>
      </div>

      {!direction ? <div className="directionRow">
        <button className="directionButton receive" onClick={()=>chooseDirection('in')}>＋ RECEIVE<br/><small>Money In · v</small></button>
        <button className="directionButton paid" onClick={()=>chooseDirection('out')}>－ PAID<br/><small>Money Out · p</small></button>
      </div> : <div className="reasonStage">
        <div className="reasonTop">
          <button className="btn secondary" onClick={()=>{setDirection(null);setReason('')}}>← Amount</button>
          <div className="stageTitle">{direction==='in'?'Received from':'Paid for'}</div>
          <button className="btn secondary" onClick={clear}>Clear</button>
        </div>
        <input
          className="reasonInput"
          autoFocus
          value={reason}
          onChange={e=>setReason(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter')submit();if(e.key==='Escape'){setDirection(null);setReason('')}}}
          placeholder="Type service / name, then press Enter"
        />
        <div className="shortcutTitle">Quick shortcuts</div>
        <div className="shortcutGrid">
          {shortcuts.map(([code,label])=><button key={code} className={'shortcut '+(activeShortcut===code?'selected':'')} onClick={()=>setReason(label)}><span>{code}</span><small>{label}</small></button>)}
        </div>
        <button className="saveEntry" onClick={submit} disabled={saving}>{saving?'Saving…':'Save Entry ↵'}</button>
      </div>}

      {!direction && <div className="calcKeypad">
        <button className="calcKey function" onClick={clear}>C</button>
        <button className="calcKey function" onClick={back}>⌫</button>
        <span></span><span></span>
        {keys.map(k=><button key={k} className="calcKey" onClick={()=>press(k)}>{k}</button>)}
      </div>}

      {direction && <div className="reasonKeyboardHint">Your phone's normal keyboard is active for the reason/name field. Press <strong>Enter</strong> to feed the entry.</div>}
      {msg&&<div className={msg.startsWith('✓')?'entrySuccess':'entryError'}>{msg}</div>}
    </div>

    <ListCard title="Today / latest cashflow">
      <List rows={d.transactions.slice(0,20).map((t:any)=>({a:t.reason||t.category||'Quick entry',b:t.raw+' · '+new Date(t.occurred_at).toLocaleString('en-IN'),v:(t.direction==='in'?'+':'-')+money(t.amount),c:t.direction==='in'?'green':'red'}))}/>
    </ListCard>
  </div>;
}
function Tasks({d,reload}:{d:Dash;reload:()=>void}){const [x,setX]=useState({title:'',priority:'high',due_date:'',area:'business'});const add=async()=>{if(!x.title)return;await fetch('/api/tasks',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(x)});setX({...x,title:''});reload()};const done=async(id:number)=>{await fetch('/api/tasks',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id,status:'done'})});reload()};return <div className="grid two"><div className="card"><h3>Add task</h3><div className="formGrid"><Field label="Task" value={x.title} set={v=>setX({...x,title:v})}/><div className="field"><label>Area</label><select value={x.area} onChange={e=>setX({...x,area:e.target.value})}><option>business</option><option>shop</option><option>finance</option><option>life</option></select></div><div className="field"><label>Priority</label><select value={x.priority} onChange={e=>setX({...x,priority:e.target.value})}><option>high</option><option>medium</option><option>low</option></select></div><div className="field"><label>Due</label><input type="date" value={x.due_date} onChange={e=>setX({...x,due_date:e.target.value})}/></div></div><button className="btn primary" style={{marginTop:12}} onClick={add}>Add task</button></div><ListCard title="Work queue"><div className="list">{d.tasks.map((t:any)=><div className="row" key={String(t.id)}><div className="rowMain"><div className="rowTitle">{t.title}</div><div className="rowMeta">{t.area} · {t.priority} · {t.due_date||'No date'}</div></div>{t.status==='done'?<span className="badge">Done</span>:<button className="btn secondary" onClick={()=>done(Number(t.id))}>Done</button>}</div>)}</div></ListCard></div>}

function Clients({d,reload}:{d:Dash;reload:()=>void}){const [x,setX]=useState({name:'',service:'Website / Branding',value:'',status:'lead',next_action:''});const add=async()=>{if(!x.name)return;await fetch('/api/clients',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(x)});setX({...x,name:'',value:'',next_action:''});reload()};return <div className="grid two"><div className="card"><h3>New prospect</h3><div className="formGrid"><Field label="Client / business" value={x.name} set={v=>setX({...x,name:v})}/><Field label="Service" value={x.service} set={v=>setX({...x,service:v})}/><Field label="Potential value" value={x.value} set={v=>setX({...x,value:v})} type="number"/><div className="field"><label>Status</label><select value={x.status} onChange={e=>setX({...x,status:e.target.value})}><option>lead</option><option>contacted</option><option>proposal</option><option>won</option><option>lost</option></select></div><Field label="Next action" value={x.next_action} set={v=>setX({...x,next_action:v})}/></div><button className="btn primary" style={{marginTop:12}} onClick={add}>Add prospect</button></div><ListCard title="Agency pipeline"><table className="table"><thead><tr><th>Client</th><th>Stage</th><th>Value</th></tr></thead><tbody>{d.clients.map((c:any)=><tr key={String(c.id)}><td>{c.name}<div className="rowMeta">{c.service}</div></td><td>{c.status}</td><td>{money(c.value)}</td></tr>)}</tbody></table></ListCard></div>}

function Debt({d,reload}:{d:Dash;reload:()=>void}){return <div className="grid two"><ListCard title="Debt plan"><div className="list">{d.debts.items.map((x:any)=><DebtRow key={String(x.id)} x={x} reload={reload}/>)}</div></ListCard><div className="card"><h3>Operating rule</h3><p className="muted small">Protect essential cash first. Keep required obligations visible. Do not use debt money for speculative purchases. Grow high-margin B2B work before adding fixed costs.</p></div></div>}
function DebtRow({x,reload}:{x:any;reload:()=>void}){const [p,setP]=useState(String(x.paid));const save=async()=>{await fetch('/api/debts',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id:Number(x.id),paid:p})});reload()};return <div className="row"><div className="rowMain"><div className="rowTitle">{x.name}</div><div className="rowMeta">{money(x.principal)} principal · {x.deadline||'no deadline'}</div></div><div className="inline"><input value={p} onChange={e=>setP(e.target.value)} /><button className="btn secondary" onClick={save}>Update</button></div></div>}

function Shop({d,reload}:{d:Dash;reload:()=>void}){const [x,setX]=useState({date:today(),footfall:'',notes:''});const save=async()=>{await fetch('/api/shop',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(x)});reload()};return <div className="grid two"><div className="card"><h3>Daily shop pulse</h3><div className="formGrid"><Field label="Date" value={x.date} set={v=>setX({...x,date:v})} type="date"/><Field label="Footfall" value={x.footfall} set={v=>setX({...x,footfall:v})} type="number"/><div className="field full"><label>Notes</label><textarea value={x.notes} onChange={e=>setX({...x,notes:e.target.value})}/></div></div><button className="btn primary" style={{marginTop:12}} onClick={save}>Save shop day</button></div><ListCard title="Recent shop days"><table className="table"><thead><tr><th>Date</th><th>Footfall</th><th>Notes</th></tr></thead><tbody>{d.shop.map((x:any)=><tr key={String(x.id)}><td>{x.date}</td><td>{x.footfall}</td><td>{x.notes||''}</td></tr>)}</tbody></table></ListCard></div>}

function Advisor({value,setValue,busy,setBusy}:{value:string;setValue:(x:string)=>void;busy:boolean;setBusy:(x:boolean)=>void}){const [out,setOut]=useState('');const ask=async()=>{if(!value.trim())return;setBusy(true);const r=await fetch('/api/ai',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:value})});const j=await r.json();setOut(j.answer||j.error||'No response');setBusy(false)};return <div className="grid two"><div className="card"><h3>GreyStudio AI advisor</h3><p className="muted small">Ask about cash flow, pricing, debt sequencing, client acquisition, shop priorities or the next safest move.</p><textarea className="aiInput" value={value} onChange={e=>setValue(e.target.value)} placeholder="What should I focus on next?"/><button className="btn primary" style={{marginTop:12}} onClick={ask} disabled={busy}>{busy?'Thinking…':'Ask advisor'}</button></div><div className="card"><div className="sectionHead"><h3>Advisor output</h3><span className="badge">Context aware</span></div><div className="aiBox">{out||'Answer appears here. Record-changing actions require explicit approval.'}</div></div></div>}
function Field({label,value,set,type='text'}:{label:string;value:string;set:(x:string)=>void;type?:string}){return <div className="field"><label>{label}</label><input type={type} value={value} onChange={e=>set(e.target.value)}/></div>}
