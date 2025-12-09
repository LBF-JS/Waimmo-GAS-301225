import React from 'react';
import { Contact, Appointment } from '../types';
import { STATUS_COLORS, CONTACT_TYPE_COLORS } from '../constants';
import { SparklesIcon, CalendarDaysIcon, BookmarkSquareIcon, ClockIcon } from './Icons';

interface ContactCardProps {
  contact: Contact;
  onClick: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, contactId: string) => void;
  appointmentCount: number;
  nextAppointment?: Appointment;
}

const BudgetDisplay: React.FC<{ min?: number, max?: number }> = ({ min, max }) => {
    const formatCurrency = (val: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(val);
    
    if (min && max) {
        return <>{formatCurrency(min)} - {formatCurrency(max)}</>;
    }
    if (max) {
        return <>{formatCurrency(max)}</>;
    }
    if (min) {
        return <>À partir de {formatCurrency(min)}</>;
    }
    return <>N/A</>;
}

export const ClientCard: React.FC<ContactCardProps> = ({ contact, onClick, onDragStart, appointmentCount, nextAppointment }) => {
    
  const getScoreColor = (score: number) => {
    if (score > 85) return 'from-teal-400 to-cyan-500';
    if (score > 70) return 'from-green-400 to-blue-500';
    if (score > 50) return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-pink-500';
  };

  return (
    <div 
        onClick={onClick}
        draggable
        onDragStart={(e) => onDragStart(e, contact.id)}
        className={`bg-surface p-4 rounded-lg shadow-lg cursor-grab hover:shadow-brand-dark/50 transition-all duration-300 transform hover:-translate-y-1 active:cursor-grabbing border-l-4 ${CONTACT_TYPE_COLORS[contact.contactType]}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-primary">{contact.firstName} {contact.lastName}</h3>
          <p className="text-sm text-secondary">{contact.contactType}</p>
        </div>
        <div className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[contact.projectStatus]}`}>
          {contact.projectStatus}
        </div>
      </div>
      <div className="mt-4 space-y-3 text-sm">
        <div className="flex items-center">
            <span className="text-secondary w-16 shrink-0">Budget:</span>
            <span className="font-lato font-bold text-primary truncate"><BudgetDisplay min={contact.budgetMin} max={contact.budgetMax} /></span>
        </div>
        <div className="flex items-center">
            <span className="text-secondary w-16 shrink-0">Priorité:</span>
            <span className="font-semibold text-primary">{contact.projectPriority || 'N/A'}</span>
        </div>
         {contact.compatibilityScore && (
          <div className="flex items-center" title={`Score de compatibilité : ${contact.compatibilityScore}%`}>
            <span className="text-secondary w-16 shrink-0 flex items-center gap-1.5"><SparklesIcon className="w-4 h-4 text-yellow-300"/> Score:</span>
            <div className="flex-grow flex items-center">
              <div className="w-full bg-surface-secondary rounded-full h-2">
                  <div 
                      className={`bg-gradient-to-r ${getScoreColor(contact.compatibilityScore)} h-2 rounded-full`}
                      style={{ width: `${contact.compatibilityScore}%` }}
                  ></div>
              </div>
              <span className="font-lato text-primary font-semibold ml-3 w-8 text-right">{contact.compatibilityScore}%</span>
            </div>
          </div>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
        <div className="flex items-center text-xs text-secondary gap-2">
            <CalendarDaysIcon className="w-4 h-4" />
            <span>{appointmentCount} RDV</span>
            <span className="mx-1">|</span>
            <BookmarkSquareIcon className="w-4 h-4" />
            <span>{contact.savedListings.length} biens</span>
        </div>
        {nextAppointment && (
            <div className="flex items-center gap-2 text-xs text-accent font-bold">
                <ClockIcon className="w-4 h-4"/>
                <span>
                    Prochain RDV: {new Date(nextAppointment.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {new Date(nextAppointment.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        )}
      </div>
    </div>
  );
};