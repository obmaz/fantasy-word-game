// ============================================================
// 게임 엔진
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
        // day 값을 정규화하고 날짜 간 데이터 누출을 방지하기 위해 숫자 값을 엄격하게 일치시킴
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

    // More methods to be added...
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
