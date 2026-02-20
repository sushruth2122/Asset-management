import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Box, AlertCircle, Shield, BarChart3, Wrench } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters');

/* ── Branded Left Panel ── */
function BrandedPanel() {
  return (
    <div className="hidden md:flex md:w-[55%] relative flex-col items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-primary/70 dark:from-[hsl(224,50%,8%)] dark:via-[hsl(220,30%,10%)] dark:to-[hsl(199,40%,12%)] text-white dark:text-foreground overflow-hidden">
      {/* Subtle decorative circles */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-white/5 blur-3xl" />

      <div className="relative z-10 max-w-md px-10 text-center space-y-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 dark:bg-primary/20 backdrop-blur-sm">
          <Box className="h-7 w-7" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
            Asset Management System
          </h1>
          <p className="text-base text-white/70 dark:text-muted-foreground max-w-sm mx-auto">
            Manage assets with intelligence — monitoring, maintenance, and analytics in one platform.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-4">
          {[
            { icon: Shield, label: 'Secure' },
            { icon: BarChart3, label: 'Analytics' },
            { icon: Wrench, label: 'Maintenance' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 rounded-xl bg-white/10 dark:bg-primary/10 p-3.5 backdrop-blur-sm"
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Auth Page ── */
export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { user, role, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to their appropriate dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, role, loading, navigate]);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }

    setIsLoading(true);

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(error.message);
      }
      setIsLoading(false);
      return;
    }

    // Don't navigate here — the useEffect watching auth state will
    // redirect to the correct dashboard once role is resolved.
    // The `if (loading || user)` guard below shows a spinner until then.
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      nameSchema.parse(signupName);
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }

    setIsLoading(true);

    const { error } = await signUp(signupEmail, signupPassword, signupName);

    if (error) {
      if (error.message.includes('already registered')) {
        setError('This email is already registered. Please log in instead.');
      } else {
        setError(error.message);
      }
      setIsLoading(false);
      return;
    }

    setSuccess('Account created successfully! You are now logged in.');
    setIsLoading(false);
    
    // Redirect after short delay to show success message
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  // Show loading while checking auth state
  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col-reverse md:flex-row bg-background">
      {/* ── Left branded panel (hidden < md) ── */}
      <BrandedPanel />

      {/* ── Right form panel ── */}
      <div className="flex w-full md:w-[45%] flex-col items-center justify-center p-6 sm:p-10 relative">
        {/* Theme toggle – top‑right corner */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[400px] space-y-6 animate-fade-in">
          {/* Mobile‑only branding */}
          <div className="flex items-center justify-center gap-3 md:hidden mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Box className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-lg font-bold text-foreground">Astrikos Asset Manager</h1>
          </div>

          <Card className="shadow-lg border border-border/50 rounded-2xl">
            <CardHeader className="text-center pb-2 pt-6">
              <CardTitle className="text-xl font-semibold">Welcome back</CardTitle>
              <CardDescription className="text-sm">
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-4 border-success/50 text-success">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Astrikos. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
