import crypto from 'crypto';
import { cookies } from 'next/headers';

const COOKIE='gs_session';

function token(){ return crypto.createHash('sha256').update((process.env.APP_PASSWORD||'')+':greystudio').digest('hex'); }
export function validPassword(value:string){ return Boolean(process.env.APP_PASSWORD) && value===process.env.APP_PASSWORD; }
export async function isAuthed(){ const c=await cookies(); return c.get(COOKIE)?.value===token(); }
export async function setAuth(){ const c=await cookies(); c.set(COOKIE,token(),{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:2592000}); }
export async function clearAuth(){ const c=await cookies(); c.set(COOKIE,'',{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:0}); }