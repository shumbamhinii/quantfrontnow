import React, { useState } from 'react';
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

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  userRoles: string[];
  userName: string | null;
}


const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    localStorage.getItem('isAuthenticated') === 'true'
  );

  const [userRoles, setUserRoles] = useState<string[]>(
    JSON.parse(localStorage.getItem('userRoles') || '[]')
  );

  const [userName, setUserName] = useState<string | null>(
    localStorage.getItem('userName')
  );

  const login = () => {
    setIsAuthenticated(true);
    setUserRoles(JSON.parse(localStorage.getItem('userRoles') || '[]'));
    setUserName(localStorage.getItem('userName'));
    localStorage.setItem('isAuthenticated', 'true');
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserRoles([]);
    setUserName(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        userRoles,
        userName,
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
  const { login } = useAuth();

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint =
        mode === 'login'
          ? 'http://localhost:3000/login'
          : 'http://localhost:3000/register';

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
  const user = data.user;
  const companyId = user.parent_user_id || user.user_id;
 const roles = Array.isArray(user.roles)
  ? user.roles
  : typeof user.role === 'string'
    ? [user.role]
    : [];


  // ✅ Store everything
  localStorage.setItem('token', data.token);
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('userId', user.user_id);
  localStorage.setItem('companyId', companyId);
  localStorage.setItem('userRoles', JSON.stringify(roles));
  localStorage.setItem('userName', user.name || '');

  login(); // Triggers context update
  toast({
    title: '✅ Login Successful',
    description: `Welcome back, ${user.name || 'User'}!`,
  });

  navigate('/');
}


 else {
          toast({
            title: '✅ Registration Successful',
            description: 'You can now log in.',
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

export const getUserId = () => localStorage.getItem('userId');
export const getCompanyId = () => localStorage.getItem('companyId');
export const getUserRoles = (): string[] => JSON.parse(localStorage.getItem('userRoles') || '[]');

export const getUserName = () => localStorage.getItem('userName');
export const isUserAdmin = () => getUserRoles().includes('admin');

