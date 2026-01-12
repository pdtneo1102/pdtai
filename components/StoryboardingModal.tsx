
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppControls, useImageEditor, type ImageForZip, downloadAllImagesAsZip, downloadJson, useDebounce } from './uiUtils';
import { GalleryPicker } from './uiComponents';
import { useLightbox } from './uiHooks';
import { downloadImage } from './uiFileUtilities';
import type { SceneState } from './uiTypes';
import { CloseIcon, CloudUploadIcon, UndoIcon, RedoIcon } from './icons';
import { createScriptSummaryFromIdea, createScriptSummaryFromText, createScriptSummaryFromAudio, developScenesFromSummary, type ScriptSummary, generateVideoPromptFromScenes, refineSceneDescription, refineSceneTransition, startVideoGeneration, pollVideoOperation } from '../services/geminiService';
import { generateFreeImage } from '../services/gemini/freeGenerationService';
import toast from 'react-hot-toast';
import StoryboardingInput from './storyboarding/StoryboardingInput';
import StoryboardingSummary from './storyboarding/StoryboardingSummary';
import StoryboardingScenes from './storyboarding/StoryboardingScenes';
import Lightbox from './Lightbox';
import * as db from '../lib/db';


interface StoryboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onHide: () => void;
}

type InputMethod = 'prompt' | 'text' | 'audio';

const parseDataUrlForComponent = (imageDataUrl: string): { mimeType: string; data: string } => {
    const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) {
        throw new Error("Invalid image data URL format.");
    }
    const [, mimeType, data] = match;
    return { mimeType, data };
}

const dataURLtoFile = (dataUrl: string, filename: string, fileType: string): File => {
    const arr = dataUrl.split(',');
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: fileType });
};

export const StoryboardingModal: React.FC<StoryboardingModalProps> = ({ isOpen, onClose, onHide }) => {
    const { t, language, addImagesToGallery, imageGallery } = useAppControls();
    const { openImageEditor } = useImageEditor();
    const { lightboxIndex, openLightbox, closeLightbox, navigateLightbox } = useLightbox();

    const [activeInput, setActiveInput] = useState<InputMethod>('prompt');
    const [idea, setIdea] = useState('');
    const [scriptText, setScriptText] = useState('');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [referenceImages, setReferenceImages] = useState<string[]>([]);
    
    const [scriptSummary, setScriptSummary] = useState<ScriptSummary | null>(null);
    const [scenes, setScenes] = useState<SceneState[]>([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    
    const [isGalleryPickerOpen, setIsGalleryPickerOpen] = useState(false);
    const [isDraggingRef, setIsDraggingRef] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [pickingCustomImageFor, setPickingCustomImageFor] = useState<{index: number, frameType: 'start' | 'end'} | null>(null);
    
    const [style, setStyle] = useState('');
    const [numberOfScenes, setNumberOfScenes] = useState(0);
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [notes, setNotes] = useState('');
    const [storyboardLanguage, setStoryboardLanguage] = useState<'vi' | 'en' | 'zh'>('vi');
    const [scriptType, setScriptType] = useState<'auto' | 'dialogue' | 'action'>('auto');
    const [keepClothing, setKeepClothing] = useState(false);
    const [keepBackground, setKeepBackground] = useState(false);

    const [audioData, setAudioData] = useState<{ name: string; type: string; dataUrl: string } | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // NEW: State for Undo/Redo
    const [history, setHistory] = useState<SceneState[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    const audioInputRef = useRef<HTMLInputElement>(null);
    const textInputRef = useRef<HTMLInputElement>(null);
    const importInputRef = useRef<HTMLInputElement>(null);
    const customImageUploadRef = useRef<HTMLInputElement>(null);
    const [uploadingImageFor, setUploadingImageFor] = useState<{index: number, frameType: 'start' | 'end'} | null>(null);

    const scenesRef = useRef(scenes);
    useEffect(() => {
        scenesRef.current = scenes;
    }, [scenes]);


    const aspectRatioOptions: string[] = t('storyboarding_aspectRatioOptions');

    const styleOptions: any[] = useMemo(() => {
        const options = t('storyboarding_styleOptions');
        return Array.isArray(options) ? options : [];
    }, [t]);

    // FIX: Define lightboxImages correctly based on both reference images and generated frame images.
    const lightboxImages = useMemo(() => {
        const images: string[] = [];
        scenes.forEach(s => {
            if (s.startFrame.imageUrl) images.push(s.startFrame.imageUrl);
            if (s.endFrame.imageUrl) images.push(s.endFrame.imageUrl);
        });
        return [...referenceImages, ...images];
    }, [scenes, referenceImages]);

    // --- History Management ---
    const updateScenesAndHistory = useCallback((newScenes: SceneState[]) => {
        const currentScenes = history[historyIndex];
        if (currentScenes && JSON.stringify(newScenes) === JSON.stringify(currentScenes)) {
            return;
        }
        
        setScenes(newScenes);

        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newScenes);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);

    const handleUndo = useCallback(() => {
        if (canUndo) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setScenes(history[newIndex]);
        }
    }, [history, historyIndex, canUndo]);

    const handleRedo = useCallback(() => {
        if (canRedo) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setScenes(history[newIndex]);
        }
    }, [history, historyIndex, canRedo]);

    const resetState = useCallback(() => {
        setActiveInput('prompt');
        setIdea('');
        setScriptText('');
        setAudioFile(null);
        setReferenceImages([]);
        setScriptSummary(null);
        setScenes([]);
        setIsLoading(false);
        setLoadingMessage('');
        setError(null);
        setStyle('');
        setNumberOfScenes(0);
        setAspectRatio(aspectRatioOptions[0] || '16:9');
        setNotes('');
        setStoryboardLanguage('vi');
        setScriptType('auto');
        setKeepClothing(false);
        setKeepBackground(false);
        setHistory([[]]);
        setHistoryIndex(0);
    }, [aspectRatioOptions]);

    const handleNew = () => {
        resetState();
        db.clearStoryboardState();
        toast.success("Storyboard mới đã được tạo.");
    };

    useEffect(() => {
        if (isOpen) {
            const loadState = async () => {
                const savedState = await db.loadStoryboardState();
                if (savedState) {
                    setActiveInput(savedState.activeInput || 'prompt');
                    setIdea(savedState.idea || '');
                    setScriptText(savedState.scriptText || '');
                    if (savedState.audioData) {
                        const file = dataURLtoFile(savedState.audioData.dataUrl, savedState.audioData.name, savedState.audioData.type);
                        setAudioFile(file);
                    } else {
                        setAudioFile(null);
                    }
                    setReferenceImages(savedState.referenceImages || []);
                    setScriptSummary(savedState.scriptSummary || null);
                    
                    const initialScenes = savedState.scenes || [];
                    setScenes(initialScenes);
                    setHistory([initialScenes]);
                    setHistoryIndex(0);

                    setStyle(savedState.style || '');
                    setNumberOfScenes(savedState.numberOfScenes ?? 0);
                    setAspectRatio(savedState.aspectRatio || aspectRatioOptions[0]);
                    setNotes(savedState.notes || '');
                    setStoryboardLanguage(savedState.storyboardLanguage || 'vi');
                    setScriptType(savedState.scriptType || 'auto');
                    setKeepClothing(savedState.keepClothing || false);
                    setKeepBackground(savedState.keepBackground || false);
                }
                setIsLoaded(true);
            };
            loadState();
        } else {
            setIsLoaded(false);
        }
    }, [isOpen, aspectRatioOptions]);

    useEffect(() => {
        if (audioFile) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (reader.result) {
                    setAudioData({
                        name: audioFile.name,
                        type: audioFile.type,
                        dataUrl: reader.result as string,
                    });
                }
            };
            reader.readAsDataURL(audioFile);
        } else {
            setAudioData(null);
        }
    }, [audioFile]);

    const debouncedState = useDebounce({
        activeInput, idea, scriptText, audioData, referenceImages,
        scriptSummary, scenes, style, numberOfScenes, aspectRatio, notes, storyboardLanguage,
        scriptType, keepClothing, keepBackground
    }, 1000);

    useEffect(() => {
        if (isOpen && isLoaded) {
            db.saveStoryboardState(debouncedState);
        }
    }, [debouncedState, isOpen, isLoaded]);

    const mapServiceSceneToState = (s: any): SceneState => ({
        scene: s.scene,
        animationDescription: s.animationDescription,
        startFrame: {
            description: s.startFrameDescription,
            status: 'idle',
            imageSource: 'reference',
        },
        endFrame: {
            description: s.endFrameDescription,
            status: 'idle',
            imageSource: 'reference',
        }
    });

    const handleGenerateScriptSummary = async () => {
        setIsLoading(true);
        setError(null);
        setLoadingMessage(t('storyboarding_generating_scenario'));
        setScriptSummary(null);

        try {
            let result: ScriptSummary;
            const referenceImagesData = referenceImages.map(url => parseDataUrlForComponent(url));
            const options = { style, numberOfScenes, aspectRatio, notes, keepClothing, keepBackground };

            switch (activeInput) {
                case 'text':
                    if (!scriptText.trim()) throw new Error(t('storyboarding_error_noText'));
                    result = await createScriptSummaryFromText(scriptText, referenceImagesData, options, storyboardLanguage, scriptType);
                    break;
                case 'audio':
                    if (!audioFile) throw new Error(t('storyboarding_error_noAudio'));
                    const audioData = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                        reader.onerror = reject;
                        reader.readAsDataURL(audioFile);
                    });
                    result = await createScriptSummaryFromAudio({ mimeType: audioFile.type, data: audioData }, referenceImagesData, options, storyboardLanguage, scriptType);
                    break;
                case 'prompt':
                default:
                    if (!idea.trim()) throw new Error(t('storyboarding_error_noIdea'));
                    result = await createScriptSummaryFromIdea(idea, referenceImagesData, options, storyboardLanguage, scriptType);
                    break;
            }
            setScriptSummary(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error";
            setError(t('storyboarding_error_scenario', errorMessage));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDevelopScenes = async () => {
        if (!scriptSummary) return;
        setIsLoading(true);
        setError(null);
        setLoadingMessage(t('storyboarding_developing_scenes'));
        try {
            const fullScenario = await developScenesFromSummary(scriptSummary, storyboardLanguage, scriptType);
            const newScenes = fullScenario.scenes.map(mapServiceSceneToState);
            updateScenesAndHistory(newScenes);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error";
            setError(t('storyboarding_error_develop', errorMessage));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateImage = async (index: number, frameType: 'start' | 'end') => {
        const scene = scenes[index];
        const frame = frameType === 'start' ? scene.startFrame : scene.endFrame;

        const setFrameStatus = (status: any, data: any = {}) => {
            const updatedScenes = [...scenes];
            const targetFrame = frameType === 'start' ? updatedScenes[index].startFrame : updatedScenes[index].endFrame;
            updatedScenes[index] = {
                ...updatedScenes[index],
                [frameType === 'start' ? 'startFrame' : 'endFrame']: { ...targetFrame, status, ...data }
            };
            updateScenesAndHistory(updatedScenes);
        };

        setFrameStatus('pending');

        try {
            let inputImage: string | undefined;
            if (frame.imageSource === 'reference') {
                inputImage = referenceImages[0];
            } else if (frame.imageSource.startsWith('data:image')) {
                inputImage = frame.imageSource;
            } else {
                const [sourceIndexStr, sourceFrameType] = frame.imageSource.split('-');
                const sourceIndex = parseInt(sourceIndexStr, 10);
                const sourceScene = scenes[sourceIndex];
                inputImage = sourceFrameType === 'start' ? sourceScene.startFrame.imageUrl : sourceScene.endFrame.imageUrl;
            }

            const resultUrls = await generateFreeImage(
                frame.description, 1, aspectRatio, inputImage, undefined, undefined, undefined, false
            );

            if (resultUrls.length > 0) {
                setFrameStatus('done', { imageUrl: resultUrls[0] });
                addImagesToGallery([resultUrls[0]]);
            } else {
                throw new Error(t('storyboarding_error_noImage'));
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error";
            setFrameStatus('error', { error: errorMessage });
        }
    };

    const handleGenerateVideoPrompt = async (index: number, promptMode: 'auto' | 'start-end' | 'json') => {
        const scene = scenes[index];
        if (!scene.startFrame.description || !scene.animationDescription || !scene.endFrame.description) return;
        
        try {
            const videoPrompt = await generateVideoPromptFromScenes(
                scene.startFrame.description,
                scene.animationDescription,
                scene.endFrame.description,
                storyboardLanguage,
                promptMode,
                scriptType
            );
            const updatedScenes = [...scenes];
            updatedScenes[index] = { ...updatedScenes[index], videoPrompt };
            updateScenesAndHistory(updatedScenes);
            toast.success("Video prompt đã được tạo.");
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error";
            toast.error(`Failed to generate video prompt: ${errorMessage}`);
        }
    };

    const handleGenerateVideo = async (index: number) => {
        const scene = scenes[index];
        if (!scene.startFrame.imageUrl || !scene.videoPrompt) {
            toast.error(t('storyboarding_error_videoInputs'));
            return;
        }

        const setVideoStatus = (status: any, data: any = {}) => {
            const updatedScenes = [...scenes];
            updatedScenes[index] = { ...updatedScenes[index], videoStatus: status, ...data };
            updateScenesAndHistory(updatedScenes);
        };

        setVideoStatus('pending');

        try {
            const image = parseDataUrlForComponent(scene.startFrame.imageUrl);
            let operation = await startVideoGeneration(scene.videoPrompt, image);

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await pollVideoOperation(operation);
            }

            if (operation.response?.generatedVideos?.[0]?.video?.uri) {
                const downloadLink = operation.response.generatedVideos[0].video.uri;
                const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                setVideoStatus('done', { videoUrl: blobUrl });
                addImagesToGallery([blobUrl]);
            } else {
                throw new Error(operation.error?.message || "Generation failed.");
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error";
            setVideoStatus('error', { videoError: errorMessage });
        }
    };

    const handleEditImage = (index: number, frameType: 'start' | 'end') => {
        const scene = scenes[index];
        const frame = frameType === 'start' ? scene.startFrame : scene.endFrame;
        if (!frame.imageUrl) return;

        openImageEditor(frame.imageUrl, (newUrl) => {
            const updatedScenes = [...scenes];
            if (frameType === 'start') {
                updatedScenes[index].startFrame.imageUrl = newUrl;
            } else {
                updatedScenes[index].endFrame.imageUrl = newUrl;
            }
            updateScenesAndHistory(updatedScenes);
            addImagesToGallery([newUrl]);
        });
    };

    const handlePreviewImage = (index: number, frameType: 'start' | 'end') => {
        const scene = scenes[index];
        const url = frameType === 'start' ? scene.startFrame.imageUrl : scene.endFrame.imageUrl;
        if (url) {
            openLightbox(lightboxImages.indexOf(url));
        }
    };

    const handleDownloadImage = (index: number, frameType: 'start' | 'end') => {
        const scene = scenes[index];
        const url = frameType === 'start' ? scene.startFrame.imageUrl : scene.endFrame.imageUrl;
        if (url) {
            downloadImage(url, `scene-${scene.scene}-${frameType}-frame`);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'text' | 'audio') => {
        const file = e.target.files?.[0];
        if (file) {
            if (type === 'text') {
                const reader = new FileReader();
                reader.onload = (re) => setScriptText(re.target?.result as string);
                reader.readAsText(file);
            } else {
                setAudioFile(file);
            }
        }
    };
    
    const handleRefDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDraggingRef(true); };
    const handleRefDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDraggingRef(false); };
    const handleRefDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setIsDraggingRef(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            // FIX: Explicitly cast files for filter and map operations.
            const files = Array.from(e.dataTransfer.files as any).filter((f: any) => f.type.startsWith('image/')) as File[];
            if (files.length > 0) {
                 const readFile = (file: File): Promise<string> => new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });
                Promise.all(files.map(readFile)).then(urls => setReferenceImages(prev => [...prev, ...urls].slice(0, 4)));
            }
        }
    };

    const handleGallerySelect = (url: string) => {
        if (pickingCustomImageFor) {
            const { index, frameType } = pickingCustomImageFor;
            const updatedScenes = [...scenes];
            if (frameType === 'start') {
                updatedScenes[index].startFrame = { ...updatedScenes[index].startFrame, imageSource: url, imageUrl: url, status: 'done' };
            } else {
                updatedScenes[index].endFrame = { ...updatedScenes[index].endFrame, imageSource: url, imageUrl: url, status: 'done' };
            }
            updateScenesAndHistory(updatedScenes);
            setPickingCustomImageFor(null);
        } else {
            setReferenceImages(prev => [...prev, url].slice(0, 4));
        }
        setIsGalleryPickerOpen(false);
    };

    const handleSummaryChange = (field: keyof ScriptSummary, value: string) => {
        if (scriptSummary) {
            setScriptSummary({ ...scriptSummary, [field]: value });
        }
    };

    const handleAddScene = () => {
        const newSceneNum = scenes.length > 0 ? Math.max(...scenes.map(s => s.scene)) + 1 : 1;
        const newScene: SceneState = {
            scene: newSceneNum,
            animationDescription: '',
            startFrame: { description: '', status: 'idle', imageSource: 'reference' },
            endFrame: { description: '', status: 'idle', imageSource: 'reference' }
        };
        updateScenesAndHistory([...scenes, newScene]);
    };

    const handleDeleteScene = (index: number) => {
        const updatedScenes = scenes.filter((_, i) => i !== index).map((s, i) => ({ ...s, scene: i + 1 }));
        updateScenesAndHistory(updatedScenes);
    };

    const handleMoveScene = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= scenes.length) return;
        const updatedScenes = [...scenes];
        [updatedScenes[index], updatedScenes[newIndex]] = [updatedScenes[newIndex], updatedScenes[index]];
        // Re-number scenes to match index
        const renumberedScenes = updatedScenes.map((s, i) => ({ ...s, scene: i + 1 }));
        updateScenesAndHistory(renumberedScenes);
    };

    const handleExport = () => {
        if (scenes.length === 0) {
            toast.error(t('storyboarding_export_disabled'));
            return;
        }
        const stateToExport = {
            version: '2.0',
            activeInput, idea, scriptText,
            referenceImages, scriptSummary, scenes,
            style, numberOfScenes, aspectRatio, notes, storyboardLanguage, scriptType, keepClothing, keepBackground
        };
        downloadJson(stateToExport, `PDT-AI-storyboard-${Date.now()}.json`);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (re) => {
                try {
                    const data = JSON.parse(re.target?.result as string);
                    if (data.scenes) {
                        setActiveInput(data.activeInput || 'prompt');
                        setIdea(data.idea || '');
                        setScriptText(data.scriptText || '');
                        setReferenceImages(data.referenceImages || []);
                        setScriptSummary(data.scriptSummary || null);
                        setScenes(data.scenes);
                        setHistory([data.scenes]);
                        setHistoryIndex(0);
                        setStyle(data.style || '');
                        setNumberOfScenes(data.numberOfScenes ?? 0);
                        setAspectRatio(data.aspectRatio || aspectRatioOptions[0]);
                        setNotes(data.notes || '');
                        setStoryboardLanguage(data.storyboardLanguage || 'vi');
                        setScriptType(data.scriptType || 'auto');
                        setKeepClothing(data.keepClothing || false);
                        setKeepBackground(data.keepBackground || false);
                        toast.success(t('storyboarding_import_success'));
                    }
                } catch (err) {
                    toast.error(t('storyboarding_import_error'));
                }
            };
            reader.readAsText(file);
        }
        e.target.value = '';
    };
    
    const handleDownloadImages = () => {
        const imagesToZip: ImageForZip[] = [];
        scenes.forEach(scene => {
            if (scene.startFrame.imageUrl) imagesToZip.push({ url: scene.startFrame.imageUrl, filename: `scene-${scene.scene}-start`, folder: `scene-${scene.scene}` });
            if (scene.endFrame.imageUrl) imagesToZip.push({ url: scene.endFrame.imageUrl, filename: `scene-${scene.scene}-end`, folder: `scene-${scene.scene}` });
            if (scene.videoUrl) imagesToZip.push({ url: scene.videoUrl, filename: `scene-${scene.scene}-video`, folder: `scene-${scene.scene}`, extension: 'mp4' });
        });

        if (imagesToZip.length === 0) {
            toast.error(t('storyboarding_error_noImagesToDownload'));
            return;
        }

        downloadAllImagesAsZip(imagesToZip, `storyboard-assets-${Date.now()}.zip`);
    };

    const handleRegenerateScenePrompt = async (index: number, frameType: 'start' | 'end', modificationPrompt: string) => {
        const frame = frameType === 'start' ? scenes[index].startFrame : scenes[index].endFrame;
        setIsLoading(true);
        setLoadingMessage('Đang tinh chỉnh prompt...');
        try {
            const refinedDescription = await refineSceneDescription(frame.description, modificationPrompt, storyboardLanguage);
            const updatedScenes = [...scenes];
            if (frameType === 'start') {
                updatedScenes[index].startFrame.description = refinedDescription;
            } else {
                updatedScenes[index].endFrame.description = refinedDescription;
            }
            updateScenesAndHistory(updatedScenes);
            toast.success("Prompt đã được tinh chỉnh.");
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error";
            toast.error(`Failed to refine prompt: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegenerateAnimation = async (index: number, modificationPrompt: string) => {
        const scene = scenes[index];
        setIsLoading(true);
        setLoadingMessage('Đang tinh chỉnh chuyển động...');
        try {
            const refinedAnimation = await refineSceneTransition(scene.animationDescription, modificationPrompt, storyboardLanguage);
            const updatedScenes = [...scenes];
            updatedScenes[index].animationDescription = refinedAnimation;
            updateScenesAndHistory(updatedScenes);
            toast.success("Mô tả chuyển động đã được tinh chỉnh.");
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error";
            toast.error(`Failed to refine animation: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageFile = (file: File, index: number, frameType: 'start' | 'end') => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const url = reader.result as string;
            // FIX: Using scenesRef to avoid closure over stale state.
            const updatedScenes = [...scenesRef.current];
            if (frameType === 'start') {
                updatedScenes[index].startFrame = { ...updatedScenes[index].startFrame, imageSource: url, imageUrl: url, status: 'done' };
            } else {
                updatedScenes[index].endFrame = { ...updatedScenes[index].endFrame, imageSource: url, imageUrl: url, status: 'done' };
            }
            updateScenesAndHistory(updatedScenes);
            addImagesToGallery([url]);
        };
        reader.readAsDataURL(file);
    };

    return ReactDOM.createPortal(
        <>
            <motion.div
                className="modal-overlay z-[60]"
                aria-modal="true"
                role="dialog"
                initial={false}
                animate={isOpen ? "open" : "closed"}
                variants={{
                    open: { opacity: 1, pointerEvents: 'auto' },
                    closed: { opacity: 0, pointerEvents: 'none' },
                }}
                transition={{ duration: 0.2 }}
                onClick={onHide}
            >
                <motion.div
                    className="modal-content !max-w-[98vw] !w-[98vw] !h-[95vh] flex flex-row !p-0 relative bg-neutral-900"
                    onClick={(e) => e.stopPropagation()}
                    initial={false}
                    animate={isOpen ? "open" : "closed"}
                    variants={{
                        open: { opacity: 1, scale: 1, y: 0 },
                        closed: { opacity: 0, scale: 0.95, y: 20 },
                    }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Sidebar: Inputs & Summary */}
                    <aside className="w-1/4 max-w-sm flex flex-col p-6 border-r border-white/10 bg-neutral-900/50">
                        <div className="flex justify-between items-center mb-6 flex-shrink-0">
                            <h3 className="base-font font-bold text-2xl text-yellow-400">Storyboard</h3>
                            <div className="flex items-center gap-1">
                                <button onClick={handleUndo} disabled={!canUndo} className="p-1.5 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed" title="Undo (Cmd+Z)">
                                    <UndoIcon className="h-5 w-5" />
                                </button>
                                <button onClick={handleRedo} disabled={!canRedo} className="p-1.5 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed" title="Redo (Cmd+Shift+Z)">
                                    <RedoIcon className="h-5 w-5" />
                                </button>
                                <button onClick={onHide} className="p-1.5 rounded-full hover:bg-white/10 transition-colors" aria-label="Close">
                                    <CloseIcon className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-grow overflow-y-auto space-y-8 pr-2 -mr-4">
                            <section>
                                <StoryboardingInput
                                    {...{ activeInput, setActiveInput, idea, setIdea, scriptText, setScriptText, audioFile, audioInputRef, textInputRef, handleFileSelect, referenceImages, isDraggingRef, handleRefDragOver, handleRefDragLeave, handleRefDrop, setReferenceImages, setIsGalleryPickerOpen, style, setStyle, styleOptions, numberOfScenes, setNumberOfScenes, aspectRatio, setAspectRatio, aspectRatioOptions, notes, setNotes, storyboardLanguage, setStoryboardLanguage, scriptType, setScriptType, keepClothing, setKeepClothing, keepBackground, setKeepBackground }}
                                />
                                <div className="mt-4 flex gap-2">
                                    <button onClick={handleGenerateScriptSummary} className="btn btn-primary flex-grow text-xs !py-2" disabled={isLoading}>{isLoading ? loadingMessage : t('storyboarding_idea_submit')}</button>
                                    <button onClick={handleNew} className="btn btn-secondary text-xs !py-2" title={t('storyboarding_new')}>{t('storyboarding_new')}</button>
                                </div>
                            </section>

                            <AnimatePresence>
                                {scriptSummary && (
                                    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-6 border-t border-white/10 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-bold text-neutral-200">Kịch bản</h4>
                                            <button onClick={handleGenerateScriptSummary} className="text-xs text-yellow-400 hover:underline">{t('storyboarding_regenerateScript')}</button>
                                        </div>
                                        <StoryboardingSummary scriptSummary={scriptSummary} onSummaryChange={handleSummaryChange} />
                                        <button onClick={handleDevelopScenes} className="btn btn-primary w-full text-xs !py-2" disabled={isLoading}>{t('storyboarding_developScenes')}</button>
                                    </motion.section>
                                )}
                            </AnimatePresence>
                        </div>
                         
                        <div className="flex-shrink-0 pt-6 border-t border-white/10 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => importInputRef.current?.click()} className="btn btn-secondary !text-[10px] !py-1.5 uppercase tracking-tight">{t('storyboarding_import')}</button>
                                <button onClick={handleExport} className="btn btn-secondary !text-[10px] !py-1.5 uppercase tracking-tight" disabled={scenes.length === 0}>{t('storyboarding_export')}</button>
                            </div>
                            <button onClick={handleDownloadImages} className="btn btn-secondary w-full text-[10px] !py-1.5 uppercase tracking-tight" disabled={scenes.length === 0}>{t('common_downloadAll')}</button>
                        </div>
                    </aside>

                    {/* Main Content: Scenes Grid */}
                    <main className="flex-1 overflow-y-auto bg-neutral-900/30 p-8 custom-scrollbar relative">
                        {scenes.length > 0 ? (
                            <StoryboardingScenes
                                scenes={scenes}
                                referenceImages={referenceImages}
                                onGenerateImage={handleGenerateImage}
                                onGenerateVideo={handleGenerateVideo}
                                onEditSceneDescription={handleEditSceneDescription}
                                onEditSceneAnimation={handleEditSceneAnimation}
                                onImageSourceChange={handleImageSourceChange}
                                onSelectCustomImage={(idx, type) => { setPickingCustomImageFor({ index: idx, frameType: type }); setIsGalleryPickerOpen(true); }}
                                onUploadCustomImage={(idx, type) => { setUploadingImageFor({ index: idx, frameType: type }); customImageUploadRef.current?.click(); }}
                                onClearImage={handleClearImage}
                                onImageFile={handleImageFile}
                                onEditImage={handleEditImage}
                                onPreviewImage={handlePreviewImage}
                                onDownloadImage={handleDownloadImage}
                                onAddScene={handleAddScene}
                                onDeleteScene={handleDeleteScene}
                                onMoveScene={handleMoveScene}
                                onGenerateVideoPrompt={handleGenerateVideoPrompt}
                                onEditSceneVideoPrompt={handleEditSceneVideoPrompt}
                                onRegenerateScenePrompt={handleRegenerateScenePrompt}
                                onRegenerateAnimation={handleRegenerateAnimation}
                                aspectRatio={aspectRatio}
                            />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-neutral-500 opacity-60">
                                <StoryboardPlaceholderIcon className="h-24 w-24 mb-4" />
                                <p className="text-xl font-medium">{t('storyboarding_scenes_placeholder')}</p>
                            </div>
                        )}
                        
                        {/* Hidden Inputs */}
                        <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImport} />
                        <input type="file" ref={customImageUploadRef} className="hidden" accept="image/*" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && uploadingImageFor) {
                                handleImageFile(file, uploadingImageFor.index, uploadingImageFor.frameType);
                                setUploadingImageFor(null);
                            }
                            e.target.value = '';
                        }} />
                    </main>
                </motion.div>
            </motion.div>

            {/* Global Modals */}
            <GalleryPicker
                isOpen={isGalleryPickerOpen}
                onClose={() => { setIsGalleryPickerOpen(false); setPickingCustomImageFor(null); }}
                onSelect={handleGallerySelect}
                images={imageGallery}
            />
            <Lightbox
                images={lightboxImages}
                selectedIndex={lightboxIndex}
                onClose={closeLightbox}
                onNavigate={navigateLightbox}
            />
        </>
    , document.body);

    // Helpers for updating deep scene state
    function handleEditSceneDescription(index: number, frameType: 'start' | 'end', newDescription: string) {
        const updatedScenes = [...scenes];
        if (frameType === 'start') {
            updatedScenes[index].startFrame.description = newDescription;
        } else {
            updatedScenes[index].endFrame.description = newDescription;
        }
        updateScenesAndHistory(updatedScenes);
    }

    function handleEditSceneAnimation(index: number, animationDescription: string) {
        const updatedScenes = [...scenes];
        updatedScenes[index].animationDescription = animationDescription;
        updateScenesAndHistory(updatedScenes);
    }

    function handleImageSourceChange(index: number, frameType: 'start' | 'end', newSource: string) {
        const updatedScenes = [...scenes];
        if (frameType === 'start') {
            updatedScenes[index].startFrame = { ...updatedScenes[index].startFrame, imageSource: newSource, imageUrl: undefined, status: 'idle' };
        } else {
            updatedScenes[index].endFrame = { ...updatedScenes[index].endFrame, imageSource: newSource, imageUrl: undefined, status: 'idle' };
        }
        updateScenesAndHistory(updatedScenes);
    }

    function handleClearImage(index: number, frameType: 'start' | 'end') {
        const updatedScenes = [...scenes];
        if (frameType === 'start') {
            updatedScenes[index].startFrame = { ...updatedScenes[index].startFrame, imageUrl: undefined, status: 'idle' };
        } else {
            updatedScenes[index].endFrame = { ...updatedScenes[index].endFrame, imageUrl: undefined, status: 'idle' };
        }
        updateScenesAndHistory(updatedScenes);
    }

    function handleEditSceneVideoPrompt(index: number, videoPrompt: string) {
        const updatedScenes = [...scenes];
        updatedScenes[index] = { ...updatedScenes[index], videoPrompt };
        updateScenesAndHistory(updatedScenes);
    }
};

const StoryboardPlaceholderIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
);
