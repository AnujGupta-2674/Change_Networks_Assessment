import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

export const useRegister = () => {
  return useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      toast.success('Registration successful! Please log in.');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
    }
  });
};
