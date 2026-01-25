// ----------------------------------------------------
// 2. SYSTEM (DB & Shop)
// ----------------------------------------------------
const db = {
    gold: parseInt(localStorage.getItem('v7_gold')) || 0,
    owned: JSON.parse(localStorage.getItem('v7_owned')) || ['basic'],
    equippedWeapon: localStorage.getItem('v7_equip') || 'basic',
    durability: JSON.parse(localStorage.getItem('v7_dura')) || {},
    stats: (() => {
        const saved = JSON.parse(localStorage.getItem('v7_stats')) || { solved: 0, correct: 0 };
        // 기존 데이터와의 호환성: objective/subjective 필드가 없으면 추가
        if (!saved.objective) {
            saved.objective = { solved: 0, correct: 0 };
        }
        if (!saved.subjective) {
            saved.subjective = { solved: 0, correct: 0, perfectDays: [] };
        }
        if (!saved.subjective.perfectDays) {
            saved.subjective.perfectDays = [];
        }
        return saved;
    })(),
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
    addStats: (isCorrect, questionType = 'objective') => {
        db.stats.solved++;
        if (isCorrect) db.stats.correct++;
        
        // 문제 타입별 통계 추가
        if (!db.stats[questionType]) {
            db.stats[questionType] = { solved: 0, correct: 0 };
        }
        db.stats[questionType].solved++;
        if (isCorrect) {
            db.stats[questionType].correct++;
        }
        
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

const statistics = {
    open: () => {
        closeScreenOverlay('start-screen', false);
        openScreenOverlay('statistics-screen', true);
        history.pushState({ screen: 'statistics' }, '', window.location.href);
        statistics.render();
    },
    close: () => {
        closeScreenOverlay('statistics-screen', true);
        setTimeout(() => {
            openScreenOverlay('start-screen', false);
        }, 400);
        history.pushState(null, '', window.location.href);
    },
    render: () => {
        const container = document.getElementById('statistics-container');
        container.innerHTML = '';
        document.getElementById('statistics-gold').innerText = db.gold;

        // 통계 데이터 계산
        const solved = db.stats.solved || 0;
        const correct = db.stats.correct || 0;
        const rate = solved > 0 ? Math.round((correct / solved) * 100) : 0;
        const wrong = solved - correct;
        
        // 객관식/주관식 통계
        const objectiveStats = db.stats.objective || { solved: 0, correct: 0 };
        const subjectiveStats = db.stats.subjective || { solved: 0, correct: 0 };
        const objectiveSolved = objectiveStats.solved || 0;
        const objectiveCorrect = objectiveStats.correct || 0;
        const objectiveRate = objectiveSolved > 0 ? Math.round((objectiveCorrect / objectiveSolved) * 100) : 0;
        const subjectiveSolved = subjectiveStats.solved || 0;
        const subjectiveCorrect = subjectiveStats.correct || 0;
        const subjectiveRate = subjectiveSolved > 0 ? Math.round((subjectiveCorrect / subjectiveSolved) * 100) : 0;

        // 보유 아이템 수
        const ownedItems = db.owned.length;
        const inventoryItems = db.inventory.length;
        const totalItems = ownedItems + inventoryItems;

        // 장착한 장비 목록
        const equippedItems = [];
        if (db.equipped['head']) {
            const item = items.find(i => i.id === db.equipped['head']);
            if (item) equippedItems.push({ slot: '머리', name: item.name, icon: item.icon });
        }
        if (db.equipped['hand-1']) {
            const item = weapons.find(w => w.id === db.equipped['hand-1']) || items.find(i => i.id === db.equipped['hand-1']);
            if (item) equippedItems.push({ slot: '오른손', name: item.name, icon: item.icon });
        }
        if (db.equipped['hand-2']) {
            const item = weapons.find(w => w.id === db.equipped['hand-2']) || items.find(i => i.id === db.equipped['hand-2']);
            if (item) equippedItems.push({ slot: '왼손', name: item.name, icon: item.icon });
        }
        if (db.equipped['foot-1'] || db.equipped['foot-2']) {
            const item = items.find(i => i.id === db.equipped['foot-1'] || i.id === db.equipped['foot-2']);
            if (item) equippedItems.push({ slot: '발', name: item.name, icon: item.icon });
        }

        // 보유 스킬
        const skills = [];
        if (db.skills.hint > 0) {
            const skill = relics.find(r => r.id === 'hint');
            if (skill) skills.push({ name: skill.name, count: db.skills.hint });
        }
        if (db.skills.ultimate > 0) {
            const skill = relics.find(r => r.id === 'ultimate');
            if (skill) skills.push({ name: skill.name, count: db.skills.ultimate });
        }

        let html = '';

        // 게임 통계
        html += '<div class="shop-section">📊 게임 통계</div>';
        html += `<div class="shop-item">
            <div><b>총 해결한 문제</b></div>
            <div style="font-size:20px; color:var(--primary); font-weight:bold;">${solved}개</div>
        </div>`;
        html += `<div class="shop-item">
            <div><b>정답 수</b></div>
            <div style="font-size:20px; color:#4CAF50; font-weight:bold;">${correct}개</div>
        </div>`;
        html += `<div class="shop-item">
            <div><b>오답 수</b></div>
            <div style="font-size:20px; color:#FF5252; font-weight:bold;">${wrong}개</div>
        </div>`;
        html += `<div class="shop-item">
            <div><b>정답률</b></div>
            <div style="font-size:20px; color:var(--primary); font-weight:bold;">${rate}%</div>
        </div>`;

        // 문제 타입별 통계
        html += '<div class="shop-section" style="margin-top:20px;">📝 문제 타입별 통계</div>';
        
        // 객관식 통계
        html += '<div class="shop-item" style="background:rgba(33, 150, 243, 0.1); border-left:3px solid #2196F3; padding-left:12px;">';
        html += '<div><b>📋 객관식</b></div>';
        html += `<div style="margin-top:8px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span>해결: ${objectiveSolved}개</span>
                <span style="color:#4CAF50; margin-left:12px;">정답: ${objectiveCorrect}개</span>
            </div>
            <div style="font-size:18px; color:#2196F3; font-weight:bold;">정답률: ${objectiveRate}%</div>
        </div>`;
        html += '</div>';
        
        // 주관식 통계 (객관식과 동일한 형식)
        html += '<div class="shop-item" style="background:rgba(156, 39, 176, 0.1); border-left:3px solid #9C27B0; padding-left:12px;">';
        html += '<div><b>✍️ 주관식</b></div>';
        html += `<div style="margin-top:8px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span>해결: ${subjectiveSolved}개</span>
                <span style="color:#4CAF50; margin-left:12px;">정답: ${subjectiveCorrect}개</span>
            </div>
            <div style="font-size:18px; color:#9C27B0; font-weight:bold;">정답률: ${subjectiveRate}%</div>`;
        
        // 주관식을 전부 맞춘 날 표시
        const perfectDays = db.stats.subjective?.perfectDays || [];
        if (perfectDays.length > 0) {
            // 가장 최근 날짜 (배열의 마지막 요소)
            const latestPerfect = perfectDays[perfectDays.length - 1];
            html += `<div style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(156, 39, 176, 0.3);">
                <div style="font-size:14px; color:#9C27B0; font-weight:bold; margin-bottom:4px;">✨ 주관식 전부 맞춘 날</div>
                <div style="font-size:16px; color:var(--gold);">${latestPerfect.displayDate || latestPerfect.date}</div>
                ${perfectDays.length > 1 ? `<div style="font-size:12px; color:#aaa; margin-top:4px;">총 ${perfectDays.length}회 달성</div>` : ''}
            </div>`;
        }
        
        html += '</div>';
        html += '</div>';

        // 보유 스킬
        if (skills.length > 0) {
            html += '<div class="shop-section" style="margin-top:20px;">✨ 보유 스킬</div>';
            skills.forEach(skill => {
                html += `<div class="shop-item">
                    <div><b>${skill.name}</b></div>
                    <div style="font-size:20px; color:var(--primary); font-weight:bold;">${skill.count}개</div>
                </div>`;
            });
        }

        container.innerHTML = html;
    }
};

const ui = {
    updateGold: () => {
        const titleGold = document.getElementById('title-ui-gold');
        if (titleGold) titleGold.innerText = db.gold;
        const overlayGold = document.getElementById('overlay-gold');
        if (overlayGold) overlayGold.innerText = db.gold;
    },
    updateGameInfo: (mode, day) => {
        const modeText = mode === 'boss' ? '보스 모드' : (mode === 'battle' ? '배틀 모드' : '배틀 모드');
        let dayText;
        if (mode === 'boss') {
            dayText = '무한';
        } else {
            // battle 모드와 practice 모드 모두 day에 따라 표시
            if (day === 'all') {
                dayText = '전체';
            } else if (day && !isNaN(Number(day))) {
                dayText = `Day ${day}`;
            } else {
                // game.currentDay를 확인
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
            gameInfoEl.innerText = `${modeText} - ${dayText}`;
        }
    },
    updateVisuals: () => {
        document.getElementById('hero-img').src = "images/battle_mode/hero.webp";

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
            gloveBtn.innerHTML = `<span>🥊</span> <span class="skill-count">${db.durability['goldGlove'] || 0}/30</span>`;
            gloveBtn.title = '황금장갑 (패시브): 골드 획득 x1.5배';
            container.appendChild(gloveBtn);
        }

        if (hintData && db.skills.hint > 0) {
            hasSkills = true;
            const hintBtn = document.createElement('button');
            hintBtn.className = isBossQuestion ? 'skill-btn skill-active disabled' : 'skill-btn skill-active';
            const hintIcon = hintData.name.split(' ')[0] || '🧪';
            hintBtn.innerHTML = `<span>${hintIcon}</span> <span class="skill-count">${db.skills.hint}</span>`;
            hintBtn.onclick = game.useHint;
            hintBtn.title = isBossQuestion ? '힌트: 주관식에서는 사용 불가' : '힌트: 클릭하여 사용';
            container.appendChild(hintBtn);
        }

        if (ultimateData && db.skills.ultimate > 0) {
            hasSkills = true;
            const ultimateBtn = document.createElement('button');
            ultimateBtn.className = isBossQuestion ? 'skill-btn skill-active disabled' : 'skill-btn skill-active';
            const ultimateIcon = ultimateData.name.split(' ')[0] || '⚡';
            ultimateBtn.innerHTML = `<span>${ultimateIcon}</span> <span class="skill-count">${db.skills.ultimate}</span>`;
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
        'images/battle_mode/monster_1.webp',
        'images/battle_mode/monster_2.webp',
        'images/battle_mode/monster_3.webp'
    ],
    boss: [
        'images/battle_mode/monster_1.webp',
        'images/battle_mode/monster_2.webp',
        'images/battle_mode/monster_3.webp'
    ],
    byDay: {
        // Day-specific mapping — useful for testing and unique bosses
        // add more: '5': ['images/battle_mode/monster_1.webp', 'images/battle_mode/monster_2.webp']
    },
    fallback: 'images/battle_mode/monster_1.webp'
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
    if (day === 'boss') return (dayCatalog && dayCatalog['boss'] && dayCatalog['boss'].story) || null;
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
        story.day = (mode === 'boss') ? 'boss' : daySel;
        story.mode = mode;
        const data = resolveStoryData(story.day);

        // 모드에 따라 적절한 story-screen ID 결정
        const storyScreenId = (mode === 'boss') ? 'boss-mode-screen' : (mode === 'practice') ? 'practice-mode-screen' : 'battle-mode-screen';
        const storyScreenPrefix = (mode === 'boss') ? 'boss-mode' : (mode === 'practice') ? 'practice-mode' : 'battle-mode';

        // DEBUG: verify where title is coming from and ensure we're updating the visible element
        const hasEntry = !!(dayCatalog && dayCatalog[story.day] && dayCatalog[story.day].story);
        const optNode = document.querySelector(`#day-select option[value="${story.day}"]`);
        console.log('[story.startIntro] dbg -> day=', story.day, 'hasEntry=', hasEntry, 'optText=', optNode && optNode.textContent);
        console.log('[story.startIntro] dbg -> data.title=', data.title);

        const titleElId = `${storyScreenPrefix}-title`;
        const titleEls = document.querySelectorAll(`#${titleElId}`);
        if (titleEls.length > 1) console.warn(`[story.startIntro] multiple #${titleElId} elements found:`, titleEls.length);
        const titleEl = document.getElementById(titleElId);
        console.log(`[story.startIntro] current #${titleElId} before=`, titleEl && titleEl.innerText);

        // Prefer the Day label from the canonical catalog; fall back to legacy views
        const dayLabel = (story.day && typeof dayCatalog !== 'undefined' && dayCatalog[story.day] && dayCatalog[story.day].label) ? dayCatalog[story.day].label : (story.day === 'all' ? (dayCatalog && dayCatalog['all'] && dayCatalog['all'].label) : (story.day === 'boss' ? '보스 모드' : `Day ${story.day}`));
        const _t = data && data.title ? String(data.title).trim() : '';
        const displayTitle = (_t && dayLabel.indexOf(_t) === -1) ? `${dayLabel} — ${_t}` : dayLabel;

        closeScreenOverlay('start-screen', false);
        
        // 다른 story-screen 닫기
        const practiceModeStoryScreen = document.getElementById('practice-mode-screen');
        const battleModeStoryScreen = document.getElementById('battle-mode-screen');
        const bossStoryScreen = document.getElementById('boss-mode-screen');
        if (practiceModeStoryScreen && storyScreenId !== 'practice-mode-screen') {
            practiceModeStoryScreen.style.display = 'none';
        }
        if (battleModeStoryScreen && storyScreenId !== 'battle-mode-screen') {
            battleModeStoryScreen.style.display = 'none';
        }
        if (bossStoryScreen && storyScreenId !== 'boss-mode-screen') {
            bossStoryScreen.style.display = 'none';
        }
        
        // story-screen 스타일 초기화
        const storyScreen = document.getElementById(storyScreenId);
        if (storyScreen) {
            storyScreen.style.visibility = '';
            storyScreen.style.opacity = '';
            storyScreen.style.zIndex = '';
            storyScreen.style.pointerEvents = '';
            storyScreen.classList.remove('closing');
        }
        
        openScreenOverlay(storyScreenId, true);
        
        // 히스토리 상태 추가 (백버튼 처리용)
        history.pushState({ screen: storyScreenId }, '', window.location.href);
        
        // 타이틀 크기 먼저 동기화 (스토리 화면 크기가 타이틀 기준이므로)
        if (typeof syncTitleButtonOverlay === 'function') {
            syncTitleButtonOverlay();
        }
        
        // 모든 모드에서 boss_mode_popup.webp 사용
        const storyImg = document.getElementById(`${storyScreenPrefix}-background-img`);
        const storyStartBtn = document.getElementById(`${storyScreenPrefix}-start-btn`);
        if (storyImg) {
            storyImg.src = 'images/battle_mode/boss_mode_popup.webp';
            // 보스 모드 클래스 추가
            if (storyStartBtn) {
                storyStartBtn.classList.add('boss-mode-btn');
                storyStartBtn.classList.remove('practice-btn');
            }
            
            // 이미지 로드 후 버튼 오버레이 동기화
            if (storyImg.complete) {
                setTimeout(() => {
                    syncStoryButtonOverlay(storyScreenId);
                }, 100);
            } else {
                storyImg.addEventListener('load', () => {
                    setTimeout(() => {
                        syncStoryButtonOverlay(storyScreenId);
                    }, 100);
                }, { once: true });
            }
        }
        
        // write and verify immediately via centralized setter (protects against duplicate IDs / external overwrites)
        if (window.ui && typeof window.ui.setStoryTitle === 'function') {
            window.ui.setStoryTitle(displayTitle, storyScreenPrefix);
        } else {
            const te = document.getElementById(titleElId); if (te) te.innerText = displayTitle; console.warn(`[story.startIntro] fallback title write used for ${titleElId}`);
        }
        
        // Day 정보 표시
        const dayInfoEl = document.getElementById(`${storyScreenPrefix}-day-info`);
        if (dayInfoEl) {
            dayInfoEl.innerText = displayTitle;
        }
        
        // 이야기 텍스트 표시
        const textEl = document.getElementById(`${storyScreenPrefix}-text`);
        if (textEl) {
            let introText = data.intro || '';
            textEl.innerText = introText;
        }

        // capture the resolved day at intro time so the button uses the same day even if user changes select afterwards
        const resolvedAtIntro = (story.mode === 'boss') ? 'boss' : daySel;
        
        // 이미지의 "모험시작" 버튼에 이벤트 연결
        if (storyStartBtn) {
            // 기존 이벤트 리스너 완전히 제거
            storyStartBtn.onclick = null;
            // 모든 이벤트 리스너 제거를 위해 클론 후 교체
            const newBtn = storyStartBtn.cloneNode(true);
            storyStartBtn.parentNode.replaceChild(newBtn, storyStartBtn);
            const freshBtn = document.getElementById(`${storyScreenPrefix}-start-btn`);
            
            // 새 이벤트 리스너 추가
            if (freshBtn) {
                freshBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Story start button clicked');
                    // 게임 오버 처리 중이면 시작하지 않음
                    if (game.isProcessing) {
                        console.log('[startGame] 게임 오버 처리 중이므로 시작하지 않음');
                        return;
                    }
                    const resolvedAtIntro = (story.mode === 'boss') ? 'boss' : daySel;
                    console.log('[story-btn] introResolvedDay=', resolvedAtIntro, 'story.mode=', story.mode);
                    
                    // Practice 모드는 암기 모드로 시작, 다른 모드는 기존대로 게임 시작
                    if (story.mode === 'practice') {
                        practiceMemorization.start(resolvedAtIntro);
                    } else {
                        game.init(story.mode, resolvedAtIntro);
                    }
                }, { capture: true });
                freshBtn.style.pointerEvents = 'auto'; // 클릭 활성화
                freshBtn.style.cursor = 'pointer';
                freshBtn.style.zIndex = '25';
            }
        } else {
            console.warn(`${storyScreenPrefix}-start-btn not found`);
        }
    },
    showEnding: (win) => {
        // 게임 타이머 정지
        if (game.timer) {
            clearInterval(game.timer);
            game.timer = null;
        }
        
        // 배경음악 정지
        const bgMusic = document.getElementById('background-music');
        if (bgMusic && !bgMusic.paused) {
            bgMusic.pause();
        }
        
        // 게임 오버 상태로 설정 (게임이 자동으로 다시 시작되지 않도록)
        game.isProcessing = true;
        
        document.getElementById('game-screen').style.display = 'none';
        
        // story-screen을 확실히 닫기
        const practiceModeStoryScreen = document.getElementById('practice-mode-screen');
        const battleModeStoryScreen = document.getElementById('battle-mode-screen');
        const bossStoryScreen = document.getElementById('boss-mode-screen');
        if (practiceModeStoryScreen) {
            practiceModeStoryScreen.style.display = 'none';
            practiceModeStoryScreen.style.visibility = 'hidden';
            practiceModeStoryScreen.style.opacity = '0';
            practiceModeStoryScreen.style.zIndex = '100';
            practiceModeStoryScreen.style.pointerEvents = 'none';
            practiceModeStoryScreen.classList.remove('closing');
        }
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
        
        // practice-mode-popup과 battle-mode-setting-popup 닫기
        const practiceModePopup = document.getElementById('practice-mode-popup');
        const battleModePopup = document.getElementById('battle-mode-setting-popup');
        if (practiceModePopup) {
            practiceModePopup.style.display = 'none';
            practiceModePopup.style.visibility = 'hidden';
            practiceModePopup.style.opacity = '0';
            practiceModePopup.style.zIndex = '100';
            practiceModePopup.style.pointerEvents = 'none';
            practiceModePopup.classList.remove('closing');
        }
        if (battleModePopup) {
            battleModePopup.style.display = 'none';
            battleModePopup.style.visibility = 'hidden';
            battleModePopup.style.opacity = '0';
            battleModePopup.style.zIndex = '100';
            battleModePopup.style.pointerEvents = 'none';
            battleModePopup.classList.remove('closing');
        }
        if (battleModePopup) {
            battleModePopup.style.display = 'none';
            battleModePopup.style.visibility = 'hidden';
            battleModePopup.style.opacity = '0';
            battleModePopup.style.zIndex = '100';
            battleModePopup.style.pointerEvents = 'none';
            battleModePopup.classList.remove('closing');
        }
        
        // 모든 모드에서 story-screen을 건너뛰고 바로 결과 화면으로
        game.end(win);
    }
};

// safety helpers — cleanup and runtime sanity checks (kept top-level for easy console access)
// 개발/디버깅용 함수들 - HTML에 #story-title 요소가 없으므로 비활성화됨
// 필요시 주석을 해제하고 HTML에 해당 요소를 추가하면 사용 가능
/*
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
    // convenience alias from console - 비활성화됨 (HTML에 #story-title 요소 없음)
    // window.runGameSanityTest = () => __runGameSanityChecks(opts);
    return out;
}
*/

// 4. GAME Logic
const game = {
    list: [], idx: 0, timer: null, timeLeft: 0, maxTime: 10,
    stats: { gain: 0, lost: 0 }, currentQ: null, isProcessing: false, currentAns: "", mode: 'battle',
    deck: [], currentDay: null, battleQuestionType: 'mixed',
    subjectiveTotal: 0, // 주관식 문제 총 개수
    subjectiveCorrect: 0, // 주관식 문제 정답 개수

    init: (mode, day) => {
        const count = parseInt(document.getElementById('count-select').value);
        game.mode = mode;
        game.currentDay = day;

        // story-screen을 애니메이션과 함께 닫기
        closeScreenOverlay('practice-mode-screen', true);
        closeScreenOverlay('battle-mode-screen', true);
        closeScreenOverlay('boss-mode-screen', true);

        let pool;
        // 현재 데이터셋의 rawData 사용 (게임 데이터 변경 시 최신 데이터 반영)
        const currentRawData = (typeof window !== 'undefined' && window.rawDataData) ? window.rawDataData : rawData;
        // normalize day and strictly match numeric day values to avoid cross-day leakage
        if (day === 'all' || day === 'boss') {
            pool = currentRawData;
        } else {
            const dayNum = Number(day);
            pool = currentRawData.filter(i => Number(i.day) === dayNum);
        }
        console.log('[game.init] mode=', mode, 'day=', day, 'poolSize=', (pool && pool.length));
        if (pool.length < 4) { alert("데이터 부족"); location.reload(); return; }

        game.maxTime = db.has('hourglass') ? 15 : 10;
        game.stats = { gain: 0, lost: 0 };
        game.idx = 0;
        game.isProcessing = false;
        game.subjectiveTotal = 0;
        game.subjectiveCorrect = 0;

        if (mode === 'boss') {
            // 현재 데이터셋의 rawData 사용
            const currentRawData = (typeof window !== 'undefined' && window.rawDataData) ? window.rawDataData : rawData;
            game.deck = game.shuffle([...currentRawData]);
            game.list = [];
        } else if (mode === 'battle') {
            // Battle Mode: Question type depends on user selection
            let shuffledPool = game.shuffle(pool);
            const questionType = game.battleQuestionType || 'mixed'; // default to 'mixed'
            console.log('[game.init] battle mode - questionType:', questionType, 'battleQuestionType:', game.battleQuestionType);
            
            if (questionType === 'objective') {
                // 객관식만: 모든 문제를 객관식으로
                console.log('[game.init] 객관식만 모드 - 모든 문제를 객관식으로 설정');
                game.list = shuffledPool.slice(0, count).map(q => ({ ...q, isBoss: false }));
            } else if (questionType === 'subjective') {
                // 주관식만: 모든 문제를 주관식으로
                console.log('[game.init] 주관식만 모드 - 모든 문제를 주관식으로 설정');
                game.list = shuffledPool.slice(0, count).map(q => ({ ...q, isBoss: true }));
            } else {
                // 혼합형: 객관식과 주관식이 번갈아 나오도록
                console.log('[game.init] 혼합형 모드 - 객관식과 주관식 번갈아 표시');
                const bossCount = Math.floor(count / 2); // 50%
                const normalCount = count - bossCount; // 나머지
                
                // 주관식과 객관식 문제를 각각 준비
                const bossQuestions = shuffledPool.slice(0, bossCount).map(q => ({ ...q, isBoss: true }));
                const normalQuestions = shuffledPool.slice(bossCount, bossCount + normalCount).map(q => ({ ...q, isBoss: false }));
                
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
            const bossCount = game.list.filter(q => q.isBoss).length;
            const normalCount = game.list.filter(q => !q.isBoss).length;
            console.log('[game.init] 생성된 문제 - 주관식:', bossCount, '객관식:', normalCount, '총:', game.list.length);
        } else {
            let shuffledPool = game.shuffle(pool);
            const bossCount = Math.max(1, Math.floor(count * 0.2));
            const normalCount = count - bossCount;

            const bossQuestions = shuffledPool.slice(0, bossCount).map(q => ({ ...q, isBoss: true }));
            const normalQuestions = shuffledPool.slice(bossCount, count).map(q => ({ ...q, isBoss: false }));

            game.list = game.shuffle([...bossQuestions, ...normalQuestions]);
        }
        
        // 주관식 문제 총 개수 계산
        game.subjectiveTotal = game.list.filter(q => q.isBoss).length;

        // 애니메이션 완료 후 게임 화면 표시
        setTimeout(() => {
            document.getElementById('game-screen').style.display = 'flex';
            
            // 배경음악 재생
            const bgMusic = document.getElementById('background-music');
            if (bgMusic) {
                bgMusic.play().catch(err => {
                    console.log('Background music play failed:', err);
                });
            }

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
        const upcoming = (game.mode === 'boss') ? null : (game.list && game.list[game.idx]) || null;
        const isBossPreview = (game.mode === 'boss') ? true : !!(upcoming && upcoming.isBoss);
        const sprite = pickMonsterSprite(upcoming || story.day, isBossPreview);
        document.getElementById('monster-img').src = sprite;

        if (game.mode === 'boss') {
            if (game.deck.length === 0) { story.showEnding(true); return; }
            game.currentQ = game.deck.pop();
            document.getElementById('wave-badge').innerText = "Wave: " + (game.idx + 1);
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
            document.getElementById('wave-badge').innerText = `Enemy: ${game.idx + 1}/${game.list.length}`;
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
            document.getElementById('wave-badge').innerText = `Enemy: ${game.idx + 1}/${game.list.length}`;
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
        // 주관식 문제일 때는 타이머를 시작하지 않음
        if (!game.currentQ.isBoss) {
            game.startTimer();
        } else {
            // 주관식 문제일 때는 타이머 정지 및 타이머 바 숨김
            if (game.timer) {
                clearInterval(game.timer);
                game.timer = null;
            }
            const overlayBar = document.getElementById('overlay-timer');
            if (overlayBar) {
                overlayBar.style.width = "100%";
                overlayBar.classList.remove('timer-danger');
            }
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

    renderBoss: (data, isBoss) => {
        console.log('[game.renderBoss] day=', data && data.day, 'word=', data && data.word, 'isBoss=', !!isBoss);
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
        document.getElementById('boss-title').innerText = isFinalBoss ? "⚠️ BOSS BATTLE" : (isBoss ? `🔥 WAVE ${game.idx + 1}` : "⚔️ ELITE");

        document.getElementById('q-label').innerText = "TYPE IN ENGLISH";
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
        
        game.handleAnswer(isCorrect, null, 'subjective');
    },

    handleAnswer: (isCorrect, btnElement, questionType = 'objective') => {
        if (game.isProcessing) return;
        game.isProcessing = true;
        clearInterval(game.timer);

        // Record Stats (문제 타입 포함)
        db.addStats(isCorrect, questionType);
        
        // 주관식 문제 정답 추적
        if (questionType === 'subjective' && isCorrect) {
            game.subjectiveCorrect++;
        }
        
        if (isCorrect) {
            game.animAttack();

            // Reward Logic
            let baseGain = 40;
            if (game.mode === 'boss') {
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
                    bossInput.style.borderColor = "#FF5252";
                    bossInput.disabled = true; // 입력 비활성화
                    bossInput.onkeypress = null; // 키 이벤트 제거
                }
                
                // 오답일 때 정답 표시
                game.showCorrectAnswer(game.currentAns, 'subjective');
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

            if (btnElement) {
                btnElement.style.background = "#D32F2F";
            } else {
                document.getElementById('boss-input').style.borderColor = "#D32F2F";
            }

            // 오답일 때 정답 표시 (문제 타입에 따라 다르게 처리)
            const questionType = document.getElementById('boss-box').style.display === 'flex' ? 'subjective' : 'objective';
            game.showCorrectAnswer(game.currentAns, questionType);

            // IMPORTANT: Ensure timeout triggers next level even if animation fails
            setTimeout(() => { game.idx++; game.nextLevel(); }, 2500);
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
        const wrongBtns = btns.filter(b => b.innerText !== game.currentAns);
        game.shuffle(wrongBtns).slice(0, 2).forEach(b => { b.classList.add('disabled'); b.style.opacity = "0.2"; });
    },
    useUltimate: () => {
        if (game.isProcessing || game.mode === 'boss' || db.skills.ultimate <= 0) return;
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
            optionBtns.forEach(btn => {
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
        // 현재 데이터셋의 rawData 사용
        const currentRawData = (typeof window !== 'undefined' && window.rawDataData) ? window.rawDataData : rawData;
        const source = (typeof decoyWords !== 'undefined' && decoyWords.length > 0) ? currentRawData.concat(decoyWords) : currentRawData;
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
            // 현재 데이터셋의 rawData 사용
            const currentRawData = (typeof window !== 'undefined' && window.rawDataData) ? window.rawDataData : rawData;
            const emergencyDistractor = game.shuffle([...currentRawData])[0];
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
        const practiceModeStoryScreen = document.getElementById('practice-mode-screen');
        const battleModeStoryScreen = document.getElementById('battle-mode-screen');
        const bossStoryScreen = document.getElementById('boss-mode-screen');
        if (practiceModeStoryScreen) {
            practiceModeStoryScreen.style.display = 'none';
            practiceModeStoryScreen.style.visibility = 'hidden';
            practiceModeStoryScreen.style.opacity = '0';
            practiceModeStoryScreen.style.zIndex = '100';
            practiceModeStoryScreen.style.pointerEvents = 'none';
            practiceModeStoryScreen.classList.remove('closing');
        }
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
        
        // practice-mode-popup과 battle-mode-setting-popup도 닫기
        const practiceModePopup = document.getElementById('practice-mode-popup');
        const battleModePopup = document.getElementById('battle-mode-setting-popup');
        if (practiceModePopup) {
            practiceModePopup.style.display = 'none';
            practiceModePopup.style.visibility = 'hidden';
            practiceModePopup.style.opacity = '0';
            practiceModePopup.style.zIndex = '100';
            practiceModePopup.style.pointerEvents = 'none';
            practiceModePopup.classList.remove('closing');
        }
        if (battleModePopup) {
            battleModePopup.style.display = 'none';
            battleModePopup.style.visibility = 'hidden';
            battleModePopup.style.opacity = '0';
            battleModePopup.style.zIndex = '100';
            battleModePopup.style.pointerEvents = 'none';
            battleModePopup.classList.remove('closing');
        }
        if (battleModePopup) {
            battleModePopup.style.display = 'none';
            battleModePopup.style.visibility = 'hidden';
            battleModePopup.style.opacity = '0';
            battleModePopup.style.zIndex = '100';
            battleModePopup.style.pointerEvents = 'none';
            battleModePopup.classList.remove('closing');
        }
        
        // 결과 화면 표시 (z-index 300으로 설정되어 있어서 위에 표시됨)
        openScreenOverlay('result-screen', true);

        const gain = game.stats.gain;
        const lost = game.stats.lost;

        document.getElementById('res-title').innerText = (win || game.mode === 'boss') ? "FINISHED!" : "FAILED";

        document.getElementById('res-gain').innerText = gain;
        document.getElementById('res-lost').innerText = lost;

        // Fix: Show Total Wallet explicitly
        // Clamp negative balance to 0 on game end
        if (db.gold < 0) { db.gold = 0; db.save(); }
        document.getElementById('res-current-total').innerText = db.gold;
        
        // 주관식 문제를 모두 맞췄는지 확인
        if (game.subjectiveTotal > 0 && game.subjectiveCorrect === game.subjectiveTotal) {
            const today = new Date();
            const dateStr = today.toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            // 기존 데이터와의 호환성
            if (!db.stats.subjective) {
                db.stats.subjective = { solved: 0, correct: 0 };
            }
            
            // 최근 날짜 기록 (배열로 저장하여 여러 번 기록 가능)
            if (!db.stats.subjective.perfectDays) {
                db.stats.subjective.perfectDays = [];
            }
            
            // 오늘 날짜가 이미 기록되어 있지 않으면 추가
            const todayISO = today.toISOString().split('T')[0];
            const existingIndex = db.stats.subjective.perfectDays.findIndex(d => d.date === todayISO);
            
            if (existingIndex === -1) {
                db.stats.subjective.perfectDays.push({
                    date: todayISO,
                    displayDate: dateStr
                });
            } else {
                // 이미 있으면 업데이트 (최신 날짜로)
                db.stats.subjective.perfectDays[existingIndex].displayDate = dateStr;
            }
            
            // 날짜순으로 정렬 (최신이 마지막)
            db.stats.subjective.perfectDays.sort((a, b) => a.date.localeCompare(b.date));
            
            db.save();
        }
        
        // 게임 상태 완전히 리셋
        game.isProcessing = false;
        game.mode = 'battle';
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
        document.getElementById('password-modal').style.display = 'none';
        document.getElementById('gold-adjuster-modal').style.display = 'block';
        secret.adjustGold = 0;
        document.getElementById('current-gold-display').innerText = db.gold;
        document.getElementById('adjust-gold-display').innerText = secret.adjustGold;

        document.getElementById('gold-up').onclick = () => secret.updateGold(500);
        document.getElementById('gold-down').onclick = () => secret.updateGold(-500);
    },

    close: () => {
        // 비밀번호 모달이 열려있으면 골드 조정 화면으로 돌아가기
        const passwordModal = document.getElementById('password-modal');
        if (passwordModal && passwordModal.style.display !== 'none') {
            passwordModal.style.display = 'none';
            document.getElementById('gold-adjuster-modal').style.display = 'block';
            secret.entered = "";
            secret.pendingAction = null;
            return;
        }
        closeScreenOverlay('secret-menu-overlay', true);
        secret.pendingAction = null;
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
            
            // pendingAction이 있으면 실행 (applyGold 또는 resetStats)
            if (secret.pendingAction) {
                secret.pendingAction();
                secret.pendingAction = null;
            } else {
                // 기존 로직 (처음 열 때)
                document.getElementById('gold-adjuster-modal').style.display = 'block';
                secret.adjustGold = 0;
                document.getElementById('current-gold-display').innerText = db.gold;
                document.getElementById('adjust-gold-display').innerText = secret.adjustGold;

                document.getElementById('gold-up').onclick = () => secret.updateGold(500);
                document.getElementById('gold-down').onclick = () => secret.updateGold(-500);
            }

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
        // 비밀번호 확인
        secret.entered = "";
        secret.updatePasswordDisplay();
        document.getElementById('password-modal').style.display = 'block';
        document.getElementById('gold-adjuster-modal').style.display = 'none';
        
        // 비밀번호 확인 후 실행할 함수
        secret.pendingAction = () => {
            db.addGold(secret.adjustGold);
            secret.close();
        };
    },

    resetStats: () => {
        // 비밀번호 확인
        secret.entered = "";
        secret.updatePasswordDisplay();
        document.getElementById('password-modal').style.display = 'block';
        document.getElementById('gold-adjuster-modal').style.display = 'none';
        
        // 비밀번호 확인 후 실행할 함수
        secret.pendingAction = () => {
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
            } else {
                // 취소하면 다시 골드 조정 화면으로
                document.getElementById('password-modal').style.display = 'none';
                document.getElementById('gold-adjuster-modal').style.display = 'block';
            }
        };
    },
    
    pendingAction: null, // 비밀번호 확인 후 실행할 함수
};
function initSelections() {
    const daySelect = document.getElementById('day-select');
    const practiceDaySelect = document.getElementById('practice-mode-popup-day-select');
    const battleDaySelect = document.getElementById('battle-mode-setting-popup-day-select');
    
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
    html += `<option value="all">전체 (배틀 모드)</option>`;

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
    
    if (practiceDaySelect) {
        practiceDaySelect.innerHTML = html;
        const last = db.lastSelectedDay || 'all';
        if (Array.from(practiceDaySelect.options).some(o => o.value === String(last))) {
            practiceDaySelect.value = last;
        } else {
            practiceDaySelect.value = 'all';
        }
    }
    
    if (battleDaySelect) {
        battleDaySelect.innerHTML = html;
        const last = db.lastSelectedDay || 'all';
        if (Array.from(battleDaySelect.options).some(o => o.value === String(last))) {
            battleDaySelect.value = last;
        } else {
            battleDaySelect.value = 'all';
        }
    }
}

// Practice Memorization Mode - 단어 암기 모드
const practiceMemorization = {
    words: [],
    currentIndex: 0,
    currentDay: null,
    
    start: (day) => {
        console.log('[practiceMemorization.start] day=', day);
        practiceMemorization.currentDay = day;
        practiceMemorization.currentIndex = 0;
        
        // story-screen 닫기
        closeScreenOverlay('practice-mode-screen', true);
        
        // 단어 목록 로드
        let pool;
        // 현재 데이터셋의 rawData 사용
        const currentRawData = (typeof window !== 'undefined' && window.rawDataData) ? window.rawDataData : rawData;
        if (day === 'all') {
            pool = currentRawData;
        } else {
            const dayNum = Number(day);
            pool = currentRawData.filter(i => Number(i.day) === dayNum);
        }
        
        if (pool.length === 0) {
            alert("데이터가 없습니다.");
            return;
        }
        
        // 단어 목록 저장
        practiceMemorization.words = [...pool];
        
        // 암기 화면 표시
        setTimeout(() => {
            const memorizationScreen = document.getElementById('practice-memorization-screen');
            if (memorizationScreen) {
                memorizationScreen.style.display = 'flex';
                history.pushState({ screen: 'practice-memorization' }, '', window.location.href);
                
                // 첫 번째 단어 표시
                practiceMemorization.showWord(0);
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
            const dayLabel = practiceMemorization.currentDay === 'all' 
                ? '배틀 모드' 
                : `Day ${practiceMemorization.currentDay}`;
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
        
        // 한글 뜻 표시
        const meaningTextEl = document.getElementById('practice-meaning-text');
        if (meaningTextEl) {
            meaningTextEl.textContent = word.meaning || 'N/A';
        }
        
        // 영문 설명 표시
        const explanationTextEl = document.getElementById('practice-explanation-text');
        if (explanationTextEl) {
            explanationTextEl.textContent = word.englishExplanation || 'N/A';
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
        const memorizationScreen = document.getElementById('practice-memorization-screen');
        if (memorizationScreen) {
            closeScreenOverlay('practice-memorization-screen', true);
            setTimeout(() => {
                openScreenOverlay('start-screen', false);
                history.pushState(null, '', window.location.href);
            }, 400);
        }
    }
};

// Open practice mode selection popup
function openPracticePopup() {
    const popup = document.getElementById('practice-mode-popup');
    const popupDaySelect = document.getElementById('practice-mode-popup-day-select');
    const popupCountSelect = document.getElementById('practice-mode-popup-count-select');
    const popupImg = document.getElementById('practice-mode-popup-background-img');
    
    if (!popup) return;
    
    // Enable day selection for practice mode
    if (popupDaySelect) {
        popupDaySelect.disabled = false;
        popupDaySelect.style.display = ''; // Show day selection for practice mode
    }
    
    // Practice 모드는 암기 모드이므로 난이도 선택 숨기기
    if (popupCountSelect) {
        popupCountSelect.style.display = 'none';
    }
    
    // Restore last selected values
    const lastDay = db.lastSelectedDay || 'all';
    if (popupDaySelect && Array.from(popupDaySelect.options).some(o => o.value === String(lastDay))) {
        popupDaySelect.value = lastDay;
    }
    
    popup.style.display = 'flex';
    
    // 히스토리 상태 추가 (백버튼 처리용)
    history.pushState({ screen: 'practice-mode-popup' }, '', window.location.href);
    
    // 타이틀 크기 먼저 동기화 (팝업 크기가 타이틀 기준이므로)
    if (typeof syncTitleButtonOverlay === 'function') {
        syncTitleButtonOverlay();
    }
    
    // 이미지 로드 후 버튼 오버레이 동기화
    if (popupImg) {
        if (popupImg.complete) {
            setTimeout(() => {
                syncPopupButtonOverlay('practice-mode-popup');
            }, 100);
        } else {
            popupImg.addEventListener('load', () => {
                setTimeout(() => {
                    syncPopupButtonOverlay('practice-mode-popup');
                }, 100);
            }, { once: true });
        }
    }
    
    // 드롭박스 값 변경 시 폰트 크기 재조정
    setupSelectFontSizeAdjustment('practice-mode-popup');
}

// Open battle mode selection popup
function openBattleModePopup() {
    const popup = document.getElementById('battle-mode-setting-popup');
    const popupDaySelect = document.getElementById('battle-mode-setting-popup-day-select');
    const popupCountSelect = document.getElementById('battle-mode-setting-popup-count-select');
    const popupImg = document.getElementById('battle-mode-setting-popup-background-img');
    const questionTypeGroup = document.getElementById('battle-mode-setting-popup-question-type-group');
    
    if (!popup) return;
    
    // For battle mode, allow day selection
    if (popupDaySelect) {
        // 기본값을 'all'로 설정하되 사용자가 변경 가능
        const lastDay = db.lastSelectedDay || 'all';
        if (Array.from(popupDaySelect.options).some(o => o.value === String(lastDay))) {
            popupDaySelect.value = lastDay;
        } else {
            popupDaySelect.value = 'all';
        }
        popupDaySelect.style.display = ''; // Show day selection
        popupDaySelect.disabled = false; // Enable day selection for battle mode
    }
    
    const lastCount = parseInt(localStorage.getItem('v7_last_count')) || 10;
    if (popupCountSelect) {
        popupCountSelect.value = String(lastCount);
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
        const allLabels = questionTypeGroup.querySelectorAll('.popup-radio-label');
        allLabels.forEach(label => label.classList.remove('checked'));
        allRadios.forEach(radio => {
            if (radio.checked) {
                radio.closest('.popup-radio-label')?.classList.add('checked');
            }
        });
        
        // Add event listeners for radio button changes
        allRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                allLabels.forEach(label => label.classList.remove('checked'));
                const checkedRadio = questionTypeGroup.querySelector('input[name="battle-question-type"]:checked');
                if (checkedRadio) {
                    checkedRadio.closest('.popup-radio-label')?.classList.add('checked');
                }
            });
        });
    }
    
    popup.style.display = 'flex';
    
    // 히스토리 상태 추가 (백버튼 처리용)
    history.pushState({ screen: 'battle-mode-setting-popup' }, '', window.location.href);
    
    // 타이틀 크기 먼저 동기화 (팝업 크기가 타이틀 기준이므로)
    if (typeof syncTitleButtonOverlay === 'function') {
        syncTitleButtonOverlay();
    }
    
    // 이미지 로드 후 버튼 오버레이 동기화
    if (popupImg) {
        if (popupImg.complete) {
            setTimeout(() => {
                syncPopupButtonOverlay('battle-mode-setting-popup');
            }, 100);
        } else {
            popupImg.addEventListener('load', () => {
                setTimeout(() => {
                    syncPopupButtonOverlay('battle-mode-setting-popup');
                }, 100);
            }, { once: true });
        }
    }
    
    // 드롭박스 값 변경 시 폰트 크기 재조정
    setupSelectFontSizeAdjustment('battle-mode-setting-popup');
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

// Close practice or battle mode selection popup
function closePracticePopup(animated = true) {
    closeScreenOverlay('practice-mode-popup', animated);
    closeScreenOverlay('battle-mode-setting-popup', animated);
    // 히스토리 상태 업데이트
    history.pushState(null, '', window.location.href);
}

// 드롭박스 폰트 크기를 동적으로 조정 (텍스트가 박스보다 크지 않도록)
function adjustSelectFontSize(selectElement, width, height) {
    if (!selectElement) return;
    
    // 패딩을 고려한 실제 텍스트 영역
    const padding = 20; // 좌우 패딩 합계
    const textWidth = width - padding;
    const textHeight = height - 10; // 상하 패딩 고려
    
    // 높이 기준 최대 폰트 크기 (박스 높이보다 작게)
    const maxFontSizeByHeight = textHeight * 0.6; // 0.7에서 0.6으로 줄여서 여유 공간 확보
    
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
    
    // 높이 제한도 다시 확인 (박스보다 작게)
    fontSize = Math.min(fontSize, maxFontSizeByHeight);
    
    // 최소/최대 폰트 크기 제한
    fontSize = Math.max(12, Math.min(fontSize, 32)); // 최대값 32px
    
    selectElement.style.fontSize = fontSize + 'px';
    
    // 옵션들도 같은 폰트 크기 적용
    Array.from(selectElement.options).forEach(option => {
        option.style.fontSize = fontSize + 'px';
    });
}

// 드롭박스 값 변경 시 폰트 크기 재조정 설정
function setupSelectFontSizeAdjustment(popupId) {
    if (!popupId) return;
    
    const popup = document.getElementById(popupId);
    if (!popup) return;
    
    const popupImg = popup.querySelector('.popup-background');
    const popupDaySelect = popup.querySelector('.popup-day-select');
    const popupCountSelect = popup.querySelector('.popup-count-select');
    
    // 드롭박스 값 변경 시 폰트 크기 재조정
    if (popupDaySelect && !popupDaySelect.dataset.fontAdjustmentSetup) {
        popupDaySelect.dataset.fontAdjustmentSetup = 'true';
        popupDaySelect.addEventListener('change', () => {
            setTimeout(() => {
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
                if (popupImg && popupImg.complete) {
                    const imgRect = popupImg.getBoundingClientRect();
                    adjustSelectFontSize(popupCountSelect, imgRect.width * 0.6, imgRect.height * 0.11);
                }
            }, 50);
        });
    }
}

// Popup 이미지 크기에 맞춰 CSS 변수 설정 (브라우저 크기에 반응)
function syncPopupButtonOverlay(popupId) {
    if (!popupId) return;
    
    const popup = document.getElementById(popupId);
    // popup이 숨겨져 있으면 CSS 변수 설정하지 않음
    if (!popup || popup.style.display === 'none' || popup.style.display === '') {
        return;
    }
    
    const popupImg = popup.querySelector('.popup-background');
    const overlay = popup.querySelector('.popup-buttons-overlay');
    const container = popup.querySelector('.popup-container-wrapper');
    
    if (!popupImg || !overlay || !container) return;
    
    // 팝업 이미지의 자연 비율 계산 및 설정
    if (popupImg.complete && popupImg.naturalWidth > 0 && popupImg.naturalHeight > 0) {
        const aspectRatio = popupImg.naturalWidth / popupImg.naturalHeight;
        popupImg.style.setProperty('--popup-aspect-ratio', aspectRatio);
    }
    
    // 이미지가 로드된 후 크기 확인 (브라우저 크기 변경 시 자동으로 재계산됨)
    if (popupImg.complete) {
        // 잠시 후 다시 계산하여 브라우저 크기 변경 반영
        setTimeout(() => {
            const imgRect = popupImg.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            const left = imgRect.left - containerRect.left;
            const top = imgRect.top - containerRect.top;
            
            // CSS 변수로 이미지 크기와 위치 설정 (CSS에서 모든 크기와 위치 제어)
            overlay.style.setProperty('--popup-img-width', imgRect.width + 'px');
            overlay.style.setProperty('--popup-img-height', imgRect.height + 'px');
            overlay.style.setProperty('--popup-img-left', left + 'px');
            overlay.style.setProperty('--popup-img-top', top + 'px');
            
            // 드롭박스 폰트 크기 동적 조정 (크기는 CSS에서 제어)
            const daySelect = popup.querySelector('.popup-day-select');
            if (daySelect) {
                const width = imgRect.width * 0.65;
                const height = imgRect.height * 0.095;
                adjustSelectFontSize(daySelect, width, height);
            }
            
            const countSelect = popup.querySelector('.popup-count-select');
            if (countSelect) {
                const width = imgRect.width * 0.65;
                const height = imgRect.height * 0.095;
                adjustSelectFontSize(countSelect, width, height);
            }
            
            // 버튼 위치와 크기는 CSS에서 제어 (CSS 변수는 이미 설정됨)
            
            // 라디오 버튼 그룹 크기와 위치는 CSS에서 제어 (CSS 변수는 이미 설정됨)
        }, 0);
    }
}

// Story screen 이미지 크기에 맞춰 CSS 변수 설정 (타이틀 이미지 크기 기준)
function syncStoryButtonOverlay(storyScreenId) {
    if (!storyScreenId) {
        // 모두 확인
        const practiceModeStoryScreen = document.getElementById('practice-mode-screen');
        const battleModeStoryScreen = document.getElementById('battle-mode-screen');
        const bossStoryScreen = document.getElementById('boss-mode-screen');
        if (practiceModeStoryScreen && practiceModeStoryScreen.style.display !== 'none' && practiceModeStoryScreen.style.display !== '') {
            syncStoryButtonOverlay('practice-mode-screen');
        } else if (battleModeStoryScreen && battleModeStoryScreen.style.display !== 'none' && battleModeStoryScreen.style.display !== '') {
            syncStoryButtonOverlay('battle-mode-screen');
        } else if (bossStoryScreen && bossStoryScreen.style.display !== 'none' && bossStoryScreen.style.display !== '') {
            syncStoryButtonOverlay('boss-mode-screen');
        }
        return;
    }
    
    const storyScreen = document.getElementById(storyScreenId);
    // story-screen이 숨겨져 있으면 CSS 변수 설정하지 않음
    if (!storyScreen || storyScreen.style.display === 'none' || storyScreen.style.display === '') {
        return;
    }
    
    const storyImg = storyScreen.querySelector('.story-background');
    const overlay = storyScreen.querySelector('.story-buttons-overlay');
    const container = storyScreen.querySelector('.story-container-wrapper');
    
    if (!storyImg || !overlay || !container) return;
    
    // 타이틀 이미지 크기 가져오기 (숨겨져 있어도 naturalWidth/naturalHeight 사용)
    const titleImg = document.querySelector('.title-background');
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    let titleWidth = vw; // 기본값 (화면 너비)
    
    if (titleImg) {
        // 이미지가 로드되어 있으면 naturalWidth 사용 (숨겨져 있어도 작동)
        if (titleImg.complete && titleImg.naturalWidth > 0) {
            // 화면 크기에 맞춰 스케일 계산
            const scale = Math.min(vw / titleImg.naturalWidth, vh / titleImg.naturalHeight);
            titleWidth = titleImg.naturalWidth * scale;
        } else {
            // getBoundingClientRect 시도 (표시되어 있을 때만 작동)
            const titleRect = titleImg.getBoundingClientRect();
            if (titleRect.width > 0) {
                titleWidth = titleRect.width;
            }
        }
    }
    
    // 스토리 이미지의 자연 비율 계산 및 설정 (배틀 모드 설정 팝업과 동일한 방식)
    if (storyImg.complete && storyImg.naturalWidth > 0 && storyImg.naturalHeight > 0) {
        const aspectRatio = storyImg.naturalWidth / storyImg.naturalHeight;
        storyImg.style.setProperty('--story-aspect-ratio', aspectRatio);
    }
    
    // 이미지가 로드된 후 크기 확인 (브라우저 크기 변경 시 자동으로 재계산됨)
    if (storyImg.complete) {
        // 잠시 후 다시 계산하여 브라우저 크기 변경 반영
        setTimeout(() => {
            const imgRect = storyImg.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            const left = imgRect.left - containerRect.left;
            const top = imgRect.top - containerRect.top;
            
            // CSS 변수로 이미지 크기와 위치 설정 (CSS에서 모든 크기와 위치 제어)
            overlay.style.setProperty('--story-img-width', imgRect.width + 'px');
            overlay.style.setProperty('--story-img-height', imgRect.height + 'px');
            overlay.style.setProperty('--story-img-left', left + 'px');
            overlay.style.setProperty('--story-img-top', top + 'px');
            
            // 모험 시작 버튼 위치와 크기 설정 (CSS 변수 사용)
            const storyStartBtn = document.getElementById('story-start-btn');
            if (storyStartBtn) {
                storyStartBtn.style.setProperty('--story-img-width', imgRect.width + 'px');
                storyStartBtn.style.setProperty('--story-img-height', imgRect.height + 'px');
            }
            
            // 컨테이너에 CSS 변수 설정 (Day 정보와 이야기 텍스트 영역이 사용)
            if (container) {
                container.style.setProperty('--story-img-width', imgRect.width + 'px');
                container.style.setProperty('--story-img-height', imgRect.height + 'px');
                container.style.setProperty('--story-img-left', left + 'px');
                container.style.setProperty('--story-img-top', top + 'px');
            }
        }, 0);
    }
}

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

    // 타이틀 이미지는 contain으로 비율 유지하며 표시 (CSS에서 처리)
    // 오버레이는 컨테이너 전체를 사용 (0,0 ~ 100%)
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.left = '0';
    overlay.style.top = '0';

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
    
    // Sync button overlay to image size (먼저 CSS 변수 설정)
    const titleImg = document.querySelector('.title-background');
    if (titleImg) {
        // 이미지가 로드되어 있으면 즉시 동기화
        if (titleImg.complete) {
            syncTitleButtonOverlay();
        } else {
            titleImg.addEventListener('load', () => {
                syncTitleButtonOverlay();
            }, { once: true });
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
            bossModeBtn.addEventListener('click', () => story.startIntro('boss'));
        }
    } catch (e) {
        console.error('Error setting up boss-mode-btn:', e);
    }
    
    // Connect title image button areas to actual buttons
    const titlePracticeBtn = document.getElementById('title-practice-btn'); // PRACTICE MODE
    const titleBattleModeBtn = document.getElementById('title-battle-mode-btn'); // BATTLE MODE
    const titleBossModeBtn = document.getElementById('title-boss-mode-btn');   // BOSS MODE
    const titleShopBtn = document.getElementById('title-shop-btn');           // SHOP
    const titleProfileBtn = document.getElementById('title-profile-btn');     // PROFILE
    const titleStatisticsBtn = document.getElementById('title-statistics-btn'); // STATISTICS
    const titleSettingBtn = document.getElementById('title-setting-btn');     // SETTING (Secret Menu)
    
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
                freshPracticeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Practice Mode button clicked');
                    if (typeof openPracticePopup === 'function') {
                        openPracticePopup();
                    } else {
                        console.error('openPracticePopup function not found');
                    }
                }, { capture: true });
                // mousedown 이벤트도 추가 (모바일 호환성)
                freshPracticeBtn.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
                freshPracticeBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Practice Mode button touched');
                    if (typeof openPracticePopup === 'function') {
                        openPracticePopup();
                    }
                }, { capture: true });
                console.log('[Button Setup] Practice button event listener added');
            }
        } catch (e) {
            console.error('Error setting up practice button:', e);
        }
    } else {
        console.warn('title-practice-btn not found');
    }
    
    // Practice Setting Popup event listeners
    const practiceStartBtn = document.getElementById('practice-mode-popup-start-btn');
    const practiceCancelBtn = document.getElementById('practice-mode-popup-cancel-btn');
    const practiceDaySelect = document.getElementById('practice-mode-popup-day-select');
    const practiceCountSelect = document.getElementById('practice-mode-popup-count-select');
    
    if (practiceStartBtn) {
        practiceStartBtn.addEventListener('click', () => {
            const selectedDay = practiceDaySelect ? practiceDaySelect.value : 'all';
            const selectedCount = practiceCountSelect ? parseInt(practiceCountSelect.value) : 10;
            
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
            const startScreen = document.getElementById('start-screen');
            if (startScreen) {
                startScreen.style.display = 'none';
            }
            
            // Close popup with animation and start memorization mode directly
            closePracticePopup(true);
            
            // 애니메이션이 완료된 후 암기 모드로 바로 시작 (practice-mode-screen 건너뛰기)
            setTimeout(() => {
                practiceMemorization.start(selectedDay);
            }, 400); // 애니메이션 시간과 일치
        });
    }
    
    if (practiceCancelBtn) {
        practiceCancelBtn.addEventListener('click', () => {
            closePracticePopup();
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
    
    // Battle Setting Popup event listeners
    const battleStartBtn = document.getElementById('battle-mode-setting-popup-start-btn');
    const battleCancelBtn = document.getElementById('battle-mode-setting-popup-cancel-btn');
    const battleDaySelect = document.getElementById('battle-mode-setting-popup-day-select');
    const battleCountSelect = document.getElementById('battle-mode-setting-popup-count-select');
    
    if (battleStartBtn) {
        battleStartBtn.addEventListener('click', () => {
            const selectedDay = battleDaySelect ? battleDaySelect.value : 'all';
            const selectedCount = battleCountSelect ? parseInt(battleCountSelect.value) : 10;
            
            // Get selected question type for battle mode
            let selectedQuestionType = 'mixed'; // default
            const questionTypeGroup = document.getElementById('battle-mode-setting-popup-question-type-group');
            if (questionTypeGroup) {
                const checkedRadio = questionTypeGroup.querySelector('input[name="battle-question-type"]:checked');
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
            const startScreen = document.getElementById('start-screen');
            if (startScreen) {
                startScreen.style.display = 'none';
            }
            
            // Close popup with animation and start game
            closePracticePopup(true);
            
            // 애니메이션이 완료된 후 게임 시작
            setTimeout(() => {
                story.startIntro('battle', selectedDay);
            }, 400); // 애니메이션 시간과 일치
        });
    }
    
    if (battleCancelBtn) {
        battleCancelBtn.addEventListener('click', () => {
            closePracticePopup();
        });
    }
    // Battle Mode 버튼 설정
    if (titleBattleModeBtn) {
        try {
            titleBattleModeBtn.onclick = null;
            // 모든 이벤트 리스너 제거
            const newBtn = titleBattleModeBtn.cloneNode(true);
            titleBattleModeBtn.parentNode.replaceChild(newBtn, titleBattleModeBtn);
            const freshBattleBtn = document.getElementById('title-battle-mode-btn');
            
            if (freshBattleBtn) {
                freshBattleBtn.style.pointerEvents = 'auto';
                freshBattleBtn.style.zIndex = '25';
                freshBattleBtn.style.cursor = 'pointer';
                // 버튼 내부 이미지도 클릭 가능하도록 설정
                const btnImage = freshBattleBtn.querySelector('.btn-image');
                if (btnImage) {
                    btnImage.style.pointerEvents = 'none';
                }
                freshBattleBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Battle Mode button clicked');
                    if (typeof openBattleModePopup === 'function') {
                        openBattleModePopup();
                    } else {
                        console.error('openBattleModePopup function not found');
                    }
                }, { capture: true });
                freshBattleBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Battle Mode button touched');
                    if (typeof openBattleModePopup === 'function') {
                        openBattleModePopup();
                    }
                }, { capture: true });
                console.log('[Button Setup] Battle Mode button event listener added');
            }
        } catch (e) {
            console.error('Error setting up battle mode button:', e);
        }
    } else {
        console.warn('title-battle-mode-btn not found');
    }
    
    // Boss Mode 버튼 설정
    if (titleBossModeBtn) {
        try {
            titleBossModeBtn.onclick = null;
            // 모든 이벤트 리스너 제거
            const newBtn = titleBossModeBtn.cloneNode(true);
            titleBossModeBtn.parentNode.replaceChild(newBtn, titleBossModeBtn);
            const freshBossBtn = document.getElementById('title-boss-mode-btn');
            
            if (freshBossBtn) {
                freshBossBtn.style.pointerEvents = 'auto';
                freshBossBtn.style.zIndex = '25';
                freshBossBtn.style.cursor = 'pointer';
                // 버튼 내부 이미지도 클릭 가능하도록 설정
                const btnImage = freshBossBtn.querySelector('.btn-image');
                if (btnImage) {
                    btnImage.style.pointerEvents = 'none';
                }
                freshBossBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Boss Mode button clicked');
                    if (typeof story !== 'undefined' && typeof story.startIntro === 'function') {
                        story.startIntro('boss');
                    } else {
                        console.error('story.startIntro function not found');
                    }
                }, { capture: true });
                freshBossBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Boss Mode button touched');
                    if (typeof story !== 'undefined' && typeof story.startIntro === 'function') {
                        story.startIntro('boss');
                    }
                }, { capture: true });
                console.log('[Button Setup] Boss Mode button event listener added');
            }
        } catch (e) {
            console.error('Error setting up boss mode button:', e);
        }
    } else {
        console.warn('title-boss-mode-btn not found');
    }
    if (titleShopBtn) {
        titleShopBtn.onclick = null;
        titleShopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Shop button clicked');
            if (typeof shop !== 'undefined' && typeof shop.open === 'function') {
                shop.open();
            } else {
                console.error('shop.open function not found');
            }
        }, { capture: true });
    } else {
        console.warn('title-shop-btn not found');
    }
    if (titleProfileBtn) {
        titleProfileBtn.onclick = null;
        titleProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Profile button clicked');
            if (typeof inventory !== 'undefined' && typeof inventory.open === 'function') {
                inventory.open();
            } else {
                console.error('inventory.open function not found');
            }
        }, { capture: true });
    } else {
        console.warn('title-profile-btn not found');
    }
    if (titleStatisticsBtn) {
        titleStatisticsBtn.onclick = null;
        titleStatisticsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Statistics button clicked');
            if (typeof statistics !== 'undefined' && typeof statistics.open === 'function') {
                statistics.open();
            } else {
                console.error('statistics.open function not found');
            }
        }, { capture: true });
    } else {
        console.warn('title-statistics-btn not found');
    }
    if (titleSettingBtn) {
        titleSettingBtn.onclick = null;
        titleSettingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Setting button clicked');
            if (typeof secret !== 'undefined' && typeof secret.open === 'function') {
                secret.open();
            } else {
                console.error('secret.open function not found');
            }
        }, { capture: true });
    } else {
        console.warn('title-setting-btn not found');
    }
    
    // Popup 이미지 로드 후 버튼 오버레이 동기화
    const practiceModePopupImg = document.getElementById('practice-mode-popup-background-img');
    const battleModePopupImg = document.getElementById('battle-mode-setting-popup-background-img');
    
    if (practiceModePopupImg) {
        if (practiceModePopupImg.complete) {
            syncPopupButtonOverlay('practice-mode-popup');
        } else {
            practiceModePopupImg.addEventListener('load', () => syncPopupButtonOverlay('practice-mode-popup'));
        }
    }
    
    if (battleModePopupImg) {
        if (battleModePopupImg.complete) {
            syncPopupButtonOverlay('battle-mode-setting-popup');
        } else {
            battleModePopupImg.addEventListener('load', () => syncPopupButtonOverlay('battle-mode-setting-popup'));
        }
    }
    
    // 팝업이 열려있을 때만 resize 이벤트 처리
    let popupResizeTimeout;
    const popupResizeHandler = () => {
        const practiceModePopup = document.getElementById('practice-mode-popup');
        const battleModePopup = document.getElementById('battle-mode-setting-popup');
        if (practiceModePopup && practiceModePopup.style.display !== 'none' && practiceModePopup.style.display !== '') {
            clearTimeout(popupResizeTimeout);
            popupResizeTimeout = setTimeout(() => {
                syncPopupButtonOverlay('practice-mode-popup');
            }, 100);
        } else if (battleModePopup && battleModePopup.style.display !== 'none' && battleModePopup.style.display !== '') {
            clearTimeout(popupResizeTimeout);
            popupResizeTimeout = setTimeout(() => {
                syncPopupButtonOverlay('battle-mode-setting-popup');
            }, 100);
        }
    };
    window.addEventListener('resize', popupResizeHandler);
    
    // Story screen resize handler
    let storyResizeTimeout;
    const storyResizeHandler = () => {
        const practiceModeStoryScreen = document.getElementById('practice-mode-screen');
        const battleModeStoryScreen = document.getElementById('battle-mode-screen');
        const bossStoryScreen = document.getElementById('boss-mode-screen');
        if (practiceModeStoryScreen && practiceModeStoryScreen.style.display !== 'none' && practiceModeStoryScreen.style.display !== '') {
            clearTimeout(storyResizeTimeout);
            storyResizeTimeout = setTimeout(() => {
                syncStoryButtonOverlay('practice-mode-screen');
            }, 100);
        } else if (battleModeStoryScreen && battleModeStoryScreen.style.display !== 'none' && battleModeStoryScreen.style.display !== '') {
            clearTimeout(storyResizeTimeout);
            storyResizeTimeout = setTimeout(() => {
                syncStoryButtonOverlay('battle-mode-screen');
            }, 100);
        } else if (bossStoryScreen && bossStoryScreen.style.display !== 'none' && bossStoryScreen.style.display !== '') {
            clearTimeout(storyResizeTimeout);
            storyResizeTimeout = setTimeout(() => {
                syncStoryButtonOverlay('boss-mode-screen');
            }, 100);
        }
    };
    window.addEventListener('resize', storyResizeHandler);
    
    // 결과 화면 닫기 함수
    window.closeResultScreen = function() {
        closeScreenOverlay('result-screen', true);
        
        // story-screen 완전히 초기화
        const practiceModeStoryScreen = document.getElementById('practice-mode-screen');
        const battleModeStoryScreen = document.getElementById('battle-mode-screen');
        const bossStoryScreen = document.getElementById('boss-mode-screen');
        if (practiceModeStoryScreen) {
            practiceModeStoryScreen.style.display = 'none';
            practiceModeStoryScreen.style.visibility = '';
            practiceModeStoryScreen.style.opacity = '';
            practiceModeStoryScreen.style.zIndex = '';
            practiceModeStoryScreen.style.pointerEvents = '';
            practiceModeStoryScreen.classList.remove('closing');
            
            // 배경 이미지 초기화
            const storyImg = document.getElementById('practice-mode-background-img');
            if (storyImg) {
                storyImg.src = 'images/battle_mode/boss_mode_popup.webp';
            }
            
            // 버튼 초기화
            const storyStartBtn = document.getElementById('practice-mode-start-btn');
            if (storyStartBtn) {
                storyStartBtn.classList.add('boss-mode-btn');
                storyStartBtn.classList.remove('practice-btn');
                storyStartBtn.style.pointerEvents = '';
                storyStartBtn.onclick = null;
            }
        }
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
                storyImg.src = 'images/battle_mode/boss_mode_popup.webp';
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
                storyImg.src = 'images/battle_mode/boss_mode_popup.webp';
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
        
        // practice-mode-popup과 battle-mode-setting-popup 초기화
        const practiceModePopup = document.getElementById('practice-mode-popup');
        const battleModePopup = document.getElementById('battle-mode-setting-popup');
        if (practiceModePopup) {
            practiceModePopup.style.display = 'none';
            practiceModePopup.style.visibility = '';
            practiceModePopup.style.opacity = '';
            practiceModePopup.style.zIndex = '';
            practiceModePopup.style.pointerEvents = '';
            practiceModePopup.classList.remove('closing');
        }
        if (battleModePopup) {
            battleModePopup.style.display = 'none';
            battleModePopup.style.visibility = '';
            battleModePopup.style.opacity = '';
            battleModePopup.style.zIndex = '';
            battleModePopup.style.pointerEvents = '';
            battleModePopup.classList.remove('closing');
        }
        
        // game-screen도 확실히 닫기
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.style.display = 'none';
        }
        
        setTimeout(() => {
            openScreenOverlay('start-screen', false);
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
