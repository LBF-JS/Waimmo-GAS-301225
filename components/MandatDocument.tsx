import React from 'react';
// FIX: Import missing Mandate and FeeType types
import { Mandate, Contact, FeeType, AgentInfo } from '../types';

interface MandatDocumentProps {
  mandate: Mandate;
  seller: Contact;
  agentInfo: AgentInfo;
}

const Placeholder: React.FC<{ children?: React.ReactNode, length?: number }> = ({ children, length = 20 }) => (
    <span className="font-semibold underline underline-offset-4 decoration-dotted">
        {children || '.'.repeat(length)}
    </span>
);

export const MandatDocument: React.FC<MandatDocumentProps> = ({ mandate, seller, agentInfo }) => {
    
    const calculateDuration = () => {
        const start = new Date(mandate.startDate);
        const end = new Date(mandate.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Average days in month
        return diffMonths;
    };
    const totalDuration = calculateDuration();
    const initialDuration = Math.min(3, totalDuration);
    const prorogationDuration = Math.max(0, totalDuration - initialDuration);

    const today = new Date().toLocaleDateString('fr-FR');
    const issueDateFormatted = new Date(agentInfo.issueDate).toLocaleDateString('fr-FR');

    const renderRemuneration = () => {
        if(mandate.feeType === FeeType.Pourcentage) {
            return <>soit <Placeholder>{mandate.fees || 5}</Placeholder> % du prix de vente.</>;
        }
        if(mandate.feeType === FeeType.Forfait) {
            return <>égale à la somme de <Placeholder>{mandate.fees ? mandate.fees.toLocaleString('fr-FR') : '...'}</Placeholder> euros toutes taxes comprises</>;
        }
        return <Placeholder length={40} />;
    }

    return (
        <div className="printable-area bg-white text-black p-8 rounded-md shadow-lg max-h-[70vh] overflow-y-auto">
            <div className="font-serif text-sm print-text-black print-bg-white">
                <h1 className="text-2xl font-bold text-center">Mandat de vente non-exclusif</h1>
                <p className="text-center text-xs mb-6">(Décret n°72-678 du 20 juillet 1972, art. 72)</p>

                <p className="mb-2"><strong>Numéro du registre :</strong> <Placeholder>{mandate.mandateNumber || '...'}</Placeholder></p>

                <h2 className="font-bold mt-6 mb-2">ENTRE LES SOUSSIGNES</h2>
                <p><strong>M</strong> <Placeholder>{seller.lastName} {seller.firstName}</Placeholder></p>
                <p><strong>Né le</strong> <Placeholder length={10} /> <strong>à</strong> <Placeholder length={20} /></p>
                <p><strong>Demeurant à</strong> <Placeholder>{seller.address}</Placeholder></p>
                <p>Agissant en sa qualité de propriétaire des biens et droits immobiliers ci-après énoncés,</p>
                <p className="mb-4">Ci-après dénommé (e) "Le Mandant"</p>
                <p className="font-bold text-center">D'une part,</p>

                <h2 className="font-bold mt-6 mb-2">et</h2>
                <p><strong>M</strong> <Placeholder>{agentInfo.name}</Placeholder> (ou : la {agentInfo.legalForm} <Placeholder>{agentInfo.name}</Placeholder>)</p>
                <p><strong>Demeurant à</strong> <Placeholder>{agentInfo.address}</Placeholder> (ou : dont le siège social est fixé à <Placeholder>{agentInfo.address}</Placeholder>)</p>
                <p>Agissant en sa qualité d'administrateur de biens,</p>
                <p><strong>Titulaire de la carte professionnelle n°</strong> <Placeholder>{agentInfo.professionalCard}</Placeholder> <strong>délivrée le</strong> <Placeholder>{issueDateFormatted}</Placeholder> <strong>par la préfecture de</strong> <Placeholder>{agentInfo.prefecture}</Placeholder></p>
                <p><strong>Adhérent de la Société de caution mutuelle dénommée</strong> <Placeholder>{agentInfo.cautionMutuelle}</Placeholder> dont le siège social est fixé à <Placeholder>{agentInfo.cautionAddress}</Placeholder> sous le numéro <Placeholder>{agentInfo.cautionNumber}</Placeholder></p>
                <p className="mb-4">Ci-après dénommé (e) "Le Mandataire"</p>
                <p className="font-bold text-center">D'autre part,</p>

                <h2 className="font-bold mt-8 mb-4 text-center">IL A ETE CONVENU ET ARRETE CE QUI SUIT :</h2>
                <p>
                    <strong>M</strong> <Placeholder>{seller.lastName} {seller.firstName}</Placeholder> mandate par les présentes <strong>M</strong> <Placeholder>{agentInfo.name}</Placeholder> (ou : la société <Placeholder>{agentInfo.name}</Placeholder>) à l'effet de rechercher un acquéreur et faire toutes les démarches, signer et retirer toutes pièces nécessaires auprès des services compétents, en vue de vendre les biens et droits immobiliers ci-dessous désignés.
                </p>

                <h3 className="font-bold mt-6 mb-2">1 - DESIGNATION - SITUATION ET PRIX DES BIENS</h3>
                <p>Les biens à vendre, objets du présent mandat consistent en <Placeholder>{mandate.description || '...'}</Placeholder> (indiquer la nature et la consistance du bien) sis à <Placeholder>{mandate.propertyAddress}</Placeholder> (lieu de situation des biens).</p>
                <p>Le mandant déclare que les biens à vendre seront, le jour de la signature de l'acte de vente, libres de toute location, occupation ou réquisition.</p>
                <p>Les biens et droits immobiliers ci-dessus désignés devront être présentés par le mandataire au prix de <Placeholder>{mandate.price.toLocaleString('fr-FR')}</Placeholder> euros, payable comptant.</p>

                <h3 className="font-bold mt-6 mb-2">2 - NATURE ET DUREE DU MANDAT</h3>
                <p>Le présent mandat est consenti et accepté sans exclusivité pour une durée irrévocable de <Placeholder>{initialDuration}</Placeholder> mois à compter de ce jour. A l'issue de cette période initiale, il sera prorogé pour une durée de <Placeholder>{prorogationDuration}</Placeholder> mois au terme de laquelle il prendra fin automatiquement. sans aucune formalité. Toutefois, chacune des parties pourra y mettre fin au terme de la période initiale ou à tout moment au cours de la période de prorogation, par lettre recommandée avec demande d'avis de réception et sous réserve du respect d'un délai de préavis de <Placeholder>15</Placeholder> jours.</p>

                <div className="print-break-before">
                    <h3 className="font-bold mt-6 mb-2">3 - POUVOIRS DU MANDATAIRE</h3>
                    <p>En considération du présent mandant, tous pouvoirs sont conférés au mandataire à l'effet de mener à bien sa mission. Il pourra ou devra notamment :</p>
                    <ul className="list-disc list-inside ml-4 my-2">
                        <li>faire tout ce qui sera nécessaire aux fins de parvenir à la vente desdits biens ; en cas de publicité, celle-ci sera effectuée à ses frais ;</li>
                        <li>présenter et faire visiter lesdits biens à tous acquéreurs éventuels ;</li>
                        <li>établir tous actes sous seing privés aux clauses et conditions nécessaires à l'accomplissement des présentes ;</li>
                        <li>procéder, le cas échéant, à la déclaration d'aliéner exigée par la loi foncière et en cas d'exercice du droit de préemption par l'organisme bénéficiaire de ce droit, négocier et conclure avec ledit organisme préempteur après en avoir averti le mandant ; le mandant se réserve toutefois le droit d'accepter ou de refuser le prix proposé par l'organisme préempteur au cas où le prix proposé serait inférieur au prix demandé ci-dessus indiqué.</li>
                    </ul>

                    <h3 className="font-bold mt-6 mb-2">4 - OBLIGATIONS DU MANDANT</h3>
                    <p>Le mandant s'engage à signer aux prix, charges et conditions convenues, toute promesse de vente ou tout compromis de vente avec tout acquéreur que lui aura présenté le mandataire. Il s'interdit également, par l'effet des présentes et même après l'expiration du présent mandat, de conclure directement avec tout acquéreur ayant visité les biens à vendre par l'intermédiaire du mandataire. Il conserve toutefois toute liberté de conclure avec l'acquéreur de son choix qu'il aura trouvé par ses propres soins ou éventuellement par l'intermédiaire d'un autre mandataire. [...]</p>
                    <p>En cas de non-respect par le mandant de ses obligations, il s'engage à verser au mandataire une indemnité compensatrice forfaitaire destinée à compenser ses frais, peines et soins, égale à la somme de <Placeholder>...</Placeholder> euros, en vertu des articles 1142 et 1152 du Code civil.</p>

                    <h3 className="font-bold mt-6 mb-2">5 - REMUNERATION</h3>
                    <p>Si la vente des biens ci-dessus désignés est réalisée, la rémunération à laquelle le mandataire aura droit sera {renderRemuneration()}</p>
                    <p>Le paiement de cette somme incombera à l'acquéreur ou au préempteur en cas d'exercice du droit de préemption.</p>
                    
                    <p className="mt-8">Fait en double exemplaire, dont un est remis ce jour au mandant qui le reconnaît, à <Placeholder>{agentInfo.address.split(',')[1].trim()}</Placeholder>, le <Placeholder>{today}</Placeholder></p>

                    <div className="flex justify-between mt-12 pt-8">
                        <div className="w-2/5">
                            <p className="border-t border-dotted border-black pt-2">(signature précédée de la mention manuscrite lu et approuvé, bon pour mandat)</p>
                        </div>
                         <div className="w-2/5">
                            <p className="border-t border-dotted border-black pt-2">(signature précédée de la mention manuscrite lu et approuvé, mandat accepté)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
