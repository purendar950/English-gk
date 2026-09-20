const TOPICS=[
["vocabulary","Vocabulary","Word meanings, usage & SSC vocabulary"],["synonyms","Synonyms","Similar meaning words"],["antonyms","Antonyms","Opposite meaning words"],["idioms","Idioms & Phrases","Meaning and usage"],["one-word-substitution","One Word Substitution","Replace phrases with one word"],["spelling","Spelling","Correctly spelt words"],["error-detection","Error Detection","Grammar error identification"],["sentence-improvement","Sentence Improvement","Improve the underlined part"],["fill-blanks","Fill in the Blanks","Context-based grammar & vocabulary"],["cloze-test","Cloze Test","Passage-based questions"],["active-passive","Active & Passive Voice","Voice transformation"],["narration","Direct & Indirect Speech","Narration transformation"],["miscellaneous","Miscellaneous","Mixed SSC English questions"]
];

const state={questions:[],pool:[],index:0,answers:[],started:0,topic:"all",timer:null};
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

async function load(){
  $("totalQ").textContent="…";
  let all=[];
  for(const [id,name] of TOPICS){
    try{
      const r=await fetch("./data/"+id+".json?v="+Date.now(),{cache:"no-store"});
      if(!r.ok) throw new Error("HTTP "+r.status);
      const d=await r.json();
      const list=Array.isArray(d)?d:(d.questions||[]);
      list.filter(q=>q&&Array.isArray(q.options)&&q.options.length>1).forEach(q=>all.push({...q,topic:id,topicName:name}));
    }catch(e){console.warn("Could not load",id,e)}
  }
  state.questions=all;
  $("totalQ").textContent=all.length;
  renderTopics();
  updateStats();
}

function renderTopics(){
  $("topics").innerHTML=TOPICS.map(([id,n,d])=>{
    const count=state.questions.filter(q=>q.topic===id).length;
    return `<button class="topic" data-topic="${id}"><b>${n}</b><small>${d} • ${count} questions</small></button>`;
  }).join("");
  document.querySelectorAll(".topic").forEach(x=>x.onclick=()=>start(x.dataset.topic));
}

function updateStats(){
  const a=JSON.parse(localStorage.getItem("egk_history")||"[]");
  const att=a.length,correct=a.filter(x=>x.correct).length;
  $("attempted").textContent=att;
  $("accuracy").textContent=att?Math.round(correct/att*100)+"%":"0%";
}

function show(id){
  document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));
  $(`#${id}`).classList.add("active");
}

function start(topic="all"){
  let p=topic==="all"?state.questions.filter(Boolean):state.questions.filter(q=>q.topic===topic);
  p=p.slice().sort(()=>Math.random()-.5).slice(0,20);
  if(!p.length){alert("No questions are loaded for this topic yet.");return}
  clearInterval(state.timer);
  state.pool=p;state.index=0;state.answers=[];state.started=Date.now();state.topic=topic;
  show("test");renderQ();startTimer();
}

function startTimer(){
  const tick=()=>{$("timer").textContent=new Date(Date.now()-state.started).toISOString().slice(14,19)};
  tick();state.timer=setInterval(tick,1000);
}

function renderQ(){
  const q=state.pool[state.index];
  $("counter").textContent=`Question ${state.index+1} / ${state.pool.length}`;
  $("qTopic").textContent=q.topicName;
  $("question").textContent=q.question||q.q||"Question";
  const passage=q.passage?'<div class="passage">'+esc(q.passage)+'</div>':"";
  $("question").insertAdjacentHTML("beforebegin",passage);
  document.querySelectorAll(".passage").forEach((el,i)=>{if(i<document.querySelectorAll(".passage").length-1)el.remove()});
  $("options").innerHTML=(q.options||q.opts||[]).map((o,i)=>`<button class="option" data-i="${i}">${String.fromCharCode(65+i)}. ${esc(o)}</button>`).join("");
  $("feedback").textContent="";
  $("progressBar").style.width=((state.index)/state.pool.length*100)+"%";
  document.querySelectorAll(".option").forEach(b=>b.onclick=()=>answer(+b.dataset.i));
  $("next").textContent=state.index===state.pool.length-1?"Finish":"Next →";
  $("skip").disabled=false;
}

function answer(i){
  if(state.answers[state.index])return;
  const q=state.pool[state.index];
  const correct=Number(q.answer??q.correctAnswer??q.correct);
  const ok=i===correct;
  state.answers[state.index]={selected:i,correct:ok};
  document.querySelectorAll(".option").forEach((b,n)=>{
    b.disabled=true;
    if(n===correct)b.classList.add("correct");
    if(n===i&&!ok)b.classList.add("wrong");
  });
  $("feedback").textContent=ok?"Correct • +2 marks":"Incorrect • -0.5 marks";
  localStorage.setItem("egk_last_question",JSON.stringify(q));
  const h=JSON.parse(localStorage.getItem("egk_history")||"[]");
  h.push({correct:ok,ts:Date.now()});
  localStorage.setItem("egk_history",JSON.stringify(h));
  updateStats();
}

$("next").onclick=()=>{if(state.index===state.pool.length-1)finish();else{state.index++;renderQ()}};
$("skip").onclick=()=>{state.index===state.pool.length-1?finish():(state.index++,renderQ())};
$("startAll").onclick=()=>start("all");
$("backHome").onclick=()=>{clearInterval(state.timer);show("home")};
$("again").onclick=()=>start("all");
$("themeBtn").onclick=()=>{document.body.classList.toggle("light");localStorage.setItem("egk_theme",document.body.classList.contains("light")?"light":"dark")};
if(localStorage.getItem("egk_theme")==="light")document.body.classList.add("light");

function finish(){
  clearInterval(state.timer);
  const score=state.answers.reduce((s,a)=>s+(a?.correct?2:a?-0.5:0),0);
  $("score").textContent=score.toFixed(2);
  $("resultMeta").textContent=`${state.answers.filter(Boolean).length}/${state.pool.length} attempted • Time ${Math.round((Date.now()-state.started)/1000)} sec`;
  $("review").innerHTML=state.pool.map((q,i)=>`<div><b>Q${i+1}</b> — ${esc(q.question||q.q||"")}</div>`).join("");
  show("result");
}

load();