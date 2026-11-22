import SeoHead from '../components/ui/SeoHead'
import HomeHero from '../components/home/HomeHero'
import HomeMission from '../components/home/HomeMission'
import HomePrograms from '../components/home/HomePrograms'
import HomeJourney from '../components/home/HomeJourney'
import HomePartners from '../components/home/HomePartners'
import HomeCta from '../components/home/HomeCta'
import data from '../data/home.json'
import site from '../data/site.json'

// The homepage tells one story, top to bottom (each section in src/components/home/):
//   1. HomeHero      who we are, what we do, what to do next — and the proof in figures;
//   2. HomeMission   why: the idea and the belief behind it;
//   3. HomePrograms  how: three approaches, one vision (three doors into the work);
//   4. HomeJourney   how far: the phases on one timeline, the plan marked as a plan;
//   5. HomePartners  who stands with us (from the Partners snapshot; hidden while it is empty);
//   6. HomeCta       your part: volunteer or donate.
// All visible text comes from content/pages/home.yaml; the lives figure and founding year from
// content/shared/site.yaml.

export default function Home() {
  return (
    <>
      <SeoHead
        title={data.meta.seoTitle}
        description={data.meta.seoDescription}
        path="/"
        breadcrumbs={[{ name: site.breadcrumbs.home, path: '/' }]}
      />
      <HomeHero hero={data.hero} site={site} />
      <HomeMission mission={data.mission} founded={{ value: site.foundingYear, label: data.hero.floatFounded }} />
      <HomePrograms programs={data.programs} />
      <HomeJourney journey={data.journey} />
      <HomePartners text={data.partners} />
      <HomeCta cta={data.cta} />
    </>
  )
}
