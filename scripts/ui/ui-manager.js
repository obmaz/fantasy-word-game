/**
 * UI 관리 시스템
 * 게임 UI 업데이트 및 렌더링 관리
 */

const ui = {
    /**
     * 골드 표시를 업데이트합니다
     */
    updateGold: () => {
        const titleGold = document.getElementById('title-ui-gold');
        if (titleGold) titleGold.innerText = db.gold;
        const overlayGold = document.getElementById('overlay-gold');
        if (overlayGold) overlayGold.innerText = db.gold;
    },

    /**
     * 게임 정보 배지를 업데이트합니다
     * @param {string} mode - 게임 모드
     * @param {string|number} day - Day 값
     */
    updateGameInfo: (mode, day) => {
        let dayText;
        if (mode === 'boss') {
            dayText = '무한';
        } else {
            if (day === 'all') {
                dayText = '전체';
            } else if (day && !isNaN(Number(day))) {
                dayText = `Day ${day}`;
            } else {
                const currentDay = game.currentDay;
                if (currentDay === 'all') {
                    dayText = '전체';
                } else if (currentDay && !isNaN(Number(currentDay))) {
                    dayText = `Day ${currentDay}`;
                } else {
                    dayText = '전체';
                }
            }
        }
        const gameInfoEl = document.getElementById('game-info-badge');
        if (gameInfoEl) {
            gameInfoEl.innerText = dayText;
        }
    },

    /**
     * 히어로 비주얼을 업데이트합니다 (무기, 이펙트 등)
     */
    updateVisuals: () => {
        document.getElementById('hero-img').src = 'images/battle_mode/hero.webp';

        // weapon -> hand-1 (gameplay)
        const hand1Id = db.equipped['hand-1'] || db.equippedWeapon || 'basic';
        const wData =
            weapons.find((w) => w.id === hand1Id) ||
            weapons.find((w) => w.id === db.equippedWeapon) ||
            weapons[0];
        const heroWeaponEl = document.getElementById('hero-weapon');
        if (heroWeaponEl) heroWeaponEl.innerText = wData.icon || '';

        // effect -> hand-2 (visual)
        const hand2Id = db.equipped['hand-2'];
        const effData = weapons.find((w) => w.id === hand2Id);
        const heroEffEl = document.getElementById('hero-effect');
        if (heroEffEl) {
            heroEffEl.innerText = effData ? effData.icon : '';
            heroEffEl.style.display = effData ? 'block' : 'none';
        }

        // 장착 요약 (클릭 없이 표시)
        const summaryEl = document.getElementById('equipped-summary');
        if (summaryEl) {
            summaryEl.innerHTML = `
                <div class="eq" title="무기: ${
                    wData.name
                }"><span class="icon">${wData.icon}</span><div><div style="font-weight:700">${
                    wData.name
                }</div><div style="font-size:12px;color:#aaa">x${
                    wData.multiplier || 1
                }</div></div></div>
                ${
                    effData
                        ? `<div class="eq" title="이펙트: ${effData.name}"><span class="icon">${effData.icon}</span><div><div style="font-weight:700">${effData.name}</div><div style="font-size:12px;color:#aaa">${effData.desc}</div></div></div>`
                        : ''
                }
            `;
        }
    },

    /**
     * 내구도 배지를 업데이트합니다 (현재 사용 안 함)
     */
    updateDurability: () => {
        // 황금장갑은 이제 skill bar에 표시되므로 이 배지는 숨김
        const el = document.getElementById('durability-badge');
        if (el) {
            el.style.display = 'none';
        }
    },

    /**
     * 메인 통계를 업데이트합니다
     */
    updateMainStats: () => {
        document.getElementById('stat-solved').innerText = db.stats.solved;
        document.getElementById('stat-correct').innerText = db.stats.correct;
        const rate =
            db.stats.solved > 0 ? Math.round((db.stats.correct / db.stats.solved) * 100) : 0;
        document.getElementById('stat-rate').innerText = rate + '%';
    },

    /**
     * 스킬 바를 업데이트합니다
     */
    updateSkills: () => {
        const container = document.getElementById('skill-display');
        container.innerHTML = '';

        const hintData = relics.find((r) => r.id === 'hint');
        const ultimateData = relics.find((r) => r.id === 'ultimate');

        // 주관식 문제인지 확인 (boss-box가 표시 중이면 주관식)
        const isBossQuestion =
            document.getElementById('boss-box') &&
            document.getElementById('boss-box').style.display !== 'none';

        let hasSkills = false;

        // 황금장갑 (패시브 아이템 - 항상 활성)
        if (db.has('goldGlove')) {
            hasSkills = true;
            const gloveBtn = document.createElement('div');
            gloveBtn.className = 'skill-btn skill-passive';
            gloveBtn.innerHTML = `<span>🥊</span> <span class="skill-count">${
                db.durability['goldGlove'] || 0
            }/30</span>`;
            gloveBtn.title = '황금장갑 (패시브): 골드 획득 x1.5배';
            container.appendChild(gloveBtn);
        }

        if (hintData && db.skills.hint > 0) {
            hasSkills = true;
            const hintBtn = document.createElement('button');
            hintBtn.className = isBossQuestion
                ? 'skill-btn skill-active disabled'
                : 'skill-btn skill-active';
            const hintIcon = hintData.name.split(' ')[0] || '🧪';
            hintBtn.innerHTML = `<span>${hintIcon}</span> <span class="skill-count">${db.skills.hint}</span>`;
            hintBtn.onclick = game.useHint;
            hintBtn.title = isBossQuestion ? '힌트: 주관식에서는 사용 불가' : '힌트: 클릭하여 사용';
            container.appendChild(hintBtn);
        }

        if (ultimateData && db.skills.ultimate > 0) {
            hasSkills = true;
            const ultimateBtn = document.createElement('button');
            ultimateBtn.className = isBossQuestion
                ? 'skill-btn skill-active disabled'
                : 'skill-btn skill-active';
            const ultimateIcon = ultimateData.name.split(' ')[0] || '⚡';
            ultimateBtn.innerHTML = `<span>${ultimateIcon}</span> <span class="skill-count">${db.skills.ultimate}</span>`;
            ultimateBtn.onclick = game.useUltimate;
            ultimateBtn.title = isBossQuestion
                ? '필살기: 주관식에서는 사용 불가'
                : '필살기: 클릭하여 사용';
            container.appendChild(ultimateBtn);
        }

        // 스킬이 하나도 없으면 placeholder 표시
        if (!hasSkills) {
            const placeholder = document.createElement('div');
            placeholder.className = 'skill-placeholder';
            placeholder.innerText = 'Skill Bar';
            container.appendChild(placeholder);
        }
    },

    /**
     * 음악 선택 드롭다운 옵션을 동적으로 렌더링합니다
     * @param {string} selectId - select 요소의 ID
     * @param {number} currentMusicNum - 현재 선택된 음악 번호
     */
    renderMusicSelectOptions: (selectId, currentMusicNum) => {
        const selectEl = document.getElementById(selectId);
        if (!selectEl) return;

        selectEl.innerHTML = ''; // 기존 옵션 제거

        for (let i = 1; i <= currentMusicIndices.max; i++) {
            const option = document.createElement('option');
            option.value = String(i);
            option.innerText = `background_music_${i}.mp3`;

            // 모든 음악이 기본적으로 해제됨
            // const isUnlocked = db.settings.unlockedMusicTracks.includes(i);
            // if (!isUnlocked) {
            //     option.classList.add('locked-music');
            // }
            if (i === currentMusicNum) {
                option.selected = true;
            }
            selectEl.appendChild(option);
        }
    },
};

// 콘솔/디버깅을 위해 노출하고 다른 스크립트가 덮어쓰지 않도록 보호
try {
    window.ui = window.ui || ui;
} catch (e) {
    /* 무시 */
}
