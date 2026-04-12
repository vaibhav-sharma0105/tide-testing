/**
 * TIDE Foundation — Image Downloader
 * Downloads all images from the audit into public/assets/images/
 * Run: node scripts/download-images.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// ─────────────────────────────────────────────
// FULL IMAGE MAP: [url, localPath]
// ─────────────────────────────────────────────
const IMAGES = [
  // ── SHARED ──────────────────────────────────
  ['https://tideinternational.org/wp-content/uploads/2025/05/cropped-TIDE-Logo-Large-e1746626129494.png', 'public/assets/images/shared/tide-logo.png'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/Tide-Foundation-Background.png', 'public/assets/images/shared/page-banner-bg.png'],

  // ── HOME ────────────────────────────────────
  ['https://tideinternational.org/wp-content/uploads/2022/10/Lekhambha-SKP-prediwali-2022-4-scaled-e1666536012706.jpg', 'public/assets/images/home/slider-1.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2023/06/MOI-Outline-Poster-Cropped-e1686222435615.jpg', 'public/assets/images/home/slider-2.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/11713714_872285702847427_2129019032022910348_o-2-e1582657853588.jpg', 'public/assets/images/home/slider-3.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2024/12/HCPG-1.png', 'public/assets/images/home/slider-4.png'],
  ['https://tideinternational.org/wp-content/uploads/2019/08/Why-tide-1.jpg', 'public/assets/images/home/why-tide.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/9.-BetterEd-geeta-mandirm-2-400x400.jpg', 'public/assets/images/home/gallery-1.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/1.-ComepleEd-400x400.jpg', 'public/assets/images/home/gallery-2.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/08/We-care-for-future-400x400.jpg', 'public/assets/images/home/gallery-3.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/08/join-Us..-600x550.jpg', 'public/assets/images/home/join-us.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2018/02/quote-1-1.png', 'public/assets/images/home/testimonial-quote.png'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/Couneter-bk.jpg', 'public/assets/images/home/bg-counter.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/aim-BK.jpg', 'public/assets/images/home/bg-aim.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/695531569.jpg', 'public/assets/images/home/bg-contact-strip.jpg'],
  // Extra URLs used in Home.jsx (not in audit but referenced in JSX)
  ['https://tideinternational.org/wp-content/uploads/2023/01/WhatsApp-Image-2023-01-14-at-6.15.47-PM-1.jpeg', 'public/assets/images/home/testimonial-person.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2021/09/DSC_0131-scaled.jpg', 'public/assets/images/home/gallery-classroom.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2021/09/DSC_0101-scaled.jpg', 'public/assets/images/home/gallery-teacher.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2021/09/DSC_0081-scaled.jpg', 'public/assets/images/home/gallery-community.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2021/09/DSC_0071-scaled.jpg', 'public/assets/images/home/gallery-student.jpg'],

  // ── ABOUT — OUR TEAM ────────────────────────
  ['https://tideinternational.org/wp-content/uploads/2019/07/Prof.-Neelkanth-Chhaya-1.jpg', 'public/assets/images/about-our-team/Prof.-Neelkanth-Chhaya-1.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/Prof.-Raghavan-Rangarajan-1.jpg', 'public/assets/images/about-our-team/Prof.-Raghavan-Rangarajan-1.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/Dr.-Prerna-Mohite-1.jpg', 'public/assets/images/about-our-team/Dr.-Prerna-Mohite-1.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/Dr.-Shailendra-Gupta-1.png', 'public/assets/images/about-our-team/Dr.-Shailendra-Gupta-1.png'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/Mr.-Hiren-Parikh-1.png', 'public/assets/images/about-our-team/Mr.-Hiren-Parikh-1.png'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/Mr.-Keshav-Chatterjee-1.png', 'public/assets/images/about-our-team/Mr.-Keshav-Chatterjee-1.png'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/Gayatri-Oza-1.jpg', 'public/assets/images/about-our-team/Gayatri-Oza-1.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/Om-Patel-1.jpg', 'public/assets/images/about-our-team/Om-Patel-1.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/Deep-Shah-1.jpg', 'public/assets/images/about-our-team/Deep-Shah-1.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/Prathmesh-Sharma-1.jpg', 'public/assets/images/about-our-team/Prathmesh-Sharma-1.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/Kaneesha-Parikh-1.jpeg', 'public/assets/images/about-our-team/Kaneesha-Parikh-1.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/Bhavik-Dholu-1.jpg', 'public/assets/images/about-our-team/Bhavik-Dholu-1.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/Nishi-Nair-180x180.jpeg', 'public/assets/images/about-our-team/Nishi-Nair-180x180.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/Munira-Jariwala-1.jpg', 'public/assets/images/about-our-team/Munira-Jariwala-1.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/Jwalin-Patel-1.jpg', 'public/assets/images/about-our-team/Jwalin-Patel-1.jpg'],

  // ── ABOUT — OUR PARTNERS ────────────────────
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-5-e1696767317753.jpeg', 'public/assets/images/about-our-partners/image-5-e1696767317753.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-7-e1696767338300.png', 'public/assets/images/about-our-partners/image-7-e1696767338300.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-5-e1696767236795.png', 'public/assets/images/about-our-partners/image-5-e1696767236795.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-6-e1696767359324.png', 'public/assets/images/about-our-partners/image-6-e1696767359324.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-6-e1696783922181.jpeg', 'public/assets/images/about-our-partners/image-6-e1696783922181.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-18-e1699203496915.png', 'public/assets/images/about-our-partners/image-18-e1699203496915.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/Screenshot-2023-09-20-at-10.53.05-PM.png', 'public/assets/images/about-our-partners/Screenshot-2023-09-20-at-10.53.05-PM.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-9-e1696784125346.png', 'public/assets/images/about-our-partners/image-9-e1696784125346.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-10-e1696784184315.png', 'public/assets/images/about-our-partners/image-10-e1696784184315.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-e1696784234357.jpeg', 'public/assets/images/about-our-partners/image-e1696784234357.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-1-e1699203683612.png', 'public/assets/images/about-our-partners/image-1-e1699203683612.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-1-e1699267868167.jpeg', 'public/assets/images/about-our-partners/image-1-e1699267868167.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-3-e1699268240144.png', 'public/assets/images/about-our-partners/image-3-e1699268240144.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-2-e1699268463638.jpeg', 'public/assets/images/about-our-partners/image-2-e1699268463638.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-4-e1699268549177.png', 'public/assets/images/about-our-partners/image-4-e1699268549177.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-3-e1699268516369.jpeg', 'public/assets/images/about-our-partners/image-3-e1699268516369.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/Screenshot-2023-09-20-at-10.43.16-PM-e1699269167459.png', 'public/assets/images/about-our-partners/Screenshot-2023-09-20-at-10.43.16-PM-e1699269167459.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-2-e1699268069298.png', 'public/assets/images/about-our-partners/image-2-e1699268069298.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/06/image_2024-06-03_020641800-e1717360927525.png', 'public/assets/images/about-our-partners/image_2024-06-03_020641800-e1717360927525.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-8-e1699270516498.png', 'public/assets/images/about-our-partners/image-8-e1699270516498.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-12-e1699289052339.png', 'public/assets/images/about-our-partners/image-12-e1699289052339.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-11-e1699289070343.png', 'public/assets/images/about-our-partners/image-11-e1699289070343.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/06/image_2024-06-03_015959653-e1717360355473.png', 'public/assets/images/about-our-partners/image_2024-06-03_015959653-e1717360355473.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/06/image_2024-06-03_020450281-e1717360912908.png', 'public/assets/images/about-our-partners/image_2024-06-03_020450281-e1717360912908.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/06/image_2024-06-03_020529379-e1717360945343.png', 'public/assets/images/about-our-partners/image_2024-06-03_020529379-e1717360945343.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-13-e1699289088856.png', 'public/assets/images/about-our-partners/image-13-e1699289088856.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-15-e1699289107679.png', 'public/assets/images/about-our-partners/image-15-e1699289107679.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-14-e1699289130817.jpeg', 'public/assets/images/about-our-partners/image-14-e1699289130817.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-10-e1699289151787.jpeg', 'public/assets/images/about-our-partners/image-10-e1699289151787.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-8-e1699289167929.jpeg', 'public/assets/images/about-our-partners/image-8-e1699289167929.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-9-e1699289182759.jpeg', 'public/assets/images/about-our-partners/image-9-e1699289182759.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-7-e1699289221604.jpeg', 'public/assets/images/about-our-partners/image-7-e1699289221604.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-16-e1699289253828.png', 'public/assets/images/about-our-partners/image-16-e1699289253828.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-11-e1699289275385.jpeg', 'public/assets/images/about-our-partners/image-11-e1699289275385.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-17.png', 'public/assets/images/about-our-partners/image-17.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-28.png', 'public/assets/images/about-our-partners/image-28.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-29-e1699289341794.png', 'public/assets/images/about-our-partners/image-29-e1699289341794.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/06/image_2024-06-03_021035914.png', 'public/assets/images/about-our-partners/image_2024-06-03_021035914.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-12-e1699292775417.jpeg', 'public/assets/images/about-our-partners/image-12-e1699292775417.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-13-e1699292797346.jpeg', 'public/assets/images/about-our-partners/image-13-e1699292797346.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-21-e1699293045416.png', 'public/assets/images/about-our-partners/image-21-e1699293045416.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-21-e1699293388590.jpeg', 'public/assets/images/about-our-partners/image-21-e1699293388590.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-17-scaled-e1699292974754.jpeg', 'public/assets/images/about-our-partners/image-17-scaled-e1699292974754.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-18-e1699292988150.jpeg', 'public/assets/images/about-our-partners/image-18-e1699292988150.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-16-e1699292933940.jpeg', 'public/assets/images/about-our-partners/image-16-e1699292933940.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-19-e1699293006704.jpeg', 'public/assets/images/about-our-partners/image-19-e1699293006704.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-20-e1699293018113.jpeg', 'public/assets/images/about-our-partners/image-20-e1699293018113.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-20-e1699293034944.png', 'public/assets/images/about-our-partners/image-20-e1699293034944.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-19.png', 'public/assets/images/about-our-partners/image-19.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-24-e1699293400159.png', 'public/assets/images/about-our-partners/image-24-e1699293400159.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/06/image_2024-06-03_020829727-e1717360986615.png', 'public/assets/images/about-our-partners/image_2024-06-03_020829727-e1717360986615.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/06/image_2024-06-03_020910228-e1717361034126.png', 'public/assets/images/about-our-partners/image_2024-06-03_020910228-e1717361034126.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/06/image_2024-06-03_020946325.png', 'public/assets/images/about-our-partners/image_2024-06-03_020946325.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/06/image_2024-06-03_020744358-e1717360996970.png', 'public/assets/images/about-our-partners/image_2024-06-03_020744358-e1717360996970.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-22-e1699293105650.png', 'public/assets/images/about-our-partners/image-22-e1699293105650.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-23-e1699293251893.png', 'public/assets/images/about-our-partners/image-23-e1699293251893.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-24-e1699293399346.png', 'public/assets/images/about-our-partners/image-24-e1699293399346.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-22-e1699293466293.jpeg', 'public/assets/images/about-our-partners/image-22-e1699293466293.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-31-e1699293478698.png', 'public/assets/images/about-our-partners/image-31-e1699293478698.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-23-e1699293527412.jpeg', 'public/assets/images/about-our-partners/image-23-e1699293527412.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-34-e1699293538439.png', 'public/assets/images/about-our-partners/image-34-e1699293538439.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-33-e1699293507263.png', 'public/assets/images/about-our-partners/image-33-e1699293507263.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-32-e1699293494122.png', 'public/assets/images/about-our-partners/image-32-e1699293494122.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-25-e1699293415472.png', 'public/assets/images/about-our-partners/image-25-e1699293415472.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-27-e1699293436956.png', 'public/assets/images/about-our-partners/image-27-e1699293436956.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-26-e1699293426812.png', 'public/assets/images/about-our-partners/image-26-e1699293426812.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-25-e1699293988937.jpeg', 'public/assets/images/about-our-partners/image-25-e1699293988937.jpeg'],

  // ── PROJECTS — BETTERED ─────────────────────
  ['https://tideinternational.org/wp-content/uploads/2019/07/1-1.jpg', 'public/assets/images/projects-bettered/gallery-01.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/2.-BetterEd-chandola-lake1-1.jpg', 'public/assets/images/projects-bettered/gallery-02.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/3.-BetterEd-Meera-Cinema2-1.jpg', 'public/assets/images/projects-bettered/gallery-03.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/4.-BetterEd-chandola-lake2-1.jpg', 'public/assets/images/projects-bettered/gallery-04.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/5.-BetterEd-Mansi-slum-1.jpg', 'public/assets/images/projects-bettered/gallery-05.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/6.-BetterEd-urban-slum-1.jpg', 'public/assets/images/projects-bettered/gallery-06.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/7.-BetterEd-Meera-Cinema1-1.jpg', 'public/assets/images/projects-bettered/gallery-07.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/8.-BetterEd-Prahladnagar1-1.jpg', 'public/assets/images/projects-bettered/gallery-08.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/9.-BetterEd-geeta-mandirm-2.jpg', 'public/assets/images/projects-bettered/gallery-09.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/10.-BetterEd-Prahladnagar-1.jpg', 'public/assets/images/projects-bettered/gallery-10.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/11-1.jpg', 'public/assets/images/projects-bettered/gallery-11.jpg'],
  // Extra URLs referenced in BetterED.jsx
  ['https://tideinternational.org/wp-content/uploads/2023/01/BetterEd-1.jpg', 'public/assets/images/projects-bettered/BetterEd-1.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2023/01/BetterEd-2.jpg', 'public/assets/images/projects-bettered/BetterEd-2.jpg'],

  // ── PROJECTS — EMPOWERED ────────────────────
  ['https://tideinternational.org/wp-content/uploads/2020/07/EE-Logo-1024x634.jpeg', 'public/assets/images/projects-empowered/ee-logo.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2020/07/Build-teacher-agency.jpg', 'public/assets/images/projects-empowered/Build-teacher-agency.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/07/Share-best-practices.jpg', 'public/assets/images/projects-empowered/Share-best-practices.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/07/Dialogic-and-experiential-learning.jpg', 'public/assets/images/projects-empowered/Dialogic-and-experiential-learning.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/07/Createp-rofessional-learning-communities.jpg', 'public/assets/images/projects-empowered/Createp-rofessional-learning-communities.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/07/Create-systemic-change.jpg', 'public/assets/images/projects-empowered/Create-systemic-change.jpg'],

  // ── PROJECTS — COMPLETED ────────────────────
  ['https://tideinternational.org/wp-content/uploads/2024/09/Blue-background-logo-1024x685.png', 'public/assets/images/projects-completed/bg-scf-logo.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/09/SDG-Logo-Cropped-1024x1018.png', 'public/assets/images/projects-completed/bg-sdg-logo.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/09/MCC-Ecopanels-Logo.png', 'public/assets/images/projects-completed/bg-mcc-logo.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/09/19665640_1424334867642505_2806997760349744936_n.jpg', 'public/assets/images/projects-completed/bg-moi-logo.jpg'],

  // ── PROJECTS — OTHER PROJECTS ───────────────
  ['https://tideinternational.org/wp-content/uploads/2019/07/EEP.jpg', 'public/assets/images/projects-other/EEP.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/IMG_20160629_102123.jpg', 'public/assets/images/projects-other/IMG_20160629_102123.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/60960103_2243396165736367_4401736446357012480_n.jpg', 'public/assets/images/projects-other/60960103_2243396165736367_4401736446357012480_n.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/20045546_1437391533003505_6762092604543164082_o.jpg', 'public/assets/images/projects-other/20045546_1437391533003505_6762092604543164082_o.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/62539018_2273420709400579_6616374588089565184_n.jpg', 'public/assets/images/projects-other/62539018_2273420709400579_6616374588089565184_n.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/59358920_2209015535841097_7963531328618496000_n.jpg', 'public/assets/images/projects-other/59358920_2209015535841097_7963531328618496000_n.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/14231209_1098465766896085_1957047158625626568_o.jpg', 'public/assets/images/projects-other/14231209_1098465766896085_1957047158625626568_o.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/48991658_2031772536898732_8997383472058204160_n.jpg', 'public/assets/images/projects-other/48991658_2031772536898732_8997383472058204160_n.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/52439627_2109289665813685_4962013976637472768_n.jpg', 'public/assets/images/projects-other/52439627_2109289665813685_4962013976637472768_n.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/41897910_1898513906891263_125933887137251328_n.jpg', 'public/assets/images/projects-other/41897910_1898513906891263_125933887137251328_n.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/2.-Prerak-Gibpura1-1.jpg', 'public/assets/images/projects-other/2.-Prerak-Gibpura1-1.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/1.-Prerak-Gibpura-1.jpg', 'public/assets/images/projects-other/1.-Prerak-Gibpura-1.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/3.-Prerak-Shela5-1.jpg', 'public/assets/images/projects-other/3.-Prerak-Shela5-1.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/5.-Prerak-Gibpura4-2.jpg', 'public/assets/images/projects-other/5.-Prerak-Gibpura4-2.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/7.-Prerak-Shela3-1.jpg', 'public/assets/images/projects-other/7.-Prerak-Shela3-1.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/EEP1.jpg', 'public/assets/images/projects-other/EEP1.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/IMG-6792-scaled.jpg', 'public/assets/images/projects-other/IMG-6792-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/1.-ComepleEd-400x300.jpg', 'public/assets/images/projects-other/1.-ComepleEd-400x300.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/2.-CE-Euro3-400x300.jpg', 'public/assets/images/projects-other/2.-CE-Euro3-400x300.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/5.-CE-Euro-400x300.jpg', 'public/assets/images/projects-other/5.-CE-Euro-400x300.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/3.-CE-400x300.jpg', 'public/assets/images/projects-other/3.-CE-400x300.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/16996241_1282579728484687_5455839563356170607_n-400x300.jpg', 'public/assets/images/projects-other/16996241_1282579728484687_5455839563356170607_n-400x300.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/17190881_1299236560152337_8921162791339627699_n-400x300.jpg', 'public/assets/images/projects-other/17190881_1299236560152337_8921162791339627699_n-400x300.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/17553777_1316794351729891_522839763524810990_n-400x300.jpg', 'public/assets/images/projects-other/17553777_1316794351729891_522839763524810990_n-400x300.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2019/07/18341855_1370952979647361_5740096690900780295_n-400x300.jpg', 'public/assets/images/projects-other/18341855_1370952979647361_5740096690900780295_n-400x300.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/1.-colDev4.jpg', 'public/assets/images/projects-other/1.-colDev4.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/2.-colDev1.jpg', 'public/assets/images/projects-other/2.-colDev1.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/colDev3.jpg', 'public/assets/images/projects-other/colDev3.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/colDev5.jpg', 'public/assets/images/projects-other/colDev5.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Colldev_adalaj.jpg', 'public/assets/images/projects-other/Colldev_adalaj.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Collg-dev-adalaj.jpg', 'public/assets/images/projects-other/Collg-dev-adalaj.jpg'],

  // ── THRIVE ──────────────────────────────────
  ['https://tideinternational.org/wp-content/uploads/2024/09/Untitled-design-3.png', 'public/assets/images/thrive/research-happiness-curriculum.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/09/Untitled-design.png', 'public/assets/images/thrive/research-prabhav.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/09/Untitled-design-2.png', 'public/assets/images/thrive/research-twd.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/12/SCF-2-Copy.jpg', 'public/assets/images/thrive/research-scf.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2024/12/MCC-4-Copy-e1735278564395.png', 'public/assets/images/thrive/research-mcc.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/12/Jwalin-Patel-150x150.jpg', 'public/assets/images/thrive/team-jwalin-patel.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2024/12/Seema-Nath-150x150.jpg', 'public/assets/images/thrive/team-seema-nath.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2024/12/Mansi.jpg', 'public/assets/images/thrive/team-mansi-nanda.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2024/12/Rohini-150x150.jpg', 'public/assets/images/thrive/team-rohini-sen.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2024/12/Murari-150x150.jpg', 'public/assets/images/thrive/team-murari-jha.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2025/03/Thilanka-Wijesinghe-photo-150x150.jpg', 'public/assets/images/thrive/team-thilanka-wijesinghe.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2024/12/Muskan-e1735105541167-150x150.jpg', 'public/assets/images/thrive/team-muskan-khanna.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2024/12/Magdhi-e1735105639135-150x150.jpg', 'public/assets/images/thrive/team-magdhi-diksha.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2025/05/IMG_20250507_195508-150x150.jpg', 'public/assets/images/thrive/team-sangeeta-bhatt.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2024/12/Paran-150x150.jpg', 'public/assets/images/thrive/team-paran-amitava.jpg'],

  // ── THRIVE HAPPINESS ────────────────────────
  ['https://tideinternational.org/wp-content/uploads/2025/05/1743511760907.jpeg', 'public/assets/images/thrive-happiness/bg-sel-paper.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2024/12/HCPG-2-722x1024.jpg', 'public/assets/images/thrive-happiness/bg-cies-2024-poster.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2024/12/HCPG-1-1024x727.png', 'public/assets/images/thrive-happiness/bg-templeton-conf.png'],
  ['https://tideinternational.org/wp-content/uploads/2025/05/Screenshot-2025-05-07-205515-1024x572.png', 'public/assets/images/thrive-happiness/bg-cies-2024-talk.png'],
  ['https://tideinternational.org/wp-content/uploads/2025/05/ACP-2.1-1024x640.png', 'public/assets/images/thrive-happiness/bg-selebrating-summit.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/image-30-e1699293457936.png', 'public/assets/images/thrive-happiness/bg-blog-research.png'],

  // ── GET INVOLVED — VOLUNTEER ─────────────────
  ['https://tideinternational.org/wp-content/uploads/2023/05/TIDE-Generic-poster-2023-e1684472814162-300x500.png', 'public/assets/images/get-involved-volunteer/poster-2023.png'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/11008600_870488893027108_9211228557483356700_n.jpg', 'public/assets/images/get-involved-volunteer/gallery-01.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/11745394_870488913027106_2244297055367868169_n.jpg', 'public/assets/images/get-involved-volunteer/gallery-02.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/11781695_877258999016764_1473033283777824002_n.jpg', 'public/assets/images/get-involved-volunteer/gallery-03.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/All-smiles.jpg', 'public/assets/images/get-involved-volunteer/gallery-04.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/13415658_1039492479460081_6951674306312123477_o.jpg', 'public/assets/images/get-involved-volunteer/gallery-05.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/11816363_881601235242059_8756862025003425791_n.jpg', 'public/assets/images/get-involved-volunteer/gallery-06.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/11713714_872285702847427_2129019032022910348_o.jpg', 'public/assets/images/get-involved-volunteer/gallery-07.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/31674712_1714756031933719_2846244779467997184_n.jpg', 'public/assets/images/get-involved-volunteer/gallery-08.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/60300747_2224342654308385_3304645646832631808_n.jpg', 'public/assets/images/get-involved-volunteer/gallery-09.jpg'],
  // Extra URL referenced in Volunteer.jsx
  ['https://tideinternational.org/wp-content/uploads/2021/09/DSC_0101-scaled.jpg', 'public/assets/images/get-involved-volunteer/hero.jpg'],

  // ── GET INVOLVED — DONATE ───────────────────
  ['https://tideinternational.org/wp-content/uploads/2024/01/TIDE-Generic-poster-4-2023-with-QR-Code-Low-Res.png', 'public/assets/images/get-involved-donate/qr-donate-poster.png'],

  // ── RESOURCES — ANNUAL REPORTS ──────────────
  ['https://tideinternational.org/wp-content/uploads/2026/02/Screenshot-2026-02-27-192012-e1772200509544.png', 'public/assets/images/resources-annual-reports/report-2025-26.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/11/23-24-e1732526930490.png', 'public/assets/images/resources-annual-reports/report-2023-24.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/12/22-23-1.png', 'public/assets/images/resources-annual-reports/report-2022-23.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/12/21-22.png', 'public/assets/images/resources-annual-reports/report-2021-22.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/12/20-21.png', 'public/assets/images/resources-annual-reports/report-2020-21.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/12/19-20.png', 'public/assets/images/resources-annual-reports/report-2019-20.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/12/14-19.png', 'public/assets/images/resources-annual-reports/report-2014-19.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/12/14-15.png', 'public/assets/images/resources-annual-reports/report-2014-15.png'],

  // ── RESOURCES — PUBLICATIONS ─────────────────
  ['https://tideinternational.org/wp-content/uploads/2023/01/79493113_2612303448845635_1058027290283212800_n.jpg', 'public/assets/images/resources-publications/saral-kadam-booklets.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2023/01/978-3-031-23538-2_15331_SPRE_HB_A5_Dombrowski-Dirk-4-1_page-0001.jpg', 'public/assets/images/resources-publications/publication-1.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2023/01/poster-2.2.png', 'public/assets/images/resources-publications/moi-poster.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/06/MLI-Logo-2022-opengraph-vertical-e1686663012463.png', 'public/assets/images/resources-publications/mli-logo.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/06/Happiness_Activity_Delhi_Government_School-1536x925-1-e1686662597856.jpg', 'public/assets/images/resources-publications/happiness-study.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2023/01/Screenshot-2023-01-12-19.48.14.png', 'public/assets/images/resources-publications/case-study-covid.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/01/JNP-IIMA-Seminar.jpg', 'public/assets/images/resources-publications/iima-seminar.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2023/01/Screenshot-2023-01-12-19.54.16.png', 'public/assets/images/resources-publications/blog-covid.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/01/Screenshot-2023-01-12-20.34.44.png', 'public/assets/images/resources-publications/rte-presentation.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/01/Screenshot-2023-01-12-20.49.09.png', 'public/assets/images/resources-publications/vision-education.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/01/WhatsApp-Image-2021-05-18-at-17.32.21.jpeg', 'public/assets/images/resources-publications/ummeed-talk.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2023/01/Screenshot-2023-01-12-21.05.37.png', 'public/assets/images/resources-publications/citizens-in-making.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/01/18814992_1390590147683644_5934791944081129279_o.jpg', 'public/assets/images/resources-publications/cambridge-presentation.jpg'],

  // ── RESOURCES — SARAL KADAM ─────────────────
  ['https://tideinternational.org/wp-content/uploads/2023/01/L0B1.png', 'public/assets/images/resources-saral-kadam/L0B1.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/01/LOB2.png', 'public/assets/images/resources-saral-kadam/LOB2.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/01/L2B1.png', 'public/assets/images/resources-saral-kadam/L2B1.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/01/L2B2.png', 'public/assets/images/resources-saral-kadam/L2B2.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/01/L2B3.png', 'public/assets/images/resources-saral-kadam/L2B3.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/01/L2B4.png', 'public/assets/images/resources-saral-kadam/L2B4.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/01/L1B1.png', 'public/assets/images/resources-saral-kadam/L1B1.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/01/L1B2.png', 'public/assets/images/resources-saral-kadam/L1B2.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/01/L1B3.png', 'public/assets/images/resources-saral-kadam/L1B3.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/01/L1B4.png', 'public/assets/images/resources-saral-kadam/L1B4.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/01/L3B1.png', 'public/assets/images/resources-saral-kadam/L3B1.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/01/L3B2.png', 'public/assets/images/resources-saral-kadam/L3B2.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/01/L3B3.png', 'public/assets/images/resources-saral-kadam/L3B3.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/01/L3B4.png', 'public/assets/images/resources-saral-kadam/L3B4.png'],
  // Extra URL referenced in SaralKadam.jsx
  ['https://tideinternational.org/wp-content/uploads/2023/01/saral-kadam.jpg', 'public/assets/images/resources-saral-kadam/saral-kadam-hero.jpg'],

  // ── RESOURCES — SARAL KADAM PROGRAM ─────────
  ['https://tideinternational.org/wp-content/uploads/2019/07/Untitled.png', 'public/assets/images/resources-saral-kadam-program/diagram.png'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/SKP-1.jpg', 'public/assets/images/resources-saral-kadam-program/SKP-1.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/SKP-2.jpg', 'public/assets/images/resources-saral-kadam-program/SKP-2.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/SKP-3.jpg', 'public/assets/images/resources-saral-kadam-program/SKP-3.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/SKP-4.jpg', 'public/assets/images/resources-saral-kadam-program/SKP-4.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/SKP-5.jpg', 'public/assets/images/resources-saral-kadam-program/SKP-5.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/WhatsApp-Image-2019-12-17-at-17.41.11.jpeg', 'public/assets/images/resources-saral-kadam-program/WhatsApp-Image-2019-12-17-at-17.41.11.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/WhatsApp-Image-2019-12-27-at-16.47.54.jpeg', 'public/assets/images/resources-saral-kadam-program/WhatsApp-Image-2019-12-27-at-16.47.54.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/SKP-books-2.jpeg', 'public/assets/images/resources-saral-kadam-program/SKP-books-2.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/81668042_2675536602522319_7897585219639705600_o.jpg', 'public/assets/images/resources-saral-kadam-program/81668042_2675536602522319_7897585219639705600_o.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/82413901_2700945739981405_414843091460030464_o.jpg', 'public/assets/images/resources-saral-kadam-program/82413901_2700945739981405_414843091460030464_o.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/82479417_2677624945646818_1995615356760096768_o.jpg', 'public/assets/images/resources-saral-kadam-program/82479417_2677624945646818_1995615356760096768_o.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/83226810_2727046604037985_1652196665194446848_o.jpg', 'public/assets/images/resources-saral-kadam-program/83226810_2727046604037985_1652196665194446848_o.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/83878045_2727046410709784_8826022948479418368_o.jpg', 'public/assets/images/resources-saral-kadam-program/83878045_2727046410709784_8826022948479418368_o.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/83894290_2710403325702313_2019528175591096320_o.jpg', 'public/assets/images/resources-saral-kadam-program/83894290_2710403325702313_2019528175591096320_o.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/84301658_2727045944038051_2642110356893204480_o.jpg', 'public/assets/images/resources-saral-kadam-program/84301658_2727045944038051_2642110356893204480_o.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/79438782_2629146707161309_2962846273901690880_o.jpg', 'public/assets/images/resources-saral-kadam-program/79438782_2629146707161309_2962846273901690880_o.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/80673830_2664501906959122_5286949731711320064_o.jpg', 'public/assets/images/resources-saral-kadam-program/80673830_2664501906959122_5286949731711320064_o.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2020/02/81501209_2677624952313484_8704055536661823488_o.jpg', 'public/assets/images/resources-saral-kadam-program/81501209_2677624952313484_8704055536661823488_o.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Popatpura-SKP-prediwali-2022-scaled.jpg', 'public/assets/images/resources-saral-kadam-program/Popatpura-SKP-prediwali-2022-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Fangadi-SKP-Prediwali-2022-1-scaled.jpg', 'public/assets/images/resources-saral-kadam-program/Fangadi-SKP-Prediwali-2022-1-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Fangadi-SKP-Prediwali-2022-2-scaled.jpg', 'public/assets/images/resources-saral-kadam-program/Fangadi-SKP-Prediwali-2022-2-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Fangadi-SKP-Prediwali-2022-3-scaled.jpg', 'public/assets/images/resources-saral-kadam-program/Fangadi-SKP-Prediwali-2022-3-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Fangadi-SKP-Prediwali-2022-4-scaled.jpg', 'public/assets/images/resources-saral-kadam-program/Fangadi-SKP-Prediwali-2022-4-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Kunwar-SKP-prediwali-2022-1-scaled.jpg', 'public/assets/images/resources-saral-kadam-program/Kunwar-SKP-prediwali-2022-1-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Lekhambha-SKP-prediwali-2022-1-scaled.jpg', 'public/assets/images/resources-saral-kadam-program/Lekhambha-SKP-prediwali-2022-1-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Lekhambha-SKP-prediwali-2022-2-scaled.jpg', 'public/assets/images/resources-saral-kadam-program/Lekhambha-SKP-prediwali-2022-2-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Lekhambha-SKP-prediwali-2022-3-scaled.jpg', 'public/assets/images/resources-saral-kadam-program/Lekhambha-SKP-prediwali-2022-3-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Lekhambha-SKP-prediwali-2022-4-scaled.jpg', 'public/assets/images/resources-saral-kadam-program/Lekhambha-SKP-prediwali-2022-4-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Lekhambha-SKP-prediwali-2022-5-scaled.jpg', 'public/assets/images/resources-saral-kadam-program/Lekhambha-SKP-prediwali-2022-5-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Lekhambha-SKP-prediwali-2022-6-scaled.jpg', 'public/assets/images/resources-saral-kadam-program/Lekhambha-SKP-prediwali-2022-6-scaled.jpg'],

  // ── PROJECTS — SCF ──────────────────────────
  ['https://tideinternational.org/wp-content/uploads/2023/09/Beige-Minimalist-Timeline-Diagram-Graph.png', 'public/assets/images/projects-scf/timeline-diagram.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/Areas-of-work.png', 'public/assets/images/projects-scf/areas-of-work.png'],
  ['https://tideinternational.org/wp-content/uploads/2023/09/TIMELINE-300x300.png', 'public/assets/images/projects-scf/timeline-small.png'],

  // ── PROJECTS — SCF TEAM ─────────────────────
  ['https://tideinternational.org/wp-content/uploads/2024/04/image_2024-04-28_122605008-150x150.png', 'public/assets/images/projects-scf-team/arav-gupta.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/04/image_2024-04-28_122823768-150x150.png', 'public/assets/images/projects-scf-team/havisha-chokshi.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/04/image_2024-04-28_121809657-150x150.png', 'public/assets/images/projects-scf-team/yashvit-sancheti.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/04/image_2024-04-28_003232798-150x150.png', 'public/assets/images/projects-scf-team/anaya-patel.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/04/image_2024-04-28_003759253-150x150.png', 'public/assets/images/projects-scf-team/aarushi-patel.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/06/Samaya-150x150.jpg', 'public/assets/images/projects-scf-team/samaya-bhowmick.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2024/04/image_2024-04-28_124235494-e1718523737890-130x130.png', 'public/assets/images/projects-scf-team/tanay-sanghvi.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/04/image_2024-04-28_125056641-150x150.png', 'public/assets/images/projects-scf-team/prisha-arora.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/04/image_2024-04-28_130759026-150x150.png', 'public/assets/images/projects-scf-team/anaya-zaveri.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/04/image_2024-04-28_132313751-150x150.png', 'public/assets/images/projects-scf-team/hiya-patel.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/04/image_2024-04-28_132716589-150x150.png', 'public/assets/images/projects-scf-team/arth-patel.png'],

  // ── PROJECTS — MOI ──────────────────────────
  ['https://tideinternational.org/wp-content/uploads/2023/06/19665640_1424334867642505_2806997760349744936_n.jpg', 'public/assets/images/projects-moi/moi-photo.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2023/06/MOI-Outline-Poster.jpg', 'public/assets/images/projects-moi/moi-poster.jpg'],

  // ── PROJECTS — MOI 2023 ─────────────────────
  ['https://tideinternational.org/wp-content/uploads/2023/06/Miracle-of-Ideas-Email-Brochure_Page_1.jpg', 'public/assets/images/projects-moi2023/brochure-p1.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2023/06/Miracle-of-Ideas-Email-Brochure_Page_2.jpg', 'public/assets/images/projects-moi2023/brochure-p2.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2023/06/Miracle-of-Ideas-Email-Brochure_Page_3.jpg', 'public/assets/images/projects-moi2023/brochure-p3.jpg'],

  // ── PROJECTS — MOI 2024 ─────────────────────
  ['https://tideinternational.org/wp-content/uploads/2024/06/1.png', 'public/assets/images/projects-moi2024/signup-poster.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/06/image_2024-06-15_215401524-150x150.png', 'public/assets/images/projects-moi2024/icon-exhibition.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/06/image_2024-06-15_215319095-150x150.png', 'public/assets/images/projects-moi2024/icon-panel-talks.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/06/image_2024-06-15_215444375-150x150.png', 'public/assets/images/projects-moi2024/icon-mcc.png'],
  ['https://tideinternational.org/wp-content/uploads/2024/06/image_2024-06-15_215510703-150x150.png', 'public/assets/images/projects-moi2024/icon-interventions.png'],

  // ── PROJECTS — MCC ──────────────────────────
  ['https://tideinternational.org/wp-content/uploads/2025/06/WhatsApp-Image-2025-05-06-at-19.13.12-964x1024.jpeg', 'public/assets/images/projects-mcc/mcc-2024-navjeevan.jpeg'],
  ['https://tideinternational.org/wp-content/uploads/2024/12/MCC-4-Copy-e1735278564395.png', 'public/assets/images/projects-mcc/mcc-4-copy.png'],
  ['https://tideinternational.org/wp-content/uploads/2025/06/DSC04266-scaled.jpg', 'public/assets/images/projects-mcc/mccx-2025-au.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2025/06/IMG_0259.jpg', 'public/assets/images/projects-mcc/mccx-2025-ggis.jpg'],

  // ── PROJECTS — DISHA ────────────────────────
  ['https://tideinternational.org/wp-content/uploads/2022/10/1.-Sk-Yateemkhana.jpg', 'public/assets/images/projects-disha/1.-Sk-Yateemkhana.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/2.-Sk-Odhav-Social-activism-works.jpg', 'public/assets/images/projects-disha/2.-Sk-Odhav-Social-activism-works.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/3.-Sk-Yateemkhana1.jpg', 'public/assets/images/projects-disha/3.-Sk-Yateemkhana1.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/4.-Sk-Yateemkhana2.jpg', 'public/assets/images/projects-disha/4.-Sk-Yateemkhana2.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Fangdi-prediwali-2022-1-scaled.jpg', 'public/assets/images/projects-disha/Fangdi-prediwali-2022-1-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Fangdi-prediwali-2022-2-scaled.jpg', 'public/assets/images/projects-disha/Fangdi-prediwali-2022-2-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Fangdi-prediwali-2022-3-scaled.jpg', 'public/assets/images/projects-disha/Fangdi-prediwali-2022-3-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Fangdi-prediwali-2022-4-scaled.jpg', 'public/assets/images/projects-disha/Fangdi-prediwali-2022-4-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Fangdi-prediwali-2022-5-scaled.jpg', 'public/assets/images/projects-disha/Fangdi-prediwali-2022-5-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Lekhambha-prediwali-2022-1-scaled.jpg', 'public/assets/images/projects-disha/Lekhambha-prediwali-2022-1-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Lekhambha-prediwali-2022-2-scaled.jpg', 'public/assets/images/projects-disha/Lekhambha-prediwali-2022-2-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Lekhambha-prediwali-2022-3-scaled.jpg', 'public/assets/images/projects-disha/Lekhambha-prediwali-2022-3-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Gokalpura-prediwali-2022-1-scaled.jpg', 'public/assets/images/projects-disha/Gokalpura-prediwali-2022-1-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Gokalpura-prediwali-2022-2-scaled.jpg', 'public/assets/images/projects-disha/Gokalpura-prediwali-2022-2-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Gokalpura-prediwali-2022-3-scaled.jpg', 'public/assets/images/projects-disha/Gokalpura-prediwali-2022-3-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Khicha-Prediwali-2022-scaled.jpg', 'public/assets/images/projects-disha/Khicha-Prediwali-2022-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Mankol-prediwali-2022-scaled.jpg', 'public/assets/images/projects-disha/Mankol-prediwali-2022-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Vicchya-prediwali-2022-1-scaled.jpg', 'public/assets/images/projects-disha/Vicchya-prediwali-2022-1-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Vicchya-prediwali-2022-2-scaled.jpg', 'public/assets/images/projects-disha/Vicchya-prediwali-2022-2-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/Vicchya-prediwali-2022-3-scaled.jpg', 'public/assets/images/projects-disha/Vicchya-prediwali-2022-3-scaled.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/4.-Sk-Yateemkhana2-1.jpg', 'public/assets/images/projects-disha/4.-Sk-Yateemkhana2-1.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/1.-Sk-Yateemkhana-1.jpg', 'public/assets/images/projects-disha/1.-Sk-Yateemkhana-1.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/2.-Sk-Odhav-Social-activism-works-1.jpg', 'public/assets/images/projects-disha/2.-Sk-Odhav-Social-activism-works-1.jpg'],
  ['https://tideinternational.org/wp-content/uploads/2022/10/3.-Sk-Yateemkhana1-1.jpg', 'public/assets/images/projects-disha/3.-Sk-Yateemkhana1-1.jpg'],

  // ── PROJECTS — PRABHAV ──────────────────────
  ['https://tideinternational.org/wp-content/uploads/2024/09/Schools2030-Poster.png', 'public/assets/images/projects-prabhav/schools2030-poster.png'],

  // ── PROJECTS — TWD ──────────────────────────
  ['https://tideinternational.org/wp-content/uploads/2024/09/TWD-Poster-1.png', 'public/assets/images/projects-twd/twd-poster.png'],
];

// ─────────────────────────────────────────────
// DOWNLOAD LOGIC
// ─────────────────────────────────────────────
const CONCURRENCY = 8;
const results = { downloaded: 0, skipped: 0, failed: [] };

async function downloadImage(url, localPath) {
  const dest = path.join(ROOT, localPath);

  // Skip if already exists
  if (fs.existsSync(dest)) {
    results.skipped++;
    return;
  }

  // Ensure directory exists
  fs.mkdirSync(path.dirname(dest), { recursive: true });

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TIDE-image-downloader/1.0)' },
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      results.failed.push({ url, localPath, reason: `HTTP ${res.status}` });
      return;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buffer);
    results.downloaded++;
    process.stdout.write(`  ✓ ${localPath}\n`);
  } catch (err) {
    results.failed.push({ url, localPath, reason: err.message });
    process.stdout.write(`  ✗ FAILED: ${localPath} — ${err.message}\n`);
  }
}

async function runWithConcurrency(tasks, limit) {
  let i = 0;
  async function next() {
    while (i < tasks.length) {
      const task = tasks[i++];
      await task();
    }
  }
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, next);
  await Promise.all(workers);
}

(async () => {
  console.log(`\nTIDE Foundation Image Downloader`);
  console.log(`Total images to process: ${IMAGES.length}\n`);

  const tasks = IMAGES.map(([url, localPath]) => () => downloadImage(url, localPath));
  await runWithConcurrency(tasks, CONCURRENCY);

  console.log(`\n─────────────────────────────────`);
  console.log(`Downloaded : ${results.downloaded}`);
  console.log(`Skipped    : ${results.skipped} (already existed)`);
  console.log(`Failed     : ${results.failed.length}`);
  if (results.failed.length > 0) {
    console.log(`\nFailed URLs:`);
    results.failed.forEach(f => console.log(`  [${f.reason}] ${f.url}\n    → ${f.localPath}`));
  }
  console.log(`─────────────────────────────────\n`);
})();
