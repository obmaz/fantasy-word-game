/**
 * 설정 관리자
 * - 설정 모달 제어
 * - 오디오/TTS 설정 관리
 * - 게임 설정 초기화 및 검증
 */

const settingsManager = {
    init: () => {
        // 1. 설정 데이터 검증 및 초기화
        // 참고: 음악 트랙 잠금(unlockedMusicTracks / musicUnlockThresholds)은 제거되었습니다.
        // 해금 조건이 구현된 적이 없어 항상 전 트랙이 열린 상태였고,
        // database.js의 settings 로더가 두 필드(musicPlay/wordRead)만 복원하므로
        // 저장되지도 않는 죽은 상태였습니다. 모든 트랙은 항상 재생 가능합니다.
        if (!db.settings) {
            db.settings = { musicPlay: true, wordRead: true };
        }

        // 2. UI 이벤트 리스너 설정
        const musicCheck = document.getElementById('setting-music-play');
        const wordCheck = document.getElementById('setting-word-read');

        if (musicCheck) {
            musicCheck.checked = db.settings.musicPlay !== false;
            musicCheck.addEventListener('change', () => {
                db.settings.musicPlay = musicCheck.checked;
                db.save('settings');
                // 오디오 매니저가 있다면 상태 업데이트가 필요할 수 있음
                // (현재 playMusic 함수는 호출 시 db.settings를 확인하므로 즉시 반영됨)
                if (!db.settings.musicPlay) {
                    const bgMusic = document.getElementById('background-music');
                    if (bgMusic) bgMusic.pause();
                } else {
                    // 켜면 현재 모드 음악 재생 시도? (일단 보류, 사용자가 직접 켜는 흐름)
                }
            });
        }

        if (wordCheck) {
            wordCheck.checked = db.settings.wordRead !== false;
            wordCheck.addEventListener('change', () => {
                db.settings.wordRead = wordCheck.checked;
                db.save('settings');
            });
        }
    },

    open: () => {
        // title-screen은 숨기지 않고 모달만 표시 (openScreenOverlay 사용)
        if (typeof openScreenOverlay === 'function') {
            openScreenOverlay('setting-modal', true);
        } else {
            const modal = document.getElementById('setting-modal');
            if (modal) modal.style.display = 'block';
        }

        // 비밀번호/골드조정 등 하위 모달 상태 초기화 logic이 필요하다면 admin-tools가 처리해야 할 수도 있음
        // 하지만 여기서는 기본 "설정 화면"을 보여주는 것이 목표

        // admin-tools의 로직을 빌려오거나, admin-tools가 UI 상태를 관리하게 둠.
        // 기존 코드: secret.open() -> open 'setting-modal', hide 'password-modal', show 'gold-adjuster-modal'

        // 여기서 직접 초기 상태를 잡아준다.
        const passwordModal = document.getElementById('password-modal');
        const goldAdjusterModal = document.getElementById('gold-adjuster-modal');
        const goldEditModal = document.getElementById('gold-edit-modal');
        const printModal = document.getElementById('print-day-select-modal');

        if (passwordModal) passwordModal.style.display = 'none';
        if (goldEditModal) goldEditModal.style.display = 'none';
        if (printModal) printModal.style.display = 'none';
        // 기본적으로 설정 메뉴(gold-adjuster-modal ID를 가진 녀석이 사실상 메인 설정 바디임)를 보여줌
        if (goldAdjusterModal) goldAdjusterModal.style.display = 'block';

        // 타이틀 컨테이너 크기 동기화 (layout-manager 기능 활용 가능하지만, 수동 로직이 있었음)
        // layout-manager의 syncModalButtonOverlay가 이를 처리해야 함.
        if (typeof syncModalButtonOverlay === 'function') {
            syncModalButtonOverlay('setting-modal');
        }

        // 체크박스 상태 동기화
        if (db.settings) {
            const musicCheck = document.getElementById('setting-music-play');
            const wordCheck = document.getElementById('setting-word-read');
            if (musicCheck) musicCheck.checked = db.settings.musicPlay !== false;
            if (wordCheck) wordCheck.checked = db.settings.wordRead !== false;
        }

        // 히스토리 관리
        history.pushState({ screen: 'setting' }, '', window.location.href);
    },

    close: () => {
        // admin-tools의 close 로직과 유사하게
        if (typeof closeScreenOverlay === 'function') {
            closeScreenOverlay('setting-modal', true);
        } else {
            const modal = document.getElementById('setting-modal');
            if (modal) modal.style.display = 'none';
        }
        history.pushState(null, '', window.location.href);
    },
};

// 전역 노출
window.settingsManager = settingsManager;
