/**
 * 관리자 도구 및 비밀 기능
 * 비밀번호 보호된 관리 메뉴, 골드 수정, 통계 초기화, 문제 출력 기능 포함
 */

const secret = {
    password: '770458',
    entered: '',
    adjustGold: 0,
    previousModal: null, // 비밀번호 모달로 오기 전 모달 추적 (gold-adjuster-modal 또는 gold-edit-modal)

    init: () => {
        const h1 = document.querySelector('#title-screen .card h1');
        if (h1 && h1.innerText.includes('킹왕짱 RPG')) {
            h1.innerHTML = h1.innerHTML.replace(
                '킹',
                '<span id="secret-trigger" style="cursor:pointer;">킹</span>'
            );
            document.getElementById('secret-trigger').addEventListener('click', secret.open);
        }

        const passwordBox = document.getElementById('password-input-boxes');
        if (passwordBox) {
            passwordBox.innerHTML = '';
            for (let i = 0; i < secret.password.length; i++) {
                const box = document.createElement('div');
                box.className = 'password-box';
                box.id = `passbox-${i}`;
                passwordBox.appendChild(box);
            }
        }

        // 설정: 음악 재생 / 단어 바로 읽기 체크박스
        if (!db.settings) {
            db.settings = {
                musicPlay: true,
                wordRead: true,
                unlockedMusicTracks: [1, 2, 3], // Initially unlock tracks 1, 2, 3
                musicUnlockThresholds: {
                    // Thresholds based on number of unique perfect subjective days
                    4: 1, // Unlock song 4 after 1 perfect subjective day
                    5: 2,
                    6: 3,
                    7: 4,
                    8: 5,
                    9: 6,
                    10: 7,
                },
            };
        } else {
            // Ensure new properties are added if they don't exist in existing settings
            if (
                !db.settings.unlockedMusicTracks ||
                !Array.isArray(db.settings.unlockedMusicTracks)
            ) {
                db.settings.unlockedMusicTracks = [1, 2, 3];
            }
            if (!db.settings.musicUnlockThresholds) {
                db.settings.musicUnlockThresholds = {
                    4: 10,
                    5: 20,
                    6: 30,
                    7: 40,
                    8: 50,
                    9: 60,
                    10: 70,
                };
            }
        }
        const musicCheck = document.getElementById('setting-music-play');
        const wordCheck = document.getElementById('setting-word-read');
        if (musicCheck) {
            musicCheck.checked = db.settings.musicPlay !== false;
            musicCheck.addEventListener('change', () => {
                db.settings.musicPlay = musicCheck.checked;
                db.save();
            });
        }
        if (wordCheck) {
            wordCheck.checked = db.settings.wordRead !== false;
            wordCheck.addEventListener('change', () => {
                db.settings.wordRead = wordCheck.checked;
                db.save();
            });
        }
    },

    open: () => {
        // title-screen은 숨기지 않고 모달만 표시
        openScreenOverlay('setting-modal', true);
        // 설정 화면을 바로 표시 (비밀번호 없이)
        document.getElementById('password-modal').style.display = 'none';
        document.getElementById('gold-adjuster-modal').style.display = 'block';

        // 타이틀 컨테이너 크기를 CSS 변수로 설정 (다른 모달과 동일하게)
        const secretOverlay = document.getElementById('setting-modal');
        const titleContainer = document.querySelector('.title-container-wrapper');
        if (secretOverlay && titleContainer) {
            const computedStyle = window.getComputedStyle(titleContainer);
            const titleWidth = computedStyle.getPropertyValue('--title-container-width');
            const titleHeight = computedStyle.getPropertyValue('--title-container-height');
            const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
            const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

            let containerWidth = parseFloat(titleWidth) || 0.95 * vw;
            let containerHeight = parseFloat(titleHeight) || 0.95 * vh;

            if (!titleWidth || isNaN(containerWidth)) {
                const rect = titleContainer.getBoundingClientRect();
                containerWidth = rect.width || 0.95 * vw;
            }
            if (!titleHeight || isNaN(containerHeight)) {
                const rect = titleContainer.getBoundingClientRect();
                containerHeight = rect.height || 0.95 * vh;
            }

            secretOverlay.style.setProperty('--title-container-width', containerWidth + 'px');
            secretOverlay.style.setProperty('--title-container-height', containerHeight + 'px');
        }

        // 설정 모달 열 때 체크박스 상태를 db와 동기화
        if (db.settings) {
            const musicCheck = document.getElementById('setting-music-play');
            const wordCheck = document.getElementById('setting-word-read');
            if (musicCheck) musicCheck.checked = db.settings.musicPlay !== false;
            if (wordCheck) wordCheck.checked = db.settings.wordRead !== false;
        }

        // 히스토리 상태 추가 (백버튼 처리용)
        history.pushState({ screen: 'setting' }, '', window.location.href);
    },

    close: () => {
        // 비밀번호 모달이 열려있으면 이전 모달로 돌아가기
        const passwordModal = document.getElementById('password-modal');
        if (passwordModal && passwordModal.style.display !== 'none') {
            passwordModal.style.display = 'none';
            // 이전 모달로 돌아가기
            if (secret.previousModal === 'gold-edit-modal') {
                document.getElementById('gold-edit-modal').style.display = 'block';
            } else {
                document.getElementById('gold-adjuster-modal').style.display = 'block';
            }
            secret.entered = '';
            secret.pendingAction = null;
            secret.previousModal = null;
            return;
        }
        closeScreenOverlay('setting-modal', true);
        secret.pendingAction = null;
        secret.previousModal = null;
        // 히스토리 상태 업데이트
        history.pushState(null, '', window.location.href);
    },

    enter: (num) => {
        if (secret.entered.length < secret.password.length) {
            secret.entered += num;
            secret.updatePasswordDisplay();

            if (secret.entered.length === secret.password.length) {
                setTimeout(secret.check, 200);
            }
        }
    },

    del: () => {
        secret.entered = secret.entered.slice(0, -1);
        secret.updatePasswordDisplay();
    },

    updatePasswordDisplay: () => {
        for (let i = 0; i < secret.password.length; i++) {
            const box = document.getElementById(`passbox-${i}`);
            if (i < secret.entered.length) {
                box.textContent = '*';
            } else {
                box.textContent = '';
            }
        }
        document.getElementById('password-error').style.display = 'none';
    },

    check: () => {
        if (secret.entered === secret.password) {
            document.getElementById('password-modal').style.display = 'none';

            // pendingAction이 있으면 실행 (applyGold, resetGold, resetStatistics 등)
            if (secret.pendingAction) {
                secret.pendingAction();
                // pendingAction 실행 후에는 null로 설정하지 않음 (함수 내에서 처리)
            } else {
                // pendingAction이 없으면 골드 조정 화면 표시 (open()에서 설정했을 경우)
                document.getElementById('gold-adjuster-modal').style.display = 'block';
                secret.adjustGold = 0;
                document.getElementById('current-gold-display').innerText = db.gold;
                document.getElementById('adjust-gold-display').innerText = secret.adjustGold;

                document.getElementById('gold-up').onclick = () => secret.updateGold(500);
                document.getElementById('gold-down').onclick = () => secret.updateGold(-500);
            }
        } else {
            document.getElementById('password-error').style.display = 'block';
            secret.entered = '';
            setTimeout(secret.updatePasswordDisplay, 500);
        }
    },

    updateGold: (amount) => {
        secret.adjustGold += amount;
        document.getElementById('adjust-gold-display').innerText = secret.adjustGold;
    },

    applyGold: () => {
        // 비밀번호 확인
        secret.entered = '';
        secret.updatePasswordDisplay();
        secret.previousModal = 'gold-adjuster-modal'; // 이전 모달 저장
        document.getElementById('password-modal').style.display = 'block';
        document.getElementById('gold-adjuster-modal').style.display = 'none';
        // 히스토리 상태 추가 (백버튼 처리용)
        history.pushState({ screen: 'password-modal' }, '', window.location.href);

        // 비밀번호 확인 후 실행할 함수
        secret.pendingAction = () => {
            db.addGold(secret.adjustGold);
            secret.pendingAction = null;
            secret.previousModal = null;
            secret.close();
        };
    },

    resetGold: () => {
        // 비밀번호 확인
        secret.entered = '';
        secret.updatePasswordDisplay();
        secret.previousModal = 'gold-adjuster-modal'; // 이전 모달 저장
        document.getElementById('password-modal').style.display = 'block';
        document.getElementById('gold-adjuster-modal').style.display = 'none';
        // 히스토리 상태 추가 (백버튼 처리용)
        history.pushState({ screen: 'password-modal' }, '', window.location.href);

        // 비밀번호 확인 후 실행할 함수
        secret.pendingAction = () => {
            if (confirm('정말 골드를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                db.gold = 0;
                db.save();

                ui.updateGold();
                if (typeof shop !== 'undefined' && typeof shop.render === 'function') {
                    shop.render();
                }
                if (typeof inventory !== 'undefined' && typeof inventory.render === 'function') {
                    inventory.render();
                }
                if (typeof statistics !== 'undefined' && typeof statistics.render === 'function') {
                    statistics.render();
                }

                alert('골드가 초기화되었습니다.');
                secret.pendingAction = null;
                secret.previousModal = null;
                secret.close();
            } else {
                // 취소하면 다시 골드 조정 화면으로
                secret.pendingAction = null;
                secret.previousModal = null;
                document.getElementById('password-modal').style.display = 'none';
                document.getElementById('gold-adjuster-modal').style.display = 'block';
            }
        };
    },

    resetStatistics: () => {
        // 비밀번호 확인
        secret.entered = '';
        secret.updatePasswordDisplay();
        secret.previousModal = 'gold-adjuster-modal'; // 이전 모달 저장
        document.getElementById('password-modal').style.display = 'block';
        document.getElementById('gold-adjuster-modal').style.display = 'none';
        // 히스토리 상태 추가 (백버튼 처리용)
        history.pushState({ screen: 'password-modal' }, '', window.location.href);

        // 비밀번호 확인 후 실행할 함수
        secret.pendingAction = () => {
            if (confirm('정말 통계를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                db.stats = {
                    solved: 0,
                    correct: 0,
                    objective: { solved: 0, correct: 0 },
                    subjective: { solved: 0, correct: 0, perfectDays: [] },
                };
                db.save();

                ui.updateMainStats();
                if (typeof statistics !== 'undefined' && typeof statistics.render === 'function') {
                    statistics.render();
                }

                alert('통계가 초기화되었습니다.');
                secret.pendingAction = null;
                secret.previousModal = null;
                secret.close();
            } else {
                // 취소하면 다시 골드 조정 화면으로
                secret.pendingAction = null;
                secret.previousModal = null;
                document.getElementById('password-modal').style.display = 'none';
                document.getElementById('gold-adjuster-modal').style.display = 'block';
            }
        };
    },

    editGold: 0, // 골드 수정 값

    openGoldEditModal: () => {
        // 골드 수정 모달 열기
        document.getElementById('gold-adjuster-modal').style.display = 'none';
        document.getElementById('gold-edit-modal').style.display = 'block';
        secret.editGold = db.gold; // 현재 골드로 초기화
        document.getElementById('current-gold-edit-display').innerText = db.gold;
        document.getElementById('edit-gold-display').innerText = secret.editGold;

        document.getElementById('gold-edit-up').onclick = () => secret.updateGoldEdit(500);
        document.getElementById('gold-edit-down').onclick = () => secret.updateGoldEdit(-500);

        // 히스토리 상태 추가 (백버튼 처리용)
        history.pushState({ screen: 'gold-edit-modal' }, '', window.location.href);
    },

    closeGoldEditModal: () => {
        // 골드 수정 모달 닫고 골드 조정 화면으로 돌아가기
        document.getElementById('gold-edit-modal').style.display = 'none';
        document.getElementById('gold-adjuster-modal').style.display = 'block';
        secret.editGold = 0;
    },

    updateGoldEdit: (amount) => {
        secret.editGold = Math.max(0, secret.editGold + amount); // 음수 방지
        document.getElementById('edit-gold-display').innerText = secret.editGold;
    },

    applyGoldEdit: () => {
        // 비밀번호 확인
        secret.entered = '';
        secret.updatePasswordDisplay();
        secret.previousModal = 'gold-edit-modal'; // 이전 모달 저장
        document.getElementById('password-modal').style.display = 'block';
        document.getElementById('gold-edit-modal').style.display = 'none';
        // 히스토리 상태 추가 (백버튼 처리용)
        history.pushState({ screen: 'password-modal' }, '', window.location.href);

        // 비밀번호 확인 후 실행할 함수
        secret.pendingAction = () => {
            db.gold = secret.editGold;
            db.save();

            ui.updateGold();
            if (typeof shop !== 'undefined' && typeof shop.render === 'function') {
                shop.render();
            }
            if (typeof inventory !== 'undefined' && typeof inventory.render === 'function') {
                inventory.render();
            }
            if (typeof statistics !== 'undefined' && typeof statistics.render === 'function') {
                statistics.render();
            }

            alert('골드가 수정되었습니다.');
            secret.pendingAction = null;
            secret.previousModal = null;
            secret.closeGoldEditModal();
            secret.close();
        };
    },

    resetStats: () => {
        // 비밀번호 확인
        secret.entered = '';
        secret.updatePasswordDisplay();
        secret.previousModal = 'gold-adjuster-modal'; // 이전 모달 저장
        document.getElementById('password-modal').style.display = 'block';
        document.getElementById('gold-adjuster-modal').style.display = 'none';
        // 히스토리 상태 추가 (백버튼 처리용)
        history.pushState({ screen: 'password-modal' }, '', window.location.href);

        // 비밀번호 확인 후 실행할 함수
        secret.pendingAction = () => {
            if (confirm('정말 모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                db.gold = 0;
                db.owned = ['basic'];
                db.equippedWeapon = 'basic';
                db.durability = {};
                db.stats = { solved: 0, correct: 0 };
                db.inventory = [];
                db.equipped = {};
                db.inventoryCapacity = 3;
                db.skills = { hint: 0, ultimate: 0 };

                db.save();

                ui.updateGold();
                ui.updateMainStats();
                ui.updateVisuals();
                ui.updateDurability();
                inventory.render();

                alert('모든 데이터가 초기화되었습니다.');
                secret.previousModal = null;
                secret.close();
                location.reload();
            } else {
                // 취소하면 다시 골드 조정 화면으로
                secret.pendingAction = null;
                secret.previousModal = null;
                document.getElementById('password-modal').style.display = 'none';
                document.getElementById('gold-adjuster-modal').style.display = 'block';
            }
        };
    },

    pendingAction: null, // 비밀번호 확인 후 실행할 함수

    openPrintDaySelect: () => {
        // Day 선택 모달 열기
        document.getElementById('gold-adjuster-modal').style.display = 'none';
        document.getElementById('print-day-select-modal').style.display = 'block';
        // 히스토리 상태 추가 (백버튼 처리용)
        history.pushState({ screen: 'print-day-select-modal' }, '', window.location.href);

        // Day 선택 옵션 채우기
        const printDaySelect = document.getElementById('print-day-select');
        if (printDaySelect) {
            printDaySelect.innerHTML = '<option value="">Day 선택...</option>';

            // 현재 데이터셋의 rawData 사용
            const currentRawData =
                typeof window !== 'undefined' && window.rawDataData ? window.rawDataData : rawData;
            const daysFromData = new Set();
            if (currentRawData && Array.isArray(currentRawData)) {
                currentRawData.forEach((r) => {
                    if (r && r.day && r.day !== 'all' && r.day !== 'boss') {
                        daysFromData.add(Number(r.day));
                    }
                });
            }

            const sortedDays = Array.from(daysFromData)
                .filter((d) => !Number.isNaN(d) && d > 0)
                .sort((a, b) => a - b);

            sortedDays.forEach((d) => {
                const label =
                    typeof dayCatalog !== 'undefined' && dayCatalog[d] && dayCatalog[d].label
                        ? dayCatalog[d].label
                        : `Day ${d}`;
                printDaySelect.innerHTML += `<option value="${d}">${label}</option>`;
            });
        }
    },

    closePrintDaySelect: () => {
        // Day 선택 모달 닫고 설정 화면으로 돌아가기
        document.getElementById('print-day-select-modal').style.display = 'none';
        document.getElementById('gold-adjuster-modal').style.display = 'block';
    },

    generatePrintHTML: () => {
        const daySelect = document.getElementById('print-day-select');
        const selectedDay = daySelect ? daySelect.value : '';

        if (!selectedDay) {
            alert('Day를 선택해주세요.');
            return;
        }

        // 라디오 버튼에서 선택된 문제 타입 확인
        const questionTypeRadio = document.querySelector(
            'input[name="print-question-type"]:checked'
        );
        const questionType = questionTypeRadio ? questionTypeRadio.value : 'mixed';

        // 현재 데이터셋의 rawData 사용
        const currentRawData =
            typeof window !== 'undefined' && window.rawDataData ? window.rawDataData : rawData;
        const dayNum = Number(selectedDay);
        const dayWords = currentRawData.filter((i) => Number(i.day) === dayNum);

        if (dayWords.length === 0) {
            alert('선택한 Day에 단어가 없습니다.');
            return;
        }

        // 단어를 섞기
        const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

        // 문제 생성 로직 함수들 (admin-tools 내부 헬퍼)
        const buildObjectiveOptions = (correctValue, key, primaryPool, count = 4) => {
            if (!correctValue) {
                return [];
            }

            const unique = new Set();
            unique.add(correctValue);

            // word 보기에서는 유사 단어 그룹 후보를 먼저 추가 (있으면)
            if (
                key === 'word' &&
                typeof window !== 'undefined' &&
                typeof window.getDecoyWordCandidates === 'function'
            ) {
                const candidates = window.getDecoyWordCandidates(correctValue) || [];
                candidates.forEach((c) => {
                    if (c && c !== correctValue) unique.add(c);
                });
            }

            const pools = [primaryPool, currentRawData];

            // 정답을 제외한 다른 선택지 찾기
            pools.forEach((pool) => {
                if (!Array.isArray(pool)) return;
                const shuffledPool = shuffle([...pool]);
                for (const item of shuffledPool) {
                    const value = item && item[key];
                    if (!value || unique.has(value) || value === correctValue) continue;
                    unique.add(value);
                    if (unique.size >= count) break;
                }
            });

            const options = Array.from(unique);

            // 정답이 반드시 포함되어 있는지 확인
            if (!options.includes(correctValue)) {
                options.push(correctValue);
            }

            // 선택지가 부족하면 정답을 반복 추가
            while (options.length < count) {
                options.push(correctValue);
            }

            // 정답을 포함한 상태로 섞기
            const shuffledOptions = shuffle([...options]);

            // 정답이 반드시 포함되도록 보장
            if (!shuffledOptions.slice(0, count).includes(correctValue)) {
                const correctIdx = shuffledOptions.indexOf(correctValue);
                if (correctIdx >= 0) {
                    [shuffledOptions[count - 1], shuffledOptions[correctIdx]] = [
                        shuffledOptions[correctIdx],
                        shuffledOptions[count - 1],
                    ];
                } else {
                    shuffledOptions[count - 1] = correctValue;
                }
            }

            return shuffledOptions.slice(0, count);
        };

        const createObjectiveQuestion = (item, isKoEn) => {
            const key = isKoEn ? 'word' : 'meaning';
            const correctValue = item[key];
            const options = buildObjectiveOptions(correctValue, key, dayWords);
            const correctIndex = options.indexOf(correctValue);
            const type = isKoEn ? 'objective-ko-en' : 'objective-en-ko';

            if (correctIndex === -1) {
                options[0] = correctValue;
                return { type, item, options, correctIndex: 0 };
            }
            return { type, item, options, correctIndex };
        };

        const createSubjectiveQuestion = (item, isKoEn) => {
            return { type: isKoEn ? 'ko-en' : 'en-ko', item };
        };

        // 문제 타입에 따라 문제 생성
        const maxQuestions = Math.min(dayWords.length, 30);
        let leftQuestions = [];
        let rightQuestions = [];

        // 사용된 단어 추적 (중복 방지용)
        const usedWords = new Set(); // word와 meaning을 모두 추적

        // 단어가 이미 사용되었는지 확인
        const isWordUsed = (item) => {
            return usedWords.has(item.word) || usedWords.has(item.meaning);
        };

        // 단어를 사용된 것으로 표시
        const markWordAsUsed = (item) => {
            usedWords.add(item.word);
            usedWords.add(item.meaning);
        };

        // 사용 가능한 단어 필터링
        const getAvailableWords = (words) => {
            return words.filter((item) => !isWordUsed(item));
        };

        if (questionType === 'mixed') {
            // 혼합형: 좌측 객관식, 우측 주관식 (50%씩)
            const objectiveCount = Math.floor(maxQuestions / 2);
            const subjectiveCount = maxQuestions - objectiveCount;

            // 좌측: 객관식 문제
            let availableWords = getAvailableWords(shuffle([...dayWords]));
            const objectiveWords = availableWords.slice(0, objectiveCount);
            objectiveWords.forEach((item) => markWordAsUsed(item));

            const objHalf = Math.ceil(objectiveWords.length / 2);
            objectiveWords.slice(0, objHalf).forEach((item, idx) => {
                leftQuestions.push({ ...createObjectiveQuestion(item, true), num: idx + 1 });
            });
            objectiveWords.slice(objHalf).forEach((item, idx) => {
                leftQuestions.push({
                    ...createObjectiveQuestion(item, false),
                    num: objHalf + idx + 1,
                });
            });

            // 우측: 주관식 문제 (이미 사용된 단어 제외)
            availableWords = getAvailableWords(shuffle([...dayWords]));
            const subjectiveWords = availableWords.slice(0, subjectiveCount);
            subjectiveWords.forEach((item) => markWordAsUsed(item));

            const subHalf = Math.ceil(subjectiveWords.length / 2);
            const rightStartNum = leftQuestions.length + 1;
            subjectiveWords.slice(0, subHalf).forEach((item, idx) => {
                rightQuestions.push({
                    ...createSubjectiveQuestion(item, true),
                    num: rightStartNum + idx,
                });
            });
            subjectiveWords.slice(subHalf).forEach((item, idx) => {
                rightQuestions.push({
                    ...createSubjectiveQuestion(item, false),
                    num: rightStartNum + subHalf + idx,
                });
            });
        } else if (questionType === 'objective') {
            // 객관식만: 좌우 모두 객관식
            let availableWords = getAvailableWords(shuffle([...dayWords]));
            const words = availableWords.slice(0, maxQuestions);
            words.forEach((item) => markWordAsUsed(item));

            const leftHalf = Math.floor(words.length / 2);
            const rightHalf = words.length - leftHalf;

            // 좌측: words의 절반
            const leftWords = words.slice(0, leftHalf);
            const leftKoEnCount = Math.ceil(leftWords.length / 2);
            leftWords.slice(0, leftKoEnCount).forEach((item, idx) => {
                leftQuestions.push({ ...createObjectiveQuestion(item, true), num: idx + 1 });
            });
            leftWords.slice(leftKoEnCount).forEach((item, idx) => {
                leftQuestions.push({
                    ...createObjectiveQuestion(item, false),
                    num: leftKoEnCount + idx + 1,
                });
            });

            // 우측: words의 나머지 절반
            const rightWordsFromLeft = words.slice(leftHalf);
            const rightKoEnCount = Math.ceil(rightWordsFromLeft.length / 2);
            const rightStartNum = leftQuestions.length + 1;
            rightWordsFromLeft.slice(0, rightKoEnCount).forEach((item, idx) => {
                rightQuestions.push({
                    ...createObjectiveQuestion(item, true),
                    num: rightStartNum + idx,
                });
            });
            rightWordsFromLeft.slice(rightKoEnCount).forEach((item, idx) => {
                rightQuestions.push({
                    ...createObjectiveQuestion(item, false),
                    num: rightStartNum + rightKoEnCount + idx,
                });
            });
        } else if (questionType === 'subjective') {
            // 주관식만: 좌우 모두 주관식
            let availableWords = getAvailableWords(shuffle([...dayWords]));
            const words = availableWords.slice(0, maxQuestions);
            words.forEach((item) => markWordAsUsed(item));

            const leftHalf = Math.floor(words.length / 2);
            const rightHalf = words.length - leftHalf;

            // 좌측: words의 절반
            const leftWords = words.slice(0, leftHalf);
            const leftKoEnCount = Math.ceil(leftWords.length / 2);
            leftWords.slice(0, leftKoEnCount).forEach((item, idx) => {
                leftQuestions.push({ ...createSubjectiveQuestion(item, true), num: idx + 1 });
            });
            leftWords.slice(leftKoEnCount).forEach((item, idx) => {
                leftQuestions.push({
                    ...createSubjectiveQuestion(item, false),
                    num: leftKoEnCount + idx + 1,
                });
            });

            // 우측: words의 나머지 절반
            const rightWordsFromLeft = words.slice(leftHalf);
            const rightKoEnCount = Math.ceil(rightWordsFromLeft.length / 2);
            const rightStartNum = leftQuestions.length + 1;
            rightWordsFromLeft.slice(0, rightKoEnCount).forEach((item, idx) => {
                rightQuestions.push({
                    ...createSubjectiveQuestion(item, true),
                    num: rightStartNum + idx,
                });
            });
            rightWordsFromLeft.slice(rightKoEnCount).forEach((item, idx) => {
                rightQuestions.push({
                    ...createSubjectiveQuestion(item, false),
                    num: rightStartNum + rightKoEnCount + idx,
                });
            });
        }

        // Day 정보 가져오기
        const dayLabel =
            typeof dayCatalog !== 'undefined' &&
            dayCatalog[selectedDay] &&
            dayCatalog[selectedDay].label
                ? dayCatalog[selectedDay].label
                : `Day ${selectedDay}`;

        // 총 문제 수 계산
        const totalQuestionCount = leftQuestions.length + rightQuestions.length;

        // 문제 페이지 HTML 생성 (좌우 2열)
        let questionsHTML = '<div class="print-columns">';
        let answersHTML = '<div class="print-columns">';

        // 좌측 컬럼
        questionsHTML += '<div class="print-column">';
        answersHTML += '<div class="print-column">';

        leftQuestions.forEach((q) => {
            if (q.type.startsWith('objective')) {
                // 객관식
                const isKoEn = q.type === 'objective-ko-en';
                const questionText = isKoEn ? q.item.meaning : q.item.word;
                const optionLabels = ['①', '②', '③', '④'];

                let qHTML = `
                    <div class="print-question">
                        <div class="question-number">${q.num}.</div>
                        <div class="question-content">
                            <div class="question-text">${questionText}</div>
                            <div class="objective-options">
                                <div class="option-row">
                                    <div class="option-item">${optionLabels[0]} ${q.options[0]}</div>
                                    <div class="option-item">${optionLabels[1]} ${q.options[1]}</div>
                                </div>
                                <div class="option-row">
                                    <div class="option-item">${optionLabels[2]} ${q.options[2]}</div>
                                    <div class="option-item">${optionLabels[3]} ${q.options[3]}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                questionsHTML += qHTML;

                let aHTML = `
                    <div class="print-question">
                        <div class="question-number">${q.num}.</div>
                        <div class="question-content">
                            <div class="question-text">${questionText}</div>
                            <div class="objective-options">
                                <div class="option-row">
                                    <div class="option-item ${q.correctIndex === 0 ? 'correct' : ''}">${optionLabels[0]} <span class="${q.correctIndex === 0 ? 'correct-underline' : ''}">${q.options[0]}</span>${q.correctIndex === 0 ? ' ✓' : ''}</div>
                                    <div class="option-item ${q.correctIndex === 1 ? 'correct' : ''}">${optionLabels[1]} <span class="${q.correctIndex === 1 ? 'correct-underline' : ''}">${q.options[1]}</span>${q.correctIndex === 1 ? ' ✓' : ''}</div>
                                </div>
                                <div class="option-row">
                                    <div class="option-item ${q.correctIndex === 2 ? 'correct' : ''}">${optionLabels[2]} <span class="${q.correctIndex === 2 ? 'correct-underline' : ''}">${q.options[2]}</span>${q.correctIndex === 2 ? ' ✓' : ''}</div>
                                    <div class="option-item ${q.correctIndex === 3 ? 'correct' : ''}">${optionLabels[3]} <span class="${q.correctIndex === 3 ? 'correct-underline' : ''}">${q.options[3]}</span>${q.correctIndex === 3 ? ' ✓' : ''}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                answersHTML += aHTML;
            } else {
                // 주관식
                const isKoEn = q.type === 'ko-en';
                const questionText = isKoEn ? q.item.meaning : q.item.word;
                const answerText = isKoEn ? q.item.word : q.item.meaning;

                questionsHTML += `
                    <div class="print-question">
                        <div class="question-number">${q.num}.</div>
                        <div class="question-content">
                            <div class="question-text">${questionText}</div>
                        </div>
                    </div>
                `;
                answersHTML += `
                    <div class="print-question">
                        <div class="question-number">${q.num}.</div>
                        <div class="question-content">
                            <div class="question-text">${questionText}</div>
                            <div class="subjective-answer">정답: <strong>${answerText}</strong></div>
                        </div>
                    </div>
                `;
            }
        });

        questionsHTML += '</div>'; // 좌측 컬럼 끝
        answersHTML += '</div>';

        // 우측 컬럼
        questionsHTML += '<div class="print-column">';
        answersHTML += '<div class="print-column">';

        rightQuestions.forEach((q) => {
            if (q.type.startsWith('objective')) {
                // 객관식
                const isKoEn = q.type === 'objective-ko-en';
                const questionText = isKoEn ? q.item.meaning : q.item.word;
                const optionLabels = ['①', '②', '③', '④'];

                let qHTML = `
                    <div class="print-question">
                        <div class="question-number">${q.num}.</div>
                        <div class="question-content">
                            <div class="question-text">${questionText}</div>
                            <div class="objective-options">
                                <div class="option-row">
                                    <div class="option-item">${optionLabels[0]} ${q.options[0]}</div>
                                    <div class="option-item">${optionLabels[1]} ${q.options[1]}</div>
                                </div>
                                <div class="option-row">
                                    <div class="option-item">${optionLabels[2]} ${q.options[2]}</div>
                                    <div class="option-item">${optionLabels[3]} ${q.options[3]}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                questionsHTML += qHTML;

                let aHTML = `
                    <div class="print-question">
                        <div class="question-number">${q.num}.</div>
                        <div class="question-content">
                            <div class="question-text">${questionText}</div>
                            <div class="objective-options">
                                <div class="option-row">
                                    <div class="option-item ${q.correctIndex === 0 ? 'correct' : ''}">${optionLabels[0]} <span class="${q.correctIndex === 0 ? 'correct-underline' : ''}">${q.options[0]}</span>${q.correctIndex === 0 ? ' ✓' : ''}</div>
                                    <div class="option-item ${q.correctIndex === 1 ? 'correct' : ''}">${optionLabels[1]} <span class="${q.correctIndex === 1 ? 'correct-underline' : ''}">${q.options[1]}</span>${q.correctIndex === 1 ? ' ✓' : ''}</div>
                                </div>
                                <div class="option-row">
                                    <div class="option-item ${q.correctIndex === 2 ? 'correct' : ''}">${optionLabels[2]} <span class="${q.correctIndex === 2 ? 'correct-underline' : ''}">${q.options[2]}</span>${q.correctIndex === 2 ? ' ✓' : ''}</div>
                                    <div class="option-item ${q.correctIndex === 3 ? 'correct' : ''}">${optionLabels[3]} <span class="${q.correctIndex === 3 ? 'correct-underline' : ''}">${q.options[3]}</span>${q.correctIndex === 3 ? ' ✓' : ''}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                answersHTML += aHTML;
            } else {
                // 주관식
                const isKoEn = q.type === 'ko-en';
                const questionText = isKoEn ? q.item.meaning : q.item.word;
                const answerText = isKoEn ? q.item.word : q.item.meaning;

                questionsHTML += `
                    <div class="print-question">
                        <div class="question-number">${q.num}.</div>
                        <div class="question-content">
                            <div class="question-text">${questionText}</div>
                        </div>
                    </div>
                `;
                answersHTML += `
                    <div class="print-question">
                        <div class="question-number">${q.num}.</div>
                        <div class="question-content">
                            <div class="question-text">${questionText}</div>
                            <div class="subjective-answer">정답: <strong>${answerText}</strong></div>
                        </div>
                    </div>
                `;
            }
        });

        questionsHTML += '</div>'; // 우측 컬럼 끝
        answersHTML += '</div>';

        questionsHTML += '</div>'; // print-columns 끝
        answersHTML += '</div>';

        // HTML 생성
        const printHTML = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>단어 문제 - ${dayLabel}</title>
    <style>
        body {
            font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
            margin: 0;
            padding: 0;
            color: #333;
        }
        .print-page {
            width: 21cm;
            min-height: 29.7cm;
            padding: 2cm;
            margin: 0 auto;
            background: white;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            page-break-after: always;
        }
        .print-page:last-child {
            page-break-after: auto;
        }
        .print-header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 2px solid #333;
            padding-bottom: 8px;
            flex-shrink: 0;
            position: relative;
        }
        .print-header h1 {
            margin: 0;
            font-size: 18pt;
            color: #333;
        }
        .print-header .day-info {
            margin-top: 4px;
            font-size: 11pt;
            color: #666;
        }
        .print-header .score-box {
            position: absolute;
            top: 2.5em;
            right: 0;
            font-size: 12pt;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .print-header .score-input {
            border: none;
            padding: 2px 8px;
            min-width: 50px;
            text-align: center;
            font-size: 12pt;
            background: transparent;
            display: inline-block;
            text-decoration: none;
        }
        .print-columns {
            display: flex;
            gap: 1.2cm;
            width: 100%;
            flex: 1;
            overflow: hidden;
            min-height: 0;
            position: relative;
        }
        .print-column {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 0;
        }
        .print-question {
            page-break-inside: avoid;
            margin-bottom: 8px;
            display: flex;
            align-items: flex-start;
            font-size: 10pt;
            line-height: 1.4;
        }
        .question-number {
            font-weight: bold;
            width: 24px;
            flex-shrink: 0;
            color: #555;
        }
        .question-content {
            flex: 1;
        }
        .question-text {
            font-weight: 500;
            margin-bottom: 2px;
        }
        .objective-options {
            font-size: 9pt;
            color: #555;
            margin-left: 4px;
        }
        .option-row {
            display: flex;
            gap: 12px;
            margin-bottom: 1px;
        }
        .option-item {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .option-item.correct {
            font-weight: bold;
            color: #d32f2f;
        }
        .correct-underline {
            text-decoration: underline;
        }
        .subjective-answer {
            margin-top: 2px;
            font-size: 9.5pt;
            color: #333;
            padding-left: 8px;
        }
        .subjective-answer strong {
            color: #d32f2f;
            font-weight: bold;
        }
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            .print-page {
                margin: 0;
                padding: 2cm;
            }
        }
    </style>
</head>
<body>
    <!-- 문제만 페이지 -->
    <div class="print-page">
        <div class="print-header">
            <div class="score-box">
                <span class="score-input"></span>
                <span>/</span>
                <span>${totalQuestionCount}</span>
            </div>
            <h1>단어 문제</h1>
            <div class="day-info">${dayLabel}</div>
        </div>
        ${questionsHTML}
    </div>
    
    <!-- 문제 + 정답 페이지 -->
    <div class="print-page">
        <div class="print-header">
            <div class="score-box">
                <span class="score-input"></span>
                <span>/</span>
                <span>${totalQuestionCount}</span>
            </div>
            <h1>단어 문제 및 정답</h1>
            <div class="day-info">${dayLabel}</div>
        </div>
        ${answersHTML}
    </div>
</body>
</html>
        `;

        // 새 창에서 HTML 열기
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printHTML);
        printWindow.document.close();

        // 모달 닫기
        secret.closePrintDaySelect();
    },
};
