
import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BaseModule from './BaseModule';
import { Card } from '@/components/ui/card';

interface Event {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  description?: string;
}

interface AgendaModuleProps {
  frameId: string;
  isTargeted: boolean;
}

const AgendaModule = ({ frameId, isTargeted }: AgendaModuleProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      title: 'Team Meeting',
      date: new Date(),
      startTime: '10:00',
      endTime: '11:00',
      location: 'Conference Room A',
      description: 'Weekly team meeting to discuss project progress'
    },
    {
      id: '2',
      title: 'Lunch with Client',
      date: new Date(),
      startTime: '12:30',
      endTime: '13:30',
      location: 'Italian Restaurant',
      description: 'Discussing new project proposals'
    },
    {
      id: '3',
      title: 'Doctor Appointment',
      date: new Date(Date.now() + 86400000), // Tomorrow
      startTime: '15:00',
      endTime: '16:00',
      location: 'Medical Center',
      description: 'Annual checkup'
    },
    {
      id: '4',
      title: 'Meeting in Brussels',
      date: new Date(Date.now() + 86400000 * 2), // Day after tomorrow
      startTime: '16:00',
      endTime: '17:30',
      location: 'Brussels Central Office',
      description: 'Important client meeting in Brussels'
    }
  ]);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = new Date(year, month, 1).getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === new Date().toDateString();
      const hasEvents = events.some(event => event.date.toDateString() === date.toDateString());
      
      days.push(
        <div 
          key={`day-${day}`} 
          className={`h-8 w-8 flex items-center justify-center rounded-full cursor-pointer
            ${isToday ? 'bg-primary text-primary-foreground' : ''}
            ${hasEvents && !isToday ? 'border border-primary text-primary' : ''}
            hover:bg-muted transition-colors`}
          onClick={() => setCurrentDate(new Date(year, month, day))}
        >
          {day}
        </div>
      );
    }
    
    return days;
  };
  
  const changeMonth = (increment: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentDate(newDate);
  };

  const todaysEvents = events.filter(
    event => event.date.toDateString() === currentDate.toDateString()
  ).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const upcomingEvents = events.filter(
    event => event.date > new Date() && event.date.toDateString() !== new Date().toDateString()
  ).sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <BaseModule
      frameId={frameId}
      isTargeted={isTargeted}
      title="Agenda"
      icon={<Calendar className="h-4 w-4" />}
    >
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <div className="flex space-x-2">
            <Button size="icon" variant="ghost" onClick={() => changeMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => changeMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-4">
          {daysOfWeek.map(day => (
            <div key={day} className="text-xs text-center font-medium">
              {day}
            </div>
          ))}
          {generateCalendarDays()}
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <h4 className="font-medium mb-2">
            {currentDate.toDateString() === new Date().toDateString() 
              ? "Today's Events" 
              : `Events for ${currentDate.toLocaleDateString()}`}
          </h4>
          
          {todaysEvents.length === 0 ? (
            <div className="text-sm text-muted-foreground mb-4">No events scheduled</div>
          ) : (
            <div className="space-y-2 mb-4">
              {todaysEvents.map(event => (
                <Card key={event.id} className="p-3">
                  <div className="font-medium text-sm">{event.title}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3 mr-1" />
                    {event.startTime} - {event.endTime}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    {event.location}
                  </div>
                  {event.description && (
                    <div className="text-xs mt-1">{event.description}</div>
                  )}
                </Card>
              ))}
            </div>
          )}
          
          <h4 className="font-medium mb-2">Upcoming Events</h4>
          {upcomingEvents.length === 0 ? (
            <div className="text-sm text-muted-foreground">No upcoming events</div>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.slice(0, 3).map(event => (
                <Card key={event.id} className="p-3">
                  <div className="font-medium text-sm">{event.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {event.date.toLocaleDateString()} • {event.startTime} - {event.endTime}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    {event.location}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        <Button className="mt-4 w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </div>
    </BaseModule>
  );
};

export default AgendaModule;
