"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore } from "@/firebase";
import { 
  createUserWithEmailAndPassword,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, UserPlus, Mail, ShieldCheck, ScrollText, Signature } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: ""
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
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
    if (!agreedToTerms) {
      toast({ variant: "destructive", title: "Terms & Conditions", description: "You must agree to the Terms and Conditions to continue." });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({ variant: "destructive", title: "Passwords Mismatch", description: "Password and Confirm Password must match." });
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      await setDoc(doc(db, "users", cred.user.uid), {
        id: cred.user.uid,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        userRole: "EventAdmin",
        createdAt: new Date().toISOString()
      });

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

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const cred = await signInWithPopup(auth, provider);
      const userDoc = await getDoc(doc(db, "users", cred.user.uid));
      
      if (!userDoc.exists()) {
        const names = cred.user.displayName?.split(" ") || [];
        const firstName = names[0] || "";
        const lastName = names.slice(1).join(" ") || "";
        await setDoc(doc(db, "users", cred.user.uid), {
          id: cred.user.uid,
          email: cred.user.email,
          firstName,
          lastName,
          userRole: "EventAdmin",
          createdAt: new Date().toISOString()
        });
      }
      
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google Registration Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (isVerificationSent) {
    return (
      <div className="min-h-screen bg-background font-body">
        <Navbar />
        <div className="container mx-auto flex flex-col items-center justify-center p-4 py-20">
          <Card className="w-full max-w-lg border-none shadow-[0_35px_60px_-15px_rgba(0,0,0,0.2)] bg-card overflow-hidden">
             <div className="bg-primary p-10 text-center">
                <h2 className="text-accent font-headline text-4xl font-bold tracking-[0.2em]">MWALIKO</h2>
             </div>
            <CardHeader className="text-center pt-10">
              <div className="mx-auto w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mb-6 border border-accent/20">
                <Mail className="h-12 w-12 text-accent" />
              </div>
              <CardTitle className="text-3xl font-headline font-bold text-primary">Check Your Inbox</CardTitle>
              <CardDescription className="text-lg mt-3">
                Welcome to the Inner Circle, <strong>{formData.firstName}</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-10 pb-6 text-center space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                A verification link has been sent to <strong>{formData.email}</strong>. 
                Please click the link in that email to activate your 360 Digital registry account.
              </p>
              
              <div className="p-8 bg-muted/20 rounded-2xl border border-muted space-y-4 text-left">
                <div className="flex gap-4">
                  <ShieldCheck className="h-6 w-6 text-accent shrink-0" />
                  <p className="text-sm italic opacity-80">
                    "Our vision at 360 Digital is to restore elegance and security to event management. We're glad to have you with us."
                  </p>
                </div>
                <div className="pt-4 border-t border-muted-foreground/10">
                   <p className="text-xs font-bold text-primary mb-0.5">Kennedy John</p>
                   <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Founder, 360 Digital</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pb-10 px-10">
              <Link href="/login" className="w-full">
                <Button variant="outline" className="w-full h-14 border-primary/20 hover:bg-muted font-bold">
                  Return to Executive Login
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container mx-auto flex flex-col items-center justify-center p-4 py-10">
        <Card className="w-full max-w-2xl border-none shadow-2xl bg-card/50 backdrop-blur">
          <CardHeader className="text-center space-y-1">
            <div className="mx-auto w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold">Admin Registration</CardTitle>
            <CardDescription>Join the elite event management platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Button type="button" variant="outline" className="w-full h-12 border-accent/20" onClick={handleGoogleLogin} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                Register with Google
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or with email</span></div>
              </div>

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

                <div className="pt-6 border-t mt-8">
                   <div className="flex items-center gap-2 mb-3 text-primary">
                      <ScrollText className="h-5 w-5" />
                      <h3 className="font-bold">Terms of Service & Privacy Policy</h3>
                   </div>
                   <ScrollArea className="h-[200px] w-full rounded-md border bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
                      <div className="space-y-4">
                        <section>
                          <h4 className="font-bold text-foreground">1. Introduction</h4>
                          <p>Welcome to Mwaliko App, a product by 360 Digital. By registering an EventAdmin account, you agree to comply with our terms of service regarding digital invitations, secure scanning, and data management.</p>
                        </section>
                        <section>
                          <h4 className="font-bold text-foreground">2. Subscription Packages & Pricing</h4>
                          <p><strong>Free Trial:</strong> Limited to 200 guest cards, 1 event, and 1 month of access. This trial is a one-time offer per user. Attempting to circumvent this limit via multiple accounts is a violation of these terms.</p>
                          <p><strong>Premium Package:</strong> Charged at 350,000 TZS for 2 months of unlimited card generation and multiple events. Payments are non-refundable once the registry activation is processed.</p>
                        </section>
                        <section>
                          <h4 className="font-bold text-foreground">3. Digital Invitations</h4>
                          <p>Mwaliko provides digital invitation designs. Users are responsible for reviewing invitation content and layout before sharing with guests via WhatsApp or other channels.</p>
                        </section>
                        <section>
                          <h4 className="font-bold text-foreground">4. Data Privacy</h4>
                          <p>We collect guest names and phone numbers solely for the purpose of generating QR codes and facilitating invitation delivery. We do not sell or share your guest lists with third parties. As an Admin, you are responsible for the accuracy of the guest data you manage.</p>
                        </section>
                        <section>
                          <h4 className="font-bold text-foreground">5. Security Scanning</h4>
                          <p>The 3-point scanning system (Gate, Drinks, Food) is a digital verification tool. While highly accurate, the final security responsibility at the event venue lies with the event organizer and their staff.</p>
                        </section>
                        <section>
                          <h4 className="font-bold text-foreground">6. Termination</h4>
                          <p>We reserve the right to suspend accounts that engage in fraudulent simulation of payments or misuse the platform features for unauthorized purposes.</p>
                        </section>
                      </div>
                   </ScrollArea>
                   <div className="flex items-start space-x-2 pt-4">
                    <Checkbox 
                      id="terms" 
                      checked={agreedToTerms} 
                      onCheckedChange={(v) => setAgreedToTerms(v as boolean)} 
                      className="mt-1"
                    />
                    <label
                      htmlFor="terms"
                      className="text-xs font-medium leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I have read and agree to the 360 Digital Terms of Service, including the usage policy and subscription pricing.
                    </label>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-primary h-14 text-lg font-bold mt-6 shadow-xl" disabled={loading || !agreedToTerms}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <UserPlus className="h-5 w-5 mr-2" />}
                  Create Admin Account
                </Button>
              </form>
            </div>
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
