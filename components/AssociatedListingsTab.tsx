import React, { useState } from 'react';
import { Contact, SavedListing, Listing, Remark, ListingStatus } from '../types';
import { LISTING_STATUS_OPTIONS, LISTING_STATUS_COLORS } from '../constants';
import { ChevronDownIcon, TrashIcon, ExternalLinkIcon, PlusIcon, BookmarkSquareIcon, SparklesIcon, XCircleIcon } from './Icons';
import { GoogleGenAI } from '@google/genai';

// --- PROPS ---
interface AssociatedListingsTabProps {
    contact: Contact;
    onUpdateContact: (updatedContact: Contact) => void;
}

interface AssociatedListingCardProps {
    listing: SavedListing;
    onUpdate: (updatedListing: SavedListing) => void;
    onDelete: (listingId: string) => void;
}

interface AddListingFormProps {
    onAdd: (listingData: Omit<Listing, 'id'>) => void;
}


// --- CARD COMPONENT ---
const AssociatedListingCard: React.FC<AssociatedListingCardProps> = ({ listing, onUpdate, onDelete }) => {
    const [isRemarksOpen, setIsRemarksOpen] = useState(false);
    const [newRemark, setNewRemark] = useState('');

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onUpdate({ ...listing, status: e.target.value as ListingStatus });
    };

    const handleAddRemark = () => {
        if (newRemark.trim()) {
            const remarkToAdd: Remark = { id: `rem-list-${Date.now()}`, text: newRemark.trim(), timestamp: new Date() };
            onUpdate({ ...listing, remarks: [remarkToAdd, ...listing.remarks] });
            setNewRemark('');
        }
    };

    return (
        <div className="bg-surface-secondary/50 rounded-lg p-3 flex flex-col sm:flex-row gap-4">
            <img 
              src={listing.imageUrl} 
              alt={listing.title} 
              className="w-full sm:w-24 h-24 object-cover rounded-md flex-shrink-0" 
              onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150/1f2937/9ca3af?text=Image+invalide'; }}
            />
            <div className="flex-grow space-y-2">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-primary">{listing.title}</h4>
                        <p className="text-xs text-secondary">{listing.source}</p>
                        <p className="text-sm font-semibold text-accent font-lato">{listing.price}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <select
                            value={listing.status}
                            onChange={handleStatusChange}
                            onClick={(e) => e.stopPropagation()}
                            className={`text-xs p-1 rounded-md border-0 appearance-none text-center ${LISTING_STATUS_COLORS[listing.status]}`}
                        >
                            {LISTING_STATUS_OPTIONS.map(opt => <option key={opt} value={opt} className="bg-surface text-primary">{opt}</option>)}
                        </select>
                        <a href={listing.link} target="_blank" rel="noopener noreferrer" className="p-1.5 text-secondary hover:text-primary"><ExternalLinkIcon className="w-4 h-4"/></a>
                        <button onClick={() => onDelete(listing.id)} className="p-1.5 text-red-500 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
                    </div>
                </div>
                <p className="text-xs text-secondary" style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {listing.description}
                </p>
                <div>
                    <button onClick={() => setIsRemarksOpen(!isRemarksOpen)} className="flex items-center gap-1 text-xs text-secondary hover:text-primary">
                        Remarques ({listing.remarks.length}) <ChevronDownIcon className={`w-3 h-3 transition-transform ${isRemarksOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isRemarksOpen && (
                        <div className="mt-2 space-y-2">
                            <div className="flex gap-2">
                                <input type="text" value={newRemark} onChange={(e) => setNewRemark(e.target.value)} placeholder="Ajouter une remarque..." className="flex-grow bg-input border-border rounded-md p-1 text-xs" />
                                <button onClick={handleAddRemark} className="bg-brand text-white px-2 rounded-md text-xs">Ajouter</button>
                            </div>
                            <div className="max-h-24 overflow-y-auto space-y-1 pr-2">
                                {listing.remarks.map(rem => (
                                    <div key={rem.id} className="text-xs bg-surface p-1.5 rounded">
                                        <p className="text-secondary">{rem.text}</p>
                                        <p className="text-gray-500 text-right text-[10px]">{new Date(rem.timestamp).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- ADD FORM COMPONENT ---
const AddListingForm: React.FC<AddListingFormProps> = ({ onAdd }) => {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!url.trim() || !url.startsWith('http')) {
            setError("Veuillez entrer une URL valide.");
            return;
        }
        setIsLoading(true);
        setError(null);

        const prompt = `
            Agis comme un assistant expert en immobilier. Ta mission est d'analyser le contenu de l'URL suivante: ${url}.

            Utilise l'outil de recherche pour accéder à la page. Ensuite, extrais méticuleusement les informations suivantes et retourne-les **uniquement** sous forme d'un objet JSON valide.

            **Structure JSON requise :**
            {
              "title": "...",
              "price": "...",
              "description": "...",
              "imageUrl": "...",
              "source": "..."
            }

            **Instructions détaillées pour l'extraction :**
            - **title**: Le titre principal de l'annonce.
            - **price**: Le prix de vente **exact** tel qu'affiché. Recherche les symboles '€' ou le mot 'euros'. Inclus tout texte pertinent comme "FAI" (Frais d'Agence Inclus) si présent. Formate-le comme une chaîne de caractères complète (ex: "450 000 € FAI").
            - **description**: La description textuelle complète du bien immobilier.
            - **imageUrl**: L'URL **complète et absolue** de l'image principale ou de la première image de la galerie. C'est l'image la plus grande et la plus visible de la propriété sur la page. Vérifie les balises "og:image" en priorité.
            - **source**: Le nom du site web (ex: "SeLoger", "Logic-Immo", "Le Figaro Immobilier").

            **Gestion des erreurs :**
            Si tu ne peux pas accéder à l'URL ou si une information cruciale (titre, prix, image) est manquante, retourne un objet JSON avec une clé "error" décrivant le problème.
            Exemple: { "error": "Impossible de trouver le prix sur la page." }

            **Rappel important :** Ta réponse doit être **uniquement l'objet JSON**. Aucun texte ou formatage supplémentaire. Échappe correctement les guillemets (") dans les valeurs du JSON.
        `;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                },
            });

            const jsonStringRaw = response.text;
            if (!jsonStringRaw) {
                throw new Error("La réponse de l'IA est vide. L'URL est peut-être inaccessible ou le contenu est bloqué.");
            }
            let jsonString = jsonStringRaw.trim();

            if (jsonString.startsWith('```json')) {
                jsonString = jsonString.substring(7, jsonString.length - 3).trim();
            } else if (jsonString.startsWith('```')) {
                jsonString = jsonString.substring(3, jsonString.length - 3).trim();
            }

            const parsedResult = JSON.parse(jsonString);
            
            if (parsedResult.error) {
                throw new Error(parsedResult.error);
            }
            
            // Basic validation
            if (parsedResult.title && parsedResult.price && parsedResult.imageUrl) {
                onAdd({ link: url, ...parsedResult });
                setUrl('');
            } else {
                throw new Error("Les données extraites sont incomplètes.");
            }

        } catch (err: any) {
            console.error(err);
            setError("Impossible d'analyser l'URL. Vérifiez le lien ou réessayez. Détails: " + (err.message || 'Format de réponse invalide.'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-surface-secondary/50 p-3 rounded-lg">
            <h4 className="font-semibold text-primary mb-2">Ajouter une annonce via URL</h4>
            <div className="flex flex-col sm:flex-row gap-2">
                <input 
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Collez le lien de l'annonce ici..."
                    className="flex-grow bg-input border-border rounded-md p-2 text-sm"
                />
                <button onClick={handleAnalyze} disabled={isLoading} className="bg-brand hover:bg-brand-dark text-white font-bold py-2 px-3 rounded-md text-sm flex items-center justify-center gap-2">
                    {isLoading ? (<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>) : <SparklesIcon className="w-4 h-4" />}
                    Analyser
                </button>
            </div>
            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </div>
    );
};

// --- MAIN TAB COMPONENT ---
export const AssociatedListingsTab: React.FC<AssociatedListingsTabProps> = ({ contact, onUpdateContact }) => {
    
    const handleUpdateListing = (updatedListing: SavedListing) => {
        const updatedListings = contact.savedListings.map(l => l.id === updatedListing.id ? updatedListing : l);
        onUpdateContact({ ...contact, savedListings: updatedListings });
    };
    
    const handleDeleteListing = (listingId: string) => {
        const updatedListings = contact.savedListings.filter(l => l.id !== listingId);
        onUpdateContact({ ...contact, savedListings: updatedListings });
    };
    
    const handleAddListing = (listingData: Omit<Listing, 'id'>) => {
        const newListing: SavedListing = {
            ...listingData,
            id: `listing-${Date.now()}`,
            contactId: contact.id,
            savedDate: new Date(),
            status: ListingStatus.Nouveau,
            remarks: [],
        };
        const updatedListings = [newListing, ...contact.savedListings];
        onUpdateContact({ ...contact, savedListings: updatedListings });
    };

    return (
        <div className="space-y-4">
            <AddListingForm onAdd={handleAddListing} />
            <div className="max-h-[26rem] overflow-y-auto space-y-3 bg-background p-3 rounded-lg">
                {contact.savedListings.length > 0 ? (
                    contact.savedListings.map(listing => (
                        <AssociatedListingCard 
                            key={listing.id}
                            listing={listing}
                            onUpdate={handleUpdateListing}
                            onDelete={handleDeleteListing}
                        />
                    ))
                ) : (
                    <div className="text-center p-8 text-secondary">
                        <BookmarkSquareIcon className="mx-auto h-12 w-12 text-gray-600" />
                        <h3 className="mt-2 text-sm font-medium">Aucune annonce associée</h3>
                        <p className="text-xs">Ajoutez une annonce en utilisant son URL.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
