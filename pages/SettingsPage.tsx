import React, { useState, useEffect } from 'react';
import { AgentInfo, NotificationSettings, NotificationType } from '../types';
import { CheckCircleIcon, SunIcon, MoonIcon, EyeIcon, EyeSlashIcon } from '../components/Icons';

type Theme = 'light' | 'dark';

interface SettingsPageProps {
    agentInfo: AgentInfo;
    onUpdateAgentInfo: (newInfo: AgentInfo) => void;
    notificationSettings: NotificationSettings;
    onUpdateNotificationSettings: (newSettings: NotificationSettings) => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    n8nWebhookUrl: string;
    onUpdateN8nWebhookUrl: (url: string) => void;
}

const InputField: React.FC<React.ComponentProps<'input'> & { label: string }> = ({ label, ...props }) => (
    <div>
      <label htmlFor={props.name} className="block text-sm font-medium text-secondary">{label}</label>
      <input id={props.name} {...props} className="mt-1 block w-full bg-input border-border rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm text-primary p-2" />
    </div>
);

const ToggleSwitch: React.FC<{ label: string; enabled: boolean; onChange: (enabled: boolean) => void; }> = ({ label, enabled, onChange }) => (
    <div className="flex items-center justify-between bg-background p-3 rounded-md">
      <span className="text-sm text-primary">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-brand ${enabled ? 'bg-brand' : 'bg-surface-secondary'}`}
      >
        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
);

const settingLabels: Record<keyof NotificationSettings, string> = {
    CONTACT_NEW: "Nouveau dossier créé",
    CONTACT_UPDATE: "Mise à jour d'un dossier",
    CONTACT_DELETE: "Suppression d'un dossier",
    APPOINTMENT_NEW: "Nouveau RDV créé",
    APPOINTMENT_UPDATE: "Mise à jour d'un RDV",
    APPOINTMENT_DELETE: "Suppression d'un RDV",
    APPOINTMENT_REMINDER: "Rappel de RDV (24h avant)",
    REPORT_NEW: "Nouveau compte-rendu créé",
    REPORT_UPDATE: "Mise à jour d'un compte-rendu",
    REPORT_DELETE: "Suppression d'un compte-rendu",
    ANNONCE_NEW: "Nouvelle annonce créée",
    ANNONCE_UPDATE: "Mise à jour d'une annonce",
    ANNONCE_DELETE: "Suppression d'une annonce",
    AGENT_INFO_UPDATE: "Mise à jour des paramètres",
};


export const SettingsPage: React.FC<SettingsPageProps> = ({ 
    agentInfo, 
    onUpdateAgentInfo, 
    notificationSettings, 
    onUpdateNotificationSettings, 
    theme, 
    setTheme,
    n8nWebhookUrl,
    onUpdateN8nWebhookUrl,
 }) => {
    const [agentFormData, setAgentFormData] = useState(agentInfo);
    const [notifSettingsData, setNotifSettingsData] = useState(notificationSettings);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const [webhookUrlInput, setWebhookUrlInput] = useState(n8nWebhookUrl);
    const [isWebhookVisible, setIsWebhookVisible] = useState(false);
    const [webhookMessage, setWebhookMessage] = useState<string | null>(null);

    useEffect(() => {
        setAgentFormData(agentInfo);
    }, [agentInfo]);
    
    useEffect(() => {
        setNotifSettingsData(notificationSettings);
    }, [notificationSettings]);

    useEffect(() => {
        setWebhookUrlInput(n8nWebhookUrl);
    }, [n8nWebhookUrl]);

    const handleAgentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAgentFormData({ ...agentFormData, [e.target.name]: e.target.value });
    };
    
    const handleNotifChange = (key: string, value: boolean) => {
        const newSettings = { ...notifSettingsData, [key]: value };
        setNotifSettingsData(newSettings);
        onUpdateNotificationSettings(newSettings); // Update instantly
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateAgentInfo(agentFormData);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    const handleSaveWebhook = () => {
        onUpdateN8nWebhookUrl(webhookUrlInput);
        setWebhookMessage("URL du webhook enregistrée avec succès.");
        setTimeout(() => setWebhookMessage(null), 3000);
    };

    const handleDeleteWebhook = () => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer l'URL du webhook ?")) {
            setWebhookUrlInput('');
            onUpdateN8nWebhookUrl('');
            setWebhookMessage("URL du webhook supprimée.");
            setTimeout(() => setWebhookMessage(null), 3000);
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-surface p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-primary">Apparence</h2>
                <div className="flex items-center gap-4">
                    <p className="text-sm text-secondary">Choisissez le thème de l'application.</p>
                    <div className="flex items-center space-x-1 rounded-lg bg-input p-1">
                        <button 
                            onClick={() => setTheme('light')} 
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${theme === 'light' ? 'bg-brand text-white' : 'hover:bg-surface'}`}
                        >
                            <SunIcon className="w-5 h-5"/>
                            Clair
                        </button>
                        <button 
                             onClick={() => setTheme('dark')}
                             className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-brand text-white' : 'hover:bg-surface'}`}
                        >
                             <MoonIcon className="w-5 h-5"/>
                             Sombre
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-surface p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-primary border-b border-border pb-4">Paramètres de l'agence</h2>
                <p className="text-sm text-secondary -mt-4 mb-6">
                    Les informations saisies ici seront automatiquement utilisées pour remplir les documents officiels, comme les mandats.
                </p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Nom de l'agence" name="name" value={agentFormData.name} onChange={handleAgentChange} required />
                        <InputField label="Forme juridique (SARL, SAS...)" name="legalForm" value={agentFormData.legalForm} onChange={handleAgentChange} required />
                    </div>
                    <InputField label="Adresse de l'agence" name="address" value={agentFormData.address} onChange={handleAgentChange} required />
                    
                    <fieldset className="border-t border-border pt-6">
                        <legend className="text-lg font-semibold text-primary mb-4">Informations réglementaires</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <InputField label="N° Carte Professionnelle" name="professionalCard" value={agentFormData.professionalCard} onChange={handleAgentChange} required />
                            <InputField label="Délivrée par (Préfecture)" name="prefecture" value={agentFormData.prefecture} onChange={handleAgentChange} required />
                            <InputField label="Date de délivrance" name="issueDate" type="date" value={agentFormData.issueDate} onChange={handleAgentChange} required />
                        </div>
                    </fieldset>
                    
                     <fieldset className="border-t border-border pt-6">
                        <legend className="text-lg font-semibold text-primary mb-4">Garantie financière</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <InputField label="Société de caution mutuelle" name="cautionMutuelle" value={agentFormData.cautionMutuelle} onChange={handleAgentChange} required />
                             <InputField label="Numéro de sociétaire / contrat" name="cautionNumber" value={agentFormData.cautionNumber} onChange={handleAgentChange} required />
                        </div>
                         <div className="mt-6">
                             <InputField label="Adresse de la société de caution" name="cautionAddress" value={agentFormData.cautionAddress} onChange={handleAgentChange} required />
                        </div>
                    </fieldset>

                    <div className="flex justify-end items-center pt-4">
                         {saveSuccess && (
                            <div className="flex items-center gap-2 text-green-400 mr-4 animate-fade-in">
                                <CheckCircleIcon className="w-5 h-5" />
                                <span className="text-sm">Enregistré !</span>
                            </div>
                        )}
                        <button type="submit" className="bg-brand hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-md transition-colors">
                            Enregistrer les modifications
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-surface p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-primary border-b border-border pb-4">Gestion des notifications</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.keys(notifSettingsData).map(key => (
                       <ToggleSwitch
                         key={key}
                         label={settingLabels[key as NotificationType]}
                         enabled={notifSettingsData[key as NotificationType]}
                         onChange={(value) => handleNotifChange(key, value)}
                       />
                    ))}
                </div>
            </div>

            <div className="bg-surface p-6 rounded-lg shadow-lg">
                 <h3 className="text-lg font-semibold text-primary">Connectivités</h3>
                <p className="text-sm text-secondary mt-2 mb-4">
                    Gérez les connexions aux services externes comme les webhooks pour vos automatisations.
                </p>

                <div className="space-y-3">
                    <label htmlFor="webhookUrl" className="block text-sm font-medium text-secondary">URL Webhook n8n</label>
                    <div className="relative">
                        <input
                          id="webhookUrl"
                          type={isWebhookVisible ? 'text' : 'password'}
                          value={webhookUrlInput}
                          onChange={(e) => setWebhookUrlInput(e.target.value)}
                          className="appearance-none block w-full pr-10 px-3 py-2 border border-border rounded-md shadow-sm placeholder-secondary focus:outline-none focus:ring-brand focus:border-brand sm:text-sm bg-input text-primary"
                          placeholder="Collez votre URL ici"
                        />
                        <button
                            type="button"
                            onClick={() => setIsWebhookVisible(!isWebhookVisible)}
                            className="absolute inset-y-0 right-0 px-3 flex items-center text-secondary hover:text-primary"
                        >
                            {isWebhookVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        <div>
                            {webhookMessage && (
                                <div className="flex items-center gap-2 text-green-400 animate-fade-in">
                                    <CheckCircleIcon className="w-5 h-5" />
                                    <span className="text-sm">{webhookMessage}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleDeleteWebhook}
                                className="bg-red-600/20 text-red-400 hover:bg-red-600/40 font-bold py-2 px-4 rounded-md text-sm transition-colors"
                            >
                                Supprimer
                            </button>
                            <button
                                onClick={handleSaveWebhook}
                                className="bg-brand hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-md text-sm transition-colors"
                            >
                                Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};