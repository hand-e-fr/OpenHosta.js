# Configuration Guide

## 🔧 3 façons de configurer OpenHosta.js

### Option 1: Configuration dans le code (recommandé)

**Pas de `.env` nécessaire, pas de logs verbeux**

```typescript
import { config, OpenAICompatibleModel } from "openhosta.js";

// Configure le modèle directement
config.DefaultModel = new OpenAICompatibleModel({
  modelName: "gpt-4o-mini",
  baseUrl: "https://api.openai.com/v1",
  apiKey: process.env.OPENAI_API_KEY,
  apiParameters: {
    temperature: 0.7,
    max_tokens: 100
  }
});

// Utilise emulate, ask, closure, etc.
```

### Option 2: Fichier `.env` (optionnel)

Créer un fichier `.env` à la racine du projet:

```bash
OPENHOSTA_DEFAULT_MODEL_API_KEY="sk-..."
OPENHOSTA_DEFAULT_MODEL_BASE_URL="https://api.openai.com/v1"
OPENHOSTA_DEFAULT_MODEL_NAME="gpt-4o-mini"
OPENHOSTA_DEFAULT_MODEL_TEMPERATURE=0.7
OPENHOSTA_DEFAULT_MODEL_TOP_P=0.9
OPENHOSTA_DEFAULT_MODEL_MAX_TOKENS=2048
OPENHOSTA_DEFAULT_MODEL_SEED=42
```

Le fichier `.env` sera chargé automatiquement **sans logs**.

### Option 3: Variable d'environnement directe

```bash
export OPENAI_API_KEY="sk-..."
```

Puis dans le code:

```typescript
config.DefaultModel.api_key = process.env.OPENAI_API_KEY;
```

---

## 🔊 Contrôler les logs de configuration

### Par défaut: Silencieux ✅

Les warnings de `.env` manquant sont **désactivés par défaut** depuis la version actuelle.

### Activer les logs verbeux

Si vous voulez voir les warnings de configuration:

```bash
# Variable d'environnement
export OPENHOSTA_VERBOSE=true
npx tsx examples/simpleEmulateExample.ts
```

Ou dans le code:

```typescript
import { reloadDotenv } from "openhosta.js";

// Force le chargement avec logs
reloadDotenv(true, "./.env", true); // verbose=true
```

---

## 📋 Hiérarchie de configuration

Les valeurs sont chargées dans cet ordre (priorité croissante):

1. **Valeurs par défaut** (dans `config.ts`)
   ```typescript
   modelName: "gpt-4o"
   baseUrl: "https://api.openai.com/v1"
   ```

2. **Fichier `.env`** (si présent, chargé au démarrage)

3. **Configuration dans le code** (priorité maximale)
   ```typescript
   config.DefaultModel = new OpenAICompatibleModel({ ... });
   ```

---

## 🎯 Exemples complets

Voir:
- `examples/simpleEmulateNoEnv.ts` - Configuration dans le code
- `examples/configExample.js` - Génération dynamique de `.env`

---

## 🐛 Troubleshooting

### "Rate limit exceeded" ou "API key invalid"

```bash
# Vérifier la clé API
echo $OPENAI_API_KEY

# Ou configurer dans le code
config.DefaultModel.api_key = "sk-...";
```

### Les logs `.env` s'affichent encore

```bash
# Désactiver explicitement
export OPENHOSTA_VERBOSE=false
```

### Je veux forcer le rechargement du `.env`

```typescript
import { reloadDotenv } from "openhosta.js";

// Recharge le .env avec override
reloadDotenv(true, "./.env");
```
