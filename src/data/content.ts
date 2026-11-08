export type Skill = {
  no: string
  name: string
  description: string
}

export type Project = {
  no: string
  type: string
  title: string
  copy: string
  stack: string
  className: string
}

export type Post = {
  no: string
  category: string
  date: string
  title: string
  titleEn: string
  summary: string
  time: string
  body: string[]
}

export const skills: Skill[] = [
  { no: '01', name: 'SWIFT / SWIFTUI', description: 'Native systems, polished interfaces' },
  { no: '02', name: 'KOTLIN', description: 'Reliable Android experiences' },
  { no: '03', name: 'GO', description: 'Fast, observable infrastructure' },
  { no: '04', name: 'C', description: 'Systems close to the machine' },
  { no: '05', name: 'LINUX', description: 'Systems without abstractions' },
  { no: '06', name: 'SECURITY / NETWORK', description: 'Secure systems, protocols, and resilient networks' },
]

export const projects: Project[] = [
  {
    no: '001',
    type: 'HACKATHON / 2026',
    title: 'BeGit;',
    copy: 'Swift・Go・Cloudflare・GitHub APIで開発し、複数のハッカソンで受賞したアプリ。',
    stack: 'Swift · Go · Cloudflare · GitHub API',
    className: 'project-a',
  },
  {
    no: '002',
    type: 'INDIE DEVELOPMENT / 2026',
    title: 'Quoline',
    copy: '企画、UI/UX、開発を個人で手がけ、App Storeへリリースしたアプリ。',
    stack: 'Swift · Go · VPS · UI/UX · Google API',
    className: 'project-b',
  },
  {
    no: '003',
    type: 'LONG-TERM INTERNSHIP / 2025—PRESENT',
    title: 'MOBILE\nENGINEERING',
    copy: 'SwiftとKotlinを用いたモバイル開発に継続して携わる長期インターン。',
    stack: 'Swift · Kotlin',
    className: 'project-c',
  },
]

export const posts: Post[] = [
  {
    no: '0003',
    category: 'BOOKS',
    date: '2026.11.08',
    title: 'きょう読んだ本のはなし 2026/11/8',
    titleEn: 'BOOKS I READ TODAY — NOVEMBER 8, 2026',
    summary: '『サム・アルトマン』と『ゼロ・トゥ・ワン』を読み、AI、超知能、独占と独自性について考えました。',
    time: '3 MIN',
    body: [
      '## サム・アルトマン',
      'サム・アルトマンの野望を知ることができました。おすすめの本がたくさん紹介されていて、いろいろ読んでみたいなと思いました。',
      '**本の中で紹介されていた本**',
      '**『GENIUS MAKERS ジーニアスメーカーズ　Google、Facebook、そして世界にAIをもたらした信念と情熱の物語』**',
      '**『Founders at Work　33のスタートアップストーリー』**',
      '**『ゼロ・トゥ・ワン　君はゼロから何を生み出せるか』**',
      '**『無能より邪悪であれ　ピーター・ティール　シリコンバレーをつくった男』**',
      '## 『やさしき誘惑』',
      '脳にコンピュータをインストールし、意識を宇宙のレベルまで拡張し、全人類がシンギュラリティの衝撃を乗り越えられるように手助けする話です。',
      '> 「恐れに囚われず用心を知るものだけが、彼女のような本質的な賢明さを持つ者だけが、シンギュラリティを生き抜いたのだ」',
      '人間よりも、そして自分たちよりもさらに賢い機械を設計できる機械の開発を、複数の競争相手が同時に目指せば、人間が制御不可能な自滅的な競争状態に追いやられます。しかし、もし一つの機械が非常に速く超知能の状態に達し、他のすべての競争を抑え込むことができれば、人間の未来により良い影響を及ぼす可能性があります。',
      '## ゼロ・トゥ・ワン',
      '競争している時点で負けている。独占しろ。独自性で独占していることを隠せ。競合とは大きく違うことを目指せ。圧倒的に独占できるような、全く違うコンセプトを事前に計画し、そこにすべてを賭けろ。',
      '競合比較やベストプラクティスの模倣に縛られず、自分たちにしかできないことを考える姿勢は大切だと思いました。',
    ],
  },
  {
    no: '0002',
    category: 'BOOKS',
    date: '2026.11.01',
    title: 'きょう読んだ本のはなし 2026/11/1',
    titleEn: 'BOOKS I READ TODAY — NOVEMBER 1, 2026',
    summary: '化学図鑑と『サム・アルトマン』を読み、元素と起業家について学んだことを記録しました。',
    time: '2 MIN',
    body: [
      '## 化学図鑑',
      '高校の勉強を全くしていなかったので、この図鑑を読んで体系的に化学を学ぼうと思って読んでいます。今日は、周期表を見て、バック・トゥ・ザ・フューチャーに出てくるプルトニウムの存在を確認し、あらゆる実験器具の使い方を学びました。物質の成分や原子の構造のところも読み、物質は様々な元素で混じり合っていること、原子の小ささを確認しました。',
      '## サム・アルトマン',
      '昔から読書が大好きで頭がよく、リーダー気質があって、いろんな人に影響を受けやすい人という人物像が浮かび上がりました。',
      '**特に、ポール・グレアムのエッセイでスタートアップの成功方法を学ぶ姿に、私も影響を受けました。このエッセイ集は『ハッカーと画家』に収録されています。**',
    ],
  },
  {
    no: '0001',
    category: 'NEWS',
    date: '2026.10.30',
    title: 'ブログを始めました',
    titleEn: 'I STARTED A BLOG',
    summary: '開発や学び、個人開発の記録をこのブログに残していきます。',
    time: '1 MIN',
    body: [
      'ブログを始めました。ここでは、個人開発や日々の学び、プロダクトをつくる中で考えたことを記録していきます。',
      'Swiftを使ったモバイルアプリ開発、Goによるバックエンド、CloudflareやVPSを活用したインフラなど、実際に手を動かして得た知識を中心に発信する予定です。',
      '完成したものだけでなく、うまくいかなかったことや試行錯誤の過程も残し、次の開発につながる場所にしていきます。',
    ],
  },
]

export const categories = ['ALL', 'BOOKS', 'NEWS'] as const

export const thoughts = [
  { title: 'DEVELOPMENT PHILOSOPHY', translation: '開発思想' },
  { title: 'DESIGN PRINCIPLES', translation: '設計原則' },
  { title: 'APPROACH TO TECHNOLOGY', translation: '技術への向き合い方' },
  { title: 'PRODUCT RESPONSIBILITY', translation: 'プロダクトへの責任' },
] as const

export const books = [
  {
    no: '01',
    title: 'THE BEGINNING OF INFINITY',
    author: 'David Deutsch',
    image: '/images/library/cat-paw.jpg',
    alt: '壁に伸ばした黒猫の前足',
  },
  {
    no: '02',
    title: 'NEUROMANCER',
    author: 'William Gibson',
    image: '/images/library/cat-shades.jpg',
    alt: 'サングラスをかけた黒猫',
  },
  {
    no: '03',
    title: 'SIMULACRA AND SIMULATION',
    author: 'Jean Baudrillard',
    image: '/images/library/cat-curtain.jpg',
    alt: '白い布の間から顔を出す黒猫',
  },
  {
    no: '04',
    title: 'THE SELFISH GENE',
    author: 'Richard Dawkins',
    image: '/images/library/cat-pair.jpg',
    alt: '寄り添って座る黒猫と白猫',
  },
] as const
