
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { addSunEffectToImage, editImageWithPrompt } from '../services/geminiService';
import ActionablePolaroidCard from './ActionablePolaroidCard';
import Lightbox from './Lightbox';
import { 
    AppScreenHeader,
    ImageUploader,
    ResultsView,
    ImageForZip,
    AppOptionsLayout,
    OptionsPanel,
    type SunEffectCreatorState,
    useLightbox,
    useVideoGeneration,
    processAndDownloadAll,
    useAppControls,
    embedJsonInPng,
    SearchableSelect,
} from './uiUtils';

interface SunEffectCreatorProps {
    mainTitle: string;
    subtitle: string;
    useSmartTitleWrapping: boolean;
    smartTitleWrapWords: number;
    uploaderCaption: string;
    uploaderDescription: string;
    addImagesToGallery: (images: string[]) => void;
    appState: SunEffectCreatorState;
    onStateChange: (newState: SunEffectCreatorState) => void;
    onReset: () => void;
    onGoBack: () => void;
    logGeneration: (appId: string, preGenState: any, thumbnailUrl: string) => void;
}

const SunEffectCreator: React.FC<SunEffectCreatorProps> = (props) => {
    const { 
        uploaderCaption, uploaderDescription, addImagesToGallery, 
        appState, onStateChange, onReset,
        logGeneration,
        ...headerProps 
    } = props;
    
    const { t, settings } = useAppControls();
    const { lightboxIndex, openLightbox, closeLightbox, navigateLightbox } = useLightbox();
    const { videoTasks, generateVideo } = useVideoGeneration();
    const [localNotes, setLocalNotes] = useState(appState.options.notes);

    const EFFECT_TYPES = t('sunEffectCreator_effectOptions');
    const INTENSITY_OPTIONS = t('sunEffectCreator_intensityOptions');
    const POSITION_OPTIONS = t('sunEffectCreator_positionOptions');

    useEffect(() => {
        setLocalNotes(appState.options.notes);
    }, [appState.options.notes]);

    const lightboxImages = [appState.uploadedImage, ...appState.historicalImages].filter((img): img is string => !!img);

    const handleImageSelectedForUploader = (imageDataUrl: string) => {
        onStateChange({
            ...appState,
            stage: 'configuring',
            uploadedImage: imageDataUrl,
            generatedImage: null,
            historicalImages: [],
            error: null,
        });
        addImagesToGallery([imageDataUrl]);
    };

    const handleOptionChange = (field: keyof SunEffectCreatorState['options'], value: string | boolean) => {
        onStateChange({
            ...appState,
            options: { ...appState.options, [field]: value }
        });
    };

    const executeGeneration = async () => {
        if (!appState.uploadedImage) return;
        
        const preGenState = { ...appState };
        onStateChange({ ...appState, stage: 'generating', error: null });

        try {
            const resultUrl = await addSunEffectToImage(appState.uploadedImage, appState.options);
            const settingsToEmbed = {
                viewId: 'sun-effect-creator',
                state: { ...appState, stage: 'configuring', generatedImage: null, historicalImages: [], error: null },
            };
            const urlWithMetadata = await embedJsonInPng(resultUrl, settingsToEmbed, settings.enableImageMetadata);
            logGeneration('sun-effect-creator', preGenState, urlWithMetadata);
            onStateChange({
                ...appState,
                stage: 'results',
                generatedImage: urlWithMetadata,
                historicalImages: [...appState.historicalImages, urlWithMetadata],
            });
            addImagesToGallery([urlWithMetadata]);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            onStateChange({ ...appState, stage: 'results', error: errorMessage });
        }
    };
    
    const handleRegeneration = async (prompt: string) => {
        if (!appState.generatedImage) return;

        const preGenState = { ...appState };
        onStateChange({ ...appState, stage: 'generating', error: null });

        try {
            const resultUrl = await editImageWithPrompt(appState.generatedImage, prompt);
            const settingsToEmbed = {
                viewId: 'sun-effect-creator',
                state: { ...appState, stage: 'configuring', generatedImage: null, historicalImages: [], error: null },
            };
            const urlWithMetadata = await embedJsonInPng(resultUrl, settingsToEmbed, settings.enableImageMetadata);
            logGeneration('sun-effect-creator', preGenState, urlWithMetadata);
            onStateChange({
                ...appState,
                stage: 'results',
                generatedImage: urlWithMetadata,
                historicalImages: [...appState.historicalImages, urlWithMetadata],
            });
            addImagesToGallery([urlWithMetadata]);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            onStateChange({ ...appState, stage: 'results', error: errorMessage });
        }
    };
    
    const handleUploadedImageChange = (newUrl: string | null) => {
        onStateChange({ ...appState, uploadedImage: newUrl, stage: newUrl ? 'configuring' : 'idle' });
        if (newUrl) {
            addImagesToGallery([newUrl]);
        }
    };

    const handleGeneratedImageChange = (newUrl: string) => {
        const newHistorical = [...appState.historicalImages, newUrl];
        onStateChange({ ...appState, stage: 'results', generatedImage: newUrl, historicalImages: newHistorical });
        addImagesToGallery([newUrl]);
    };
    
    const handleBackToOptions = () => {
        onStateChange({ ...appState, stage: 'configuring', error: null });
    };

    const handleDownloadAll = () => {
        const inputImages: ImageForZip[] = [];
        if (appState.uploadedImage) {
            inputImages.push({ url: appState.uploadedImage, filename: 'anh-goc', folder: 'input' });
        }
        
        processAndDownloadAll({
            inputImages,
            historicalImages: appState.historicalImages,
            videoTasks,
            zipFilename: 'anh-nang-nghe-thuat.zip',
            baseOutputFilename: 'anh-nang',
        });
    };
    
    const isLoading = appState.stage === 'generating';

    return (
        <div className="flex flex-col items-center justify-center w-full h-full flex-1 min-h-0">
            <AnimatePresence>
                {(appState.stage === 'idle' || appState.stage === 'configuring') && (<AppScreenHeader {...headerProps} />)}
            </AnimatePresence>

            <div className="flex flex-col items-center justify-center w-full flex-1">
                {appState.stage === 'idle' && (
                    <ImageUploader
                        onImageChange={handleImageSelectedForUploader}
                        uploaderCaption={uploaderCaption}
                        uploaderDescription={uploaderDescription}
                        placeholderType="magic"
                    />
                )}

                {appState.stage === 'configuring' && appState.uploadedImage && (
                    <AppOptionsLayout>
                        <div className="flex-shrink-0">
                            <ActionablePolaroidCard 
                                type="content-input" 
                                mediaUrl={appState.uploadedImage} 
                                caption={t('common_originalImage')} 
                                status="done" 
                                onClick={() => openLightbox(0)} 
                                onImageChange={handleUploadedImageChange} 
                            />
                        </div>
                        <OptionsPanel>
                            <h2 className="base-font font-bold text-2xl text-yellow-400 border-b border-yellow-400/20 pb-2">{t('sunEffectCreator_optionsTitle')}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <SearchableSelect
                                    id="effect-type"
                                    label={t('sunEffectCreator_effectLabel')}
                                    options={EFFECT_TYPES}
                                    value={appState.options.effectType}
                                    onChange={(val) => handleOptionChange('effectType', val)}
                                />
                                <SearchableSelect
                                    id="intensity"
                                    label={t('sunEffectCreator_intensityLabel')}
                                    options={INTENSITY_OPTIONS}
                                    value={appState.options.intensity}
                                    onChange={(val) => handleOptionChange('intensity', val)}
                                />
                                <SearchableSelect
                                    id="position"
                                    label={t('sunEffectCreator_positionLabel')}
                                    options={POSITION_OPTIONS}
                                    value={appState.options.position}
                                    onChange={(val) => handleOptionChange('position', val)}
                                />
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
                                    placeholder={t('sunEffectCreator_notesPlaceholder')}
                                    className="form-input h-24"
                                    rows={3}
                                />
                            </div>
                            <div className="flex items-center pt-2">
                                <input type="checkbox" id="remove-watermark-sun" checked={appState.options.removeWatermark}
                                    onChange={(e) => handleOptionChange('removeWatermark', e.target.checked)}
                                    className="h-4 w-4 rounded border-neutral-500 bg-neutral-700 text-yellow-400 focus:ring-yellow-400 focus:ring-offset-neutral-800" />
                                <label htmlFor="remove-watermark-sun" className="ml-3 block text-sm font-medium text-neutral-300">{t('common_removeWatermark')}</label>
                            </div>
                            <div className="flex items-center justify-end gap-4 pt-4">
                                <button onClick={onReset} className="btn btn-secondary">{t('common_changeImage')}</button>
                                <button onClick={executeGeneration} className="btn btn-primary" disabled={isLoading}>{isLoading ? t('common_creating') : t('sunEffectCreator_createButton')}</button>
                            </div>
                        </OptionsPanel>
                    </AppOptionsLayout>
                )}
            </div>

            {(appState.stage === 'generating' || appState.stage === 'results') && (
                <ResultsView
                    stage={appState.stage}
                    originalImage={appState.uploadedImage}
                    onOriginalClick={() => openLightbox(0)}
                    error={appState.error}
                    actions={
                        <>
                            {appState.generatedImage && !appState.error && (<button onClick={handleDownloadAll} className="btn btn-secondary">{t('common_downloadAll')}</button>)}
                            <button onClick={handleBackToOptions} className="btn btn-secondary">{t('common_editOptions')}</button>
                            <button onClick={onReset} className="btn btn-secondary">{t('common_startOver')}</button>
                        </>
                    }>
                    <motion.div
                        className="w-full md:w-auto flex-shrink-0"
                        key="generated-sun"
                        initial={{ opacity: 0, scale: 0.5, y: 100 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.15 }}>
                        <ActionablePolaroidCard
                            type="output"
                            caption={t('sunEffectCreator_resultCaption')} status={isLoading ? 'pending' : (appState.error ? 'error' : 'done')}
                            mediaUrl={appState.generatedImage ?? undefined} error={appState.error ?? undefined}
                            onImageChange={handleGeneratedImageChange}
                            onRegenerate={handleRegeneration}
                            onGenerateVideoFromPrompt={(prompt) => appState.generatedImage && generateVideo(appState.generatedImage, prompt)}
                            regenerationTitle={t('common_regenTitle')}
                            regenerationDescription={t('sunEffectCreator_regenDescription')}
                            regenerationPlaceholder={t('sunEffectCreator_regenPlaceholder')}
                            onClick={!appState.error && appState.generatedImage ? () => openLightbox(lightboxImages.indexOf(appState.generatedImage!)) : undefined} />
                    </motion.div>
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

export default SunEffectCreator;
