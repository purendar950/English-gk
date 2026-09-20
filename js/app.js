const TOPICS=[["reading-comprehension","Reading Comprehension","Passage-based comprehension questions",764],["spelling-check","Spelling Check","Correct spelling questions",523],["active-passive-voice","Active Passive Voice","Voice transformation",520],["direct-indirect-narration","Direct Indirect (Narration)","Narration transformation",419],["para-jumbles","Para Jumbles","Paragraph ordering",398],["one-word-substitution","One Word Substitution","Replace phrases with one word",396],["fill-in-the-blanks","Fill in the Blanks","Context-based grammar and vocabulary",353],["antonym","Antonym","Opposite meaning words",349],["sentence-improvement","Sentence Improvement","Improve the sentence",343],["spotting-errors","Spotting Errors","Find grammar errors",341],["idioms-and-phrases","Idioms and Phrases","Meaning and usage",322],["synonym","Synonym","Similar meaning words",294],["cloze-test","Cloze Test","Passage-based cloze questions",238],["homophones-and-homonyms","Homophones and Homonyms","Confusing sound-alike words",214],["sentence-rearrangement","Sentence Rearrangement","Rearrange sentences",80],["phrasal-verbs","Phrasal Verbs","Verb + particle expressions",43],["sentence-completion","Sentence Completion","Complete the sentence",25],["confusing-words","Confusing Words","Commonly confused words",16],["word-usage","Word Usage","Correct word usage",12],["miscellaneous","Miscellaneous","Mixed English questions",9]];
const state={questions:[],pool:[],index:0,answers:[],started:0,topic:"all",timer:null};
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function normalize(q,topic,name){
  const rawOpts=Array.isArray(q.options)?q.options:(Array.isArray(q.o)?q.o.map(x=>x?.h??x):[]);
  let answer=Number(q.answer);
  if(!Number.isFinite(answer) && typeof q.ans==="string"){
    const m=q.ans.match(/^([A-Z])/i); if(m) answer=m[1].toUpperCase().charCodeAt(0)-65;
  }
  return {...q,question:q.question??q.q??"",options:rawOpts,answer:Number.isFinite(answer)?answer:0,explanation:q.explanation??q.s??"",passage:q.passage??"",topic,topicName};
}
async function load(){
  const total=$("#totalQ"); total.textContent="Loading…"; const all=[];
  await Promise.all(TOPICS.map(async([id,name,count,file])=>{
    try{
      let r=await fetch("./data/source/"+file+".json?v="+Date.now(),{cache:"no-store"});
      if(!r.ok) r=await fetch("./data/"+file+".json?v="+Date.now(),{cache:"no-store"});
      if(!r.ok) throw new Error("HTTP "+r.status);
      const d=await r.json();
      const list=Array.isArray(d)?d:(Array.isArray(d.questions)?d.questions:[]);
      list.filter(q=>q&&((Array.isArray(q.options)&&q.options.length>1)||(Array.isArray(q.o)&&q.o.length>1)))
        .forEach(q=>all.push(normalize(q,id,name)));
    }catch(e){console.error("Question file failed:",file,e);}
  }));
  state.questions=all; total.textContent=all.length.toLocaleString(); renderTopics(); updateStats();
}
function renderTopics(){
  $("#topics").innerHTML=TOPICS.map(([id,n,count])=>{
    const loaded=state.questions.filter(q=>q.topic===id).length;
    return `<button class="topic" data-topic="${id}"><b>${n}</b><small>${loaded.toLocaleString()} / ${count.toLocaleString()} questions</small></button>`;
  }).join("");
  document.querySelectorAll(".topic").forEach(x=>x.onclick=()=>start(x.dataset.topic));
}
function updateStats(){const a=JSON.parse(localStorage.getItem("egk_history")||"[]");const att=a.length,correct=a.filter(x=>x.correct).length;$("#attempted").textContent=att;$("#accuracy").textContent=att?Math.round(correct/att*100)+"%":"0%";}
function show(id){document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));$("#"+id).classList.add("active");}
function start(topic="all"){
  let p=topic==="all"?[...state.questions]:state.questions.filter(q=>q.topic===topic);
  p=p.sort(()=>Math.random()-.5).slice(0,20);
  if(!p.length){alert("This topic is not loaded yet.");return;}
  clearInterval(state.timer);state.pool=p;state.index=0;state.answers=[];state.started=Date.now();state.topic=topic;show("test");renderQ();startTimer();
}
function startTimer(){const tick=()=>$("#timer").textContent=new Date(Date.now()-state.started).toISOString().slice(14,19);tick();state.timer=setInterval(tick,1000);}
function renderQ(){
 const q=state.pool[state.index];$("#counter").textContent=`Question ${state.index+1} / ${state.pool.length}`;$("#qTopic").textContent=q.topicName;
 $("#question").innerHTML=q.question||"Question";$("#passage").innerHTML=q.passage||"";$("#passage").hidden=!q.passage;
 $("#options").innerHTML=q.options.map((o,i)=>`<button class="option" data-i="${i}">${String.fromCharCode(65+i)}. <span>${o}</span></button>`).join("");
 $("#feedback").textContent="";$("#progressBar").style.width=(state.index/state.pool.length*100)+"%";
 document.querySelectorAll(".option").forEach(b=>b.onclick=()=>answer(+b.dataset.i));$("#next").textContent=state.index===state.pool.length-1?"Finish":"Next →";
}
function answer(i){
 if(state.answers[state.index])return;const q=state.pool[state.index],correct=Number(q.answer),ok=i===correct;state.answers[state.index]={selected:i,correct:ok};
 document.querySelectorAll(".option").forEach((b,n)=>{b.disabled=true;if(n===correct)b.classList.add("correct");if(n===i&&!ok)b.classList.add("wrong")});
 $("#feedback").textContent=ok?"Correct • +2 marks":"Incorrect • -0.5 marks";
 const h=JSON.parse(localStorage.getItem("egk_history")||"[]");h.push({correct:ok,ts:Date.now()});localStorage.setItem("egk_history",JSON.stringify(h));updateStats();
}
$("#next").onclick=()=>{if(state.index===state.pool.length-1)finish();else{state.index++;renderQ();}};
$("#skip").onclick=()=>{if(state.index===state.pool.length-1)finish();else{state.index++;renderQ();}};
$("#startAll").onclick=()=>start("all");$("#backHome").onclick=()=>{clearInterval(state.timer);show("home")};$("#again").onclick=()=>start("all");
$("#themeBtn").onclick=()=>{document.body.classList.toggle("light");localStorage.setItem("egk_theme",document.body.classList.contains("light")?"light":"dark")};
if(localStorage.getItem("egk_theme")==="light")document.body.classList.add("light");
function finish(){clearInterval(state.timer);const score=state.answers.reduce((s,a)=>s+(a?.correct?2:a?-0.5:0),0);$("#score").textContent=score.toFixed(2);$("#resultMeta").textContent=`${state.answers.filter(Boolean).length}/${state.pool.length} attempted • Time ${Math.round((Date.now()-state.started)/1000)} sec`;$("#review").innerHTML=state.pool.map((q,i)=>`<div><b>Q${i+1}</b> — ${esc(q.question)}</div>`).join("");show("result");}
load();