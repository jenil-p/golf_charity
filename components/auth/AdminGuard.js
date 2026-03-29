'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loading from '@/components/ui/Loading';

export default function AdminGuard({ children }) {
    const { session, isAdmin, isAuthLoading, isAdminLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthLoading && !isAdminLoading) {
            if (!session) {
                router.replace('/login');
            } else if (!isAdmin) {
                router.replace('/dashboard');
            }
        }
    }, [session, isAdmin, isAuthLoading, isAdminLoading, router]);

    if (isAuthLoading || isAdminLoading || !session || !isAdmin) {
        return <Loading message="Verifying Security Clearance..." />;
    }

    return children;
}