export interface GeminiActionItem {
  type: 'route' | 'scroll' | 'modal' | 'external';
  label: string;
  payload: string;
}

export interface GeminiResponse {
  text: string;
  actions?: GeminiActionItem[];
  suggestions?: string[];
}

const TRUCOACH_SYSTEM_INSTRUCTION = `
You are TruCoach, the helpful and energetic assistant for TruCoach (the premier real-time sports community and operating system for coaches, academies, and parents in Hyderabad, India).

Key Platform Facts:
1. For Coaches & Tutors:
   - Automates operations: live 1-tap attendance, zero-touch fee engine (UPI/Card payment links via Easebuzz delivered directly to parent WhatsApp), automated digital receipts.
   - Public & Private Events: Coaches can publish Public Events (open tournaments, summer camps, friendly matches, open trials) to attract new students, or schedule Private Events (internal grading, private batch matches, parent meetings) scoped strictly to enrolled athletes.
   - 1-Tap real-time server-side WhatsApp broadcast alerts (rain delays, match changes).
   - Multi-Coach Enterprise management with 100% data privacy owned by the academy admin.
   - Any tutor/coach can join the ecosystem by filling the "Join as a Tutor" form on the website or emailing support@trucoach.co.in.

2. For Parents:
   - Live Attendance Tracking: parents get instant automated WhatsApp notifications the moment their child arrives at practice.
   - Monthly skill progress PDF report cards evaluated by coaches.
   - 1-Tap UPI/Card fee payment with official WhatsApp receipts.
   - Discovery of verified local coaches and free trial pass booking via the TruCoach Mobile App (iOS App Store & Google Play).

3. Sports & Disciplines:
   - Badminton, Tennis, Football, Cricket, Swimming, Karate, Martial Arts, Boxing, Gymnastics, Athletics.
   - Also supports creative arts & academics: Music, Piano, Classical/Western Dance, Chess.

4. Locations:
   - Active in Hyderabad, India (Kompally, Madhapur, Gachibowli, Kondapur, Kukatpally, Jubilee Hills, Secunderabad, etc.), expanding nationwide.

5. Key People & Contact:
   - Founders: Abhishek Khode (Founder) & Ashley Albert (Co-Founder).
   - Support email: support@trucoach.co.in.

Instructions:
- Keep answers concise (2 to 4 sentences), friendly, energetic, and practical.
- Do NOT use raw asterisks like "** **" excessively; write clean text.
- If the user asks to find academies, recommend looking at the Academies directory.
- If the user asks how to join as a coach, encourage them to fill the tutor application form.
- If the user asks about free trials, explain that trials are booked through the TruCoach mobile app.
`;

export function getGeminiApiKey(): string | null {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) {
    return envKey.trim();
  }
  try {
    const localKey = localStorage.getItem('trucoach_gemini_api_key');
    if (localKey && localKey.trim().length > 0) {
      return localKey.trim();
    }
  } catch (_) {}
  return null;
}

export function saveGeminiApiKey(key: string): void {
  try {
    localStorage.setItem('trucoach_gemini_api_key', key.trim());
  } catch (_) {}
}

export function clearGeminiApiKey(): void {
  try {
    localStorage.removeItem('trucoach_gemini_api_key');
  } catch (_) {}
}

export async function askGemini(
  prompt: string,
  history: { sender: 'user' | 'bot'; text: string }[] = []
): Promise<GeminiResponse | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  // Format history for Gemini API
  const contents = [
    {
      role: 'user',
      parts: [{ text: TRUCOACH_SYSTEM_INSTRUCTION }],
    },
    {
      role: 'model',
      parts: [{ text: "Understood! I am TruCoach, ready to assist coaches, parents, and athletes with accurate and energetic guidance." }],
    },
  ];

  // Add recent context (up to 4 previous messages)
  const recent = history.slice(-4);
  for (const m of recent) {
    contents.push({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    });
  }

  // Add current query
  contents.push({
    role: 'user',
    parts: [{ text: prompt }],
  });

  try {
    // Try gemini-1.5-flash first (fastest and highly capable), with fallback to gemini-1.5-pro
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 350,
        },
      }),
    });

    if (!res.ok) {
      // Fallback try with gemini-pro if flash fails
      const fallbackEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
      const fallbackRes = await fetch(fallbackEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      });
      if (!fallbackRes.ok) {
        console.warn('Gemini API request failed:', await res.text());
        return null;
      }
      const data = await fallbackRes.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return null;
      return parseGeminiResponse(rawText, prompt);
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    return parseGeminiResponse(rawText, prompt);
  } catch (err) {
    console.warn('Gemini query error:', err);
    return null;
  }
}

/**
 * Augments Gemini's response with contextual action chips and suggestions.
 */
function parseGeminiResponse(rawText: string, userQuery: string): GeminiResponse {
  const q = userQuery.toLowerCase();
  const actions: GeminiActionItem[] = [];

  if (q.includes('coach') || q.includes('tutor') || q.includes('join') || q.includes('teach') || q.includes('register')) {
    actions.push({ type: 'modal', label: 'Join as a Tutor (Application Form)', payload: 'join' });
    actions.push({ type: 'scroll', label: 'Learn more for Coaches', payload: 'coaches' });
  } else if (q.includes('find') || q.includes('academy') || q.includes('academies') || q.includes('search') || q.includes('near')) {
    actions.push({ type: 'route', label: 'Explore Academies Directory', payload: '/academies' });
  } else if (q.includes('trial') || q.includes('book') || q.includes('demo')) {
    actions.push({ type: 'external', label: 'Get on Google Play', payload: 'https://play.google.com/store/apps/details?id=com.trucoach.app&pcampaignid=web_share' });
    actions.push({ type: 'external', label: 'Get on App Store', payload: 'https://apps.apple.com/in/app/trucoach/id6808904997' });
    actions.push({ type: 'route', label: 'Explore Academies', payload: '/academies' });
  } else if (q.includes('badminton') || q.includes('tennis')) {
    actions.push({ type: 'route', label: 'Search Badminton Academies', payload: '/academies?sport=Badminton' });
    actions.push({ type: 'route', label: 'Search Tennis Academies', payload: '/academies?sport=Tennis' });
  } else if (q.includes('football')) {
    actions.push({ type: 'route', label: 'Search Football Academies', payload: '/academies?sport=Football' });
  } else if (q.includes('cricket')) {
    actions.push({ type: 'route', label: 'Search Cricket Academies', payload: '/academies?sport=Cricket' });
  } else if (q.includes('attendance') || q.includes('parent') || q.includes('child')) {
    actions.push({ type: 'scroll', label: 'Explore Parent Experience', payload: 'parents' });
  } else if (q.includes('contact') || q.includes('support') || q.includes('help')) {
    actions.push({ type: 'external', label: 'Email support@trucoach.co.in', payload: 'mailto:support@trucoach.co.in' });
  } else {
    actions.push({ type: 'route', label: 'Discover Academies', payload: '/academies' });
    actions.push({ type: 'modal', label: 'Join as a Tutor', payload: 'join' });
  }

  return {
    text: rawText.trim(),
    actions: actions.slice(0, 3),
    suggestions: [
      '🏸 Find Academies Near Me',
      '🎓 How do I join as a Coach?',
      '🎟️ How do Free Trials work?',
      '📲 Live WhatsApp Attendance',
    ],
  };
}
