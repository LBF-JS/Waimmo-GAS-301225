import React, { useMemo } from 'react';
// FIX: Import missing Mandate and MandateStatus types
import { Mandate, Contact, MandateStatus } from '../types';
// FIX: Import `DocumentCheckIcon` to resolve the "Cannot find name" error.
import { DocumentChartBarIcon, ClockIcon, BellIcon, DocumentCheckIcon } from '../components/Icons';

interface MandateTrackingPageProps {
  mandates: Mandate[];
  contacts: Contact[];
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className={`bg-gray-800 p-6 rounded-lg shadow-lg flex items-center space-x-4 border-l-4 ${color}`}>
    <div className="text-3xl">{icon}</div>
    <div>
      <p className="text-secondary text-sm font-medium uppercase tracking-wider">{title}</p>
      <p className="text-3xl font-bold text-primary">{value}</p>
    </div>
  </div>
);

export const MandateTrackingPage: React.FC<MandateTrackingPageProps> = ({ mandates, contacts }) => {
    
  const getContactName = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : 'N/A';
  };

  const stats = useMemo(() => {
    const activeMandates = mandates.filter(m => m.status === MandateStatus.Actif);
    const totalValue = activeMandates.reduce((sum, m) => sum + m.price, 0);
    const mandatesNearExpiration = activeMandates.filter(m => {
        const endDate = new Date(m.endDate);
        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30 && diffDays > 0;
    });

    return {
        activeCount: activeMandates.length,
        soldCount: mandates.filter(m => m.status === MandateStatus.Vendu).length,
        totalValue: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', notation: 'compact' }).format(totalValue),
        nearExpiration: mandatesNearExpiration,
    };
  }, [mandates]);


  return (
    <div className="space-y-8">
        <div className="flex items-center space-x-3">
            <DocumentChartBarIcon className="w-8 h-8 text-brand"/>
            <h2 className="text-2xl font-bold text-primary">Suivi des Mandats</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard 
                title="Mandats Actifs" 
                value={stats.activeCount} 
                icon={<ClockIcon className="w-10 h-10 text-green-400" />}
                color="border-green-500"
            />
            <StatCard 
                title="Mandats Vendus" 
                value={stats.soldCount} 
                icon={<DocumentCheckIcon className="w-10 h-10 text-teal-400" />}
                color="border-teal-500"
            />
            <StatCard 
                title="Valeur sous mandat" 
                value={stats.totalValue} 
                icon={<span className="text-4xl font-bold text-blue-400">€</span>}
                color="border-blue-500"
            />
        </div>

        <div className="bg-surface p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3 mb-4">
                <BellIcon className="w-6 h-6 text-orange-400"/>
                <h3 className="text-xl font-bold text-primary">Mandats arrivant à expiration (30 jours)</h3>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
            {stats.nearExpiration.length > 0 ? (
                stats.nearExpiration.map(mandate => (
                <div key={mandate.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-md">
                    <div>
                    <p className="font-semibold text-primary">{mandate.propertyAddress}</p>
                    <p className="text-sm text-secondary">Vendeur: {getContactName(mandate.contactId)}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-mono text-orange-400 font-semibold">{new Date(mandate.endDate).toLocaleDateString('fr-FR')}</p>
                        <p className="text-xs text-secondary">Date de fin</p>
                    </div>
                </div>
                ))
            ) : (
                <p className="text-secondary text-center py-8 italic">Aucun mandat n'expire dans les 30 prochains jours.</p>
            )}
            </div>
        </div>
    </div>
  );
};
