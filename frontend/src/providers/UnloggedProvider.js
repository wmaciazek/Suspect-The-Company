'use client';
import { useAuth } from '@/providers/AuthProvider';

const UnloggedProvider = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Ładowanie...</div>;  
  }

  if (!currentUser) {
    return <>{children}</>;
  }

  return null;
};

export default UnloggedProvider;