import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { SparklesIcon, PhotoIcon, ArrowPathIcon, MicrophoneIcon, StopIcon, DocumentTextIcon, ClipboardDocumentIcon, CheckCircleIcon, XCircleIcon } from '../components/Icons';
import { Modal } from '../components/Modal';
import { SavedAnnonce } from '../types';
import { AudioTranscriber } from '../components/AudioTranscriber';

// Utility to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]); // remove data:mime/type;base64, part
        reader.onerror = error => reject(error);
    });
};
const getMimeType = (file: File): string => {
    return file.type;
};

type EditorMode = 'edit' | 'generate';

interface ImageObject {
  id: string;
  file: File | null;
  url: string;
}

const TabButton: React.FC<{ label: string, onClick: () => void, isActive: boolean }> = ({ label, onClick, isActive }) => (
    <button
        onClick={onClick}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            isActive ? 'bg-brand text-white shadow' : 'text-secondary hover:bg-gray-800'
        }`}
    >
        {label}
    </button>
);

interface ImageEditorPageProps {
    onSaveAnnonce: (annonce: Omit<SavedAnnonce, 'id'>) => void;
    annonceToEdit: SavedAnnonce | null;
    onUpdateAnnonce: (annonce: SavedAnnonce) => void;
    setActivePage: (page: 'mes-annonces') => void;
}

export const ImageEditorPage: React.FC<ImageEditorPageProps> = ({ onSaveAnnonce, annonceToEdit, onUpdateAnnonce, setActivePage }) => {
    const [mode, setMode] = useState<EditorMode>('edit');
    const [imageList, setImageList] = useState<ImageObject[]>([]);
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
    const [imageToView, setImageToView] = useState<string | null>(null);
    
    // Final gallery state
    const [finalGallery, setFinalGallery] = useState<string[]>([]);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    // State for description editor
    const [descriptionInput, setDescriptionInput] = useState('');
    const [improvedDescription, setImprovedDescription] = useState<string | null>(null);
    const [isImproving, setIsImproving] = useState(false);
    const [descriptionError, setDescriptionError] = useState<string | null>(null);
    const [transcriptionStatus, setTranscriptionStatus] = useState<{status: 'idle' | 'recording' | 'error', message?: string}>({status: 'idle'});
    const [copySuccess, setCopySuccess] = useState(false);

    const resetAllStates = useCallback(() => {
        setMode('edit');
        setImageList([]);
        setSelectedImageId(null);
        setGeneratedImages({});
        setPrompt('');
        setError(null);
        setDescriptionInput('');
        setImprovedDescription(null);
        setDescriptionError(null);
        setFinalGallery([]);
    }, []);

    useEffect(() => {
        if (annonceToEdit) {
            const initialImages: ImageObject[] = annonceToEdit.imageUrls.map((url, i) => ({
              id: `${annonceToEdit.id}-${i}`,
              file: null, // Cannot reconstruct file object from URL
              url: url,
            }));
            setImageList(initialImages);
            setSelectedImageId(initialImages[0]?.id || null);
            setFinalGallery(annonceToEdit.imageUrls);
            setGeneratedImages({});
            setDescriptionInput(annonceToEdit.description);
            setImprovedDescription(annonceToEdit.description);
            setPrompt('');
            setMode('edit');
        } else {
            resetAllStates();
        }
    }, [annonceToEdit, resetAllStates]);


    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            // FIX: Explicitly type `file` as `File` to resolve type inference issue.
            const newImages: ImageObject[] = Array.from(files).map((file: File, index) => ({
                id: `${Date.now()}-${index}`,
                file: file,
                url: URL.createObjectURL(file),
            }));
            
            setImageList(prev => [...prev, ...newImages]);
            
            if (!selectedImageId) {
                setSelectedImageId(newImages[0].id);
            }
        }
    };

    const handleDeleteImage = (idToDelete: string) => {
        setImageList(prev => prev.filter(img => img.id !== idToDelete));
        setGeneratedImages(prev => {
            const newGenerated = {...prev};
            delete newGenerated[idToDelete];
            return newGenerated;
        });
        if (selectedImageId === idToDelete) {
            setSelectedImageId(imageList.length > 1 ? imageList.find(img => img.id !== idToDelete)!.id : null);
        }
    };

    const handleModeChange = (newMode: EditorMode) => {
        setMode(newMode);
        resetAllStates(); // Reset completely when changing mode
    };
    
    const handleGenerateImage = async () => {
        const selectedImage = imageList.find(img => img.id === selectedImageId);

        if (mode === 'edit' && (!selectedImage || !prompt.trim())) {
            setError('Veuillez sélectionner une image et saisir une consigne.');
            return;
        }
        if (mode === 'generate' && !prompt.trim()) {
            setError('Veuillez saisir une consigne pour générer une image.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            const parts = [];
            if(mode === 'edit' && selectedImage) {
                if (selectedImage.file) {
                    const base64Data = await fileToBase64(selectedImage.file);
                    const mimeType = getMimeType(selectedImage.file);
                    parts.push({ inlineData: { data: base64Data, mimeType } });
                } else {
                    setError("Pour retoucher une image existante, veuillez la re-télécharger.");
                    setIsLoading(false);
                    return;
                }
            }
            parts.push({ text: prompt });

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            let imageFound = false;
            const responseParts = response.candidates?.[0]?.content?.parts;

            if (responseParts) {
                for (const part of responseParts) {
                    if (part.inlineData) {
                        const base64ImageBytes: string = part.inlineData.data;
                        const imageMimeType = part.inlineData.mimeType;
                        const newImageUrl = `data:${imageMimeType};base64,${base64ImageBytes}`;
                        
                        if (mode === 'generate') {
                            const newImage: ImageObject = { id: `gen-${Date.now()}`, file: null, url: newImageUrl };
                            setImageList(prev => [...prev, newImage]);
                            setSelectedImageId(newImage.id);
                        } else if (selectedImageId) {
                             setGeneratedImages(prev => ({ ...prev, [selectedImageId]: newImageUrl }));
                        }
                        imageFound = true;
                        break;
                    }
                }
            }
            
            if (!imageFound) {
                 setError("L'IA n'a pas retourné d'image. Cela peut être dû à une consigne non respectée ou à un filtre de sécurité. Essayez une autre consigne.");
            }
        } catch (err: any) {
            console.error(err);
            setError("Une erreur est survenue lors de la génération de l'image. " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImproveDescription = async () => {
        if (!descriptionInput.trim()) {
            setDescriptionError("Veuillez saisir ou dicter un texte à améliorer.");
            return;
        }
    
        setIsImproving(true);
        setDescriptionError(null);
        setImprovedDescription(null);
    
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const model = 'gemini-2.5-flash';
            const fullPrompt = `Agis comme un expert en rédaction immobilière. Reformule, améliore et mets en forme le texte suivant pour créer une annonce immobilière attractive, professionnelle et vendeuse. Corrige les fautes d'orthographe et de grammaire. Structure le texte avec des titres (en gras) et des listes à puces si pertinent. Le ton doit être engageant et persuasif. Ta réponse doit contenir UNIQUEMENT le texte final de l'annonce, sans aucune introduction, explication, ou note de ta part. Voici le texte à améliorer:\n\n"${descriptionInput}"`;
    
            const response = await ai.models.generateContent({
                model: model,
                contents: fullPrompt,
            });
    
            setImprovedDescription(response.text);
    
        } catch (err: any) {
            console.error(err);
            setDescriptionError("Une erreur est survenue lors de l'amélioration du texte. " + err.message);
        } finally {
            setIsImproving(false);
        }
    };

    const handleCopy = () => {
        if (improvedDescription) {
            navigator.clipboard.writeText(improvedDescription);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };
    
    const handleReset = () => {
        if (annonceToEdit) {
            setActivePage('mes-annonces');
        } else {
            resetAllStates();
        }
    };

    const handleViewImage = (imageUrl: string) => {
        setImageToView(imageUrl);
        setIsImageViewerOpen(true);
    };

    const handleSave = () => {
        if (improvedDescription && finalGallery.length > 0) {
            if (annonceToEdit) {
                 onUpdateAnnonce({
                    id: annonceToEdit.id,
                    imageUrls: finalGallery,
                    description: improvedDescription,
                });
            } else {
                onSaveAnnonce({
                    imageUrls: finalGallery,
                    description: improvedDescription,
                });
            }
        } else {
            alert("Erreur: Pour sauvegarder, vous devez avoir au moins une image dans votre galerie et une description.");
        }
    };

    // --- Drag and Drop Handlers ---
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, imageUrl: string) => {
        e.dataTransfer.setData('imageUrl', imageUrl);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingOver(false);
        const imageUrl = e.dataTransfer.getData('imageUrl');
        if (imageUrl && !finalGallery.includes(imageUrl)) {
            setFinalGallery(prev => [...prev, imageUrl]);
        }
    };
    
    const handleRemoveFromGallery = (indexToRemove: number) => {
        setFinalGallery(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const isGenerateImageDisabled = isLoading || !prompt.trim() || (mode === 'edit' && !selectedImageId);
    const isSaveDisabled = !(finalGallery.length > 0 && improvedDescription);
    const selectedImage = imageList.find(img => img.id === selectedImageId);
    const selectedGeneratedImage = selectedImageId ? generatedImages[selectedImageId] : null;

    return (
        <div className="space-y-6">
            <div className="bg-surface p-6 rounded-lg shadow-lg flex justify-between items-start">
                <div>
                    <div className="flex items-center space-x-3 mb-4">
                        <SparklesIcon className="w-8 h-8 text-brand"/>
                        <h2 className="text-2xl font-bold text-primary">{annonceToEdit ? "Modifier l'Annonce" : "Assistant Créatif IA"}</h2>
                    </div>
                    <p className="text-sm text-secondary">
                        {annonceToEdit ? "Modifiez les images ou la description de votre annonce ci-dessous." : "Utilisez l'IA pour générer et retoucher des images, puis rédigez des descriptions d'annonces percutantes."}
                    </p>
                </div>
                 <button 
                    onClick={handleSave}
                    disabled={isSaveDisabled}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
                 >
                    {annonceToEdit ? "Mettre à jour l'annonce" : "Sauvegarder l'annonce"}
                 </button>
            </div>
            
            <div className="bg-surface p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-primary mb-4 border-b border-gray-700 pb-2">Étape 1 : Atelier d'Images</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Image Generation UI */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2 rounded-lg bg-gray-900 p-1 self-start">
                            <TabButton label="Retoucher" onClick={() => handleModeChange('edit')} isActive={mode === 'edit'} />
                            <TabButton label="Générer" onClick={() => handleModeChange('generate')} isActive={mode === 'generate'} />
                        </div>

                        {mode === 'edit' && (
                            <div className="animate-fade-in">
                                <label className="block text-sm font-medium text-secondary mb-1">Ajoutez des images de base</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                                    <div className="space-y-1 text-center">
                                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-500" />
                                        <div className="flex text-sm text-gray-400">
                                            <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-brand hover:text-brand-light focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-brand px-1">
                                                <span>Téléchargez un ou plusieurs fichiers</span>
                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageUpload} accept="image/*" multiple />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {imageList.length > 0 && mode === 'edit' && (
                            <div className="animate-fade-in">
                                <h4 className="text-sm font-medium text-secondary mb-2">Galerie de travail</h4>
                                <div className="flex space-x-3 overflow-x-auto pb-2">
                                    {imageList.map(image => (
                                        <div key={image.id} className="flex-shrink-0 relative">
                                            <button
                                                onClick={() => setSelectedImageId(image.id)}
                                                className={`w-24 h-24 rounded-lg overflow-hidden border-2 transition-colors ${selectedImageId === image.id ? 'border-brand' : 'border-transparent'}`}
                                            >
                                                <img src={image.url} alt="Thumbnail" className="w-full h-full object-cover" />
                                                {generatedImages[image.id] && (
                                                    <div className="absolute bottom-1 right-1 bg-brand p-1 rounded-full"><SparklesIcon className="w-3 h-3 text-white" /></div>
                                                )}
                                            </button>
                                            <button onClick={() => handleDeleteImage(image.id)} className="absolute -top-2 -right-2 bg-gray-700 rounded-full text-white hover:bg-red-600"><XCircleIcon className="w-6 h-6" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="prompt" className="block text-sm font-medium text-secondary">{mode === 'edit' ? 'Consigne de retouche' : 'Description de l\'image'}</label>
                            <textarea id="prompt" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)}
                                placeholder={mode === 'edit' ? "Ex: change le ciel pour un coucher de soleil..." : "Ex: Une villa moderne avec piscine et vue sur mer..."}
                                className="mt-1 block w-full bg-gray-900 border-gray-700 rounded-md p-2" disabled={mode === 'edit' && !selectedImageId} />
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                             <button type="button" onClick={handleReset} className="text-sm text-secondary hover:text-primary flex items-center gap-1"><ArrowPathIcon className="w-4 h-4" />{annonceToEdit ? "Annuler" : "Réinitialiser"}</button>
                            <button type="button" onClick={handleGenerateImage} disabled={isGenerateImageDisabled}
                                className="bg-brand hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-md flex items-center gap-2">
                                {isLoading ? (<><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div><span>Génération...</span></>) : (<><SparklesIcon className="w-5 h-5"/><span>{mode === 'edit' ? 'Retoucher' : 'Générer'}</span></>)}
                            </button>
                        </div>
                        {error && <p className="text-red-400 text-sm">{error}</p>}
                    </div>
                    {/* Image Previews */}
                    <div className="flex flex-row gap-4">
                        <div className="w-1/2">
                            <h3 className="text-md font-semibold text-center text-secondary mb-2">Originale</h3>
                            <div className="aspect-square bg-gray-900 rounded-md flex items-center justify-center p-2" draggable={!!selectedImage} onDragStart={(e) => selectedImage && handleDragStart(e, selectedImage.url)}>
                                {selectedImage ? <img src={selectedImage.url} alt="Original" className="max-h-full max-w-full object-contain rounded-md cursor-grab" /> : <PhotoIcon className="w-16 h-16 text-gray-700" />}
                            </div>
                        </div>
                        <div className="w-1/2">
                            <h3 className="text-md font-semibold text-center text-secondary mb-2">Modifiée</h3>
                            <div className="aspect-square bg-gray-900 rounded-md flex items-center justify-center relative" draggable={!!selectedGeneratedImage} onDragStart={(e) => selectedGeneratedImage && handleDragStart(e, selectedGeneratedImage)}>
                                {isLoading && selectedImageId === (imageList.find(img => img.id === selectedImageId)?.id) && (<div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div></div>)}
                                {selectedGeneratedImage ? <img src={selectedGeneratedImage} alt="Modifiée" className="max-h-full max-w-full object-contain rounded-md cursor-grab" onClick={() => handleViewImage(selectedGeneratedImage)} /> : <SparklesIcon className="w-16 h-16 text-gray-700" />}
                            </div>
                        </div>
                    </div>
                </div>

                <div 
                    className={`mt-8 space-y-4 rounded-lg border-2 border-dashed p-4 transition-colors ${isDraggingOver ? 'border-brand bg-brand/10' : 'border-gray-600'}`}
                    onDrop={handleDrop} onDragOver={handleDragOver} onDragEnter={() => setIsDraggingOver(true)} onDragLeave={handleDragLeave}
                >
                    <h3 className="text-xl font-semibold text-primary">Images de l'annonce</h3>
                    <div className="min-h-[120px]">
                        {finalGallery.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                {finalGallery.map((url, index) => (
                                    <div key={index} className="relative group aspect-square">
                                        <img src={url} alt={`Annonce image ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                                        <button onClick={() => handleRemoveFromGallery(index)} className="absolute -top-2 -right-2 bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"><XCircleIcon className="w-6 h-6" /></button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center text-secondary py-8">
                                <p className="font-semibold">Glissez-déposez vos images ici</p>
                                <p className="text-sm">Composez la galerie de votre annonce.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-surface p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-primary mb-4 border-b border-gray-700 pb-2">Étape 2 : Rédaction de l'Annonce</h3>
                <div className="space-y-3">
                    <div>
                        <label htmlFor="descriptionInput" className="block text-sm font-medium text-secondary">Saisissez ou dictez votre texte brut</label>
                        <div className="relative mt-1">
                            <textarea id="descriptionInput" value={descriptionInput} onChange={(e) => setDescriptionInput(e.target.value)} rows={5} className="block w-full bg-gray-900 border-gray-700 rounded-md p-2 pr-12" placeholder="Ex: belle maison t4 120m2 toulouse..."/>
                            <div className="absolute top-2 right-2">
                                <AudioTranscriber 
                                    onTranscriptionUpdate={textChunk => setDescriptionInput(prev => prev + textChunk)} 
                                    onTranscriptionComplete={() => {}} 
                                    onStatusChange={(status, message) => setTranscriptionStatus({status, message})}
                                />
                            </div>
                        </div>
                    </div>
                    <button type="button" onClick={handleImproveDescription} disabled={isImproving || !descriptionInput.trim()} className="bg-brand/80 hover:bg-brand text-white font-bold py-2 px-3 rounded-md text-sm flex items-center gap-2">
                        {isImproving ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div><span>Amélioration...</span></>) : (<><SparklesIcon className="w-4 h-4"/><span>Améliorer le texte</span></>)}
                    </button>
                    {descriptionError && <p className="text-red-400 text-sm">{descriptionError}</p>}
                    
                    <div className="flex justify-between items-center pt-2">
                        <label className="block text-sm font-medium text-secondary">Texte amélioré par l'IA</label>
                        <button onClick={handleCopy} disabled={!improvedDescription} className="text-sm text-secondary hover:text-primary disabled:opacity-50 flex items-center gap-1">
                            {copySuccess ? <CheckCircleIcon className="w-4 h-4 text-green-400" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                            {copySuccess ? 'Copié !' : 'Copier'}
                        </button>
                    </div>
                    <div className="w-full min-h-[150px] bg-gray-900 rounded-md p-3 text-sm prose prose-invert max-w-none prose-p:my-1 whitespace-pre-wrap overflow-y-auto">
                        {isImproving ? (<div className="flex items-center justify-center h-full text-secondary"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div></div>
                        ) : improvedDescription ? (<div dangerouslySetInnerHTML={{ __html: improvedDescription.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} />
                        ) : (<p className="text-center text-secondary italic">Le résultat apparaîtra ici.</p>)}
                    </div>
                </div>
            </div>

            <Modal isOpen={isImageViewerOpen} onClose={() => setIsImageViewerOpen(false)} title="Aperçu de l'image" widthClass="max-w-4xl">
                {imageToView && <img src={imageToView} alt="Aperçu" className="w-full h-auto rounded-md" />}
            </Modal>
        </div>
    );
};
