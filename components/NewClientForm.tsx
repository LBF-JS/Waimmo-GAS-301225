import React, { useState, useCallback } from 'react';
// FIX: Import missing enums to resolve type errors in initialFormData.
import { Contact, Civility, FunnelStage, ProjectStatus, ContactType, ContactPreference, PropertyType, TransactionType, ProjectPriority, FinancingStatus, ContactSource } from '../types';
import { CIVILITY_OPTIONS, FUNNEL_STAGE_OPTIONS, CONTACT_TYPE_OPTIONS, CONTACT_PREFERENCE_OPTIONS, PROJECT_STATUS_OPTIONS, PROPERTY_TYPE_OPTIONS, TRANSACTION_TYPE_OPTIONS, PROJECT_PRIORITY_OPTIONS, FINANCING_STATUS_OPTIONS, CONTACT_SOURCE_OPTIONS } from '../constants';
import { ChevronDownIcon } from './Icons';

// FIX: Export NewContactData type so it can be used to correctly type props in other components like App.tsx.
// FIX: Omit 'compatibilityScore' as it is calculated on contact creation and not provided through the form.
// FIX: Omit 'documents' as it is initialized as an empty array on contact creation and not provided through the form.
export type NewContactData = Omit<Contact, 'id' | 'savedListings' | 'remarks' | 'documents' | 'creationDate' | 'lastUpdateDate' | 'adminStatus' | 'compatibilityScore'> & { initialRemark: string };

interface NewContactFormProps {
  onSave: (newContact: NewContactData) => void;
  onCancel: () => void;
}

const getInitialFormData = (): NewContactData => ({
  civility: Civility.M,
  firstName: '',
  lastName: '',
  contactType: ContactType.Acquereur,
  funnelStage: FunnelStage.Prospect,
  company: '',
  jobTitle: '',
  avatarUrl: '',
  address: '',
  phone1: '',
  phone2: '',
  email1: '',
  email2: '',
  socialLink: '',
  contactPreference: ContactPreference.Email,
  projectStatus: ProjectStatus.Nouveau,
  propertyType: PropertyType.Appartement,
  desiredAreas: '',
  budgetMin: 0,
  budgetMax: 0,
  minRooms: 0,
  minSurface: 0,
  transactionType: TransactionType.Achat,
  specificCriteria: '',
  projectPriority: ProjectPriority.Moyenne,
  financingStatus: FinancingStatus.EnCours,
  source: ContactSource.SiteWeb,
  marketingConsent: true,
  initialRemark: '',
});

export const NewClientForm: React.FC<NewContactFormProps> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState(getInitialFormData);
  const [openSection, setOpenSection] = useState('identification');

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const isNumber = type === 'number';
    
    setFormData(prev => ({ 
        ...prev, 
        [name]: isCheckbox ? (e.target as HTMLInputElement).checked : (isNumber ? Number(value) : value)
    }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <AccordionSection title="Identification du contact" name="identification" openSection={openSection} setOpenSection={setOpenSection}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SelectField label="Civilité" name="civility" value={formData.civility} onChange={handleInputChange} options={CIVILITY_OPTIONS} />
            <InputField label="Prénom" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
            <InputField label="Nom" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
            <SelectField label="Type de contact" name="contactType" value={formData.contactType} onChange={handleInputChange} options={CONTACT_TYPE_OPTIONS} />
            <InputField label="Société" name="company" value={formData.company} onChange={handleInputChange} />
            <InputField label="Fonction" name="jobTitle" value={formData.jobTitle} onChange={handleInputChange} />
            <div className="md:col-span-3">
                <InputField label="URL Photo / Avatar" name="avatarUrl" value={formData.avatarUrl} onChange={handleInputChange} />
            </div>
        </div>
      </AccordionSection>

      <AccordionSection title="Coordonnées" name="coordinates" openSection={openSection} setOpenSection={setOpenSection}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Adresse postale" name="address" value={formData.address} onChange={handleInputChange} />
            <SelectField label="Préférence de contact" name="contactPreference" value={formData.contactPreference} onChange={handleInputChange} options={CONTACT_PREFERENCE_OPTIONS} />
            <InputField label="Téléphone principal" name="phone1" value={formData.phone1} onChange={handleInputChange} required />
            <InputField label="Téléphone secondaire" name="phone2" value={formData.phone2} onChange={handleInputChange} />
            <InputField label="Email principal" name="email1" type="email" value={formData.email1} onChange={handleInputChange} required />
            <InputField label="Email secondaire" name="email2" type="email" value={formData.email2} onChange={handleInputChange} />
             <div className="md:col-span-2">
                <InputField label="Lien réseaux sociaux" name="socialLink" value={formData.socialLink} onChange={handleInputChange} />
            </div>
        </div>
      </AccordionSection>
      
      <AccordionSection title="Projet immobilier" name="project" openSection={openSection} setOpenSection={setOpenSection}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SelectField label="Statut du projet" name="projectStatus" value={formData.projectStatus} onChange={handleInputChange} options={PROJECT_STATUS_OPTIONS} />
            <SelectField label="Type de bien" name="propertyType" value={formData.propertyType} onChange={handleInputChange} options={PROPERTY_TYPE_OPTIONS} />
            <SelectField label="Type d'opération" name="transactionType" value={formData.transactionType} onChange={handleInputChange} options={TRANSACTION_TYPE_OPTIONS} />
            <InputField label="Budget min (€)" name="budgetMin" type="number" value={String(formData.budgetMin)} onChange={handleInputChange} />
            <InputField label="Budget max (€)" name="budgetMax" type="number" value={String(formData.budgetMax)} onChange={handleInputChange} />
            <SelectField label="Priorité" name="projectPriority" value={formData.projectPriority} onChange={handleInputChange} options={PROJECT_PRIORITY_OPTIONS} />
            <InputField label="Pièces min" name="minRooms" type="number" value={String(formData.minRooms)} onChange={handleInputChange} />
            <InputField label="Surface min (m²)" name="minSurface" type="number" value={String(formData.minSurface)} onChange={handleInputChange} />
            <SelectField label="Financement" name="financingStatus" value={formData.financingStatus} onChange={handleInputChange} options={FINANCING_STATUS_OPTIONS} />
            <div className="lg:col-span-3">
                <InputField label="Secteurs géographiques" name="desiredAreas" value={formData.desiredAreas} onChange={handleInputChange} placeholder="Ex: Toulouse centre, Blagnac" />
            </div>
            <div className="lg:col-span-3">
                <InputField label="Critères spécifiques" name="specificCriteria" value={formData.specificCriteria} onChange={handleInputChange} placeholder="Ex: Jardin, Garage, Ascenseur"/>
            </div>
        </div>
      </AccordionSection>
      
       <AccordionSection title="Relation & Statut" name="relation" openSection={openSection} setOpenSection={setOpenSection}>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField label="Étape du funnel" name="funnelStage" value={formData.funnelStage} onChange={handleInputChange} options={FUNNEL_STAGE_OPTIONS} />
            <SelectField label="Source du contact" name="source" value={formData.source} onChange={handleInputChange} options={CONTACT_SOURCE_OPTIONS} />
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-secondary">Remarque initiale</label>
                <textarea name="initialRemark" value={formData.initialRemark} onChange={handleInputChange} rows={3} className="mt-1 block w-full bg-input border-border rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm text-primary p-2" />
            </div>
            <div className="flex items-center space-x-2">
                <input type="checkbox" id="marketingConsent" name="marketingConsent" checked={formData.marketingConsent} onChange={handleInputChange} className="h-4 w-4 rounded border-border bg-input text-accent focus:ring-accent" />
                <label htmlFor="marketingConsent" className="text-sm text-secondary">Consentement marketing (opt-in)</label>
            </div>
         </div>
      </AccordionSection>

      <div className="flex justify-end pt-4 space-x-2">
        <button type="button" onClick={onCancel} className="bg-surface-secondary text-primary font-bold py-2 px-4 rounded-md hover:bg-opacity-80 transition-colors">
          Annuler
        </button>
        <button type="submit" className="bg-brand hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-md transition-colors">
          Créer Dossier
        </button>
      </div>
    </form>
  );
};

const AccordionSection: React.FC<{title: string, name: string, openSection: string, setOpenSection: (name: string) => void, children: React.ReactNode}> = ({ title, name, openSection, setOpenSection, children }) => {
    const isOpen = openSection === name;
    return (
        <div className="border border-border rounded-lg overflow-hidden">
            <button type="button" onClick={() => setOpenSection(isOpen ? '' : name)} className="w-full flex justify-between items-center p-3 bg-surface-secondary/50 hover:bg-surface-secondary">
                <h3 className="font-semibold text-primary">{title}</h3>
                <ChevronDownIcon className={`w-5 h-5 text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="p-4 bg-surface">{children}</div>}
        </div>
    )
};


const InputField = (props: { label: string, name: string, value: string | number, onChange: (e: any) => void, type?: string, required?: boolean, placeholder?: string }) => (
  <div>
    <label htmlFor={props.name} className="block text-sm font-medium text-secondary">{props.label}</label>
    <input id={props.name} {...props} className="mt-1 block w-full bg-input border-border rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm text-primary p-2" />
  </div>
);

const SelectField = ({ label, name, value, onChange, options, required = false }: { label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: string[], required?: boolean }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-secondary">{label}</label>
    <select id={name} name={name} value={value} onChange={onChange} required={required} className="mt-1 block w-full bg-input border-border rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm text-primary p-2">
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);