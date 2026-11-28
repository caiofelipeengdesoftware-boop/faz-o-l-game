# FAZ O L

Jogo web em React, TypeScript, Three.js, React Three Fiber, Rapier e Socket.IO. Inclui três missões, câmera orbital com mira sobre o ombro, interiores de apartamento e boate, NPCs, animais, tráfego, chuva, ciclo dia/noite e modelos GLB opcionais. A sessão online compartilha objetivos e a etapa da ocorrência entre jogadores.

## Executar localmente

Instale as dependências uma vez:

```bash
npm install
```

Depois, abra dois terminais no diretório do projeto:

```bash
npm run server
```

```bash
npm run dev
```

Abra o endereço mostrado pelo Vite, normalmente `http://localhost:5173`. O proxy Vite conecta o cliente ao Socket.IO em `http://localhost:3001`.

Para servir o jogo e o multiplayer juntos num único processo:

```bash
npm start
```

Esse comando compila para `dist` e inicia o servidor em `http://localhost:3001`. Em produção, ajuste `PORT` se a hospedagem fornecer outra porta.

## Multiplayer hospedado

O Netlify serve o cliente estático; o Socket.IO precisa de um servidor Node.js separado que mantenha conexões WebSocket. Configure `VITE_MULTIPLAYER_URL` no ambiente de build do site apontando para o endereço HTTPS/WSS desse servidor. No servidor, configure `ALLOWED_ORIGINS` com a origem exata do site, por exemplo `https://seu-jogo.netlify.app`. O `server.js` inclui a verificação `/health`.

O chat de voz só pede o microfone depois que o jogador pressiona **VOZ**. O navegador exige HTTPS ou localhost. A conexão usa WebRTC direto e STUN público; redes restritas podem precisar de um serviço TURN. A sala de demonstração é pública e não tem autenticação de conta.

## Controles por contexto

| Ação | Xbox / 8BitDo / PlayStation | Teclado e mouse |
|---|---|---|
| Mover / dirigir | LS | W, A, S, D |
| Câmera / mirar | RS | Mouse |
| Correr | A / × | Shift |
| Pular | X / □ | Espaço |
| Interagir / entrar no veículo | Y / △ | E / F |
| Mirar / frear ou ré | LT / L2 | Botão direito / S |
| Atirar / acelerar | RT / R2 | Botão esquerdo / W |
| Recarregar / ataque corpo a corpo | B / ○ | R / Q |
| Cobertura / freio de mão | RB / R1 | Q / Espaço |
| Roda de armas / agachar | LB / L1 · L3 | Tab · Ctrl |
| Olhar para trás / buzina no carro | R3 / L3 | C / E |
| Mapa / câmera do carro | View / Share | M / V |
| Trabalhos / faróis / rádio no carro | Direcional ↑ / → / ← | J / H / Q |
| Pausar | Menu / Options | Esc / P |

Os menus aceitam direcional ou LS e **A / ×**. Em Configurações, ajuste o layout, a zona morta, a sensibilidade do RS e do mouse, os volumes e a qualidade gráfica. O modo de desempenho desliga sombras e reduz a resolução do render.

## Missões e mundo

- **Contratos suspeitos:** aceitar com a inspetora, recuperar a pasta e concluir o confronto.
- **Uma testemunha ouviu:** localizar e entrevistar Marina.
- **Ronda preventiva:** visitar os três pontos indicados.

As missões podem ficar ativas simultaneamente; cada uma mostra seu objetivo, recompensa e marcador quando selecionada. Na tela inicial, escolha **Sessão online** para selecionar Polícia, Cidadão ou Foragido. Os papéis identificam os jogadores; todos continuam aptos a cooperar na ocorrência compartilhada. Em jogo, ative **VOZ** para permitir o microfone.

Entre no apartamento pela porta sinalizada perto do endereço residencial. A boate fica perto de **-15, 8** no mapa; aproxime-se da entrada neon e aperte **E / Y / △**. A música procedural fica mais alta conforme você chega perto e toca no interior.

## Modelos externos

Coloque arquivos licenciados em `public/models/`:

- `player.glb` — modelo do jogador.
- `predio.glb` — modelo-base dos prédios.
- `environment.hdr` — iluminação ambiente HDRI.

O carregador testa se o arquivo existe e se não é uma resposta HTML. Se não existir ou falhar, o jogo usa personagem, edifícios PBR procedurais e reflexão de estúdio gerada localmente.

## Limites desta versão

Os personagens, veículos, animais, boate e edifícios desta demonstração usam formas procedurais; os personagens não têm captura de movimento e as motos ainda não são veículos pilotáveis. Os papéis online são de identificação e não têm conjuntos exclusivos de habilidades. A sala é pública, sem login, e precisa de um servidor Node acessível pela internet para conectar jogadores; WebRTC pode exigir TURN em redes restritas.


## Online
Veja `ONLINE.md` para hospedar o servidor multiplayer (Render) e fazer o modo online funcionar.


## Controles (podem ser trocados em Configurações)

| Ação | Teclado | Controle |
| --- | --- | --- |
| Mover / correr | WASD / Shift | analógico esquerdo / A |
| Mirar / atirar | botão direito / esquerdo | LT / RT |
| Interagir (portas, pessoas, cofre) | E | Y |
| Celular (missões, mensagens, provas) | P | direcional ← |
| Chat de voz (liga/desliga o microfone) | V | direcional → |
| Chat de texto / frases rápidas | T | direcional ↓ |
| Mapa / Resumo | M / J | View / direcional ↑ |
| Pausa (mapa, resumo, estatísticas, ajustes, jogo, online) | Esc | Menu |
| Trocar de aba na pausa | Q / E | LB / RB |
| Nos menus | mouse / setas | direcional + A (confirma) + B (volta) |

No mapa da pausa: clique para marcar um destino, botão direito (ou X) remove, arraste para mover, roda do mouse (ou LT/RT) dá zoom, Y centraliza em você.

## Novidades da versão final
- Menu de pausa em abas, com mapa em relevo, resumo de missões, estatísticas, configurações, jogo e online (lista de amigos com rastreio e teleporte).
- Controle (Xbox/PlayStation) em todos os menus, celular, voz, chat e provador.
- Loja Aurora Style (entre pela porta, use o provador), carteira e compras.
- Estádio Aurora (leste) e mansão do secretário (oeste), ruas com palmeiras, postes, faixas de pedestre e vegetação.
- Missões: Disfarce, Jogo marcado (cambista e emboscada) e Mansão Brandão (infiltração, cofre e fotos), além da perseguição ao Tavinho.
- Online: chat de texto (T), voz (V), frases rápidas no controle, amigos no minimapa e no mapa.
