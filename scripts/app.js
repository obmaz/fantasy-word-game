// ============================================================
// Fantasy Word Game - Main Application
// ============================================================
//
// 모듈화된 구조:
// - scripts/utils/helpers.js - 유틸리티 함수
// - scripts/data/ - 데이터 로더 (game-data, words, items)
// - scripts/core/ - 핵심 시스템 (database, inventory, shop, statistics)
// - scripts/ui/ - UI 관리 (ui-manager)
// - scripts/features/ - 기능 모듈 (story)
//
// 이 파일 (app.js)에는 다음이 포함됨:
// - game 객체: 게임 엔진 메인 로직
// - secret 객체: 관리자 도구
// - 기타 유틸리티 함수 및 이벤트 핸들러
// ============================================================

// ============================================================
// GAME ENGINE
// ============================================================
const game = {
    list: [],
    idx: 0,
    timer: null,
    timeLeft: 0,
    maxTime: 10,
    stats: { gain: 0, lost: 0 },
    currentQ: null,
    isProcessing: false,
    currentAns: '',
    mode: 'battle',
    deck: [],
    currentDay: null,
    battleQuestionType: 'mixed',
    subjectiveTotal: 0, // 주관식 문제 총 개수
    subjectiveCorrect: 0, // 주관식 문제 정답 개수
    sessionCorrectObjective: 0, // 이번 게임 객관식 정답 수
    sessionWrongWords: [], // 이번 게임 틀린 단어 목록 { word, meaning }
    bossTotalWaves: 0, // 보스 모드 총 웨이브 수 (초기 덱 크기)

    exit: () => {
        if (game.timer) {
            clearInterval(game.timer);
            game.timer = null;
        }
        game.isProcessing = false;

        const bgMusic = document.getElementById('background-music');
        if (bgMusic && !bgMusic.paused) {
            bgMusic.pause();
            bgMusic.currentTime = 0;
        }

        const musicInfoOverlay = document.getElementById('music-info-overlay');
        if (musicInfoOverlay) musicInfoOverlay.style.display = 'none';

        closeScreenOverlay('battle-mode-game', true);

        const startScreen = document.getElementById('title-screen');
        if (startScreen) {
            startScreen.style.display = 'flex';
            startScreen.style.zIndex = ''; // Restore z-index
            setTimeout(() => {
                if (typeof syncTitleButtonOverlay === 'function') {
                    syncTitleButtonOverlay();
                }
            }, 100);
        }
        history.pushState(null, '', window.location.href);
    },

    init: (mode, day) => {
        game.mode = mode;
        game.currentDay = day;

        // story-modal을 애니메이션과 함께 닫기
        closeScreenOverlay('battle-mode-story-modal', true);
        closeScreenOverlay('boss-mode-story-modal', true);

        let pool;
        // 현재 데이터셋의 rawData 사용 (게임 데이터 변경 시 최신 데이터 반영)
        const currentRawData =
            typeof window !== 'undefined' && window.rawDataData ? window.rawDataData : rawData;
        // normalize day and strictly match numeric day values to avoid cross-day leakage
        if (day === 'all' || day === 'boss') {
            pool = currentRawData;
        } else {
            const dayNum = Number(day);
            pool = currentRawData.filter((i) => Number(i.day) === dayNum);
        }

        const countSelect = document.getElementById('count-select');
        const countValue = mode === 'boss' ? 0 : countSelect ? countSelect.value : '10';

        let count;
        if (countValue === 'all') {
            count = pool.length;
        } else {
            count = parseInt(countValue) || 10;
        }
        console.log('[game.init] mode=', mode, 'day=', day, 'poolSize=', pool && pool.length);

        // 중복 선언 및 로직 제거됨

        if (pool.length < 4) {
            alert('데이터 부족');
            location.reload();
            return;
        }

        // 보스 모드가 아닐 때만 maxTime 설정
        if (mode !== 'boss') {
            game.maxTime = db.has('hourglass') ? 15 : 10;
        }
        game.stats = { gain: 0, lost: 0 };
        game.idx = 0;
        game.isProcessing = false;
        game.subjectiveTotal = 0;
        game.subjectiveCorrect = 0;
        game.sessionCorrectObjective = 0;
        game.sessionWrongWords = [];

        if (mode === 'boss') {
            // 현재 데이터셋의 rawData 사용
            const currentRawData =
                typeof window !== 'undefined' && window.rawDataData ? window.rawDataData : rawData;
            game.deck = game.shuffle([...currentRawData]);
            game.bossTotalWaves = game.deck.length;
            game.list = [];
        } else if (mode === 'battle') {
            // Battle Mode: Question type depends on user selection
            let shuffledPool = game.shuffle(pool);
            const questionType = game.battleQuestionType || 'mixed'; // default to 'mixed'
            console.log(
                '[game.init] battle mode - questionType:',
                questionType,
                'battleQuestionType:',
                game.battleQuestionType
            );

            if (questionType === 'objective') {
                // 객관식만: 모든 문제를 객관식으로
                console.log('[game.init] 객관식만 모드 - 모든 문제를 객관식으로 설정');
                game.list = shuffledPool.slice(0, count).map((q) => ({ ...q, isBoss: false }));
            } else if (questionType === 'subjective') {
                // 주관식만: 모든 문제를 주관식으로
                console.log('[game.init] 주관식만 모드 - 모든 문제를 주관식으로 설정');
                game.list = shuffledPool.slice(0, count).map((q) => ({ ...q, isBoss: true }));
            } else {
                // 혼합형: 객관식과 주관식이 번갈아 나오도록
                console.log('[game.init] 혼합형 모드 - 객관식과 주관식 번갈아 표시');
                const bossCount = Math.floor(count / 2); // 50%
                const normalCount = count - bossCount; // 나머지

                // 주관식과 객관식 문제를 각각 준비
                const bossQuestions = shuffledPool
                    .slice(0, bossCount)
                    .map((q) => ({ ...q, isBoss: true }));
                const normalQuestions = shuffledPool
                    .slice(bossCount, bossCount + normalCount)
                    .map((q) => ({ ...q, isBoss: false }));

                // 각각 섞기
                const shuffledBoss = game.shuffle([...bossQuestions]);
                const shuffledNormal = game.shuffle([...normalQuestions]);

                // 번갈아 배치 (같은 타입이 연속으로 나오지 않도록)
                game.list = [];
                const maxLen = Math.max(shuffledBoss.length, shuffledNormal.length);
                for (let i = 0; i < maxLen; i++) {
                    // 객관식과 주관식을 번갈아 추가
                    if (i < shuffledNormal.length) {
                        game.list.push(shuffledNormal[i]);
                    }
                    if (i < shuffledBoss.length) {
                        game.list.push(shuffledBoss[i]);
                    }
                }

                // 마지막으로 한 번 더 섞되, 같은 타입이 연속되지 않도록 보장
                let attempts = 0;
                while (attempts < 10) {
                    game.list = game.shuffle([...game.list]);
                    // 같은 타입이 연속으로 나오는지 확인
                    let hasConsecutive = false;
                    for (let i = 1; i < game.list.length; i++) {
                        if (game.list[i].isBoss === game.list[i - 1].isBoss) {
                            hasConsecutive = true;
                            break;
                        }
                    }
                    if (!hasConsecutive) break;
                    attempts++;
                }
            }

            // 디버깅: 생성된 문제 타입 확인
            const bossCount = game.list.filter((q) => q.isBoss).length;
            const normalCount = game.list.filter((q) => !q.isBoss).length;
            console.log(
                '[game.init] 생성된 문제 - 주관식:',
                bossCount,
                '객관식:',
                normalCount,
                '총:',
                game.list.length
            );
        } else {
            let shuffledPool = game.shuffle(pool);
            const bossCount = Math.max(1, Math.floor(count * 0.2));
            const normalCount = count - bossCount;

            const bossQuestions = shuffledPool
                .slice(0, bossCount)
                .map((q) => ({ ...q, isBoss: true }));
            const normalQuestions = shuffledPool
                .slice(bossCount, count)
                .map((q) => ({ ...q, isBoss: false }));

            game.list = game.shuffle([...bossQuestions, ...normalQuestions]);
        }

        // 주관식 문제 총 개수 계산
        game.subjectiveTotal = game.list.filter((q) => q.isBoss).length;

        // 애니메이션 완료 후 게임 화면 표시
        setTimeout(() => {
            const gameScreen = document.getElementById('battle-mode-game');
            if (gameScreen) {
                gameScreen.style.display = 'flex';
                gameScreen.style.visibility = 'visible';
                gameScreen.style.opacity = '1';
                gameScreen.style.zIndex = '250';
            }

            // 배경음악 재생 (설정에서 음악 재생 체크 시에만)
            playMusic('battle');

            // 히스토리 상태 추가 (백버튼 처리용)
            history.pushState({ screen: 'game' }, '', window.location.href);

            // 게임 모드와 Day 표시 업데이트
            ui.updateGameInfo(mode, day);

            ui.updateGold();
            ui.updateVisuals();
            ui.updateDurability();
            ui.updateSkills();
            syncGameScreenSizeToTitle();
            game.nextLevel();
        }, 400); // 애니메이션 시간과 일치
    },

    nextLevel: () => {
        // handleAnswer에서 호출된 경우 isProcessing을 false로 리셋하고 진행
        // (showEnding에서 호출된 경우는 isProcessing이 true로 유지되어야 함)
        game.isProcessing = false; // Reset lock

        // 게임 종료 조건 체크
        if (game.mode === 'battle' && game.idx >= game.list.length) {
            story.showEnding(true);
            return;
        }

        // Battle 모드 종료 조건 체크
        if (game.mode === 'battle' && game.idx >= game.list.length) {
            story.showEnding(true);
            return;
        }

        // Day 정보 업데이트 (게임 중에도 day 정보가 올바르게 표시되도록)
        ui.updateGameInfo(game.mode, game.currentDay);

        // choose an appropriate monster sprite (day-specific > boss/normal > fallback)
        const upcoming = game.mode === 'boss' ? null : (game.list && game.list[game.idx]) || null;
        const isBossPreview = game.mode === 'boss' ? true : !!(upcoming && upcoming.isBoss);
        const sprite = pickMonsterSprite(upcoming || story.day, isBossPreview);
        document.getElementById('monster-img').src = sprite;

        if (game.mode === 'boss') {
            if (game.deck.length === 0) {
                story.showEnding(true);
                return;
            }
            game.currentQ = game.deck.pop();
            document.getElementById('wave-badge').innerText = 'Wave: ' + (game.idx + 1);
            game.currentAns = game.currentQ.word;
            // boss 모드에서는 모든 문제가 주관식이므로, 첫 문제일 때 총 개수 초기화
            if (game.idx === 0) {
                game.subjectiveTotal = 0;
                game.subjectiveCorrect = 0;
            }
            game.subjectiveTotal++; // boss 모드에서는 모든 문제가 주관식
            game.renderBoss(game.currentQ, true); // boss mode
        } else if (game.mode === 'battle') {
            // Battle Mode: Question type depends on user selection
            document.getElementById('wave-badge').innerText = `${game.idx + 1}/${game.list.length}`;
            game.currentQ = game.list[game.idx];
            game.currentAns = game.currentQ.word;

            // 먼저 모든 문제 박스를 숨김
            document.getElementById('boss-box').style.display = 'none';
            document.getElementById('options-box').style.display = 'none';

            // isBoss 속성에 따라 주관식/객관식 표시 (혼합형도 각 문제당 하나만 표시)
            if (game.currentQ.isBoss) {
                game.renderBoss(game.currentQ, false);
            } else {
                // 객관식 문제는 기본 시간으로 복원
                game.maxTime = db.has('hourglass') ? 15 : 10;
                game.renderNormal(game.currentQ);
            }
        } else {
            document.getElementById('wave-badge').innerText = `${game.idx + 1}/${game.list.length}`;
            game.currentQ = game.list[game.idx];

            document.getElementById('boss-box').style.display = 'none';
            document.getElementById('options-box').style.display = 'none';

            if (game.currentQ.isBoss) {
                game.currentAns = game.currentQ.word;
                game.renderBoss(game.currentQ, false);
            } else {
                // 객관식 문제는 기본 시간으로 복원
                game.maxTime = db.has('hourglass') ? 15 : 10;
                game.renderNormal(game.currentQ);
            }
        }
        // 보스 모드이거나 주관식 문제일 때는 타이머를 시작하지 않음
        if (game.mode === 'boss' || game.currentQ.isBoss) {
            // 보스 모드 또는 주관식 문제일 때는 타이머 정지 및 타이머 바 숨김
            if (game.timer) {
                clearInterval(game.timer);
                game.timer = null;
            }
            const overlayBar = document.getElementById('overlay-timer');
            if (overlayBar) {
                overlayBar.style.width = '100%';
                overlayBar.classList.remove('timer-danger');
            }
        } else {
            game.startTimer();
        }
    },

    renderNormal: (data) => {
        console.log('[game.renderNormal] day=', data && data.day, 'word=', data && data.word);
        if (!data || !data.word || !data.meaning) {
            game.idx++;
            game.nextLevel();
            return;
        }
        // 주관식 박스 명시적으로 숨김
        document.getElementById('boss-box').style.display = 'none';
        document.getElementById('options-box').style.display = 'grid';
        document.getElementById('options-box').innerHTML = '';
        document.getElementById('skill-display').style.visibility = 'visible';

        // 객관식 문제에서는 day 정보 보이기
        const gameInfoBadge = document.getElementById('game-info-badge');
        if (gameInfoBadge) {
            gameInfoBadge.style.display = 'block';
        }

        const qLabel = document.getElementById('q-label');
        if (qLabel) {
            qLabel.innerText = '';
            qLabel.style.display = 'none';
        }

        const isKor = Math.random() < 0.5;
        if (isKor) {
            document.getElementById('q-text').innerText = data.meaning;
            game.currentAns = data.word;
            const opts = game.getDistractors(data.word, 'word');
            game.shuffle([data.word, ...opts]).forEach((opt) =>
                game.createBtn(opt, opt === data.word)
            );
        } else {
            document.getElementById('q-text').innerText = data.word;
            game.currentAns = data.meaning;
            const opts = game.getDistractors(data.meaning, 'meaning');
            game.shuffle([data.meaning, ...opts]).forEach((opt) =>
                game.createBtn(opt, opt === data.meaning)
            );
        }

        // 객관식에서는 스킬을 활성화 상태로 업데이트
        ui.updateSkills();
    },

    renderBoss: (data, isBoss) => {
        console.log(
            '[game.renderBoss] day=',
            data && data.day,
            'word=',
            data && data.word,
            'isBoss=',
            !!isBoss
        );
        if (!data || !data.word || !data.meaning) {
            game.idx++;
            game.nextLevel();
            return;
        }
        document.getElementById('boss-box').style.display = 'flex';
        document.getElementById('options-box').style.display = 'none';
        document.getElementById('skill-display').style.visibility = 'visible'; // 주관식에서도 표시

        // 주관식 문제에서도 day 정보 보이기
        const gameInfoBadge = document.getElementById('game-info-badge');
        if (gameInfoBadge) {
            gameInfoBadge.style.display = 'block';
        }

        const isFinalBoss = !isBoss && game.idx === game.list.length - 1;
        document.getElementById('boss-title').innerText = isFinalBoss
            ? '⚠️ BOSS BATTLE'
            : isBoss
              ? `🔥 WAVE ${game.idx + 1}`
              : '⚔️ ELITE';

        const qLabel = document.getElementById('q-label');
        if (qLabel) {
            qLabel.innerText = '';
            qLabel.style.display = 'none';
        }
        document.getElementById('q-text').innerText = data.meaning;

        // 띄어쓰기가 있는 단어는 _도 띄어쓰기 처리 (첫 글자는 보여주고 나머지는 _)
        const word = data.word;
        let hintText = '';
        let isFirstChar = true; // 첫 글자 여부 추적

        for (let i = 0; i < word.length; i++) {
            if (word.charAt(i) === ' ') {
                hintText += ' '; // 띄어쓰기는 그대로 유지
                isFirstChar = true; // 띄어쓰기 후 다음 글자가 첫 글자
            } else {
                if (isFirstChar) {
                    hintText += word.charAt(i); // 첫 글자는 실제 글자로 표시
                    isFirstChar = false;
                } else {
                    hintText += '_'; // 나머지는 _로 표시
                }
            }
        }
        document.getElementById('boss-hint').innerText = hintText;

        // 주관식 문제는 시간 제한 없음 (타이머 시작하지 않음)

        const input = document.getElementById('boss-input');
        if (input) {
            input.value = '';
            input.disabled = false; // 입력 활성화
            input.focus();
            input.style.borderColor = 'var(--primary)';
            input.onkeypress = (e) => {
                if (e.key === 'Enter' && !game.isProcessing) {
                    game.checkBossAnswer();
                }
            };
        }

        // 공격하기 버튼 이벤트 리스너 설정
        const bossSubmitBtn = document.querySelector('.boss-submit');
        if (bossSubmitBtn) {
            bossSubmitBtn.onclick = () => {
                if (!game.isProcessing) {
                    game.checkBossAnswer();
                }
            };
            bossSubmitBtn.disabled = false;
            bossSubmitBtn.style.pointerEvents = 'auto';
        }

        // 주관식에서는 스킬을 비활성화 상태로 업데이트
        ui.updateSkills();
    },

    createBtn: (text, isCorrect) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = text;
        btn.onclick = () => game.handleAnswer(isCorrect, btn);
        document.getElementById('options-box').appendChild(btn);
    },

    checkBossAnswer: () => {
        if (game.isProcessing) return;
        const input = document.getElementById('boss-input').value.trim().toLowerCase();
        const answer = game.currentQ.word.toLowerCase();

        // 첫 글자가 힌트로 보이므로, 사용자가 첫 글자를 생략하고 입력해도 정답 처리
        const answerWithoutFirst = answer.slice(1); // 첫 글자 제외한 나머지
        const isCorrect = input === answer || input === answerWithoutFirst;

        game.handleAnswer(isCorrect, null, 'subjective');
    },

    handleAnswer: (isCorrect, btnElement, questionType = 'objective') => {
        if (game.isProcessing) return;
        game.isProcessing = true;
        clearInterval(game.timer);

        // Record Stats (문제 타입 포함)
        db.addStats(isCorrect, questionType);

        // 이번 게임 객관식/주관식 정답 추적
        if (isCorrect && questionType === 'objective') {
            game.sessionCorrectObjective++;
        }
        if (questionType === 'subjective' && isCorrect) {
            game.subjectiveCorrect++;
        }
        // 틀린 단어 기록 (현재 문제의 word, meaning)
        if (!isCorrect && game.currentQ) {
            game.sessionWrongWords.push({
                word: game.currentQ.word || '',
                meaning: game.currentQ.meaning || '',
            });
        }

        if (isCorrect) {
            game.animAttack();

            // Reward Logic
            let baseGain = 40;
            if (game.mode === 'boss') {
                baseGain = 80;
            } else if (game.currentQ.isBoss) {
                baseGain = game.list.length >= 20 ? 600 : game.list.length >= 10 ? 200 : 100;
            }

            // Time Factor
            const timeRatio = game.timeLeft / game.maxTime;
            let gain = Math.floor(baseGain * (0.5 + timeRatio * 0.5));

            // 1. Weapon Multiplier
            const wData = weapons.find((w) => w.id === db.equippedWeapon);
            if (wData && wData.multiplier) {
                gain = Math.floor(gain * wData.multiplier);
                if (wData.multiplier > 1) game.animGoldAttack(); // Gold effect
            }

            // 2. Glove Multiplier
            if (db.has('goldGlove')) {
                gain = Math.floor(gain * 1.5);
                db.useItem('goldGlove');
            }

            game.stats.gain += gain;
            db.addGold(gain);
            game.showFloatText(`+${gain} G`, 'gold');

            if (btnElement) btnElement.style.background = '#66BB6A';
            else document.getElementById('boss-input').style.borderColor = '#66BB6A';

            setTimeout(() => {
                game.idx++;
                game.nextLevel();
            }, 800);
        } else {
            // Wrong Answer
            if (game.mode === 'boss') {
                // 게임 종료 처리 중이므로 더 이상 진행하지 않음
                game.isProcessing = true;

                // 타이머 정지 (타이머가 계속 실행되어 handleAnswer를 호출하는 것을 방지)
                if (game.timer) {
                    clearInterval(game.timer);
                    game.timer = null;
                }

                // boss-input 비활성화
                const bossInput = document.getElementById('boss-input');
                if (bossInput) {
                    bossInput.style.borderColor = '#FF5252';
                    bossInput.disabled = true; // 입력 비활성화
                    bossInput.onkeypress = null; // 키 이벤트 제거
                }

                // 오답일 때 정답 표시
                game.showCorrectAnswer(game.currentAns, 'subjective');
                game.showFloatText('GAME OVER', 'red');

                setTimeout(() => {
                    story.showEnding(false);
                    // game.isProcessing은 showEnding에서 true로 유지 (게임이 자동으로 다시 시작되지 않도록)
                }, 2500);
                return;
            }

            // Animations
            document.getElementById('monster-img').classList.add('mob-attack-anim');
            document.getElementById('hero-img').classList.add('hero-hit-anim');
            document.querySelector('.battle-arena').classList.add('screen-shake');

            // 스마트폰 진동 (데미지 받을 때)
            if (navigator.vibrate) {
                navigator.vibrate(200); // 200ms 진동
            }

            setTimeout(() => {
                document.getElementById('monster-img').classList.remove('mob-attack-anim');
                document.getElementById('hero-img').classList.remove('hero-hit-anim');
                document.querySelector('.battle-arena').classList.remove('screen-shake');
            }, 400);

            let penalty = 100;
            if (db.has('shield')) penalty = 50;

            game.stats.lost += penalty;
            db.subGold(penalty);
            game.showFloatText(`-${penalty} G`, 'red');

            if (btnElement) {
                btnElement.style.background = '#D32F2F';
            } else {
                document.getElementById('boss-input').style.borderColor = '#D32F2F';
            }

            // 오답일 때 정답 표시 (문제 타입에 따라 다르게 처리)
            const questionType =
                document.getElementById('boss-box').style.display === 'flex'
                    ? 'subjective'
                    : 'objective';
            game.showCorrectAnswer(game.currentAns, questionType);

            // IMPORTANT: Ensure timeout triggers next level even if animation fails
            setTimeout(() => {
                game.idx++;
                game.nextLevel();
            }, 2500);
        }
    },

    // Skills
    useHint: () => {
        if (game.isProcessing || game.mode === 'boss' || db.skills.hint <= 0) return;
        if (document.getElementById('options-box').style.display === 'none') return;

        db.skills.hint--;
        db.save();
        ui.updateSkills();

        const btns = Array.from(document.querySelectorAll('.option-btn:not(.disabled)'));
        const wrongBtns = btns.filter((b) => b.innerText !== game.currentAns);
        game.shuffle(wrongBtns)
            .slice(0, 2)
            .forEach((b) => {
                b.classList.add('disabled');
                b.style.opacity = '0.2';
            });
    },
    useUltimate: () => {
        if (game.isProcessing || game.mode === 'boss' || db.skills.ultimate <= 0) return;
        if (document.getElementById('options-box').style.display === 'none') return;

        db.skills.ultimate--;
        db.save();
        ui.updateSkills();

        const btns = document.querySelectorAll('.option-btn');
        btns.forEach((b) => {
            if (b.innerText === game.currentAns) b.click();
        });
    },

    // Visuals
    animAttack: () => {
        document.getElementById('hero-wrapper').classList.add('hero-active');
        const wId = db.equippedWeapon;
        const wData = weapons.find((w) => w.id === wId) || weapons[0];
        const effType = wData.effect;
        const effEl = document.getElementById('effect-slash');
        effEl.className = '';
        document.getElementById('effect-void-bg').className = 'slash-void-bg';
        document.getElementById('effect-void-core').className = 'slash-void-core';
        setTimeout(() => {
            if (effType === 'void') {
                document.getElementById('effect-void-bg').classList.add('eff-void-bg');
                document.getElementById('effect-void-core').classList.add('eff-void-core');
            } else {
                effEl.classList.add(`slash-${effType}`, `eff-${effType}`);
            }
            document.getElementById('monster-img').classList.add('mob-active');
        }, 300);
        setTimeout(() => {
            document.getElementById('hero-wrapper').classList.remove('hero-active');
            document.getElementById('monster-img').classList.remove('mob-active');
        }, 900);
    },
    animGoldAttack: () => {
        const effEl = document.getElementById('effect-slash');
        setTimeout(() => {
            effEl.classList.add('slash-gold', 'eff-gold');
        }, 300);
    },

    showFloatText: (text, type) => {
        const el = document.getElementById('dmg-txt');
        el.innerText = text;
        el.className = `damage-txt float-up ${type === 'gold' ? 'dmg-gold' : 'dmg-red'}`;
        setTimeout(() => el.classList.remove('float-up'), 1000);
    },

    showCorrectAnswer: (answer, questionType = 'objective') => {
        if (questionType === 'subjective') {
            // 주관식: 힌트 영역의 _를 정답으로 채우기
            const bossHint = document.getElementById('boss-hint');
            if (bossHint) {
                // 현재 힌트 텍스트를 정답으로 교체
                bossHint.innerText = answer;
                bossHint.style.color = '#4CAF50'; // 초록색으로 강조
                bossHint.style.fontWeight = 'bold';
                bossHint.style.fontSize = '24px';
            }
        } else {
            // 객관식: 보기 버튼 중 정답 버튼 강조
            const optionBtns = document.querySelectorAll('.option-btn');
            optionBtns.forEach((btn) => {
                if (btn.innerText.trim() === answer.trim()) {
                    // 정답 버튼 강조
                    btn.style.background = '#4CAF50'; // 초록색 배경
                    btn.style.color = '#FFFFFF';
                    btn.style.border = '3px solid #2E7D32'; // 진한 초록색 테두리
                    btn.style.fontWeight = 'bold';
                    btn.style.transform = 'scale(1.05)';
                    btn.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.5)';
                }
            });
        }
    },

    startTimer: () => {
        game.timeLeft = game.maxTime;
        const overlayBar = document.getElementById('overlay-timer');
        if (overlayBar) {
            overlayBar.style.width = '100%';
            overlayBar.classList.remove('timer-danger');
        }
        clearInterval(game.timer);
        game.timer = setInterval(() => {
            // 게임 오버 처리 중이면 타이머 정지
            if (game.isProcessing) {
                clearInterval(game.timer);
                game.timer = null;
                return;
            }

            game.timeLeft -= 0.1;
            const width = (game.timeLeft / game.maxTime) * 100 + '%';
            if (overlayBar) overlayBar.style.width = width;
            if (game.timeLeft <= 3) {
                if (overlayBar) overlayBar.classList.add('timer-danger');
            }
            if (game.timeLeft <= 0) {
                clearInterval(game.timer);
                game.timer = null;
                // 게임 오버 처리 중이 아니면 handleAnswer 호출 (현재 문제 타입 전달)
                if (!game.isProcessing) {
                    const questionType =
                        document.getElementById('boss-box').style.display === 'flex'
                            ? 'subjective'
                            : 'objective';
                    game.handleAnswer(false, null, questionType);
                }
            }
        }, 100);
    },

    getDistractors: (correct, key) => {
        // 현재 데이터셋의 rawData 사용
        const currentRawData =
            typeof window !== 'undefined' && window.rawDataData ? window.rawDataData : rawData;
        const distractors = [];
        const norm = (v) =>
            String(v || '')
                .trim()
                .toLowerCase();
        const correctNorm = norm(correct);

        // 추천 방식: 유사 단어 집합(decoyWordsSet)이 있으면 word 보기에서 우선 사용
        // - 그룹 매핑이 없으면 아래 랜덤 로직으로 fallback 됨
        if (
            key === 'word' &&
            typeof window !== 'undefined' &&
            typeof window.getDecoyWordCandidates === 'function'
        ) {
            const candidates = window.getDecoyWordCandidates(correct) || [];
            const shuffledCandidates = game.shuffle([...candidates]);
            for (const c of shuffledCandidates) {
                const cNorm = norm(c);
                if (!cNorm || cNorm === correctNorm) continue;
                if (!distractors.some((d) => norm(d) === cNorm)) {
                    distractors.push(c);
                }
                if (distractors.length >= 3) break;
            }
        }
        const shuffled = game.shuffle([...currentRawData]);
        for (let i = 0; i < shuffled.length; i++) {
            const value = shuffled[i] && shuffled[i][key];
            const valueNorm = norm(value);
            if (!valueNorm || valueNorm === correctNorm) continue;
            if (!distractors.some((d) => norm(d) === valueNorm)) {
                distractors.push(value);
            }
            if (distractors.length >= 3) break;
        }
        // Ensure we have 3 distractors, even if we have to grab randomly
        while (distractors.length < 3) {
            // 현재 데이터셋의 rawData 사용
            const currentRawData =
                typeof window !== 'undefined' && window.rawDataData ? window.rawDataData : rawData;
            const emergencyDistractor = game.shuffle([...currentRawData])[0];
            if (
                emergencyDistractor &&
                emergencyDistractor[key] &&
                norm(emergencyDistractor[key]) !== correctNorm
            ) {
                const ev = emergencyDistractor[key];
                const evNorm = norm(ev);
                if (evNorm && !distractors.some((d) => norm(d) === evNorm)) {
                    distractors.push(ev);
                }
            }
        }
        return distractors.slice(0, 3);
    },
    shuffle: (arr) => arr.sort(() => Math.random() - 0.5),

    end: (win) => {
        // story-modal이 확실히 닫혀있는지 확인
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

        // practice-mode-modal과 battle-mode-modal도 닫기
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
        if (battleModeModal) {
            battleModeModal.style.display = 'none';
            battleModeModal.style.visibility = 'hidden';
            battleModeModal.style.opacity = '0';
            battleModeModal.style.zIndex = '100';
            battleModeModal.style.pointerEvents = 'none';
            battleModeModal.classList.remove('closing');
        }

        // title-screen이 뒤에 있도록 보장 (backdrop-filter가 작동하도록)
        const startScreen = document.getElementById('title-screen');
        if (startScreen) {
            startScreen.style.display = 'flex';
            startScreen.style.zIndex = '100'; // result-modal(z-index: 300) 뒤에 위치
        }

        // 결과 화면 표시 (z-index 300으로 설정되어 있어서 위에 표시됨)
        openScreenOverlay('result-modal', true);

        const gain = game.stats.gain;
        const lost = game.stats.lost;

        document.getElementById('res-title').innerText =
            win || game.mode === 'boss' ? 'FINISHED!' : 'FAILED';

        document.getElementById('res-gain').innerText = gain;
        document.getElementById('res-lost').innerText = lost;

        // Fix: Show Total Wallet explicitly
        // Clamp negative balance to 0 on game end
        if (db.gold < 0) {
            db.gold = 0;
            db.save();
        }
        document.getElementById('res-current-total').innerText = db.gold;

        // 이번 게임 기록: 객관식/주관식 맞힌 개수, 정답률
        const resRecordEl = document.getElementById('res-record');
        const resWrongEl = document.getElementById('res-wrong-words');
        if (resRecordEl) {
            let recordHtml = '';
            const qt = game.battleQuestionType || 'mixed';
            if (game.mode === 'boss') {
                const total = win ? game.bossTotalWaves : game.idx + 1;
                const correct = game.subjectiveCorrect || 0;
                const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
                recordHtml += '<div class="result-modal-section">✍️ 주관식</div>';
                recordHtml += `<div class="result-modal-item"><div style="text-align:right; width:100%;"><div style="font-size:15px; margin-bottom:4px;"><b>맞힌 개수: </b><span style="color:var(--primary); font-weight:bold;">${correct}/${total}</span> <b style="margin-left:12px;">정답률: </b><span style="color:var(--primary); font-weight:bold;">${rate}%</span></div></div></div>`;
            } else if (game.list && game.list.length) {
                const totalObj = game.list.filter((q) => !q.isBoss).length;
                const totalSub = game.list.filter((q) => q.isBoss).length;
                const correctObj = game.sessionCorrectObjective || 0;
                const correctSub = game.subjectiveCorrect || 0;
                const total = game.list.length;
                const totalCorrect = correctObj + correctSub;
                const rate = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;
                if (qt === 'objective' || (qt === 'mixed' && totalObj > 0)) {
                    const objRate = totalObj > 0 ? Math.round((correctObj / totalObj) * 100) : 0;
                    recordHtml += '<div class="result-modal-section">📋 객관식</div>';
                    recordHtml += `<div class="result-modal-item"><div style="text-align:right; width:100%;"><div style="font-size:15px; margin-bottom:4px;"><b>맞힌 개수: </b><span style="color:var(--primary); font-weight:bold;">${correctObj}/${totalObj}</span> <b style="margin-left:12px;">정답률: </b><span style="color:var(--primary); font-weight:bold;">${objRate}%</span></div></div></div>`;
                }
                if (qt === 'subjective' || (qt === 'mixed' && totalSub > 0)) {
                    const subRate = totalSub > 0 ? Math.round((correctSub / totalSub) * 100) : 0;
                    recordHtml += '<div class="result-modal-section">✍️ 주관식</div>';
                    recordHtml += `<div class="result-modal-item"><div style="text-align:right; width:100%;"><div style="font-size:15px; margin-bottom:4px;"><b>맞힌 개수: </b><span style="color:var(--primary); font-weight:bold;">${correctSub}/${totalSub}</span> <b style="margin-left:12px;">정답률: </b><span style="color:var(--primary); font-weight:bold;">${subRate}%</span></div></div></div>`;
                }
                if (qt === 'mixed' && total > 0) {
                    recordHtml += '<div class="result-modal-section">📊 전체</div>';
                    recordHtml += `<div class="result-modal-item"><div style="text-align:right; width:100%;"><div style="font-size:15px;"><b>맞힌 개수: </b><span style="color:var(--primary); font-weight:bold;">${totalCorrect}/${total}</span> <b style="margin-left:12px;">정답률: </b><span style="color:var(--primary); font-weight:bold;">${rate}%</span></div></div></div>`;
                }
            }
            resRecordEl.innerHTML = recordHtml;
        }
        if (resWrongEl) {
            const wrongList = game.sessionWrongWords || [];
            if (wrongList.length === 0) {
                resWrongEl.innerHTML =
                    '<div class="result-modal-section">❌ 틀린 단어</div><div class="result-modal-item result-modal-item-empty">없음</div>';
            } else {
                let wrongHtml = '<div class="result-modal-section">❌ 틀린 단어</div>';
                wrongList.forEach((w) => {
                    const word = (w.word || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    const meaning = (w.meaning || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    wrongHtml += `<div class="result-wrong-word-item"><span class="wrong-word">${word}</span> <span class="wrong-meaning">${meaning}</span></div>`;
                });
                resWrongEl.innerHTML = wrongHtml;
            }
        }

        // 보스 모드 최고 wave 기록 저장
        if (game.mode === 'boss' && game.idx > 0) {
            const currentWave = game.idx;
            const today = new Date();
            const dateStr = today.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            const todayISO = today.toISOString().split('T')[0];

            // 기존 데이터와의 호환성
            // 현재 단어장 정보 가져오기
            const bookName =
                typeof window !== 'undefined' && window.currentGameDataName
                    ? window.currentGameDataName
                    : '기본 단어장';

            // 단어장별 통계 초기화
            if (!db.stats.books) {
                db.stats.books = {};
            }
            if (!db.stats.books[bookName]) {
                db.stats.books[bookName] = {
                    solved: 0,
                    correct: 0,
                    objective: { solved: 0, correct: 0 },
                    subjective: { solved: 0, correct: 0, perfectDays: [] },
                    bossMode: { bestWave: 0, bestWaveDate: null },
                };
            }

            const bookStats = db.stats.books[bookName];
            if (!bookStats.bossMode) {
                bookStats.bossMode = { bestWave: 0, bestWaveDate: null };
            }

            // 최고 기록 갱신 (단어장별)
            if (currentWave > bookStats.bossMode.bestWave) {
                bookStats.bossMode.bestWave = currentWave;
                bookStats.bossMode.bestWaveDate = {
                    date: todayISO,
                    displayDate: dateStr,
                };
                db.save();
            }

            // 기존 전역 통계도 유지 (호환성)
            if (!db.stats.bossMode) {
                db.stats.bossMode = { bestWave: 0, bestWaveDate: null };
            }
            if (currentWave > db.stats.bossMode.bestWave) {
                db.stats.bossMode.bestWave = currentWave;
                db.stats.bossMode.bestWaveDate = {
                    date: todayISO,
                    displayDate: dateStr,
                };
            }
            db.save();
        }

        // 주관식 문제를 모두 맞췄는지 확인
        if (game.subjectiveTotal > 0 && game.subjectiveCorrect === game.subjectiveTotal) {
            const today = new Date();
            const dateStr = today.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });

            // 현재 단어장 정보 가져오기
            const bookName =
                typeof window !== 'undefined' && window.currentGameDataName
                    ? window.currentGameDataName
                    : '기본 단어장';

            // 단어장별 통계 초기화
            if (!db.stats.books) {
                db.stats.books = {};
            }
            if (!db.stats.books[bookName]) {
                db.stats.books[bookName] = {
                    solved: 0,
                    correct: 0,
                    objective: { solved: 0, correct: 0 },
                    subjective: { solved: 0, correct: 0, perfectDays: [] },
                    bossMode: { bestWave: 0, bestWaveDate: null },
                };
            }

            const bookStats = db.stats.books[bookName];
            if (!bookStats.subjective) {
                bookStats.subjective = { solved: 0, correct: 0, perfectDays: [] };
            }
            if (!bookStats.subjective.perfectDays) {
                bookStats.subjective.perfectDays = [];
            }

            const day = game.currentDay || 'all';
            const dayLabel =
                day === 'all'
                    ? '전체'
                    : day === 'boss'
                      ? '보스 모드'
                      : dayCatalog[day] && dayCatalog[day].label
                        ? dayCatalog[day].label
                        : `Day ${day}`;

            // 같은 day와 book 조합이 이미 기록되어 있는지 확인 (현재 단어장 내에서)
            const todayISO = today.toISOString().split('T')[0];
            const existingIndex = bookStats.subjective.perfectDays.findIndex((d) => d.day === day);

            if (existingIndex === -1) {
                // 같은 day 조합이 없으면 새로 추가
                bookStats.subjective.perfectDays.push({
                    date: todayISO,
                    displayDate: dateStr,
                    day: day,
                    dayLabel: dayLabel,
                });
            } else {
                // 같은 day 조합이 있으면 최신 날짜로 업데이트
                bookStats.subjective.perfectDays[existingIndex].date = todayISO;
                bookStats.subjective.perfectDays[existingIndex].displayDate = dateStr;
            }

            // 날짜순으로 정렬 (최신이 마지막)
            bookStats.subjective.perfectDays.sort((a, b) => a.date.localeCompare(b.date));

            // 기존 전역 통계도 유지 (호환성)
            if (!db.stats.subjective) {
                db.stats.subjective = { solved: 0, correct: 0 };
            }
            if (!db.stats.subjective.perfectDays) {
                db.stats.subjective.perfectDays = [];
            }
            const globalExistingIndex = db.stats.subjective.perfectDays.findIndex(
                (d) => d.day === day && d.book === bookName
            );
            if (globalExistingIndex === -1) {
                db.stats.subjective.perfectDays.push({
                    date: todayISO,
                    displayDate: dateStr,
                    book: bookName,
                    day: day,
                    dayLabel: dayLabel,
                });
            } else {
                db.stats.subjective.perfectDays[globalExistingIndex].date = todayISO;
                db.stats.subjective.perfectDays[globalExistingIndex].displayDate = dateStr;
            }
            db.stats.subjective.perfectDays.sort((a, b) => a.date.localeCompare(b.date));

            db.save();
        }

        // 게임 상태 완전히 리셋
        game.isProcessing = false;
        game.mode = 'battle';
        game.currentDay = null;
    },
};

// Init
ui.updateGold();
ui.updateVisuals();
ui.updateDurability();
ui.updateMainStats();
ui.updateSkills();

// secret 객체는 scripts/features/admin-tools.js 로 이동됨


// Removed garbage code from secret object extraction

function initSelections() {
    const daySelect = document.getElementById('day-select');
    const practiceDaySelect = document.getElementById('practice-mode-modal-day-select');
    const battleDaySelect = document.getElementById('battle-mode-modal-day-select');

    // Gather days from canonical `dayCatalog` and rawData (avoid referencing legacy `dayInfo`)
    const daysFromData = new Set();
    if (typeof rawData !== 'undefined' && Array.isArray(rawData))
        rawData.forEach((r) => {
            if (r && r.day) daysFromData.add(Number(r.day));
        });

    const infoDays =
        typeof dayCatalog !== 'undefined'
            ? Object.keys(dayCatalog)
                  .filter((k) => !isNaN(Number(k)))
                  .map(Number)
            : [];
    const allDays = new Set([...infoDays, ...Array.from(daysFromData)]);

    const sortedDays = Array.from(allDays)
        .filter((d) => !Number.isNaN(d) && d > 0)
        .sort((a, b) => a - b)
        .filter((d) => d <= 60);

    // Build options
    let html = '';
    sortedDays.forEach((d) => {
        const label =
            dayCatalog && dayCatalog[d] && dayCatalog[d].label ? dayCatalog[d].label : `Day ${d}`;
        html += `<option value="${d}">${label}</option>`;
    });
    const allLabel =
        typeof dayCatalog !== 'undefined' && dayCatalog.all && dayCatalog.all.label
            ? dayCatalog.all.label
            : '전체';
    html += `<option value="all">${allLabel}</option>`;

    // Initialize both selects
    if (daySelect) {
        daySelect.innerHTML = html;
        const last = db.lastSelectedDay || 'all';
        if (Array.from(daySelect.options).some((o) => o.value === String(last))) {
            daySelect.value = last;
        } else {
            daySelect.value = 'all';
            db.lastSelectedDay = 'all';
            db.save();
        }
    }

    if (practiceDaySelect) {
        practiceDaySelect.innerHTML = html;
        const last = db.lastSelectedDay || 'all';
        if (Array.from(practiceDaySelect.options).some((o) => o.value === String(last))) {
            practiceDaySelect.value = last;
        } else {
            practiceDaySelect.value = 'all';
        }
    }

    if (battleDaySelect) {
        battleDaySelect.innerHTML = html;
        const last = db.lastSelectedDay || 'all';
        if (Array.from(battleDaySelect.options).some((o) => o.value === String(last))) {
            battleDaySelect.value = last;
        } else {
            battleDaySelect.value = 'all';
        }
    }
}

/** TTS 재생 시 사용할 음성: Google 계열(en-US) 우선, 없으면 en-US, 그다음 en-* */
function getPreferredTTSVoice() {
    const synth = window.speechSynthesis;
    if (!synth || typeof synth.getVoices !== 'function') return null;
    let voices = synth.getVoices();
    if (!voices.length) return null;
    const enVoices = voices.filter((v) => v.lang.startsWith('en'));
    if (!enVoices.length) return voices[0] || null;
    const google = enVoices.find((v) => /Google/i.test(v.name));
    if (google) return google;
    const enUS = enVoices.find((v) => v.lang === 'en-US');
    if (enUS) return enUS;
    return enVoices[0];
}

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
        const key = `${word.word}|${word.meaning}`;
        const bookName = practiceMemorization.getBookName();
        if (!db.practiceMemorized) db.practiceMemorized = {};
        if (!db.practiceMemorized[bookName]) db.practiceMemorized[bookName] = [];
        const arr = db.practiceMemorized[bookName];
        const idx = arr.indexOf(key);
        if (idx === -1) {
            arr.push(key);
        } else {
            arr.splice(idx, 1);
        }
        db.save();

        // 필터가 전체가 아니면 목록을 다시 계산하고, 현재 인덱스 유지(또는 조정)
        if (practiceMemorization.currentFilter !== 'all') {
            const set = practiceMemorization.getMemorizedSet();
            const pool = practiceMemorization.fullPool;
            if (practiceMemorization.currentFilter === 'memorized') {
                practiceMemorization.words = pool.filter((w) => set.has(`${w.word}|${w.meaning}`));
            } else {
                practiceMemorization.words = pool.filter((w) => !set.has(`${w.word}|${w.meaning}`));
            }
            if (practiceMemorization.currentIndex >= practiceMemorization.words.length) {
                practiceMemorization.currentIndex = Math.max(
                    0,
                    practiceMemorization.words.length - 1
                );
            }
        }

        practiceMemorization.showWord(practiceMemorization.currentIndex);
    },

    start: (day) => {
        console.log('[practiceMemorization.start] day=', day);
        practiceMemorization.currentDay = day;
        practiceMemorization.currentIndex = 0;
        practiceMemorization.currentFilter = 'all';

        // story-modal 닫기 (practice-mode-game을 사용함)

        // 단어 목록 로드
        let pool;
        // 현재 데이터셋의 rawData 사용
        const currentRawData =
            typeof window !== 'undefined' && window.rawDataData ? window.rawDataData : rawData;
        if (day === 'all') {
            pool = currentRawData;
        } else {
            const dayNum = Number(day);
            pool = currentRawData.filter((i) => Number(i.day) === dayNum);
        }

        if (pool.length === 0) {
            alert('데이터가 없습니다.');
            return;
        }

        practiceMemorization.fullPool = [...pool];
        practiceMemorization.applyFilter('all');

        // 암기 화면 표시
        setTimeout(() => {
            const memorizationScreen = document.getElementById('practice-mode-game');
            if (memorizationScreen) {
                // title-screen의 z-index 조정하여 backdrop-filter가 작동하도록 함
                const startScreen = document.getElementById('title-screen');
                if (startScreen) {
                    startScreen.style.zIndex = '100'; // practice-mode-game(z-index: 200) 뒤에 위치
                }

                // openScreenOverlay를 사용하여 화면 표시
                openScreenOverlay('practice-mode-game', true);

                // 타이틀 이미지 크기에 맞춰 연습 모드 크기 동기화
                syncGameScreenSizeToTitle();

                // 히스토리 상태 추가 (백버튼 처리용)
                history.pushState({ screen: 'practice-memorization' }, '', window.location.href);

                // 첫 번째 단어 표시
                practiceMemorization.showWord(0);

                // 배경음악 재생
                playMusic('practice');
            }
        }, 400);
    },

    showWord: (index) => {
        if (index < 0 || index >= practiceMemorization.words.length) {
            return;
        }

        practiceMemorization.currentIndex = index;
        const word = practiceMemorization.words[index];

        // Day 정보 표시
        const dayInfoEl = document.getElementById('practice-memorization-day-info');
        if (dayInfoEl) {
            let dayLabel;
            if (practiceMemorization.currentDay === 'all') {
                dayLabel = '전체';
            } else {
                dayLabel = `Day ${practiceMemorization.currentDay}`;
            }
            dayInfoEl.textContent = dayLabel;
        }

        // 단어 번호 표시
        const counterEl = document.getElementById('practice-word-counter');
        if (counterEl) {
            counterEl.textContent = `${index + 1} / ${practiceMemorization.words.length}`;
        }

        // 영어 단어 표시
        const wordTextEl = document.getElementById('practice-word-text');
        if (wordTextEl) {
            wordTextEl.textContent = word.word || 'N/A';
        }

        // 연습 모드: 옵션 켜져 있으면 단어가 바뀔 때마다 바로 재생, 꺼져 있으면 재생 안 함
        if (
            db.settings &&
            db.settings.wordRead !== false &&
            word.word &&
            typeof window.speechSynthesis !== 'undefined'
        ) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(word.word);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            const preferredVoice = getPreferredTTSVoice();
            if (preferredVoice) utterance.voice = preferredVoice;
            window.speechSynthesis.speak(utterance);
        }

        // 한글 뜻 표시
        const meaningTextEl = document.getElementById('practice-meaning-text');
        if (meaningTextEl) {
            meaningTextEl.textContent = word.meaning || 'N/A';
        }

        // 설명 표시 (기본: 영문, 탭 시 한/영 전환)
        practiceMemorization.showKoreanExplanation = false;
        const explanationTextEl = document.getElementById('practice-explanation-text');
        if (explanationTextEl) {
            explanationTextEl.textContent = word.englishExplanation || 'N/A';
        }

        // 외웠어요 버튼 상태 (현재 단어가 외운 목록에 있으면 활성 표시)
        const memorizedBtn = document.getElementById('practice-memorized-btn');
        if (memorizedBtn) {
            const set = practiceMemorization.getMemorizedSet();
            const key = `${word.word}|${word.meaning}`;
            const isMemorized = set.has(key);
            memorizedBtn.classList.toggle('practice-memorized-active', isMemorized);
            memorizedBtn.textContent = '외웠어요';
        }

        // 버튼 상태 업데이트
        const prevBtn = document.getElementById('practice-prev-btn');
        const nextBtn = document.getElementById('practice-next-btn');

        if (prevBtn) {
            prevBtn.disabled = index === 0;
        }
        if (nextBtn) {
            nextBtn.disabled = index === practiceMemorization.words.length - 1;
        }
    },

    /** 설명 영역 탭: 영문(englishExplanation) ↔ 한글(koreanExplanation) 전환 */
    toggleExplanation: () => {
        if (
            practiceMemorization.words.length === 0 ||
            practiceMemorization.currentIndex < 0 ||
            practiceMemorization.currentIndex >= practiceMemorization.words.length
        )
            return;
        const word = practiceMemorization.words[practiceMemorization.currentIndex];
        practiceMemorization.showKoreanExplanation = !practiceMemorization.showKoreanExplanation;
        const explanationTextEl = document.getElementById('practice-explanation-text');
        if (explanationTextEl) {
            explanationTextEl.textContent = practiceMemorization.showKoreanExplanation
                ? word.koreanExplanation || 'N/A'
                : word.englishExplanation || 'N/A';
        }
    },

    /** 현재 단어 음성 재생 (아이콘 클릭 시) */
    playCurrentWord: () => {
        if (
            practiceMemorization.words.length === 0 ||
            practiceMemorization.currentIndex < 0 ||
            practiceMemorization.currentIndex >= practiceMemorization.words.length
        )
            return;
        const word = practiceMemorization.words[practiceMemorization.currentIndex];
        if (!word.word || typeof window.speechSynthesis === 'undefined') return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(word.word);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        const preferredVoice = getPreferredTTSVoice();
        if (preferredVoice) utterance.voice = preferredVoice;
        window.speechSynthesis.speak(utterance);
    },

    prevWord: () => {
        if (practiceMemorization.currentIndex > 0) {
            practiceMemorization.showWord(practiceMemorization.currentIndex - 1);
        }
    },

    nextWord: () => {
        if (practiceMemorization.currentIndex < practiceMemorization.words.length - 1) {
            practiceMemorization.showWord(practiceMemorization.currentIndex + 1);
        }
    },

    exit: () => {
        if (typeof window.speechSynthesis !== 'undefined') {
            window.speechSynthesis.cancel();
        }
        const memorizationScreen = document.getElementById('practice-mode-game');
        if (memorizationScreen) {
            // 다른 화면들도 모두 닫기
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

            otherScreens.forEach((screenId) => {
                const screen = document.getElementById(screenId);
                if (screen && screen.style.display !== 'none') {
                    closeScreenOverlay(screenId, false);
                }
            });

            // practice-mode-game 닫기
            closeScreenOverlay('practice-mode-game', true);

            // 음악 정지 및 오버레이 숨기기
            setTimeout(() => {
                const bgMusic = document.getElementById('background-music');
                if (bgMusic && !bgMusic.paused) {
                    bgMusic.pause();
                    bgMusic.currentTime = 0;
                }
                const musicInfoOverlay = document.getElementById('practice-music-info-overlay');
                if (musicInfoOverlay) musicInfoOverlay.style.display = 'none';

                const startScreen = document.getElementById('title-screen');
                if (startScreen) {
                    startScreen.style.display = 'flex';
                    startScreen.classList.remove('closing');

                    // 버튼 오버레이 동기화
                    setTimeout(() => {
                        if (typeof syncTitleButtonOverlay === 'function') {
                            syncTitleButtonOverlay();
                        }
                    }, 100);
                }
                history.pushState(null, '', window.location.href);
            }, 400);
        }
    },
};

// Open practice mode selection modal
function openPracticeModal() {
    const modal = document.getElementById('practice-mode-modal');
    const modalDaySelect = document.getElementById('practice-mode-modal-day-select');
    const modalCountSelect = document.getElementById('practice-mode-modal-count-select');
    const modalImg = document.getElementById('practice-mode-modal-background-img');

    if (!modal) return;

    // Enable day selection for practice mode
    if (modalDaySelect) {
        modalDaySelect.disabled = false;
        modalDaySelect.style.display = ''; // Show day selection for practice mode
    }

    // Practice 모드는 암기 모드이므로 난이도 선택 숨기기
    if (modalCountSelect) {
        modalCountSelect.style.display = 'none';
    }

    // Restore last selected values
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

    // 드롭박스 값 변경 시 폰트 크기 재조정
    // setupSelectFontSizeAdjustment('practice-mode-modal');
}

// Open battle mode selection modal
function openBattleModeModal() {
    const modal = document.getElementById('battle-mode-modal');
    const modalDaySelect = document.getElementById('battle-mode-modal-day-select');
    const modalCountSelect = document.getElementById('battle-mode-modal-count-select');
    const modalImg = document.getElementById('battle-mode-modal-background-img');
    const questionTypeGroup = document.getElementById('battle-mode-modal-question-type-group');

    if (!modal) return;

    // For battle mode, allow day selection
    if (modalDaySelect) {
        // 기본값을 'all'로 설정하되 사용자가 변경 가능
        const lastDay = db.lastSelectedDay || 'all';
        if (Array.from(modalDaySelect.options).some((o) => o.value === String(lastDay))) {
            modalDaySelect.value = lastDay;
        } else {
            modalDaySelect.value = 'all';
        }
        modalDaySelect.style.display = ''; // Show day selection
        modalDaySelect.disabled = false; // Enable day selection for battle mode
    }

    const lastCount = parseInt(localStorage.getItem('v7_last_count')) || 10;
    if (modalCountSelect) {
        modalCountSelect.value = String(lastCount);
    }

    // Show question type radio buttons for battle mode
    if (questionTypeGroup) {
        questionTypeGroup.style.display = 'flex';
        // Load last selected question type or default to 'mixed'
        const lastQuestionType = localStorage.getItem('v7_last_question_type') || 'mixed';
        const radio = questionTypeGroup.querySelector(`input[value="${lastQuestionType}"]`);
        if (radio) {
            radio.checked = true;
        } else {
            // Default to 'mixed' if saved value is invalid
            const mixedRadio = questionTypeGroup.querySelector('input[value="mixed"]');
            if (mixedRadio) mixedRadio.checked = true;
        }

        // Update checked class for all radio labels
        const allRadios = questionTypeGroup.querySelectorAll('input[name="battle-question-type"]');
        const allLabels = questionTypeGroup.querySelectorAll('.modal-radio-label');
        allLabels.forEach((label) => label.classList.remove('checked'));
        allRadios.forEach((radio) => {
            if (radio.checked) {
                radio.closest('.modal-radio-label')?.classList.add('checked');
            }
        });

        // Add event listeners for radio button changes
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

    // 드롭박스 값 변경 시 폰트 크기 재조정
    // setupSelectFontSizeAdjustment('battle-mode-modal');
}


// Removed modal functions (moved to modal-manager.js)


// 랜덤 타이틀 헤더 로딩
function loadRandomTitleHeader() {
    const titleHeaderImg = document.getElementById('title-header-img');
    if (!titleHeaderImg) {
        console.warn('title-header-img element not found');
        return;
    }

    // 1~4 사이의 랜덤 숫자 생성 (title_header_5, 6 제거됨)
    const randomNum = Math.floor(Math.random() * 4) + 1;
    const imagePath = `images/title/title_header_${randomNum}.webp`;

    console.log('Loading random title header:', imagePath);

    // 이미지 소스 설정
    titleHeaderImg.src = imagePath;

    // 이미지가 보이도록 명시적으로 설정
    titleHeaderImg.style.display = 'block';
    titleHeaderImg.style.visibility = 'visible';
    titleHeaderImg.style.opacity = '1';
}

// Sync button overlay to match title.webp image size exactly
function syncTitleButtonOverlay() {
    const titleImg = document.querySelector('.title-background');
    const overlay = document.querySelector('.title-buttons-overlay');
    const container = document.querySelector('.title-container-wrapper');
    const titleHeader = document.querySelector('.title-header');

    if (!titleImg || !overlay || !container) return;

    // 이미지 자연 크기 기준으로 화면에 보이는 렌더링 크기 계산
    let imgWidth = 0;
    let imgHeight = 0;
    const naturalW = titleImg.naturalWidth || 0;
    const naturalH = titleImg.naturalHeight || 0;
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    if (naturalW > 0 && naturalH > 0) {
        // 이미지 비율을 유지하면서 화면에 맞는 크기 계산
        const scale = Math.min(vw / naturalW, vh / naturalH);
        imgWidth = Math.floor(naturalW * scale);
        imgHeight = Math.floor(naturalH * scale);
    } else {
        // 자연 크기를 모를 때는 현재 렌더링 크기 사용
        const imgRect = titleImg.getBoundingClientRect();
        imgWidth = Math.floor(imgRect.width || vw);
        imgHeight = Math.floor(imgRect.height || vh);
    }

    // 컨테이너 크기를 타이틀 이미지 렌더링 크기에 맞춰 고정
    container.style.setProperty('--title-container-width', imgWidth + 'px');
    container.style.setProperty('--title-container-height', imgHeight + 'px');
    container.style.width = imgWidth + 'px';
    container.style.height = imgHeight + 'px';

    // 전역 CSS 변수로도 설정 (다른 팝업들이 참조할 수 있도록)
    document.documentElement.style.setProperty('--title-container-width', imgWidth + 'px');
    document.documentElement.style.setProperty('--title-container-height', imgHeight + 'px');

    // 타이틀 이미지는 contain으로 비율 유지하며 표시 (CSS에서 처리)
    // 오버레이는 컨테이너 전체를 사용 (0,0 ~ 100%)
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.left = '0';
    overlay.style.top = '0';

    // Keep game screen size in sync with the title image size
    syncGameScreenSizeToTitle();

    // 팝업도 타이틀 크기에 맞춰 동기화
    syncModalButtonOverlay('practice-mode-modal');
    syncModalButtonOverlay('battle-mode-modal');
}

function syncGameScreenSizeToTitle() {
    const titleImg = document.querySelector('.title-background');
    const gameScreen = document.getElementById('battle-mode-game');
    const practiceScreen = document.getElementById('practice-mode-game');
    if (!titleImg) return;

    const naturalW = titleImg.naturalWidth || 0;
    const naturalH = titleImg.naturalHeight || 0;
    if (!naturalW || !naturalH) return;

    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const scale = Math.min(vw / naturalW, vh / naturalH);

    const w = Math.floor(naturalW * scale);
    const h = Math.floor(naturalH * scale);

    if (gameScreen) {
        gameScreen.style.width = w + 'px';
        gameScreen.style.height = h + 'px';
    }

    if (practiceScreen) {
        practiceScreen.style.width = w + 'px';
        practiceScreen.style.height = h + 'px';
    }
}

/**
 * Plays a specific background music track and sets up the ended event listener.
 * This is an internal helper function.
 * @param {number} musicNum The number of the music track (1-indexed).
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

    // Render music select options every time a song is played or changed
    ui.renderMusicSelectOptions(selectId, musicNum);

    if (musicInfoOverlay && musicFilenameEl) {
        musicFilenameEl.innerText = filename;
        musicInfoOverlay.style.display = 'block';
    }

    bgMusic.play().catch((err) => {
        console.log('Background music play failed:', err);
        // If autoplay fails, hide the overlay as no music is playing
        if (musicInfoOverlay) musicInfoOverlay.style.display = 'none';
    });

    // Set up onended event listener to play the next music in sequence
    bgMusic.onended = () => {
        playNextMusic(mode);
    };
}

/**
 * Initiates background music playback for a given mode, starting from the current index.
 * If the music is already playing, it will continue.
 * @param {string} mode 'battle' | 'practice'
 */
function playMusic(mode) {
    if (!currentMusicIndices[mode]) {
        currentMusicIndices[mode] = 1; // Default to first track if not set
    }

    // Ensure the current track is unlocked. If not, find the first unlocked track.
    if (!db.settings.unlockedMusicTracks.includes(currentMusicIndices[mode])) {
        // Find the first unlocked track, fallback to 1 if no tracks are unlocked
        currentMusicIndices[mode] = db.settings.unlockedMusicTracks[0] || 1;
    }

    _playMusic(currentMusicIndices[mode], mode);
}

/**
 * Plays the next background music track in sequence for a given mode.
 * @param {string} mode 'battle' | 'practice'
 */
function playNextMusic(mode) {
    let nextMusicNumCandidate = currentMusicIndices[mode];
    let originalMusicNum = currentMusicIndices[mode];
    let foundNextUnlocked = false;

    // Iterate through all possible music numbers to find the next unlocked one
    for (let i = 0; i < currentMusicIndices.max; i++) {
        nextMusicNumCandidate++;
        if (nextMusicNumCandidate > currentMusicIndices.max) {
            nextMusicNumCandidate = 1; // Loop back to the beginning
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
                    }
                }
            });
        }
    });
}

window.onload = () => {
    // Validate dayCatalog coverage after all data is loaded
    if (typeof dayCatalog !== 'undefined' && typeof dayCatalog.validateCoverage === 'function') {
        dayCatalog.validateCoverage();
    }
    secret.init();
    setupMusicSelectListeners();
    inventory.render();
    initSelections();

    // Sync button overlay to image size (먼저 CSS 변수 설정)
    const titleImg = document.querySelector('.title-background');
    if (titleImg) {
        // 이미지가 로드되어 있으면 즉시 동기화
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

    // 랜덤 타이틀 헤더 로딩 (CSS 변수 설정 후)
    setTimeout(() => {
        loadRandomTitleHeader();
    }, 100);

    // Sync on window resize (컨테이너 크기를 화면에 맞춰 동적으로 조정)
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            syncTitleButtonOverlay();
        }, 100);
    });

    // Add event listeners for buttons (with error handling)
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

    try {
        const bossModeBtn = document.getElementById('boss-mode-btn');
        if (bossModeBtn) {
            bossModeBtn.addEventListener('click', () => story.startBossDirectly());
        }
    } catch (e) {
        console.error('Error setting up boss-mode-btn:', e);
    }

    // Connect title image button areas to actual buttons
    const titlePracticeBtn = document.getElementById('title-practice-btn'); // PRACTICE MODE
    const titleBattleModeBtn = document.getElementById('title-battle-mode-btn'); // BATTLE MODE
    const titleBossModeBtn = document.getElementById('title-boss-mode-btn'); // BOSS MODE
    const titleShopBtn = document.getElementById('title-shop-btn'); // SHOP
    const titleInventoryBtn = document.getElementById('title-inventory-btn'); // INVENTORY
    const titleStatisticsBtn = document.getElementById('title-statistics-btn'); // STATISTICS
    const titleSettingBtn = document.getElementById('title-setting-btn'); // SETTING (일반설정)

    console.log('[Button Setup] titlePracticeBtn:', titlePracticeBtn);
    console.log('[Button Setup] titleBattleModeBtn:', titleBattleModeBtn);
    console.log('[Button Setup] titleBossModeBtn:', titleBossModeBtn);

    // Practice 버튼 설정
    if (titlePracticeBtn) {
        try {
            // 기존 이벤트 리스너 제거 후 재등록
            titlePracticeBtn.onclick = null;
            // 모든 이벤트 리스너 제거
            const newBtn = titlePracticeBtn.cloneNode(true);
            titlePracticeBtn.parentNode.replaceChild(newBtn, titlePracticeBtn);
            const freshPracticeBtn = document.getElementById('title-practice-btn');

            if (freshPracticeBtn) {
                freshPracticeBtn.style.pointerEvents = 'auto';
                freshPracticeBtn.style.zIndex = '25';
                freshPracticeBtn.style.cursor = 'pointer';
                // 버튼 내부 이미지도 클릭 가능하도록 설정
                const btnImage = freshPracticeBtn.querySelector('.btn-image');
                if (btnImage) {
                    btnImage.style.pointerEvents = 'none';
                }
                // 버튼 자체와 모든 자식 요소에 클릭 이벤트 추가
                freshPracticeBtn.addEventListener(
                    'click',
                    (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Practice Mode button clicked');
                        if (typeof openPracticeModal === 'function') {
                            openPracticeModal();
                        } else {
                            console.error('openPracticeModal function not found');
                        }
                    },
                    { capture: true }
                );
                console.log('[Button Setup] Practice button event listener added');
            }
        } catch (e) {
            console.error('Error setting up practice button:', e);
        }
    } else {
        console.warn('title-practice-btn not found');
    }

    // Practice Setting Modal event listeners
    const practiceStartBtn = document.getElementById('practice-mode-modal-start-btn');
    const practiceCancelBtn = document.getElementById('practice-mode-modal-cancel-btn');
    const practiceDaySelect = document.getElementById('practice-mode-modal-day-select');
    const practiceCountSelect = document.getElementById('practice-mode-modal-count-select');

    if (practiceStartBtn) {
        practiceStartBtn.addEventListener('click', () => {
            const selectedDay = practiceDaySelect ? practiceDaySelect.value : 'all';
            const countValue = practiceCountSelect ? practiceCountSelect.value : '10';
            const selectedCount = countValue === 'all' ? 'all' : parseInt(countValue) || 10;

            // Save selections
            db.lastSelectedDay = selectedDay;
            localStorage.setItem('v7_last_count', selectedCount);
            db.save();

            // Update hidden selects for compatibility
            const daySelect = document.getElementById('day-select');
            const countSelect = document.getElementById('count-select');
            if (daySelect) daySelect.value = selectedDay;
            if (countSelect) countSelect.value = String(selectedCount);

            // 시작화면 숨기기 (검정 배경만 보이도록)
            const startScreen = document.getElementById('title-screen');
            if (startScreen) {
                startScreen.style.display = 'none';
            }

            // Close modal with animation and start memorization mode directly
            closePracticeModal(true);

            // 애니메이션이 완료된 후 암기 모드로 바로 시작 (practice-mode-game으로 바로 이동)
            setTimeout(() => {
                practiceMemorization.start(selectedDay);
            }, 400); // 애니메이션 시간과 일치
        });
    }

    if (practiceCancelBtn) {
        practiceCancelBtn.addEventListener('click', () => {
            closePracticeModal();
        });
    }

    // Practice Memorization Mode button event listeners
    const practicePrevBtn = document.getElementById('practice-prev-btn');
    const practiceNextBtn = document.getElementById('practice-next-btn');
    const practiceExitBtn = document.getElementById('practice-exit-btn');

    if (practicePrevBtn) {
        practicePrevBtn.addEventListener('click', () => {
            practiceMemorization.prevWord();
        });
    }

    if (practiceNextBtn) {
        practiceNextBtn.addEventListener('click', () => {
            practiceMemorization.nextWord();
        });
    }

    if (practiceExitBtn) {
        practiceExitBtn.addEventListener('click', () => {
            practiceMemorization.exit();
        });
    }

    const battleExitBtn = document.getElementById('battle-exit-btn');
    if (battleExitBtn) {
        battleExitBtn.addEventListener('click', () => {
            game.exit();
        });
    }

    // 연습 모드: 초이스 칩 (전체보기 / 외운단어 / 못외운단어)
    const practiceFilterChips = document.getElementById('practice-filter-chips');
    if (practiceFilterChips) {
        practiceFilterChips.addEventListener('click', (e) => {
            const chip = e.target.closest('.practice-chip');
            if (!chip || practiceMemorization.fullPool.length === 0) return;
            const filter = chip.getAttribute('data-filter');
            if (filter) practiceMemorization.applyFilter(filter);
        });
    }

    // 연습 모드: 외웠어요 버튼
    const practiceMemorizedBtn = document.getElementById('practice-memorized-btn');
    if (practiceMemorizedBtn) {
        practiceMemorizedBtn.addEventListener('click', () => {
            practiceMemorization.toggleMemorized();
        });
    }

    const practiceSpeakBtn = document.getElementById('practice-speak-btn');
    if (practiceSpeakBtn) {
        practiceSpeakBtn.addEventListener('click', () => {
            practiceMemorization.playCurrentWord();
        });
    }

    // 연습 모드: 설명 영역 클릭/터치 시 한/영 전환
    const practiceExplanationSection = document.getElementById('practice-explanation-section');
    if (practiceExplanationSection) {
        practiceExplanationSection.addEventListener('click', () => {
            practiceMemorization.toggleExplanation();
        });
    }

    // Battle Setting Modal event listeners
    const battleStartBtn = document.getElementById('battle-mode-modal-start-btn');
    const battleCancelBtn = document.getElementById('battle-mode-modal-cancel-btn');
    const battleDaySelect = document.getElementById('battle-mode-modal-day-select');
    const battleCountSelect = document.getElementById('battle-mode-modal-count-select');

    if (battleStartBtn) {
        battleStartBtn.addEventListener('click', () => {
            const selectedDay = battleDaySelect ? battleDaySelect.value : 'all';
            const countValue = battleCountSelect ? battleCountSelect.value : '10';
            const selectedCount = countValue === 'all' ? 'all' : parseInt(countValue) || 10;

            // Get selected question type for battle mode
            let selectedQuestionType = 'mixed'; // default
            const questionTypeGroup = document.getElementById(
                'battle-mode-modal-question-type-group'
            );
            if (questionTypeGroup) {
                const checkedRadio = questionTypeGroup.querySelector(
                    'input[name="battle-question-type"]:checked'
                );
                if (checkedRadio) {
                    selectedQuestionType = checkedRadio.value;
                }
            }
            // Save question type preference
            localStorage.setItem('v7_last_question_type', selectedQuestionType);

            // Save selections
            db.lastSelectedDay = selectedDay;
            localStorage.setItem('v7_last_count', selectedCount);
            db.save();

            // Store question type for game.init to use
            game.battleQuestionType = selectedQuestionType;

            // Update hidden selects for compatibility
            const daySelect = document.getElementById('day-select');
            const countSelect = document.getElementById('count-select');
            if (daySelect) daySelect.value = selectedDay;
            if (countSelect) countSelect.value = String(selectedCount);

            // 시작화면 숨기기 (검정 배경만 보이도록)
            const startScreen = document.getElementById('title-screen');
            if (startScreen) {
                startScreen.style.display = 'none';
            }

            // Close modal with animation and start game
            closePracticeModal(true);

            // 애니메이션이 완료된 후 게임 시작
            setTimeout(() => {
                story.startIntro('battle', selectedDay);
            }, 400); // 애니메이션 시간과 일치
        });
    }

    if (battleCancelBtn) {
        battleCancelBtn.addEventListener('click', () => {
            closePracticeModal();
        });
    }
    // Battle Mode 버튼 설정
    if (titleBattleModeBtn) {
        try {
            titleBattleModeBtn.style.pointerEvents = 'auto';
            titleBattleModeBtn.style.zIndex = '25';
            titleBattleModeBtn.style.cursor = 'pointer';

            // 버튼 내부 이미지도 클릭 가능하도록 설정 (이벤트 버블링 허용)
            const btnImage = titleBattleModeBtn.querySelector('.btn-image');
            if (btnImage) {
                btnImage.style.pointerEvents = 'none';
            }

            // 기존 리스너 제거 방식 대신, onclick 프로퍼티를 사용하여 단일 리스너 보장하거나
            // 모듈 패턴 내에서 초기화 함수가 한 번만 호출되도록 보장하는 것이 좋음.
            // 여기서는 안전하게 onclick을 재정의하는 방식으로 변경 (클론 노드 방식 제거)
            titleBattleModeBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Battle Mode button clicked');
                if (typeof openBattleModeModal === 'function') {
                    openBattleModeModal();
                } else {
                    console.error('openBattleModeModal function not found');
                }
            };

            // 터치 이벤트에 대한 명시적 처리 추가 (Android 호환성)
            titleBattleModeBtn.ontouchstart = (e) => {
                // 터치 시 스크롤 등 기본 동작 방지하고 클릭으로 처리될 수 있게 함
                // 단, 스크롤이 필요한 영역이 아니므로 preventDefault 무방
                // e.preventDefault(); // 일부 기기에서 클릭 이벤트 발생을 막을 수 있으므로 주의
                e.stopPropagation();
            };

            console.log('[Button Setup] Battle Mode button event listener added');
        } catch (e) {
            console.error('Error setting up battle mode button:', e);
        }
    } else {
        console.warn('title-battle-mode-btn not found');
    }

    // Boss Mode 버튼 설정
    if (titleBossModeBtn) {
        try {
            titleBossModeBtn.style.pointerEvents = 'auto';
            titleBossModeBtn.style.zIndex = '25';
            titleBossModeBtn.style.cursor = 'pointer';

            const btnImage = titleBossModeBtn.querySelector('.btn-image');
            if (btnImage) {
                btnImage.style.pointerEvents = 'none';
            }

            titleBossModeBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Boss Mode button clicked');
                if (typeof story !== 'undefined' && typeof story.startBossDirectly === 'function') {
                    story.startBossDirectly();
                } else {
                    console.error('story.startBossDirectly function not found');
                }
            };

            titleBossModeBtn.ontouchstart = (e) => {
                e.stopPropagation();
            };

            console.log('[Button Setup] Boss Mode button event listener added');
        } catch (e) {
            console.error('Error setting up boss mode button:', e);
        }
    } else {
        console.warn('title-boss-mode-btn not found');
    }
    if (titleShopBtn) {
        titleShopBtn.onclick = null;
        titleShopBtn.addEventListener(
            'click',
            (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Shop button clicked');
                if (typeof shop !== 'undefined' && typeof shop.open === 'function') {
                    shop.open();
                } else {
                    console.error('shop.open function not found');
                }
            },
            { capture: true }
        );
    } else {
        console.warn('title-shop-btn not found');
    }
    if (titleInventoryBtn) {
        titleInventoryBtn.onclick = null;
        titleInventoryBtn.addEventListener(
            'click',
            (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Inventory button clicked');
                if (typeof inventory !== 'undefined' && typeof inventory.open === 'function') {
                    inventory.open();
                } else {
                    console.error('inventory.open function not found');
                }
            },
            { capture: true }
        );
    } else {
        console.warn('title-inventory-btn not found');
    }
    if (titleStatisticsBtn) {
        titleStatisticsBtn.onclick = null;
        titleStatisticsBtn.addEventListener(
            'click',
            (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Statistics button clicked');
                if (typeof statistics !== 'undefined' && typeof statistics.open === 'function') {
                    statistics.open();
                } else {
                    console.error('statistics.open function not found');
                }
            },
            { capture: true }
        );
    } else {
        console.warn('title-statistics-btn not found');
    }
    if (titleSettingBtn) {
        titleSettingBtn.onclick = null;
        titleSettingBtn.addEventListener(
            'click',
            (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Setting button clicked');
                if (typeof secret !== 'undefined' && typeof secret.open === 'function') {
                    secret.open();
                } else {
                    console.error('secret.open function not found');
                }
            },
            { capture: true }
        );
    } else {
        console.warn('title-setting-btn not found');
    }

    // Modal 이미지 로드 후 버튼 오버레이 동기화
    const practiceModeModalImg = document.getElementById('practice-mode-modal-background-img');
    const battleModeModalImg = document.getElementById('battle-mode-modal-background-img');

    if (practiceModeModalImg) {
        if (practiceModeModalImg.complete) {
            syncModalButtonOverlay('practice-mode-modal');
        } else {
            practiceModeModalImg.addEventListener('load', () =>
                syncModalButtonOverlay('practice-mode-modal')
            );
        }
    }

    if (battleModeModalImg) {
        if (battleModeModalImg.complete) {
            syncModalButtonOverlay('battle-mode-modal');
        } else {
            battleModeModalImg.addEventListener('load', () =>
                syncModalButtonOverlay('battle-mode-modal')
            );
        }
    }

    // 팝업이 열려있을 때만 resize 이벤트 처리
    let modalResizeTimeout;
    const modalResizeHandler = () => {
        const practiceModeModal = document.getElementById('practice-mode-modal');
        const battleModeModal = document.getElementById('battle-mode-modal');
        if (
            practiceModeModal &&
            practiceModeModal.style.display !== 'none' &&
            practiceModeModal.style.display !== ''
        ) {
            clearTimeout(modalResizeTimeout);
            modalResizeTimeout = setTimeout(() => {
                syncModalButtonOverlay('practice-mode-modal');
            }, 100);
        } else if (
            battleModeModal &&
            battleModeModal.style.display !== 'none' &&
            battleModeModal.style.display !== ''
        ) {
            clearTimeout(modalResizeTimeout);
            modalResizeTimeout = setTimeout(() => {
                syncModalButtonOverlay('battle-mode-modal');
            }, 100);
        }
    };
    window.addEventListener('resize', modalResizeHandler);

    // Story screen resize handler
    let storyResizeTimeout;
    const storyResizeHandler = () => {
        const battleModeStoryScreen = document.getElementById('battle-mode-story-modal');
        const bossStoryScreen = document.getElementById('boss-mode-story-modal');
        if (
            battleModeStoryScreen &&
            battleModeStoryScreen.style.display !== 'none' &&
            battleModeStoryScreen.style.display !== ''
        ) {
            clearTimeout(storyResizeTimeout);
            storyResizeTimeout = setTimeout(() => {
                syncStoryButtonOverlay('battle-mode-story-modal');
            }, 100);
        } else if (
            bossStoryScreen &&
            bossStoryScreen.style.display !== 'none' &&
            bossStoryScreen.style.display !== ''
        ) {
            clearTimeout(storyResizeTimeout);
            storyResizeTimeout = setTimeout(() => {
                syncStoryButtonOverlay('boss-mode-story-modal');
            }, 100);
        }
    };
    window.addEventListener('resize', storyResizeHandler);

    // 결과 화면 닫기 함수
    window.closeResultScreen = function () {
        closeScreenOverlay('result-modal', true);

        // story-modal 완전히 초기화
        const battleModeStoryScreen = document.getElementById('battle-mode-story-modal');
        const bossStoryScreen = document.getElementById('boss-mode-story-modal');
        if (battleModeStoryScreen) {
            battleModeStoryScreen.style.display = 'none';
            battleModeStoryScreen.style.visibility = '';
            battleModeStoryScreen.style.opacity = '';
            battleModeStoryScreen.style.zIndex = '';
            battleModeStoryScreen.style.pointerEvents = '';
            battleModeStoryScreen.classList.remove('closing');

            // 배경 이미지 초기화
            const storyImg = document.getElementById('battle-mode-background-img');
            if (storyImg) {
                storyImg.src = 'images/battle_mode/battle_mode_story_modal.webp';
            }

            // 버튼 초기화
            const storyStartBtn = document.getElementById('battle-mode-start-btn');
            if (storyStartBtn) {
                storyStartBtn.classList.add('boss-mode-btn');
                storyStartBtn.classList.remove('practice-btn');
                storyStartBtn.style.pointerEvents = '';
                storyStartBtn.onclick = null;
            }
        }
        if (bossStoryScreen) {
            bossStoryScreen.style.display = 'none';
            bossStoryScreen.style.visibility = '';
            bossStoryScreen.style.opacity = '';
            bossStoryScreen.style.zIndex = '';
            bossStoryScreen.style.pointerEvents = '';
            bossStoryScreen.classList.remove('closing');

            // 배경 이미지 초기화
            const storyImg = document.getElementById('boss-mode-background-img');
            if (storyImg) {
                storyImg.src = 'images/battle_mode/battle_mode_story_modal.webp';
            }

            // 버튼 초기화
            const storyStartBtn = document.getElementById('boss-mode-start-btn');
            if (storyStartBtn) {
                storyStartBtn.classList.add('boss-mode-btn');
                storyStartBtn.classList.remove('practice-btn');
                storyStartBtn.style.pointerEvents = '';
                storyStartBtn.onclick = null;
            }
        }

        // practice-mode-modal과 battle-mode-modal 초기화
        const practiceModeModal = document.getElementById('practice-mode-modal');
        const battleModeModal = document.getElementById('battle-mode-modal');
        if (practiceModeModal) {
            practiceModeModal.style.display = 'none';
            practiceModeModal.style.visibility = '';
            practiceModeModal.style.opacity = '';
            practiceModeModal.style.zIndex = '';
            practiceModeModal.style.pointerEvents = '';
            practiceModeModal.classList.remove('closing');
        }
        if (battleModeModal) {
            battleModeModal.style.display = 'none';
            battleModeModal.style.visibility = '';
            battleModeModal.style.opacity = '';
            battleModeModal.style.zIndex = '';
            battleModeModal.style.pointerEvents = '';
            battleModeModal.classList.remove('closing');
        }

        // battle-mode-game도 확실히 닫기
        const gameScreen = document.getElementById('battle-mode-game');
        if (gameScreen) {
            gameScreen.style.display = 'none';
        }

        setTimeout(() => {
            openScreenOverlay('title-screen', false);
            // 랜덤 타이틀 헤더 다시 로딩
            loadRandomTitleHeader();
            // 버튼 오버레이 동기화
            if (typeof syncTitleButtonOverlay === 'function') {
                syncTitleButtonOverlay();
            }
        }, 400);
        history.pushState(null, '', window.location.href);
    };
};
