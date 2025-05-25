# Teste Técnico Backend

Desafio técnico para a posição de Desenvolvedor Fullstack na Pago.

> [Teste Técnico Frontend](https://github.com/jmd25454/teste-tecnico-frontend-2025-trimestre-1)

---

## Proposta

Desenvolver uma API em **Node.js** com:

- Upload e streaming de vídeos
- Cache com TTL via Redis
- Suporte a `Range` para streaming
- Arquitetura flexível para troca de sistema de arquivos
- Infraestrutura com Docker + Docker Compose

---

## Rotas implementadas

### `POST /upload/video`

Realiza upload de um único vídeo.

- ✅ Aceita apenas arquivos `.mp4`, `.webm`, `.mov`, `.avi`
- ✅ Limite de tamanho: **10MB**
- ✅ Armazena em cache (Redis) antes da gravação no disco
- ✅ Código 204 em caso de sucesso

#### Validações:

- `400` – extensão inválida
- `400` – tamanho excedido
- `400` – nenhum arquivo enviado

---

### `GET /static/video/:filename`

Permite baixar ou fazer streaming de um vídeo salvo.

- ✅ Retorna o vídeo completo com `200 OK`
- ✅ Suporte ao cabeçalho `Range` com `206 Partial Content`
- ✅ Retorna `416` se o range for inválido
- ✅ Retorna `404` se o arquivo não existir

---

## Tecnologias

- Node.js `v20+`
- Express
- Redis (via Docker)
- Busboy (stream de uploads)
- MIME (detecção de tipos)
- TypeScript
- Docker + Docker Compose

---

## Arquitetura

- Interface `IFileStorage` define a abstração do sistema de arquivos
- Implementação atual: `FileSystemAdapter` (salva localmente)
- Fácil substituição por outro adapter, como AWS S3

```ts
const storage: IFileStorage = new FileSystemAdapter();
// Pode ser trocado por: new S3Adapter(), new MinioAdapter(), etc.
