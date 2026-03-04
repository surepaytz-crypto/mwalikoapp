
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore } from "@/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, LogIn, Shield, UserCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Staff login state
  const [staffUsername, setStaffUsername] = useState("");
  const [staffPassword, setStaffPassword] = useState("");

  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const provisionUserRole = async (userUid: string, role: "EventAdmin" | "ScannerStaff") => {
    if (!db) return;
    await setDoc(doc(db, "users", userUid), {
      id: userUid,
      email: email || `${staffUsername}@staff.mwaliko.com`,
      userRole: role,
      createdAt: new Date().toISOString()
    }, { merge: true });
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const staffEmail = `${staffUsername}@staff.mwaliko.com`;
    try {
      await signInWithEmailAndPassword(auth, staffEmail, staffPassword);
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Staff Login Failed",
        description: "Invalid credentials or account not yet setup by Admin.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAdmin = async () => {
    setLoading(true);
    const demoEmail = "demo@mwaliko.com";
    const demoPassword = "password123";
    try {
      const cred = await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
      await provisionUserRole(cred.user.uid, "EventAdmin");
      router.push("/dashboard");
    } catch (error: any) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
        await provisionUserRole(cred.user.uid, "EventAdmin");
        router.push("/dashboard");
      } catch (e) {
        toast({ variant: "destructive", title: "Demo Failed", description: "Access error" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoStaff = async () => {
    setLoading(true);
    const demoUsername = "demo_staff";
    const demoPassword = "password123";
    const staffEmail = `${demoUsername}@staff.mwaliko.com`;
    try {
      const cred = await signInWithEmailAndPassword(auth, staffEmail, demoPassword);
      await provisionUserRole(cred.user.uid, "ScannerStaff");
      router.push("/dashboard");
    } catch (error: any) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, staffEmail, demoPassword);
        await provisionUserRole(cred.user.uid, "ScannerStaff");
        router.push("/dashboard");
      } catch (e) {
        toast({ variant: "destructive", title: "Demo Failed", description: "Access error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto flex flex-col items-center justify-center p-4 py-20">
        <Card className="w-full max-w-md border-none shadow-2xl bg-card/50 backdrop-blur">
          <CardHeader className="text-center space-y-1">
            <div className="mx-auto w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold">Mwaliko Login</CardTitle>
            <CardDescription>Secure access for Admins and Staff</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="admin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="admin">Admin</TabsTrigger>
                <TabsTrigger value="staff">Staff</TabsTrigger>
              </TabsList>

              <TabsContent value="admin">
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="admin@mwaliko.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full bg-primary" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                    Admin Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="staff">
                <form onSubmit={handleStaffLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="staff-username">Username</Label>
                    <Input id="staff-username" placeholder="e.g. juma_gate" value={staffUsername} onChange={(e) => setStaffUsername(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff-password">Password</Label>
                    <Input id="staff-password" type="password" value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full bg-accent text-accent-foreground" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
                    Staff Sign In
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest pt-4">
                    Staff credentials provided by your Event Admin
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Demo Accounts</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
              <Button variant="secondary" className="bg-accent/10 text-accent hover:bg-accent/20" onClick={handleDemoAdmin} disabled={loading}>
                <Sparkles className="h-4 w-4 mr-2" />
                Demo Admin
              </Button>
              <Button variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20" onClick={handleDemoStaff} disabled={loading}>
                <UserCircle className="h-4 w-4 mr-2" />
                Demo Staff
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
