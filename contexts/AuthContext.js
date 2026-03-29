'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isAdminLoading, setIsAdminLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Check local storage for session
                const { data: { session: initialSession } } = await supabase.auth.getSession();
                setSession(initialSession);

                if (initialSession?.user) {
                    // If user exists, fetch their role right away
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', initialSession.user.id)
                        .single();

                    setIsAdmin(profile?.role === 'admin');
                }
            } catch (error) {
                console.error("Auth init error:", error);
            } finally {
                // Guarantee loading ends so the Guard can proceed
                setIsAuthLoading(false);
                setIsAdminLoading(false);
            }
        };

        initializeAuth();

        // Set up the listener for future events (login/logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            setSession(newSession);

            if (newSession?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', newSession.user.id)
                    .single();
                setIsAdmin(profile?.role === 'admin');
            } else {
                setIsAdmin(false);
            }

            setIsAuthLoading(false);
            setIsAdminLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ session, isAdmin, isAuthLoading, isAdminLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);