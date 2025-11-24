import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Accommodation {
  id: string;
  name: string;
  description: string | null;
  location: string;
  municipality: string | null;
  category: string[]; 
  price_range: string | null;
  image_url: string | null;
  rating: number;
}

const ACCOM_CATEGORIES = [
  "Luxury",
  "Mid-range",
  "Budget",
  "Resort",
  "Boutique",
  "Beach Resort",
  "Business Hotel",
];

export default function AccommodationsSection({ userId }: { userId?: string }) {
  const navigate = useNavigate();

  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [filtered, setFiltered] = useState<Accommodation[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // fetch list
  useEffect(() => {
    fetchAccommodations();
  }, []);

  const fetchAccommodations = async () => {
    const { data, error } = await supabase
      .from("accommodations")
      .select("*")
      .order("name");

    if (!error && data) {
      setAccommodations(data);
      setFiltered(data);
    }
  };

  // filtering logic
  useEffect(() => {
    let list = accommodations;

    // search filter
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.municipality?.toLowerCase().includes(q)
      );
    }

    // category filter
    if (selectedCategories.length > 0) {
      list = list.filter((a) =>
        selectedCategories.every((cat) => a.category.includes(cat))
      );
    }

    setFiltered(list);
  }, [search, selectedCategories, accommodations]);

  const toggleCategory = useCallback(
    (category: string) => {
      if (selectedCategories.includes(category)) {
        setSelectedCategories(selectedCategories.filter((c) => c !== category));
      } else {
        setSelectedCategories([...selectedCategories, category]);
      }
    },
    [selectedCategories]
  );

  const getBadgeStyle = (category: string) => {
    return selectedCategories.includes(category)
      ? "bg-primary/20 text-primary border border-primary/50"
      : "bg-muted text-foreground dark:text-white";
  };

  return (
    <div className="space-y-8">
      {/* search */}
      <div className="relative max-w-3xl">
        <Input
          placeholder="Search hotels or municipalities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* filter categories */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={selectedCategories.length === 0 ? "default" : "outline"}
          onClick={() => setSelectedCategories([])}
        >
          All ({accommodations.length})
        </Button>

        {ACCOM_CATEGORIES.map((cat) => (
          <Button
            key={cat}
            size="sm"
            variant={selectedCategories.includes(cat) ? "default" : "outline"}
            onClick={() => toggleCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length > 0 ? (
          filtered.map((a) => (
            <Card
              key={a.id}
              onClick={() => navigate(`/accommodation/${a.id}`)}
              className="overflow-hidden hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
            >
              <div className="h-48 overflow-hidden bg-muted">
                <img
                  src={a.image_url || "/placeholder.png"}
                  className="w-full h-full object-cover"
                />
              </div>

              <CardHeader>
                <CardTitle className="flex justify-between">
                  {a.name}
                  {a.rating > 0 && (
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-4 h-4" /> {a.rating}
                    </div>
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {a.description}
                </p>

                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                  <MapPin className="w-4 h-4" />
                  {a.municipality || a.location}
                </div>

                {/* category badges */}
                <div className="flex flex-wrap gap-2">
                  {a.category.map((cat) => (
                    <Badge key={cat} className={getBadgeStyle(cat)}>
                      {cat}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-lg text-muted-foreground">
            No accommodations found
          </div>
        )}
      </div>
    </div>
  );
}