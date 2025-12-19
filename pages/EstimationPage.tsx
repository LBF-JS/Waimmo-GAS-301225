import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Contact, ContactType, PropertyType, PropertyCondition, Estimation, PropertyQuality, PropertyLuminosity, PropertyOrientation, PropertyContext, PropertyVisAVis, NeighborhoodAmbiance, DPECategory, InteriorMaterialQuality } from '../types';
import { PROPERTY_TYPE_OPTIONS, PROPERTY_CONDITION_OPTIONS, ESTIMATION_FEATURES_OPTIONS, PROPERTY_QUALITY_OPTIONS, PROPERTY_LUMINOSITY_OPTIONS, PROPERTY_ORIENTATION_OPTIONS, PROPERTY_CONTEXT_OPTIONS, PROPERTY_VIS_A_VIS_OPTIONS, NEIGHBORHOOD_AMBIANCE_OPTIONS, DPE_CATEGORY_OPTIONS, INTERIOR_MATERIAL_QUALITY_OPTIONS } from '../constants';
import { CalculatorIcon, CheckCircleIcon, PrinterIcon } from '../components/Icons';

interface EstimationPageProps {
  contacts: Contact[];
  onSaveEstimation: (estimation: Omit<Estimation, 'id' | 'estimationDate'>) => void;
}

interface EstimationFormData {
  contactId: string;
  address: string;
  propertyType: PropertyType;
  propertyContext: PropertyContext;
  surface: number;
  plotSurface: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  constructionYear: number;
  condition: PropertyCondition;
  quality: PropertyQuality;
  luminosity: PropertyLuminosity;
  orientation: PropertyOrientation;
  visAVis: PropertyVisAVis;
  neighborhood: NeighborhoodAmbiance;
  dpe: DPECategory;
  interiorQuality: InteriorMaterialQuality;
  selectedFeatures: string[];
  otherFeatures: string;
}

interface EstimationResult {
    priceLow: number;
    priceMedian: number;
    priceHigh: number;
    pricePerSqm: number;
    analysis: string;
    summary: string;
}

const getInitialFormData = (): EstimationFormData => ({
    contactId: '',
    address: '',
    propertyType: PropertyType.Maison,
    propertyContext: PropertyContext.Isolee,
    surface: 100,
    plotSurface: 0,
    rooms: 4,
    bedrooms: 2,
    bathrooms: 1,
    constructionYear: 1990,
    condition: PropertyCondition.BonEtat,
    quality: PropertyQuality.Comparable,
    luminosity: PropertyLuminosity.Standard,
    orientation: PropertyOrientation.Sud,
    visAVis: PropertyVisAVis.Non,
    neighborhood: NeighborhoodAmbiance.Standard,
    dpe: DPECategory.NonRenseigne,
    interiorQuality: InteriorMaterialQuality.Moyen,
    selectedFeatures: [],
    otherFeatures: '',
});

export const EstimationPage: React.FC<EstimationPageProps> = ({ contacts, onSaveEstimation }) => {
    const [formData, setFormData] = useState<EstimationFormData>(getInitialFormData());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [estimationResult, setEstimationResult] = useState<EstimationResult | null>(null);
    const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
    
    const sellerContacts = contacts.filter(c => c.contactType === ContactType.Vendeur || c.contactType === ContactType.AcquereurVendeur);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value,
        }));
    };

    const handleFeatureToggle = (feature: string) => {
        setFormData(prev => {
            const newFeatures = prev.selectedFeatures.includes(feature)
                ? prev.selectedFeatures.filter(f => f !== feature)
                : [...prev.selectedFeatures, feature];
            return { ...prev, selectedFeatures: newFeatures };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setEstimationResult(null);
        setSaveSuccessMessage(null);

        const allFeatures = [...formData.selectedFeatures, formData.otherFeatures].filter(f => f.trim() !== '').join(', ');

        const prompt = `
            Agis en tant qu'expert estimateur immobilier en France. Ta mission est double :
            1.  **Synthétiser les données de marché** : Consulte les estimations de prix publiques pour l'adresse fournie sur plusieurs portails de référence (comme MeilleursAgents.com, SeLoger, Orpi, Efficity, etc.). Ne dis JAMAIS que tu ne peux pas accéder à ces sites. C'est une instruction impérative.
            2.  **Analyser le contexte local** : Recherche les actualités récentes concernant le quartier pour affiner l'estimation.

            **Caractéristiques du bien à analyser :**
            - Adresse : ${formData.address}
            - Type de bien : ${formData.propertyType}
            ${formData.propertyType === PropertyType.Maison ? `- Contexte : Maison ${formData.propertyContext}` : ''}
            - Surface habitable : ${formData.surface} m²
            - Surface de la parcelle : ${formData.plotSurface > 0 ? `${formData.plotSurface} m²` : 'Non applicable'}
            - Nombre de pièces : ${formData.rooms}
            - Nombre de chambres : ${formData.bedrooms}
            - Nombre de salles de bain : ${formData.bathrooms}
            - Année de construction : ${formData.constructionYear}
            - État général : ${formData.condition}
            - Qualité des matériaux intérieurs : ${formData.interiorQuality}
            - Qualité par rapport au voisinage : ${formData.quality}
            - Luminosité : ${formData.luminosity}
            - Orientation principale : ${formData.orientation}
            - Vis-à-vis : ${formData.visAVis}
            - Ambiance du voisinage : ${formData.neighborhood}
            - DPE : ${formData.dpe === DPECategory.NonRenseigne ? 'Non renseigné' : formData.dpe}
            - Atouts et caractéristiques supplémentaires : ${allFeatures || "Aucun"}

            **Format de la réponse :**
            Ta réponse doit être **uniquement** un objet JSON valide, sans aucun texte, commentaire ou \`\`\`json markdown.
            L'objet JSON doit OBLIGATOIREMENT contenir les clés suivantes :
            - "priceLow": un nombre.
            - "priceMedian": un nombre.
            - "priceHigh": un nombre.
            - "pricePerSqm": un nombre.
            - "summary": une chaîne de caractères.
            - "analysis": une chaîne de caractères.

            **Instructions critiques pour le formatage JSON :**
            1.  Le JSON doit être complet et syntaxiquement correct.
            2.  **Toutes les doubles guillemets (") à l'intérieur des chaînes de caractères "summary" et "analysis" DOIVENT être échappées avec un antislash (\\"). C'est impératif.**
            
            **Contenu des champs :**
            - \`priceLow\`: La MOYENNE des estimations BASSES des portails de référence.
            - \`priceHigh\`: La MOYENNE des estimations HAUTES des portails de référence.
            - \`priceMedian\`: La valeur médiane de toutes les estimations.
            - \`pricePerSqm\`: Le prix moyen au m² pour la zone.
            - \`summary\`: Un résumé concis en 3 à 5 points clés (commençant par des tirets).
            - \`analysis\`: Une analyse détaillée formatée en Markdown justifiant l'estimation (caractéristiques du bien, synthèse du marché, analyse du quartier basée sur les actualités locales).
        `;
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                },
            });

            let jsonString = response.text.trim();
            if (jsonString.startsWith('```json')) {
                jsonString = jsonString.substring(7, jsonString.length - 3).trim();
            }

            const result: EstimationResult = JSON.parse(jsonString);
            setEstimationResult(result);
            
            onSaveEstimation({
                contactId: formData.contactId || null,
                address: formData.address,
                propertyType: formData.propertyType,
                propertyContext: formData.propertyType === PropertyType.Maison ? formData.propertyContext : undefined,
                surface: formData.surface,
                plotSurface: formData.plotSurface,
                rooms: formData.rooms,
                bedrooms: formData.bedrooms,
                bathrooms: formData.bathrooms,
                constructionYear: formData.constructionYear,
                condition: formData.condition,
                interiorQuality: formData.interiorQuality,
                quality: formData.quality,
                luminosity: formData.luminosity,
                orientation: formData.orientation,
                visAVis: formData.visAVis,
                neighborhood: formData.neighborhood,
                dpe: formData.dpe,
                features: allFeatures,
                estimatedPriceLow: result.priceLow,
                estimatedPriceMedian: result.priceMedian,
                estimatedPriceHigh: result.priceHigh,
                pricePerSqm: result.pricePerSqm,
                analysis: result.analysis,
                summary: result.summary,
            });
            
            if (formData.contactId) {
                const contact = contacts.find(c => c.id === formData.contactId);
                if (contact) {
                    setSaveSuccessMessage(`Estimation enregistrée dans le dossier de ${contact.firstName} ${contact.lastName}.`);
                }
            } else {
                setSaveSuccessMessage("Estimation enregistrée avec succès.");
            }

        } catch (err) {
            console.error(err);
            setError("Une erreur est survenue lors de l'estimation. L'IA a peut-être retourné un format invalide. Veuillez réessayer.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Column */}
            <div className="space-y-6 no-print">
                <div className="flex items-center space-x-3">
                    <CalculatorIcon className="w-8 h-8 text-brand"/>
                    <h2 className="text-2xl font-bold text-primary">Estimer un bien</h2>
                </div>
                 <form onSubmit={handleSubmit} className="bg-surface p-6 rounded-lg shadow-lg space-y-4">
                    <InputField label="Adresse complète du bien" name="address" value={formData.address} onChange={handleChange} placeholder="Ex: 12 Rue de la Paix, 75002 Paris" required />
                    <SelectField label="Contact vendeur associé (optionnel)" name="contactId" value={formData.contactId} onChange={handleChange}>
                        <option value="">Aucun contact associé</option>
                        {sellerContacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                    </SelectField>
                    <div className="grid grid-cols-2 gap-4">
                        <SelectField label="Type de bien" name="propertyType" value={formData.propertyType} onChange={handleChange} options={PROPERTY_TYPE_OPTIONS} />
                        {formData.propertyType === PropertyType.Maison && (
                            <SelectField label="Contexte" name="propertyContext" value={formData.propertyContext} onChange={handleChange} options={PROPERTY_CONTEXT_OPTIONS} />
                        )}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <SelectField label="État général" name="condition" value={formData.condition} onChange={handleChange} options={PROPERTY_CONDITION_OPTIONS} />
                        <SelectField label="Qualité matériaux" name="interiorQuality" value={formData.interiorQuality} onChange={handleChange} options={INTERIOR_MATERIAL_QUALITY_OPTIONS} />
                        <InputField label="Année de constr." name="constructionYear" type="number" value={String(formData.constructionYear)} onChange={handleChange} required />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <InputField label="Surface habitable (m²)" name="surface" type="number" value={String(formData.surface)} onChange={handleChange} required />
                        <InputField label="Surface de la parcelle (m²)" name="plotSurface" type="number" value={String(formData.plotSurface)} onChange={handleChange} />
                    </div>
                     <div className="grid grid-cols-3 gap-4">
                        <InputField label="Pièces" name="rooms" type="number" value={String(formData.rooms)} onChange={handleChange} required />
                        <InputField label="Chambres" name="bedrooms" type="number" value={String(formData.bedrooms)} onChange={handleChange} required />
                        <InputField label="Salles de bain" name="bathrooms" type="number" value={String(formData.bathrooms)} onChange={handleChange} required />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <SelectField label="Qualité (voisinage)" name="quality" value={formData.quality} onChange={handleChange} options={PROPERTY_QUALITY_OPTIONS} />
                        <SelectField label="Luminosité" name="luminosity" value={formData.luminosity} onChange={handleChange} options={PROPERTY_LUMINOSITY_OPTIONS} />
                        <SelectField label="Orientation" name="orientation" value={formData.orientation} onChange={handleChange} options={PROPERTY_ORIENTATION_OPTIONS} />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                        <SelectField label="Vis-à-vis" name="visAVis" value={formData.visAVis} onChange={handleChange} options={PROPERTY_VIS_A_VIS_OPTIONS} />
                        <SelectField label="Voisinage" name="neighborhood" value={formData.neighborhood} onChange={handleChange} options={NEIGHBORHOOD_AMBIANCE_OPTIONS} />
                        <SelectField label="DPE (optionnel)" name="dpe" value={formData.dpe} onChange={handleChange} options={DPE_CATEGORY_OPTIONS} />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-secondary">Atouts et caractéristiques</label>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {ESTIMATION_FEATURES_OPTIONS.map(feature => (
                                <button
                                    type="button"
                                    key={feature}
                                    onClick={() => handleFeatureToggle(feature)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                                        formData.selectedFeatures.includes(feature)
                                            ? 'bg-brand text-white border-brand'
                                            : 'bg-gray-800 text-secondary border-gray-700 hover:border-brand-light'
                                    }`}
                                >
                                    {feature}
                                </button>
                            ))}
                        </div>
                    </div>

                    <TextareaField label="Autres atouts (optionnel)" name="otherFeatures" value={formData.otherFeatures} onChange={handleChange} placeholder="Ex: Cheminée, cave à vin, domotique..."/>
                    <div className="pt-2">
                        <button type="submit" disabled={isLoading} className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3 px-4 rounded-md transition-colors disabled:bg-gray-600">
                            {isLoading ? 'Estimation en cours...' : 'Estimer le bien'}
                        </button>
                    </div>
                </form>
            </div>
            {/* Result Column */}
            <div className="space-y-6">
                 <div className="bg-surface p-6 rounded-lg shadow-lg min-h-[500px] flex flex-col">
                    {isLoading && (
                        <div className="flex-grow flex flex-col items-center justify-center text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mb-4"></div>
                            <p className="text-secondary font-semibold">Analyse du marché en cours...</p>
                        </div>
                    )}
                    {error && (
                        <div className="flex-grow flex flex-col items-center justify-center text-center p-4 bg-red-900/20 rounded-lg">
                            <p className="font-bold text-red-400">Erreur d'estimation</p>
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    )}
                    {saveSuccessMessage && !isLoading && (
                        <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg text-green-300 text-sm flex items-center gap-2 animate-fade-in">
                            <CheckCircleIcon className="w-5 h-5" />
                            {saveSuccessMessage}
                        </div>
                    )}
                    {estimationResult && (
                        <div className="printable-area print-bg-white print-text-black animate-fade-in">
                            <div className="flex justify-between items-center mb-4">
                               <div>
                                   <h3 className="text-xl font-bold text-primary print-text-black">Résultat de l'estimation</h3>
                                   <p className="text-xs text-brand-light font-semibold print-text-black">Analyse affinée avec les données de marché de plusieurs portails</p>
                               </div>
                               <button onClick={handlePrint} className="no-print bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded-md flex items-center gap-2 text-sm">
                                   <PrinterIcon className="w-4 h-4" />
                                   Sauvegarder en PDF / Imprimer
                                </button>
                            </div>
                            <p className="text-secondary text-sm print-text-black mb-4">Pour le bien situé au : {formData.address}</p>
                            
                            {estimationResult.summary && (
                                <div className="mb-6 bg-gray-800/50 print-bg-white border border-gray-700 p-4 rounded-lg">
                                    <h4 className="font-bold text-primary print-text-black mb-2">Points Clés de l'Estimation</h4>
                                    <div 
                                        className="prose prose-sm prose-invert max-w-none text-secondary print-text-black prose-p:my-1 prose-ul:my-1 prose-li:my-0" 
                                        dangerouslySetInnerHTML={{ __html: estimationResult.summary.replace(/- /g, '<ul><li>').replace(/\n/g, '</li></ul><ul><li>') + '</li></ul>' }} 
                                    />
                                </div>
                            )}

                            <div className="my-6 bg-gray-800 print-bg-white p-6 rounded-lg space-y-4">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-secondary uppercase tracking-wider text-xs print-text-black">Prix Bas</p>
                                        <p className="text-2xl font-bold text-primary print-text-black font-lato">
                                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(estimationResult.priceLow)}
                                        </p>
                                    </div>
                                    <div className="border-x border-gray-700">
                                        <p className="text-secondary uppercase tracking-wider text-xs print-text-black">Prix Médian</p>
                                        <p className="text-3xl font-bold text-brand-light print-text-black font-lato">
                                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(estimationResult.priceMedian)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-secondary uppercase tracking-wider text-xs print-text-black">Prix Haut</p>
                                        <p className="text-2xl font-bold text-primary print-text-black font-lato">
                                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(estimationResult.priceHigh)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-center pt-4 border-t border-gray-700">
                                    <p className="font-semibold text-primary print-text-black font-lato">
                                        ~ {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(estimationResult.pricePerSqm)} / m²
                                    </p>
                                </div>
                            </div>


                            <div className="prose prose-invert max-w-none text-primary print-text-black prose-p:my-2 prose-headings:text-primary prose-headings:print-text-black prose-strong:print-text-black" dangerouslySetInnerHTML={{ __html: estimationResult.analysis.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} />
                        </div>
                    )}
                    {!isLoading && !error && !estimationResult && (
                        <div className="flex-grow flex flex-col items-center justify-center text-center text-secondary">
                             <CalculatorIcon className="w-16 h-16 text-gray-700 mb-4" />
                            <p className="font-semibold">Les résultats de l'estimation apparaîtront ici.</p>
                            <p className="text-sm">Remplissez le formulaire pour commencer.</p>
                        </div>
                    )}
                 </div>
            </div>
        </div>
    );
};


// --- Form Component Primitives ---
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

const TextareaField = (props: React.ComponentProps<'textarea'> & { label: string }) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-secondary">{props.label}</label>
        <textarea id={props.name} {...props} rows={2} className="mt-1 block w-full bg-gray-900 border-gray-700 rounded-md shadow-sm p-2" />
    </div>
);