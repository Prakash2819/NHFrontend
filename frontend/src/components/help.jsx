import { HelpCircle, MessageCircle, BookOpen, Zap } from 'lucide-react';

export function HelpPage() {
  return (
    <>
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-[15px] sticky top-0 z-10">
          <p className="text-gray-500 text-sm">Support & Resources</p>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Help Center</h1>
        </header>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center py-4 px-8">
          <div className="text-center max-w-md">

            {/* Icon */}
            <div className="relative inline-flex items-center justify-center mb-6">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                <HelpCircle className="w-12 h-12 text-blue-600" />
              </div>
              <span className="absolute -top-1 -right-1 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </span>
            </div>

            {/* Text */}
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Help Center Coming Soon</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              We're building a comprehensive support experience for you — FAQs, live chat, video guides, and more.
              Check back soon!
            </p>

            {/* What's coming */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { icon: BookOpen,      label: 'FAQs & Guides',  color: 'bg-blue-50 text-blue-600' },
                { icon: MessageCircle, label: 'Live Chat',       color: 'bg-green-50 text-green-600' },
                { icon: Zap,           label: 'Quick Tutorials', color: 'bg-amber-50 text-amber-600' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold text-gray-600 text-center">{label}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <p className="text-xs text-gray-400 mb-3">Need help right now? Reach us at</p>
            <a
              href="mailto:support@patientpanel.in"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              support@patientpanel.in
            </a>

          </div>
        </div>
      </div>
    </>
  );
}