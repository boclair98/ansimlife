(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.AnsimWorkflow = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
    'use strict';
    const clean = (value, max = 80) => typeof value === 'string' ? value.trim().slice(0, max) : '';
    const pick = (value, allowed, fallback) => allowed.includes(value) ? value : fallback;
    const closed = new Set(['APPROVED', 'REJECTED']);
    function safeExternalUrl(...candidates) {
        for (const candidate of candidates) {
            if (typeof candidate !== 'string') continue;
            const value = candidate.trim();
            if (!/^https?:\/\//i.test(value) || /[\u0000-\u001f\u007f]/.test(value)) continue;
            try {
                const url = new URL(value);
                if (['http:', 'https:'].includes(url.protocol) && url.hostname && !url.username && !url.password) return url.href;
            } catch { /* Try the next published link when a source address is malformed. */ }
        }
        return null;
    }
    function normalizeSearch(value) {
        const input = value && typeof value === 'object' ? value : {};
        const result = {
            keyword: clean(input.keyword), region: clean(input.region, 20), category: clean(input.category, 30),
            sort: pick(input.sort, ['recommended', 'deadline', 'online'], 'recommended'),
            filter: pick(input.filter, ['all', 'urgent', 'online', 'matched'], 'all'),
            hideClosed: input.hideClosed !== false && input.hideClosed !== 'false', diagnosis: null
        };
        if (input.diagnosis && typeof input.diagnosis === 'object') {
            const diagnosis = Object.fromEntries(['region', 'age', 'need', 'household'].map(key => [key, clean(input.diagnosis[key], 40)]));
            if (diagnosis.region && diagnosis.age && diagnosis.need && diagnosis.household) result.diagnosis = diagnosis;
        }
        if (result.filter === 'matched' && !result.diagnosis) result.filter = 'all';
        return result;
    }
    function searchLabel(value) {
        const criteria = normalizeSearch(value);
        const parts = [criteria.region || '모든 지역', criteria.keyword || criteria.category || '전체 혜택'];
        if (criteria.keyword && criteria.category) parts.push(criteria.category);
        if (criteria.diagnosis) parts.push(criteria.diagnosis.age, criteria.diagnosis.household);
        if (criteria.filter !== 'all') parts.push({ urgent:'마감 임박', online:'온라인', matched:'조건 일치' }[criteria.filter]);
        if (criteria.sort !== 'recommended') parts.push({ deadline:'마감 가까운순', online:'온라인 안내순' }[criteria.sort]);
        if (!criteria.hideClosed) parts.push('종료 공고 포함');
        return parts.join(' · ');
    }
    function searchKey(value) { return JSON.stringify(normalizeSearch(value)); }
    function searchLink(value, origin) {
        const criteria = normalizeSearch(value);
        const url = new URL('/', origin);
        url.searchParams.set('search', '1');
        for (const key of ['keyword', 'region', 'category']) if (criteria[key]) url.searchParams.set(key, criteria[key]);
        url.searchParams.set('sort', criteria.sort);
        url.searchParams.set('filter', criteria.filter === 'matched' ? 'all' : criteria.filter);
        url.searchParams.set('hideClosed', String(criteria.hideClosed));
        url.hash = 'discover';
        return url.toString();
    }
    function searchFromUrl(search) {
        const params = new URLSearchParams(search);
        return params.get('search') === '1' ? normalizeSearch(Object.fromEntries(params)) : null;
    }
    function isDate(value) {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const year = Number(value.slice(0, 4));
        if (year < 1900 || year > 9998) return false;
        const date = new Date(`${value}T00:00:00Z`);
        return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }
    function todayKey(now = new Date()) {
        const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Seoul', year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(now).map(part => [part.type, part.value]));
        return `${parts.year}-${parts.month}-${parts.day}`;
    }
    function dayDistance(date, today) { return isDate(date) && isDate(today) ? Math.round((Date.parse(date) - Date.parse(today)) / 86400000) : null; }
    function draftGroup(draft) {
        const status = draft.journeyStatus || 'PREPARING';
        if (closed.has(status)) return 'complete';
        if (status === 'SUPPLEMENT_REQUESTED') return 'supplement';
        return ['USER_REPORTED_SUBMITTED', 'RESULT_WAITING', 'INSTITUTION_CONFIRMED'].includes(status) ? 'waiting' : 'preparing';
    }
    function dueMeta(draft, today = todayKey()) {
        const days = dayDistance(draft.nextActionDate, today);
        if (days === null) return { days:null, tone:'neutral', label:'다음 확인일 미설정' };
        if (draftGroup(draft) === 'complete') return { days, tone:'neutral', label:`확인일 ${draft.nextActionDate}` };
        if (days < 0) return { days, tone:'warning', label:`확인 예정일 ${-days}일 지남` };
        if (days === 0) return { days, tone:'warning', label:'오늘 확인할 혜택' };
        if (days <= 7) return { days, tone:'active', label:`${days}일 뒤 확인` };
        return { days, tone:'neutral', label:`다음 확인 ${draft.nextActionDate}` };
    }
    function selectDrafts(drafts, { group = 'all', keyword = '', sort = 'updated', today = todayKey() } = {}) {
        const query = clean(keyword).toLocaleLowerCase('ko-KR');
        return drafts.filter(draft => {
            if (query && !String(draft.programTitle || '').toLocaleLowerCase('ko-KR').includes(query)) return false;
            if (group === 'due') return draftGroup(draft) !== 'complete' && dueMeta(draft, today).days !== null && dueMeta(draft, today).days <= 0;
            if (group === 'week') return draftGroup(draft) !== 'complete' && dueMeta(draft, today).days > 0 && dueMeta(draft, today).days <= 7;
            return group === 'all' || draftGroup(draft) === group;
        }).sort((a,b) => {
            if (sort === 'date') {
                const aDate = isDate(a.nextActionDate) ? a.nextActionDate : '9999';
                const bDate = isDate(b.nextActionDate) ? b.nextActionDate : '9999';
                if (aDate !== bDate) return aDate.localeCompare(bDate);
            }
            return String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')) || Number(b.id) - Number(a.id);
        });
    }
    function calendarDrafts(drafts) { return drafts.filter(draft => draftGroup(draft) !== 'complete' && isDate(draft.nextActionDate)); }
    function escapeCalendar(value) { return String(value || '').replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,'); }
    function foldLine(value) {
        const lines = [];
        let line = '', bytes = 0;
        for (const character of value) {
            const width = new TextEncoder().encode(character).length;
            if (bytes + width > 75) { lines.push(line); line = ' '; bytes = 1; }
            line += character; bytes += width;
        }
        lines.push(line);
        return lines.join('\r\n');
    }
    function calendar(drafts, origin, now = new Date()) {
        const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AnsimLife//My benefit schedule//KO', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
        const host = new URL(origin).hostname;
        const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        for (const draft of calendarDrafts(drafts)) {
            const end = new Date(`${draft.nextActionDate}T00:00:00Z`); end.setUTCDate(end.getUTCDate() + 1);
            const url = new URL('/', origin); url.searchParams.set('benefit', draft.programId);
            lines.push('BEGIN:VEVENT', `UID:ansimlife-draft-${draft.id}@${host}`, `DTSTAMP:${stamp}`, 'CLASS:PRIVATE', 'TRANSP:TRANSPARENT',
                `DTSTART;VALUE=DATE:${draft.nextActionDate.replaceAll('-', '')}`, `DTEND;VALUE=DATE:${end.toISOString().slice(0, 10).replaceAll('-', '')}`,
                `SUMMARY:${escapeCalendar(`혜택 확인 · ${draft.programTitle}`)}`,
                `DESCRIPTION:${escapeCalendar('안심생활에서 직접 정한 다음 확인일입니다. 기관의 공식 마감일이나 접수 확인이 아닙니다. 상세 공고와 내 준비 상태를 확인해주세요.')}`,
                `URL:${url}`, 'END:VEVENT');
        }
        lines.push('END:VCALENDAR');
        return lines.map(foldLine).join('\r\n') + '\r\n';
    }
    return { safeExternalUrl, normalizeSearch, searchLabel, searchKey, searchLink, searchFromUrl, isDate, todayKey, dayDistance, draftGroup, dueMeta, selectDrafts, calendarDrafts, calendar };
});
