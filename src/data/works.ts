import type { ProjectDevice } from './content'

/**
 * WORKS ページのデータ。
 * 出典：Wantedly プロフィール（https://www.wantedly.com/id/ayaka_uematsu8）と Quoline の LP。
 * 説明が公開されていない作品は `summary` を短くしています。担当・技術・チーム人数などを追記すると、そのままページに表示されます。
 */

export type Link = { label: string; href: string }

export type FeaturedWork = {
  no: string
  slug: string
  kind: string
  period: string
  title: string
  tagline?: string
  summary: string
  features?: string[]
  stack: string[]
  award?: string
  links: Link[]
  devices: ProjectDevice[]
}

export type ArchiveWork = {
  no: string
  period: string
  event: string
  title: string
  summary?: string
  award?: string
  /** 担当・使用技術など（任意） */
  stack?: string[]
  links?: Link[]
}

export type Award = { date: string; title: string; prize: string }
export type CareerItem = { period: string; org: string; role: string; summary: string; type: 'work' | 'study' }

export const featuredWorks: FeaturedWork[] = [
  {
    no: '001',
    slug: 'quoline',
    kind: 'INDIE DEVELOPMENT / APP STORE',
    period: '2026.02',
    title: 'Quoline',
    tagline: '言葉は、しおりになる。',
    summary:
      '読書中に心に残った一文を、しおりのように美しく残せる引用ブックマークアプリ。企画、UI/UX、開発を個人で手がけ、App Storeへリリースしました。',
    features: [
      '引用ブックマーク — 印象的な一行を、フォントやレイアウトを整えて保存',
      'パーソナル本棚 — 読書中・読了・読みたい本を分けて管理',
      '書籍統計 — 読書時間、ページ数、連続読書日数を記録',
    ],
    stack: ['Swift', 'Go', 'VPS', 'UI/UX', 'Google API'],
    links: [
      { label: 'APP STORE', href: 'https://apps.apple.com/jp/app/quoline/id6759971290' },
      { label: 'WEBSITE', href: 'https://www.quoline.net/' },
    ],
    devices: [
      { kind: 'iphone', mock: 'quoline', image: '/images/work/quoline-home.jpg' },
      { kind: 'iphone', mock: 'quoline', image: '/images/work/quoline-shelf.jpg' },
    ],
  },
  {
    no: '002',
    slug: 'begit',
    kind: 'HACKATHON / 技育CAMP2025 VOL.3',
    period: '2026.06',
    title: 'BeGit;',
    summary: 'Swift・Go・Cloudflare・GitHub API で開発したアプリ。技育CAMP2025 ハッカソン Vol.3 で最優秀賞を受賞しました。',
    stack: ['Swift', 'Go', 'Cloudflare', 'GitHub API'],
    award: '最優秀賞',
    links: [],
    devices: [
      { kind: 'iphone', mock: 'begit-home', image: '/images/work/begit-flow.jpg', video: '/videos/begit-flow.mp4' },
      { kind: 'iphone', mock: 'begit-stats', image: '/images/work/begit-points.jpg', video: '/videos/begit-points.mp4' },
    ],
  },
]

export const archiveWorks: ArchiveWork[] = [
  {
    no: '003',
    period: '2025.12 — 2026.01',
    event: '技育CAMP2025 ハッカソン Vol.17',
    title: '生成AIと融合した「ビデオ通話アプリ」',
    summary: '生成AIを組み込んだビデオ通話アプリ。',
  },
  {
    no: '004',
    period: '2025.12',
    event: 'マイナビハッカソン（AWS インターン 5日間）',
    title: '学生の悩みを解決するアプリ',
    summary: '直感的な UI/UX で学生の悩みを解決するアプリ。AWS の 5日間インターンの一環で制作しました。',
    award: 'グランプリ',
  },
  {
    no: '005',
    period: '2024.09',
    event: 'Mercari AI/LLM Hackathon',
    title: '攻めろ推し活 — メルコミュ —',
    summary: '推し活をテーマにした作品。',
    award: '優秀賞',
  },
  {
    no: '006',
    period: '2024.09',
    event: 'Tech.SummerCamp 2024',
    title: 'Tech.SummerCamp 2024 出場作品',
    award: '最優秀賞',
  },
  {
    no: '007',
    period: '2024.09',
    event: 'シンプルな生成AIハッカソン #4',
    title: '生成AIハッカソン出場作品',
  },
  {
    no: '008',
    period: '2024.08',
    event: '技育CAMP ハッカソン Vol.12',
    title: 'Jokey（ジョーキー）',
    summary: 'ダジャレを投稿して楽しむ SNS。',
  },
]

export const awards: Award[] = [
  { date: '2026.09', title: '技育博 Vol.2 2026', prize: 'サイバーエージェント賞 / ゆめみ賞' },
  { date: '2026.06', title: '技育CAMP2025 ハッカソン Vol.3', prize: '最優秀賞' },
  { date: '2025.12', title: 'マイナビハッカソン', prize: 'グランプリ' },
  { date: '2024.09', title: 'Mercari AI/LLM Hackathon', prize: '優秀賞' },
  { date: '2024.09', title: 'Tech.SummerCamp 2024', prize: '最優秀賞' },
]

export const credentials: Award[] = [
  { date: '2026.07', title: '基本情報技術者試験', prize: '合格' },
  { date: '2025.07', title: 'ICPC 予選', prize: '出場' },
  { date: '2024.06', title: 'ICPC 予選', prize: '出場' },
]

export const career: CareerItem[] = [
  {
    period: '2025.10 — NOW',
    org: 'アットマーク・ソリューション',
    role: '長期インターン / MOBILE',
    summary: 'グラフィック技術を用いた地図機能が特徴の、アクティブユーザーの多いアプリの保守・運用を担当。',
    type: 'work',
  },
  {
    period: '2025.04 — 2026.02',
    org: '42Tokyo 本科',
    role: 'LOW-LEVEL PROGRAMMING',
    summary: 'セキュリティやメモリ管理を意識した低レイヤプログラミング。テスターを自作して出力を検証。',
    type: 'study',
  },
  {
    period: '2024.08 — 2025.04',
    org: '株式会社ヴァンテージIT',
    role: '長期インターン / iOS',
    summary: 'Swift で美容記録アプリのバグ修正と新機能の追加。',
    type: 'work',
  },
  {
    period: '2024.04 — 2027.03',
    org: '東京通信大学 情報マネジメント学部',
    role: '編入',
    summary: '情報マネジメントを学びながら、ICPC 予選に 2 度出場。',
    type: 'study',
  },
  {
    period: '2022.11 — 2023.06',
    org: '株式会社アウトカム',
    role: '長期インターン / WEB',
    summary: 'WordPress での Web 制作に加え、SEO・マーケティング・広告デザインにも取り組む。',
    type: 'work',
  },
]
