import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, ImagePlus, Clock, MapPin, ChevronDown, Upload, X, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

const sportOptions = ['Cricket', 'Football', 'Basketball', 'Tennis', 'Badminton', 'Volleyball'];
const amenityOptions = ['Parking', 'WiFi', 'Showers', 'Changing Room', 'Cafeteria', 'Floodlights', 'First Aid'];

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&h=600&fit=crop';

// Convert "HH:MM" 24h → display "H AM/PM"
function to12h(time24: string): string {
  const [h] = time24.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:00 ${ampm}`;
}

// Parse a 24h string into { hour12: number, ampm: 'AM'|'PM' }
function parse12h(time24: string): { hour12: number; ampm: 'AM' | 'PM' } {
  const [h] = time24.split(':').map(Number);
  return { hour12: h % 12 === 0 ? 12 : h % 12, ampm: h < 12 ? 'AM' : 'PM' };
}

// Compose back to 24h string
function to24h(hour12: number, ampm: 'AM' | 'PM'): string {
  let h = hour12 % 12;
  if (ampm === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:00`;
}

const HOUR_OPTIONS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export default function AddTurf() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: cities = [] } = useQuery<string[]>({
    queryKey: ['/api/cities'],
  });

  const [form, setForm] = useState({
    name: '',
    city: '',
    location: '',
    address: '',
    pricePerHour: '',
    openingTime: '06:00',
    closingTime: '23:00',
    imageUrl: DEFAULT_IMAGE,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const [openHourOpen, setOpenHourOpen] = useState(false);
  const [closeHourOpen, setCloseHourOpen] = useState(false);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10 MB.');
      return;
    }
    setImageUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      // Show preview immediately
      setImagePreview(dataUrl);
      try {
        // Strip the "data:<mime>;base64," prefix to get raw base64
        const [meta, base64] = dataUrl.split(',');
        const mimeType = meta.split(':')[1].split(';')[0];
        const res = await fetch('/api/images/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: base64, mimeType }),
        });
        if (!res.ok) throw new Error('Upload failed');
        const { url } = await res.json();
        // Store the server URL reference, not the raw base64
        setForm(f => ({ ...f, imageUrl: url }));
      } catch {
        setError('Image upload failed. Please try again.');
        setImagePreview(null);
      } finally {
        setImageUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/owner/turfs', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/owner/turfs/${user?.id}`] });
      setSubmitted(true);
    },
    onError: (err: Error) => {
      try {
        // err.message is "STATUS: {json body}"
        const jsonStr = err.message.replace(/^\d+:\s*/, '');
        const body = JSON.parse(jsonStr);
        setError(body.error || err.message);
      } catch {
        setError(err.message || 'Failed to submit turf. Please try again.');
      }
    },
  });

  const toggle = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

  const handleSubmit = () => {
    if (!form.name || !form.city || !form.location || !form.address || !form.pricePerHour) {
      setError('Please fill in all required fields.');
      return;
    }
    if (selectedSports.length === 0) { setError('Select at least one sport type.'); return; }
    setError('');
    mutation.mutate({
      name: form.name,
      city: form.city,
      location: form.location,
      address: form.address,
      pricePerHour: parseInt(form.pricePerHour),
      openingTime: form.openingTime,
      closingTime: form.closingTime,
      imageUrl: form.imageUrl,
      sportTypes: selectedSports,
      amenities: selectedAmenities,
      ownerId: user?.id,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Submitted!</h2>
        <p className="text-muted-foreground text-sm mb-8 max-w-xs">
          Your turf has been submitted for admin approval. You'll be able to see it in "My Turfs" once approved.
        </p>
        <Button onClick={() => navigate('/owner')} className="w-full max-w-xs">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <Button size="icon" variant="ghost" onClick={() => navigate('/owner')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Add New Turf</h1>
      </header>

      <main className="px-4 pt-6 space-y-6">
        {/* Basic Info */}
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold text-foreground">Basic Information</h2>

          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">City *</label>
            <Popover open={cityOpen} onOpenChange={setCityOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full h-10 justify-start gap-2 bg-background border-border text-foreground font-normal">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className={`flex-1 text-left ${!form.city ? 'text-muted-foreground' : ''}`}>
                    {form.city || 'Select a city'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search city..." className="h-9" />
                  <CommandList className="max-h-52">
                    <CommandEmpty>No city found.</CommandEmpty>
                    <CommandGroup>
                      {cities.map(city => (
                        <CommandItem
                          key={city}
                          value={city}
                          onSelect={() => {
                            setForm(f => ({ ...f, city }));
                            setCityOpen(false);
                          }}
                        >
                          <Check className={`mr-2 w-4 h-4 ${form.city === city ? 'opacity-100 text-primary' : 'opacity-0'}`} />
                          {city}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Turf Name *</label>
            <Input placeholder="e.g. Green Valley Cricket Ground" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-background" />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Location / Area *</label>
            <Input placeholder="e.g. Indiranagar, Bangalore" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="bg-background" />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Full Address *</label>
            <Input placeholder="e.g. 123 Sports Complex, Indiranagar" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="bg-background" />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Price per Hour (₹) *</label>
            <Input type="number" placeholder="e.g. 1200" value={form.pricePerHour} onChange={e => setForm(f => ({ ...f, pricePerHour: e.target.value }))} className="bg-background" />
          </div>
        </Card>

        {/* Timing */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Operating Hours</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Opening Time */}
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Opening Time</label>
              <div className="flex gap-2">
                {/* Hour picker */}
                <Popover open={openHourOpen} onOpenChange={setOpenHourOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 h-10 justify-between bg-background border-border font-semibold text-foreground">
                      {parse12h(form.openingTime).hour12}
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-24 p-0" align="start">
                    <Command>
                      <CommandList className="max-h-48">
                        <CommandGroup>
                          {HOUR_OPTIONS.map(h => (
                            <CommandItem
                              key={h}
                              value={String(h)}
                              onSelect={() => {
                                const { ampm } = parse12h(form.openingTime);
                                setForm(f => ({ ...f, openingTime: to24h(h, ampm) }));
                                setOpenHourOpen(false);
                              }}
                            >
                              <Check className={`mr-2 w-4 h-4 flex-shrink-0 ${parse12h(form.openingTime).hour12 === h ? 'opacity-100 text-primary' : 'opacity-0'}`} />
                              <span className={parse12h(form.openingTime).hour12 === h ? 'text-primary font-bold' : ''}>{h}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {/* AM / PM toggle */}
                <div className="flex rounded-md border border-border overflow-hidden">
                  {(['AM', 'PM'] as const).map(ap => (
                    <button
                      key={ap}
                      type="button"
                      onClick={() => {
                        const { hour12 } = parse12h(form.openingTime);
                        setForm(f => ({ ...f, openingTime: to24h(hour12, ap) }));
                      }}
                      className={`px-3 h-10 text-sm font-semibold transition-colors ${
                        parse12h(form.openingTime).ampm === ap
                          ? 'bg-primary text-black'
                          : 'bg-background text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {ap}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Closing Time */}
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Closing Time</label>
              <div className="flex gap-2">
                {/* Hour picker */}
                <Popover open={closeHourOpen} onOpenChange={setCloseHourOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 h-10 justify-between bg-background border-border font-semibold text-foreground">
                      {parse12h(form.closingTime).hour12}
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-24 p-0" align="start">
                    <Command>
                      <CommandList className="max-h-48">
                        <CommandGroup>
                          {HOUR_OPTIONS.map(h => (
                            <CommandItem
                              key={h}
                              value={String(h)}
                              onSelect={() => {
                                const { ampm } = parse12h(form.closingTime);
                                setForm(f => ({ ...f, closingTime: to24h(h, ampm) }));
                                setCloseHourOpen(false);
                              }}
                            >
                              <Check className={`mr-2 w-4 h-4 flex-shrink-0 ${parse12h(form.closingTime).hour12 === h ? 'opacity-100 text-primary' : 'opacity-0'}`} />
                              <span className={parse12h(form.closingTime).hour12 === h ? 'text-primary font-bold' : ''}>{h}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {/* AM / PM toggle */}
                <div className="flex rounded-md border border-border overflow-hidden">
                  {(['AM', 'PM'] as const).map(ap => (
                    <button
                      key={ap}
                      type="button"
                      onClick={() => {
                        const { hour12 } = parse12h(form.closingTime);
                        setForm(f => ({ ...f, closingTime: to24h(hour12, ap) }));
                      }}
                      className={`px-3 h-10 text-sm font-semibold transition-colors ${
                        parse12h(form.closingTime).ampm === ap
                          ? 'bg-primary text-black'
                          : 'bg-background text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {ap}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Summary badge */}
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
            <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <p className="text-xs text-foreground">
              Open <span className="font-semibold text-primary">{to12h(form.openingTime)}</span> to <span className="font-semibold text-primary">{to12h(form.closingTime)}</span>
            </p>
          </div>
        </Card>

        {/* Sport Types */}
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold text-foreground">Sport Types *</h2>
          <div className="flex flex-wrap gap-2">
            {sportOptions.map(sport => (
              <button
                key={sport}
                onClick={() => setSelectedSports(s => toggle(s, sport))}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  selectedSports.includes(sport)
                    ? 'bg-primary text-black border-primary'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/40'
                }`}
              >
                {sport}
              </button>
            ))}
          </div>
        </Card>

        {/* Amenities */}
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold text-foreground">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {amenityOptions.map(amenity => (
              <button
                key={amenity}
                onClick={() => setSelectedAmenities(a => toggle(a, amenity))}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  selectedAmenities.includes(amenity)
                    ? 'bg-primary text-black border-primary'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/40'
                }`}
              >
                {amenity}
              </button>
            ))}
          </div>
        </Card>

        {/* Image Upload */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ImagePlus className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Turf Image</h2>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleImageFile(file);
            }}
          />

          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden">
              <img src={imagePreview} alt="Preview" className="w-full h-44 object-cover" />
              <button
                onClick={() => {
                  setImagePreview(null);
                  setForm(f => ({ ...f, imageUrl: DEFAULT_IMAGE }));
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="absolute bottom-2 left-2 bg-black/60 rounded-lg px-2 py-1">
                <p className="text-xs text-white">Tap to change</p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-36 bg-muted rounded-xl flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border hover:border-primary/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Upload turf photo</p>
              <p className="text-xs text-muted-foreground">JPG, PNG or WEBP · Max 5 MB</p>
            </button>
          )}

          {imageUploading && (
            <p className="text-xs text-muted-foreground text-center">Processing image...</p>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-3.5 h-3.5 mr-2" />
            {imagePreview ? 'Change Photo' : 'Choose Photo'}
          </Button>
        </Card>

        {error && (
          <p className="text-destructive text-sm text-center">{error}</p>
        )}

        <Button
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="w-full h-12 text-base font-semibold"
        >
          {mutation.isPending ? 'Submitting...' : 'Submit for Approval'}
        </Button>
      </main>
    </div>
  );
}
