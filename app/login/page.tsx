'use client';

import {useState} from 'react';

export default function Login(){
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);

  async function submit(){
    setBusy(true);
    setError('');
    try{
      const r=await fetch('/api/login',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({password})
      });
      const j=await r.json();
      if(r.ok) location.href='/';
      else setError(j.error||'Login failed');
    }catch{
      setError('Unable to connect.');
    }finally{
      setBusy(false);
    }
  }

  return <main className="main" style={{marginLeft:0,minHeight:'100vh',display:'grid',placeItems:'center'}}>
    <div className="card" style={{width:'100%',maxWidth:430}}>
      <div className="brand">
        <div className="brandMark">G</div>
        <div><div className="brandTitle">GreyStudio</div><div className="brandSub">Command Center</div></div>
      </div>
      <h1 style={{marginBottom:6}}>Private access</h1>
      <p className="muted">Finance, shop, business and life data stay behind your app password.</p>
      <div className="field" style={{marginTop:18}}>
        <label>Password</label>
        <input
          autoFocus
          type="password"
          value={password}
          onChange={e=>setPassword(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter')submit()}}
          placeholder="Enter your private password"
        />
      </div>
      <button className="btn primary" style={{width:'100%',marginTop:12}} onClick={submit} disabled={busy}>
        {busy?'Opening…':'Open Command Center'}
      </button>
      {error&&<p className="red" style={{fontSize:12}}>{error}</p>}
    </div>
  </main>;
}