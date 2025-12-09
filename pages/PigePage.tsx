import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, type GroundingChunk } from '@google/genai';
import { ExternalLinkIcon, HomeIcon, PhoneArrowUpRightIcon, StarIcon, MapPinIcon, SparklesIcon, PlusIcon, TrashIcon, XCircleIcon, InformationCircleIcon } from '../components/Icons';
import { PROPERTY_TYPE_OPTIONS } from '../constants';
import { Modal } from '../components/Modal';
import { AudioTranscriber } from '../components/AudioTranscriber';
import { Contact, Criterion, Columns, ColumnId, SavedListing, ListingStatus } from '../types';

type SearchType = 'listings' | 'agencies';

// --- Type Definitions ---
export interface PigeResult {
    id: string;
    title: string;
    description: string;
    link?: string;
    rating?: number;
    listingCount?: number;
    score?: number;
    price?: string;
    imageUrl?: string;
    source?: string;
    agencyName?: string;
    latitude?: number;
    longitude?: number;
}


// --- N8N WORKFLOW SIMULATION ---
const triggerN8nWebhook = async (webhookUrl: string, payload: any): Promise<PigeResult[]> => {
    if (!webhookUrl) {
        throw new Error("L'URL du webhook n8n n'est pas configurée. Veuillez l'ajouter dans la page des paramètres.");
    }

    // Use the proxy path instead of the direct URL
    const response = await fetch('/n8n-proxy', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur du webhook n8n: ${response.status} ${response.statusText}. Réponse: ${errorText}`);
    }

    const results = await response.json();

    if (!Array.isArray(results)) {
        console.error("La réponse du webhook n'est pas un tableau:", results);
        throw new Error("Le format de la réponse du webhook n8n est incorrect. Un tableau de résultats est attendu.");
    }

    return results.map((item, index) => ({
        id: item.id || `n8n-res-${Date.now()}-${index}`,
        title: item.title || 'Sans titre',
        description: item.description || '',
        link: item.link,
        price: item.price,
        imageUrl: item.imageUrl,
        source: item.source || 'n8n',
        agencyName: item.agencyName,
        latitude: item.latitude,
        longitude: item.longitude,
        score: item.score,
    }));
};


// --- Initial State ---
const INITIAL_CRITERIA: Criterion[] = [
    { id: 'propertyType', label: 'Type de bien', type: 'select', value: 'Maison', options: PROPERTY_TYPE_OPTIONS },
    { id: 'budget', label: 'Budget (€)', type: 'numberRange', value: { min: 200000, max: 400000 } },
    { id: 'rooms', label: 'Pièces (min)', type: 'numberRange', value: { min: 3 } },
    { id: 'minSurface', label: 'Surface (min m²)', type: 'numberRange', value: { min: 50 } },
    { id: 'livingRoomSurface', label: 'Surface Salon (min m²)', type: 'numberRange', value: { min: 20 } },
    { id: 'floorLevel', label: 'Étage', type: 'select', value: 'RDC', options: ['RDC', '1er étage', 'Dernier étage'] },
    { id: 'jardin', label: 'Jardin', type: 'boolean' },
    { id: 'garage', label: 'Garage', type: 'boolean' },
];

// --- Sub-components ---

const CriterionPill: React.FC<{ 
    criterion: Criterion; 
    onUpdate: (value: any) => void; 
    onDelete?: () => void;
    isSource?: boolean 
}> = ({ criterion, onUpdate, onDelete, isSource }) => {
    const handleValueChange = (key: 'min' | 'max', val: string) => {
        onUpdate({ ...criterion.value, [key]: Number(val) });
    };

    const renderValue = () => {
        switch (criterion.type) {
            case 'select':
                return (
                    <select
                        value={criterion.value}
                        onChange={(e) => onUpdate(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-input text-primary text-xs rounded p-1 border-border"
                    >
                        {criterion.options?.map(opt => <option key={opt} value={opt} className="bg-surface text-primary">{opt}</option>)}
                    </select>
                );
            case 'numberRange':
                return (
                    <div className="flex items-center gap-1">
                        {criterion.value.min !== undefined && <input type="number" value={criterion.value.min} onChange={(e) => handleValueChange('min', e.target.value)} onClick={(e) => e.stopPropagation()} className="w-20 bg-input text-primary text-xs rounded p-1 border-border" placeholder="Min" />}
                        {criterion.value.max !== undefined && <input type="number" value={criterion.value.max} onChange={(e) => handleValueChange('max', e.target.value)} onClick={(e) => e.stopPropagation()} className="w-20 bg-input text-primary text-xs rounded p-1 border-border" placeholder="Max" />}
                    </div>
                );
            default:
                return null;
        }
    };
    return (
        <div
            draggable={!isSource}
            onDragStart={isSource ? undefined : (e) => { e.dataTransfer.setData('criterionId', criterion.id); }}
            className={`flex items-center justify-between p-2 rounded-lg bg-surface border border-border cursor-grab active:cursor-grabbing ${isSource ? 'cursor-copy' : ''}`}
        >
            <div className="flex-grow flex items-center gap-2">
                <span className="text-sm font-medium text-primary">{criterion.label}</span>
                {!isSource && renderValue()}
            </div>
            {!isSource && onDelete && (
                <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                    className="ml-2 p-1 text-secondary hover:text-red-500 flex-shrink-0"
                    aria-label="Supprimer le critère"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

const DropColumn: React.FC<{ 
    title: string;
    columnId: ColumnId; 
    criteria: Criterion[]; 
    onDrop: (e: React.DragEvent<HTMLDivElement>, columnId: ColumnId) => void;
    onUpdateCriterion: (criterionId: string, value: any) => void;
    onDeleteCriterion: (criterionId: string) => void;
}> = ({ title, columnId, criteria, onDrop, onUpdateCriterion, onDeleteCriterion }) => {
    const [isOver, setIsOver] = useState(false);
    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
            onDragLeave={() => setIsOver(false)}
            onDrop={(e) => { e.preventDefault(); setIsOver(false); onDrop(e, columnId); }}
            className={`p-3 rounded-lg min-h-[200px] border-2 border-dashed transition-colors ${isOver ? 'border-brand bg-brand/10' : 'border-border bg-background'}`}
        >
            <h4 className="font-semibold text-center text-primary mb-3">{title}</h4>
            <div className="space-y-2">
                {criteria.length > 0 ? criteria.map(c => (
                    <CriterionPill 
                        key={c.id} 
                        criterion={c} 
                        onUpdate={(value) => onUpdateCriterion(c.id, value)} 
                        onDelete={() => onDeleteCriterion(c.id)}
                    />
                )) : <p className="text-center text-xs text-secondary pt-10">Glissez un critère ici</p>}
            </div>
        </div>
    );
};

const ResultCard: React.FC<{
    result: PigeResult;
    isSelected: boolean;
    onSelect: (resultId: string) => void;
}> = ({ result, isSelected, onSelect }) => {
    
    const getScoreColor = (score?: number) => {
        if (!score) return 'from-gray-400 to-gray-500';
        if (score > 85) return 'from-teal-400 to-cyan-500';
        if (score > 70) return 'from-green-400 to-blue-500';
        if (score > 50) return 'from-yellow-400 to-orange-500';
        return 'from-red-400 to-pink-500';
    };
    
    return (
        <div 
            className={`bg-surface rounded-lg shadow-lg overflow-hidden flex flex-col h-full transform hover:scale-105 transition-transform duration-300 relative cursor-pointer ${isSelected ? 'ring-2 ring-brand' : ''}`}
            onClick={() => onSelect(result.id)}
        >
            <div className="absolute top-2 left-2 z-20">
                <input 
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="h-5 w-5 rounded text-brand bg-surface/50 border-border focus:ring-brand"
                />
            </div>
            
            <a href={result.link} target="_blank" rel="noopener noreferrer" className="block relative" onClick={(e) => e.stopPropagation()}>
                <img 
                    src={result.imageUrl || 'https://via.placeholder.com/400x300.png?text=Image+non+disponible'} 
                    alt={result.title} 
                    className="w-full h-48 object-cover" 
                    onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/400x300.png?text=Image+invalide'; }}
                />
                {result.source && (
                    <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        {result.source}
                    </span>
                )}
            </a>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-md font-bold text-primary truncate flex-grow" title={result.title}>{result.title}</h3>

                {result.agencyName && (
                  <div className="flex items-center gap-1.5 text-xs text-secondary mt-1">
                    <HomeIcon className="w-3 h-3"/>
                    <span>{result.agencyName}</span>
                  </div>
                )}
                
                {result.price && <p className="text-lg font-semibold text-accent my-1 font-lato">{result.price}</p>}

                {result.score !== undefined && (
                  <div className="mt-3" title={`Score de compatibilité : ${result.score}%`}>
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-secondary">Compatibilité</span>
                        <span className="text-primary font-semibold text-xs">{result.score}%</span>
                    </div>
                    <div className="w-full bg-surface-secondary rounded-full h-2">
                        <div 
                            className={`bg-gradient-to-r ${getScoreColor(result.score)} h-2 rounded-full`}
                            style={{ width: `${result.score}%` }}
                        ></div>
                    </div>
                  </div>
                )}
            </div>
             <div className="p-4 pt-0">
                <a 
                    href={result.link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-full inline-flex items-center justify-center text-sm text-white bg-brand hover:bg-brand-dark transition-colors py-2 px-4 rounded-md font-semibold"
                    onClick={(e) => e.stopPropagation()}
                >
                    Voir l'annonce <ExternalLinkIcon className="w-4 h-4 ml-2" />
                </a>
            </div>
        </div>
    );
};

const AgencyResultCard: React.FC<{result: PigeResult}> = ({ result }) => {
    return (
        <a href={result.link} target="_blank" rel="noopener noreferrer" className="block bg-surface rounded-lg shadow-lg overflow-hidden flex flex-col h-full transform hover:scale-105 transition-transform duration-300 p-4">
            <h3 className="text-md font-bold text-primary truncate flex-grow" title={result.title}>{result.title}</h3>
            <p className="text-sm text-secondary mt-2 truncate">{result.description}</p>
            <div className="mt-4 flex justify-between items-center text-xs text-secondary">
                {result.rating && (
                    <div className="flex items-center gap-1">
                        <StarIcon className="w-4 h-4 text-yellow-400" />
                        <span className="font-semibold">{result.rating}</span>
                    </div>
                )}
                {result.listingCount && (
                    <span>{result.listingCount} annonces</span>
                )}
            </div>
        </a>
    );
};

interface PigePageProps {
    contacts: Contact[];
    onUpdateContact: (updatedContact: Contact) => void;
    n8nWebhookUrl: string;
}

const formatCriterionForN8n = (c: Criterion): { label: string; value: any } => {
    switch (c.type) {
        case 'boolean':
        case 'custom':
            return { label: c.label, value: true };
        case 'select':
        case 'numberRange':
            return { label: c.label, value: c.value };
        default:
            return { label: c.label, value: c.value };
    }
};

export const PigePage: React.FC<PigePageProps> = ({ contacts, onUpdateContact, n8nWebhookUrl }) => {
    const [searchType, setSearchType] = useState<SearchType>('listings');
    const [location, setLocation] = useState('Toulouse, France');
    const [radius, setRadius] = useState(5);
    const [availableCriteria, setAvailableCriteria] = useState<Criterion[]>(INITIAL_CRITERIA);
    const [columns, setColumns] = useState<Columns>({ essentials: [], importants: [], secondaries: [] });
    
    const [freeTextInput, setFreeTextInput] = useState('');
    const [transcriptionStatus, setTranscriptionStatus] = useState<{status: 'idle' | 'recording' | 'error', message?: string}>({status: 'idle'});

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<PigeResult[]>([]);
    
    const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number; } | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    
    const [selectedContactId, setSelectedContactId] = useState('');
    const [selectedResultIds, setSelectedResultIds] = useState<string[]>([]);
    const [isAssociateModalOpen, setIsAssociateModalOpen] = useState(false);
    
    const searchCancelledRef = useRef(false);

    const handleLoadCriteriaFromContact = (contactId: string) => {
        setSelectedContactId(contactId);
        const contact = contacts.find(c => c.id === contactId);

        if (!contact || !contact.searchCriteria) {
            setColumns({ essentials: [], importants: [], secondaries: [] });
            setAvailableCriteria(JSON.parse(JSON.stringify(INITIAL_CRITERIA)));
            setLocation('Toulouse, France');
            setRadius(5);
            return;
        }

        const criteria = contact.searchCriteria;
        const available = JSON.parse(JSON.stringify(INITIAL_CRITERIA));
        const newColumns: Columns = { essentials: [], importants: [], secondaries: [] };

        const assignCriterion = (id: string, value: any, column: ColumnId) => {
            const index = available.findIndex((c: Criterion) => c.id === id);
            if (index > -1) {
                const [criterion] = available.splice(index, 1);
                criterion.value = value;
                newColumns[column].push(criterion);
            }
        };
        
        if (criteria.cities) setLocation(criteria.cities);
        if (criteria.searchRadiusKm) setRadius(Math.min(criteria.searchRadiusKm, 5));
        
        if (criteria.targetPrice) {
            const margin = criteria.priceMarginPercent || 10;
            const min = Math.round(criteria.targetPrice * (1 - margin / 100));
            const max = Math.round(criteria.targetPrice * (1 + margin / 100));
            assignCriterion('budget', { min, max }, 'essentials');
        }

        if (criteria.propertyTypes && criteria.propertyTypes.length > 0) {
            assignCriterion('propertyType', criteria.propertyTypes[0], 'essentials');
        }
        
        if (criteria.minRooms) {
            const roomsCriterion = available.find((c: Criterion) => c.id === 'rooms');
            if (roomsCriterion) {
                assignCriterion('rooms', { ...roomsCriterion.value, min: criteria.minRooms }, 'essentials');
            }
        }
        
        if (criteria.minLivingArea) {
            const surfaceCriterion = available.find((c: Criterion) => c.id === 'minSurface');
            if (surfaceCriterion) {
                assignCriterion('minSurface', { ...surfaceCriterion.value, min: criteria.minLivingArea }, 'essentials');
            }
        }

        const importantFeatures = criteria.importantFeatures || [];
        const customFeatures: string[] = [];

        importantFeatures.forEach(feature => {
            const featureId = feature.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const existingCriterionIndex = available.findIndex((c: Criterion) => c.id === featureId);
            if (existingCriterionIndex > -1 && available[existingCriterionIndex].type === 'boolean') {
                const [criterion] = available.splice(existingCriterionIndex, 1);
                newColumns.importants.push(criterion);
            } else {
                customFeatures.push(feature);
            }
        });

        const allCustomFeatures = [
            ...customFeatures,
            ...(criteria.propertyStyle || []).map(style => `Style: ${style}`)
        ];

        allCustomFeatures.forEach((feature, index) => {
            newColumns.importants.push({
                id: `custom-feature-${Date.now()}-${index}`,
                label: feature,
                type: 'custom',
            });
        });

        setAvailableCriteria(available);
        setColumns(newColumns);
    };

    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetColumnId: ColumnId | 'available') => {
        const criterionId = e.dataTransfer.getData('criterionId');
        if (!criterionId) return;

        let criterion: Criterion | undefined;
        let originColumn: ColumnId | 'available' | undefined;
        
        // Find criterion and its origin
        if (availableCriteria.some(c => c.id === criterionId)) {
            criterion = availableCriteria.find(c => c.id === criterionId);
            originColumn = 'available';
        } else {
            for (const col of Object.keys(columns) as ColumnId[]) {
                const found = columns[col].find(c => c.id === criterionId);
                if (found) {
                    criterion = found;
                    originColumn = col;
                    break;
                }
            }
        }
        
        if (!criterion || !originColumn || originColumn === targetColumnId) return;

        // --- Immutable state update ---
        const newAvailable = [...availableCriteria];
        const newColumns = JSON.parse(JSON.stringify(columns));

        // 1. Remove from origin
        if (originColumn === 'available') {
            const index = newAvailable.findIndex(c => c.id === criterionId);
            if (index > -1) newAvailable.splice(index, 1);
        } else {
            const index = newColumns[originColumn].findIndex((c: Criterion) => c.id === criterionId);
            if (index > -1) newColumns[originColumn].splice(index, 1);
        }

        // 2. Add to destination
        if (targetColumnId === 'available') {
            newAvailable.push(criterion);
        } else {
            newColumns[targetColumnId].push(criterion);
        }
        
        setAvailableCriteria(newAvailable);
        setColumns(newColumns);
    };

    const handleDeleteCriterion = useCallback((criterionId: string) => {
        let criterionToRemove: Criterion | undefined;
        let originColumn: ColumnId | undefined;

        // Find the criterion and its origin column
        for (const col of Object.keys(columns) as ColumnId[]) {
            const found = columns[col].find(c => c.id === criterionId);
            if (found) {
                criterionToRemove = found;
                originColumn = col;
                break;
            }
        }

        // If not found in columns, do nothing.
        if (!criterionToRemove || !originColumn) return;

        // Use functional updates for state to avoid race conditions
        setColumns(prevColumns => {
            const newColumns = { ...prevColumns };
            // Remove from the column
            newColumns[originColumn] = newColumns[originColumn].filter(c => c.id !== criterionId);
            return newColumns;
        });

        const isPredefined = INITIAL_CRITERIA.some(c => c.id === criterionId);

        if (isPredefined) {
            setAvailableCriteria(prevAvailable => {
                // Avoid adding duplicates
                if (prevAvailable.some(c => c.id === criterionId)) {
                    return prevAvailable;
                }
                return [...prevAvailable, criterionToRemove!];
            });
        }
    }, [columns]);
    
    const handleUpdateCriterion = (criterionId: string, value: any) => {
        const updateInArray = (arr: Criterion[]) => arr.map(c => c.id === criterionId ? { ...c, value } : c);
        
        setAvailableCriteria(prev => updateInArray(prev));
        setColumns(prev => ({
            essentials: updateInArray(prev.essentials),
            importants: updateInArray(prev.importants),
            secondaries: updateInArray(prev.secondaries),
        }));
    };

    const addFreeTextToColumn = (columnId: ColumnId) => {
        if (!freeTextInput.trim()) return;
        const newCriterion: Criterion = {
            id: `freetext-${Date.now()}`,
            label: freeTextInput.trim(),
            type: 'custom',
        };
        setColumns(prev => ({
            ...prev,
            [columnId]: [...prev[columnId], newCriterion],
        }));
        setFreeTextInput('');
    };

    const handleGeolocate = () => {
        setIsLocating(true);
        setLocationError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCoordinates({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                setLocation("Ma position actuelle");
                setIsLocating(false);
            },
            (err) => {
                setLocationError("Géolocalisation refusée. Veuillez l'autoriser dans les paramètres de votre navigateur.");
                setIsLocating(false);
            }
        );
    };
    
    const handleCancel = () => {
        searchCancelledRef.current = true;
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        searchCancelledRef.current = false;
        setIsLoading(true);
        setError(null);
        setResults([]);
        setSelectedResultIds([]);

        try {
            if (searchType === 'listings') {
                const payload = {
                    location,
                    radius,
                    primordiaux: columns.essentials.map(formatCriterionForN8n),
                    importants: columns.importants.map(formatCriterionForN8n),
                    bonus: columns.secondaries.map(formatCriterionForN8n)
                };
                const n8nResults = await triggerN8nWebhook(n8nWebhookUrl, payload);
                if (searchCancelledRef.current) return;
                setResults(n8nResults);
            } else { // 'agencies' search
                const prompt = `**ROLE**: Tu es un robot d'indexation web spécialisé dans l'annuaire d'entreprises.
                **TA MISSION**: Utilise tes outils de recherche web et de cartographie pour trouver des agences immobilières dans un rayon de ${radius}km autour de "${location}".
                **FORMAT DE SORTIE OBLIGATOIRE**: Ta réponse DOIT être UNIQUEMENT un tableau JSON valide (formaté comme une chaîne de caractères pure) avec les clés: "title", "description", "rating", "listingCount", "link", "latitude", "longitude". Si une information n'est pas disponible, utilise 'null'.
                **COMMENCE TA RÉPONSE DIRECTEMENT AVEC LE CARACTÈRE '['.**`;
                
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
                const config: any = { tools: [{ googleSearch: {} }, { googleMaps: {} }] };
                if (coordinates) {
                    config.toolConfig = { retrievalConfig: { latLng: coordinates } };
                }
                
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: config });
                if (searchCancelledRef.current) return;

                const parsedResults = parseGeminiResponse(response.text);
                setResults(parsedResults);
            }
        } catch (err: any) {
            if (searchCancelledRef.current) return;
            console.error(err);
            setError("Une erreur est survenue lors de la recherche. Détails: " + err.message);
        } finally {
            if (!searchCancelledRef.current) setIsLoading(false);
        }
    };
    
    const parseGeminiResponse = (text: string): PigeResult[] => {
        try {
            let jsonString = text.trim();
            if (jsonString.startsWith('```json')) {
                jsonString = jsonString.substring(7, jsonString.length - 3).trim();
            } else if (jsonString.startsWith('```')) {
                 jsonString = jsonString.substring(3, jsonString.length - 3).trim();
            }
            
            const items: any[] = JSON.parse(jsonString);

            if (!Array.isArray(items)) {
                throw new Error("La réponse de l'IA n'est pas un tableau.");
            }
            
            return items.map((item, index) => ({
                id: `res-${Date.now()}-${index}`,
                title: item.title || 'Sans titre',
                description: item.description || '',
                link: item.link,
                rating: item.rating,
                listingCount: item.listingCount,
                score: item.score,
                price: item.price,
                imageUrl: item.imageUrl,
                source: item.source,
                agencyName: item.agencyName,
                latitude: item.latitude,
                longitude: item.longitude,
            }));
        } catch (e: any) {
            console.error("Failed to parse JSON response:", e, "Raw text:", text);
            setError(`Failed to parse JSON response:\n${e.message}`);
            return [];
        }
    };

    const handleSelectResult = (resultId: string) => {
        setSelectedResultIds(prev =>
            prev.includes(resultId)
                ? prev.filter(id => id !== resultId)
                : [...prev, resultId]
        );
    };

    const handleAssociateListings = (contactId: string) => {
        const contact = contacts.find(c => c.id === contactId);
        if (!contact) return;

        const selectedResults = results.filter(r => selectedResultIds.includes(r.id));
        
        const newListings: SavedListing[] = selectedResults.map(result => ({
            id: `listing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            contactId: contact.id,
            savedDate: new Date(),
            status: ListingStatus.Nouveau,
            remarks: [],
            title: result.title,
            price: result.price || 'N/P',
            link: result.link || '#',
            imageUrl: result.imageUrl || '',
            source: result.agencyName || result.source || 'Pige IA',
            description: result.description,
        }));

        const updatedContact: Contact = {
            ...contact,
            savedListings: [...newListings, ...contact.savedListings],
            lastUpdateDate: new Date(),
        };

        onUpdateContact(updatedContact);
        
        alert(`${newListings.length} annonce(s) ajoutée(s) au dossier de ${contact.firstName} ${contact.lastName}.`);
        setSelectedResultIds([]);
    };

    const handleOpenAssociateModal = () => {
        const activeContacts = contacts.filter(c => c.projectStatus !== 'Terminé' && c.projectStatus !== 'Perdu');
        if (activeContacts.length === 0) {
            alert("Aucun contact actif à qui associer ces annonces.");
            return;
        }
        setIsAssociateModalOpen(true);
    };

    const handleConfirmAssociation = (contactId: string) => {
        handleAssociateListings(contactId);
        setIsAssociateModalOpen(false);
    };


    return (
        <div className="space-y-4">
            <div className="bg-surface p-4 rounded-lg shadow-lg">
                <div className="flex items-center space-x-3 mb-2">
                    <PhoneArrowUpRightIcon className="w-8 h-8 text-brand"/>
                    <h2 className="text-2xl font-bold text-primary">Pige Immobilière Assistée</h2>
                </div>
                 <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <div className="flex items-center space-x-2 rounded-lg bg-input p-1">
                             <RadioOption name="searchType" value="listings" checked={searchType === 'listings'} onChange={(e) => setSearchType(e.target.value as SearchType)} label="Annonces" />
                             <RadioOption name="searchType" value="agencies" checked={searchType === 'agencies'} onChange={(e) => setSearchType(e.target.value as SearchType)} label="Agences" />
                        </div>
                        <div className="flex-grow relative min-w-[200px]">
                            <label htmlFor="location" className="sr-only">Localisation</label>
                            <input type="text" name="location" id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-input p-2 rounded-md border-border pr-10" required />
                            <button type="button" onClick={handleGeolocate} disabled={isLocating} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-secondary hover:text-primary disabled:opacity-50" aria-label="Utiliser ma position actuelle">
                                {isLocating ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div> : <MapPinIcon className="w-5 h-5"/>}
                            </button>
                        </div>
                        <div>
                            <label htmlFor="radius" className="text-xs text-secondary">Rayon (km)</label>
                            <input 
                                type="number" 
                                name="radius" 
                                id="radius" 
                                value={radius} 
                                onChange={(e) => setRadius(Math.min(5, Number(e.target.value)))} 
                                min="1" 
                                max="5" 
                                className="w-24 bg-input p-2 rounded-md border-border" 
                                required 
                            />
                        </div>
                        <div className="flex-grow flex justify-end">
                            {!isLoading ? (
                                <button type="submit" className="bg-brand hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-md transition-colors">
                                    <SparklesIcon className="w-5 h-5 inline-block mr-2" />
                                    Lancer la recherche
                                </button>
                            ) : (
                                <button type="button" onClick={handleCancel} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                                    Arrêter
                                </button>
                            )}
                        </div>
                    </div>
                     <div className="flex items-center gap-2 text-xs text-secondary bg-background p-2 rounded-md">
                        <InformationCircleIcon className="w-5 h-5 text-sky-400 flex-shrink-0"/>
                        <span>Pour les grandes villes, privilégiez les noms de quartiers dans le champ de localisation pour des résultats plus précis.</span>
                    </div>
                    {searchType === 'listings' && (
                        <div className="pt-3 mt-2 border-t border-border animate-fade-in">
                             <div className="bg-surface-secondary p-3 rounded-lg mb-4 flex items-center gap-4">
                                <label htmlFor="contact-criteria-loader" className="text-sm font-medium text-secondary flex-shrink-0">
                                    Reprendre les critères de :
                                </label>
                                <select 
                                    id="contact-criteria-loader"
                                    value={selectedContactId}
                                    onChange={(e) => handleLoadCriteriaFromContact(e.target.value)}
                                    className="flex-grow bg-input border-border rounded-md p-2 text-sm"
                                >
                                    <option value="">-- Sélectionner un contact --</option>
                                    {contacts.filter(c => c.searchCriteria).map(c => (
                                        <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                                    ))}
                                </select>
                                {selectedContactId && (
                                    <button 
                                        type="button" 
                                        onClick={() => handleLoadCriteriaFromContact('')}
                                        className="p-1.5 text-secondary hover:text-primary"
                                        title="Réinitialiser les critères"
                                    >
                                        <XCircleIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-secondary mb-3">Organisez les critères par priorité en les glissant dans les colonnes, ou ajoutez une consigne libre.</p>
                            
                            <div className="bg-surface-secondary p-3 rounded-lg mb-4">
                                <label htmlFor="freeTextInput" className="block text-sm font-medium text-secondary">
                                    Ajouter une consigne textuelle ou vocale
                                </label>
                                <div className="relative mt-1">
                                    <textarea
                                    id="freeTextInput"
                                    value={freeTextInput}
                                    onChange={(e) => setFreeTextInput(e.target.value)}
                                    rows={3}
                                    className="block w-full bg-input border-border rounded-md p-2 pr-12"
                                    placeholder="Ex: 'proche d'une école primaire', 'sans vis-à-vis', 'dernier étage avec ascenseur'..."
                                    />
                                    <div className="absolute top-2 right-2">
                                    <AudioTranscriber
                                        onTranscriptionUpdate={textChunk => setFreeTextInput(prev => prev + textChunk)}
                                        onTranscriptionComplete={() => {}}
                                        onStatusChange={(status, message) => setTranscriptionStatus({ status, message })}
                                    />
                                    </div>
                                </div>
                                {transcriptionStatus.status === 'error' && <p className="text-red-400 text-xs mt-1">{transcriptionStatus.message}</p>}
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <button type="button" onClick={() => addFreeTextToColumn('essentials')} disabled={!freeTextInput.trim()} className="text-xs font-semibold px-3 py-1.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/40 disabled:opacity-50 disabled:cursor-not-allowed">+ Indispensable</button>
                                    <button type="button" onClick={() => addFreeTextToColumn('importants')} disabled={!freeTextInput.trim()} className="text-xs font-semibold px-3 py-1.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed">+ Important</button>
                                    <button type="button" onClick={() => addFreeTextToColumn('secondaries')} disabled={!freeTextInput.trim()} className="text-xs font-semibold px-3 py-1.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/50 hover:bg-sky-500/40 disabled:opacity-50 disabled:cursor-not-allowed">+ Bonus</button>
                                </div>
                            </div>

                             <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                                <div 
                                    className="lg:col-span-1 bg-surface-secondary p-3 rounded-lg"
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => handleDrop(e, 'available')}
                                >
                                    <h4 className="font-semibold text-center text-primary mb-3">Critères disponibles</h4>
                                    <div className="space-y-2">
                                        {availableCriteria.map(c => 
                                            <div key={c.id} draggable onDragStart={(e) => e.dataTransfer.setData('criterionId', c.id)}>
                                                <CriterionPill criterion={c} onUpdate={(value) => handleUpdateCriterion(c.id, value)} isSource/>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <DropColumn title="Indispensables" columnId="essentials" criteria={columns.essentials} onDrop={handleDrop} onUpdateCriterion={handleUpdateCriterion} onDeleteCriterion={handleDeleteCriterion} />
                                    <DropColumn title="Importants" columnId="importants" criteria={columns.importants} onDrop={handleDrop} onUpdateCriterion={handleUpdateCriterion} onDeleteCriterion={handleDeleteCriterion} />
                                    <DropColumn title="Bonus" columnId="secondaries" criteria={columns.secondaries} onDrop={handleDrop} onUpdateCriterion={handleUpdateCriterion} onDeleteCriterion={handleDeleteCriterion} />
                                </div>
                            </div>
                        </div>
                    )}
                     {locationError && <p className="text-red-400 text-sm mt-2">{locationError}</p>}
                </form>
            </div>
            
            <div className="relative">
                {isLoading && (
                     <div className="flex h-full flex-col items-center justify-center text-center p-10 bg-surface rounded-lg">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mb-4"></div>
                        <p className="text-secondary font-semibold">Recherche en cours...</p>
                        <p className="text-sm text-gray-500">{searchType === 'listings' ? "Déclenchement du workflow n8n..." : "Analyse IA des agences..."}</p>
                    </div>
                )}
                {error && <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300"><h4 className="font-bold">Erreur</h4><pre className="whitespace-pre-wrap text-xs">{error}</pre></div>}
                
                {results.length > 0 && (
                    <div className="bg-surface rounded-lg shadow-lg animate-fade-in">
                        <div className="p-4 border-b border-border flex justify-between items-center">
                            <h3 className="font-semibold text-primary">
                                Résultats de la pige ({results.length})
                                {searchType === 'listings' && <span className="ml-2 text-xs bg-blue-500/30 text-blue-300 px-2 py-1 rounded-full">via Workflow n8n</span>}
                            </h3>
                        </div>

                       <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                         {results.map((res) => (
                           <div key={res.id}>
                                {searchType === 'listings' ? (
                                    <ResultCard 
                                        result={res} 
                                        isSelected={selectedResultIds.includes(res.id)}
                                        onSelect={handleSelectResult}
                                    />
                                ) : (
                                    <AgencyResultCard result={res} />
                                )}
                           </div>
                         ))}
                       </div>
                    </div>
                )}
                 {selectedResultIds.length > 0 && (
                    <div className="sticky bottom-6 z-20 w-full flex justify-center animate-fade-in-up">
                        <div className="bg-surface shadow-lg rounded-lg p-3 flex items-center gap-4 border border-border">
                            <span className="text-sm font-semibold">{selectedResultIds.length} annonce(s) sélectionnée(s)</span>
                            <button onClick={handleOpenAssociateModal} className="bg-brand hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-md">
                                Associer à un contact...
                            </button>
                            <button onClick={() => setSelectedResultIds([])} className="p-2 text-secondary hover:text-primary" title="Désélectionner tout">
                                <XCircleIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <Modal isOpen={isAssociateModalOpen} onClose={() => setIsAssociateModalOpen(false)} title={`Associer ${selectedResultIds.length} annonce(s)`}>
                <div className="space-y-4">
                    <p>Sélectionnez le contact auquel vous souhaitez ajouter ces annonces :</p>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {contacts.filter(c => c.projectStatus !== 'Terminé' && c.projectStatus !== 'Perdu').map(contact => (
                            <button 
                                key={contact.id} 
                                onClick={() => handleConfirmAssociation(contact.id)}
                                className="w-full text-left p-3 bg-surface-secondary hover:bg-opacity-80 rounded-md transition-colors"
                            >
                                <span className="font-semibold text-primary">{contact.firstName} {contact.lastName}</span>
                                <span className="text-sm text-secondary block">{contact.contactType}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const RadioOption: React.FC<{name: string, value: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, label: string}> = ({ name, value, checked, onChange, label }) => (
    <label className={`flex items-center space-x-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors text-sm font-medium ${checked ? 'bg-brand text-white' : 'hover:bg-surface'}`}>
        <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="hidden" />
        <span>{label}</span>
    </label>
);

