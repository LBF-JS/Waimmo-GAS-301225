import React, { useState, useEffect } from 'react';
import { VisitReport, Contact, Appointment, ContactType, VisitReportStatus } from '../types';
import { Modal } from './Modal';
import { StarRating } from './StarRating';
import { VISIT_REPORT_STATUS_OPTIONS } from '../constants';

interface ReportFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<VisitReport, 'id' | 'creationDate'>) => void;
    reportToEdit: VisitReport | null;
    initialData?: Partial<Omit<VisitReport, 'id' | 'creationDate'>>;
    contacts: Contact[];
    appointments: Appointment[];
}

const getInitialFormData = (report: VisitReport | null, initialData?: Partial<Omit<VisitReport, 'id' | 'creationDate'>>) => {
    if (report) {
        return {
            title: report.title,
            date: new Date(report.date).toISOString().split('T')[0],
            propertyAddress: report.propertyAddress,
            sellerContactId: report.sellerContactId || '',
            buyerContactId: report.buyerContactId,
            linkedAppointmentId: report.linkedAppointmentId || '',
            positivePoints: report.positivePoints,
            negativePoints: report.negativePoints,
            generalFeedback: report.generalFeedback,
            nextSteps: report.nextSteps,
            buyerRating: report.buyerRating,
            status: report.status,
        };
    }
    const baseData = {
        title: '',
        date: new Date().toISOString().split('T')[0],
        propertyAddress: '',
        sellerContactId: '',
        buyerContactId: '',
        linkedAppointmentId: '',
        positivePoints: '',
        negativePoints: '',
        generalFeedback: '',
        nextSteps: '',
        buyerRating: 3,
        status: VisitReportStatus.Nouveau,
    };
    if (initialData) {
        return {
            ...baseData,
            ...initialData,
            date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : baseData.date,
        }
    }
    return baseData;
};

export const ReportFormModal: React.FC<ReportFormModalProps> = ({ isOpen, onClose, onSave, reportToEdit, initialData, contacts, appointments }) => {
    const [formData, setFormData] = useState(getInitialFormData(reportToEdit, initialData));

    useEffect(() => {
        setFormData(getInitialFormData(reportToEdit, initialData));
    }, [reportToEdit, initialData, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRatingChange = (value: number) => {
        setFormData({ ...formData, buyerRating: value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { sellerContactId, linkedAppointmentId, ...rest } = formData;
        onSave({
            ...rest,
            status: formData.status as VisitReportStatus,
            buyerRating: Number(formData.buyerRating),
            date: new Date(formData.date),
            sellerContactId: sellerContactId || null,
            linkedAppointmentId: linkedAppointmentId || null,
        });
    };
    
    const buyers = contacts.filter(c => c.contactType === ContactType.Acquereur || c.contactType === ContactType.AcquereurVendeur);
    const sellers = contacts.filter(c => c.contactType === ContactType.Vendeur || c.contactType === ContactType.AcquereurVendeur);


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={reportToEdit ? "Modifier le compte rendu" : "Nouveau compte rendu"} widthClass="max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Titre du compte rendu" name="title" value={formData.title} onChange={handleChange} required />
                    <InputField label="Date de la visite" name="date" type="date" value={formData.date} onChange={handleChange} required />
                </div>
                <InputField label="Adresse du bien visité" name="propertyAddress" value={formData.propertyAddress} onChange={handleChange} required />
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SelectField label="Acquéreur (visiteur)" name="buyerContactId" value={formData.buyerContactId} onChange={handleChange} required>
                        <option value="">Sélectionner l'acquéreur</option>
                        {buyers.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                    </SelectField>
                     <SelectField label="Vendeur (propriétaire)" name="sellerContactId" value={formData.sellerContactId} onChange={handleChange}>
                        <option value="">Sélectionner le vendeur</option>
                        {sellers.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                    </SelectField>
                    <SelectField label="RDV lié (optionnel)" name="linkedAppointmentId" value={formData.linkedAppointmentId} onChange={handleChange}>
                        <option value="">Lier à un RDV</option>
                        {appointments.map(a => <option key={a.id} value={a.id}>{a.title} - {new Date(a.date).toLocaleDateString()}</option>)}
                    </SelectField>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-2">Note de l'acquéreur pour le bien</label>
                        <StarRating count={5} value={formData.buyerRating} onChange={handleRatingChange} />
                    </div>
                    <SelectField label="Statut du compte rendu" name="status" value={formData.status} onChange={handleChange} required>
                        {VISIT_REPORT_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </SelectField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextareaField label="Points positifs" name="positivePoints" value={formData.positivePoints} onChange={handleChange} />
                    <TextareaField label="Points négatifs" name="negativePoints" value={formData.negativePoints} onChange={handleChange} />
                </div>
                 <TextareaField label="Feedback général" name="generalFeedback" value={formData.generalFeedback} onChange={handleChange} />
                 <TextareaField label="Prochaines étapes" name="nextSteps" value={formData.nextSteps} onChange={handleChange} />

                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="bg-surface-secondary text-primary font-bold py-2 px-4 rounded-md">Annuler</button>
                    <button type="submit" className="bg-brand text-white font-bold py-2 px-4 rounded-md">{reportToEdit ? "Enregistrer" : "Créer"}</button>
                </div>
            </form>
        </Modal>
    )
};

const InputField = (props: React.ComponentProps<'input'> & { label: string }) => (
  <div>
    <label htmlFor={props.name} className="block text-sm font-medium text-secondary">{props.label}</label>
    <input id={props.name} {...props} className="mt-1 block w-full bg-input border-border rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm text-primary p-2" />
  </div>
);

const SelectField = (props: React.ComponentProps<'select'> & { label: string }) => (
  <div>
    <label htmlFor={props.name} className="block text-sm font-medium text-secondary">{props.label}</label>
    <select id={props.name} {...props} className="mt-1 block w-full bg-input border-border rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm text-primary p-2" />
  </div>
);

const TextareaField = (props: React.ComponentProps<'textarea'> & { label: string }) => (
  <div>
    <label htmlFor={props.name} className="block text-sm font-medium text-secondary">{props.label}</label>
    <textarea id={props.name} {...props} rows={4} className="mt-1 block w-full bg-input border-border rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm text-primary p-2" />
  </div>
);