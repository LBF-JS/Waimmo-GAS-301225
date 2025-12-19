import React, { useState, useEffect, useMemo } from 'react';
import { Contact, Remark, ProjectStatus, FunnelStage, AssociatedDocument, DocumentType, Appointment, VisitReport, SavedAnnonce, ProjectPriority, SavedListing, TimelineEvent, Estimation, ContactType, SearchCriteria, PropertyType, PropertyStyle } from '../types';
import { Modal } from './Modal';
// FIX: Import `ExternalLinkIcon` to resolve the "Cannot find name" error.
import { DocumentTextIcon, EyeIcon, TrashIcon, DocumentPlusIcon, ChevronDownIcon, ClockIcon, PencilIcon, DocumentChartBarIcon, BookmarkSquareIcon, CheckCircleIcon, XCircleIcon, ExternalLinkIcon, UserPlusIcon, ChatBubbleLeftEllipsisIcon, CalendarDaysIcon } from './Icons';
import { PROJECT_STATUS_OPTIONS, STATUS_COLORS, FUNNEL_STAGE_OPTIONS, DOCUMENT_TYPE_OPTIONS, APPOINTMENT_STATUS_COLORS, PROJECT_PRIORITY_OPTIONS, CONTACT_TYPE_OPTIONS, CONTACT_TYPE_BG_COLORS, PROPERTY_TYPE_OPTIONS, IMPORTANT_FEATURES_OPTIONS, PROPERTY_STYLE_OPTIONS } from '../constants';
import { AppointmentModal } from './AppointmentModal';
import { AssociatedListingsTab } from './AssociatedListingsTab';

interface ClientDetailModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateContact: (updatedContact: Contact) => void;
  onDeleteContact: (contactId: string) => void;
  contacts: Contact[];
  appointments: Appointment[];
  reports: VisitReport[];
  estimations: Estimation[];
  savedAnnonces: SavedAnnonce[];
  onAddAppointment: (newAppointment: Omit<Appointment, 'id'>) => void;
  onUpdateAppointment: (updatedAppointment: Appointment) => void;
  onDeleteAppointment: (appointmentId: string) => void;
  onOpenNewReportModal: (initialData?: Partial<Omit<VisitReport, 'id' | 'creationDate'>>) => void;
}

const fileToBase64 = (file: File): Promise<{ data: string, mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const [header, data] = result.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1] || file.type;
            resolve({ data, mimeType });
        };
        reader.onerror = error => reject(error);
    });
};

const AppointmentFollowUpCard: React.FC<{
    appointment: Appointment;
    linkedReport: VisitReport | undefined;
    linkedListing: SavedListing | undefined;
    onEdit: (appointment: Appointment) => void;
    onDelete: () => void;
    onAddReport: () => void;
}> = ({ appointment, linkedReport, linkedListing, onEdit, onDelete, onAddReport }) => {
    const appointmentDate = new Date(appointment.date);
    const isPast = appointmentDate < new Date();
    const annonceUrl = appointment.annonceUrl;
    
    return (
        <div className={`p-3 bg-surface rounded-lg border-l-4 ${isPast ? 'border-secondary' : 'border-brand'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h5 className="font-semibold text-primary">{appointment.title}</h5>
                    <div className="flex items-center gap-2 text-xs text-secondary mt-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>{appointmentDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} à {appointmentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
                 <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${APPOINTMENT_STATUS_COLORS[appointment.status]}`}>
                        {appointment.status}
                    </span>
                    <button onClick={() => onEdit(appointment)} className="p-1.5 text-secondary hover:text-primary"><PencilIcon className="w-4 h-4"/></button>
                    <button onClick={onDelete} className="p-1.5 text-red-500 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
                </div>
            </div>
            <div className="mt-2 pt-2 border-t border-border/50 space-y-2">
                {linkedReport && (
                    <div className="flex items-center gap-2 text-sm text-teal-300">
                        <DocumentChartBarIcon className="w-4 h-4"/>
                        <span>Compte Rendu: "{linkedReport.title}"</span>
                    </div>
                )}
                {(linkedListing || annonceUrl) && (
                    <div className="flex items-center gap-2 text-sm text-sky-300">
                        <BookmarkSquareIcon className="w-4 h-4"/>
                        {linkedListing ? (
                             <a href={linkedListing.link} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                                Annonce liée: "{linkedListing.title}" <ExternalLinkIcon className="w-4 h-4"/>
                            </a>
                        ) : (
                            <a href={annonceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                                Voir l'annonce externe <ExternalLinkIcon className="w-4 h-4"/>
                            </a>
                        )}
                    </div>
                )}
                {isPast && !linkedReport && (
                    <button
                        onClick={onAddReport}
                        className="inline-flex items-center gap-2 text-xs text-white bg-green-600 hover:bg-green-700 transition-colors font-semibold px-2.5 py-1.5 rounded-md"
                    >
                        <DocumentPlusIcon className="w-4 h-4" />
                        Créer un compte rendu
                    </button>
                )}
            </div>
        </div>
    );
};

const EstimationCard: React.FC<{ estimation: Estimation }> = ({ estimation }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-surface p-4 rounded-lg">
            <div className="flex justify-between items-start cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div>
                    <h4 className="font-bold text-primary">{estimation.address}</h4>
                    <p className="text-xs text-secondary">
                        Estimé le: {new Date(estimation.estimationDate).toLocaleDateString('fr-FR')}
                    </p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                     <p className="text-lg font-bold text-brand-light">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(estimation.estimatedPriceMedian)}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-secondary justify-end">
                        <span>Détails</span>
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </div>
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-border animate-fade-in">
                     {estimation.summary && (
                        <div className="mb-4 bg-background p-3 rounded-md">
                            <h5 className="font-semibold text-primary mb-2 text-sm">Points Clés</h5>
                            <div 
                                className="prose prose-sm dark:prose-invert max-w-none text-secondary prose-p:my-1 prose-ul:my-1 prose-li:my-0" 
                                dangerouslySetInnerHTML={{ __html: estimation.summary.replace(/- /g, '<ul><li>').replace(/\n/g, '</li></ul><ul><li>') + '</li></ul>' }} 
                            />
                        </div>
                    )}
                    <h5 className="font-semibold text-primary mb-2 text-sm">Analyse Détaillée</h5>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-secondary whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: estimation.analysis.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} />
                </div>
            )}
        </div>
    );
};


export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({ 
    contact, 
    isOpen, 
    onClose, 
    onUpdateContact, 
    onDeleteContact, 
    contacts, 
    appointments, 
    reports,
    estimations,
    savedAnnonces,
    onAddAppointment, 
    onUpdateAppointment, 
    onDeleteAppointment,
    onOpenNewReportModal
}) => {
  const [remarkText, setRemarkText] = useState('');
  const [activeTab, setActiveTab] = useState('dossier');
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);

  // Edit mode state for left panel
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Contact>>({});
  
  const timelineEvents = useMemo(() => {
    if (!contact) return [];
    
    const events: TimelineEvent[] = [];

    // 1. Creation Event
    events.push({
      id: `creation-${contact.id}`,
      type: 'creation',
      date: new Date(contact.creationDate),
      title: 'Création du dossier',
      content: `Le dossier pour ${contact.firstName} ${contact.lastName} a été créé.`,
      icon: UserPlusIcon,
      color: 'green',
    });

    // 2. Remarks
    contact.remarks.forEach(remark => {
      events.push({
        id: remark.id,
        type: 'remark',
        date: new Date(remark.timestamp),
        title: 'Remarque ajoutée',
        content: remark.text,
        icon: ChatBubbleLeftEllipsisIcon,
        color: 'blue',
        relatedId: remark.id,
      });
    });

    // 3. Appointments
    appointments
      .filter(a => a.contactId === contact.id)
      .forEach(appt => {
        events.push({
          id: appt.id,
          type: 'appointment',
          date: new Date(appt.date),
          title: `Rendez-vous : ${appt.title}`,
          content: appt.notes,
          icon: CalendarDaysIcon,
          color: 'purple',
          relatedId: appt.id,
        });
      });
      
    // 4. Reports
    reports
        .filter(r => r.buyerContactId === contact.id || r.sellerContactId === contact.id)
        .forEach(report => {
            events.push({
                id: report.id,
                type: 'report',
                date: new Date(report.date),
                title: `Compte Rendu : ${report.title}`,
                content: report.generalFeedback,
                icon: DocumentChartBarIcon,
                color: 'orange',
                relatedId: report.id,
            });
        });

    return events.sort((a, b) => b.date.getTime() - a.date.getTime());

  }, [contact, appointments, reports]);


  useEffect(() => {
      if (!isOpen) {
        setActiveTab('dossier');
        setIsEditing(false); // Reset edit mode on close
      }
  }, [isOpen]);


  if (!isOpen || !contact) return null;

  const handleAddRemark = () => {
    if (remarkText.trim()) {
      const newRemark: Remark = {
        id: `rem-${Date.now()}`,
        text: remarkText,
        timestamp: new Date(),
      };
      onUpdateContact({
        ...contact,
        remarks: [newRemark, ...contact.remarks],
        lastUpdateDate: new Date(),
      });
      setRemarkText('');
    }
  };
  
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as ProjectStatus;
    if(isEditing) {
        setEditFormData(prev => ({ ...prev, projectStatus: newStatus }));
    } else {
        onUpdateContact({ ...contact, projectStatus: newStatus, lastUpdateDate: new Date() });
    }
  };
  
  const handleFunnelStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStage = e.target.value as FunnelStage;
     if(isEditing) {
        setEditFormData(prev => ({ ...prev, funnelStage: newStage }));
    } else {
        onUpdateContact({ ...contact, funnelStage: newStage, lastUpdateDate: new Date() });
    }
  };
  
  const handleDelete = () => {
      if (window.confirm(`Êtes-vous sûr de vouloir supprimer le dossier de ${contact.firstName} ${contact.lastName} ? Cette action est irréversible.`)) {
          onDeleteContact(contact.id);
          onClose();
      }
  }

  const handleAddDocument = async (file: File, name: string, type: DocumentType) => {
    try {
        const { data, mimeType } = await fileToBase64(file);
        const newDoc: AssociatedDocument = {
            id: `doc-${Date.now()}`,
            name,
            type,
            fileData: data,
            mimeType,
            addedDate: new Date(),
        };
        onUpdateContact({ ...contact, documents: [...(contact.documents || []), newDoc], lastUpdateDate: new Date() });
    } catch (error) {
        console.error("Error adding document:", error);
        alert("Une erreur est survenue lors de l'ajout du document.");
    }
  };

  const handleDeleteDocument = (docId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
        onUpdateContact({ ...contact, documents: contact.documents.filter(d => d.id !== docId), lastUpdateDate: new Date() });
    }
  };

  const handleViewDocument = (doc: AssociatedDocument) => {
    const dataUrl = `data:${doc.mimeType};base64,${doc.fileData}`;
    window.open(dataUrl, '_blank');
  };

  const formatCurrency = (val?: number) => val ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(val) : 'N/A';

  const handleOpenNewAppointmentModal = () => {
    setAppointmentToEdit(null);
    setIsAppointmentModalOpen(true);
  };

  const handleOpenEditAppointmentModal = (appointment: Appointment) => {
    setAppointmentToEdit(appointment);
    setIsAppointmentModalOpen(true);
  };

  // --- Edit Mode Handlers ---
  const handleEditClick = () => {
    setIsEditing(true);
    setEditFormData({ ...contact });
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({});
  };
  
  const handleSaveEdit = () => {
    onUpdateContact({ ...contact, ...editFormData, lastUpdateDate: new Date() } as Contact);
    setIsEditing(false);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isNumber = type === 'number';
    setEditFormData(prev => ({
        ...prev,
        [name]: isNumber ? (value ? parseFloat(value) : undefined) : value,
    }));
  };
  
  const currentStatus = isEditing ? editFormData.projectStatus : contact.projectStatus;
  const currentFunnelStage = isEditing ? editFormData.funnelStage : contact.funnelStage;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Dossier Client : ${contact.firstName} ${contact.lastName}`} widthClass="max-w-6xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Main Info */}
        <div className="md:col-span-1 space-y-4">
          <div className="flex items-center space-x-4">
            <img src={contact.avatarUrl || `https://ui-avatars.com/api/?name=${contact.firstName}+${contact.lastName}&background=374151&color=fff`} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
            <div className="flex-grow">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-primary">{contact.firstName} {contact.lastName}</h3>
                    <div className="flex items-center space-x-2">
                        {isEditing ? (
                            <>
                                <button onClick={handleSaveEdit} title="Enregistrer" className="p-1.5 text-green-400 hover:text-green-300"><CheckCircleIcon className="w-5 h-5"/></button>
                                <button onClick={handleCancelEdit} title="Annuler" className="p-1.5 text-red-500 hover:text-red-400"><XCircleIcon className="w-5 h-5"/></button>
                            </>
                        ) : (
                            <button onClick={handleEditClick} title="Modifier" className="p-1.5 text-secondary hover:text-primary"><PencilIcon className="w-5 h-5"/></button>
                        )}
                    </div>
                </div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
             <InfoRow label="Statut" value={
                <select value={currentStatus} onChange={handleStatusChange} className={`w-full p-1 rounded-md text-sm border-0 appearance-none text-center ${STATUS_COLORS[currentStatus || ProjectStatus.Nouveau]}`}>
                    {PROJECT_STATUS_OPTIONS.map(opt => <option key={opt} value={opt} className="bg-surface text-primary">{opt}</option>)}
                </select>
             } />
             <InfoRow label="Étape" value={
                <select value={currentFunnelStage} onChange={handleFunnelStageChange} className="w-full p-1 rounded-md text-sm border-2 bg-surface border-border">
                    {FUNNEL_STAGE_OPTIONS.map(opt => <option key={opt} value={opt} className="bg-surface text-primary">{opt}</option>)}
                </select>
             } />
            <InfoRow label="Type" value={isEditing ? 
                <EditableSelectField 
                    name="contactType" 
                    value={editFormData.contactType || ContactType.Acquereur} 
                    onChange={handleEditFormChange} 
                    options={CONTACT_TYPE_OPTIONS} 
                /> 
                : 
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${CONTACT_TYPE_BG_COLORS[contact.contactType]}`}>
                    {contact.contactType}
                </span>
            } />
             <InfoRow label="Téléphone" value={isEditing ? <EditableInputField name="phone1" type="tel" value={editFormData.phone1 || ''} onChange={handleEditFormChange} /> : contact.phone1} />
             <InfoRow label="Email" value={isEditing ? <EditableInputField name="email1" type="email" value={editFormData.email1 || ''} onChange={handleEditFormChange} /> : contact.email1} />
             <InfoRow label="Budget" value={isEditing ? 
                <div className="flex items-center gap-2">
                    <EditableInputField name="budgetMin" type="number" placeholder="Min" value={editFormData.budgetMin || ''} onChange={handleEditFormChange} className="w-1/2" />
                    <EditableInputField name="budgetMax" type="number" placeholder="Max" value={editFormData.budgetMax || ''} onChange={handleEditFormChange} className="w-1/2" />
                </div>
                : <span className="font-lato font-bold">{`${formatCurrency(contact.budgetMin)} - ${formatCurrency(contact.budgetMax)}`}</span>} 
             />
             <InfoRow label="Priorité" value={isEditing ? <EditableSelectField name="projectPriority" value={editFormData.projectPriority || ProjectPriority.Moyenne} onChange={handleEditFormChange} options={PROJECT_PRIORITY_OPTIONS} /> : contact.projectPriority || 'N/A'} />
             <InfoRow label="Dossier créé le" value={new Date(contact.creationDate).toLocaleDateString('fr-FR')} />
             <InfoRow label="Dernière MàJ" value={new Date(contact.lastUpdateDate).toLocaleDateString('fr-FR')} />
          </div>
           <button onClick={handleDelete} className="w-full text-center text-sm text-red-500 hover:text-red-400 hover:underline py-2">
                Supprimer le dossier
            </button>
        </div>

        {/* Right Column: Tabbed Content */}
        <div className="md:col-span-2 space-y-4">
            <div className="border-b border-border">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <TabButton name="dossier" activeTab={activeTab} setActiveTab={setActiveTab}>Suivi</TabButton>
                    <TabButton name="criteres" activeTab={activeTab} setActiveTab={setActiveTab}>Critères</TabButton>
                    <TabButton name="annonces" activeTab={activeTab} setActiveTab={setActiveTab}>Annonces ({contact.savedListings.length})</TabButton>
                    <TabButton name="suivi" activeTab={activeTab} setActiveTab={setActiveTab}>A venir</TabButton>
                    <TabButton name="estimations" activeTab={activeTab} setActiveTab={setActiveTab}>Estimations</TabButton>
                    <TabButton name="documents" activeTab={activeTab} setActiveTab={setActiveTab}>Documents</TabButton>
                </nav>
            </div>
            
            {activeTab === 'dossier' && (
                <div className="space-y-6 animate-fade-in">
                    <div>
                        <h4 className="text-lg font-semibold text-primary mb-2">Ajouter une remarque / un suivi</h4>
                         <div className="space-y-2">
                            <textarea 
                                value={remarkText}
                                onChange={(e) => setRemarkText(e.target.value)}
                                rows={3}
                                placeholder="Notez ici les détails d'un appel, un email, ou toute information pertinente..."
                                className="w-full bg-input border-border rounded-md p-2 text-sm"
                            />
                            <button onClick={handleAddRemark} className="bg-brand hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-md text-sm">
                                Ajouter à la timeline
                            </button>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="text-lg font-semibold text-primary mb-2">Historique du dossier</h4>
                        <div className="relative pl-8 border-l-2 border-border max-h-96 overflow-y-auto pr-2">
                            {timelineEvents.length > 0 ? (
                                timelineEvents.map(event => (
                                    <TimelineEventCard key={event.id} event={event} />
                                ))
                            ) : (
                                <p className="text-sm text-secondary italic text-center py-4">Aucun événement pour ce contact.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'criteres' && (
                <div className="animate-fade-in">
                    <CriteriaTab
                        contact={contact}
                        onUpdateContact={onUpdateContact}
                    />
                </div>
            )}
             {activeTab === 'annonces' && (
                <div className="animate-fade-in">
                    <AssociatedListingsTab contact={contact} onUpdateContact={onUpdateContact} />
                </div>
            )}
             {activeTab === 'suivi' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <h4 className="text-lg font-semibold text-primary">Historique des rendez-vous</h4>
                        <button onClick={handleOpenNewAppointmentModal} className="bg-brand hover:bg-brand-dark text-white font-bold py-1.5 px-3 rounded-md text-sm">
                            Ajouter un RDV
                        </button>
                    </div>

                    <div className="max-h-[26rem] overflow-y-auto space-y-3 bg-background p-3 rounded-lg">
                        {(() => {
                            const clientAppointments = appointments
                                .filter(a => a.contactId === contact.id)
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                            
                            if (clientAppointments.length === 0) {
                                return <p className="text-sm text-secondary italic text-center py-4">Aucun rendez-vous pour ce contact.</p>;
                            }
                            
                            return clientAppointments.map(app => {
                                const linkedReport = reports.find(r => r.linkedAppointmentId === app.id);
                                const linkedListing = contact.savedListings.find(l => l.id === app.linkedAnnonceId);
                                
                                const handleCreateReportFromAppointment = () => {
                                    onOpenNewReportModal({
                                        buyerContactId: contact.id,
                                        linkedAppointmentId: app.id,
                                        date: app.date,
                                        title: `CR Visite - ${app.title}`,
                                        propertyAddress: app.title,
                                    });
                                };

                                return (
                                    <AppointmentFollowUpCard 
                                        key={app.id}
                                        appointment={app}
                                        linkedReport={linkedReport}
                                        linkedListing={linkedListing}
                                        onEdit={handleOpenEditAppointmentModal}
                                        onDelete={() => {
                                            if (window.confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")) {
                                                onDeleteAppointment(app.id);
                                            }
                                        }}
                                        onAddReport={handleCreateReportFromAppointment}
                                    />
                                );
                            });
                        })()}
                    </div>
                </div>
            )}
             {activeTab === 'estimations' && (
                <div className="space-y-4 animate-fade-in max-h-[26rem] overflow-y-auto bg-background p-3 rounded-lg">
                    {(() => {
                        const contactEstimations = estimations
                            .filter(e => e.contactId === contact.id)
                            .sort((a, b) => new Date(b.estimationDate).getTime() - new Date(a.estimationDate).getTime());

                        if (contactEstimations.length === 0) {
                            return <p className="text-center text-secondary italic py-8">Aucune estimation enregistrée pour ce contact.</p>;
                        }

                        return contactEstimations.map(est => <EstimationCard key={est.id} estimation={est} />);
                    })()}
                </div>
            )}
             {activeTab === 'documents' && (
                <div className="space-y-6 animate-fade-in">
                    <AddDocumentForm onAdd={handleAddDocument} />
                    <div>
                        <h4 className="text-lg font-semibold text-primary mb-2">Documents associés</h4>
                        <div className="max-h-96 overflow-y-auto space-y-3 bg-background p-3 rounded-lg">
                           {(contact.documents || []).length > 0 ? (
                                contact.documents.map(doc => (
                                    <div key={doc.id} className="flex items-center space-x-3 p-2 bg-surface rounded">
                                        <DocumentTextIcon className="w-6 h-6 text-secondary flex-shrink-0" />
                                        <div className="flex-grow">
                                            <p className="font-semibold text-primary text-sm truncate">{doc.name}</p>
                                            <p className="text-xs text-secondary">{doc.type} - Ajouté le {new Date(doc.addedDate).toLocaleDateString('fr-FR')}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button onClick={() => handleViewDocument(doc)} className="p-2 text-secondary hover:text-primary"><EyeIcon className="w-5 h-5"/></button>
                                            <button onClick={() => handleDeleteDocument(doc.id)} className="p-2 text-red-500 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                                        </div>
                                    </div>
                                ))
                           ) : (
                                <p className="text-sm text-secondary italic text-center py-4">Aucun document pour ce contact.</p>
                           )}
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
       <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        contacts={contacts}
        onAdd={onAddAppointment}
        onUpdate={onUpdateAppointment}
        appointmentToEdit={appointmentToEdit}
        initialContactId={contact.id}
        savedAnnonces={savedAnnonces}
      />
    </Modal>
  );
};

const TIMELINE_COLORS = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
};

const TimelineEventCard: React.FC<{ event: TimelineEvent }> = ({ event }) => {
    const Icon = event.icon;
    const bgColor = TIMELINE_COLORS[event.color as keyof typeof TIMELINE_COLORS] || 'bg-secondary';

    return (
        <div className="relative mb-6">
            {/* Icon on the timeline */}
            <div className="absolute -left-[20px] top-1">
                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-surface ${bgColor}`}>
                    <Icon className="h-5 w-5 text-white" />
                </span>
            </div>
            {/* Content box */}
            <div className={`ml-8 p-3 bg-surface rounded-lg shadow-sm border-t-2 border-${event.color}-500`}>
                <div className="flex justify-between items-center mb-1">
                    <h5 className="font-bold text-primary text-md">{event.title}</h5>
                    <time className="text-xs font-medium text-secondary">
                        {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </time>
                </div>
                {event.content && (
                    <p className="text-sm text-secondary whitespace-pre-wrap">{event.content}</p>
                )}
            </div>
        </div>
    );
};


const InfoRow: React.FC<{label: string, value: React.ReactNode}> = ({ label, value }) => (
    <div className="grid grid-cols-2 items-center border-b border-border py-1.5 min-h-[38px]">
        <span className="text-secondary">{label}</span>
        <div className="text-primary text-right font-medium">{value}</div>
    </div>
);

const EditableInputField: React.FC<React.ComponentProps<'input'>> = (props) => (
    <input {...props} className={`bg-input border border-border rounded-md p-1 text-sm w-full text-right focus:ring-1 focus:ring-brand focus:border-brand ${props.type === 'number' ? 'font-lato font-bold' : ''} ${props.className}`} />
);

const EditableSelectField: React.FC<React.ComponentProps<'select'> & { options: string[] }> = ({ options, ...props }) => (
    <select {...props} className="bg-input border border-border rounded-md p-1 text-sm w-full text-right focus:ring-1 focus:ring-brand focus:border-brand">
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
);


const TabButton: React.FC<{name: string, activeTab: string, setActiveTab: (name: string) => void, children: React.ReactNode}> = ({ name, activeTab, setActiveTab, children }) => (
    <button
        onClick={() => setActiveTab(name)}
        className={`px-3 py-2 text-sm font-medium rounded-t-lg ${activeTab === name ? 'border-b-2 border-brand text-primary' : 'text-secondary hover:text-primary'}`}
    >
        {children}
    </button>
);


const AddDocumentForm: React.FC<{ onAdd: (file: File, name: string, type: DocumentType) => void }> = ({ onAdd }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [docName, setDocName] = useState('');
    const [docType, setDocType] = useState<DocumentType>(DocumentType.Autre);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (file && docName) {
            onAdd(file, docName, docType);
            // Reset form
            setFile(null);
            setDocName('');
            setDocType(DocumentType.Autre);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setIsFormOpen(false);
        }
    };

    return (
        <div className="bg-surface-secondary/50 rounded-lg p-4">
            <button
                onClick={() => setIsFormOpen(!isFormOpen)}
                className="w-full flex justify-between items-center text-left font-semibold text-primary"
            >
                <div className="flex items-center gap-2">
                    <DocumentPlusIcon className="w-5 h-5"/>
                    <span>Ajouter un document</span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isFormOpen ? 'rotate-180' : ''}`} />
            </button>
            {isFormOpen && (
                 <form onSubmit={handleSubmit} className="mt-4 space-y-3 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-secondary block mb-1">Fichier</label>
                            <input type="file" ref={fileInputRef} onChange={e => setFile(e.target.files ? e.target.files[0] : null)} required className="text-sm text-secondary file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand/20 file:text-brand-light hover:file:bg-brand/30 w-full" />
                        </div>
                        <div>
                            <label htmlFor="docName" className="text-xs text-secondary block mb-1">Nom du document</label>
                            <input id="docName" type="text" value={docName} onChange={e => setDocName(e.target.value)} placeholder="Ex: CNI M. Dupont" required className="w-full bg-input border-border rounded-md p-2 text-sm" />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="docType" className="text-xs text-secondary block mb-1">Type de document</label>
                        <select id="docType" value={docType} onChange={e => setDocType(e.target.value as DocumentType)} className="w-full bg-input border-border rounded-md p-2 text-sm">
                            {DOCUMENT_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div className="text-right">
                        <button type="submit" className="bg-brand hover:bg-brand-dark text-white font-bold py-1.5 px-4 rounded-md text-sm">
                            Sauvegarder
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

// --- CRITERIA TAB ---
const CriteriaTab: React.FC<{
    contact: Contact;
    onUpdateContact: (updatedContact: Contact) => void;
}> = ({ contact, onUpdateContact }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<SearchCriteria>(contact.searchCriteria || {});

    useEffect(() => {
        setFormData(contact.searchCriteria || {});
    }, [contact]);

    const handleCancel = () => {
        setFormData(contact.searchCriteria || {});
        setIsEditing(false);
    };

    const handleSave = () => {
        const updatedContact: Contact = {
            ...contact,
            searchCriteria: formData,
            lastUpdateDate: new Date(),
        };
        onUpdateContact(updatedContact);
        setIsEditing(false);
    };

    const handleChange = (field: keyof SearchCriteria, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleMultiSelectChange = (field: 'propertyTypes' | 'importantFeatures' | 'propertyStyle', value: string) => {
        const currentValues: string[] = (formData[field] as string[] | undefined) || [];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(item => item !== value)
            : [...currentValues, value];
        handleChange(field, newValues);
    };

    const formatCurrency = (val?: number) => val ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(val) : 'N/A';

    const { priceRange } = useMemo(() => {
        const criteria = isEditing ? formData : contact.searchCriteria;
        const targetPrice = criteria?.targetPrice || 0;
        const margin = criteria?.priceMarginPercent || 0;
        if (targetPrice > 0 && margin > 0) {
            const lowerBound = targetPrice * (1 - margin / 100);
            const upperBound = targetPrice * (1 + margin / 100);
            return {
                priceRange: `${formatCurrency(lowerBound)} - ${formatCurrency(upperBound)}`,
            };
        }
        return { priceRange: null };
    }, [isEditing, formData, contact.searchCriteria]);

    const criteriaToDisplay = contact.searchCriteria;
    const criteriaForForm = formData;

    return (
        <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto bg-background p-3 rounded-lg">
            <div className="flex justify-between items-center border-b border-border pb-2 mb-4">
                <h4 className="text-lg font-semibold text-primary">Critères de recherche</h4>
                {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="bg-brand hover:bg-brand-dark text-white font-bold py-1 px-3 rounded-md text-sm flex items-center gap-1">
                        <PencilIcon className="w-4 h-4" /> Modifier
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                        <button onClick={handleCancel} className="bg-surface-secondary hover:bg-opacity-80 text-primary font-bold py-1 px-3 rounded-md text-sm">Annuler</button>
                        <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-md text-sm">Enregistrer</button>
                    </div>
                )}
            </div>

            {!isEditing ? (
                <div className="space-y-3">
                    <CriteriaSection title="Critères Essentiels">
                        <ViewField label="Budget" value={<span className="font-lato font-bold">{`${formatCurrency(criteriaToDisplay?.targetPrice)} (± ${criteriaToDisplay?.priceMarginPercent || 0}%)`}</span>} />
                        <ViewField label="Fourchette" value={<span className="font-lato font-bold">{priceRange || 'N/A'}</span>} />
                        <ViewField label="Communes" value={criteriaToDisplay?.cities || 'N/A'} />
                        <ViewField label="Rayon" value={criteriaToDisplay?.searchRadiusKm ? <span className="font-lato">{`${criteriaToDisplay.searchRadiusKm} km`}</span> : 'N/A'} />
                        <ViewField label="Quartiers" value={criteriaToDisplay?.neighborhoods || 'N/A'} />
                        <ViewField label="Types de bien" value={criteriaToDisplay?.propertyTypes?.join(', ') || 'N/A'} />
                        <ViewField label="Pièces min." value={criteriaToDisplay?.minRooms ? <span className="font-lato">{criteriaToDisplay?.minRooms}</span> : 'N/A'} />
                        <ViewField label="SDB min." value={criteriaToDisplay?.minBathrooms ? <span className="font-lato">{criteriaToDisplay?.minBathrooms}</span> : 'N/A'} />
                        <ViewField label="Surf. habitable min." value={criteriaToDisplay?.minLivingArea ? <span className="font-lato">{`${criteriaToDisplay.minLivingArea} m²`}</span> : 'N/A'} />
                        <ViewField label="Surf. terrain min." value={criteriaToDisplay?.minPlotArea ? <span className="font-lato">{`${criteriaToDisplay.minPlotArea} m²`}</span> : 'N/A'} />
                    </CriteriaSection>
                    <CriteriaSection title="Critères Importants">
                        <ViewField label="Atouts" value={criteriaToDisplay?.importantFeatures?.join(', ') || 'Aucun'} />
                        <ViewField label="Style" value={criteriaToDisplay?.propertyStyle?.join(', ') || 'Aucun'} />
                    </CriteriaSection>
                </div>
            ) : (
                <div className="space-y-4">
                    <CriteriaSection title="Critères Essentiels">
                        <div className="grid grid-cols-2 gap-4">
                            <CriteriaInputField label="Prix Cible (€)" type="number" value={criteriaForForm?.targetPrice || ''} onChange={e => handleChange('targetPrice', e.target.value ? Number(e.target.value) : undefined)} />
                            <CriteriaInputField label="Marge de prix (%)" type="number" value={criteriaForForm?.priceMarginPercent || ''} onChange={e => handleChange('priceMarginPercent', e.target.value ? Number(e.target.value) : undefined)} />
                        </div>
                        {priceRange && <p className="text-sm text-accent text-center font-semibold bg-brand/10 p-2 rounded-md font-lato font-bold">Fourchette : {priceRange}</p>}
                        <div className="grid grid-cols-2 gap-4">
                            <CriteriaInputField label="Communes" value={criteriaForForm?.cities || ''} onChange={e => handleChange('cities', e.target.value)} placeholder="Paris, Lyon..." />
                            <CriteriaInputField label="Rayon (km)" type="number" value={criteriaForForm?.searchRadiusKm || ''} onChange={e => handleChange('searchRadiusKm', e.target.value ? Number(e.target.value) : undefined)} />
                        </div>
                        <CriteriaInputField label="Quartiers" value={criteriaForForm?.neighborhoods || ''} onChange={e => handleChange('neighborhoods', e.target.value)} placeholder="Le Marais, Saint-Germain..." />
                        <div className="grid grid-cols-2 gap-4">
                            <CriteriaInputField label="Pièces min." type="number" value={criteriaForForm?.minRooms || ''} onChange={e => handleChange('minRooms', e.target.value ? Number(e.target.value) : undefined)} />
                            <CriteriaInputField label="SDB min." type="number" value={criteriaForForm?.minBathrooms || ''} onChange={e => handleChange('minBathrooms', e.target.value ? Number(e.target.value) : undefined)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <CriteriaInputField label="Surf. hab. min. (m²)" type="number" value={criteriaForForm?.minLivingArea || ''} onChange={e => handleChange('minLivingArea', e.target.value ? Number(e.target.value) : undefined)} />
                            <CriteriaInputField label="Surf. terrain min. (m²)" type="number" value={criteriaForForm?.minPlotArea || ''} onChange={e => handleChange('minPlotArea', e.target.value ? Number(e.target.value) : undefined)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-2">Types de bien</label>
                            <div className="flex flex-wrap gap-2">
                                {PROPERTY_TYPE_OPTIONS.map(opt => (
                                    <ToggleButton key={opt} selected={criteriaForForm?.propertyTypes?.includes(opt) || false} onClick={() => handleMultiSelectChange('propertyTypes', opt)}>
                                        {opt}
                                    </ToggleButton>
                                ))}
                            </div>
                        </div>
                    </CriteriaSection>

                    <CriteriaSection title="Critères Importants">
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-2">Atouts recherchés</label>
                            <div className="flex flex-wrap gap-2">
                                {IMPORTANT_FEATURES_OPTIONS.map(opt => (
                                    <ToggleButton key={opt} selected={criteriaForForm?.importantFeatures?.includes(opt) || false} onClick={() => handleMultiSelectChange('importantFeatures', opt)}>
                                        {opt}
                                    </ToggleButton>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-2">Style de bien</label>
                            <div className="flex flex-wrap gap-2">
                                {PROPERTY_STYLE_OPTIONS.map(opt => (
                                    <ToggleButton key={opt} selected={criteriaForForm?.propertyStyle?.includes(opt) || false} onClick={() => handleMultiSelectChange('propertyStyle', opt)}>
                                        {opt}
                                    </ToggleButton>
                                ))}
                            </div>
                        </div>
                    </CriteriaSection>
                </div>
            )}
        </div>
    );
};


// Primitives for Criteria Tab
const CriteriaSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="space-y-3 p-3 bg-surface-secondary/50 rounded-lg">
        <h5 className="font-semibold text-primary">{title}</h5>
        <div className="space-y-3">{children}</div>
    </div>
);
const ViewField: React.FC<{ label: string, value: React.ReactNode }> = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-2 text-sm">
        <span className="text-secondary col-span-1">{label}</span>
        <span className="text-primary col-span-2 font-medium">{value}</span>
    </div>
);
const CriteriaInputField: React.FC<React.ComponentProps<'input'> & { label: string }> = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-secondary mb-1">{label}</label>
    <input {...props} className={`w-full bg-input border-border rounded-md p-2 text-sm ${props.type === 'number' ? 'font-lato font-bold' : ''}`} />
  </div>
);
const ToggleButton: React.FC<{ selected: boolean; onClick: () => void; children: React.ReactNode; }> = ({ selected, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
        selected
            ? 'bg-brand text-white border-brand'
            : 'bg-surface text-secondary border-border hover:border-brand-light'
    }`}
  >
    {children}
  </button>
);