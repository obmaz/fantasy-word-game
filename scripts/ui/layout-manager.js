// ============================================
// 뷰포트 높이 고정 (모바일 주소창 대응)
// ============================================
// 모바일 브라우저에서 주소창이 나타나거나 사라질 때 100vh 값이 변하여
// 화면이 동적으로 커지거나 작아지는 문제를 방지합니다.
// 페이지 최초 로드 시 높이를 한 번 측정하여 --app-height CSS 변수에 고정합니다.

let _lockedAppHeight = 0;

/**
 * 앱 높이를 측정하고 CSS 변수로 설정합니다.
 * 최초 1회만 실행되며, 이후에는 고정된 값을 사용합니다.
 */
function initAppHeight() {
    if (_lockedAppHeight > 0) return; // 이미 고정됨

    // window.innerHeight는 현재 보이는 뷰포트 높이 (주소창 포함/미포함에 따라 다름)
    // 최초 로드 시의 값을 기준으로 고정합니다.
    _lockedAppHeight = window.innerHeight;
    document.documentElement.style.setProperty('--app-height', _lockedAppHeight + 'px');
    console.log('[layout] App height locked:', _lockedAppHeight + 'px');
}

/**
 * 고정된 앱 높이를 반환합니다.
 * initAppHeight()가 호출되지 않았으면 window.innerHeight를 반환합니다.
 */
function getLockedAppHeight() {
    return _lockedAppHeight > 0 ? _lockedAppHeight : window.innerHeight;
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
    const vh = getLockedAppHeight(); // 고정된 높이 사용

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

    // 전역 CSS 변수로도 설정 (다른 팝업들이 참조할 수 있도록)
    document.documentElement.style.setProperty('--title-container-width', imgWidth + 'px');
    document.documentElement.style.setProperty('--title-container-height', imgHeight + 'px');

    // 타이틀 이미지는 contain으로 비율 유지하며 표시 (CSS에서 처리)
    // 오버레이는 컨테이너 전체를 사용 (0,0 ~ 100%)
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.left = '0';
    overlay.style.top = '0';

    // Keep game screen size in sync with the title image size
    syncGameScreenSizeToTitle();

    // 팝업도 타이틀 크기에 맞춰 동기화
    if (typeof syncModalButtonOverlay === 'function') {
        syncModalButtonOverlay('practice-mode-modal');
        syncModalButtonOverlay('battle-mode-modal');
    }
}

function syncGameScreenSizeToTitle() {
    const titleImg = document.querySelector('.title-background');
    const gameScreen = document.getElementById('battle-mode-game');
    const practiceScreen = document.getElementById('practice-mode-game');
    if (!titleImg) return;

    const naturalW = titleImg.naturalWidth || 0;
    const naturalH = titleImg.naturalHeight || 0;
    if (!naturalW || !naturalH) return;

    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = getLockedAppHeight(); // 고정된 높이 사용
    const scale = Math.min(vw / naturalW, vh / naturalH);

    const w = Math.floor(naturalW * scale);
    const h = Math.floor(naturalH * scale);

    if (gameScreen) {
        gameScreen.style.width = w + 'px';
        gameScreen.style.height = h + 'px';
    }

    if (practiceScreen) {
        practiceScreen.style.width = w + 'px';
        practiceScreen.style.height = h + 'px';
    }
}
