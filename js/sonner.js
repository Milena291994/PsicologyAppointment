/**
 * SONNER - The opinionated toast library for JavaScript
 * Modern, accessible, smooth stacking toasts
 * Faithful implementation of Emil Kowalski's Sonner component
 */

(function (global) {
    let container = null;
    let toasts = [];
    let idCounter = 0;
    let isHovered = false;

    // Configuración por defecto
    const DEFAULT_CONFIG = {
        position: 'bottom-right', // 'bottom-right' | 'top-right' | 'top-center' | 'bottom-center'
        duration: 4000,
        expand: false
    };

    function ensureContainer() {
        if (!container) {
            container = document.createElement('div');
            container.id = 'sonner-toaster';
            container.className = `sonner-toaster sonner-${DEFAULT_CONFIG.position}`;
            container.setAttribute('role', 'region');
            container.setAttribute('aria-label', 'Notificaciones');
            document.body.appendChild(container);

            container.addEventListener('mouseenter', () => {
                isHovered = true;
                updateToastsPositions();
            });

            container.addEventListener('mouseleave', () => {
                isHovered = false;
                updateToastsPositions();
            });
        }
        return container;
    }

    function createToastElement(toastData) {
        const el = document.createElement('div');
        el.className = `sonner-toast sonner-toast-${toastData.type}`;
        el.dataset.id = toastData.id;
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');

        // Icono según el tipo
        let iconSvg = '';
        if (toastData.type === 'success') {
            iconSvg = `<svg class="sonner-icon sonner-icon-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
        } else if (toastData.type === 'error') {
            iconSvg = `<svg class="sonner-icon sonner-icon-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
        } else if (toastData.type === 'warning') {
            iconSvg = `<svg class="sonner-icon sonner-icon-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
        } else if (toastData.type === 'info') {
            iconSvg = `<svg class="sonner-icon sonner-icon-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
        } else if (toastData.type === 'loading') {
            iconSvg = `<svg class="sonner-icon sonner-icon-loading animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>`;
        }

        let actionHtml = '';
        if (toastData.action) {
            actionHtml = `<button type="button" class="sonner-action-btn">${toastData.action.label}</button>`;
        }

        el.innerHTML = `
            <div class="sonner-toast-inner">
                ${iconSvg ? `<div class="sonner-icon-wrapper">${iconSvg}</div>` : ''}
                <div class="sonner-content">
                    <div class="sonner-title">${toastData.title}</div>
                    ${toastData.description ? `<div class="sonner-description">${toastData.description}</div>` : ''}
                </div>
                ${actionHtml}
                <button type="button" class="sonner-close-btn" aria-label="Cerrar notificación">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        `;

        // Eventos
        el.querySelector('.sonner-close-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            dismissToast(toastData.id);
        });

        if (toastData.action && toastData.action.onClick) {
            el.querySelector('.sonner-action-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                toastData.action.onClick();
                dismissToast(toastData.id);
            });
        }

        return el;
    }

    function updateToastsPositions() {
        const isBottom = DEFAULT_CONFIG.position.startsWith('bottom');
        let accumulatedHeight = 0;

        toasts.forEach((t, index) => {
            const el = t.element;
            if (!el) return;

            const reversedIndex = toasts.length - 1 - index; // 0 es el más reciente

            if (isHovered || DEFAULT_CONFIG.expand) {
                // Modo expandido (lista normal)
                el.style.transform = isBottom 
                    ? `translateY(-${accumulatedHeight}px) scale(1)` 
                    : `translateY(${accumulatedHeight}px) scale(1)`;
                el.style.opacity = '1';
                el.style.pointerEvents = 'auto';
                accumulatedHeight += (el.offsetHeight || 56) + 10;
            } else {
                // Modo apilado 3D de Sonner (Signature Stack)
                if (reversedIndex === 0) {
                    el.style.transform = `translateY(0px) scale(1)`;
                    el.style.opacity = '1';
                    el.style.zIndex = '100';
                    el.style.pointerEvents = 'auto';
                } else if (reversedIndex === 1) {
                    el.style.transform = isBottom ? `translateY(-12px) scale(0.94)` : `translateY(12px) scale(0.94)`;
                    el.style.opacity = '0.9';
                    el.style.zIndex = '90';
                    el.style.pointerEvents = 'none';
                } else if (reversedIndex === 2) {
                    el.style.transform = isBottom ? `translateY(-24px) scale(0.88)` : `translateY(24px) scale(0.88)`;
                    el.style.opacity = '0.7';
                    el.style.zIndex = '80';
                    el.style.pointerEvents = 'none';
                } else {
                    el.style.transform = isBottom ? `translateY(-36px) scale(0.82)` : `translateY(36px) scale(0.82)`;
                    el.style.opacity = '0';
                    el.style.zIndex = '70';
                    el.style.pointerEvents = 'none';
                }
            }
        });
    }

    function dismissToast(id) {
        const index = toasts.findIndex(t => t.id === id);
        if (index === -1) return;

        const toast = toasts[index];
        if (toast.element) {
            toast.element.classList.add('sonner-toast-exiting');
            setTimeout(() => {
                toast.element.remove();
            }, 250);
        }

        if (toast.timer) clearTimeout(toast.timer);
        toasts.splice(index, 1);
        updateToastsPositions();
    }

    function addToast(title, options = {}, type = 'default') {
        ensureContainer();
        const id = ++idCounter;

        const toastData = {
            id,
            title,
            description: options.description || null,
            type,
            action: options.action || null,
            duration: options.duration !== undefined ? options.duration : DEFAULT_CONFIG.duration
        };

        const el = createToastElement(toastData);
        toastData.element = el;

        container.appendChild(el);
        toasts.push(toastData);

        // Auto dismiss timer
        if (toastData.duration > 0) {
            toastData.timer = setTimeout(() => {
                dismissToast(id);
            }, toastData.duration);
        }

        // Render animation
        requestAnimationFrame(() => {
            el.classList.add('sonner-toast-visible');
            updateToastsPositions();
        });

        return id;
    }

    // API oficial idéntica a Sonner (Emil Kowalski)
    const toast = function (title, options) {
        return addToast(title, options, 'default');
    };

    toast.success = (title, options) => addToast(title, options, 'success');
    toast.error = (title, options) => addToast(title, options, 'error');
    toast.warning = (title, options) => addToast(title, options, 'warning');
    toast.info = (title, options) => addToast(title, options, 'info');
    toast.loading = (title, options) => addToast(title, options, 'loading');
    toast.dismiss = (id) => dismissToast(id);

    toast.promise = function (promise, { loading, success, error }) {
        const id = toast.loading(loading || 'Cargando...');
        return promise
            .then((data) => {
                toast.dismiss(id);
                const successMsg = typeof success === 'function' ? success(data) : success;
                toast.success(successMsg || 'Completado');
                return data;
            })
            .catch((err) => {
                toast.dismiss(id);
                const errorMsg = typeof error === 'function' ? error(err) : error;
                toast.error(errorMsg || 'Ocurrió un error');
                throw err;
            });
    };

    // Exponer globalmente
    global.toast = toast;

})(typeof window !== 'undefined' ? window : this);
