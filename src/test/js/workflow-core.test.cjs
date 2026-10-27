const { test } = require('node:test');
const assert = require('node:assert/strict');
const core = require('../../main/resources/static/workflow-core.js');

test('official links allow only absolute HTTP(S) addresses without credentials and select a valid fallback', () => {
    for (const value of [null, '', '  ', '/apply', '//gov.example/apply', 'javascript:alert(1)', 'data:text/html,hello',
        'file:///C:/private', 'https:gov.example', 'https://', 'https://user:password@gov.example/', 'https://user@gov.example/',
        'https://gov.example/\napply', 'java\nscript:alert(1)']) {
        assert.equal(core.safeExternalUrl(value), null, `must reject ${JSON.stringify(value)}`);
    }
    assert.equal(core.safeExternalUrl('  https://gov.example/apply?q=주거  '), 'https://gov.example/apply?q=%EC%A3%BC%EA%B1%B0');
    assert.equal(core.safeExternalUrl('HTTP://GOV.EXAMPLE/apply'), 'http://gov.example/apply');
    assert.equal(core.safeExternalUrl('javascript:alert(1)', null, 'https://gov.example/apply'), 'https://gov.example/apply');
    assert.equal(core.safeExternalUrl('https://first.example/', 'https://second.example/'), 'https://first.example/');
});

test('shared search restores public criteria and excludes personal profile fields', () => {
    const criteria = { keyword:'월세 & 주거', region:'서울', category:'주거·자립', sort:'deadline', filter:'matched', hideClosed:false,
        diagnosis:{ region:'서울', age:'청년', need:'주거·자립', household:'1인가구', incomeRange:'개인 조건' } };
    const url = new URL(core.searchLink(criteria, 'https://ansimlife.example'));
    const restored = core.searchFromUrl(url.search);
    assert.equal(restored.keyword, '월세 & 주거');
    assert.equal(restored.region, '서울');
    assert.equal(restored.sort, 'deadline');
    assert.equal(restored.hideClosed, false);
    assert.equal(restored.filter, 'all');
    assert.equal(restored.diagnosis, null);
    assert.equal(url.search.includes('age'), false);
    assert.equal(url.search.includes('income'), false);
    assert.equal(core.searchFromUrl('?benefit=12'), null);
    assert.ok(core.searchLabel(criteria).includes('마감 가까운순'));
    assert.ok(core.searchLabel(criteria).includes('종료 공고 포함'));
});

test('malformed stored searches cannot inject unknown fields or invalid filters', () => {
    assert.deepEqual(core.normalizeSearch(null), core.normalizeSearch({}));
    const search = core.normalizeSearch({ keyword:['bad'], sort:'unknown', filter:'matched', diagnosis:[], hideClosed:'false' });
    assert.equal(search.keyword, '');
    assert.equal(search.filter, 'all');
    assert.equal(search.sort, 'recommended');
    assert.equal(search.hideClosed, false);
    assert.equal(core.normalizeSearch({ keyword:'가'.repeat(200) }).keyword.length, 80);
});

test('topic searches round-trip through shared URLs and reject unknown topic values', () => {
    const value = {topic:'housing',region:'서울',keyword:'청년',diagnosis:{region:'서울',age:'청년',need:'주거·자립',household:'1인 가구'}};
    const url = new URL(core.searchLink(value, 'https://ansimlife.example'));
    const restored = core.searchFromUrl(url.search);
    assert.equal(restored.topic,'housing');
    assert.equal(restored.keyword,'청년');
    assert.equal(restored.diagnosis,null);
    assert.ok(core.searchLabel(value).includes('주거·이사'));
    for (const topic of ['unknown','constructor','__proto__',null,[]]) assert.equal(core.normalizeSearch({topic}).topic,'');
});

test('saved search and deadline ordering retain unavailable records and do not mutate saved order', () => {
    const entries = [
        {id:1,item:{title:'주거',region:'서울',deadlineDate:'2026-11-02'}},
        {id:2,item:{title:'장학',region:'부산',deadlineDate:'2026-10-30'}},
        {id:3,item:{title:'만료',deadlineDate:'2026-10-01',expired:true}},
        {id:4,item:{title:'상시'}}, {id:5,item:null}
    ];
    assert.deepEqual(core.selectSaved(entries,{keyword:'서울'}).map(x=>x.id),[1]);
    assert.deepEqual(core.selectSaved(entries,{sort:'deadline'}).map(x=>x.id),[2,1,5,4,3]);
    assert.deepEqual(core.selectSaved(entries).map(x=>x.id),[5,4,3,2,1]);
    assert.deepEqual(entries.map(x=>x.id),[1,2,3,4,5]);
});

const drafts = [
    { id:1, programId:10, programTitle:'주거 지원', journeyStatus:'PREPARING', nextActionDate:'2026-10-24', updatedAt:'2026-10-20T10:00:00' },
    { id:2, programId:11, programTitle:'의료비 지원', journeyStatus:'RESULT_WAITING', nextActionDate:'2026-10-25', updatedAt:'2026-10-22T10:00:00' },
    { id:3, programId:12, programTitle:'교육 지원', journeyStatus:'SUPPLEMENT_REQUESTED', nextActionDate:'2026-11-01', updatedAt:'2026-10-24T10:00:00' },
    { id:4, programId:13, programTitle:'일자리 지원', journeyStatus:'APPROVED', nextActionDate:'2026-10-23', updatedAt:'2026-10-23T10:00:00' },
    { id:5, programId:14, programTitle:'생활 지원', journeyStatus:'PREPARING', nextActionDate:null, updatedAt:'2026-10-21T10:00:00' }
];

test('date boundaries use Korea day and reject rolled-over or unsupported dates', () => {
    assert.equal(core.todayKey(new Date('2026-10-24T16:00:00Z')), '2026-10-25');
    assert.equal(core.isDate('2026-02-30'), false);
    assert.equal(core.isDate('2024-02-29'), true);
    assert.equal(core.isDate('0000-01-01'), false);
    assert.equal(core.dayDistance('2026-11-01', '2026-10-25'), 7);
});

test('upcoming and overdue filters exclude completed records without mutating original order', () => {
    assert.deepEqual(core.selectDrafts(drafts, {group:'due',today:'2026-10-25'}).map(x => x.id), [2,1]);
    assert.deepEqual(core.selectDrafts(drafts, {group:'week',today:'2026-10-25'}).map(x => x.id), [3]);
    assert.deepEqual(core.selectDrafts(drafts, {group:'preparing',keyword:'생활'}).map(x => x.id), [5]);
    assert.deepEqual(core.selectDrafts(drafts, {sort:'date'}).map(x => x.id), [4,1,2,3,5]);
    assert.deepEqual(drafts.map(x => x.id), [1,2,3,4,5]);
    assert.equal(core.dueMeta(drafts[1], '2026-10-25').label, '오늘 확인할 혜택');
});

test('calendar includes only active scheduled records and omits private notes', () => {
    const calendar = core.calendar(drafts.map(x => ({...x, userReceiptMemo:'PRIVATE-NOTE', externalReceiptNumber:'PRIVATE-RECEIPT'})), 'https://ansimlife.example', new Date('2026-10-25T00:00:00Z'));
    assert.equal((calendar.match(/BEGIN:VEVENT/g) || []).length, 3);
    assert.ok(calendar.includes('DTSTART;VALUE=DATE:20261101\r\nDTEND;VALUE=DATE:20261102'));
    assert.ok(calendar.includes('URL:https://ansimlife.example/?benefit=10'));
    assert.equal(calendar.includes('PRIVATE-NOTE'), false);
    assert.equal(calendar.includes('PRIVATE-RECEIPT'), false);
    assert.equal(calendar.includes('일자리'), false);
    const changed = core.calendar([{...drafts[0],nextActionDate:'2026-12-01'}], 'https://ansimlife.example');
    assert.equal(calendar.match(/UID:[^\r]+/)[0], changed.match(/UID:[^\r]+/)[0]);
});

test('calendar escapes line injection and folds Korean lines at UTF-8 octet boundaries', () => {
    const title = '혜택'.repeat(70) + '\r\nBEGIN:VEVENT;X,Y\\Z';
    const output = core.calendar([{id:2,programId:3,programTitle:title,nextActionDate:'2024-12-31'}], 'https://ansimlife.example', new Date('2026-10-25T00:00:00Z'));
    assert.ok(output.includes('DTEND;VALUE=DATE:20250101'));
    assert.equal((output.match(/\r\nBEGIN:VEVENT\r\n/g) || []).length, 1);
    for (const line of output.split('\r\n')) assert.ok(Buffer.byteLength(line,'utf8') <= 75);
    const unfolded = output.replace(/\r\n /g, '');
    assert.ok(unfolded.includes('\\nBEGIN:VEVENT\\;X\\,Y\\\\Z'));
    assert.equal(unfolded.includes('\uFFFD'), false);
});
