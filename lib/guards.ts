import { NextResponse } from 'next/server';
import { isAuthed } from './auth';

export async function requireAuth(){
  if(!(await isAuthed())) return NextResponse.json({error:'Unauthorized'},{status:401});
  return null;
}