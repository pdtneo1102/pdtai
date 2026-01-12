
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// This file contains shared type definitions for UI components and application state.

// Base types
export interface ImageForZip {
    url: string;
    filename: string;
    folder?: string;
    extension?: string;
}

export interface VideoTask {
    status: 'pending' | 'done' | 'error';
    resultUrl?: string;
    error?: string;
    operation?: any;
}

export interface AppConfig {
    id: string;
    titleKey: string;
    descriptionKey: string;
    icon: string;
    supportsCanvasPreset?: boolean;
    previewImageUrl?: string;
}

export interface AppSettings {
    mainTitleKey: string;
    subtitleKey: string;
    useSmartTitleWrapping: boolean;
    smartTitleWrapWords: number;
    [key: string]: any;
}
  
export interface Settings {
    home: {
        mainTitleKey: string;
        subtitleKey: string;
        useSmartTitleWrapping: boolean;
        smartTitleWrapWords: number;
    };
    apps: AppConfig[];
    enableImageMetadata: boolean;
    enableWebcam: boolean;
    architectureIdeator: AppSettings;
    avatarCreator: AppSettings & { minIdeas: number; maxIdeas: number; };
    babyPhotoCreator: AppSettings & { minIdeas: number; maxIdeas: number; };
    beautyCreator: AppSettings;
    midAutumnCreator: AppSettings & { minIdeas: number; maxIdeas: number; };
    entrepreneurCreator: AppSettings & { minIdeas: number; maxIdeas: number; };
    dressTheModel: AppSettings;
    photoRestoration: AppSettings;
    swapStyle: AppSettings;
    freeGeneration: AppSettings;
    superSharp: AppSettings;
    imageInterpolation: AppSettings;
    sunEffectCreator: AppSettings;
}

export type Theme = 'rainbow';
export const THEMES: Theme[] = ['rainbow'];

export interface ThemeInfo {
    id: Theme;
    name: string;
    colors: [string, string]; // [startColor, endColor] for gradient
}

export const THEME_DETAILS: ThemeInfo[] = [
    { id: 'rainbow', name: 'RainBow', colors: ['#0575E6', '#00F260'] }
];


export interface ImageToEdit {
    url: string | null;
    onSave: (newUrl: string) => void;
}


// --- Centralized State Definitions ---

export type HomeState = { stage: 'home' };

export interface ArchitectureIdeatorState {
    stage: 'idle' | 'configuring' | 'generating' | 'results';
    uploadedImage: string | null;
    styleReferenceImage: string | null;
    generatedImage: string | null;
    historicalImages: string[];
    options: {
        context: string;
        style: string;
        color: string;
        lighting: string;
        notes: string;
        removeWatermark: boolean;
    };
    error: string | null;
}

export type ImageStatus = 'pending' | 'done' | 'error';
export interface GeneratedAvatarImage {
    status: ImageStatus;
    url?: string;
    error?: string;
}
interface HistoricalAvatarImage {
    idea: string;
    url: string;
}
export interface AvatarCreatorState {
    stage: 'idle' | 'configuring' | 'generating' | 'results';
    uploadedImage: string | null;
    styleReferenceImage: string | null;
    generatedImages: Record<string, GeneratedAvatarImage>;
    historicalImages: HistoricalAvatarImage[];
    selectedIdeas: string[];
    options: {
        additionalPrompt: string;
        removeWatermark: boolean;
        aspectRatio: string;
    };
    error: string | null;
}

export interface BabyPhotoCreatorState extends AvatarCreatorState {}

export interface BeautyCreatorState {
    stage: 'idle' | 'configuring' | 'generating' | 'results';
    uploadedImage: string | null;
    styleReferenceImage: string | null;
    generatedImages: Record<string, GeneratedAvatarImage>;
    historicalImages: HistoricalAvatarImage[];
    selectedIdeas: string[];
    options: {
        notes: string;
        removeWatermark: boolean;
        aspectRatio: string;
    };
    error: string | null;
}

export interface MidAutumnCreatorState extends AvatarCreatorState {}
export interface EntrepreneurCreatorState extends AvatarCreatorState {}


export interface DressTheModelState {
    stage: 'idle' | 'configuring' | 'generating' | 'results';
    modelImage: string | null;
    clothingImage: string | null;
    generatedImage: string | null;
    historicalImages: string[];
    options: {
        background: string;
        pose: string;
        style: string;
        aspectRatio: string;
        notes: string;
        removeWatermark: boolean;
    };
    error: string | null;
}

export interface PhotoRestorationState {
    stage: 'idle' | 'configuring' | 'generating' | 'results';
    uploadedImage: string | null;
    generatedImage: string | null;
    historicalImages: string[];
    options: {
        type: string;
        gender: string;
        age: string;
        nationality: string;
        notes: string;
        removeWatermark: boolean;
        removeStains: boolean;
        colorizeRgb: boolean;
    };
    error: string | null;
}

export interface SwapStyleState {
    stage: 'idle' | 'configuring' | 'generating' | 'results';
    contentImage: string | null;
    styleImage: string | null;
    generatedImage: string | null;
    historicalImages: string[];
    options: {
        style: string;
        styleStrength: string;
        notes: string;
        removeWatermark: boolean;
        convertToReal: boolean;
    };
    error: string | null;
}

export interface MixStyleState {
    stage: 'idle' | 'configuring' | 'generating' | 'results';
    contentImage: string | null;
    styleImage: string | null;
    generatedImage: string | null;
    historicalImages: string[];
    finalPrompt: string | null;
    options: {
        styleStrength: string;
        notes: string;
        removeWatermark: boolean;
    };
    error: string | null;
}

export interface FreeGenerationState {
    stage: 'configuring' | 'generating' | 'results';
    image1: string | null;
    image2: string | null;
    image3: string | null;
    image4: string | null;
    generatedImages: string[];
    historicalImages: string[];
    options: {
        prompt: string;
        removeWatermark: boolean;
        numberOfImages: number;
        aspectRatio: string;
    };
    error: string | null;
}

export interface ImageToRealState {
    stage: 'idle' | 'configuring' | 'generating' | 'results';
    uploadedImage: string | null;
    generatedImage: string | null;
    historicalImages: string[];
    options: {
        faithfulness: string;
        notes: string;
        removeWatermark: boolean;
    };
    error: string | null;
}

export interface SuperSharpState {
    stage: 'idle' | 'configuring' | 'generating' | 'results';
    uploadedImages: string[];
    currentProcessingIndex: number;
    generatedResults: Record<string, { status: 'pending' | 'done' | 'error'; url?: string; error?: string }>;
    historicalImages: string[];
    options: {
        upscaleLevel: string;
        denoiseStrength: string;
        notes: string;
        removeWatermark: boolean;
    };
    error: string | null;
}

export interface SunEffectCreatorState {
    stage: 'idle' | 'configuring' | 'generating' | 'results';
    uploadedImage: string | null;
    generatedImage: string | null;
    historicalImages: string[];
    options: {
        effectType: string;
        intensity: string;
        position: string;
        notes: string;
        removeWatermark: boolean;
    };
    error: string | null;
}

export interface ImageInterpolationState {
    stage: 'idle' | 'prompting' | 'configuring' | 'generating' | 'results';
    analysisMode: 'general' | 'deep' | 'expert';
    inputImage: string | null;
    outputImage: string | null;
    referenceImage: string | null;
    generatedPrompt: string;
    promptSuggestions: string;
    additionalNotes: string;
    finalPrompt: string | null;
    generatedImage: string | null;
    historicalImages: { url: string; prompt: string; }[];
    options: {
        removeWatermark: boolean;
        aspectRatio: string;
    };
    error: string | null;
}

// FIX: Added missing ToyModelCreatorState definition
export interface ToyModelCreatorState {
    stage: 'idle' | 'configuring' | 'generating' | 'results';
    concept: string;
    uploadedImage: string | null;
    generatedImage: string | null;
    historicalImages: string[];
    options: {
        computerType: string;
        softwareType: string;
        boxType: string;
        background: string;
        keychainMaterial: string;
        keychainStyle: string;
        accompanyingItems: string;
        deskSurface: string;
        capsuleColor: string;
        modelFinish: string;
        capsuleContents: string;
        displayLocation: string;
        miniatureMaterial: string;
        baseMaterial: string;
        baseShape: string;
        lightingStyle: string;
        pokeballType: string;
        evolutionDisplay: string;
        modelStyle: string;
        modelType: string;
        blueprintType: string;
        characterMood: string;
        aspectRatio: string;
        notes: string;
        removeWatermark: boolean;
    };
    error: string | null;
}

// FIX: Added missing SceneState definition for Storyboarding
export interface SceneState {
    scene: number;
    startFrame: {
        description: string;
        status: 'idle' | 'pending' | 'done' | 'error';
        imageUrl?: string;
        imageSource: string;
        error?: string;
    };
    animationDescription: string;
    endFrame: {
        description: string;
        status: 'idle' | 'pending' | 'done' | 'error';
        imageUrl?: string;
        imageSource: string;
        error?: string;
    };
    videoPrompt?: string;
    videoStatus?: 'idle' | 'pending' | 'done' | 'error';
    videoUrl?: string;
    videoError?: string;
    videoOperation?: any;
}

// Union type for all possible app states
export type AnyAppState =
  | HomeState
  | ArchitectureIdeatorState
  | AvatarCreatorState
  | BabyPhotoCreatorState
  | BeautyCreatorState
  | MidAutumnCreatorState
  | EntrepreneurCreatorState
  | DressTheModelState
  | PhotoRestorationState
  | SwapStyleState
  | MixStyleState
  | FreeGenerationState
  | ImageToRealState
  | SuperSharpState
  | SunEffectCreatorState
  | ImageInterpolationState
  | ToyModelCreatorState;

// --- App Navigation & State Types ---
export type HomeView = { viewId: 'home'; state: HomeState };
export type ArchitectureIdeatorView = { viewId: 'architecture-ideator'; state: ArchitectureIdeatorState };
export type AvatarCreatorView = { viewId: 'avatar-creator'; state: AvatarCreatorState };
export type BabyPhotoCreatorView = { viewId: 'baby-photo-creator'; state: BabyPhotoCreatorState };
export type BeautyCreatorView = { viewId: 'beauty-creator'; state: BeautyCreatorState };
export type MidAutumnCreatorView = { viewId: 'mid-autumn-creator'; state: MidAutumnCreatorState };
export type EntrepreneurCreatorView = { viewId: 'entrepreneur-creator'; state: EntrepreneurCreatorState };
export type DressTheModelView = { viewId: 'dress-the-model'; state: DressTheModelState };
export type PhotoRestorationView = { viewId: 'photo-restoration'; state: PhotoRestorationState };
export type SwapStyleView = { viewId: 'swap-style'; state: SwapStyleState };
export type FreeGenerationView = { viewId: 'free-generation'; state: FreeGenerationState };
export type SuperSharpView = { viewId: 'super-sharp'; state: SuperSharpState };
export type SunEffectCreatorView = { viewId: 'sun-effect-creator'; state: SunEffectCreatorState };
export type ImageInterpolationView = { viewId: 'image-interpolation'; state: ImageInterpolationState };
export type ImageToRealView = { viewId: 'image-to-real'; state: ImageToRealState };
export type ToyModelCreatorView = { viewId: 'toy-model-creator'; state: ToyModelCreatorState };


export type ViewState =
  | HomeView
  | ArchitectureIdeatorView
  | AvatarCreatorView
  | BabyPhotoCreatorView
  | BeautyCreatorView
  | MidAutumnCreatorView
  | EntrepreneurCreatorView
  | DressTheModelView
  | PhotoRestorationView
  | SwapStyleView
  | FreeGenerationView
  | SuperSharpView
  | SunEffectCreatorView
  | ImageInterpolationView
  | ImageToRealView
  | ToyModelCreatorView;

// Helper function to get initial state for an app
export const getInitialStateForApp = (viewId: string): AnyAppState => {
    switch (viewId) {
        case 'home':
            return { stage: 'home' };
        case 'architecture-ideator':
            return { stage: 'idle', uploadedImage: null, styleReferenceImage: null, generatedImage: null, historicalImages: [], options: { context: '', style: '', color: '', lighting: '', notes: '', removeWatermark: false }, error: null };
        case 'avatar-creator':
            return { stage: 'idle', uploadedImage: null, styleReferenceImage: null, generatedImages: {}, historicalImages: [], selectedIdeas: [], options: { additionalPrompt: '', removeWatermark: false, aspectRatio: 'Giữ nguyên' }, error: null };
        case 'baby-photo-creator':
            return { stage: 'idle', uploadedImage: null, styleReferenceImage: null, generatedImages: {}, historicalImages: [], selectedIdeas: [], options: { additionalPrompt: '', removeWatermark: false, aspectRatio: 'Giữ nguyên' }, error: null };
        case 'beauty-creator':
            return { stage: 'idle', uploadedImage: null, styleReferenceImage: null, generatedImages: {}, historicalImages: [], selectedIdeas: [], options: { notes: '', removeWatermark: false, aspectRatio: 'Giữ nguyên' }, error: null };
        case 'mid-autumn-creator':
            return { stage: 'idle', uploadedImage: null, styleReferenceImage: null, generatedImages: {}, historicalImages: [], selectedIdeas: [], options: { additionalPrompt: '', removeWatermark: false, aspectRatio: 'Giữ nguyên' }, error: null };
        case 'entrepreneur-creator':
            return { stage: 'idle', uploadedImage: null, styleReferenceImage: null, generatedImages: {}, historicalImages: [], selectedIdeas: [], options: { additionalPrompt: '', removeWatermark: false, aspectRatio: 'Giữ nguyên' }, error: null };
        case 'dress-the-model':
            return { stage: 'idle', modelImage: null, clothingImage: null, generatedImage: null, historicalImages: [], options: { background: '', pose: '', style: '', aspectRatio: 'Giữ nguyên', notes: '', removeWatermark: false }, error: null };
        case 'photo-restoration':
            return { stage: 'idle', uploadedImage: null, generatedImage: null, historicalImages: [], options: { type: 'Chân dung', gender: 'Tự động', age: '', nationality: '', notes: '', removeWatermark: false, removeStains: true, colorizeRgb: true }, error: null };
        case 'swap-style':
            return { stage: 'idle', contentImage: null, styleImage: null, generatedImage: null, historicalImages: [], options: { style: '', styleStrength: 'Rất mạnh', notes: '', removeWatermark: false, convertToReal: false }, error: null };
        case 'free-generation':
            return { stage: 'configuring', image1: null, image2: null, image3: null, image4: null, generatedImages: [], historicalImages: [], options: { prompt: '', removeWatermark: false, numberOfImages: 1, aspectRatio: 'Giữ nguyên' }, error: null };
        case 'image-to-real':
            return { stage: 'idle', uploadedImage: null, generatedImage: null, historicalImages: [], options: { faithfulness: 'Tự động', notes: '', removeWatermark: false }, error: null };
        case 'super-sharp':
            return { stage: 'idle', uploadedImages: [], currentProcessingIndex: -1, generatedResults: {}, historicalImages: [], options: { upscaleLevel: 'Tự động', denoiseStrength: 'Tự động', notes: '', removeWatermark: false }, error: null };
        case 'sun-effect-creator':
            return { stage: 'idle', uploadedImage: null, generatedImage: null, historicalImages: [], options: { effectType: 'Nắng hoàng hôn (Golden Hour)', intensity: 'Vừa phải', position: 'Tự động', notes: '', removeWatermark: false }, error: null };
        case 'image-interpolation':
             return { stage: 'idle', analysisMode: 'general', inputImage: null, outputImage: null, referenceImage: null, generatedPrompt: '', promptSuggestions: '', additionalNotes: '', finalPrompt: null, generatedImage: null, historicalImages: [], options: { removeWatermark: false, aspectRatio: 'Giữ nguyên' }, error: null };
        case 'toy-model-creator':
            return {
                stage: 'idle',
                concept: 'desktop_model',
                uploadedImage: null,
                generatedImage: null,
                historicalImages: [],
                options: {
                    computerType: '', softwareType: '', boxType: '', background: '',
                    keychainMaterial: '', keychainStyle: '', accompanyingItems: '', deskSurface: '',
                    capsuleColor: '', modelFinish: '', capsuleContents: '', displayLocation: '',
                    miniatureMaterial: '', baseMaterial: '', baseShape: '', lightingStyle: '',
                    pokeballType: '', evolutionDisplay: '', modelStyle: '',
                    modelType: '', blueprintType: '', characterMood: '',
                    aspectRatio: '3:2', notes: '', removeWatermark: false
                },
                error: null
            };
        default:
            return { stage: 'home' };
    }
};

// --- History Entry Type ---
export interface GenerationHistoryEntry {
    id: string;
    timestamp: number;
    appId: string;
    appName: string;
    thumbnailUrl: string;
    settings: {
        viewId: string;
        state: AnyAppState;
    };
}

export type ModelVersion = 'v2' | 'v3';
export type ImageResolution = '1K' | '2K' | '4K';

// --- Context Types ---

export interface AppControlContextType {
    currentView: ViewState;
    settings: any;
    theme: Theme;
    imageGallery: string[];
    historyIndex: number;
    viewHistory: ViewState[];
    isSearchOpen: boolean;
    isGalleryOpen: boolean;
    isInfoOpen: boolean;
    isHistoryPanelOpen: boolean;
    isExtraToolsOpen: boolean;
    isImageLayoutModalOpen: boolean;
    isBeforeAfterModalOpen: boolean;
    isAppCoverCreatorModalOpen: boolean;
    isStoryboardingModalMounted: boolean;
    isStoryboardingModalVisible: boolean;
    isLayerComposerMounted: boolean;
    isLayerComposerVisible: boolean;
    // License State
    isLicenseValid: boolean;
    isLicenseModalOpen: boolean;
    setLicenseModalOpen: (isOpen: boolean) => void;
    checkLicenseAccess: () => boolean;
    validateLicense: () => void; // Manual re-check

    language: 'vi' | 'en';
    generationHistory: GenerationHistoryEntry[];
    modelVersion: ModelVersion;
    imageResolution: ImageResolution;
    addGenerationToHistory: (entryData: Omit<GenerationHistoryEntry, 'id' | 'timestamp'>) => void;
    addImagesToGallery: (newImages: string[]) => void;
    removeImageFromGallery: (imageIndex: number) => void;
    replaceImageInGallery: (imageIndex: number, newImageUrl: string) => void;
    handleThemeChange: (newTheme: Theme) => void;
    handleLanguageChange: (lang: 'vi' | 'en') => void;
    handleModelVersionChange: (version: ModelVersion) => void;
    handleResolutionChange: (resolution: ImageResolution) => void;
    navigateTo: (viewId: string) => void;
    handleStateChange: (newAppState: AnyAppState) => void;
    handleSelectApp: (appId: string) => void;
    handleGoHome: () => void;
    handleGoBack: () => void;
    handleGoForward: () => void;
    handleResetApp: () => void;
    handleOpenSearch: () => void;
    handleCloseSearch: () => void;
    handleOpenGallery: () => void;
    handleCloseGallery: () => void;
    handleOpenInfo: () => void;
    handleCloseInfo: () => void;
    handleOpenHistoryPanel: () => void;
    handleCloseHistoryPanel: () => void;
    toggleExtraTools: () => void;
    openImageLayoutModal: () => void;
    closeImageLayoutModal: () => void;
    openBeforeAfterModal: () => void;
    closeBeforeAfterModal: () => void;
    openAppCoverCreatorModal: () => void;
    closeAppCoverCreatorModal: () => void;
    openStoryboardingModal: () => void;
    closeStoryboardingModal: () => void;
    hideStoryboardingModal: () => void;
    toggleStoryboardingModal: () => void;
    openLayerComposer: () => void;
    closeLayerComposer: () => void;
    hideLayerComposer: () => void;
    toggleLayerComposer: () => void;
    importSettingsAndNavigate: (settings: any) => void;
    t: (key: string, ...args: any[]) => any;
}
