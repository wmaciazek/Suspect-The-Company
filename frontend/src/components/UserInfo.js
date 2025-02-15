'use client'; 
import React from 'react';
import { useAuth } from '@/context/AuthContext';

const UserInfo = () => {
  const { currentUser, signOut } = useAuth();

  if (currentUser) {
    return (
      <div className="flex items-center space-x-4">
        <span>Zalogowany jako: {currentUser.email}</span>
        <button
          onClick={signOut}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
        >
          Wyloguj
        </button>
      </div>
    );
  }

  return null;
};

export default UserInfo;