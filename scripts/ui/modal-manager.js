/**
 * 모달 및 오버레이 관리자
 * 프로젝트 전반의 모달 창 열기/닫기 및 스타일 동기화 관리
 *
 * IIFE로 캡슐화: 다른 모듈/HTML이 참조하는 함수만 window에 노출합니다.
 */
(function () {
    /**
     * 화면 오버레이를 엽니다
     * @param {string} elementId - 대상 요소 ID
     * @param {boolean} animated - 애니메이션 여부
     */
    function openScreenOverlay(elementId, animated = true) {
        const element = document.getElementById(elementId);
        if (element) {
            if (animated && element.classList.contains('screen-overlay')) {
                // 먼저 표시하고 애니메이션 시작
                element.style.display = 'flex';
                element.classList.remove('closing');
                // 다음 프레임에서 애니메이션 시작
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        element.classList.remove('closing');
                    });
                });
            } else {
                element.style.display = 'flex';
                if (element.classList.contains('screen-overlay')) {
                    element.classList.remove('closing');
                }
            }
        }
    }

    /**
     * 화면 오버레이를 닫습니다
     * 주의: 'battle-mode-game'을 닫을 때 전역 'game' 객체를 참조하여 타이머를 정지시킵니다.
     * @param {string} elementId - 대상 요소 ID
     * @param {boolean} animated - 애니메이션 여부
     */
    function closeScreenOverlay(elementId, animated = true) {
        const element = document.getElementById(elementId);
        if (element) {
            // 게임 화면을 닫을 때 타이머 정지
            // 전역 game 객체 의존성
            if (elementId === 'battle-mode-game' && typeof game !== 'undefined' && game.timer) {
                clearInterval(game.timer);
                game.timer = null;
                game.isProcessing = true; // 게임 진행 중지
            }

            if (animated && element.classList.contains('screen-overlay')) {
                // closing 클래스가 이미 있으면 제거 (재시도 방지)
                if (element.classList.contains('closing')) {
                    element.classList.remove('closing');
                }
                // 강제 리플로우로 초기 상태 확보
                void element.offsetWidth;
                // 애니메이션 효과 추가
                element.classList.add('closing');
                // 애니메이션 완료 후 실제로 숨김
                setTimeout(() => {
                    element.style.display = 'none';
                    element.classList.remove('closing');
                }, 400); // CSS transition 시간과 일치
            } else {
                element.style.display = 'none';
                if (element.classList.contains('screen-overlay')) {
                    element.classList.remove('closing');
                }
            }
        }
    }

    /**
     * 게임 진입 흐름에서 쓰이는 오버레이들 (스토리 모달 + 모드 선택 모달).
     * 게임 종료/결과 화면 전환 시 한꺼번에 정리해야 하는 대상입니다.
     */
    const GAME_ENTRY_OVERLAYS = [
        'battle-mode-story-modal',
        'boss-mode-story-modal',
        'practice-mode-modal',
        'battle-mode-modal',
    ];

    /**
     * 오버레이를 애니메이션 없이 즉시 숨기고, 열고 닫는 동안 쌓인 인라인 스타일을 정리합니다.
     *
     * `showEnding` / `game.end` / `closeResultScreen`이 각각 같은 5개 프로퍼티를
     * 모달마다 반복 설정하던 것을 한곳으로 모은 함수입니다.
     *
     * @param {string} elementId - 대상 요소 ID
     * @param {{behind?: boolean}} [options] - behind=true면 뒤쪽 레이어로 밀고 클릭을 막습니다
     *   (결과 모달이 위로 올라오는 동안 잔상이 보이지 않도록).
     *   false/생략이면 인라인 스타일을 지워 CSS 기본값으로 되돌립니다.
     */
    function resetScreenOverlay(elementId, options = {}) {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.classList.remove('closing');
        element.style.display = 'none';

        if (options.behind) {
            element.style.visibility = 'hidden';
            element.style.opacity = '0';
            element.style.zIndex = '100';
            element.style.pointerEvents = 'none';
        } else {
            element.style.visibility = '';
            element.style.opacity = '';
            element.style.zIndex = '';
            element.style.pointerEvents = '';
        }
    }

    /**
     * 여러 오버레이를 한 번에 정리합니다.
     * @param {string[]} [elementIds=GAME_ENTRY_OVERLAYS]
     * @param {{behind?: boolean}} [options]
     */
    function resetScreenOverlays(elementIds = GAME_ENTRY_OVERLAYS, options = {}) {
        elementIds.forEach((id) => resetScreenOverlay(id, options));
    }

    /**
     * 연습/배틀 모드 선택 모달을 닫습니다
     * @param {boolean} animated - 애니메이션 여부
     */
    function closePracticeModal(animated = true) {
        closeScreenOverlay('practice-mode-modal', animated);
        closeScreenOverlay('battle-mode-modal', animated);
        // 히스토리 상태 업데이트
        if (typeof history !== 'undefined') {
            history.pushState(null, '', window.location.href);
        }
    }

    /**
     * Modal 이미지 크기에 맞춰 CSS 변수 설정
     * @param {string} modalId - 모달 ID
     */
    function syncModalButtonOverlay(modalId) {
        if (!modalId) return;

        const modal = document.getElementById(modalId);
        if (!modal || modal.style.display === 'none' || modal.style.display === '') {
            return;
        }

        const modalImg = modal.querySelector('.modal-background');
        const overlay = modal.querySelector('.modal-buttons-overlay');
        const container = modal.querySelector('.modal-container-wrapper');

        if (!modalImg || !overlay || !container) return;

        const titleImg = document.querySelector('.title-background');
        const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        const vh = getLockedAppHeight();

        const mobileBaseWidth = 375;
        const mobileBaseHeight = 667;

        let titleWidth = mobileBaseWidth * 0.95;
        let titleHeight = mobileBaseHeight * 0.95;

        if (
            titleImg &&
            titleImg.complete &&
            titleImg.naturalWidth > 0 &&
            titleImg.naturalHeight > 0
        ) {
            const naturalW = titleImg.naturalWidth;
            const naturalH = titleImg.naturalHeight;
            const mobileScale = Math.min(mobileBaseWidth / naturalW, mobileBaseHeight / naturalH);
            titleWidth = naturalW * mobileScale * 0.95;
            titleHeight = naturalH * mobileScale * 0.95;
        }

        let modalAspectRatio = null;
        if (modalImg.complete && modalImg.naturalWidth > 0 && modalImg.naturalHeight > 0) {
            modalAspectRatio = modalImg.naturalWidth / modalImg.naturalHeight;
            modalImg.style.setProperty('--modal-aspect-ratio', modalAspectRatio);
        }

        if (modalId === 'battle-mode-modal' && modalAspectRatio) {
            const modalWidth = Math.min(titleWidth, titleHeight * modalAspectRatio);
            document.documentElement.style.setProperty(
                '--battle-mode-modal-width',
                modalWidth + 'px'
            );
        }

        modalImg.style.setProperty('--title-container-width', titleWidth + 'px');
        modalImg.style.setProperty('--title-container-height', titleHeight + 'px');
        document.documentElement.style.setProperty('--title-container-width', titleWidth + 'px');
        document.documentElement.style.setProperty('--title-container-height', titleHeight + 'px');

        if (modalImg.complete) {
            setTimeout(() => {
                const imgRect = modalImg.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                const left = imgRect.left - containerRect.left;
                const top = imgRect.top - containerRect.top;

                overlay.style.setProperty('--modal-img-width', imgRect.width + 'px');
                overlay.style.setProperty('--modal-img-height', imgRect.height + 'px');
                overlay.style.setProperty('--modal-img-left', left + 'px');
                overlay.style.setProperty('--modal-img-top', top + 'px');
            }, 0);
        }
    }

    /**
     * Story screen 이미지 크기에 맞춰 CSS 변수 설정
     * @param {string} storyScreenId - 스토리 스크린 ID
     */
    function syncStoryButtonOverlay(storyScreenId) {
        if (!storyScreenId) {
            const battleModeStoryScreen = document.getElementById('battle-mode-story-modal');
            const bossStoryScreen = document.getElementById('boss-mode-story-modal');
            if (
                battleModeStoryScreen &&
                battleModeStoryScreen.style.display !== 'none' &&
                battleModeStoryScreen.style.display !== ''
            ) {
                syncStoryButtonOverlay('battle-mode-story-modal');
            } else if (
                bossStoryScreen &&
                bossStoryScreen.style.display !== 'none' &&
                bossStoryScreen.style.display !== ''
            ) {
                syncStoryButtonOverlay('boss-mode-story-modal');
            }
            return;
        }

        const storyScreen = document.getElementById(storyScreenId);
        if (
            !storyScreen ||
            storyScreen.style.display === 'none' ||
            storyScreen.style.display === ''
        ) {
            return;
        }

        const storyImg = storyScreen.querySelector('.story-background');
        const overlay = storyScreen.querySelector('.story-buttons-overlay');
        const container = storyScreen.querySelector('.story-container-wrapper');

        if (!storyImg || !overlay || !container) return;

        const titleContainer = document.querySelector('.title-container-wrapper');
        const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        const vh = getLockedAppHeight();
        let titleWidth = vw;
        let titleHeight = vh;

        if (titleContainer) {
            const computedStyle = window.getComputedStyle(titleContainer);
            const containerWidth = computedStyle.getPropertyValue('--title-container-width');
            const containerHeight = computedStyle.getPropertyValue('--title-container-height');

            if (containerWidth && containerWidth !== '100vw') {
                titleWidth = parseFloat(containerWidth) || vw;
            }
            if (containerHeight && containerHeight !== '100vh') {
                titleHeight = parseFloat(containerHeight) || vh;
            } else {
                const titleRect = titleContainer.getBoundingClientRect();
                if (titleRect.width > 0) titleWidth = titleRect.width;
                if (titleRect.height > 0) titleHeight = titleRect.height;
            }
        }

        if (storyImg.complete && storyImg.naturalWidth > 0 && storyImg.naturalHeight > 0) {
            const aspectRatio = storyImg.naturalWidth / storyImg.naturalHeight;
            storyImg.style.setProperty('--story-aspect-ratio', aspectRatio);
            container.style.setProperty('--title-container-width', titleWidth + 'px');
            container.style.setProperty('--title-container-height', titleHeight + 'px');
            document.documentElement.style.setProperty(
                '--title-container-width',
                titleWidth + 'px'
            );
            document.documentElement.style.setProperty(
                '--title-container-height',
                titleHeight + 'px'
            );
        }

        if (storyImg.complete) {
            setTimeout(() => {
                const imgRect = storyImg.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                const left = imgRect.left - containerRect.left;
                const top = imgRect.top - containerRect.top;

                overlay.style.setProperty('--story-img-width', imgRect.width + 'px');
                overlay.style.setProperty('--story-img-height', imgRect.height + 'px');
                overlay.style.setProperty('--story-img-left', left + 'px');
                overlay.style.setProperty('--story-img-top', top + 'px');

                const storyStartBtn = document.getElementById('story-start-btn');
                if (storyStartBtn) {
                    storyStartBtn.style.setProperty('--story-img-width', imgRect.width + 'px');
                    storyStartBtn.style.setProperty('--story-img-height', imgRect.height + 'px');
                }

                if (container) {
                    container.style.setProperty('--story-img-width', imgRect.width + 'px');
                    container.style.setProperty('--story-img-height', imgRect.height + 'px');
                    container.style.setProperty('--story-img-left', left + 'px');
                    container.style.setProperty('--story-img-top', top + 'px');
                }
            }, 0);
        }
    }

    // 공개 API 노출
    window.GAME_ENTRY_OVERLAYS = GAME_ENTRY_OVERLAYS;
    window.openScreenOverlay = openScreenOverlay;
    window.closeScreenOverlay = closeScreenOverlay;
    window.resetScreenOverlay = resetScreenOverlay;
    window.resetScreenOverlays = resetScreenOverlays;
    window.closePracticeModal = closePracticeModal;
    window.syncModalButtonOverlay = syncModalButtonOverlay;
    window.syncStoryButtonOverlay = syncStoryButtonOverlay;
})();
