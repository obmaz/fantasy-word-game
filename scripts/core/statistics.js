/**
 * 통계 시스템
 * 게임 통계 UI 렌더링 및 관리
 */

const statistics = {
    /**
     * 통계 모달을 엽니다
     */
    open: () => {
        // title-screen은 숨기지 않고 모달만 표시
        openScreenOverlay('statistics-modal', true);
        history.pushState({ screen: 'statistics' }, '', window.location.href);
        statistics.render();
    },

    /**
     * 통계 모달을 닫습니다
     */
    close: () => {
        closeScreenOverlay('statistics-modal', true);
        // title-screen은 이미 표시되어 있으므로 다시 표시할 필요 없음
        history.pushState(null, '', window.location.href);
    },

    /**
     * 통계 UI를 렌더링합니다
     */
    render: () => {
        const container = document.getElementById('statistics-container');
        container.innerHTML = '';

        // 현재 단어장 정보를 타이틀 영역에 표시
        const currentBookName =
            typeof window !== 'undefined' && window.currentGameDataName
                ? window.currentGameDataName
                : '기본 단어장';
        const modalHeader = document.querySelector('#statistics-modal .modal-header');
        if (modalHeader) {
            const existingBookInfo = modalHeader.querySelector('.statistics-book-info');
            if (existingBookInfo) {
                existingBookInfo.remove();
            }
            const bookInfo = document.createElement('div');
            bookInfo.className = 'statistics-book-info';
            bookInfo.style.cssText =
                'font-size: 12px; color: var(--primary); margin-top: 4px; text-align: center;';
            bookInfo.textContent = `📚 ${currentBookName}`;
            modalHeader.appendChild(bookInfo);
        }

        // 단어장별 통계 가져오기
        if (!db.stats.books) {
            db.stats.books = {};
        }
        const bookStats = db.stats.books[currentBookName] || {
            solved: 0,
            correct: 0,
            objective: { solved: 0, correct: 0 },
            subjective: { solved: 0, correct: 0, perfectDays: [] },
            bossMode: { bestWave: 0, bestWaveDate: null },
        };

        // 통계 데이터 계산
        const solved = bookStats.solved || 0;
        const correct = bookStats.correct || 0;
        const rate = solved > 0 ? Math.round((correct / solved) * 100) : 0;
        const wrong = solved - correct;

        // 객관식/주관식 통계
        const objectiveStats = bookStats.objective || { solved: 0, correct: 0 };
        const subjectiveStats = bookStats.subjective || { solved: 0, correct: 0 };
        const objectiveSolved = objectiveStats.solved || 0;
        const objectiveCorrect = objectiveStats.correct || 0;
        const objectiveRate =
            objectiveSolved > 0 ? Math.round((objectiveCorrect / objectiveSolved) * 100) : 0;
        const subjectiveSolved = subjectiveStats.solved || 0;
        const subjectiveCorrect = subjectiveStats.correct || 0;
        const subjectiveRate =
            subjectiveSolved > 0 ? Math.round((subjectiveCorrect / subjectiveSolved) * 100) : 0;

        // 보유 아이템 수
        const ownedItems = db.owned.length;
        const inventoryItems = db.inventory.length;
        const totalItems = ownedItems + inventoryItems;

        // 장착한 장비 목록
        const equippedItems = [];
        if (db.equipped['head']) {
            const item = items.find((i) => i.id === db.equipped['head']);
            if (item) equippedItems.push({ slot: '머리', name: item.name, icon: item.icon });
        }
        if (db.equipped['hand-1']) {
            const item =
                weapons.find((w) => w.id === db.equipped['hand-1']) ||
                items.find((i) => i.id === db.equipped['hand-1']);
            if (item) equippedItems.push({ slot: '오른손', name: item.name, icon: item.icon });
        }
        if (db.equipped['hand-2']) {
            const item =
                weapons.find((w) => w.id === db.equipped['hand-2']) ||
                items.find((i) => i.id === db.equipped['hand-2']);
            if (item) equippedItems.push({ slot: '왼손', name: item.name, icon: item.icon });
        }
        if (db.equipped['foot-1'] || db.equipped['foot-2']) {
            const item = items.find(
                (i) => i.id === db.equipped['foot-1'] || i.id === db.equipped['foot-2']
            );
            if (item) equippedItems.push({ slot: '발', name: item.name, icon: item.icon });
        }

        let html = '';

        // 게임 통계
        html += '<div class="statistics-section" style="margin-top:20px;">📊 게임 통계</div>';
        html += `<div class="statistics-item">
            <div style="text-align:right; width:100%;">
                <div style="font-size:15px; margin-bottom:4px;"><b>해결: </b><span style="color:var(--primary); font-weight:bold;">${solved}개</span> <b style="margin-left:12px;">정답률: </b><span style="color:var(--primary); font-weight:bold;">${rate}%</span></div>
                <div style="font-size:15px;"><b>정답: </b><span style="color:#4CAF50; font-weight:bold;">${correct}개</span> <b style="margin-left:12px;">오답: </b><span style="color:#FF5252; font-weight:bold;">${wrong}개</span></div>
            </div>
        </div>`;

        // 객관식 통계
        const objectiveWrong = objectiveSolved - objectiveCorrect;
        html +=
            '<div class="statistics-section" style="margin-top:20px; margin-bottom:8px;">📋 객관식</div>';
        html += `<div class="statistics-item">
            <div style="text-align:right; width:100%;">
                <div style="font-size:15px; margin-bottom:4px;"><b>해결: </b><span style="color:var(--primary); font-weight:bold;">${objectiveSolved}개</span> <b style="margin-left:12px;">정답률: </b><span style="color:var(--primary); font-weight:bold;">${objectiveRate}%</span></div>
                <div style="font-size:15px;"><b>정답: </b><span style="color:#4CAF50; font-weight:bold;">${objectiveCorrect}개</span> <b style="margin-left:12px;">오답: </b><span style="color:#FF5252; font-weight:bold;">${objectiveWrong}개</span></div>
            </div>
        </div>`;

        // 주관식 통계
        const subjectiveWrong = subjectiveSolved - subjectiveCorrect;
        html +=
            '<div class="statistics-section" style="margin-top:15px; margin-bottom:8px;">✍️ 주관식</div>';
        html += `<div class="statistics-item">
            <div style="text-align:right; width:100%;">
                <div style="font-size:15px; margin-bottom:4px;"><b>해결: </b><span style="color:var(--primary); font-weight:bold;">${subjectiveSolved}개</span> <b style="margin-left:12px;">정답률: </b><span style="color:var(--primary); font-weight:bold;">${subjectiveRate}%</span></div>
                <div style="font-size:15px;"><b>정답: </b><span style="color:#4CAF50; font-weight:bold;">${subjectiveCorrect}개</span> <b style="margin-left:12px;">오답: </b><span style="color:#FF5252; font-weight:bold;">${subjectiveWrong}개</span></div>
            </div>
        </div>`;

        // 주관식을 전부 맞춘 날 표시
        const perfectDays = subjectiveStats.perfectDays || [];

        if (perfectDays.length === 0) {
            html +=
                '<div class="statistics-section" style="margin-top:15px; margin-bottom:8px;">✨ 주관식 전부 맞춘 날</div>';
            html += `<div class="statistics-item">
                <div style="text-align:right; width:100%;">
                    <div style="font-size:15px;"><span style="color:var(--primary); font-weight:bold;">없음</span></div>
                </div>
            </div>`;
        } else {
            // 날짜순으로 정렬 (최신이 마지막)
            const sortedPerfectDays = [...perfectDays].sort((a, b) => a.date.localeCompare(b.date));

            html +=
                '<div class="statistics-section" style="margin-top:15px; margin-bottom:8px;">✨ 주관식 전부 맞춘 날</div>';
            sortedPerfectDays.forEach((perfect, index) => {
                const perfectDate = perfect.displayDate || perfect.date;
                const perfectDayLabel = perfect.dayLabel || '';

                html += `<div class="statistics-item">
                    <div style="text-align:right; width:100%;">
                        <div style="font-size:15px; margin-bottom:4px;"><span style="color:var(--primary); font-weight:bold;">${perfectDate}</span></div>
                        ${
                            perfectDayLabel
                                ? `<div style="font-size:15px;"><b>${perfectDayLabel}</b></div>`
                                : ''
                        }
                    </div>
                </div>`;
            });
        }

        html += '</div>';
        html += '</div>';

        // 보스 모드 최고 wave 기록
        const bossModeStats = bookStats.bossMode || { bestWave: 0, bestWaveDate: null };
        const bestWave = bossModeStats.bestWave || 0;
        const bestWaveDate = bossModeStats.bestWaveDate
            ? bossModeStats.bestWaveDate.displayDate
            : '기록 없음';

        html += '<div class="statistics-section" style="margin-top:20px;">👑 보스 모드 기록</div>';
        html += `<div class="statistics-item">
            <div style="text-align:right; width:100%;">
                <div style="font-size:15px;"><b>Wave: </b><span style="color:#E040FB; font-weight:bold;">${bestWave}</span> <b style="margin-left:12px;">날짜: </b><span style="color:var(--primary); font-weight:bold;">${bestWaveDate}</span></div>
            </div>
        </div>`;

        container.innerHTML = html;
    },
};
