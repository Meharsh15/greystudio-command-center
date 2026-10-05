import {redirect} from 'next/navigation';
import {isAuthed} from '@/lib/auth';
import CommandCenter from './ui';

export default async function Home(){
  if(!(await isAuthed())) redirect('/login');
  return <CommandCenter/>;
}