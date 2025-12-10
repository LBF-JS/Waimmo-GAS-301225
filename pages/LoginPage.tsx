import React, { useState } from 'react';
import { WaImmoLogoIcon, EyeIcon, EyeSlashIcon, SparklesIcon, PhoneArrowUpRightIcon, UserGroupIcon } from '../components/Icons';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Simulate API call
    setTimeout(() => {
      if (
        (email === 'hello.waive@gmail.com' && password === 'FX7I5KboQe*wi') ||
        (email === 'demo@demo.fr' && password === 'Demo123!')
      ) {
        onLoginSuccess();
      } else {
        setError('Adresse e-mail ou mot de passe incorrect.');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-2">
                <WaImmoLogoIcon className="w-10 h-10 text-brand" />
                <span className="text-3xl font-bold text-primary">WaImmo</span>
            </div>
            <p className="text-secondary">Connectez-vous à votre espace de travail</p>
        </div>
        
        <div className="bg-surface p-8 rounded-lg shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary">
                Adresse e-mail
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-secondary focus:outline-none focus:ring-brand focus:border-brand sm:text-sm bg-input text-primary"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary">
                Mot de passe
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={isPasswordVisible ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-secondary focus:outline-none focus:ring-brand focus:border-brand sm:text-sm bg-input text-primary pr-10"
                />
                <button
                    type="button"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-secondary hover:text-primary"
                    aria-label={isPasswordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                    {isPasswordVisible ? (
                        <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                        <EyeIcon className="w-5 h-5" />
                    )}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-center">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                    "Se connecter"
                )}
              </button>
            </div>
          </form>
          <div className="mt-6 pt-4 border-t border-border text-center text-xs text-secondary space-y-1">
            <p className="font-semibold">Compte de démonstration :</p>
            <p>Email: <code className="font-mono text-primary bg-input px-1 py-0.5 rounded">demo@demo.fr</code></p>
            <p>Mot de passe: <code className="font-mono text-primary bg-input px-1 py-0.5 rounded">Demo123!</code></p>
          </div>
        </div>
      </div>
      
      <div className="mt-12 w-full max-w-4xl text-center px-4">
        <h2 className="text-2xl font-bold text-primary mb-4">L'assistant IA qui transforme votre prospection</h2>
        <p className="text-secondary max-w-2xl mx-auto">
          WaImmo est plus qu'un simple CRM. C'est une plateforme complète conçue pour les agents immobiliers modernes qui veulent gagner du temps, centraliser leurs informations et décupler leur efficacité sur le terrain.
        </p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
                icon={<PhoneArrowUpRightIcon className="w-8 h-8 text-brand" />}
                title="Pige Immobilière Intelligente"
                description="Notre IA scanne le web pour vous trouver les meilleures opportunités. Définissez vos critères les plus complexes et recevez une liste d'annonces qualifiées avec un score de compatibilité unique."
            />
            <FeatureCard
                icon={<UserGroupIcon className="w-8 h-8 text-brand" />}
                title="CRM Complet & Intuitif"
                description="Suivez chaque prospect et client, de la première prise de contact à la signature. Gérez vos rendez-vous, comptes rendus et documents en un seul endroit."
            />
            <FeatureCard
                icon={<SparklesIcon className="w-8 h-8 text-brand" />}
                title="Assistant Créatif IA"
                description="Générez des images attractives pour vos annonces et rédigez des descriptions percutantes en quelques clics. L'IA vous assiste pour créer des supports marketing de haute qualité."
            />
        </div>
      </div>

      <footer className="w-full text-center p-8 mt-12 border-t border-border">
          <div className="flex justify-center items-center gap-4 text-xs">
              <a href="https://waive.fr" target="_blank" rel="noopener noreferrer" className="bg-brand text-white font-bold py-2 px-4 rounded-md">Créer un compte</a>
              <a href="/privacy-policy" className="text-secondary hover:text-primary">Politique de confidentialité</a>
              <a href="/terms-of-use" className="text-secondary hover:text-primary">Conditions d'utilisation</a>
          </div>
          <p className="mt-4 text-xs text-secondary">© {new Date().getFullYear()} WaImmo by Waive.fr - Tous droits réservés.</p>
      </footer>

    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, description: string }> = ({ icon, title, description }) => (
    <div className="bg-surface p-6 rounded-lg text-left">
        <div className="mb-3">{icon}</div>
        <h3 className="font-bold text-lg text-primary mb-2">{title}</h3>
        <p className="text-sm text-secondary">{description}</p>
    </div>
);
