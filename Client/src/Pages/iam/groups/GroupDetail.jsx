import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getGroup, listUsers, listPolicies,
  addGroupMember, removeGroupMember,
  attachGroupPolicy, detachGroupPolicy,
  deleteGroup, updateGroup
} from '@/api/client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import {
  ArrowLeft, Loader2, Trash2, UserPlus, ShieldPlus, Search,
  Users, Shield, User, Edit2, Check, X
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Add User Modal ────────────────────────────────────────────────────────
const AddUserModal = ({ open, onClose, availableUsers, onAdd, isPending }) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() =>
    availableUsers.filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    ), [availableUsers, search]
  );

  const handleAdd = () => {
    if (!selected) return;
    onAdd(selected.id);
    setSelected(null);
    setSearch('');
  };

  const handleClose = () => {
    setSelected(null);
    setSearch('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" /> Add User to Group
          </DialogTitle>
          <DialogDescription>
            Select a user to add. Only users not already in this group are shown.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search by name or email..."
              className="pl-8"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          {/* User List */}
          <div className="border rounded-md divide-y overflow-y-auto max-h-64">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-neutral-500">
                {availableUsers.length === 0
                  ? 'All users are already members of this group.'
                  : 'No users match your search.'}
              </div>
            ) : (
              filtered.map(u => (
                <button
                  key={u.id}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    selected?.id === u.id
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-900'
                  }`}
                  onClick={() => setSelected(u)}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-neutral-900 dark:text-neutral-100 truncate">{u.name}</p>
                    <p className="text-xs text-neutral-500 truncate">{u.email}</p>
                  </div>
                  {selected?.id === u.id && (
                    <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleAdd}
            disabled={!selected || isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
            Add User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Attach Policy Modal ───────────────────────────────────────────────────
const AttachPolicyModal = ({ open, onClose, availablePolicies, onAttach, isPending }) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() =>
    availablePolicies.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase())
    ), [availablePolicies, search]
  );

  const handleAttach = () => {
    if (!selected) return;
    onAttach(selected.id);
    setSelected(null);
    setSearch('');
  };

  const handleClose = () => {
    setSelected(null);
    setSearch('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldPlus className="w-5 h-5 text-blue-600" /> Attach Policy to Group
          </DialogTitle>
          <DialogDescription>
            Only MANAGED policies not already attached are shown.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search policies..."
              className="pl-8"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="border rounded-md divide-y overflow-y-auto max-h-64">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-neutral-500">
                {availablePolicies.length === 0
                  ? 'All available MANAGED policies are already attached.'
                  : 'No policies match your search.'}
              </div>
            ) : (
              filtered.map(p => (
                <button
                  key={p.id}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    selected?.id === p.id
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-900'
                  }`}
                  onClick={() => setSelected(p)}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-neutral-900 dark:text-neutral-100 truncate">{p.name}</p>
                    {p.description && (
                      <p className="text-xs text-neutral-500 truncate">{p.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-[10px] h-4 px-1">{p.type}</Badge>
                    {selected?.id === p.id && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleAttach}
            disabled={!selected || isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldPlus className="w-4 h-4 mr-2" />}
            Attach Policy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────
const GroupDetail = () => {
  "use no memo"; // opt out of React Compiler — group can be undefined during loading
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [addUserOpen, setAddUserOpen] = useState(false);
  const [attachPolicyOpen, setAttachPolicyOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Queries
  const { data: group, isLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: async () => {
      const res = await getGroup(id);
      return res.data.data;
    }
  });

  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await listUsers();
      return res.data.data;
    }
  });

  const { data: allPolicies } = useQuery({
    queryKey: ['policies'],
    queryFn: async () => {
      const res = await listPolicies();
      return res.data.data;
    }
  });

  // Computed available lists — explicit null guards needed for React Compiler compatibility
  const groupMembers = useMemo(() => {
    if (!group || !group.memberships) return [];
    return group.memberships.map(m => m.user);
  }, [group]);

  const groupPolicies = useMemo(() => {
    if (!group || !group.policyAttachments) return [];
    return group.policyAttachments.map(pa => pa.policy);
  }, [group]);

  const availableUsers = useMemo(() => {
    if (!allUsers) return [];
    return allUsers.filter(u => !groupMembers.some(m => m.id === u.id));
  }, [allUsers, groupMembers]);

  const availablePolicies = useMemo(() => {
    if (!allPolicies) return [];
    return allPolicies.filter(p => p.type === 'MANAGED' && !groupPolicies.some(gp => gp.id === p.id));
  }, [allPolicies, groupPolicies]);

  // Mutations
  const addMemberMutation = useMutation({
    mutationFn: (userId) => addGroupMember(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User added to group');
      setAddUserOpen(false);
    },
    onError: (err) => {
      if (err.response?.status === 409) {
        toast.error('User is already a member of this group');
      } else if (err.response?.status === 404) {
        toast.error('User or group not found');
      } else {
        toast.error(err.response?.data?.message || 'Failed to add member');
      }
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => removeGroupMember(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User removed from group');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove member')
  });

  const attachPolicyMutation = useMutation({
    mutationFn: (policyId) => attachGroupPolicy(id, policyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      toast.success('Policy attached to group');
      setAttachPolicyOpen(false);
    },
    onError: (err) => {
      if (err.response?.status === 403) {
        toast.error('Access Denied: Delegation bypass prevented — you cannot attach a policy containing permissions you do not possess.');
      } else if (err.response?.status === 409) {
        toast.error('Policy is already attached to this group');
      } else {
        toast.error(err.response?.data?.message || 'Failed to attach policy');
      }
    }
  });

  const detachPolicyMutation = useMutation({
    mutationFn: (policyId) => detachGroupPolicy(id, policyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      toast.success('Policy detached from group');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to detach policy')
  });

  const updateGroupMutation = useMutation({
    mutationFn: (data) => updateGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Group updated');
      setIsEditingName(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update group')
  });

  const deleteGroupMutation = useMutation({
    mutationFn: () => deleteGroup(id),
    onSuccess: () => {
      toast.success('Group deleted');
      navigate('/iam/groups');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete group')
  });

  const handleStartEdit = () => {
    setEditName(group.name);
    setEditDesc(group.description || '');
    setIsEditingName(true);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) return;
    updateGroupMutation.mutate({ name: editName.trim(), description: editDesc });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }
  if (!group) {
    return <div className="p-8 text-center text-neutral-500">Group not found</div>;
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/iam/groups')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            {isEditingName ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="text-xl font-bold h-9 w-64"
                    placeholder="Group name"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={updateGroupMutation.isPending || !editName.trim()}
                    className="bg-blue-600 hover:bg-blue-700 h-9"
                  >
                    {updateGroupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingName(false)} className="h-9">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <Input
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  className="text-sm h-8 w-64"
                  placeholder="Description (optional)"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">{group.name}</h2>
                  <p className="text-neutral-500 text-sm mt-0.5">{group.description || 'No description'}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStartEdit}
                  className="h-8 px-2 text-neutral-400 hover:text-neutral-700"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Stats + Delete */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-sm text-neutral-500">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">{groupMembers.length}</span> members
            </span>
            <span className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">{groupPolicies.length}</span> policies
            </span>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
                deleteGroupMutation.mutate();
              }
            }}
            disabled={deleteGroupMutation.isPending}
          >
            {deleteGroupMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Delete Group
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4 text-neutral-500" /> Members
                <Badge variant="secondary" className="text-xs">{groupMembers.length}</Badge>
              </CardTitle>
              <CardDescription>Users assigned to this group who inherit its policies</CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setAddUserOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
            >
              <UserPlus className="w-4 h-4 mr-1" /> Add User
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="border rounded-md divide-y">
              {groupMembers.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500 font-medium">No members yet</p>
                  <p className="text-xs text-neutral-400 mt-1">Add users to grant them this group's policies</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => setAddUserOpen(true)}
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Add first member
                  </Button>
                </div>
              ) : (
                groupMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-900 group">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                        <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-neutral-900 dark:text-neutral-100">{member.name}</p>
                        <p className="text-xs text-neutral-500">{member.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMemberMutation.mutate(member.id)}
                      disabled={removeMemberMutation.isPending}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 h-7 px-2 text-xs"
                    >
                      Remove
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Policies Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-neutral-500" /> Attached Policies
                <Badge variant="secondary" className="text-xs">{groupPolicies.length}</Badge>
              </CardTitle>
              <CardDescription>Permissions granted to all members of this group</CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setAttachPolicyOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
            >
              <ShieldPlus className="w-4 h-4 mr-1" /> Attach Policy
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="border rounded-md divide-y">
              {groupPolicies.length === 0 ? (
                <div className="p-8 text-center">
                  <Shield className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500 font-medium">No policies attached</p>
                  <p className="text-xs text-neutral-400 mt-1">Attach a managed policy to grant permissions</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => setAttachPolicyOpen(true)}
                  >
                    <ShieldPlus className="w-3.5 h-3.5 mr-1.5" /> Attach first policy
                  </Button>
                </div>
              ) : (
                groupPolicies.map(policy => (
                  <div key={policy.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-900 group">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-neutral-900 dark:text-neutral-100">{policy.name}</p>
                        <Badge
                          className="mt-0.5 bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] h-4 px-1"
                        >
                          {policy.type}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => detachPolicyMutation.mutate(policy.id)}
                      disabled={detachPolicyMutation.isPending}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 h-7 px-2 text-xs"
                    >
                      Detach
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <AddUserModal
        open={addUserOpen}
        onClose={() => setAddUserOpen(false)}
        availableUsers={availableUsers}
        onAdd={(userId) => addMemberMutation.mutate(userId)}
        isPending={addMemberMutation.isPending}
      />

      <AttachPolicyModal
        open={attachPolicyOpen}
        onClose={() => setAttachPolicyOpen(false)}
        availablePolicies={availablePolicies}
        onAttach={(policyId) => attachPolicyMutation.mutate(policyId)}
        isPending={attachPolicyMutation.isPending}
      />
    </div>
  );
};

export default GroupDetail;
