"use client";

import { useState, useEffect } from "react";
import LoginModal from "@/app/user/_components/LoginModal";
import { useRouter } from "next/navigation";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import SessionWarningModal from "@/shared-components/SessionWarningModal";

export default function GlobalAuthListener() {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const router = useRouter();

    const {
        showWarning,
        secondsLeft,
        isOffline,
        isExtending,
        extendSession,
        logout: sessionLogout,
    } = useSessionTimeout();

    useEffect(() => {
        const handleUnauthorized = () => {
            setIsLoginModalOpen(true);
        };

        window.addEventListener('open-login-modal', handleUnauthorized);

    const handleLoginSuccess = (e: Event) => {
            if (isLoginModalOpen) {
                setIsLoginModalOpen(false);
                // Hard redirect so Next.js middleware validates the new auth cookie
                const route = (e as CustomEvent).detail?.route || '/';
                window.location.href = route;
            }
            // If our modal was NOT open, the login_success came from the
            // normal login flow — don't redirect (let router.push handle it).
        };
        window.addEventListener('login_success', handleLoginSuccess);

        return () => {
            window.removeEventListener('open-login-modal', handleUnauthorized);
            window.removeEventListener('login_success', handleLoginSuccess);
        };
    }, [isLoginModalOpen]);

    const handleSwitchToRegister = () => {
        setIsLoginModalOpen(false);
    };

    return (
        <>
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                onSwitchToRegister={handleSwitchToRegister}
            />
            <SessionWarningModal
                isOpen={showWarning}
                secondsLeft={secondsLeft}
                isOffline={isOffline}
                isExtending={isExtending}
                onExtend={extendSession}
                onLogout={sessionLogout}
            />
        </>
    );
}
