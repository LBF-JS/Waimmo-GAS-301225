import { Civility, FunnelStage, ProjectStatus, ContactType, ContactPreference, PropertyType, TransactionType, ProjectPriority, FinancingStatus, ContactSource, AppointmentStatus, AppointmentReliability, VisitReportStatus, DocumentType, ListingStatus, MandateType, MandateStatus, FeeType, PropertyCondition, PropertyQuality, PropertyLuminosity, PropertyOrientation, PropertyContext, PropertyVisAVis, NeighborhoodAmbiance, DPECategory, InteriorMaterialQuality, PropertyStyle } from './types';

export const CIVILITY_OPTIONS = Object.values(Civility);
export const FUNNEL_STAGE_OPTIONS = Object.values(FunnelStage);
export const PROJECT_STATUS_OPTIONS = Object.values(ProjectStatus);
export const CONTACT_TYPE_OPTIONS = Object.values(ContactType);
export const CONTACT_PREFERENCE_OPTIONS = Object.values(ContactPreference);
export const PROPERTY_TYPE_OPTIONS = Object.values(PropertyType);
export const TRANSACTION_TYPE_OPTIONS = Object.values(TransactionType);
export const PROJECT_PRIORITY_OPTIONS = Object.values(ProjectPriority);
export const FINANCING_STATUS_OPTIONS = Object.values(FinancingStatus);
export const CONTACT_SOURCE_OPTIONS = Object.values(ContactSource);
export const PROPERTY_CONDITION_OPTIONS = Object.values(PropertyCondition);
export const PROPERTY_QUALITY_OPTIONS = Object.values(PropertyQuality);
export const PROPERTY_LUMINOSITY_OPTIONS = Object.values(PropertyLuminosity);
export const PROPERTY_ORIENTATION_OPTIONS = Object.values(PropertyOrientation);
export const PROPERTY_CONTEXT_OPTIONS = Object.values(PropertyContext);
export const PROPERTY_VIS_A_VIS_OPTIONS = Object.values(PropertyVisAVis);
export const NEIGHBORHOOD_AMBIANCE_OPTIONS = Object.values(NeighborhoodAmbiance);
export const DPE_CATEGORY_OPTIONS = Object.values(DPECategory);
export const INTERIOR_MATERIAL_QUALITY_OPTIONS = Object.values(InteriorMaterialQuality);
export const PROPERTY_STYLE_OPTIONS = Object.values(PropertyStyle);

export const APPOINTMENT_STATUS_OPTIONS = Object.values(AppointmentStatus);
export const APPOINTMENT_RELIABILITY_OPTIONS = Object.values(AppointmentReliability);
export const VISIT_REPORT_STATUS_OPTIONS = Object.values(VisitReportStatus);
export const DOCUMENT_TYPE_OPTIONS = Object.values(DocumentType);
export const LISTING_STATUS_OPTIONS = Object.values(ListingStatus);

// FIX: Add missing mandate-related constants
export const MANDATE_TYPE_OPTIONS = Object.values(MandateType);
export const MANDATE_STATUS_OPTIONS = Object.values(MandateStatus);
export const FEE_TYPE_OPTIONS = Object.values(FeeType);

export const ESTIMATION_FEATURES_OPTIONS = [
    'Piscine', 'Terrasse', 'Balcon', 'Jardin', 'Garage', 'Garage double', 'Parking', 
    'Climatisation', 'Pompe à chaleur', 'Cheminée', 'Vue dégagée', 
    'Proche des commerces', 'Proche des écoles', 'Transport en commun',
    'Maison mitoyenne', 'Maison à étage', 'Pergola', 'Jardin entretenu', 'Chauffage gaz', 'Chauffage électricité'
];

export const IMPORTANT_FEATURES_OPTIONS = [
    'Piscine', 'Terrasse', 'Balcon', 'Jardin', 'Garage', 'Parking',
    'Ascenseur', 'Climatisation', 'Cheminée', 'Vue dégagée', 'Sans vis-à-vis',
    'Plain-pied', 'Dernier étage', 'Cuisine équipée', 'Cave', 'Sous-sol',
    'Dépendances', 'Proche commerces', 'Proche écoles', 'Proche transports'
];


export const STATUS_COLORS: Record<ProjectStatus, string> = {
  [ProjectStatus.Nouveau]: 'bg-blue-500 text-white',
  [ProjectStatus.EnCours]: 'bg-yellow-500 text-black',
  [ProjectStatus.ARappeler]: 'bg-orange-500 text-white',
  [ProjectStatus.EnAttente]: 'bg-purple-500 text-white',
  [ProjectStatus.OffreFaite]: 'bg-teal-500 text-white',
  [ProjectStatus.Termine]: 'bg-green-600 text-white',
  [ProjectStatus.Perdu]: 'bg-red-600 text-white',
};

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
    [AppointmentStatus.Prevu]: 'bg-blue-500 text-white',
    [AppointmentStatus.Realise]: 'bg-green-500 text-white',
    [AppointmentStatus.Annule]: 'bg-red-500 text-white',
    [AppointmentStatus.Reporte]: 'bg-yellow-500 text-black',
};

export const VISIT_REPORT_STATUS_COLORS: Record<VisitReportStatus, string> = {
    [VisitReportStatus.Nouveau]: 'bg-blue-500 text-white',
    [VisitReportStatus.EnCours]: 'bg-yellow-500 text-black',
    [VisitReportStatus.AValider]: 'bg-orange-500 text-white',
    [VisitReportStatus.Valide]: 'bg-green-500 text-white',
    [VisitReportStatus.Archive]: 'bg-gray-500 text-white',
};

export const LISTING_STATUS_COLORS: Record<ListingStatus, string> = {
    [ListingStatus.Nouveau]: 'bg-blue-500 text-white',
    [ListingStatus.AVisiter]: 'bg-orange-500 text-white',
    [ListingStatus.Visitee]: 'bg-yellow-500 text-black',
    [ListingStatus.Validee]: 'bg-green-600 text-white',
    [ListingStatus.Refusee]: 'bg-red-600 text-white',
    [ListingStatus.EnAttente]: 'bg-purple-500 text-white',
};

// FIX: Add missing mandate status colors
export const MANDATE_STATUS_COLORS: Record<MandateStatus, string> = {
  [MandateStatus.Actif]: 'bg-green-500 text-white',
  [MandateStatus.EnAttente]: 'bg-yellow-500 text-black',
  [MandateStatus.Vendu]: 'bg-blue-600 text-white',
  [MandateStatus.Expire]: 'bg-gray-500 text-white',
  [MandateStatus.Annule]: 'bg-red-600 text-white',
};

export const CONTACT_TYPE_COLORS: Record<ContactType, string> = {
  [ContactType.Acquereur]: 'border-blue-500',
  [ContactType.Vendeur]: 'border-green-500',
  [ContactType.AcquereurVendeur]: 'border-teal-500',
  [ContactType.Locataire]: 'border-yellow-500',
  [ContactType.Bailleur]: 'border-purple-500',
  [ContactType.Investisseur]: 'border-indigo-500',
  [ContactType.Partenaire]: 'border-pink-500',
};

export const CONTACT_TYPE_BG_COLORS: Record<ContactType, string> = {
  [ContactType.Acquereur]: 'bg-blue-500 text-white',
  [ContactType.Vendeur]: 'bg-green-500 text-white',
  [ContactType.AcquereurVendeur]: 'bg-teal-500 text-white',
  [ContactType.Locataire]: 'bg-yellow-500 text-black',
  [ContactType.Bailleur]: 'bg-purple-500 text-white',
  [ContactType.Investisseur]: 'bg-indigo-500 text-white',
  [ContactType.Partenaire]: 'bg-pink-500 text-white',
};