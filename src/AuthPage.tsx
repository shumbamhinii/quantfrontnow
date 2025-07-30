import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

// Define the shape of the authentication context
interface AuthContextType {
  isAuthenticated: boolean;
  authToken: string | null;
  userEmail: string | null;
  userPermissions: string[];
  signIn: (email: string, token: string) => void;
  signOut: () => void; // Keep signOut for internal clarity
  logout: () => void; // Add logout as an alias for external use
  hasPermission: (permission: string) => boolean;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// AuthProvider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // On mount, try to load auth state from localStorage
    const storedToken = localStorage.getItem('token');
    const storedEmail = localStorage.getItem('userEmail');
    const storedPermissions = localStorage.getItem('userPermissions');

    if (storedToken && storedEmail) {
      setIsAuthenticated(true);
      setAuthToken(storedToken);
      setUserEmail(storedEmail);
      try {
        setUserPermissions(storedPermissions ? JSON.parse(storedPermissions) : []);
      } catch (e) {
        console.error('Failed to parse stored permissions:', e);
        setUserPermissions([]);
      }
    }
  }, []);

  const signIn = (email: string, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userEmail', email);

    // --- Simulate assigning permissions based on email for demonstration ---
    // In a real app, you would fetch these from your backend after login.
    let permissions: string[] = [];
    if (email === 'admin@example.com') {
      permissions = ['create_product', 'delete_product', 'submit_sale', 'view_all_data'];
    } else if (email === 'sales@example.com') {
      permissions = ['submit_sale', 'view_all_data'];
    } else if (email === 'inventory@example.com') {
      permissions = ['create_product', 'view_all_data'];
    } else {
      permissions = ['view_all_data']; // Default permissions for other users
    }
    localStorage.setItem('userPermissions', JSON.stringify(permissions));
    // --- End simulation ---

    setIsAuthenticated(true);
    setAuthToken(token);
    setUserEmail(email);
    setUserPermissions(permissions);

    toast({
      title: 'Login Successful',
      description: `Welcome, ${email}!`,
      variant: 'default',
    });
  };

  const internalSignOut = () => { // Renamed to avoid conflict with exposed signOut
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPermissions');
    setIsAuthenticated(false);
    setAuthToken(null);
    setUserEmail(null);
    setUserPermissions([]);
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
      variant: 'default',
    });
  };

  // Expose logout as an alias for internalSignOut
  const logout = internalSignOut;

  const hasPermission = useCallback((permission: string) => {
    return userPermissions.includes(permission);
  }, [userPermissions]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        authToken,
        userEmail,
        userPermissions,
        signIn,
        signOut: internalSignOut, // Map signOut to internalSignOut
        logout, // Expose logout
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuth(); // Still use signIn from the context

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint =
        mode === 'login'
          ? 'https://quantnow.onrender.com/login'
          : 'https://quantnow.onrender.com/register';

      const payload =
        mode === 'login'
          ? { email, password }
          : { name, email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        if (mode === 'login') {
          signIn(email, data.token);
          navigate('/');
        } else {
          toast({
            title: '✅ Registration Successful',
            description: 'You can now log in.',
            variant: 'default',
          });
          setMode('login');
        }
      } else {
        toast({
          title: '❌ Failed',
          description: data.error || 'An error occurred.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '🚨 Error',
        description: 'Something went wrong.',
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {mode === 'login' ? 'Login to QxAnalytix' : 'Register for QxAnalytix'}
          </CardTitle>
          <CardDescription>
            {mode === 'login'
              ? 'Enter your credentials to access your dashboard.'
              : 'Create an account to get started.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'login' ? 'Logging in...' : 'Registering...'}
                </>
              ) : (
                mode === 'login' ? 'Login' : 'Register'
              )}
            </Button>
          </form>
          <div className="text-sm text-center mt-4">
            {mode === 'login' ? (
              <>
                Don’t have an account?{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-blue-600 hover:underline"
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-blue-600 hover:underline"
                >
                  Login
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
