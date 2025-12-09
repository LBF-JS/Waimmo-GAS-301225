import React, { useState, useMemo, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Contact, SavedListing, Listing, ListingStatus } from '../types';
import { Modal } from '../components/Modal';
import { BookmarkSquareIcon, PlusIcon, SparklesIcon, TrashIcon, ExternalLinkIcon, UserCircleIcon } from '../components/Icons';
import { LISTING_STATUS_OPTIONS, LISTING_STATUS_COLORS } from '../constants';

// --- TYPE DEFINITIONS ---
interface SavedListingsPageProps {
  contacts: Contact[];
  onUpdateContact: (updatedContact: Contact) => void;
  onSelectContact: (contact: Contact) => void;
}

type AnalyzedData = Omit<Listing, 'id'>;

// --- ADD LISTING MODAL ---
const AddListingModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (contactId: string, listingData: AnalyzedData, tag?: string) => void;
  contacts: Contact[];
}> = ({ isOpen, onClose, onSave, contacts }) => {
  const [url, setUrl] = useState('');
  const [contactId, setContactId] = useState('');
  const [tag, setTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzedData, setAnalyzedData] = useState<AnalyzedData | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim() || !url.startsWith('http')) {
      setError("Veuillez entrer une URL valide.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalyzedData(null);

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
        config: { tools: [{ googleSearch: {} }] },
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

      if (parsedResult.title && parsedResult.price && parsedResult.imageUrl) {
        setAnalyzedData({ link: url, ...parsedResult });
      } else {
        throw new Error("Données extraites incomplètes.");
      }
    } catch (err: any) {
      setError("Impossible d'analyser l'URL. Vérifiez le lien ou réessayez. Détails : " + (err.message || 'Format de réponse invalide.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (analyzedData && contactId) {
      onSave(contactId, analyzedData, tag);
    }
  };
  
  const activeContacts = contacts.filter(c => c.projectStatus !== 'Terminé' && c.projectStatus !== 'Perdu');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter une annonce" widthClass="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-secondary">URL de l'annonce</label>
          <div className="flex gap-2 mt-1">
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="flex-grow bg-gray-900 border-gray-700 rounded-md p-2 text-sm" />
            <button type="button" onClick={handleAnalyze} disabled={isLoading} className="bg-brand hover:bg-brand-dark text-white font-bold py-2 px-3 rounded-md text-sm flex items-center justify-center gap-2">
              {isLoading ? (<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>) : <SparklesIcon className="w-4 h-4" />}
              Analyser
            </button>
          </div>
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>

        {analyzedData && (
          <div className="space-y-4 pt-4 border-t border-gray-700 animate-fade-in">
            <div className="flex gap-4 items-start">
                <img src={analyzedData.imageUrl} alt="preview" className="w-24 h-24 object-cover rounded-md" />
                <div>
                    <h4 className="font-bold text-primary">{analyzedData.title}</h4>
                    <p className="text-lg font-semibold text-accent">{analyzedData.price}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={contactId} onChange={(e) => setContactId(e.target.value)} required className="w-full bg-gray-900 border-gray-700 rounded-md p-2 text-sm">
                    <option value="">Associer à un contact...</option>
                    {activeContacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                </select>
                <input type="text" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Tag (ex: Top 3)" className="bg-gray-900 border-gray-700 rounded-md p-2 text-sm" />
            </div>
            <div className="flex justify-end pt-2">
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md">
                    Enregistrer l'annonce
                </button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

// --- LISTING CARD ---
const ListingCard: React.FC<{
  listing: SavedListing & { contact: Contact };
  onUpdate: (updatedListing: SavedListing) => void;
  onDelete: (listingId: string) => void;
  onSelectContact: (contact: Contact) => void;
}> = ({ listing, onUpdate, onDelete, onSelectContact }) => {
  const [isEditingTag, setIsEditingTag] = useState(false);
  const [currentTag, setCurrentTag] = useState(listing.tag || '');
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTag) {
      tagInputRef.current?.focus();
    }
  }, [isEditingTag]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({ ...listing, status: e.target.value as ListingStatus });
  };
  
  const handleTagSave = () => {
    setIsEditingTag(false);
    const newTag = currentTag.trim();
    if (listing.tag !== newTag) {
      onUpdate({ ...listing, tag: newTag || undefined });
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTagSave();
    }
    if (e.key === 'Escape') {
      setCurrentTag(listing.tag || '');
      setIsEditingTag(false);
    }
  };

  const renderTagEditor = () => {
    if (isEditingTag) {
      return (
        <input
          ref={tagInputRef}
          type="text"
          value={currentTag}
          onChange={(e) => setCurrentTag(e.target.value)}
          onBlur={handleTagSave}
          onKeyDown={handleTagKeyDown}
          className="bg-gray-800 text-xs px-2 py-1 rounded-full w-full focus:ring-1 focus:ring-brand"
          placeholder="ex: Top 3, A revoir..."
        />
      );
    }

    if (listing.tag) {
      return (
        <button onClick={() => setIsEditingTag(true)} className="text-xs bg-purple-500/50 text-purple-300 px-2 py-0.5 rounded-full hover:bg-purple-500/70 transition-colors">
          {listing.tag}
        </button>
      );
    }

    return (
      <button onClick={() => setIsEditingTag(true)} className="text-xs text-secondary hover:text-primary transition-colors">
        + Ajouter un tag
      </button>
    );
  };

  return (
    <div className="bg-surface rounded-lg shadow-lg flex flex-col overflow-hidden group">
      <div className="relative">
        <img src={listing.imageUrl} alt={listing.title} className="w-full h-40 object-cover" />
        <div className="absolute top-2 right-2 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <a href={listing.link} target="_blank" rel="noopener noreferrer" className="p-2 bg-black/50 rounded-full text-white hover:bg-brand" title="Voir l'annonce"><ExternalLinkIcon className="w-5 h-5" /></a>
          <button onClick={() => onDelete(listing.id)} className="p-2 bg-black/50 rounded-full text-white hover:bg-red-600" title="Supprimer"><TrashIcon className="w-5 h-5" /></button>
        </div>
      </div>
      <div className="p-3 flex-grow flex flex-col">
        <div className="flex-grow">
            <p className="text-xs text-secondary">{listing.source}</p>
            <h4 className="font-bold text-primary truncate" title={listing.title}>{listing.title}</h4>
            <p className="text-md font-semibold text-accent my-1 font-lato">{listing.price}</p>
            <p className="text-xs text-secondary mt-2" style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {listing.description}
            </p>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-700/50 space-y-2">
            <div className="flex justify-between items-center gap-2">
                <div className="flex-grow min-w-0">{renderTagEditor()}</div>
                 <select value={listing.status} onChange={handleStatusChange} className={`text-xs p-1 rounded-md border-0 appearance-none text-center ${LISTING_STATUS_COLORS[listing.status]}`}>
                    {LISTING_STATUS_OPTIONS.map(opt => <option key={opt} value={opt} className="bg-surface text-primary">{opt}</option>)}
                </select>
            </div>
             <button onClick={() => onSelectContact(listing.contact)} className="flex items-center gap-1.5 text-xs text-secondary hover:text-primary">
                <UserCircleIcon className="w-4 h-4"/>
                <span>{listing.contact.firstName} {listing.contact.lastName}</span>
             </button>
        </div>
      </div>
    </div>
  );
};


// --- MAIN PAGE COMPONENT ---
export const SavedListingsPage: React.FC<SavedListingsPageProps> = ({ contacts, onUpdateContact, onSelectContact }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contactFilter, setContactFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('');

  const allListings = useMemo(() => {
    return contacts.flatMap(c => c.savedListings.map(l => ({ ...l, contact: c }))).sort((a,b) => b.savedDate.getTime() - a.savedDate.getTime());
  }, [contacts]);

  const allTags = useMemo(() => {
    const tags = new Set(allListings.map(l => l.tag).filter(Boolean));
    return Array.from(tags) as string[];
  }, [allListings]);

  const filteredListings = useMemo(() => {
    return allListings.filter(l => {
        const matchesContact = contactFilter === 'all' || l.contactId === contactFilter;
        const matchesTag = !tagFilter || (l.tag && l.tag.toLowerCase().includes(tagFilter.toLowerCase()));
        return matchesContact && matchesTag;
    });
  }, [allListings, contactFilter, tagFilter]);

  const handleSaveListing = (contactId: string, listingData: AnalyzedData, tag?: string) => {
    const contactToUpdate = contacts.find(c => c.id === contactId);
    if (!contactToUpdate) return;

    const newListing: SavedListing = {
      ...listingData,
      id: `listing-${Date.now()}`,
      contactId: contactId,
      savedDate: new Date(),
      status: ListingStatus.Nouveau,
      remarks: [],
      tag: tag || undefined,
    };
    
    const updatedContact = {
        ...contactToUpdate,
        savedListings: [newListing, ...contactToUpdate.savedListings],
    };

    onUpdateContact(updatedContact);
    setIsModalOpen(false);
  };

  const handleUpdateListing = (updatedListing: SavedListing) => {
    const contactToUpdate = contacts.find(c => c.id === updatedListing.contactId);
    if (!contactToUpdate) return;
    const updatedListings = contactToUpdate.savedListings.map(l => l.id === updatedListing.id ? updatedListing : l);
    onUpdateContact({ ...contactToUpdate, savedListings: updatedListings });
  };

  const handleDeleteListing = (listingId: string) => {
    const listing = allListings.find(l => l.id === listingId);
    if (!listing) return;
    const contactToUpdate = contacts.find(c => c.id === listing.contactId);
    if (!contactToUpdate) return;
    const updatedListings = contactToUpdate.savedListings.filter(l => l.id !== listingId);
    onUpdateContact({ ...contactToUpdate, savedListings: updatedListings });
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-surface p-6 rounded-lg shadow-lg flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <BookmarkSquareIcon className="w-8 h-8 text-brand" />
            <h2 className="text-2xl font-bold text-primary">Annonces Enregistrées</h2>
          </div>
          <p className="text-sm text-secondary">Centralisez et gérez toutes les annonces du marché que vous suivez pour vos clients.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-brand hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-md flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Ajouter une annonce
        </button>
      </div>

      <div className="bg-surface p-4 rounded-lg shadow-lg flex flex-col md:flex-row gap-4">
        <select value={contactFilter} onChange={e => setContactFilter(e.target.value)} className="w-full md:w-1/3 bg-gray-900 border-gray-700 rounded-md p-2 text-sm">
            <option value="all">Tous les contacts</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
        </select>
        <input type="text" value={tagFilter} onChange={e => setTagFilter(e.target.value)} placeholder="Filtrer par tag..." className="w-full md:w-1/3 bg-gray-900 border-gray-700 rounded-md p-2 text-sm" />
      </div>

      {filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredListings.map(listing => (
                <ListingCard key={listing.id} listing={listing} onUpdate={handleUpdateListing} onDelete={handleDeleteListing} onSelectContact={onSelectContact} />
            ))}
        </div>
      ) : (
        <div className="text-center p-12 bg-surface rounded-lg">
            <h3 className="text-lg font-medium text-primary">Aucune annonce trouvée</h3>
            <p className="mt-1 text-sm text-secondary">Essayez d'ajuster vos filtres ou d'ajouter une nouvelle annonce.</p>
        </div>
      )}

      <AddListingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveListing} contacts={contacts} />
    </div>
  );
};