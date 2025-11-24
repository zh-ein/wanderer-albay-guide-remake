import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReviewList } from "@/components/reviews/ReviewList";
import { MapPin, Phone, Star, ArrowLeft, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TouristSpot {
  id: string;
  name: string;
  description: string | null;
  location: string;
  municipality: string | null;
  category: string[];
  image_url: string | null;
  contact_number: string | null;
  rating: number;
  latitude: number | null;
  longitude: number | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  user_name: string;
}

const SpotDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [spot, setSpot] = useState<TouristSpot | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewRefreshTrigger, setReviewRefreshTrigger] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  // --- Session fetch
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // --- Fetch spot
  useEffect(() => {
    if (id) fetchSpot();
  }, [id]);

  const fetchSpot = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("tourist_spots").select("*").eq("id", id).single();
    if (!error && data) setSpot(data);
    setIsLoading(false);
  };

  // --- Fetch reviews
  useEffect(() => {
    if (!spot) return;
    fetchReviews();
  }, [spot, reviewRefreshTrigger]);

  const fetchReviews = async () => {
    setIsReviewsLoading(true);
    const { data: reviewsData, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("spot_id", spot!.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
      setIsReviewsLoading(false);
      return;
    }

    const enrichedReviews: Review[] = [];
    for (const review of reviewsData || []) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", review.user_id)
        .single();
      enrichedReviews.push({ ...review, user_name: profile?.full_name || "Anonymous" });
    }

    setReviews(enrichedReviews);
    setUserHasReviewed(enrichedReviews.some(r => r.user_id === session?.user?.id));
    setIsReviewsLoading(false);
  };

  // --- Explore-style badge (always unselected)
  const getCategoryBadgeStyle = (category: string) => {
    // If you want all badges to appear like Explore’s unselected style:
    return "bg-muted text-foreground dark:text-white";
    // If you want one “selected” badge per spot category, you can optionally return:
    // return "bg-primary/20 text-primary border border-primary/50";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12">
          <p className="text-center text-muted-foreground">Spot not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <Link to="/explore">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Explore
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {spot.image_url && (
              <div className="rounded-lg overflow-hidden shadow-lg">
                <img src={spot.image_url} alt={spot.name} className="w-full h-96 object-cover" />
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">{spot.name}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  {spot.category.map((cat) => (
                    <Badge key={cat} className={getCategoryBadgeStyle(cat)}>
                      {cat}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {spot.description && <p className="text-muted-foreground">{spot.description}</p>}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span>{spot.location}</span>
                  </div>
                  {spot.municipality && (
                    <div className="text-sm text-muted-foreground ml-7">{spot.municipality}</div>
                  )}
                  {spot.contact_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-primary" />
                      <span>{spot.contact_number}</span>
                    </div>
                  )}
                  {spot.rating > 0 && (
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{spot.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reviews & Ratings</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="reviews">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="reviews">All Reviews</TabsTrigger>
                    <TabsTrigger value="write" disabled={!session}>
                      {session ? "Write Review" : "Login to Review"}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="reviews" className="mt-6"> 
                    <ReviewList
                      {...({
                        spotId: spot.id,
                        currentUserId: session?.user?.id || null,
                        refreshTrigger: reviewRefreshTrigger,
                        reviews,
                        fetchReviews,
                      } as any)}
                    />
                  </TabsContent>

                  <TabsContent value="write" className="mt-6">
                    {session && (
                      <ReviewForm
                        spotId={spot.id}
                        userId={session.user.id}
                        onReviewSubmitted={() => setReviewRefreshTrigger((prev) => prev + 1)}
                        hasUserReviewed={userHasReviewed}
                      />
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {spot.latitude && spot.longitude && (
              <Card>
                <CardHeader>
                  <CardTitle>Location on Map</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Map view coming soon</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotDetail;