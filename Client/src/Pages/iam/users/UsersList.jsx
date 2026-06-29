import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listUsers, createUser as registerUser } from '@/api/client';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, Search, Settings, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const UsersList = () => {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const navigate = useNavigate();
  
  // Create user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isRoot, setIsRoot] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: users, isLoading, isError, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await listUsers();
      return res.data.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return registerUser(data); 
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
      setIsCreateOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setIsRoot(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) return;
    createMutation.mutate({ name: newName, email: newEmail, password: newPassword, isRoot });
  };

  if (isError) {
    if (error.response?.status === 403) {
      return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
          <Shield className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Access Denied</h2>
          <p className="text-neutral-500 mt-2 max-w-md">
            You do not have the required permissions (iam:ListUsers) to view this resource.
          </p>
        </div>
      );
    }
    return <div>Error loading users</div>;
  }

  const filteredUsers = users?.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-neutral-500">Manage organization members and their access.</p>
        </div>
        
        {currentUser?.isRoot && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger render={
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" /> Create User
              </Button>
            } />
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Create Organization Member</DialogTitle>
                  <DialogDescription>
                    Only Root can create new users. Normal members cannot self-register.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      value={newName} 
                      onChange={e => setNewName(e.target.value)} 
                      placeholder="e.g. Alice Smith"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={newEmail} 
                      onChange={e => setNewEmail(e.target.value)} 
                      placeholder="alice@org.local"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Temporary Password</Label>
                    <Input 
                      id="password" 
                      type="password"
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="isRoot" 
                      className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-600"
                      checked={isRoot}
                      onChange={(e) => setIsRoot(e.target.checked)}
                    />
                    <Label htmlFor="isRoot" className="text-sm font-normal text-red-600 dark:text-red-400">Grant Root Privileges</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                    {createMutation.isPending ? 'Creating...' : 'Create User'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center py-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search users..."
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
              <TableHead>User</TableHead>
              <TableHead>Privilege</TableHead>
              <TableHead>Groups</TableHead>
              <TableHead>Direct Policies</TableHead>
              <TableHead>Boundary</TableHead>
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
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 inline-block" /></TableCell>
                </TableRow>
              ))
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-neutral-500">
                    <Shield className="w-8 h-8 text-neutral-300" />
                    <p className="font-medium">No users found</p>
                    {searchTerm && (
                      <p className="text-sm">Try adjusting your search term</p>
                    )}
                    {!searchTerm && currentUser?.isRoot && (
                      <Button
                        size="sm"
                        className="mt-1 bg-blue-600 hover:bg-blue-700"
                        onClick={() => setIsCreateOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-1" /> Create your first user
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => (
                <TableRow key={u.id} className="group-row hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer" onClick={() => window.location.href=`/iam/users/${u.id}`}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-blue-600 dark:text-blue-500">{u.name}</span>
                      <span className="text-xs text-neutral-500">{u.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {u.isRoot ? (
                      <Badge variant="destructive" className="flex w-max items-center">
                        <ShieldAlert className="w-3 h-3 mr-1" /> Root
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex w-max items-center">
                        <ShieldCheck className="w-3 h-3 mr-1" /> Member
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{u.groupCount ?? u._count?.memberships ?? 0}</TableCell>
                  <TableCell>{u.directPolicyCount ?? u._count?.policyAttachments ?? 0}</TableCell>
                  <TableCell>
                    {u.boundary ? (
                      <Badge variant="outline" className="text-amber-600 border-amber-600">Yes</Badge>
                    ) : (
                      <span className="text-neutral-400">No</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/iam/users/${u.id}`);
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

export default UsersList;
