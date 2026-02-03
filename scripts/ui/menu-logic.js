// 연습 모드 선택 모달 열기
function openPracticeModal() {
    const modal = document.getElementById('practice-mode-modal');
    const modalDaySelect = document.getElementById('practice-mode-modal-day-select');
    const modalCountSelect = document.getElementById('practice-mode-modal-count-select');
    const modalImg = document.getElementById('practice-mode-modal-background-img');

    if (!modal) return;

    // 연습 모드 용 날짜 선택 활성화
    if (modalDaySelect) {
        modalDaySelect.disabled = false;
        modalDaySelect.style.display = ''; // 연습 모드 용 날짜 선택 표시
    }

    // Practice 모드는 암기 모드이므로 난이도 선택 숨기기
    if (modalCountSelect) {
        modalCountSelect.style.display = 'none';
    }

    // 마지막으로 선택된 값 복원
    const lastDay = db.lastSelectedDay || 'all';
    if (
        modalDaySelect &&
        Array.from(modalDaySelect.options).some((o) => o.value === String(lastDay))
    ) {
        modalDaySelect.value = lastDay;
    }

    modal.style.display = 'flex';

    // 히스토리 상태 추가 (백버튼 처리용)
    history.pushState({ screen: 'practice-mode-modal' }, '', window.location.href);

    // 타이틀 크기 먼저 동기화 (모달 크기가 타이틀 기준이므로)
    if (typeof syncTitleButtonOverlay === 'function') {
        syncTitleButtonOverlay();
    }

    // 이미지 로드 후 버튼 오버레이 동기화
    if (modalImg) {
        if (modalImg.complete) {
            setTimeout(() => {
                syncModalButtonOverlay('practice-mode-modal');
            }, 100);
        } else {
            modalImg.addEventListener(
                'load',
                () => {
                    setTimeout(() => {
                        syncModalButtonOverlay('practice-mode-modal');
                    }, 100);
                },
                { once: true }
            );
        }
    }
}

// 배틀 모드 선택 모달 열기
function openBattleModeModal() {
    const modal = document.getElementById('battle-mode-modal');
    const modalDaySelect = document.getElementById('battle-mode-modal-day-select');
    const modalCountSelect = document.getElementById('battle-mode-modal-count-select');
    const modalImg = document.getElementById('battle-mode-modal-background-img');
    const questionTypeGroup = document.getElementById('battle-mode-modal-question-type-group');

    if (!modal) return;

    // 배틀 모드를 위한 날짜 선택 허용
    if (modalDaySelect) {
        // 기본값을 'all'로 설정하되 사용자가 변경 가능
        const lastDay = db.lastSelectedDay || 'all';
        if (Array.from(modalDaySelect.options).some((o) => o.value === String(lastDay))) {
            modalDaySelect.value = lastDay;
        } else {
            modalDaySelect.value = 'all';
        }
        modalDaySelect.style.display = ''; // 날짜 선택 표시
        modalDaySelect.disabled = false; // 배틀 모드를 위한 날짜 선택 활성화
    }

    const lastCount = parseInt(localStorage.getItem('v7_last_count')) || 10;
    if (modalCountSelect) {
        modalCountSelect.value = String(lastCount);
    }

    // 배틀 모드를 위한 질문 유형 라디오 버튼 표시
    if (questionTypeGroup) {
        questionTypeGroup.style.display = 'flex';
        // 마지막으로 선택된 질문 유형 로드 또는 'mixed'를 기본값으로 설정
        const lastQuestionType = localStorage.getItem('v7_last_question_type') || 'mixed';
        const radio = questionTypeGroup.querySelector(`input[value="${lastQuestionType}"]`);
        if (radio) {
            radio.checked = true;
        } else {
            // 저장된 값이 유효하지 않은 경우 'mixed'를 기본값으로 사용
            const mixedRadio = questionTypeGroup.querySelector('input[value="mixed"]');
            if (mixedRadio) mixedRadio.checked = true;
        }

        // 모든 라디오 레이블의 checked 클래스 업데이트
        const allRadios = questionTypeGroup.querySelectorAll('input[name="battle-question-type"]');
        const allLabels = questionTypeGroup.querySelectorAll('.modal-radio-label');
        allLabels.forEach((label) => label.classList.remove('checked'));
        allRadios.forEach((radio) => {
            if (radio.checked) {
                radio.closest('.modal-radio-label')?.classList.add('checked');
            }
        });

        // 라디오 버튼 변경 이벤트 리스너 추가
        allRadios.forEach((radio) => {
            radio.addEventListener('change', () => {
                allLabels.forEach((label) => label.classList.remove('checked'));
                const checkedRadio = questionTypeGroup.querySelector(
                    'input[name="battle-question-type"]:checked'
                );
                if (checkedRadio) {
                    checkedRadio.closest('.modal-radio-label')?.classList.add('checked');
                }
            });
        });
    }

    // title-screen의 z-index와 display 조정하여 backdrop-filter가 작동하도록 함
    const startScreen = document.getElementById('title-screen');
    if (startScreen) {
        startScreen.style.zIndex = '100'; // 모달(z-index: 200) 뒤에 위치
        startScreen.style.display = 'flex'; // 표시되어 있어야 backdrop-filter가 작동
    }

    modal.style.display = 'flex';

    // 히스토리 상태 추가 (백버튼 처리용)
    history.pushState({ screen: 'battle-mode-modal' }, '', window.location.href);

    // 타이틀 크기 먼저 동기화 (모달 크기가 타이틀 기준이므로)
    if (typeof syncTitleButtonOverlay === 'function') {
        syncTitleButtonOverlay();
    }

    // 이미지 로드 후 버튼 오버레이 동기화
    if (modalImg) {
        if (modalImg.complete) {
            setTimeout(() => {
                syncModalButtonOverlay('battle-mode-modal');
            }, 100);
        } else {
            modalImg.addEventListener(
                'load',
                () => {
                    setTimeout(() => {
                        syncModalButtonOverlay('battle-mode-modal');
                    }, 100);
                },
                { once: true }
            );
        }
    }
}
