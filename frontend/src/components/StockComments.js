'use client';
import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';

const StockComments = ({ ticker }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser({
          uid: user.uid,
          name: user.email?.split('@')[0] || 'Anonim',
          email: user.email
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!ticker) return;

    const commentsRef = collection(db, 'stockComments');
    const commentsQuery = query(
      commentsRef,
      where('ticker', '==', ticker)
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const newComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()?.toISOString()
      }))
      .sort((a, b) => {
        return new Date(a.timestamp) - new Date(b.timestamp); // Sortowanie od najstarszych
      });
      
      setComments(newComments);
      setLoading(false);
      scrollToBottom();
    }, (error) => {
      console.error("Błąd subskrypcji komentarzy:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [ticker]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      const commentsRef = collection(db, 'stockComments');
      await addDoc(commentsRef, {
        ticker,
        content: newComment.trim(),
        userId: user.uid,
        user: {
          name: user.name,
          email: user.email
        },
        timestamp: new Date(),
        likes: []
      });

      setNewComment('');
    } catch (error) {
      console.error('Błąd dodawania komentarza:', error);
      alert('Nie udało się dodać komentarza. Spróbuj ponownie.');
    }
  };

  const handleLike = async (commentId) => {
    if (!user) return;

    try {
      const commentRef = doc(db, 'stockComments', commentId);
      const hasLiked = comments.find(c => c.id === commentId)?.likes?.includes(user.uid);

      await updateDoc(commentRef, {
        likes: hasLiked 
          ? arrayRemove(user.uid)
          : arrayUnion(user.uid)
      });
    } catch (error) {
      console.error('Błąd aktualizacji polubienia:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
        <span>Komentarze</span>
        <span className="text-sm font-normal text-gray-400">
          ({comments.length})
        </span>
      </h2>
      
      <div className="flex flex-col h-[400px]"> 
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-4 bg-gray-700/50 p-4 rounded-lg">
                <div className="w-10 h-10 flex items-center justify-center bg-indigo-600 rounded-full text-white font-bold">
                  {comment.user.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">{comment.user.name}</span>
                    <span className="text-sm text-gray-400">
                      {formatDate(comment.timestamp)}
                    </span>
                  </div>
                  <p className="text-gray-200">{comment.content}</p>
                  <div className="mt-2 flex items-center gap-4">
                    <button 
                      onClick={() => handleLike(comment.id)}
                      className={`text-sm transition-colors flex items-center gap-1
                        ${user && comment.likes?.includes(user.uid)
                          ? 'text-indigo-400 hover:text-indigo-300'
                          : 'text-gray-400 hover:text-white'
                        }`}
                      disabled={!user}
                    >
                      <span>👍</span> {comment.likes?.length || 0}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400">
              Bądź pierwszy który skomentuje {ticker}!
            </p>
          )}
          <div ref={messagesEndRef} /> 
        </div>

        {user ? (
          <form onSubmit={handleSubmit} className="mt-auto">
            <div className="flex gap-4">
              <div className="flex-grow">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Dodaj komentarz..."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 resize-none"
                  rows="3"
                />
              </div>
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg h-fit hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Wyślij
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 bg-gray-700/50 rounded-lg text-center">
            <p className="text-gray-300">Zaloguj się aby dodać komentarz</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockComments;