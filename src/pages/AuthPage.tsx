import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, userRole, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user && userRole) {
      if (userRole === 'super_admin') {
        navigate('/super-admin', { replace: true });
      } else if (userRole === 'restaurant_admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/apply', { replace: true });
      }
    }
  }, [user, userRole, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        // Redirect handled by useEffect above after role loads
      } else {
        await signUp(email, password, fullName);
        toast({ title: 'Account created!', description: 'Please check your email to verify.' });
      }
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Something went wrong', variant: 'destructive' });
      setSubmitting(false);
    }
  };

  // Show nothing while checking existing session
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-cream flex items-center justify-center">
        <p className="text-muted-foreground font-body">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-cream flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card rounded-2xl shadow-warm-lg p-8 border border-border"
      >
        <h1 className="text-2xl font-heading font-bold text-center mb-2">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-center text-muted-foreground font-body mb-6">
          {isLogin ? 'Sign in to manage your restaurant' : 'Get started with your account'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <Input
              placeholder="Full Name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="rounded-xl h-12 font-body"
            />
          )}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="rounded-xl h-12 font-body"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="rounded-xl h-12 font-body"
          />
          <Button variant="hero" size="lg" className="w-full rounded-xl py-6" disabled={submitting}>
            {submitting ? 'Signing in...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground font-body mt-4">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-semibold hover:underline">
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
