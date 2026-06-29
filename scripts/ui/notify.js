/**
 * 비차단 알림 컴포넌트
 * - showToast(message, type, duration): 화면을 막지 않는 토스트 알림 (alert 대체)
 * - showConfirm(message, options): Promise<boolean>을 반환하는 커스텀 확인 모달 (confirm 대체)
 *
 * 자체 스타일을 1회 주입하므로 별도 CSS 파일/링크가 필요 없습니다.
 */
(function () {
    // --- 스타일 1회 주입 ---
    const style = document.createElement('style');
    style.textContent = `
.app-toast-container {
    position: fixed;
    left: 50%;
    bottom: 7%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    z-index: 99999;
    pointer-events: none;
    width: max-content;
    max-width: 86vw;
}
.app-toast {
    padding: 12px 18px;
    border-radius: 10px;
    background: rgba(20, 20, 28, 0.95);
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.35;
    text-align: center;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.12);
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 0.25s ease, transform 0.25s ease;
    max-width: 86vw;
    word-break: keep-all;
}
.app-toast.show {
    opacity: 1;
    transform: translateY(0);
}
.app-toast-success { border-color: rgba(76, 175, 80, 0.6); }
.app-toast-error { border-color: rgba(255, 82, 82, 0.6); }
.app-toast-warn { border-color: rgba(255, 213, 79, 0.6); }

.app-confirm-overlay {
    position: fixed;
    inset: 0;
    z-index: 100000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.55);
    opacity: 0;
    transition: opacity 0.2s ease;
    padding: 24px;
}
.app-confirm-overlay.show { opacity: 1; }
.app-confirm-box {
    width: 100%;
    max-width: 320px;
    background: linear-gradient(135deg, rgba(34, 34, 44, 0.98), rgba(22, 22, 30, 0.98));
    border: 1px solid rgba(255, 213, 79, 0.25);
    border-radius: 14px;
    padding: 22px 20px 16px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
}
.app-confirm-msg {
    color: #fff;
    font-size: 15px;
    line-height: 1.5;
    margin: 0 0 18px;
    text-align: center;
    word-break: keep-all;
}
.app-confirm-actions {
    display: flex;
    gap: 10px;
}
.app-confirm-actions button {
    flex: 1;
    padding: 12px;
    border-radius: 10px;
    border: none;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
}
.app-confirm-cancel {
    background: #37474f;
    color: #e0e0e0;
}
.app-confirm-ok {
    background: linear-gradient(135deg, var(--primary, #ffd54f), #ffb74d);
    color: #000;
}
`;
    document.head.appendChild(style);

    // --- 토스트 ---
    let container = null;
    function ensureContainer() {
        if (!container || !document.body.contains(container)) {
            container = document.createElement('div');
            container.className = 'app-toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    /**
     * 비차단 토스트 알림을 표시합니다.
     * @param {string} message - 표시할 메시지
     * @param {'info'|'success'|'error'|'warn'} [type='info'] - 알림 종류(테두리 색)
     * @param {number} [duration=2500] - 표시 시간(ms)
     */
    function showToast(message, type = 'info', duration = 2500) {
        const c = ensureContainer();
        const toast = document.createElement('div');
        toast.className = `app-toast app-toast-${type}`;
        toast.textContent = message;
        c.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
        return toast;
    }

    /**
     * 화면을 막지 않는 커스텀 확인 모달.
     * @param {string} message - 확인 메시지
     * @param {{okText?: string, cancelText?: string}} [options]
     * @returns {Promise<boolean>} 확인=true, 취소/바깥클릭=false
     */
    function showConfirm(message, options = {}) {
        const { okText = '확인', cancelText = '취소' } = options;
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'app-confirm-overlay';

            const box = document.createElement('div');
            box.className = 'app-confirm-box';
            box.setAttribute('role', 'dialog');
            box.setAttribute('aria-modal', 'true');

            const msg = document.createElement('p');
            msg.className = 'app-confirm-msg';
            msg.textContent = message;

            const actions = document.createElement('div');
            actions.className = 'app-confirm-actions';

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'app-confirm-cancel';
            cancelBtn.textContent = cancelText;

            const okBtn = document.createElement('button');
            okBtn.className = 'app-confirm-ok';
            okBtn.textContent = okText;

            actions.append(cancelBtn, okBtn);
            box.append(msg, actions);
            overlay.appendChild(box);

            const close = (result) => {
                overlay.classList.remove('show');
                setTimeout(() => overlay.remove(), 200);
                resolve(result);
            };
            okBtn.addEventListener('click', () => close(true));
            cancelBtn.addEventListener('click', () => close(false));
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) close(false);
            });

            document.body.appendChild(overlay);
            requestAnimationFrame(() => overlay.classList.add('show'));
            okBtn.focus();
        });
    }

    window.showToast = showToast;
    window.showConfirm = showConfirm;
})();
