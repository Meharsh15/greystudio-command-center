import {NextResponse} from 'next/server';
import {initDb} from '@/lib/db';
import {requireAuth} from '@/lib/guards';

export async function GET(){
  const denied=await requireAuth();if(denied)return denied;
  const d=await initDb();
  const r=await d.execute({sql:"SELECT * FROM tasks ORDER BY CASE status WHEN 'done' THEN 1 ELSE 0 END, CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, COALESCE(due_date,'9999-12-31')",args:[]});
  return NextResponse.json({tasks:r.rows});
}
export async function POST(req:Request){
  const denied=await requireAuth();if(denied)return denied;
  const b=await req.json();const title=String(b?.title||'').trim();
  if(!title)return NextResponse.json({error:'Task title is required'},{status:400});
  const d=await initDb();const now=new Date().toISOString();
  const r=await d.execute({sql:'INSERT INTO tasks(title,status,priority,due_date,area,notes,created_at) VALUES(?,?,?,?,?,?,?)',args:[title,'todo',String(b?.priority||'medium'),b?.due_date||null,String(b?.area||'business'),b?.notes||null,now]});
  return NextResponse.json({ok:true,id:Number(r.lastInsertRowid)});
}
export async function PATCH(req:Request){
  const denied=await requireAuth();if(denied)return denied;
  const b=await req.json();const id=Number(b?.id);if(!id)return NextResponse.json({error:'Invalid task id'},{status:400});
  const d=await initDb();const status=String(b?.status||'todo');
  await d.execute({sql:'UPDATE tasks SET status=?,completed_at=? WHERE id=?',args:[status,status==='done'?new Date().toISOString():null,id]});
  return NextResponse.json({ok:true});
}