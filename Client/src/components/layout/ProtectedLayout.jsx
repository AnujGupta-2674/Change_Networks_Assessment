import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';

import { Menu, Shield } from 'lucide-react';
import { Sheet, SheetTrigger, SheetContent } from '../ui/sheet';
import { Button } from '../ui/button';

const ProtectedLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-900 font-sans text-neutral-900 dark:text-neutral-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shrink-0">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2 mr-2">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r-0">
              <Sidebar />
            </SheetContent>
          </Sheet>
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-500 mr-2" />
            <span className="font-bold tracking-tight">Change IAM</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ProtectedLayout;
