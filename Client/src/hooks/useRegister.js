import { useMutation } from '@tanstack/react-query';
import { register as registerApi } from '../api/client';
import { toast } from 'sonner';

export const useRegister = () => {
  return useMutation({
    mutationFn: registerApi,
    onSuccess: () => {
      toast.success('Registration successful! Please log in.');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
    }
  });
};
