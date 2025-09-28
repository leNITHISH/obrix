// src/components/Auth.jsx
import { useState } from 'react';
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

export default function Auth() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  // separate email states for login and signup
  const [loginEmail, setLoginEmail] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [password, setPassword] = useState('');
  const [open, setOpen] = useState(false);

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
      const { error } = await supabase.auth.signUp({
        email: signupEmail.trim(),
        password
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

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <p className="text-sm text-white">Signed in as {session.user.email}</p>
        <Button onClick={handleLogout} disabled={loading}>
          {loading ? 'Logging out...' : 'Log Out'}
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Login</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to Obrix WiFi Mapper</DialogTitle>
          <DialogDescription>
            Log in or create an account to contribute new WiFi spots.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
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

