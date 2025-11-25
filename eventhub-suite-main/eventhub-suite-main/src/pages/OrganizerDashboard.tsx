import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, Calendar, Users, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface Event {
  id: string;
  title: string;
  event_date: string;
  capacity: number;
  price: number;
  bookings: { quantity: number }[];
}

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    venue: "",
    eventDate: "",
    endDate: "",
    capacity: 100,
    price: 0,
    category: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .in("role", ["organizer", "admin"])
      .single();
    
    if (!roles) {
      toast.error("You don't have organizer access");
      navigate("/");
      return;
    }
    
    fetchEvents(session.user.id);
  };

  const fetchEvents = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          bookings (quantity)
        `)
        .eq("organizer_id", userId)
        .order("event_date", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setCreating(true);
    try {
      const { error } = await supabase.from("events").insert({
        organizer_id: session.user.id,
        title: formData.title,
        description: formData.description,
        venue: formData.venue,
        event_date: formData.eventDate,
        end_date: formData.endDate || null,
        capacity: formData.capacity,
        price: formData.price,
        category: formData.category || null,
      });

      if (error) throw error;

      toast.success("Event created successfully!");
      setOpen(false);
      setFormData({
        title: "",
        description: "",
        venue: "",
        eventDate: "",
        endDate: "",
        capacity: 100,
        price: 0,
        category: "",
      });
      fetchEvents(session.user.id);
    } catch (error: any) {
      toast.error(error.message || "Failed to create event");
    } finally {
      setCreating(false);
    }
  };

  const getBookedCount = (event: Event) => {
    return event.bookings.reduce((sum, b) => sum + b.quantity, 0);
  };

  const getRevenue = (event: Event) => {
    return getBookedCount(event) * event.price;
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Organizer Dashboard</h1>
            <p className="text-muted-foreground">Manage your events and bookings</p>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="venue">Venue *</Label>
                    <Input
                      id="venue"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventDate">Start Date & Time *</Label>
                    <Input
                      id="eventDate"
                      type="datetime-local"
                      value={formData.eventDate}
                      onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date & Time</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Event"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {events.length > 0 ? (
          <div className="grid gap-6">
            {events.map((event) => {
              const bookedCount = getBookedCount(event);
              const revenue = getRevenue(event);
              
              return (
                <Card key={event.id}>
                  <CardHeader>
                    <CardTitle className="text-2xl">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Event Date</p>
                          <p className="font-semibold">{new Date(event.event_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Bookings</p>
                          <p className="font-semibold">{bookedCount} / {event.capacity}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-accent" />
                        <div>
                          <p className="text-sm text-muted-foreground">Price</p>
                          <p className="font-semibold">${event.price.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-accent" />
                        <div>
                          <p className="text-sm text-muted-foreground">Revenue</p>
                          <p className="font-semibold">${revenue.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No events created yet</h3>
              <p className="text-muted-foreground mb-4">Create your first event to get started!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrganizerDashboard;
