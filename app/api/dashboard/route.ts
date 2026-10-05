import {NextResponse} from 'next/server';
import {initDb,getSettings} from '@/lib/db';
import {requireAuth} from '@/lib/guards';

function indiaToday(){
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const get=(type:string)=>p.find(x=>x.type===type)?.value||'';
  return get('year')+'-'+get('month')+'-'+get('day');
}

export async function GET(){
  const denied=await requireAuth();if(denied)return denied;
  try{
    const d=await initDb();const settings=await getSettings();const today=indiaToday();const month=today.slice(0,7);
    const [m,todayRows,tx,debts,tasks,clients,shop,closing]=await Promise.all([
      d.execute({sql:"SELECT COALESCE(SUM(CASE WHEN direction='in' THEN amount ELSE 0 END),0) income,COALESCE(SUM(CASE WHEN direction='out' THEN amount ELSE 0 END),0) expense FROM transactions WHERE substr(datetime(occurred_at,'+5 hours','+30 minutes'),1,7)=?",args:[month]}),
      d.execute({sql:"SELECT COALESCE(SUM(CASE WHEN direction='in' THEN amount ELSE 0 END),0) income,COALESCE(SUM(CASE WHEN direction='out' THEN amount ELSE 0 END),0) expense FROM transactions WHERE substr(datetime(occurred_at,'+5 hours','+30 minutes'),1,10)=?",args:[today]}),
      d.execute({sql:'SELECT * FROM transactions ORDER BY occurred_at DESC,id DESC LIMIT 100',args:[]}),
      d.execute({sql:'SELECT id,name,principal,paid,deadline,notes FROM debts ORDER BY principal DESC,id ASC',args:[]}),
      d.execute({sql:"SELECT * FROM tasks ORDER BY CASE status WHEN 'done' THEN 1 ELSE 0 END,CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,COALESCE(due_date,'9999-12-31') LIMIT 100",args:[]}),
      d.execute({sql:'SELECT * FROM clients ORDER BY created_at DESC LIMIT 100',args:[]}),
      d.execute({sql:'SELECT * FROM shop_daily ORDER BY date DESC,id DESC LIMIT 30',args:[]}),
      d.execute({sql:'SELECT * FROM daily_closing ORDER BY closing_date DESC,id DESC LIMIT 30',args:[]})
    ]);
    const income=Number(m.rows[0]?.income||0),expense=Number(m.rows[0]?.expense||0),net=income-expense,survival=Number(settings.survival_monthly||28300),remaining=Math.max(0,survival-net);
    const start=new Date(today+'T00:00:00+05:30');const next=new Date(start);next.setMonth(next.getMonth()+1);next.setDate(1);
    const daysLeft=Math.max(1,Math.ceil((next.getTime()-start.getTime())/86400000));
    const debtTotal=debts.rows.reduce((s:any,r:any)=>s+Number(r.principal||0),0),debtPaid=debts.rows.reduce((s:any,r:any)=>s+Number(r.paid||0),0);
    const debtMonths=Number(settings.debt_months||12),monthlyTarget=debtMonths?debtTotal/debtMonths:0;
    const latest=closing.rows[0]||null;
    return NextResponse.json({today,todayCash:{income:Number(todayRows.rows[0]?.income||0),expense:Number(todayRows[0]?.expense||0),net:Number(todayRows[0]?.income||0)-Number(todayRows[0]?.expense||0)},month:{income,expense,net,survival,remaining,daysLeft,runrate:remaining/daysLeft},debts:{total:debtTotal,paid:debtPaid,remaining:Math.max(0,debtTotal-debtPaid),monthlyTarget,items:debts.rows},balances:{cashCounter:latest?Number(latest.cash_counter):null,bank:latest?Number(latest.bank_balance):null,aeps:latest?Number(latest.aeps_balance):null,closingDate:latest?.closing_date||null},closing:closing.rows,transactions:tx.rows,tasks:tasks.rows,clients:clients.rows,shop:shop.rows,settings});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Dashboard failed'},{status:500});}
}