



import React, { useState, useRef, useEffect, useCallback } from 'react';
// FIX: Import 'GroundingChunk' type to resolve the "Cannot find name" error.
import { GoogleGenerAI, type GroundingChunk } from '@google/genai';
import { ExternalLinkIcon, HomeIcon, PhoneArrowUpRightIcon, StarIcon, MapPinIcon, SparklesIcon, PlusIcon, TrashIcon, XCircleIcon, InformationCircleIcon, ClockIcon, CheckCircleIcon } from '../components/Icons';
import { PROPERTY_TYPE_OPTIONS } from '../constants';
import { Modal } from '../components/Modal';
import { AudioTranscriber } from '../components/AudioTranscriber';
import { Contact, Criterion, Columns, ColumnId, SavedListing, ListingStatus, PigeResult as PigeResultData, PigeAnnonce, PigeAgenceStat } from '../types';


type SearchType = 'listings' | 'agencies';


// --- N8N WORKFLOW SIMULATION ---
const triggerN8nWebhook = async (webhookUrl: string, payload: any): Promise<{ recherche_id: string }> => {
    if (!webhookUrl) {
        throw new Error("L'URL du webhook n8n n'est pas configurée. Veuillez l'ajouter dans la page des paramètres.");
    }

    const response = await fetch('/n8n-proxy', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-N8N-Webhook-Url': webhookUrl, 
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur du webhook n8n: ${response.status} ${response.statusText}. Réponse: ${errorText}`);
    }

    // n8n now returns an object with a recherche_id
    const result = await response.json();
    if (!result.recherche_id) {
         throw new Error("La réponse du webhook n'a pas retourné de 'recherche_id'.");
    }
    return result;
};


// --- Initial State ---
export const INITIAL_CRITERIA: Criterion[] = [
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

const ResultAnnonceCard: React.FC<{
    annonce: PigeAnnonce;
}> = ({ annonce }) => {
    
    return (
        <div className="bg-surface rounded-lg shadow-lg overflow-hidden flex flex-col h-full transform transition-transform duration-300 relative">
            <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start gap-4">
                    <h3 className="text-md font-bold text-primary flex-grow" title={annonce.titre}>{annonce.titre}</h3>
                    <div className="flex-shrink-0 text-lg font-semibold text-accent font-lato">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(annonce.prix)}
                    </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-secondary my-2">
                    <span>{annonce.nb_pieces} pièces</span>
                    <span>{annonce.nb_chambres} chambres</span>
                    <span>{annonce.surface_m2} m²</span>
                    <span>{annonce.localisation}</span>
                </div>
                
                 <div className="mt-3" title={`Score de compatibilité : ${annonce.score_compatibilite}%`}>
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-secondary">Compatibilité</span>
                        <span className="text-primary font-semibold text-xs">{annonce.score_compatibilite}%</span>
                    </div>
                    <div className="w-full bg-surface-secondary rounded-full h-2">
                        <div 
                            className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full"
                            style={{ width: `${annonce.score_compatibilite}%` }}
                        ></div>
                    </div>
                  </div>

                <div className="text-xs mt-3 space-y-1">
                    <p className="font-semibold text-primary">Critères remplis :</p>
                    <div className="flex flex-wrap gap-1">
                        {annonce.criteres_matches.map(c => <span key={c} className="bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded text-[10px]">{c}</span>)}
                    </div>
                    <p className="font-semibold text-primary mt-1">Critères manquants :</p>
                    <div className="flex flex-wrap gap-1">
                        {annonce.criteres_manquants.map(c => <span key={c} className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded text-[10px]">{c}</span>)}
                    </div>
                </div>
            </div>
             <div className="p-4 pt-2">
                <a 
                    href={annonce.url_annonce} 
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

interface PigePageProps {
    contacts: Contact[];
    onUpdateContact: (updatedContact: Contact) => void;
    n8nWebhookUrl: string;
    pigeState: any;
    setPigeState: (state: any) => void;
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

export const PigePage: React.FC<PigePageProps> = ({ contacts, onUpdateContact, n8nWebhookUrl, pigeState, setPigeState }) => {

    const {
        searchType, location, radius, availableCriteria, columns, freeTextInput, 
        isLoading, error, results, coordinates, selectedContactId
    } = pigeState;
    
    // New state for async flow
    const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);
    const [pigeResult, setPigeResult] = useState<PigeResultData | null>(null);
    const pollingIntervalRef = useRef<number | null>(null);

    const setState = (updater: (prevState: any) => any) => {
        setPigeState(updater(pigeState));
    };

    const [transcriptionStatus, setTranscriptionStatus] = useState<{status: 'idle' | 'recording' | 'error', message?: string}>({status: 'idle'});

    const [isLocating, setIsLocating] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);

    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            stopPolling();
        };
    }, []);

    const pollForResults = useCallback((rechercheId: string) => {
        stopPolling(); // Stop any previous polling

        pollingIntervalRef.current = window.setInterval(async () => {
            try {
                const res = await fetch(`/api/pige-results/${rechercheId}`);
                if (res.ok) {
                    const resultData: PigeResultData = await res.json();
                    setPigeResult(resultData);
                    setState((s: any) => ({ ...s, isLoading: false }));
                    stopPolling();
                }
                // If 404, we just continue polling
            } catch (err) {
                console.error("Polling error:", err);
                // Optionally handle polling errors, e.g., stop after too many failures
            }
        }, 30000); // Poll every 30 seconds

        // Set a timeout to stop polling after 15 minutes
        setTimeout(() => {
            if (pollingIntervalRef.current) {
                stopPolling();
                if (!pigeResult) {
                     setState((s: any) => ({ ...s, isLoading: false, error: "La recherche a pris plus de 15 minutes et a été interrompue." }));
                }
            }
        }, 15 * 60 * 1000);
    }, [pigeState]);
    

    const handleLoadCriteriaFromContact = (contactId: string) => {
        setState((s: any) => ({ ...s, selectedContactId: contactId }));
        const contact = contacts.find(c => c.id === contactId);

        if (!contact) {
            setState((s: any) => ({
                ...s,
                columns: { essentials: [], importants: [], secondaries: [] },
                availableCriteria: JSON.parse(JSON.stringify(INITIAL_CRITERIA)),
                location: '',
                radius: 5,
            }));
            return;
        }

        const criteria = contact.searchCriteria || {};
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
        
        setState((s: any) => ({ 
            ...s,
            location: criteria.cities || s.location,
            radius: criteria.searchRadiusKm ? Math.min(criteria.searchRadiusKm, 5) : s.radius
        }));
        
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

        setState((s: any) => ({ ...s, availableCriteria: available, columns: newColumns }));
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetColumnId: ColumnId | 'available') => {
        const criterionId = e.dataTransfer.getData('criterionId');
        if (!criterionId) return;

        let criterion: Criterion | undefined;
        let originColumn: ColumnId | 'available' | undefined;
        
        if (availableCriteria.some((c: Criterion) => c.id === criterionId)) {
            criterion = availableCriteria.find((c: Criterion) => c.id === criterionId);
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

        const newAvailable = [...availableCriteria];
        const newColumns = JSON.parse(JSON.stringify(columns));

        if (originColumn === 'available') {
            const index = newAvailable.findIndex(c => c.id === criterionId);
            if (index > -1) newAvailable.splice(index, 1);
        } else {
            const index = newColumns[originColumn].findIndex((c: Criterion) => c.id === criterionId);
            if (index > -1) newColumns[originColumn].splice(index, 1);
        }

        if (targetColumnId === 'available') {
            newAvailable.push(criterion);
        } else {
            newColumns[targetColumnId].push(criterion);
        }
        
        setState((s: any) => ({ ...s, availableCriteria: newAvailable, columns: newColumns }));
    };

    const handleDeleteCriterion = useCallback((criterionId: string) => {
        let criterionToRemove: Criterion | undefined;
        let originColumn: ColumnId | undefined;

        for (const col of Object.keys(pigeState.columns) as ColumnId[]) {
            const found = pigeState.columns[col].find((c: Criterion) => c.id === criterionId);
            if (found) {
                criterionToRemove = found;
                originColumn = col;
                break;
            }
        }
        if (!criterionToRemove || !originColumn) return;

        const newColumns = { ...pigeState.columns };
        newColumns[originColumn] = newColumns[originColumn].filter((c: Criterion) => c.id !== criterionId);

        let newAvailableCriteria = [...pigeState.availableCriteria];
        const isPredefined = INITIAL_CRITERIA.some(c => c.id === criterionId);
        if (isPredefined && !newAvailableCriteria.some(c => c.id === criterionId)) {
             newAvailableCriteria.push(criterionToRemove);
        }
        
        setState((s: any) => ({ ...s, columns: newColumns, availableCriteria: newAvailableCriteria }));
    }, [pigeState, setState]);
    
    const handleUpdateCriterion = (criterionId: string, value: any) => {
        const updateInArray = (arr: Criterion[]) => arr.map(c => c.id === criterionId ? { ...c, value } : c);
        setState((s: any) => ({
            ...s,
            availableCriteria: updateInArray(s.availableCriteria),
            columns: {
                essentials: updateInArray(s.columns.essentials),
                importants: updateInArray(s.columns.importants),
                secondaries: updateInArray(s.columns.secondaries),
            }
        }));
    };

    const addFreeTextToColumn = (columnId: ColumnId) => {
        if (!freeTextInput.trim()) return;
        const newCriterion: Criterion = {
            id: `freetext-${Date.now()}`,
            label: freeTextInput.trim(),
            type: 'custom',
        };
        setState((s: any) => ({
            ...s,
            columns: { ...s.columns, [columnId]: [...s.columns[columnId], newCriterion] },
            freeTextInput: ''
        }));
    };

    const handleGeolocate = () => {
        setIsLocating(true);
        setLocationError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setState((s: any) => ({ ...s, coordinates: { latitude: pos.coords.latitude, longitude: pos.coords.longitude }, location: "Ma position actuelle" }));
                setIsLocating(false);
            },
            (err) => {
                setLocationError("Géolocalisation refusée. Veuillez l'autoriser dans les paramètres de votre navigateur.");
                setIsLocating(false);
            }
        );
    };
    
    const handleCancel = () => {
        stopPolling();
        setState((s: any) => ({ ...s, isLoading: false, currentSearchId: null, pigeResult: null }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setState((s: any) => ({ ...s, isLoading: true, error: null, pigeResult: null, currentSearchId: null }));

        try {
            const payload = {
                location,
                radius,
                callback_url: `${window.location.origin}/api/pige-results`,
                primordiaux: columns.essentials.map(formatCriterionForN8n),
                importants: columns.importants.map(formatCriterionForN8n),
                bonus: columns.secondaries.map(formatCriterionForN8n)
            };
            const { recherche_id } = await triggerN8nWebhook(n8nWebhookUrl, payload);
            setCurrentSearchId(recherche_id);
            pollForResults(recherche_id);

        } catch (err: any) {
            console.error(err);
            setState((s: any) => ({ ...s, isLoading: false, error: "Une erreur est survenue lors du lancement de la recherche. Détails: " + err.message }));
        }
    };
    

    const handleFieldChange = (field: string, value: any) => {
        setState((s: any) => ({ ...s, [field]: value }));
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
                             <RadioOption name="searchType" value="listings" checked={searchType === 'listings'} onChange={(e) => handleFieldChange('searchType', e.target.value as SearchType)} label="Annonces" />
                             <RadioOption name="searchType" value="agencies" checked={searchType === 'agencies'} onChange={(e) => handleFieldChange('searchType', e.target.value as SearchType)} label="Agences" />
                        </div>
                        <div className="flex-grow relative min-w-[200px]">
                            <label htmlFor="location" className="sr-only">Localisation</label>
                            <input type="text" name="location" id="location" value={location} onChange={(e) => handleFieldChange('location', e.target.value)} className="w-full bg-input p-2 rounded-md border-border pr-10" required />
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
                                onChange={(e) => handleFieldChange('radius', Math.min(50, Number(e.target.value)))} // Increased max radius
                                min="1" 
                                max="50" 
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
                                    Annuler
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
                                <div className="flex-grow relative">
                                    <select 
                                        id="contact-criteria-loader"
                                        value={selectedContactId}
                                        onChange={(e) => handleLoadCriteriaFromContact(e.target.value)}
                                        className="w-full bg-input border-border rounded-md p-2 text-sm appearance-none"
                                    >
                                        <option value="">-- Sélectionner un contact --</option>
                                        {contacts.filter(c => c.searchCriteria).map(c => (
                                            <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-secondary">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                    </div>
                                </div>
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
                                    onChange={(e) => handleFieldChange('freeTextInput', e.target.value)}
                                    rows={3}
                                    className="block w-full bg-input border-border rounded-md p-2 pr-12"
                                    placeholder="Ex: 'proche d'une école primaire', 'sans vis-à-vis', 'dernier étage avec ascenseur'..."
                                    />
                                    <div className="absolute top-2 right-2">
                                    <AudioTranscriber
                                        onTranscriptionUpdate={textChunk => handleFieldChange('freeTextInput', pigeState.freeTextInput + textChunk)}
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
                                        {availableCriteria.map((c: Criterion) => 
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
                        <p className="text-sm text-gray-500">Le workflow n8n a été déclenché. Les résultats apparaîtront ici d'ici 5 à 10 minutes.</p>
                        <p className="text-xs text-gray-600 mt-2">(Vous pouvez quitter cette page et revenir plus tard)</p>
                    </div>
                )}
                {error && <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300"><h4 className="font-bold">Erreur</h4><pre className="whitespace-pre-wrap text-xs">{error}</pre></div>}
                
                {pigeResult && (
                    <div className="bg-surface rounded-lg shadow-lg animate-fade-in">
                        <div className="p-4 border-b border-border">
                             <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-primary">Résultats de la pige (Recherche ID: {pigeResult.data.payload.recherche_id})</h3>
                                <p className="text-xs text-secondary">Reçu le {new Date(pigeResult.receivedAt).toLocaleString('fr-FR')}</p>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-secondary">
                                <StatItem label="Agences Scannées" value={pigeResult.data.payload.stats.agences_scrapees} />
                                <StatItem label="Annonces Trouvées" value={pigeResult.data.payload.stats.annonces_trouvees_total} />
                                <StatItem label="Annonces Uniques" value={pigeResult.data.payload.stats.annonces_apres_deduplication} />
                                <StatItem label="Doublons Supprimés" value={pigeResult.data.payload.stats.doublons_supprimes} />
                            </div>
                        </div>

                       <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                         {pigeResult.data.payload.annonces.sort((a,b) => b.score_compatibilite - a.score_compatibilite).map((annonce, index) => (
                           <ResultAnnonceCard key={annonce.url_annonce || index} annonce={annonce} />
                         ))}
                       </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const StatItem: React.FC<{label: string, value: number}> = ({label, value}) => (
    <div className="flex items-center gap-2">
        <span className="font-semibold text-primary">{value}</span>
        <span className="text-secondary">{label}</span>
    </div>
);

const RadioOption: React.FC<{name: string, value: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, label: string}> = ({ name, value, checked, onChange, label }) => (
    <label className={`flex items-center space-x-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors text-sm font-medium ${checked ? 'bg-brand text-white' : 'hover:bg-surface'}`}>
        <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="hidden" />
        <span>{label}</span>
    </label>
);



    

    