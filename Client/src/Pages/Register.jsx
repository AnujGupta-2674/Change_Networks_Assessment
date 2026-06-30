import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { register as registerUser } from '../api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

// Custom schema for root initialization
const rootRegisterSchema = z.object({
  organizationName: z.string().min(2, 'Organization Name must be at least 2 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(rootRegisterSchema),
    defaultValues: {
      organizationName: '',
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Force isRoot to true for this initialization form
      await registerUser({ ...data, isRoot: true });
      toast.success('Root user initialized successfully! Please login.');
      navigate('/login');
    } catch (error) {
      if (error.response?.status === 409) {
        // If email already exists, we assume the system might be initialized
        toast.error('Initialization failed. The system may already be initialized.');
        setIsInitialized(true);
      } else {
        toast.error(error.response?.data?.message || 'An error occurred during registration');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50 dark:bg-neutral-950">
        <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm p-6 space-y-6 text-center">
          <div className="mx-auto w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">System Initialized</h2>
          <p className="text-neutral-500 dark:text-neutral-400">
            This organization has already been initialized with a Root user. Normal organization members must NEVER register themselves; they are created by administrators.
          </p>
          <Button onClick={() => navigate('/login')} className="w-full mt-4">
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50 dark:bg-neutral-950">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-3 rounded-xl shadow-sm">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Initialize System</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Create the initial Root user for your organization.
            </p>
            <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 rounded-md p-3 mt-4 text-xs text-amber-800 dark:text-amber-400 text-left">
              <strong>Important:</strong> If you have run the seed script, the root user is already created. Do not use this form.
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization Name</Label>
              <Input
                id="organizationName"
                placeholder="Your Organization Name"
                {...register('organizationName')}
                className={errors.organizationName ? 'border-red-500' : ''}
              />
              {errors.organizationName && <p className="text-sm text-red-500">{errors.organizationName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Root Administrator Name"
                {...register('name')}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@domain.com"
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="•••••••••••"
                  {...register('password')}
                  className={`pr-10 ${errors.password ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-6" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing...
                </>
              ) : (
                'Create Root User'
              )}
            </Button>
          </form>
        </div>
        <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 border-t border-neutral-200 dark:border-neutral-800 text-center text-sm text-neutral-500">
          Already initialized?{' '}
          <Link to="/login" className="font-semibold text-blue-600 dark:text-blue-500 hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
