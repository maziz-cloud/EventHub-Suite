import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, DollarSign, Users, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Event {
  id: string;
  title: string;
  description: string;
  venue: string;
  event_date: string;
  end_date: string | null;
  price: number;
  capacity: number;
  image_url: string | null;
  category: string | null;
}

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [bookedCount, setBookedCount] = useState(0);

  useEffect(() => {
    if (id) {
      fetchEvent();
      fetchBookingCount();
    }
  }, [id]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error("Error fetching event:", error);
      toast.error("Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingCount = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("quantity")
        .eq("event_id", id)
        .eq("status", "confirmed");

      if (error) throw error;
      const total = data?.reduce((sum, booking) => sum + booking.quantity, 0) || 0;
      setBookedCount(total);
    } catch (error) {
      console.error("Error fetching booking count:", error);
    }
  };

  const handleBooking = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("Please login to book tickets");
      navigate("/auth");
      return;
    }

    if (!event) return;

    const availableSeats = event.capacity - bookedCount;
    if (quantity > availableSeats) {
      toast.error(`Only ${availableSeats} seats available`);
      return;
    }

    setBooking(true);
    try {
      const { error } = await supabase.from("bookings").insert({
        event_id: event.id,
        user_id: session.user.id,
        quantity,
        total_price: event.price * quantity,
        status: "confirmed",
      });

      if (error) throw error;

      toast.success("Booking confirmed! Check your email for details.");
      navigate("/bookings");
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("Failed to complete booking");
    } finally {
      setBooking(false);
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

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Event not found</h1>
          <Button onClick={() => navigate("/")}>Back to Events</Button>
        </div>
      </div>
    );
  }

  const availableSeats = event.capacity - bookedCount;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative h-96 rounded-lg overflow-hidden">
              <img
                src={event.image_url || "/placeholder.svg"}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <h1 className="text-4xl font-bold mb-4">{event.title}</h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {event.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-3 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date & Time</p>
                      <p className="font-semibold">{format(new Date(event.event_date), "PPP 'at' p")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-3 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Venue</p>
                      <p className="font-semibold">{event.venue}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Booking Card */}
          <div>
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Book Tickets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-1 text-accent" />
                    <span className="text-2xl font-bold">
                      {event.price === 0 ? "Free" : `$${event.price.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-1" />
                    {availableSeats} / {event.capacity} available
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Number of Tickets</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={availableSeats}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      ${(event.price * quantity).toFixed(2)}
                    </span>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleBooking}
                    disabled={booking || availableSeats === 0}
                  >
                    {booking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : availableSeats === 0 ? (
                      "Sold Out"
                    ) : (
                      "Book Now"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
