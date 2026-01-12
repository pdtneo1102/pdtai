/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Helper to get or create a persistent Hardware ID (stored in localStorage)
export const getHardwareId = (): string => {
    let hwid = localStorage.getItem('pdt_hwid');
    if (!hwid) {
        // Generate a pseudo-random ID that looks like a CPU ID
        const array = new Uint32Array(4);
        crypto.getRandomValues(array);
        hwid = 'CPU-' + Array.from(array).map(i => i.toString(16).toUpperCase().padStart(8, '0')).join('').substring(0, 16);
        localStorage.setItem('pdt_hwid', hwid);
    }
    return hwid;
};

interface LicenseData {
    hwid: string;
    expiry: number; // Timestamp
}

export const validateLicenseKey = (key: string): { isValid: boolean; expiryDate?: Date; message?: string } => {
    try {
        if (!key) return { isValid: false, message: "Vui lòng nhập khóa." };

        // Simple obfuscation decoding (Base64). 
        // In a real app, use asymmetric cryptography (public/private key).
        // Format expected: Base64(JSON({ hwid: "...", expiry: 123456789 }))
        const decoded = atob(key);
        const data: LicenseData = JSON.parse(decoded);
        const currentHwid = getHardwareId();

        if (data.hwid !== currentHwid) {
            return { isValid: false, message: "Khóa này không dành cho máy tính này." };
        }

        const now = Date.now();
        if (data.expiry < now) {
            return { isValid: false, message: "Khóa đã hết hạn sử dụng." };
        }

        return { isValid: true, expiryDate: new Date(data.expiry) };

    } catch (e) {
        return { isValid: false, message: "Khóa không hợp lệ hoặc bị lỗi." };
    }
};

export const saveLicenseKey = (key: string) => {
    localStorage.setItem('pdt_license_key', key);
};

export const getSavedLicenseKey = () => {
    return localStorage.getItem('pdt_license_key');
};

// DEV TOOL: Generate a key for testing (prints to console)
// Usage in console: generateTestKey(30) // for 30 days
(window as any).generateKey = (days: number) => {
    const hwid = getHardwareId();
    const expiry = Date.now() + days * 24 * 60 * 60 * 1000;
    const data = JSON.stringify({ hwid, expiry });
    const key = btoa(data);
    console.log(`%c [KEY GENERATOR] Key cho ${days} ngày:`, 'color: #FBBF24; font-weight: bold;');
    console.log(key);
    return key;
};
