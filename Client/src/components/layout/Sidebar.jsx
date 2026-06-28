import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLogout } from '../../hooks/useLogout';
import { Shield, LayoutDashboard, Users, FileText, Server, LogOut, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Sidebar = () => {
  const { user } = useAuth();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navLinkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
      isActive
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-medium'
        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
    }`;

  return (
    <div className="w-64 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col h-full shrink-0">
      <div className="flex h-16 items-center px-6 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <Shield className="h-6 w-6 text-blue-600 dark:text-blue-500 mr-2" />
        <span className="font-bold text-lg tracking-tight">Change IAM</span>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-6">
        <nav className="flex flex-col gap-1">
          <NavLink to="/dashboard" className={navLinkClasses}>
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </NavLink>
        </nav>

        <div>
          <h4 className="px-3 text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
            IAM Console
          </h4>
          <nav className="flex flex-col gap-1">
            <NavLink to="/iam/policies" className={navLinkClasses}>
              <FileText className="h-4 w-4" />
              <span>Policies</span>
            </NavLink>
            <NavLink to="/iam/groups" className={navLinkClasses}>
              <Users className="h-4 w-4" />
              <span>Groups</span>
            </NavLink>
            <NavLink to="/iam/users" className={navLinkClasses}>
              <UserIcon className="h-4 w-4" />
              <span>Users</span>
            </NavLink>
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
        <div className="flex flex-col gap-1 mb-4 px-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate max-w-[150px]">{user?.name}</span>
            {user?.isRoot && (
              <Crown className="h-3 w-3 text-amber-500" title="Root User" />
            )}
          </div>
          <span className="text-xs text-neutral-500 truncate">{user?.email}</span>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-neutral-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};

function UserIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default Sidebar;
