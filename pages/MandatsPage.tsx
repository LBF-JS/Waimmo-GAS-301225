import React, { useState, useMemo } from 'react';
// FIX: Import missing mandate-related types
import { Mandate, Contact, MandateStatus, MandateType, Remark, AgentInfo, FeeType } from '../types';
// FIX: Import missing mandate-related constants
import { MANDATE_STATUS_COLORS, MANDATE_STATUS_OPTIONS, MANDATE_TYPE_OPTIONS } from '../constants';
import { PencilIcon, TrashIcon, PrinterIcon } from '../components/Icons';
import { MandatFormModal } from '../components/MandatFormModal';
import { MandatDocumentViewer } from '../components/MandatDocumentViewer';
import { MandatDocument } from '../components/MandatDocument';

interface MandatsPageProps {
  mandates: Mandate[];
  contacts: Contact[];
  onAddMandate: (newMandate: Omit<Mandate, 'id'>) => void;
  onUpdateMandate: (updatedMandate: Mandate) => void;
  onDeleteMandate: (mandateId: string) => void;
  onSelectContact: (contact: Contact) => void;
  onUpdateContact: (updatedContact: Contact) => void;
  agentInfo: AgentInfo;
}

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            isActive
                ? 'border-b-2 border-brand text-primary bg-surface'
                : 'text-secondary hover:text-primary bg-transparent'
        }`}
    >
        {label}
    </button>
);


export const MandatsPage: React.FC<MandatsPageProps> = ({ mandates, contacts, onAddMandate, onUpdateMandate, onDeleteMandate, onSelectContact, onUpdateContact, agentInfo }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mandateToEdit, setMandateToEdit] = useState<Mandate | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);
  const [selectedMandateForDoc, setSelectedMandateForDoc] = useState<Mandate | null>(null);
  
  const [activeTab, setActiveTab] = useState<'list' | 'generator'>('list');
  const [generatorMandateId, setGeneratorMandateId] = useState<string>('');


  const handleAddNew = () => {
    setMandateToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (mandate: Mandate) => {
    setMandateToEdit(mandate);
    setIsModalOpen(true);
  };
  
  const handleOpenDocViewer = (mandate: Mandate) => {
    const seller = contacts.find(c => c.id === mandate.contactId);
    if (seller) {
        const remarkText = `Génération du mandat de vente N° ${mandate.mandateNumber || 'N/A'} pour le bien situé à ${mandate.propertyAddress}.`;
        const newRemark: Remark = {
            id: `rem-doc-${Date.now()}`,
            text: remarkText,
            timestamp: new Date(),
        };
        const updatedSeller = {
            ...seller,
            remarks: [newRemark, ...seller.remarks],
            lastUpdateDate: new Date(),
        };
        onUpdateContact(updatedSeller);
    }

    setSelectedMandateForDoc(mandate);
    setIsDocViewerOpen(true);
  };

  const getContactName = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : 'N/A';
  };
  
  const statusCounts = useMemo(() => {
    return mandates.reduce((acc, mandate) => {
      const status = mandate.status as MandateStatus;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<MandateStatus, number>);
  }, [mandates]);

  const typeCounts = useMemo(() => {
    return mandates.reduce((acc, mandate) => {
      const type = mandate.mandateType as MandateType;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<MandateType, number>);
  }, [mandates]);

  const filteredMandates = useMemo(() => {
    return mandates.filter(mandate => {
      const matchesStatus = statusFilter === 'all' || mandate.status === statusFilter;
      const matchesType = typeFilter === 'all' || mandate.mandateType === typeFilter;
      return matchesStatus && matchesType;
    });
  }, [mandates, statusFilter, typeFilter]);

  const handleSave = (mandateData: Omit<Mandate, 'id'> | Mandate) => {
    if ('id' in mandateData) {
        onUpdateMandate(mandateData);
    } else {
        onAddMandate(mandateData);
    }
  };
  
  const selectedSellerForDoc = useMemo(() => {
    if (!selectedMandateForDoc) return null;
    return contacts.find(c => c.id === selectedMandateForDoc.contactId) || null;
  }, [selectedMandateForDoc, contacts]);

  const calculateAndFormatFee = (mandate: Mandate) => {
    if (typeof mandate.fees !== 'number') {
        return 'N/A';
    }

    let calculatedFee: number;

    if (mandate.feeType === FeeType.Pourcentage) {
        calculatedFee = mandate.price * (mandate.fees / 100);
    } else if (mandate.feeType === FeeType.Forfait) {
        calculatedFee = mandate.fees;
    } else {
        return 'N/A';
    }

    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(calculatedFee);
  };
  
  const handlePrintGenerator = () => {
    window.print();
  };

  const selectedMandateForGenerator = useMemo(() => {
    if (!generatorMandateId) return { mandate: null, seller: null };
    const mandate = mandates.find(m => m.id === generatorMandateId);
    if (!mandate) return { mandate: null, seller: null };
    const seller = contacts.find(c => c.id === mandate.contactId);
    return { mandate, seller: seller || null };
  }, [generatorMandateId, mandates, contacts]);


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-secondary">Gérez l'ensemble de vos mandats de vente et de location.</p>
        <button
          onClick={handleAddNew}
          className="bg-brand hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-md"
        >
          + Ajouter un Mandat
        </button>
      </div>

       <div className="border-b border-border">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
              <TabButton label="Liste des Mandats" isActive={activeTab === 'list'} onClick={() => setActiveTab('list')} />
              <TabButton label="Génération de Documents" isActive={activeTab === 'generator'} onClick={() => setActiveTab('generator')} />
          </nav>
      </div>

      {activeTab === 'list' && (
        <div className="bg-surface p-4 rounded-lg shadow-lg animate-fade-in">
            <div className="space-y-4 mb-4 border-b border-border pb-4">
                <div>
                    <h4 className="text-sm font-semibold text-secondary mb-2">Filtrer par statut</h4>
                    <div className="flex flex-wrap gap-2 items-center">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-3 py-1 text-xs rounded-full transition-colors font-medium ${
                                statusFilter === 'all'
                                ? 'bg-brand text-white'
                                : 'bg-surface-secondary text-secondary hover:bg-opacity-80'
                            }`}
                        >
                            Tous les statuts ({mandates.length})
                        </button>
                        {MANDATE_STATUS_OPTIONS.map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                    statusFilter === status
                                    ? `${MANDATE_STATUS_COLORS[status as MandateStatus]}`
                                    : 'bg-surface text-secondary hover:bg-surface-secondary border border-border'
                                }`}
                            >
                                {status} ({statusCounts[status as MandateStatus] || 0})
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-secondary mb-2">Filtrer par type</h4>
                    <div className="flex flex-wrap gap-2 items-center">
                        <button
                            onClick={() => setTypeFilter('all')}
                            className={`px-3 py-1 text-xs rounded-full transition-colors font-medium ${
                                typeFilter === 'all'
                                ? 'bg-brand text-white'
                                : 'bg-surface-secondary text-secondary hover:bg-opacity-80'
                            }`}
                        >
                            Tous les types ({mandates.length})
                        </button>
                        {MANDATE_TYPE_OPTIONS.map(type => (
                            <button
                                key={type}
                                onClick={() => setTypeFilter(type)}
                                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                    typeFilter === type
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-surface text-secondary hover:bg-surface-secondary border border-border'
                                }`}
                            >
                                {type} ({typeCounts[type as MandateType] || 0})
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-secondary">
                <thead className="text-xs text-primary uppercase bg-surface-secondary">
                <tr>
                    <th className="px-6 py-3">Bien / Adresse</th>
                    <th className="px-6 py-3">Vendeur</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Statut</th>
                    <th className="px-6 py-3">Prix</th>
                    <th className="px-6 py-3">Honoraires</th>
                    <th className="px-6 py-3">Fin du mandat</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                </tr>
                </thead>
                <tbody>
                {filteredMandates.length > 0 ? (
                    filteredMandates.map(mandate => (
                    <tr key={mandate.id} className="bg-surface border-b border-border hover:bg-surface-secondary">
                        <td className="px-6 py-4 font-medium text-primary whitespace-nowrap">{mandate.propertyAddress}</td>
                        <td className="px-6 py-4">
                            <button onClick={() => {
                                const contact = contacts.find(c => c.id === mandate.contactId);
                                if (contact) onSelectContact(contact);
                            }} className="hover:underline text-brand-light">
                                {getContactName(mandate.contactId)}
                            </button>
                        </td>
                        <td className="px-6 py-4">{mandate.mandateType}</td>
                        <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${MANDATE_STATUS_COLORS[mandate.status]}`}>
                            {mandate.status}
                        </span>
                        </td>
                        <td className="px-6 py-4 font-lato font-bold">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(mandate.price)}</td>
                        <td className="px-6 py-4 font-lato font-bold text-primary">{calculateAndFormatFee(mandate)}</td>
                        <td className="px-6 py-4">{new Date(mandate.endDate).toLocaleDateString('fr-FR')}</td>
                        <td className="px-6 py-4 text-center">
                        <button onClick={() => handleOpenDocViewer(mandate)} className="p-2 hover:bg-surface-secondary rounded-full" title="Générer le document">
                            <PrinterIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={() => handleEdit(mandate)} className="p-2 hover:bg-surface-secondary rounded-full" title="Modifier">
                            <PencilIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={() => onDeleteMandate(mandate.id)} className="p-2 hover:bg-surface-secondary rounded-full text-red-500" title="Supprimer">
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr>
                    <td colSpan={8} className="text-center py-8 italic">
                        Aucun mandat ne correspond à vos filtres.
                    </td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>
        </div>
      )}

       {activeTab === 'generator' && (
        <div className="bg-surface p-6 rounded-lg shadow-lg animate-fade-in space-y-6">
            <h2 className="text-2xl font-bold text-primary">Générateur de Mandat PDF</h2>
            <p className="text-sm text-secondary -mt-4">Sélectionnez un mandat pour prévisualiser le document et l'imprimer ou le sauvegarder en PDF.</p>
            <div className="flex items-center gap-4 no-print">
                <select
                    value={generatorMandateId}
                    onChange={(e) => setGeneratorMandateId(e.target.value)}
                    className="flex-grow bg-input border-border rounded-md p-2"
                >
                    <option value="">-- Sélectionnez un mandat --</option>
                    {mandates.map(m => (
                        <option key={m.id} value={m.id}>
                            {`N° ${m.mandateNumber || m.id.slice(-5)} - ${m.propertyAddress} (${getContactName(m.contactId)})`}
                        </option>
                    ))}
                </select>
                <button 
                    onClick={handlePrintGenerator} 
                    disabled={!generatorMandateId}
                    className="bg-brand hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-md flex items-center gap-2 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    <PrinterIcon className="w-5 h-5" />
                    Imprimer / PDF
                </button>
            </div>
            
            {selectedMandateForGenerator.mandate && selectedMandateForGenerator.seller ? (
                <MandatDocument 
                    mandate={selectedMandateForGenerator.mandate} 
                    seller={selectedMandateForGenerator.seller} 
                    agentInfo={agentInfo} 
                />
            ) : (
                <div className="text-center py-12 text-secondary border-2 border-dashed border-border rounded-lg">
                    <p>Veuillez sélectionner un mandat pour afficher le document.</p>
                </div>
            )}
        </div>
      )}

      <MandatFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        mandateToEdit={mandateToEdit}
        contacts={contacts}
      />
       <MandatDocumentViewer
        isOpen={isDocViewerOpen}
        onClose={() => setIsDocViewerOpen(false)}
        mandate={selectedMandateForDoc}
        seller={selectedSellerForDoc}
        agentInfo={agentInfo}
      />
    </div>
  );
};
