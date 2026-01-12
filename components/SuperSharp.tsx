
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, ChangeEvent, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { enhanceImageQuality, editImageWithPrompt, SUPER_SHARP_PRESETS } from '../services/geminiService';
import ActionablePolaroidCard from './ActionablePolaroidCard';
import Lightbox from './Lightbox';
import { 
    AppScreenHeader,
    ResultsView,
    ImageForZip,
    AppOptionsLayout,
    OptionsPanel,
    type SuperSharpState,
    useLightbox,
    processAndDownloadAll,
    useAppControls,
    embedJsonInPng,
    SearchableSelect,
} from './uiUtils';
import { CloudUploadIcon, LoadingSpinnerIcon } from './icons';

interface SuperSharpProps {
    mainTitle: string;
    subtitle: string;
    useSmartTitleWrapping: boolean;
    smartTitleWrapWords: number;
    uploaderCaption: string;
    uploaderDescription: string;
    addImagesToGallery: (images: string[]) => void;
    appState: SuperSharpState;
    onStateChange: (newState: SuperSharpState) => void;
    onReset: () => void;
    onGoBack: () => void;
    logGeneration: (appId: string, preGenState: any, thumbnailUrl: string) => void;
}

const SuperSharp: React.FC<SuperSharpProps> = (props) => {
    const { 
        uploaderCaption, uploaderDescription, addImagesToGallery, 
        appState, onStateChange, onReset,
        logGeneration,
        ...headerProps 
    } = props;
    
    const { t, settings } = useAppControls();
    const { lightboxIndex, openLightbox, closeLightbox, navigateLightbox } = useLightbox();
    const [localNotes, setLocalNotes] = useState(appState.options.notes);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocalNotes(appState.options.notes);
    }, [appState.options.notes]);

    const lightboxImages = [
        ...appState.uploadedImages, 
        ...appState.historicalImages
    ].filter((img): img is string => !!img);

    // Sử dụng keys từ SUPER_SHARP_PRESETS cho dropdown
    const PRESET_OPTIONS = Object.keys(SUPER_SHARP_PRESETS);
    const DENOISE_OPTIONS = ['Tự động', 'Yếu', 'Trung bình', 'Mạnh'];

    const handleFilesSelected = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            const readFile = (file: File): Promise<string> => new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });

            const dataUrls = await Promise.all(files.map(readFile));
            onStateChange({
                ...appState,
                stage: 'configuring',
                uploadedImages: dataUrls,
                generatedResults: {},
                historicalImages: [],
                error: null,
                options: {
                    ...appState.options,
                    upscaleLevel: PRESET_OPTIONS[0] // Mặc định chọn cái đầu tiên
                }
            });
            addImagesToGallery(dataUrls);
        }
    };

    const handleOptionChange = (field: keyof SuperSharpState['options'], value: string | boolean) => {
        onStateChange({
            ...appState,
            options: { ...appState.options, [field]: value }
        });
    };

    const executeBatchGeneration = async () => {
        if (appState.uploadedImages.length === 0) return;
        
        const preGenState = { ...appState };
        onStateChange({ 
            ...appState, 
            stage: 'generating', 
            currentProcessingIndex: 0,
            error: null 
        });

        const newResults = { ...appState.generatedResults };
        const newHistorical = [...appState.historicalImages];

        for (let i = 0; i < appState.uploadedImages.length; i++) {
            const currentImg = appState.uploadedImages[i];
            onStateChange({ ...appState, stage: 'generating', currentProcessingIndex: i });
            
            try {
                const resultUrl = await enhanceImageQuality(currentImg, appState.options);
                const settingsToEmbed = {
                    viewId: 'super-sharp',
                    state: { ...appState, stage: 'configuring', uploadedImages: [currentImg], error: null },
                };
                const urlWithMetadata = await embedJsonInPng(resultUrl, settingsToEmbed, settings.enableImageMetadata);
                
                newResults[currentImg] = { status: 'done', url: urlWithMetadata };
                newHistorical.push(urlWithMetadata);
                addImagesToGallery([urlWithMetadata]);
                
                if (i === 0) {
                    logGeneration('super-sharp', preGenState, urlWithMetadata);
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Error";
                newResults[currentImg] = { status: 'error', error: errorMessage };
            }

            onStateChange({
                ...appState,
                stage: i === appState.uploadedImages.length - 1 ? 'results' : 'generating',
                currentProcessingIndex: i,
                generatedResults: { ...newResults },
                historicalImages: [...newHistorical]
            });
        }
    };
    
    const handleRegeneration = async (originalImgUrl: string, prompt: string) => {
        const currentResult = appState.generatedResults[originalImgUrl];
        if (!currentResult || !currentResult.url) return;

        onStateChange({ 
            ...appState, 
            stage: 'generating', 
            generatedResults: { 
                ...appState.generatedResults, 
                [originalImgUrl]: { status: 'pending' } 
            } 
        });

        try {
            const resultUrl = await editImageWithPrompt(currentResult.url, prompt);
            onStateChange({
                ...appState,
                stage: 'results',
                generatedResults: {
                    ...appState.generatedResults,
                    [originalImgUrl]: { status: 'done', url: resultUrl }
                },
                historicalImages: [...appState.historicalImages, resultUrl],
            });
            addImagesToGallery([resultUrl]);
        } catch (err) {
            onStateChange({
                ...appState,
                stage: 'results',
                generatedResults: {
                    ...appState.generatedResults,
                    [originalImgUrl]: { status: 'error', error: (err as Error).message }
                },
            });
        }
    };
    
    const handleDownloadAll = () => {
        const itemsToZip: ImageForZip[] = [];
        appState.uploadedImages.forEach((url, i) => {
            itemsToZip.push({ url, filename: `goc-${i+1}`, folder: 'input' });
            const result = appState.generatedResults[url];
            if (result?.url) {
                itemsToZip.push({ url: result.url, filename: `net-${i+1}`, folder: 'output' });
            }
        });
        
        processAndDownloadAll({
            inputImages: [],
            historicalImages: itemsToZip.filter(item => item.folder === 'output'),
            zipFilename: 'chay-net-hang-loat.zip',
            baseOutputFilename: 'anh-net',
        });
    };
    
    const isProcessing = appState.stage === 'generating';

    // Lấy thông số của preset đang chọn để hiển thị hint
    const currentPresetInfo = SUPER_SHARP_PRESETS[appState.options.upscaleLevel] || {};

    return (
        <div className="flex flex-col items-center justify-center w-full h-full flex-1 min-h-0">
            <AnimatePresence>
                {(appState.stage === 'idle' || appState.stage === 'configuring') && (<AppScreenHeader {...headerProps} />)}
            </AnimatePresence>

            <div className="flex flex-col items-center justify-center w-full flex-1">
                {appState.stage === 'idle' && (
                    <div className="flex flex-col items-center">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            multiple 
                            onChange={handleFilesSelected} 
                            accept="image/*"
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="btn btn-primary flex items-center gap-2 mb-4"
                        >
                            <CloudUploadIcon className="h-6 w-6" />
                            {t('superSharp_uploaderCaption')}
                        </button>
                        <p className="base-font font-bold text-neutral-300 text-center max-w-lg text-lg">
                            {t('superSharp_uploaderDescription')}
                        </p>
                    </div>
                )}

                {appState.stage === 'configuring' && appState.uploadedImages.length > 0 && (
                    <AppOptionsLayout>
                        <div className="w-full overflow-x-auto pb-4">
                            <div className="flex flex-nowrap gap-4 justify-center px-4">
                                {appState.uploadedImages.slice(0, 5).map((img, idx) => (
                                    <div key={idx} className="w-40 flex-shrink-0">
                                        <ActionablePolaroidCard 
                                            type="display" 
                                            mediaUrl={img} 
                                            caption={`Ảnh ${idx + 1}`} 
                                            status="done" 
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <OptionsPanel>
                            <h2 className="base-font font-bold text-2xl text-yellow-400 border-b border-yellow-400/20 pb-2">
                                {t('superSharp_optionsTitle')} ({appState.uploadedImages.length} ảnh)
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <SearchableSelect
                                    id="upscaleLevel"
                                    label="Loại phục chế / Preset"
                                    options={PRESET_OPTIONS}
                                    value={appState.options.upscaleLevel}
                                    onChange={(val) => handleOptionChange('upscaleLevel', val)}
                                />
                                <SearchableSelect
                                    id="denoiseStrength"
                                    label={t('superSharp_denoiseLabel')}
                                    options={DENOISE_OPTIONS}
                                    value={appState.options.denoiseStrength}
                                    onChange={(val) => handleOptionChange('denoiseStrength', val)}
                                />
                            </div>

                            {/* Hiển thị tóm tắt thông số kỹ thuật từ JSON */}
                            <div className="bg-black/30 p-3 rounded-md border border-white/5">
                                <p className="text-[10px] uppercase font-bold text-neutral-500 mb-1">Thông số kỹ thuật của Preset</p>
                                <div className="grid grid-cols-3 gap-2 text-[11px] text-neutral-400 font-mono">
                                    <span>Upscale: <b className="text-yellow-400/80">{currentPresetInfo.upscale}x</b></span>
                                    <span>Scale: <b className="text-yellow-400/80">{currentPresetInfo.process_size}px</b></span>
                                    <span>Face: <b className="text-yellow-400/80">{currentPresetInfo.face_processing ? 'ON' : 'OFF'}</b></span>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="notes" className="block text-left base-font font-bold text-lg text-neutral-200 mb-2">{t('common_additionalNotes')}</label>
                                <textarea
                                    id="notes"
                                    value={localNotes}
                                    onChange={(e) => setLocalNotes(e.target.value)}
                                    onBlur={() => {
                                        if (localNotes !== appState.options.notes) {
                                            handleOptionChange('notes', localNotes);
                                        }
                                    }}
                                    placeholder={t('superSharp_notesPlaceholder')}
                                    className="form-input h-24"
                                    rows={3}
                                />
                            </div>
                            <div className="flex items-center pt-2">
                                <input type="checkbox" id="remove-watermark-sharp" checked={appState.options.removeWatermark}
                                    onChange={(e) => handleOptionChange('removeWatermark', e.target.checked)}
                                    className="h-4 w-4 rounded border-neutral-500 bg-neutral-700 text-yellow-400 focus:ring-yellow-400 focus:ring-offset-neutral-800" />
                                <label htmlFor="remove-watermark-sharp" className="ml-3 block text-sm font-medium text-neutral-300">{t('common_removeWatermark')}</label>
                            </div>
                            <div className="flex items-center justify-end gap-4 pt-4">
                                <button onClick={onReset} className="btn btn-secondary">{t('common_changeImage')}</button>
                                <button onClick={executeBatchGeneration} className="btn btn-primary" disabled={isProcessing}>
                                    {isProcessing ? t('common_creating') : t('superSharp_createButton')}
                                </button>
                            </div>
                        </OptionsPanel>
                    </AppOptionsLayout>
                )}
            </div>

            {(appState.stage === 'generating' || appState.stage === 'results') && (
                <ResultsView
                    stage={appState.stage}
                    error={null}
                    actions={
                        <>
                            {Object.keys(appState.generatedResults).length > 0 && (
                                <button onClick={handleDownloadAll} className="btn btn-secondary">{t('common_downloadAll')}</button>
                            )}
                            <button onClick={() => onStateChange({...appState, stage: 'configuring'})} className="btn btn-secondary">{t('common_editOptions')}</button>
                            <button onClick={onReset} className="btn btn-secondary">{t('common_startOver')}</button>
                        </>
                    }>
                    
                    {appState.uploadedImages.map((originalUrl, idx) => {
                        const result = appState.generatedResults[originalUrl];
                        const isCurrentlyProcessing = appState.currentProcessingIndex === idx;
                        
                        return (
                            <motion.div
                                className="w-full md:w-auto flex-shrink-0"
                                key={originalUrl}
                                initial={{ opacity: 0, scale: 0.5, y: 100 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ type: 'spring', stiffness: 80, damping: 15, delay: idx * 0.1 }}
                            >
                                <ActionablePolaroidCard
                                    type="output"
                                    caption={`Ảnh ${idx + 1}`}
                                    status={result ? result.status : (isCurrentlyProcessing ? 'pending' : 'pending')}
                                    mediaUrl={result?.url}
                                    error={result?.error}
                                    onRegenerate={(prompt) => handleRegeneration(originalUrl, prompt)}
                                    regenerationTitle={t('common_regenTitle')}
                                    regenerationDescription={t('superSharp_regenDescription')}
                                    regenerationPlaceholder={t('superSharp_regenPlaceholder')}
                                    onClick={result?.url ? () => openLightbox(lightboxImages.indexOf(result.url!)) : undefined} 
                                />
                            </motion.div>
                        );
                    })}
                </ResultsView>
            )}

            <Lightbox
                images={lightboxImages}
                selectedIndex={lightboxIndex}
                onClose={closeLightbox}
                onNavigate={navigateLightbox}
            />
        </div>
    );
};

export default SuperSharp;
