'use client'
import React, { useState } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!auth) {
        setError("Błąd Firebase");
        return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Zalogowano:", userCredential.user);
    } catch (error) {
      setError(error.message);
      console.error("Błąd autoryzacji:", error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-gray-800 rounded shadow"> 
      <h2 className="text-2xl font-bold mb-4">Logowanie</h2>  
      <form onSubmit={handleSubmit} className="space-y-4">  
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" /* Te same style */
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300">Hasło:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" /* Te same style */
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" /* Te same style */
        >
                    Zaloguj się
    </button>   
    {error && <p className="text-red-500">{error}</p>} 
    </form>
      </div>
      );
};

export default LoginForm;