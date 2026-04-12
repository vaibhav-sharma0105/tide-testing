import { Link } from 'react-router-dom'
import { Mail, Phone, Heart } from 'lucide-react'
import { FacebookIcon, InstagramIcon, LinkedinIcon } from '../ui/SocialIcons'
import footerData from '../../data/footer.json'
import contactData from '../../data/contact.json'

const SOCIAL_ICONS = {
  facebook:  FacebookIcon,
  instagram: InstagramIcon,
  linkedin:  LinkedinIcon,
}

export default function Footer() {

  return (
    <footer className="bg-navy text-white relative overflow-hidden">
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 gradient-accent" />

      {/* Background decorative blobs */}
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/8 blur-3xl pointer-events-none" />
      <div className="absolute top-20 -left-32 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-8 lg:px-16 pt-16 pb-10 md:pt-20 md:pb-12">

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8">

          {/* Brand col (2 cols wide) */}
          <div className="lg:col-span-2">
            {/* Logo */}
            <Link to="/" className="inline-flex items-center gap-3 group mb-6 block">
              <div className="w-12 h-12 rounded-xl overflow-hidden shadow-float">
                <img
                  src={`${import.meta.env.BASE_URL}assets/images/shared/tide-logo.png`}
                  alt="TIDE Foundation"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div>
                <div className="font-display font-bold text-white text-xl leading-none">TIDE</div>
                <div className="font-body text-white/50 text-xs mt-0.5 tracking-wide">Foundation</div>
              </div>
            </Link>

            <p className="font-body text-white/60 text-sm leading-relaxed max-w-xs mb-7">
              {footerData.tagline}
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3 mb-8">
              {footerData.social.map(({ href, platform }) => {
                const Icon = SOCIAL_ICONS[platform]
                return (
                  <a key={platform} href={href} target="_blank" rel="noopener noreferrer"
                    aria-label={platform}
                    className="w-9 h-9 rounded-full bg-white/8 border border-white/10 hover:bg-primary hover:border-primary flex items-center justify-center transition-all duration-200 hover:scale-110"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                )
              })}
            </div>

            {/* Contact info */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                <a href={`mailto:${contactData.info.email}`} className="font-body text-white/60 hover:text-white text-xs transition-colors">
                  {contactData.info.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                <a href={`tel:${contactData.info.phones[0].replace(/\s/g, '')}`} className="font-body text-white/60 hover:text-white text-xs transition-colors">
                  {contactData.info.phones[0]}
                </a>
              </div>
            </div>

            {/* Donate CTA */}
            <Link
              to="/get-involved/donate"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-body font-semibold rounded-full gradient-accent text-white shadow-sm hover:shadow-glow-amber hover:scale-[1.03] transition-all duration-200"
            >
              <Heart className="w-3.5 h-3.5" /> Support our work
            </Link>
          </div>

          {/* Nav columns from data */}
          {footerData.columns.map(col => (
            <div key={col.title}>
              <h4 className="font-body text-[11px] font-bold text-white/40 uppercase tracking-[0.12em] mb-5">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map(item => (
                  <li key={item.to}>
                    <Link to={item.to} className="font-body text-white/65 hover:text-white text-sm transition-colors duration-150 flex items-center gap-1.5 group">
                      <span className="w-1 h-1 rounded-full bg-white/25 group-hover:bg-accent transition-colors flex-shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-14 pt-7 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-body text-white/35 text-xs">
            © {new Date().getFullYear()} TIDE Foundation. All rights reserved.
          </p>
          <p className="font-body text-white/35 text-xs flex items-center gap-1.5">
            Made with <Heart className="w-3 h-3 text-accent" /> for education in India
          </p>
        </div>
      </div>
    </footer>
  )
}
