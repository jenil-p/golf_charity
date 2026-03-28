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
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
            setSession(newSession);

            if (newSession) {
                setIsAdminLoading(true);
                const { data } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', newSession.user.id)
                    .single();
                setIsAdmin(data?.role === 'admin');
                setIsAdminLoading(false); 
            } else {
                setIsAdmin(false);
                setIsAdminLoading(false);
            }

            setIsAuthLoading(false);
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