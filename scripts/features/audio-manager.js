const currentMusicIndices = { battle: null, practice: null, max: 23 };
const lastValidMusicSelection = { 'music-select': '1', 'practice-music-select': '1' };

/**
 * 특정 배경 음악 트랙을 재생하고 종료 이벤트 리스너를 설정합니다.
 * 내부 헬퍼 함수입니다.
 * @param {number} musicNum 음악 트랙 번호 (1부터 시작)
 * @param {string} mode 'battle' | 'practice'
 * @param {boolean} forcePlay 강제 재생 여부 (기본 false)
 */
function _playMusic(musicNum, mode, forcePlay = false) {
    const bgMusic = document.getElementById('background-music');
    const overlayId = mode === 'practice' ? 'practice-music-info-overlay' : 'music-info-overlay';
    const filenameId = mode === 'practice' ? 'practice-music-filename' : 'music-filename';
    const selectId = mode === 'practice' ? 'practice-music-select' : 'music-select';
    const musicInfoOverlay = document.getElementById(overlayId);
    const musicFilenameEl = document.getElementById(filenameId);
    const musicSelectEl = document.getElementById(selectId);

    // [FIX] 설정이 꺼져있어도 UI는 나와야 하므로 여기서 리턴하지 않음
    if (!bgMusic || !db.settings) {
        return;
    }

    const filename = `background_music_${musicNum}.mp3`;
    bgMusic.src = `data/${filename}`;
    bgMusic.load();

    if (musicSelectEl) {
        musicSelectEl.value = String(musicNum);
    }

    // 노래가 재생되거나 변경될 때마다 음악 선택 옵션 렌더링
    ui.renderMusicSelectOptions(selectId, musicNum);

    if (musicInfoOverlay && musicFilenameEl) {
        musicFilenameEl.innerText = filename;
        musicInfoOverlay.style.display = 'block';
    }

    // [FIX] 설정에 따라 자동 재생 여부 결정
    // forcePlay가 true이면(예: 이전 곡이 끝나서 넘어옴) 무조건 재생
    if (forcePlay || (db.settings && db.settings.musicPlay)) {
        bgMusic.play().catch((err) => {
            console.log('Background music play failed:', err);
            // 재생 실패해도 UI는 유지 (사용자가 수동으로 켤 수 있도록)
        });
        updateMusicToggleButtons(true);
    } else {
        updateMusicToggleButtons(false);
    }
    // else: 설정이 꺼져있으면 정지 상태로 시작 (UI는 표시됨)

    // 다음 음악을 순서대로 재생하도록 onended 이벤트 리스너 설정
    bgMusic.onended = () => {
        playNextMusic(mode);
    };
}

/**
 * 지정된 모드의 배경 음악 재생을 시작합니다 (현재 인덱스부터).
 * 이미 음악이 재생 중이면 계속 재생합니다.
 * @param {string} mode 'battle' | 'practice'
 */
function playMusic(mode) {
    if (!currentMusicIndices[mode]) {
        // 랜덤 선택: 잠금 해제된 트랙 중에서 선택
        if (db.settings.unlockedMusicTracks && db.settings.unlockedMusicTracks.length > 0) {
            const unlocked = db.settings.unlockedMusicTracks;
            currentMusicIndices[mode] = unlocked[Math.floor(Math.random() * unlocked.length)];
        } else {
            // 잠금 해제 정보가 없으면 1~max 중 랜덤
            currentMusicIndices[mode] = Math.floor(Math.random() * currentMusicIndices.max) + 1;
        }
    }

    // 현재 트랙이 잠금 해제되었는지 확인. 그렇지 않으면 첫 번째 잠금 해제된 트랙 찾기.
    if (!db.settings.unlockedMusicTracks.includes(currentMusicIndices[mode])) {
        // 첫 번째 잠금 해제된 트랙을 찾거나, 없으면 1로 대체
        currentMusicIndices[mode] = db.settings.unlockedMusicTracks[0] || 1;
    }

    _playMusic(currentMusicIndices[mode], mode, false);
}

/**
 * 지정된 모드의 다음 배경 음악 트랙을 순서대로 재생합니다.
 * @param {string} mode 'battle' | 'practice'
 */
function playNextMusic(mode) {
    let nextMusicNumCandidate = currentMusicIndices[mode];
    let originalMusicNum = currentMusicIndices[mode];
    let foundNextUnlocked = false;

    // 잠금 해제된 다음 음악 번호를 찾기 위해 모든 가능한 음악 번호 반복
    for (let i = 0; i < currentMusicIndices.max; i++) {
        nextMusicNumCandidate++;
        if (nextMusicNumCandidate > currentMusicIndices.max) {
            nextMusicNumCandidate = 1; // 처음으로 루프 백
        }

        if (db.settings.unlockedMusicTracks.includes(nextMusicNumCandidate)) {
            foundNextUnlocked = true;
            break;
        }

        if (nextMusicNumCandidate === originalMusicNum) {
            break;
        }
    }

    if (foundNextUnlocked) {
        currentMusicIndices[mode] = nextMusicNumCandidate;
    }

    // [FIX] 곡이 끝나서 다음 곡으로 넘어가는 경우이므로 forcePlay=true
    _playMusic(currentMusicIndices[mode], mode, true);
}

// 음악 직접 선택 이벤트 리스너
function setupMusicSelectListeners() {
    const selects = ['music-select', 'practice-music-select'];
    selects.forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
            // Initialize lastValidMusicSelection for this dropdown based on current selected value
            lastValidMusicSelection[id] = el.value;

            el.addEventListener('change', (e) => {
                const musicNum = parseInt(e.target.value, 10);
                const bgMusic = document.getElementById('background-music');

                // Check if the selected music is unlocked
                if (!db.settings.unlockedMusicTracks.includes(musicNum)) {
                    alert('서로다른 Day의 주관식을 다 맞으면 하나씩 풀립니다.');
                    // Revert to the last valid selection
                    e.target.value = lastValidMusicSelection[id];
                    return; // Prevent further action
                }

                // If unlocked, update last valid selection and proceed
                lastValidMusicSelection[id] = String(musicNum);

                const filename = `background_music_${musicNum}.mp3`;

                if (bgMusic) {
                    bgMusic.src = `data/${filename}`;
                    bgMusic.load();

                    // 텍스트 업데이트
                    const filenameId =
                        id === 'practice-music-select'
                            ? 'practice-music-filename'
                            : 'music-filename';
                    const musicFilenameEl = document.getElementById(filenameId);
                    if (musicFilenameEl) {
                        musicFilenameEl.innerText = filename;
                    }
                    // 플레이 (자동 재생 방지 예외 처리)
                    // [FIX] 여기서도 db.settings.musicPlay를 쓰거나, 아니면 사용자가 직접 바꿨으니 무조건 재생?
                    // 보통 직접 곡을 바꾸면 재생을 의도한 것이므로 재생 시도 + 버튼 상태 업데이트
                    bgMusic.play().catch((err) => console.log('Music play failed:', err));
                    updateMusicToggleButtons(true);

                    // 모드 감지 (ID에 따라)
                    const mode = id === 'practice-music-select' ? 'practice' : 'battle';
                    currentMusicIndices[mode] = musicNum;

                    // 음악 정보 오버레이 보이기
                    const overlayId =
                        mode === 'practice' ? 'practice-music-info-overlay' : 'music-info-overlay';
                    const musicInfoOverlay = document.getElementById(overlayId);
                    if (musicInfoOverlay) musicInfoOverlay.style.display = 'block';

                    bgMusic.onended = () => {
                        playNextMusic(mode);
                    };
                }
            });
        }
    });

    // 음악 일시정지/재생 버튼 리스너
    const toggleBtns = ['battle-music-toggle-btn', 'practice-music-toggle-btn'];
    toggleBtns.forEach((id) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', () => {
                toggleMusic();
            });
        }
    });
}
/**
 * 배경 음악 일시정지/재생 토글
 */
function toggleMusic() {
    const bgMusic = document.getElementById('background-music');
    if (!bgMusic) return;

    // [FIX] 설정값(db.settings.musicPlay)을 덮어쓰지 않고,
    // 현재 세션의 재생 상태만 토글함.
    if (bgMusic.paused) {
        bgMusic.play().catch((err) => console.log('Music resume failed:', err));
        updateMusicToggleButtons(true);
    } else {
        bgMusic.pause();
        updateMusicToggleButtons(false);
    }
    // db.save(); // 제거: 영구 저장 안 함
}

/**
 * 음악 토글 버튼 상태 업데이트 (UI)
 * @param {boolean} isPlaying
 */
function updateMusicToggleButtons(isPlaying) {
    const toggleBtns = document.querySelectorAll('.music-toggle-btn');
    toggleBtns.forEach((btn) => {
        btn.innerText = isPlaying ? '⏸️' : '▶️';
    });
}
