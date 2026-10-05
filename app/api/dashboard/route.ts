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
    const monthRow:any=(m as any).rows?.[0]||{};const todayRow:any=(todayRows as any).rows?.[0]||{};
    const income=Number(monthRow.income||0),expense=Number(monthRow.expense||0),net=income-expense,survival=Number(settings.survival_monthly||28300),remaining=Math.max(0,survival-net);
    const start=new Date(today+'T00:00:00+05:30');const next=new Date(start);next.setMonth(next.getMonth()+1);next.setDate(1);
    const daysLeft=Math.max(1,Math.ceil((next.getTime()-start.getTime())/86400000));
    const debtTotal=debts.rows.reduce((s:any,r:any)=>s+Number(r.principal||0),0),debtPaid=debts.rows.reduce((s:any,r:any)=>s+Number(r.paid||0),0);
    const debtMonths=Number(settings.debt_months||12),monthlyTarget=debtMonths?debtTotal/debtMonths:0;
    const latest:any=(closing as any).rows?.[0]||null;
    const plan={
      survivalMonthly:Number(settings.survival_monthly||28300),
      expenses:{shopRent:Number(settings.shop_rent||6800),shopSupplies:Number(settings.shop_supplies||3000),groceries:Number(settings.groceries||5000),fuel:Number(settings.fuel||3500),emi1:Number(settings.emi_1||2900),emi2:Number(settings.emi_2||4100),emi3:Number(settings.emi_3||3000),emiTotal:Number(settings.emi_1||2900)+Number(settings.emi_2||4100)+Number(settings.emi_3||3000)},
      incomeReality:{jobSalary:Number(settings.job_salary||36000),cooperativeDeduction:Number(settings.cooperative_deduction||26166),bankCreditAfterDeduction:Number(settings.bank_credit_after_deduction||10474),usableJobIncome:Number(settings.usable_job_income||0),salaryBasedGap:Number(settings.salary_based_gap||17826)},
      targets:{counterNetMin:Number(settings.counter_net_target_min||18000),counterNetMax:Number(settings.counter_net_target_max||22000),studioCashMin:Number(settings.studio_cash_target_min||75000),studioCashMax:Number(settings.studio_cash_target_max||85000),debtTotal:Number(settings.debt_total_target||675000),debtMonthly:Number(settings.debt_total_target||675000)/Number(settings.debt_months||12),profitMin:Number(settings.target_profit_min||200000),profitMax:Number(settings.target_profit_max||500000)},
      goldRateSite:{visitorsMin:Number(settings.gold_visitors_min||4000),visitorsMax:Number(settings.gold_visitors_max||6000)},
      roadmap:{defense:'Counter services protect rent, supplies and essentials',growth:'High-ticket B2B website, branding and commercial video work',monetization:'Gold-rate website via display ads, affiliate partnerships and local jeweler sponsorships'}
    };
    return NextResponse.json({today,todayCash:{income:Number(todayRow?.income||0),expense:Number(todayRow?.expense||0),net:Number(todayRow?.income||0)-Number(todayRow?.expense||0)},month:{income,expense,net,survival,remaining,daysLeft,runrate:remaining/daysLeft},debts:{total:debtTotal,paid:debtPaid,remaining:Math.max(0,debtTotal-debtPaid),monthlyTarget,items:debts.rows},balances:{cashCounter:latest?Number(latest.cash_counter):null,bank:latest?Number(latest.bank_balance):null,aeps:latest?Number(latest.aeps_balance):null,closingDate:latest?.closing_date||null},closing:(closing as any).rows,plan,transactions:tx.rows,tasks:tasks.rows,clients:clients.rows,shop:shop.rows,settings});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Dashboard failed'},{status:500});}
}