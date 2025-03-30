
import React from 'react';
import { Newspaper } from 'lucide-react';
import BaseModule from './BaseModule';
import { Card } from '@/components/ui/card';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  summary: string;
}

interface NewsModuleProps {
  frameId: string;
  isTargeted: boolean;
}

const NewsModule = ({ frameId, isTargeted }: NewsModuleProps) => {
  const newsItems: NewsItem[] = [
    {
      id: '1',
      title: 'New AI Breakthrough in Natural Language Processing',
      source: 'Tech Today',
      time: '1 hour ago',
      summary: 'Researchers announce a major advancement in language models that could revolutionize how we interact with AI systems.'
    },
    {
      id: '2',
      title: 'Global Climate Summit Reaches New Agreement',
      source: 'World News',
      time: '3 hours ago',
      summary: 'World leaders have agreed on new emissions targets during the latest climate change conference.'
    },
    {
      id: '3',
      title: 'Stock Markets Hit Record High',
      source: 'Finance Daily',
      time: '5 hours ago',
      summary: 'Major indices closed at all-time highs as investor confidence grows in economic recovery.'
    }
  ];

  return (
    <BaseModule
      frameId={frameId}
      isTargeted={isTargeted}
      title="News"
      icon={<Newspaper className="h-4 w-4" />}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto space-y-3">
          {newsItems.map(item => (
            <Card key={item.id} className="p-4">
              <h3 className="font-medium text-sm mb-1">{item.title}</h3>
              <div className="flex items-center text-xs text-muted-foreground mb-2">
                <span>{item.source}</span>
                <span className="mx-2">•</span>
                <span>{item.time}</span>
              </div>
              <p className="text-xs">{item.summary}</p>
            </Card>
          ))}
        </div>
      </div>
    </BaseModule>
  );
};

export default NewsModule;
