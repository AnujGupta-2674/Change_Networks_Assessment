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
import { Plus, Search, Shield, Trash2, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const PoliciesList = () => {
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredPolicies = policies?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.type.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Policies</h2>
          <p className="text-neutral-500">Manage fine-grained access policies for your organization.</p>
        </div>
        <Button onClick={() => navigate('/iam/policies/new')} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Create Policy
        </Button>
      </div>

      <div className="flex items-center py-4">
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

      <div className="rounded-md border bg-white dark:bg-neutral-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Policy Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Statements</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 inline-block" /></TableCell>
                </TableRow>
              ))
            ) : filteredPolicies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-neutral-500">
                  No policies found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPolicies.map((policy) => (
                <TableRow key={policy.id} className="group">
                  <TableCell className="font-medium">
                    <Link to={`/iam/policies/${policy.id}`} className="hover:underline hover:text-blue-600">
                      {policy.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={policy.type === 'MANAGED' ? 'default' : 'secondary'} className={policy.type === 'MANAGED' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' : ''}>
                      {policy.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{policy.statements?.length || 0}</TableCell>
                  <TableCell className="text-neutral-500">{new Date(policy.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/iam/policies/${policy.id}/edit`);
                        }}
                      >
                        <Edit className="h-4 w-4 text-neutral-500 hover:text-blue-600" />
                      </Button>
                    </div>
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
