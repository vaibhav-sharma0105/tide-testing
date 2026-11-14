import { Link } from 'react-router-dom'
import { FacebookIcon, InstagramIcon, LinkedinIcon } from '../ui/SocialIcons'
import footerData from '../../data/footer.json'
import contactData from '../../data/contact.json'

const SOCIAL_ICONS = {
  facebook:  FacebookIcon,
  instagram: InstagramIcon,
  linkedin:  LinkedinIcon,
}

// One text style for everything in the main row; Donate is the only coloured element.
const quietLink = 'py-2 font-body text-sm text-white/70 hover:text-white transition-colors'

export default function Footer() {
  // Evaluated in the visitor's browser on every render, so the static build never shows a stale year
  const rights = footerData.rights.replace('{year}', new Date().getFullYear())

  return (
    <footer role="contentinfo" className="bg-navy text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">

        {/* ── Main row: brand · contact · social · donate (stacks on small screens) ── */}
        <div className="flex flex-col gap-5 py-8 lg:flex-row lg:items-center lg:justify-between">

          <Link to={footerData.logoHref} className="group inline-flex items-center gap-3 self-start lg:self-auto">
            <img
              src={`${import.meta.env.BASE_URL}${footerData.logo}`}
              alt={footerData.logoAlt}
              className="h-9 w-9 rounded-lg object-cover"
            />
            <span>
              <span className="block font-body text-sm font-semibold text-white">
                {footerData.brandName} {footerData.brandSuffix}
              </span>
              <span className="mt-0.5 block font-body text-xs text-white/55">{footerData.tagline}</span>
            </span>
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8">
            <div className="flex flex-col sm:flex-row sm:gap-8">
              <a href={`mailto:${contactData.info.email}`} className={quietLink}>
                {contactData.info.email}
              </a>
              <a href={`tel:${contactData.info.phones[0].replace(/\s/g, '')}`} className={quietLink}>
                {contactData.info.phones[0]}
              </a>
            </div>

            {/* social + donate share one row, even on phones */}
            <div className="flex items-center justify-between gap-6 sm:justify-start">
              <div className="-mx-2.5 flex items-center">
                {footerData.social.map(({ href, platform, name }) => {
                  const Icon = SOCIAL_ICONS[platform]
                  return (
                    <a key={platform} href={href} target="_blank" rel="noopener noreferrer"
                      aria-label={footerData.socialAriaLabel.replace('{platform}', name)}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </a>
                  )
                })}
              </div>

              <Link
                to={footerData.donateHref}
                className="rounded-full bg-accent px-5 py-2 font-body text-sm font-semibold text-navy hover:brightness-110 transition-[filter]"
              >
                {footerData.donateLabel}
              </Link>
            </div>
          </div>
        </div>

        {/* ── Bottom line ── */}
        <div className="flex flex-col gap-1 border-t border-white/[0.08] py-5 font-body text-xs text-white/55 sm:flex-row sm:justify-between">
          <p>{rights}</p>
          <p>{footerData.madeWithLove}</p>
        </div>
      </div>
    </footer>
  )
}
