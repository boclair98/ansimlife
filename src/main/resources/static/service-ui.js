(function () {
    'use strict';
    const views = ['discover','saved','prepare','settings'];
    function show(view, focus = true) {
        const next = views.includes(view) ? view : 'discover';
        document.body.dataset.view = next;
        for (const [key,id] of [['saved','savedSection'],['prepare','applicationSection'],['settings','settingsSection']]) byId(id).hidden = next !== key;
        for (const link of document.querySelectorAll('[data-view-link]')) {
            const active = link.dataset.viewLink === next;
            link.classList.toggle('active',active);
            if(active) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
        }
        if(location.hash !== '#'+next) history.pushState(null,'','#'+next);
        window.scrollTo({top:0,behavior:'instant'});
        if(focus) {
            const title = next === 'discover' ? byId('welcomeTitle') : byId({saved:'savedSection',prepare:'applicationSection',settings:'settingsSection'}[next]).querySelector('h1');
            title?.focus({preventScroll:true});
        }
    }
    function route(focus = true) {
        const view = location.hash.slice(1);
        if(view === 'saved') { showSaved(); return; }
        if(view === 'prepare') { showApplications(); return; }
        if(views.includes(view) || !view || view === 'top') show(view,focus);
    }
    function setTextSize(size, announce = false) {
        const next = ['normal','large','larger'].includes(size) ? size : 'normal';
        document.documentElement.dataset.textSize = next;
        document.querySelectorAll('button[data-text-size]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.textSize === next)));
        if(announce) {
            const persisted = writeStorage('ansimlife.textSize',next);
            showToast(persisted === false ? '이번 방문에서 글자 크기를 바꿨어요.' : '글자 크기를 바꿨어요.');
        }
    }
    window.AnsimUI = {show};
    document.addEventListener('click',event => {
        const link = event.target.closest('a[data-view-link],a[href="#top"]');
        if(link) { event.preventDefault(); show(link.dataset.viewLink || 'discover'); }
        const size = event.target.closest('button[data-text-size]');
        if(size) { setTextSize(size.dataset.textSize,true); byId('textSizeMenu').open=false; }
        const menu = byId('textSizeMenu');
        if(menu.open && !menu.contains(event.target)) menu.open=false;
        const section = event.target.closest('.settings-rail a');
        if(section) {
            event.preventDefault();
            document.querySelectorAll('.settings-rail a').forEach(a=>a.removeAttribute('aria-current'));
            section.setAttribute('aria-current','location');
            document.querySelector(section.getAttribute('href'))?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
        }
        if(event.target.closest('[data-open-account]')) openAuth();
        if(event.target.closest('[data-return-discover]')) show('discover');
        if(event.target.closest('.category-heading a')) { event.preventDefault(); byId('resetSearch').click(); byId('programsHeading').scrollIntoView({block:'start',behavior:preferredScrollBehavior()}); }
    });
    document.addEventListener('keydown',event=>{
        if(event.key==='Escape' && byId('textSizeMenu').open) { byId('textSizeMenu').open=false; byId('textSizeMenu').querySelector('summary').focus(); }
    });
    byId('settingsAccount').addEventListener('click',()=>openAuth());
    window.addEventListener('hashchange',()=>route());
    setTextSize(readStorage('ansimlife.textSize','normal'));
    route(false);
})();
