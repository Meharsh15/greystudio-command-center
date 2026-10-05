export type ParsedQuick = { direction:'in'|'out'; amount:number; raw:string; reason?:string; category?:string };

const cats:Array<[RegExp,string]> = [
  [/passport/i,'Passport Photos'],[/xerox|copy/i,'Xerox'],[/money transfer|transfer commission/i,'Money Transfer'],
  [/frame/i,'Photo Frames'],[/print|printing|pamphlet|leaflet|sticker|business card/i,'Printing'],
  [/website|web/i,'Website Development'],[/design|logo|graphic/i,'Graphic Design'],
  [/photograph|photo/i,'Photography'],[/video|edit/i,'Video Editing']
];

export function parseQuick(input:string):ParsedQuick {
  const raw=input.trim();
  const m=raw.match(/^([+-]?)(\d+(?:\.\d+)?)\s*([vVpP+-])?(?:\s+(.*))?$/);
  if(!m) throw new Error('Use 100+, +100, 100v, V100, 100-, -100, 100p or P100.');
  const sign=m[1], amount=Number(m[2]), token=(m[3]||'').toLowerCase();
  const direction:( 'in'|'out')=(sign==='-'||token==='-'||token==='p')?'out':'in';
  const reason=m[4]?.trim()||undefined;
  const category=reason ? cats.find(([rx])=>rx.test(reason))?.[1] : undefined;
  return {direction,amount,raw,reason,category};
}