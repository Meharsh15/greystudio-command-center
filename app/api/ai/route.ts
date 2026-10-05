import {NextResponse} from 'next/server';
import {initDb,getSettings} from '@/lib/db';
import {requireAuth} from '@/lib/guards';

function fallback(c:any,message:string){
  const gap=c.month.remaining;
  const actions:any[]=[];
  if(gap>0) actions.push({type:'task',title:'Close one cash-generating sale',detail:'Prioritize one quick-turn GreyStudio or shop job with realistic collection this week.',priority:'high'});
  if(c.debts.remaining>0) actions.push({type:'task',title:'Protect the debt pace',detail:'Review actual cash before discretionary purchases and keep the repayment target visible.',priority:'high'});
  return {answer:'Current month net: ₹'+Math.round(c.month.net).toLocaleString('en-IN')+'\nSurvival baseline: ₹'+Math.round(c.month.survival).toLocaleString('en-IN')+'\nSurvival gap: ₹'+Math.round(gap).toLocaleString('en-IN')+'\nDebt remaining: ₹'+Math.round(c.debts.remaining).toLocaleString('en-IN')+'\n\nFor "'+message+'", protect essential cash first, then pursue high-margin work that can collect cash. Do not count expected sales as cash until received.',actions};
}

export async function POST(req:Request){
  const denied=await requireAuth();if(denied)return denied;
  try{
    const b=await req.json();const message=String(b?.message||'').trim();if(!message)return NextResponse.json({error:'Message required'},{status:400});
    const d=await initDb();const settings=await getSettings();
    const month=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit'}).format(new Date());
    const [m,debts,tasks,clients]=await Promise.all([
      d.execute({sql:"SELECT COALESCE(SUM(CASE WHEN direction='in' THEN amount ELSE 0 END),0) income,COALESCE(SUM(CASE WHEN direction='out' THEN amount ELSE 0 END),0) expense FROM transactions WHERE substr(datetime(occurred_at,'+5 hours','+30 minutes'),1,7)=?",args:[month]}),
      d.execute({sql:'SELECT name,principal,paid,deadline FROM debts',args:[]}),
      d.execute({sql:"SELECT title,status,priority,due_date,area FROM tasks WHERE status!='done' LIMIT 30",args:[]}),
      d.execute({sql:'SELECT name,service,value,status,next_action,next_action_date FROM clients LIMIT 30',args:[]})
    ]);
    const income=Number(m.rows[0]?.income||0),expense=Number(m.rows[0]?.expense||0),survival=Number(settings.survival_monthly||28300);
    const debtTotal=debts.rows.reduce((s:any,r:any)=>s+Number(r.principal||0),0),debtPaid=debts.rows.reduce((s:any,r:any)=>s+Number(r.paid||0),0);
    const context={month:{income,expense,net:income-expense,survival,remaining:Math.max(0,survival-(income-expense))},debts:debts.rows,tasks:tasks.rows,clients:clients.rows,settings};
    if(!process.env.AI_GATEWAY_API_KEY)return NextResponse.json(fallback(context,message));
    const model=process.env.AI_MODEL||'google/gemini-3.1-pro-preview';
    const resp=await fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{method:'POST',headers:{'content-type':'application/json','Authorization':'Bearer '+process.env.AI_GATEWAY_API_KEY},body:JSON.stringify({model,temperature:0.2,messages:[{role:'system',content:'You are the GreyStudio Command Center financial and business advisor. Use supplied data as facts. Be practical and conservative with cash. Never claim actions were executed. Suggestions that change records need explicit approval.'},{role:'user',content:JSON.stringify({message,context})}]})});
    if(!resp.ok)return NextResponse.json(fallback(context,message));
    const json:any=await resp.json();return NextResponse.json({answer:String(json?.choices?.[0]?.message?.content||'No answer returned.'),actions:[]});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'AI request failed'},{status:500});}
}