import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema } from '../schemas/auth';
import { useRegister } from '../hooks/useRegister';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { cn } from '../utils/cn';

const Register = () => {
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      isRoot: false,
    },
  });

  const isRoot = watch('isRoot');

  const onSubmit = (data) => {
    // We send isRoot along with the other data. 
    // The backend might ignore this depending on its implementation, but the requirement is to send it.
    registerMutation.mutate(data, {
      onSuccess: () => {
        navigate('/login');
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">Create an account</CardTitle>
          <CardDescription>
            Enter your details to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Account Type Toggle */}
            <div className="flex flex-col space-y-2 mb-4">
              <label className="text-sm font-medium text-slate-700">Account Type</label>
              <div className="flex p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setValue('isRoot', false)}
                  className={cn(
                    "flex-1 py-1.5 text-sm font-medium rounded-md transition-colors",
                    !isRoot ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Normal User
                </button>
                <button
                  type="button"
                  onClick={() => setValue('isRoot', true)}
                  className={cn(
                    "flex-1 py-1.5 text-sm font-medium rounded-md transition-colors",
                    isRoot ? "bg-purple-100 text-purple-900 shadow-sm border border-purple-200" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Root User
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <Input
                id="name"
                label="Full Name"
                placeholder="John Doe"
                error={errors.name?.message}
                {...register('name')}
              />
            </div>
            <div className="space-y-1">
              <Input
                id="email"
                type="email"
                label="Email"
                placeholder="m@example.com"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>
            <div className="space-y-1">
              <Input
                id="password"
                type="password"
                label="Password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />
            </div>
            <div className="space-y-1">
              <Input
                id="confirmPassword"
                type="password"
                label="Confirm Password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full mt-4" 
              isLoading={registerMutation.isPending}
            >
              Sign up
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-slate-500">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline hover:text-primary-hover transition-colors">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
