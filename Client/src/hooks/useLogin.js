import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const useLogin = () => {
  const { login } = useAuth();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (response) => {
      // response.data contains { accessToken, user }
      login(response.data.user, response.data.accessToken);
      toast.success('Successfully logged in!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
    }
  });
};
