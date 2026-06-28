import { useMutation } from '@tanstack/react-query';
import { login as loginApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export const useLogin = () => {
  const { setUser } = useAuth();

  return useMutation({
    mutationFn: loginApi,
    onSuccess: (response) => {
      // response.data contains { accessToken, user }
      localStorage.setItem('token', response.data.data.accessToken);
      setUser(response.data.data.user);
      toast.success('Successfully logged in!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
    }
  });
};
