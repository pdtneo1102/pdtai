/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { motion } from 'framer-motion';

interface LicenseStatusProps {
    onClick: () => void;
    isValid: boolean;
}

const LicenseStatus: React.FC<LicenseStatusProps> = ({ onClick, isValid }) => {
    return (
        <button 
            onClick={onClick}
            className={`group flex flex-col items-start justify-center px-4 py-1.5 rounded-lg border transition-all duration-300 ${isValid ? 'bg-neutral-900/80 border-green-500/30 hover:border-green-500/60' : 'bg-red-900/20 border-red-500/50 hover:bg-red-900/40'}`}
        >
            <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Trạng thái bản quyền</span>
            <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${isValid ? 'text-white' : 'text-red-400'}`}>
                    {isValid ? "ĐÃ KÍCH HOẠT" : "CHƯA KÍCH HOẠT"}
                </span>
                 {isValid ? (
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ) : (
                    <svg className="w-4 h-4 text-red-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                )}
            </div>
            <span className="text-[10px] text-neutral-500 group-hover:text-yellow-400 transition-colors mt-0.5 flex items-center gap-1">
               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
               Quản lý khóa
            </span>
        </button>
    );
};

export default LicenseStatus;
