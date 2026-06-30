# X OAuth Publishing

This service publishes to X through OAuth 2.0 Authorization Code Flow with PKCE.
App credentials stay in env. User access and refresh tokens are stored encrypted in Postgres.

## Env

Generate the encryption key:

```bash
openssl rand -base64 32
```

Required variables:

```dotenv
X_CLIENT_ID=
X_CLIENT_SECRET=
X_REDIRECT_URI=http://127.0.0.1:3000/api/integrations/x/callback
X_OAUTH_SCOPES=tweet.read users.read tweet.write media.write offline.access
X_TOKEN_ENCRYPTION_KEY=
X_EXPECTED_USER_ID=
X_EXPECTED_USERNAME=
X_POSTING_ENABLED=true
X_MARK_AI_MEDIA=false
```

For stage/prod, `X_REDIRECT_URI` must exactly match the callback configured in X Developer Console, for example:

```text
https://stage.gymguru.fit/api/integrations/x/callback
```

## Database

Run migrations after deploy:

```bash
DATABASE_URL=postgres://marketing:marketing@localhost:5432/marketing_service corepack pnpm --filter @marketing-service/database exec drizzle-kit migrate
```

The migration adds:

- `x_connections`: encrypted OAuth tokens and connected X account metadata.
- `x_oauth_attempts`: short-lived PKCE state/verifier storage.
- `x_publications`: X post audit/idempotency records.

## Connect Account

Start OAuth in browser:

```text
http://127.0.0.1:3000/api/integrations/x/connect?publishingTarget=test&returnTo=/test-ui
```

The endpoint responds with a redirect to `https://x.com/i/oauth2/authorize?...`.

JSON helper endpoint:

```bash
curl -X POST http://localhost:3000/api/integrations/x/connect \
  -H 'content-type: application/json' \
  -d '{"publishingTarget":"test","returnTo":"/test-ui"}'
```

Open the returned `authorizationUrl` in the browser. The callback exchanges the code server-side and stores encrypted tokens.

Check status:

```bash
curl 'http://localhost:3000/api/integrations/x/status?publishingTarget=test'
```

Disconnect:

```bash
curl -X DELETE 'http://localhost:3000/api/integrations/x/connection?publishingTarget=test'
```

## Publishing

Scheduled X publications still go through `PublicationSchedulerService`.
For `channel_x`, the scheduler now calls `XPublisherPort`, which delegates to the OAuth-backed `XIntegrationService`.

Image publishing uses the existing local campaign media path resolution. The integration validates local files by magic bytes and only uploads allowed raster MIME types.

Manual test endpoint:

```bash
curl -X POST http://localhost:3000/api/integrations/x/posts \
  -H 'content-type: application/json' \
  -d '{"publishingTarget":"test","requestId":"manual-test-1","text":"Hello from OAuth X integration"}'
```

For images, pass a local file path that exists on the API/worker machine:

```json
{
  "publishingTarget": "test",
  "requestId": "manual-image-test-1",
  "text": "Hello with image",
  "imagePath": "/absolute/path/to/image.jpg",
  "madeWithAi": true
}
```

Do not pass external image URLs to the X integration endpoint. If an image is external, ingest it into local/storage media first.
