
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { THEME_DETAILS } from './uiUtils';
import { FacebookIcon, ZaloIcon, PhoneIcon } from './icons';

const Footer: React.FC<{}> = () => {
    // FIXED: Only RainBow theme is available now.
    const currentThemeInfo = THEME_DETAILS[0];

    return (
        <footer className="base-font fixed bottom-0 left-0 right-0 footer-themed-bg p-2 z-50 text-neutral-300 text-xs sm:text-sm border-t border-white/10">
            <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-2 sm:gap-2 px-4">
                
                <div className="flex flex-wrap justify-center items-center gap-4 text-neutral-400 text-xs sm:text-sm">
                    <span className="font-bold text-neutral-300">Liên Hệ : Phạm Thắng</span>
                    <span className="hidden sm:block text-neutral-600">|</span>
                    
                    <a href="https://zalo.me/0824110286" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                         <ZaloIcon className="w-4 h-4" /> Zalo
                    </a>

                    <span className="hidden sm:block text-neutral-600">|</span>
                    
                    <a href="https://www.facebook.com/pdtneo1102" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                         <FacebookIcon className="w-4 h-4" /> Facebook
                    </a>

                    <span className="hidden sm:block text-neutral-600">|</span>
                    
                    <div className="flex items-center gap-1">
                         <PhoneIcon className="w-4 h-4" /> 0824110286
                    </div>
                </div>

                <div className="flex items-center flex-wrap justify-center gap-1 sm:gap-2">
                    <div className="flex items-center gap-2">
                        <div className="theme-dropdown">
                            <div className="theme-dropdown-button !cursor-default opacity-80 !min-w-0">
                                <span className="flex items-center gap-2">
                                     <span
                                        className="theme-swatch"
                                        style={{ background: `linear-gradient(to right, ${currentThemeInfo.colors[0]}, ${currentThemeInfo.colors[1]})` }}
                                    ></span>
                                    {/* Text removed as requested */}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
