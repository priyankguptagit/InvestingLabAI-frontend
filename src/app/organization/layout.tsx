"use client";

import { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';
import OrganizationSidebar from './_components/OrganizationSidebar';
import OrganizationNavbar from './_components/OrganizationNavbar';
import FeedbackModal from '@/shared-components/feedback/FeedbackModal';

export default function OrganizationLayout({
    children,
}: {
    children: ReactNode;
}) {
    const pathname = usePathname();
    const isCoordinatorPortal = pathname?.startsWith('/organization/coordinator/') || pathname === '/organization/coordinator';

    if (isCoordinatorPortal) {
        return <>{children}</>;
    }

    return (
        <div className="flex h-screen bg-[#030712] overflow-hidden">
            <OrganizationSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <OrganizationNavbar />
                <main className="flex-1 overflow-y-auto p-0 scrollbar-hide">
                    {children}
                </main>
            </div>
            {/* Global Feedback Modal */}
            <FeedbackModal portal="organization" />
        </div>
    );
}
