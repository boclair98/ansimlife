(function () {
    'use strict';
    const core = window.AnsimWorkflow;
    const topicIcons = {housing:'home',work:'work',family:'heart',learn:'book',care:'care',culture:'sun'};
    let activeGuideId = null;
    let guideDownloadController = null;

    function syncTopic() {
        document.querySelectorAll('[data-topic]').forEach(button => {
            const active = button.dataset.topic === state.topic;
            button.setAttribute('aria-pressed', String(active));
        });
        byId('resultsTitle').textContent = state.topic ? core.topics[state.topic] + ' 혜택' : '둘러볼 혜택';
    }

    function renderSaved() {
        const entries = [...state.savedIds].map(id => ({id, item:state.items.find(value => value.id === id)}));
        const keyword = byId('savedKeyword').value;
        const visible = core.selectSaved(entries, {keyword, sort:byId('savedSort').value});
        byId('savedResults').textContent = entries.length ? `${entries.length}개 중 ${visible.length}개` : '';
        byId('savedSort').disabled = entries.length === 0;
        if (!entries.length) {
            byId('savedList').innerHTML = `<div class="empty-state"><span>${icon('bookmark')}</span><h2>나중에 볼 혜택을 모아보세요</h2><p>마음에 드는 혜택의 책갈피를 누르면 여기에 저장돼요.</p><button class="primary-button" type="button" data-return-discover>혜택 둘러보기 ${icon('arrow')}</button></div>`;
            return;
        }
        if (!visible.length) {
            byId('savedList').innerHTML = '<div class="empty-state"><span>'+icon('search')+'</span><h2>저장 목록에 맞는 혜택이 없어요</h2><p>제목·지역·지원 내용으로 다시 찾아보세요.</p><button class="ghost-button" type="button" data-clear-saved-search>검색 초기화</button></div>';
            return;
        }
        byId('savedList').innerHTML = visible.map(({id,item}) => item ? programCard(item) : `<article class="benefit-card saved-unavailable"><h2>저장한 혜택을 다시 확인해주세요</h2><p>혜택 번호 ${id} · 연결이 잠시 지연되거나 공고가 바뀌었을 수 있어요.</p><div><button class="ghost-button" data-action="retry-saved" data-id="${id}" type="button">다시 불러오기</button><button class="text-button" data-action="remove-saved" data-id="${id}" type="button">저장 해제</button></div></article>`).join('');
    }

    function openGuide() {
        const item = state.activeDetail;
        if (!item || byId('benefitDetailContent').hidden) return;
        guideDownloadController?.abort();
        activeGuideId = item.id;
        byId('guidePrint').disabled = false;
        byId('guidePrint').textContent = 'PDF 내려받기';
        byId('guideStatus').textContent = 'PDF 파일을 열어 인쇄하거나 가족에게 전달할 수 있어요.';
        const official = officialUrlFor(item);
        const source = new URL('/', location.origin);
        source.searchParams.set('benefit', item.id);
        const rows = [
            ['어떤 혜택인가요?',item.purpose || item.summary],
            ['지원 대상',item.target],['지원 내용',item.benefit],['선정 기준',item.criteria],
            ['신청 기간',item.deadline],['신청 방법',item.applicationMethod],
            ['직접 준비할 서류',item.requiredDocuments],['담당자가 확인할 서류',item.officialDocuments],
            ['본인 동의로 확인할 서류',item.identityDocuments],
            ['접수·문의',[item.agency,item.department,item.receptionAgency,item.contact].filter(Boolean).join(' · ')]
        ].filter(([,value]) => hasText(value));
        byId('guideDocument').innerHTML = `<div class="guide-brand">안심생활 · 혜택 확인 안내문</div><h1>${escapeHtml(item.title)}</h1><p class="guide-meta">${escapeHtml(item.region || '전국')} · ${escapeHtml(normalizedCategory(item.category))} · 조회 ${core.todayKey()}</p><p class="guide-notice">이 안내문은 신청 준비를 돕는 참고자료예요. 최종 대상·신청 기간·서류는 공식 기관에서 확인해주세요. 실제 신청서는 공식 접수처에 제출해야 합니다.</p>${rows.map(([label,value]) => `<section><h2>${escapeHtml(label)}</h2><p>${escapeHtml(value)}</p></section>`).join('')}<section><h2>확인할 일</h2><ul class="guide-checks"><li>지원 대상과 선정 기준 확인</li><li>현재 모집 여부와 제출서류 확인</li><li>공식 접수처에서 최종 조건 확인 후 신청</li></ul></section><section class="guide-links"><h2>공식 출처와 다시 보기</h2><p>${escapeHtml(item.sourceLive ? '공식 상세정보 연결' : '마지막 저장 정보 기준')}${item.sourceUpdatedAt ? ' · 원문 수정 '+escapeHtml(item.sourceUpdatedAt) : ''}</p>${official ? `<p>공식 안내: <a href="${escapeHtml(official)}" target="_blank" rel="noopener noreferrer">${escapeHtml(official)}</a></p>` : '<p>공식 주소가 없어 상세 화면의 신청 방법·문의처를 확인해주세요.</p>'}<p>안심생활에서 다시 보기: ${escapeHtml(source.toString())}</p></section>`;
        openDialog(byId('guideDialog'));
    }

    byId('topicList').innerHTML = Object.entries(core.topics).map(([key,label]) => `<button data-topic="${key}" type="button" aria-pressed="false">${icon(topicIcons[key])}<span>${label}</span></button>`).join('');
    byId('topicList').addEventListener('click', event => {
        const button = event.target.closest('[data-topic]');
        if (!button) return;
        const next = state.topic === button.dataset.topic ? '' : button.dataset.topic;
        clearDiagnosis();
        state.topic = next;
        byId('category').value = '';
        document.querySelector('.category-disclosure').open = false;
        byId('keyword').value = '';
        state.quickFilter = 'all';
        syncCategorySelection(''); syncTopic();
        loadPrograms().then(() => {
            if (state.topic !== next) return;
            byId('programsHeading').scrollIntoView({block:'start',behavior:preferredScrollBehavior()});
            byId('programsHeading').focus({preventScroll:true});
        });
    });
    byId('savedKeyword').addEventListener('input', renderSaved);
    byId('savedSort').addEventListener('change', renderSaved);
    byId('savedList').addEventListener('click', event => {
        if (event.target.closest('[data-clear-saved-search]')) {
            byId('savedKeyword').value = ''; renderSaved(); byId('savedKeyword').focus();
        }
    });
    byId('benefitDetailGuide').addEventListener('click', openGuide);
    byId('guideClose').addEventListener('click', () => byId('guideDialog').close());
    byId('guidePrint').addEventListener('click', async () => {
        if (!activeGuideId) return;
        const controller = new AbortController();
        guideDownloadController?.abort(); guideDownloadController = controller;
        const id = activeGuideId;
        byId('guidePrint').disabled = true;
        byId('guidePrint').setAttribute('aria-busy','true');
        byId('guidePrint').textContent = 'PDF 준비 중…';
        byId('guideStatus').textContent = '공식 상세정보로 안내문을 만들고 있어요.';
        try {
            const response = await fetch(`/api/programs/${id}/guide.pdf`, {signal:controller.signal});
            if (!response.ok) throw new Error(await errorMessage(response, '안내문을 만들지 못했어요. 잠시 후 다시 눌러주세요.'));
            const blob = await response.blob();
            if (controller.signal.aborted) return;
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url; anchor.download = `안심생활-혜택-${id}.pdf`;
            document.body.append(anchor); anchor.click(); anchor.remove();
            setTimeout(() => URL.revokeObjectURL(url),30000);
            byId('guideStatus').textContent = 'PDF를 내려받았어요. 파일을 열어 인쇄하거나 공유해주세요.';
        } catch (error) {
            if (error.name !== 'AbortError') byId('guideStatus').textContent = error.message;
        } finally {
            if (guideDownloadController === controller) {
                byId('guidePrint').disabled = false;
                byId('guidePrint').removeAttribute('aria-busy');
                byId('guidePrint').textContent = 'PDF 내려받기';
            }
        }
    });
    bindDialogBackdrop(byId('guideDialog'));
    byId('guideDialog').addEventListener('close', () => {
        guideDownloadController?.abort();
        if (byId('benefitDetailDialog').open) byId('benefitDetailGuide').focus();
    });
    window.AnsimProduct = {syncTopic, renderSaved};
    byId('programsHeading').tabIndex = -1;
    syncTopic();
})();
