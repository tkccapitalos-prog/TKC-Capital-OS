# TKC Capital OS

Sistema operacional da TKC Capital em Next.js, com dashboard corporativo e um modulo de operacoes hoteleiras em `/hotel`.

## Modulo Hotel

O modulo inclui:

- tarefas por departamento, comentarios e fotografias;
- chat geral e chat autorizado por departamento;
- perfis de operadores criados previamente pela direcao;
- convite por email, criacao de palavra-passe e primeiro acesso;
- documentos PDF, Word e Excel por departamento;
- Housekeeping com 4 binomes e 74 quartos;
- interface em frances, portugues, ingles, espanhol, italiano e polaco;
- dominio de producao `app.tkccapital.pt`.

O antigo TKC Rooms deixa de ser um segundo sistema. A operacao dos quartos passa a fazer parte deste modulo.

## Arranque local

Requer Node.js 22 ou superior.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Abrir `http://localhost:3000`. A configuracao publica Supabase tem valores de producao de reserva; `.env.local` pode substitui-los em desenvolvimento.

## Variaveis Vercel

Adicionar nos ambientes Production, Preview e Development:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_PROJECT_ID
APP_PUBLIC_URL
API_PUBLIC_URL
```

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e uma chave publica para o browser. Convites e conclusao do primeiro acesso passam por Edge Functions autenticadas; as chaves administrativas disponibilizadas automaticamente pela Supabase nunca entram no codigo, na Vercel ou no GitHub.

## Validacao

```bash
npm run check:api
npm run lint
npm run build
```

Endpoint de saude: `/api/health`.
