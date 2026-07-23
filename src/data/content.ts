export type Lang = 'id' | 'en';

export interface ProjectEntry {
  title: string;
  description: string;
  tags: string[];
  href: string;
}

export interface SkillGroup {
  label: string;
  items: string[];
}

export interface StatEntry {
  value: string;
  label: string;
}

export interface BlogPostEntry {
  title: string;
  excerpt: string;
  date: string;
  tag: string;
}

export interface SiteContent {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    about: string;
    skills: string;
    projects: string;
    blog: string;
    contact: string;
  };
  hero: {
    eyebrow: string;
    name: string;
    tagline: string;
    intro: string;
    ctaPrimary: string;
    ctaSecondary: string;
    stats: StatEntry[];
  };
  about: {
    eyebrow: string;
    heading: string;
    paragraphs: string[];
  };
  skills: {
    eyebrow: string;
    heading: string;
    note: string;
    groups: SkillGroup[];
  };
  projects: {
    eyebrow: string;
    heading: string;
    note: string;
    items: ProjectEntry[];
    linkLabel: string;
  };
  blog: {
    eyebrow: string;
    heading: string;
    note: string;
    posts: BlogPostEntry[];
  };
  contact: {
    eyebrow: string;
    heading: string;
    body: string;
    email: string;
  };
  footer: {
    backToTop: string;
    rights: string;
  };
  themeToggle: {
    toLight: string;
    toDark: string;
  };
  langToggle: {
    label: string;
  };
}

export const content: Record<Lang, SiteContent> = {
  id: {
    meta: {
      title: 'I Putu Arcana — Portofolio',
      description:
        'Portofolio I Putu Arcana, mahasiswa Ilmu Komputer di Universitas Pendidikan Ganesha.',
    },
    nav: {
      about: 'Tentang',
      skills: 'Keahlian',
      projects: 'Proyek',
      blog: 'Blog',
      contact: 'Kontak',
    },
    hero: {
      eyebrow: 'Mahasiswa Ilmu Komputer',
      name: 'I Putu Arcana',
      tagline: 'Membangun hal-hal kecil dengan niat yang jelas.',
      intro:
        'Saya belajar merancang dan membangun perangkat lunak sambil mencari kebenaran di balik setiap masalah yang saya pecahkan.',
      ctaPrimary: 'Lihat proyek',
      ctaSecondary: 'Hubungi saya',
      stats: [
        { value: '3', label: 'Proyek berjalan' },
        { value: '2+', label: 'Tahun belajar coding' },
        { value: 'UNDIKSHA', label: 'Kampus saat ini' },
      ],
    },
    about: {
      eyebrow: 'Tentang',
      heading: 'Sedikit tentang saya',
      paragraphs: [
        'Saya I Putu Arcana, mahasiswa Ilmu Komputer di Universitas Pendidikan Ganesha (NIM 2315101067). Saya tertarik pada proses membangun sesuatu dari nol — mulai dari ide, struktur, sampai detail kecil yang membuatnya terasa selesai.',
        'Di luar kode, saya menggambar dan berlatih calisthenics — dua hal yang sama-sama mengajarkan saya soal kesabaran dan pengulangan. Cita-cita saya sederhana: terus mengungkap kebenaran di balik setiap hal yang saya pelajari.',
      ],
    },
    skills: {
      eyebrow: 'Keahlian',
      heading: 'Apa yang saya kerjakan',
      note: 'Placeholder — akan diperbarui dengan keahlian nyata.',
      groups: [
        { label: 'Bahasa', items: ['JavaScript', 'TypeScript', 'Python'] },
        { label: 'Framework', items: ['Astro', 'React', 'Node.js'] },
        { label: 'Alat', items: ['Git', 'Figma', 'VS Code'] },
      ],
    },
    projects: {
      eyebrow: 'Proyek',
      heading: 'Pekerjaan terpilih',
      note: 'Placeholder — proyek asli menyusul.',
      linkLabel: 'Lihat proyek',
      items: [
        {
          title: 'Proyek Satu',
          description: 'Deskripsi singkat proyek ini akan ditambahkan di sini.',
          tags: ['Web', 'Astro'],
          href: 'https://github.com/IPutuArcana',
        },
        {
          title: 'Proyek Dua',
          description: 'Deskripsi singkat proyek ini akan ditambahkan di sini.',
          tags: ['API', 'Node.js'],
          href: 'https://github.com/IPutuArcana',
        },
        {
          title: 'Proyek Tiga',
          description: 'Deskripsi singkat proyek ini akan ditambahkan di sini.',
          tags: ['Mobile'],
          href: 'https://github.com/IPutuArcana',
        },
      ],
    },
    blog: {
      eyebrow: 'Blog',
      heading: 'Catatan & pemikiran',
      note: 'Placeholder — tulisan asli menyusul.',
      posts: [
        {
          title: 'Memulai proyek pertama',
          excerpt: 'Catatan singkat tentang bagaimana saya mulai belajar membangun sesuatu dari nol.',
          date: '2026-01-10',
          tag: 'Jurnal',
        },
        {
          title: 'Apa yang saya pelajari dari Astro',
          excerpt: 'Placeholder — refleksi tentang proses membangun portofolio ini akan ditambahkan di sini.',
          date: '2026-02-02',
          tag: 'Coding',
        },
        {
          title: 'Coding dan calisthenics',
          excerpt: 'Placeholder — tentang kesabaran dan pengulangan, di kode maupun di latihan fisik.',
          date: '2026-03-15',
          tag: 'Pemikiran',
        },
      ],
    },
    contact: {
      eyebrow: 'Kontak',
      heading: "Mari terhubung",
      body: 'Terbuka untuk kolaborasi, diskusi, atau sekadar menyapa.',
      email: 'hello@example.com',
    },
    footer: {
      backToTop: 'Kembali ke atas',
      rights: 'Seluruh hak cipta dilindungi.',
    },
    themeToggle: {
      toLight: 'Mode terang',
      toDark: 'Mode gelap',
    },
    langToggle: {
      label: 'EN',
    },
  },
  en: {
    meta: {
      title: 'I Putu Arcana — Portfolio',
      description:
        'Portfolio of I Putu Arcana, a Computer Science student at Ganesha University of Education.',
    },
    nav: {
      about: 'About',
      skills: 'Skills',
      projects: 'Projects',
      blog: 'Blog',
      contact: 'Contact',
    },
    hero: {
      eyebrow: 'Computer Science Student',
      name: 'I Putu Arcana',
      tagline: 'Building small things with clear intent.',
      intro:
        "I'm learning to design and build software while chasing the truth behind every problem I solve.",
      ctaPrimary: 'View projects',
      ctaSecondary: 'Get in touch',
      stats: [
        { value: '3', label: 'Projects in progress' },
        { value: '2+', label: 'Years learning to code' },
        { value: 'UNDIKSHA', label: 'Currently studying at' },
      ],
    },
    about: {
      eyebrow: 'About',
      heading: 'A little about me',
      paragraphs: [
        "I'm I Putu Arcana, a Computer Science student at Ganesha University of Education (student ID 2315101067). I'm drawn to the process of building something from nothing — from idea, to structure, to the small details that make it feel finished.",
        'Outside of code, I draw and practice calisthenics — two things that both teach patience and repetition. My goal is simple: keep uncovering the truth behind everything I learn.',
      ],
    },
    skills: {
      eyebrow: 'Skills',
      heading: 'What I work with',
      note: 'Placeholder — will be updated with real skills.',
      groups: [
        { label: 'Languages', items: ['JavaScript', 'TypeScript', 'Python'] },
        { label: 'Frameworks', items: ['Astro', 'React', 'Node.js'] },
        { label: 'Tools', items: ['Git', 'Figma', 'VS Code'] },
      ],
    },
    projects: {
      eyebrow: 'Projects',
      heading: 'Selected work',
      note: 'Placeholder — real projects coming soon.',
      linkLabel: 'View project',
      items: [
        {
          title: 'Project One',
          description: 'A short description of this project will go here.',
          tags: ['Web', 'Astro'],
          href: 'https://github.com/IPutuArcana',
        },
        {
          title: 'Project Two',
          description: 'A short description of this project will go here.',
          tags: ['API', 'Node.js'],
          href: 'https://github.com/IPutuArcana',
        },
        {
          title: 'Project Three',
          description: 'A short description of this project will go here.',
          tags: ['Mobile'],
          href: 'https://github.com/IPutuArcana',
        },
      ],
    },
    blog: {
      eyebrow: 'Blog',
      heading: 'Notes & thoughts',
      note: 'Placeholder — real posts coming soon.',
      posts: [
        {
          title: 'Starting my first project',
          excerpt: 'A short note on how I started learning to build things from nothing.',
          date: '2026-01-10',
          tag: 'Journal',
        },
        {
          title: 'What I learned from Astro',
          excerpt: 'Placeholder — reflections on building this portfolio will go here.',
          date: '2026-02-02',
          tag: 'Coding',
        },
        {
          title: 'Coding and calisthenics',
          excerpt: 'Placeholder — on patience and repetition, in code and in training.',
          date: '2026-03-15',
          tag: 'Thoughts',
        },
      ],
    },
    contact: {
      eyebrow: 'Contact',
      heading: "Let's connect",
      body: "Open to collaboration, a chat, or just saying hi.",
      email: 'hello@example.com',
    },
    footer: {
      backToTop: 'Back to top',
      rights: 'All rights reserved.',
    },
    themeToggle: {
      toLight: 'Light mode',
      toDark: 'Dark mode',
    },
    langToggle: {
      label: 'ID',
    },
  },
};
