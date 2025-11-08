import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Loader2, Mountain, Church, Waves, UtensilsCrossed, MapPin } from "lucide-react";

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
  userId: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  description: string;
}

interface UserPreferences {
  categories: string[];
  subcategories: string[];
  districts: string[];
  travelStyle: string;
  travelPace: string;
}

export const OnboardingModal = ({ open, onComplete, userId }: OnboardingModalProps) => {
  const [step, setStep] = useState(1);
  const totalSteps = 7;
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    categories: [],
    subcategories: [],
    districts: [],
    travelStyle: "",
    travelPace: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (!error && data) {
      setCategories(data);
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

  const districtOptions = [
    { name: "District 1", subtitle: "Coastal Wonders", icon: "🐚" },
    { name: "District 2", subtitle: "Central Adventure", icon: "🌋" },
    { name: "District 3", subtitle: "Countryside Escapes", icon: "🌾" },
  ];

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          onboarding_complete: true,
          onboarding_answers: preferences as any,
          user_preferences: preferences as any,
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Welcome to Wanderer! 🌋 Your profile is ready.");
      onComplete();
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return true; // Welcome screen
      case 2:
        return preferences.categories.length > 0;
      case 3:
        return preferences.subcategories.length > 0;
      case 4:
        return preferences.districts.length > 0;
      case 5:
        return preferences.travelStyle !== "";
      case 6:
        return preferences.travelPace !== "";
      default:
        return true;
    }
  };

  const toggleCategory = (categoryName: string) => {
    setPreferences((prev) => ({
      ...prev,
      categories: prev.categories.includes(categoryName)
        ? prev.categories.filter((c) => c !== categoryName)
        : [...prev.categories, categoryName],
    }));
  };

  const toggleSubcategory = (subcategoryName: string) => {
    setPreferences((prev) => ({
      ...prev,
      subcategories: prev.subcategories.includes(subcategoryName)
        ? prev.subcategories.filter((s) => s !== subcategoryName)
        : [...prev.subcategories, subcategoryName],
    }));
  };

  const toggleDistrict = (district: string) => {
    setPreferences((prev) => ({
      ...prev,
      districts: prev.districts.includes(district)
        ? prev.districts.filter((d) => d !== district)
        : [...prev.districts, district],
    }));
  };

  const getFilteredSubcategories = () => {
    if (preferences.categories.length === 0) return subcategories;
    
    const selectedCategoryIds = categories
      .filter((c) => preferences.categories.includes(c.name))
      .map((c) => c.id);
    
    return subcategories.filter((s) =>
      selectedCategoryIds.includes(s.category_id)
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="text-center space-y-6 py-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 mb-4">
              <Sparkles className="w-12 h-12 text-accent" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold">
              Welcome to Wanderer 🌋
            </h2>
            <p className="text-xl text-muted-foreground max-w-md mx-auto">
              Your Smart Albay Travel Companion!
            </p>
            <p className="text-muted-foreground">
              Let's personalize your travel experience with a few quick questions.
            </p>
          </div>
        );

      case 2:
        return (
          <Card className="border-2 shadow-lg animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-accent" />
                Choose What You Love
              </CardTitle>
              <CardDescription>
                What kind of traveler are you? Select all that match your interests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    onClick={() => toggleCategory(category.name)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      preferences.categories.includes(category.name)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={preferences.categories.includes(category.name)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{category.icon}</span>
                          <h3 className="font-semibold text-lg">{category.name}</h3>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="border-2 shadow-lg animate-fade-in">
            <CardHeader>
              <CardTitle>Select Subcategories</CardTitle>
              <CardDescription>
                Choose specific activities and experiences you'd like
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                {getFilteredSubcategories().map((subcategory) => (
                  <div
                    key={subcategory.id}
                    onClick={() => toggleSubcategory(subcategory.name)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      preferences.subcategories.includes(subcategory.name)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={preferences.subcategories.includes(subcategory.name)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{subcategory.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {subcategory.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="border-2 shadow-lg animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-6 h-6 text-primary" />
                Choose Districts in Albay
              </CardTitle>
              <CardDescription>
                Which parts of Albay would you like to explore?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {districtOptions.map((district) => (
                <div
                  key={district.name}
                  onClick={() => toggleDistrict(district.name)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    preferences.districts.includes(district.name)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={preferences.districts.includes(district.name)}
                      className="mt-1"
                    />
                    <div className="flex-1 flex items-center gap-4">
                      <div className="text-4xl">{district.icon}</div>
                      <div>
                        <p className="font-bold text-lg">{district.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {district.subtitle}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card className="border-2 shadow-lg animate-fade-in">
            <CardHeader>
              <CardTitle>Choose Travel Style</CardTitle>
              <CardDescription>Who are you traveling with?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: "Solo", icon: "🚶" },
                  { name: "Couple", icon: "💑" },
                  { name: "Family", icon: "👨‍👩‍👧" },
                  { name: "Friends", icon: "👥" },
                ].map((style) => (
                  <div
                    key={style.name}
                    onClick={() =>
                      setPreferences((prev) => ({ ...prev, travelStyle: style.name }))
                    }
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      preferences.travelStyle === style.name
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="text-center space-y-2">
                      <div className="text-4xl">{style.icon}</div>
                      <p className="font-medium">{style.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <Card className="border-2 shadow-lg animate-fade-in">
            <CardHeader>
              <CardTitle>Choose Travel Pace</CardTitle>
              <CardDescription>
                What kind of travel experience do you prefer?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { name: "Relaxing", icon: "🕊️", desc: "Take it slow and enjoy the moments" },
                  { name: "Thrilling", icon: "⚡", desc: "Packed with action and adventure" },
                  { name: "Balanced", icon: "🎒", desc: "Mix of relaxation and exploration" },
                ].map((pace) => (
                  <div
                    key={pace.name}
                    onClick={() =>
                      setPreferences((prev) => ({ ...prev, travelPace: pace.name }))
                    }
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      preferences.travelPace === pace.name
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{pace.icon}</div>
                      <div>
                        <p className="font-bold text-lg">{pace.name}</p>
                        <p className="text-sm text-muted-foreground">{pace.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 7:
        return (
          <div className="text-center space-y-6 py-8 animate-fade-in">
            <div className="text-6xl">🌋</div>
            <h2 className="text-3xl font-bold">Thanks, Traveler!</h2>
            <p className="text-lg text-muted-foreground">
              Your Wanderer profile is ready.
            </p>
            <div className="text-sm text-muted-foreground space-y-2 text-left max-w-md mx-auto bg-muted/30 p-6 rounded-lg">
              <p>📍 <strong>Districts:</strong> {preferences.districts.join(", ")}</p>
              <p>🎯 <strong>Interests:</strong> {preferences.categories.join(", ")}</p>
              <p>✨ <strong>Activities:</strong> {preferences.subcategories.slice(0, 3).join(", ")}{preferences.subcategories.length > 3 ? "..." : ""}</p>
              <p>👥 <strong>Travel Style:</strong> {preferences.travelStyle}</p>
              <p>⚡ <strong>Pace:</strong> {preferences.travelPace}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getButtonText = () => {
    if (step === 1) return "Start Onboarding";
    if (step === totalSteps) return "Explore Albay";
    return "Continue";
  };

  const handleNext = () => {
    if (step === totalSteps) {
      handleSubmit();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {renderStep()}

          <div className="flex justify-between items-center pt-4">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={isLoading}
              >
                Back
              </Button>
            )}
            <Button
              className={`gap-2 ${step === 1 ? "w-full" : "ml-auto"}`}
              onClick={handleNext}
              disabled={!canProceed() || isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {getButtonText()}
                </>
              )}
            </Button>
          </div>

          {step > 1 && step < totalSteps && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Step {step - 1} of {totalSteps - 2}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
