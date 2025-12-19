import React from 'react';

export enum Civility {
  M = 'M.',
  Mme = 'Mme',
  Autre = 'Autre',
}

export enum FunnelStage {
  Prospect = 'Prospect',
  Client = 'Client',
}

export enum ProjectStatus {
  Nouveau = 'Nouveau',
  EnCours = 'En cours',
  ARappeler = 'À rappeler',
  EnAttente = 'En attente',
  OffreFaite = 'Offre faite',
  Termine = 'Terminé',
  Perdu = 'Perdu',
}

export enum ContactType {
  Acquereur = 'Acquéreur',
  Vendeur = 'Vendeur',
  AcquereurVendeur = 'Acquéreur / Vendeur',
  Locataire = 'Locataire',
  Bailleur = 'Bailleur',
  Investisseur = 'Investisseur',
  Partenaire = 'Partenaire',
}

export enum ContactPreference {
  Email = 'Email',
  Telephone = 'Téléphone',
  SMS = 'SMS',
}

export enum PropertyType {
  Maison = 'Maison',
  Appartement = 'Appartement',
  Terrain = 'Terrain',
  Immeuble = 'Immeuble',
  LocalCommercial = 'Local commercial',
}

// New enum for property condition
export enum PropertyCondition {
  Neuf = 'Neuf',
  BonEtat = 'Bon état',
  ARenover = 'À rénover',
}

export enum TransactionType {
  Achat = 'Achat',
  Vente = 'Vente',
  Location = 'Location',
  Gestion = 'Gestion',
}

export enum ProjectPriority {
  Haute = 'Haute',
  Moyenne = 'Moyenne',
  Basse = 'Basse',
}

export enum FinancingStatus {
  NonDefini = 'Non défini',
  EnCours = 'En cours',
  Approuve = 'Approuvé',
  Rejete = 'Rejeté',
  Aucun = 'Aucun',
}

export enum ContactSource {
  SiteWeb = 'Site Web',
  ReseauxSociaux = 'Réseaux Sociaux',
  Recommandation = 'Recommandation',
  Prospection = 'Prospection',
  PortailImmobilier = 'Portail Immobilier',
  Autre = 'Autre',
}

export enum AppointmentStatus {
  Prevu = 'Prévu',
  Realise = 'Réalisé',
  Annule = 'Annulé',
  Reporte = 'Reporté',
}

export enum AppointmentReliability {
    Haute = 'Haute',
    Moyenne = 'Moyenne',
    Basse = 'Basse',
}

export enum VisitReportStatus {
    Nouveau = 'Nouveau',
    EnCours = 'En cours',
    AValider = 'À valider',
    Valide = 'Validé',
    Archive = 'Archivé',
}

export enum DocumentType {
    PieceIdentite = "Pièce d'identité",
    OffreAchat = "Offre d'achat",
    JustificatifDomicile = "Justificatif de domicile",
    ContratTravail = "Contrat de travail",
    AvisImposition = "Avis d'imposition",
    TitrePropriete = "Titre de propriété",
    Autre = "Autre",
}

// FIX: Add missing mandate-related enums and interface
export enum MandateType {
    Vente = 'Vente',
    Location = 'Location',
    Recherche = 'Recherche',
}

export enum MandateStatus {
    Actif = 'Actif',
    EnAttente = 'En attente',
    Vendu = 'Vendu',
    Expire = 'Expiré',
    Annule = 'Annulé',
}

export enum FeeType {
    Pourcentage = 'Pourcentage',
    Forfait = 'Forfait',
}

export enum ListingStatus {
    Nouveau = 'Nouveau',
    AVisiter = 'À visiter',
    Visitee = 'Visitée',
    Validee = 'Validée',
    Refusee = 'Refusée',
    EnAttente = 'En attente',
}

export enum PropertyQuality {
    Inferieure = 'Inférieure',
    Comparable = 'Comparable',
    Superieure = 'Supérieure',
}

export enum PropertyLuminosity {
    Sombre = 'Sombre',
    PeuClair = 'Peu clair',
    Standard = 'Standard',
    Clair = 'Clair',
    TresClair = 'Très clair',
}

export enum PropertyOrientation {
    Nord = 'Nord',
    NordEst = 'Nord-Est',
    Est = 'Est',
    SudEst = 'Sud-Est',
    Sud = 'Sud',
    SudOuest = 'Sud-Ouest',
    Ouest = 'Ouest',
    NordOuest = 'Nord-Ouest',
}

export enum PropertyContext {
    Isolee = 'Isolée',
    Residence = 'En résidence',
}

export enum PropertyVisAVis {
    Oui = 'Oui',
    Non = 'Non',
}

export enum NeighborhoodAmbiance {
    Calme = 'Calme',
    Standard = 'Standard',
    Bruyant = 'Bruyant',
}

export enum DPECategory {
    A = 'A',
    B = 'B',
    C = 'C',
    D = 'D',
    E = 'E',
    F = 'F',
    G = 'G',
    NonRenseigne = 'Non renseigné',
}

export enum InteriorMaterialQuality {
    Basique = 'Basique',
    Moyen = 'Moyen',
    Eleve = 'Élevé',
}

export enum PropertyStyle {
    Moderne = 'Moderne',
    Ancien = 'Ancien',
    Contemporain = 'Contemporain',
    Traditionnel = 'Traditionnel',
    Caractere = 'De caractère',
    ATypique = 'Atypique',
}


export interface AssociatedDocument {
    id: string;
    name: string;
    type: DocumentType;
    fileData: string; // base64 encoded file
    mimeType: string;
    addedDate: Date;
}

export interface Remark {
  id: string;
  text: string;
  timestamp: Date;
}

export interface Listing {
  id: string;
  title: string;
  price: string;
  link: string;
  imageUrl: string;
  source: string;
  description: string;
}

export interface SavedListing extends Listing {
  contactId: string;
  savedDate: Date;
  status: ListingStatus;
  remarks: Remark[];
  tag?: string;
}

export interface Mandate {
    id: string;
    contactId: string;
    propertyAddress: string;
    mandateType: MandateType;
    status: MandateStatus;
    price: number;
    startDate: Date;
    endDate: Date;
    mandateNumber?: string;
    fees?: number;
    feeType?: FeeType;
    description?: string;
    keyReferences?: string;
}

export interface SearchCriteria {
    // Essential
    targetPrice?: number;
    priceMarginPercent?: number; // 0-100
    cities?: string; // comma-separated
    searchRadiusKm?: number;
    neighborhoods?: string; // comma-separated
    propertyTypes?: PropertyType[];
    minRooms?: number;
    minBathrooms?: number;
    minLivingArea?: number;
    minPlotArea?: number;

    // Important
    importantFeatures?: string[];
    propertyStyle?: PropertyStyle[];
}

export interface Contact {
  id: string;
  civility: Civility;
  firstName: string;
  lastName: string;
  contactType: ContactType;
  funnelStage: FunnelStage;
  company?: string;
  jobTitle?: string;
  avatarUrl?: string;
  address?: string;
  phone1: string;
  phone2?: string;
  email1: string;
  email2?: string;
  socialLink?: string;
  contactPreference: ContactPreference;
  creationDate: Date;
  lastUpdateDate: Date;
  
  // Project details
  projectStatus: ProjectStatus;
  propertyType: PropertyType;
  desiredAreas?: string;
  budgetMin?: number;
  budgetMax?: number;
  minRooms?: number;
  minSurface?: number;
  transactionType: TransactionType;
  specificCriteria?: string;
  projectPriority?: ProjectPriority;
  financingStatus?: FinancingStatus;
  searchCriteria?: SearchCriteria;
  
  // CRM details
  source: ContactSource;
  remarks: Remark[];
  savedListings: SavedListing[];
  documents: AssociatedDocument[];
  marketingConsent: boolean;
  adminStatus?: string;
  compatibilityScore?: number;
}

export interface Appointment {
  id: string;
  contactId: string;
  title: string;
  date: Date;
  notes: string;
  status: AppointmentStatus;
  reliability: AppointmentReliability;
  linkedAnnonceId?: string;
  annonceUrl?: string;
  reminderSent?: boolean;
}

export interface VisitReport {
    id: string;
    title: string;
    date: Date;
    creationDate: Date;
    propertyAddress: string;
    sellerContactId: string | null;
    buyerContactId: string;
    linkedAppointmentId: string | null;
    positivePoints: string;
    negativePoints: string;
    generalFeedback: string;
    nextSteps: string;
    buyerRating: number;
    status: VisitReportStatus;
}

export interface SavedAnnonce {
    id: string;
    imageUrls: string[];
    description: string;
}

export enum NotificationType {
    CONTACT_NEW = 'CONTACT_NEW',
    CONTACT_UPDATE = 'CONTACT_UPDATE',
    CONTACT_DELETE = 'CONTACT_DELETE',
    APPOINTMENT_NEW = 'APPOINTMENT_NEW',
    APPOINTMENT_UPDATE = 'APPOINTMENT_UPDATE',
    APPOINTMENT_DELETE = 'APPOINTMENT_DELETE',
    APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
    REPORT_NEW = 'REPORT_NEW',
    REPORT_UPDATE = 'REPORT_UPDATE',
    REPORT_DELETE = 'REPORT_DELETE',
    ANNONCE_NEW = 'ANNONCE_NEW',
    ANNONCE_UPDATE = 'ANNONCE_UPDATE',
    ANNONCE_DELETE = 'ANNONCE_DELETE',
    AGENT_INFO_UPDATE = 'AGENT_INFO_UPDATE',
}

export interface Notification {
  id: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  type: NotificationType;
  relatedContactId?: string;
}

export interface AgentInfo {
    name: string;
    legalForm: string;
    address: string;
    professionalCard: string;
    prefecture: string;
    issueDate: string; // ISO string date
    cautionMutuelle: string;
    cautionAddress: string;
    cautionNumber: string;
}

export type NotificationSettings = {
    [key in NotificationType]: boolean;
};

// Timeline Types
export type TimelineEventType = 'creation' | 'remark' | 'appointment' | 'report';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  date: Date;
  title: string;
  content?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  relatedId?: string;
}

// Estimation Types
export interface Estimation {
    id: string;
    contactId: string | null;
    address: string;
    propertyType: PropertyType;
    propertyContext?: PropertyContext;
    surface: number;
    plotSurface?: number;
    rooms: number;
    bedrooms: number;
    bathrooms: number;
    constructionYear: number;
    condition: PropertyCondition;
    quality: PropertyQuality;
    luminosity: PropertyLuminosity;
    orientation: PropertyOrientation;
    visAVis?: PropertyVisAVis;
    neighborhood?: NeighborhoodAmbiance;
    dpe?: DPECategory;
    interiorQuality?: InteriorMaterialQuality;
    features: string;
    estimatedPriceLow: number;
    estimatedPriceMedian: number;
    estimatedPriceHigh: number;
    pricePerSqm: number;
    analysis: string;
    summary?: string;
    estimationDate: Date;
}

// FIX: Add missing types for PigePage
export interface Criterion {
    id: string;
    label: string;
    type: 'select' | 'numberRange' | 'boolean' | 'text' | 'custom';
    value?: any;
    options?: string[];
}

export type ColumnId = 'essentials' | 'importants' | 'secondaries';

export interface Columns {
    essentials: Criterion[];
    importants: Criterion[];
    secondaries: Criterion[];
}
