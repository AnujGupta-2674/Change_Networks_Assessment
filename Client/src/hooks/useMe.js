import { useQuery } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export const useMe = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['me'],
    queryFn: authService.getMe,
    enabled: isAuthenticated, // Only fetch if we are authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
