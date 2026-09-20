const TOPIC_ICONS=["▥","ABC","⇄","☁","✣","A","✎","↝","☷","⌕","❝","▤","▤","◉","⤢","➤","✓","?","💡","⚙"];const TOPICS=[["reading-comprehension","Reading Comprehension",764,"reading-comprehension"],["spelling-check","Spelling Check",523,"spelling-check"],["active-passive-voice","Active Passive Voice",520,"active-passive-voice"],["direct-indirect-narration","Direct Indirect (Narration)",419,"direct-indirect-narration"],["para-jumbles","Para Jumbles",398,"para-jumbles"],["one-word-substitution","One Word Substitution",396,"one-word-substitution"],["fill-in-the-blanks","Fill in the Blanks",353,"fill-in-the-blanks"],["antonym","Antonym",349,"antonym"],["sentence-improvement","Sentence Improvement",343,"sentence-improvement"],["spotting-errors","Spotting Errors",341,"spotting-errors"],["idioms-and-phrases","Idioms and Phrases",322,"idioms-and-phrases"],["synonym","Synonym",294,"synonym"],["cloze-test","Cloze Test",238,"cloze-test"],["homophones-and-homonyms","Homophones and Homonyms",214,"homophones-and-homonyms"],["sentence-rearrangement","Sentence Rearrangement",80,"sentence-rearrangement"],["phrasal-verbs","Phrasal Verbs",43,"phrasal-verbs"],["sentence-completion","Sentence Completion",25,"sentence-completion"],["confusing-words","Confusing Words",16,"confusing-words"],["word-usage","Word Usage",12,"word-usage"],["miscellaneous","Miscellaneous",9,"miscellaneous"]];
const AI_PROVIDERS={pollinations:{name:"Pollinations AI",baseUrl:"https://gen.pollinations.ai/v1",models:["kimi","openai","claude","gemini"]},openai:{name:"OpenAI",baseUrl:"https://api.openai.com/v1",models:["gpt-5.4","gpt-5.4-mini","gpt-5.3"]},gemini:{name:"Google Gemini",baseUrl:"https://generativelanguage.googleapis.com/v1beta/openai",models:["gemini-3.8-flash","gemini-3.7-flash","gemini-3.6-flash","gemini-3.5-flash","gemini-2.5-flash","gemini-2.5-pro"]},groq:{name:"Groq",baseUrl:"https://api.groq.com/openai/v1",models:["openai/gpt-oss-120b","openai/gpt-oss-20b","llama-3.3-70b-versatile","llama-3.1-8b-instant"]},openrouter:{name:"OpenRouter",baseUrl:"https://openrouter.ai/api/v1",models:["openai/gpt-5.4","google/gemini-2.5-flash","anthropic/claude-sonnet-4","deepseek/deepseek-v4"]},deepseek:{name:"DeepSeek",baseUrl:"https://api.deepseek.com",models:["deepseek-flash","deepseek-v4-pro"]},mistral:{name:"Mistral AI",baseUrl:"https://api.mistral.ai/v1",models:["mistral-large-latest","mistral-medium-latest","mistral-small-latest"]},together:{name:"Together AI",baseUrl:"https://api.together.xyz/v1",models:["openai/gpt-oss-120b","openai/gpt-oss-20b"]},custom:{name:"Custom OpenAI-compatible",baseUrl:"",models:[]}};const KEY="english_gk_progress_v3",ACTIVEKEY="english_gk_active_topic_v1",AIKEY="english_gk_ai_v1",AISOLUTIONKEY="english_gk_ai_notes_v1",BOOKMARKKEY="english_gk_bookmarks_v1",MISTAKEKEY="english_gk_mistakes_v1",RESULTKEY="english_gk_results_v1",state={questions:[],pool:[],index:0,answers:[],started:0,topic:"all",timer:null,examMode:false,expiresAt:0,resultFilter:"all"};
const $=s=>document.querySelector(s),esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])),strip=s=>String(s??"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
function normalize(q,topic,name){const o=Array.isArray(q.options)?q.options:(Array.isArray(q.o)?q.o.map(x=>x?.h??x):[]);let a=Number(q.answer);if(!Number.isFinite(a)&&typeof q.ans==="string"){const m=q.ans.match(/^([A-Z])/i);if(m)a=m[1].toUpperCase().charCodeAt(0)-65}let question=q.question??q.q??"",passage=q.passage??"";if(topic==="reading-comprehension"&&/<[^>]+>/.test(String(question))){const box=String(question).match(/<div[^>]*class=["'][^"']*q-context-preview[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);const pq=String(question).match(/<p[^>]*>([\s\S]*?)<\/p>/i);if(box)passage=box[1];if(pq)question=pq[1];else if(box)question=String(question).replace(box[0],"").replace(/<[^>]*>/g," ").trim()}return {...q,question,options:o,answer:Number.isFinite(a)?a:0,explanation:q.explanation??q.s??"",passage,topic,topicName:name}}
async function load(){const all=[];$("#totalQ").textContent="Loading…";await Promise.all(TOPICS.map(async([id,name,,file])=>{try{let r=await fetch("./data/source/"+file+".json?v="+Date.now(),{cache:"no-store"});if(!r.ok)r=await fetch("./data/"+file+".json?v="+Date.now(),{cache:"no-store"});if(!r.ok)throw Error(r.status);const d=await r.json(),list=Array.isArray(d)?d:(Array.isArray(d.questions)?d.questions:[]);list.filter(q=>q&&Array.isArray(q.options||q.o)).forEach(q=>all.push(normalize(q,id,name)))}catch(e){console.warn(file,e)}}));state.questions=all;$("#totalQ").textContent=all.length.toLocaleString();renderTopics();updateStats();updateResumeUI()}
function renderTopics(){$("#topics").innerHTML=TOPICS.map(([id,n,count],i)=>{const loaded=state.questions.filter(q=>q.topic===id).length;const pct=count?Math.min(100,Math.round(loaded/count*100)):0;return "<button class=\"topic\" data-topic=\""+id+"\"><div class=\"topicIcon\">"+TOPIC_ICONS[i%TOPIC_ICONS.length]+"</div><div class=\"topicInfo\"><b>"+n+"</b><small>"+loaded.toLocaleString()+" / "+count.toLocaleString()+" questions</small><i><span style=\"width:"+pct+"%\"></span></i></div><strong class=\"topicArrow\">›</strong></button>"}).join("");$("#topicCount").textContent=TOPICS.length;document.querySelectorAll(".topic").forEach(x=>x.onclick=()=>start(x.dataset.topic,false))}
function updateStats(){const h=JSON.parse(localStorage.getItem("egk_history")||"[]"),a=h.length,c=h.filter(x=>x.correct).length;$("#attempted").textContent=a;$("#accuracy").textContent=a?Math.round(c/a*100)+"%":"0%"}
function show(id){document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));$("#"+id).classList.add("active");const navMap={home:"[data-home]",result:"#navResults"};document.querySelectorAll(".navItem").forEach(x=>x.classList.remove("active"));if(navMap[id])$(navMap[id]).classList.add("active");else if(id==="test"&&state.topic==="mistakes")$("#navMistakes").classList.add("active")}
function progressStore(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return {}}}
function hasProgress(topic){const s=progressStore();return !!(s[topic]&&Array.isArray(s[topic].pool)&&s[topic].pool.length)}
function bookmarkStore(){try{return JSON.parse(localStorage.getItem(BOOKMARKKEY)||"{}")}catch{return {}}}
function questionKey(q){return String(q.id||((q.topic||"all")+"::"+strip(q.question||"")))}function aiNoteStore(){try{const x=JSON.parse(localStorage.getItem(AISOLUTIONKEY)||"{}");return x&&typeof x==="object"?x:{}}catch{return {}}}function getAISavedNote(q){const s=aiNoteStore();const n=s[questionKey(q)];return n&&typeof n==="object"&&typeof n.content==="string"&&n.content.trim()?n:null}function saveAISavedNote(q,content){const s=aiNoteStore(),k=questionKey(q);s[k]={content:String(content||""),savedAt:Date.now(),provider:aiConfig().provider,model:aiConfig().model};try{localStorage.setItem(AISOLUTIONKEY,JSON.stringify(s))}catch(e){const keys=Object.keys(s).sort((x,y)=>(s[x]?.savedAt||0)-(s[y]?.savedAt||0));while(keys.length>20){delete s[keys.shift()];try{localStorage.setItem(AISOLUTIONKEY,JSON.stringify(s))}catch{break}}}}function deleteAISavedNote(q){const s=aiNoteStore(),k=questionKey(q);if(s[k]){delete s[k];localStorage.setItem(AISOLUTIONKEY,JSON.stringify(s))}renderAISolutionButton()}function renderAISolutionButton(){const b=$("#aiBtn");if(!b)return;const q=state.pool[state.index],saved=q&&getAISavedNote(q);b.textContent=saved?"AI Solution ✓ Saved":"AI Solution";b.title=saved?"Saved AI note available — no new API request needed":"Generate AI solution"}
function isBookmarked(q){const s=bookmarkStore();return !!s[questionKey(q)]}
function toggleBookmark(){const q=state.pool[state.index],s=bookmarkStore(),k=questionKey(q);if(s[k])delete s[k];else s[k]={question:k,topic:q.topic,topicName:q.topicName,questionText:q.question,options:q.options,answer:q.answer,explanation:q.explanation,passage:q.passage};localStorage.setItem(BOOKMARKKEY,JSON.stringify(s));renderBookmarkButton();renderNavigator()}
function renderBookmarkButton(){const b=$("#bookmarkBtn");if(!b)return;b.textContent=isBookmarked(state.pool[state.index])?"★ Bookmarked":"☆ Bookmark";b.classList.toggle("bookmarked",isBookmarked(state.pool[state.index]))}
function renderNavigator(){const el=$("#questionNavigator");if(!el||!state.pool.length)return;el.innerHTML=state.pool.map((q,i)=>{const a=state.answers[i],cls=i===state.index?"current":a?(a.correct?"correct":"incorrect"):"unanswered";return "<button class=\"navQ "+cls+"\" data-index=\""+i+"\">"+(i+1)+"</button>"}).join("");el.querySelectorAll(".navQ").forEach(b=>b.onclick=()=>{state.index=Number(b.dataset.index);saveProgress();renderQ()})}
function mistakeStore(){try{return JSON.parse(localStorage.getItem(MISTAKEKEY)||"{}")}catch{return {}}}
function saveMistake(q,a){const s=mistakeStore(),k=questionKey(q);s[k]={question:k,topic:q.topic,topicName:q.topicName,questionText:q.question,options:q.options,answer:q.answer,explanation:q.explanation,passage:q.passage,lastSeen:Date.now(),attempts:(s[k]?.attempts||0)+1};localStorage.setItem(MISTAKEKEY,JSON.stringify(s))}
function mistakeQuestions(){return Object.values(mistakeStore()).map(x=>normalize({id:x.question,question:x.questionText,options:x.options,answer:x.answer,explanation:x.explanation,passage:x.passage},x.topic,x.topicName)).filter(q=>Array.isArray(q.options)&&q.options.length)}
function saveMistakesFromAttempt(){state.pool.forEach((q,i)=>{const a=state.answers[i];if(a&&!a.correct)saveMistake(q,a)})}
function saveProgress(){if(!state.pool.length)return;const s=progressStore();s[state.topic]={pool:state.pool,index:state.index,answers:state.answers,started:state.started,expiresAt:state.expiresAt,examMode:state.examMode,savedAt:Date.now()};localStorage.setItem(KEY,JSON.stringify(s));localStorage.setItem(ACTIVEKEY,state.topic);updateResumeUI()}
function clearProgress(topic=state.topic){const s=progressStore();delete s[topic];localStorage.setItem(KEY,JSON.stringify(s));if(localStorage.getItem(ACTIVEKEY)===topic)localStorage.removeItem(ACTIVEKEY);updateResumeUI()}
function updateResumeUI(){const s=progressStore(),x=s.all;if(!x||!Array.isArray(x.pool)||!x.pool.length){$("#resumeBox").hidden=true;return}$("#resumeBox").hidden=false;$("#resumeInfo").textContent="All Topics • Question "+Math.min(x.index+1,x.pool.length)+" of "+x.pool.length}
function restoreSavedState(){const saved=progressStore()[state.topic];if(!saved||!Array.isArray(saved.pool)||!saved.pool.length)return false;state.pool=saved.pool.map(q=>normalize(q,q.topic||state.topic,q.topicName||TOPICS.find(t=>t[0]===(q.topic||state.topic))?.[1]||q.topic||state.topic));state.index=Math.min(Number(saved.index)||0,state.pool.length-1);state.answers=saved.answers||[];state.started=saved.started||Date.now();state.examMode=!!saved.examMode;state.expiresAt=saved.expiresAt||0;return true}function start(topic="all",resume=false,examMode=false){const saved=progressStore()[topic];if(resume||(!resume&&saved&&Array.isArray(saved.pool)&&saved.pool.length)){const x=saved;state.pool=(x.pool||[]).map(q=>normalize(q,q.topic||topic,q.topicName||TOPICS.find(t=>t[0]===(q.topic||topic))?.[1]||topic));state.index=Math.min(Number(x.index)||0,state.pool.length-1);state.answers=x.answers||[];state.started=x.started||Date.now();state.topic=topic;state.examMode=!!x.examMode||examMode;state.expiresAt=x.expiresAt||0;localStorage.setItem(ACTIVEKEY,topic)}else{let p=topic==="all"?[...state.questions]:state.questions.filter(q=>q.topic===topic);if(!p.length){alert("This topic is not loaded yet.");return}state.pool=p.sort(()=>Math.random()-.5);state.index=0;state.answers=[];state.started=Date.now();state.topic=topic;state.examMode=!!examMode;state.expiresAt=state.examMode?Date.now()+30*60*1000:0;saveProgress()}show("test");clearInterval(state.timer);renderQ();startTimer()}
function startTimer(){const tick=()=>{if(state.examMode&&state.expiresAt){const left=Math.max(0,state.expiresAt-Date.now());$("#timer").textContent="Exam "+new Date(left).toISOString().slice(11,19);if(left<=0){clearInterval(state.timer);finish();return}}else $("#timer").textContent=new Date(Math.max(0,Date.now()-state.started)).toISOString().slice(14,19)};tick();state.timer=setInterval(tick,1000)}
function renderQ(){const q=state.pool[state.index];$("#counter").textContent="Question "+(state.index+1)+" / "+state.pool.length;$("#qTopic").textContent=q.topicName;$("#question").textContent=strip(q.question)||"Question";$("#passage").innerHTML=q.passage||"";$("#passage").hidden=!q.passage;$("#options").innerHTML=q.options.map((o,i)=>"<button class=\"option\" data-i=\""+i+"\">"+String.fromCharCode(65+i)+". "+esc(strip(o))+"</button>").join("");$("#feedback").textContent="";$("#aiSolution").hidden=true;const old=state.answers[state.index];document.querySelectorAll(".option").forEach(x=>x.disabled=!!old);if(old&&!state.examMode){document.querySelectorAll(".option").forEach((x,n)=>{if(n===Number(q.answer))x.classList.add("correct");if(n===old.selected&&n!==Number(q.answer))x.classList.add("wrong")});$("#feedback").textContent=old.correct?"Correct • +2 marks":"Incorrect • -0.5 marks"}else if(!old)document.querySelectorAll(".option").forEach(x=>x.onclick=()=>answer(+x.dataset.i));$("#progressBar").style.width=(state.index/state.pool.length*100)+"%";$("#next").textContent=state.index===state.pool.length-1?"Finish":"Next →";renderBookmarkButton();renderNavigator();renderAISolutionButton();saveProgress()}function answer(i){if(state.answers[state.index])return;const q=state.pool[state.index],ok=i===Number(q.answer);state.answers[state.index]={selected:i,correct:ok};if(!state.examMode){document.querySelectorAll(".option").forEach((x,n)=>{x.disabled=true;if(n===Number(q.answer))x.classList.add("correct");if(n===i&&!ok)x.classList.add("wrong")});$("#feedback").textContent=ok?"Correct • +2 marks":"Incorrect • -0.5 marks"}else document.querySelectorAll(".option").forEach(x=>x.disabled=true);const h=JSON.parse(localStorage.getItem("egk_history")||"[]");h.push({correct:ok,ts:Date.now(),topic:q.topic});localStorage.setItem("egk_history",JSON.stringify(h));if(!ok)saveMistake(q,state.answers[state.index]);updateStats();saveProgress();renderNavigator()}
function movePrev(){if(state.index>0){state.index--;saveProgress();renderQ()}} function moveNext(){if(state.index===state.pool.length-1)finish();else{state.index++;saveProgress();renderQ()}}
function startMistakes(){const p=mistakeQuestions();if(!p.length){alert("Mistake Book is empty. Answer some questions incorrectly first.");return}state.pool=p.sort(()=>Math.random()-.5);state.index=0;state.answers=[];state.started=Date.now();state.topic="mistakes";state.examMode=false;state.expiresAt=0;saveProgress();show("test");clearInterval(state.timer);renderQ();startTimer()}function saveCompletedResult(){const total=state.pool.length,attempted=state.answers.filter(Boolean).length,correct=state.answers.filter(x=>x?.correct).length,incorrect=state.answers.filter(x=>x&&!x.correct).length,skipped=total-attempted,score=correct*2-incorrect*.5,accuracy=attempted?Math.round(correct/attempted*100):0,time=Math.round((Date.now()-state.started)/1000),topicMap={};state.pool.forEach((q,i)=>{const r=state.answers[i],id=q.topic||"miscellaneous",name=q.topicName||id;topicMap[id]??={topic:id,topicName:name,total:0,attempted:0,correct:0,incorrect:0,skipped:0};const t=topicMap[id];t.total++;if(!r)t.skipped++;else{t.attempted++;if(r.correct)t.correct++;else t.incorrect++}});const rec={id:Date.now()+"_"+Math.random().toString(36).slice(2,8),savedAt:Date.now(),topic:state.topic,topicName:state.topic==="all"?"All Topics":(state.pool[0]?.topicName||state.topic),examMode:state.examMode,total,attempted,correct,incorrect,skipped,score,accuracy,time,topics:Object.values(topicMap)};let h=[];try{h=JSON.parse(localStorage.getItem(RESULTKEY)||"[]")}catch{}h.unshift(rec);localStorage.setItem(RESULTKEY,JSON.stringify(h.slice(0,100)))}function resultStore(){try{return JSON.parse(localStorage.getItem(RESULTKEY)||"[]")}catch{return []}}function finish(){clearInterval(state.timer);saveMistakesFromAttempt();saveCompletedResult();state.resultFilter="all";renderResults();clearProgress();show("result")}
function formatTime(sec){const m=Math.floor(sec/60),s=sec%60;return String(m).padStart(2,"0")+":"+String(s).padStart(2,"0")}
function renderSavedResults(){const h=resultStore(),el=$("#savedResults");if(!el)return;if(!h.length){el.innerHTML="<div class=\"emptyReview\">No completed results saved yet.</div>";return}const latest={};h.forEach(r=>{(r.topics||[]).forEach(t=>{if(!latest[t.topic])latest[t.topic]=r})});const rows=Object.values(latest).sort((a,b)=>String(a.topicName).localeCompare(String(b.topicName))).map(r=>{const t=(r.topics||[]).find(x=>x.topic===r.topic)||r.topics?.[0];if(!t)return"";const acc=t.attempted?Math.round(t.correct/t.attempted*100):0;return "<div class=\"savedTopicRow\"><div><b>"+esc(t.topicName)+"</b><small>"+t.correct+" correct • "+t.incorrect+" incorrect • "+t.skipped+" skipped • "+t.attempted+"/"+t.total+" attempted</small></div><strong>"+acc+"%</strong><span>"+formatTime(r.time)+"</span></div>"}).join("");const recent=h.slice(0,12).map(r=>"<div class=\"savedResultRow\"><div><b>"+esc(r.topicName)+"</b><small>"+new Date(r.savedAt).toLocaleString()+" • "+(r.examMode?"Exam":"Practice")+" • "+r.total+" questions</small></div><strong>"+Number(r.score).toFixed(2)+"</strong></div>").join("");el.innerHTML="<div class=\"savedResultHead\"><div><h3>Topic-wise Saved Results</h3><span>"+h.length+" completed test"+(h.length===1?"":"s")+" saved</span></div></div><div class=\"savedTopicList\">"+rows+"</div><h3 class=\"savedRecentTitle\">Recent Tests</h3><div class=\"savedRecentList\">"+recent+"</div>"}function renderResults(){renderSavedResults();if(!state.pool.length){$("#score").textContent="—";$("#resultMeta").textContent="Saved results";$("#resultStats").innerHTML="";$("#topicAnalysis").innerHTML="";$("#review").innerHTML="";document.querySelectorAll("#resultFilters button").forEach(x=>x.classList.remove("active"));return}const total=state.pool.length,attempted=state.answers.filter(Boolean).length,correct=state.answers.filter(x=>x?.correct).length,incorrect=state.answers.filter(x=>x&&!x.correct).length,skipped=total-attempted,score=correct*2-incorrect*.5,accuracy=attempted?Math.round(correct/attempted*100):0,time=Math.round((Date.now()-state.started)/1000);$("#score").textContent=score.toFixed(2);$("#resultMeta").textContent=(state.examMode?"Exam Mode":"Practice Mode")+" • "+formatTime(time);$("#resultStats").innerHTML="<div><b>"+total+"</b><span>Total</span></div><div><b>"+attempted+"</b><span>Attempted</span></div><div class=\"good\"><b>"+correct+"</b><span>Correct</span></div><div class=\"bad\"><b>"+incorrect+"</b><span>Incorrect</span></div><div class=\"skip\"><b>"+skipped+"</b><span>Skipped</span></div><div><b>"+accuracy+"%</b><span>Accuracy</span></div>";renderTopicAnalysis();renderReview();document.querySelectorAll("#resultFilters button").forEach(x=>x.classList.toggle("active",x.dataset.filter===state.resultFilter))}
function renderTopicAnalysis(){const map={};state.pool.forEach((q,i)=>{const r=state.answers[i],t=q.topicName||q.topic;map[t]??={total:0,correct:0,incorrect:0,skipped:0};map[t].total++;if(!r)map[t].skipped++;else if(r.correct)map[t].correct++;else map[t].incorrect++});$("#topicAnalysis").innerHTML="<div class=\"topicAnalysisTitle\">Topic Performance</div>"+Object.entries(map).map(([t,x])=>{const acc=x.total-x.skipped?Math.round(x.correct/(x.total-x.skipped)*100):0;return "<div class=\"topicRow\"><div><b>"+esc(t)+"</b><small>"+x.correct+" correct • "+x.incorrect+" incorrect • "+x.skipped+" skipped</small></div><strong>"+acc+"%</strong></div>"}).join("")}
function renderReview(){const f=state.resultFilter,items=state.pool.map((q,i)=>({q,i,a:state.answers[i]})).filter(x=>f==="all"||(f==="correct"&&x.a?.correct)||(f==="incorrect"&&x.a&&!x.a.correct)||(f==="skipped"&&!x.a)||(f==="bookmarked"&&isBookmarked(x.q)));$("#review").innerHTML=items.length?items.map(({q,i,a})=>{const status=!a?"skipped":a.correct?"correct":"incorrect",your=a?strip(q.options[a.selected]):"Skipped";return "<article class=\"reviewItem "+status+"\"><div class=\"reviewTop\"><span>Q"+(i+1)+" • "+esc(q.topicName)+"</span><b>"+status.toUpperCase()+"</b><button class=\"reviewJump\" data-index=\""+i+"\">Open</button></div><h3>"+esc(strip(q.question))+"</h3><p><strong>Your answer:</strong> "+esc(your)+"</p><p><strong>Correct answer:</strong> "+esc(strip(q.options[Number(q.answer)]))+"</p><div class=\"reviewActions\"><button class=\"originalReview\" data-index=\""+i+"\">Original Solution</button><button class=\"aiReview\" data-index=\""+i+"\">AI Solution</button></div></article>"}).join(""):"<div class=\"emptyReview\">No questions match this filter.</div>";document.querySelectorAll(".reviewJump").forEach(x=>x.onclick=()=>{state.index=Number(x.dataset.index);show("test");renderQ()});document.querySelectorAll(".originalReview").forEach(x=>x.onclick=()=>{state.index=Number(x.dataset.index);showOriginalSolution()});document.querySelectorAll(".aiReview").forEach(x=>x.onclick=()=>{state.index=Number(x.dataset.index);showAISolution()})}
async function loadAIConfig(){let d={provider:"pollinations",baseUrl:"https://gen.pollinations.ai/v1",apiKey:"",model:"kimi"};try{const r=await fetch("./config/ai-config.json?v="+Date.now(),{cache:"no-store"});if(r.ok)d={...d,...await r.json()}}catch{}try{d={...d,...JSON.parse(localStorage.getItem(AIKEY)||"{}")}}catch{}return d} function aiConfig(){try{return {...{provider:"pollinations",baseUrl:"https://gen.pollinations.ai/v1",apiKey:"",model:"kimi"},...JSON.parse(localStorage.getItem(AIKEY)||"{}")}}catch{return{provider:"pollinations",baseUrl:"https://gen.pollinations.ai/v1",apiKey:"",model:"kimi"}}}
function restoreNativeAIConfig(){
  try{
    if(typeof Android==="undefined"||!Android.getAIConfig)return;
    const raw=Android.getAIConfig();
    if(!raw)return;
    const nativeCfg=JSON.parse(raw);
    if(!nativeCfg||typeof nativeCfg!=="object"||!nativeCfg.apiKey)return;
    const local=aiConfig();
    const merged={...local,...nativeCfg};
    persistAIConfig(merged);
  }catch(e){console.warn("Native AI config restore failed",e)}
}
function customProviderStore(){
  try{return JSON.parse(localStorage.getItem("english_gk_custom_providers_v1")||"{}")}catch{return{}}
}
function allAIProviders(){
  const custom=customProviderStore();
  const merged={...AI_PROVIDERS};
  Object.keys(custom).forEach(id=>{
    if(custom[id]&&typeof custom[id]==="object")merged[id]={name:custom[id].name||id,baseUrl:custom[id].baseUrl||"",models:normalizeModelList(custom[id].models||[])};
  });
  return merged;
}
function saveCustomProvider(id,config){
  const all=customProviderStore();
  all[id]={...config,id,name:String(config.name||id),baseUrl:String(config.baseUrl||""),models:normalizeModelList(config.models||[])};
  localStorage.setItem("english_gk_custom_providers_v1",JSON.stringify(all));
}
function deleteCustomProvider(id){
  const all=customProviderStore();
  delete all[id];
  localStorage.setItem("english_gk_custom_providers_v1",JSON.stringify(all));
  const current=aiConfig();
  if(current.provider===id)persistAIConfig({provider:"pollinations",baseUrl:AI_PROVIDERS.pollinations.baseUrl,apiKey:"",model:"kimi"});
}
function isCustomProvider(id){return id&&id.startsWith("custom_")}
function addCustomProvider(){
  const name=prompt("Custom provider name:");
  if(!name||!name.trim())return;
  const id="custom_"+Date.now().toString(36);
  saveCustomProvider(id,{name:name.trim(),baseUrl:"",models:[]});
  AI_PROVIDERS[id]={name:name.trim(),baseUrl:"",models:[]};
  const ps=$("#aiProvider");if(ps){renderAIProviderOptions(id);ps.value=id;activateAIProvider(id);setAIFields()}
}
function renderAIProviderOptions(selected){
  const ps=$("#aiProvider");if(!ps)return;
  const providers=allAIProviders();
  ps.innerHTML=Object.keys(providers).map(id=>"<option value=\""+esc(id)+"\">"+esc(providers[id].name)+"</option>").join("");
  if(selected&&providers[selected])ps.value=selected;
}
function aiProviderStore(){
  try{return JSON.parse(localStorage.getItem("english_gk_ai_providers_v1")||"{}")}catch{return{}}
}
function saveProviderConfig(provider,config){
  try{
    const all=aiProviderStore();
    all[provider]={...config,provider};
    localStorage.setItem("english_gk_ai_providers_v1",JSON.stringify(all));
  }catch(e){}
}
function providerSavedConfig(provider){
  const all=aiProviderStore();
  return all[provider]&&typeof all[provider]==="object"?all[provider]:null;
}
function persistAIConfig(config){
  try{
    const next={...config};
    if(next.provider)saveProviderConfig(next.provider,next);
    localStorage.setItem(AIKEY,JSON.stringify(next));
  }catch(e){}
  try{if(typeof Android!=="undefined"&&Android.saveAIConfig)Android.saveAIConfig(JSON.stringify(config))}catch(e){console.warn("Native AI config save failed",e)}
}
function aiModelCache(c){return c.modelCache&&typeof c.modelCache==="object"?c.modelCache:{}}function normalizeModelList(list){return (Array.isArray(list)?list:[]).map(x=>{if(typeof x==="string")return{id:x,name:x};if(!x||typeof x!=="object")return null;const id=String(x.id||x.model||x.name||"").trim();if(!id)return null;const name=String(x.name||x.display_name||x.displayName||id).trim();return{id,name}}).filter(Boolean).filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i)}function providerModels(provider,c){const p=AI_PROVIDERS[provider]||AI_PROVIDERS.custom;const cache=aiModelCache(c)[provider];const list=normalizeModelList(cache);return list.length?list:normalizeModelList(p.models)}function renderAIModels(){const c=aiConfig(),p=c.provider,m=$("#aiModel");if(!m)return;const list=providerModels(p,c);m.innerHTML=list.map(x=>"<option value=\""+esc(x.id)+"\">"+esc(x.name)+"</option>").join("");m.insertAdjacentHTML("beforeend","<option value=\"__custom__\">Custom model…</option>");if(c.model&&list.some(x=>x.id===c.model))m.value=c.model;else if(c.model)m.value="__custom__";else m.value=list[0]?.id||""}function activateAIProvider(provider){
  const p=AI_PROVIDERS[provider]||AI_PROVIDERS.custom;
  const saved=providerSavedConfig(provider);
  const cfg=saved?{...saved,provider}:{...aiConfig(),provider,baseUrl:p.baseUrl||"",apiKey:"",model:(p.models||[])[0]||""};
  localStorage.setItem(AIKEY,JSON.stringify(cfg));
  return cfg;
}
function setAIFields(){
  const c=aiConfig();
  renderAIProviderOptions(c.provider);
  $("#aiProvider").value=c.provider;
  $("#aiBaseUrl").value=c.baseUrl||p.baseUrl||"";
  $("#aiApiKey").value=c.apiKey||"";
  renderAIModels();
  const builtIn=providerModels(c.provider,c);
  $("#aiModelCustom").value=c.model&&!builtIn.some(x=>x.id===c.model)?c.model:"";
  $("#aiModelCustom").hidden=$("#aiModel").value!=="__custom__";
  $("#aiStatus").textContent=""
}async function loadAIModels(){const c=aiConfig(),base=(c.baseUrl||"").replace(/\/$/,"");if(!base){renderAIModels();return}const headers={};if(c.apiKey)headers.Authorization="Bearer "+c.apiKey;try{const r=await fetch(base+"/models",{headers,cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status);const d=await r.json();const raw=Array.isArray(d.data)?d.data:(Array.isArray(d.models)?d.models:Array.isArray(d)?d:[]);const ids=normalizeModelList(raw);if(!ids.length)throw Error("No models returned");const cache={...aiModelCache(c),[c.provider]:ids};const selected=ids.some(x=>x.id===c.model)?c.model:ids[0].id;persistAIConfig({...c,modelCache:cache,models:ids.map(x=>x.id),model:selected});setAIFields();renderAIQuickSelectors();$("#aiStatus").textContent="✓ "+ids.length+" models loaded";$("#aiStatus").className="aiStatus ok"}catch(e){$("#aiStatus").textContent="Model list unavailable: "+e.message;$("#aiStatus").className="aiStatus warn";renderAIModels()}}async function testAIConnection(){const c=aiConfig(),base=(c.baseUrl||"").replace(/\/$/,""),model=c.model==="__custom__"?$("#aiModelCustom").value.trim():c.model;const status=$("#aiStatus");status.className="aiStatus testing";status.textContent="Testing connection…";if(!base){status.textContent="✕ Base URL is required";status.className="aiStatus bad";return}const headers={"Content-Type":"application/json"};if(c.apiKey)headers.Authorization="Bearer "+c.apiKey;try{const r=await fetch(base+"/chat/completions",{method:"POST",headers,body:JSON.stringify({model,messages:[{role:"user",content:"Reply with exactly: CONNECTION_OK"}],temperature:0,max_tokens:20}),cache:"no-store"});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error((d.error&&d.error.message)||"HTTP "+r.status);const out=d.choices?.[0]?.message?.content||d.choices?.[0]?.text||"";status.textContent="✓ Connection working"+(out?" • "+strip(out).slice(0,50):"");status.className="aiStatus ok"}catch(e){status.textContent="✕ Connection failed: "+e.message+" (If this is a browser CORS error, use a CORS-enabled endpoint/proxy.)";status.className="aiStatus bad"}}
function topicInstruction(t){const n=t.toLowerCase();if(n.includes("one word"))return"Explain the One Word Substitution, define the correct term, explain why it fits, and compare every option with the key distinction.";if(/vocabulary|synonym|antonym|spelling|confusing/.test(n))return"Give Hindi meaning, simple English meaning, Hindi pronunciation, mnemonic, example sentence, and compare every option including Hindi meanings.";if(n.includes("idiom"))return"Explain literal meaning, actual English/Hindi meaning, usage, and distinction between all options.";if(/active|narration|sentence improvement|spotting|fill|completion|phrasal|homophone|usage/.test(n))return"Explain the exact grammar rule step-by-step and compare all options.";if(/cloze|reading/.test(n))return"Explain context clues, grammar, meaning and logic, then compare all options.";if(/para|rearrangement/.test(n))return"Explain sentence-order logic, connectors, pronouns, chronology and mandatory pairs.";return"Give a complete SSC exam-oriented solution and compare all options."}
function buildPrompt(q,user){return "You are an expert SSC CGL English teacher. Topic: "+q.topicName+". Question: "+strip(q.question)+". Passage: "+strip(q.passage)+". Options: A) "+strip(q.options[0])+"; B) "+strip(q.options[1])+"; C) "+strip(q.options[2])+"; D) "+strip(q.options[3])+". Correct answer: "+strip(q.options[Number(q.answer)])+". User selected: "+user+". Source explanation: "+strip(q.explanation)+".\n\n"+topicInstruction(q.topicName)+"\n\nReturn ONLY these sections, in this order, using Markdown headings exactly: ## Correct Answer & Reason; ## Your Answer / Mistake; ## Comparison of All Options; ## Core Concept / Rule; ## Example Sentence; ## SSC Memory Trick. Keep each section concise but exam-useful. Use a Markdown table for the option comparison with columns Option | Word/Answer | Meaning/Role | Why Correct/Wrong. For vocabulary also include Hindi meaning and Hindi pronunciation. Do not invent facts or uncertain etymology. Mobile-friendly."}
async function callAI(prompt){
  const c=aiConfig(),base=(c.baseUrl||"https://gen.pollinations.ai/v1").replace(/\/$/,""),
    url=base.endsWith("/v1")?base+"/chat/completions":base+"/v1/chat/completions",
    headers={"Content-Type":"application/json"};
  if(c.apiKey)headers.Authorization="Bearer "+c.apiKey;
  const body={
    model:c.model||"kimi",
    messages:[
      {role:"system",content:"Precise SSC English tutor. Do not invent source-specific facts."},
      {role:"user",content:prompt}
    ],
    temperature:.2
  };
  let lastStatus=0,lastMessage="";
  for(let attempt=0;attempt<3;attempt++){
    try{
      const r=await fetch(url,{method:"POST",headers,body:JSON.stringify(body)});
      const raw=await r.text();
      let d={};try{d=raw?JSON.parse(raw):{}}catch{}
      if(r.ok)return d.choices?.[0]?.message?.content||d.choices?.[0]?.text||"No response.";
      lastStatus=r.status;
      lastMessage=String(d?.error?.message||d?.message||raw||"").trim();
      if(r.status===429){
        const retryAfter=Number(r.headers.get("Retry-After")||"");
        const wait=Number.isFinite(retryAfter)&&retryAfter>0?Math.min(retryAfter*1000,15000):Math.min(1500*Math.pow(2,attempt),8000);
        if(attempt<2){await new Promise(resolve=>setTimeout(resolve,wait));continue}
        throw Error("Rate limit (429). Mistral is temporarily limiting requests. Please wait and try again."+ (lastMessage?" "+lastMessage:""));
      }
      if(r.status===401)throw Error("Mistral API key is invalid or unauthorized.");
      if(r.status===403)throw Error("Mistral API access is forbidden for this key/workspace.");
      if(r.status===400)throw Error("Mistral rejected the request (400)."+(lastMessage?" "+lastMessage:""));
      if(r.status===404)throw Error("Mistral endpoint/model was not found (404)."+(lastMessage?" "+lastMessage:""));
      throw Error("AI request failed: "+r.status+(lastMessage?" — "+lastMessage:""));
    }catch(e){
      if(e?.message?.includes("Rate limit (429)")||e?.message?.startsWith("Mistral ")||e?.message?.startsWith("AI request failed"))throw e;
      lastMessage=e?.message||"Network error";
      if(attempt<2){await new Promise(resolve=>setTimeout(resolve,1000*Math.pow(2,attempt)));continue}
      throw Error("AI network request failed: "+lastMessage);
    }
  }
  throw Error("AI request failed: "+lastStatus);
}
function inlineAI(s){return esc(String(s??"")).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>")}
function renderAI(md){const lines=String(md??"").replace(/\r/g,"").split("\n"),blocks=[];let cur=null,table=[];const flush=()=>{if(cur&&cur.body.length){blocks.push(cur);cur=null}},flushTable=()=>{if(!table.length)return;blocks.push({type:"table",body:table});table=[]};for(const raw of lines){const line=raw.trim();if(!line){if(cur)cur.body.push("");continue}if(/^\|/.test(line)){flush();table.push(line);continue}if(/^#{1,3}\s+/.test(line)){flushTable();flush();const title=line.replace(/^#{1,3}\s+/,"").replace(/\*+/g,"").trim();let type="concept",icon="◆";if(/correct|answer|reason/i.test(title)){type="answer";icon="✓"}else if(/wrong|selected|mistake/i.test(title)){type="warn";icon="!"}else if(/comparison|options|compare/i.test(title)){type="compare";icon="⇄"}else if(/memory|mnemonic|trick/i.test(title)){type="memory";icon="★"}else if(/example|sentence/i.test(title)){type="example";icon="✦"}blocks.push({type,title,icon,body:[]});cur=blocks[blocks.length-1];continue}if(!cur){cur={type:"concept",title:"AI Explanation",icon:"◆",body:[]};blocks.push(cur)}cur.body.push(line)}flushTable();flush();return blocks.map(b=>{if(b.type==="table"){const rows=b.body.filter(x=>!(/^\|[-\s|:]+\|$/.test(x)));if(!rows.length)return"";const cells=x=>x.split("|").slice(1,-1).map(v=>inlineAI(v.trim()));const head=cells(rows[0]),body=rows.slice(1);return '<div class="aiBlock aiCompare"><div class="aiTableWrap"><table><thead><tr>'+head.map(x=>"<th>"+x+"</th>").join("")+"</tr></thead><tbody>"+body.map(row=>{const c=cells(row);return"<tr>"+c.map(x=>"<td>"+x+"</td>").join("")+"</tr>"}).join("")+"</tbody></table></div></div>"}const cls="aiBlock ai"+b.type.charAt(0).toUpperCase()+b.type.slice(1);let html="",list=[];const flushList=()=>{if(list.length){html+="<ul class=\"aiList\">"+list.map(x=>"<li>"+inlineAI(x.replace(/^[-*]\s+/,""))+"</li>").join("")+"</ul>";list=[]}};b.body.forEach(x=>{if(/^[-*]\s+/.test(x)){list.push(x);return}flushList();if(x.startsWith(">"))x=x.slice(1).trim();if(x)html+='<p class="aiText">'+inlineAI(x)+"</p>"});flushList();return '<section class="'+cls+'"><h3 class="aiTitle"><span class="aiIcon">'+b.icon+"</span>"+inlineAI(b.title)+"</h3>"+html+"</section>"}).join("")}
function renderAIQuickSelectors(){
  const c=aiConfig(),ps=$("#aiQuickProvider"),ms=$("#aiQuickModel");
  if(!ps||!ms)return;
  const providerIds=Object.keys(allAIProviders());
  const provider=providerIds.includes(c.provider)?c.provider:"pollinations";
  ps.innerHTML=providerIds.map(id=>"<option value=\""+esc(id)+"\">"+esc(allAIProviders()[id].name)+"</option>").join("");
  ps.value=provider;
  const models=providerModels(provider,c);
  ms.innerHTML=models.map(m=>"<option value=\""+esc(m.id)+"\">"+esc(m.name)+"</option>").join("");
  if(c.model&&models.some(m=>m.id===c.model))ms.value=c.model;
  else ms.value=models[0]?.id||"";
}
function saveQuickAI(){
  const ps=$("#aiQuickProvider"),ms=$("#aiQuickModel");
  if(!ps||!ms)return;
  const provider=ps.value,p=AI_PROVIDERS[provider]||AI_PROVIDERS.custom;
  const old=aiConfig();
  const model=ms.value;
  const cache=aiModelCache(old);
  const available=providerModels(provider,old);
  persistAIConfig({
    ...old,
    provider,
    baseUrl:p.baseUrl||old.baseUrl||"",
    model,
    models:available.map(m=>m.id),
    modelCache:cache
  });
}
function syncAIQuickFromSettings(){
  renderAIQuickSelectors();
}
async function showAISolution(forceRegenerate=false){saveQuickAI();const q=state.pool[state.index],a=state.answers[state.index],user=a?strip(q.options[a.selected]):"Not answered",saved=getAISavedNote(q);$("#aiSolution").hidden=false;if(saved&&!forceRegenerate){$("#aiSolution").innerHTML='<div class="aiSavedBar"><span>✓ Saved AI Note</span><small>'+esc(new Date(saved.savedAt).toLocaleString())+' • '+esc(saved.provider||"AI")+(saved.model?" • "+esc(saved.model):"")+"</small></div>"+renderAI(saved.content)+'<div class="aiSavedActions"><button id="aiRegenerate" class="ghost" type="button">↻ Regenerate</button><button id="aiDeleteSaved" class="ghost" type="button">× Delete Saved Note</button></div>';$("#aiRegenerate").onclick=()=>showAISolution(true);$("#aiDeleteSaved").onclick=()=>{$("#aiSolution").hidden=true;deleteAISavedNote(q)};return}$("#aiSolution").innerHTML='<div class="aiLoading">Generating a structured SSC solution…</div>';try{const raw=await callAI(buildPrompt(q,user));saveAISavedNote(q,raw);$("#aiSolution").innerHTML='<div class="aiSavedBar"><span>✓ AI Note Saved</span><small>Saved in this browser • '+esc(aiConfig().provider)+' • '+esc(aiConfig().model||"")+"</small></div>"+renderAI(raw)+'<div class="aiSavedActions"><button id="aiRegenerate" class="ghost" type="button">↻ Regenerate</button><button id="aiDeleteSaved" class="ghost" type="button">× Delete Saved Note</button></div>';$("#aiRegenerate").onclick=()=>showAISolution(true);$("#aiDeleteSaved").onclick=()=>{$("#aiSolution").hidden=true;deleteAISavedNote(q)}}catch(e){$("#aiSolution").innerHTML='<section class="aiBlock aiWarn"><h3 class="aiTitle"><span class="aiIcon">!</span>AI Error</h3><p class="aiText">'+esc("AI failed. Open AI Settings to add a working key/base URL, then try again. "+e.message)+"</p></section>"}}
$("#next").onclick=moveNext;$("#bookmarkBtn").onclick=toggleBookmark;document.querySelectorAll("#resultFilters button").forEach(x=>x.onclick=()=>{state.resultFilter=x.dataset.filter;renderResults()});const mistakePracticeBtn=$("#mistakePracticeBtn");if(mistakePracticeBtn)mistakePracticeBtn.onclick=startMistakes;$("#resultMistakes").onclick=startMistakes;$("#skip").onclick=moveNext;const swipe={x:0,y:0,active:false};function setupSwipe(){const area=$("#test");if(!area)return;area.addEventListener("touchstart",e=>{if(e.touches.length!==1)return;const t=e.touches[0];swipe.x=t.clientX;swipe.y=t.clientY;swipe.active=true},{passive:true});area.addEventListener("touchend",e=>{if(!swipe.active||!e.changedTouches.length)return;const t=e.changedTouches[0],dx=t.clientX-swipe.x,dy=t.clientY-swipe.y;swipe.active=false;if(Math.abs(dx)<60||Math.abs(dx)<=Math.abs(dy)*1.25)return;if(e.target.closest("button,input,select,textarea,a,.modal"))return;if(dx<0)moveNext();else movePrev()},{passive:true})} $("#startAll").onclick=()=>localStorage.getItem(KEY)?start("all",true):start("all",false);$("#navMistakes").onclick=startMistakes;$("#navBookmarks").onclick=()=>{state.resultFilter="bookmarked";renderResults();show("result")};$("#navResults").onclick=()=>{renderResults();show("result")};document.querySelector("[data-home]").onclick=()=>show("home");$("#resumeBtn").onclick=()=>start("all",true);$("#newTestBtn").onclick=()=>{clearProgress("all");start("all",false)};$("#backHome").onclick=()=>{saveProgress();clearInterval(state.timer);show("home")};$("#again").onclick=()=>{clearProgress("all");start("all",false)};function sanitizeOriginalHTML(raw){const tpl=document.createElement("template");tpl.innerHTML=String(raw??"");const allowed=new Set(["BR","B","STRONG","I","EM","U","P","DIV","UL","OL","LI","H1","H2","H3","H4","TABLE","THEAD","TBODY","TFOOT","TR","TH","TD"]);const clean=node=>{for(const child of [...node.childNodes]){if(child.nodeType===1){if(!allowed.has(child.tagName)){if(child.tagName==="SPAN"||child.tagName==="FONT"){while(child.firstChild)child.parentNode.insertBefore(child.firstChild,child);child.remove();continue}const text=document.createTextNode(child.textContent||"");child.replaceWith(text);continue}for(const a of [...child.attributes])child.removeAttribute(a.name);clean(child)}else if(child.nodeType===8){child.remove()}}};clean(tpl.content);return tpl.innerHTML.trim()}function showOriginalSolution(){const q=state.pool[state.index],raw=String(q.explanation??q.s??"").trim();if(raw){const html=sanitizeOriginalHTML(raw);$("#originalSolution").innerHTML=html||'<div class="originalEmpty">No readable original solution/explanation is available in this question file.</div>'}else{$("#originalSolution").innerHTML="<div class=\"originalEmpty\">No original solution/explanation is available in this question file.</div>"}$("#originalModal").hidden=false}$("#aiQuickProvider").onchange=()=>{
  const provider=$("#aiQuickProvider").value;
  const p=AI_PROVIDERS[provider]||AI_PROVIDERS.pollinations;
  const previous=providerSavedConfig(provider);
  const c=previous||aiConfig();
  const models=providerModels(provider,c);
  const model=previous?.model&&models.some(m=>m.id===previous.model)?previous.model:(models[0]?.id||"");
  persistAIConfig({
    ...c,provider,baseUrl:p.baseUrl||c.baseUrl||"",model,
    apiKey:c.apiKey||"",
    models:models.map(m=>m.id),modelCache:aiModelCache(c)
  });
  renderAIQuickSelectors();
};
$("#aiQuickModel").onchange=()=>saveQuickAI();
$("#originalBtn").onclick=showOriginalSolution;$("#closeOriginal").onclick=()=>$("#originalModal").hidden=true;$("#aiBtn").onclick=showAISolution;$("#themeBtn").onclick=()=>{document.body.classList.toggle("light");localStorage.setItem("egk_theme",document.body.classList.contains("light")?"light":"dark")};$("#aiSettingsBtn").onclick=()=>{$("#aiModal").hidden=false;setAIFields()};$("#addCustomProvider").onclick=addCustomProvider;$("#deleteCustomProvider").onclick=()=>{const id=$("#aiProvider").value;if(!isCustomProvider(id))return;if(confirm("Delete this custom provider and its saved API key?")){deleteCustomProvider(id);renderAIProviderOptions("pollinations");activateAIProvider("pollinations");setAIFields();renderAIQuickSelectors()}};$("#closeAi").onclick=()=>$("#aiModal").hidden=true;$("#aiProvider").onchange=()=>{
  const provider=$("#aiProvider").value;
  const c=activateAIProvider(provider);
  const p=allAIProviders()[provider]||AI_PROVIDERS.custom;
  $("#aiBaseUrl").value=c.baseUrl||"";
  $("#aiApiKey").value=c.apiKey||"";
  renderAIModels();
  $("#aiModelCustom").value="";
  $("#aiModelCustom").hidden=$("#aiModel").value!=="__custom__";
  $("#aiStatus").textContent="";
};$("#aiModel").onchange=()=>{$("#aiModelCustom").hidden=$("#aiModel").value!=="__custom__"};restoreNativeAIConfig();renderAIQuickSelectors();$("#saveAi").onclick=()=>{const provider=$("#aiProvider").value,model=$("#aiModel").value==="__custom__"?$("#aiModelCustom").value.trim():$("#aiModel").value,old=aiConfig(),cache=aiModelCache(old),available=providerModels(provider,old);if(isCustomProvider(provider))saveCustomProvider(provider,{name:allAIProviders()[provider]?.name||provider,baseUrl:$("#aiBaseUrl").value.trim(),models:available});persistAIConfig({...old,provider,baseUrl:$("#aiBaseUrl").value.trim(),apiKey:$("#aiApiKey").value.trim(),model,models:available.map(m=>m.id),modelCache:cache});$("#aiModal").hidden=true;renderAIQuickSelectors()};$("#testAi").onclick=async()=>{const provider=$("#aiProvider").value,model=$("#aiModel").value==="__custom__"?$("#aiModelCustom").value.trim():$("#aiModel").value,old=aiConfig(),cache=aiModelCache(old),available=providerModels(provider,old);persistAIConfig({...old,provider,baseUrl:$("#aiBaseUrl").value.trim(),apiKey:$("#aiApiKey").value.trim(),model,models:available.map(m=>m.id),modelCache:cache});renderAIQuickSelectors();await testAIConnection()};$("#loadModels").onclick=loadAIModels;$("#resetAi").onclick=()=>{persistAIConfig({provider:"pollinations",baseUrl:"https://gen.pollinations.ai/v1",apiKey:"",model:"kimi"});setAIFields()};if(localStorage.getItem("egk_theme")==="light")document.body.classList.add("light");setupSwipe();renderAIQuickSelectors();window.addEventListener("pageshow",()=>{let savedTopic=localStorage.getItem(ACTIVEKEY)||"all";if(savedTopic==="exam"){const s=progressStore();delete s.exam;localStorage.setItem(KEY,JSON.stringify(s));localStorage.removeItem(ACTIVEKEY);savedTopic="all"}state.topic=savedTopic;const s=progressStore();if(["all","mistakes"].includes(state.topic)&&s[state.topic]?.pool?.length&&document.querySelector("#test")&&!document.querySelector("#test").classList.contains("active")){if(restoreSavedState()){show("test");clearInterval(state.timer);renderQ();startTimer()}}});load();