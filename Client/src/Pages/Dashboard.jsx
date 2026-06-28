import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLogout } from '../hooks/useLogout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { LogOut, User, Mail, ShieldAlert, ShieldCheck } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const logoutMutation = useLogout();

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <Button 
            variant="secondary" 
            onClick={() => logoutMutation.mutate()}
            isLoading={logoutMutation.isPending}
            className="text-slate-600"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </header>

        <Card className="border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle>Welcome back, {user?.name}!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Profile Details Card */}
              <div className="bg-slate-50 rounded-lg p-5 border border-slate-100 flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-full text-primary mt-1">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Full Name</p>
                  <p className="text-lg font-semibold text-slate-900">{user?.name}</p>
                </div>
              </div>

              {/* Email Card */}
              <div className="bg-slate-50 rounded-lg p-5 border border-slate-100 flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-full text-primary mt-1">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Email Address</p>
                  <p className="text-lg font-semibold text-slate-900">{user?.email}</p>
                </div>
              </div>

              {/* Account Type Card */}
              <div className="bg-slate-50 rounded-lg p-5 border border-slate-100 flex items-start space-x-4 md:col-span-2">
                <div className={`p-3 rounded-full mt-1 ${user?.isRoot ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                  {user?.isRoot ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Account Privilege</p>
                  <Badge variant={user?.isRoot ? "root" : "success"} className="px-3 py-1 text-sm">
                    {user?.isRoot ? 'Root User' : 'Normal User'}
                  </Badge>
                  <p className="text-sm text-slate-500 mt-2">
                    {user?.isRoot 
                      ? "You have elevated privileges. You can manage system-wide settings and resources."
                      : "You have standard access to your personal resources and settings."
                    }
                  </p>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
