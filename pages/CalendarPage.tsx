import React, { useState, useMemo, useEffect } from 'react';
import { Appointment, Contact, ProjectStatus, AppointmentStatus, AppointmentReliability, SavedAnnonce } from '../types';
import { APPOINTMENT_STATUS_COLORS } from '../constants';
import { TrashIcon, PencilIcon, UserCircleIcon, CheckCircleIcon, BellIcon } from '../components/Icons';
import { AppointmentModal } from '../components/AppointmentModal';

interface CalendarPageProps {
  appointments: Appointment[];
  contacts: Contact[];
  savedAnnonces: SavedAnnonce[];
  onAddAppointment: (newAppointment: Omit<Appointment, 'id'>) => void;
  onUpdateAppointment: (updatedAppointment: Appointment) => void;
  onDeleteAppointment: (appointmentId: string) => void;
  onSelectContact: (contact: Contact) => void;
}

const formatTimeRemaining = (date: Date): string => {
  const now = new Date();
  const appointmentDate = new Date(date);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDay = new Date(appointmentDate);
  targetDay.setHours(0, 0, 0, 0);

  if (targetDay.getTime() < today.getTime()) return 'Passé';

  const diffTime = targetDay.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Demain';
  return `J-${diffDays}`;
};

const getReliabilityProps = (reliability: AppointmentReliability) => {
  switch (reliability) {
    case AppointmentReliability.Haute:
      return { text: 'Haute', color: 'text-green-400', icon: <CheckCircleIcon className="w-4 h-4" /> };
    case AppointmentReliability.Moyenne:
      return { text: 'Moyenne', color: 'text-yellow-400', icon: <CheckCircleIcon className="w-4 h-4" /> };
    case AppointmentReliability.Basse:
      return { text: 'Basse', color: 'text-red-400', icon: <CheckCircleIcon className="w-4 h-4" /> };
    default:
      return { text: 'N/A', color: 'text-secondary', icon: null };
  }
};

const AppointmentCard: React.FC<{
    appointment: Appointment;
    contact: Contact | undefined;
    onEdit: (appointment: Appointment) => void;
    onDelete: (appointmentId: string) => void;
    onViewContact: (contact: Contact) => void;
}> = ({ appointment, contact, onEdit, onDelete, onViewContact }) => {
    const reliability = getReliabilityProps(appointment.reliability);
    const appointmentDate = new Date(appointment.date);
    const contactName = contact ? `${contact.firstName} ${contact.lastName}` : 'Contact supprimé';

    return (
        <div className="bg-surface p-4 rounded-lg shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-grow">
                <div className="flex items-start justify-between">
                    <div>
                        <h4 className="font-bold text-lg text-primary">{appointment.title}</h4>
                        <p className="text-sm text-secondary">{contactName}</p>
                    </div>
                    <div className={`text-xs font-semibold px-2 py-1 rounded-full ${APPOINTMENT_STATUS_COLORS[appointment.status]}`}>
                        {appointment.status}
                    </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-secondary">
                    <div className="flex items-center gap-1 font-semibold text-accent">
                        <span>{formatTimeRemaining(appointmentDate)}</span>
                    </div>
                    <span>|</span>
                    <div className="flex items-center gap-1">
                         <span>{appointmentDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono">
                         <span>{appointmentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <span>|</span>
                    <div className={`flex items-center gap-1 font-semibold ${reliability.color}`}>
                        {reliability.icon}
                        <span>Fiabilité: {reliability.text}</span>
                    </div>
                    {appointment.reminderSent && (
                        <div title="Rappel de notification envoyé" className="flex items-center gap-1 text-green-400">
                           <BellIcon className="w-4 h-4" />
                           <span>Rappel envoyé</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex-shrink-0 flex md:flex-col items-center justify-end gap-2">
                <button onClick={() => contact && onViewContact(contact)} disabled={!contact} className="flex items-center gap-1.5 text-sm text-brand-light hover:underline disabled:text-secondary disabled:no-underline disabled:cursor-not-allowed"><UserCircleIcon className="w-4 h-4"/>Voir dossier</button>
                <div className="flex items-center gap-2">
                    <button onClick={() => onEdit(appointment)} className="p-2 rounded-full hover:bg-surface-secondary"><PencilIcon className="w-5 h-5"/></button>
                    <button onClick={() => {
                        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")) {
                            onDelete(appointment.id)
                        }
                    }} className="p-2 rounded-full hover:bg-surface-secondary text-red-500"><TrashIcon className="w-5 h-5"/></button>
                </div>
            </div>
        </div>
    );
};


export const CalendarPage: React.FC<CalendarPageProps> = ({ appointments, contacts, savedAnnonces, onAddAppointment, onUpdateAppointment, onDeleteAppointment, onSelectContact }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay() === 0 ? 6 : startOfMonth.getDay() - 1; 
  const daysInMonth = endOfMonth.getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: startDay }, (_, i) => null);
  const calendarDays = [...blanks, ...days];
  
  const today = new Date();

  const getAppointmentsForDay = (day: number) => {
      return appointments.filter(appt => {
          const apptDate = new Date(appt.date);
          return apptDate.getFullYear() === currentDate.getFullYear() &&
                 apptDate.getMonth() === currentDate.getMonth() &&
                 apptDate.getDate() === day;
      });
  };
  
  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };
  
  const handleAddNew = () => {
    setAppointmentToEdit(null);
    setIsModalOpen(true);
  };
  
  const handleEdit = (appointment: Appointment) => {
    setAppointmentToEdit(appointment);
    setIsModalOpen(true);
  };

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    // Set time to 00:00:00 to include all of today's appointments
    now.setHours(0, 0, 0, 0);
    return appointments
      .filter(a => new Date(a.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments]);

  return (
    <div className="space-y-8">
        <div>
            <h3 className="text-2xl font-bold text-primary mb-4">Rendez-vous à venir</h3>
            <div className="space-y-4">
                {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map(appt => (
                        <AppointmentCard
                            key={appt.id}
                            appointment={appt}
                            contact={contacts.find(c => c.id === appt.contactId)}
                            onEdit={handleEdit}
                            onDelete={onDeleteAppointment}
                            onViewContact={onSelectContact}
                        />
                    ))
                ) : (
                    <div className="text-center p-8 bg-surface rounded-lg">
                        <p className="text-secondary italic">Aucun rendez-vous à venir.</p>
                    </div>
                )}
            </div>
        </div>
        
        <div className="bg-surface p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-surface-secondary transition-colors">&lt;</button>
                <h2 className="text-2xl font-bold text-primary capitalize">
                    {currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-surface-secondary transition-colors">&gt;</button>
            </div>
            <button 
            onClick={handleAddNew}
            className="bg-brand hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
            Nouveau RDV
            </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center font-semibold text-secondary">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => <div key={day} className="py-2">{day}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
            const isToday = day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
            const dayAppointments = day ? getAppointmentsForDay(day) : [];
            return (
                <div key={index} className="h-32 bg-background border border-border rounded-md p-2 flex flex-col overflow-hidden">
                {day && (
                    <>
                    <span className={`font-bold ${isToday ? 'bg-brand text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>{day}</span>
                    <div className="mt-1 space-y-1 overflow-y-auto text-left text-xs">
                        {dayAppointments.map(appt => {
                            const contact = contacts.find(c => c.id === appt.contactId);
                            return (
                                <div key={appt.id} className="bg-blue-900/80 dark:bg-blue-900 p-1 rounded">
                                    <p className="font-semibold text-white truncate">{appt.title}</p>
                                    {contact && <p className="text-blue-200 truncate">{contact.firstName} {contact.lastName}</p>}
                                </div>
                            )
                        })}
                    </div>
                    </>
                )}
                </div>
            );
            })}
        </div>
        </div>

        <AppointmentModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            contacts={contacts} 
            onAdd={onAddAppointment}
            onUpdate={onUpdateAppointment}
            appointmentToEdit={appointmentToEdit}
            savedAnnonces={savedAnnonces}
        />
    </div>
  );
};