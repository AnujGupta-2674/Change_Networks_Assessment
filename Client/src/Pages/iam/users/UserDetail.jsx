import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUser, listPolicies, attachUserPolicy, detachUserPolicy, setUserBoundary, deleteUserBoundary } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import { ArrowLeft, Loader2, ShieldPlus, Search, Shield, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import EffectivePermissionsSummary from '@/components/EffectivePermissionsSummary';

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
            <ShieldPlus className="w-5 h-5 text-blue-600" /> Attach Policy to User
          </DialogTitle>
          <DialogDescription>
            Only MANAGED policies not already attached to this user are shown.
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
const UserDetail = () => {
  "use no memo"; // opt out of React Compiler — userProfile can be undefined during loading
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [attachPolicyOpen, setAttachPolicyOpen] = useState(false);
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

  // Computed lists
  const directPolicies = userProfile?.policyAttachments?.map(pa => pa.policy) || userProfile?.policies || [];
  const availablePolicies = useMemo(() =>
    (allPolicies || []).filter(p =>
      p.type === 'MANAGED' && !directPolicies.some(dp => dp.id === p.id)
    ), [allPolicies, directPolicies]
  );
  const allManagedPolicies = useMemo(() =>
    (allPolicies || []).filter(p => p.type === 'MANAGED'),
    [allPolicies]
  );

  // Normalize userProfile for EffectivePermissionsSummary
  // API returns: policyAttachments[].policy and memberships[].group.policyAttachments[].policy
  // Component expects: directPolicies[].policy.statements and groups[].group.policies[].policy.statements
  const normalizedProfile = useMemo(() => {
    if (!userProfile) return null;
    return {
      ...userProfile,
      // Map policyAttachments to directPolicies shape
      directPolicies: (userProfile.policyAttachments || []).map(pa => ({ policy: pa.policy })),
      // Map memberships to groups shape
      groups: (userProfile.memberships || []).map(m => ({
        group: {
          ...m.group,
          policies: (m.group.policyAttachments || []).map(pa => ({ policy: pa.policy })),
        }
      })),
    };
  }, [userProfile]);

  // Mutations
  const attachPolicyMutation = useMutation({
    mutationFn: (policyId) => attachUserPolicy(id, policyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      toast.success('Policy attached to user');
      setAttachPolicyOpen(false);
    },
    onError: (err) => {
      if (err.response?.status === 403) {
        toast.error('Access Denied: Delegation bypass prevented — you cannot attach a policy containing permissions you do not possess.');
      } else if (err.response?.status === 409) {
        toast.error('Policy is already attached to this user');
      } else {
        toast.error(err.response?.data?.message || 'Failed to attach policy');
      }
    }
  });

  const detachPolicyMutation = useMutation({
    mutationFn: (policyId) => detachUserPolicy(id, policyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      toast.success('Policy detached from user');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to detach policy')
  });

  const setBoundaryMutation = useMutation({
    mutationFn: (policyId) => setUserBoundary(id, policyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      toast.success('Boundary set successfully');
      setSelectedBoundaryId('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to set boundary')
  });

  const removeBoundaryMutation = useMutation({
    mutationFn: () => deleteUserBoundary(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      toast.success('Boundary removed');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove boundary')
  });

  if (isUserLoading) return (
    <div className="p-8 flex justify-center">
      <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
    </div>
  );
  if (!userProfile) return <div className="p-8">User not found</div>;

  // Normalize the user profile shape — API returns either policyAttachments[] or policies[]
  const policyList = userProfile.policyAttachments?.map(pa => pa.policy) || userProfile.policies || [];
  const memberships = userProfile.memberships || [];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/iam/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight">{userProfile.name}</h2>
              {userProfile.isRoot && (
                <Badge variant="destructive" className="h-6">ROOT USER</Badge>
              )}
            </div>
            <p className="text-neutral-500 mt-0.5">{userProfile.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Section 1: Identity Policies */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Identity Policies (Direct)
                  <Badge variant="secondary" className="text-xs">{policyList.length}</Badge>
                </CardTitle>
                <CardDescription>Policies attached directly to this user.</CardDescription>
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
                {policyList.length === 0 ? (
                  <div className="p-8 text-center">
                    <Shield className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                    <p className="text-sm text-neutral-500 font-medium">No direct policies attached</p>
                    <p className="text-xs text-neutral-400 mt-1">Policies can also be inherited via group membership</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => setAttachPolicyOpen(true)}
                    >
                      <ShieldPlus className="w-3.5 h-3.5 mr-1.5" /> Attach a policy
                    </Button>
                  </div>
                ) : (
                  policyList.map(policy => (
                    <div key={policy.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-900 group">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                          <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{policy.name}</p>
                          <Badge variant="secondary" className="text-[10px] h-4 px-1 mt-0.5">{policy.type}</Badge>
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

          {/* Section 2: Group Memberships */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Group Memberships
                <Badge variant="secondary" className="text-xs">{memberships.length}</Badge>
              </CardTitle>
              <CardDescription>Groups this user belongs to and inherited policies.</CardDescription>
            </CardHeader>
            <CardContent>
              {memberships.length === 0 ? (
                <div className="border rounded-md p-6 text-center text-sm text-neutral-500">
                  User belongs to no groups
                </div>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {memberships.map((membership) => {
                    const grp = membership.group;
                    const grpPolicies = grp.policyAttachments?.map(pa => pa.policy) || grp.policies || [];
                    return (
                      <AccordionItem key={grp.id} value={grp.id}>
                        <AccordionTrigger className="text-sm font-medium hover:no-underline">
                          {grp.name}
                          <span className="text-neutral-400 font-normal ml-2 text-xs">
                            ({grpPolicies.length} {grpPolicies.length === 1 ? 'policy' : 'policies'})
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pl-4 border-l-2 border-neutral-100 dark:border-neutral-800 ml-2 mt-2">
                            {grpPolicies.length === 0 ? (
                              <span className="text-xs text-neutral-500">No policies attached to this group.</span>
                            ) : (
                              grpPolicies.map(gp => (
                                <div key={gp.id} className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                  <Shield className="w-3 h-3" /> {gp.name}
                                </div>
                              ))
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </CardContent>
          </Card>

          {/* Boundary Section (Root Only) */}
          {currentUser?.isRoot && (
            <Card className="border-amber-200 dark:border-amber-900/50">
              <CardHeader className="bg-amber-50 dark:bg-amber-950/20 rounded-t-lg border-b border-amber-100 dark:border-amber-900/50">
                <CardTitle className="text-amber-800 dark:text-amber-500">Permission Boundary</CardTitle>
                <CardDescription>Sets a hard ceiling on the user's maximum permissions. Only root can manage boundaries.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <select 
                    className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 dark:border-neutral-800 dark:bg-neutral-950"
                    value={selectedBoundaryId}
                    onChange={(e) => setSelectedBoundaryId(e.target.value)}
                  >
                    <option value="">Select MANAGED policy as boundary...</option>
                    {allManagedPolicies.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <Button 
                    onClick={() => setBoundaryMutation.mutate(selectedBoundaryId)}
                    disabled={!selectedBoundaryId || setBoundaryMutation.isPending}
                    variant="outline"
                    className="border-amber-600 text-amber-600 hover:bg-amber-50 flex-shrink-0"
                  >
                    {setBoundaryMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
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
                      {removeBoundaryMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : 'Remove'}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center p-4 text-sm text-neutral-500 border border-dashed rounded-md">
                    No boundary set — user has no maximum permission ceiling
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Section 3: Effective Permissions Summary */}
        <div className="space-y-6">
          <EffectivePermissionsSummary userProfile={normalizedProfile} />
        </div>
      </div>

      {/* Attach Policy Modal */}
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

export default UserDetail;
