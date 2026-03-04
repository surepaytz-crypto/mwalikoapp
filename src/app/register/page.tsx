
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore } from "@/firebase";
import { 
  createUserWithEmailAndPassword,
  sendEmailVerification
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, UserPlus, Mail, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);

  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({ variant: "destructive", title: "Passwords Mismatch", description: "Password and Confirm Password must match." });
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // Provision user role and profile in Firestore
      await setDoc(doc(db, "users", cred.user.uid), {
        id: cred.user.uid,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        userRole: "EventAdmin",
        createdAt: new Date().toISOString()
      });

      // Send verification email
      await sendEmailVerification(cred.user);
      setIsVerificationSent(true);
      
      toast({
        title: "Account Created",
        description: "A verification email has been sent to " + formData.email,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (isVerificationSent) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto flex flex-col items-center justify-center p-4 py-20">
          <Card className="w-full max-w-md border-none shadow-2xl bg-card/50 backdrop-blur text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-8 w-8 text-accent animate-bounce" />
              </div>
              <CardTitle className="text-2xl font-headline font-bold">Verify Your Email</CardTitle>
              <CardDescription>
                We've sent a confirmation link to <strong>{formData.email}</strong>. 
                Please click the link in that email to activate your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Once verified, you will be able to access your Mwaliko Dashboard and start creating premium event registries.
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/login" className="w-full">
                <Button variant="outline" className="w-full">
                  Return to Login
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto flex flex-col items-center justify-center p-4 py-10">
        <Card className="w-full max-w-lg border-none shadow-2xl bg-card/50 backdrop-blur">
          <CardHeader className="text-center space-y-1">
            <div className="mx-auto w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold">Admin Registration</CardTitle>
            <CardDescription>Join the elite event management platform</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="Pima" value={formData.firstName} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Mwaliko" value={formData.lastName} onChange={handleChange} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="pima@example.com" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input id="phoneNumber" placeholder="255 712 345 678" value={formData.phoneNumber} onChange={handleChange} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={formData.password} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary h-12 text-lg font-bold" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <UserPlus className="h-5 w-5 mr-2" />}
                Create Admin Account
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-muted-foreground">
              Already have an account? <Link href="/login" className="text-accent font-bold hover:underline">Sign In</Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
