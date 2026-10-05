import {NextResponse} from 'next/server';
import {initDb} from '@/lib/db';
import {requireAuth} from '@/lib/guards';

export async function GET(){
  const denied=await requireAuth();if(denied)return denied;
  const d=await initDb();
  const r=await d.execute({sql:'SELECT * FROM daily_closing ORDER BY closing_date DESC,id DESC LIMIT 90',args:[]});
  return NextResponse.json({closing:r.rows});
}

export async function POST(req:Request){
  const denied=await requireAuth();if(denied)return denied;
  try{
    const b=await req.json();
    const date=String(b?.date||'');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({error:'Valid closing date is required'},{status:400});
    const rawValues=[b?.cashCounter,b?.bank,b?.aeps];
    if(rawValues.some(v=>v===undefined||v===null||String(v).trim()==='')) return NextResponse.json({error:'Enter Cash Counter, Bank and AEPS balances.'},{status:400});
    const values=rawValues.map(Number);
    if(values.some(v=>!Number.isFinite(v)||v<0)) return NextResponse.json({error:'Balances must be zero or positive numbers'},{status:400});
    const notes=b?.notes?String(b.notes).trim():null;
    const now=new Date().toISOString();
    const d=await initDb();
    await d.execute({sql:'INSERT INTO daily_closing(closing_date,cash_counter,bank_balance,aeps_balance,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(closing_date) DO UPDATE SET cash_counter=excluded.cash_counter,bank_balance=excluded.bank_balance,aeps_balance=excluded.aeps_balance,notes=excluded.notes,updated_at=excluded.updated_at',args:[date,values[0],values[1],values[2],notes,now,now]});
    return NextResponse.json({ok:true});
  }catch(e){
    return NextResponse.json({error:e instanceof Error?e.message:'Could not save closing'},{status:400});
  }
}