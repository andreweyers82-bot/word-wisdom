const decodeHtml=s=>s.replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n))).replace(/&[a-zA-Z]+;/g,' ');
const clean=s=>decodeHtml(s.replace(/<sup[^>]*class=['\"][^'\"]*reference[^'\"]*['\"][\s\S]*?<\/sup>/gi,' ').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());
const wiki=async page=>{const url=`https://en.wikisource.org/w/api.php?action=parse&page=${encodeURIComponent(page)}&prop=text&format=json&formatversion=2`;const r=await fetch(url,{headers:{accept:'application/json','user-agent':'Word-and-Wisdom/2.1'}});if(!r.ok)throw new Error(`Wikisource ${r.status}`);const d=await r.json();return d.parse?.text||''};
let enoch2Chapters=null;
async function enoch2Chapter(chapter){
  if(!enoch2Chapters){
    const html=await wiki('The_Forgotten_Books_of_Eden/The_Book_of_the_Secrets_of_Enoch');
    const plain=clean(html);
    const headings=[...plain.matchAll(/Chapter\s+(\d{1,2})\s+/gi)];
    const parsed={};
    headings.forEach((h,i)=>{
      const n=Number(h[1]);
      const body=plain.slice((h.index||0)+h[0].length,i+1<headings.length?(headings[i+1].index||plain.length):plain.length);
      const ms=[...body.matchAll(/(?:^|\s)(\d{1,3})\s+(?=[A-Z“‘])/g)];
      parsed[n]=ms.map((m,j)=>({verse:Number(m[1]),text:body.slice((m.index||0)+m[0].length,j+1<ms.length?(ms[j+1].index||body.length):body.length).trim()})).filter(v=>v.verse>0&&v.text).filter((v,j,a)=>j===0||v.verse>a[j-1].verse);
    });
    enoch2Chapters=parsed;
  }
  const verses=enoch2Chapters[chapter]||[];
  if(!verses.length||verses[0]?.verse!==1||verses.some((v,i)=>i>0&&v.verse<=verses[i-1].verse))throw new Error('Incomplete 2 Enoch chapter parsed');
  return verses;
}
let clementChapters=null;
async function clementChapter(chapter){
  if(!clementChapters){
    const html=await wiki('1_Clement_(Lightfoot_translation)');
    const plain=clean(html);
    const ms=[...plain.matchAll(/1Clem\s+(\d{1,2}):(\d{1,2})\s+/g)];
    const parsed={};
    ms.forEach((m,i)=>{
      const c=Number(m[1]),v=Number(m[2]);
      const text=plain.slice((m.index||0)+m[0].length,i+1<ms.length?(ms[i+1].index||plain.length):plain.length).trim();
      if(c>=1&&c<=65&&v>0&&text)(parsed[c]||=[]).push({verse:v,text});
    });
    clementChapters=parsed;
  }
  const verses=clementChapters[chapter]||[];
  if(!verses.length||verses[0]?.verse!==1||verses.some((v,i)=>i>0&&v.verse<=verses[i-1].verse))throw new Error('Incomplete 1 Clement chapter parsed');
  return verses;
}
let baruchText='';
const baruchCache=new Map();
async function baruch4Chapter(chapter){
  if(baruchCache.has(chapter))return baruchCache.get(chapter);
  if(!baruchText){
    const r=await fetch('https://ccat.sas.upenn.edu/rak/publics/pseudepig/ParJer-Eng.html',{headers:{accept:'text/html','user-agent':'Word-and-Wisdom/2.1'}});
    if(!r.ok)throw new Error(`CCAT 4 Baruch ${r.status}`);
    const plain=clean(await r.text());
    const starts=[...plain.matchAll(/~1\.1\s+/g)];
    baruchText=starts.length>1?plain.slice(starts[0].index||0,starts[1].index||plain.length):plain.slice(starts[0]?.index||0);
  }
  const markers=[...baruchText.matchAll(/~(\d{1,2})\.(\d{1,2})\s+/g)];
  const chapterMarkers=markers.filter(m=>Number(m[1])===chapter);
  const verses=chapterMarkers.map(m=>{const idx=markers.indexOf(m),next=markers[idx+1];const start=(m.index||0)+m[0].length,end=next?.index??baruchText.length;return {verse:Number(m[2]),text:baruchText.slice(start,end).replace(/\s+/g,' ').trim()}}).filter(v=>v.verse>0&&v.text);
  if(!verses.length||verses[0]?.verse!==1||verses.some((v,i)=>i>0&&v.verse<=verses[i-1].verse))throw new Error(`Incomplete 4 Baruch chapter ${chapter}`);
  baruchCache.set(chapter,verses);return verses;
}
const ok=(res,p)=>res.status(200).json(p);const fail=(res,status,error)=>res.status(status).json({error});
export default async function handler(req,res){
  if(req.method!=='GET')return fail(res,405,'Method not allowed');
  const book=String(req.query.book||'').trim(),chapter=Number(req.query.chapter);
  if(!book||!Number.isInteger(chapter)||chapter<1)return fail(res,400,'Invalid book or chapter');
  try{
    if(book==='2 Enoch (Secrets of Enoch)'){
      if(chapter>68)return fail(res,404,'Chapter not available');
      return ok(res,{book,chapter,translation:'Morfill/Charles · public-domain edition via Wikisource',source:'Wikisource',verses:await enoch2Chapter(chapter)});
    }
    if(book==='1 Clement'){
      if(chapter>65)return fail(res,404,'Chapter not available');
      return ok(res,{book,chapter,translation:'J. B. Lightfoot · public-domain translation via Wikisource',source:'Wikisource',verses:await clementChapter(chapter)});
    }
    if(book==='4 Baruch (Paralipomena of Jeremiah)'){
      if(chapter>9)return fail(res,404,'Chapter not available');
      return ok(res,{book,chapter,translation:'Public-domain English translation via CCAT',source:'UPenn CCAT',verses:await baruch4Chapter(chapter)});
    }
    return fail(res,404,'No secondary reader source for this book');
  }catch(err){console.error('Expanded reader error',book,chapter,err);return fail(res,502,err?.message||'Expanded reader source unavailable')}
}
