import {NextResponse} from 'next/server';
import {initDb} from '@/lib/db';
import {requireAuth} from '@/lib/guards';

export async function POST(req:Request){
  const denied=await requireAuth();if(denied)return denied;
  try{
    const b=await req.json();const d=await initDb();const now=new Date().toISOString();const type=String(b?.type||'');
    if(type==='task'){
      const title=String(b?.title||'').trim();if(!title)return NextResponse.json({error:'Task title required'},{status:400});
      const r=await d.execute({sql:'INSERT INTO tasks(title,status,priority,due_date,area,notes,created_at) VALUES(?,?,?,?,?,?,?)',args:[title,'todo',String(b?.priority||'medium'),b?.due_date||null,'ai',b?.detail||null,now]});
      return NextResponse.json({ok:true,id:Number(r.lastInsertRowid)});
    }
    if(type==='note'){
      const content=String(b?.detail||b?.content||'').trim();if(!content)return NextResponse.json({error:'Note content required'},{status:400});
      const r=await d.execute({sql:'INSERT INTO ai_notes(kind,content,created_at) VALUES(?,?,?)',args:['approved',content,now]});
      return NextResponse.json({ok:true,id:Number(r.lastInsertRowid)});
    }
    return NextResponse.json({error:'Unsupported action'},{status:400});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Could not apply action'},{status:400});}
}