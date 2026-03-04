"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore } from "@/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, LogIn, AlertCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const provisionUserRole = async (userUid: string) => {
    if (!db) return;
    // Explicitly grant EventAdmin role for the demo user or new signups
    // This satisfies exists(/databases/$(database)/documents/roles_eventAdmins/$(request.auth.uid))
    await setDoc(doc(db, "roles_eventAdmins", userUid), {
      assignedAt: new Date().toISOString(),
      active: true
    }, { merge: true });

    // Also create basic user profile
    await setDoc(doc(db, "users", userUid), {
      id: userUid,
      email: email || "demo@mwaliko.com",
      userRole: "EventAdmin",
      createdAt: new Date().toISOString()
    }, { merge: true });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setAuthError(null);
    const demoEmail = "demo@mwaliko.com";
    const demoPassword = "password123";

    try {
      const cred = await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
      await provisionUserRole(cred.user.uid);
      router.push("/dashboard");
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          const cred = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
          await provisionUserRole(cred.user.uid);
          router.push("/dashboard");
        } catch (createError: any) {
          setAuthError(`Demo access failed: ${createError.message}. Make sure Email/Password auth is enabled in your Firebase Console.`);
        }
      } else {
        setAuthError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      await provisionUserRole(cred.user.uid);
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google Login Failed",
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto flex flex-col items-center justify-center p-4 py-20">
        {authError && (
          <Alert variant="destructive" className="max-w-md mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        )}

        <Card className="w-full max-w-md border-none shadow-2xl bg-card/50 backdrop-blur">
          <CardHeader className="text-center space-y-1">
            <div className="mx-auto w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold">Welcome Back</CardTitle>
            <CardDescription>Enter your credentials to manage your luxury events</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@mwaliko.com" 
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              <Button type="submit" className="w-full bg-primary" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                Sign In
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              variant="secondary" 
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleDemoLogin}
              disabled={loading}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Explore as Demo Admin
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Tip: Ensure Email/Password is enabled in your Firebase console.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
