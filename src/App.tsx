import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Home, NotebookPen, Search, Sparkles } from 'lucide-react';

type Verse={verse:number;text:string};
type JournalEntry={id:string;title:string;body:string;created:string};
type Tab='home'|'bible'|'journal';

const books=[
  ['Genesis',50],['Exodus',40],['Leviticus',27],['Numbers',36],['Deuteronomy',34],['Joshua',24],['Judges',21],['Ruth',4],['1 Samuel',31],['2 Samuel',24],['1 Kings',22],['2 Kings',25],['1 Chronicles',29],['2 Chronicles',36],['Ezra',10],['Nehemiah',13],['Esther',10],['Job',42],['Psalms',150],['Proverbs',31],['Ecclesiastes',12],['Song of Songs',8],['Isaiah',66],['Jeremiah',52],['Lamentations',5],['Ezekiel',48],['Daniel',12],['Hosea',14],['Joel',3],['Amos',9],['Obadiah',1],['Jonah',4],['Micah',7],['Nahum',3],['Habakkuk',3],['Zephaniah',3],['Haggai',2],['Zechariah',14],['Malachi',4],['Matthew',28],['Mark',16],['Luke',24],['John',21],['Acts',28],['Romans',16],['1 Corinthians',16],['2 Corinthians',13],['Galatians',6],['Ephesians',6],['Philippians',4],['Colossians',4],['1 Thessalonians',5],['2 Thessalonians',3],['1 Timothy',6],['2 Timothy',4],['Titus',3],['Philemon',1],['Hebrews',13],['James',5],['1 Peter',5],['2 Peter',3],['1 John',5],['2 John',1],['3 John',1],['Jude',1],['Revelation',22]
] as const;

const daily=[['Psalm 119:105','Your word is a lamp to my feet and a light to my path.'],['Proverbs 3:5','Trust in Yahweh with all your heart, and don’t lean on your own understanding.'],['Philippians 4:13','I can do all things through Christ, who strengthens me.'],['Isaiah 41:10','Don’t you be afraid, for I am with you. Don’t be dismayed, for I am your God.']];

export default function App(){
  const [tab,setTab]=useState<Tab>('home');
  const [book,setBook]=useState('John');
  const [chapter,setChapter]=useState(1);
  const [verses,setVerses]=useState<Verse[]>([]);
  const [loading,setLoading]=useState(false);
  const [query,setQuery]=useState('');
  const [title,setTitle]=useState('');
  const [body,setBody]=useState('');
  const [entries,setEntries]=useState<JournalEntry[]>(()=>{try{return JSON.parse(localStorage.getItem('ww-journal')||'[]')}catch{return[]}});
  const dailyVerse=useMemo(()=>daily[new Date().getDate()%daily.length],[]);
  const chapterCount=Number(books.find(([b])=>b===book)?.[1]||1);

  useEffect(()=>{if(tab!=='bible')return;setLoading(true);setVerses([]);fetch(`https://bible-api.com/${encodeURIComponent(book)}%20${chapter}?translation=web`).then(r=>r.json()).then(d=>setVerses((d.verses||[]).map((v:any)=>({verse:Number(v.verse),text:String(v.text||'').trim()})))).catch(()=>setVerses([])).finally(()=>setLoading(false))},[book,chapter,tab]);
  useEffect(()=>localStorage.setItem('ww-journal',JSON.stringify(entries)),[entries]);

  const saveEntry=()=>{if(!title.trim()&&!body.trim())return;setEntries([{id:crypto.randomUUID(),title:title.trim()||'Untitled reflection',body:body.trim(),created:new Date().toISOString()},...entries]);setTitle('');setBody('')};
  const filteredBooks=books.filter(([name])=>name.toLowerCase().includes(query.toLowerCase()));

  return <div className="app-shell">
    <header className="topbar"><div className="brand"><div className="mark"><span>W</span><b>5</b><span>A</span></div><div><small>WORD & WISDOM</small><strong>Read · Study · Pray</strong></div></div><button className="ghost" onClick={()=>setTab('bible')}><Search size={18}/>Study</button></header>

    <main>
      {tab==='home'&&<>
        <section className="hero"><span className="eyebrow">A W5A PROJECT</span><h1>Begin in the Word.</h1><p>A focused Bible study space for Scripture, daily reflection and private journaling.</p><button className="primary" onClick={()=>setTab('bible')}><BookOpen size={18}/>Open Bible</button></section>
        <section className="daily"><Sparkles/><div><small>DAILY SCRIPTURE</small><h2>{dailyVerse[0]}</h2><p>“{dailyVerse[1]}”</p></div></section>
        <div className="cards"><button onClick={()=>setTab('bible')}><BookOpen/><strong>Bible reader</strong><span>Read chapter by chapter</span></button><button onClick={()=>setTab('journal')}><NotebookPen/><strong>Private journal</strong><span>Keep reflections on this device</span></button></div>
      </>}

      {tab==='bible'&&<section className="reader-layout">
        <aside className="library"><h2>Books</h2><input placeholder="Find a book" value={query} onChange={e=>setQuery(e.target.value)}/><div className="book-list">{filteredBooks.map(([name])=><button className={book===name?'active':''} key={name} onClick={()=>{setBook(name);setChapter(1)}}>{name}</button>)}</div></aside>
        <article className="reader"><div className="reader-head"><div><small>WORLD ENGLISH BIBLE</small><h1>{book} {chapter}</h1></div><div className="chapter-controls"><button disabled={chapter<=1} onClick={()=>setChapter(c=>c-1)}>‹</button><select value={chapter} onChange={e=>setChapter(Number(e.target.value))}>{Array.from({length:chapterCount},(_,i)=><option key={i+1}>{i+1}</option>)}</select><button disabled={chapter>=chapterCount} onClick={()=>setChapter(c=>c+1)}>›</button></div></div>{loading&&<p className="muted">Loading Scripture…</p>}{!loading&&!verses.length&&<p className="muted">This chapter could not be loaded. Please check your connection and try again.</p>}<div className="verses">{verses.map(v=><p key={v.verse}><sup>{v.verse}</sup>{v.text}</p>)}</div></article>
      </section>}

      {tab==='journal'&&<section className="journal"><div><small>PRIVATE JOURNAL</small><h1>Write what stood out.</h1><p>Your entries are currently stored only in this browser.</p></div><div className="journal-form"><input placeholder="Title or Scripture reference" value={title} onChange={e=>setTitle(e.target.value)}/><textarea placeholder="Write your reflection, prayer or study note…" value={body} onChange={e=>setBody(e.target.value)}/><button className="primary" onClick={saveEntry}><NotebookPen size={18}/>Save entry</button></div><div className="entries">{entries.length===0?<p className="muted">No journal entries yet.</p>:entries.map(e=><article key={e.id}><small>{new Date(e.created).toLocaleDateString()}</small><h3>{e.title}</h3><p>{e.body}</p><button onClick={()=>setEntries(entries.filter(x=>x.id!==e.id))}>Delete</button></article>)}</div></section>}
    </main>

    <nav className="bottom-nav"><button className={tab==='home'?'active':''} onClick={()=>setTab('home')}><Home/><span>Home</span></button><button className={tab==='bible'?'active':''} onClick={()=>setTab('bible')}><BookOpen/><span>Bible</span></button><button className={tab==='journal'?'active':''} onClick={()=>setTab('journal')}><NotebookPen/><span>Journal</span></button></nav>
  </div>
}
