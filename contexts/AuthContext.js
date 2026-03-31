'use client';

import { getSupabaseClient } from '@/lib/supabase';
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isAdminLoading, setIsAdminLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const supabase = getSupabaseClient();

        const syncAuthState = async (currentSession) => {
            if (!mounted) return;

            setSession(currentSession);

            if (!currentSession?.user) {
                setIsAdmin(false);
                setIsAuthLoading(false);
                setIsAdminLoading(false);
                return;
            }

            try {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', currentSession.user.id)
                    .single();

                if (error) throw error;
                if (!mounted) return;

                setIsAdmin(profile?.role === 'admin');
            } catch (error) {
                console.error('Profile fetch error:', error);
                if (mounted) setIsAdmin(false);
            } finally {
                if (mounted) {
                    setIsAuthLoading(false);
                    setIsAdminLoading(false);
                }
            }
        };

        // Initial session load
        supabase.auth.getSession().then(({ data: { session } }) => {
            syncAuthState(session);
        });

        // Future auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, newSession) => {
                syncAuthState(newSession);
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider
            value={{ session, isAdmin, isAuthLoading, isAdminLoading }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);