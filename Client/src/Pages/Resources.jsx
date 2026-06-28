import React, { useState } from 'react';
import { callResourceAction } from '../api/client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ResourceActionCard = ({ action, method, route, description }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' or 'error'

  const handleAction = async () => {
    setIsLoading(true);
    setStatus(null);
    try {
      // Execute the request based on method and route
      // We use dummy IDs for routes requiring them like /api/reports/:id
      const finalRoute = route.replace(':id', 'dummy-id-123').replace(':userId', 'dummy-user-123');
      
      const res = await callResourceAction(method, finalRoute);

      if (res.status === 200 || res.status === 201) {
        setStatus('success');
        toast.success(`Success: ${action}`);
      }
    } catch (error) {
      if (error.response?.status === 403) {
        setStatus('error');
        // Toast is handled globally by axios interceptor, but we set local state
      } else {
        setStatus('error');
        toast.error(`Failed: ${action}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{action}</CardTitle>
          {status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
          {status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
        </div>
        <CardDescription className="text-xs font-mono bg-neutral-100 dark:bg-neutral-800 p-1 rounded inline-block w-max mt-1">
          {method} {route}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4 h-10">
          {description}
        </p>
        <Button 
          onClick={handleAction} 
          disabled={isLoading}
          variant={status === 'error' ? 'destructive' : status === 'success' ? 'default' : 'secondary'}
          className="w-full"
        >
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Execute Action'}
        </Button>
      </CardContent>
    </Card>
  );
};

const Resources = () => {
  const resourceGroups = {
    reports: [
      { action: 'reports:List', method: 'GET', route: '/reports', desc: 'List all reports' },
      { action: 'reports:Read', method: 'GET', route: '/reports/:id', desc: 'Read a specific report' },
      { action: 'reports:Create', method: 'POST', route: '/reports', desc: 'Create a new report' },
      { action: 'reports:Update', method: 'PUT', route: '/reports/:id', desc: 'Update a report' },
      { action: 'reports:Delete', method: 'DELETE', route: '/reports/:id', desc: 'Delete a report' },
    ],
    alerts: [
      { action: 'alerts:List', method: 'GET', route: '/alerts', desc: 'List all alerts' },
      { action: 'alerts:Read', method: 'GET', route: '/alerts/:id', desc: 'Read a specific alert' },
      { action: 'alerts:Create', method: 'POST', route: '/alerts', desc: 'Create a new alert' },
      { action: 'alerts:Acknowledge', method: 'PATCH', route: '/alerts/:id/acknowledge', desc: 'Acknowledge an alert' },
      { action: 'alerts:Delete', method: 'DELETE', route: '/alerts/:id', desc: 'Delete an alert' },
    ],
    settings: [
      { action: 'settings:Read', method: 'GET', route: '/settings', desc: 'Read system settings' },
      { action: 'settings:Update', method: 'PUT', route: '/settings', desc: 'Update system settings' },
    ],
    audit: [
      { action: 'audit:List', method: 'GET', route: '/audit', desc: 'List audit logs' },
      { action: 'audit:Read', method: 'GET', route: '/audit/:id', desc: 'Read a specific audit log' },
    ]
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Resource Dashboard</h2>
        <p className="text-neutral-500">
          Test the IAM middleware evaluation surface by executing these mock resource endpoints. 
          Green indicates success (200), Red indicates Access Denied (403).
        </p>
      </div>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>
        
        {Object.entries(resourceGroups).map(([group, actions]) => (
          <TabsContent key={group} value={group} className="mt-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {actions.map((item) => (
                <ResourceActionCard 
                  key={item.action}
                  action={item.action}
                  method={item.method}
                  route={item.route}
                  description={item.desc}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Resources;
