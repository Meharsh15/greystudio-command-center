import {NextResponse} from 'next/server';
import {initDb} from '@/lib/db';
import {requireAuth} from '@/lib/guards';

export async function GET(){
  const denied=await requireAuth();if(denied)return denied;
  const d=await initDb();const r=await d.execute({sql:'SELECT * FROM shop_daily ORDER BY date DESC,id DESC LIMIT 90',args:[]});
  return NextResponse.json({shop:r.rows});
}
export async function POST(req:Request){
  const denied=await requireAuth();if(denied)return denied;
  const b=await req.json();const date=String(b?.date||'');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return NextResponse.json({error:'Valid date required'},{status:400});
  const footfall=Math.max(0,Number(b?.footfall||0));const d=await initDb();const now=new Date().toISOString();
  await d.execute({sql:'INSERT INTO shop_daily(date,footfall,notes,created_at) VALUES(?,?,?,?) ON CONFLICT(date) DO UPDATE SET footfall=excluded.footfall,notes=excluded.notes',args:[date,Number.isFinite(footfall)?footfall:0,b?.notes||null,now]});
  return NextResponse.json({ok:true});
}