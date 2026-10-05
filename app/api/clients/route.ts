import {NextResponse} from 'next/server';
import {initDb} from '@/lib/db';
import {requireAuth} from '@/lib/guards';

export async function GET(){
  const denied=await requireAuth();if(denied)return denied;
  const d=await initDb();const r=await d.execute({sql:"SELECT * FROM clients ORDER BY created_at DESC LIMIT 100",args:[]});
  return NextResponse.json({clients:r.rows});
}
export async function POST(req:Request){
  const denied=await requireAuth();if(denied)return denied;
  const b=await req.json();const name=String(b?.name||'').trim();
  if(!name)return NextResponse.json({error:'Client name is required'},{status:400});
  const value=Number(b?.value||0);const d=await initDb();const now=new Date().toISOString();
  const r=await d.execute({sql:'INSERT INTO clients(name,service,value,status,next_action,next_action_date,notes,created_at) VALUES(?,?,?,?,?,?,?,?)',args:[name,String(b?.service||''),Number.isFinite(value)?value:0,String(b?.status||'lead'),b?.next_action||null,b?.next_action_date||null,b?.notes||null,now]});
  return NextResponse.json({ok:true,id:Number(r.lastInsertRowid)});
}