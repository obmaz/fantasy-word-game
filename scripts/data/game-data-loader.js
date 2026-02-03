/**
 * 게임 데이터 로더
 * 여러 게임 데이터셋(단어장)을 관리하고 동적으로 전환하는 시스템
 */
(function () {
    'use strict';

    // 사용 가능한 게임 데이터셋 목록을 동적으로 생성
    function buildAvailableDataSets() {
        const dataSets = [];
        let id = 1;

        // gameDataName_N이 존재하는 동안 계속 추가 (최대 10개까지 확인)
        while (id <= 10) {
            const nameKey = `gameDataName_${id}`;
            const storiesKey = `storiesData_${id}`;
            const rawDataKey = `rawData_${id}`;

            // gameDataName이 있거나, storiesData와 rawData가 모두 있으면 추가
            if (
                typeof window[nameKey] !== 'undefined' ||
                (typeof window[storiesKey] !== 'undefined' &&
                    typeof window[rawDataKey] !== 'undefined')
            ) {
                const name = window[nameKey] || `game_data_${id}`;
                dataSets.push({ id: String(id), name: name });
            } else {
                // 연속된 ID가 없으면 중단 (예: 1, 2는 있지만 3이 없으면 중단)
                break;
            }

            id++;
        }

        return dataSets;
    }

    // 사용 가능한 게임 데이터셋 목록
    const availableDataSets = buildAvailableDataSets();

    // 현재 선택된 데이터셋 ID
    let currentDataSetId = null;

    // 데이터셋 로드 함수
    function loadDataSet(dataSetId) {
        const storiesKey = `storiesData_${dataSetId}`;
        const rawDataKey = `rawData_${dataSetId}`;
        const nameKey = `gameDataName_${dataSetId}`;

        if (
            typeof window[storiesKey] === 'undefined' ||
            typeof window[rawDataKey] === 'undefined'
        ) {
            console.error(`[data-loader] Data set ${dataSetId} not found`);
            return false;
        }

        // 전역 변수에 현재 데이터셋 설정
        window.storiesData = window[storiesKey];
        window.rawDataData = window[rawDataKey];
        window.currentGameDataName = window[nameKey] || `game_data_${dataSetId}`;
        window.currentGameDataSetId = dataSetId;

        console.log(
            `[data-loader] Loaded data set: ${window.currentGameDataName} (ID: ${dataSetId})`
        );
        return true;
    }

    // 데이터셋 변경 함수
    function changeDataSet(dataSetId) {
        if (loadDataSet(dataSetId)) {
            currentDataSetId = dataSetId;
            // localStorage에 저장
            if (typeof Storage !== 'undefined') {
                localStorage.setItem('selectedGameDataSet', dataSetId);
            }

            // words.js의 dayCatalog 재생성 필요 시 호출
            if (typeof dayCatalog !== 'undefined' && typeof dayCatalog.rebuild === 'function') {
                dayCatalog.rebuild();
            }

            // UI 업데이트
            updateSelectorUI();

            return true;
        }
        return false;
    }

    // 드롭박스 UI 업데이트
    function updateSelectorUI() {
        const selector = document.getElementById('game-data-selector');
        if (selector && currentDataSetId) {
            selector.value = currentDataSetId;
        }
    }

    // 초기화: localStorage에서 저장된 데이터셋 로드 또는 기본값 사용
    function init() {
        let dataSetId = '1'; // 기본값

        // localStorage에서 저장된 값 확인
        if (typeof Storage !== 'undefined') {
            const saved = localStorage.getItem('selectedGameDataSet');
            if (saved && availableDataSets.find((ds) => ds.id === saved)) {
                dataSetId = saved;
            }
        }

        // 데이터셋 로드 (UI 업데이트는 하지 않음 - DOM이 준비되지 않았을 수 있음)
        if (loadDataSet(dataSetId)) {
            currentDataSetId = dataSetId;
            // localStorage에 저장
            if (typeof Storage !== 'undefined') {
                localStorage.setItem('selectedGameDataSet', dataSetId);
            }
            console.log(
                `[data-loader] Initialized with data set: ${window.currentGameDataName} (ID: ${dataSetId})`
            );
        } else {
            console.error(`[data-loader] Failed to load initial data set: ${dataSetId}`);
        }
    }

    // 드롭박스 변경 이벤트 리스너
    function setupSelector() {
        const selector = document.getElementById('game-data-selector');
        if (selector) {
            // 동적으로 옵션 생성
            selector.innerHTML = '';
            availableDataSets.forEach((dataSet) => {
                const option = document.createElement('option');
                option.value = dataSet.id;
                option.textContent = dataSet.name;
                selector.appendChild(option);
            });

            // 현재 선택된 값으로 설정
            updateSelectorUI();

            selector.addEventListener('change', function (e) {
                const newDataSetId = e.target.value;
                if (changeDataSet(newDataSetId)) {
                    // 페이지 새로고침 필요 (데이터가 이미 로드된 후 변경되므로)
                    if (
                        confirm(
                            '게임 데이터를 변경하려면 페이지를 새로고침해야 합니다. 새로고침하시겠습니까?'
                        )
                    ) {
                        location.reload();
                    } else {
                        // 취소 시 이전 값으로 복원
                        updateSelectorUI();
                    }
                } else {
                    // 로드 실패 시 이전 값으로 복원
                    updateSelectorUI();
                }
            });
        }
    }

    // 즉시 초기화 (words.js가 로드되기 전에 데이터를 설정해야 함)
    init();

    // DOMContentLoaded 시 UI 설정
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            setupSelector();
        });
    } else {
        setupSelector();
    }

    // 전역으로 노출
    window.gameDataLoader = {
        changeDataSet: changeDataSet,
        getCurrentDataSetId: () => currentDataSetId,
        getAvailableDataSets: () => availableDataSets,
        reload: () => {
            if (currentDataSetId) {
                changeDataSet(currentDataSetId);
            }
        },
    };
})();
