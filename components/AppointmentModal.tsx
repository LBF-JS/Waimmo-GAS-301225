import React, { useState, useEffect, useMemo } from 'react';
import { Appointment, Contact, ProjectStatus, AppointmentStatus, AppointmentReliability, SavedAnnonce, SavedListing } from '../types';
import { Modal } from './Modal';
import { APPOINTMENT_STATUS_OPTIONS, APPOINTMENT_RELIABILITY_OPTIONS } from '../constants';

interface AppointmentModalProps { 
    isOpen: boolean;
    onClose: () => void; 
    contacts: Contact[];
    savedAnnonces: SavedAnnonce[];
    onAdd: (data: Omit<Appointment, 'id'>) => void;
    onUpdate: (data: Appointment) => void;
    appointmentToEdit: Appointment | null;
    initialContactId?: string;
}

const getInitialFormData = (appointment: Appointment | null, initialContactId?: string) => {
    const formatTime = (date: Date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    if (appointment) {
        const d = new Date(appointment.date);
        const minutes = d.getMinutes();
        const roundedMinutes = Math.round(minutes / 15) * 15;
        d.setMinutes(roundedMinutes, 0, 0);

        return {
            contactId: appointment.contactId,
            date: d.toISOString().split('T')[0],
            time: formatTime(d),
            title: appointment.title,
            notes: appointment.notes,
            status: appointment.status,
            reliability: appointment.reliability,
            linkedAnnonceId: appointment.linkedAnnonceId || '',
            annonceUrl: appointment.annonceUrl || '',
        };
    }
    
    // For new appointments, round up
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    now.setMinutes(roundedMinutes, 0, 0);

    return { 
        contactId: initialContactId || '', 
        date: now.toISOString().split('T')[0], 
        time: formatTime(now), 
        title: '', 
        notes: '',
        status: AppointmentStatus.Prevu,
        reliability: AppointmentReliability.Moyenne,
        linkedAnnonceId: '',
        annonceUrl: '',
    };
};


export const AppointmentModal: React.FC<AppointmentModalProps> = ({isOpen, onClose, contacts, savedAnnonces, onAdd, onUpdate, appointmentToEdit, initialContactId}) => {
    
    const [formData, setFormData] = useState(getInitialFormData(appointmentToEdit, initialContactId));

    const timeSlots = useMemo(() => {
        const slots = [];
        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += 15) {
                const hour = String(h).padStart(2, '0');
                const minute = String(m).padStart(2, '0');
                slots.push(`${hour}:${minute}`);
            }
        }
        return slots;
    }, []);

    useEffect(() => {
        setFormData(getInitialFormData(appointmentToEdit, initialContactId));
    }, [appointmentToEdit, initialContactId, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const [year, month, day] = formData.date.split('-').map(Number);
        const [hours, minutes] = formData.time.split(':').map(Number);
        const appointmentDate = new Date(year, month - 1, day, hours, minutes);

        const data = {
            contactId: formData.contactId,
            date: appointmentDate,
            title: formData.title,
            notes: formData.notes,
            status: formData.status,
            reliability: formData.reliability,
            linkedAnnonceId: formData.linkedAnnonceId,
            annonceUrl: formData.annonceUrl,
        };

        if (appointmentToEdit) {
            onUpdate({ ...data, id: appointmentToEdit.id });
        } else {
            onAdd(data);
        }
        onClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const activeContacts = contacts.filter(c => c.projectStatus !== ProjectStatus.Termine && c.projectStatus !== ProjectStatus.Perdu);
    
    const contactSavedListings = useMemo(() => {
        if (!formData.contactId) return [];
        const selectedContact = contacts.find(c => c.id === formData.contactId);
        return selectedContact?.savedListings || [];
    }, [formData.contactId, contacts]);


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={appointmentToEdit ? "Modifier le rendez-vous" : "Ajouter un rendez-vous"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-secondary">Contact</label>
                    <select name="contactId" value={formData.contactId} onChange={handleChange} required className="mt-1 block w-full bg-input border-border rounded-md p-2" disabled={!!initialContactId}>
                        <option value="">Sélectionner un contact</option>
                        {activeContacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-secondary">Titre</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full bg-input border-border rounded-md p-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary">Date</label>
                        <input type="date" name="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full bg-input border-border rounded-md p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary">Heure</label>
                        <select name="time" value={formData.time} onChange={handleChange} required className="mt-1 block w-full bg-input border-border rounded-md p-2">
                            {timeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary">Statut</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full bg-input border-border rounded-md p-2">
                            {APPOINTMENT_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-secondary">Fiabilité</label>
                        <select name="reliability" value={formData.reliability} onChange={handleChange} className="mt-1 block w-full bg-input border-border rounded-md p-2">
                            {APPOINTMENT_RELIABILITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                </div>
                <div className="border-t border-border pt-4">
                    <h4 className="text-md font-semibold text-primary mb-2">Annonce (Optionnel)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary">Lier une annonce du dossier</label>
                            <select name="linkedAnnonceId" value={formData.linkedAnnonceId} onChange={handleChange} className="mt-1 block w-full bg-input border-border rounded-md p-2" disabled={contactSavedListings.length === 0}>
                                <option value="">{contactSavedListings.length > 0 ? "Sélectionner une annonce" : "Aucune annonce dans le dossier"}</option>
                                {contactSavedListings.map(listing => <option key={listing.id} value={listing.id}>{listing.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary">Ou coller une URL d'annonce</label>
                            <input type="url" name="annonceUrl" value={formData.annonceUrl} onChange={handleChange} placeholder="https://..." className="mt-1 block w-full bg-input border-border rounded-md p-2" />
                        </div>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-secondary">Notes</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 block w-full bg-input border-border rounded-md p-2"></textarea>
                </div>
                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="bg-surface-secondary text-primary font-bold py-2 px-4 rounded-md">Annuler</button>
                    <button type="submit" className="bg-brand text-white font-bold py-2 px-4 rounded-md">{appointmentToEdit ? "Enregistrer" : "Ajouter"}</button>
                </div>
            </form>
        </Modal>
    )
}