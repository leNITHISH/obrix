// src/components/Auth.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Auth() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  // separate email states for login and signup
  const [loginEmail, setLoginEmail] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupDisplayName, setSignupDisplayName] = useState('');
  const [open, setOpen] = useState(false);
  const [needDisplayName, setNeedDisplayName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [showUserPanel, setShowUserPanel] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password
      });
      if (error) {
        alert(error.error_description || error.message);
      } else {
        setOpen(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (!signupDisplayName.trim()) {
        alert('Please enter a display name.');
        return;
      }
      const { error } = await supabase.auth.signUp({
        email: signupEmail.trim(),
        password,
        options: { data: { display_name: signupDisplayName.trim() } }
      });
      if (error) {
        alert(error.error_description || error.message);
      } else {
        alert('Check your email for the confirmation link!');
        setOpen(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) alert(error.error_description || error.message);
    setLoading(false);
  };

  // After login, ensure display_name exists; if missing, prompt user to set it
  useEffect(() => {
    if (!session) return;
    const metadata = session.user?.user_metadata || {};
    if (!metadata.display_name) {
      setNeedDisplayName(true);
      setNewDisplayName('');
    }
  }, [session]);

  const saveDisplayName = async (e) => {
    e?.preventDefault?.();
    if (!newDisplayName.trim()) {
      alert('Display name is required');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ data: { display_name: newDisplayName.trim() } });
    setLoading(false);
    if (error) {
      alert(error.message);
    } else {
      setNeedDisplayName(false);
    }
  };

  if (session) {
    const displayName = session.user.user_metadata?.display_name || '';
    const initial = (displayName || session.user.email || 'U').trim().charAt(0).toUpperCase();
    return (
      <div className="relative flex items-center gap-3">
        {/* Missing display name dialog */}
        <Dialog open={needDisplayName} onOpenChange={setNeedDisplayName}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Set your display name</DialogTitle>
              <DialogDescription>
                Add a display name to personalize your contributions.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={saveDisplayName} className="space-y-4">
              <div>
                <Label htmlFor="display-name">Display name</Label>
                <Input id="display-name" value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} required />
              </div>
              {/* THEMED: Changed to default primary button */}
              <Button type="submit" disabled={loading}> 
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {!showUserPanel && (
          <button onClick={() => setShowUserPanel(true)} className="rounded-full" style={{ padding: 2 }}>
            <Avatar>
              <AvatarFallback className="bg-[#3a3b39] text-[#63ff0f]">{initial}</AvatarFallback>
            </Avatar>
          </button>
        )}
        {showUserPanel && (
          <div className="flex items-center gap-3 bg-black/60 rounded-md px-3 py-2">
            <p className="text-sm text-white">{session.user.email}</p>
            {/* THEMED: Changed to default primary button */}
            <Button onClick={handleLogout} disabled={loading}>
              {loading ? 'Logging out...' : 'Log Out'}
            </Button>
            {/* THEMED: Changed to default outline button (variant="outline" is default) */}
            <Button variant="outline" onClick={() => setShowUserPanel(false)}> 
              Close
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* THEMED: Changed to default primary button */}
        <Button>
          Login
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to Obrix WiFi Mapper</DialogTitle>
          <DialogDescription>
            Log in or create an account to contribute new WiFi spots.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          {/* THEMED: Removed custom classes from TabsTrigger */}
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          {/* Login Form */}
          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <Card>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  {/* THEMED: Changed to default primary button */}
                  <Button className="w-full" type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Log In'}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </TabsContent>

          {/* Sign Up Form */}
          <TabsContent value="signup">
            <form onSubmit={handleSignUp}>
              <Card>
                <CardHeader>
                  <CardTitle>Sign Up</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="signup-display-name">Display Name</Label>
                    <Input
                      id="signup-display-name"
                      type="text"
                      placeholder="Your name"
                      value={signupDisplayName}
                      onChange={(e) => setSignupDisplayName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  {/* THEMED: Changed to default primary button */}
                  <Button className="w-full" type="submit" disabled={loading}>
                    {loading ? 'Signing up...' : 'Sign Up'}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}