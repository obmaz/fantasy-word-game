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
        document.getElementById('inv-cap').innerText = (db.inventory.length + db.owned.filter(id => id !== 'basic' && !Object.values(db.equipped).includes(id) && id !== db.equippedWeapon).length) ;
        document.getElementById('inv-max-cap').innerText = db.inventoryCapacity;
    
        // Clear inventory display slots
        ['head', 'hand-1', 'hand-2', 'foot-1', 'foot-2', 'weapon'].forEach(slot => {
            const equipSlot = document.getElementById(`inv-${slot}`);
            if(equipSlot) {
                equipSlot.innerHTML = '';
                equipSlot.onclick = null;
            }
        });
    
        // Render equipped weapon into its defined slot (weapon / hand-1 / hand-2 / head / foot-1...)
        const equippedWeaponData = weapons.find(w => w.id === db.equippedWeapon);
        if (equippedWeaponData && db.equippedWeapon !== 'basic') {
            const targetSlot = equippedWeaponData.slot || 'weapon';
            const el = document.getElementById(`inv-${targetSlot}`) || document.getElementById('inv-weapon');
            if (el) {
                el.innerHTML = `<div class="inv-item">${equippedWeaponData.icon}</div>`;
                el.onclick = () => inventory.unequip(targetSlot);
            }
        }

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
            if (w.category === 'weapon' || slot === 'hand-1') {
                // unequip any existing weapon in hand-1
                inventory.unequip('hand-1', true);
                db.equipped['hand-1'] = id;
                db.equippedWeapon = id; // gameplay reference
            } else if (w.category === 'effect' || slot === 'hand-2') {
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

        // use API so clamp/persistence/UI are consistent
        db.subGold(cost);

        if (type === 'item') {
            if (db.inventory.length >= db.inventoryCapacity) {
                alert('인벤토리가 가득 찼습니다.');
                 db.addGold(cost); // revert transaction via API
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
        document.getElementById('hero-img').src = "images/legacy_hero_sprite.png";
        
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

// expose for console/debugging and to avoid other scripts clobbering
try { window.ui = window.ui || ui; } catch (e) { /* ignore */ }

// 3. STORY Logic

// Monster image assets and selection helper
const monsterAssets = {
    normal: [
        'images/legacy_orc_sprite.png' // default normal monster
    ],
    boss: [
        'images/legacy_orc_sprite.png' // default boss (can add more)
    ],
    byDay: {
        // Day-specific mapping — useful for testing and unique bosses
        '40': ['images/legacy_orc_sprite.png']
        // add more: '5': ['images/day5_goblin.png', 'images/day5_troll.png']
    },
    fallback: 'images/legacy_orc_sprite.png'
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
    if (day === 'rush') return (stories && stories['rush']) || null;
    const s = (stories && stories[day]) ? stories[day] : null;
    if (s) return s;

    const opt = document.querySelector(`#day-select option[value="${day}"]`);
    const optText = opt ? opt.textContent : (day === 'all' ? (stories && stories['all'] && stories['all'].title) : `Day ${day}`);
    return {
        title: optText,
        intro: `선택한 지역 — ${optText}`,
        win: (stories && stories['all'] && stories['all'].win) || '',
        lose: (stories && stories['all'] && stories['all'].lose) || ''
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
        const hasEntry = Object.prototype.hasOwnProperty.call(stories, story.day);
        const optNode = document.querySelector(`#day-select option[value="${story.day}"]`);
        console.log('[story.startIntro] dbg -> day=', story.day, 'hasEntry=', hasEntry, 'optText=', optNode && optNode.textContent);
        console.log('[story.startIntro] dbg -> data.title=', data.title);

        const titleEls = document.querySelectorAll('#story-title');
        if (titleEls.length > 1) console.warn('[story.startIntro] multiple #story-title elements found:', titleEls.length);
        const titleEl = document.getElementById('story-title');
        console.log('[story.startIntro] current #story-title before=', titleEl && titleEl.innerText);

        // Prefer the Day label from the canonical catalog; fall back to legacy views
        const dayLabel = (story.day && typeof dayCatalog !== 'undefined' && dayCatalog[story.day] && dayCatalog[story.day].label) ? dayCatalog[story.day].label : ((story.day && dayInfo && dayInfo[story.day]) ? dayInfo[story.day] : (story.day === 'all' ? (stories && stories['all'] && stories['all'].title) : (story.day === 'rush' ? 'Boss Rush' : `Day ${story.day}`)));
        const displayTitle = (data && data.title && String(data.title).trim() && data.title !== dayLabel) ? `${dayLabel} — ${data.title}` : dayLabel; 

        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('story-screen').style.display = 'flex';
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
        btn.onclick = () => {
            console.log('[story-btn] introResolvedDay=', resolvedAtIntro, 'story.mode=', story.mode);
            game.init(story.mode, resolvedAtIntro);
        };
    },
    showEnding: (win) => {
        const data = resolveStoryData(story.day);
        document.getElementById('game-screen').style.display = 'none';
        document.getElementById('story-screen').style.display = 'flex';
        
        if (window.ui && typeof window.ui.setStoryTitle === 'function') {
            window.ui.setStoryTitle(win ? "VICTORY" : "DEFEAT");
        } else {
            const te = document.getElementById('story-title'); if (te) te.innerText = (win ? "VICTORY" : "DEFEAT"); console.warn('[story.showEnding] fallback title write used');
        }
        document.getElementById('story-text').innerText = win ? data.win : data.lose; 
        
        const btn = document.getElementById('story-btn');
        btn.innerText = "결과 정산";
        btn.onclick = () => game.end(win);
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
      try { window.__removedStoryTitleBackups.push({ html: e.outerHTML, time: Date.now() }); } catch (ignore) {}
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

      const label = (typeof dayCatalog !== 'undefined' && dayCatalog[dayKey] && dayCatalog[dayKey].label) ? dayCatalog[dayKey].label : (dayInfo && dayInfo[dayKey]) ? dayInfo[dayKey] : `Day ${day}`;
      const displayTitle = (s && s.title && String(s.title).trim() && s.title !== label) ? `${label} — ${s.title}` : label;

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
    Object.entries(out.summary).forEach(([k,v]) => console.log(k, v));
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
    deck: [],

    init: (mode, day) => {
        const count = parseInt(document.getElementById('count-select').value);
        game.mode = mode;

        document.getElementById('story-screen').style.display = 'none';
        
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
    }
};
function initSelections() {
    const daySelect = document.getElementById('day-select');
    if (!daySelect) return;

    // Gather days from dayInfo (preferred) and rawData (in case new days exist)
    const daysFromData = new Set();
    if (typeof rawData !== 'undefined' && Array.isArray(rawData)) rawData.forEach(r => { if (r && r.day) daysFromData.add(Number(r.day)); });

    const infoDays = (typeof dayCatalog !== 'undefined') ? Object.keys(dayCatalog).filter(k => !isNaN(Number(k))).map(Number) : ((typeof dayInfo !== 'undefined') ? Object.keys(dayInfo).map(Number) : []);
    const allDays = new Set([...infoDays, ...Array.from(daysFromData)]);

    const sortedDays = Array.from(allDays).filter(d => !Number.isNaN(d) && d > 0).sort((a,b) => a - b).filter(d => d <= 60);

    // Build options
    let html = '';
    sortedDays.forEach(d => {
        const label = (dayCatalog && dayCatalog[d] && dayCatalog[d].label) ? dayCatalog[d].label : ((dayInfo && dayInfo[d]) ? dayInfo[d] : `Day ${d}`);
        html += `<option value="${d}">${label}</option>`;
    });
    html += `<option value="all">전체 (혼돈의 균열)</option>`;

    daySelect.innerHTML = html;

    // Restore last selected day if available
    const last = db.lastSelectedDay || 'all';
    if (Array.from(daySelect.options).some(o => o.value === String(last))) {
        daySelect.value = last;
    } else {
        daySelect.value = 'all';
        db.lastSelectedDay = 'all';
        db.save();
    }
}

window.onload = () => {
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
}
