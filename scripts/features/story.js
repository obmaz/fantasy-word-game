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
        db.save('lastDay');
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
        dlog('[story.startIntro] mode=', mode, 'dayArg=', dayArg, 'resolvedDay=', daySel);
        db.lastSelectedDay = daySel;
        db.save('lastDay');
        story.day = mode === 'boss' ? 'boss' : daySel;
        story.mode = mode;
        const data = resolveStoryData(story.day);

        // 모드에 따라 적절한 story-modal ID 결정
        const storyScreenId = mode === 'boss' ? 'boss-mode-story-modal' : 'battle-mode-story-modal';
        const storyScreenPrefix = mode === 'boss' ? 'boss-mode' : 'battle-mode';

        dlog('[story.startIntro] day=', story.day, 'title=', data.title);

        // 스토리 모달 제목은 짧게 표시한다 (dayCatalog의 "Day 5 (부제)" 형태가 아니라 "Day 5")
        let displayTitle;
        if (story.day === 'all') displayTitle = '전체';
        else if (story.day === 'boss') displayTitle = '보스 모드';
        else if (!isNaN(Number(story.day))) displayTitle = `Day ${story.day}`;
        else displayTitle = story.day;

        // title-screen을 닫지 않고 z-index와 display를 조정
        const startScreen = document.getElementById('title-screen');
        if (startScreen) {
            startScreen.style.zIndex = '100';
            startScreen.style.display = 'flex';
        }

        // 두 스토리 모달 모두 초기 상태로 되돌린 뒤(이전 실행이 남긴 인라인 스타일 제거)
        // 이번에 쓸 것만 연다
        resetScreenOverlays(['battle-mode-story-modal', 'boss-mode-story-modal']);
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
        ui.setStoryTitle(displayTitle, storyScreenPrefix);

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

        // "모험시작" 버튼에 이벤트 연결 (버튼당 1회만)
        if (storyStartBtn) {
            story._bindStartButton(storyStartBtn);
        } else {
            console.warn(`${storyScreenPrefix}-start-btn not found`);
        }
    },

    /**
     * "모험시작" 버튼 클릭 핸들러.
     * story.mode/story.day를 읽으므로 클로저가 필요 없고, 따라서 버튼당 한 번만 바인딩하면 됩니다.
     */
    _onStartClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        dlog('Story start button clicked');

        if (game.isProcessing) {
            dlog('[startGame] 게임 오버 처리 중이므로 시작하지 않음');
            return;
        }

        // startIntro가 story.day를 이미 확정해 둠 (boss면 'boss')
        dlog('[story-btn] day=', story.day, 'mode=', story.mode);
        // 연습 모드는 스토리 모달을 거치지 않고 practiceMemorization.start()로
        // 직접 진입하므로 여기 도달하는 mode는 'battle' 또는 'boss'뿐이다.
        game.init(story.mode, story.day);
    },

    /**
     * 시작 버튼에 리스너를 1회만 붙입니다.
     *
     * 이전에는 리스너 중복을 막으려고 cloneNode로 노드를 통째 교체했지만,
     * 핸들러가 클로저를 쓰지 않게 바꾼 지금은 플래그 하나로 충분합니다.
     * (노드 교체는 다른 곳에서 잡아둔 참조를 무효화하는 부작용도 있었습니다.)
     * @param {HTMLElement} btn
     */
    _bindStartButton: (btn) => {
        if (btn.dataset.startBound) return;
        btn.addEventListener('click', story._onStartClick, { capture: true });
        btn.dataset.startBound = 'true';
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

        // 결과 화면으로 이동 (스토리/모드 선택 오버레이 정리는 game.end가 담당)
        game.end(win);
    },
};
