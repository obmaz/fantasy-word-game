// Practice Memorization Mode - 단어 암기 모드
const practiceMemorization = {
    words: [],
    fullPool: [], // 필터 적용 전 전체 단어 (칩 전환 시 재필터용)
    currentIndex: 0,
    currentDay: null,
    /** 필터: 'all' | 'memorized' | 'not-memorized' */
    currentFilter: 'all',
    /** 설명 영역: false = 영문(englishExplanation), true = 한글(koreanExplanation) */
    showKoreanExplanation: false,

    getBookName: () => {
        return typeof window !== 'undefined' && window.currentGameDataName
            ? window.currentGameDataName
            : '기본 단어장';
    },

    /** 현재 단어장의 외운 단어 키 Set (word|meaning) */
    getMemorizedSet: () => {
        const bookName = practiceMemorization.getBookName();
        if (!db.practiceMemorized || !db.practiceMemorized[bookName]) return new Set();
        return new Set(db.practiceMemorized[bookName]);
    },

    /** fullPool을 currentFilter에 맞게 필터링하여 words 설정 */
    applyFilter: (filter) => {
        practiceMemorization.currentFilter = filter || practiceMemorization.currentFilter;
        const set = practiceMemorization.getMemorizedSet();
        const pool = practiceMemorization.fullPool;

        if (practiceMemorization.currentFilter === 'memorized') {
            practiceMemorization.words = pool.filter((w) => set.has(`${w.word}|${w.meaning}`));
        } else if (practiceMemorization.currentFilter === 'not-memorized') {
            practiceMemorization.words = pool.filter((w) => !set.has(`${w.word}|${w.meaning}`));
        } else {
            practiceMemorization.words = [...pool];
        }

        // 칩 활성 상태 업데이트
        const chips = document.querySelectorAll('#practice-filter-chips .practice-chip');
        chips.forEach((chip) => {
            const dataFilter = chip.getAttribute('data-filter');
            chip.classList.toggle(
                'practice-chip-active',
                dataFilter === practiceMemorization.currentFilter
            );
        });

        practiceMemorization.currentIndex = 0;
        if (practiceMemorization.words.length > 0) {
            practiceMemorization.showWord(0);
        } else {
            // 표시할 단어 없음 시 UI만 갱신
            const counterEl = document.getElementById('practice-word-counter');
            if (counterEl) counterEl.textContent = '0 / 0';
            const wordTextEl = document.getElementById('practice-word-text');
            if (wordTextEl) wordTextEl.textContent = '없음';
            const meaningTextEl = document.getElementById('practice-meaning-text');
            if (meaningTextEl) meaningTextEl.textContent = '없음';
            const explanationTextEl = document.getElementById('practice-explanation-text');
            if (explanationTextEl) explanationTextEl.textContent = '없음';
            const prevBtn = document.getElementById('practice-prev-btn');
            const nextBtn = document.getElementById('practice-next-btn');
            if (prevBtn) prevBtn.disabled = true;
            if (nextBtn) nextBtn.disabled = true;
        }
    },

    /** 현재 단어를 외웠어요 토글 (저장 후 버튼 상태 갱신) */
    toggleMemorized: () => {
        if (
            practiceMemorization.words.length === 0 ||
            practiceMemorization.currentIndex < 0 ||
            practiceMemorization.currentIndex >= practiceMemorization.words.length
        )
            return;

        const word = practiceMemorization.words[practiceMemorization.currentIndex];
        const bookName = practiceMemorization.getBookName();
        const key = `${word.word}|${word.meaning}`;

        if (!db.practiceMemorized) db.practiceMemorized = {};
        if (!db.practiceMemorized[bookName]) db.practiceMemorized[bookName] = [];

        const arr = db.practiceMemorized[bookName];
        const idx = arr.indexOf(key);

        if (idx === -1) {
            // 안 외운 상태 -> 외움 추가
            arr.push(key);
            game.showFloatText('외웠어요!', 'gold'); // using game engine for float text
        } else {
            // 이미 외운 상태 -> 취소
            arr.splice(idx, 1);
            game.showFloatText('외움 취소', 'red');
        }
        db.save();

        // 현재 필터가 all이면 그냥 버튼 상태만 갱신
        // memorized나 not-memorized면 리스트에서 사라져야 하므로 applyFilter 재호출
        if (practiceMemorization.currentFilter === 'all') {
            practiceMemorization.showWord(practiceMemorization.currentIndex);
        } else {
            practiceMemorization.applyFilter(null);
        }
    },

    showWord: (index) => {
        if (index < 0 || index >= practiceMemorization.words.length) return;
        practiceMemorization.currentIndex = index;
        const word = practiceMemorization.words[index];

        const counterEl = document.getElementById('practice-word-counter');
        const wordTextEl = document.getElementById('practice-word-text');
        const meaningTextEl = document.getElementById('practice-meaning-text');
        const explanationTextEl = document.getElementById('practice-explanation-text');
        const memorizedBtn = document.getElementById('practice-memorized-btn');
        const prevBtn = document.getElementById('practice-prev-btn');
        const nextBtn = document.getElementById('practice-next-btn');

        // 카운터 (1-based)
        if (counterEl) {
            counterEl.textContent = `${index + 1} / ${practiceMemorization.words.length}`;
        }

        // 단어/뜻
        if (wordTextEl) wordTextEl.textContent = word.word || 'N/A';
        if (meaningTextEl) meaningTextEl.textContent = word.meaning || 'N/A';

        // 설명 (토글 상태에 따라)
        if (explanationTextEl) {
            explanationTextEl.textContent = practiceMemorization.showKoreanExplanation
                ? word.koreanExplanation || 'N/A'
                : word.englishExplanation || 'N/A';
        }

        // 외웠어요 버튼 상태
        const set = practiceMemorization.getMemorizedSet();
        const isMemorized = set.has(`${word.word}|${word.meaning}`);
        if (memorizedBtn) {
            memorizedBtn.classList.toggle('practice-memorized-active', isMemorized);
            const icon = memorizedBtn.querySelector('.material-icons');
            if (icon) {
                icon.textContent = isMemorized ? 'check_circle' : 'check_circle_outline';
                icon.style.color = isMemorized ? '#4CAF50' : '#aaa';
            }
        }

        // 이전/다음 버튼 활성
        if (prevBtn) prevBtn.disabled = index === 0;
        if (nextBtn) nextBtn.disabled = index === practiceMemorization.words.length - 1;
    },

    start: (day) => {
        practiceMemorization.currentDay = day; // 'all'일 수 있음

        // 데이터 로드
        let pool;
        // 현재 데이터셋의 rawData 사용
        const currentRawData =
            typeof window !== 'undefined' && window.rawDataData ? window.rawDataData : rawData;

        if (day === 'all') {
            pool = currentRawData;
        } else {
            const dNum = Number(day);
            pool = currentRawData.filter((r) => Number(r.day) === dNum);
        }

        if (!pool || pool.length === 0) {
            alert('단어 데이터가 없습니다.');
            return;
        }

        practiceMemorization.fullPool = pool;

        // UI 초기화 - 여기서 바로 모달을 열지 않고, 모달이 열린 후 내용을 채우는 역할
        // 실제 모달 open은 openPracticeModal() 등에서 수행하거나 여기서 수행
        // 기존 코드 흐름상 openPracticeModal()에서 start()를 부르므로 여기서 내용 채움

        // [FIX] 게임 화면 표시 (검은 화면 방지)
        const gameScreen = document.getElementById('practice-mode-game');
        if (gameScreen) {
            gameScreen.style.display = 'flex';
            // 화면 크기 동기화 (layout-manager.js)
            if (typeof syncGameScreenSizeToTitle === 'function') {
                syncGameScreenSizeToTitle();
            }
            // title-screen z-index 조정 (혹시 남아있을 경우 대비)
            const titleScreen = document.getElementById('title-screen');
            if (titleScreen) titleScreen.style.zIndex = '';
        }

        const dayInfoEl = document.getElementById('practice-memorization-day-info');
        const dayLabel = day === 'all' ? '전체' : `Day ${day}`;
        if (dayInfoEl) dayInfoEl.textContent = dayLabel;

        // 기본 필터: all, 인덱스 0
        practiceMemorization.currentFilter = 'all';
        practiceMemorization.currentIndex = 0;
        practiceMemorization.showKoreanExplanation = false; // 기본 영문

        practiceMemorization.applyFilter('all');

        // 배경음악 (Practice 모드용)
        playMusic('practice');

        // TTS 자동 재생 여부? (일단 수동)
    },

    toggleExplanationLang: () => {
        practiceMemorization.showKoreanExplanation = !practiceMemorization.showKoreanExplanation;
        practiceMemorization.showWord(practiceMemorization.currentIndex);
    },

    playTTS: () => {
        if (
            practiceMemorization.words.length === 0 ||
            practiceMemorization.currentIndex < 0 ||
            practiceMemorization.currentIndex >= practiceMemorization.words.length
        )
            return;
        const word = practiceMemorization.words[practiceMemorization.currentIndex];
        if (!word || !word.word) return;

        const utterance = new SpeechSynthesisUtterance(word.word);
        utterance.lang = 'en-US';
        utterance.rate = 0.8; // 약간 천천히

        // 설정된 TTS voice 사용
        const preferredVoice = getPreferredTTSVoice();
        if (preferredVoice) utterance.voice = preferredVoice;

        window.speechSynthesis.cancel(); // 기존 음성 중단
        window.speechSynthesis.speak(utterance);
    },

    prev: () => {
        if (practiceMemorization.currentIndex > 0) {
            practiceMemorization.showWord(practiceMemorization.currentIndex - 1);
        }
    },

    next: () => {
        if (practiceMemorization.currentIndex < practiceMemorization.words.length - 1) {
            practiceMemorization.showWord(practiceMemorization.currentIndex + 1);
        }
    },

    exit: () => {
        // practice-mode-modal 만 닫기
        // (참고: 기존 코드에서는 closeScreenOverlay 사용하거나 직접 style 조작)
        // 여기서는 game.exit() 처럼 화면 닫기 및 음악 정지 등 처리
        const otherScreens = [
            'battle-mode-game',
            'shop-modal',
            'inventory-modal',
            'statistics-modal',
            'setting-modal',
            'battle-mode-story-modal',
            'boss-mode-story-modal',
            'result-modal',
            'practice-mode-modal',
            'battle-mode-modal',
        ];

        // 배경음악 정지 (practice 모드용)
        const bgMusic = document.getElementById('background-music');
        if (bgMusic && !bgMusic.paused) {
            bgMusic.pause();
            bgMusic.currentTime = 0;
        }
        const musicInfoOverlay = document.getElementById('practice-music-info-overlay');
        if (musicInfoOverlay) musicInfoOverlay.style.display = 'none';

        // 모달 닫기
        closeScreenOverlay('practice-mode-game', true);
        closeScreenOverlay('practice-mode-modal', true);

        // 타이틀 화면 복귀
        const startScreen = document.getElementById('title-screen');
        if (startScreen) {
            startScreen.style.display = 'flex';
            startScreen.style.zIndex = '';
            setTimeout(() => {
                if (typeof syncTitleButtonOverlay === 'function') {
                    syncTitleButtonOverlay();
                }
            }, 100);
        }
        history.pushState(null, '', window.location.href);
    },
};
