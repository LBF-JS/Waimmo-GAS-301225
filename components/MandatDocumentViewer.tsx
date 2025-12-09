import React from 'react';
import { Modal } from './Modal';
// FIX: Import missing Mandate type
import { Mandate, Contact, AgentInfo } from '../types';
import { PrinterIcon } from './Icons';
import { MandatDocument } from './MandatDocument';

interface MandatDocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  mandate: Mandate | null;
  seller: Contact | null;
  agentInfo: AgentInfo;
}

export const MandatDocumentViewer: React.FC<MandatDocumentViewerProps> = ({ isOpen, onClose, mandate, seller, agentInfo }) => {
    
    const handlePrint = () => {
        window.print();
    };
    
    if (!mandate || !seller) {
        return null;
    }

    return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Mandat de Vente - N° ${mandate.mandateNumber || 'N/A'}`} widthClass="max-w-4xl">
      <div className="flex justify-end mb-4 no-print">
        <button onClick={handlePrint} className="bg-brand hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-md flex items-center gap-2">
          <PrinterIcon className="w-5 h-5" />
          Imprimer / Enregistrer en PDF
        </button>
      </div>
      <MandatDocument mandate={mandate} seller={seller} agentInfo={agentInfo} />
    </Modal>
  );
};
