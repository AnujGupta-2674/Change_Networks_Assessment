import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listGroups, createGroup } from '@/api/client';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Plus, Search, Users, Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const GroupsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const navigate = useNavigate();
  
  const queryClient = useQueryClient();

  const { data: groups, isLoading, isError, error } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const res = await listGroups();
      return res.data.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return createGroup(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Group created successfully');
      setIsCreateOpen(false);
      setNewGroupName('');
      setNewGroupDesc('');
    },
    onError: (err) => {
      if (err.response?.status === 403) {
        toast.error('Access Denied. You do not have permission to create groups.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to create group');
      }
    }
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    createMutation.mutate({ name: newGroupName, description: newGroupDesc });
  };

  if (isError) {
    if (error.response?.status === 403) {
      return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
          <Shield className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Access Denied</h2>
          <p className="text-neutral-500 mt-2 max-w-md">
            You do not have the required permissions (iam:ListGroups) to view this resource.
          </p>
        </div>
      );
    }
    return <div>Error loading groups</div>;
  }

  const filteredGroups = groups?.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Groups</h2>
          <p className="text-neutral-500">Manage user groups to assign policies efficiently.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> Create Group
            </Button>
          } />
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Group</DialogTitle>
                <DialogDescription>
                  A group is a collection of users that inherit attached policies.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name</Label>
                  <Input 
                    id="name" 
                    value={newGroupName} 
                    onChange={e => setNewGroupName(e.target.value)} 
                    placeholder="e.g. Developers"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Description (Optional)</Label>
                  <Input 
                    id="desc" 
                    value={newGroupDesc} 
                    onChange={e => setNewGroupDesc(e.target.value)} 
                    placeholder="Brief description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                  {createMutation.isPending ? 'Creating...' : 'Create Group'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center py-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search groups..."
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
              <TableHead>Group Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Attached Policies</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[40px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[40px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 inline-block" /></TableCell>
                </TableRow>
              ))
            ) : filteredGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-neutral-500">
                    <Users className="w-8 h-8 text-neutral-300" />
                    <p className="font-medium">No groups found</p>
                    {searchTerm && (
                      <p className="text-sm">Try adjusting your search term</p>
                    )}
                    {!searchTerm && (
                      <Button
                        size="sm"
                        className="mt-1 bg-blue-600 hover:bg-blue-700"
                        onClick={() => setIsCreateOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-1" /> Create your first group
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredGroups.map((group) => (
                <TableRow key={group.id} className="group-row">
                  <TableCell className="font-medium text-blue-600 dark:text-blue-500 hover:underline">
                    <Link to={`/iam/groups/${group.id}`}>
                      {group.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-neutral-500">{group.description || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-neutral-400" />
                      {group._count?.memberships || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 mr-2 text-neutral-400" />
                      {group._count?.policyAttachments || 0}
                    </div>
                  </TableCell>
                  <TableCell className="text-neutral-500">{new Date(group.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/iam/groups/${group.id}`);
                      }}
                    >
                      <Settings className="h-4 w-4 text-neutral-500 hover:text-blue-600" />
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

export default GroupsList;
