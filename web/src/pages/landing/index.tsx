import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Footer } from '@/components/layout/footer'
import { Store, Bell, LineChart, Sparkles, ArrowRight, Check } from 'lucide-react'

const features = [
 {
 icon: Store,
 title: 'Multi-Store Tracking',
 description: 'Compare prices across Amazon, Best Buy, Newegg, and more.',
 },
 {
 icon: Bell,
 title: 'Instant Notifications',
 description: 'Get email and push alerts when prices drop.',
 },
 {
 icon: LineChart,
 title: 'Price History Charts',
 description: 'Visual 30-day price trends to time your purchase.',
 },
 {
 icon: Sparkles,
 title: 'Smart Detection',
 description: 'Auto-detect product details from pasted URL.',
 },
]

const pricing = [
 {
 name: 'Free',
 price: '$0',
 period: 'forever',
 features: ['10 items', 'Email notifications', '24-hour checks'],
 cta: 'Get Started',
 popular: false,
 },
 {
 name: 'Pro',
 price: '$4.99',
 period: '/month',
 features: ['Unlimited items', 'Push notifications', '1-hour checks', 'Price alerts'],
 cta: 'Start Free Trial',
 popular: true,
 },
 {
 name: 'Enterprise',
 price: 'Custom',
 period: '',
 features: ['Everything in Pro', 'API access', 'Team management'],
 cta: 'Contact Sales',
 popular: false,
 },
]

export function LandingPage() {
 return (
 <div className="min-h-screen bg-gradient-to-b from-amber-50 via-amber-25 to-white">
 {/* Navigation */}
 <nav className="border-b border-amber-100">
 <div className="container mx-auto px-4 flex items-center justify-between h-16">
 <a href="/" className="text-2xl font-extrabold tracking-tight text-stone-900 select-none">
 PriceHawk
 </a>
 <div className="flex items-center gap-4">
 <Link to="/login">
 <Button variant="ghost">Sign in</Button>
 </Link>
 <Link to="/register">
 <Button>Get Started</Button>
 </Link>
 </div>
 </div>
 </nav>

 {/* Hero */}
 <section className="py-20 md:py-32">
 <div className="container mx-auto px-4 text-center">
 <Badge variant="secondary" className="mb-6 bg-amber-100 text-amber-800 border-0">
 Track smarter, save bigger
 </Badge>
 <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-stone-900 select-none">
 Never miss a{' '}
 <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
 price drop
 </span>
 </h1>
 <p className="text-xl text-stone-600 max-w-2xl mx-auto mb-8">
 Track prices across Amazon, Best Buy, Newegg, and more.
 Get notified instantly when prices drop.
 </p>
 <div className="flex flex-col sm:flex-row gap-4 justify-center">
 <Link to="/register">
 <Button size="lg" className="gap-2">
 Start Tracking Free <ArrowRight className="w-4 h-4" />
 </Button>
 </Link>
 <Button size="lg" variant="outline">
 See How It Works
 </Button>
 </div>
 </div>
 </section>

 {/* Features */}
 <section id="features" className="py-20 bg-white">
 <div className="container mx-auto px-4">
 <div className="text-center mb-16">
 <h2 className="text-3xl font-bold tracking-tight mb-4 select-none">
 Everything you need to save money
 </h2>
 </div>
 <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
 {features.map((f) => (
 <Card key={f.title} className="border-none shadow-card">
 <CardContent className="pt-6">
 <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
 <f.icon className="w-6 h-6 text-amber-600" />
 </div>
 <h3 className="font-semibold mb-2">{f.title}</h3>
 <p className="text-sm text-stone-600">{f.description}</p>
 </CardContent>
 </Card>
 ))}
 </div>
 </div>
 </section>

 {/* Pricing */}
 <section id="pricing" className="py-20 bg-stone-50">
 <div className="container mx-auto px-4">
 <div className="text-center mb-16">
 <h2 className="text-3xl font-bold tracking-tight mb-4 select-none">
 Simple, transparent pricing
 </h2>
 </div>
 <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
 {pricing.map((plan) => (
 <Card
 key={plan.name}
 className={plan.popular ? 'border-amber-400 shadow-glow' : ''}
 >
 <CardContent className="pt-6">
 <h3 className="font-semibold text-lg">{plan.name}</h3>
 <div className="mt-2 mb-4">
 <span className="text-4xl font-bold">{plan.price}</span>
 <span className="text-stone-500 ml-1">{plan.period}</span>
 </div>
 <ul className="space-y-2 mb-6">
 {plan.features.map((f) => (
 <li key={f} className="flex items-center gap-2 text-sm">
 <Check className="w-4 h-4 text-success" />
 {f}
 </li>
 ))}
 </ul>
 <Button
 className="w-full"
 variant={plan.popular ? 'default' : 'outline'}
 >
 {plan.cta}
 </Button>
 </CardContent>
 </Card>
 ))}
 </div>
 </div>
 </section>

 {/* CTA */}
 <section className="py-20 bg-gradient-to-r from-amber-500 to-amber-600">
 <div className="container mx-auto px-4 text-center">
 <h2 className="text-3xl font-bold text-white mb-4 select-none">
 Start tracking prices today
 </h2>
 <p className="text-white/90 mb-8">
 Join thousands of smart shoppers saving with PriceHawk
 </p>
 <Link to="/register">
 <Button size="lg" variant="secondary" className="gap-2 bg-white text-amber-600 hover:bg-stone-50">
 Get Started Free <ArrowRight className="w-4 h-4" />
 </Button>
 </Link>
 </div>
 </section>

 <Footer />
 </div>
 )
}
