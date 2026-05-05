"use client";

import { ReactNode } from 'react';
import CoordinatorSidebar from './_components/CoordinatorSidebar';
import CoordinatorNavbar from './_components/CoordinatorNavbar';

export default function CoordinatorLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className="flex h-screen bg-[#030712] overflow-hidden">
            <CoordinatorSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <CoordinatorNavbar />
                <main className="flex-1 overflow-y-auto p-0 scrollbar-hide">
                    {children}
                </main>
            </div>
        </div>
    );
}
