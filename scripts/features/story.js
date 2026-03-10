/**
 * 스토리 관리 시스템
 * 게임 스토리 인트로 및 엔딩 화면 관리
 */

const story = {
    day: null,
    mode: null,

    /**
     * 보스 모드: 스토리 모달 없이 바로 게임 시작
     */
    startBossDirectly: () => {
        if (game.isProcessing) return;
        story.mode = 'boss';
        story.day = 'boss';
        db.lastSelectedDay = 'boss';
        db.save();
        const startScreen = document.getElementById('title-screen');
        if (startScreen) {
            startScreen.style.zIndex = '100';
            startScreen.style.display = 'flex';
        }
        game.init('boss', 'boss');
    },

    /**
     * 스토리 인트로를 시작합니다
     * @param {string} mode - 게임 모드 ('battle', 'boss', 'practice')
     * @param {string} dayArg - Day 값
     */
    startIntro: (mode, dayArg) => {
        const daySel = dayArg || document.getElementById('day-select').value;
        console.log('[story.startIntro] mode=', mode, 'dayArg=', dayArg, 'resolvedDay=', daySel);
        db.lastSelectedDay = daySel;
        db.save();
        story.day = mode === 'boss' ? 'boss' : daySel;
        story.mode = mode;
        const data = resolveStoryData(story.day);

        // 모드에 따라 적절한 story-modal ID 결정
        const storyScreenId = mode === 'boss' ? 'boss-mode-story-modal' : 'battle-mode-story-modal';
        const storyScreenPrefix = mode === 'boss' ? 'boss-mode' : 'battle-mode';

        // DEBUG: verify where title is coming from
        const hasEntry = !!(dayCatalog && dayCatalog[story.day] && dayCatalog[story.day].story);
        const optNode = document.querySelector(`#day-select option[value="${story.day}"]`);
        console.log(
            '[story.startIntro] dbg -> day=',
            story.day,
            'hasEntry=',
            hasEntry,
            'optText=',
            optNode && optNode.textContent
        );
        console.log('[story.startIntro] dbg -> data.title=', data.title);

        const titleElId = `${storyScreenPrefix}-title`;
        const titleEls = document.querySelectorAll(`#${titleElId}`);
        if (titleEls.length > 1)
            console.warn(
                `[story.startIntro] multiple #${titleElId} elements found:`,
                titleEls.length
            );
        const titleEl = document.getElementById(titleElId);
        console.log(
            `[story.startIntro] current #${titleElId} before=`,
            titleEl && titleEl.innerText
        );

        // ============================================================
        // 스토리 관리자
        // ============================================================
        let displayTitle;
        if (story.day === 'all') {
            displayTitle = '전체';
        } else if (story.day === 'boss') {
            displayTitle = '보스 모드';
        } else if (!isNaN(Number(story.day))) {
            displayTitle = `Day ${story.day}`;
        } else {
            displayTitle = story.day;
        }

        // title-screen을 닫지 않고 z-index와 display를 조정
        const startScreen = document.getElementById('title-screen');
        if (startScreen) {
            startScreen.style.zIndex = '100';
            startScreen.style.display = 'flex';
        }

        // 다른 story-modal 닫기
        const battleModeStoryScreen = document.getElementById('battle-mode-story-modal');
        const bossStoryScreen = document.getElementById('boss-mode-story-modal');
        if (battleModeStoryScreen && storyScreenId !== 'battle-mode-story-modal') {
            battleModeStoryScreen.style.display = 'none';
        }
        if (bossStoryScreen && storyScreenId !== 'boss-mode-story-modal') {
            bossStoryScreen.style.display = 'none';
        }

        // story-modal 스타일 초기화
        const storyScreen = document.getElementById(storyScreenId);
        if (storyScreen) {
            storyScreen.style.visibility = '';
            storyScreen.style.opacity = '';
            storyScreen.style.zIndex = '';
            storyScreen.style.pointerEvents = '';
            storyScreen.classList.remove('closing');
        }

        openScreenOverlay(storyScreenId, true);

        // 히스토리 상태 추가 (백버튼 처리용)
        history.pushState({ screen: storyScreenId }, '', window.location.href);

        // 타이틀 크기 먼저 동기화
        if (typeof syncTitleButtonOverlay === 'function') {
            syncTitleButtonOverlay();
        }

        // 배경 이미지 설정
        const storyImg = document.getElementById(`${storyScreenPrefix}-background-img`);
        const storyStartBtn = document.getElementById(`${storyScreenPrefix}-start-btn`);
        if (storyImg) {
            storyImg.src = 'images/battle_mode/battle_mode_story_modal.webp';
            if (storyStartBtn) {
                storyStartBtn.classList.add('boss-mode-btn');
                storyStartBtn.classList.remove('practice-btn');
            }

            // 이미지 로드 후 버튼 오버레이 동기화
            if (storyImg.complete) {
                setTimeout(() => {
                    syncStoryButtonOverlay(storyScreenId);
                }, 100);
            } else {
                storyImg.addEventListener(
                    'load',
                    () => {
                        setTimeout(() => {
                            syncStoryButtonOverlay(storyScreenId);
                        }, 100);
                    },
                    { once: true }
                );
            }
        }

        // 타이틀 설정
        if (window.ui && typeof window.ui.setStoryTitle === 'function') {
            window.ui.setStoryTitle(displayTitle, storyScreenPrefix);
        } else {
            const te = document.getElementById(titleElId);
            if (te) te.innerText = displayTitle;
            console.warn(`[story.startIntro] fallback title write used for ${titleElId}`);
        }

        // Day 정보 표시
        const dayInfoEl = document.getElementById(`${storyScreenPrefix}-day-info`);
        if (dayInfoEl) {
            dayInfoEl.innerText = displayTitle;
        }

        // 이야기 텍스트 표시
        const textEl = document.getElementById(`${storyScreenPrefix}-text`);
        if (textEl) {
            let introText = data.intro || '';
            textEl.innerText = introText;
        }

        // 해결된 day 값 저장
        const resolvedAtIntro = story.mode === 'boss' ? 'boss' : daySel;

        // "모험시작" 버튼에 이벤트 연결
        if (storyStartBtn) {
            // 기존 이벤트 리스너 완전히 제거
            storyStartBtn.onclick = null;
            const newBtn = storyStartBtn.cloneNode(true);
            storyStartBtn.parentNode.replaceChild(newBtn, storyStartBtn);
            const freshBtn = document.getElementById(`${storyScreenPrefix}-start-btn`);

            // 새 이벤트 리스너 추가
            if (freshBtn) {
                freshBtn.addEventListener(
                    'click',
                    (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Story start button clicked');
                        if (game.isProcessing) {
                            console.log('[startGame] 게임 오버 처리 중이므로 시작하지 않음');
                            return;
                        }
                        const resolvedAtIntro = story.mode === 'boss' ? 'boss' : daySel;
                        console.log(
                            '[story-btn] introResolvedDay=',
                            resolvedAtIntro,
                            'story.mode=',
                            story.mode
                        );

                        // Practice 모드는 암기 모드로 시작
                        if (story.mode === 'practice') {
                            practiceMemorization.start(resolvedAtIntro);
                        } else {
                            game.init(story.mode, resolvedAtIntro);
                        }
                    },
                    { capture: true }
                );
                freshBtn.style.pointerEvents = 'auto';
                freshBtn.style.cursor = 'pointer';
                freshBtn.style.zIndex = '25';
            }
        } else {
            console.warn(`${storyScreenPrefix}-start-btn not found`);
        }
    },

    /**
     * 엔딩 화면을 표시합니다
     * @param {boolean} win - 승리 여부
     */
    showEnding: (win) => {
        // 게임 타이머 정지
        if (game.timer) {
            clearInterval(game.timer);
            game.timer = null;
        }

        // 배경음악 정지
        const bgMusic = document.getElementById('background-music');
        if (bgMusic && !bgMusic.paused) {
            bgMusic.pause();
        }

        // 게임 오버 상태로 설정
        game.isProcessing = true;

        document.getElementById('battle-mode-game').style.display = 'none';

        // story-modal을 확실히 닫기
        const battleModeStoryScreen = document.getElementById('battle-mode-story-modal');
        const bossStoryScreen = document.getElementById('boss-mode-story-modal');
        if (battleModeStoryScreen) {
            battleModeStoryScreen.style.display = 'none';
            battleModeStoryScreen.style.visibility = 'hidden';
            battleModeStoryScreen.style.opacity = '0';
            battleModeStoryScreen.style.zIndex = '100';
            battleModeStoryScreen.style.pointerEvents = 'none';
            battleModeStoryScreen.classList.remove('closing');
        }
        if (bossStoryScreen) {
            bossStoryScreen.style.display = 'none';
            bossStoryScreen.style.visibility = 'hidden';
            bossStoryScreen.style.opacity = '0';
            bossStoryScreen.style.zIndex = '100';
            bossStoryScreen.style.pointerEvents = 'none';
            bossStoryScreen.classList.remove('closing');
        }

        // practice-mode-modal과 battle-mode-modal 닫기
        const practiceModeModal = document.getElementById('practice-mode-modal');
        const battleModeModal = document.getElementById('battle-mode-modal');
        if (practiceModeModal) {
            practiceModeModal.style.display = 'none';
            practiceModeModal.style.visibility = 'hidden';
            practiceModeModal.style.opacity = '0';
            practiceModeModal.style.zIndex = '100';
            practiceModeModal.style.pointerEvents = 'none';
            practiceModeModal.classList.remove('closing');
        }
        if (battleModeModal) {
            battleModeModal.style.display = 'none';
            battleModeModal.style.visibility = 'hidden';
            battleModeModal.style.opacity = '0';
            battleModeModal.style.zIndex = '100';
            battleModeModal.style.pointerEvents = 'none';
            battleModeModal.classList.remove('closing');
        }

        // 결과 화면으로 이동
        game.end(win);
    },
};
