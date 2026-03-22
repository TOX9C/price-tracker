export function Footer() {
  return (
    <footer className="border-t border-stone-100 bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-stone-600">
              <li><a href="/#features" className="hover:text-amber-600">Features</a></li>
              <li><a href="/#pricing" className="hover:text-amber-600">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-stone-600">
              <li><span className="text-stone-400 cursor-not-allowed">About</span></li>
              <li><span className="text-stone-400 cursor-not-allowed">Blog</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-stone-600">
              <li><span className="text-stone-400 cursor-not-allowed">Privacy</span></li>
              <li><span className="text-stone-400 cursor-not-allowed">Terms</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <ul className="space-y-2 text-sm text-stone-600">
              <li><span className="text-stone-400 cursor-not-allowed">Twitter</span></li>
              <li><span className="text-stone-400 cursor-not-allowed">GitHub</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-stone-100 text-center text-sm text-stone-500">
          <a href="/" className="text-lg font-extrabold tracking-tight text-amber-600 select-none">
            PriceHawk
          </a>
          <p className="mt-2">&copy; {new Date().getFullYear()} PriceHawk. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
