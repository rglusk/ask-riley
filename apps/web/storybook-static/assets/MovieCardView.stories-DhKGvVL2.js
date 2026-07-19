import{i as e}from"./preload-helper-MclHqJXp.js";import{n as t}from"./iframe-CAciqQP1.js";function n({title:e,year:t,director:n,take:i,vibe:a,poster:o,url:s}){return(0,r.jsxs)(`article`,{className:`flex w-full max-w-md overflow-hidden rounded-lg bg-zinc-950 text-zinc-100 shadow-lg shadow-black/40 ring-1 ring-zinc-800`,children:[o&&(0,r.jsx)(`img`,{src:o,alt:`${e} poster`,className:`w-28 shrink-0 self-stretch object-cover`}),(0,r.jsxs)(`div`,{className:`relative flex flex-col gap-2 p-4`,children:[(0,r.jsxs)(`header`,{children:[(0,r.jsx)(`h3`,{className:`font-semibold leading-tight text-zinc-50`,children:s?(0,r.jsx)(`a`,{href:s,target:`_blank`,rel:`noreferrer`,className:`hover:text-red-400 hover:underline`,children:e}):e}),(t||n)&&(0,r.jsx)(`p`,{className:`text-xs text-zinc-400`,children:[t,n].filter(Boolean).join(` · `)})]}),a&&(0,r.jsx)(`span`,{className:`w-fit rounded-full bg-red-950/60 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-red-300 ring-1 ring-red-900`,children:a}),(0,r.jsxs)(`p`,{className:`text-sm italic leading-snug text-zinc-300`,children:[`“`,i,`”`]}),(0,r.jsx)(`div`,{"aria-hidden":!0,className:`absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-red-900 via-red-600 to-red-950`})]})]})}var r,i=e((()=>{r=t(),n.__docgenInfo={description:``,methods:[],displayName:`MovieCardView`}})),a,o,s,c,l,u,d,f,p,m,h,g,_;e((()=>{a=t(),i(),o={title:`Oddity`,year:2024,director:`Damian McCarthy`,take:`That wooden man is going to live rent-free in my head forever — a masterclass in dread built from a single cursed prop.`,vibe:`folk dread`,poster:`/posters/oddity.jpg`,url:`https://www.imdb.com/title/tt26470109/`},s={title:`Obsession`,year:2025,director:`Curry Barker`,take:`Be careful what you wish for, dial it to eleven, and trap it in a car with you.`,vibe:`psychological`,poster:`/posters/obsession.jpg`,url:`https://www.imdb.com/title/tt37287335/`},c={title:`Exhuma`,year:2024,director:`Jang Jae-hyun`,take:`Korean folk horror that treats grave-digging with the gravity it deserves — and then goes somewhere you will not predict.`,vibe:`folk horror`,poster:`/posters/exhuma.jpg`,url:`https://www.imdb.com/title/tt27802490/`},l={title:`Blocks/MovieCard`,component:n},u={args:o},d={args:{...o,poster:void 0}},f={args:{...s,year:void 0,director:void 0}},p={args:{...c,vibe:void 0}},m={args:{title:`Exhuma`,take:`Just see it.`}},h={args:{...o,take:`A one-location, one-cursed-object movie that understands the oldest rule of horror: the scariest thing in any room is the thing you have decided not to look at directly, and the second scariest is the certainty that it moved while you were not looking, which this film weaponizes for ninety straight minutes without mercy.`}},g={args:o,render:()=>(0,a.jsxs)(`div`,{className:`flex flex-wrap gap-4`,children:[(0,a.jsx)(n,{...o}),(0,a.jsx)(n,{...s}),(0,a.jsx)(n,{...c})]})},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: oddity
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    ...oddity,
    poster: undefined
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    ...obsession,
    year: undefined,
    director: undefined
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    ...exhuma,
    vibe: undefined
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Exhuma",
    take: "Just see it."
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    ...oddity,
    take: "A one-location, one-cursed-object movie that understands the oldest rule of horror: the scariest thing in any room is the thing you have decided not to look at directly, and the second scariest is the certainty that it moved while you were not looking, which this film weaponizes for ninety straight minutes without mercy."
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: oddity,
  // unused by render; satisfies the required-props story type
  render: () => <div className="flex flex-wrap gap-4">
            <MovieCardView {...oddity} />
            <MovieCardView {...obsession} />
            <MovieCardView {...exhuma} />
        </div>
}`,...g.parameters?.docs?.source}}},_=[`Default`,`NoPoster`,`NoYearNoDirector`,`NoVibe`,`Minimal`,`LongTake`,`ThreeInARow`]}))();export{u as Default,h as LongTake,m as Minimal,d as NoPoster,p as NoVibe,f as NoYearNoDirector,g as ThreeInARow,_ as __namedExportsOrder,l as default};