import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGroup, listUsers, listPolicies, addGroupMember, removeGroupMember, attachGroupPolicy, detachGroupPolicy, deleteGroup } from '@/api/client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Trash2, UserPlus, ShieldPlus } from 'lucide-react';
import { toast } from 'sonner';

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPolicyId, setSelectedPolicyId] = useState('');

  // Fetch group details
  const { data: group, isLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: async () => {
      const res = await getGroup(id);
      return res.data.data;
    }
  });

  // Fetch all users for dropdown
  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await listUsers();
      return res.data.data;
    }
  });

  // Fetch all policies for dropdown
  const { data: allPolicies } = useQuery({
    queryKey: ['policies'],
    queryFn: async () => {
      const res = await listPolicies();
      return res.data.data;
    }
  });

  // Mutations
  const addMemberMutation = useMutation({
    mutationFn: async (userId) => addGroupMember(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      toast.success('User added to group');
      setSelectedUserId('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add member')
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId) => removeGroupMember(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      toast.success('User removed from group');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove member')
  });

  const attachPolicyMutation = useMutation({
    mutationFn: async (policyId) => attachGroupPolicy(id, policyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      toast.success('Policy attached to group');
      setSelectedPolicyId('');
    },
    onError: (err) => {
      if (err.response?.status === 403) {
        toast.error('Access Denied. Delegation bypass prevented: You cannot attach a policy containing permissions you do not possess.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to attach policy');
      }
    }
  });

  const detachPolicyMutation = useMutation({
    mutationFn: async (policyId) => detachGroupPolicy(id, policyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      toast.success('Policy detached from group');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to detach policy')
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async () => deleteGroup(id),
    onSuccess: () => {
      toast.success('Group deleted');
      navigate('/iam/groups');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete group')
  });

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!group) return <div className="p-8">Group not found</div>;

  // Filter out users already in the group
  const availableUsers = allUsers?.filter(u => !group.members?.some(m => m.id === u.id)) || [];
  // Filter out policies already attached
  const availablePolicies = allPolicies?.filter(p => p.type === 'MANAGED' && !group.policies?.some(gp => gp.id === p.id)) || [];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate('/iam/groups')} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{group.name}</h2>
            <p className="text-neutral-500">{group.description || 'No description'}</p>
          </div>
        </div>
        <Button 
          variant="destructive" 
          onClick={() => {
            if(window.confirm('Are you sure you want to delete this group?')) {
              deleteGroupMutation.mutate();
            }
          }}
          disabled={deleteGroupMutation.isPending}
        >
          <Trash2 className="w-4 h-4 mr-2" /> Delete Group
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Members Section */}
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>Users assigned to this group</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <select 
                className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">Select user to add...</option>
                {availableUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
              <Button 
                onClick={() => addMemberMutation.mutate(selectedUserId)}
                disabled={!selectedUserId || addMemberMutation.isPending}
              >
                <UserPlus className="w-4 h-4 mr-2" /> Add
              </Button>
            </div>

            <div className="border rounded-md divide-y">
              {group.members.length === 0 ? (
                <div className="p-4 text-center text-sm text-neutral-500">No members</div>
              ) : (
                group.members.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-neutral-500">{member.email}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeMemberMutation.mutate(member.id)}
                      disabled={removeMemberMutation.isPending}
                      className="text-red-500 hover:text-red-700 h-8 px-2"
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
          <CardHeader>
            <CardTitle>Attached Policies</CardTitle>
            <CardDescription>Permissions granted to members of this group</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <select 
                className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
                value={selectedPolicyId}
                onChange={(e) => setSelectedPolicyId(e.target.value)}
              >
                <option value="">Select MANAGED policy to attach...</option>
                {availablePolicies.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <Button 
                onClick={() => attachPolicyMutation.mutate(selectedPolicyId)}
                disabled={!selectedPolicyId || attachPolicyMutation.isPending}
              >
                <ShieldPlus className="w-4 h-4 mr-2" /> Attach
              </Button>
            </div>

            <div className="border rounded-md divide-y">
              {group.policies.length === 0 ? (
                <div className="p-4 text-center text-sm text-neutral-500">No policies attached</div>
              ) : (
                group.policies.map(policy => (
                  <div key={policy.id} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{policy.name}</p>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1">{policy.type}</Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => detachPolicyMutation.mutate(policy.id)}
                      disabled={detachPolicyMutation.isPending}
                      className="text-red-500 hover:text-red-700 h-8 px-2"
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
    </div>
  );
};

export default GroupDetail;
