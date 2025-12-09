import {
  AgentInfo,
  Contact,
  Appointment,
  VisitReport,
  SavedAnnonce,
  NotificationSettings,
  NotificationType,
  Civility,
  FunnelStage,
  ProjectStatus,
  ContactType,
  ContactPreference,
  PropertyType,
  TransactionType,
  ProjectPriority,
  FinancingStatus,
  ContactSource,
  AppointmentStatus,
  AppointmentReliability,
  VisitReportStatus,
  ListingStatus,
  Mandate,
  MandateType,
  MandateStatus,
  FeeType,
  PropertyStyle,
} from './types';

export const initialAgentInfo: AgentInfo = {
  name: "ImmoPro AI",
  legalForm: "SAS",
  address: "123 Rue de l'Immobilier, 75001 Paris, France",
  professionalCard: "CPI 7501 2023 000 000 001",
  prefecture: "Paris",
  issueDate: "2023-01-15",
  cautionMutuelle: "Galian",
  cautionAddress: "89 Rue la Boétie, 75008 Paris",
  cautionNumber: "A123456789",
};

export const initialContacts: Contact[] = [
  {
    id: 'contact-1',
    civility: Civility.M,
    firstName: 'Jean',
    lastName: 'Dupont',
    contactType: ContactType.AcquereurVendeur,
    funnelStage: FunnelStage.Client,
    phone1: '06 12 34 56 78',
    email1: 'jean.dupont@email.com',
    contactPreference: ContactPreference.Email,
    creationDate: new Date('2023-10-15'),
    lastUpdateDate: new Date('2024-05-20'),
    projectStatus: ProjectStatus.EnCours,
    propertyType: PropertyType.Maison,
    budgetMin: 400000,
    budgetMax: 500000,
    transactionType: TransactionType.Achat,
    source: ContactSource.PortailImmobilier,
    remarks: [{ id: 'rem-1', text: 'Premier contact via SeLoger. Très réactif.', timestamp: new Date('2023-10-15') }],
    savedListings: [
      {
        id: 'listing-1',
        contactId: 'contact-1',
        title: 'Maison avec jardin',
        price: '450 000 €',
        description: 'Belle maison de 150m² avec un grand jardin exposé sud. 4 chambres, grand séjour lumineux. Proche des écoles et des commerces.',
        link: '#',
        imageUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=2070&auto=format&fit=crop',
        source: 'SeLoger',
        savedDate: new Date('2024-05-10'),
        status: ListingStatus.AVisiter,
        remarks: [],
      }
    ],
    documents: [],
    marketingConsent: true,
    compatibilityScore: 88,
    projectPriority: ProjectPriority.Haute,
    financingStatus: FinancingStatus.Approuve,
    address: "15 Rue de la Paix, 75002 Paris",
    desiredAreas: "Paris 1er, 2ème, 9ème",
    minRooms: 4,
    searchCriteria: {
        targetPrice: 450000,
        priceMarginPercent: 5,
        cities: "Paris",
        searchRadiusKm: 10,
        neighborhoods: "Le Marais, Saint-Germain-des-Prés",
        propertyTypes: [PropertyType.Appartement, PropertyType.Maison],
        minRooms: 4,
        minBathrooms: 2,
        minLivingArea: 120,
        minPlotArea: 0,
        importantFeatures: ['Terrasse', 'Parking', 'Ascenseur', 'Vue dégagée'],
        propertyStyle: [PropertyStyle.Ancien, PropertyStyle.Caractere],
    },
  },
  {
    id: 'contact-2',
    civility: Civility.Mme,
    firstName: 'Marie',
    lastName: 'Curie',
    contactType: ContactType.Acquereur,
    funnelStage: FunnelStage.Prospect,
    phone1: '07 87 65 43 21',
    email1: 'marie.curie@email.com',
    contactPreference: ContactPreference.Telephone,
    creationDate: new Date('2024-02-20'),
    lastUpdateDate: new Date('2024-05-18'),
    projectStatus: ProjectStatus.Nouveau,
    propertyType: PropertyType.Appartement,
    budgetMax: 800000,
    transactionType: TransactionType.Achat,
    source: ContactSource.Recommandation,
    remarks: [],
    savedListings: [],
    documents: [],
    marketingConsent: true,
    compatibilityScore: 95,
    projectPriority: ProjectPriority.Haute,
    financingStatus: FinancingStatus.NonDefini,
  },
   {
    id: 'contact-3',
    civility: Civility.M,
    firstName: 'Louis',
    lastName: 'Pasteur',
    contactType: ContactType.Vendeur,
    funnelStage: FunnelStage.Client,
    phone1: '06 11 22 33 44',
    email1: 'louis.pasteur@email.com',
    contactPreference: ContactPreference.Email,
    creationDate: new Date('2024-01-05'),
    lastUpdateDate: new Date('2024-04-30'),
    projectStatus: ProjectStatus.Termine,
    propertyType: PropertyType.Appartement,
    budgetMax: 650000,
    transactionType: TransactionType.Vente,
    source: ContactSource.SiteWeb,
    remarks: [{id:'rem-2', text: "Vente finalisée le 28/04.", timestamp: new Date('2024-04-28')}],
    savedListings: [],
    documents: [],
    marketingConsent: false,
    compatibilityScore: 72,
  },
   {
    id: 'contact-4',
    civility: Civility.Autre,
    firstName: 'Alex',
    lastName: 'Martin',
    contactType: ContactType.Investisseur,
    funnelStage: FunnelStage.Prospect,
    phone1: '06 55 66 77 88',
    email1: 'alex.martin@email.com',
    contactPreference: ContactPreference.SMS,
    creationDate: new Date('2024-05-10'),
    lastUpdateDate: new Date('2024-05-15'),
    projectStatus: ProjectStatus.ARappeler,
    propertyType: PropertyType.Immeuble,
    budgetMin: 1000000,
    budgetMax: 1500000,
    transactionType: TransactionType.Achat,
    source: ContactSource.Prospection,
    remarks: [{id: 'rem-3', text: "Rappeler la semaine prochaine pour discuter stratégie.", timestamp: new Date('2024-05-15')}],
    savedListings: [],
    documents: [],
    marketingConsent: true,
    compatibilityScore: 65,
    projectPriority: ProjectPriority.Moyenne,
    financingStatus: FinancingStatus.EnCours,
  },
];

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(10, 0, 0, 0);

const nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 7);
nextWeek.setHours(14, 30, 0, 0);

const pastDate = new Date();
pastDate.setDate(pastDate.getDate() - 10);
pastDate.setHours(16, 0, 0, 0);


export const initialAppointments: Appointment[] = [
  {
    id: 'appt-1',
    contactId: 'contact-1',
    title: 'Visite Maison avec jardin',
    date: tomorrow,
    notes: 'Visite de la maison avec jardin mentionnée dans ses favoris.',
    status: AppointmentStatus.Prevu,
    reliability: AppointmentReliability.Haute,
  },
   {
    id: 'appt-2',
    contactId: 'contact-2',
    title: 'RDV découverte projet',
    date: nextWeek,
    notes: 'Premier RDV pour discuter de son projet d\'achat sur Paris.',
    status: AppointmentStatus.Prevu,
    reliability: AppointmentReliability.Moyenne,
  },
   {
    id: 'appt-3',
    contactId: 'contact-3',
    title: 'Signature acte de vente',
    date: pastDate,
    notes: 'Signature chez le notaire.',
    status: AppointmentStatus.Realise,
    reliability: AppointmentReliability.Haute,
  },
];

export const initialReports: VisitReport[] = [
  {
    id: 'report-1',
    title: 'CR Visite Appartement Rivoli',
    date: pastDate,
    creationDate: new Date(),
    propertyAddress: '55 Rue de Rivoli, 75001 Paris',
    sellerContactId: 'contact-3',
    buyerContactId: 'contact-2',
    linkedAppointmentId: 'appt-3',
    positivePoints: "Très lumineux, belle hauteur sous plafond, quartier idéal.",
    negativePoints: "Cuisine un peu petite, nécessite un rafraîchissement.",
    generalFeedback: "L'acquéreuse a beaucoup aimé l'emplacement et le charme de l'ancien. Le budget est un peu haut par rapport aux travaux à prévoir.",
    nextSteps: "Attente de la contre-visite avec un architecte.",
    buyerRating: 4,
    status: VisitReportStatus.Valide,
  }
];

export const initialSavedAnnonces: SavedAnnonce[] = [
  {
    id: 'annonce-1',
    imageUrls: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop'],
    description: "Superbe villa d'architecte avec piscine à débordement. Vue imprenable sur la mer. Prestations haut de gamme. 5 chambres, 4 salles de bains. Idéal pour une grande famille ou une résidence secondaire de luxe."
  },
];

export const initialMandates: Mandate[] = [
    {
        id: 'mandate-1',
        contactId: 'contact-3', // Louis Pasteur (Vendeur)
        propertyAddress: '55 Rue de Rivoli, 75001 Paris',
        mandateType: MandateType.Vente,
        status: MandateStatus.Vendu,
        price: 650000,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-04-28'),
        mandateNumber: 'M-2024-001',
        fees: 5,
        feeType: FeeType.Pourcentage,
        description: 'Appartement 3 pièces, 75m², vue sur jardin.',
    },
    {
        id: 'mandate-2',
        contactId: 'contact-1', // Jean Dupont (Acquereur/Vendeur)
        propertyAddress: '12 Avenue des Champs-Élysées, 75008 Paris',
        mandateType: MandateType.Vente,
        status: MandateStatus.Actif,
        price: 1200000,
        startDate: new Date('2024-05-10'),
        endDate: new Date('2024-08-10'),
        mandateNumber: 'M-2024-002',
        fees: 4.5,
        feeType: FeeType.Pourcentage,
        description: 'Magnifique Haussmannien de 150m².'
    }
];

export const initialNotificationSettings: NotificationSettings = 
  Object.values(NotificationType).reduce((acc, key) => {
    acc[key as NotificationType] = true;
    return acc;
  }, {} as NotificationSettings);