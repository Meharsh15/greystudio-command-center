import {NextResponse} from 'next/server';
import {initDb} from '@/lib/db';
import {setAuth,validPassword} from '@/lib/auth';

export async function POST(req:Request){
  try{
    const body=await req.json();
    const password=String(body?.password||'');
    const remember=body?.remember!==false;
    if(!validPassword(password)) return NextResponse.json({error:'Wrong password'},{status:401});
    await initDb();
    await setAuth(remember);
    return NextResponse.json({ok:true});
  }catch(e){
    return NextResponse.json({error:e instanceof Error?e.message:'Login failed'},{status:500});
  }
}