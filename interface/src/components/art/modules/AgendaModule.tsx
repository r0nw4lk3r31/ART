import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Plus, ChevronLeft, ChevronRight, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BaseModule from './BaseModule';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface Event {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  isTodo?: boolean;
}

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  dueDateFormatted?: string;
}

interface AgendaModuleProps {
  frameId: string;
  isTargeted: boolean;
}

const AgendaModule = ({ frameId, isTargeted }: AgendaModuleProps) => {
  const today = new Date().toDateString();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [title, setTitle] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Load events from electronAPI and todos from localStorage
  useEffect(() => {
    const testIPC = async () => {
      try {
        const pong = await window.electronAPI.ping();
        console.log('IPC Test:', pong); // Should log 'pong'
      } catch (error) {
        toast.error('IPC not working: ' + error.message);
      }
    };
    testIPC();

    const loadEvents = async () => {
      try {
        const loadedEvents = await window.electronAPI.loadAgenda();
        setEvents(loadedEvents.map((e: Event & { date: string }) => ({ 
          ...e, 
          date: new Date(e.date) 
        })));
      } catch (error) {
        toast.error('Failed to load agenda: ' + error.message);
      }
    };
    loadEvents();
    
    // Load todos with deadlines from localStorage
    const loadTodos = () => {
      try {
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
          const parsedTodos = JSON.parse(savedTodos);
          console.log('Loading todos for agenda:', parsedTodos.length, 'todos found');
          
          // Filter todos with due dates and convert them to event-like objects
          const todoEvents = parsedTodos
            .filter((todo: Todo) => todo.dueDate && !todo.completed)
            .map((todo: Todo) => {
              console.log('Adding todo to agenda:', todo.text, 'due:', todo.dueDate);
              return {
                // Use a more unique ID to prevent duplicates
                id: `todo-${todo.id}`,
                title: todo.text,
                date: new Date(todo.dueDate),
                startTime: '',
                endTime: '',
                location: `Todo - ${todo.priority} priority`,
                isTodo: true
              };
            });
          
          console.log('Created', todoEvents.length, 'todo events for agenda');
          
          // Add todo events to the events array
          setEvents(prev => {
            // Filter out any existing todo events to prevent duplicates
            const nonTodoEvents = prev.filter(event => !event.id.toString().startsWith('todo-'));
            return [...nonTodoEvents, ...todoEvents];
          });
        }
      } catch (error) {
        console.error('Error loading todos for agenda:', error);
      }
    };
    loadTodos();
  }, []);
  
  // Listen for changes to todos in localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'todos') {
        // Reload events and todos when todos change
        const loadEvents = async () => {
          try {
            const loadedEvents = await window.electronAPI.loadAgenda();
            // Filter out todo events (they'll be re-added)
            const regularEvents = loadedEvents
              .map((e: Event & { date: string }) => ({ ...e, date: new Date(e.date) }))
              .filter((e: Event) => !e.id.toString().startsWith('todo-'));
            
            setEvents(regularEvents);
            
            // Add todo events
            if (e.newValue) {
              const parsedTodos = JSON.parse(e.newValue);
              console.log('Storage event: Loading todos for agenda:', parsedTodos.length, 'todos found');
              
              const todoEvents = parsedTodos
                .filter((todo: Todo) => todo.dueDate && !todo.completed)
                .map((todo: Todo) => {
                  console.log('Storage event: Adding todo to agenda:', todo.text, 'due:', todo.dueDate);
                  return {
                    // Use consistent ID format (without timestamp)
                    id: `todo-${todo.id}`,
                    title: todo.text,
                    date: new Date(todo.dueDate),
                    startTime: '',
                    endTime: '',
                    location: `Todo - ${todo.priority} priority`,
                    isTodo: true
                  };
                });
              
              console.log('Storage event: Created', todoEvents.length, 'todo events for agenda');
              
              setEvents(prev => {
                // Filter out any existing todo events to prevent duplicates
                const nonTodoEvents = prev.filter(event => !event.id.toString().startsWith('todo-'));
                return [...nonTodoEvents, ...todoEvents];
              });
            }
          } catch (error) {
            console.error('Error reloading events after todo change:', error);
          }
        };
        loadEvents();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = new Date(year, month, 1).getDay();
    const days = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
    return days.map((day, i) => (
      <div
        key={i}
        className={`h-8 w-8 flex items-center justify-center rounded-full cursor-pointer
          ${day && new Date(year, month, day).toDateString() === today ? 'bg-primary text-primary-foreground' : ''} 
          hover:bg-muted`}
        onClick={() => day && setCurrentDate(new Date(year, month, day))}
      >
        {day || ''}
      </div>
    ));
  };

  const changeMonth = (increment: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentDate(newDate);
  };

  const addEvent = async () => {
    if (!title || !dateInput || !startTime || !endTime || !location) {
      toast.error('Please fill in all fields');
      return;
    }
    const newEvent: Event = {
      id: Date.now().toString(),
      title,
      date: new Date(dateInput),
      startTime,
      endTime,
      location,
    };
    const updatedEvents = [...events, newEvent];
    try {
      const result = await window.electronAPI.saveAgenda(updatedEvents);
      if (result.success) {
        setEvents(updatedEvents);
        setTitle('');
        setDateInput('');
        setStartTime('');
        setEndTime('');
        setLocation('');
        setIsAdding(false);
        toast.success('Event added!');
      } else {
        toast.error('Failed to save event: ' + result.error);
      }
    } catch (error) {
      toast.error('Error saving event: ' + error.message);
    }
  };

  const todaysEvents = events.filter((event) => event.date.toDateString() === currentDate.toDateString());
  const upcomingEvents = events.filter((event) => event.date.toDateString() !== today && event.date > new Date());

  return (
    <BaseModule frameId={frameId} isTargeted={isTargeted} title="Agenda" icon={<Calendar className="h-4 w-4" />}>
      <div className="flex flex-col h-full">
        {!isAdding ? (
          <>
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-medium">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
              <div className="flex space-x-2">
                <Button size="icon" variant="ghost" onClick={() => changeMonth(-1)}><ChevronLeft className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => changeMonth(1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {daysOfWeek.map((day) => <div key={day} className="text-xs text-center">{day}</div>)}
              {generateCalendarDays()}
            </div>
            <div className="flex-1 overflow-y-auto">
              <h4 className="font-medium mb-2">Events for {currentDate.toLocaleDateString()}</h4>
              {todaysEvents.map((event) => (
                <Card 
                  key={event.id} 
                  className={`p-3 mb-2 ${event.isTodo ? 'border-l-4 border-l-primary' : ''}`}
                >
                  <div className="font-medium text-sm">
                    {event.isTodo && <CheckSquare className="h-3 w-3 mr-1 inline text-primary" />}
                    {event.title}
                  </div>
                  {!event.isTodo ? (
                    <>
                      <div className="text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1 inline" /> {event.startTime} - {event.endTime}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1 inline" /> {event.location}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1 inline" /> Due today
                      <span className="mx-2">•</span>
                      <span>{event.location}</span>
                    </div>
                  )}
                </Card>
              ))}
              <h4 className="font-medium mb-2 mt-4">Upcoming</h4>
              {upcomingEvents.slice(0, 5).map((event) => (
                <Card 
                  key={event.id} 
                  className={`p-3 mb-2 ${event.isTodo ? 'border-l-4 border-l-primary' : ''}`}
                >
                  <div className="font-medium text-sm">
                    {event.isTodo && <CheckSquare className="h-3 w-3 mr-1 inline text-primary" />}
                    {event.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1 inline" /> {event.date.toLocaleDateString()}
                    {!event.isTodo && event.startTime && (
                      <>
                        <span className="mx-2">•</span>
                        <Clock className="h-3 w-3 mr-1 inline" /> {event.startTime}
                      </>
                    )}
                    {event.isTodo && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{event.location}</span>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
            <Button className="mt-4 w-full" onClick={() => setIsAdding(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Event
            </Button>
          </>
        ) : (
          <div className="flex flex-col h-full">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="mb-2" />
            <Input type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} className="mb-2" />
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="Start" className="mb-2" />
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} placeholder="End" className="mb-2" />
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="mb-2" />
            <div className="flex space-x-2 mt-2">
              <Button onClick={addEvent} className="flex-1">Save</Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </BaseModule>
  );
};

export default AgendaModule;
