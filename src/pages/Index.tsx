import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Store, QrCode, ChefHat, BarChart3, Shield, Smartphone } from 'lucide-react';
import heroFood from '@/assets/hero-food.jpg';

const features = [
  { icon: QrCode, title: 'QR Code Access', description: 'Customers scan & order instantly from their phone' },
  { icon: ChefHat, title: 'Digital Menu', description: 'Beautiful interactive menu with page-flip animation' },
  { icon: Smartphone, title: 'Mobile Ordering', description: 'Seamless checkout with mobile money payments' },
  { icon: BarChart3, title: 'Sales Analytics', description: 'Track orders, revenue, and commissions in real-time' },
  { icon: Store, title: 'Multi-Restaurant', description: 'Manage multiple restaurants from one platform' },
  { icon: Shield, title: 'Admin Dashboard', description: 'Full control over menu, orders, and operations' },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroFood} alt="Delicious food" className="w-full h-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/40" />
        </div>
        <div className="relative z-10 px-6 md:px-16 py-20 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/20 text-primary-foreground text-sm font-body font-medium mb-6 backdrop-blur-sm border border-primary/30">
              🍽️ Digital Restaurant Platform
            </span>
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-background leading-tight mb-6">
              Transform Your
              <br />
              <span className="text-gradient-warm">Restaurant</span>
              <br />
              Experience
            </h1>
            <p className="text-lg text-background/80 font-body max-w-lg mb-8">
              A premium multi-restaurant ordering platform. QR code menus, mobile payments, real-time tracking, and powerful admin dashboards.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="hero" size="lg" className="rounded-xl py-6 px-8 text-lg" asChild>
                <Link to="/auth">List Your Restaurant</Link>
              </Button>
              <Button variant="outline-warm" size="lg" className="rounded-xl py-6 px-8 text-lg border-background/30 text-background hover:bg-background/10 hover:text-background" asChild>
                <Link to="/r/demo">View Demo</Link>
              </Button>
            </div>
            <p className="text-background/70 font-body text-sm mt-4">
              Sign up → submit KYC at <span className="font-mono">/apply</span> → get approved → manage your restaurant.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 md:px-16 py-20 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Everything You Need
          </h2>
          <p className="text-muted-foreground font-body text-lg max-w-2xl mx-auto">
            A complete digital ordering solution for modern restaurants
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-2xl p-6 border border-border shadow-warm hover:shadow-warm-lg transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-warm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground font-body text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 md:px-16 py-20 bg-gradient-warm">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-foreground mb-4">
            Ready to Digitize Your Restaurant?
          </h2>
          <p className="text-primary-foreground/80 font-body text-lg mb-8">
            Join the future of restaurant ordering. Set up in minutes.
          </p>
          <Button
            size="lg"
            className="rounded-xl py-6 px-10 text-lg bg-background text-foreground hover:bg-background/90 shadow-warm-lg"
            asChild
          >
            <Link to="/auth">Start Free Today</Link>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 md:px-16 py-8 border-t border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <p className="font-body text-sm text-muted-foreground">
            © 2026 Digital Dine. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-primary font-body transition-colors">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
