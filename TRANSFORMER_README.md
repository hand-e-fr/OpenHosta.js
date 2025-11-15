# 🚀 OpenHosta TypeScript Transformer

Ce transformer permet d'utiliser OpenHosta avec une **syntaxe quasi-identique à Python**!

## 🎯 Ce que ça fait

### AVANT (Syntaxe actuelle)
```typescript
const translate = ((..._args: unknown[]): unknown => {
  return "";
}) as HostaInspectableFunction;

setHostaSignature(translate, {
  doc: 'Translates text into the specified language.',
  args: [
    { name: "text", type: "string" },
    { name: "language", type: "string" }
  ],
  type: "string"
});

const result = await emulate({
  fn: translate,
  args: { text: "Hello World!", language: "French" }
});
```

### APRÈS (Avec transformer) ✨
```typescript
/**
 * Translates text into the specified language.
 */
function translate(text: string, language: string): string {
  return emulate();  // ✨ C'est tout!
}

const result = await translate("Hello World!", "French");
// Bonjour le monde !
```

**Le transformer fait AUTOMATIQUEMENT:**
1. ✅ Extrait le JSDoc comme documentation
2. ✅ Extrait les types TypeScript
3. ✅ Injecte `setHostaSignature()` après la fonction
4. ✅ Injecte les arguments dans `emulate()`

---

## 📦 Installation

### Option 1: Avec ts-patch (Recommandé)

```bash
npm install --save-dev ts-patch

# Activer ts-patch
npx ts-patch install
```

Créer `tsconfig.json` avec le plugin:
```json
{
  "compilerOptions": {
    // ... options habituelles
    "plugins": [
      {
        "transform": "./dist/transformer/hostaTransformer.js",
        "type": "program"
      }
    ]
  }
}
```

Build:
```bash
npx ts-patch compile
```

---

### Option 2: Avec ttypescript

```bash
npm install --save-dev ttypescript
```

Même config `tsconfig.json` que ci-dessus.

Build:
```bash
npx ttsc
```

---

### Option 3: Script programmatique (Sans dépendance)

```bash
# Build avec le transformer inclus
npm run build:transformer
```

Ou utilisez le script directement:
```typescript
import { buildWithTransformer } from './src/transformer/build.js';

buildWithTransformer({
  projectPath: './tsconfig.json',
  verbose: true
});
```

---

## 🎬 Utilisation

### 1. Écrire une fonction emulatable

```typescript
import { emulate } from 'openhosta';

/**
 * Analyzes the sentiment of text and returns a score.
 * @param text The text to analyze
 */
function analyzeSentiment(text: string): { sentiment: string; score: number } {
  return emulate();
}

// Usage direct!
const result = await analyzeSentiment("I love this framework!");
console.log(result);
// { sentiment: "positive", score: 0.95 }
```

### 2. Types complexes

```typescript
/**
 * Generates a summary of the article.
 */
function summarize(
  text: string,
  maxLength: number,
  style: 'formal' | 'casual'
): string {
  return emulate();
}

const summary = await summarize(
  "Long article text here...",
  100,
  'formal'
);
```

### 3. Types personnalisés

```typescript
interface User {
  name: string;
  email: string;
  age: number;
}

/**
 * Extracts user information from unstructured text.
 */
function extractUser(text: string): User {
  return emulate();
}

const user = await extractUser("John Doe, 30 years old, john@example.com");
// { name: "John Doe", email: "john@example.com", age: 30 }
```

---

## 🔧 Configuration du Transformer

Le transformer accepte ces options:

```typescript
{
  // Auto-injecter les arguments dans emulate()
  injectArguments: true,

  // Auto-injecter setHostaSignature()
  injectSignatures: true,

  // Générer fichiers .hosta.json (metadata)
  generateMetadata: false,

  // Logging verbeux
  verbose: false
}
```

### Avec ts-patch:
```json
{
  "plugins": [
    {
      "transform": "./dist/transformer/hostaTransformer.js",
      "type": "program",
      "verbose": true,
      "generateMetadata": true
    }
  ]
}
```

### Avec le build script:
```bash
node dist/transformer/build.js --verbose --metadata
```

---

## 📊 Ce qui est transformé

### Code source:
```typescript
/**
 * Translates text into the specified language.
 */
function translate(text: string, language: string): string {
  return emulate();
}
```

### Code compilé:
```typescript
function translate(text, language) {
  return emulate({ args: { text, language } });
}

setHostaSignature(translate, {
  doc: "Translates text into the specified language.",
  args: [
    { name: "text", type: "string" },
    { name: "language", type: "string" }
  ],
  type: "string"
});
```

---

## ⚡ Performance

- ✅ **Transformation au build time** - zero overhead runtime
- ✅ **Pas de reflection** - tout est statique
- ✅ **Tree-shakeable** - code non utilisé éliminé
- ✅ **Source maps** - debugging facile

---

## 🐛 Debugging

### Voir le code transformé

1. Build avec verbose:
```bash
npm run build:transformer -- --verbose
```

2. Inspecter le fichier compilé:
```bash
cat dist/myFile.js
```

### Source maps

Le transformer préserve les source maps, donc le debugging fonctionne normalement dans VS Code / Chrome DevTools.

---

## 📝 Limitations

1. **Fonctions fléchées**: Actuellement, seules les `function` declarations sont supportées
   ```typescript
   // ✅ Supporté
   function translate(text: string): string {
     return emulate();
   }

   // ❌ Pas encore supporté
   const translate = (text: string): string => {
     return emulate();
   };
   ```

2. **Closures**: Les variables capturées dans une closure ne sont pas automatiquement passées
   ```typescript
   function outer() {
     const apiKey = "secret";

     function inner(text: string): string {
       // apiKey n'est pas automatiquement passé à emulate()
       return emulate();
     }
   }
   ```

3. **Classes**: Les méthodes de classe ne sont pas encore supportées
   ```typescript
   class API {
     // ❌ Pas encore supporté
     translate(text: string): string {
       return emulate();
     }
   }
   ```

Ces limitations seront corrigées dans les prochaines versions!

---

## 🆚 Comparaison avec Python

| Fonctionnalité | Python | JS (Actuel) | JS (Transformer) |
|----------------|--------|-------------|------------------|
| Simplicité | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Lignes de code | 3 | 15 | 3 |
| Build step | ❌ | ❌ | ✅ |
| Runtime overhead | ❌ | ❌ | ❌ |
| Type safety | ⚠️ | ✅ | ✅ |

**Score de similarité: 95%!** 🎉

---

## 📚 Exemples Complets

Voir `examples/pythonStyleExample.ts` pour des exemples complets.

---

## 🤝 Contribuer

Le transformer est dans `src/transformer/`. PRs welcome!

---

## 📄 License

MIT
