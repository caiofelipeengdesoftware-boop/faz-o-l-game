# Como colocar o modo online para funcionar

O Netlify hospeda só o site. O modo online precisa de um servidor Node (`server.js`) ligado o tempo todo.
O jeito mais simples é hospedar **tudo no Render** (gratuito), no mesmo endereço.

## Opção A (recomendada): jogo e online no Render
1. Crie uma conta em render.com e clique em **New → Web Service**.
2. Conecte o repositório `faz-o-l-game` no GitHub.
3. O arquivo `render.yaml` já preenche tudo. Se pedir manualmente: Build `npm install && npm run build`, Start `node server.js`.
4. Quando terminar, abra o endereço `https://...onrender.com`. O canto da tela deve mostrar **"N NO DISTRITO"**.
   O plano gratuito dorme depois de um tempo parado; o primeiro acesso demora cerca de um minuto.

## Opção B: site no Netlify e servidor no Render
1. Suba o servidor no Render como acima.
2. No Render, em Environment, crie `ALLOWED_ORIGINS` com o endereço do Netlify (ex.: `https://meujogo.netlify.app`).
3. No Netlify, em Environment variables, crie `VITE_MULTIPLAYER_URL` com o endereço do Render e faça um novo deploy.

## Testar
Abra o jogo em duas abas (ou dois aparelhos), escolha **Sessão online → Entrar na cidade** nas duas. Cada uma deve ver o outro jogador.
Teste local: `npm run build` e depois `npm start`; abra `http://localhost:3001`.

## Voz e chat
- **Voz:** tecla V (ou direcional → no controle) liga o microfone. O navegador pede permissão uma vez. Só funciona em endereço https (o Render e o Netlify já são).
- **Texto:** tecla T. No controle, o direcional ↓ abre frases rápidas (A envia).
- **Achar um amigo:** abra Pausa → Online e toque em Rastrear (marca no mapa e no minimapa) ou Ir até (teleporta até ele). O minimapa mostra amigos mesmo longe, com uma seta na borda.
- As teclas e os botões de voz, chat e celular podem ser trocados em Pausa → Configurações.
