import { useState } from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TurfTimeLogo } from '@/components/TurfTimeLogo';
import { User, Store, ChevronRight } from 'lucide-react';

export default function ProfileSetup() {
  const { setupProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!fullName.trim()) { setError('Please enter your full name'); return; }
    if (!selectedRole) { setError('Please select your role'); return; }
    setLoading(true);
    setError('');
    try {
      await setupProfile(fullName.trim(), selectedRole);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-8">
        <TurfTimeLogo size="lg" />
      </div>

      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Set Up Your Profile</h1>
          <p className="text-muted-foreground text-sm">Tell us a bit about yourself to get started</p>
        </div>

        {/* Full Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Full Name</label>
          <Input
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-12 bg-card border-border focus:border-primary"
          />
        </div>

        {/* Role Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">I am a...</label>
          
          {/* User Role */}
          <button
            onClick={() => setSelectedRole('user')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
              selectedRole === 'user'
                ? 'border-primary bg-accent/30'
                : 'border-border bg-card hover:border-muted-foreground/40'
            }`}
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
              selectedRole === 'user' ? 'bg-primary' : 'bg-muted'
            }`}>
              <User className={`w-5 h-5 ${selectedRole === 'user' ? 'text-black' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Player</p>
              <p className="text-xs text-muted-foreground">Discover and book sports turfs</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              selectedRole === 'user' ? 'border-primary bg-primary' : 'border-muted-foreground/40'
            }`}>
              {selectedRole === 'user' && <div className="w-2 h-2 rounded-full bg-black" />}
            </div>
          </button>

          {/* Owner Role */}
          <button
            onClick={() => setSelectedRole('owner')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
              selectedRole === 'owner'
                ? 'border-primary bg-accent/30'
                : 'border-border bg-card hover:border-muted-foreground/40'
            }`}
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
              selectedRole === 'owner' ? 'bg-primary' : 'bg-muted'
            }`}>
              <Store className={`w-5 h-5 ${selectedRole === 'owner' ? 'text-black' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Turf Owner</p>
              <p className="text-xs text-muted-foreground">List and manage your sports facilities</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              selectedRole === 'owner' ? 'border-primary bg-primary' : 'border-muted-foreground/40'
            }`}>
              {selectedRole === 'owner' && <div className="w-2 h-2 rounded-full bg-black" />}
            </div>
          </button>
        </div>

        {/* Owner approval notice */}
        {selectedRole === 'owner' && (
          <div className="bg-accent/20 border border-primary/20 rounded-xl p-4">
            <p className="text-sm text-muted-foreground">
              <span className="text-primary font-medium">Note:</span> Turf owners require admin approval before you can list turfs. You can submit your application right away!
            </p>
          </div>
        )}

        {error && (
          <p className="text-destructive text-sm text-center">{error}</p>
        )}

        <Button
          onClick={handleContinue}
          disabled={loading || !fullName.trim() || !selectedRole}
          className="w-full h-12 text-base font-semibold"
        >
          {loading ? 'Setting up...' : (
            <span className="flex items-center gap-2">
              Continue <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
