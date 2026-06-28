import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUser, listPolicies, attachUserPolicy, detachUserPolicy, setUserBoundary, deleteUserBoundary } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, ShieldPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import EffectivePermissionsSummary from '@/components/EffectivePermissionsSummary';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPolicyId, setSelectedPolicyId] = useState('');
  const [selectedBoundaryId, setSelectedBoundaryId] = useState('');

  // Fetch user details
  const { data: userProfile, isLoading: isUserLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const res = await getUser(id);
      return res.data.data;
    }
  });

  // Fetch all policies for dropdowns
  const { data: allPolicies } = useQuery({
    queryKey: ['policies'],
    queryFn: async () => {
      const res = await listPolicies();
      return res.data.data;
    }
  });

  // Mutations
  const attachPolicyMutation = useMutation({
    mutationFn: async (policyId) => attachUserPolicy(id, policyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      toast.success('Policy attached to user');
      setSelectedPolicyId('');
    },
    onError: (err) => {
      if (err.response?.status === 403) {
        toast.error('Access Denied. Delegation bypass prevented.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to attach policy');
      }
    }
  });

  const detachPolicyMutation = useMutation({
    mutationFn: async (policyId) => detachUserPolicy(id, policyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      toast.success('Policy detached from user');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to detach policy')
  });

  const setBoundaryMutation = useMutation({
    mutationFn: async (policyId) => setUserBoundary(id, policyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      toast.success('Boundary set successfully');
      setSelectedBoundaryId('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to set boundary')
  });

  const removeBoundaryMutation = useMutation({
    mutationFn: async () => deleteUserBoundary(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      toast.success('Boundary removed');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove boundary')
  });

  if (isUserLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-600 w-8 h-8" /></div>;
  if (!userProfile) return <div className="p-8">User not found</div>;

  const availablePolicies = allPolicies?.filter(p => p.type === 'MANAGED' && !userProfile.policies?.some(up => up.id === p.id)) || [];
  const allManagedPolicies = allPolicies?.filter(p => p.type === 'MANAGED') || [];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate('/iam/users')} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{userProfile.name}</h2>
            <p className="text-neutral-500">{userProfile.email}</p>
          </div>
        </div>
        {userProfile.isRoot && (
          <Badge variant="destructive" className="h-6">ROOT USER</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Section 1: Identity Policies */}
          <Card>
            <CardHeader>
              <CardTitle>Identity Policies (Direct)</CardTitle>
              <CardDescription>Policies attached directly to this user.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <select 
                  className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 dark:border-neutral-800 dark:bg-neutral-950"
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
                {!userProfile.policies?.length ? (
                  <div className="p-4 text-center text-sm text-neutral-500">No direct policies attached</div>
                ) : (
                  userProfile.policies.map(policy => (
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

          {/* Section 2: Group Memberships */}
          <Card>
            <CardHeader>
              <CardTitle>Group Memberships</CardTitle>
              <CardDescription>Groups this user belongs to and inherited policies.</CardDescription>
            </CardHeader>
            <CardContent>
              {!userProfile.memberships?.length ? (
                <div className="border rounded-md p-4 text-center text-sm text-neutral-500">
                  User belongs to no groups
                </div>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {userProfile.memberships.map((membership) => (
                    <AccordionItem key={membership.group.id} value={membership.group.id}>
                      <AccordionTrigger className="text-sm font-medium hover:no-underline">
                        {membership.group.name} 
                        <span className="text-neutral-400 font-normal ml-2 text-xs">
                          ({membership.group.policies?.length || 0} policies)
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pl-4 border-l-2 border-neutral-100 dark:border-neutral-800 ml-2 mt-2">
                          {!membership.group.policies?.length ? (
                            <span className="text-xs text-neutral-500">No policies attached to this group.</span>
                          ) : (
                            membership.group.policies.map(gp => (
                              <div key={gp.policy.id} className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                <ShieldPlus className="w-3 h-3" /> {gp.policy.name}
                              </div>
                            ))
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>

          {/* Boundary Section (Root Only) */}
          {currentUser?.isRoot && (
            <Card className="border-amber-200 dark:border-amber-900/50">
              <CardHeader className="bg-amber-50 dark:bg-amber-950/20 rounded-t-lg border-b border-amber-100 dark:border-amber-900/50">
                <CardTitle className="text-amber-800 dark:text-amber-500">Permission Boundary</CardTitle>
                <CardDescription>Sets a hard ceiling on the user's maximum permissions.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <select 
                    className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 dark:border-neutral-800 dark:bg-neutral-950"
                    value={selectedBoundaryId}
                    onChange={(e) => setSelectedBoundaryId(e.target.value)}
                  >
                    <option value="">Select MANAGED policy...</option>
                    {allManagedPolicies.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <Button 
                    onClick={() => setBoundaryMutation.mutate(selectedBoundaryId)}
                    disabled={!selectedBoundaryId || setBoundaryMutation.isPending}
                    variant="outline"
                    className="border-amber-600 text-amber-600 hover:bg-amber-50"
                  >
                    Set Boundary
                  </Button>
                </div>
                
                {userProfile.boundary ? (
                  <div className="bg-white dark:bg-neutral-950 border border-amber-200 dark:border-amber-900 rounded-md p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm text-amber-800 dark:text-amber-500">Current Boundary</p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 font-mono mt-1">
                        {userProfile.boundary.policy.name}
                      </p>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => removeBoundaryMutation.mutate()}
                      disabled={removeBoundaryMutation.isPending}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="text-center p-4 text-sm text-neutral-500 border border-dashed rounded-md">
                    No boundary set
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Section 3: Effective Permissions Summary */}
        <div className="space-y-6">
          <EffectivePermissionsSummary userProfile={userProfile} />
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
