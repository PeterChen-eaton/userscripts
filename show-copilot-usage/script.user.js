// ==UserScript==
// @name         GitHub Copilot Quota Overlay
// @namespace    https://github.com/PeterChen-eaton/userscripts/blob/main/show-copilot-usage
// @version      2026.04.02
// @description  Show Copilot quota on any GitHub page and refresh every 5 minutes.
// @author       Peter
// @match        https://github.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    if (window.__tmCopilotQuotaOverlayInitialized) {
        return;
    }
    window.__tmCopilotQuotaOverlayInitialized = true;

    const API_URL = 'https://github.com/github-copilot/chat';
    const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
    const STORAGE_KEY = 'copilotQuotaOverlayCacheV1';
    const WIDGET_ID = 'tm-copilot-quota-overlay';

    const state = {
        data: null,
        updatedAt: 0,
        stale: false,
        loading: true,
        error: ''
    };

    let lastFetchAt = 0;

    function formatNumber(value) {
        return typeof value === 'number' && Number.isFinite(value) ? String(value) : '-';
    }

    function formatPercent(value) {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return '-';
        }
        return value.toFixed(1) + '%';
    }

    function formatUpdatedTime(ts) {
        if (!ts) {
            return '--:--';
        }
        const date = new Date(ts);
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        return hh + ':' + mm;
    }

    function loadCache() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return null;
            }
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') {
                return null;
            }
            if (!parsed.data || typeof parsed.updatedAt !== 'number') {
                return null;
            }
            return parsed;
        } catch (_) {
            return null;
        }
    }

    function saveCache(data, updatedAt) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, updatedAt }));
        } catch (_) {
            // Ignore storage failures and keep runtime state only.
        }
    }

    function normalizeQuotaPayload(payload) {
        const quotas = payload && payload.quotas;
        const limits = quotas && quotas.limits;
        const remaining = quotas && quotas.remaining;

        const normalized = {
            limitPremium: limits && limits.premiumInteractions,
            remainingPremium: remaining && remaining.premiumInteractions,
            premiumPercentage: remaining && remaining.premiumInteractionsPercentage,
            chatPercentage: remaining && remaining.chatPercentage,
            resetDate: quotas && quotas.resetDate
        };

        if (
            typeof normalized.limitPremium !== 'number' ||
            typeof normalized.remainingPremium !== 'number'
        ) {
            throw new Error('Missing premium quota fields in response');
        }

        return normalized;
    }

    async function fetchQuota() {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                Accept: 'application/json'
            },
            credentials: 'include',
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error('Request failed: ' + response.status);
        }

        const payload = await response.json();
        return normalizeQuotaPayload(payload);
    }

    function getWidget() {
        let widget = document.getElementById(WIDGET_ID);
        if (!widget) {
            widget = document.createElement('div');
            widget.id = WIDGET_ID;
            widget.style.position = 'fixed';
            widget.style.right = '12px';
            widget.style.zIndex = '9999';
            widget.style.width = 'min(220px, calc(100vw - 24px))';
            widget.style.padding = '8px 10px';
            widget.style.borderRadius = '10px';
            widget.style.border = '1px solid rgba(240, 246, 252, 0.14)';
            widget.style.background = 'linear-gradient(165deg, rgba(22, 27, 34, 0.72), rgba(48, 54, 61, 0.52))';
            widget.style.backdropFilter = 'blur(7px)';
            widget.style.boxShadow = '0 8px 22px rgba(1, 4, 9, 0.28)';
            widget.style.color = 'rgba(230, 237, 243, 0.82)';
            widget.style.fontSize = '12px';
            widget.style.lineHeight = '1.32';
            widget.style.fontFamily = 'IBM Plex Sans, Noto Sans SC, Segoe UI, sans-serif';
            widget.style.pointerEvents = 'none';
            widget.style.userSelect = 'none';
            widget.style.letterSpacing = '0.1px';
            document.body.appendChild(widget);
        }
        return widget;
    }

    function getTopOffset() {
        const header = document.querySelector('header[role="banner"], .Header, #header');
        if (!header) {
            return 64;
        }
        const rect = header.getBoundingClientRect();
        const bottom = Math.max(rect.bottom, header.offsetHeight || 0);
        return Math.max(48, Math.round(bottom) + 8);
    }

    function updateWidgetPosition() {
        const widget = getWidget();
        widget.style.top = getTopOffset() + 'px';
    }

    function render() {
        const widget = getWidget();
        updateWidgetPosition();

        if (state.loading && !state.data) {
            widget.innerHTML = [
                '<div style="font-weight: 600; opacity: 0.9; margin-bottom: 4px;">Copilot Quota</div>',
                '<div style="opacity: 0.72;">Loading...</div>'
            ].join('');
            return;
        }

        if (!state.data) {
            widget.innerHTML = [
                '<div style="font-weight: 600; opacity: 0.9; margin-bottom: 4px;">Copilot Quota</div>',
                '<div style="opacity: 0.72;">Unavailable</div>'
            ].join('');
            return;
        }

        const staleBadge = state.stale
            ? '<span style="padding: 1px 5px; border-radius: 999px; background: rgba(255, 200, 120, 0.18); color: rgba(255, 218, 161, 0.9); font-size: 10px;">stale</span>'
            : '<span style="padding: 1px 5px; border-radius: 999px; background: rgba(110, 180, 130, 0.17); color: rgba(176, 232, 190, 0.86); font-size: 10px;">live</span>';

        const usedPremium = Math.max(0, state.data.limitPremium - state.data.remainingPremium);
        const usedPremiumPercentage = typeof state.data.premiumPercentage === 'number'
            ? Math.max(0, 100 - state.data.premiumPercentage)
            : null;

        widget.innerHTML = [
            '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">',
            '<span style="font-weight: 600; opacity: 0.9;">Copilot Quota</span>',
            staleBadge,
            '</div>',
            '<div style="opacity: 0.84;">Premium: ' + formatNumber(usedPremium) + ' / ' + formatNumber(state.data.limitPremium) + ' (' + formatPercent(usedPremiumPercentage) + ')</div>',
            '<div style="opacity: 0.8; margin-top: 2px;">Chat: ' + formatPercent(state.data.chatPercentage) + '</div>',
            '<div style="opacity: 0.8; margin-top: 2px;">Reset: ' + (state.data.resetDate || '-') + '</div>',
            '<div style="opacity: 0.58; margin-top: 4px; font-size: 10px;">Updated ' + formatUpdatedTime(state.updatedAt) + '</div>'
        ].join('');
    }

    async function refreshQuota() {
        state.loading = true;
        render();

        try {
            const quotaData = await fetchQuota();
            state.data = quotaData;
            state.updatedAt = Date.now();
            state.stale = false;
            state.error = '';
            saveCache(quotaData, state.updatedAt);
        } catch (error) {
            state.error = error && error.message ? error.message : 'Unknown error';

            if (!state.data) {
                const cached = loadCache();
                if (cached) {
                    state.data = cached.data;
                    state.updatedAt = cached.updatedAt;
                }
            }

            if (state.data) {
                state.stale = true;
            }
        } finally {
            state.loading = false;
            lastFetchAt = Date.now();
            render();
        }
    }

    function setupVisibilityRefresh() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                return;
            }
            if (Date.now() - lastFetchAt >= REFRESH_INTERVAL_MS) {
                refreshQuota();
            }
        });
    }

    function setupNavigationAwarePositioning() {
        window.addEventListener('resize', updateWidgetPosition);
        document.addEventListener('turbo:render', updateWidgetPosition);
        document.addEventListener('pjax:end', updateWidgetPosition);

        // GitHub updates parts of the header on navigation; periodic correction keeps the widget aligned.
        setInterval(updateWidgetPosition, 2500);
    }

    function init() {
        const cached = loadCache();
        if (cached) {
            state.data = cached.data;
            state.updatedAt = cached.updatedAt;
            state.stale = true;
            state.loading = false;
        }

        render();
        refreshQuota();
        setInterval(refreshQuota, REFRESH_INTERVAL_MS);
        setupVisibilityRefresh();
        setupNavigationAwarePositioning();
    }

    init();
})();
