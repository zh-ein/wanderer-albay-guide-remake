import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed, MapPin, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Restaurant {
  id: string;
  name: string;
  description: string;
  location: string;
  municipality: string;
  food_type: string;
  image_url: string;
}

interface NearbyRestaurantsProps {
  userDistricts: string[];
  userInterests: string[];
}

const NearbyRestaurants = ({ userDistricts, userInterests }: NearbyRestaurantsProps) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurants();
  }, [userDistricts]);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .limit(6);

      if (error) throw error;

      if (data) {
        // Filter by district municipalities
        const districtMunicipalities = getDistrictMunicipalities(userDistricts);
        const filteredRestaurants = data.filter(restaurant => 
          districtMunicipalities.some(m => restaurant.municipality?.includes(m))
        );

        setRestaurants(filteredRestaurants.slice(0, 6));
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDistrictMunicipalities = (districts: string[]): string[] => {
    const municipalities: string[] = [];
    
    districts.forEach(district => {
      if (district === "District 1") {
        municipalities.push("Bacacay", "Malilipot", "Malinao", "Santo Domingo", "Tiwi", "Tabaco");
      } else if (district === "District 2") {
        municipalities.push("Legazpi", "Camalig", "Daraga", "Manito", "Rapu-Rapu");
      } else if (district === "District 3") {
        municipalities.push("Guinobatan", "Ligao", "Oas", "Pio Duran", "Polangui", "Jovellar");
      }
    });
    
    return municipalities;
  };

  // Only show if user is interested in food
  const showRestaurants = userInterests.some(interest => 
    interest.toLowerCase().includes('food') || 
    interest.toLowerCase().includes('cuisine')
  );

  if (loading || restaurants.length === 0 || !showRestaurants) return null;

  return (
    <div className="mb-12 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <UtensilsCrossed className="w-6 h-6 text-accent" />
        <h2 className="text-2xl font-bold">Recommended Restaurants 🍽️</h2>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {restaurants.map((restaurant) => (
          <Card key={restaurant.id} className="group cursor-pointer hover:shadow-lg transition-all overflow-hidden">
            <div className="relative h-48 overflow-hidden">
              <img
                src={restaurant.image_url || "/placeholder.svg"}
                alt={restaurant.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2">{restaurant.name}</h3>
              {restaurant.food_type && (
                <Badge variant="secondary" className="mb-2">
                  {restaurant.food_type}
                </Badge>
              )}
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <MapPin className="w-4 h-4" />
                <span className="line-clamp-1">{restaurant.municipality || restaurant.location}</span>
              </div>
              {restaurant.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {restaurant.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default NearbyRestaurants;
