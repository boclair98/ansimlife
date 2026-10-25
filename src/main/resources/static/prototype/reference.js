'use strict';
// Content copied from SupportProgramInitializer. This is a design preview, not live benefit data.
const programs = [
  {id:1,topic:'housing',title:'1인가구 전월세 안심계약 도움서비스',region:'서울',target:'서울 거주 또는 거주 예정 1인가구',summary:'계약서 확인부터 집보기 현장동행까지 주거안심매니저와 함께 준비해요.',benefit:'계약상담 · 집보기 동행 · 주거지 탐색',url:'https://1in.seoul.go.kr',period:'상시'},
  {id:2,topic:'safety',title:'안심이 앱 귀가 모니터링',region:'서울',target:'서울 시민 누구나',summary:'귀가 시작과 도착을 공유하고 위급 상황에는 긴급신고를 연결해요.',benefit:'귀가 모니터링 · 긴급신고 · 안심귀가택시',url:'https://safe.seoul.go.kr',period:'상시'},
  {id:3,topic:'living',title:'정부24 나의 생활정보 알림',region:'전국',target:'정부24 이용자',summary:'여권 만료, 자동차 검사, 주택·복지 관련 생활정보를 한 곳에서 확인해요.',benefit:'생활정보 조회 · 사전알림',url:'https://www.gov.kr/mw/AA210LifeSvcInfo.do',period:'상시'},
  {id:4,topic:'housing',title:'청년월세 한시 특별지원 확인',region:'전국',target:'청년 1인가구 등 요건 충족자',summary:'내가 받을 수 있는 주거지원이 있는지 복지로에서 먼저 확인해요.',benefit:'월세 지원 여부 확인 · 온라인 신청',url:'https://www.bokjiro.go.kr',period:'공고별 상이'},
  {id:5,topic:'culture',title:'지역 1인가구 지원센터 프로그램',region:'전국',target:'지역별 1인가구',summary:'요리·건강·상담·관계망 프로그램을 지역별로 찾아볼 수 있어요.',benefit:'지역 프로그램 · 상담 · 커뮤니티',url:'https://1in.seoul.go.kr/front/bsns/bsnsList.do',period:'지역별 상이'}
];
const topics = {housing:{name:'주거 지원',icon:'home',tone:''},living:{name:'생활 정보',icon:'wallet',tone:'sand'},safety:{name:'귀가 안전',icon:'shield',tone:'blue'},culture:{name:'문화·상담',icon:'sun',tone:'rose'}};
const checklist = ['지원 대상과 선정 기준을 확인했어요.','접수기관에 필요한 서류를 확인했어요.','신청 기간을 공식 공고에서 확인했어요.','공식 사이트 또는 방문 신청 방법을 확인했어요.'];
const storageKey = 'ansimlife.prototype.reference.v1';
const main = document.querySelector('main');
const icon = name => `<svg class="icon" aria-hidden="true"><use href="#${name}"/></svg>`;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const programFor = id => programs.find(program => program.id === Number(id));
let stored = {};
try { stored = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { /* Preview remains usable without storage. */ }
if (!stored || typeof stored !== 'object' || Array.isArray(stored)) stored = {};
const saved = new Set((Array.isArray(stored.saved) ? stored.saved : []).filter(id => programFor(id)).map(Number));
const drafts = {};
for (const [id, draft] of Object.entries(stored.drafts || {})) {
  if (!programFor(id) || !draft || typeof draft !== 'object') continue;
  drafts[id] = {checks: [...new Set((Array.isArray(draft.checks) ? draft.checks : []).filter(index => Number.isInteger(index) && index >= 0 && index < 4))], date: /^\d{4}-\d{2}-\d{2}$/.test(draft.date) ? draft.date : ''};
}
const state = {keyword:'',region:'',topic:'',sort:'default',workFilter:'all',backHash:'#discover',textSize:['normal','large','larger'].includes(stored.textSize) ? stored.textSize : 'normal'};
let toastTimer;
function toast(message) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { element.hidden = true; }, 3600);
}
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify({saved:[...saved],drafts,textSize:state.textSize})); return true; }
  catch { toast('브라우저 저장 공간을 사용할 수 없어 이번 화면에서만 유지돼요.'); return false; }
}
function updateCounts() {
  document.querySelectorAll('[data-count="saved"]').forEach(el => { el.textContent = saved.size; });
  document.querySelectorAll('[data-count="prepare"]').forEach(el => { el.textContent = Object.keys(drafts).length; });
}
function setTextSize(size, announce = true) {
  state.textSize = size;
  document.documentElement.dataset.textSize = size;
  document.querySelectorAll('button[data-text-size]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.textSize === size)));
  if (announce) {
    if (persist()) toast(`글자를 ${ {normal:'보통',large:'크게',larger:'더 크게'}[size]} 표시해요.`);
  }
}
function toggleSaved(id, button) {
  if (saved.has(id)) saved.delete(id); else saved.add(id);
  const retained = persist();
  updateCounts();
  document.querySelectorAll('[data-save="'+id+'"]').forEach(el=>{el.setAttribute('aria-pressed',String(saved.has(id)));el.setAttribute('aria-label',programFor(id).title+' '+(saved.has(id)?'저장 해제':'저장'));if(el.hasAttribute('data-save-text'))el.innerHTML=icon('bookmark')+' '+(saved.has(id)?'저장한 혜택':'혜택 저장하기');});
  if (location.hash === '#saved') { render(); main.querySelector('h1')?.focus(); }
  else if (button) {
    button.setAttribute('aria-pressed', String(saved.has(id)));
    button.setAttribute('aria-label', `${programFor(id).title} ${saved.has(id) ? '저장 해제' : '저장'}`);
    if (button.hasAttribute('data-save-text')) button.innerHTML = `${icon('bookmark')} ${saved.has(id) ? '저장한 혜택' : '혜택 저장하기'}`;
  }
  if (retained) toast(saved.has(id) ? '이 브라우저에 혜택을 저장했어요.' : '저장한 혜택에서 해제했어요.');
}
function saveButton(program, full = false) {
  const active = saved.has(program.id);
  return `<button type="button" class="${full ? 'button secondary full' : 'icon-button'}" data-save="${program.id}" ${full ? 'data-save-text' : ''} aria-pressed="${active}" aria-label="${escapeHtml(program.title)} ${active ? '저장 해제' : '저장'}">${icon('bookmark')}${full ? (active ? ' 저장한 혜택' : ' 혜택 저장하기') : ''}</button>`;
}
function photoFor(program) {
  return program.topic==='safety'?'assets/seoul-night.jpg':program.topic==='culture'?'assets/seoul-panorama.jpg':'assets/seoul-city.jpg';
}
function card(program) {
  return '<article class="benefit-card"><div class="card-top"><span class="category-tag"><span class="category-symbol">'+icon(topics[program.topic].icon)+'</span>'+topics[program.topic].name+'<span class="dot"></span>'+program.region+'</span>'+saveButton(program)+'</div><h3><a href="#benefit/'+program.id+'" data-detail>'+escapeHtml(program.title)+'</a></h3><p class="card-summary">'+escapeHtml(program.summary)+'</p><dl class="card-facts"><dt>대상</dt><dd>'+escapeHtml(program.target)+'</dd><dt>지원</dt><dd>'+escapeHtml(program.benefit)+'</dd></dl><div class="card-bottom"><span class="period">'+icon('clock')+escapeHtml(program.period)+'</span><a href="#benefit/'+program.id+'" data-detail>자세히 보기 '+icon('arrow')+'</a></div></article>';
}
function sourceNote() {
  return '<p class="source-note">'+icon('info')+'<span>기본 혜택 5건으로 살펴보는 디자인 미리보기예요. 현재 모집 여부와 최종 자격은 공식 안내를 확인해주세요.</span></p>';
}
function empty(title,copy,action='혜택 찾아보기',target='#discover',symbol='search') {
  return '<div class="empty"><span class="empty-symbol">'+icon(symbol)+'</span><h2>'+title+'</h2><p>'+copy+'</p><a class="button primary" href="'+target+'">'+action+' '+icon('arrow')+'</a></div>';
}
function resultsSection() {
  return '<section class="results wrap" id="benefits" aria-labelledby="resultsHeading"><div class="section-top"><div><span class="eyebrow">생활에 가까운 도움</span><h2 id="resultsHeading" tabindex="-1">지금 살펴볼 혜택 <span id="resultCount"></span></h2><p>누가, 어떤 도움을 받을 수 있는지 확인해요.</p></div><label class="sort-field"><span>혜택 정렬</span><select id="sort"><option value="default">기본순</option><option value="name">이름순</option></select></label></div><div id="activeSearch" class="active-search" hidden><p id="filterDescription"></p><button type="button" class="text-button" data-reset>초기화 '+icon('close')+'</button></div><div class="benefit-grid" id="results" aria-live="polite"></div>'+sourceNote()+'</section>';
}
function renderHome() {
  const descriptions={housing:'계약·월세 지원',living:'생활정보 확인',safety:'집으로 가는 길',culture:'지역 프로그램'};
  main.innerHTML='<section class="home-hero" aria-labelledby="homeTitle"><img class="hero-photo" src="assets/seoul-city.jpg" alt="" fetchpriority="high"><div class="hero-shade" aria-hidden="true"></div><div class="hero-wrap wrap"><span class="eyebrow">알아두면 든든한 생활혜택</span><h1 id="homeTitle" tabindex="-1">나에게 필요한 혜택,<br><em>더 쉽게 찾아요.</em></h1><p class="hero-copy">생활에 필요한 지원 정보를 차근차근 확인해요.</p><form id="searchForm" class="hero-search"><label class="keyword-field"><span class="search-label">찾고 싶은 혜택</span><span class="input-line">'+icon('search')+'<input id="keyword" type="search" maxlength="80" autocomplete="off" placeholder="예: 월세, 1인가구, 생활정보" value="'+escapeHtml(state.keyword)+'"></span></label><label class="region-field"><span class="search-label">지역</span><select id="region"><option value="">모든 지역</option><option value="서울">서울</option><option value="전국">전국 공통</option></select></label><button type="submit" class="button primary" aria-label="혜택 검색">혜택 찾기 '+icon('arrow')+'</button></form><div class="hero-bottom"><div class="hero-examples"><span>이렇게 찾아보세요</span><button type="button" data-keyword="월세">월세</button><button type="button" data-keyword="1인가구">1인가구</button><button type="button" data-keyword="생활정보">생활정보</button></div><button type="button" class="guide-action" data-guide>내 상황으로 찾기 '+icon('arrow')+'</button></div></div></section><section class="category-section" aria-labelledby="categoryTitle"><div class="wrap"><div class="category-heading"><h2 id="categoryTitle">어떤 도움이 필요하세요?</h2><button type="button" class="text-button" data-browse>전체 보기 '+icon('arrow')+'</button></div><div class="category-deck">'+Object.entries(topics).map(([key,topic])=>'<button type="button" class="category-card" data-topic="'+key+'" aria-pressed="false">'+icon(topic.icon)+'<strong>'+topic.name+'</strong><svg class="icon category-arrow" aria-hidden="true"><use href="#arrow"/></svg><small>'+descriptions[key]+'</small></button>').join('')+'</div></div></section>'+resultsSection();
  document.querySelector('#region').value=state.region;
  document.querySelector('#sort').value=state.sort;
  document.querySelector('#searchForm').addEventListener('submit',event=>{
    event.preventDefault();state.keyword=document.querySelector('#keyword').value.trim();state.region=document.querySelector('#region').value;renderResults(true);
  });
  document.querySelector('#sort').addEventListener('change',event=>{state.sort=event.target.value;renderResults();});
  document.querySelector('[data-browse]').addEventListener('click',()=>{
    document.querySelector('#benefits').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
    document.querySelector('#resultsHeading').focus({preventScroll:true});
  });
  renderResults();
}
function renderResults(scroll=false) {
  const keyword=state.keyword.toLocaleLowerCase().replace(/\s+/g,'');
  let filtered=programs.filter(program=>(!state.topic||state.topic===program.topic)&&(!state.region||program.region===state.region||program.region==='전국')&&(!keyword||(""+program.title+program.summary+program.benefit+program.target).toLocaleLowerCase().replace(/\s+/g,'').includes(keyword)));
  if(state.sort==='name')filtered=[...filtered].sort((a,b)=>a.title.localeCompare(b.title,'ko'));
  document.querySelector('#resultCount').textContent=filtered.length+'개';
  document.querySelector('#results').innerHTML=filtered.length?filtered.map(card).join(''):'<div class="empty"><span class="empty-symbol">'+icon('search')+'</span><h3>조건에 맞는 혜택이 없어요</h3><p>시안에는 기본 혜택 5개가 있어요.<br>검색어를 바꾸거나 전체 혜택을 확인해보세요.</p><button class="button primary" type="button" data-reset>전체 혜택 보기 '+icon('arrow')+'</button></div>';
  const labels=[state.region,topics[state.topic]?.name,state.keyword&&'“'+state.keyword+'”'].filter(Boolean);
  document.querySelector('#activeSearch').hidden=!labels.length;
  document.querySelector('#filterDescription').textContent=labels.join(' · ');
  document.querySelectorAll('[data-topic]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.topic===state.topic)));
  if(scroll){document.querySelector('#benefits').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});document.querySelector('#resultsHeading').focus({preventScroll:true});}
}
function renderDetail(id) {
  const program=programFor(id);if(!program)return renderMissing();
  main.innerHTML='<div class="page-wrap wrap"><a class="back-link" href="'+state.backHash+'">'+icon('back')+'혜택 목록으로</a><div class="detail-title"><span class="pill">'+icon(topics[program.topic].icon)+topics[program.topic].name+' · '+program.region+'</span><h1 tabindex="-1">'+escapeHtml(program.title)+'</h1><p class="detail-lead">'+escapeHtml(program.summary)+'</p><div class="detail-mobile-actions"><a class="button primary" href="#prepare/'+program.id+'" data-start="'+program.id+'">신청 준비하기 '+icon('arrow')+'</a>'+saveButton(program)+'</div></div><div class="reading-layout"><article class="reading-main"><div class="information-panel"><section class="detail-section"><p class="section-caption">지원 대상</p><h2>누가 받을 수 있나요?</h2><p>'+escapeHtml(program.target)+'</p><p class="help-text">세부 요건과 최종 지원 자격은 담당기관의 공식 안내를 확인해주세요.</p></section><section class="detail-section"><p class="section-caption">지원 내용</p><h2>어떤 도움을 받나요?</h2><p>'+escapeHtml(program.benefit)+'</p></section><section class="detail-section"><p class="section-caption">신청 기간과 방법</p><h2>신청 전에 확인해주세요</h2><p>기본 안내에 표시된 기간은 <strong>'+escapeHtml(program.period)+'</strong>예요. 현재 모집 중인지, 어떤 서류가 필요한지 공식 사이트에서 확인해주세요.</p><ol class="steps"><li>지원 대상과 선정 기준 확인</li><li>접수기관에 필요한 서류 확인</li><li>공식 사이트 또는 기관에서 신청</li></ol><a class="text-button" href="'+program.url+'" target="_blank" rel="noopener noreferrer">공식 안내 확인 '+icon('external')+'</a></section></div><div class="notice">'+icon('info')+'<p>이 화면은 기본 혜택 정보로 구성한 시안이에요. 안심생활에서 실제 신청이나 자격 판정이 이루어지지는 않아요.</p></div></article><aside class="detail-aside"><img class="aside-photo" src="'+photoFor(program)+'" alt=""><div class="aside-body"><h2>차근차근 준비해볼까요?</h2><dl class="aside-facts"><dt>지역</dt><dd>'+program.region+'</dd><dt>기간</dt><dd>'+escapeHtml(program.period)+'<br><span class="muted">현재 공고 확인 필요</span></dd></dl><a class="button primary full" href="#prepare/'+program.id+'" data-start="'+program.id+'">신청 준비하기 '+icon('arrow')+'</a>'+saveButton(program,true)+'<a class="text-button" href="'+program.url+'" target="_blank" rel="noopener noreferrer">공식 사이트로 '+icon('external')+'</a><p class="help-text">시안의 저장·체크는 이 브라우저에만 남아요. 실제 신청은 담당기관에서 진행해주세요.</p></div></aside></div></div>';
}
function renderSaved() {
  const items=programs.filter(program=>saved.has(program.id));
  main.innerHTML='<section class="page-wrap wrap"><div class="collection-top"><div class="page-header"><span class="eyebrow">다시 찾아보고 싶은 도움</span><h1 tabindex="-1">저장한 혜택<span class="count-chip">'+items.length+'</span></h1><p>관심 있는 혜택을 모아두고 천천히 살펴보세요.</p></div><a class="text-button" href="#discover">다른 혜택 찾기 '+icon('arrow')+'</a></div><div class="benefit-grid collection-grid">'+(items.length?items.map(card).join(''):empty('관심 있는 혜택을 모아보세요','혜택의 책갈피를 누르면 여기에 저장돼요.<br>다시 찾을 때 바로 꺼내볼 수 있어요.','혜택 찾아보기','#discover','bookmark'))+'</div>'+sourceNote()+'</section>';
}
function draftComplete(draft){return draft.checks.length===4;}
function renderPreparationList() {
  const entries=Object.entries(drafts);
  const counts={all:entries.length,active:entries.filter(([,d])=>!draftComplete(d)).length,done:entries.filter(([,d])=>draftComplete(d)).length};
  const visible=entries.filter(([,d])=>state.workFilter==='all'||(state.workFilter==='done'?draftComplete(d):!draftComplete(d)));
  const filteredEmpty='<div class="empty"><span class="empty-symbol">'+icon('list')+'</span><h2>이 상태의 준비 기록이 없어요</h2><p>전체 기록에서 다른 혜택의 준비를 이어갈 수 있어요.</p><button type="button" class="button primary" data-work-filter="all">전체 기록 보기 '+icon('arrow')+'</button></div>';
  main.innerHTML='<section class="page-wrap wrap"><div class="collection-top"><div class="page-header"><span class="eyebrow">한 번에 하나씩, 차근차근</span><h1 tabindex="-1">신청 준비<span class="count-chip">'+entries.length+'</span></h1><p>준비할 일과 다음 확인일을 한곳에서 챙겨요.</p></div><a class="text-button" href="#discover">준비할 혜택 찾기 '+icon('arrow')+'</a></div>'+(entries.length?'<div class="work-toolbar"><div class="work-tabs" aria-label="준비 상태">'+[['all','전체'],['active','준비 중'],['done','체크 완료']].map(([key,label])=>'<button type="button" data-work-filter="'+key+'" aria-pressed="'+(state.workFilter===key)+'">'+label+'<b>'+counts[key]+'</b></button>').join('')+'</div><p class="work-hint">직접 확인한 내용을 기준으로 표시해요.</p></div><div class="prepare-list">'+(visible.length?visible.map(([id,draft])=>{const program=programFor(id);return '<article class="prepare-row"><div><span class="state-label">'+(draftComplete(draft)?'체크 완료':'준비 중')+'</span><h2>'+escapeHtml(program.title)+'</h2><p>'+icon('clock')+(draft.date?'다음 확인일 '+draft.date.replaceAll('-','. '):'다음 확인일을 정해보세요.')+'</p></div><div class="record-progress"><strong>'+draft.checks.length+' / 4 확인</strong><div class="progress-track" role="progressbar" aria-label="'+escapeHtml(program.title)+' 준비 체크" aria-valuemin="0" aria-valuemax="4" aria-valuenow="'+draft.checks.length+'"><span style="width:'+draft.checks.length*25+'%"></span></div></div><a class="button secondary" href="#prepare/'+id+'">이어서 준비 '+icon('arrow')+'</a></article>';}).join(''):filteredEmpty)+'</div><p class="source-note">'+icon('info')+'<span>체크 완료는 신청 접수와 달라요. 실제 신청은 공식 사이트 또는 담당기관에서 진행해주세요.</span></p>':empty('준비할 혜택을 찾아볼까요?','혜택 상세에서 ‘신청 준비하기’를 누르면<br>확인할 일을 하나씩 챙길 수 있어요.','혜택 찾아보기','#discover','list'))+'</section>';
}
function renderPreparation(id) {
  const program=programFor(id);if(!program)return renderMissing();
  const draft=drafts[id];
  if(!draft){main.innerHTML='<section class="page-wrap wrap">'+empty('혜택 내용을 먼저 확인해주세요','혜택 상세에서 신청 준비를 시작할 수 있어요.','혜택 내용 보기','#benefit/'+program.id,'list')+'</section>';return;}
  main.innerHTML='<section class="page-wrap wrap"><a class="back-link" href="#prepare">'+icon('back')+'신청 준비 목록</a><div class="page-header"><span class="eyebrow">'+topics[program.topic].name+' · '+program.region+'</span><h1 tabindex="-1">'+escapeHtml(program.title)+'</h1><p>확인한 내용을 체크하며 준비를 이어가세요.</p></div><div class="prep-layout"><section class="check-panel" aria-labelledby="checkHeading"><div class="progress-heading"><h2 id="checkHeading">준비 체크리스트</h2><span id="checkCount">'+draft.checks.length+' / 4 확인</span></div><div class="progress-track" role="progressbar" aria-label="준비 체크" aria-valuemin="0" aria-valuemax="4" aria-valuenow="'+draft.checks.length+'"><span style="width:'+draft.checks.length*25+'%"></span></div><p class="help-text">체크한 내용은 이 브라우저에 바로 저장돼요.</p><div class="check-items">'+checklist.map((label,index)=>'<label class="check-item"><input type="checkbox" data-check="'+index+'" data-program="'+program.id+'" '+(draft.checks.includes(index)?'checked':'')+'><span><span class="check-number">확인 '+(index+1)+'</span>'+label+'</span></label>').join('')+'</div></section><aside class="schedule-panel">'+icon('clock')+'<h2>다음에 언제 확인할까요?</h2><p>서류나 신청 기간을 다시 확인할 날짜를 정해두세요.</p><label class="field"><span>다음 확인일 <span class="muted">(선택)</span></span><input type="date" id="nextDate" value="'+draft.date+'" min="1900-01-01" max="9998-12-31"></label><p>직접 정하는 확인일이에요. 기관 마감일이나 자동 알림이 아니에요.</p></aside></div><div class="prep-actions"><p class="help-text">모두 체크해도 신청이 접수되지는 않아요.<br>실제 신청은 공식 사이트나 기관에서 진행해주세요.</p><a class="button primary" href="'+program.url+'" target="_blank" rel="noopener noreferrer">공식 안내 확인하기 '+icon('external')+'</a></div></section>';
  document.querySelector('#nextDate').addEventListener('change',event=>{if(!event.target.checkValidity()){event.target.reportValidity();return;}draft.date=event.target.value;if(persist())toast(draft.date?'다음 확인일을 저장했어요.':'다음 확인일을 비웠어요.');});
}
function renderSettings() {
  main.innerHTML='<section class="page-wrap wrap"><div class="page-header"><span class="eyebrow">나에게 편한 안심생활</span><h1 tabindex="-1">설정과 이용 안내</h1><p>읽기 편한 화면으로 바꾸고, 이용 방법을 확인하세요.</p></div><div class="settings-layout"><nav class="settings-rail" aria-label="설정 메뉴"><a href="#settings" data-section="displaySettings" aria-current="location">'+icon('settings')+'화면 설정</a><a href="#settings" data-section="usageHelp">'+icon('info')+'이용 안내</a></nav><div><section class="setting-section" id="displaySettings"><h2>글자 크기</h2><p class="help-text">눈에 편한 크기를 골라보세요. 본문과 버튼이 함께 커져요.</p><div class="setting-buttons">'+[['normal','보통'],['large','크게'],['larger','더 크게']].map(([key,label])=>'<button type="button" class="size-choice" data-text-size="'+key+'" aria-pressed="'+(state.textSize===key)+'"><span class="sample '+key+'" aria-hidden="true">가</span><span>'+label+'</span></button>').join('')+'</div><div class="size-preview"><strong>나에게 필요한 혜택을 쉽게 찾아요.</strong><p>혜택을 찾고, 저장하고, 준비까지 차근차근 이어가세요.</p></div></section><section class="setting-section" id="usageHelp"><h2>궁금한 점을 모았어요</h2><div class="faq-items"><details><summary>안심생활에서 바로 신청할 수 있나요?</summary><p>안심생활은 혜택을 찾고 준비하는 화면이에요. 실제 신청과 서류 제출은 연결된 공식 사이트 또는 담당기관에서 진행해주세요.</p></details><details><summary>저장한 내용은 어디에 남나요?</summary><p>이 시안에서 저장한 혜택, 준비 체크, 확인일은 현재 브라우저에만 남아요. 기존 안심생활 계정 기록과 연결되거나 다른 기기로 동기화되지는 않아요.</p></details><details><summary>맞춤 조건을 고르면 지원받을 수 있나요?</summary><p>선택한 지역과 관심 분야로 관련 혜택을 모아드려요. 실제 지원 자격과 선정 결과는 해당 기관이 확인해요.</p></details><details><summary>혜택 정보는 어디에서 확인하나요?</summary><p>이 시안은 저장소의 기본 혜택 5건으로 구성했어요. 현재 모집 여부와 자세한 기준은 상세 화면의 공식 안내에서 확인해주세요.</p></details></div><a class="text-button" href="https://www.gov.kr/" target="_blank" rel="noopener noreferrer">정부24 공식 안내 '+icon('external')+'</a></section></div></div></section>';
}
function renderMissing() {
  main.innerHTML='<section class="page-wrap wrap">'+empty('찾으시는 화면이 없어요','혜택 목록에서 필요한 정보를 다시 찾아보세요.')+'</section>';
}
function render() {
  const [route,id]=(location.hash.slice(1)||'discover').split('/');
  document.body.classList.toggle('reference-home',route==='discover'||route==='content');
  if(route==='discover'||route==='content')renderHome();else if(route==='benefit')renderDetail(id);else if(route==='saved')renderSaved();else if(route==='prepare')id?renderPreparation(id):renderPreparationList();else if(route==='settings')renderSettings();else renderMissing();
  const navRoute=route==='benefit'?'discover':route;
  document.querySelectorAll('[data-nav]').forEach(link=>{if(link.dataset.nav===navRoute)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
  updateCounts();
}
document.addEventListener('click',event=>{
  const button = event.target.closest('button,a');
  if(!button)return;
  if(button.dataset.section){event.preventDefault();document.querySelectorAll('.settings-rail a').forEach(link=>{if(link===button)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});document.getElementById(button.dataset.section)?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});return;}
  if(button.classList.contains('skip')){event.preventDefault();main.focus();main.scrollIntoView({block:'start',behavior:'instant'});return;}
  if(button.tagName==='A'&&button.getAttribute('href')===location.hash&&!button.dataset.section)window.scrollTo({top:0,behavior:'instant'});
  if(button.hasAttribute('data-detail'))state.backHash=['#saved','#prepare'].includes(location.hash)?location.hash:'#discover';
  if(button.hasAttribute('data-save'))toggleSaved(Number(button.dataset.save),button);
  if(button.hasAttribute('data-start')){
    const id=Number(button.dataset.start);if(!programFor(id))return;
    if(!drafts[id]){drafts[id]={checks:[],date:''};persist();updateCounts();}
  }
  if(button.hasAttribute('data-topic')){state.topic=state.topic===button.dataset.topic?'':button.dataset.topic;renderResults(true);}
  if(button.hasAttribute('data-keyword')){state.keyword=button.dataset.keyword;document.querySelector('#keyword').value=state.keyword;renderResults(true);}
  if(button.hasAttribute('data-reset')){state.keyword='';state.region='';state.topic='';document.querySelector('#keyword').value='';document.querySelector('#region').value='';renderResults(true);}
  if(button.hasAttribute('data-text-size'))setTextSize(button.dataset.textSize);
  if(button.hasAttribute('data-work-filter')){state.workFilter=button.dataset.workFilter;renderPreparationList();main.querySelector(`[data-work-filter="${state.workFilter}"]`)?.focus();}
  if(button.hasAttribute('data-guide'))openGuide(button);
});
document.addEventListener('change',event=>{
  const input=event.target.closest('[data-check]');if(!input)return;
  const draft=drafts[input.dataset.program];if(!draft)return;
  const index=Number(input.dataset.check);
  draft.checks=input.checked?[...new Set([...draft.checks,index])]:draft.checks.filter(value=>value!==index);
  document.querySelector('#checkCount').textContent=`${draft.checks.length} / 4 확인`;
  document.querySelector('.progress-track').setAttribute('aria-valuenow',draft.checks.length);
  document.querySelector('.progress-track span').style.width=`${draft.checks.length*25}%`;
  persist();
});
const guideDialog=document.querySelector('#guideDialog');
let guideTrigger;
function openGuide(trigger){guideTrigger=trigger;document.querySelector('#guideRegion').value=state.region;document.querySelectorAll('[name="guideTopic"]').forEach(input=>{input.checked=input.value===state.topic;});guideDialog.showModal();}
document.querySelector('#guideClose').addEventListener('click',()=>guideDialog.close());
guideDialog.addEventListener('close',()=>{if(guideTrigger?.isConnected)guideTrigger.focus({preventScroll:true});});
guideDialog.addEventListener('click',event=>{if(event.target!==guideDialog)return;const rect=guideDialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)guideDialog.close();});
document.querySelector('#guideForm').addEventListener('submit',event=>{event.preventDefault();state.region=document.querySelector('#guideRegion').value;state.topic=new FormData(event.target).get('guideTopic')||'';state.keyword='';guideDialog.close();if(location.hash && location.hash!=='#discover')location.hash='discover';else{renderHome();renderResults(true);}});
window.addEventListener('hashchange',()=>{render();window.scrollTo({top:0,behavior:'instant'});main.querySelector('h1')?.focus({preventScroll:true});});
document.addEventListener('click',event=>{const menu=document.querySelector('#textMenu');if(menu.open&&!menu.contains(event.target))menu.open=false;});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){const menu=document.querySelector('#textMenu');if(menu.open){menu.open=false;menu.querySelector('summary').focus();}}});
setTextSize(state.textSize,false);
render();
