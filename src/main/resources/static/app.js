const byId = id => document.getElementById(id);

const state = {
    items: [],
    visibleItems: [],
    drafts: [],
    savedIds: new Set(readStorage('ansimlife.saved', [])),
    detailCache: new Map(),
    activeProgram: null,
    activeDetail: null,
    currentPage: 0,
    totalResults: 0,
    totalBenefits: 0,
    hasMore: false,
    loading: false,
    signedIn: false,
    currentUser: null,
    authMode: 'login',
    activeStep: 1,
    diagnosis: readStorage('ansimlife.diagnosis', null)
};

const categories = [
    { name:'생활안정', icon:'₩', copy:'생활비·소득' },
    { name:'주거·자립', icon:'⌂', copy:'주거·자립' },
    { name:'보육·교육', icon:'✎', copy:'보육·배움' },
    { name:'고용·창업', icon:'↗', copy:'일자리·사업' },
    { name:'보건·의료', icon:'＋', copy:'건강·의료비' },
    { name:'행정·안전', icon:'✓', copy:'안전·행정' },
    { name:'임신·출산', icon:'♡', copy:'임신·출산' },
    { name:'보호·돌봄', icon:'∞', copy:'돌봄·보호' },
    { name:'문화·환경', icon:'◌', copy:'문화·환경' },
    { name:'농림축산어업', icon:'♧', copy:'농어업' }
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

function readStorage(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
}

function writeStorage(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { /* Private browsing or disabled storage: keep the current session working. */ }
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
    return new Intl.DateTimeFormat('ko-KR', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }).format(new Date(value));
}
function formatDate(value) {
    if (!value) return '';
    return new Intl.DateTimeFormat('ko-KR', { year:'numeric', month:'long', day:'numeric' }).format(new Date(`${value}T00:00:00`));
}

async function errorMessage(response, fallback) {
    const body = await response.json().catch(() => ({}));
    return body.detail || body.message || fallback;
}

function showToast(message) {
    const toast = byId('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function openDialog(dialog) {
    if (dialog && !dialog.open) dialog.showModal();
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

function syncCounts() {
    byId('savedCount').textContent = state.savedIds.size;
    byId('asideSavedCount').textContent = state.savedIds.size;
    byId('applicationCount').textContent = state.drafts.length;
    byId('asideApplicationCount').textContent = state.drafts.length;
    byId('mobileApplicationCount').textContent = state.drafts.length;
}

function syncAuthUI() {
    const button = byId('accountButton');
    button.textContent = state.signedIn ? `${state.currentUser.displayName}님` : '로그인';
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
        .map(item => `<button type="button" data-category="${escapeHtml(item.name)}">${item.icon} ${escapeHtml(item.name)}</button>`).join('');

    byId('categoryGrid').innerHTML = categories.map(item => `
        <button type="button" data-category="${escapeHtml(item.name)}">
            <span class="category-icon">${item.icon}</span>
            <span><strong>${escapeHtml(item.name)}</strong><small>${categoryCounts[item.name] ? `${formatNumber(categoryCounts[item.name])}개` : item.copy}</small></span>
            <i>→</i>
        </button>`).join('');
    syncCategorySelection(select.value);
}

function populateDiagnosisNeeds() {
    byId('diagnosisNeeds').innerHTML = categories.map(item => `
        <label><input type="radio" name="need" value="${escapeHtml(item.name)}" required><span><i>${item.icon}</i>${escapeHtml(item.name)}</span></label>`).join('');
}

function syncCategorySelection(category) {
    document.querySelectorAll('[data-category]').forEach(button => {
        button.classList.toggle('active', button.dataset.category === category);
    });
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
        byId('heroBenefitCount').textContent = `${formatNumber(meta.totalAvailable || meta.storedCount)}개`;
        byId('heroCategoryCount').textContent = `${Math.max(Object.keys(counts).length, categories.length)}개 분야`;
        const labels = { READY:'최신 정보 반영 완료', SYNCING:'전체 혜택 동기화 중', PARTIAL:'혜택 추가 반영 중', WAITING:'동기화 준비 중', DISABLED:'데이터 연결 필요', ERROR:'저장된 최신 정보 제공 중' };
        byId('syncStatus').textContent = labels[meta.syncStatus] ?? '공식정보 매일 최신화';
        byId('syncDot').classList.toggle('spinning', ['SYNCING','PARTIAL'].includes(meta.syncStatus));
        renderCategoryControls(counts);
        if (['SYNCING','PARTIAL'].includes(meta.syncStatus)) setTimeout(loadMeta, 6000);
    } catch {
        byId('syncStatus').textContent = '저장된 최신 정보 제공 중';
    }
}

function recommendationBadge(item) {
    if (!state.diagnosis) return '';
    const regionMatches = !state.diagnosis.region || item.region === '전국' || String(item.region).includes(state.diagnosis.region);
    const categoryMatches = normalizedCategory(item.category) === state.diagnosis.need;
    if (regionMatches && categoryMatches) return '<span class="recommendation-chip">맞춤 후보</span>';
    return '';
}

function renderPrograms(items) {
    byId('count').textContent = `${formatNumber(state.totalResults)}개 혜택`;
    const grid = byId('programList');
    if (!items.length) {
        grid.innerHTML = '<div class="empty-state"><span>⌕</span><h3>조건에 맞는 혜택이 아직 없어요</h3><p>지역을 전체로 바꾸거나 검색어를 짧게 입력해보세요.</p></div>';
        return;
    }
    grid.innerHTML = items.map(item => {
        const category = normalizedCategory(item.category);
        const draft = state.drafts.find(value => value.programId === item.id);
        const channel = applicationChannel(item);
        const saved = state.savedIds.has(item.id);
        const progress = draft ? `<div class="card-progress"><span><i style="width:${draft.completionPercent}%"></i></span><b>${journeyLabels[draft.journeyStatus] || `${draft.completionPercent}% 준비`}</b></div>` : '';
        return `<article class="program-card">
            <header><div class="card-tags"><span>${escapeHtml(category)}</span>${item.urgent ? '<span class="urgent-chip">먼저 확인</span>' : ''}${recommendationBadge(item)}</div><button class="save-button ${saved ? 'active' : ''}" data-action="save" data-id="${item.id}" type="button" aria-label="${saved ? '관심 혜택에서 제거' : '관심 혜택에 저장'}">${saved ? '♥' : '♡'}</button></header>
            <div class="program-title"><span>${categoryIcons[category] ?? '•'}</span><div><small>${escapeHtml(item.region || '전국')}</small><h3>${escapeHtml(item.title)}</h3></div></div>
            <p class="program-summary">${escapeHtml(item.summary || '공식 상세정보에서 지원 내용을 확인할 수 있어요.')}</p>
            <dl class="program-meta"><div><dt>대상</dt><dd>${escapeHtml(item.target || '상세 조건 확인 필요')}</dd></div><div><dt>혜택</dt><dd>${escapeHtml(item.benefit || '지원 내용 확인 필요')}</dd></div></dl>
            ${progress}
            <footer><div><span class="route-chip route-${channelClass(channel.mode)}">${escapeHtml(channel.label)}</span><small>${escapeHtml(item.deadline || '신청기간 확인 필요')}</small></div><div class="card-buttons"><button class="ghost-button" data-action="detail" data-id="${item.id}" type="button">상세</button><button class="primary-button" data-action="prepare" data-id="${item.id}" type="button">${draft ? '이어서 준비' : '신청 준비'}</button></div></footer>
        </article>`;
    }).join('');
}

async function loadPrograms(page = 0, append = false) {
    if (state.loading) return;
    state.loading = true;
    if (!append) {
        byId('programList').innerHTML = '<div class="loading-state"><i></i><span>혜택을 찾고 있어요</span></div>';
    }
    const query = new URLSearchParams({
        keyword: byId('keyword').value.trim(),
        region: byId('region').value,
        category: byId('category').value,
        page: String(page),
        size: '24'
    });
    try {
        const response = await fetch(`/api/programs?${query}`);
        if (!response.ok) throw new Error(await errorMessage(response, '혜택을 불러오지 못했어요.'));
        const result = await response.json();
        const incoming = result.items ?? [];
        if (append) {
            const known = new Set(state.visibleItems.map(item => item.id));
            state.visibleItems = [...state.visibleItems, ...incoming.filter(item => !known.has(item.id))];
        } else state.visibleItems = incoming;
        const cache = new Map(state.items.map(item => [item.id, item]));
        incoming.forEach(item => cache.set(item.id, item));
        state.items = [...cache.values()];
        state.currentPage = Number(result.page || 0);
        state.totalResults = Number(result.total || 0);
        state.hasMore = result.hasMore === true;
        byId('loadMore').hidden = !state.hasMore;
        renderPrograms(state.visibleItems);
        renderSaved();
    } catch (error) {
        byId('programList').innerHTML = `<div class="empty-state"><span>!</span><h3>혜택을 불러오지 못했어요</h3><p>${escapeHtml(error.message)}</p></div>`;
    } finally { state.loading = false; }
}

function toggleSaved(id) {
    state.savedIds.has(id) ? state.savedIds.delete(id) : state.savedIds.add(id);
    writeStorage('ansimlife.saved', [...state.savedIds]);
    syncCounts();
    renderPrograms(state.visibleItems);
    renderSaved();
    if (state.activeDetail?.id === id) syncDetailSaveButton();
}

function renderSaved() {
    const items = state.items.filter(item => state.savedIds.has(item.id));
    byId('savedList').innerHTML = items.length ? items.map(item => `<article><div><small>${escapeHtml(item.region)} · ${escapeHtml(normalizedCategory(item.category))}</small><strong>${escapeHtml(item.title)}</strong></div><div><button class="ghost-button" data-action="detail" data-id="${item.id}" type="button">상세</button><button class="primary-button" data-action="prepare" data-id="${item.id}" type="button">준비</button></div></article>`).join('') : '<div class="empty-inline">아직 저장한 혜택이 없어요.</div>';
}

function draftStatus(draft) {
    if (draft.status === 'SUBMITTED' && draft.externalReceiptNumber) return { label:'기관 접수 확인 완료', tone:'confirmed', verified:true };
    const status = draft.journeyStatus || 'PREPARING';
    const tone = ['APPROVED'].includes(status) ? 'success' : ['SUPPLEMENT_REQUESTED','REJECTED'].includes(status) ? 'warning' : status === 'PREPARING' ? 'neutral' : 'active';
    return { label: journeyLabels[status] || '혜택 준비 중', tone, verified:false };
}

function renderApplications() {
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

async function loadSession() {
    try {
        const response = await fetch('/api/auth/me');
        state.currentUser = await response.json();
        state.signedIn = state.currentUser.authenticated === true;
    } catch { state.currentUser = null; state.signedIn = false; }
    syncAuthUI();
}

async function loadDrafts() {
    if (!state.signedIn) { state.drafts = []; renderApplications(); return; }
    try {
        const response = await fetch('/api/applications/drafts');
        if (!response.ok) throw new Error();
        state.drafts = await response.json();
    } catch { state.drafts = []; }
    renderApplications();
    renderPrograms(state.visibleItems);
}

async function loadProgramById(programId) {
    let item = state.items.find(value => value.id === Number(programId));
    if (item) return item;
    const response = await fetch(`/api/programs/${programId}`);
    if (!response.ok) return null;
    item = await response.json();
    state.items.push(item);
    return item;
}

async function fetchDetail(item) {
    if (state.detailCache.has(item.id)) return state.detailCache.get(item.id);
    try {
        const response = await fetch(`/api/programs/${item.id}/detail`);
        if (!response.ok) throw new Error();
        const detail = await response.json();
        state.detailCache.set(item.id, detail);
        return detail;
    } catch {
        const fallback = { ...item, sourceLive:false, onlineUrl:item.applyUrl, application:applicationChannel(item) };
        state.detailCache.set(item.id, fallback);
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
    byId('benefitDetailRegion').textContent = merged.region || '전국';
    byId('benefitDetailSource').textContent = merged.sourceLive ? '공식 상세 연결됨' : '저장 정보 표시 중';
    byId('benefitDetailSource').classList.toggle('offline', !merged.sourceLive);
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
    route.querySelector('p').textContent = channel.description;
    const official = byId('benefitDetailOfficial');
    official.href = merged.onlineUrl || channel.officialUrl || merged.applyUrl || '#';
    official.hidden = official.href.endsWith('#');
    byId('benefitDetailNotice').textContent = merged.sourceLive ? `행정안전부 공공서비스 상세정보${merged.sourceUpdatedAt ? ` · 수정 ${merged.sourceUpdatedAt}` : ''}` : '현재 저장된 정보를 표시합니다. 최종 조건은 공식 안내에서 확인해주세요.';
    syncDetailSaveButton();
    byId('benefitDetailLoading').hidden = true;
    byId('benefitDetailContent').hidden = false;
}

function syncDetailSaveButton() {
    if (!state.activeDetail) return;
    const saved = state.savedIds.has(state.activeDetail.id);
    byId('benefitDetailSave').textContent = saved ? '♥ 관심 저장됨' : '♡ 관심에 저장';
    byId('benefitDetailSave').classList.toggle('active', saved);
}

async function openBenefitDetail(item) {
    state.activeDetail = item;
    byId('benefitDetailTitle').textContent = item.title;
    byId('benefitDetailLoading').hidden = false;
    byId('benefitDetailContent').hidden = true;
    openDialog(byId('benefitDetailDialog'));
    byId('benefitDetailScroll').scrollTop = 0;
    const detail = await fetchDetail(item);
    if (state.activeDetail?.id === item.id) renderBenefitDetail(item, detail);
}

function callScript(detail) {
    const contact = detail.contact ? ` 문의처는 ${detail.contact}로 확인했습니다.` : '';
    return `안녕하세요. ‘${detail.title}’ 지원을 보고 문의드립니다.${contact} 제가 지원 대상에 해당하는지, 현재 신청 가능한지, 직접 준비해야 할 서류와 접수 방법을 확인하고 싶습니다.`;
}

async function copyText(value, message = '문의 문장을 복사했어요.') {
    try { await navigator.clipboard.writeText(value); showToast(message); }
    catch { showToast('복사하지 못했어요. 문장을 길게 눌러 복사해주세요.'); }
}

function possibilityFor(item) {
    if (!state.diagnosis) return { tone:'unknown', icon:'?', title:'추가 확인이 필요해요', copy:'공식 대상 조건을 읽고 직접 확인해주세요.' };
    const region = item.region === '전국' || String(item.region).includes(state.diagnosis.region);
    const category = normalizedCategory(item.category) === state.diagnosis.need;
    if (region && category) return { tone:'candidate', icon:'✓', title:'우선 확인할 추천 후보예요', copy:'선택한 지역·관심 분야와 일치합니다. 연령·소득 등 세부 조건은 아래에서 확인해주세요.' };
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
    card.querySelector('i').textContent = possibility.icon;
    card.querySelector('strong').textContent = possibility.title;
    card.querySelector('p').textContent = possibility.copy;
    byId('callScriptText').textContent = callScript(merged);
    renderChecklist(merged);
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

function renderChecklist(item) {
    const draft = state.drafts.find(value => value.programId === item.id);
    const savedChecks = draft?.documentsReady ? [0,1,2,3] : readStorage(`ansimlife.checks.${item.id}`, []);
    byId('checklist').innerHTML = checklistItems(item).map((label, index) => `<label><input type="checkbox" data-check-index="${index}" ${savedChecks.includes(index) ? 'checked' : ''}><span>${escapeHtml(label)}</span></label>`).join('');
    updateChecklistProgress();
}

async function openPreparation(item, requestedStep) {
    state.activeProgram = item;
    const draft = state.drafts.find(value => value.programId === item.id);
    byId('preparationLabel').textContent = `${item.region || '전국'} · ${normalizedCategory(item.category)}`;
    byId('preparationTitle').textContent = item.title;
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
    document.querySelectorAll('.stepper [data-step]').forEach(button => button.classList.toggle('active', Number(button.dataset.step) <= state.activeStep));
    document.querySelectorAll('.step-pane').forEach(pane => pane.classList.toggle('active', Number(pane.dataset.pane) === state.activeStep));
    syncPreparationActions();
    if (state.activeStep === 2) updateReview();
}

function syncPreparationActions() {
    if (!byId('preparationDialog') || !state.activeProgram) return;
    const draft = state.drafts.find(value => value.programId === state.activeProgram.id);
    const channel = applicationChannel(state.activeProgram);
    const submitted = draft?.status === 'SUBMITTED';
    const officialUrl = state.activeProgram.onlineUrl || channel.officialUrl || state.activeProgram.applyUrl;
    byId('stepBack').hidden = state.activeStep === 1;
    byId('stepNext').hidden = state.activeStep === 3;
    byId('loginToSave').hidden = state.signedIn || submitted;
    byId('saveDraft').hidden = !state.signedIn || submitted;
    byId('officialApply').hidden = state.activeStep !== 2 || submitted || !officialUrl;
    byId('officialApply').href = officialUrl || '#';
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
    return {
        programId: state.activeProgram.id,
        eligibilityConfirmed:byId('eligibilityConfirmed').checked,
        documentsReady:checklist.length > 0 && checklist.every(input => input.checked)
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
        ['신청기간', item.deadline || '공식 안내 확인', true],
        ['접수기관', item.receptionAgency || item.agency || '공식 안내 확인', true]
    ];
    byId('reviewGrid').innerHTML = entries.map(([label,value,complete]) => `<div><span>${label}</span><strong class="${complete ? '' : 'missing'}">${escapeHtml(value)}</strong></div>`).join('');
    const route = byId('applicationRoute');
    route.className = `application-route route-${channelClass(channel.mode)}`;
    route.innerHTML = `<i>${channel.directAvailable ? '✓' : channel.mode === 'NO_APPLICATION' ? 'i' : '↗'}</i><div><span>현재 신청 방식</span><strong>${escapeHtml(channel.label)}</strong><p>${escapeHtml(channel.description)}</p></div>`;
    const complete = values.eligibilityConfirmed && values.documentsReady;
    const status = byId('readyStatus');
    status.classList.toggle('complete', complete);
    status.innerHTML = complete ? '<i>✓</i><div><strong>공식 신청처로 이동할 준비가 됐어요</strong><p>개인정보와 증빙서류는 공식 기관 화면에서만 입력해주세요.</p></div>' : '<i>⌛</i><div><strong>확인할 항목이 남아 있어요</strong><p>공식 신청처는 바로 열 수 있고, 체크를 마치면 준비 누락을 줄일 수 있어요.</p></div>';
    syncPreparationActions();
}

async function saveDraft({ silent = false } = {}) {
    if (!state.activeProgram) return null;
    if (!state.signedIn) { if (!silent) openAuth(); return null; }
    const button = byId('saveDraft');
    button.disabled = true;
    const original = button.textContent;
    button.textContent = '저장 중…';
    try {
        const response = await fetch('/api/applications/drafts', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(collectDraft()) });
        if (!response.ok) throw new Error(await errorMessage(response, '작성 내용을 저장하지 못했어요.'));
        const draft = await response.json();
        state.drafts = [draft, ...state.drafts.filter(value => value.id !== draft.id)];
        renderApplications(); renderPrograms(state.visibleItems); renderInstitutionReceipt(draft); syncPreparationActions();
        if (!silent) showToast(draft.status === 'READY_TO_SUBMIT' ? '조건과 서류 체크를 저장했어요.' : '현재 준비상태를 저장했어요.');
        return draft;
    } catch (error) { if (!silent) showToast(error.message); return null; }
    finally { button.disabled = false; button.textContent = original; }
}

async function updateJourney(status, receiptMemo, nextActionDate, { silent = false } = {}) {
    let draft = state.drafts.find(value => value.programId === state.activeProgram.id);
    if (!draft) draft = await saveDraft({ silent:true });
    if (!draft) return null;
    try {
        const response = await fetch(`/api/applications/drafts/${draft.id}/journey`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ status, receiptMemo, nextActionDate }) });
        if (!response.ok) throw new Error(await errorMessage(response, '진행상태를 저장하지 못했어요.'));
        const updated = await response.json();
        state.drafts = [updated, ...state.drafts.filter(value => value.id !== updated.id)];
        renderApplications(); renderPrograms(state.visibleItems); renderInstitutionReceipt(updated);
        if (!silent) showToast('내 진행상태를 저장했어요.');
        return updated;
    } catch (error) { if (!silent) showToast(error.message); return null; }
}

async function markOfficialOpened() {
    if (!state.signedIn || !state.activeProgram) return;
    const existing = state.drafts.find(value => value.programId === state.activeProgram.id);
    const memo = existing?.userReceiptMemo || '';
    const date = existing?.nextActionDate || '';
    await updateJourney('OFFICIAL_SITE_OPENED', memo, date, { silent:true });
}

function openDiagnosis() {
    if (state.diagnosis) {
        byId('diagnosisRegion').value = state.diagnosis.region || '';
        byId('diagnosisAge').value = state.diagnosis.age || '';
        document.querySelector(`input[name="need"][value="${CSS.escape(state.diagnosis.need || '')}"]`)?.click();
        document.querySelector(`input[name="household"][value="${CSS.escape(state.diagnosis.household || '')}"]`)?.click();
    }
    openDialog(byId('diagnosisDialog'));
}

function renderDiagnosisSummary() {
    const section = byId('diagnosisSummary');
    if (!state.diagnosis) { section.hidden = true; return; }
    section.hidden = false;
    byId('diagnosisTitle').textContent = `${state.diagnosis.region} · ${state.diagnosis.need} 혜택을 먼저 보여드려요`;
    byId('diagnosisCopy').textContent = `${state.diagnosis.age}, ${state.diagnosis.household} 조건으로 후보를 좁혔습니다. 세부 소득·재산·가구 기준은 혜택 상세에서 꼭 확인해주세요.`;
}

function applyDiagnosis(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    state.diagnosis = { region:byId('diagnosisRegion').value, age:byId('diagnosisAge').value, need:form.get('need'), household:form.get('household') };
    writeStorage('ansimlife.diagnosis', state.diagnosis);
    byId('region').value = state.diagnosis.region;
    byId('category').value = state.diagnosis.need;
    byId('keyword').value = '';
    syncCategorySelection(state.diagnosis.need);
    renderDiagnosisSummary();
    byId('diagnosisDialog').close();
    loadPrograms().then(() => byId('diagnosisSummary').scrollIntoView({ behavior:'smooth', block:'center' }));
    showToast('맞춤 혜택 후보를 찾았어요.');
}

function setAuthMode(mode) {
    state.authMode = mode;
    document.querySelectorAll('[data-auth-mode]').forEach(button => button.classList.toggle('active', button.dataset.authMode === mode));
    byId('displayNameField').hidden = mode !== 'register';
    byId('authTitle').textContent = mode === 'register' ? '처음 오셨군요' : '다시 만나서 반가워요';
    byId('authDescription').textContent = mode === 'register' ? '계정을 만들고 혜택 준비를 이어가세요.' : '이메일로 간편하게 로그인하세요.';
    byId('authSubmit').textContent = mode === 'register' ? '회원가입하고 시작하기' : '로그인';
    byId('authPassword').autocomplete = mode === 'register' ? 'new-password' : 'current-password';
    byId('authError').textContent = '';
}

function openAuth(mode = 'login') {
    byId('authGuestView').hidden = state.signedIn;
    byId('authMemberView').hidden = !state.signedIn;
    if (state.signedIn) { byId('memberName').textContent = `${state.currentUser.displayName}님`; byId('memberEmail').textContent = state.currentUser.email; }
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
        await loadDrafts();
        syncAuthUI(); byId('authDialog').close();
        showToast(state.authMode === 'register' ? '가입했어요. 이제 준비를 시작해보세요.' : '로그인했어요.');
    } catch (error) { byId('authError').textContent = error.message; }
    finally { button.disabled = false; button.textContent = state.authMode === 'register' ? '회원가입하고 시작하기' : '로그인'; }
}

function showApplications() {
    if (!state.signedIn) { openAuth(); return; }
    byId('applicationSection').hidden = false;
    renderApplications();
    byId('applicationSection').scrollIntoView({ behavior:'smooth', block:'start' });
}

function showSaved() {
    byId('savedSection').hidden = false;
    renderSaved();
    byId('savedSection').scrollIntoView({ behavior:'smooth', block:'start' });
}

function handleProgramAction(event) {
    const action = event.target.closest('[data-action]');
    if (!action) return;
    const item = state.items.find(value => value.id === Number(action.dataset.id));
    if (!item) return;
    if (action.dataset.action === 'save') toggleSaved(item.id);
    if (action.dataset.action === 'detail') openBenefitDetail(item);
    if (action.dataset.action === 'prepare') openPreparation(item);
}

function bindDialogBackdrop(dialog) {
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
}

byId('searchForm').addEventListener('submit', event => { event.preventDefault(); state.diagnosis = null; byId('diagnosisSummary').hidden = true; loadPrograms(); });
byId('loadMore').addEventListener('click', () => loadPrograms(state.currentPage + 1, true));
byId('quickCategories').addEventListener('click', event => { const button = event.target.closest('[data-category]'); if (!button) return; byId('category').value = button.dataset.category; syncCategorySelection(button.dataset.category); loadPrograms(); });
byId('categoryGrid').addEventListener('click', event => { const button = event.target.closest('[data-category]'); if (!button) return; byId('category').value = button.dataset.category; syncCategorySelection(button.dataset.category); loadPrograms().then(() => byId('programsHeading').scrollIntoView({ behavior:'smooth' })); });
byId('category').addEventListener('change', event => syncCategorySelection(event.target.value));
byId('programList').addEventListener('click', handleProgramAction);
byId('savedList').addEventListener('click', handleProgramAction);
byId('diagnosisForm').addEventListener('submit', applyDiagnosis);
['diagnosisOpen','diagnosisOpenSecondary','diagnosisEdit','mobileDiagnosis'].forEach(id => byId(id).addEventListener('click', openDiagnosis));
document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => byId(button.dataset.closeDialog).close()));

byId('benefitDetailClose').addEventListener('click', () => byId('benefitDetailDialog').close());
byId('benefitDetailPrepare').addEventListener('click', () => { const item = state.activeDetail; byId('benefitDetailDialog').close(); if (item) openPreparation(item); });
byId('benefitDetailSave').addEventListener('click', () => state.activeDetail && toggleSaved(state.activeDetail.id));
byId('copyCallScript').addEventListener('click', () => state.activeDetail && copyText(callScript(state.activeDetail)));

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
    const button = byId('saveJourney');
    button.disabled = true;
    await updateJourney(byId('journeyStatus').value, formValue('userReceiptMemo'), byId('nextActionDate').value);
    button.disabled = false;
});

byId('applicationList').addEventListener('click', async event => {
    const action = event.target.closest('[data-draft-action]');
    if (!action) return;
    if (action.dataset.draftAction === 'resume') {
        const item = await loadProgramById(action.dataset.programId);
        item ? openPreparation(item, 3) : showToast('혜택 정보를 다시 불러오지 못했어요.');
    }
    if (action.dataset.draftAction === 'delete') {
        const response = await fetch(`/api/applications/drafts/${action.dataset.id}`, { method:'DELETE' });
        if (response.ok) { state.drafts = state.drafts.filter(value => value.id !== Number(action.dataset.id)); renderApplications(); renderPrograms(state.visibleItems); showToast('저장한 혜택 준비를 삭제했어요.'); }
    }
});

byId('savedToggle').addEventListener('click', showSaved);
byId('asideSaved').addEventListener('click', showSaved);
['applicationToggle','asideApplications','mobileApplications'].forEach(id => byId(id).addEventListener('click', showApplications));
byId('heroFeatured').addEventListener('click', () => { const item = state.visibleItems.find(value => value.urgent) ?? state.visibleItems[0]; item ? openBenefitDetail(item) : showToast('혜택 정보를 불러오는 중이에요.'); });
byId('accountButton').addEventListener('click', () => openAuth());
byId('authClose').addEventListener('click', () => byId('authDialog').close());
document.querySelectorAll('[data-auth-mode]').forEach(button => button.addEventListener('click', () => setAuthMode(button.dataset.authMode)));
byId('authForm').addEventListener('submit', submitAuth);
byId('logoutButton').addEventListener('click', async () => { await fetch('/api/auth/logout', { method:'POST' }); state.currentUser = null; state.signedIn = false; state.drafts = []; syncAuthUI(); renderApplications(); renderPrograms(state.visibleItems); byId('authDialog').close(); showToast('로그아웃했어요.'); });

[byId('diagnosisDialog'), byId('authDialog'), byId('benefitDetailDialog'), byId('preparationDialog')].forEach(bindDialogBackdrop);

populateDiagnosisNeeds();
renderCategoryControls();
renderDiagnosisSummary();
syncCounts();
Promise.all([loadPrograms(), loadMeta(), loadSession().then(loadDrafts)]);
