/**
 * 상점 시스템
 * 아이템 구매 및 상점 UI 관리
 */

const shop = {
    /**
     * 상점 모달을 엽니다
     */
    open: () => {
        // title-screen은 숨기지 않고 모달만 표시
        openScreenOverlay('shop-modal', true);
        history.pushState({ screen: 'shop' }, '', window.location.href);
        shop.render();
    },

    /**
     * 상점 모달을 닫습니다
     */
    close: () => {
        closeScreenOverlay('shop-modal', true);
        // title-screen은 이미 표시되어 있으므로 다시 표시할 필요 없음
        history.pushState(null, '', window.location.href);
    },

    /**
     * 상점 UI를 렌더링합니다
     */
    render: () => {
        const container = document.getElementById('shop-container');
        container.innerHTML = '';
        document.getElementById('shop-gold').innerText = db.gold;

        const isPurchased = (item) =>
            db.inventory.includes(item.id) ||
            Object.values(db.equipped).includes(item.id) ||
            db.owned.includes(item.id);

        // 경제형 무기
        let html = '<div class="shop-section">💰 경제형 무기 (골드 보너스)</div>';
        weapons
            .filter((w) => w.multiplier > 1 && !isPurchased(w))
            .forEach((w) => (html += shop.createItemHtml(w, 'weapon')));

        // 스킨 무기
        html += '<div class="shop-section">⚔️ 스킨 무기 (이펙트)</div>';
        weapons
            .filter((w) => w.multiplier === 1 && !isPurchased(w))
            .forEach((w) => (html += shop.createItemHtml(w, 'weapon')));

        // 유물
        html += '<div class="shop-section">💍 유물/아이템</div>';
        relics
            .filter((r) => (r.type !== 'skill' && !isPurchased(r)) || r.id === 'backpack')
            .forEach((r) => (html += shop.createItemHtml(r, r.type)));

        // 스킬 (항상 표시)
        html += '<div class="shop-section">✨ 스킬</div>';
        relics
            .filter((r) => r.type === 'skill')
            .forEach((r) => (html += shop.createItemHtml(r, r.type)));

        // 장비
        html += '<div class="shop-section">🛡️ 장비</div>';
        items
            .filter((i) => !isPurchased(i))
            .forEach((i) => (html += shop.createItemHtml(i, 'item')));

        container.innerHTML = html;
    },

    /**
     * 아이템 HTML을 생성합니다
     * @param {Object} item - 아이템 데이터
     * @param {string} type - 아이템 타입
     * @returns {string} HTML 문자열
     */
    createItemHtml: (item, type) => {
        let btn = `<button class="buy-btn" onclick="shop.buy('${item.id}', ${item.cost}, '${type}')">${item.cost} G</button>`;

        if (type === 'skill') {
            return `<div class="shop-item shop-item-skill"><div style="font-size:15px;"><b>${
                item.name
            } (현재 ${db.skills[item.id]}개)</b><br><span style="font-size:15px;color:#aaa;">${
                item.desc
            }</span></div>${btn}</div>`;
        }

        return `<div class="shop-item"><div style="font-size:15px;"><b>${item.name}</b><br><span style="font-size:15px;color:#aaa;">${item.desc}</span></div>${btn}</div>`;
    },

    /**
     * 아이템을 구매합니다
     * @param {string} id - 아이템 ID
     * @param {number} cost - 가격
     * @param {string} type - 아이템 타입
     */
    buy: (id, cost, type) => {
        if (db.gold < cost) {
            alert('골드가 부족합니다.');
            return;
        }

        const isStorable = ['item', 'weapon', 'passive', 'consumable', 'effect', 'either'].includes(
            type
        );

        if (isStorable) {
            const unequippedOwned = db.owned.filter(
                (oid) =>
                    oid !== 'basic' &&
                    !Object.values(db.equipped).includes(oid) &&
                    oid !== db.equippedWeapon
            );
            const currentSize = db.inventory.length + unequippedOwned.length;
            if (currentSize >= db.inventoryCapacity) {
                alert('인벤토리가 가득 찼습니다.');
                return;
            }
        }

        // API 사용으로 clamp/persistence/UI 일관성 유지
        db.subGold(cost);

        if (type === 'item') {
            db.inventory.push(id);
        } else if (type === 'backpack') {
            db.inventoryCapacity++;
        } else if (type === 'skill') {
            const skill = relics.find((r) => r.id === id);
            db.skills[id] += skill.uses;
        } else {
            // 무기 및 기타 유물
            db.owned.push(id);
            if (type === 'consumable') {
                const relic = relics.find((r) => r.id === id);
                db.durability[id] = relic.durability;
            }
        }

        db.save();
        shop.render();
        inventory.render(); // 인벤토리 화면도 업데이트
    },

    /**
     * 아이템을 장착합니다
     * @param {string} id - 아이템 ID
     */
    equip: (id) => {
        db.equip(id);
        shop.render();
    },
};
