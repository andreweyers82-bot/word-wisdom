import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Home, NotebookPen, Search, Sparkles } from 'lucide-react';
import { library, loaded, bookReaderStatus, type BookInfo, type Verse } from './expandedScripture';

type JournalEntry={id:string;title:string;body:string;created:string};
type Tab='home'|'bible'|'journal';
type Collection='standard'|'ethiopian'|'expanded88';
type BibleResponse={translation?:string;source?:string;license?:string;verses?:Verse[];error?:string};

const daily=[['Psalm 119:105','Your word is a lamp to my feet and a light to my path.'],['Proverbs 3:5','Trust in Yahweh with all your heart, and don’t lean on your own understanding.'],['Philippians 4:13','I can do all things through Christ, who strengthens me.'],['Isaiah 41:10','Don’t you be afraid, for I am with you. Don’t be dismayed, for I am your God.']];

const standardBookNames=['Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Songs','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation'];
const standardNames=new Set(standardBookNames);
const ethiopianNames=new Set([...standardBookNames,'1 Enoch','Jubilees','1 Meqabyan','2 Meqabyan','3 Meqabyan','Prayer of Manasseh','2 Esdras (Ezra Sutuel)','Baruch','Letter of Jeremiah','4 Baruch (Paralipomena of Jeremiah)','Prayer of Azariah / Song of the Three Holy Children','Susanna','Bel and the Dragon','Wisdom','Sirach']);

function booksFor(collection:Collection){
  if(collection==='standard') return library.filter(b=>standardNames.has(b.name));
  if(collection==='ethiopian') return library.filter(b=>ethiopianNames.has(b.name));
  return library;
}

const collectionLabel=(collection:Collection)=>collection==='standard'?'Standard Bible':collection==='ethiopian'?'Ethiopian study view':'Expanded study collection';

async function fetchReader(book:string,chapter:number,signal:AbortSignal):Promise<BibleResponse>{
  const endpoints=['/api/bible','/api/expanded'];
  let lastError='Reader source unavailable';
  for(const endpoint of endpoints){
    const r=await fetch(`${endpoint}?book=${encodeURIComponent(book)}&chapter=${chapter}`,{signal});
    const data:BibleResponse=await r.json().catch(()=>({error:'Reader source unavailable'}));
    if(r.ok)return data;
    lastError=data.error||lastError;
    if(r.status!==404&&r.status!==409&&r.status!==502)break;
  }
  throw new Error(lastError);
}

export default function App(){
  const [tab,setTab]=useState<Tab>('home');
  const [collection,setCollection]=useState<Collection>('expanded88');
  const [book,setBook]=useState('John');
  const [chapter,setChapter]=useState(1);
  const [verses,setVerses]=useState<Verse[]>([]);
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState('');
  const [source,setSource]=useState('');
  const [translation,setTranslation]=useState('World English Bible');
  const [query,setQuery]=useState('');
  const [title,setTitle]=useState('');
  const [body,setBody]=useState('');
  const [entries,setEntries]=useState<JournalEntry[]>(()=>{try{return JSON.parse(localStorage.getItem('ww-journal')||'[]')}catch{return[]}});
  const dailyVerse=useMemo(()=>daily[new Date().getDate()%daily.length],[]);
  const visibleBooks=useMemo(()=>booksFor(collection),[collection]);
  const info:BookInfo=library.find(b=>b.name===book)||library[0];
  const chapterCount=info.chapters;
  const isExpanded=!standardNames.has(book);

  useEffect(()=>{
    if(!visibleBooks.some(b=>b.name===book)){setBook(visibleBooks[0]?.name||'Genesis');setChapter(1)}
  },[collection,book,visibleBooks]);

  useEffect(()=>{
    if(tab!=='bible')return;
    const controller=new AbortController();
    setLoading(true);setVerses([]);setMessage('');setSource('');
    const builtIn=loaded[`${book}:${chapter}`]||[];
    fetchReader(book,chapter,controller.signal)
      .then(data=>{
        const next=data.verses||[];
        setVerses(next);
        setTranslation(data.translation||(isExpanded?'Expanded Scripture source':'World English Bible'));
        setSource([data.source,data.license].filter(Boolean).join(' · '));
        if(!next.length)setMessage('This chapter did not return readable verse text.');
      })
      .catch(err=>{
        if(controller.signal.aborted)return;
        if(builtIn.length){
          setVerses(builtIn);
          setTranslation('Word & Wisdom saved verified text');
          setMessage(`${err.message}. Showing the verified text saved in the app for this chapter.`);
        }else{
          setMessage(`${err.message}. The book and chapter remain listed, but Word & Wisdom will not invent or substitute text.`);
        }
      })
      .finally(()=>{if(!controller.signal.aborted)setLoading(false)});
    return()=>controller.abort();
  },[book,chapter,tab,isExpanded]);

  useEffect(()=>localStorage.setItem('ww-journal',JSON.stringify(entries)),[entries]);
  const saveEntry=()=>{if(!title.trim()&&!body.trim())return;setEntries([{id:crypto.randomUUID(),title:title.trim()||'Untitled reflection',body:body.trim(),created:new Date().toISOString()},...entries]);setTitle('');setBody('')};
  const filteredBooks=visibleBooks.filter(b=>b.name.toLowerCase().includes(query.toLowerCase()));
  const groupedBooks=useMemo(()=>{
    const groups=new Map<string,BookInfo[]>();
    filteredBooks.forEach(b=>groups.set(b.group,[...(groups.get(b.group)||[]),b]));
    return Array.from(groups.entries());
  },[filteredBooks]);

  return <div className="app-shell">
    <header className="topbar"><div className="brand"><div className="mark"><span>W</span><b>5</b><span>A</span></div><div><small>WORD & WISDOM</small><strong>Read · Study · Pray</strong></div></div><button className="ghost" onClick={()=>setTab('bible')}><Search size={18}/>Study</button></header>
    <main>
      {tab==='home'&&<>
        <section className="hero"><span className="eyebrow">A W5A PROJECT</span><h1>Begin in the Word.</h1><p>A focused Bible study space with the standard 66-book Bible, an Ethiopian study view and the complete Word & Wisdom 88-book expanded study index.</p><button className="primary" onClick={()=>setTab('bible')}><BookOpen size={18}/>Open Bible</button></section>
        <section className="daily"><Sparkles/><div><small>DAILY SCRIPTURE</small><h2>{dailyVerse[0]}</h2><p>“{dailyVerse[1]}”</p></div></section>
        <div className="cards"><button onClick={()=>setTab('bible')}><BookOpen/><strong>Bible reader</strong><span>66 Books · Ethiopian · 88 Books</span></button><button onClick={()=>setTab('journal')}><NotebookPen/><strong>Private journal</strong><span>Keep reflections on this device</span></button></div>
      </>}
      {tab==='bible'&&<section className="reader-layout">
        <aside className="library"><h2>Books</h2><div className="canon-switch"><button className={collection==='standard'?'active':''} onClick={()=>setCollection('standard')}>66 Books</button><button className={collection==='ethiopian'?'active':''} onClick={()=>setCollection('ethiopian')}>Ethiopian</button><button className={collection==='expanded88'?'active':''} onClick={()=>setCollection('expanded88')}>88 Books</button></div><div className="library-meta"><span>{visibleBooks.length} books</span><span>{collectionLabel(collection)}</span></div><input placeholder="Find a book" value={query} onChange={e=>setQuery(e.target.value)}/><div className="book-list">{groupedBooks.map(([group,items])=><section className="book-group" key={group}><h3>{group}</h3><div className="book-group-books">{items.map(b=><button className={book===b.name?'active':''} key={b.name} onClick={()=>{setBook(b.name);setChapter(1)}}>{b.name}{!standardNames.has(b.name)&&<small>{b.group}</small>}</button>)}</div></section>)}</div></aside>
        <article className="reader"><div className="reader-head"><div><small>{collection==='expanded88'?'WORD & WISDOM · 88-BOOK EXPANDED STUDY COLLECTION':collection==='ethiopian'?'ETHIOPIAN STUDY COLLECTION':'SCRIPTURE READER'}</small><h1>{book} {chapter}</h1><span className="source-status">{translation}</span>{source&&<span className="source-status">{source}</span>}{isExpanded&&<span className="source-status">{bookReaderStatus(info)}</span>}</div><div className="chapter-controls"><button disabled={chapter<=1} onClick={()=>setChapter(c=>c-1)}>‹</button><select value={chapter} onChange={e=>setChapter(Number(e.target.value))}>{Array.from({length:chapterCount},(_,i)=><option key={i+1}>{i+1}</option>)}</select><button disabled={chapter>=chapterCount} onClick={()=>setChapter(c=>c+1)}>›</button></div></div>{loading&&<p className="muted">Loading Scripture…</p>}{message&&<p className="reader-note">{message}</p>}<div className="verses">{verses.map(v=><p key={v.verse}><sup>{v.verse}</sup>{v.text}</p>)}</div>{isExpanded&&<p className="source-disclaimer">The 88-book view mirrors the supplied AppDeploy Word & Wisdom index. It is an expanded study collection and is not presented as an official denominational canon count. Expanded texts are clearly source-labelled; missing chapters are never invented or silently replaced.</p>}</article>
      </section>}
      {tab==='journal'&&<section className="journal"><div><small>PRIVATE JOURNAL</small><h1>Write what stood out.</h1><p>Your entries are currently stored only in this browser.</p></div><div className="journal-form"><input placeholder="Title or Scripture reference" value={title} onChange={e=>setTitle(e.target.value)}/><textarea placeholder="Write your reflection, prayer or study note…" value={body} onChange={e=>setBody(e.target.value)}/><button className="primary" onClick={saveEntry}><NotebookPen size={18}/>Save entry</button></div><div className="entries">{entries.length===0?<p className="muted">No journal entries yet.</p>:entries.map(e=><article key={e.id}><small>{new Date(e.created).toLocaleDateString()}</small><h3>{e.title}</h3><p>{e.body}</p><button onClick={()=>setEntries(entries.filter(x=>x.id!==e.id))}>Delete</button></article>)}</div></section>}
    </main>
    <nav className="bottom-nav"><button className={tab==='home'?'active':''} onClick={()=>setTab('home')}><Home/><span>Home</span></button><button className={tab==='bible'?'active':''} onClick={()=>setTab('bible')}><BookOpen/><span>Bible</span></button><button className={tab==='journal'?'active':''} onClick={()=>setTab('journal')}><NotebookPen/><span>Journal</span></button></nav>
  </div>
}
