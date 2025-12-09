import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { PigeResult } from '../pages/PigePage';

// Fix for default icon issue by using direct URLs, avoiding faulty asset imports.
const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

const highlightedIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface MapUpdaterProps {
    bounds: L.LatLngBoundsExpression | null;
}

const MapUpdater: React.FC<MapUpdaterProps> = ({ bounds }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [map, bounds]);
    return null;
}


interface MapResultsProps {
    results: PigeResult[];
    highlightedResultId: string | null;
    onMarkerHover: (resultId: string | null) => void;
    onMarkerClick: (resultId: string) => void;
}

export const MapResults: React.FC<MapResultsProps> = ({ results, highlightedResultId, onMarkerHover, onMarkerClick }) => {
    
    const resultsWithCoords = useMemo(() => {
        return results.filter(r => r.latitude !== undefined && r.longitude !== undefined);
    }, [results]);

    const bounds = useMemo(() => {
        if (resultsWithCoords.length === 0) return null;
        const latLngs = resultsWithCoords.map(r => [r.latitude!, r.longitude!] as [number, number]);
        return L.latLngBounds(latLngs);
    }, [resultsWithCoords]);


    if (resultsWithCoords.length === 0) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-800 text-secondary">
                <p>La carte s'affichera ici.</p>
            </div>
        );
    }

    return (
        <MapContainer center={[46.603354, 1.888334]} zoom={6} scrollWheelZoom={true} className="h-full w-full">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {resultsWithCoords.map(result => (
                <Marker 
                    key={result.id} 
                    position={[result.latitude!, result.longitude!]}
                    icon={highlightedResultId === result.id ? highlightedIcon : defaultIcon}
                    eventHandlers={{
                        mouseover: () => onMarkerHover(result.id),
                        mouseout: () => onMarkerHover(null),
                        click: () => onMarkerClick(result.id),
                    }}
                >
                    <Popup>
                        <div className="font-sans">
                            <h4 className="font-bold">{result.title}</h4>
                            {result.link && (
                                <a href={result.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                    Voir les détails
                                </a>
                            )}
                        </div>
                    </Popup>
                </Marker>
            ))}
            
            <MapUpdater bounds={bounds} />

        </MapContainer>
    );
};
