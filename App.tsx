import React, { useState, useCallback, useMemo } from 'react';
import { AppStatus } from './types';
import { transformToIdPhoto } from './services/geminiService';
import { UploadIcon, DownloadIcon, RetryIcon, MagicWandIcon } from './components/icons';

const App: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [originalImageType, setOriginalImageType] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
    const [error, setError] = useState<string | null>(null);
    const [processingMessage, setProcessingMessage] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState('3:4'); // Default to 3x4

    const processingMessages = useMemo(() => [
        "Analyzing facial features...",
        "Isolating subject from background...",
        "Adding a professional white shirt...",
        "Adjusting posture and gaze...",
        "Applying professional blue canvas...",
        "Finalizing your new ID photo...",
        "This may take a moment, creating magic..."
    ], []);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError("Please upload a valid image file (PNG, JPG, etc.).");
                setStatus(AppStatus.ERROR);
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                resetState();
                setOriginalImage(e.target?.result as string);
                setOriginalImageType(file.type);
            };
            reader.onerror = () => {
                setError("Failed to read the image file.");
                setStatus(AppStatus.ERROR);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateClick = useCallback(async () => {
        if (!originalImage || !originalImageType) return;
        setStatus(AppStatus.PROCESSING);
        setError(null);

        // Start cycling through processing messages
        let messageIndex = 0;
        setProcessingMessage(processingMessages[messageIndex]);
        const intervalId = setInterval(() => {
            messageIndex = (messageIndex + 1) % processingMessages.length;
            setProcessingMessage(processingMessages[messageIndex]);
        }, 2500);

        try {
            const base64Data = originalImage.split(',')[1];
            const generatedData = await transformToIdPhoto(base64Data, originalImageType, aspectRatio);
            setGeneratedImage(`data:image/png;base64,${generatedData}`);
            setStatus(AppStatus.SUCCESS);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
            setStatus(AppStatus.ERROR);
        } finally {
            clearInterval(intervalId); // Stop cycling messages
        }
    }, [originalImage, originalImageType, processingMessages, aspectRatio]);
    
    const resetState = () => {
        setOriginalImage(null);
        setGeneratedImage(null);
        setStatus(AppStatus.IDLE);
        setError(null);
        setOriginalImageType(null);
    };

    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = 'id_photo.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderIdleState = () => (
        <div className="text-center">
            <label htmlFor="file-upload" className="cursor-pointer group">
                <div className="w-full max-w-md mx-auto border-2 border-dashed border-slate-300 rounded-xl p-8 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300">
                    <UploadIcon className="w-16 h-16 mx-auto text-slate-400 group-hover:text-blue-600 transition-colors" />
                    <p className="mt-4 text-xl font-semibold text-slate-700">Click to upload a photo</p>
                    <p className="mt-1 text-sm text-slate-500">PNG, JPG, or WEBP. The AI will add a shirt and adjust your posture automatically.</p>
                </div>
            </label>
            <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
        </div>
    );

    const renderProcessingState = () => (
        <div className="text-center flex flex-col items-center gap-6">
             <div className="relative w-64 h-80">
                <img src={originalImage!} alt="Processing" className="rounded-lg shadow-lg w-full h-full object-cover" />
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
            <p className="text-lg font-medium text-slate-700 animate-pulse">{processingMessage}</p>
        </div>
    );
    
    const renderSuccessState = () => (
        <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-600 mb-2">Original Photo</h3>
                <img src={originalImage!} alt="Original" className="rounded-lg shadow-md w-64 h-80 object-cover" />
            </div>
            <div className="text-center">
                <h3 className="text-lg font-semibold text-green-700 mb-2">Your ID Photo</h3>
                <img src={generatedImage!} alt="Generated ID" className="rounded-lg shadow-xl border-4 border-green-500 max-w-64 max-h-80 object-contain" />
            </div>
            <div className="flex flex-col gap-4 mt-4 md:mt-0 md:ml-4">
                <button onClick={handleDownload} className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105">
                    <DownloadIcon className="w-6 h-6" />
                    Download
                </button>
                <button onClick={resetState} className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 bg-slate-200 text-slate-800 font-bold rounded-lg hover:bg-slate-300 transition-transform transform hover:scale-105">
                    <RetryIcon className="w-6 h-6" />
                    Try Another
                </button>
            </div>
        </div>
    );

    const renderErrorState = () => (
        <div className="text-center bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-lg font-semibold text-red-800">Oops! Something went wrong.</p>
            <p className="mt-2 text-red-600">{error}</p>
            <button onClick={resetState} className="mt-6 flex items-center justify-center gap-2 mx-auto px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition">
                <RetryIcon className="w-5 h-5" />
                Try Again
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
            <header className="text-center mb-8">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 tracking-tight">AI ID Photo Generator</h1>
                <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">Creates a professional ID photo with a white shirt, straight posture, and blue background.</p>
            </header>

            <main className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-8 transition-all duration-500 ease-in-out">
                {status === AppStatus.IDLE && !originalImage && renderIdleState()}
                {originalImage && status !== AppStatus.PROCESSING && status !== AppStatus.SUCCESS && (
                    <div className="text-center flex flex-col items-center gap-6">
                        <img src={originalImage} alt="Uploaded preview" className="rounded-lg shadow-lg w-64 h-80 object-cover" />
                        
                        <div className="w-full max-w-xs mx-auto pt-2">
                            <p className="text-sm font-medium text-slate-600 mb-2">Select photo size:</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setAspectRatio('3:4')}
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                                        aspectRatio === '3:4' 
                                        ? 'bg-blue-600 text-white shadow' 
                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                    }`}
                                >
                                    3x4 cm
                                </button>
                                <button 
                                    onClick={() => setAspectRatio('4:6')}
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                                        aspectRatio === '4:6' 
                                        ? 'bg-blue-600 text-white shadow' 
                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                    }`}
                                >
                                    4x6 cm
                                </button>
                            </div>
                        </div>

                        <button onClick={handleGenerateClick} className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                            <MagicWandIcon className="w-7 h-7" />
                            Generate ID Photo
                        </button>
                    </div>
                )}
                {status === AppStatus.PROCESSING && renderProcessingState()}
                {status === AppStatus.SUCCESS && renderSuccessState()}
                {status === AppStatus.ERROR && renderErrorState()}
            </main>
            
            <footer className="text-center mt-12 text-slate-500 text-sm">
                <p>Powered by Gemini AI</p>
                <p>&copy; {new Date().getFullYear()} ID Photo Generator. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default App;