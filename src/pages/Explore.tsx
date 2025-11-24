import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Search, Star, Building2, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  location: string;
  municipality: string | null;
  food_type: string | null;
  image_url: string | null;
}

const PLACEHOLDER_IMAGE = "/mnt/data/c64ba096-d3de-4e7a-bef4-7e83b19a8a04.png"; // your uploaded image path

const Explore = () => {
  const navigate = useNavigate();

  // --- Destinations state
  const [spots, setSpots] = useState<TouristSpot[]>([]);
  const [filteredSpots, setFilteredSpots] = useState<TouristSpot[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  // --- Restaurants state
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [restaurantSearch, setRestaurantSearch] = useState("");
  const [activeFoodTypes, setActiveFoodTypes] = useState<string[]>([]); // allow multi-select like your destinations
  const [restaurantLoading, setRestaurantLoading] = useState(true);

  useEffect(() => {
    fetchSpots();
    fetchSubcategories();
    fetchRestaurants();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    const subcatChannel = supabase
      .channel("subcategories-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subcategories" },
        fetchSubcategories
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(subcatChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Destination filtering effect
  useEffect(() => {
    filterSpots();
  }, [searchQuery, selectedCategories, spots]);

  // Restaurant filtering effect
  useEffect(() => {
    filterRestaurants();
  }, [restaurantSearch, activeFoodTypes, restaurants]);

  // --- Fetchers
  const fetchSpots = async () => {
    try {
      const { data } = await supabase.from("tourist_spots").select("*").order("name");
      if (data) setSpots(data);
    } catch (err) {
      console.error("Error fetching tourist spots:", err);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const { data } = await supabase.from("subcategories").select("*").order("name");
      if (data) setSubcategories(data);
    } catch (err) {
      console.error("Error fetching subcategories:", err);
    }
  };

  const fetchRestaurants = async () => {
    setRestaurantLoading(true);
    try {
      const { data, error } = await supabase.from("restaurants").select("*").order("name");
      if (error) throw error;
      if (data) {
        // normalize to Restaurant type
        setRestaurants(
          data.map((r: any) => ({
            id: r.id,
            name: r.name,
            description: r.description ?? null,
            location: r.location ?? "",
            municipality: r.municipality ?? null,
            food_type: r.food_type ?? null,
            image_url: r.image_url ?? null,
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching restaurants:", err);
    } finally {
      setRestaurantLoading(false);
    }
  };

  // --- Filtering logic for spots
  const filterSpots = () => {
    let filtered = spots;

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (spot) =>
          spot.name.toLowerCase().includes(q) ||
          spot.municipality?.toLowerCase().includes(q)
      );
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((spot) =>
        selectedCategories.every((cat) => spot.category.includes(cat))
      );
    }

    setFilteredSpots(filtered);
  };

  // --- Filter restaurants by activeFoodTypes (multi) and search
  const filterRestaurants = () => {
    let list = restaurants;

    // If food types selected, match ANY of the selected types (unless "All")
    if (activeFoodTypes.length > 0 && !activeFoodTypes.includes("All")) {
      const lowerSelected = activeFoodTypes.map((s) => s.toLowerCase());
      list = list.filter((r) => {
        if (!r.food_type) return false;
        const types = r.food_type.split(",").map((t) => t.trim().toLowerCase());
        // match if any selected type appears in the restaurant types
        return lowerSelected.some((sel) => types.some((t) => t.includes(sel)));
      });
    }

    // Search by name or municipality or location
    if (restaurantSearch.trim() !== "") {
      const q = restaurantSearch.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.municipality?.toLowerCase().includes(q) ||
          r.location?.toLowerCase().includes(q)
      );
    }

    setFilteredRestaurants(list);
  };

  // --- Destination categories (base + subcategories)
  const baseCategories = [
    "Nature",
    "Culture",
    "Adventure",
    "Food",
    "Beach",
    "Heritage",
    "Cafes",
    "ATV Rides",
    "Caving",
    "Hiking",
    "Churches",
    "Crafts",
    "Festivals",
    "Island Hopping",
    "Lakes",
    "Local Cuisine",
    "Museums",
    "Parks",
    "Resorts",
    "Waterfalls",
    "Snorkeling",
    "Street Food",
    "Sunset Views",
    "Volcanoes",
    "Ziplines",
  ];

  const allCategories = Array.from(new Set([...baseCategories, ...subcategories.map((s) => s.name)])).sort();

  const handleCategoryClick = useCallback(
    (category: string) => {
      if (selectedCategories.includes(category)) {
        setSelectedCategories(selectedCategories.filter((cat) => cat !== category));
      } else {
        setSelectedCategories([...selectedCategories, category]);
      }
    },
    [selectedCategories]
  );

  const getCategoryCount = (category: string) => {
    return spots.filter((spot) => spot.category.includes(category)).length;
  };

  // --- Restaurants food-type list generator (derive from data)
  const allFoodTypes = Array.from(
    new Set(
      ["All"].concat(
        restaurants.flatMap((r) =>
          r.food_type ? r.food_type.split(",").map((t) => t.trim()) : []
        )
      )
    )
  );

  // Toggle a food-type filter (multi-select behavior)
  const toggleFoodType = (type: string) => {
    if (type === "All") {
      setActiveFoodTypes(["All"]);
      return;
    }

    // remove 'All' if present
    let current = activeFoodTypes.filter((t) => t !== "All");

    if (current.includes(type)) {
      current = current.filter((t) => t !== type);
    } else {
      current = [...current, type];
    }
    // if none left, default to All
    if (current.length === 0) current = ["All"];
    setActiveFoodTypes(current);
  };

  // --- Helper for badge style (same as your destination style)
  const getCategoryBadgeStyle = (category: string) => {
    if (selectedCategories.includes(category)) {
      return "bg-primary/20 text-primary border border-primary/50";
    }
    return "bg-muted text-foreground dark:text-white";
  };

  // --- Helper for restaurant food badge style (same visual treatment)
  const getFoodBadgeStyle = (foodType: string) => {
    if (activeFoodTypes.includes(foodType)) {
      return "bg-primary/20 text-primary border border-primary/50";
    }
    return "bg-muted text-foreground dark:text-white";
  };

  // Ensure there's at least 'All' selected initially for restaurants
  useEffect(() => {
    if (activeFoodTypes.length === 0) setActiveFoodTypes(["All"]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-12">
        <div className="mb-12 text-center animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Explore <span className="text-primary">Albay</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover amazing destinations, hotels, and restaurants across the province
          </p>
        </div>

        {/* TABS */}
        <Tabs defaultValue="destinations" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="destinations">
              <MapPin className="w-4 h-4 mr-2" />
              Tourist Destinations
            </TabsTrigger>

            <TabsTrigger value="accommodations">
              <Building2 className="w-4 h-4 mr-2" />
              Hotels & Accommodations
            </TabsTrigger>

            <TabsTrigger value="restaurants">
              <Utensils className="w-4 h-4 mr-2" />
              Restaurants
            </TabsTrigger>
          </TabsList>

          {/* DESTINATIONS TAB */}
          <TabsContent value="destinations" className="space-y-8">
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

              {/* CATEGORY FILTER BUTTONS */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategories.length === 0 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategories([])}
                >
                  All ({spots.length})
                </Button>

                {allCategories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategories.includes(category) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCategoryClick(category)}
                  >
                    {category} ({getCategoryCount(category)})
                  </Button>
                ))}
              </div>
            </div>

            {/* SPOTS GRID */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSpots.length > 0 ? (
                filteredSpots.map((spot) => (
                  <Card
                    key={spot.id}
                    className="overflow-hidden hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
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

                      {/* CATEGORY BADGES */}
                      <div className="flex flex-wrap gap-2">
                        {spot.category.map((cat) => (
                          <Badge key={cat} className={getCategoryBadgeStyle(cat)}>
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-lg text-muted-foreground">
                  No destinations found
                </div>
              )}
            </div>
          </TabsContent>

          {/* ACCOMMODATIONS TAB */}
          <TabsContent value="accommodations">
            <AccommodationsSection userId={session?.user?.id} />
          </TabsContent>

          {/* RESTAURANTS TAB */}
          <TabsContent value="restaurants">
            <div className="space-y-6">
              {/* Header + Search */}
              <div className="space-y-4">
                <div className="relative max-w-3xl">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search restaurants, municipalities or barangays..."
                    className="pl-10"
                    value={restaurantSearch}
                    onChange={(e) => setRestaurantSearch(e.target.value)}
                  />
                </div>

                {/* Food Type Filters */}
                <div className="flex flex-wrap gap-2">
                  {/* Always show All button */}
                  <Button
                    variant={activeFoodTypes.includes("All") ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleFoodType("All")}
                  >
                    All ({restaurants.length})
                  </Button>

                  {allFoodTypes
                    .filter((t) => t !== "All")
                    .map((ft) => {
                      // count how many restaurants include this type
                      const count = restaurants.filter((r) =>
                        r.food_type?.toLowerCase().includes(ft.toLowerCase())
                      ).length;
                      return (
                        <Button
                          key={ft}
                          variant={activeFoodTypes.includes(ft) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleFoodType(ft)}
                        >
                          {ft} ({count})
                        </Button>
                      );
                    })}
                </div>
              </div>

              {/* Restaurants Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurantLoading ? (
                  <div className="col-span-full text-center py-12 text-muted-foreground">Loading restaurants...</div>
                ) : filteredRestaurants.length > 0 ? (
                  filteredRestaurants.map((restaurant) => (
                    <Card
                      key={restaurant.id}
                      className="overflow-hidden hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
                      onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                    >
                      <div className="h-48 overflow-hidden bg-muted">
                        <img
                          src={restaurant.image_url || PLACEHOLDER_IMAGE}
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <CardHeader>
                        <CardTitle className="flex items-start justify-between gap-2">
                          <span className="line-clamp-2">{restaurant.name}</span>
                        </CardTitle>
                      </CardHeader>

                      <CardContent>
                        {/* Split food types into individual badges and use same selected style */}
                        {restaurant.food_type && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {restaurant.food_type
                              .split(",")
                              .map((f) => f.trim())
                              .map((ft) => (
                                <Badge key={ft} className={getFoodBadgeStyle(ft)}>
                                  {ft}
                                </Badge>
                              ))}
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
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
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-lg text-muted-foreground">
                    No restaurants found
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Explore;