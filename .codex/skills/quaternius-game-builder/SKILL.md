---
name: quaternius-game-builder
description: Integra modelos 3D (.glb) do Quaternius (cidade modular, interiores entráveis, personagens animados, armas e veículos) em jogos Three.js/WebGL mantendo a história existente.
---

# Regras de Arquitetura e Assets (Quaternius)

## 1. Estrutura de Pastas Esperada

Os modelos 3D estão em formato .glb dentro de `public/assets/models/`:

- `city/`: ruas, calçadas, cruzamentos, postes e fachadas de prédios.
- `interiors/`: paredes com vão de porta aberto, pisos, escadas e móveis para prédios entráveis.
- `vehicles/`: carros e veículos (rodas identificadas por nomes contendo `Wheel`).
- `characters/`: personagens com esqueleto (rig) e animações embutidas (`Idle`, `Walk`, `Run`, `Shoot`).
- `weapons/`: armas prontas para serem acopladas à mão do personagem.

## 2. Carregamento e Performance (Three.js)

- **Cache Centralizado:** Crie um módulo `src/utils/AssetManager.js` (ou `.ts`) usando `GLTFLoader` que faz cache dos modelos carregados para evitar baixar o mesmo `.glb` várias vezes.
- **Clonagem de Personagens:** Sempre use `SkeletonUtils.clone(gltf.scene)` ao instanciar personagens ou NPCs animados para não quebrar o esqueleto compartilhado.
- **Cores e Sombras:** Configure `texture.colorSpace = THREE.SRGBColorSpace` nos mapas de cor difusa e ative `castShadow` e `receiveShadow` nas malhas principais.

## 3. Cidade Pequena e Prédios Entráveis

- **Escala Compacta:** Monte uma cidade pequena (grade 3x3 ou 4x4 quarteirões) conectando as peças modulares de `city/` sem deixar buracos no chão.
- **Interiores Abertos:** Nos prédios importantes da história, construa o interior usando peças de `interiors/` (paredes com abertura de porta e móveis).
- **Colisões:** Nunca gere uma única caixa de colisão (`Box3`) cobrindo um prédio inteiro que precisa ser entrável. Gere caixas de colisão individuais apenas para cada parede sólida e móvel, deixando o vão das portas livre para o jogador atravessar.

## 4. Armas e Veículos

- **Armas:** Crie uma função `equipWeapon(character, weaponMesh)` que busca o osso da mão direita (`RightHand` ou `mixamorigRightHand`) e anexa a arma como filha desse osso com ajuste de rotação/escala.
- **Veículos:** Ao dirigir, rotacione as malhas das rodas no eixo X proporcionalmente à velocidade e permita entrar/sair do carro com a tecla E ou F.

## 5. Preservação da História

- Não apague diálogos, missões ou variáveis de progresso já existentes. Apenas reposicione os NPCs, gatilhos de missão e pontos de interesse dentro da nova cidade e dos novos interiores.

Use o código com cuidado.
