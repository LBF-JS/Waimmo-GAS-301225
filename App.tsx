
import React, { useState, useEffect, useCallback } from 'react';

// Import types
import { 
    Contact, Appointment, VisitReport, SavedAnnonce, Notification, AgentInfo, NotificationSettings, 
    Civility, FunnelStage, ProjectStatus, ContactType, ContactPreference, PropertyType, TransactionType, 
    ProjectPriority, FinancingStatus, ContactSource, Remark, NotificationType,
    AppointmentStatus, VisitReportStatus, Estimation, Mandate
} from './types';

// Import Pages
import { HomePage } from './pages/HomePage';
import { Dashboard } from './pages/Dashboard';
import { Search } from './pages/Search';
import { PigePage } from './pages/PigePage';
import { CalendarPage } from './pages/CalendarPage';
import { ReportPage } from './pages/ReportPage';
import { ImageEditorPage } from './pages/ImageEditorPage';
import { MesAnnoncesPage } from './pages/MesAnnoncesPage';
import { History } from './pages/History';
import { SettingsPage } from './pages/SettingsPage';
import { EstimationPage } from './pages/EstimationPage';
import { MandatsPage } from './pages/MandatsPage';
import { MandateTrackingPage } from './pages/MandateTrackingPage';
import { SavedListingsPage } from './pages/SavedListingsPage';
import { LoginPage } from './pages/LoginPage';


// Import Components
import { Modal } from './components/Modal';
import { NewClientForm, NewContactData } from './components/NewClientForm';
import { ClientDetailModal } from './components/ClientDetailModal';
import { ReportFormModal } from './components/ReportFormModal';
import { NotificationsPanel } from './components/NotificationsPanel';

// Import Icons
import { 
    HomeIcon, UserGroupIcon, MagnifyingGlassIcon, CalendarDaysIcon, 
    DocumentChartBarIcon, Cog6ToothIcon, BellIcon,
    PhotoIcon, BookmarkSquareIcon, DocumentTextIcon, PhoneArrowUpRightIcon, CalculatorIcon, DocumentCheckIcon,
    ArrowRightOnRectangleIcon, WaImmoLogoIcon
} from './components/Icons';

// --- MOCK DATA ---
import { initialAgentInfo, initialContacts, initialAppointments, initialReports, initialSavedAnnonces, initialNotificationSettings, initialMandates } from './mockData.ts';

// --- TYPES ---
type Page = 
    'home' | 'dashboard' | 'search' | 'pige' | 'calendar' | 'reports' | 'estimation' |
    'image-editor' | 'mes-annonces' | 'saved-listings' | 'history' | 'settings' | 'mandats' | 'suivi-mandats';
    
type Theme = 'light' | 'dark';

const pageTitles: Record<Page, string> = {
    home: "Tableau de Bord",
    dashboard: "CRM / Suivi Client",
    search: "Bible IA",
    pige: "Pige Immobilière IA",
    calendar: "Calendrier & RDV",
    reports: "Comptes Rendus de Visite",
    estimation: "Estimation de Bien",
    'image-editor': "Assistant Créatif",
    'mes-annonces': "Mes Annonces",
    'saved-listings': "Annonces Enregistrées",
    history: "Historique des Dossiers",
    settings: "Paramètres",
    mandats: "Gestion des Mandats",
    'suivi-mandats': "Suivi des Mandats",
};

// --- MAIN APP COMPONENT ---
const App = () => {
    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Theme State
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined' && localStorage.getItem('theme')) {
            return localStorage.getItem('theme') as Theme;
        }
        if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);
    
    // Check session storage on initial load
    useEffect(() => {
        const loggedIn = sessionStorage.getItem('isAuthenticated');
        if (loggedIn === 'true') {
            setIsAuthenticated(true);
        }
    }, []);


    // Navigation State
    const [activePage, setActivePage] = useState<Page>('home');

    // Data State
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [reports, setReports] = useState<VisitReport[]>([]);
    const [estimations, setEstimations] = useState<Estimation[]>([]);
    const [mandates, setMandates] = useState<Mandate[]>([]);
    const [savedAnnonces, setSavedAnnonces] = useState<SavedAnnonce[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [agentInfo, setAgentInfo] = useState<AgentInfo>(initialAgentInfo);
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(initialNotificationSettings);
    const [n8nWebhookUrl, setN8nWebhookUrl] = useState<string>('');

    useEffect(() => {
        // Hydrate state from mock data on initial load
        setContacts(initialContacts);
        setAppointments(initialAppointments);
        setReports(initialReports);
        setSavedAnnonces(initialSavedAnnonces);
        setMandates(initialMandates);
    }, []);

    // Modal State
    const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
    const [isClientDetailModalOpen, setIsClientDetailModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);

    // Data for Modals
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [reportToEdit, setReportToEdit] = useState<VisitReport | null>(null);
    const [reportInitialData, setReportInitialData] = useState<Partial<Omit<VisitReport, 'id'|'creationDate'>> | undefined>(undefined);
    const [annonceToEdit, setAnnonceToEdit] = useState<SavedAnnonce | null>(null);

    // --- AUTH FUNCTIONS ---
    const handleLoginSuccess = () => {
        sessionStorage.setItem('isAuthenticated', 'true');
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        sessionStorage.removeItem('isAuthenticated');
        setIsAuthenticated(false);
    };


    // --- UTILITY FUNCTIONS ---
    const addNotification = useCallback((message: string, type: NotificationType, relatedContactId?: string) => {
        if (!notificationSettings[type]) return; // Check if notification type is enabled
        const newNotif: Notification = {
            id: `notif-${Date.now()}`,
            message,
            timestamp: new Date(),
            isRead: false,
            type,
            relatedContactId,
        };
        setNotifications(prev => [newNotif, ...prev]);
    }, [notificationSettings]);

    // --- DATA HANDLERS ---

    // Contacts
    const handleSaveContact = (newContactData: NewContactData) => {
        const newContact: Contact = {
            ...newContactData,
            id: `contact-${Date.now()}`,
            creationDate: new Date(),
            lastUpdateDate: new Date(),
            remarks: newContactData.initialRemark ? [{ id: `rem-${Date.now()}`, text: newContactData.initialRemark, timestamp: new Date() }] : [],
            savedListings: [],
            documents: [],
            compatibilityScore: Math.floor(Math.random() * 51) + 50, // 50-100
        };
        setContacts(prev => [newContact, ...prev]);
        setIsNewClientModalOpen(false);
        addNotification(`Nouveau dossier créé : ${newContact.firstName} ${newContact.lastName}`, NotificationType.CONTACT_NEW, newContact.id);
    };

    const handleUpdateContact = (updatedContact: Contact) => {
        setContacts(prev => prev.map(c => c.id === updatedContact.id ? { ...updatedContact, lastUpdateDate: new Date() } : c));
        addNotification(`Dossier de ${updatedContact.firstName} ${updatedContact.lastName} mis à jour.`, NotificationType.CONTACT_UPDATE, updatedContact.id);
    };
    
    const handleDeleteContact = (contactId: string) => {
        const contact = contacts.find(c => c.id === contactId);
        if(contact) {
            setContacts(prev => prev.filter(c => c.id !== contactId));
            addNotification(`Dossier de ${contact.firstName} ${contact.lastName} supprimé.`, NotificationType.CONTACT_DELETE);
        }
    };
    
    const handleUpdateFunnelStage = (contactId: string, newStage: FunnelStage) => {
        setContacts(prev => prev.map(c => c.id === contactId ? { ...c, funnelStage: newStage, lastUpdateDate: new Date() } : c));
    };

    const handleSelectContact = (contact: Contact) => {
        setSelectedContactId(contact.id);
        setIsClientDetailModalOpen(true);
    };

    // Appointments
    const handleAddAppointment = (newAppointment: Omit<Appointment, 'id'>) => {
        const fullAppointment: Appointment = { ...newAppointment, id: `appt-${Date.now()}` };
        setAppointments(prev => [fullAppointment, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        addNotification(`Nouveau RDV créé pour ${contacts.find(c => c.id === newAppointment.contactId)?.firstName}`, NotificationType.APPOINTMENT_NEW, newAppointment.contactId);
    };
    const handleUpdateAppointment = (updatedAppointment: Appointment) => {
        setAppointments(prev => prev.map(a => a.id === updatedAppointment.id ? updatedAppointment : a));
        addNotification(`RDV mis à jour pour ${contacts.find(c => c.id === updatedAppointment.contactId)?.firstName}`, NotificationType.APPOINTMENT_UPDATE, updatedAppointment.contactId);
    };
    const handleDeleteAppointment = (appointmentId: string) => {
        const appt = appointments.find(a => a.id === appointmentId);
        setAppointments(prev => prev.filter(a => a.id !== appointmentId));
        if (appt) addNotification(`RDV supprimé.`, NotificationType.APPOINTMENT_DELETE, appt.contactId);
    };

    // Reports
    const handleSaveReport = (reportData: Omit<VisitReport, 'id' | 'creationDate'> | VisitReport) => {
        if ('id' in reportData) { // Update
            setReports(prev => prev.map(r => r.id === reportData.id ? { ...reportData, creationDate: r.creationDate } : r));
            addNotification(`Compte rendu "${reportData.title}" mis à jour.`, NotificationType.REPORT_UPDATE, reportData.buyerContactId);
        } else { // Add
            const newReport: VisitReport = { ...reportData, id: `report-${Date.now()}`, creationDate: new Date() };
            setReports(prev => [newReport, ...prev]);
            addNotification(`Nouveau compte rendu "${newReport.title}" créé.`, NotificationType.REPORT_NEW, newReport.buyerContactId);
        }
        setIsReportModalOpen(false);
        setReportToEdit(null);
        setReportInitialData(undefined);
    };
    const handleDeleteReport = (reportId: string) => {
        if(window.confirm("Êtes-vous sûr de vouloir supprimer ce compte rendu ?")) {
            const report = reports.find(r => r.id === reportId);
            setReports(prev => prev.filter(r => r.id !== reportId));
            if(report) addNotification(`Compte rendu "${report.title}" supprimé.`, NotificationType.REPORT_DELETE, report.buyerContactId);
        }
    };
    const handleOpenNewReportModal = (initialData?: Partial<Omit<VisitReport, 'id'|'creationDate'>>) => {
        setReportToEdit(null);
        setReportInitialData(initialData);
        setIsReportModalOpen(true);
    };
    const handleOpenEditReportModal = (report: VisitReport) => {
        setReportToEdit(report);
        setReportInitialData(undefined);
        setIsReportModalOpen(true);
    };
    
    // Estimations
    const handleSaveEstimation = (newEstimation: Omit<Estimation, 'id' | 'estimationDate'>) => {
        const fullEstimation: Estimation = {
            ...newEstimation,
            id: `est-${Date.now()}`,
            estimationDate: new Date(),
        };
        setEstimations(prev => [fullEstimation, ...prev]);
        // Optionally, add a notification
        // addNotification(`Nouvelle estimation pour ${newEstimation.address}`, NotificationType.ESTIMATION_NEW, newEstimation.contactId);
    };
    
    // Mandates
    const handleAddMandate = (newMandate: Omit<Mandate, 'id'>) => {
        const fullMandate: Mandate = { ...newMandate, id: `mandate-${Date.now()}`};
        setMandates(prev => [fullMandate, ...prev]);
        addNotification(`Nouveau mandat créé pour ${contacts.find(c => c.id === newMandate.contactId)?.lastName}`, NotificationType.AGENT_INFO_UPDATE, newMandate.contactId);
    };
    const handleUpdateMandate = (updatedMandate: Mandate) => {
        setMandates(prev => prev.map(m => m.id === updatedMandate.id ? updatedMandate : m));
        addNotification(`Mandat mis à jour pour ${contacts.find(c => c.id === updatedMandate.contactId)?.lastName}`, NotificationType.AGENT_INFO_UPDATE, updatedMandate.contactId);
    };
    const handleDeleteMandate = (mandateId: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce mandat ?")) {
            const mandate = mandates.find(m => m.id === mandateId);
            setMandates(prev => prev.filter(m => m.id !== mandateId));
            if(mandate) addNotification(`Mandat supprimé.`, NotificationType.AGENT_INFO_UPDATE, mandate.contactId);
        }
    };

    // Annonces
    const handleSaveAnnonce = (annonceData: Omit<SavedAnnonce, 'id'>) => {
        const newAnnonce: SavedAnnonce = { ...annonceData, id: `annonce-${Date.now()}` };
        setSavedAnnonces(prev => [newAnnonce, ...prev]);
        setActivePage('mes-annonces');
        addNotification(`Nouvelle annonce créée.`, NotificationType.ANNONCE_NEW);
    };
    const handleUpdateAnnonce = (updatedAnnonce: SavedAnnonce) => {
        setSavedAnnonces(prev => prev.map(a => a.id === updatedAnnonce.id ? updatedAnnonce : a));
        setActivePage('mes-annonces');
        addNotification(`Annonce mise à jour.`, NotificationType.ANNONCE_UPDATE);
    };
    const handleDeleteAnnonce = (annonceId: string) => {
         if(window.confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) {
            setSavedAnnonces(prev => prev.filter(a => a.id !== annonceId));
            addNotification(`Annonce supprimée.`, NotificationType.ANNONCE_DELETE);
        }
    };
    const handleEditAnnonce = (annonce: SavedAnnonce) => {
        setAnnonceToEdit(annonce);
        setActivePage('image-editor');
    };

    // Settings
    const handleUpdateAgentInfo = (newInfo: AgentInfo) => {
        setAgentInfo(newInfo);
        addNotification("Les informations de l'agence ont été mises à jour.", NotificationType.AGENT_INFO_UPDATE);
    };
    const handleUpdateNotificationSettings = (newSettings: NotificationSettings) => {
        setNotificationSettings(newSettings);
    };
    const handleUpdateN8nWebhookUrl = (url: string) => {
        setN8nWebhookUrl(url);
        if (url) {
            addNotification("L'URL du webhook n8n a été enregistrée.", NotificationType.AGENT_INFO_UPDATE);
        } else {
            addNotification("L'URL du webhook n8n a été supprimée.", NotificationType.AGENT_INFO_UPDATE);
        }
    };
    
    // Notifications
    const handleNotificationClick = (notification: Notification) => {
        if (notification.relatedContactId) {
            const contact = contacts.find(c => c.id === notification.relatedContactId);
            if(contact) handleSelectContact(contact);
        }
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
        setIsNotificationsPanelOpen(false);
    };
    const handleMarkAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    const handleClearAll = () => setNotifications([]);

    // --- RENDER LOGIC ---
    if (!isAuthenticated) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    const selectedContact = selectedContactId ? contacts.find(c => c.id === selectedContactId) : null;

    const renderPage = () => {
        switch (activePage) {
            case 'home': return <HomePage contacts={contacts} appointments={appointments} onSelectContact={handleSelectContact} />;
            case 'dashboard': return <Dashboard contacts={contacts} appointments={appointments} onSelectContact={handleSelectContact} onUpdateFunnelStage={handleUpdateFunnelStage} />;
            case 'search': return <Search />;
            case 'pige': return <PigePage contacts={contacts} onUpdateContact={handleUpdateContact} />;
            case 'calendar': return <CalendarPage appointments={appointments} contacts={contacts} savedAnnonces={savedAnnonces} onAddAppointment={handleAddAppointment} onUpdateAppointment={handleUpdateAppointment} onDeleteAppointment={handleDeleteAppointment} onSelectContact={handleSelectContact} />;
            case 'reports': return <ReportPage reports={reports} contacts={contacts} onDeleteReport={handleDeleteReport} onSelectContact={handleSelectContact} onOpenNewReportModal={handleOpenNewReportModal} onOpenEditReportModal={handleOpenEditReportModal} />;
            case 'estimation': return <EstimationPage contacts={contacts} onSaveEstimation={handleSaveEstimation} />;
            case 'mandats': return <MandatsPage mandates={mandates} contacts={contacts} onAddMandate={handleAddMandate} onUpdateMandate={handleUpdateMandate} onDeleteMandate={handleDeleteMandate} onSelectContact={handleSelectContact} onUpdateContact={handleUpdateContact} agentInfo={agentInfo} />;
            case 'suivi-mandats': return <MandateTrackingPage mandates={mandates} contacts={contacts} />;
            case 'image-editor': return <ImageEditorPage onSaveAnnonce={handleSaveAnnonce} annonceToEdit={annonceToEdit} onUpdateAnnonce={handleUpdateAnnonce} setActivePage={setActivePage} />;
            case 'mes-annonces': return <MesAnnoncesPage annonces={savedAnnonces} onDelete={handleDeleteAnnonce} onEdit={handleEditAnnonce} />;
            case 'saved-listings': return <SavedListingsPage contacts={contacts} onUpdateContact={handleUpdateContact} onSelectContact={handleSelectContact} />;
            case 'history': return <History contacts={contacts.filter(c => c.projectStatus === ProjectStatus.Termine || c.projectStatus === ProjectStatus.Perdu)} onSelectContact={handleSelectContact} />;
            case 'settings': return <SettingsPage agentInfo={agentInfo} onUpdateAgentInfo={handleUpdateAgentInfo} notificationSettings={notificationSettings} onUpdateNotificationSettings={handleUpdateNotificationSettings} theme={theme} setTheme={setTheme} n8nWebhookUrl={n8nWebhookUrl} onUpdateN8nWebhookUrl={handleUpdateN8nWebhookUrl} />;
            default: return <HomePage contacts={contacts} appointments={appointments} onSelectContact={handleSelectContact} />;
        }
    };
    
    const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="flex h-screen bg-background text-primary antialiased">
            <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={handleLogout} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-surface shadow-md flex justify-between items-center p-4 z-10">
                    <h1 className="text-xl font-bold text-primary">{pageTitles[activePage]}</h1>
                    <div className="flex items-center space-x-4">
                        <button onClick={() => setIsNewClientModalOpen(true)} className="bg-brand hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-md hidden sm:block">
                            + Nouveau Dossier
                        </button>
                         <div className="relative">
                            <button onClick={() => setIsNotificationsPanelOpen(prev => !prev)} className="p-2 rounded-full hover:bg-surface-secondary relative" aria-label="Notifications">
                                <BellIcon className="w-6 h-6" />
                                {unreadNotificationsCount > 0 && (
                                    <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-surface" />
                                )}
                            </button>
                            {isNotificationsPanelOpen && <NotificationsPanel notifications={notifications} onNotificationClick={handleNotificationClick} onMarkAllRead={handleMarkAllRead} onClearAll={handleClearAll} onClose={() => setIsNotificationsPanelOpen(false)} />}
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-6">
                    {renderPage()}
                </main>
            </div>

            {/* --- MODALS --- */}
            <Modal isOpen={isNewClientModalOpen} onClose={() => setIsNewClientModalOpen(false)} title="Créer un nouveau dossier client">
                <NewClientForm onSave={handleSaveContact} onCancel={() => setIsNewClientModalOpen(false)} />
            </Modal>
            
            <ClientDetailModal 
                isOpen={isClientDetailModalOpen}
                onClose={() => setIsClientDetailModalOpen(false)}
                contact={selectedContact}
                onUpdateContact={handleUpdateContact}
                onDeleteContact={handleDeleteContact}
                contacts={contacts}
                appointments={appointments}
                reports={reports}
                estimations={estimations}
                savedAnnonces={savedAnnonces}
                onAddAppointment={handleAddAppointment}
                onUpdateAppointment={handleUpdateAppointment}
                onDeleteAppointment={handleDeleteAppointment}
                onOpenNewReportModal={handleOpenNewReportModal}
            />

            <ReportFormModal 
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onSave={handleSaveReport}
                reportToEdit={reportToEdit}
                initialData={reportInitialData}
                contacts={contacts}
                appointments={appointments}
            />
        </div>
    );
};

// --- SIDEBAR COMPONENT ---
const NavItem: React.FC<{ icon: React.ReactNode, label: string, page: Page, activePage: Page, setActivePage: (page: Page) => void }> = 
({ icon, label, page, activePage, setActivePage }) => (
    <button onClick={() => setActivePage(page)} className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg w-full text-left transition-colors ${activePage === page ? 'bg-brand text-white' : 'hover:bg-surface-secondary'}`}>
        <span className="w-6 h-6">{icon}</span>
        <span>{label}</span>
    </button>
);

const Sidebar: React.FC<{ activePage: Page, setActivePage: (page: Page) => void, onLogout: () => void }> = ({ activePage, setActivePage, onLogout }) => (
    <aside className="w-64 bg-surface flex flex-col p-4 shadow-lg">
        <div className="flex items-center space-x-2 mb-8">
            <WaImmoLogoIcon className="w-8 h-8 text-brand" />
            <span className="text-xl font-bold">WaImmo</span>
        </div>
        <nav className="flex-1 space-y-2">
            <NavItem icon={<HomeIcon />} label="Accueil" page="home" activePage={activePage} setActivePage={setActivePage} />
            <NavItem icon={<UserGroupIcon />} label="CRM" page="dashboard" activePage={activePage} setActivePage={setActivePage} />
            <NavItem icon={<MagnifyingGlassIcon />} label="Bible IA" page="search" activePage={activePage} setActivePage={setActivePage} />
            <NavItem icon={<PhoneArrowUpRightIcon />} label="Pige IA" page="pige" activePage={activePage} setActivePage={setActivePage} />
            <NavItem icon={<CalculatorIcon />} label="Estimation" page="estimation" activePage={activePage} setActivePage={setActivePage} />
            <NavItem icon={<CalendarDaysIcon />} label="Calendrier" page="calendar" activePage={activePage} setActivePage={setActivePage} />
            <NavItem icon={<DocumentChartBarIcon />} label="Rapports Visites" page="reports" activePage={activePage} setActivePage={setActivePage} />
            
            <div className="pt-4 mt-4 border-t border-border">
                <p className="px-3 text-xs font-semibold text-secondary uppercase mb-2">Annonces</p>
                <NavItem icon={<BookmarkSquareIcon />} label="Annonces Enregistrées" page="saved-listings" activePage={activePage} setActivePage={setActivePage} />
            </div>

            <div className="pt-4 mt-4 border-t border-border">
                <p className="px-3 text-xs font-semibold text-secondary uppercase mb-2">Archives</p>
                <NavItem icon={<DocumentTextIcon />} label="Historique" page="history" activePage={activePage} setActivePage={setActivePage} />
            </div>
        </nav>
        <div className="mt-auto space-y-2">
             <NavItem icon={<Cog6ToothIcon />} label="Paramètres" page="settings" activePage={activePage} setActivePage={setActivePage} />
             <button onClick={onLogout} className="flex items-center space-x-3 px-3 py-2.5 rounded-lg w-full text-left transition-colors text-secondary hover:bg-red-500/10 hover:text-red-400">
                <ArrowRightOnRectangleIcon className="w-6 h-6" />
                <span>Se déconnecter</span>
            </button>
        </div>
    </aside>
);

export default App;
