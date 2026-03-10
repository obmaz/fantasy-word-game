/**
 * 인벤토리 시스템
 * 아이템 장착, 해제, UI 렌더링 관리
 */

const inventory = {
    /**
     * 인벤토리 모달을 엽니다
     */
    open: () => {
        // title-screen은 숨기지 않고 모달만 표시
        openScreenOverlay('inventory-modal', true);
        history.pushState({ screen: 'inventory' }, '', window.location.href);
        inventory.hideDetails(); // 열 때 상세 정보 숨김
        inventory.render();

        // 접근성 / 작은 뷰포트 대응: 닫기 버튼이 도달 가능하도록 보장
        const closeBtn = document.getElementById('inv-close-btn');
        if (closeBtn) {
            try {
                closeBtn.focus({ preventScroll: true });
            } catch (err) {
                try {
                    closeBtn.focus();
                } catch (__) {
                    /* 무시 */
                }
            }
            try {
                closeBtn.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            } catch (__) {
                /* 무시 */
            }
        }
    },

    /**
     * 인벤토리 모달을 닫습니다
     */
    close: () => {
        closeScreenOverlay('inventory-modal', true);
        // title-screen은 이미 표시되어 있으므로 다시 표시할 필요 없음
        history.pushState(null, '', window.location.href);
    },

    /**
     * 인벤토리 UI를 렌더링합니다
     */
    render: () => {
        const invContainer = document.querySelector('.inv-items');
        invContainer.innerHTML = '';

        // 인벤토리 용량 표시
        document.getElementById('inv-cap').innerText =
            db.inventory.length +
            db.owned.filter(
                (id) =>
                    id !== 'basic' &&
                    !Object.values(db.equipped).includes(id) &&
                    id !== db.equippedWeapon
            ).length;
        document.getElementById('inv-max-cap').innerText = db.inventoryCapacity;

        // 인벤토리 슬롯 초기화
        ['head', 'hand-1', 'hand-2', 'foot-1', 'foot-2', 'weapon'].forEach((slot) => {
            const equipSlot = document.getElementById(`inv-${slot}`);
            if (equipSlot) {
                equipSlot.innerHTML = '';
                equipSlot.onclick = null;
            }
        });

        // 장착된 아이템을 인벤토리 UI에 렌더링 (손/머리/발 슬롯을 차지하는 무기 포함)
        for (const slot in db.equipped) {
            const itemId = db.equipped[slot];
            const item = items.find((i) => i.id === itemId) || weapons.find((w) => w.id === itemId);
            if (item) {
                const equipSlot = document.getElementById(`inv-${slot}`);
                if (equipSlot) {
                    equipSlot.innerHTML = `<div class="inv-item">${item.icon}</div>`;
                    equipSlot.onclick = () => inventory.unequip(slot);
                }
            }
        }

        // 히어로 장비 표시 초기화
        document.getElementById('hero-head').innerHTML = '';
        document.getElementById('hero-hand-1').innerHTML = '';
        document.getElementById('hero-hand-2').innerHTML = '';
        document.getElementById('hero-feet').innerHTML = '';

        // 히어로 스프라이트에 장착된 아이템 렌더링
        const headItem = items.find((i) => i.id === db.equipped['head']);
        if (headItem) {
            const el = document.getElementById('hero-head');
            if (el) el.innerHTML = headItem.icon;
        }
        const hand1Item = items.find((i) => i.id === db.equipped['hand-1']);
        if (hand1Item) {
            const el = document.getElementById('hero-hand-1');
            if (el) el.innerHTML = hand1Item.icon;
        }
        const hand2Item = items.find((i) => i.id === db.equipped['hand-2']);
        if (hand2Item) {
            const el = document.getElementById('hero-hand-2');
            if (el) el.innerHTML = hand2Item.icon;
        }
        const foot1Item = items.find((i) => i.id === db.equipped['foot-1']);
        if (foot1Item) {
            const el = document.getElementById('hero-feet');
            if (el) el.innerHTML = foot1Item.icon;
        }

        // 보관함의 아이템 렌더링
        db.inventory.forEach((itemId) => {
            const item = items.find((i) => i.id === itemId);
            if (item) {
                const itemEl = document.createElement('div');
                itemEl.className = 'inv-item';
                itemEl.innerHTML = item.icon;
                itemEl.onclick = () => inventory.showDetails(itemId, 'item');
                invContainer.appendChild(itemEl);
            }
        });

        // 보관함의 보유 무기 렌더링
        db.owned.forEach((weaponId) => {
            const weapon = weapons.find((w) => w.id === weaponId);
            if (
                weapon &&
                weapon.id !== 'basic' &&
                weapon.id !== db.equippedWeapon &&
                !Object.values(db.equipped).includes(weaponId)
            ) {
                const itemEl = document.createElement('div');
                itemEl.className = 'inv-item';
                itemEl.innerHTML = weapon.icon;
                itemEl.onclick = () => inventory.showDetails(weaponId, 'weapon');
                invContainer.appendChild(itemEl);
            }
        });

        // 보유 유물 렌더링
        const relicsContainer = document.querySelector('.inv-relics');
        relicsContainer.innerHTML = '';
        db.owned.forEach((itemId) => {
            const relic = relics.find(
                (r) =>
                    r.id === itemId &&
                    (r.type === 'passive' || r.type === 'consumable' || r.type === 'backpack')
            );
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

        // 접근성: Enter / Space로 포커스된 인벤토리 슬롯 활성화 허용
        document.querySelectorAll('.inv-slot[tabindex]').forEach((el) => {
            el.onkeydown = (ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    el.click();
                }
            };
        });
    },

    /**
     * 아이템 상세 정보를 표시합니다
     * @param {string} id - 아이템 ID
     * @param {string} type - 아이템 타입 ('item' 또는 'weapon')
     */
    showDetails: (id, type) => {
        const itemData =
            type === 'item' ? items.find((i) => i.id === id) : weapons.find((w) => w.id === id);
        if (!itemData) return;

        document.getElementById('detail-icon').innerText = itemData.icon || '';
        document.getElementById('detail-name').innerText = itemData.name;
        document.getElementById('detail-desc').innerText = itemData.desc;

        const actionsContainer = document.getElementById('detail-actions');
        actionsContainer.innerHTML = '';

        // 무기의 경우 정의된 슬롯에 장착 허용
        if (type === 'weapon') {
            const slot = itemData.slot || 'weapon';
            if (slot === 'either-hand') {
                const btn1 = document.createElement('button');
                btn1.className = 'btn-main';
                btn1.innerText = '오른손 장착';
                btn1.onclick = () => {
                    inventory.equip(id, 'weapon', 'hand-1');
                    inventory.hideDetails();
                };
                actionsContainer.appendChild(btn1);

                const btn2 = document.createElement('button');
                btn2.className = 'btn-main';
                btn2.innerText = '왼손 장착';
                btn2.onclick = () => {
                    inventory.equip(id, 'weapon', 'hand-2');
                    inventory.hideDetails();
                };
                actionsContainer.appendChild(btn2);
            } else {
                const equipBtn = document.createElement('button');
                equipBtn.className = 'btn-main';
                equipBtn.innerText = `장착하기 (${slot})`;
                equipBtn.onclick = () => {
                    inventory.equip(id, 'weapon', slot);
                    inventory.hideDetails();
                };
                actionsContainer.appendChild(equipBtn);
            }

            // 현재 장착 중이면 해제 허용
            if (db.equippedWeapon === id || Object.values(db.equipped).includes(id)) {
                const unequipBtn = document.createElement('button');
                unequipBtn.className = 'btn-main btn-blue';
                unequipBtn.innerText = '해제';
                unequipBtn.onclick = () => {
                    inventory.unequipWeapon();
                    inventory.hideDetails();
                };
                actionsContainer.appendChild(unequipBtn);
            }
        } else {
            // 아이템 (소모품 / 장비)
            const equipBtn = document.createElement('button');
            equipBtn.className = 'btn-main';
            equipBtn.innerText = '장착하기';
            equipBtn.onclick = () => {
                inventory.equip(id, type);
                inventory.hideDetails();
            };
            actionsContainer.appendChild(equipBtn);

            // 소모품이면 사용 버튼 추가
            const isConsumable = relics.find((r) => r.id === id && r.type === 'consumable');
            if (isConsumable) {
                const useBtn = document.createElement('button');
                useBtn.className = 'btn-main btn-blue';
                useBtn.innerText = '사용하기';
                useBtn.onclick = () => {
                    db.useItem(id);
                    inventory.hideDetails();
                };
                actionsContainer.appendChild(useBtn);
            }
        }

        document.getElementById('inv-item-detail').style.display = 'block';
    },

    /**
     * 아이템 상세 정보를 숨깁니다
     */
    hideDetails: () => {
        document.getElementById('inv-item-detail').style.display = 'none';
    },

    /**
     * 아이템을 장착합니다
     * @param {string} id - 아이템 ID
     * @param {string} type - 아이템 타입
     * @param {string} targetSlot - 대상 슬롯
     */
    equip: (id, type, targetSlot) => {
        if (type === 'weapon') {
            const w = weapons.find((w) => w.id === id);
            if (!w) return;

            // 카테고리 -> 정규 슬롯 매핑 강제
            let slot;
            if (w.category === 'weapon') slot = 'hand-1';
            else if (w.category === 'effect') slot = 'hand-2';
            else if (w.category === 'either') slot = targetSlot || 'hand-1';
            else slot = targetSlot || w.slot || 'hand-1';

            // 잘못된 대상 슬롯 거부 (무기는 손에만)
            if (!['hand-1', 'hand-2'].includes(slot)) {
                alert('무기는 손 슬롯에만 장착할 수 있습니다.');
                return;
            }

            // 무기 장착 시 하나의 무기만 존재하도록 보장 (hand-1)
            if (slot === 'hand-1') {
                // hand-1의 기존 무기 해제
                inventory.unequip('hand-1', true);
                db.equipped['hand-1'] = id;
                db.equippedWeapon = id; // 게임플레이 참조
            } else if (slot === 'hand-2') {
                // 기존 이펙트 해제
                inventory.unequip('hand-2', true);
                db.equipped['hand-2'] = id;
            }

            // 무기 ID가 owned에 있는지 확인
            if (!db.owned.includes(id)) db.owned.push(id);
        } else {
            // 아이템 (방어구, 신발, 유물)
            const item = items.find((i) => i.id === id);
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
            db.inventory = db.inventory.filter((i) => i !== id);
        }

        db.save();
        inventory.render();
        shop.render();
    },

    /**
     * 무기를 해제합니다
     * @param {string} slot - 슬롯 (선택사항)
     */
    unequipWeapon: (slot) => {
        // 슬롯이 제공되면 해당 슬롯 해제; 그렇지 않으면 equippedWeapon 해제
        if (slot) {
            const id = db.equipped[slot];
            if (!id) return;
            delete db.equipped[slot];
            if (db.equippedWeapon === id) db.equippedWeapon = 'basic';
        } else {
            if (db.equippedWeapon === 'basic') return;
            const id = db.equippedWeapon;
            // 이 무기를 참조하는 모든 히어로 슬롯에서 제거
            for (const s of Object.keys(db.equipped)) {
                if (db.equipped[s] === id) delete db.equipped[s];
            }
            db.equippedWeapon = 'basic';
        }
        db.save();
        inventory.render();
    },

    /**
     * 아이템을 해제합니다
     * @param {string} slot - 슬롯
     * @param {boolean} silent - 조용한 모드 (UI 업데이트 없음)
     */
    unequip: (slot, silent = false) => {
        const itemId = db.equipped[slot];
        if (!itemId) return;

        // 무기의 경우: db.inventory로 이동하지 않음 (db.owned에 유지)
        const isWeapon = !!weapons.find((w) => w.id === itemId);

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

        // 활성 equippedWeapon이었다면 해제
        if (db.equippedWeapon === itemId) db.equippedWeapon = 'basic';

        // 무기가 아닌 아이템만 배낭 인벤토리에 추가
        if (!isWeapon && !db.inventory.includes(itemId)) {
            db.inventory.push(itemId);
        }

        if (silent) return;

        db.save();
        inventory.render();
    },
};
