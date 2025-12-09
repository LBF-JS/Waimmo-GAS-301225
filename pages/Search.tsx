import React, { useState, useEffect } from 'react';
// FIX: Import `GroundingChunk` type from the library to ensure type compatibility.
import { GoogleGenAI, type GroundingChunk } from '@google/genai';
import { ExternalLinkIcon } from '../components/Icons';

const FormattedResponse: React.FC<{ text: string }> = ({ text }) => {
    const formattedParts = text.split(/(\n)/).map((part, index) => {
        // Match titles (##, ###, etc.)
        if (part.startsWith('## ')) {
            return <h2 key={index} className="text-xl font-bold text-brand-light mt-4 mb-2">{part.substring(3)}</h2>;
        }
        if (part.startsWith('# ')) {
             return <h1 key={index} className="text-2xl font-bold text-brand mt-6 mb-3">{part.substring(2)}</h1>;
        }
        // Match bold text
        part = part.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Match bullet points
        if (part.trim().startsWith('* ') || part.trim().startsWith('- ')) {
            return (
                <li key={index} className="ml-5" dangerouslySetInnerHTML={{ __html: part.trim().substring(2) }} />
            );
        }

        if (part === '\n') {
            return <br key={index} />;
        }

        return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
    });

    return (
        <div className="space-y-2 text-primary leading-relaxed">
            {formattedParts}
        </div>
    );
};

export const Search: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [geminiResponse, setGeminiResponse] = useState<string | null>(null);
  const [groundingChunks, setGroundingChunks] = useState<GroundingChunk[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [useMaps, setUseMaps] = useState(false);
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (useMaps && !location && !locationError) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                setLocationError(null);
            },
            (err) => {
                console.error(err);
                setLocationError("Impossible d'accéder à votre position. Veuillez autoriser la géolocalisation dans votre navigateur.");
                setUseMaps(false); // Uncheck the box if permission is denied
            }
        );
    }
  }, [useMaps, location, locationError]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setGeminiResponse(null);
    setGroundingChunks([]);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        
        const tools: any[] = [{ googleSearch: {} }];
        let toolConfig: any = {};

        if (useMaps) {
            if (location) {
                tools.push({ googleMaps: {} });
                toolConfig = {
                    retrievalConfig: {
                        latLng: {
                            latitude: location.latitude,
                            longitude: location.longitude
                        }
                    }
                };
            } else {
                throw new Error("La géolocalisation est activée mais la position n'est pas disponible.");
            }
        }
      
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "Tu es un expert immobilier. Formatte tes réponses en utilisant Markdown pour une meilleure lisibilité (titres, listes, gras).",
                tools: tools,
                toolConfig: toolConfig,
            },
        });

        setGeminiResponse(response.text);
        setGroundingChunks(response.candidates?.[0]?.groundingMetadata?.groundingChunks || []);

    } catch (err: any) {
      console.error(err);
      setError("Une erreur est survenue lors de la communication avec l'IA. Veuillez réessayer. Détails: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-primary">Bible IA</h2>
        <p className="text-sm text-secondary mb-4">
            Votre source unique de vérité sur le marché immobilier. Posez n'importe quelle question et obtenez des données claires et à jour, alimentées par l'IA.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="prompt" className="sr-only">Votre question</label>
                <textarea 
                    id="prompt" 
                    rows={3}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ex: Quelles sont les tendances du marché immobilier à Bordeaux pour les T3 ce trimestre ? Donne-moi une liste de restaurants bien notés près de la Place du Capitole à Toulouse."
                    className="block w-full bg-gray-900 border-gray-700 rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm text-primary p-2" 
                />
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center space-x-2">
                    <input 
                        type="checkbox" 
                        id="useMaps" 
                        checked={useMaps}
                        onChange={(e) => setUseMaps(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-accent focus:ring-accent" 
                    />
                    <label htmlFor="useMaps" className="text-sm text-secondary">
                        Activer la recherche locale (Google Maps)
                    </label>
                </div>
                <button type="submit" disabled={isLoading} className="bg-brand hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-md w-full md:w-auto transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                    {isLoading ? 'Recherche en cours...' : 'Envoyer'}
                </button>
            </div>
            {locationError && <p className="text-red-400 text-sm mt-2">{locationError}</p>}
        </form>
      </div>

      <div>
        {isLoading && (
            <div className="flex flex-col items-center justify-center text-center p-10 bg-surface rounded-lg">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mb-4"></div>
                <p className="text-secondary font-semibold">L'assistant IA réfléchit...</p>
                <p className="text-sm text-gray-500">Recherche d'informations en temps réel.</p>
            </div>
        )}

        {error && (
            <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
                <h4 className="font-bold">Erreur</h4>
                <p>{error}</p>
            </div>
        )}
        
        {geminiResponse && (
          <div className="bg-surface p-6 rounded-lg shadow-lg animate-fade-in">
              <h3 className="text-xl font-semibold mb-4 text-primary border-b border-gray-700 pb-2">Réponse de l'assistant</h3>
              <FormattedResponse text={geminiResponse} />

              {groundingChunks.length > 0 && (
                <div className="mt-6 border-t border-gray-700 pt-4">
                    <h4 className="text-md font-semibold text-secondary mb-2">Sources :</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                        {groundingChunks.map((chunk, index) => {
                            const source = chunk.web || chunk.maps;
                            // FIX: Ensure source and source.uri exist before rendering the link, as `uri` is optional.
                            return source && source.uri ? (
                                <li key={index}>
                                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-brand-light hover:underline hover:text-brand transition-colors">
                                        {source.title} <ExternalLinkIcon className="w-4 h-4 inline-block ml-1" />
                                    </a>
                                </li>
                            ) : null
                        })}
                    </ul>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};
