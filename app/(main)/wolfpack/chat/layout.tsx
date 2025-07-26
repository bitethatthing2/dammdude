interface ChatLayoutProps {
  children: React.ReactNode;
}

// Chat pages are full-screen experiences without headers
export default function ChatLayout({ children }: ChatLayoutProps) {
  return children;
}