(function () {
    'use strict';
    const core = window.AnsimWorkflow;
    const storageKey = 'ansimlife.searches.v1';
    let initialized = false;
    let presets = [];
    let draftFilter = 'all';
    let lastOwner = null;

    function currentSearch() {
        return core.normalizeSearch({ keyword:byId('keyword').value, region:byId('region').value,
            category:byId('category').value, topic:state.topic, sort:state.sortOrder, filter:state.quickFilter,
            hideClosed:state.hideClosed, diagnosis:state.diagnosis });
    }
    function savePresets() {
        try { localStorage.setItem(storageKey, JSON.stringify(presets)); return true; }
        catch { return false; }
    }
    function renderPresets() {
        byId('savedSearchList').innerHTML = presets.map((preset, index) => `<div class="saved-search-item"><button type="button" data-search-index="${index}" title="${escapeHtml(core.searchLabel(preset.criteria))}">${icon('search')}<span>${escapeHtml(core.searchLabel(preset.criteria))}</span></button><button type="button" data-remove-search="${index}" aria-label="${escapeHtml(core.searchLabel(preset.criteria))} 검색 조건 삭제">${icon('close')}</button></div>`).join('');
        byId('savedSearchEmpty').hidden = presets.length > 0;
        byId('savedSearchList').hidden = presets.length === 0;
        byId('searchOptionsLabel').textContent = presets.length ? '저장한 검색 조건 '+presets.length+'개' : '검색 조건 저장·공유';
        searchChanged();
    }
    function searchChanged() {
        if (!initialized) return;
        const current = currentSearch();
        const saved = presets.some(preset => core.searchKey(preset.criteria) === core.searchKey(current));
        byId('saveSearch').innerHTML = `${icon(saved ? 'check' : 'bookmark')} ${saved ? '저장된 검색 조건' : '검색 조건 저장'}`;
        byId('saveSearch').disabled = saved;
        byId('saveSearch').title = core.searchLabel(current);
        const url = new URL(location.href);
        if (url.searchParams.get('search') === '1') {
            const next = new URL(core.searchLink(current, location.origin));
            if (current.diagnosis) {
                ['search','keyword','region','category','topic','sort','filter','hideClosed'].forEach(key => url.searchParams.delete(key));
            } else {
                ['search','keyword','region','category','topic','sort','filter','hideClosed'].forEach(key => {
                    next.searchParams.has(key) ? url.searchParams.set(key, next.searchParams.get(key)) : url.searchParams.delete(key);
                });
            }
            try { history.replaceState(null, '', url); } catch { /* Search still works without history access. */ }
        }
    }
    function applySearch(value) {
        const criteria = core.normalizeSearch(value);
        clearDiagnosis();
        byId('keyword').value = criteria.keyword;
        for (const key of ['region', 'category']) {
            const select = byId(key);
            select.value = [...select.options].some(option => option.value === criteria[key]) ? criteria[key] : '';
        }
        state.topic = criteria.topic;
        window.AnsimProduct?.syncTopic();
        state.sortOrder = criteria.sort;
        state.quickFilter = criteria.filter;
        state.hideClosed = criteria.hideClosed;
        byId('sortPrograms').value = criteria.sort;
        byId('hideClosed').checked = criteria.hideClosed;
        if (criteria.diagnosis) {
            state.diagnosis = criteria.diagnosis;
            writeStorage('ansimlife.diagnosis', criteria.diagnosis);
        }
        syncCategorySelection(byId('category').value);
        syncQuickFilterButtons();
        renderDiagnosisSummary();
        searchChanged();
    }
    function setDraftFilter(value) {
        draftFilter = value;
        renderApplications();
    }
    function downloadCalendar(drafts) {
        const candidates = core.calendarDrafts(drafts);
        if (!candidates.length) { showToast('다음 확인일을 정하면 일정으로 내려받을 수 있어요.'); return; }
        const blob = new Blob([core.calendar(candidates, location.origin)], { type:'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url; anchor.download = '안심생활-확인일정.ics';
        document.body.append(anchor); anchor.click(); anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 30000);
        showToast(`${candidates.length}개 확인일을 다운로드했어요. 캘린더 앱에서 파일을 열어주세요.`);
    }
    function renderApplications() {
        syncCounts();
        if (!byId('applicationFilters')) return;
        const owner = state.signedIn ? (state.currentUser?.id ?? state.currentUser?.email ?? 'member') : null;
        if (owner !== lastOwner) {
            lastOwner = owner; draftFilter = 'all';
            byId('applicationSearch').value = '';
            byId('applicationSort').value = 'updated';
        }
        const drafts = state.signedIn ? state.drafts : [];
        const counts = Object.fromEntries(['all','preparing','waiting','supplement','complete','due','week'].map(group => [group, core.selectDrafts(drafts, { group }).length]));
        byId('applicationTools').hidden = !state.signedIn;
        byId('applicationSummary').hidden = !state.signedIn || drafts.length === 0;
        for (const button of document.querySelectorAll('[data-work-filter]')) {
            const group = button.dataset.workFilter;
            button.classList.toggle('active', draftFilter === group);
            button.setAttribute('aria-pressed', String(draftFilter === group));
            const count = button.querySelector('[data-work-count]');
            if (count) count.textContent = counts[group] || 0;
        }
        byId('exportCalendar').disabled = core.calendarDrafts(drafts).length === 0;
        const error = byId('applicationError');
        error.hidden = !state.draftsError;
        byId('applicationErrorMessage').textContent = state.draftsError || '';
        if (!state.signedIn) {
            byId('applicationList').innerHTML = '<div class="empty-state"><span>'+icon('list')+'</span><h2>준비한 내용을 이어서 확인해요</h2><p>로그인하면 체크리스트와 진행 기록을 계정에 저장하고<br>다른 기기에서도 이어갈 수 있어요.</p><button type="button" class="primary-button" data-open-account>로그인하고 준비하기</button></div>';
            byId('applicationResultCount').textContent = '';
            return;
        }
        const visible = core.selectDrafts(drafts, { group:draftFilter, keyword:byId('applicationSearch').value, sort:byId('applicationSort').value });
        byId('applicationResultCount').textContent = `${drafts.length}개 중 ${visible.length}개`;
        if (!visible.length) {
            const filtered = draftFilter !== 'all' || byId('applicationSearch').value.trim();
            byId('applicationList').innerHTML = `<div class="empty-inline">${state.draftsError && !drafts.length ? '연결을 확인한 뒤 다시 불러와주세요.' : filtered ? '이 조건에 맞는 준비 기록이 없어요.' : '아직 준비 중인 혜택이 없어요. 혜택 상세에서 신청 준비를 시작해보세요.'}${filtered ? '<button type="button" class="ghost-button" data-clear-work-filter>전체 기록 보기</button>' : ''}</div>`;
            return;
        }
        byId('applicationList').innerHTML = visible.map(draft => {
            const status = draftStatus(draft);
            const due = core.dueMeta(draft);
            const progress = Math.max(0, Math.min(100, Number(draft.completionPercent) || 0));
            const canExport = core.calendarDrafts([draft]).length > 0;
            return `<article class="application-card">
                <header><span class="journey-status ${status.tone}">${status.verified ? '✓ ' : ''}${escapeHtml(status.label)}</span><small>${escapeHtml(formatDateTime(draft.updatedAt))} 업데이트</small></header>
                <h3>${escapeHtml(draft.programTitle)}</h3>
                <p class="application-due ${due.tone}">${icon('clock')} ${escapeHtml(due.label)}</p>
                ${draft.userReceiptMemo ? `<p class="receipt-memo">내 메모 · ${escapeHtml(draft.userReceiptMemo)}</p>` : ''}
                ${draft.externalReceiptNumber ? `<p class="verified-receipt">기관 접수번호 <strong>${escapeHtml(draft.externalReceiptNumber)}</strong></p>` : ''}
                <div class="application-progress"><span role="progressbar" aria-label="준비 확인" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><i style="width:${progress}%"></i></span><b>${progress}% 확인</b></div>
                <footer><div class="application-secondary-actions">${canExport ? `<button class="text-button" data-calendar-id="${draft.id}" type="button">일정 받기</button>` : ''}${draft.status !== 'SUBMITTED' ? `<button class="text-button" data-draft-action="delete" data-id="${draft.id}" type="button" aria-label="${escapeHtml(draft.programTitle)} 준비 기록 삭제">삭제</button>` : ''}</div><button class="primary-button" data-draft-action="resume" data-program-id="${draft.programId}" type="button">${core.draftGroup(draft) === 'preparing' ? '이어서 준비' : '기록 확인'}</button></footer>
            </article>`;
        }).join('');
    }
    function init() {
        if (initialized) return;
        initialized = true;
        const stored = readStorage(storageKey, []);
        presets = Array.isArray(stored) ? stored.filter(value => value && typeof value.criteria === 'object' && value.criteria).slice(0,6).map(value => ({ criteria:core.normalizeSearch(value.criteria) })) : [];
        const shared = core.searchFromUrl(location.search);
        if (shared) applySearch(shared);
        renderPresets();
        byId('saveSearch').addEventListener('click', () => {
            const criteria = currentSearch();
            if (presets.some(value => core.searchKey(value.criteria) === core.searchKey(criteria))) return;
            if (presets.length >= 6) { showToast('검색 조건은 6개까지 저장할 수 있어요. 필요 없는 조건을 먼저 삭제해주세요.'); return; }
            presets.unshift({ criteria });
            const persisted = savePresets();
            renderPresets();
            showToast(persisted ? '검색 조건을 저장했어요. 다음에도 한 번에 찾아보세요.' : '브라우저 저장이 제한돼 이번 방문 중에만 사용할 수 있어요.');
        });
        byId('shareSearch').addEventListener('click', async () => {
            const criteria = currentSearch();
            await copyText(core.searchLink(criteria, location.origin), criteria.diagnosis ? '연령·가구 조건을 제외한 검색 링크를 복사했어요.' : '검색 링크를 복사했어요. 같은 검색 조건으로 열 수 있어요.');
        });
        byId('savedSearchList').addEventListener('click', event => {
            const remove = event.target.closest('[data-remove-search]');
            if (remove) {
                presets.splice(Number(remove.dataset.removeSearch), 1);
                const persisted = savePresets(); renderPresets();
                byId('saveSearch').focus();
                showToast(persisted ? '저장한 검색 조건을 삭제했어요.' : '이번 방문에서만 삭제했어요. 브라우저 저장 권한을 확인해주세요.');
                return;
            }
            const button = event.target.closest('[data-search-index]');
            if (!button) return;
            const preset = presets[Number(button.dataset.searchIndex)];
            if (!preset) return;
            applySearch(preset.criteria); loadPrograms();
            showToast('저장한 조건으로 다시 찾고 있어요.');
        });
        document.querySelectorAll('[data-work-filter]').forEach(button => button.addEventListener('click', () => setDraftFilter(button.dataset.workFilter)));
        byId('applicationSearch').addEventListener('input', renderApplications);
        byId('applicationSort').addEventListener('change', renderApplications);
        byId('exportCalendar').addEventListener('click', () => downloadCalendar(state.drafts));
        byId('retryApplications').addEventListener('click', loadDrafts);
        byId('applicationList').addEventListener('click', event => {
            const calendar = event.target.closest('[data-calendar-id]');
            if (calendar) downloadCalendar(state.drafts.filter(draft => draft.id === Number(calendar.dataset.calendarId)));
            if (event.target.closest('[data-clear-work-filter]')) {
                byId('applicationSearch').value = ''; setDraftFilter('all');
            }
        });
    }
    window.AnsimWorkspace = { init, searchChanged, renderApplications };
})();
