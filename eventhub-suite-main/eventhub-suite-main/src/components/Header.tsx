import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, User, LogOut, LayoutDashboard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";

export const Header = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        checkOrganizerRole(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        checkOrganizerRole(session.user.id);
      } else {
        setIsOrganizer(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkOrganizerRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["organizer", "admin"])
      .single();
    
    setIsOrganizer(!!data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Calendar className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            EventHub
          </span>
        </Link>

        <nav className="flex items-center space-x-4">
          {session ? (
            <>
              {isOrganizer && (
                <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              )}
              <Button variant="ghost" onClick={() => navigate("/bookings")}>
                <User className="h-4 w-4 mr-2" />
                My Bookings
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                Login
              </Button>
              <Button onClick={() => navigate("/auth?signup=true")}>
                Sign Up
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
