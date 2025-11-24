import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MapPin, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface TouristSpot {
  id: string;
  name: string;
  description: string | null;
  location: string;
  municipality: string | null;
  category: string[];
  contact_number: string | null;
  image_url: string | null;
}

interface Municipality {
  code: string;
  name: string;
}

interface Barangay {
  code: string;
  name: string;
}

const ManageSpots = () => {
  const [spots, setSpots] = useState<TouristSpot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSpot, setEditingSpot] = useState<TouristSpot | null>(null);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    municipality: "",
    contact_number: "",
    image_url: "",
    categories: [] as string[],
    is_hidden_gem: false,
  });

  const availableCategories = ["Nature", "Culture", "Adventure", "Food", "Beach", "Heritage", "Cafes","ATV Rides", "Caving", "Hiking", "Churches", "Crafts", "Festivals", "Island Hopping", "Lakes", "Local Cuisine", "Museums", "Parks", "Resorts", "Waterfalls", "Snorkeling", "Street Food", "Sunset Views", "Volcanoes", "Ziplines"];

  useEffect(() => {
    fetchSpots();
    fetchMunicipalities();
  }, []);

  const fetchSpots = async () => {
    const { data, error } = await supabase
      .from("tourist_spots")
      .select("*")
      .order("name");

    if (!error && data) setSpots(data);
  };

  /** ✅ Fetch both municipalities and component cities for Albay */
  const fetchMunicipalities = async () => {
    try {
      const [muniRes, cityRes] = await Promise.all([
        fetch("https://psgc.gitlab.io/api/provinces/050500000/municipalities/"),
        fetch("https://psgc.gitlab.io/api/provinces/050500000/cities/"),
      ]);

      const [muniData, cityData] = await Promise.all([
        muniRes.json(),
        cityRes.json(),
      ]);

      const merged = [...(muniData || []), ...(cityData || [])];

      if (Array.isArray(merged)) {
        const sorted = merged
          .map((m: any) => ({ code: m.code, name: m.name }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setMunicipalities(sorted);
      } else {
        toast.error("Unexpected data format for municipalities/cities");
      }
    } catch (error) {
      console.error("Error fetching municipalities and cities:", error);
      toast.error("Failed to load municipalities and cities");
    }
  };

  /** ✅ Fetch barangays for both municipality & city codes */
  const fetchBarangays = async (code: string) => {
    try {
      let response = await fetch(`https://psgc.gitlab.io/api/municipalities/${code}/barangays/`);
      if (!response.ok) {
        response = await fetch(`https://psgc.gitlab.io/api/cities/${code}/barangays/`);
      }
      const data = await response.json();

      if (Array.isArray(data)) {
        const sorted = data
          .map((b: any) => ({ code: b.code, name: b.name }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setBarangays(sorted);
      } else {
        toast.error("Unexpected data format for barangays");
      }
    } catch (error) {
      console.error("Error fetching barangays:", error);
      toast.error("Failed to load barangays");
    }
  };

  const handleMunicipalityChange = (code: string) => {
    const selectedMunicipality = municipalities.find((m) => m.code === code);
    setFormData((prev) => ({
      ...prev,
      municipality: selectedMunicipality?.name || "",
      location: "",
    }));
    setBarangays([]);
    if (code) fetchBarangays(code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const spotData = {
      name: formData.name,
      description: formData.description || null,
      location: formData.location,
      municipality: formData.municipality || null,
      contact_number: formData.contact_number || null,
      image_url: formData.image_url || null,
      category: formData.categories,
      is_hidden_gem: formData.is_hidden_gem,
    };

    const { error } = editingSpot
      ? await supabase.from("tourist_spots").update(spotData).eq("id", editingSpot.id)
      : await supabase.from("tourist_spots").insert([spotData]);

    if (error) toast.error(`Failed to ${editingSpot ? "update" : "add"} spot`);
    else {
      toast.success(`Spot ${editingSpot ? "updated" : "added"} successfully`);
      resetForm();
      fetchSpots();
    }

    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tourist spot?")) return;

    const { error } = await supabase.from("tourist_spots").delete().eq("id", id);

    if (error) toast.error("Failed to delete spot");
    else {
      toast.success("Spot deleted successfully");
      fetchSpots();
    }
  };

  const handleEdit = (spot: any) => {
    setEditingSpot(spot);
    setFormData({
      name: spot.name,
      description: spot.description || "",
      location: spot.location,
      municipality: spot.municipality || "",
      contact_number: spot.contact_number || "",
      image_url: spot.image_url || "",
      categories: spot.category,
      is_hidden_gem: spot.is_hidden_gem || false,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      location: "",
      municipality: "",
      contact_number: "",
      image_url: "",
      categories: [],
      is_hidden_gem: false,
    });
    setBarangays([]);
    setEditingSpot(null);
    setIsDialogOpen(false);
  };

  const toggleCategory = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Tourist Spots ({spots.length})</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Spot
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSpot ? "Edit" : "Add"} Tourist Spot</DialogTitle>
              <DialogDescription>
                Fill in the details for the tourist spot
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Municipality/City Dropdown */}
              <div>
                <Label>Municipality or City *</Label>
                <Select
                  onValueChange={handleMunicipalityChange}
                  value={
                    municipalities.find((m) => m.name === formData.municipality)?.code || ""
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select municipality or city" />
                  </SelectTrigger>
                  <SelectContent>
                    {municipalities.map((m) => (
                      <SelectItem key={m.code} value={m.code}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Barangay (Location) Dropdown */}
              <div>
                <Label>Location (Barangay) *</Label>
                <Select
                  onValueChange={(code) => {
                    const barangay = barangays.find((b) => b.code === code);
                    setFormData((prev) => ({ ...prev, location: barangay?.name || "" }));
                  }}
                  value={
                    barangays.find((b) => b.name === formData.location)?.code || ""
                  }
                  disabled={!barangays.length}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        barangays.length
                          ? "Select a barangay"
                          : "Select municipality first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {barangays.map((b) => (
                      <SelectItem key={b.code} value={b.code}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div>
                <Label>Contact Number</Label>
                <Input
                  value={formData.contact_number}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_number: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Image URL</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label className="mb-3 block">Categories *</Label>
                <div className="grid grid-cols-2 gap-3">
                  {availableCategories.map((category) => (
                    <div
                      key={category}
                      className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted"
                    >
                      <Checkbox
                        checked={formData.categories.includes(category)}
                        onCheckedChange={() => toggleCategory(category)}
                      />
                      <label className="cursor-pointer select-none">{category}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2 p-4 border-2 border-primary/50 rounded-lg bg-primary/5">
                <Checkbox
                  checked={formData.is_hidden_gem}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_hidden_gem: !!checked })
                  }
                />
                <div>
                  <label className="cursor-pointer select-none font-medium">
                    💎 Mark as Hidden Gem
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Featured on homepage as a special discovery
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading || formData.categories.length === 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>{editingSpot ? "Update" : "Add"} Spot</>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {spots.map((spot) => (
          <Card key={spot.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="mb-2">{spot.name}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4" />
                    {spot.location}, {spot.municipality}
                  </div>
                  {spot.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {spot.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {spot.category.map((cat) => (
                      <Badge key={cat} variant="secondary">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(spot)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(spot.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ManageSpots;
