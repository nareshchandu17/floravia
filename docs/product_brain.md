# 🌿 product_brain.md — Product Vision & Strategy
> **Floravia** — The AI-Powered Plant Intelligence Platform

---

## 1. Product Vision

Floravia is a premium, AI-first gardening companion that transforms the way plant lovers interact with their green world. Using computer vision and conversational AI, it identifies any plant from a photo in seconds and delivers personalized, expert-level care guidance through a stunning, immersive interface.

The product feels like **a living, breathing ecosystem** — not a utility app. Every screen should evoke the beauty of nature fused with cutting-edge technology. Think: *Apple meets botanical garden meets Framer showcase.*

---

## 2. Core Mission

> "Make every person a confident plant parent — through the power of AI and the beauty of great design."

---

## 3. Target Users

### Primary: The Modern Plant Parent
- Age 22–38, design-conscious, urban dweller
- Owns 5–20 houseplants, active on Instagram/TikTok
- Frustrated with generic gardening blogs
- Values beautiful, fast, trustworthy digital experiences
- Pays for premium apps (Notion, Headspace, Calm)

### Secondary: The Curious Explorer
- Hikers, travelers, outdoor enthusiasts
- Wants to identify wild plants, herbs, and flowers in the field
- Needs quick, offline-capable AI responses

### Tertiary: The Serious Hobbyist / Small-Scale Grower
- Vegetable gardeners, bonsai artists, orchid collectors
- Needs deep-dive care schedules, seasonal calendars, and pest diagnostics

---

## 4. Core Feature Set

### 🔍 Instant Plant Identification
- Upload or capture a photo → AI returns plant name, species, confidence score
- Visual match results presented as premium "identification cards"
- Alternative matches shown with probability rings

### 🌱 Personalized Care Dashboard
- Watering schedules, light requirements, humidity, soil type
- Seasonal care variations (spring awakening, winter dormancy)
- Push notification reminders for watering/feeding/repotting

### 🤖 AI Gardening Chatbot (Sage)
- Named "Sage" — conversational, knowledgeable, warm
- Answers open-ended gardening questions
- Accepts image uploads mid-conversation for in-context analysis
- Remembers user's plant collection for personalized advice

### 📚 Plant Library / My Garden
- User's personal collection of identified/saved plants
- Progress tracking (health scores, growth notes)
- Timeline of care events

### 🌦️ Environment & Season Alerts
- Location-aware frost warnings, UV index, rainfall alerts
- "Now is the time to..." proactive nudges

### 🧪 Diagnosis Mode
- Upload photo of sick/wilting plant
- AI returns probable cause (overwatering, pests, disease, deficiency)
- Step-by-step treatment plan

---

## 5. Product Constraints

| Constraint | Detail |
|---|---|
| Platform | Web-first (Next.js PWA), iOS/Android via React Native Web |
| Performance | First Contentful Paint < 1.5s, Time to Interactive < 3s |
| AI Latency | Plant ID response < 3s, Chatbot response streaming |
| Offline | Core library and cached plant data available offline |
| Accessibility | WCAG 2.1 AA — keyboard nav, screen reader support |
| Privacy | No plant images stored without explicit consent |
| Monetization | Freemium: 5 free IDs/month → Pro $6.99/mo unlimited |

---

## 6. Success Metrics

- **Activation**: 60% of users complete their first plant identification within 5 minutes of signup
- **Retention**: 40% 30-day retention (ask for watering reminder opt-in at onboarding)
- **Engagement**: Average 3.2 chatbot sessions per active user per week
- **Conversion**: 8% free → Pro conversion within 30 days
- **NPS**: Target 55+ within 6 months

---

## 7. Competitive Differentiation

| Feature | Floravia | PlantNet | PictureThis | iNaturalist |
|---|---|---|---|---|
| Premium UI/UX | ✅ Framer-level | ❌ | ⚠️ Dated | ❌ |
| AI Chatbot | ✅ Sage (GPT-4o) | ❌ | ❌ | ❌ |
| Care Schedules | ✅ Personalized | ❌ | ✅ Basic | ❌ |
| Diagnosis Mode | ✅ AI-powered | ❌ | ✅ Limited | ❌ |
| Offline Support | ✅ PWA | ⚠️ | ❌ | ⚠️ |
| Design Quality | ✅ Dribbble-tier | ❌ | ⚠️ | ❌ |

---

## 8. Brand Identity

- **Name**: Floravia
- **Tagline**: *"Know Your Green."*
- **Personality**: Intelligent, warm, sophisticated, curious
- **Voice**: Like a brilliant botanist friend — knowledgeable but never condescending
- **Visual Identity**: Deep botanical greens + bioluminescent teals + warm earth tones, glassmorphic cards, lush macro photography
