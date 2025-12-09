import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
// FIX: Import missing mandate-related types
import { Mandate, Contact, ContactType, MandateType, MandateStatus, FeeType } from '../types';
// FIX: Import missing mandate-related constants
import { MANDATE_TYPE_OPTIONS, MANDATE_STATUS_OPTIONS, FEE_TYPE_OPTIONS } from '../constants';

interface MandatFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mandate: Omit<Mandate, 'id'> | Mandate) => void;
  mandateToEdit: Mandate | null;
  contacts: Contact[];
}

const getInitialFormData = (mandate: Mandate | null) => {
    if (mandate) {
        return {
            contactId: mandate.contactId,
            propertyAddress: mandate.propertyAddress,
            mandateType: mandate.mandateType,
            status: mandate.status,
            price: mandate.price,
            startDate: new Date(mandate.startDate).toISOString().split('T')[0],
            endDate: new Date(mandate.endDate).toISOString().split('T')[0],
            mandateNumber: mandate.mandateNumber || '',
            fees: mandate.fees || 0,
            feeType: mandate.feeType || FeeType.Pourcentage,
            description: mandate.description || '',
            keyReferences: mandate.keyReferences || '',
        };
    }
    return {
        contactId: '',
        propertyAddress: '',
        mandateType: MandateType.Vente,
        status: MandateStatus.Actif,
        price: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        mandateNumber: '',
        fees: 0,
        feeType: FeeType.Pourcentage,
        description: '',
        keyReferences: '',
    };
};

export const MandatFormModal: React.FC<MandatFormModalProps> = ({ isOpen, onClose, onSave, mandateToEdit, contacts }) => {
  const [formData, setFormData] = useState(getInitialFormData(mandateToEdit));

  useEffect(() => {
    setFormData(getInitialFormData(mandateToEdit));
  }, [mandateToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
    };

    if (mandateToEdit) {
      onSave({ ...dataToSave, id: mandateToEdit.id });
    } else {
      // Omit id for new mandates
      const { id, ...newData } = { ...dataToSave, id: '' };
      onSave(newData);
    }
    onClose();
  };

  const sellerContacts = contacts.filter(c => c.contactType === ContactType.Vendeur || c.contactType === ContactType.AcquereurVendeur);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mandateToEdit ? "Modifier le mandat" : "Ajouter un mandat"} widthClass="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField label="Vendeur" name="contactId" value={formData.contactId} onChange={handleChange} required>
                <option value="">Sélectionner un vendeur</option>
                {sellerContacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </SelectField>
            <InputField label="N° de mandat" name="mandateNumber" value={formData.mandateNumber} onChange={handleChange} />
        </div>

        <InputField label="Adresse du bien" name="propertyAddress" value={formData.propertyAddress} onChange={handleChange} required />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SelectField label="Type de mandat" name="mandateType" value={formData.mandateType} onChange={handleChange} options={MANDATE_TYPE_OPTIONS} />
            <SelectField label="Statut" name="status" value={formData.status} onChange={handleChange} options={MANDATE_STATUS_OPTIONS} />
            <InputField label="Prix (€)" name="price" type="number" value={String(formData.price)} onChange={handleChange} required />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Date de début" name="startDate" type="date" value={formData.startDate} onChange={handleChange} required />
            <InputField label="Date de fin" name="endDate" type="date" value={formData.endDate} onChange={handleChange} required />
        </div>

        <div className="border-t border-gray-700 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField label="Honoraires" name="fees" type="number" value={String(formData.fees)} onChange={handleChange} />
            <SelectField label="Type d'honoraires" name="feeType" value={formData.feeType} onChange={handleChange} options={FEE_TYPE_OPTIONS} />
            <InputField label="Réf. clés" name="keyReferences" value={formData.keyReferences} onChange={handleChange} />
        </div>

        <div>
            <label className="block text-sm font-medium text-secondary">Description courte du bien</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 block w-full bg-gray-900 border-gray-700 rounded-md p-2" />
        </div>

        <div className="flex justify-end pt-4 space-x-2">
          <button type="button" onClick={onClose} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-md">Annuler</button>
          <button type="submit" className="bg-brand text-white font-bold py-2 px-4 rounded-md">{mandateToEdit ? "Enregistrer" : "Ajouter"}</button>
        </div>
      </form>
    </Modal>
  );
};

const InputField = (props: React.ComponentProps<'input'> & { label: string }) => (
    <div>
      <label htmlFor={props.name} className="block text-sm font-medium text-secondary">{props.label}</label>
      <input id={props.name} {...props} className="mt-1 block w-full bg-gray-900 border-gray-700 rounded-md shadow-sm p-2" />
    </div>
);
  
const SelectField = (props: React.ComponentProps<'select'> & { label: string, options?: string[] }) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-secondary">{props.label}</label>
        <select id={props.name} {...props} className="mt-1 block w-full bg-gray-900 border-gray-700 rounded-md shadow-sm p-2">
            {props.options ? props.options.map(opt => <option key={opt} value={opt}>{opt}</option>) : props.children}
        </select>
    </div>
);
