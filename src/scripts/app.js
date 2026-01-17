
// ----------------------------------------------------
// 2. SYSTEM (DB & Shop)
// ----------------------------------------------------
const db = {
    gold: parseInt(localStorage.getItem('v7_gold')) || 0,
    owned: JSON.parse(localStorage.getItem('v7_owned')) || ['basic'],
    equippedWeapon: localStorage.getItem('v7_equip') || 'basic',
    durability: JSON.parse(localStorage.getItem('v7_dura')) || {},
    stats: JSON.parse(localStorage.getItem('v7_stats')) || { solved: 0, correct: 0 },
    inventory: JSON.parse(localStorage.getItem('v7_inventory')) || [],
    equipped: JSON.parse(localStorage.getItem('v7_equipped')) || {},
    inventoryCapacity: parseInt(localStorage.getItem('v7_inventory_capacity')) || 3,
    skills: JSON.parse(localStorage.getItem('v7_skills')) || { hint: 0, ultimate: 0 },
    lastSelectedDay: localStorage.getItem('v7_last_day') || 'all',

    save: () => {
        localStorage.setItem('v7_gold', db.gold);
        localStorage.setItem('v7_owned', JSON.stringify(db.owned));
        localStorage.setItem('v7_equip', db.equippedWeapon);
        localStorage.setItem('v7_dura', JSON.stringify(db.durability));
        localStorage.setItem('v7_stats', JSON.stringify(db.stats));
        localStorage.setItem('v7_inventory', JSON.stringify(db.inventory));
        localStorage.setItem('v7_equipped', JSON.stringify(db.equipped));
        localStorage.setItem('v7_inventory_capacity', db.inventoryCapacity);
        localStorage.setItem('v7_skills', JSON.stringify(db.skills));
        localStorage.setItem('v7_last_day', db.lastSelectedDay);
        ui.updateGold();
    },
    addGold: (n) => { db.gold += n; db.save(); },
    subGold: (n) => { db.gold -= n; db.save(); }, // Subtract but don't clamp here
    has: (id) => db.owned.includes(id),
    equip: (id) => { db.equippedWeapon = id; db.save(); ui.updateVisuals(); },
    addStats: (isCorrect) => {
        db.stats.solved++;
        if(isCorrect) db.stats.correct++;
        db.save();
    },
    useItem: (id) => {
        if (db.durability[id]) {
            db.durability[id]--;
            if (db.durability[id] <= 0) {
                delete db.durability[id];
                db.owned = db.owned.filter(x => x !== id);
                alert(`[${id === 'goldGlove' ? '황금 장갑' : '아이템'}]이 파괴되었습니다!`);
            }
            db.save();
            ui.updateDurability();
        }
    }
};
const inventory = {
    open: () => {
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('inventory-screen').style.display = 'flex';
        inventory.hideDetails(); // Hide details on open
        inventory.render();
    },
    close: () => {
        document.getElementById('inventory-screen').style.display = 'none';
        document.getElementById('start-screen').style.display = 'flex';
    },
    render: () => {
        const invContainer = document.querySelector('.inv-items');
        invContainer.innerHTML = '';
        document.getElementById('inv-gold').innerText = db.gold;
        document.getElementById('inv-cap').innerText = (db.inventory.length + db.owned.filter(id => id !== 'basic' && id !== db.equippedWeapon).length) ;
        document.getElementById('inv-max-cap').innerText = db.inventoryCapacity;
    
        // Clear inventory display slots
        ['head', 'hand-1', 'hand-2', 'foot-1', 'foot-2', 'weapon'].forEach(slot => {
            const equipSlot = document.getElementById(`inv-${slot}`);
            if(equipSlot) {
                equipSlot.innerHTML = '';
                equipSlot.onclick = null;
            }
        });
    
        // Render equipped weapon
        const equippedWeaponData = weapons.find(w => w.id === db.equippedWeapon);
        if (equippedWeaponData && db.equippedWeapon !== 'basic') {
            const weaponSlot = document.getElementById('inv-weapon');
            weaponSlot.innerHTML = `<div class="inv-item">${equippedWeaponData.icon}</div>`;
            weaponSlot.onclick = () => inventory.unequipWeapon();
        }

        // Render equipped items in inventory UI
        for (const slot in db.equipped) {
            const item = items.find(i => i.id === db.equipped[slot]);
            if (item) {
                const equipSlot = document.getElementById(`inv-${slot}`);
                if (equipSlot) {
                    equipSlot.innerHTML = `<div class="inv-item">${item.icon}</div>`;
                    equipSlot.onclick = () => inventory.unequip(slot);
                }
            }
        }
    
        // Clear hero equipment display
        document.getElementById('hero-head').innerHTML = '';
        document.getElementById('hero-hand-1').innerHTML = '';
        document.getElementById('hero-hand-2').innerHTML = '';
        document.getElementById('hero-feet').innerHTML = '';
    
        // Render equipped items on hero sprite
        const headItem = items.find(i => i.id === db.equipped['head']);
        if (headItem) {
            const el = document.getElementById('hero-head');
            if (el) el.innerHTML = headItem.icon;
        }
        const hand1Item = items.find(i => i.id === db.equipped['hand-1']);
        if (hand1Item) {
            const el = document.getElementById('hero-hand-1');
            if (el) el.innerHTML = hand1Item.icon;
        }
        const hand2Item = items.find(i => i.id === db.equipped['hand-2']);
        if (hand2Item) {
            const el = document.getElementById('hero-hand-2');
            if (el) el.innerHTML = hand2Item.icon;
        }
        const foot1Item = items.find(i => i.id === db.equipped['foot-1']);
        if (foot1Item) {
            const el = document.getElementById('hero-feet');
            if (el) el.innerHTML = foot1Item.icon;
        }
    
        // Render items in storage
        db.inventory.forEach(itemId => {
            const item = items.find(i => i.id === itemId);
            if (item) {
                const itemEl = document.createElement('div');
                itemEl.className = 'inv-item';
                itemEl.innerHTML = item.icon;
                itemEl.onclick = () => inventory.showDetails(itemId, 'item');
                invContainer.appendChild(itemEl);
            }
        });

        // Render owned weapons in storage
         db.owned.forEach(weaponId => {
            const weapon = weapons.find(w => w.id === weaponId);
            if (weapon && weapon.id !== db.equippedWeapon && weapon.id !== 'basic') {
                const itemEl = document.createElement('div');
                itemEl.className = 'inv-item';
                itemEl.innerHTML = weapon.icon;
                itemEl.onclick = () => inventory.showDetails(weaponId, 'weapon');
                invContainer.appendChild(itemEl);
            }
        });

        // Render owned relics
        const relicsContainer = document.querySelector('.inv-relics');
        relicsContainer.innerHTML = '';
        db.owned.forEach(itemId => {
            const relic = relics.find(r => r.id === itemId && (r.type === 'passive' || r.type === 'consumable' || r.type === 'backpack'));
            if (relic) {
                const relicEl = document.createElement('div');
                relicEl.className = 'relic-item';
                
                let relicInfo = `<b>${relic.name}</b>: ${relic.desc}`;
                if (relic.type === 'consumable' && db.durability[relic.id]) {
                    relicInfo += ` (${db.durability[relic.id]}회 남음)`;
                }

                relicEl.innerHTML = relicInfo;
                relicsContainer.appendChild(relicEl);
            }
        });
    },
    showDetails: (id, type) => {
        const itemData = (type === 'item') ? items.find(i => i.id === id) : weapons.find(w => w.id === id);
        if (!itemData) return;

        document.getElementById('detail-icon').innerText = itemData.icon || '';
        document.getElementById('detail-name').innerText = itemData.name;
        document.getElementById('detail-desc').innerText = itemData.desc;

        const actionsContainer = document.getElementById('detail-actions');
        actionsContainer.innerHTML = '';

        const equipBtn = document.createElement('button');
        equipBtn.className = 'btn-main';
        equipBtn.innerText = '장착하기';
        equipBtn.onclick = () => {
            inventory.equip(id, type);
            inventory.hideDetails();
        };
        actionsContainer.appendChild(equipBtn);

        document.getElementById('inv-item-detail').style.display = 'block';
    },
    hideDetails: () => {
        document.getElementById('inv-item-detail').style.display = 'none';
    },
    equip: (id, type) => {
        if (type === 'weapon') {
            db.equip(id);
        } else { // It's an item
            const item = items.find(i => i.id === id);
            if (!item) return;

            if (item.id === 'boots') {
                inventory.unequip('foot-1', true);
                inventory.unequip('foot-2', true);
                db.equipped['foot-1'] = id;
                db.equipped['foot-2'] = id;
            } else {
                inventory.unequip(item.slot, true);
                db.equipped[item.slot] = id;
            }
            db.inventory = db.inventory.filter(i => i !== id);
        }

        db.save();
        inventory.render();
        shop.render(); 
    },
    unequipWeapon: () => {
        if (db.equippedWeapon === 'basic') return;
        db.equip('basic');
        db.save();
        inventory.render();
    },
    unequip: (slot, silent = false) => {
        const itemId = db.equipped[slot];
        if (!itemId) return;

        if (!silent && db.inventory.length >= db.inventoryCapacity) {
            alert('인벤토리가 가득 찼습니다.');
            return;
        }

        if (itemId === 'boots') {
            delete db.equipped['foot-1'];
            delete db.equipped['foot-2'];
        } else {
            delete db.equipped[slot];
        }
        
        if (!db.inventory.includes(itemId)) {
            db.inventory.push(itemId);
        }
        
        if (silent) return;

        db.save();
        inventory.render();
    }
};


const shop = {
    open: () => {
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('shop-screen').style.display = 'flex';
        shop.render();
    },
    close: () => {
        document.getElementById('shop-screen').style.display = 'none';
        document.getElementById('start-screen').style.display = 'flex';
    },
    render: () => {
        const container = document.getElementById('shop-container');
        container.innerHTML = '';
        document.getElementById('shop-gold').innerText = db.gold;

        const isPurchased = (item) => db.inventory.includes(item.id) || Object.values(db.equipped).includes(item.id) || db.owned.includes(item.id);

        // Economy Weapons
        let html = '<div class="shop-section">💰 경제형 무기 (골드 보너스)</div>';
        weapons.filter(w=>w.multiplier > 1 && !isPurchased(w)).forEach(w => html += shop.createItemHtml(w, 'weapon'));

        // Visual Weapons
        html += '<div class="shop-section">⚔️ 스킨 무기 (이펙트)</div>';
        weapons.filter(w=>w.multiplier === 1 && !isPurchased(w)).forEach(w => html += shop.createItemHtml(w, 'weapon'));

        // Relics
        html += '<div class="shop-section">💍 유물/아이템</div>';
        relics.filter(r => r.type !== 'skill' && !isPurchased(r)).forEach(r => html += shop.createItemHtml(r, r.type));

        // Skills (always visible)
        html += '<div class="shop-section">✨ 스킬</div>';
        relics.filter(r => r.type === 'skill').forEach(r => html += shop.createItemHtml(r, r.type));


        // Items
        html += '<div class="shop-section">🛡️ 장비</div>';
        items.filter(i => !isPurchased(i)).forEach(i => html += shop.createItemHtml(i, 'item'));

        container.innerHTML = html;
    },
    createItemHtml: (item, type) => {
        let btn = `<button class="buy-btn" onclick="shop.buy('${item.id}', ${item.cost}, '${type}')">${item.cost} G</button>`;
        
        if (type === 'skill') {
             return `<div class="shop-item"><div><b>${item.name} (현재 ${db.skills[item.id]}개)</b><br><span style="font-size:11px;color:#aaa;">${item.desc}</span></div>${btn}</div>`;
        }

        return `<div class="shop-item"><div><b>${item.name}</b><br><span style="font-size:11px;color:#aaa;">${item.desc}</span></div>${btn}</div>`;
    },
    buy: (id, cost, type) => {
        if (db.gold < cost) {
            alert("골드가 부족합니다.");
            return;
        }

        db.gold -= cost;

        if (type === 'item') {
            if (db.inventory.length >= db.inventoryCapacity) {
                alert('인벤토리가 가득 찼습니다.');
                 db.gold += cost; //- revert transaction
                return;
            }
            db.inventory.push(id);
        } else if (type === 'backpack') {
            db.inventoryCapacity++;
            db.owned.push(id); 
        } else if (type === 'skill') {
            const skill = relics.find(r=>r.id===id);
            db.skills[id] += skill.uses;
        } else { // weapons and other relics
            db.owned.push(id);
            if (type === 'weapon') {
                db.equip(id);
            }
            if (type === 'consumable') {
                const relic = relics.find(r=>r.id===id);
                db.durability[id] = relic.durability;
            }
        }
        
        db.save();
        shop.render();
        inventory.render(); // Update inventory screen as well
    },
    equip: (id) => { db.equip(id); shop.render(); }
};

const ui = {
    updateGold: () => document.querySelectorAll('#ui-gold').forEach(e => e.innerText = db.gold),
    updateVisuals: () => {
        document.getElementById('hero-img').src = "legacy_hero_sprite.png";
        
        const wData = weapons.find(w => w.id === db.equippedWeapon) || weapons[0];
        document.getElementById('hero-weapon').innerText = wData.icon;
    },
    updateDurability: () => {
        const el = document.getElementById('durability-badge');
        if(db.has('goldGlove')) {
            el.style.display = 'block';
            el.innerText = `🥊 ${db.durability['goldGlove']}/30`;
        } else {
            el.style.display = 'none';
        }
    },
    updateMainStats: () => {
        document.getElementById('stat-solved').innerText = db.stats.solved;
        document.getElementById('stat-correct').innerText = db.stats.correct;
        const rate = db.stats.solved > 0 ? Math.round((db.stats.correct / db.stats.solved) * 100) : 0;
        document.getElementById('stat-rate').innerText = rate + "%";
    },
    updateSkills: () => {
        const container = document.getElementById('skill-display');
        container.innerHTML = '';
        
        const hintData = relics.find(r => r.id === 'hint');
        const ultimateData = relics.find(r => r.id === 'ultimate');

        if (db.skills.hint > 0) {
            const hintBtn = document.createElement('button');
            hintBtn.className = 'skill-btn';
            hintBtn.innerHTML = `<span>${hintData.name.split(' ')[0]}</span> <span class="skill-count">${db.skills.hint}</span>`;
            hintBtn.onclick = game.useHint;
            container.appendChild(hintBtn);
        }
        
        if (db.skills.ultimate > 0) {
            const ultimateBtn = document.createElement('button');
            ultimateBtn.className = 'skill-btn';
            ultimateBtn.innerHTML = `<span>${ultimateData.name.split(' ')[0]}</span> <span class="skill-count">${db.skills.ultimate}</span>`;
            ultimateBtn.onclick = game.useUltimate;
            container.appendChild(ultimateBtn);
        }
    }
};

// 3. STORY Logic
const story = {
    day: null, mode: null,
    startIntro: (mode) => {
        const daySel = document.getElementById('day-select').value;
        db.lastSelectedDay = daySel;
        db.save();
        story.day = (mode === 'rush') ? 'rush' : daySel;
        story.mode = mode;
        const data = stories[story.day] || stories['all'];
        
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('story-screen').style.display = 'flex';
        document.getElementById('story-title').innerText = data.title;
        document.getElementById('story-text').innerText = data.intro;
        
        const btn = document.getElementById('story-btn');
        btn.innerText = "모험 시작";
        btn.onclick = () => game.init(story.mode, story.day);
    },
    showEnding: (win) => {
        const data = stories[story.day] || stories['all'];
        document.getElementById('game-screen').style.display = 'none';
        document.getElementById('story-screen').style.display = 'flex';
        
        document.getElementById('story-title').innerText = win ? "VICTORY" : "DEFEAT";
        document.getElementById('story-text').innerText = win ? data.win : data.lose;
        
        const btn = document.getElementById('story-btn');
        btn.innerText = "결과 정산";
        btn.onclick = () => game.end(win);
    }
};

// 4. GAME Logic
const game = {
    list: [], idx: 0, timer: null, timeLeft: 0, maxTime: 10,
    stats: { gain: 0, lost: 0 }, currentQ: null, isProcessing: false, currentAns: "", mode: 'normal',
    deck: [],

    init: (mode, day) => {
        const count = parseInt(document.getElementById('count-select').value);
        game.mode = mode;

        document.getElementById('story-screen').style.display = 'none';
        
        let pool = (day === 'all') ? rawData : rawData.filter(i => i.day == day);
        if (pool.length < 4) { alert("데이터 부족"); location.reload(); return; }

        game.maxTime = db.has('hourglass') ? 15 : 10;
        game.stats = { gain: 0, lost: 0 };
        game.idx = 0;
        game.isProcessing = false;

        if (mode === 'rush') {
            game.deck = game.shuffle([...rawData]);
            game.list = [];
        } else {
            let shuffledPool = game.shuffle(pool);
            const bossCount = Math.max(1, Math.floor(count * 0.2));
            const normalCount = count - bossCount;

            const bossQuestions = shuffledPool.slice(0, bossCount).map(q => ({...q, isBoss: true}));
            const normalQuestions = shuffledPool.slice(bossCount, count).map(q => ({...q, isBoss: false}));
            
            game.list = game.shuffle([...bossQuestions, ...normalQuestions]);
        }

        document.getElementById('game-screen').style.display = 'flex';
        
        ui.updateGold();
        ui.updateVisuals();
        ui.updateDurability();
        ui.updateSkills();
        game.nextLevel();
    },

    nextLevel: () => {
        game.isProcessing = false; // Reset lock

        if (game.mode === 'normal' && game.idx >= game.list.length) {
            story.showEnding(true);
            return;
        }

        const seed = Math.random().toString(36).substring(7);
        document.getElementById('monster-img').src = `https://robohash.org/${seed}.png?set=set2&size=200x200`;
        
        if (game.mode === 'rush') {
            if (game.deck.length === 0) { story.showEnding(true); return; }
            game.currentQ = game.deck.pop();
            document.getElementById('wave-badge').innerText = "Wave: " + (game.idx + 1);
            game.currentAns = game.currentQ.word;
            game.renderBoss(game.currentQ, true);
        } else {
            document.getElementById('wave-badge').innerText = `Enemy: ${game.idx + 1}/${game.list.length}`;
            game.currentQ = game.list[game.idx];
            
            document.getElementById('boss-box').style.display = 'none';
            document.getElementById('options-box').style.display = 'none';

            if (game.currentQ.isBoss) {
                game.currentAns = game.currentQ.word;
                game.renderBoss(game.currentQ, false);
            } else {
                game.renderNormal(game.currentQ);
            }
        }
        game.startTimer();
    },

    renderNormal: (data) => {
        if (!data || !data.word || !data.meaning) {
            game.idx++;
            game.nextLevel();
            return;
        }
        document.getElementById('options-box').style.display = 'grid';
        document.getElementById('options-box').innerHTML = '';
        document.getElementById('skill-display').style.visibility = 'visible';
        
        const isKor = Math.random() < 0.5;
        if (isKor) {
            document.getElementById('q-label').innerText = "TRANSLATE";
            document.getElementById('q-text').innerText = data.meaning;
            game.currentAns = data.word;
            const opts = game.getDistractors(data.word, 'word');
            game.shuffle([data.word, ...opts]).forEach(opt => game.createBtn(opt, opt === data.word));
        } else {
            document.getElementById('q-label').innerText = "MEANING";
            document.getElementById('q-text').innerText = data.word;
            game.currentAns = data.meaning;
            const opts = game.getDistractors(data.meaning, 'meaning');
            game.shuffle([data.meaning, ...opts]).forEach(opt => game.createBtn(opt, opt === data.meaning));
        }
    },

    renderBoss: (data, isRush) => {
        if (!data || !data.word || !data.meaning) {
            game.idx++;
            game.nextLevel();
            return;
        }
        document.getElementById('boss-box').style.display = 'flex';
        document.getElementById('options-box').style.display = 'none';
        document.getElementById('skill-display').style.visibility = 'hidden';
        
        const isFinalBoss = !isRush && game.idx === game.list.length - 1;
        document.getElementById('boss-title').innerText = isFinalBoss ? "⚠️ BOSS BATTLE" : (isRush ? `🔥 WAVE ${game.idx + 1}` : "⚔️ ELITE");

        document.getElementById('q-label').innerText = "TYPE IN ENGLISH";
        document.getElementById('q-text').innerText = data.meaning;
        document.getElementById('boss-hint').innerText = data.word.charAt(0) + " " + "_ ".repeat(data.word.length - 1);
        
        const input = document.getElementById('boss-input');
        input.value = ""; input.focus(); input.style.borderColor = "var(--primary)";
        input.onkeypress = (e) => { if(e.key === 'Enter') game.checkBossAnswer(); };
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
        game.handleAnswer(input === answer, null);
    },

    handleAnswer: (isCorrect, btnElement) => {
        if (game.isProcessing) return;
        game.isProcessing = true;
        clearInterval(game.timer);

        // Record Stats
        db.addStats(isCorrect);

        if (isCorrect) {
            game.animAttack();
            
            // Reward Logic
            let baseGain = 40; 
            if (game.mode === 'rush') {
                baseGain = 80;
            } else if (game.currentQ.isBoss) {
                baseGain = (game.list.length >= 20) ? 600 : (game.list.length >= 10 ? 200 : 100);
            }

            // Time Factor
            const timeRatio = game.timeLeft / game.maxTime;
            let gain = Math.floor(baseGain * (0.5 + timeRatio * 0.5));

            // 1. Weapon Multiplier
            const wData = weapons.find(w => w.id === db.equippedWeapon);
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

            if (btnElement) btnElement.style.background = "#66BB6A";
            else document.getElementById('boss-input').style.borderColor = "#66BB6A";

            setTimeout(() => { game.idx++; game.nextLevel(); }, 800);
        } else {
            // Wrong Answer
            if (game.mode === 'rush') {
                document.getElementById('boss-input').style.borderColor = "#FF5252";
                game.showFloatText("GAME OVER", 'red');
                setTimeout(() => story.showEnding(false), 1000);
                return;
            }

            // Animations
            document.getElementById('monster-img').classList.add('mob-attack-anim');
            document.getElementById('hero-img').classList.add('hero-hit-anim');
            document.querySelector('.battle-arena').classList.add('screen-shake');

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

            if (btnElement) btnElement.style.background = "#D32F2F";
            else document.getElementById('boss-input').style.borderColor = "#D32F2F";
            
            // IMPORTANT: Ensure timeout triggers next level even if animation fails
            setTimeout(() => { game.idx++; game.nextLevel(); }, 1000);
        }
    },

    // Skills
    useHint: () => {
        if (game.isProcessing || game.mode === 'rush' || db.skills.hint <= 0) return;
        if (document.getElementById('options-box').style.display === 'none') return;
        
        db.skills.hint--;
        db.save();
        ui.updateSkills();

        const btns = Array.from(document.querySelectorAll('.option-btn:not(.disabled)'));
        const wrongBtns = btns.filter(b => b.innerText !== game.currentAns);
        game.shuffle(wrongBtns).slice(0, 2).forEach(b => { b.classList.add('disabled'); b.style.opacity="0.2"; });
    },
    useUltimate: () => {
        if (game.isProcessing || game.mode === 'rush' || db.skills.ultimate <= 0) return;
        if (document.getElementById('options-box').style.display === 'none') return;
       
        db.skills.ultimate--;
        db.save();
        ui.updateSkills();

        const btns = document.querySelectorAll('.option-btn');
        btns.forEach(b => { if (b.innerText === game.currentAns) b.click(); });
    },

    // Visuals
    animAttack: () => {
        document.getElementById('hero-wrapper').classList.add('hero-active');
        const wId = db.equippedWeapon;
        const wData = weapons.find(w=>w.id===wId) || weapons[0];
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
        setTimeout(() => { effEl.classList.add('slash-gold', 'eff-gold'); }, 300);
    },

    showFloatText: (text, type) => {
        const el = document.getElementById('dmg-txt');
        el.innerText = text;
        el.className = `damage-txt float-up ${type === 'gold' ? 'dmg-gold' : 'dmg-red'}`;
        setTimeout(() => el.classList.remove('float-up'), 1000);
    },

    startTimer: () => {
        game.timeLeft = game.maxTime;
        const bar = document.getElementById('ui-timer');
        bar.style.width = "100%";
        bar.classList.remove('timer-danger');
        clearInterval(game.timer);
        game.timer = setInterval(() => {
            game.timeLeft -= 0.1;
            bar.style.width = ((game.timeLeft / game.maxTime) * 100) + "%";
            if (game.timeLeft <= 3) bar.classList.add('timer-danger');
            if (game.timeLeft <= 0) {
                clearInterval(game.timer);
                game.handleAnswer(false, null);
            }
        }, 100);
    },

    getDistractors: (correct, key) => {
        const others = rawData.filter(i => i[key] !== correct);
        return game.shuffle(others).slice(0, 3).map(i => i[key]);
    },
    shuffle: (arr) => arr.sort(() => Math.random() - 0.5),

    end: (win) => {
        document.getElementById('result-screen').style.display = 'flex';
        
        const gain = game.stats.gain;
        const lost = game.stats.lost;

        document.getElementById('res-title').innerText = (win || game.mode==='rush') ? "FINISHED!" : "FAILED";
        
        document.getElementById('res-gain').innerText = gain;
        document.getElementById('res-lost').innerText = lost;
        
        // Fix: Show Total Wallet explicitly
        // Clamp negative balance to 0 on game end
        if (db.gold < 0) { db.gold = 0; db.save(); }
        document.getElementById('res-current-total').innerText = db.gold;
    }
};

// Init
ui.updateGold();
ui.updateVisuals();
ui.updateDurability();
ui.updateMainStats();
ui.updateSkills();

const secret = {
    password: "770477",
    entered: "",
    adjustGold: 0,

    init: () => {
        const h1 = document.querySelector('#start-screen .card h1');
        if (h1 && h1.innerText.includes('킹왕짱 RPG')) {
            h1.innerHTML = h1.innerHTML.replace('킹', '<span id="secret-trigger" style="cursor:pointer;">킹</span>');
            document.getElementById('secret-trigger').addEventListener('click', secret.open);
        }

        const passwordBox = document.getElementById('password-input-boxes');
        for(let i = 0; i < secret.password.length; i++) {
            const box = document.createElement('div');
            box.className = 'password-box';
            box.id = `passbox-${i}`;
            passwordBox.appendChild(box);
        }
    },

    open: () => {
        document.getElementById('secret-menu-overlay').style.display = 'flex';
        document.getElementById('password-modal').style.display = 'block';
        document.getElementById('gold-adjuster-modal').style.display = 'none';
        secret.entered = "";
        secret.updatePasswordDisplay();
    },

    close: () => {
        document.getElementById('secret-menu-overlay').style.display = 'none';
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
            document.getElementById('gold-adjuster-modal').style.display = 'block';
            secret.adjustGold = 0;
            document.getElementById('current-gold-display').innerText = db.gold;
            document.getElementById('adjust-gold-display').innerText = secret.adjustGold;

            document.getElementById('gold-up').onclick = () => secret.updateGold(1000);
            document.getElementById('gold-down').onclick = () => secret.updateGold(-1000);

        } else {
            document.getElementById('password-error').style.display = 'block';
            secret.entered = "";
            setTimeout(secret.updatePasswordDisplay, 500);
        }
    },

    updateGold: (amount) => {
        secret.adjustGold += amount;
        document.getElementById('adjust-gold-display').innerText = secret.adjustGold;
    },

    applyGold: () => {
        db.addGold(secret.adjustGold);
        secret.close();
    }
};
secret.init();
inventory.render();

function initSelections() {
    const daySelect = document.getElementById('day-select');
    if (daySelect && db.lastSelectedDay) {
        daySelect.value = db.lastSelectedDay;
    }
}
initSelections();

// Add event listeners for buttons
document.getElementById('start-battle-btn').addEventListener('click', () => story.startIntro('normal'));
document.getElementById('boss-rush-btn').addEventListener('click', () => story.startIntro('rush'));
