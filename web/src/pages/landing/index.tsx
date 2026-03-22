import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
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
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-stone-200">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <a href="/" className="text-2xl font-extrabold tracking-tight text-stone-900 select-none">
            PriceHawk
          </a>
          <div className="flex items-center gap-3">
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
      <section className="py-24 md:py-32 bg-gradient-to-b from-stone-50 to-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-block mb-4 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold tracking-wide">
                TRACK SMARTER, SAVE BIGGER
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-stone-900 select-none leading-tight">
                Stop overpaying.{' '}
                <span className="text-amber-500">
                  Start saving.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-stone-600 max-w-xl mb-8 leading-relaxed">
                Track prices across Amazon, Best Buy, Newegg, and more.
                Get instant notifications when prices drop so you always buy at the right time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/register">
                  <Button size="lg" className="gap-2 px-8">
                    Start Free <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline">
                  See How It Works
                </Button>
              </div>
              <p className="mt-6 text-sm text-stone-500">
                Free forever for 10 items. No credit card required.
              </p>
            </div>
            <div className="flex-1 w-full max-w-lg">
              <div className="bg-stone-900 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                      <Store className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">Sony WH-1000XM5</div>
                      <div className="text-stone-400 text-sm">Amazon</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-amber-400 font-bold text-lg">$278</div>
                    <div className="text-stone-500 text-sm line-through">$398</div>
                  </div>
                </div>
                <div className="h-32 bg-stone-800 rounded-lg flex items-end px-4 pb-4 gap-1">
                  {[65, 72, 68, 75, 71, 78, 74, 82, 69, 75, 68, 55].map((h, i) => (
                    <div key={i} className="flex-1 bg-amber-500/60 rounded-t" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span className="text-stone-300 text-sm">Alert set at $280</span>
                  </div>
                  <div className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-sm font-semibold">
                    -30% OFF
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-stone-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4 select-none">
              Everything you need to save money
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-6 border border-stone-200"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="font-semibold text-stone-900 mb-2">{f.title}</h3>
                <p className="text-sm text-stone-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4 select-none">
              Simple, transparent pricing
            </h2>
            <p className="text-stone-600">Start free, upgrade when you need more</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 ${
                  plan.popular
                    ? 'bg-stone-900 text-white ring-4 ring-amber-400 scale-105'
                    : 'bg-white border-2 border-stone-200'
                }`}
              >
                {plan.popular && (
                  <div className="text-amber-400 text-sm font-semibold mb-2">
                    MOST POPULAR
                  </div>
                )}
                <h3 className={`text-xl font-bold ${plan.popular ? 'text-white' : 'text-stone-900'}`}>
                  {plan.name}
                </h3>
                <div className="mt-3 mb-6">
                  <span className={`text-4xl font-extrabold ${plan.popular ? 'text-white' : 'text-stone-900'}`}>
                    {plan.price}
                  </span>
                  <span className={plan.popular ? 'text-stone-400 ml-2' : 'text-stone-500 ml-2'}>
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <Check className={`w-5 h-5 shrink-0 ${plan.popular ? 'text-amber-400' : 'text-amber-500'}`} />
                      <span className={plan.popular ? 'text-stone-300' : 'text-stone-700'}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="block w-full">
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'secondary' : 'default'}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-stone-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 select-none">
            Ready to start saving?
          </h2>
          <p className="text-stone-400 mb-8 text-lg">
            Join thousands of smart shoppers who never overpay
          </p>
          <Link to="/register">
            <Button size="lg" className="gap-2 px-8">
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
