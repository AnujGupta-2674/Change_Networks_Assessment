import React, { useMemo, useState } from 'react';
import { VALID_ACTIONS, ACTIONS_BY_NAMESPACE } from '../constants/actions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Server, CheckCircle, XCircle } from 'lucide-react';
import { getEffectivePermissions as getBackendPermissions } from '@/api/client';
import { toast } from 'sonner';

function computeEffectivePermissions(user) {
  const allowed = new Set();
  const denied = new Set();
  const boundaryAllowed = new Set();

  const evaluateStatements = (statements, targetSet) => {
    statements.forEach(stmt => {
      const effect = stmt.Effect || stmt.effect;
      const actions = stmt.Action || stmt.actions;
      
      actions.forEach(action => {
        if (effect === 'Allow' || effect === 'ALLOW') targetSet.add(action);
        if (effect === 'Deny' || effect === 'DENY') denied.add(action);
      });
    });
  };

  if (user.boundary) {
    evaluateStatements(user.boundary.policy.statements, boundaryAllowed);
  } else {
    VALID_ACTIONS.forEach(a => boundaryAllowed.add(a));
  }

  // Root users bypass everything and have ALLOW on all
  if (user.isRoot) {
    const effective = {};
    VALID_ACTIONS.forEach(a => effective[a] = 'ALLOW');
    return effective;
  }

  user.directPolicies.forEach(p => evaluateStatements(p.policy.statements, allowed));
  user.groups.forEach(g => {
    g.group.policies.forEach(p => evaluateStatements(p.policy.statements, allowed));
  });

  const effective = {};
  VALID_ACTIONS.forEach(action => {
    if (denied.has(action)) effective[action] = 'EXPLICIT_DENY';
    else if (!boundaryAllowed.has(action)) effective[action] = 'BOUNDARY_DENY';
    else if (allowed.has(action)) effective[action] = 'ALLOW';
    else effective[action] = 'IMPLICIT_DENY';
  });

  return effective;
}

const EffectivePermissionsSummary = ({ userProfile }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null); // 'success', 'mismatch', 'error'

  const effectivePermissions = useMemo(() => {
    if (!userProfile) return null;
    return computeEffectivePermissions(userProfile);
  }, [userProfile]);

  const verifyWithBackend = async () => {
    setIsVerifying(true);
    setVerificationStatus(null);
    try {
      const res = await getBackendPermissions(userProfile.id);
      const backendPermissions = res.data.data;
      
      // Compare frontend vs backend
      let mismatch = false;
      for (const action of VALID_ACTIONS) {
        if (effectivePermissions[action] !== backendPermissions[action]) {
          mismatch = true;
          console.error(`Mismatch for ${action}: Frontend=${effectivePermissions[action]}, Backend=${backendPermissions[action]}`);
        }
      }

      if (mismatch) {
        setVerificationStatus('mismatch');
        toast.error('Verification failed: Frontend engine does not match Backend engine!');
      } else {
        setVerificationStatus('success');
        toast.success('Verification passed: Frontend engine perfectly matches Backend engine!');
      }
    } catch (err) {
      setVerificationStatus('error');
      toast.error(err.response?.data?.message || 'Failed to verify with backend');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!effectivePermissions) return null;

  const getResultBadge = (result) => {
    switch (result) {
      case 'ALLOW':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">ALLOW</span>;
      case 'EXPLICIT_DENY':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">EXPLICIT DENY</span>;
      case 'BOUNDARY_DENY':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">BOUNDARY DENY</span>;
      case 'IMPLICIT_DENY':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">IMPLICIT DENY</span>;
      default:
        return null;
    }
  };

  return (
    <Card className="shadow-md border-blue-100 dark:border-blue-900/30">
      <CardHeader className="bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/30 flex flex-row items-center justify-between">
        <CardTitle className="text-blue-900 dark:text-blue-400">Effective Permissions</CardTitle>
        {/* <div className="flex items-center gap-3">
          {verificationStatus === 'success' && <span className="flex items-center text-xs text-green-600 font-medium"><CheckCircle className="w-4 h-4 mr-1"/> Matches Backend</span>}
          {verificationStatus === 'mismatch' && <span className="flex items-center text-xs text-red-600 font-medium"><XCircle className="w-4 h-4 mr-1"/> Mismatch!</span>}
          <Button variant="outline" size="sm" onClick={verifyWithBackend} disabled={isVerifying}>
            {isVerifying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Server className="w-4 h-4 mr-2" />}
            Verify with Backend
          </Button>
        </div> */}
      </CardHeader>
      <CardContent className="p-0">
        {Object.entries(ACTIONS_BY_NAMESPACE).map(([namespace, actions]) => (
          <div key={namespace} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
            <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-900 font-medium text-sm capitalize">
              {namespace}
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {actions.map(action => (
                <div key={action} className="px-4 py-2 flex items-center justify-between hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50">
                  <div className="text-sm font-mono text-neutral-600 dark:text-neutral-300">
                    {action}
                  </div>
                  <div>
                    {getResultBadge(effectivePermissions[action])}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default EffectivePermissionsSummary;
