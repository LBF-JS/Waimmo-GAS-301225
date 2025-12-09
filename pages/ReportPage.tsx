import React from 'react';
import { VisitReport, Contact } from '../types';
import { PencilIcon, TrashIcon, StarIcon } from '../components/Icons';
import { VISIT_REPORT_STATUS_COLORS } from '../constants';

interface ReportPageProps {
  reports: VisitReport[];
  contacts: Contact[];
  onDeleteReport: (reportId: string) => void;
  onSelectContact: (contact: Contact) => void;
  onOpenNewReportModal: () => void;
  onOpenEditReportModal: (report: VisitReport) => void;
}

export const ReportPage: React.FC<ReportPageProps> = ({ reports, contacts, onDeleteReport, onSelectContact, onOpenNewReportModal, onOpenEditReportModal }) => {

  const handleAddNew = () => {
    onOpenNewReportModal();
  };

  const handleEdit = (report: VisitReport) => {
    onOpenEditReportModal(report);
  };
  
  const getContactName = (contactId: string | null) => {
    if (!contactId) return 'N/A';
    const contact = contacts.find(c => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : 'Contact inconnu';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-primary">Gestion des Visites</h2>
        <button
          onClick={handleAddNew}
          className="bg-brand hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
          Créer un compte rendu
        </button>
      </div>

      <div className="bg-surface p-4 rounded-lg shadow-lg">
        <div className="space-y-4">
          {reports.length > 0 ? (
            reports.map(report => (
              <div key={report.id} className="bg-surface-secondary p-4 rounded-lg flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-primary">{report.title}</h3>
                     <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                        <div className={`text-xs font-semibold px-2 py-1 rounded-full ${VISIT_REPORT_STATUS_COLORS[report.status]}`}>
                            {report.status}
                        </div>
                        <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                                <StarIcon key={i} className={`w-5 h-5 ${i < report.buyerRating ? 'text-yellow-400' : 'text-secondary opacity-50'}`} />
                            ))}
                        </div>
                    </div>
                  </div>
                  <p className="text-sm text-secondary">{report.propertyAddress}</p>
                  <div className="text-xs text-secondary mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      <span><strong>Date:</strong> {new Date(report.date).toLocaleDateString('fr-FR')}</span>
                      <span><strong>Vendeur:</strong> {getContactName(report.sellerContactId)}</span>
                      <span><strong>Acquéreur:</strong> {getContactName(report.buyerContactId)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end md:self-center">
                    <button onClick={() => handleEdit(report)} className="p-2 rounded-full hover:bg-surface-secondary"><PencilIcon className="w-5 h-5"/></button>
                    <button onClick={() => onDeleteReport(report.id)} className="p-2 rounded-full hover:bg-surface-secondary text-red-500"><TrashIcon className="w-5 h-5"/></button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-secondary italic py-8">Aucun compte rendu de visite.</p>
          )}
        </div>
      </div>
    </div>
  );
};