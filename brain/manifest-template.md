# Manifest Template (app.json)

```json
{
  "name": "aural",
  "source_url": "https://aural.framer.website",
  "worker": {
    "routes": ["aural.foldaa.com/*"],
    "kv": ["analytics", "state"],
    "triggers": ["cron", "http"]
  },
  "features": ["auth", "payments", "automation"],
  "analytics": true,
  "extensions": [],
  "custom_domain": null
}
```
