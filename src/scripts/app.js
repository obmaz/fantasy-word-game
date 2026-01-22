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
    addGold: (n) => {
        // ensure caller may pass negative/positive; enforce integer and clamp to 0
        const delta = Number(n) || 0;
        db.gold = Math.max(0, Math.floor(db.gold) + Math.floor(delta));
        db.save();
        return db.gold;
    },
    subGold: (n) => {
        // semantic alias for subtracting; keep behavior consistent with addGold
        return db.addGold(-(Number(n) || 0));
    },
    has: (id) => db.owned.includes(id),
    equip: (id) => {
        // route equip through the weapon metadata so category/slot rules are consistent
        const w = weapons.find(w => w.id === id);
        if (!w) {
            db.equippedWeapon = id;
            db.save();
            ui.updateVisuals();
            return;
        }

        // If effect-type, place into hand-2; if weapon-type, place into hand-1
        if (w.category === 'effect') {
            // ensure only one effect
            inventory.unequip('hand-2', true);
            db.equipped['hand-2'] = id;
        } else {
            // weapon or default -> main weapon slot is hand-1
            inventory.unequip('hand-1', true);
            db.equipped['hand-1'] = id;
            db.equippedWeapon = id; // keep backward-compatible multiplier reference
        }
        db.save();
        ui.updateVisuals();
    },
    addStats: (isCorrect) => {
        db.stats.solved++;
        if (isCorrect) db.stats.correct++;
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
            ui.updateSkills(); // 황금장갑이 skill bar에 표시되므로
        }
    }
};
const inventory = {
    open: () => {
        closeScreenOverlay('start-screen', false);
        openScreenOverlay('inventory-screen', true);
        history.pushState({ screen: 'inventory' }, '', window.location.href);
        inventory.hideDetails(); // Hide details on open
        inventory.render();

        // Accessibility / small-viewport fallback: ensure the close button is reachable
        const closeBtn = document.getElementById('inv-close-btn');
        if (closeBtn) {
            try { closeBtn.focus({ preventScroll: true }); } catch (err) { try { closeBtn.focus(); } catch (__) { /* ignore */ } }
            try { closeBtn.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (__) { /* ignore */ }
        }
    },
    close: () => {
        closeScreenOverlay('inventory-screen', true);
        setTimeout(() => {
            openScreenOverlay('start-screen', false);
        }, 400);
        history.pushState(null, '', window.location.href);
    },
    render: () => {
        const invContainer = document.querySelector('.inv-items');
        invContainer.innerHTML = '';
        document.getElementById('inv-gold').innerText = db.gold;
        document.getElementById('inv-cap').innerText = (db.inventory.length + db.owned.filter(id => id !== 'basic' && !Object.values(db.equipped).includes(id) && id !== db.equippedWeapon).length);
        document.getElementById('inv-max-cap').innerText = db.inventoryCapacity;

        // Clear inventory display slots
        ['head', 'hand-1', 'hand-2', 'foot-1', 'foot-2', 'weapon'].forEach(slot => {
            const equipSlot = document.getElementById(`inv-${slot}`);
            if (equipSlot) {
                equipSlot.innerHTML = '';
                equipSlot.onclick = null;
            }
        });


        // Render equipped items in inventory UI (including weapons that occupy hand/head/foot slots)
        for (const slot in db.equipped) {
            const itemId = db.equipped[slot];
            const item = items.find(i => i.id === itemId) || weapons.find(w => w.id === itemId);
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
                    if (weapon && weapon.id !== 'basic' && weapon.id !== db.equippedWeapon && !Object.values(db.equipped).includes(weaponId)) {
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

        // Accessibility: allow Enter / Space to activate focused inventory slots
        document.querySelectorAll('.inv-slot[tabindex]').forEach(el => {
            el.onkeydown = (ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    el.click();
                }
            };
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

        // For weapons allow equipping to their defined slot(s)
        if (type === 'weapon') {
            const slot = itemData.slot || 'weapon';
            if (slot === 'either-hand') {
                const btn1 = document.createElement('button');
                btn1.className = 'btn-main';
                btn1.innerText = '오른손 장착';
                btn1.onclick = () => { inventory.equip(id, 'weapon', 'hand-1'); inventory.hideDetails(); };
                actionsContainer.appendChild(btn1);

                const btn2 = document.createElement('button');
                btn2.className = 'btn-main';
                btn2.innerText = '왼손 장착';
                btn2.onclick = () => { inventory.equip(id, 'weapon', 'hand-2'); inventory.hideDetails(); };
                actionsContainer.appendChild(btn2);
            } else {
                const equipBtn = document.createElement('button');
                equipBtn.className = 'btn-main';
                equipBtn.innerText = `장착하기 (${slot})`;
                equipBtn.onclick = () => { inventory.equip(id, 'weapon', slot); inventory.hideDetails(); };
                actionsContainer.appendChild(equipBtn);
            }

            // allow unequip if currently equipped
            if (db.equippedWeapon === id || Object.values(db.equipped).includes(id)) {
                const unequipBtn = document.createElement('button');
                unequipBtn.className = 'btn-main btn-blue';
                unequipBtn.innerText = '해제';
                unequipBtn.onclick = () => { inventory.unequipWeapon(); inventory.hideDetails(); };
                actionsContainer.appendChild(unequipBtn);
            }

        } else {
            // item (consumable / equipment)
            const equipBtn = document.createElement('button');
            equipBtn.className = 'btn-main';
            equipBtn.innerText = '장착하기';
            equipBtn.onclick = () => {
                inventory.equip(id, type);
                inventory.hideDetails();
            };
            actionsContainer.appendChild(equipBtn);

            // if consumable, add a use button
            const isConsumable = relics.find(r => r.id === id && r.type === 'consumable');
            if (isConsumable) {
                const useBtn = document.createElement('button');
                useBtn.className = 'btn-main btn-blue';
                useBtn.innerText = '사용하기';
                useBtn.onclick = () => { db.useItem(id); inventory.hideDetails(); };
                actionsContainer.appendChild(useBtn);
            }
        }

        document.getElementById('inv-item-detail').style.display = 'block';
    },
    hideDetails: () => {
        document.getElementById('inv-item-detail').style.display = 'none';
    },
    equip: (id, type, targetSlot) => {
        if (type === 'weapon') {
            const w = weapons.find(w => w.id === id);
            if (!w) return;

            // Enforce category -> canonical slot mapping
            let slot;
            if (w.category === 'weapon') slot = 'hand-1';
            else if (w.category === 'effect') slot = 'hand-2';
            else if (w.category === 'either') slot = targetSlot || 'hand-1';
            else slot = targetSlot || w.slot || 'hand-1';

            // reject invalid target slots (weapons only to hands)
            if (!['hand-1', 'hand-2'].includes(slot)) {
                alert('무기는 손 슬롯에만 장착할 수 있습니다.');
                return;
            }

            // If equipping a weapon, ensure only one weapon exists (hand-1)
            if (slot === 'hand-1') {
                // unequip any existing weapon in hand-1
                inventory.unequip('hand-1', true);
                db.equipped['hand-1'] = id;
                db.equippedWeapon = id; // gameplay reference
            } else if (slot === 'hand-2') {
                // unequip existing effect
                inventory.unequip('hand-2', true);
                db.equipped['hand-2'] = id;
            }

            // ensure the weapon id is present in owned if applicable
            if (!db.owned.includes(id)) db.owned.push(id);

        } else { // It's an item (armor, boots, relic)
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
    unequipWeapon: (slot) => {
        // If a slot is provided, clear that slot; otherwise clear the equippedWeapon
        if (slot) {
            const id = db.equipped[slot];
            if (!id) return;
            delete db.equipped[slot];
            if (db.equippedWeapon === id) db.equippedWeapon = 'basic';
        } else {
            if (db.equippedWeapon === 'basic') return;
            const id = db.equippedWeapon;
            // remove from any hero slots that reference this weapon
            for (const s of Object.keys(db.equipped)) {
                if (db.equipped[s] === id) delete db.equipped[s];
            }
            db.equippedWeapon = 'basic';
        }
        db.save();
        inventory.render();
    },
    unequip: (slot, silent = false) => {
        const itemId = db.equipped[slot];
        if (!itemId) return;

        // For weapons: do not move them into db.inventory (they remain in db.owned)
        const isWeapon = !!weapons.find(w => w.id === itemId);

        if (!silent && !isWeapon && db.inventory.length >= db.inventoryCapacity) {
            alert('인벤토리가 가득 찼습니다.');
            return;
        }

        if (itemId === 'boots') {
            delete db.equipped['foot-1'];
            delete db.equipped['foot-2'];
        } else {
            delete db.equipped[slot];
        }

        // If this was the active equippedWeapon, clear it
        if (db.equippedWeapon === itemId) db.equippedWeapon = 'basic';

        // Only add to backpack inventory if it's a non-weapon item
        if (!isWeapon && !db.inventory.includes(itemId)) {
            db.inventory.push(itemId);
        }

        if (silent) return;

        db.save();
        inventory.render();
    }
};


const shop = {
    open: () => {
        closeScreenOverlay('start-screen', false);
        openScreenOverlay('shop-screen', true);
        history.pushState({ screen: 'shop' }, '', window.location.href);
        shop.render();
    },
    close: () => {
        closeScreenOverlay('shop-screen', true);
        setTimeout(() => {
            openScreenOverlay('start-screen', false);
        }, 400);
        history.pushState(null, '', window.location.href);
    },
    render: () => {
        const container = document.getElementById('shop-container');
        container.innerHTML = '';
        document.getElementById('shop-gold').innerText = db.gold;

        const isPurchased = (item) => db.inventory.includes(item.id) || Object.values(db.equipped).includes(item.id) || db.owned.includes(item.id);

        // Economy Weapons
        let html = '<div class="shop-section">💰 경제형 무기 (골드 보너스)</div>';
        weapons.filter(w => w.multiplier > 1 && !isPurchased(w)).forEach(w => html += shop.createItemHtml(w, 'weapon'));

        // Visual Weapons
        html += '<div class="shop-section">⚔️ 스킨 무기 (이펙트)</div>';
        weapons.filter(w => w.multiplier === 1 && !isPurchased(w)).forEach(w => html += shop.createItemHtml(w, 'weapon'));

        // Relics
        html += '<div class="shop-section">💍 유물/아이템</div>';
        relics.filter(r => (r.type !== 'skill' && !isPurchased(r)) || r.id === 'backpack').forEach(r => html += shop.createItemHtml(r, r.type));

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
    
            const isStorable = ['item', 'weapon', 'passive', 'consumable', 'effect', 'either'].includes(type);
    
            if (isStorable) {
                 const unequippedOwned = db.owned.filter(oid => oid !== 'basic' && !Object.values(db.equipped).includes(oid) && oid !== db.equippedWeapon);
                 const currentSize = db.inventory.length + unequippedOwned.length;
                 if (currentSize >= db.inventoryCapacity) {
                    alert('인벤토리가 가득 찼습니다.');
                    return;
                }
            }
    
            // use API so clamp/persistence/UI are consistent
            db.subGold(cost);
    
            if (type === 'item') {
                db.inventory.push(id);
            } else if (type === 'backpack') {
                db.inventoryCapacity++;
            } else if (type === 'skill') {
                const skill = relics.find(r=>r.id===id);
                db.skills[id] += skill.uses;
            } else { // weapons and other relics
                db.owned.push(id);
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
    updateGold: () => {
        const titleGold = document.getElementById('title-ui-gold');
        if (titleGold) titleGold.innerText = db.gold;
        const overlayGold = document.getElementById('overlay-gold');
        if (overlayGold) overlayGold.innerText = db.gold;
    },
    updateGameInfo: (mode, day) => {
        const modeText = mode === 'rush' ? '보스 러쉬' : (mode === 'chaos' ? '혼돈의 균열' : '스토리 모드');
        const dayText = mode === 'rush' ? '무한' : (mode === 'chaos' ? '전체' : (day === 'all' ? '전체' : `Day ${day}`));
        const gameInfoEl = document.getElementById('game-info-badge');
        if (gameInfoEl) {
            gameInfoEl.innerText = `${modeText} - ${dayText}`;
        }
    },
    updateVisuals: () => {
        document.getElementById('hero-img').src = "images/hero.webp";

        // weapon -> hand-1 (gameplay)
        const hand1Id = db.equipped['hand-1'] || db.equippedWeapon || 'basic';
        const wData = weapons.find(w => w.id === hand1Id) || weapons.find(w => w.id === db.equippedWeapon) || weapons[0];
        const heroWeaponEl = document.getElementById('hero-weapon');
        if (heroWeaponEl) heroWeaponEl.innerText = wData.icon || '';

        // effect -> hand-2 (visual)
        const hand2Id = db.equipped['hand-2'];
        const effData = weapons.find(w => w.id === hand2Id);
        const heroEffEl = document.getElementById('hero-effect');
        if (heroEffEl) {
            heroEffEl.innerText = effData ? effData.icon : '';
            heroEffEl.style.display = effData ? 'block' : 'none';
        }

        // quick equipped summary (visible without clicking)
        const summaryEl = document.getElementById('equipped-summary');
        if (summaryEl) {
            summaryEl.innerHTML = `\n                <div class="eq" title="무기: ${wData.name}"><span class="icon">${wData.icon}</span><div><div style="font-weight:700">${wData.name}</div><div style="font-size:12px;color:#aaa">x${wData.multiplier || 1}</div></div></div>\n                ${effData ? `<div class="eq" title="이펙트: ${effData.name}"><span class="icon">${effData.icon}</span><div><div style="font-weight:700">${effData.name}</div><div style="font-size:12px;color:#aaa">${effData.desc}</div></div></div>` : ''}\n            `;
        }
    },
    updateDurability: () => {
        // 황금장갑은 이제 skill bar에 표시되므로 이 배지는 숨김
        const el = document.getElementById('durability-badge');
        if (el) {
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

        // 주관식 문제인지 확인 (boss-box가 표시 중이면 주관식)
        const isBossQuestion = document.getElementById('boss-box') && 
                              document.getElementById('boss-box').style.display !== 'none';

        let hasSkills = false;

        // 황금장갑 (패시브 아이템 - 항상 활성)
        if (db.has('goldGlove')) {
            hasSkills = true;
            const gloveBtn = document.createElement('div');
            gloveBtn.className = 'skill-btn skill-passive';
            gloveBtn.innerHTML = `<span>🥊</span> <span class="skill-count">${db.durability['goldGlove']}/30</span>`;
            gloveBtn.title = '황금장갑 (패시브): 골드 획득 x1.5배';
            container.appendChild(gloveBtn);
        }

        if (db.skills.hint > 0) {
            hasSkills = true;
            const hintBtn = document.createElement('button');
            hintBtn.className = isBossQuestion ? 'skill-btn skill-active disabled' : 'skill-btn skill-active';
            hintBtn.innerHTML = `<span>${hintData.name.split(' ')[0]}</span> <span class="skill-count">${db.skills.hint}</span>`;
            hintBtn.onclick = game.useHint;
            hintBtn.title = isBossQuestion ? '힌트: 주관식에서는 사용 불가' : '힌트: 클릭하여 사용';
            container.appendChild(hintBtn);
        }

        if (db.skills.ultimate > 0) {
            hasSkills = true;
            const ultimateBtn = document.createElement('button');
            ultimateBtn.className = isBossQuestion ? 'skill-btn skill-active disabled' : 'skill-btn skill-active';
            ultimateBtn.innerHTML = `<span>${ultimateData.name.split(' ')[0]}</span> <span class="skill-count">${db.skills.ultimate}</span>`;
            ultimateBtn.onclick = game.useUltimate;
            ultimateBtn.title = isBossQuestion ? '필살기: 주관식에서는 사용 불가' : '필살기: 클릭하여 사용';
            container.appendChild(ultimateBtn);
        }

        // 스킬이 하나도 없으면 placeholder 표시
        if (!hasSkills) {
            const placeholder = document.createElement('div');
            placeholder.className = 'skill-placeholder';
            placeholder.innerText = 'Skill Bar';
            container.appendChild(placeholder);
        }
    }
};

// expose for console/debugging and to avoid other scripts clobbering
try { window.ui = window.ui || ui; } catch (e) { /* ignore */ }

// 3. STORY Logic

// Monster image assets and selection helper
const monsterAssets = {
    normal: [
        'images/monster_1.webp',
        'images/monster_2.webp',
        'images/monster_3.webp'
    ],
    boss: [
        'images/monster_1.webp',
        'images/monster_2.webp',
        'images/monster_3.webp'
    ],
    byDay: {
        // Day-specific mapping — useful for testing and unique bosses
        // add more: '5': ['images/monster_1.webp', 'images/monster_2.webp']
    },
    fallback: 'images/monster_1.webp'
};

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function pickMonsterSprite(q, isBoss) {
    try {
        // q may be a question object or a day string/number
        const day = q && q.day ? String(q.day) : (typeof q === 'string' || typeof q === 'number' ? String(q) : null);

        // day-specific sprites take precedence
        if (day && monsterAssets.byDay[day] && monsterAssets.byDay[day].length) {
            return pickRandom(monsterAssets.byDay[day]);
        }

        // boss vs normal
        if (isBoss) {
            return pickRandom(monsterAssets.boss.length ? monsterAssets.boss : monsterAssets.normal) || monsterAssets.fallback;
        }
        return pickRandom(monsterAssets.normal) || monsterAssets.fallback;
    } catch (err) {
        console.error('pickMonsterSprite error', err);
        return monsterAssets.fallback;
    }
}

// Resolve story data for the given day. If a specific entry is missing,
// use the corresponding <option> text as a title so the UI reflects the
// user's selection instead of always falling back to 'all'.
function resolveStoryData(day) {
    // prefer canonical catalog
    if (typeof dayCatalog !== 'undefined' && dayCatalog[day] && dayCatalog[day].story) return dayCatalog[day].story;
    if (day === 'rush') return (dayCatalog && dayCatalog['rush'] && dayCatalog['rush'].story) || null;
    const s = (dayCatalog && dayCatalog[day] && dayCatalog[day].story) ? dayCatalog[day].story : null;
    if (s) return s;

    const opt = document.querySelector(`#day-select option[value="${day}"]`);
    const optText = opt ? opt.textContent : (day === 'all' ? (dayCatalog && dayCatalog['all'] && dayCatalog['all'].label) : `Day ${day}`);
    return {
        title: optText,
        intro: `선택한 지역 — ${optText}`,
        win: (dayCatalog && dayCatalog['all'] && dayCatalog['all'].story && dayCatalog['all'].story.win) || '',
        lose: (dayCatalog && dayCatalog['all'] && dayCatalog['all'].story && dayCatalog['all'].story.lose) || ''
    };
}

const story = {
    day: null, mode: null,
    startIntro: (mode, dayArg) => {
        const daySel = dayArg || document.getElementById('day-select').value;
        console.log('[story.startIntro] mode=', mode, 'dayArg=', dayArg, 'resolvedDay=', daySel);
        db.lastSelectedDay = daySel;
        db.save();
        story.day = (mode === 'rush') ? 'rush' : daySel;
        story.mode = mode;
        const data = resolveStoryData(story.day);

        // DEBUG: verify where title is coming from and ensure we're updating the visible element
        const hasEntry = !!(dayCatalog && dayCatalog[story.day] && dayCatalog[story.day].story);
        const optNode = document.querySelector(`#day-select option[value="${story.day}"]`);
        console.log('[story.startIntro] dbg -> day=', story.day, 'hasEntry=', hasEntry, 'optText=', optNode && optNode.textContent);
        console.log('[story.startIntro] dbg -> data.title=', data.title);

        const titleEls = document.querySelectorAll('#story-title');
        if (titleEls.length > 1) console.warn('[story.startIntro] multiple #story-title elements found:', titleEls.length);
        const titleEl = document.getElementById('story-title');
        console.log('[story.startIntro] current #story-title before=', titleEl && titleEl.innerText);

        // Prefer the Day label from the canonical catalog; fall back to legacy views
        const dayLabel = (story.day && typeof dayCatalog !== 'undefined' && dayCatalog[story.day] && dayCatalog[story.day].label) ? dayCatalog[story.day].label : (story.day === 'all' ? (dayCatalog && dayCatalog['all'] && dayCatalog['all'].label) : (story.day === 'rush' ? 'Boss Rush' : `Day ${story.day}`));
        const _t = data && data.title ? String(data.title).trim() : '';
        const displayTitle = (_t && dayLabel.indexOf(_t) === -1) ? `${dayLabel} — ${_t}` : dayLabel;

        closeScreenOverlay('start-screen', false);
        
        // story-screen 스타일 초기화
        const storyScreen = document.getElementById('story-screen');
        if (storyScreen) {
            storyScreen.style.visibility = '';
            storyScreen.style.opacity = '';
            storyScreen.style.zIndex = '';
            storyScreen.style.pointerEvents = '';
            storyScreen.classList.remove('closing');
        }
        
        openScreenOverlay('story-screen', true);
        
        // 히스토리 상태 추가 (백버튼 처리용)
        history.pushState({ screen: 'story-screen' }, '', window.location.href);
        
        // 보스 러쉬 모드일 때는 boss_battle.webp, 그 외에는 start.webp 사용
        const storyImg = document.getElementById('story-background-img');
        const storyStartBtn = document.getElementById('story-start-btn');
        if (storyImg) {
            if (mode === 'rush') {
                storyImg.src = 'images/boss_battle.webp';
                // 보스 배틀 모드 클래스 추가
                if (storyStartBtn) {
                    storyStartBtn.classList.add('boss-battle-btn');
                    storyStartBtn.classList.remove('story-mode-btn');
                }
            } else {
                storyImg.src = 'images/start.webp';
                // 스토리 모드 클래스 추가
                if (storyStartBtn) {
                    storyStartBtn.classList.add('story-mode-btn');
                    storyStartBtn.classList.remove('boss-battle-btn');
                }
            }
            
            // 이미지 로드 후 버튼 오버레이 동기화
            if (storyImg.complete) {
                setTimeout(() => {
                    syncStoryButtonOverlay();
                }, 100);
            } else {
                storyImg.addEventListener('load', () => {
                    setTimeout(() => {
                        syncStoryButtonOverlay();
                    }, 100);
                }, { once: true });
            }
        }
        
        // write and verify immediately via centralized setter (protects against duplicate IDs / external overwrites)
        if (window.ui && typeof window.ui.setStoryTitle === 'function') {
            window.ui.setStoryTitle(displayTitle);
        } else {
            const te = document.getElementById('story-title'); if (te) te.innerText = displayTitle; console.warn('[story.startIntro] fallback title write used');
        }
        const textEl = document.getElementById('story-text');
        if (textEl) textEl.innerText = data.intro;

        const btn = document.getElementById('story-btn');
        btn.innerText = "모험 시작";
        // capture the resolved day at intro time so the button uses the same day even if user changes select afterwards
        const resolvedAtIntro = (story.mode === 'rush') ? 'rush' : daySel;
        const startGame = () => {
            // 게임 오버 처리 중이면 시작하지 않음
            if (game.isProcessing) {
                console.log('[startGame] 게임 오버 처리 중이므로 시작하지 않음');
                return;
            }
            console.log('[story-btn] introResolvedDay=', resolvedAtIntro, 'story.mode=', story.mode);
            game.init(story.mode, resolvedAtIntro);
        };
        btn.onclick = startGame;
        
        // 이미지의 "모험시작" 버튼에도 동일한 이벤트 연결
        if (storyStartBtn) {
            storyStartBtn.onclick = startGame;
            storyStartBtn.style.pointerEvents = 'auto'; // 클릭 활성화
        }
    },
    showEnding: (win) => {
        // 게임 타이머 정지
        if (game.timer) {
            clearInterval(game.timer);
            game.timer = null;
        }
        
        // 게임 오버 상태로 설정 (게임이 자동으로 다시 시작되지 않도록)
        game.isProcessing = true;
        
        document.getElementById('game-screen').style.display = 'none';
        
        // story-screen을 확실히 닫기
        const storyScreen = document.getElementById('story-screen');
        if (storyScreen) {
            storyScreen.style.display = 'none';
            storyScreen.style.visibility = 'hidden';
            storyScreen.style.opacity = '0';
            storyScreen.style.zIndex = '100';
            storyScreen.style.pointerEvents = 'none';
            storyScreen.classList.remove('closing');
        }
        
        // story-mode-popup 닫기
        const storyModePopup = document.getElementById('story-mode-popup');
        if (storyModePopup) {
            storyModePopup.style.display = 'none';
            storyModePopup.style.visibility = 'hidden';
            storyModePopup.style.opacity = '0';
            storyModePopup.style.zIndex = '100';
            storyModePopup.style.pointerEvents = 'none';
            storyModePopup.classList.remove('closing');
        }
        
        // 모든 모드에서 story-screen을 건너뛰고 바로 결과 화면으로
        game.end(win);
    }
};

// safety helpers — cleanup and runtime sanity checks (kept top-level for easy console access)
function __purgeDuplicateStoryTitle(opts = {}) {
    try {
        const hard = opts.hard === undefined ? true : !!opts.hard;
        const els = Array.from(document.querySelectorAll('#story-title'));
        if (els.length <= 1) return { removed: 0, kept: els.length };
        const canonical = els[0];
        window.__removedStoryTitleBackups = window.__removedStoryTitleBackups || [];
        let removed = 0;
        els.slice(1).forEach(e => {
            try { window.__removedStoryTitleBackups.push({ html: e.outerHTML, time: Date.now() }); } catch (ignore) { }
            if (hard) e.remove(); else { e.style.display = 'none'; e.dataset._hiddenBy = '__purgeDuplicateStoryTitle'; }
            removed++;
        });
        console.info('[__purgeDuplicateStoryTitle] removed duplicates:', removed, 'kept: 1');
        setTimeout(() => { window.__removedStoryTitleBackups = (window.__removedStoryTitleBackups || []).filter(b => (Date.now() - b.time) < 30000); }, 31000);
        return { removed, kept: 1 };
    } catch (err) {
        console.error('[__purgeDuplicateStoryTitle] error', err);
        return { removed: 0, kept: (document.querySelectorAll('#story-title') || []).length };
    }
}

function __runGameSanityChecks(opts = {}) {
    const sample = opts.sampleDays || [1, 40, 55, 60];
    const out = { summary: {}, failures: [] };
    try {
        sample.forEach(d => {
            const dayKey = String(d);
            const row = { day: d, ok: true, notes: [] };

            const s = (typeof resolveStoryData === 'function') ? resolveStoryData(dayKey) : null;
            if (!s || !s.title) { row.ok = false; row.notes.push('missing story/title'); }

            const pool = (typeof rawData !== 'undefined') ? rawData.filter(r => Number(r.day) === Number(d)) : [];
            if (!pool || pool.length === 0) row.notes.push('rawData pool empty');

            let spriteNormal = null, spriteBoss = null;
            try { spriteNormal = pickMonsterSprite(d, false); spriteBoss = pickMonsterSprite(d, true); } catch (e) { row.notes.push('sprite fn threw'); row.ok = false; }
            if (!spriteNormal || typeof spriteNormal !== 'string') row.notes.push('missing normal sprite');
            if (!spriteBoss || typeof spriteBoss !== 'string') row.notes.push('missing boss sprite');

            const label = (typeof dayCatalog !== 'undefined' && dayCatalog[dayKey] && dayCatalog[dayKey].label) ? dayCatalog[dayKey].label : `Day ${day}`;
            const _st = s && s.title ? String(s.title).trim() : '';
            const displayTitle = (_st && String(label).indexOf(_st) === -1) ? `${label} — ${_st}` : label;

            try {
                // non-destructive title check: write & read back
                const orig = (document.getElementById('story-title') || {}).innerText;
                const el = document.getElementById('story-title');
                if (el) { el.innerText = displayTitle; const shown = el.innerText || null; if (!shown || String(shown).indexOf(label) === -1) { row.ok = false; row.notes.push('title render mismatch'); } el.innerText = orig; }
                else { row.ok = false; row.notes.push('no #story-title element'); }
            } catch (e) { row.ok = false; row.notes.push('title render threw'); }

            out.summary[dayKey] = row;
            if (!row.ok || row.notes.length) out.failures.push(row);
        });

        out.passed = out.failures.length === 0;
        console.group('[__runGameSanityChecks] report');
        console.log('sampleDays:', sample);
        Object.entries(out.summary).forEach(([k, v]) => console.log(k, v));
        if (out.passed) console.log('Sanity checks PASSED ✅'); else console.warn('Sanity checks found issues — inspect failures');
        console.groupEnd();
    } catch (err) {
        console.error('[__runGameSanityChecks] unexpected error', err);
        out.error = String(err);
    }
    // convenience alias from console
    window.runGameSanityTest = () => __runGameSanityChecks(opts);
    return out;
}

// 4. GAME Logic
const game = {
    list: [], idx: 0, timer: null, timeLeft: 0, maxTime: 10,
    stats: { gain: 0, lost: 0 }, currentQ: null, isProcessing: false, currentAns: "", mode: 'normal',
    deck: [], currentDay: null,

    init: (mode, day) => {
        const count = parseInt(document.getElementById('count-select').value);
        game.mode = mode;
        game.currentDay = day;

        // story-screen을 애니메이션과 함께 닫기
        closeScreenOverlay('story-screen', true);

        let pool;
        // normalize day and strictly match numeric day values to avoid cross-day leakage
        if (day === 'all' || day === 'rush') {
            pool = rawData;
        } else {
            const dayNum = Number(day);
            pool = rawData.filter(i => Number(i.day) === dayNum);
        }
        console.log('[game.init] mode=', mode, 'day=', day, 'poolSize=', (pool && pool.length));
        if (pool.length < 4) { alert("데이터 부족"); location.reload(); return; }

        game.maxTime = db.has('hourglass') ? 15 : 10;
        game.stats = { gain: 0, lost: 0 };
        game.idx = 0;
        game.isProcessing = false;

        if (mode === 'rush') {
            game.deck = game.shuffle([...rawData]);
            game.list = [];
        } else if (mode === 'chaos') {
            // Chaos Rift: All questions are boss mode (subjective)
            let shuffledPool = game.shuffle(pool);
            game.list = shuffledPool.slice(0, count).map(q => ({ ...q, isBoss: true }));
        } else {
            let shuffledPool = game.shuffle(pool);
            const bossCount = Math.max(1, Math.floor(count * 0.2));
            const normalCount = count - bossCount;

            const bossQuestions = shuffledPool.slice(0, bossCount).map(q => ({ ...q, isBoss: true }));
            const normalQuestions = shuffledPool.slice(bossCount, count).map(q => ({ ...q, isBoss: false }));

            game.list = game.shuffle([...bossQuestions, ...normalQuestions]);
        }

        // 애니메이션 완료 후 게임 화면 표시
        setTimeout(() => {
            document.getElementById('game-screen').style.display = 'flex';

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
        if (game.mode === 'normal' && game.idx >= game.list.length) {
            story.showEnding(true);
            return;
        }
        
        // Chaos Rift 모드 종료 조건 체크
        if (game.mode === 'chaos' && game.idx >= game.list.length) {
            story.showEnding(true);
            return;
        }

        // choose an appropriate monster sprite (day-specific > boss/normal > fallback)
        const upcoming = (game.mode === 'rush') ? null : (game.list && game.list[game.idx]) || null;
        const isBossPreview = (game.mode === 'rush') ? true : !!(upcoming && upcoming.isBoss);
        const sprite = pickMonsterSprite(upcoming || story.day, isBossPreview);
        document.getElementById('monster-img').src = sprite;

        if (game.mode === 'rush') {
            if (game.deck.length === 0) { story.showEnding(true); return; }
            game.currentQ = game.deck.pop();
            document.getElementById('wave-badge').innerText = "Wave: " + (game.idx + 1);
            game.currentAns = game.currentQ.word;
            game.renderBoss(game.currentQ, true);
        } else if (game.mode === 'chaos') {
            // Chaos Rift: All questions are boss mode
            document.getElementById('wave-badge').innerText = `Enemy: ${game.idx + 1}/${game.list.length}`;
            game.currentQ = game.list[game.idx];
            game.currentAns = game.currentQ.word;
            game.renderBoss(game.currentQ, false);
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
        console.log('[game.renderNormal] day=', data && data.day, 'word=', data && data.word);
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
        
        // 객관식에서는 스킬을 활성화 상태로 업데이트
        ui.updateSkills();
    },

    renderBoss: (data, isRush) => {
        console.log('[game.renderBoss] day=', data && data.day, 'word=', data && data.word, 'isRush=', !!isRush);
        if (!data || !data.word || !data.meaning) {
            game.idx++;
            game.nextLevel();
            return;
        }
        document.getElementById('boss-box').style.display = 'flex';
        document.getElementById('options-box').style.display = 'none';
        document.getElementById('skill-display').style.visibility = 'visible'; // 주관식에서도 표시

        const isFinalBoss = !isRush && game.idx === game.list.length - 1;
        document.getElementById('boss-title').innerText = isFinalBoss ? "⚠️ BOSS BATTLE" : (isRush ? `🔥 WAVE ${game.idx + 1}` : "⚔️ ELITE");

        document.getElementById('q-label').innerText = "TYPE IN ENGLISH";
        document.getElementById('q-text').innerText = data.meaning;
        document.getElementById('boss-hint').innerText = data.word.charAt(0) + " " + "_ ".repeat(data.word.length - 1);

        const input = document.getElementById('boss-input');
        if (input) {
            input.value = ""; 
            input.disabled = false; // 입력 활성화
            input.focus(); 
            input.style.borderColor = "var(--primary)";
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
        const isCorrect = (input === answer) || (input === answerWithoutFirst);
        
        game.handleAnswer(isCorrect, null);
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
                    bossInput.style.borderColor = "#FF5252";
                    bossInput.disabled = true; // 입력 비활성화
                    bossInput.onkeypress = null; // 키 이벤트 제거
                }
                
                // 오답일 때 정답 표시
                game.showCorrectAnswer(game.currentAns);
                game.showFloatText("GAME OVER", 'red');
                
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

            if (btnElement) btnElement.style.background = "#D32F2F";
            else document.getElementById('boss-input').style.borderColor = "#D32F2F";

            // 오답일 때 정답 표시
            game.showCorrectAnswer(game.currentAns);

            // IMPORTANT: Ensure timeout triggers next level even if animation fails
            setTimeout(() => { game.idx++; game.nextLevel(); }, 2500);
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
        game.shuffle(wrongBtns).slice(0, 2).forEach(b => { b.classList.add('disabled'); b.style.opacity = "0.2"; });
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
        const wData = weapons.find(w => w.id === wId) || weapons[0];
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

    showCorrectAnswer: (answer) => {
        const el = document.getElementById('q-text');
        const originalText = el.innerText;
        
        // 정답을 표시 (빨간색 + 강조)
        el.style.color = '#FF5252';
        el.style.fontSize = '26px';
        el.style.fontWeight = 'bold';
        el.innerText = `정답: ${answer}`;
        
        // 2초 후 원래 상태로 복구
        setTimeout(() => {
            el.style.color = '';
            el.style.fontSize = '';
            el.style.fontWeight = '';
            el.innerText = originalText;
        }, 2000);
    },

    startTimer: () => {
        game.timeLeft = game.maxTime;
        const overlayBar = document.getElementById('overlay-timer');
        if (overlayBar) {
            overlayBar.style.width = "100%";
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
            const width = ((game.timeLeft / game.maxTime) * 100) + "%";
            if (overlayBar) overlayBar.style.width = width;
            if (game.timeLeft <= 3) {
                if (overlayBar) overlayBar.classList.add('timer-danger');
            }
            if (game.timeLeft <= 0) {
                clearInterval(game.timer);
                game.timer = null;
                // 게임 오버 처리 중이 아니면 handleAnswer 호출
                if (!game.isProcessing) {
                    game.handleAnswer(false, null);
                }
            }
        }, 100);
    },

    getDistractors: (correct, key) => {
        const source = (typeof decoyWords !== 'undefined' && decoyWords.length > 0) ? rawData.concat(decoyWords) : rawData;
        const distractors = [];
        const shuffled = game.shuffle([...source]);
        for (let i = 0; i < shuffled.length; i++) {
            if (shuffled[i] && shuffled[i][key] && shuffled[i][key] !== correct) {
                if (!distractors.includes(shuffled[i][key])) {
                    distractors.push(shuffled[i][key]);
                }
                if (distractors.length >= 3) {
                    break;
                }
            }
        }
        // Ensure we have 3 distractors, even if we have to grab randomly
        while (distractors.length < 3) {
            const emergencyDistractor = game.shuffle([...rawData])[0];
            if (emergencyDistractor && emergencyDistractor[key] && emergencyDistractor[key] !== correct) {
                 if (!distractors.includes(emergencyDistractor[key])) {
                    distractors.push(emergencyDistractor[key]);
                 }
            }
        }
        return distractors.slice(0, 3);
    },
    shuffle: (arr) => arr.sort(() => Math.random() - 0.5),

    end: (win) => {
        // story-screen이 확실히 닫혀있는지 확인
        const storyScreen = document.getElementById('story-screen');
        if (storyScreen) {
            storyScreen.style.display = 'none';
            storyScreen.style.visibility = 'hidden';
            storyScreen.style.opacity = '0';
            storyScreen.style.zIndex = '100';
            storyScreen.style.pointerEvents = 'none';
            storyScreen.classList.remove('closing');
        }
        
        // story-mode-popup도 닫기
        const storyModePopup = document.getElementById('story-mode-popup');
        if (storyModePopup) {
            storyModePopup.style.display = 'none';
            storyModePopup.style.visibility = 'hidden';
            storyModePopup.style.opacity = '0';
            storyModePopup.style.zIndex = '100';
            storyModePopup.style.pointerEvents = 'none';
            storyModePopup.classList.remove('closing');
        }
        
        // 결과 화면 표시 (z-index 300으로 설정되어 있어서 위에 표시됨)
        openScreenOverlay('result-screen', true);

        const gain = game.stats.gain;
        const lost = game.stats.lost;

        document.getElementById('res-title').innerText = (win || game.mode === 'rush') ? "FINISHED!" : "FAILED";

        document.getElementById('res-gain').innerText = gain;
        document.getElementById('res-lost').innerText = lost;

        // Fix: Show Total Wallet explicitly
        // Clamp negative balance to 0 on game end
        if (db.gold < 0) { db.gold = 0; db.save(); }
        document.getElementById('res-current-total').innerText = db.gold;
        
        // 게임 상태 완전히 리셋
        game.isProcessing = false;
        game.mode = 'normal';
        game.currentDay = null;
    }
};

// Init
ui.updateGold();
ui.updateVisuals();
ui.updateDurability();
ui.updateMainStats();
ui.updateSkills();

const secret = {
    password: "770458",
    entered: "",
    adjustGold: 0,

    init: () => {
        const h1 = document.querySelector('#start-screen .card h1');
        if (h1 && h1.innerText.includes('킹왕짱 RPG')) {
            h1.innerHTML = h1.innerHTML.replace('킹', '<span id="secret-trigger" style="cursor:pointer;">킹</span>');
            document.getElementById('secret-trigger').addEventListener('click', secret.open);
        }

        const passwordBox = document.getElementById('password-input-boxes');
        for (let i = 0; i < secret.password.length; i++) {
            const box = document.createElement('div');
            box.className = 'password-box';
            box.id = `passbox-${i}`;
            passwordBox.appendChild(box);
        }
    },

    open: () => {
        openScreenOverlay('secret-menu-overlay', true);
        document.getElementById('password-modal').style.display = 'block';
        document.getElementById('gold-adjuster-modal').style.display = 'none';
        secret.entered = "";
        secret.updatePasswordDisplay();
    },

    close: () => {
        closeScreenOverlay('secret-menu-overlay', true);
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

            document.getElementById('gold-up').onclick = () => secret.updateGold(500);
            document.getElementById('gold-down').onclick = () => secret.updateGold(-500);

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
    },

    resetStats: () => {
        if (confirm("정말 모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
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

            alert("모든 데이터가 초기화되었습니다.");
            secret.close();
            location.reload();
        }
    }
};
function initSelections() {
    const daySelect = document.getElementById('day-select');
    const popupDaySelect = document.getElementById('popup-day-select');
    
    // Gather days from canonical `dayCatalog` and rawData (avoid referencing legacy `dayInfo`)
    const daysFromData = new Set();
    if (typeof rawData !== 'undefined' && Array.isArray(rawData)) rawData.forEach(r => { if (r && r.day) daysFromData.add(Number(r.day)); });

    const infoDays = (typeof dayCatalog !== 'undefined') ? Object.keys(dayCatalog).filter(k => !isNaN(Number(k))).map(Number) : [];
    const allDays = new Set([...infoDays, ...Array.from(daysFromData)]);

    const sortedDays = Array.from(allDays).filter(d => !Number.isNaN(d) && d > 0).sort((a, b) => a - b).filter(d => d <= 60);

    // Build options
    let html = '';
    sortedDays.forEach(d => {
        const label = (dayCatalog && dayCatalog[d] && dayCatalog[d].label) ? dayCatalog[d].label : `Day ${d}`;
        html += `<option value="${d}">${label}</option>`;
    });
    html += `<option value="all">전체 (혼돈의 균열)</option>`;

    // Initialize both selects
    if (daySelect) {
        daySelect.innerHTML = html;
        const last = db.lastSelectedDay || 'all';
        if (Array.from(daySelect.options).some(o => o.value === String(last))) {
            daySelect.value = last;
        } else {
            daySelect.value = 'all';
            db.lastSelectedDay = 'all';
            db.save();
        }
    }
    
    if (popupDaySelect) {
        popupDaySelect.innerHTML = html;
        const last = db.lastSelectedDay || 'all';
        if (Array.from(popupDaySelect.options).some(o => o.value === String(last))) {
            popupDaySelect.value = last;
        } else {
            popupDaySelect.value = 'all';
        }
    }
}

// Open story mode selection popup
function openStoryModePopup() {
    const popup = document.getElementById('story-mode-popup');
    const popupDaySelect = document.getElementById('popup-day-select');
    const popupCountSelect = document.getElementById('popup-count-select');
    
    if (!popup) return;
    
    // Mark popup as story mode
    popup.dataset.mode = 'story';
    
    // Enable day selection for story mode
    if (popupDaySelect) {
        popupDaySelect.disabled = false;
        popupDaySelect.style.display = ''; // Show day selection for story mode
    }
    
    // Restore last selected values
    const lastDay = db.lastSelectedDay || 'all';
    if (popupDaySelect && Array.from(popupDaySelect.options).some(o => o.value === String(lastDay))) {
        popupDaySelect.value = lastDay;
    }
    
    const lastCount = parseInt(localStorage.getItem('v7_last_count')) || 10;
    if (popupCountSelect) {
        popupCountSelect.value = String(lastCount);
    }
    
    popup.style.display = 'flex';
    
    // 히스토리 상태 추가 (백버튼 처리용)
    history.pushState({ screen: 'story-mode-popup' }, '', window.location.href);
    
    // 이미지 로드 후 버튼 오버레이 동기화
    const popupImg = document.getElementById('popup-background-img');
    if (popupImg) {
        if (popupImg.complete) {
            setTimeout(() => {
                syncPopupButtonOverlay();
            }, 100);
        } else {
            popupImg.addEventListener('load', () => {
                setTimeout(() => {
                    syncPopupButtonOverlay();
                }, 100);
            }, { once: true });
        }
    }
    
    // 드롭박스 값 변경 시 폰트 크기 재조정
    setupSelectFontSizeAdjustment();
}

// Open chaos rift selection popup
function openChaosRiftPopup() {
    const popup = document.getElementById('story-mode-popup');
    const popupDaySelect = document.getElementById('popup-day-select');
    const popupCountSelect = document.getElementById('popup-count-select');
    
    if (!popup) return;
    
    // Mark popup as chaos mode
    popup.dataset.mode = 'chaos';
    
    // For chaos rift, allow day selection
    if (popupDaySelect) {
        // 기본값을 'all'로 설정하되 사용자가 변경 가능
        const lastDay = db.lastSelectedDay || 'all';
        if (Array.from(popupDaySelect.options).some(o => o.value === String(lastDay))) {
            popupDaySelect.value = lastDay;
        } else {
            popupDaySelect.value = 'all';
        }
        popupDaySelect.style.display = ''; // Show day selection
        popupDaySelect.disabled = false; // Enable day selection for chaos rift
    }
    
    const lastCount = parseInt(localStorage.getItem('v7_last_count')) || 10;
    if (popupCountSelect) {
        popupCountSelect.value = String(lastCount);
    }
    
    popup.style.display = 'flex';
    
    // 히스토리 상태 추가 (백버튼 처리용)
    history.pushState({ screen: 'chaos-rift-popup' }, '', window.location.href);
    
    // 이미지 로드 후 버튼 오버레이 동기화
    const popupImg = document.getElementById('popup-background-img');
    if (popupImg) {
        if (popupImg.complete) {
            setTimeout(() => {
                syncPopupButtonOverlay();
            }, 100);
        } else {
            popupImg.addEventListener('load', () => {
                setTimeout(() => {
                    syncPopupButtonOverlay();
                }, 100);
            }, { once: true });
        }
    }
    
    // 드롭박스 값 변경 시 폰트 크기 재조정
    setupSelectFontSizeAdjustment();
}

// 공통 팝업 애니메이션 함수
function closeScreenOverlay(elementId, animated = true) {
    const element = document.getElementById(elementId);
    if (element) {
        // 게임 화면을 닫을 때 타이머 정지
        if (elementId === 'game-screen' && game && game.timer) {
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

// Close story mode selection popup
function closeStoryModePopup(animated = true) {
    closeScreenOverlay('story-mode-popup', animated);
    // 히스토리 상태 업데이트
    history.pushState(null, '', window.location.href);
}

// 드롭박스 폰트 크기를 동적으로 조정 (텍스트가 잘리지 않도록)
function adjustSelectFontSize(selectElement, width, height) {
    if (!selectElement) return;
    
    // 패딩을 고려한 실제 텍스트 영역
    const padding = 20; // 좌우 패딩 합계
    const textWidth = width - padding;
    const textHeight = height - 10; // 상하 패딩 고려
    
    // 최대 폰트 크기 계산 (높이 기준)
    const maxFontSizeByHeight = textHeight * 0.7;
    
    // 현재 선택된 옵션의 텍스트 길이 확인
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const text = selectedOption ? selectedOption.text : '';
    
    // 텍스트 길이에 따른 폰트 크기 계산
    // 한글 기준으로 대략적인 계산 (폰트 크기 * 0.6 정도가 한 글자 너비)
    let fontSize = maxFontSizeByHeight;
    if (text.length > 0) {
        // 텍스트가 너비에 맞는지 확인
        const estimatedCharWidth = fontSize * 0.6; // 한 글자당 대략적인 너비
        const requiredWidth = text.length * estimatedCharWidth;
        
        if (requiredWidth > textWidth) {
            // 텍스트가 너비를 초과하면 폰트 크기 조정
            fontSize = (textWidth / text.length) / 0.6;
        }
    }
    
    // 최소/최대 폰트 크기 제한
    fontSize = Math.max(14, Math.min(fontSize, 40));
    
    selectElement.style.fontSize = fontSize + 'px';
    
    // 옵션들도 같은 폰트 크기 적용
    Array.from(selectElement.options).forEach(option => {
        option.style.fontSize = fontSize + 'px';
    });
}

// 드롭박스 값 변경 시 폰트 크기 재조정 설정
function setupSelectFontSizeAdjustment() {
    const popupDaySelect = document.getElementById('popup-day-select');
    const popupCountSelect = document.getElementById('popup-count-select');
    
    // 드롭박스 값 변경 시 폰트 크기 재조정
    if (popupDaySelect && !popupDaySelect.dataset.fontAdjustmentSetup) {
        popupDaySelect.dataset.fontAdjustmentSetup = 'true';
        popupDaySelect.addEventListener('change', () => {
            setTimeout(() => {
                const popupImg = document.getElementById('popup-background-img');
                if (popupImg && popupImg.complete) {
                    const imgRect = popupImg.getBoundingClientRect();
                    adjustSelectFontSize(popupDaySelect, imgRect.width * 0.6, imgRect.height * 0.11);
                }
            }, 50);
        });
    }
    
    if (popupCountSelect && !popupCountSelect.dataset.fontAdjustmentSetup) {
        popupCountSelect.dataset.fontAdjustmentSetup = 'true';
        popupCountSelect.addEventListener('change', () => {
            setTimeout(() => {
                const popupImg = document.getElementById('popup-background-img');
                if (popupImg && popupImg.complete) {
                    const imgRect = popupImg.getBoundingClientRect();
                    adjustSelectFontSize(popupCountSelect, imgRect.width * 0.6, imgRect.height * 0.11);
                }
            }, 50);
        });
    }
}

// Popup 이미지 크기에 맞춰 버튼과 드롭박스 오버레이 동기화
function syncPopupButtonOverlay() {
    const popup = document.getElementById('story-mode-popup');
    // popup이 숨겨져 있으면 동기화하지 않음
    if (!popup || popup.style.display === 'none' || popup.style.display === '') {
        return;
    }
    
    const popupImg = document.getElementById('popup-background-img');
    const overlay = document.querySelector('.popup-buttons-overlay');
    const container = document.querySelector('.popup-container-wrapper');
    
    if (!popupImg || !overlay || !container) return;
    
    // 이미지가 로드된 후 크기 확인
    if (popupImg.complete) {
        const imgRect = popupImg.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        const left = imgRect.left - containerRect.left;
        const top = imgRect.top - containerRect.top;
        
        overlay.style.width = imgRect.width + 'px';
        overlay.style.height = imgRect.height + 'px';
        overlay.style.left = left + 'px';
        overlay.style.top = top + 'px';
        
        // 드롭박스와 버튼 위치 설정 (이미지 크기에 상대적)
        // 모험 지역 드롭박스 (더 길고 크게)
        const daySelect = document.getElementById('popup-day-select');
        if (daySelect) {
            const width = imgRect.width * 0.6;
            const height = imgRect.height * 0.11;
            daySelect.style.width = width + 'px';
            daySelect.style.height = height + 'px';
            daySelect.style.left = (imgRect.width * 0.14) + 'px';
            daySelect.style.top = (imgRect.height * 0.325) + 'px';
            
            // 폰트 크기 동적 조정 (드롭박스 크기에 맞춰)
            adjustSelectFontSize(daySelect, width, height);
        }
        
        // 난이도 드롭박스 (더 길고 크게)
        const countSelect = document.getElementById('popup-count-select');
        if (countSelect) {
            const width = imgRect.width * 0.6;
            const height = imgRect.height * 0.11;
            countSelect.style.width = width + 'px';
            countSelect.style.height = height + 'px';
            countSelect.style.left = (imgRect.width * 0.14) + 'px';
            countSelect.style.top = (imgRect.height * 0.59) + 'px';
            
            // 폰트 크기 동적 조정 (드롭박스 크기에 맞춰)
            adjustSelectFontSize(countSelect, width, height);
        }
        
        // 시작하기 버튼 (왼쪽 아래로)
        const startBtn = document.getElementById('popup-start-btn');
        if (startBtn) {
            startBtn.style.width = (imgRect.width * 0.375) + 'px';
            startBtn.style.height = (imgRect.height * 0.15) + 'px';
            startBtn.style.left = (imgRect.width * 0.095) + 'px';
            startBtn.style.top = (imgRect.height * 0.8) + 'px';
        }
        
        // 취소 버튼 (오른쪽 아래로)
        const cancelBtn = document.getElementById('popup-cancel-btn');
        if (cancelBtn) {
            cancelBtn.style.width = (imgRect.width * 0.375) + 'px';
            cancelBtn.style.height = (imgRect.height * 0.15) + 'px';
            cancelBtn.style.left = (imgRect.width * 0.525) + 'px';
            cancelBtn.style.top = (imgRect.height * 0.8) + 'px';
        }
    }
}

// Story screen 이미지 크기에 맞춰 버튼 오버레이 동기화
function syncStoryButtonOverlay() {
    const storyScreen = document.getElementById('story-screen');
    // story-screen이 숨겨져 있으면 동기화하지 않음
    if (!storyScreen || storyScreen.style.display === 'none' || storyScreen.style.display === '') {
        return;
    }
    
    const storyImg = document.querySelector('.story-background');
    const overlay = document.querySelector('.story-buttons-overlay');
    const container = document.querySelector('.story-container-wrapper');
    
    if (!storyImg || !overlay || !container) return;
    
    // 이미지가 로드된 후 크기 확인
    if (storyImg.complete) {
        const imgRect = storyImg.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        const left = imgRect.left - containerRect.left;
        const top = imgRect.top - containerRect.top;
        
        overlay.style.width = imgRect.width + 'px';
        overlay.style.height = imgRect.height + 'px';
        overlay.style.left = left + 'px';
        overlay.style.top = top + 'px';
    }
}

// Sync button overlay to match title.webp image size exactly
function syncTitleButtonOverlay() {
    const titleImg = document.querySelector('.title-background');
    const overlay = document.querySelector('.title-buttons-overlay');
    const container = document.querySelector('.title-container-wrapper');
    
    if (!titleImg || !overlay || !container) return;
    
    // Get actual rendered size of the image
    const imgRect = titleImg.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Calculate position relative to container
    const left = imgRect.left - containerRect.left;
    const top = imgRect.top - containerRect.top;
    
    // Set overlay to match image exactly
    overlay.style.width = imgRect.width + 'px';
    overlay.style.height = imgRect.height + 'px';
    overlay.style.left = left + 'px';
    overlay.style.top = top + 'px';

    // Keep game screen size in sync with the title image size
    syncGameScreenSizeToTitle();
}

function syncGameScreenSizeToTitle() {
    const titleImg = document.querySelector('.title-background');
    const gameScreen = document.getElementById('game-screen');
    if (!titleImg || !gameScreen) return;

    const naturalW = titleImg.naturalWidth || 0;
    const naturalH = titleImg.naturalHeight || 0;
    if (!naturalW || !naturalH) return;

    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const scale = Math.min(vw / naturalW, vh / naturalH);

    const w = Math.floor(naturalW * scale);
    const h = Math.floor(naturalH * scale);

    gameScreen.style.width = w + 'px';
    gameScreen.style.height = h + 'px';
}

window.onload = () => {
    // Validate dayCatalog coverage after all data is loaded
    if (typeof dayCatalog !== 'undefined' && typeof dayCatalog.validateCoverage === 'function') {
        dayCatalog.validateCoverage();
    }
    secret.init();
    inventory.render();
    initSelections();

    // Add event listeners for buttons
    document.getElementById('start-battle-btn').addEventListener('click', () => {
        const selectedDay = document.getElementById('day-select').value;
        console.log('[start-battle] selectedDay=', selectedDay);
        story.startIntro('normal', selectedDay);
    });
    document.getElementById('boss-rush-btn').addEventListener('click', () => story.startIntro('rush'));
    
    // Connect title image button areas to actual buttons
    const titleStoryModeBtn = document.getElementById('title-story-mode-btn'); // STORY MODE
    const titleChaosRiftBtn = document.getElementById('title-chaos-rift-btn'); // CHAOS RIFT
    const titleBossRushBtn = document.getElementById('title-boss-rush-btn');   // BOSS RUSH
    const titleShopBtn = document.getElementById('title-shop-btn');           // SHOP
    const titleProfileBtn = document.getElementById('title-profile-btn');     // PROFILE
    const titleSettingBtn = document.getElementById('title-setting-btn');     // SETTING (Secret Menu)
    
    if (titleStoryModeBtn) {
        titleStoryModeBtn.addEventListener('click', () => {
            openStoryModePopup();
        });
    }
    
    // Popup event listeners
    const popupStartBtn = document.getElementById('popup-start-btn');
    const popupCancelBtn = document.getElementById('popup-cancel-btn');
    const popupDaySelect = document.getElementById('popup-day-select');
    const popupCountSelect = document.getElementById('popup-count-select');
    
    if (popupStartBtn) {
        popupStartBtn.addEventListener('click', () => {
            const popup = document.getElementById('story-mode-popup');
            const selectedDay = popupDaySelect ? popupDaySelect.value : 'all';
            const selectedCount = popupCountSelect ? parseInt(popupCountSelect.value) : 10;
            
            // Check which mode opened the popup
            const popupMode = popup ? (popup.dataset.mode || 'story') : 'story';
            
            // Save selections
            db.lastSelectedDay = selectedDay;
            localStorage.setItem('v7_last_count', selectedCount);
            db.save();
            
            // Update hidden selects for compatibility
            const daySelect = document.getElementById('day-select');
            const countSelect = document.getElementById('count-select');
            if (daySelect) daySelect.value = selectedDay;
            if (countSelect) countSelect.value = String(selectedCount);
            
            // Close popup with animation and start game
            closeStoryModePopup(true);
            
            // 애니메이션이 완료된 후 게임 시작
            setTimeout(() => {
                if (popupMode === 'chaos') {
                    story.startIntro('chaos', selectedDay);
                } else {
                    story.startIntro('normal', selectedDay);
                }
            }, 400); // 애니메이션 시간과 일치
        });
    }
    
    if (popupCancelBtn) {
        popupCancelBtn.addEventListener('click', () => {
            closeStoryModePopup();
        });
    }
    if (titleChaosRiftBtn) {
        titleChaosRiftBtn.addEventListener('click', () => {
            openChaosRiftPopup();
        });
    }
    if (titleBossRushBtn) {
        titleBossRushBtn.addEventListener('click', () => story.startIntro('rush'));
    }
    if (titleShopBtn) {
        titleShopBtn.addEventListener('click', () => shop.open());
    }
    if (titleProfileBtn) {
        titleProfileBtn.addEventListener('click', () => inventory.open());
    }
    if (titleSettingBtn) {
        titleSettingBtn.addEventListener('click', () => secret.open());
    }
    
    // Sync button overlay to image size
    const titleImg = document.querySelector('.title-background');
    if (titleImg) {
        // Sync when image loads
        if (titleImg.complete) {
            syncTitleButtonOverlay();
        } else {
            titleImg.addEventListener('load', syncTitleButtonOverlay);
        }
        
        // Sync on window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(syncTitleButtonOverlay, 100);
        });
    }
    
    // Popup 이미지 로드 후 버튼 오버레이 동기화
    const popupImg = document.getElementById('popup-background-img');
    if (popupImg) {
        if (popupImg.complete) {
            syncPopupButtonOverlay();
        } else {
            popupImg.addEventListener('load', syncPopupButtonOverlay);
        }
        window.addEventListener('resize', () => {
            let resizeTimeout;
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(syncPopupButtonOverlay, 100);
        });
    }
    
    // 결과 화면 닫기 함수
    window.closeResultScreen = function() {
        closeScreenOverlay('result-screen', true);
        
        // story-screen 완전히 초기화
        const storyScreen = document.getElementById('story-screen');
        if (storyScreen) {
            storyScreen.style.display = 'none';
            storyScreen.style.visibility = '';
            storyScreen.style.opacity = '';
            storyScreen.style.zIndex = '';
            storyScreen.style.pointerEvents = '';
            storyScreen.classList.remove('closing');
            
            // 배경 이미지 초기화
            const storyImg = document.getElementById('story-background-img');
            if (storyImg) {
                storyImg.src = 'images/start.webp';
            }
            
            // 버튼 초기화
            const storyStartBtn = document.getElementById('story-start-btn');
            if (storyStartBtn) {
                storyStartBtn.classList.remove('boss-battle-btn');
                storyStartBtn.classList.add('story-mode-btn');
                storyStartBtn.style.pointerEvents = '';
                storyStartBtn.onclick = null;
            }
        }
        
        // story-mode-popup 초기화
        const storyModePopup = document.getElementById('story-mode-popup');
        if (storyModePopup) {
            storyModePopup.style.display = 'none';
            storyModePopup.style.visibility = '';
            storyModePopup.style.opacity = '';
            storyModePopup.style.zIndex = '';
            storyModePopup.style.pointerEvents = '';
            storyModePopup.classList.remove('closing');
        }
        
        // game-screen도 확실히 닫기
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.style.display = 'none';
        }
        
        setTimeout(() => {
            openScreenOverlay('start-screen', false);
            // 버튼 오버레이 동기화
            if (typeof syncTitleButtonOverlay === 'function') {
                syncTitleButtonOverlay();
            }
        }, 400);
        history.pushState(null, '', window.location.href);
    };
}
