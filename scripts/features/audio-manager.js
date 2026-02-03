const currentMusicIndices = { battle: null, practice: null, max: 18 };
const lastValidMusicSelection = { 'music-select': '1', 'practice-music-select': '1' };

/**
 * 특정 배경 음악 트랙을 재생하고 종료 이벤트 리스너를 설정합니다.
 * 내부 헬퍼 함수입니다.
 * @param {number} musicNum 음악 트랙 번호 (1부터 시작)
 * @param {string} mode 'battle' | 'practice'
 */
function _playMusic(musicNum, mode) {
    const bgMusic = document.getElementById('background-music');
    const overlayId = mode === 'practice' ? 'practice-music-info-overlay' : 'music-info-overlay';
    const filenameId = mode === 'practice' ? 'practice-music-filename' : 'music-filename';
    const selectId = mode === 'practice' ? 'practice-music-select' : 'music-select';
    const musicInfoOverlay = document.getElementById(overlayId);
    const musicFilenameEl = document.getElementById(filenameId);
    const musicSelectEl = document.getElementById(selectId);

    if (!bgMusic || !db.settings || !db.settings.musicPlay) {
        if (musicInfoOverlay) musicInfoOverlay.style.display = 'none';
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

    bgMusic.play().catch((err) => {
        console.log('Background music play failed:', err);
        // 자동 재생 실패 시, 음악이 재생되지 않으므로 오버레이 숨김
        if (musicInfoOverlay) musicInfoOverlay.style.display = 'none';
    });

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

    _playMusic(currentMusicIndices[mode], mode);
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

    _playMusic(currentMusicIndices[mode], mode);
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
                    if (db.settings && db.settings.musicPlay) {
                        bgMusic.play().catch((err) => console.log('Music play failed:', err));
                        updateMusicToggleButtons(true);
                    } else {
                        updateMusicToggleButtons(false);
                    }

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

    if (bgMusic.paused) {
        bgMusic.play().catch((err) => console.log('Music resume failed:', err));
        db.settings.musicPlay = true; // 설정 동기화
        updateMusicToggleButtons(true);
    } else {
        bgMusic.pause();
        db.settings.musicPlay = false; // 일시정지 시 설정도 off로 간주 (또는 별도 상태 관리)
        // 여기서는 사용자가 껐으므로 musicPlay를 false로 하여 다른 로직(자동 재생 등)에서도 묵음 처리되도록 함이 자연스러움
        updateMusicToggleButtons(false);
    }
    db.save(); // 설정 저장
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
