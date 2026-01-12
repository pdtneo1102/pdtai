/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getHardwareId, validateLicenseKey, saveLicenseKey, getSavedLicenseKey } from '../lib/license';
import { FacebookIcon, ZaloIcon, PhoneIcon, LoadingSpinnerIcon } from './icons';
import toast from 'react-hot-toast';

interface LicenseModalProps {
    isOpen: boolean;
    onLicenseValid: () => void;
    forceShow?: boolean;
    onClose?: () => void;
}

const LicenseModal: React.FC<LicenseModalProps> = ({ isOpen, onLicenseValid, forceShow, onClose }) => {
    const [hwid, setHwid] = useState('');
    const [inputKey, setInputKey] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [expiryInfo, setExpiryInfo] = useState<string | null>(null);

    useEffect(() => {
        setHwid(getHardwareId());
        const savedKey = getSavedLicenseKey();
        if (savedKey) {
            const result = validateLicenseKey(savedKey);
            if (result.isValid) {
                if (!forceShow) {
                    onLicenseValid();
                } else {
                    setExpiryInfo(`Hết hạn vào: ${result.expiryDate?.toLocaleDateString()} ${result.expiryDate?.toLocaleTimeString()}`);
                }
            }
        }
    }, [forceShow, onLicenseValid]);

    const handleActivate = () => {
        setError(null);
        const result = validateLicenseKey(inputKey);
        
        if (result.isValid) {
            saveLicenseKey(inputKey);
            toast.success("Kích hoạt thành công!");
            if (forceShow && onClose) {
                onClose(); // Just close if it was forced open (checking status)
            } else {
                onLicenseValid(); // Unlock app
            }
        } else {
            setError(result.message || "Lỗi không xác định");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md bg-neutral-900 border border-yellow-500/30 rounded-xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-900/20 p-6 text-center border-b border-yellow-500/20 relative">
                    {forceShow && onClose && (
                        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-white">✕</button>
                    )}
                    <h2 className="text-2xl font-bold text-white uppercase tracking-wider title-font">Kích hoạt Tính Năng</h2>
                    <p className="text-sm text-neutral-400 mt-2 base-font">
                        Tính năng này yêu cầu bản quyền. Vui lòng liên hệ <span className="text-yellow-400 font-bold">Phạm Thắng</span> để mua Key kích hoạt theo CPU.
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Hardware ID Display */}
                    <div className="bg-neutral-800/50 p-4 rounded-lg border border-white/10">
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Hardware ID (Mã máy)</label>
                        <div className="flex items-center gap-2">
                            <code className="text-yellow-400 font-mono text-lg flex-1 truncate select-all">{hwid}</code>
                            <button 
                                onClick={() => { navigator.clipboard.writeText(hwid); toast.success("Đã sao chép mã máy"); }}
                                className="p-2 bg-neutral-700 hover:bg-neutral-600 rounded text-xs text-white"
                            >
                                Copy
                            </button>
                        </div>
                    </div>

                    {/* Expiry Info (if active) */}
                    {expiryInfo && (
                        <div className="text-center text-green-400 text-sm font-bold bg-green-900/20 p-2 rounded">
                            ✅ Bản quyền đang hoạt động. <br/> {expiryInfo}
                        </div>
                    )}

                    {/* Input Key */}
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Khóa kích hoạt</label>
                        <input 
                            type="text" 
                            value={inputKey}
                            onChange={(e) => setInputKey(e.target.value)}
                            placeholder="Dán key vào đây..."
                            className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:border-yellow-400 focus:outline-none transition-colors"
                        />
                        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                    </div>

                    {/* Action Button */}
                    <button 
                        onClick={handleActivate}
                        className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold rounded-lg shadow-lg transform active:scale-95 transition-all"
                    >
                        🗝️ KÍCH HOẠT NGAY
                    </button>

                    {/* Contact Info */}
                    <div className="border-t border-white/10 pt-4 mt-4">
                        <p className="text-xs text-neutral-500 uppercase font-bold mb-3 text-center">Liên hệ mua Key:</p>
                        <div className="space-y-2 text-sm text-neutral-300">
                             <a href="https://zalo.me/0824110286" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:bg-white/5 p-2 rounded transition-colors">
                                <span className="bg-blue-600 p-1 rounded"><ZaloIcon className="w-4 h-4 text-white" /></span>
                                <span className="flex-1">Zalo: 0824110286</span>
                            </a>
                            <a href="https://www.facebook.com/pdtneo1102" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:bg-white/5 p-2 rounded transition-colors">
                                <span className="bg-blue-700 p-1 rounded"><FacebookIcon className="w-4 h-4 text-white" /></span>
                                <span className="flex-1">Facebook: Phạm Thắng</span>
                            </a>
                            <div className="flex items-center gap-3 p-2">
                                <span className="bg-green-600 p-1 rounded"><PhoneIcon className="w-4 h-4 text-white" /></span>
                                <span className="flex-1">+84 0824 1102 86</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LicenseModal;
