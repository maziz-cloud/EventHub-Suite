import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EventCard } from "@/components/EventCard";
import { Header } from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string;
  venue: string;
  event_date: string;
  price: number;
  image_url: string | null;
  category: string | null;
}

const EventsList = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("status", "active")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section 
        className="relative py-20 px-4 text-center text-white"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="container max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">
            Discover Amazing Events
          </h1>
          <p className="text-xl mb-8 text-white/90">
            Find and book tickets for concerts, conferences, workshops, and more
          </p>
          
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-lg bg-background"
            />
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-12 px-4">
        <div className="container">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  title={event.title}
                  description={event.description || ""}
                  venue={event.venue}
                  eventDate={event.event_date}
                  price={event.price}
                  imageUrl={event.image_url || undefined}
                  category={event.category || undefined}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {searchQuery ? "No events found matching your search" : "No upcoming events"}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default EventsList;
