"use client";

import React from 'react';

// Simple client component that will be imported by the page
export default function MenuClient({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      {children}
    </div>
  );
}
