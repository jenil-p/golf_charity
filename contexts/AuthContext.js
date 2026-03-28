'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    useEffect(() => {
        // Fetch session ONCE when the app loads
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) {
                supabase.from('profiles').select('role').eq('id', session.user.id).single()
                    .then(({ data }) => setIsAdmin(data?.role === 'admin'));
            }
            setIsAuthLoading(false);
        });

        // Listen for login/logout events globally
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
            setSession(newSession);
            if (newSession) {
                const { data } = await supabase.from('profiles').select('role').eq('id', newSession.user.id).single();
                setIsAdmin(data?.role === 'admin');
            } else {
                setIsAdmin(false);
            }
            setIsAuthLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ session, isAdmin, isAuthLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);