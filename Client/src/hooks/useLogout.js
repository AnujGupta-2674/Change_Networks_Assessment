import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logout as logoutApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const useLogout = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      localStorage.removeItem('token');
      setUser(null);
      queryClient.clear();
      navigate('/login');
      toast.success('Logged out successfully');
    },
    onError: () => {
      // Force logout on frontend even if backend fails
      localStorage.removeItem('token');
      setUser(null);
      queryClient.clear();
      navigate('/login');
    }
  });
};
