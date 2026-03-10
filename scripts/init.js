// 메인 애플리케이션 진입점

/**
 * 윈도우 로드 이벤트 핸들러
 * 게임 환경, 이벤트 리스너 및 UI 컴포넌트를 초기화합니다.
 */
window.onload = () => {
    // 모든 데이터 로드 후 dayCatalog 커버리지 검증
    if (typeof dayCatalog !== 'undefined' && typeof dayCatalog.validateCoverage === 'function') {
        dayCatalog.validateCoverage();
    }

    // 핵심 시스템 초기화
    if (typeof secret !== 'undefined') secret.init();
    if (typeof settingsManager !== 'undefined') settingsManager.init();
    setupMusicSelectListeners();
    if (typeof inventory !== 'undefined') inventory.render();
    initSelections();

    // ... (rest of code)

    // 버튼 오버레이를 이미지 크기에 동기화 (초기 동기화)
    const titleImg = document.querySelector('.title-background');
    if (titleImg) {
        if (titleImg.complete) {
            syncTitleButtonOverlay();
        } else {
            titleImg.addEventListener(
                'load',
                () => {
                    syncTitleButtonOverlay();
                },
                { once: true }
            );
        }
    }

    // 랜덤 타이틀 헤더 로드 (CSS 변수가 먼저 설정되어야 함)
    setTimeout(() => {
        loadRandomTitleHeader();
    }, 100);

    // 창 크기 조절 시 동기화
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            syncTitleButtonOverlay();
        }, 100);
    });

    // --- 이벤트 리스너 ---

    // 배틀 시작 버튼 (타이틀 화면)
    try {
        const startBattleBtn = document.getElementById('start-battle-btn');
        if (startBattleBtn) {
            startBattleBtn.addEventListener('click', () => {
                const selectedDay = document.getElementById('day-select').value;
                console.log('[start-battle] selectedDay=', selectedDay);
                story.startIntro('battle', selectedDay);
            });
        }
    } catch (e) {
        console.error('Error setting up start-battle-btn:', e);
    }

    // 보스 모드 버튼 (타이틀 화면 - 별도 존재하는 경우)
    try {
        const bossModeBtn = document.getElementById('boss-mode-btn');
        if (bossModeBtn) {
            bossModeBtn.addEventListener('click', () => story.startBossDirectly());
        }
    } catch (e) {
        console.error('Error setting up boss-mode-btn:', e);
    }

    // 타이틀 화면 메뉴 버튼
    const titlePracticeBtn = document.getElementById('title-practice-btn');
    const titleBattleModeBtn = document.getElementById('title-battle-mode-btn');
    const titleBossModeBtn = document.getElementById('title-boss-mode-btn');
    const titleShopBtn = document.getElementById('title-shop-btn');
    const titleInventoryBtn = document.getElementById('title-inventory-btn');
    const titleStatisticsBtn = document.getElementById('title-statistics-btn');
    const titleSettingBtn = document.getElementById('title-setting-btn');

    // 연습 버튼
    if (titlePracticeBtn) {
        try {
            titlePracticeBtn.onclick = null;
            const newBtn = titlePracticeBtn.cloneNode(true);
            titlePracticeBtn.parentNode.replaceChild(newBtn, titlePracticeBtn);
            const freshPracticeBtn = document.getElementById('title-practice-btn');

            if (freshPracticeBtn) {
                freshPracticeBtn.style.pointerEvents = 'auto';
                freshPracticeBtn.style.zIndex = '25';
                freshPracticeBtn.style.cursor = 'pointer';
                const btnImage = freshPracticeBtn.querySelector('.btn-image');
                if (btnImage) btnImage.style.pointerEvents = 'none';

                freshPracticeBtn.addEventListener(
                    'click',
                    (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (typeof openPracticeModal === 'function') {
                            openPracticeModal();
                        } else {
                            console.error('openPracticeModal function not found');
                        }
                    },
                    { capture: true }
                );
            }
        } catch (e) {
            console.error('Error setting up practice button:', e);
        }
    } else {
        console.warn('title-practice-btn not found');
    }

    // 배틀 모드 버튼
    if (titleBattleModeBtn) {
        try {
            titleBattleModeBtn.style.pointerEvents = 'auto';
            titleBattleModeBtn.style.zIndex = '25';
            titleBattleModeBtn.style.cursor = 'pointer';
            const btnImage = titleBattleModeBtn.querySelector('.btn-image');
            if (btnImage) btnImage.style.pointerEvents = 'none';

            titleBattleModeBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof openBattleModeModal === 'function') {
                    openBattleModeModal();
                } else {
                    console.error('openBattleModeModal function not found');
                }
            };
            titleBattleModeBtn.ontouchstart = (e) => e.stopPropagation();
        } catch (e) {
            console.error('Error setting up battle mode button:', e);
        }
    } else {
        console.warn('title-battle-mode-btn not found');
    }

    // 보스 모드 버튼
    if (titleBossModeBtn) {
        try {
            titleBossModeBtn.style.pointerEvents = 'auto';
            titleBossModeBtn.style.zIndex = '25';
            titleBossModeBtn.style.cursor = 'pointer';
            const btnImage = titleBossModeBtn.querySelector('.btn-image');
            if (btnImage) btnImage.style.pointerEvents = 'none';

            titleBossModeBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof story !== 'undefined' && typeof story.startBossDirectly === 'function') {
                    story.startBossDirectly();
                } else {
                    console.error('story.startBossDirectly function not found');
                }
            };
            titleBossModeBtn.ontouchstart = (e) => e.stopPropagation();
        } catch (e) {
            console.error('Error setting up boss mode button:', e);
        }
    } else {
        console.warn('title-boss-mode-btn not found');
    }

    // 상점 버튼
    if (titleShopBtn) {
        titleShopBtn.onclick = null;
        titleShopBtn.addEventListener(
            'click',
            (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof shop !== 'undefined' && typeof shop.open === 'function') {
                    shop.open();
                }
            },
            { capture: true }
        );
    }

    // 인벤토리 버튼
    if (titleInventoryBtn) {
        titleInventoryBtn.onclick = null;
        titleInventoryBtn.addEventListener(
            'click',
            (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof inventory !== 'undefined' && typeof inventory.open === 'function') {
                    inventory.open();
                }
            },
            { capture: true }
        );
    }

    // 통계 버튼
    if (titleStatisticsBtn) {
        titleStatisticsBtn.onclick = null;
        titleStatisticsBtn.addEventListener(
            'click',
            (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof statistics !== 'undefined' && typeof statistics.open === 'function') {
                    statistics.open();
                }
            },
            { capture: true }
        );
    }

    // 설정 버튼
    if (titleSettingBtn) {
        titleSettingBtn.onclick = null;
        titleSettingBtn.addEventListener(
            'click',
            (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (
                    typeof settingsManager !== 'undefined' &&
                    typeof settingsManager.open === 'function'
                ) {
                    settingsManager.open();
                } else if (typeof secret !== 'undefined' && typeof secret.open === 'function') {
                    secret.open();
                }
            },
            { capture: true }
        );
    }

    // 연습 모드 모달 버튼
    const practiceStartBtn = document.getElementById('practice-mode-modal-start-btn');
    const practiceCancelBtn = document.getElementById('practice-mode-modal-cancel-btn');
    const practiceDaySelect = document.getElementById('practice-mode-modal-day-select');
    const practiceCountSelect = document.getElementById('practice-mode-modal-count-select');

    if (practiceStartBtn) {
        practiceStartBtn.addEventListener('click', () => {
            const selectedDay = practiceDaySelect ? practiceDaySelect.value : 'all';
            const countValue = practiceCountSelect ? practiceCountSelect.value : '10';
            const selectedCount = countValue === 'all' ? 'all' : parseInt(countValue) || 10;

            db.lastSelectedDay = selectedDay;
            localStorage.setItem('v7_last_count', selectedCount);
            db.save();

            const daySelect = document.getElementById('day-select');
            const countSelect = document.getElementById('count-select');
            if (daySelect) daySelect.value = selectedDay;
            if (countSelect) countSelect.value = String(selectedCount);

            const startScreen = document.getElementById('title-screen');
            if (startScreen) startScreen.style.display = 'none';

            closePracticeModal(true);

            setTimeout(() => {
                practiceMemorization.start(selectedDay);
            }, 400);
        });
    }

    if (practiceCancelBtn) {
        practiceCancelBtn.addEventListener('click', () => {
            closePracticeModal();
        });
    }

    // 연습 모드 인터페이스 버튼
    const practicePrevBtn = document.getElementById('practice-prev-btn');
    const practiceNextBtn = document.getElementById('practice-next-btn');
    const practiceExitBtn = document.getElementById('practice-exit-btn');
    const practiceMemorizedBtn = document.getElementById('practice-memorized-btn');
    const practiceSpeakBtn = document.getElementById('practice-speak-btn');
    const practiceFilterChips = document.getElementById('practice-filter-chips');
    const practiceExplanationSection = document.getElementById('practice-explanation-section');

    if (practicePrevBtn)
        practicePrevBtn.addEventListener('click', () => practiceMemorization.prev()); // Converted to .prev() from .prevWord()
    if (practiceNextBtn)
        practiceNextBtn.addEventListener('click', () => practiceMemorization.next()); // Converted to .next() from .nextWord()
    if (practiceExitBtn)
        practiceExitBtn.addEventListener('click', () => practiceMemorization.exit());

    // 참고: 기존 코드를 practice-mode.js의 메서드(`playTTS`, `toggleExplanationLang`) 호출로 변경함
    // 기존 호출과 일치하도록 업데이트됨.

    if (practiceSpeakBtn)
        practiceSpeakBtn.addEventListener('click', () => practiceMemorization.playTTS());

    if (practiceMemorizedBtn) {
        practiceMemorizedBtn.addEventListener('click', () => {
            practiceMemorization.toggleMemorized();
        });
    }

    if (practiceFilterChips) {
        practiceFilterChips.addEventListener('click', (e) => {
            const chip = e.target.closest('.practice-chip');
            if (!chip || practiceMemorization.fullPool.length === 0) return;
            const filter = chip.getAttribute('data-filter');
            if (filter) practiceMemorization.applyFilter(filter);
        });
    }

    if (practiceExplanationSection) {
        practiceExplanationSection.addEventListener('click', () => {
            practiceMemorization.toggleExplanationLang();
        });
    }

    // 배틀 모드 나가기 버튼
    const battleExitBtn = document.getElementById('battle-exit-btn');
    if (battleExitBtn) {
        battleExitBtn.addEventListener('click', () => {
            game.exit();
        });
    }

    // 배틀 모달 버튼
    const battleStartBtn = document.getElementById('battle-mode-modal-start-btn');
    const battleCancelBtn = document.getElementById('battle-mode-modal-cancel-btn');
    const battleDaySelect = document.getElementById('battle-mode-modal-day-select');
    const battleCountSelect = document.getElementById('battle-mode-modal-count-select');

    if (battleStartBtn) {
        battleStartBtn.addEventListener('click', () => {
            const selectedDay = battleDaySelect ? battleDaySelect.value : 'all';
            const countValue = battleCountSelect ? battleCountSelect.value : '10';
            const selectedCount = countValue === 'all' ? 'all' : parseInt(countValue) || 10;

            let selectedQuestionType = 'mixed';
            const questionTypeGroup = document.getElementById(
                'battle-mode-modal-question-type-group'
            );
            if (questionTypeGroup) {
                const checkedRadio = questionTypeGroup.querySelector(
                    'input[name="battle-question-type"]:checked'
                );
                if (checkedRadio) selectedQuestionType = checkedRadio.value;
            }
            localStorage.setItem('v7_last_question_type', selectedQuestionType);
            db.lastSelectedDay = selectedDay;
            localStorage.setItem('v7_last_count', selectedCount);
            db.save();

            game.battleQuestionType = selectedQuestionType;

            const daySelect = document.getElementById('day-select');
            const countSelect = document.getElementById('count-select');
            if (daySelect) daySelect.value = selectedDay;
            if (countSelect) countSelect.value = String(selectedCount);

            const startScreen = document.getElementById('title-screen');
            if (startScreen) startScreen.style.display = 'none';

            closePracticeModal(true); // Helper acts for both practice and battle modals

            setTimeout(() => {
                story.startIntro('battle', selectedDay);
            }, 400);
        });
    }

    if (battleCancelBtn) {
        battleCancelBtn.addEventListener('click', () => {
            closePracticeModal();
        });
    }

    // 전역: 결과 화면 닫기 함수
    window.closeResultScreen = function () {
        closeScreenOverlay('result-modal', true);

        // 스토리 화면 초기화
        ['battle-mode-story-modal', 'boss-mode-story-modal'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) {
                el.style.display = 'none';
                el.classList.remove('closing');
                // Reset styles
                el.style.visibility = '';
                el.style.opacity = '';
                el.style.zIndex = '';
                el.style.pointerEvents = '';
            }
        });

        // 모달 화면 초기화
        ['practice-mode-modal', 'battle-mode-modal'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) {
                el.style.display = 'none';
                el.classList.remove('closing');
                el.style.visibility = '';
                el.style.opacity = '';
                el.style.zIndex = '';
                el.style.pointerEvents = '';
            }
        });

        const gameScreen = document.getElementById('battle-mode-game');
        if (gameScreen) gameScreen.style.display = 'none';

        setTimeout(() => {
            openScreenOverlay('title-screen', false);
            loadRandomTitleHeader();
            if (typeof syncTitleButtonOverlay === 'function') {
                syncTitleButtonOverlay();
            }
        }, 400);
        history.pushState(null, '', window.location.href);
    };

    // 모달 이미지 버튼 오버레이 동기화 콜백
    ['practice-mode-modal', 'battle-mode-modal'].forEach((id) => {
        const img = document.getElementById(`${id}-background-img`);
        if (img) {
            if (img.complete) syncModalButtonOverlay(id);
            else img.addEventListener('load', () => syncModalButtonOverlay(id));
        }
    });
};
