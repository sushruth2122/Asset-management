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
    <div className="hidden md:flex md:w-[65%] relative flex-col items-center justify-center bg-gradient-to-br from-primary/90 via-primary/70 to-accent/80 dark:from-[hsl(222,47%,8%)] dark:via-[hsl(220,30%,12%)] dark:to-[hsl(187,50%,15%)] text-white dark:text-foreground overflow-hidden">
      {/* Subtle decorative circles */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/10 dark:bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-white/10 dark:bg-primary/5 blur-3xl" />

      <div className="relative z-10 max-w-lg px-10 text-center space-y-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 dark:bg-primary/20 backdrop-blur-sm">
          <Box className="h-9 w-9" />
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
            Asset Management System
          </h1>
          <p className="text-lg text-white/80 dark:text-muted-foreground">
            Manage assets with intelligence
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4">
          {[
            { icon: Shield, label: 'Secure' },
            { icon: BarChart3, label: 'Analytics' },
            { icon: Wrench, label: 'Maintenance' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 rounded-xl bg-white/10 dark:bg-primary/10 p-4 backdrop-blur-sm"
            >
              <Icon className="h-6 w-6" />
              <span className="text-sm font-medium">{label}</span>
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
      if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
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

    navigate('/');
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
      <div className="flex w-full md:w-[35%] flex-col items-center justify-center p-6 sm:p-10 relative">
        {/* Theme toggle – top‑right corner */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[420px] space-y-6 animate-fade-in">
          {/* Mobile‑only branding */}
          <div className="flex items-center justify-center gap-3 md:hidden mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Box className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Astrikos Asset Manager</h1>
          </div>

          <Card className="shadow-lg border border-border/60 rounded-2xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">Welcome</CardTitle>
              <CardDescription>
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
