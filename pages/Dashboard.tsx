import React, { useState, useMemo } from 'react';
import { Contact, FunnelStage, ProjectStatus, Appointment } from '../types';
import { ClientCard } from '../components/ClientCard';
import { CONTACT_TYPE_OPTIONS, PROJECT_STATUS_OPTIONS, STATUS_COLORS, CONTACT_TYPE_BG_COLORS } from '../constants';
import { Squares2X2Icon, Bars3Icon, ArrowsUpDownIcon, ClockIcon } from '../components/Icons';

interface DashboardProps {
  contacts: Contact[];
  appointments: Appointment[];
  onSelectContact: (contact: Contact) => void;
  onUpdateFunnelStage: (contactId: string, newStage: FunnelStage) => void;
}

type SortKey = keyof Contact | 'nextAppointment';

const BudgetDisplay: React.FC<{ min?: number, max?: number }> = ({ min, max }) => {
    const formatCurrency = (val: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(val);
    
    if (min && max) return <>{formatCurrency(min)} - {formatCurrency(max)}</>;
    if (max) return <>{formatCurrency(max)}</>;
    if (min) return <>À partir de {formatCurrency(min)}</>;
    return <>N/A</>;
}

const getScoreColor = (score: number) => {
    if (score > 85) return 'from-teal-400 to-cyan-500';
    if (score > 70) return 'from-green-400 to-blue-500';
    if (score > 50) return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-pink-500';
};

export const Dashboard: React.FC<DashboardProps> = ({ contacts, appointments, onSelectContact, onUpdateFunnelStage }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isDraggingOverClients, setIsDraggingOverClients] = useState(false);
  const [isDraggingOverProspects, setIsDraggingOverProspects] = useState(false);
  
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' } | null>({ key: 'lastUpdateDate', direction: 'desc' });

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, contactId: string) => {
    e.dataTransfer.setData('contactId', contactId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStage: FunnelStage) => {
    e.preventDefault();
    const contactId = e.dataTransfer.getData('contactId');
    const contact = contacts.find(c => c.id === contactId);
    if (contact && contact.funnelStage !== newStage) {
        onUpdateFunnelStage(contactId, newStage);
    }
    setIsDraggingOverClients(false);
    setIsDraggingOverProspects(false);
  };

  const statusCounts = contacts.reduce((acc, contact) => {
    acc[contact.projectStatus] = (acc[contact.projectStatus] || 0) + 1;
    return acc;
  }, {} as Record<ProjectStatus, number>);


  const getAppointmentInfo = (contactId: string) => {
      const contactAppointments = appointments.filter(a => a.contactId === contactId);
      const upcomingAppointments = contactAppointments
        .filter(a => new Date(a.date) > new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return {
          appointmentCount: contactAppointments.length,
          nextAppointment: upcomingAppointments.length > 0 ? upcomingAppointments[0] : undefined,
      };
  };
  
  const filteredContacts = useMemo(() => contacts.filter(contact => {
    const matchesSearch = `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contact.projectStatus === statusFilter;
    const matchesType = typeFilter === 'all' || contact.contactType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  }), [contacts, searchQuery, statusFilter, typeFilter]);
  
  const sortedContacts = useMemo(() => {
    let sortableItems = [...filteredContacts];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'nextAppointment') {
            aValue = getAppointmentInfo(a.id).nextAppointment?.date;
            bValue = getAppointmentInfo(b.id).nextAppointment?.date;
            if (!aValue) return 1;
            if (!bValue) return -1;
        } else {
            aValue = a[sortConfig.key as keyof Contact];
            bValue = b[sortConfig.key as keyof Contact];
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredContacts, sortConfig, appointments]);

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const prospects = sortedContacts.filter(c => c.funnelStage === FunnelStage.Prospect);
  const currentClients = sortedContacts.filter(c => c.funnelStage === FunnelStage.Client);

  return (
    <div>
      <p className="text-secondary -mt-4 mb-6">
        Organisez et suivez vos contacts. Changez de vue pour une analyse détaillée ou utilisez le glisser-déposer pour faire avancer vos dossiers.
      </p>
      <div className="bg-surface p-4 rounded-lg shadow-lg mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center flex-grow">
                <div className="flex-grow min-w-[200px]">
                  <label htmlFor="search" className="sr-only">Rechercher un contact</label>
                  <input
                    type="text"
                    id="search"
                    placeholder="Rechercher un contact..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-input border-border rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm text-primary p-2"
                  />
                </div>
                <div className="flex-grow min-w-[150px]">
                  <label htmlFor="typeFilter" className="sr-only">Filtrer par type</label>
                  <select
                    id="typeFilter"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full bg-input border-border rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm text-primary p-2"
                  >
                    <option value="all">Tous les types</option>
                    {CONTACT_TYPE_OPTIONS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
            </div>
             <div className="flex items-center space-x-1 bg-background p-1 rounded-lg">
                <button onClick={() => setViewMode('cards')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'cards' ? 'bg-brand text-white' : 'text-secondary hover:bg-surface-secondary'}`} aria-label="Vue cartes">
                    <Squares2X2Icon className="w-5 h-5" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-brand text-white' : 'text-secondary hover:bg-surface-secondary'}`} aria-label="Vue liste">
                    <Bars3Icon className="w-5 h-5" />
                </button>
            </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center pt-3 border-t border-border">
             <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 text-sm rounded-full transition-colors font-medium ${
                    statusFilter === 'all'
                    ? 'bg-brand text-white'
                    : 'bg-surface-secondary text-secondary hover:bg-opacity-80'
                }`}
                >
                Tous ({contacts.length})
            </button>
            {PROJECT_STATUS_OPTIONS.map(status => (
                <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors border ${
                        statusFilter === status
                        ? `${STATUS_COLORS[status]} border-transparent font-semibold`
                        : 'bg-surface text-secondary hover:bg-surface-secondary border-border'
                    }`}
                >
                    {status} ({statusCounts[status] || 0})
                </button>
            ))}
        </div>
      </div>

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div
            onDrop={(e) => handleDrop(e, FunnelStage.Prospect)}
            onDragOver={handleDragOver}
            onDragEnter={() => setIsDraggingOverProspects(true)}
            onDragLeave={() => setIsDraggingOverProspects(false)}
            className={`p-1 rounded-lg transition-all duration-300 ${isDraggingOverProspects ? 'bg-brand-dark/30 ring-2 ring-brand' : ''}`}
          >
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-brand text-primary">
              Prospects ({prospects.length})
            </h2>
            <div className="space-y-4 max-h-[calc(100vh-22rem)] overflow-y-auto pr-2">
              {prospects.length > 0 ? (
                  prospects.map(contact => {
                      const { appointmentCount, nextAppointment } = getAppointmentInfo(contact.id);
                      return (
                          <ClientCard 
                              key={contact.id} 
                              contact={contact} 
                              onClick={() => onSelectContact(contact)} 
                              onDragStart={handleDragStart}
                              appointmentCount={appointmentCount}
                              nextAppointment={nextAppointment}
                          />
                      );
                  })
              ) : (
                  <p className="text-secondary italic mt-4 text-center p-4">Aucun prospect correspondant.</p>
              )}
            </div>
          </div>

          <div
              onDrop={(e) => handleDrop(e, FunnelStage.Client)}
              onDragOver={handleDragOver}
              onDragEnter={() => setIsDraggingOverClients(true)}
              onDragLeave={() => setIsDraggingOverClients(false)}
              className={`p-1 rounded-lg transition-all duration-300 ${isDraggingOverClients ? 'bg-green-500/30 ring-2 ring-green-500' : ''}`}
          >
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-green-500 text-primary">
              Clients ({currentClients.length})
            </h2>
            <div className="space-y-4 max-h-[calc(100vh-22rem)] overflow-y-auto pr-2">
              {currentClients.length > 0 ? (
                  currentClients.map(contact => {
                      const { appointmentCount, nextAppointment } = getAppointmentInfo(contact.id);
                      return (
                          <ClientCard 
                              key={contact.id} 
                              contact={contact} 
                              onClick={() => onSelectContact(contact)} 
                              onDragStart={handleDragStart}
                              appointmentCount={appointmentCount}
                              nextAppointment={nextAppointment}
                          />
                      );
                  })
              ) : (
                  <p className="text-secondary italic mt-4 text-center p-4">Aucun client correspondant.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-surface rounded-lg shadow-lg overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-secondary">
              <thead className="text-xs text-primary uppercase bg-surface-secondary">
                <tr>
                  <SortableHeader name="Nom" sortKey="lastName" requestSort={requestSort} sortConfig={sortConfig} />
                  <SortableHeader name="Type" sortKey="contactType" requestSort={requestSort} sortConfig={sortConfig} />
                  <SortableHeader name="Étape" sortKey="funnelStage" requestSort={requestSort} sortConfig={sortConfig} />
                  <SortableHeader name="Statut" sortKey="projectStatus" requestSort={requestSort} sortConfig={sortConfig} />
                  <SortableHeader name="Budget Max" sortKey="budgetMax" requestSort={requestSort} sortConfig={sortConfig} />
                  <SortableHeader name="Score" sortKey="compatibilityScore" requestSort={requestSort} sortConfig={sortConfig} />
                  <SortableHeader name="Prochain RDV" sortKey="nextAppointment" requestSort={requestSort} sortConfig={sortConfig} />
                </tr>
              </thead>
              <tbody>
                {sortedContacts.length > 0 ? sortedContacts.map(contact => {
                    const { nextAppointment } = getAppointmentInfo(contact.id);
                    return (
                        <tr key={contact.id} onClick={() => onSelectContact(contact)} className="bg-surface border-b border-border hover:bg-surface-secondary cursor-pointer">
                            <td className="px-6 py-4 font-medium text-primary whitespace-nowrap">{contact.firstName} {contact.lastName}</td>
                            <td className="px-6 py-4">
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${CONTACT_TYPE_BG_COLORS[contact.contactType]}`}>{contact.contactType}</span>
                            </td>
                            <td className="px-6 py-4">{contact.funnelStage}</td>
                            <td className="px-6 py-4">
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[contact.projectStatus]}`}>{contact.projectStatus}</span>
                            </td>
                            <td className="px-6 py-4 font-lato font-bold"><BudgetDisplay min={contact.budgetMin} max={contact.budgetMax} /></td>
                            <td className="px-6 py-4">
                                {contact.compatibilityScore && (
                                    <div className="flex items-center" title={`Score: ${contact.compatibilityScore}%`}>
                                        <div className="w-full bg-surface-secondary rounded-full h-2 mr-2">
                                            <div className={`bg-gradient-to-r ${getScoreColor(contact.compatibilityScore)} h-2 rounded-full`} style={{ width: `${contact.compatibilityScore}%` }}></div>
                                        </div>
                                        <span className="font-lato font-semibold text-primary w-8 text-right">{contact.compatibilityScore}%</span>
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                {nextAppointment ? (
                                    <div className="flex items-center gap-2 text-accent font-semibold">
                                        <ClockIcon className="w-4 h-4"/>
                                        <span>{new Date(nextAppointment.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} {new Date(nextAppointment.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                ) : '-'}
                            </td>
                        </tr>
                    )
                }) : (
                    <tr><td colSpan={7} className="text-center p-8 italic">Aucun contact correspondant.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const SortableHeader: React.FC<{ name: string; sortKey: SortKey, requestSort: (key: SortKey) => void; sortConfig: { key: SortKey; direction: 'asc' | 'desc'; } | null; }> = ({ name, sortKey, requestSort, sortConfig }) => {
    const isSorted = sortConfig?.key === sortKey;
    return (
        <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort(sortKey)}>
            <div className="flex items-center gap-2">
                {name}
                <span className={`transition-opacity ${isSorted ? 'opacity-100' : 'opacity-30 hover:opacity-100'}`}>
                    {isSorted ? (sortConfig?.direction === 'asc' ? '▲' : '▼') : <ArrowsUpDownIcon className="w-4 h-4"/>}
                </span>
            </div>
        </th>
    );
};