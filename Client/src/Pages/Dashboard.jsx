import React, { useState } from 'react';
import { ACTIONS_BY_NAMESPACE, ACTION_ROUTES, VALID_ACTIONS } from '../constants/actions';
import { callResourceAction } from '../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Play } from 'lucide-react';

const ActionCard = ({ action, status, onClick }) => {
  const { method } = ACTION_ROUTES[action];
  
  const getStatusContent = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'allowed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'denied':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-800" />;
    }
  };

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
      case 'POST': return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
      case 'PUT':
      case 'PATCH': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300';
      case 'DELETE': return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
      default: return 'bg-neutral-100 text-neutral-700';
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="font-mono text-sm">{action}</div>
          <div>
            <Badge variant="outline" className={`border-0 ${getMethodColor(method)}`}>
              {method}
            </Badge>
          </div>
        </div>
        <div>
          {getStatusContent()}
        </div>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const [statuses, setStatuses] = useState({});
  const [isTestingAll, setIsTestingAll] = useState(false);

  const executeAction = async (action) => {
    const { method, url } = ACTION_ROUTES[action];
    
    setStatuses(prev => ({ ...prev, [action]: 'loading' }));
    
    try {
      await callResourceAction(method, url);
      setStatuses(prev => ({ ...prev, [action]: 'allowed' }));
    } catch (error) {
      if (error.response?.status === 403) {
        setStatuses(prev => ({ ...prev, [action]: 'denied' }));
      } else {
        setStatuses(prev => ({ ...prev, [action]: 'denied' }));
      }
    }

    // Reset to idle after 4 seconds
    setTimeout(() => {
      setStatuses(prev => {
        // Only reset if it's currently allowed or denied (don't override a new loading state)
        if (prev[action] === 'allowed' || prev[action] === 'denied') {
          return { ...prev, [action]: 'idle' };
        }
        return prev;
      });
    }, 4000);
  };

  const handleTestAll = async () => {
    if (isTestingAll) return;
    setIsTestingAll(true);
    
    // We only test the 14 resource actions, not IAM actions
    const resourceActions = VALID_ACTIONS.filter(a => !a.startsWith('iam:'));
    
    for (const action of resourceActions) {
      await executeAction(action);
      // Add a small delay between requests to not overwhelm the network and allow visual feedback
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    setIsTestingAll(false);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resource Dashboard</h1>
          <p className="text-neutral-500 mt-1">
            Click any resource action below to test IAM middleware evaluation logic.
          </p>
        </div>
        <Button 
          onClick={handleTestAll} 
          disabled={isTestingAll}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isTestingAll ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          Test All
        </Button>
      </div>

      <div className="space-y-8">
        {['reports', 'alerts', 'settings', 'audit'].map(namespace => (
          <div key={namespace} className="space-y-4">
            <h2 className="text-xl font-semibold capitalize border-b border-neutral-200 dark:border-neutral-800 pb-2">
              {namespace}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {ACTIONS_BY_NAMESPACE[namespace].map(action => (
                <ActionCard
                  key={action}
                  action={action}
                  status={statuses[action] || 'idle'}
                  onClick={() => executeAction(action)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
