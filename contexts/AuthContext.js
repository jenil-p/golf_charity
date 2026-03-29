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

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                setSession(newSession);

                if (newSession?.user) {
                    try {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('role')
                            .eq('id', newSession.user.id)
                            .single();
                        setIsAdmin(profile?.role === 'admin');
                    } catch (error) {
                        console.error('Profile fetch error:', error);
                        setIsAdmin(false);
                    }
                } else {
                    setIsAdmin(false);
                }

                // Only mark loading as done AFTER the auth state is fully resolved
                setIsAuthLoading(false);
                setIsAdminLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ session, isAdmin, isAuthLoading, isAdminLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);