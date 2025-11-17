import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Search, Star, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Session } from "@supabase/supabase-js";
import AccommodationsSection from "@/components/AccommodationsSection";

interface TouristSpot {
  id: string;
  name: string;
  description: string | null;
  location: string;
  municipality: string | null;
  category: string[];
  image_url: string | null;
  rating: number;
}

interface Subcategory {
  id: string;
  name: string;
  category_id: string | null;
  description: string | null;
}

const Explore = () => {
  const navigate = useNavigate();
  const [spots, setSpots] = useState<TouristSpot[]>([]);
  const [filteredSpots, setFilteredSpots] = useState<TouristSpot[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  useEffect(() => {
    fetchSpots();
    fetchSubcategories();
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Set up real-time subscription for subcategories
    const subcategoriesChannel = supabase
      .channel('subcategories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subcategories'
        },
        () => {
          fetchSubcategories();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(subcategoriesChannel);
    };
  }, []);

  useEffect(() => {
    filterSpots();
  }, [searchQuery, selectedCategory, spots]);

  const fetchSpots = async () => {
    const { data, error } = await supabase
      .from("tourist_spots")
      .select("*")
      .order("name");

    if (!error && data) {
      setSpots(data);
    }
  };

  const fetchSubcategories = async () => {
    const { data, error } = await supabase
      .from("subcategories")
      .select("*")
      .order("name");

    if (!error && data) {
      setSubcategories(data);
    }
  };

  const filterSpots = () => {
    let filtered = spots;

    if (searchQuery) {
      filtered = filtered.filter(
        (spot) =>
          spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          spot.municipality?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((spot) => spot.category.includes(selectedCategory));
    }

    setFilteredSpots(filtered);
  };

  const categories = ["Nature", "Culture", "Adventure", "Food", "Beach", "Heritage"];

  // Combine predefined categories with subcategories
  const allCategories = [
    ...categories,
    ...subcategories.map(sub => sub.name)
  ].sort();

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Nature: "bg-secondary text-secondary-foreground",
      Culture: "bg-accent text-accent-foreground",
      Adventure: "bg-primary text-primary-foreground",
      Food: "bg-orange-500 text-white",
      Beach: "bg-blue-500 text-white",
      Heritage: "bg-purple-500 text-white",
    };
    return colors[category] || "bg-muted";
  };

  const getCategoryCount = (category: string) => {
    return spots.filter(spot => spot.category.includes(category)).length;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-12">
        <div className="mb-12 text-center animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Explore <span className="text-primary">Albay</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover amazing destinations and places to stay across the province
          </p>
        </div>

        <Tabs defaultValue="destinations" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="destinations">
              <MapPin className="w-4 h-4 mr-2" />
              Tourist Destinations
            </TabsTrigger>
            <TabsTrigger value="accommodations">
              <Building2 className="w-4 h-4 mr-2" />
              Hotels & Accommodations
            </TabsTrigger>
          </TabsList>

          {/* DESTINATIONS TAB */}
          <TabsContent value="destinations" className="space-y-8">
            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search destinations or municipalities..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  All ({spots.length})
                </Button>
                {allCategories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category} ({getCategoryCount(category)})
                  </Button>
                ))}
              </div>
            </div>

            {/* Spots Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSpots.length > 0 ? (
                filteredSpots.map((spot) => (
                  <Card
                    key={spot.id}
                    className="overflow-hidden hover:shadow-xl transition-all hover:scale-105 cursor-pointer relative group"
                    onClick={() => navigate(`/spot/${spot.id}`)}
                  >
                    {spot.image_url && (
                      <div className="h-48 overflow-hidden bg-muted">
                        <img
                          src={spot.image_url}
                          alt={spot.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="flex items-start justify-between gap-2">
                        <span className="line-clamp-2">{spot.name}</span>
                        {spot.rating > 0 && (
                          <div className="flex items-center gap-1 text-yellow-500 text-sm">
                            <Star className="w-4 h-4 fill-current" />
                            {spot.rating}
                          </div>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {spot.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {spot.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{spot.location}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {spot.category.map((cat) => (
                          <Badge key={cat} className={getCategoryColor(cat)} variant="secondary">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-lg text-muted-foreground">No destinations found</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ACCOMMODATIONS TAB */}
          <TabsContent value="accommodations">
            <AccommodationsSection userId={session?.user?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Explore;
