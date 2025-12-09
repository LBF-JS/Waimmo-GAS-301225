import React, { useState, useEffect } from 'react';
import { SavedAnnonce } from '../types';
import { TrashIcon, BookmarkSquareIcon, PencilIcon, EyeIcon } from '../components/Icons';
import { Modal } from '../components/Modal';

interface MesAnnoncesPageProps {
  annonces: SavedAnnonce[];
  onDelete: (annonceId: string) => void;
  onEdit: (annonce: SavedAnnonce) => void;
}

export const MesAnnoncesPage: React.FC<MesAnnoncesPageProps> = ({ annonces, onDelete, onEdit }) => {
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingAnnonce, setViewingAnnonce] = useState<SavedAnnonce | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!isViewModalOpen) {
      setViewingAnnonce(null);
      setCurrentImageIndex(0);
    }
  }, [isViewModalOpen]);

  const handleView = (annonce: SavedAnnonce) => {
    setViewingAnnonce(annonce);
    setCurrentImageIndex(0);
    setIsViewModalOpen(true);
  };
  
  const nextImage = () => {
    if (viewingAnnonce) {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % viewingAnnonce.imageUrls.length);
    }
  };

  const prevImage = () => {
    if (viewingAnnonce) {
      setCurrentImageIndex((prevIndex) => (prevIndex - 1 + viewingAnnonce.imageUrls.length) % viewingAnnonce.imageUrls.length);
    }
  };

  return (
    <div className="space-y-6">
        <div className="bg-surface p-6 rounded-lg shadow-lg">
            <div className="flex items-center space-x-3 mb-2">
                <BookmarkSquareIcon className="w-8 h-8 text-brand"/>
                <h2 className="text-2xl font-bold text-primary">Mes Annonces Sauvegardées</h2>
            </div>
             <p className="text-sm text-secondary">
                Retrouvez ici toutes les annonces que vous avez créées et sauvegardées depuis l'Assistant Créatif.
            </p>
        </div>
        
        {annonces.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {annonces.map(annonce => (
                    <div key={annonce.id} className="bg-surface rounded-lg shadow-lg flex flex-col overflow-hidden group">
                        <div className="relative">
                           <img src={annonce.imageUrls[0]} alt="Annonce" className="w-full h-56 object-cover" />
                           <div className="absolute top-2 right-2 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleView(annonce)}
                                    className="p-2 bg-black/50 rounded-full text-white hover:bg-brand"
                                    aria-label="Voir l'annonce"
                                >
                                   <EyeIcon className="w-5 h-5" />
                               </button>
                               <button 
                                    onClick={() => onEdit(annonce)}
                                    className="p-2 bg-black/50 rounded-full text-white hover:bg-brand"
                                    aria-label="Modifier l'annonce"
                                >
                                   <PencilIcon className="w-5 h-5" />
                               </button>
                               <button 
                                    onClick={() => onDelete(annonce.id)}
                                    className="p-2 bg-black/50 rounded-full text-white hover:bg-red-600"
                                    aria-label="Supprimer l'annonce"
                                >
                                   <TrashIcon className="w-5 h-5" />
                               </button>
                           </div>
                        </div>
                        <div className="p-4 flex-grow">
                            <div 
                                className="text-sm text-secondary prose prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 whitespace-pre-wrap overflow-hidden h-32"
                                style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 6, overflow: 'hidden', textOverflow: 'ellipsis' }}
                                dangerouslySetInnerHTML={{ __html: annonce.description.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} 
                            />
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center p-12 bg-surface rounded-lg">
                <BookmarkSquareIcon className="mx-auto h-16 w-16 text-gray-600" />
                <h3 className="mt-4 text-lg font-medium text-primary">Aucune annonce sauvegardée</h3>
                <p className="mt-1 text-sm text-secondary">
                    Allez dans l'Assistant Créatif pour créer et sauvegarder votre première annonce.
                </p>
            </div>
        )}

        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Détail de l'annonce" widthClass="max-w-4xl">
            {viewingAnnonce && (
                <div className="space-y-4">
                    <div className="relative">
                        <img src={viewingAnnonce.imageUrls[currentImageIndex]} alt={`Annonce ${currentImageIndex + 1}`} className="w-full max-h-[60vh] object-contain rounded-lg" />
                        {viewingAnnonce.imageUrls.length > 1 && (
                            <>
                                <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white hover:bg-black/75">&lt;</button>
                                <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white hover:bg-black/75">&gt;</button>
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                                    {currentImageIndex + 1} / {viewingAnnonce.imageUrls.length}
                                </div>
                            </>
                        )}
                    </div>
                     <div 
                        className="text-sm text-primary prose prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 whitespace-pre-wrap bg-gray-900 p-4 rounded-md max-h-48 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: viewingAnnonce.description.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} 
                    />
                </div>
            )}
        </Modal>
    </div>
  );
};