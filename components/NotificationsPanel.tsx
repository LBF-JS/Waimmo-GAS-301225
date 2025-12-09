import React, { useEffect, useRef } from 'react';
import { Notification } from '../types';
import { BellAlertIcon, CheckIcon, TrashIcon } from './Icons';

interface NotificationsPanelProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onClose: () => void;
}

const formatDistanceToNow = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return `il y a ${Math.floor(interval)} ans`;
  interval = seconds / 2592000;
  if (interval > 1) return `il y a ${Math.floor(interval)} mois`;
  interval = seconds / 86400;
  if (interval > 1) return `il y a ${Math.floor(interval)} jours`;
  interval = seconds / 3600;
  if (interval > 1) return `il y a ${Math.floor(interval)} heures`;
  interval = seconds / 60;
  if (interval > 1) return `il y a ${Math.floor(interval)} minutes`;
  return "à l'instant";
};

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  notifications,
  onNotificationClick,
  onMarkAllRead,
  onClearAll,
  onClose
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Also check if the click is on the notification button itself to avoid immediate closing
      const target = event.target as HTMLElement;
      if (panelRef.current && !panelRef.current.contains(target) && !target.closest('[aria-label="Notifications"]')) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="absolute top-full right-0 mt-2 w-80 lg:w-96 bg-surface border border-border rounded-lg shadow-2xl z-50 flex flex-col animate-fade-in-up"
    >
      <div className="flex justify-between items-center p-3 border-b border-border">
        <h3 className="font-bold text-primary">Notifications</h3>
        <div className="flex items-center space-x-2">
          <button onClick={onMarkAllRead} className="text-secondary hover:text-primary transition-colors" aria-label="Tout marquer comme lu">
            <CheckIcon className="w-5 h-5" />
          </button>
          <button onClick={onClearAll} className="text-secondary hover:text-red-500 transition-colors" aria-label="Tout effacer">
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => onNotificationClick(notif)}
              className="flex items-start p-3 hover:bg-surface-secondary cursor-pointer border-b border-border/50"
            >
              {!notif.isRead && <div className="w-2 h-2 bg-brand rounded-full mt-1.5 flex-shrink-0"></div>}
              <div className={`ml-3 flex-grow ${notif.isRead ? 'opacity-60' : ''}`}>
                <p className="text-sm text-primary">{notif.message}</p>
                <p className="text-xs text-secondary mt-1">{formatDistanceToNow(notif.timestamp)}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center p-8 text-secondary">
            <BellAlertIcon className="w-12 h-12 mx-auto" />
            <p className="mt-2 text-sm">Vous n'avez aucune notification.</p>
          </div>
        )}
      </div>
    </div>
  );
};