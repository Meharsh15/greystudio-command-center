import {NextResponse} from 'next/server';
import {initDb} from '@/lib/db';
import {requireAuth} from '@/lib/guards';

export async function GET(){
  const denied=await requireAuth();if(denied)return denied;
  const d=await initDb();const r=await d.execute({sql:'SELECT * FROM debts ORDER BY principal DESC,id ASC',args:[]});
  return NextResponse.json({debts:r.rows});
}
export async function PATCH(req:Request){
  const denied=await requireAuth();if(denied)return denied;
  const b=await req.json();const id=Number(b?.id);const paid=Number(b?.paid);
  if(!id||!Number.isFinite(paid)||paid<0)return NextResponse.json({error:'Invalid debt update'},{status:400});
  const d=await initDb();await d.execute({sql:'UPDATE debts SET paid=MIN(principal,?) WHERE id=?',args:[paid,id]});
  return NextResponse.json({ok:true});
}