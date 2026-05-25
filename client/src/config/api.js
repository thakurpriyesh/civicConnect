const DEFAULT_REMOTE_API_BASE = 'https://civicconnect-backend-svvb.onrender.com';

function isBrowserOnLocalhost() {
    if (typeof window === 'undefined') return true;

    return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
}

function getApiBase() {
    const configuredBase = process.env.REACT_APP_API_URL || '';
    const configuredHost = (() => {
        try {
            return configuredBase ? new URL(configuredBase).hostname : '';
        } catch {
            return '';
        }
    })();

    const configuredIsLocal = ['localhost', '127.0.0.1', '::1'].includes(configuredHost);

    if (configuredIsLocal && !isBrowserOnLocalhost()) {
        return DEFAULT_REMOTE_API_BASE;
    }

    return configuredBase;
}

export const API_BASE = getApiBase();

export function resolveUploadUrl(imageUrl) {
    if (!imageUrl) return '';

    if (imageUrl.startsWith('/uploads/')) {
        return `${API_BASE}${imageUrl}`;
    }

    try {
        const url = new URL(imageUrl);
        if (url.pathname.startsWith('/uploads/') && API_BASE) {
            return `${API_BASE}${url.pathname}`;
        }
    } catch {
        return imageUrl;
    }

    return imageUrl;
}
