import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listPolicies } from '@/api/client';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Shield, Edit, Users, Layers } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const TAB_ALL = 'all';
const TAB_MANAGED = 'MANAGED';
const TAB_INLINE = 'INLINE';

const PoliciesList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(TAB_ALL);
  const navigate = useNavigate();

  const { data: policies, isLoading, isError, error } = useQuery({
    queryKey: ['policies'],
    queryFn: async () => {
      const res = await listPolicies();
      return res.data.data;
    }
  });

  if (isError) {
    if (error.response?.status === 403) {
      return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
          <Shield className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Access Denied</h2>
          <p className="text-neutral-500 mt-2 max-w-md">
            You do not have the required permissions (iam:ListPolicies) to view this resource.
          </p>
        </div>
      );
    }
    return <div>Error loading policies</div>;
  }

  const allPolicies = policies || [];
  const managed = allPolicies.filter(p => p.type === 'MANAGED');
  const inline = allPolicies.filter(p => p.type === 'INLINE');

  const filtered = allPolicies
    .filter(p => {
      if (activeTab === TAB_MANAGED) return p.type === 'MANAGED';
      if (activeTab === TAB_INLINE) return p.type === 'INLINE';
      return true;
    })
    .filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

  const tabs = [
    { id: TAB_ALL,     label: 'All Policies',     count: allPolicies.length },
    { id: TAB_MANAGED, label: 'Managed Policies',  count: managed.length },
    { id: TAB_INLINE,  label: 'Inline Policies',   count: inline.length },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Policies</h2>
          <p className="text-neutral-500">
            Manage fine-grained access policies — Managed policies can be attached to multiple users and groups.
          </p>
        </div>
        <Button onClick={() => navigate('/iam/policies/new')} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Create Policy
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 dark:border-neutral-800">
        <nav className="-mb-px flex gap-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
              }`}>
                {isLoading ? '—' : tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Search */}
      <div className="flex items-center py-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search policies..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white dark:bg-neutral-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Policy Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Statements</TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Users
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> Groups
                </div>
              </TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[40px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[40px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[40px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-16 inline-block" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-neutral-500">
                    <Shield className="w-8 h-8 text-neutral-300" />
                    <p className="font-medium">No policies found</p>
                    {searchTerm && (
                      <p className="text-sm">Try adjusting your search term</p>
                    )}
                    {!searchTerm && (
                      <Button
                        size="sm"
                        className="mt-1 bg-blue-600 hover:bg-blue-700"
                        onClick={() => navigate('/iam/policies/new')}
                      >
                        <Plus className="w-4 h-4 mr-1" /> Create your first policy
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((policy) => (
                <TableRow key={policy.id} className="group hover:bg-neutral-50 dark:hover:bg-neutral-900">
                  <TableCell className="font-medium">
                    <Link
                      to={`/iam/policies/${policy.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {policy.name}
                    </Link>
                    {policy.description && (
                      <p className="text-xs text-neutral-400 mt-0.5 truncate max-w-[280px]">{policy.description}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        policy.type === 'MANAGED'
                          ? 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-100'
                      }
                    >
                      {policy.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <span className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center text-xs font-semibold">
                        {policy.statements?.length || 0}
                      </span>
                      <span className="text-neutral-500 text-xs">
                        {policy.statements?.length === 1 ? 'statement' : 'statements'}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      {policy._count?.userAttachments ?? '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      {policy._count?.groupAttachments ?? '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-neutral-500 text-sm">
                    {new Date(policy.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/iam/policies/${policy.id}/edit`)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 px-2"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PoliciesList;
