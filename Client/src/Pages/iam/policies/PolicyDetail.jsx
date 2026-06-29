import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPolicy, deletePolicy } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Loader2, Edit, Trash2, Shield, CheckCircle, XCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';

const PolicyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: policy, isLoading } = useQuery({
    queryKey: ['policy', id],
    queryFn: async () => {
      const res = await getPolicy(id);
      return res.data.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePolicy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      toast.success('Policy deleted successfully');
      navigate('/iam/policies');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete policy');
    }
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <Shield className="w-16 h-16 text-neutral-300 mb-4" />
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Policy not found</h2>
        <p className="text-neutral-500 mt-2">This policy may have been deleted.</p>
        <Button className="mt-4" onClick={() => navigate('/iam/policies')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Policies
        </Button>
      </div>
    );
  }

  const statements = Array.isArray(policy.statements) ? policy.statements : [];

  const getEffectBadge = (effect) => {
    const effectStr = (effect || '').toString().toUpperCase();
    if (effectStr === 'ALLOW' || effectStr === 'Allow') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
          <CheckCircle className="w-3 h-3" /> ALLOW
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
        <XCircle className="w-3 h-3" /> DENY
      </span>
    );
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/iam/policies')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight">{policy.name}</h2>
              <Badge
                className={
                  policy.type === 'MANAGED'
                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'bg-neutral-100 text-neutral-700'
                }
              >
                {policy.type}
              </Badge>
            </div>
            {policy.description && (
              <p className="text-neutral-500 mt-1">{policy.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/iam/policies/${id}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" /> Edit Policy
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the "{policy.name}" policy. This action cannot be undone.
                  {policy.type === 'MANAGED' && (
                    <span className="block mt-2 font-medium text-red-600 dark:text-red-400">
                      Note: MANAGED policies cannot be deleted if they are currently attached to any users or groups.
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Policy
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Policy Metadata Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Policy Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Type</dt>
              <dd>
                <Badge
                  className={
                    policy.type === 'MANAGED'
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                      : 'bg-neutral-100 text-neutral-700'
                  }
                >
                  {policy.type}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Statements</dt>
              <dd className="font-semibold text-neutral-900 dark:text-neutral-100">{statements.length}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Created</dt>
              <dd className="text-neutral-600 dark:text-neutral-300">
                {new Date(policy.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Last Modified</dt>
              <dd className="text-neutral-600 dark:text-neutral-300">
                {new Date(policy.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Statements */}
      <div>
        <h3 className="text-xl font-bold mb-4">Policy Document</h3>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Visual Statements */}
          <div className="space-y-4">
            {statements.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <Lock className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500 text-sm">No statements defined in this policy.</p>
                </CardContent>
              </Card>
            ) : (
              statements.map((stmt, idx) => {
                const effect = stmt.Effect || stmt.effect || 'Allow';
                const actions = stmt.Action || stmt.actions || [];
                const resources = stmt.Resource || stmt.resource || ['*'];
                return (
                  <Card
                    key={idx}
                    className={`border-l-4 ${
                      (effect.toUpperCase() === 'ALLOW' || effect === 'Allow')
                        ? 'border-l-green-500'
                        : 'border-l-red-500'
                    }`}
                  >
                    <CardHeader className="py-3 px-4 bg-neutral-50 dark:bg-neutral-900 border-b flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-sm font-medium">Statement {idx + 1}</CardTitle>
                      {getEffectBadge(effect)}
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Actions</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(Array.isArray(actions) ? actions : [actions]).map((action, i) => (
                            <span
                              key={i}
                              className="inline-block px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-mono"
                            >
                              {action}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Resource</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(Array.isArray(resources) ? resources : [resources]).map((r, i) => (
                            <span
                              key={i}
                              className="inline-block px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-mono"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Raw JSON */}
          <Card className="sticky top-24 h-fit">
            <CardHeader className="py-3 px-4 bg-neutral-50 dark:bg-neutral-900 border-b">
              <CardTitle className="text-sm font-medium">Policy JSON</CardTitle>
              <CardDescription className="text-xs">Raw policy document</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <pre className="h-full p-4 overflow-auto text-xs font-mono bg-[#1E1E1E] text-[#D4D4D4] m-0 rounded-b-md max-h-[60vh]">
                {JSON.stringify(
                  {
                    Version: '2012-10-17',
                    Statement: statements.map(s => ({
                      Effect: s.Effect || s.effect || 'Allow',
                      Action: s.Action || s.actions || [],
                      Resource: s.Resource || s.resource || ['*'],
                    })),
                  },
                  null,
                  2
                )}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PolicyDetail;
