# 🏗️ architecture.md — Technical Architecture
> **Floravia** — Frontend, Backend, AI Pipeline & Data Schema

---

## 1. Technology Stack Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  Next.js 14 (App Router) · TypeScript · TailwindCSS        │
│  Framer Motion · Zustand · React Query · shadcn/ui (custom) │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS / WebSocket
┌───────────────────────▼─────────────────────────────────────┐
│                        BACKEND                              │
│  Next.js API Routes + Edge Functions                        │
│  Firebase Auth · Firestore · Firebase Storage               │
│  OpenAI GPT-4o API · Google Cloud Vision API               │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture

### Framework: Next.js 14 (App Router)
```
/app
  /(auth)
    /login
    /signup
    /onboarding         ← multi-step onboarding wizard
  /(dashboard)
    /layout.tsx         ← animated sidebar + nav shell
    /page.tsx           ← home dashboard with garden overview
    /identify
      /page.tsx         ← plant identification upload screen
      /result/[id]      ← identification result card page
    /garden
      /page.tsx         ← personal plant library grid
      /[plantId]        ← individual plant care page
    /chat
      /page.tsx         ← Sage AI chatbot interface
    /diagnose
      /page.tsx         ← plant diagnosis upload flow
    /settings
      /page.tsx
  /api
    /identify           ← image upload → AI identification
    /chat               ← streaming chatbot endpoint
    /diagnose           ← diagnosis pipeline
    /plants/[id]        ← plant care data lookup
```

### State Management
```typescript
// Zustand stores
useAuthStore          // user session, profile
useGardenStore        // user's plant collection
useChatStore          // Sage conversation history
useIdentifyStore      // current identification flow state
useNotificationStore  // watering reminders, alerts
```

### Key Frontend Dependencies
```json
{
  "next": "14.x",
  "react": "18.x",
  "typescript": "5.x",
  "tailwindcss": "3.x",
  "framer-motion": "11.x",
  "firebase": "10.x",
  "zustand": "4.x",
  "@tanstack/react-query": "5.x",
  "react-dropzone": "14.x",
  "react-hot-toast": "2.x",
  "lucide-react": "latest",
  "clsx": "latest",
  "tailwind-merge": "latest"
}
```

---

## 3. Backend Architecture

### API Routes (Next.js Edge Functions)

#### `POST /api/identify`
```typescript
// Pipeline:
// 1. Receive multipart/form-data image
// 2. Validate & compress image (max 4MB, WebP convert)
// 3. Upload to Firebase Storage → get URL
// 4. Send to Google Cloud Vision API (label detection + web detection)
// 5. Cross-reference with Plant.id API for botanical accuracy
// 6. Enrich with OpenAI GPT-4o Vision for care summary
// 7. Store result in Firestore
// 8. Return structured IdentificationResult

interface IdentificationResult {
  id: string
  plantName: string
  scientificName: string
  confidence: number        // 0–1
  alternativeMatches: Match[]
  careProfile: CareProfile
  description: string
  imageUrl: string
  timestamp: Timestamp
}
```

#### `POST /api/chat` (Streaming)
```typescript
// Pipeline:
// 1. Receive message + optional image + conversation history
// 2. Build system prompt with user's garden context
// 3. Stream response via OpenAI GPT-4o
// 4. If image attached → use Vision mode
// 5. Append to Firestore conversation log

// Uses: ReadableStream + TransformStream for SSE streaming
```

#### `POST /api/diagnose`
```typescript
// Pipeline:
// 1. Receive plant image + symptom description
// 2. GPT-4o Vision analysis with diagnosis system prompt
// 3. Return: condition name, confidence, causes[], treatment_steps[]
// 4. Suggest follow-up questions for Sage chatbot
```

---

## 4. AI / Image Analysis Pipeline

```
User uploads image
        │
        ▼
┌───────────────────┐
│  Client-side      │
│  Image validation │  ← size check, EXIF strip, preview
│  & compression    │
└────────┬──────────┘
         │ FormData POST
         ▼
┌───────────────────┐
│  Firebase Storage │  ← store original, return CDN URL
└────────┬──────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Parallel AI Analysis               │
│                                     │
│  ① Google Vision API                │
│     - Label Detection               │
│     - Web Entity Detection          │
│     - Safe Search                   │
│                                     │
│  ② Plant.id API (v3)                │
│     - Botanical classification      │
│     - Species probability scores    │
│     - Taxonomy data                 │
└────────────────┬────────────────────┘
                 │ Merge results
                 ▼
┌─────────────────────────────────────┐
│  GPT-4o Enrichment Layer            │
│  - Care instructions generation     │
│  - Natural language description     │
│  - Toxicity / pet safety info       │
│  - Seasonal care variations         │
└────────────────┬────────────────────┘
                 │
                 ▼
         Structured JSON
         → Firestore store
         → Return to client
```

---

## 5. Database Schema (Firestore)

### Collection: `users/{userId}`
```typescript
interface User {
  uid: string
  email: string
  displayName: string
  photoURL: string
  plan: 'free' | 'pro'
  identificationCount: number    // monthly usage
  location?: GeoPoint
  preferences: {
    notifications: boolean
    reminderTime: string         // "08:00"
    units: 'metric' | 'imperial'
  }
  createdAt: Timestamp
}
```

### Collection: `users/{userId}/garden/{plantId}`
```typescript
interface GardenPlant {
  id: string
  plantName: string
  scientificName: string
  nickname?: string
  imageUrl: string
  careProfile: CareProfile
  addedAt: Timestamp
  lastWatered?: Timestamp
  nextWatering?: Timestamp
  healthScore: number            // 0–100
  notes: string
  location: 'indoor' | 'outdoor' | 'balcony'
}

interface CareProfile {
  wateringFrequency: number      // days between watering
  sunlight: 'low' | 'medium' | 'bright' | 'direct'
  humidity: 'low' | 'medium' | 'high'
  temperature: { min: number; max: number }
  soilType: string
  fertilizingFrequency: number   // weeks
  toxicity: { pets: boolean; humans: boolean }
  difficulty: 'easy' | 'moderate' | 'expert'
}
```

### Collection: `users/{userId}/conversations/{convId}`
```typescript
interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  imageUrl?: string
  timestamp: Timestamp
}
```

### Collection: `identifications/{identificationId}`
```typescript
interface Identification {
  userId: string
  result: IdentificationResult
  imageUrl: string
  savedToGarden: boolean
  createdAt: Timestamp
}
```

---

## 6. Authentication Flow

```
Firebase Auth (Google OAuth + Email/Password)
  → onAuthStateChanged listener in AuthStore
  → Redirect to /onboarding on first login
  → JWT token passed in Authorization header to API routes
  → Firestore security rules enforce userId === request.auth.uid
```

---

## 7. Performance Architecture

- **Image optimization**: Next.js `<Image>` with WebP auto-conversion
- **Streaming AI responses**: Server-Sent Events via `ReadableStream`
- **React Query caching**: Plant data cached for 24h, stale-while-revalidate
- **Code splitting**: Each route lazy-loaded with dynamic imports
- **PWA**: next-pwa for offline support, service worker caches plant library
- **Edge deployment**: Vercel Edge Functions for sub-100ms API cold starts

---

## 8. Environment Variables

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_ADMIN_PRIVATE_KEY=

# AI Services
OPENAI_API_KEY=
GOOGLE_CLOUD_VISION_API_KEY=
PLANT_ID_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
```
