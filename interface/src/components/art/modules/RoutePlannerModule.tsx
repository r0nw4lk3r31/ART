
import React, { useState, useEffect } from 'react';
import { Map, Navigation, MapPin, Clock, Car, Train, Bus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BaseModule from './BaseModule';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';

interface Route {
  id: string;
  from: string;
  to: string;
  duration: string;
  distance: string;
  transportType: 'car' | 'train' | 'bus' | 'walk';
  departureTime: string;
  arrivalTime: string;
  steps: RouteStep[];
}

interface RouteStep {
  id: string;
  instruction: string;
  distance: string;
  duration: string;
  transportType?: 'car' | 'train' | 'bus' | 'walk';
}

interface RoutePlannerModuleProps {
  frameId: string;
  isTargeted: boolean;
}

const RoutePlannerModule = ({ frameId, isTargeted }: RoutePlannerModuleProps) => {
  const [origin, setOrigin] = useState('Leuven');
  const [destination, setDestination] = useState('Brussels');
  const [travelMode, setTravelMode] = useState<'car' | 'train' | 'bus'>('train');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [upcomingTrips, setUpcomingTrips] = useState<{event: string, location: string, date: string, time: string}[]>([
    {
      event: 'Meeting in Brussels',
      location: 'Brussels Central Office',
      date: 'Tomorrow',
      time: '16:00'
    }
  ]);

  useEffect(() => {
    // Simulate loading routes
    if (origin && destination) {
      setLoading(true);
      
      // Mock API call
      setTimeout(() => {
        generateMockRoutes();
        setLoading(false);
      }, 1000);
    }
  }, [origin, destination, travelMode]);

  const generateMockRoutes = () => {
    const mockRoutes: Route[] = [
      {
        id: '1',
        from: origin,
        to: destination,
        duration: '45 mins',
        distance: '30 km',
        transportType: 'train',
        departureTime: '15:15',
        arrivalTime: '16:00',
        steps: [
          {
            id: '1-1',
            instruction: 'Walk to Leuven Station',
            distance: '0.5 km',
            duration: '7 mins',
            transportType: 'walk'
          },
          {
            id: '1-2',
            instruction: 'Take train IC 512 from Leuven to Brussels Central',
            distance: '29 km',
            duration: '25 mins',
            transportType: 'train'
          },
          {
            id: '1-3',
            instruction: 'Walk to Brussels Central Office',
            distance: '0.5 km',
            duration: '8 mins',
            transportType: 'walk'
          }
        ]
      },
      {
        id: '2',
        from: origin,
        to: destination,
        duration: '55 mins',
        distance: '30 km',
        transportType: 'train',
        departureTime: '15:25',
        arrivalTime: '16:20',
        steps: [
          {
            id: '2-1',
            instruction: 'Walk to Leuven Station',
            distance: '0.5 km',
            duration: '7 mins',
            transportType: 'walk'
          },
          {
            id: '2-2',
            instruction: 'Take train IC 514 from Leuven to Brussels Central',
            distance: '29 km',
            duration: '30 mins',
            transportType: 'train'
          },
          {
            id: '2-3',
            instruction: 'Walk to Brussels Central Office',
            distance: '0.5 km',
            duration: '8 mins',
            transportType: 'walk'
          }
        ]
      }
    ];

    if (travelMode === 'car') {
      mockRoutes[0].transportType = 'car';
      mockRoutes[0].duration = '40 mins';
      mockRoutes[0].departureTime = '15:20';
      mockRoutes[0].arrivalTime = '16:00';
      mockRoutes[0].steps = [
        {
          id: '1-1',
          instruction: 'Head north on N19',
          distance: '5 km',
          duration: '8 mins',
          transportType: 'car'
        },
        {
          id: '1-2',
          instruction: 'Take E314 towards Brussels',
          distance: '20 km',
          duration: '22 mins',
          transportType: 'car'
        },
        {
          id: '1-3',
          instruction: 'Take exit 1B and follow R21',
          distance: '5 km',
          duration: '10 mins',
          transportType: 'car'
        }
      ];
    }

    if (travelMode === 'bus') {
      mockRoutes[0].transportType = 'bus';
      mockRoutes[0].duration = '65 mins';
      mockRoutes[0].departureTime = '14:55';
      mockRoutes[0].arrivalTime = '16:00';
      mockRoutes[0].steps = [
        {
          id: '1-1',
          instruction: 'Walk to Leuven Bus Station',
          distance: '0.3 km',
          duration: '5 mins',
          transportType: 'walk'
        },
        {
          id: '1-2',
          instruction: 'Take Bus 358 from Leuven to Brussels North',
          distance: '28 km',
          duration: '45 mins',
          transportType: 'bus'
        },
        {
          id: '1-3',
          instruction: 'Take Metro 3 to Central Station',
          distance: '1.5 km',
          duration: '5 mins',
          transportType: 'train'
        },
        {
          id: '1-4',
          instruction: 'Walk to Brussels Central Office',
          distance: '0.5 km',
          duration: '8 mins',
          transportType: 'walk'
        }
      ];
    }

    setRoutes(mockRoutes);
  };

  const getTransportIcon = (type: string) => {
    switch (type) {
      case 'car': return <Car className="h-4 w-4" />;
      case 'train': return <Train className="h-4 w-4" />;
      case 'bus': return <Bus className="h-4 w-4" />;
      default: return <Navigation className="h-4 w-4" />;
    }
  };

  const handlePlanFromUpcoming = (location: string) => {
    setDestination(location);
    // Simulate search
    setLoading(true);
    setTimeout(() => {
      generateMockRoutes();
      setLoading(false);
    }, 1000);
  };

  return (
    <BaseModule
      frameId={frameId}
      isTargeted={isTargeted}
      title="Route Planner"
      icon={<Map className="h-4 w-4" />}
    >
      <div className="flex flex-col h-full">
        <div className="space-y-3 mb-4">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                placeholder="Origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="Destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Select value={travelMode} onValueChange={(value: any) => setTravelMode(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Travel mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="train">
                  <div className="flex items-center">
                    <Train className="mr-2 h-4 w-4" />
                    Train
                  </div>
                </SelectItem>
                <SelectItem value="car">
                  <div className="flex items-center">
                    <Car className="mr-2 h-4 w-4" />
                    Car
                  </div>
                </SelectItem>
                <SelectItem value="bus">
                  <div className="flex items-center">
                    <Bus className="mr-2 h-4 w-4" />
                    Bus
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Button className="flex-1">
              <Navigation className="mr-2 h-4 w-4" />
              Get Directions
            </Button>
          </div>
        </div>
        
        {upcomingTrips.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-sm mb-2">Upcoming Trips</h4>
            <div className="space-y-2">
              {upcomingTrips.map((trip, index) => (
                <Card key={index} className="p-3">
                  <div className="font-medium text-sm">{trip.event}</div>
                  <div className="flex justify-between">
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {trip.location}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {trip.date}, {trip.time}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 w-full"
                    onClick={() => handlePlanFromUpcoming(trip.location)}
                  >
                    Plan Route
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : routes.length > 0 ? (
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Available Routes</h4>
              {routes.map(route => (
                <Card key={route.id} className="p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      {getTransportIcon(route.transportType)}
                      <span className="ml-2 font-medium">{route.duration}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {route.departureTime} - {route.arrivalTime}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {route.steps.map(step => (
                      <div key={step.id} className="text-xs border-l-2 border-muted pl-3 py-1">
                        <div className="flex items-start">
                          {step.transportType && (
                            <span className="mr-2 mt-0.5">{getTransportIcon(step.transportType)}</span>
                          )}
                          <div>
                            <div>{step.instruction}</div>
                            <div className="text-muted-foreground mt-0.5">
                              {step.distance} • {step.duration}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Enter origin and destination to see routes
            </div>
          )}
        </div>
      </div>
    </BaseModule>
  );
};

export default RoutePlannerModule;
