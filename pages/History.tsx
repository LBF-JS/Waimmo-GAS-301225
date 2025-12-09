
import React from 'react';
import { Contact } from '../types';
import { STATUS_COLORS } from '../constants';

interface HistoryProps {
  contacts: Contact[];
  onSelectContact: (contact: Contact) => void;
}

export const History: React.FC<HistoryProps> = ({ contacts, onSelectContact }) => {
  return (
    <div className="bg-surface p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-primary">Historique des dossiers</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-secondary">
          <thead className="text-xs text-primary uppercase bg-surface-secondary">
            <tr>
              <th scope="col" className="px-6 py-3">Nom</th>
              <th scope="col" className="px-6 py-3">Type de Contact</th>
              <th scope="col" className="px-6 py-3">Budget Max</th>
              <th scope="col" className="px-6 py-3">Statut Final</th>
              <th scope="col" className="px-6 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {contacts.length > 0 ? (
                contacts.map(contact => (
                    <tr key={contact.id} className="bg-surface border-b border-border hover:bg-surface-secondary">
                      <th scope="row" className="px-6 py-4 font-medium text-primary whitespace-nowrap">
                        {contact.firstName} {contact.lastName}
                      </th>
                      <td className="px-6 py-4">{contact.contactType}</td>
                      <td className="px-6 py-4 font-lato font-bold">{contact.budgetMax ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(contact.budgetMax) : 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[contact.projectStatus]}`}>
                          {contact.projectStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => onSelectContact(contact)}
                          className="font-medium text-brand-light hover:underline"
                        >
                          Voir Dossier
                        </button>
                      </td>
                    </tr>
                ))
            ) : (
                <tr>
                    <td colSpan={5} className="text-center py-8 text-secondary italic">
                        Aucun dossier dans l'historique.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};