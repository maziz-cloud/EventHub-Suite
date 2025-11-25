import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, DollarSign, Loader2, Ticket } from "lucide-react";
import { format } from "date-fns";

interface Booking {
  id: string;
  quantity: number;
  total_price: number;
  status: string;
  booking_date: string;
  events: {
    title: string;
    venue: string;
    event_date: string;
    image_url: string | null;
  };
}

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    fetchBookings(session.user.id);
  };

  const fetchBookings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          events (
            title,
            venue,
            event_date,
            image_url
          )
        `)
        .eq("user_id", userId)
        .order("booking_date", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Bookings</h1>
          <p className="text-muted-foreground">View all your event bookings</p>
        </div>

        {bookings.length > 0 ? (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-48 h-48 md:h-auto">
                    <img
                      src={booking.events.image_url || "/placeholder.svg"}
                      alt={booking.events.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-2xl">{booking.events.title}</CardTitle>
                        <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                          {booking.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2 text-primary" />
                          {format(new Date(booking.events.event_date), "PPP 'at' p")}
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-2 text-primary" />
                          {booking.events.venue}
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <Ticket className="h-4 w-4 mr-2 text-primary" />
                          {booking.quantity} {booking.quantity === 1 ? "ticket" : "tickets"}
                        </div>
                        <div className="flex items-center font-semibold">
                          <DollarSign className="h-4 w-4 mr-1 text-accent" />
                          Total: ${booking.total_price.toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                        Booked on {format(new Date(booking.booking_date), "PPP")}
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
              <p className="text-muted-foreground mb-4">Start exploring events and book your tickets!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
