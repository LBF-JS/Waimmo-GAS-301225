
import React from 'react';
import { Listing, Contact, ProjectStatus } from '../types';
import { ExternalLinkIcon } from './Icons';

interface ListingCardProps {
  listing: Listing;
  contacts: Contact[];
  onSave: (listing: Listing, contactId: string) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, contacts, onSave }) => {
  const handleSave = () => {
    // In a real app, this would open a more complex modal.
    // For simplicity, we prompt for a contact ID.
    const activeContacts = contacts.filter(c => c.projectStatus !== ProjectStatus.Termine && c.projectStatus !== ProjectStatus.Perdu);
    if (activeContacts.length === 0) {
        alert("Aucun contact ou prospect actif à qui associer cette annonce.");
        return;
    }
    
    const contactOptions = activeContacts.map(c => `${c.id}: ${c.firstName} ${c.lastName}`).join('\n');
    const contactId = prompt(`À quel contact associer cette annonce ?\n${contactOptions}\n\nEntrez l'ID du contact :`);

    if (contactId) {
      const contactExists = contacts.some(c => c.id === contactId.trim());
      if (contactExists) {
        onSave(listing, contactId.trim());
        alert(`Annonce sauvegardée pour le contact avec l'ID ${contactId.trim()}`);
      } else {
        alert("ID de contact invalide.");
      }
    }
  };

  return (
    <div className="bg-surface rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
      <img src={listing.imageUrl} alt={listing.title} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-lg font-bold text-primary truncate">{listing.title}</h3>
        <p className="text-accent font-semibold my-2 font-lato">{listing.price}</p>
        <div className="flex justify-between items-center mt-4">
            <a 
                href={listing.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center text-sm text-secondary hover:text-accent transition-colors"
            >
                Voir l'annonce <ExternalLinkIcon className="w-4 h-4 ml-1" />
            </a>
            <button
            onClick={handleSave}
            className="bg-brand hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
            Enregistrer
            </button>
        </div>
      </div>
    </div>
  );
};