
import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, RefreshCw } from 'lucide-react';
import BaseModule from './BaseModule';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface NewsItem {
  title: string;
  source: {
    name: string;
  };
  publishedAt: string;
  description: string;
  url: string;
  urlToImage?: string;
  content?: string;
}

interface NewsModuleProps {
  frameId: string;
  isTargeted: boolean;
}

const NewsModule = ({ frameId, isTargeted }: NewsModuleProps) => {
  const [dutchNews, setDutchNews] = useState<NewsItem[]>([]);
  const [europeNews, setEuropeNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('netherlands');
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Using NewsAPI.org - you'll need to replace with your API key
      const apiKey = import.meta.env.VITE_NEWS_API_KEY || 'YOUR_API_KEY';
      
      // Fetch Dutch news
      const dutchResponse = await fetch(
        `https://newsapi.org/v2/top-headlines?country=nl&apiKey=${apiKey}`
      );
      
      // Fetch European news
      const europeResponse = await fetch(
        `https://newsapi.org/v2/top-headlines?category=general&language=en&sources=bbc-news,the-irish-times,le-monde,der-tagesspiegel&apiKey=${apiKey}`
      );
      
      if (!dutchResponse.ok || !europeResponse.ok) {
        throw new Error('Failed to fetch news');
      }
      
      const dutchData = await dutchResponse.json();
      const europeData = await europeResponse.json();
      
      setDutchNews(dutchData.articles || []);
      setEuropeNews(europeData.articles || []);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to load news. Using sample data instead.');
      
      // Fallback to sample data if API fails
      setDutchNews([
        {
          title: "Dutch Government Announces New Climate Initiatives",
          source: { name: "NL Times" },
          publishedAt: new Date().toISOString(),
          description: "The Dutch government has unveiled a comprehensive plan to reduce carbon emissions by 55% by 2030.",
          url: "#",
          content: "The Dutch government has unveiled a comprehensive plan to reduce carbon emissions by 55% by 2030. The plan includes significant investments in renewable energy, particularly offshore wind farms in the North Sea. Additionally, the government will implement stricter regulations on industrial emissions and provide subsidies for home insulation and heat pumps. Environmental groups have cautiously welcomed the announcement but stress that implementation will be key to its success."
        },
        {
          title: "Amsterdam Housing Market Shows Signs of Cooling",
          source: { name: "Dutch News" },
          publishedAt: new Date(Date.now() - 3600000).toISOString(),
          description: "After years of skyrocketing prices, Amsterdam's housing market is finally showing signs of stabilization.",
          url: "#",
          content: "After years of skyrocketing prices, Amsterdam's housing market is finally showing signs of stabilization. Recent data from the Dutch Association of Realtors (NVM) indicates a 2.3% decrease in average home prices in the capital during the last quarter. Experts attribute this cooling to rising interest rates, increased housing supply, and new government policies aimed at protecting first-time buyers. However, housing remains significantly less affordable than a decade ago, with prices still more than 150% higher than in 2013."
        },
        {
          title: "Dutch Tech Startup Secures €50 Million in Funding",
          source: { name: "Tech Netherlands" },
          publishedAt: new Date(Date.now() - 7200000).toISOString(),
          description: "Rotterdam-based AI company NLTech has secured €50 million in Series B funding to expand its operations.",
          url: "#",
          content: "Rotterdam-based AI company NLTech has secured €50 million in Series B funding to expand its operations. The startup, which specializes in machine learning solutions for the logistics industry, plans to use the investment to expand into new European markets and double its workforce over the next 18 months. The funding round was led by Amsterdam-based venture capital firm Peak Capital, with participation from several international investors. This represents one of the largest funding rounds for a Dutch tech company this year."
        }
      ]);
      
      setEuropeNews([
        {
          title: "EU Commission Proposes New Digital Privacy Framework",
          source: { name: "Euronews" },
          publishedAt: new Date().toISOString(),
          description: "The European Commission has proposed a comprehensive update to digital privacy regulations across the bloc.",
          url: "#",
          content: "The European Commission has proposed a comprehensive update to digital privacy regulations across the bloc. The new framework aims to strengthen user control over personal data while streamlining compliance requirements for businesses. Key provisions include enhanced transparency requirements, stronger enforcement mechanisms, and special protections for minors online. The proposal will now be debated in the European Parliament, with final adoption expected within 18 months."
        },
        {
          title: "European Central Bank Raises Interest Rates Amid Inflation Concerns",
          source: { name: "Financial Times" },
          publishedAt: new Date(Date.now() - 5400000).toISOString(),
          description: "The ECB has increased its key interest rate by 0.25 percentage points in response to persistent inflation pressures.",
          url: "#",
          content: "The ECB has increased its key interest rate by 0.25 percentage points in response to persistent inflation pressures. This marks the sixth rate hike in the past 18 months, bringing the benchmark rate to its highest level since 2008. ECB President Christine Lagarde indicated that while inflation has moderated from its peak, underlying price pressures remain too strong to consider pausing the tightening cycle. The decision has raised concerns about economic growth, particularly in southern European countries still recovering from the pandemic."
        },
        {
          title: "France and Germany Announce Joint Defense Initiative",
          source: { name: "Deutsche Welle" },
          publishedAt: new Date(Date.now() - 10800000).toISOString(),
          description: "The leaders of France and Germany have unveiled a new defense cooperation agreement aimed at strengthening European security.",
          url: "#",
          content: "The leaders of France and Germany have unveiled a new defense cooperation agreement aimed at strengthening European security. The initiative includes joint development of a next-generation fighter jet, increased military exercises, and coordination on cybersecurity threats. French President Emmanuel Macron described the agreement as a crucial step toward European strategic autonomy, while German Chancellor Olaf Scholz emphasized the importance of transatlantic cooperation alongside European defense capabilities. The announcement comes amid growing concerns about security challenges on Europe's eastern and southern borders."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    
    // Refresh news every 30 minutes
    const interval = setInterval(fetchNews, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHrs < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHrs < 24) {
      return `${diffHrs} hour${diffHrs !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleArticleClick = (article: NewsItem) => {
    setSelectedArticle(article);
    setDialogOpen(true);
  };

  const handleRefresh = () => {
    fetchNews();
  };

  return (
    <BaseModule
      frameId={frameId}
      isTargeted={isTargeted}
      title="News"
      icon={<Newspaper className="h-4 w-4" />}
    >
      <div className="flex flex-col h-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="netherlands">Netherlands</TabsTrigger>
              <TabsTrigger value="europe">Europe</TabsTrigger>
            </TabsList>
            <Button variant="ghost" size="icon" onClick={handleRefresh} className="ml-2">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <TabsContent value="netherlands" className="space-y-3 mt-0 h-full">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/4 mb-2" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full mt-1" />
                  </Card>
                ))
              ) : (
                dutchNews.map((item, index) => (
                  <Card 
                    key={index} 
                    className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => handleArticleClick(item)}
                  >
                    <h3 className="font-medium text-sm mb-1 flex items-start">
                      <span className="flex-1">{item.title}</span>
                      <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0 opacity-50" />
                    </h3>
                    <div className="flex items-center text-xs text-muted-foreground mb-2">
                      <span>{item.source.name}</span>
                      <span className="mx-2">•</span>
                      <span>{formatDate(item.publishedAt)}</span>
                    </div>
                    <p className="text-xs line-clamp-2">{item.description}</p>
                  </Card>
                ))
              )}
            </TabsContent>
            
            <TabsContent value="europe" className="space-y-3 mt-0 h-full">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/4 mb-2" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full mt-1" />
                  </Card>
                ))
              ) : (
                europeNews.map((item, index) => (
                  <Card 
                    key={index} 
                    className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => handleArticleClick(item)}
                  >
                    <h3 className="font-medium text-sm mb-1 flex items-start">
                      <span className="flex-1">{item.title}</span>
                      <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0 opacity-50" />
                    </h3>
                    <div className="flex items-center text-xs text-muted-foreground mb-2">
                      <span>{item.source.name}</span>
                      <span className="mx-2">•</span>
                      <span>{formatDate(item.publishedAt)}</span>
                    </div>
                    <p className="text-xs line-clamp-2">{item.description}</p>
                  </Card>
                ))
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
      
      {/* Article Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedArticle && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg">{selectedArticle.title}</DialogTitle>
                <div className="flex items-center text-sm text-muted-foreground mt-2">
                  <span>{selectedArticle.source.name}</span>
                  <span className="mx-2">•</span>
                  <span>{formatDate(selectedArticle.publishedAt)}</span>
                </div>
              </DialogHeader>
              
              {selectedArticle.urlToImage && (
                <div className="my-4">
                  <img 
                    src={selectedArticle.urlToImage} 
                    alt={selectedArticle.title}
                    className="w-full h-auto rounded-md"
                    onError={(e) => {
                      // Hide image on error
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="space-y-4">
                <p className="text-sm font-medium">{selectedArticle.description}</p>
                <p className="text-sm">{selectedArticle.content || 'Full article content not available.'}</p>
                
                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      if (selectedArticle.url && selectedArticle.url !== '#') {
                        window.open(selectedArticle.url, '_blank');
                      }
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Read Full Article
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </BaseModule>
  );
};

export default NewsModule;
