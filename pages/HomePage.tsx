import React, { useMemo, useState } from 'react';
import { Contact, Appointment, ProjectStatus } from '../types';
import { BellIcon, ClockIcon, CalendarIcon, CheckIcon, UserCircleIcon } from '../components/Icons';

interface HomePageProps {
  contacts: Contact[];
  appointments: Appointment[];
  onSelectContact: (contact: Contact) => void;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <div className={`bg-surface p-6 rounded-lg shadow-lg flex items-center space-x-4 border-l-4 ${color}`}>
    <div className="text-3xl">{icon}</div>
    <div>
      <p className="text-secondary text-sm font-medium uppercase tracking-wider">{title}</p>
      <p className="text-3xl font-bold text-primary">{value}</p>
    </div>
  </div>
);

// --- Task Management ---

type Task = {
  id: string;
  type: 'callback' | 'appointment';
  text: string;
  time?: string;
  contact: Contact;
};

const TaskItem: React.FC<{
  task: Task;
  isCompleted: boolean;
  onToggle: (taskId: string) => void;
  onSelectContact: (contact: Contact) => void;
}> = ({ task, isCompleted, onToggle, onSelectContact }) => (
  <div className={`task-item flex items-center gap-3 p-3 bg-surface-secondary rounded-md transition-opacity ${isCompleted ? 'opacity-50 completed' : 'opacity-100'}`}>
    <label className="flex items-center cursor-pointer">
      <input 
        type="checkbox" 
        checked={isCompleted} 
        onChange={() => onToggle(task.id)} 
        className="sr-only task-checkbox-input"
      />
      <span className="w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all duration-300 checkmark-box">
        <CheckIcon className="w-4 h-4 text-white check-icon" />
      </span>
    </label>
    <div className="flex-grow min-w-0">
      <p className={`text-sm text-primary transition-colors ${isCompleted ? 'text-secondary' : ''}`}>
        <span className="relative animated-strikethrough">{task.text}</span>
      </p>
      {task.time && <p className="text-xs text-accent font-mono">{task.time}</p>}
    </div>
    <button onClick={() => onSelectContact(task.contact)} className="p-1 text-secondary hover:text-primary flex-shrink-0" title={`Voir le dossier de ${task.contact.firstName}`}>
      <UserCircleIcon className="w-5 h-5" />
    </button>
  </div>
);


export const HomePage: React.FC<HomePageProps> = ({ contacts, appointments, onSelectContact }) => {
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  const { contactsPending, upcomingAppointments, dailyTasks } = useMemo(() => {
    const contactsToRecall = contacts.filter(c => c.projectStatus === ProjectStatus.ARappeler);
    const contactsPending = contacts.filter(c => c.projectStatus === ProjectStatus.EnAttente).length;
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(todayStart.getDate() + 1);

    const allUpcomingAppointments = appointments
      .filter(appt => new Date(appt.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const appointmentsToday = allUpcomingAppointments.filter(appt => new Date(appt.date) < tomorrowStart);

    const callbackTasks: Task[] = contactsToRecall.map(contact => ({
      id: `callback-${contact.id}`,
      type: 'callback',
      text: `Rappeler ${contact.firstName} ${contact.lastName}`,
      contact,
    }));
    
    // FIX: The object literal inside .map was causing type inference issues.
    // Casting the object to `Task` ensures the `type` property is correctly typed
    // as 'appointment' (not string) and makes the subsequent type predicate valid.
    const appointmentTasks: Task[] = appointmentsToday.map(appt => {
      const contact = contacts.find(c => c.id === appt.contactId);
      return contact ? ({
        id: `appt-${appt.id}`,
        type: 'appointment',
        text: `${appt.title}`,
        time: new Date(appt.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        contact: contact,
      } as Task) : null;
    }).filter((t): t is Task => t !== null);

    const allTasks = [...appointmentTasks, ...callbackTasks];

    allTasks.sort((a, b) => {
      if (a.type === 'appointment' && b.type !== 'appointment') return -1;
      if (a.type !== 'appointment' && b.type === 'appointment') return 1;
      if (a.type === 'appointment' && b.type === 'appointment') {
        return a.time!.localeCompare(b.time!);
      }
      return a.text.localeCompare(b.text);
    });

    return { 
      contactsPending, 
      upcomingAppointments: allUpcomingAppointments, 
      dailyTasks: allTasks 
    };
  }, [contacts, appointments]);

  const handleToggleTask = (taskId: string) => {
    setCompletedTasks(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const futureAppointments = upcomingAppointments.filter(appt => {
      const tomorrowStart = new Date();
      tomorrowStart.setHours(0,0,0,0);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      return new Date(appt.date) >= tomorrowStart;
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-primary mb-2">Tableau de Bord</h2>
        <p className="text-secondary">Voici un résumé de votre activité.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Tâches aujourd'hui" 
          value={dailyTasks.length} 
          icon={<BellIcon className="w-10 h-10 text-orange-400" />}
          color="border-orange-500"
        />
        <StatCard 
          title="Dossiers en attente" 
          value={contactsPending} 
          icon={<ClockIcon className="w-10 h-10 text-yellow-400" />}
          color="border-yellow-500"
        />
        <StatCard 
          title="Rendez-vous à venir" 
          value={upcomingAppointments.length} 
          icon={<CalendarIcon className="w-10 h-10 text-teal-400" />}
          color="border-teal-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold text-primary mb-4">Tâches du jour ({dailyTasks.length})</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {dailyTasks.length > 0 ? (
              dailyTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isCompleted={completedTasks.includes(task.id)}
                  onToggle={handleToggleTask}
                  onSelectContact={onSelectContact}
                />
              ))
            ) : (
              <p className="text-secondary text-center py-8 italic">Aucune tâche pour aujourd'hui. Profitez-en !</p>
            )}
          </div>
        </div>

        <div className="bg-surface p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold text-primary mb-4">Prochains Rendez-vous (à p. de demain)</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {futureAppointments.length > 0 ? (
              futureAppointments.slice(0, 5).map(appt => {
                const contact = contacts.find(c => c.id === appt.contactId);
                return (
                  <div key={appt.id} className="flex items-center justify-between p-3 bg-surface-secondary rounded-md hover:bg-opacity-80 transition-colors">
                    <div>
                      <p className="font-semibold text-primary">{appt.title}</p>
                      <p className="text-sm text-secondary">{contact ? `${contact.firstName} ${contact.lastName}` : 'Contact inconnu'}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                       <p className="font-mono text-primary">{new Date(appt.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                       <p className="font-mono text-sm text-accent">{new Date(appt.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-secondary text-center py-8 italic">Aucun rendez-vous à venir.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
