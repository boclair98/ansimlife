const byId = id => document.getElementById(id);
const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;

function preferredScrollBehavior() { return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'; }

const state = {
    items: [],
    visibleItems: [],
    drafts: [],
    draftsError: null,
    savedIds: readIdSet('ansimlife.saved'),
    comparisonIds: readIdSet('ansimlife.compare'),
    detailCache: new Map(),
    detailRequestEpoch: 0,
    activeProgram: null,
    activeDetail: null,
    currentPage: 0,
    totalResults: 0,
    totalBenefits: 0,
    hasMore: false,
    loading: false,
    signedIn: false,
    currentUser: null,
    authGeneration: 0,
    profile: null,
    authMode: 'login',
    activeStep: 1,
    preparationEpoch: 0,
    diagnosis: readDiagnosis(),
    quickFilter: 'all',
    topic: '',
    sortOrder: 'recommended',
    sharedComparisonPending: false,
    hideClosed: true,
    searchController: null,
    recent: readRecent()
};

const categories = [
    { name:'생활안정', icon:'wallet', copy:'생활비·소득' },
    { name:'주거·자립', icon:'home', copy:'주거·자립' },
    { name:'보육·교육', icon:'book', copy:'보육·배움' },
    { name:'고용·창업', icon:'work', copy:'일자리·사업' },
    { name:'보건·의료', icon:'health', copy:'건강·의료비' },
    { name:'행정·안전', icon:'shield', copy:'안전·행정' },
    { name:'임신·출산', icon:'heart', copy:'임신·출산' },
    { name:'보호·돌봄', icon:'care', copy:'돌봄·보호' },
    { name:'문화·환경', icon:'sun', copy:'문화·환경' },
    { name:'농림축산어업', icon:'leaf', copy:'농어업' }
];

const legacyCategories = { 주거:'주거·자립', 안전:'행정·안전', 생활:'생활안정', 관계:'문화·환경' };
const categoryIcons = Object.fromEntries(categories.map(item => [item.name, item.icon]));
const journeyLabels = {
    PREPARING: '혜택 준비 중',
    OFFICIAL_SITE_OPENED: '공식 신청처 확인',
    USER_REPORTED_SUBMITTED: '내가 신청했다고 기록',
    SUPPLEMENT_REQUESTED: '보완 요청 받음',
    RESULT_WAITING: '결과 기다리는 중',
    APPROVED: '선정됐다고 기록',
    REJECTED: '미선정으로 기록',
    INSTITUTION_CONFIRMED: '기관 접수 확인 완료'
};
const checklistIds = ['target', 'documents', 'period', 'route'];

function readStorage(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
}

function writeStorage(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { /* Private browsing or disabled storage: keep the current session working. */ }
}

function readIdSet(key) {
    const values = readStorage(key, []);
    return new Set((Array.isArray(values) ? values : [])
        .map(Number)
        .filter(value => Number.isSafeInteger(value) && value > 0));
}

function readRecent() {
    const values = readStorage('ansimlife.recent', []);
    return (Array.isArray(values) ? values : [])
        .filter(item => Number.isSafeInteger(item?.id) && item.id > 0 && typeof item.title === 'string')
        .slice(0, 5);
}

function readDiagnosis() {
    const value = readStorage('ansimlife.diagnosis', null);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const fields = ['region', 'age', 'need', 'household'];
    if (fields.some(field => typeof value[field] !== 'string' || !value[field].trim())) return null;
    return Object.fromEntries([...fields, 'incomeRange'].map(field => [field, typeof value[field] === 'string' ? value[field] : '']));
}

function restoreSharedComparison() {
    const raw = new URLSearchParams(window.location.search).get('compare');
    if (!raw) return;
    const ids = raw.split(',')
        .map(value => value.trim())
        .filter(value => /^\d+$/.test(value))
        .map(Number)
        .filter(value => Number.isInteger(value) && value > 0)
        .slice(0, 3);
    if (!ids.length) return;
    state.comparisonIds = new Set(ids);
    state.sharedComparisonPending = true;
    writeStorage('ansimlife.compare', ids);
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
    }[character]));
}

function hasText(value) { return String(value ?? '').trim().length > 0; }
function normalizedCategory(value) { return legacyCategories[value] ?? value ?? '기타'; }
function channelClass(mode) { return String(mode ?? 'PREPARATION_ONLY').toLowerCase().replaceAll('_', '-'); }
function formatNumber(value) { return Number(value || 0).toLocaleString('ko-KR'); }
function formatDateTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '날짜 확인 필요';
    return new Intl.DateTimeFormat('ko-KR', { timeZone:'Asia/Seoul', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }).format(date);
}
function formatFreshness(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '동기화 시각 확인 필요';
    const formatted = new Intl.DateTimeFormat('ko-KR', { timeZone:'Asia/Seoul', month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' }).format(date);
    return `마지막 동기화 ${formatted}`;
}
function formatDate(value) {
    if (!value) return '';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return '날짜 확인 필요';
    return new Intl.DateTimeFormat('ko-KR', { year:'numeric', month:'long', day:'numeric' }).format(date);
}

async function errorMessage(response, fallback) {
    const body = await response.json().catch(() => ({}));
    const message = body.detail || body.message;
    return typeof message === 'string' && message.trim() ? message : fallback;
}

function showToast(message) {
    const toast = byId('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

const dialogReturnFocus = new WeakMap();

function openDialog(dialog) {
    if (dialog && !dialog.open) {
        const trigger = document.activeElement;
        const attributes = ['data-draft-action', 'data-program-id', 'data-action', 'data-id'];
        const selector = trigger?.id ? `#${CSS.escape(trigger.id)}` : attributes
            .filter(name => trigger?.hasAttribute(name))
            .map(name => `[${name}="${CSS.escape(trigger.getAttribute(name))}"]`).join('');
        dialogReturnFocus.set(dialog, { trigger, selector });
        dialog.showModal();
    }
}

function applicationChannel(item) {
    return item?.application ?? {
        mode: 'PREPARATION_ONLY',
        label: '공식 접수처 확인',
        description: '조건과 서류를 확인한 뒤 안내된 공식 기관에 직접 제출해요.',
        directAvailable: false,
        officialUrl: item?.applyUrl ?? null
    };
}

function officialUrlFor(item) {
    return window.AnsimWorkflow.safeExternalUrl(item?.onlineUrl, applicationChannel(item).officialUrl, item?.applyUrl);
}

function routeDescription(item, channel) {
    return officialUrlFor(item) || channel.mode === 'NO_APPLICATION' ? channel.description
        : `${channel.description} 연결할 온라인 주소가 없어 신청 방법과 담당기관 문의처를 확인해주세요.`;
}

function deadlineMeta(item) {
    const text = String(item?.deadline ?? '').trim();
    if (item?.deadlineStatus && item?.deadlineLabel) {
        return { status:item.deadlineStatus, label:item.deadlineLabel, expired:item.expired === true, urgent:item.urgent === true };
    }
    if (!text || text === '-' || /기관 공고 확인|모집공고 확인|접수기관 별 상이/.test(text)) {
        return { status:'UNKNOWN', label:'모집기간 확인 필요', expired:false, urgent:false };
    }
    if (/상시|수시|연중|언제든/.test(text)) return { status:'OPEN', label:'상시 신청', expired:false, urgent:false };
    const dates = [...text.matchAll(/(20\d{2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{1,2})/g)]
        .map(match => new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
        .filter(date => !Number.isNaN(date.getTime()));
    if (!dates.length) return { status:'UNKNOWN', label:'모집기간 확인 필요', expired:false, urgent:false };
    const last = dates.sort((left,right) => left - right).at(-1);
    const today = new Date(); today.setHours(0,0,0,0);
    if (last < today) return { status:'EXPIRED', label:'모집 종료', expired:true, urgent:false };
    const days = Math.ceil((last - today) / 86400000);
    return days <= 30
        ? { status:'URGENT', label:`마감 임박 · ${days}일 남음`, expired:false, urgent:true }
        : { status:'OPEN', label:`마감 ${last.getFullYear()}.${last.getMonth()+1}.${last.getDate()}`, expired:false, urgent:false };
}

function actionFor(item, draft) {
    const channel = applicationChannel(item);
    const deadline = deadlineMeta(item);
    if (deadline.expired) return { label:'공식 안내 확인', action:'detail', tone:'muted', hint:'모집기간이 끝났어요. 다음 공고를 확인하세요.' };
    if (channel.mode === 'NO_APPLICATION') return { label:'이용 방법 확인', action:'detail', tone:'muted', hint:'별도 신청 없이 이용 조건을 확인하세요.' };
    if (draft) return { label:'이어서 준비', action:'prepare', tone:'primary', hint:'저장한 준비 상태를 이어갈 수 있어요.' };
    return { label:'신청 준비', action:'prepare', tone:'primary', hint:'대상·서류를 확인한 뒤 공식 접수처로 이동해요.' };
}

function syncCounts() {
    byId('savedCount').textContent = state.savedIds.size;
    byId('comparisonCount').textContent = state.comparisonIds.size;
    byId('mobileComparisonCount').textContent = state.comparisonIds.size;
    byId('asideSavedCount').textContent = state.savedIds.size;
    byId('applicationCount').textContent = state.drafts.length;
    byId('asideApplicationCount').textContent = state.drafts.length;
    byId('mobileApplicationCount').textContent = state.drafts.length;
    byId('comparisonDock').hidden = state.comparisonIds.size === 0;
    byId('dockCount').textContent = state.comparisonIds.size;
}

function syncAuthUI() {
    const button = byId('accountButton');
    button.textContent = state.signedIn ? '내 계정' : '로그인';
    button.setAttribute('aria-label', state.signedIn ? '내 계정 보기' : '로그인');
    button.classList.toggle('signed-in', state.signedIn);
    syncPreparationActions();
}

function renderCategoryControls(categoryCounts = {}) {
    const select = byId('category');
    const active = select.value;
    select.innerHTML = '<option value="">전체 분야</option>' + categories
        .map(item => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)}</option>`).join('');
    if ([...select.options].some(option => option.value === active)) select.value = active;

    byId('quickCategories').innerHTML = '<button class="active" type="button" data-category="">전체</button>' + categories
        .map(item => `<button type="button" data-category="${escapeHtml(item.name)}">${icon(item.icon)} ${escapeHtml(item.name)}</button>`).join('');

    const shortNames = {'생활안정':'생활','주거·자립':'주거','보육·교육':'교육','고용·창업':'일자리','보건·의료':'건강','행정·안전':'안전','임신·출산':'출산','보호·돌봄':'돌봄','문화·환경':'문화','농림축산어업':'농어업'};
    byId('categoryGrid').innerHTML = '<div class="category-shortcuts">'+categories.map(item=>'<button type="button" data-category="'+escapeHtml(item.name)+'" aria-label="'+escapeHtml(item.name)+' 혜택" aria-pressed="false"><span class="category-icon">'+icon(item.icon)+'</span><strong>'+shortNames[item.name]+'</strong></button>').join('')+'</div>';
    syncCategorySelection(select.value);
}

function populateDiagnosisNeeds() {
    byId('diagnosisNeeds').innerHTML = categories.map(item => `
        <label><input type="radio" name="need" value="${escapeHtml(item.name)}" required><span><i>${icon(item.icon)}</i>${escapeHtml(item.name)}</span></label>`).join('');
}

function syncCategorySelection(category) {
    const disclosure = document.querySelector('.category-disclosure');
    if (category && disclosure) disclosure.open = true;
    document.querySelectorAll('[data-category]').forEach(button => {
        button.classList.toggle('active', button.dataset.category === category);
        button.setAttribute('aria-pressed', String(button.dataset.category === category));
    });
}

function setProgramBusy(busy) {
    const grid = byId('programList');
    grid.setAttribute('aria-busy', String(busy));
    const submit = document.querySelector('#searchForm button[type="submit"]');
    if (submit) submit.disabled = busy;
}

function renderProgramError(message) {
    const grid = byId('programList');
    grid.innerHTML = `<div class="empty-state" role="alert"><span>${icon('search')}</span><h3>혜택을 불러오지 못했어요</h3><p>${escapeHtml(message)}</p><button id="retryPrograms" class="primary-button" type="button">다시 시도</button></div>`;
    byId('retryPrograms').addEventListener('click', () => loadPrograms());
}

async function loadMeta() {
    try {
        const response = await fetch('/api/programs/meta');
        if (!response.ok) throw new Error();
        const meta = await response.json();
        const counts = {};
        (meta.categories ?? []).forEach(item => {
            const name = normalizedCategory(item.category);
            counts[name] = (counts[name] ?? 0) + Number(item.count || 0);
        });
        state.totalBenefits = Number(meta.storedCount || meta.totalAvailable || 0);
        byId('storedBenefitCount').textContent = `${formatNumber(meta.storedCount)}개 혜택`;
        byId('heroBenefitCount').textContent = `${formatNumber(meta.storedCount || meta.totalAvailable)}개`;
        byId('heroCategoryCount').textContent = `${Math.max(Object.keys(counts).length, categories.length)}개 분야`;
        const labels = { READY:'공식 목록 동기화 완료', SYNCING:'전체 혜택 동기화 중', PARTIAL:'혜택 추가 반영 중', WAITING:'동기화 준비 중', DISABLED:'데이터 연결 필요', ERROR:'마지막 저장 정보 표시 중' };
        byId('syncStatus').textContent = labels[meta.syncStatus] ?? '공식 목록 상태 확인 필요';
        byId('syncUpdatedAt').textContent = meta.lastSyncedAt ? formatFreshness(meta.lastSyncedAt) : '공식 기준일 확인 중';
        byId('resultSourceStatus').textContent = meta.lastSyncedAt ? `공공데이터 기준 · ${formatDateTime(meta.lastSyncedAt)}` : '공공데이터 기준 · 갱신 시각 확인 필요';
        byId('syncDot').classList.toggle('spinning', ['SYNCING','PARTIAL'].includes(meta.syncStatus));
        renderCategoryControls(counts);
        if (['SYNCING','PARTIAL'].includes(meta.syncStatus)) setTimeout(loadMeta, 6000);
    } catch {
        byId('syncStatus').textContent = '마지막 저장 정보 표시 중';
        byId('syncUpdatedAt').textContent = '저장된 기준일 확인 필요';
        byId('resultSourceStatus').textContent = '저장된 공식 정보';
    }
}

function recommendationBadge(item) {
    if (!state.diagnosis) return '';
    if (item.audienceStatus === 'MATCHED') return '<span class="recommendation-chip">내 조건 일치</span>';
    if (item.audienceStatus === 'GENERAL') return '<span class="criteria-chip">공식 기준 확인</span>';
    return '';
}

function currentCriteria() {
    const criteria = [];
    if (state.topic) criteria.push(`모아보기 · ${window.AnsimWorkflow.topics[state.topic]}`);
    const region = byId('region')?.value;
    const category = byId('category')?.value;
    const keyword = byId('keyword')?.value.trim();
    if (region) criteria.push(`지역 · ${region}`);
    if (category) criteria.push(`분야 · ${normalizedCategory(category)}`);
    if (keyword) criteria.push(`검색 · ${keyword}`);
    if (state.diagnosis) {
        if (state.diagnosis.age) criteria.push(`연령 · ${state.diagnosis.age}`);
        if (state.diagnosis.household) criteria.push(`가구 · ${state.diagnosis.household}`);
    }
    return criteria;
}

function renderResultOverview() {
    const criteria = currentCriteria();
    const headline = byId('resultHeadline');
    const copy = byId('resultOverviewCopy');
    const chipBox = byId('activeCriteria');
    if (!headline || !copy || !chipBox) return;
    headline.closest('.result-overview').hidden = criteria.length === 0 || Boolean(state.diagnosis);
    byId('resetSearch').hidden = criteria.length === 0;
    if (state.diagnosis) {
        headline.textContent = `${state.diagnosis.age} · ${state.diagnosis.household} 조건으로 좁혔어요`;
        copy.textContent = '명시적으로 맞는 후보를 먼저 보고, 나머지는 공식 기준을 추가 확인해보세요.';
    } else if (criteria.length) {
        headline.textContent = '선택한 조건으로 혜택을 모았어요';
        copy.textContent = '검색어와 분야를 바꿔가며 더 넓게 탐색하거나, 상세 화면에서 공식 기준을 확인하세요.';
    } else {
        headline.textContent = '전체 공공혜택에서 시작해요';
        copy.textContent = '아직 맞춤 추천 전이에요. 지역과 분야를 고르거나 맞춤 조건으로 결과를 좁혀보세요.';
    }
    chipBox.innerHTML = criteria.length
        ? criteria.map(value => `<span>${escapeHtml(value)}</span>`).join('')
        : '<span class="criteria-empty">아직 선택한 조건이 없어요</span>';
}

function syncQuickFilterButtons() {
    document.querySelectorAll('[data-result-filter]').forEach(button => button.classList.toggle('active', button.dataset.resultFilter === state.quickFilter));
}

function renderPrograms(items) {
    window.AnsimProduct?.syncTopic();
    renderResultOverview();
    byId('count').textContent = `${formatNumber(state.totalResults)}`;
    byId('resultSubcopy').textContent = state.diagnosis
        ? '선택한 조건과 비교한 후보예요. 최종 기준은 공식 공고에서 확인해요.'
        : state.quickFilter === 'urgent' ? '마감이 가까운 혜택부터 확인해보세요.'
        : '지원 내용과 대상을 읽고, 내 생활에 맞는 도움을 찾아보세요.';
    syncQuickFilterButtons();
    const grid = byId('programList');
    if (!items.length) {
        const needsDiagnosis = state.quickFilter === 'matched' && !state.diagnosis;
        grid.innerHTML = `<div class="empty-state"><span>${icon('search')}</span><h3>${needsDiagnosis ? '내 조건을 먼저 알려주세요' : '조건에 맞는 혜택이 없어요'}</h3><p>${needsDiagnosis ? '지역과 생활 상황을 선택하면 맞는 후보를 모아드려요.' : '검색어를 짧게 바꾸거나 지역·분야 조건을 넓혀보세요.'}</p><button class="primary-button" type="button" id="emptyAction">${needsDiagnosis ? '맞춤 조건 선택' : '전체 혜택 보기'}</button></div>`;
        byId('emptyAction').addEventListener('click', () => needsDiagnosis ? openDiagnosis() : byId('resetSearch').click());
        return;
    }
    grid.innerHTML = items.map(programCard).join('');
}

function cardPreview(value, limit) {
    const text = String(value || '').replace(/\s+/g,' ').trim();
    return Array.from(text).length > limit ? Array.from(text).slice(0,limit).join('') + '…' : text;
}

function programCard(item) {
    const category = normalizedCategory(item.category);
    const deadline = deadlineMeta(item);
    const saved = state.savedIds.has(item.id);
    const compared = state.comparisonIds.has(item.id);
    const draft = state.drafts.find(value => value.programId === item.id);
    const progress = draft ? `<div class="card-progress"><span><i style="width:${draft.completionPercent}%"></i></span><b>${escapeHtml(journeyLabels[draft.journeyStatus] || '준비 중')}</b></div>` : '';
    const reason = state.diagnosis && item.audienceStatus === 'MATCHED'
        ? `<p class="audience-reason">${escapeHtml(item.audienceReason || '선택한 조건이 지원대상에 포함돼 있어요.')}</p>` : '';
    return `<article class="benefit-card status-${deadline.status.toLowerCase()}" data-action="detail" data-id="${item.id}">
        <div class="card-copy"><div class="card-meta"><span class="card-category">${escapeHtml(category)}</span><span aria-hidden="true">·</span><span class="card-location">${escapeHtml(item.region || '전국')}</span></div>
        <h3><button class="card-title-button" data-action="detail" data-id="${item.id}" type="button">${escapeHtml(item.title)}</button></h3>
        <p class="benefit-value">${escapeHtml(cardPreview(item.benefit || item.summary || '지원 내용은 공식 상세 안내에서 확인해주세요.', 110))}</p>${reason}${progress}</div>
        <span class="card-open-arrow" aria-hidden="true">${icon('chevron')}</span>
        <div class="card-actions"><span class="deadline-chip ${deadline.status.toLowerCase()}" title="${escapeHtml(deadline.label)}" aria-label="${escapeHtml(deadline.label)}">${escapeHtml(deadline.label)}</span><div class="card-inline-actions"><button class="save-button ${saved ? 'active' : ''}" data-action="save" data-id="${item.id}" type="button" aria-pressed="${saved}" aria-label="${escapeHtml(item.title)} ${saved ? '저장 해제' : '저장'}">${icon('bookmark')}<span>${saved ? '저장됨' : '저장'}</span></button><button class="compare-button ${compared ? 'active' : ''}" data-action="compare" data-id="${item.id}" type="button" aria-pressed="${compared}" aria-label="${escapeHtml(item.title)} ${compared ? '비교에서 빼기' : '비교에 담기'}">${icon(compared ? 'check' : 'compare')}<span>비교</span></button></div></div>
    </article>`;
}

function selectedComparisonItems() {
    return [...state.comparisonIds]
        .map(id => state.items.find(item => item.id === Number(id)))
        .filter(Boolean)
        .slice(0, 3);
}

function comparisonValue(value, fallback = '공식 상세에서 확인') {
    return hasText(value) ? escapeHtml(value) : `<span class="compare-muted">${escapeHtml(fallback)}</span>`;
}

function renderComparison() {
    const table = byId('compareTable');
    const items = selectedComparisonItems();
    table.style.setProperty('--compare-count', Math.max(1, items.length));
    byId('compareStartPreparation').disabled = !items.length;
    byId('compareShare').disabled = !items.length;
    byId('compareClear').disabled = !state.comparisonIds.size;
    if (!items.length) {
        table.innerHTML = '<div class="compare-empty"><span>＋</span><h3>비교할 혜택을 담아보세요</h3><p>혜택 목록에서 ‘비교’를 누르면 지원대상과 신청방식을 한 화면에서 비교할 수 있어요.</p></div>';
        return;
    }
    const rows = [
        ['분야', item => normalizedCategory(item.category)],
        ['지역', item => item.region || '전국'],
        ['지원 대상', item => item.target],
        ['지원 내용', item => item.benefit],
        ['신청 기간', item => item.deadline || '공식 안내 확인'],
        ['신청 방식', item => applicationChannel(item).label]
    ];
    table.innerHTML = `<div class="compare-columns" role="row"><div class="compare-label compare-label-head" role="columnheader">비교 항목</div>${items.map(item => `<div class="compare-program-head" role="columnheader"><span>${escapeHtml(normalizedCategory(item.category))}</span><strong>${escapeHtml(item.title)}</strong><button type="button" class="compare-remove" data-compare-action="remove" data-id="${item.id}">비교에서 빼기</button></div>`).join('')}</div>${rows.map(([label, getter]) => `<div class="compare-row" role="row"><div class="compare-label" role="rowheader">${escapeHtml(label)}</div>${items.map(item => `<div class="compare-cell" role="cell">${comparisonValue(getter(item))}</div>`).join('')}</div>`).join('')}<div class="compare-row compare-row-action" role="row"><div class="compare-label" role="rowheader">다음 행동</div>${items.map(item => `<div class="compare-cell" role="cell"><button type="button" class="ghost-button compare-detail" data-compare-action="detail" data-id="${item.id}">상세 보기 <span>→</span></button></div>`).join('')}</div>`;
}

async function shareComparison() {
    const items = selectedComparisonItems();
    if (!items.length) return;
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('compare', items.map(item => item.id).join(','));
    url.hash = 'discover';
    const shareData = {
        title: '안심생활 혜택 비교',
        text: '안심생활에서 비교한 공공혜택을 확인해보세요.',
        url: url.toString()
    };
    try {
        if (typeof navigator.share === 'function') await navigator.share(shareData);
        else await copyText(shareData.url, '비교 링크를 복사했어요.');
    } catch (error) {
        if (error?.name !== 'AbortError') await copyText(shareData.url, '비교 링크를 복사했어요.');
    }
}

async function openComparison() {
    if (!state.comparisonIds.size) {
        showToast('혜택 목록에서 비교할 항목을 먼저 담아보세요.');
        return 0;
    }
    openDialog(byId('compareDialog'));
    byId('compareTable').innerHTML = '<div class="compare-loading" role="status"><i></i><span>비교 정보를 준비하고 있어요</span></div>';
    const missingIds = [...state.comparisonIds].filter(id => !state.items.some(item => item.id === Number(id)));
    const loaded = await Promise.allSettled(missingIds.map(loadProgramById));
    loaded.forEach((result, index) => {
        if (result.status === 'fulfilled' && !result.value) state.comparisonIds.delete(Number(missingIds[index]));
    });
    if (loaded.some(result => result.status === 'rejected')) showToast('일부 비교 정보를 불러오지 못했어요. 잠시 후 다시 열어주세요.');
    writeStorage('ansimlife.compare', [...state.comparisonIds]);
    syncCounts();
    renderComparison();
    return selectedComparisonItems().length;
}

function toggleComparison(id) {
    const previousFocus = document.activeElement;
    if (state.comparisonIds.has(id)) {
        state.comparisonIds.delete(id);
    } else {
        if (state.comparisonIds.size >= 3) {
            showToast('비교는 최대 3개까지 가능해요. 하나를 빼고 담아주세요.');
            return;
        }
        state.comparisonIds.add(id);
        showToast('비교 목록에 담았어요.');
    }
    writeStorage('ansimlife.compare', [...state.comparisonIds]);
    syncCounts();
    renderPrograms(state.visibleItems);
    renderSaved();
    if (byId('compareDialog').open) renderComparison();
    if(previousFocus?.matches('[data-action="compare"]') && !previousFocus.isConnected) {
        const list = byId(document.body.dataset.view === 'saved' ? 'savedList' : 'programList');
        list.querySelector('button[data-action="compare"][data-id="'+id+'"]')?.focus({preventScroll:true});
    }
}

function setQuickFilter(filter) {
    state.quickFilter = filter;
    syncQuickFilterButtons();
    if (filter === 'matched' && !state.diagnosis) {
        window.AnsimWorkspace?.searchChanged();
        state.searchController?.abort();
        state.loading = false;
        setProgramBusy(false);
        state.visibleItems = [];
        state.totalResults = 0;
        state.hasMore = false;
        byId('loadMore').hidden = true;
        renderPrograms([]);
        return;
    }
    loadPrograms();
}

async function loadPrograms(page = 0, append = false) {
    if (!append && page === 0) window.AnsimWorkspace?.searchChanged();
    if (append && state.loading) return;
    if (state.quickFilter === 'matched' && !state.diagnosis) {
        state.searchController?.abort();
        state.totalResults = 0; state.visibleItems = []; state.hasMore = false;
        byId('loadMore').hidden = true; state.loading = false; setProgramBusy(false);
        renderPrograms([]); return;
    }
    state.searchController?.abort();
    const controller = new AbortController();
    state.searchController = controller;
    state.loading = true; setProgramBusy(true);
    if (!append) byId('programList').innerHTML = '<div class="loading-state" role="status"><i></i><span>필요한 혜택을 찾고 있어요</span></div>';
    else { byId('loadMore').disabled = true; byId('loadMore').textContent = '불러오는 중…'; }
    const query = new URLSearchParams({
        keyword: byId('keyword').value.trim(), region: byId('region').value,
        category: byId('category').value, sort: state.sortOrder,
        hideClosed: String(state.hideClosed), page: String(page), size: '12'
    });
    if (state.quickFilter !== 'all') query.set('filter', state.quickFilter);
    if (state.topic) query.set('topic', state.topic);
    if (state.diagnosis?.age) query.set('age', state.diagnosis.age);
    if (state.diagnosis?.household) query.set('household', state.diagnosis.household);
    try {
        const response = await fetch(`/api/programs?${query}`, { signal:controller.signal });
        if (!response.ok) throw new Error(await errorMessage(response, '혜택을 불러오지 못했어요.'));
        const result = await response.json();
        if (controller.signal.aborted) return;
        const incoming = result.items ?? [];
        if (append) {
            const known = new Set(state.visibleItems.map(item => item.id));
            state.visibleItems = [...state.visibleItems, ...incoming.filter(item => !known.has(item.id))];
        } else state.visibleItems = incoming;
        const cache = new Map(state.items.map(item => [item.id, item]));
        incoming.forEach(item => cache.set(item.id, item));
        state.items = [...cache.values()];
        state.currentPage = Number(result.page || 0); state.totalResults = Number(result.total || 0);
        state.hasMore = result.hasMore === true; byId('loadMore').hidden = !state.hasMore;
        renderPrograms(state.visibleItems); renderSaved();
    } catch (error) {
        if (error.name !== 'AbortError') {
            if (append) showToast('더 불러오지 못했어요. 잠시 후 다시 눌러주세요.');
            else renderProgramError(error.message);
        }
    } finally {
        if (state.searchController === controller) {
            state.loading = false; setProgramBusy(false); byId('loadMore').disabled = false;
            byId('loadMore').innerHTML = `혜택 더 보기 ${icon('arrow')}`;
        }
    }
}

function toggleSaved(id) {
    const previousFocus = document.activeElement;
    state.savedIds.has(id) ? state.savedIds.delete(id) : state.savedIds.add(id);
    writeStorage('ansimlife.saved', [...state.savedIds]);
    showToast(state.savedIds.has(id) ? '저장했어요. 저장한 혜택에서 다시 볼 수 있어요.' : '저장을 해제했어요.');
    syncCounts();
    renderPrograms(state.visibleItems);
    renderSaved();
    if (state.activeDetail?.id === id) syncDetailSaveButton();
    if(previousFocus?.matches('[data-action="save"]') && !previousFocus.isConnected) {
        const list = byId(document.body.dataset.view === 'saved' ? 'savedList' : 'programList');
        const replacement = list.querySelector('button[data-action="save"][data-id="'+id+'"]');
        (replacement || (document.body.dataset.view === 'saved' ? byId('savedSection').querySelector('h1') : null))?.focus({preventScroll:true});
    }
}

function renderSaved() {
    if (window.AnsimProduct) return window.AnsimProduct.renderSaved();
    const items = [...state.savedIds].map(id => ({id,item:state.items.find(value=>value.id===id)}));
    byId('savedList').innerHTML = items.length ? items.map(({id,item}) => item ? programCard(item) : '<article class="benefit-card saved-unavailable"><h2>혜택 정보를 불러오지 못했어요</h2><p>혜택 번호 '+id+'</p><div><button class="ghost-button" data-action="retry-saved" data-id="'+id+'" type="button">다시 불러오기</button><button class="text-button" data-action="remove-saved" data-id="'+id+'" type="button">저장 해제</button></div></article>').join('') : '<div class="empty-state"><span>'+icon('bookmark')+'</span><h2>다시 볼 혜택을 모아보세요</h2><p>혜택 카드의 저장 버튼을 누르면<br>이곳에서 다시 확인할 수 있어요.</p><button class="primary-button" type="button" data-return-discover>혜택 찾아보기 '+icon('arrow')+'</button></div>';
}

function draftStatus(draft) {
    if (draft.status === 'SUBMITTED' && draft.externalReceiptNumber) return { label:'기관 접수 확인 완료', tone:'confirmed', verified:true };
    const status = draft.journeyStatus || 'PREPARING';
    const tone = ['APPROVED'].includes(status) ? 'success' : ['SUPPLEMENT_REQUESTED','REJECTED'].includes(status) ? 'warning' : status === 'PREPARING' ? 'neutral' : 'active';
    return { label: journeyLabels[status] || '혜택 준비 중', tone, verified:false };
}

function renderApplications() {
    if (window.AnsimWorkspace) return window.AnsimWorkspace.renderApplications();
    syncCounts();
    byId('applicationList').innerHTML = state.drafts.length ? state.drafts.map(draft => {
        const status = draftStatus(draft);
        return `<article class="application-card">
            <header><span class="journey-status ${status.tone}">${status.verified ? '✓ ' : ''}${escapeHtml(status.label)}</span><small>${formatDateTime(draft.updatedAt)} 업데이트</small></header>
            <h3>${escapeHtml(draft.programTitle)}</h3>
            ${draft.userReceiptMemo ? `<p class="receipt-memo">내 메모 · ${escapeHtml(draft.userReceiptMemo)}</p>` : ''}
            ${draft.externalReceiptNumber ? `<p class="verified-receipt">기관 접수번호 <strong>${escapeHtml(draft.externalReceiptNumber)}</strong></p>` : ''}
            <div class="application-progress"><span><i style="width:${draft.completionPercent}%"></i></span><b>${draft.completionPercent}% 준비</b></div>
            <footer><span>${draft.nextActionDate ? `다음 확인 ${formatDate(draft.nextActionDate)}` : '다음 확인일 미설정'}</span><div>${draft.status !== 'SUBMITTED' ? `<button class="text-button" data-draft-action="delete" data-id="${draft.id}" type="button">삭제</button>` : ''}<button class="primary-button" data-draft-action="resume" data-program-id="${draft.programId}" type="button">이어가기</button></div></footer>
        </article>`;
    }).join('') : '<div class="empty-inline">아직 관리 중인 혜택이 없어요. 혜택 카드에서 ‘신청 준비’를 눌러 시작해보세요.</div>';
}

function profileToDiagnosis(profile) {
    if (!profile?.exists) return null;
    return {
        region: profile.region,
        age: profile.ageGroup,
        need: profile.need,
        household: profile.household,
        incomeRange: profile.incomeRange || ''
    };
}

function renderMemberProfile() {
    const card = byId('memberProfileCard');
    if (!card) return;
    const profile = state.profile;
    card.hidden = !profile?.exists;
    if (!profile?.exists) return;
    byId('memberProfileSummary').textContent = `${profile.region} · ${profile.ageGroup} · ${profile.need} · ${profile.household}`;
    byId('memberProfileUpdated').textContent = profile.updatedAt ? `${formatDateTime(profile.updatedAt)} 저장` : '저장된 맞춤 조건';
}

async function loadProfile() {
    if (!state.signedIn) {
        state.profile = null;
        renderMemberProfile();
        return null;
    }
    const authGeneration = state.authGeneration;
    try {
        const response = await fetch('/api/profile');
        if (!response.ok) throw new Error();
        const profile = await response.json();
        if (authGeneration !== state.authGeneration) return null;
        state.profile = profile;
        const savedDiagnosis = profileToDiagnosis(state.profile);
        if (savedDiagnosis) {
            state.diagnosis = savedDiagnosis;
            writeStorage('ansimlife.diagnosis', state.diagnosis);
            restoreDiagnosisFilters();
            renderDiagnosisSummary();
        }
        renderMemberProfile();
        return state.profile;
    } catch {
        if (authGeneration !== state.authGeneration) return null;
        state.profile = null;
        renderMemberProfile();
        return null;
    }
}

async function saveProfile(profile) {
    if (!state.signedIn) return true;
    const authGeneration = state.authGeneration;
    try {
        const response = await fetch('/api/profile', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                region: profile.region,
                ageGroup: profile.age,
                household: profile.household,
                need: profile.need,
                incomeRange: profile.incomeRange || ''
            })
        });
        if (!response.ok) throw new Error(await errorMessage(response, '맞춤 조건을 저장하지 못했어요.'));
        const saved = await response.json();
        if (authGeneration !== state.authGeneration) return false;
        state.profile = saved;
        renderMemberProfile();
        return true;
    } catch (error) {
        showToast(error.message);
        return false;
    }
}

async function loadSession() {
    try {
        const response = await fetch('/api/auth/me');
        state.currentUser = await response.json();
        state.signedIn = state.currentUser.authenticated === true;
    } catch { state.currentUser = null; state.signedIn = false; }
    await loadProfile();
    syncAuthUI();
}

async function loadDrafts() {
    if (!state.signedIn) { state.drafts = []; state.draftsError = null; renderApplications(); return; }
    const authGeneration = state.authGeneration;
    try {
        const response = await fetch('/api/applications/drafts');
        if (!response.ok) throw new Error(await errorMessage(response, '진행 중인 혜택을 불러오지 못했어요.'));
        const drafts = await response.json();
        if (!Array.isArray(drafts)) throw new Error('진행 중인 혜택 응답을 확인하지 못했어요.');
        if (!state.signedIn || authGeneration !== state.authGeneration) return;
        state.drafts = drafts;
        state.draftsError = null;
    } catch (error) {
        if (!state.signedIn || authGeneration !== state.authGeneration) return;
        state.draftsError = error.message || '진행 중인 혜택을 불러오지 못했어요.';
    }
    renderApplications();
    renderPrograms(state.visibleItems);
}

async function loadProgramById(programId) {
    let item = state.items.find(value => value.id === Number(programId));
    if (item) return item;
    const response = await fetch(`/api/programs/${programId}`);
    if (response.status === 404 || response.status === 410) return null;
    if (!response.ok) throw new Error(await errorMessage(response, '혜택을 불러오지 못했어요.'));
    item = await response.json();
    state.items.push(item);
    return item;
}

async function fetchDetail(item, {refresh = false} = {}) {
    const cached = state.detailCache.get(item.id);
    const lifetime = cached?.detail.sourceLive ? 10 * 60_000 : 60_000;
    if (!refresh && cached && Date.now() - cached.storedAt < lifetime) {
        return {...cached.detail, sourceCached:cached.detail.sourceLive};
    }
    try {
        const response = await fetch(`/api/programs/${item.id}/detail${refresh ? '?refresh=true' : ''}`);
        if (!response.ok) throw new Error();
        const detail = await response.json();
        state.detailCache.set(item.id, {detail, storedAt:Date.now()});
        return detail;
    } catch {
        if (cached) return {...cached.detail, sourceCached:cached.detail.sourceLive, refreshFailed:true};
        const fallback = { ...item, sourceLive:false, refreshFailed:true, onlineUrl:item.applyUrl, application:applicationChannel(item) };
        return fallback;
    }
}

function setDetailSection(name, id, value) {
    const section = document.querySelector(`[data-detail-section="${name}"]`);
    section.hidden = !hasText(value);
    byId(id).textContent = value || '';
}

function renderBenefitDetail(item, detail) {
    const merged = { ...item, ...detail, application:detail.application ?? applicationChannel(item) };
    state.activeDetail = merged;
    byId('benefitDetailCategory').textContent = normalizedCategory(merged.category);
    byId('benefitDetailIcon').innerHTML = icon(categoryIcons[normalizedCategory(merged.category)] || 'leaf');
    byId('benefitDetailRegion').textContent = merged.region || '전국';
    byId('benefitDetailSource').textContent = merged.sourceLive
        ? merged.refreshFailed ? '이전 공식 조회 정보' : merged.sourceCached ? '공식 조회 정보' : '공식 상세 연결됨'
        : '저장 정보 표시 중';
    byId('benefitDetailSource').classList.toggle('offline', !merged.sourceLive || merged.refreshFailed);
    byId('benefitDetailTitle').textContent = merged.title;
    byId('benefitDetailSummary').textContent = merged.summary || merged.purpose || '공식 상세정보를 확인해주세요.';
    byId('benefitDetailDeadline').textContent = merged.deadline || '공식 안내 확인';
    byId('benefitDetailFactRegion').textContent = merged.region || '전국';
    byId('benefitDetailFactAgency').textContent = merged.agency || merged.department || '담당기관 확인';
    setDetailSection('purpose', 'benefitDetailPurpose', merged.purpose);
    setDetailSection('target', 'benefitDetailTarget', merged.target);
    setDetailSection('benefit', 'benefitDetailBenefit', merged.benefit);
    setDetailSection('criteria', 'benefitDetailCriteria', merged.criteria);
    setDetailSection('applicationMethod', 'benefitDetailMethod', merged.applicationMethod);

    const documents = { required:merged.requiredDocuments, official:merged.officialDocuments, identity:merged.identityDocuments };
    Object.entries(documents).forEach(([name, value]) => {
        document.querySelector(`[data-document="${name}"]`).hidden = !hasText(value);
        byId(`benefitDetail${name[0].toUpperCase()}${name.slice(1)}Documents`).textContent = value || '';
    });
    byId('benefitDetailDocuments').hidden = !Object.values(documents).some(hasText);

    const contacts = { agency:merged.agency || merged.department, reception:merged.receptionAgency, contact:merged.contact };
    Object.entries(contacts).forEach(([name, value]) => document.querySelector(`[data-contact="${name}"]`).hidden = !hasText(value));
    byId('benefitDetailAgency').textContent = merged.agency || merged.department || '';
    byId('benefitDetailDepartment').textContent = merged.department && merged.department !== merged.agency ? merged.department : '';
    byId('benefitDetailReception').textContent = merged.receptionAgency || '';
    byId('benefitDetailContact').textContent = merged.contact || '';

    const channel = merged.application;
    const route = byId('benefitDetailRoute');
    route.className = `route-banner route-${channelClass(channel.mode)}`;
    route.querySelector('i').textContent = channel.directAvailable ? '✓' : channel.mode === 'NO_APPLICATION' ? 'i' : '↗';
    route.querySelector('strong').textContent = channel.label;
    route.querySelector('p').textContent = routeDescription(merged, channel);
    const official = byId('benefitDetailOfficial');
    const officialUrl = officialUrlFor(merged);
    official.hidden = !officialUrl;
    if (officialUrl) official.href = officialUrl;
    else official.removeAttribute('href');
    byId('benefitDetailNotice').textContent = merged.sourceLive ? `행정안전부 공공서비스 상세정보${merged.sourceUpdatedAt ? ` · 수정 ${merged.sourceUpdatedAt}` : ''}` : '현재 저장된 정보를 표시합니다. 최종 조건은 공식 안내에서 확인해주세요.';
    byId('benefitDetailFetchedAt').textContent = merged.sourceFetchedAt
        ? `공식 조회 ${formatDateTime(merged.sourceFetchedAt)}${merged.sourceCached ? ' · 이전 조회 정보' : ''}` : '공식 조회 시각을 확인할 수 없어 저장 정보를 표시해요.';
    byId('benefitDetailRefresh').hidden = !merged.refreshAvailable;
    byId('benefitDetailRefreshStatus').textContent = merged.refreshFailed
        ? '공식 연결이 지연되어 이전 정보를 표시해요. 잠시 후 다시 확인하거나 공식 안내를 열어주세요.'
        : merged.refreshLimited ? '최근 1분 안에 확인한 공식 정보예요.' : '';
    syncDetailSaveButton();
    byId('benefitDetailLoading').hidden = true;
    byId('benefitDetailContent').hidden = false;
    byId('benefitDetailPrepare').disabled = false;
}

function syncDetailSaveButton() {
    if (!state.activeDetail) return;
    const saved = state.savedIds.has(state.activeDetail.id);
    byId('benefitDetailSave').innerHTML = `${icon('bookmark')} ${saved ? '저장됨' : '저장하기'}`;
    byId('benefitDetailSave').setAttribute('aria-pressed', String(saved));
    byId('benefitDetailSave').classList.toggle('active', saved);
}

async function openBenefitDetail(item) {
    const epoch = ++state.detailRequestEpoch;
    byId('benefitDetailRefresh').disabled = false;
    byId('benefitDetailRefresh').removeAttribute('aria-busy');
    byId('benefitDetailRefresh').textContent = '최신정보 다시 확인';
    state.activeDetail = item;
    rememberProgram(item);
    byId('benefitDetailTitle').textContent = item.title;
    byId('benefitDetailLoading').hidden = false;
    byId('benefitDetailContent').hidden = true;
    byId('benefitDetailPrepare').disabled = true;
    openDialog(byId('benefitDetailDialog'));
    byId('benefitDetailScroll').scrollTop = 0;
    const detail = await fetchDetail(item);
    if (state.detailRequestEpoch === epoch && byId('benefitDetailDialog').open && state.activeDetail?.id === item.id) renderBenefitDetail(item, detail);
}

async function refreshBenefitDetail() {
    const item = state.activeDetail;
    if (!item || !item.refreshAvailable) return;
    const epoch = ++state.detailRequestEpoch;
    const button = byId('benefitDetailRefresh');
    button.disabled = true; button.setAttribute('aria-busy','true'); button.textContent = '공식 정보 확인 중…';
    byId('benefitDetailRefreshStatus').textContent = '공식 기관의 현재 정보를 확인하고 있어요.';
    const detail = await fetchDetail(item, {refresh:true});
    if (state.detailRequestEpoch !== epoch) return;
    button.disabled = false; button.removeAttribute('aria-busy'); button.textContent = '최신정보 다시 확인';
    if (byId('benefitDetailDialog').open && state.activeDetail?.id === item.id) renderBenefitDetail(item, detail);
}

function callScript(detail) {
    const contact = detail.contact ? ` 문의처는 ${detail.contact}로 확인했습니다.` : '';
    return `안녕하세요. ‘${detail.title}’ 지원을 보고 문의드립니다.${contact} 제가 지원 대상에 해당하는지, 현재 신청 가능한지, 직접 준비해야 할 서류와 접수 방법을 확인하고 싶습니다.`;
}

async function copyText(value, message = '문의 문장을 복사했어요.') {
    try {
        let copied = false;
        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(value);
                copied = true;
            } catch { /* Fall back to the selection-based copy below. */ }
        }
        if (!copied) {
            const textarea = document.createElement('textarea');
            textarea.value = value;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'fixed';
            textarea.style.top = '-9999px';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            copied = document.execCommand('copy');
            textarea.remove();
            if (!copied) throw new Error('copy failed');
        }
        showToast(message);
    } catch { showToast('복사하지 못했어요. 문장을 길게 눌러 복사해주세요.'); }
}

function openFeedback() {
    if (!state.activeDetail) return;
    byId('feedbackForm').reset();
    byId('feedbackProgramTitle').textContent = state.activeDetail.title;
    byId('feedbackError').textContent = '';
    byId('feedbackSubmit').disabled = false;
    byId('benefitDetailDialog').close();
    openDialog(byId('feedbackDialog'));
}

async function submitFeedback(event) {
    event.preventDefault();
    const type = document.querySelector('input[name="feedbackType"]:checked')?.value;
    const message = byId('feedbackMessage').value.trim();
    const error = byId('feedbackError');
    if (!type) {
        error.textContent = '확인할 항목을 하나 선택해주세요.';
        return;
    }
    if (message.length < 5) {
        error.textContent = '확인한 내용을 5자 이상 적어주세요.';
        byId('feedbackMessage').focus();
        return;
    }
    const button = byId('feedbackSubmit');
    button.disabled = true;
    error.textContent = '';
    try {
        const response = await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ programId: state.activeDetail?.id, type, message })
        });
        if (!response.ok) throw new Error(await errorMessage(response, '제보를 보내지 못했어요.'));
        byId('feedbackDialog').close();
        showToast('제보가 접수됐어요. 확인 후 혜택 정보를 점검할게요.');
    } catch (submissionError) {
        error.textContent = submissionError.message || '잠시 후 다시 시도해주세요.';
    } finally {
        button.disabled = false;
    }
}

function possibilityFor(item) {
    if (!state.diagnosis) return { tone:'unknown', icon:'?', title:'추가 확인이 필요해요', copy:'공식 대상 조건을 읽고 직접 확인해주세요.' };
    if (item.audienceStatus === 'MATCHED') {
        return { tone:'candidate', icon:'shield', title:'선택한 조건과 일치하는 후보예요', copy:item.audienceReason || '지원대상 문구에 선택한 조건이 포함돼 있어요. 소득·재산 등 세부 기준은 공식 안내에서 확인해주세요.' };
    }
    if (item.audienceStatus === 'GENERAL') {
        return { tone:'unknown', icon:'?', title:'공식 기준을 한 번 더 확인해주세요', copy:item.audienceReason || '연령·가구 조건이 데이터에 명확하지 않아 공식 대상·선정기준을 직접 확인해야 해요.' };
    }
    return { tone:'unknown', icon:'?', title:'세부 조건 확인이 필요해요', copy:'공식 대상·선정기준을 읽고 해당 여부를 확인해주세요.' };
}

function renderPreparationDetail(item, detail) {
    const merged = { ...item, ...detail, application:detail.application ?? applicationChannel(item) };
    state.activeProgram = merged;
    byId('preparationTarget').textContent = merged.target || item.target || '상세 조건 확인 필요';
    byId('eligibilityTarget').textContent = merged.target || item.target || '';
    byId('preparationBenefit').textContent = merged.benefit || item.benefit || '지원 내용 확인 필요';
    byId('preparationDeadline').textContent = merged.deadline || item.deadline || '신청기간 확인 필요';
    const documents = [merged.requiredDocuments, merged.officialDocuments, merged.identityDocuments].filter(hasText).join('\n\n');
    byId('officialDocumentPreview').textContent = documents || '공식 상세정보에 제출서류가 따로 기재되지 않았습니다. 접수기관에 필요한 서류를 확인해주세요.';
    const possibility = possibilityFor(merged);
    const card = byId('possibilityCard');
    card.className = `possibility-card ${possibility.tone}`;
    card.querySelector('i').innerHTML = icon(possibility.tone === 'candidate' ? 'check' : 'search');
    card.querySelector('strong').textContent = possibility.title;
    card.querySelector('p').textContent = possibility.copy;
    byId('callScriptText').textContent = callScript(merged);
    renderChecklist(merged, true);
    updateReview();
}

function checklistItems(item) {
    const channel = applicationChannel(item);
    return [
        '지원 대상과 선정 기준을 읽고 내 상황과 비교했어요',
        hasText(item.requiredDocuments) ? '공식 안내에 나온 직접 제출서류를 준비했어요' : '접수기관에 필요한 제출서류를 확인했어요',
        `신청기간과 ${item.receptionAgency || item.agency || '접수기관'} 정보를 확인했어요`,
        channel.mode === 'NO_APPLICATION' ? '별도 신청 없이 제공되는 조건을 확인했어요' : '공식 신청 화면에서 최종 조건을 다시 확인할 준비가 됐어요'
    ];
}

function renderChecklist(item, preserveCurrent = false) {
    const draft = state.drafts.find(value => value.programId === item.id);
    const localChecks = readStorage(`ansimlife.checks.${item.id}`, []);
    const savedChecks = preserveCurrent
        ? [...document.querySelectorAll('#checklist input:checked')].map(input => Number(input.dataset.checkIndex))
        : draft && Array.isArray(draft.checkedItems)
            ? draft.checkedItems.map(id => checklistIds.indexOf(id)).filter(index => index >= 0)
            : draft?.documentsReady ? [0,1,2,3]
            : Array.isArray(localChecks) ? localChecks.filter(index => Number.isInteger(index) && index >= 0 && index < checklistIds.length) : [];
    byId('checklist').innerHTML = checklistItems(item).map((label, index) => `<label><input type="checkbox" data-check-index="${index}" ${savedChecks.includes(index) ? 'checked' : ''}><span>${escapeHtml(label)}</span></label>`).join('');
    updateChecklistProgress();
}

async function openPreparation(item, requestedStep) {
    state.preparationEpoch += 1;
    state.activeProgram = item;
    byId('saveDraft').disabled = false;
    byId('saveDraft').textContent = '체크 저장';
    byId('saveJourney').disabled = false;
    const draft = state.drafts.find(value => value.programId === item.id);
    byId('preparationLabel').textContent = `${item.region || '전국'} · ${normalizedCategory(item.category)}`;
    byId('preparationTitle').textContent = item.title;
    byId('preparationContext').textContent = item.title;
    byId('preparationSummary').textContent = item.summary || '';
    byId('preparationTarget').textContent = item.target || '';
    byId('preparationBenefit').textContent = item.benefit || '';
    byId('preparationDeadline').textContent = item.deadline || '확인 필요';
    byId('eligibilityTarget').textContent = item.target || '';
    byId('eligibilityConfirmed').checked = draft?.eligibilityConfirmed ?? false;
    byId('journeyStatus').value = draft?.journeyStatus === 'INSTITUTION_CONFIRMED' ? 'RESULT_WAITING' : draft?.journeyStatus || 'PREPARING';
    byId('userReceiptMemo').value = draft?.userReceiptMemo ?? '';
    byId('nextActionDate').value = draft?.nextActionDate ?? '';
    renderInstitutionReceipt(draft);
    renderChecklist(item);
    byId('officialDocumentPreview').textContent = '공식 상세정보를 불러오는 중이에요.';
    byId('callScriptText').textContent = callScript(item);
    setStep(requestedStep || (draft && draft.journeyStatus && draft.journeyStatus !== 'PREPARING' ? 3 : 1));
    openDialog(byId('preparationDialog'));
    const detail = await fetchDetail(item);
    if (state.activeProgram?.id === item.id) renderPreparationDetail(item, detail);
}

function renderInstitutionReceipt(draft) {
    const confirmed = draft?.status === 'SUBMITTED' && hasText(draft.externalReceiptNumber);
    byId('institutionReceipt').hidden = !confirmed;
    byId('journeyForm').hidden = confirmed;
    if (confirmed) {
        byId('institutionReceiptNumber').textContent = `접수번호 ${draft.externalReceiptNumber}`;
        byId('institutionReceiptAgency').textContent = draft.externalAgency || '연결된 접수기관';
    }
}

function setStep(step) {
    state.activeStep = Math.min(3, Math.max(1, Number(step)));
    document.querySelectorAll('.stepper [data-step]').forEach(button => { button.classList.toggle('active', Number(button.dataset.step) <= state.activeStep); if (Number(button.dataset.step) === state.activeStep) button.setAttribute('aria-current','step'); else button.removeAttribute('aria-current'); });
    document.querySelectorAll('.step-pane').forEach(pane => pane.classList.toggle('active', Number(pane.dataset.pane) === state.activeStep));
    syncPreparationActions();
    byId('preparationDialog').querySelector('.step-content').scrollTop = 0;
    if (state.activeStep === 2) updateReview();
}

function syncPreparationActions() {
    if (!byId('preparationDialog') || !state.activeProgram) return;
    const draft = state.drafts.find(value => value.programId === state.activeProgram.id);
    const submitted = draft?.status === 'SUBMITTED';
    const officialUrl = officialUrlFor(state.activeProgram);
    byId('stepBack').hidden = state.activeStep === 1;
    byId('stepNext').hidden = state.activeStep === 3;
    byId('loginToSave').hidden = state.signedIn || submitted || state.activeStep === 2;
    byId('saveDraft').hidden = !state.signedIn || submitted;
    byId('officialApply').hidden = state.activeStep !== 2 || submitted || !officialUrl;
    if (officialUrl) byId('officialApply').href = officialUrl;
    else byId('officialApply').removeAttribute('href');
}

function updateChecklistProgress() {
    const inputs = [...document.querySelectorAll('#checklist input')];
    const checked = inputs.filter(input => input.checked);
    byId('checkProgress').textContent = `${checked.length} / ${inputs.length} 완료`;
    if (state.activeProgram) writeStorage(`ansimlife.checks.${state.activeProgram.id}`, checked.map(input => Number(input.dataset.checkIndex)));
    updateReview();
}

function formValue(id) { return byId(id).value.trim(); }

function collectDraft() {
    const checklist = [...document.querySelectorAll('#checklist input')];
    const checkedItems = checklist.filter(input => input.checked)
        .map(input => checklistIds[Number(input.dataset.checkIndex)]).filter(Boolean);
    return {
        programId: state.activeProgram.id,
        eligibilityConfirmed:byId('eligibilityConfirmed').checked,
        documentsReady:checklist.length > 0 && checklist.every(input => input.checked),
        checkedItems
    };
}

function updateReview() {
    if (!state.activeProgram) return;
    const values = collectDraft();
    const item = state.activeProgram;
    const channel = applicationChannel(item);
    const entries = [
        ['지원대상', values.eligibilityConfirmed ? '확인 완료' : '확인 필요', values.eligibilityConfirmed],
        ['준비서류', values.documentsReady ? '체크 완료' : '확인 필요', values.documentsReady],
        ['신청기간', (item.deadline || '공식 안내 확인').replace(/[~～]/g, ' ~ '), true],
        ['접수기관', item.receptionAgency || item.agency || '공식 안내 확인', true]
    ];
    byId('reviewGrid').innerHTML = entries.map(([label,value,complete]) => `<div><span>${label}</span><strong class="${complete ? '' : 'missing'}">${escapeHtml(value)}</strong></div>`).join('');
    const route = byId('applicationRoute');
    route.className = `application-route route-${channelClass(channel.mode)}`;
    route.innerHTML = `<i>${channel.directAvailable ? '✓' : channel.mode === 'NO_APPLICATION' ? 'i' : '↗'}</i><div><span>현재 신청 방식</span><strong>${escapeHtml(channel.label)}</strong><p>${escapeHtml(routeDescription(item, channel))}</p></div>`;
    const complete = values.eligibilityConfirmed && values.documentsReady;
    const status = byId('readyStatus');
    status.classList.toggle('complete', complete);
    status.innerHTML = !officialUrlFor(item) ? '<i>i</i><div><strong>공식 기관 안내를 확인해주세요</strong><p>연결할 온라인 주소가 없어요. 위의 신청 방법과 문의처를 확인해주세요.</p></div>'
        : complete ? '<i>✓</i><div><strong>공식 신청처로 이동할 준비가 됐어요</strong><p>개인정보와 증빙서류는 공식 기관 화면에서만 입력해주세요.</p></div>' : '<i>⌛</i><div><strong>확인할 항목이 남아 있어요</strong><p>공식 신청처는 바로 열 수 있고, 체크를 마치면 준비 누락을 줄일 수 있어요.</p></div>';
    syncPreparationActions();
}

async function saveDraft({ silent = false } = {}) {
    if (!state.activeProgram) return null;
    if (!state.signedIn) { if (!silent) openAuth(); return null; }
    const authGeneration = state.authGeneration;
    const preparationEpoch = state.preparationEpoch;
    const payload = collectDraft();
    const button = byId('saveDraft');
    button.disabled = true;
    const original = button.textContent;
    button.textContent = '저장 중…';
    try {
        const response = await fetch('/api/applications/drafts', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
        if (!response.ok) throw new Error(await errorMessage(response, '작성 내용을 저장하지 못했어요.'));
        const draft = await response.json();
        if (authGeneration !== state.authGeneration) return null;
        state.drafts = [draft, ...state.drafts.filter(value => value.id !== draft.id)];
        renderApplications(); renderPrograms(state.visibleItems);
        if (state.preparationEpoch === preparationEpoch && state.activeProgram?.id === payload.programId && byId('preparationDialog').open) {
            renderInstitutionReceipt(draft); syncPreparationActions();
            if (!silent) showToast(draft.status === 'READY_TO_SUBMIT' ? '조건과 서류 체크를 저장했어요.' : '현재 준비상태를 저장했어요.');
        }
        return draft;
    } catch (error) {
        if (!silent && authGeneration === state.authGeneration && state.preparationEpoch === preparationEpoch) showToast(error.message);
        return null;
    } finally {
        if (state.preparationEpoch === preparationEpoch && state.activeProgram?.id === payload.programId) {
            button.disabled = false; button.textContent = original;
        }
    }
}

async function updateJourney(status, receiptMemo, nextActionDate, { silent = false } = {}) {
    const authGeneration = state.authGeneration;
    const preparationEpoch = state.preparationEpoch;
    const programId = state.activeProgram.id;
    let draft = state.drafts.find(value => value.programId === programId);
    const current = collectDraft();
    const savedItems = Array.isArray(draft?.checkedItems) ? draft.checkedItems : draft?.documentsReady ? checklistIds : [];
    const changed = !draft || draft.eligibilityConfirmed !== current.eligibilityConfirmed
        || checklistIds.some(id => savedItems.includes(id) !== current.checkedItems.includes(id));
    if (changed && draft?.status !== 'SUBMITTED') draft = await saveDraft({ silent:true });
    if (!draft) {
        if (!silent && state.preparationEpoch === preparationEpoch) showToast('준비 내용을 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
        return null;
    }
    try {
        const response = await fetch(`/api/applications/drafts/${draft.id}/journey`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ status, receiptMemo, nextActionDate }) });
        if (!response.ok) throw new Error(await errorMessage(response, '진행상태를 저장하지 못했어요.'));
        const updated = await response.json();
        if (authGeneration !== state.authGeneration) return null;
        state.drafts = [updated, ...state.drafts.filter(value => value.id !== updated.id)];
        renderApplications(); renderPrograms(state.visibleItems);
        if (state.preparationEpoch === preparationEpoch && state.activeProgram?.id === programId && byId('preparationDialog').open) {
            renderInstitutionReceipt(updated);
            if (!silent) showToast('내 진행상태를 저장했어요.');
        }
        return updated;
    } catch (error) {
        if (!silent && authGeneration === state.authGeneration && state.preparationEpoch === preparationEpoch) showToast(error.message);
        return null;
    }
}

async function markOfficialOpened() {
    if (!state.signedIn || !state.activeProgram) return;
    const existing = state.drafts.find(value => value.programId === state.activeProgram.id);
    if (existing?.journeyStatus && !['PREPARING', 'OFFICIAL_SITE_OPENED'].includes(existing.journeyStatus)) return;
    const memo = existing?.userReceiptMemo || '';
    const date = existing?.nextActionDate || '';
    await updateJourney('OFFICIAL_SITE_OPENED', memo, date, { silent:true });
}

function openDiagnosis() {
    const profile = state.diagnosis || profileToDiagnosis(state.profile);
    if (profile) {
        byId('diagnosisRegion').value = profile.region || '';
        byId('diagnosisAge').value = profile.age || '';
        byId('diagnosisIncome').value = profile.incomeRange || '';
        document.querySelector(`input[name="need"][value="${CSS.escape(profile.need || '')}"]`)?.click();
        document.querySelector(`input[name="household"][value="${CSS.escape(profile.household || '')}"]`)?.click();
    }
    byId('diagnosisDescription').textContent = state.signedIn
        ? '조건을 바꾸면 다음에도 같은 기준으로 찾아드려요.'
        : '지역과 생활 상황을 골라주세요. 로그인하면 조건을 저장할 수 있어요.';
    byId('diagnosisSubmit').textContent = state.signedIn ? '조건 저장하고 추천 보기' : '내 혜택 후보 보기';
    openDialog(byId('diagnosisDialog'));
}

function renderDiagnosisSummary() {
    const section = byId('diagnosisSummary');
    const sideTitle = document.querySelector('.my-panel h2');
    const sideCopy = document.querySelector('.my-panel > p');
    if (state.diagnosis) {
        sideTitle.innerHTML = `${escapeHtml(state.diagnosis.region)} · ${escapeHtml(state.diagnosis.age)}<br>내 생활에 맞는 혜택.`;
        sideCopy.textContent = `${state.diagnosis.household} · ${state.diagnosis.need} 조건으로 후보를 살펴보세요.`;
        byId('diagnosisOpenSecondary').innerHTML = `내 조건 수정하기 ${icon('arrow')}`;
    } else {
        sideTitle.innerHTML = '내 조건을 알려주면<br>찾기가 더 쉬워져요.';
        sideCopy.innerHTML = '정확한 소득이나 주민등록번호 없이<br>간단한 선택만으로 시작하세요.';
        byId('diagnosisOpenSecondary').innerHTML = `내 혜택 후보 찾기 ${icon('arrow')}`;
    }
    if (!state.diagnosis) { section.hidden = true; return; }
    section.hidden = false;
    byId('diagnosisTitle').textContent = `${state.diagnosis.region} · ${state.diagnosis.need} 혜택을 먼저 보여드려요`;
    byId('diagnosisCopy').textContent = `${state.diagnosis.age}, ${state.diagnosis.household} 조건으로 후보를 좁혔습니다. 세부 소득·재산·가구 기준은 혜택 상세에서 꼭 확인해주세요.`;
}

function restoreDiagnosisFilters() {
    if (!state.diagnosis) return;
    byId('region').value = state.diagnosis.region || '';
    byId('category').value = state.diagnosis.need || '';
    syncCategorySelection(byId('category').value);
}

function clearDiagnosis() {
    state.diagnosis = null;
    if (state.quickFilter === 'matched') state.quickFilter = 'all';
    syncQuickFilterButtons();
    try { localStorage.removeItem('ansimlife.diagnosis'); } catch { /* Keep manual search available without storage. */ }
    renderDiagnosisSummary();
}

async function applyDiagnosis(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextDiagnosis = {
        region:byId('diagnosisRegion').value,
        age:byId('diagnosisAge').value,
        need:form.get('need'),
        household:form.get('household'),
        incomeRange:byId('diagnosisIncome').value
    };
    state.diagnosis = nextDiagnosis;
    state.topic = '';
    writeStorage('ansimlife.diagnosis', state.diagnosis);
    byId('region').value = state.diagnosis.region;
    byId('category').value = state.diagnosis.need;
    byId('keyword').value = '';
    syncCategorySelection(state.diagnosis.need);
    state.quickFilter = 'all';
    syncQuickFilterButtons();
    renderDiagnosisSummary();
    byId('diagnosisDialog').close();
    window.AnsimUI?.show('discover');
    const saved = await saveProfile(nextDiagnosis);
    await loadPrograms();
    byId('diagnosisSummary').scrollIntoView({ behavior:preferredScrollBehavior(), block:'center' });
    showToast(state.signedIn && saved ? '맞춤 조건을 저장하고 후보를 찾았어요.' : '맞춤 혜택 후보를 찾았어요.');
}

function setAuthMode(mode) {
    state.authMode = mode;
    document.querySelectorAll('[data-auth-mode]').forEach(button => button.classList.toggle('active', button.dataset.authMode === mode));
    byId('displayNameField').hidden = mode !== 'register';
    byId('authTitle').textContent = mode === 'register' ? '안심생활 시작하기' : '로그인';
    byId('authDescription').textContent = mode === 'register' ? '계정을 만들고 준비 내용을 저장하세요.' : '저장한 준비 기록을 이어서 확인하세요.';
    byId('authSubmit').textContent = mode === 'register' ? '회원가입하고 시작하기' : '로그인';
    byId('authPassword').autocomplete = mode === 'register' ? 'new-password' : 'current-password';
    byId('authError').textContent = '';
}

function openAuth(mode = 'login') {
    byId('authGuestView').hidden = state.signedIn;
    byId('authMemberView').hidden = !state.signedIn;
    if (state.signedIn) {
        byId('memberName').textContent = `${state.currentUser.displayName}님`;
        byId('memberEmail').textContent = state.currentUser.email;
        renderMemberProfile();
    }
    else setAuthMode(mode);
    openDialog(byId('authDialog'));
}

async function submitAuth(event) {
    event.preventDefault();
    const button = byId('authSubmit');
    button.disabled = true;
    byId('authError').textContent = '';
    const payload = { email:formValue('authEmail'), password:byId('authPassword').value };
    if (state.authMode === 'register') payload.displayName = formValue('authDisplayName');
    try {
        const response = await fetch(`/api/auth/${state.authMode === 'register' ? 'register' : 'login'}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
        if (!response.ok) throw new Error(await errorMessage(response, '로그인하지 못했어요.'));
        state.currentUser = await response.json();
        state.signedIn = true;
        state.authGeneration += 1;
        const authGeneration = state.authGeneration;
        await loadProfile();
        if (authGeneration !== state.authGeneration) return;
        if (!state.profile?.exists && state.diagnosis) await saveProfile(state.diagnosis);
        if (authGeneration !== state.authGeneration) return;
        await loadDrafts();
        if (authGeneration !== state.authGeneration) return;
        syncAuthUI(); byId('authDialog').close();
        showToast(state.authMode === 'register' ? '가입했어요. 이제 준비를 시작해보세요.' : '로그인했어요.');
    } catch (error) { byId('authError').textContent = error.message; }
    finally { button.disabled = false; button.textContent = state.authMode === 'register' ? '회원가입하고 시작하기' : '로그인'; }
}

function showApplications() {
    window.AnsimUI?.show('prepare');
    byId('applicationSection').hidden = false;
    renderApplications();
    byId('applicationSection').scrollIntoView({ behavior:preferredScrollBehavior(), block:'start' });
}

async function showSaved() {
    window.AnsimUI?.show('saved');
    byId('savedSection').hidden = false;
    byId('savedList').innerHTML = '<div class="loading-state"><i></i><span>저장한 혜택을 불러오고 있어요</span></div>';
    await hydrateSaved();
    renderSaved();
    if(document.body.dataset.view === 'saved') byId('savedSection').scrollIntoView({ behavior:preferredScrollBehavior(), block:'start' });
}

function handleProgramAction(event) {
    const action = event.target.closest('[data-action]');
    if (!action || action.dataset.action === 'menu') return;
    const id = Number(action.dataset.id);
    if (action.dataset.action === 'remove-saved') { toggleSaved(id); return; }
    if (action.dataset.action === 'retry-saved') {
        action.disabled = true;
        loadProgramById(id).then(item => {
            if (!item) showToast('현재 확인할 수 없는 혜택이에요. 저장 해제하거나 나중에 다시 확인해주세요.');
            renderSaved();
        }).catch(() => {
            showToast('혜택을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
            action.disabled = false;
        });
        return;
    }
    const item = state.items.find(value => value.id === id);
    if (!item) return;
    if (action.dataset.action === 'save') toggleSaved(item.id);
    if (action.dataset.action === 'compare') toggleComparison(item.id);
    if (action.dataset.action === 'detail') openBenefitDetail(item);
    if (action.dataset.action === 'prepare') openPreparation(item);
}

function bindDialogBackdrop(dialog) {
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => {
        if (document.querySelector('dialog[open]')) return;
        const saved = dialogReturnFocus.get(dialog);
        dialogReturnFocus.delete(dialog);
        const available = element => element && element !== document.body && element.isConnected && !element.disabled && element.getClientRects().length > 0;
        const programId = dialog.id === 'preparationDialog' ? state.activeProgram?.id : state.activeDetail?.id;
        const candidates = [saved?.trigger];
        if (saved?.selector) candidates.push(...document.querySelectorAll(`button${saved.selector},a${saved.selector}`));
        if (Number.isSafeInteger(programId)) {
            candidates.push(...document.querySelectorAll(`button[data-draft-action="resume"][data-program-id="${programId}"],button[data-action="detail"][data-id="${programId}"]`));
        }
        const target = candidates.find(available);
        if (target && target !== document.body) target.focus({ preventScroll:true });
    });
}

byId('searchForm').addEventListener('submit', event => { event.preventDefault(); clearDiagnosis(); loadPrograms().then(()=>byId('programsHeading').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})); });
byId('loadMore').addEventListener('click', () => loadPrograms(state.currentPage + 1, true));
byId('quickCategories').addEventListener('click', event => { const button = event.target.closest('[data-category]'); if (!button) return; clearDiagnosis(); byId('category').value = button.dataset.category; syncCategorySelection(button.dataset.category); loadPrograms(); });
byId('categoryGrid').addEventListener('click', event => { const button = event.target.closest('[data-category]'); if (!button) return; clearDiagnosis(); byId('category').value = button.dataset.category; syncCategorySelection(button.dataset.category); loadPrograms().then(() => byId('programsHeading').scrollIntoView({ behavior:preferredScrollBehavior() })); });
byId('category').addEventListener('change', event => syncCategorySelection(event.target.value));
byId('programList').addEventListener('click', handleProgramAction);
byId('quickFilters').addEventListener('click', event => {
    const button = event.target.closest('[data-result-filter]');
    if (!button) return;
    setQuickFilter(button.dataset.resultFilter);
});
byId('sortPrograms').addEventListener('change', event => {
    state.sortOrder = event.target.value;
    loadPrograms();
});
byId('resetSearch').addEventListener('click', () => {
    byId('keyword').value = '';
    byId('region').value = '';
    byId('category').value = '';
    clearDiagnosis();
    state.topic = '';
    state.quickFilter = 'all'; state.sortOrder = 'recommended';
    byId('sortPrograms').value = 'recommended';
    syncQuickFilterButtons();
    syncCategorySelection('');
    loadPrograms();
    showToast('탐색 조건을 초기화했어요.');
});
byId('programList').addEventListener('keydown', event => {
    const row = event.target.closest('.program-list-item[data-action="detail"]');
    if (!row || event.target.closest('button, a, input, select')) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    const item = state.items.find(value => value.id === Number(row.dataset.id));
    if (item) openBenefitDetail(item);
});
byId('savedList').addEventListener('click', handleProgramAction);
byId('diagnosisForm').addEventListener('submit', applyDiagnosis);
byId('profileEditButton').addEventListener('click', () => { byId('authDialog').close(); openDiagnosis(); });
['diagnosisOpen','diagnosisOpenSecondary','diagnosisEdit','mobileDiagnosis'].forEach(id => byId(id).addEventListener('click', openDiagnosis));
document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => byId(button.dataset.closeDialog).close()));

byId('benefitDetailClose').addEventListener('click', () => byId('benefitDetailDialog').close());
byId('benefitDetailPrepare').addEventListener('click', () => { const item = state.activeDetail; byId('benefitDetailDialog').close(); if (item) openPreparation(item); });
byId('benefitDetailSave').addEventListener('click', () => state.activeDetail && toggleSaved(state.activeDetail.id));
byId('copyCallScript').addEventListener('click', () => state.activeDetail && copyText(callScript(state.activeDetail)));
byId('benefitDetailFeedback').addEventListener('click', openFeedback);
byId('benefitDetailRefresh').addEventListener('click', refreshBenefitDetail);
byId('feedbackForm').addEventListener('submit', submitFeedback);

byId('compareToggle').addEventListener('click', openComparison);
byId('mobileCompare').addEventListener('click', openComparison);
byId('compareClose').addEventListener('click', () => byId('compareDialog').close());
byId('compareShare').addEventListener('click', shareComparison);
byId('compareClear').addEventListener('click', () => {
    state.comparisonIds.clear();
    writeStorage('ansimlife.compare', []);
    syncCounts();
    renderPrograms(state.visibleItems);
    renderComparison();
    showToast('비교 목록을 비웠어요.');
});
byId('compareStartPreparation').addEventListener('click', () => {
    const item = selectedComparisonItems()[0];
    if (!item) return;
    byId('compareDialog').close();
    openPreparation(item);
});
byId('compareTable').addEventListener('click', event => {
    const action = event.target.closest('[data-compare-action]');
    if (!action) return;
    const item = state.items.find(value => value.id === Number(action.dataset.id));
    if (!item) return;
    if (action.dataset.compareAction === 'remove') toggleComparison(item.id);
    if (action.dataset.compareAction === 'detail') {
        byId('compareDialog').close();
        openBenefitDetail(item);
    }
});

byId('preparationClose').addEventListener('click', () => byId('preparationDialog').close());
document.querySelectorAll('.stepper [data-step]').forEach(button => button.addEventListener('click', () => setStep(button.dataset.step)));
byId('stepBack').addEventListener('click', () => setStep(state.activeStep - 1));
byId('stepNext').addEventListener('click', () => setStep(state.activeStep + 1));
byId('checklist').addEventListener('change', updateChecklistProgress);
byId('eligibilityConfirmed').addEventListener('change', updateReview);
byId('saveDraft').addEventListener('click', () => saveDraft());
byId('loginToSave').addEventListener('click', () => openAuth());
byId('officialApply').addEventListener('click', markOfficialOpened);
byId('copyPreparationCallScript').addEventListener('click', () => state.activeProgram && copyText(callScript(state.activeProgram)));
byId('journeyForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (!state.signedIn) { openAuth(); return; }
    const preparationEpoch = state.preparationEpoch;
    const button = byId('saveJourney');
    button.disabled = true;
    await updateJourney(byId('journeyStatus').value, formValue('userReceiptMemo'), byId('nextActionDate').value);
    if (preparationEpoch === state.preparationEpoch) button.disabled = false;
});

byId('applicationList').addEventListener('click', async event => {
    const action = event.target.closest('[data-draft-action]');
    if (!action) return;
    const authGeneration = state.authGeneration;
    action.disabled = true;
    try {
        if (action.dataset.draftAction === 'resume') {
            const draft = state.drafts.find(value => value.programId === Number(action.dataset.programId));
            const item = await loadProgramById(action.dataset.programId);
            if (authGeneration !== state.authGeneration) return;
            if (item) await openPreparation(item, draft?.journeyStatus && draft.journeyStatus !== 'PREPARING' ? 3 : 1);
            else showToast('혜택 정보를 다시 불러오지 못했어요.');
        }
        if (action.dataset.draftAction === 'delete') {
            const response = await fetch(`/api/applications/drafts/${action.dataset.id}`, { method:'DELETE' });
            if (authGeneration !== state.authGeneration) return;
            if (!response.ok) throw new Error(await errorMessage(response, '준비 기록을 삭제하지 못했어요.'));
            state.drafts = state.drafts.filter(value => value.id !== Number(action.dataset.id));
            renderApplications(); renderPrograms(state.visibleItems);
            showToast('저장한 혜택 준비를 삭제했어요.');
        }
    } catch (error) {
        if (authGeneration === state.authGeneration) showToast(error.message || '요청을 마치지 못했어요. 다시 시도해주세요.');
    } finally {
        action.disabled = false;
    }
});

byId('savedToggle').addEventListener('click', showSaved);
byId('asideSaved').addEventListener('click', showSaved);
byId('mobileSaved')?.addEventListener('click', showSaved);
['applicationToggle','asideApplications','mobileApplications'].forEach(id => byId(id).addEventListener('click', showApplications));
byId('accountButton').addEventListener('click', () => openAuth());
byId('authClose').addEventListener('click', () => byId('authDialog').close());
document.querySelectorAll('[data-auth-mode]').forEach(button => button.addEventListener('click', () => setAuthMode(button.dataset.authMode)));
byId('authForm').addEventListener('submit', submitAuth);
byId('logoutButton').addEventListener('click', async () => {
    const button = byId('logoutButton');
    button.disabled = true;
    try {
        const response = await fetch('/api/auth/logout', { method:'POST' });
        if (!response.ok) throw new Error(await errorMessage(response, '로그아웃하지 못했어요.'));
        state.authGeneration += 1;
        state.currentUser = null; state.signedIn = false; state.profile = null;
        state.drafts = []; state.draftsError = null;
        clearDiagnosis();
        byId('keyword').value = ''; byId('region').value = ''; byId('category').value = '';
        syncCategorySelection('');
        syncAuthUI(); renderMemberProfile(); renderApplications();
        byId('authDialog').close();
        loadPrograms();
        showToast('로그아웃했어요. 맞춤 조건도 이 브라우저에서 지웠어요.');
    } catch (error) {
        showToast(error.message || '로그아웃하지 못했어요. 다시 시도해주세요.');
    } finally {
        button.disabled = false;
    }
});

[byId('diagnosisDialog'), byId('authDialog'), byId('benefitDetailDialog'), byId('preparationDialog'), byId('compareDialog'), byId('feedbackDialog')].forEach(bindDialogBackdrop);

function rememberProgram(item) {
    state.recent = [{id:item.id, title:item.title, region:item.region, category:item.category},
        ...state.recent.filter(value => value.id !== item.id)].slice(0,5);
    writeStorage('ansimlife.recent', state.recent); renderRecent();
}

function renderRecent() {
    byId('recentSection').hidden = !state.recent.length;
    byId('recentList').innerHTML = state.recent.map(item => `<button type="button" class="recent-item" data-recent-id="${item.id}"><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.region || '전국')} · ${escapeHtml(item.category || '공공혜택')}</small></span>${icon('chevron')}</button>`).join('');
}

async function hydrateSaved() {
    const ids = [...state.savedIds].filter(id => !state.items.some(item => item.id === id));
    let index = 0;
    await Promise.all(Array.from({length:Math.min(4,ids.length)}, async () => {
        while (index < ids.length) {
            const id = ids[index++];
            try { await loadProgramById(id); }
            catch { /* Keep the saved id and show its retry action. */ }
        }
    }));
    syncCounts();
}

byId('hideClosed').addEventListener('change', event => { state.hideClosed = event.target.checked; loadPrograms(); });
byId('region').addEventListener('change', () => { clearDiagnosis(); loadPrograms(); });
document.querySelectorAll('[data-keyword]').forEach(button => button.addEventListener('click', () => {
    clearDiagnosis(); byId('keyword').value = button.dataset.keyword; loadPrograms();
    byId('programsHeading').scrollIntoView({behavior:preferredScrollBehavior(),block:'start'});
}));
document.querySelectorAll('[data-hide-section]').forEach(button => button.addEventListener('click', () => {
    byId(button.dataset.hideSection).hidden = true; window.AnsimUI?.show('discover');
}));
byId('dockCompare').addEventListener('click', openComparison);
byId('recentList').addEventListener('click', async event => {
    const button = event.target.closest('[data-recent-id]'); if (!button) return;
    try { const item = await loadProgramById(button.dataset.recentId); if (item) openBenefitDetail(item); else showToast('현재 확인할 수 없는 혜택이에요.'); }
    catch { showToast('혜택을 불러오지 못했어요. 다시 시도해주세요.'); }
});
byId('clearRecent').addEventListener('click', () => { state.recent=[]; writeStorage('ansimlife.recent',[]); renderRecent(); });
byId('benefitDetailShare').addEventListener('click', async () => {
    if (!state.activeDetail) return;
    const url = new URL(window.location.origin); url.searchParams.set('benefit',state.activeDetail.id);
    const data = {title:state.activeDetail.title,text:'안심생활에서 이 혜택을 확인해보세요.',url:url.toString()};
    try { if (navigator.share) await navigator.share(data); else await copyText(data.url,'혜택 링크를 복사했어요.'); }
    catch(error) { if (error.name !== 'AbortError') await copyText(data.url,'혜택 링크를 복사했어요.'); }
});

async function boot() {
    restoreSharedComparison(); populateDiagnosisNeeds(); renderCategoryControls();
    restoreDiagnosisFilters(); renderDiagnosisSummary(); renderRecent(); syncCounts();
    document.querySelectorAll('.section-label').forEach(label => {
        const labels = {'BENEFIT DETAIL':'혜택 상세','BENEFIT GUIDE':'신청 준비','DOCUMENTS':'제출서류','CONTACT':'접수·문의','COMPARE':'혜택 비교','DATA CHECK':'정보 제보','MY ACCOUNT':'내 계정','WELCOME':'안심생활 계정','QUICK DIAGNOSIS':'맞춤 조건','5-MINUTE CHECK':'내 맞춤 조건'};
        if (labels[label.textContent.trim()]) label.textContent = labels[label.textContent.trim()];
    });
    await loadSession();
    window.AnsimWorkspace?.init();
    await Promise.all([loadPrograms(),loadMeta(),loadDrafts()]);
    hydrateSaved().then(renderSaved);
    const sharedBenefit = Number(new URLSearchParams(location.search).get('benefit'));
    if (Number.isSafeInteger(sharedBenefit) && sharedBenefit > 0) {
        try { const item = await loadProgramById(sharedBenefit); if (item) await openBenefitDetail(item); else showToast('이 혜택은 현재 확인할 수 없어요. 다른 혜택을 둘러보세요.'); }
        catch { showToast('공유한 혜택을 불러오지 못했어요.'); }
    } else if (state.sharedComparisonPending) {
        state.sharedComparisonPending = false; await openComparison();
    }
}

boot();
