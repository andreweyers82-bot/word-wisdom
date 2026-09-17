# Word & Wisdom — W5A

Independent GitHub edition of Word & Wisdom.

## Current standalone build
- React + Vite
- Premium W5A black, pearl and gold interface
- Bible chapter reader using the public World English Bible endpoint
- Daily Scripture card
- Private browser-based journal
- Responsive mobile/desktop layout
- PWA manifest and W5A app icon
- Vercel-ready routing
- No AppDeploy runtime dependency

## Deployment target
- GitHub source: `andreweyers82-bot/word-wisdom`
- Intended production subdomain: `https://word.w5a.co.za`
- Recommended hosting: Vercel

## Local development
```bash
npm install
npm run dev
```

## Next cloud phase
The next phase can add Supabase Google login, synced journals, groups/community, cloud storage and admin tools. Do not commit production secrets to this repository; configure them as deployment environment variables.
