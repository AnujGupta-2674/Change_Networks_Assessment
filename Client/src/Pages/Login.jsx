import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { loginSchema } from '../schemas/auth';
import { useLogin } from '../hooks/useLogin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, Shield } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        navigate('/dashboard');
      }
    });
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 bg-white dark:bg-neutral-950">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-sm space-y-6">
          <div className="flex flex-col space-y-2 text-center lg:text-left">
            <div className="flex justify-center lg:justify-start items-center gap-2 mb-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl text-neutral-900 dark:text-white">Change IAM</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Welcome back</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Enter your email below to login to your account
            </p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                {...register('email')}
                className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="#"
                  className="ml-auto inline-block text-sm text-blue-600 dark:text-blue-500 hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  {...register('password')}
                  className={`pr-10 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2 pb-2">
              <input 
                type="checkbox" 
                id="remember" 
                className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-600"
              />
              <Label htmlFor="remember" className="text-sm font-normal">Remember me</Label>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>
          
          <div className="text-center text-sm text-neutral-500 dark:text-neutral-400">
            Need to initialize the system?{' '}
            <Link to="/register" className="font-semibold text-blue-600 dark:text-blue-500 hover:underline">
              System Setup
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-neutral-100 dark:bg-neutral-900 lg:flex items-center justify-center p-12">
        <div className="w-full max-w-lg space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">Enterprise IAM Platform</h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Manage identities, access policies, and organizational resources from a single, secure dashboard.
            </p>
          </div>
          
          <div className="grid gap-4">
            <div className="flex items-start gap-4 bg-white dark:bg-neutral-950 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">Fine-grained Access Control</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Evaluate policies with exact deny/allow algorithm matching cloud providers.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
