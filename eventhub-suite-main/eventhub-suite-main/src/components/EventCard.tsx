import { Calendar, MapPin, DollarSign } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface EventCardProps {
  id: string;
  title: string;
  description: string;
  venue: string;
  eventDate: string;
  price: number;
  imageUrl?: string;
  category?: string;
}

export const EventCard = ({
  id,
  title,
  description,
  venue,
  eventDate,
  price,
  imageUrl,
  category,
}: EventCardProps) => {
  const navigate = useNavigate();

  return (
    <Card 
      className="group overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[var(--shadow-hover)]"
      onClick={() => navigate(`/event/${id}`)}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl || "/placeholder.svg"}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        {category && (
          <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground">
            {category}
          </Badge>
        )}
      </div>
      
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-2 text-foreground line-clamp-1">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {description}
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2 text-primary" />
            {format(new Date(eventDate), "PPP 'at' p")}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2 text-primary" />
            {venue}
          </div>
          <div className="flex items-center text-sm font-semibold text-foreground">
            <DollarSign className="h-4 w-4 mr-1 text-accent" />
            {price === 0 ? "Free" : `$${price.toFixed(2)}`}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-6 pt-0">
        <Button 
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/event/${id}`);
          }}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};
