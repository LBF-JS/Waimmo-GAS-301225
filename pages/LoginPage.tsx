import React, { useState } from 'react';
import { WaImmoLogoIcon } from '../components/Icons';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
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
              {/* FIX: Removed extraneous 'a' property */}
              <label htmlFor="password" className="block text-sm font-medium text-secondary">
                Mot de passe
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-secondary focus:outline-none focus:ring-brand focus:border-brand sm:text-sm bg-input text-primary"
                />
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
    </div>
  );
};
