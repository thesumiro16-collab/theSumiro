export default function ProductsPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-8 py-20 space-y-16 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl sm:text-5xl font-serif text-gray-950 font-light">The Collections</h1>
        <div className="w-12 h-[1.5px] bg-accent mx-auto" />
        <p className="text-sm text-gray-500 font-light leading-relaxed">
          Access our private archive of premium fabrics, curated patterns, and bespoke catalogs tailored for high-fashion innovators.
        </p>
      </div>
      
      {/* Login invitation */}
      <div className="bg-gradient-to-br from-[#fffbf8] to-[#fff6eb] border border-accent/25 p-8 sm:p-12 text-center rounded-sm max-w-3xl mx-auto space-y-6 shadow-sm">
        <div className="space-y-2">
          <span className="text-[10px] tracking-[0.2em] font-semibold text-accent-dark uppercase">Exclusive Client Access</span>
          <h2 className="text-xl sm:text-2xl font-serif text-gray-950 font-medium">Authentication Required</h2>
          <p className="text-xs text-gray-500 max-w-md mx-auto font-light leading-relaxed">
            To view pricing details, technical specifications, and download design source files, please sign in with your authorized credentials.
          </p>
        </div>
        <div>
          <a
            href="/login"
            className="inline-block px-10 py-3.5 bg-brand-primary text-white hover:bg-accent text-xs font-semibold tracking-widest uppercase transition-all duration-300 shadow-sm hover:shadow-lg transform hover:-translate-y-0.5 rounded-sm"
          >
            Sign In to Archive
          </a>
        </div>
      </div>

      {/* Featured category placeholders to build excitement */}
      <div className="space-y-8 pt-8 border-t border-gray-100">
        <div className="text-center">
          <h3 className="text-xs tracking-[0.2em] text-gray-400 uppercase font-semibold">Exquisite Materials</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="bg-white border border-accent/15 p-8 text-center rounded-sm hover:shadow-md transition-shadow duration-300">
            <div className="text-2xl mb-4">✨</div>
            <h4 className="font-serif text-lg text-gray-950 mb-2 font-medium">Bespoke Silk & Jacquards</h4>
            <p className="text-xs text-gray-500 leading-relaxed font-light">
              Highly detailed premium prints, brocades, and custom jacquards crafted on modern loom setups.
            </p>
          </div>
          <div className="bg-white border border-accent/15 p-8 text-center rounded-sm hover:shadow-md transition-shadow duration-300">
            <div className="text-2xl mb-4">⚜️</div>
            <h4 className="font-serif text-lg text-gray-950 mb-2 font-medium">Artisanal Embroideries</h4>
            <p className="text-xs text-gray-500 leading-relaxed font-light">
              Traditional threadwork and contemporary zari highlights engineered to represent rich cultural details.
            </p>
          </div>
          <div className="bg-white border border-accent/15 p-8 text-center rounded-sm hover:shadow-md transition-shadow duration-300">
            <div className="text-2xl mb-4">🔒</div>
            <h4 className="font-serif text-lg text-gray-950 mb-2 font-medium">Secure Catalog Management</h4>
            <p className="text-xs text-gray-500 leading-relaxed font-light">
              Add new designs, track inventory numbers, and distribute digital swatches securely to client folders.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
