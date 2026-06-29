import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPolicy, createPolicy, updatePolicy } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import PolicyStatementBuilder from '@/components/PolicyStatementBuilder';

const PolicyForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [statements, setStatements] = useState([
    { effect: 'ALLOW', actions: [], resource: '*' }
  ]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      type: 'MANAGED'
    }
  });

  // Fetch policy if editing
  const { isLoading: isFetching } = useQuery({
    queryKey: ['policy', id],
    queryFn: async () => {
      const res = await getPolicy(id);
      const p = res.data.data;
      reset({
        name: p.name,
        description: p.description || '',
        type: p.type
      });
      // The backend returns statements with Effect/Action/Resource
      // Map it back to the frontend shape if needed, or if backend uses lowercase:
      const mappedStatements = p.statements.map(stmt => ({
        effect: stmt.Effect?.toUpperCase() || stmt.effect?.toUpperCase() || 'ALLOW',
        actions: stmt.Action || stmt.actions || [],
        resource: '*'
      }));
      setStatements(mappedStatements);
      return p;
    },
    enabled: isEditing
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      // Map statements back to the backend shape if required
      const payloadStatements = statements.map(stmt => ({
        Effect: stmt.effect === 'ALLOW' ? 'Allow' : 'Deny',
        Action: stmt.actions,
        Resource: ['*']
      }));
      
      const payload = {
        ...data,
        statements: payloadStatements
      };

      if (isEditing) {
        return updatePolicy(id, payload);
      } else {
        return createPolicy(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      toast.success(isEditing ? 'Policy updated successfully' : 'Policy created successfully');
      navigate('/iam/policies');
    },
    onError: (error) => {
      if (error.response?.status === 403) {
        toast.error('Access Denied. Delegation bypass prevented: You cannot grant permissions you do not possess.');
      } else {
        toast.error(error.response?.data?.message || 'An error occurred');
      }
    }
  });

  const onSubmit = (data) => {
    // Validate statements
    if (statements.length === 0) {
      toast.error('Policy must have at least one statement');
      return;
    }
    
    for (let i = 0; i < statements.length; i++) {
      if (statements[i].actions.length === 0) {
        toast.error(`Statement ${i+1} must have at least one action selected`);
        return;
      }
    }

    mutation.mutate(data);
  };

  if (isFetching) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 bg-slate-50 dark:bg-neutral-900 min-h-screen">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate('/iam/policies')} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">{isEditing ? 'Edit Policy' : 'Create Policy'}</h2>
      </div>

      <div className="space-y-6">
        <form id="policy-form" onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Policy Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-2xl">
              <div className="space-y-2">
                <Label>Policy Name</Label>
                <Input 
                  {...register('name', { required: 'Name is required' })} 
                  placeholder="e.g. FinanceReportsAccess"
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Input 
                  {...register('description')} 
                  placeholder="Brief description of this policy"
                />
              </div>
              {!isEditing && (
                <div className="space-y-2">
                  <Label>Policy Type</Label>
                  <select
                    {...register('type')}
                    className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 dark:border-neutral-800 dark:bg-neutral-950"
                  >
                    <option value="MANAGED">MANAGED — Reusable, can be attached to users and groups</option>
                    <option value="INLINE">INLINE — Single-use, embedded in a specific resource</option>
                  </select>
                  <p className="text-xs text-neutral-500">
                    Managed policies are recommended for most use cases.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </form>

        <div>
          <h3 className="text-xl font-bold mb-4">Policy Statements</h3>
          <PolicyStatementBuilder 
            initialStatements={statements} 
            onChange={setStatements} 
          />
        </div>

        <Button 
          type="submit" 
          form="policy-form"
          disabled={mutation.isPending} 
          className="w-full max-w-2xl bg-blue-600 hover:bg-blue-700 h-12 text-lg"
        >
          {mutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
          {isEditing ? 'Save Changes' : 'Create Policy'}
        </Button>
      </div>
    </div>
  );
};

export default PolicyForm;
