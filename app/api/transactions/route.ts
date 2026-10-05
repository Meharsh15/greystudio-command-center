import {NextResponse} from 'next/server';
import {initDb} from '@/lib/db';
import {requireAuth} from '@/lib/guards';
import {parseQuick} from '@/lib/parser';

export async function GET(){
  const denied=await requireAuth();if(denied)return denied;
  const d=await initDb();
  const r=await d.execute({sql:'SELECT * FROM transactions ORDER BY occurred_at DESC,id DESC LIMIT 200',args:[]});
  return NextResponse.json({transactions:r.rows});
}
export async function POST(req:Request){
  const denied=await requireAuth();if(denied)return denied;
  try{
    const b=await req.json();
    const parsed=parseQuick(String(b?.input||''));
    const now=new Date().toISOString();
    const occurredAt=b?.occurredAt?String(b.occurredAt):now;
    const d=await initDb();
    const r=await d.execute({sql:'INSERT INTO transactions(occurred_at,raw,direction,amount,reason,category,source,created_at) VALUES(?,?,?,?,?,?,?,?)',args:[occurredAt,parsed.raw,parsed.direction,parsed.amount,parsed.reason||null,parsed.category||null,'quick',now]});
    return NextResponse.json({ok:true,transaction:{id:Number(r.lastInsertRowid),occurred_at:occurredAt,raw:parsed.raw,direction:parsed.direction,amount:parsed.amount,reason:parsed.reason||null,category:parsed.category||null}});
  }catch(e){
    return NextResponse.json({error:e instanceof Error?e.message:'Could not save transaction'},{status:400});
  }
}