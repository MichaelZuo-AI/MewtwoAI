# Test Coverage Analysis

Generated: 2026-02-09

## Current State

- **435 tests** across **13 suites**, all passing
- **Global branch coverage (66.47%) is below the 70% threshold**
- Statement coverage: 77.19% | Function coverage: 71.64% | Line coverage: 78.86%

## Coverage Summary

| File | Stmts | Branch | Funcs | Lines | Status |
|------|-------|--------|-------|-------|--------|
| route.ts | 100% | 87.5% | 100% | 100% | Good |
| CharacterDots.tsx | 100% | 100% | 100% | 100% | Good |
| CharacterSelect.tsx | 100% | 100% | 100% | 100% | Good |
| ChatBubble.tsx | 100% | 100% | 100% | 100% | Good |
| VoiceChat.tsx | 100% | 100% | 100% | 100% | Good |
| StoryTimeButton.tsx | 100% | 100% | 100% | 100% | Good |
| useSwipeGesture.ts | 100% | 100% | 100% | 100% | Good |
| characters/*.ts | 100% | 83-100% | 100% | 100% | Good |
| storage.ts | 92.9% | 90.5% | 100% | 95.8% | Good |
| useAudioPlayback.ts | 95% | 78.6% | 100% | 96.5% | Minor gaps |
| useGeminiLive.ts | 86.7% | 76.8% | 84.6% | 87.7% | Needs improvement |
| useAudioCapture.ts | 84.8% | 72.2% | 80% | 87.5% | Needs improvement |
| CharacterDisplay.tsx | 60.5% | 77.1% | 77.8% | 64.5% | Significant gaps |
| **useWakeLock.ts** | **72.4%** | **12.5%** | **75%** | **74.1%** | **Critical** |
| **ChatDrawer.tsx** | **0%** | **0%** | **0%** | **0%** | **No tests** |
| **ChatPeek.tsx** | **0%** | **0%** | **0%** | **0%** | **No tests** |
| **MicButton.tsx** | **0%** | **0%** | **0%** | **0%** | **No tests** |
| **SettingsMenu.tsx** | **0%** | **0%** | **0%** | **0%** | **No tests** |
| **Icons.tsx** | **25%** | **0%** | **25%** | **25%** | **No tests** |
| **page.tsx** | **0%** | **0%** | **0%** | **0%** | **No tests** |
| **layout.tsx** | **0%** | **0%** | **0%** | **0%** | **No tests** |

---

## Priority 1: Zero-Coverage Components

These 5 component files are the primary reason the branch threshold fails.

### MicButton.tsx

The app's central interactive element. Test areas:

- Correct icon for each `connectionState` (disconnected, connecting, connected, reconnecting)
- `aria-label` changes: "Start talking" / "Connecting" / "Stop talking"
- `disabled` when `isSupported=false` or `connectionState='connecting'`
- `micGradient` prop applying the correct CSS class
- `onToggle` callback firing on click
- Visual states: pulse animation for loading, red gradient for connected

### ChatDrawer.tsx

Full chat transcript drawer. Test areas:

- Returns `null` when `isOpen=false`
- Renders backdrop and drawer when `isOpen=true`
- "No messages yet" when `messages` is empty
- Renders `ChatBubble` for each message
- `onClose` fires when clicking backdrop or close button
- `onClearHistory` fires when clicking "Clear"
- Auto-scroll to bottom via `scrollIntoView` effect
- `bgColor` prop sets inline background style

### ChatPeek.tsx

Latest message peek bar. Test areas:

- Returns `null` when `messages` is empty
- "You: " prefix for user messages
- `${characterName}: ` prefix for assistant messages
- Defaults `characterName` to "Mewtwo"
- `onOpen` fires on click

### SettingsMenu.tsx

Dropdown with outside-click detection. Test areas:

- Opens dropdown on click, closes on second click
- `onClearHistory` fires and closes when clicking "Clear History"
- Closes on outside click (mousedown listener)
- Event listener cleanup on unmount
- `bgColor` prop sets inline background style

### Icons.tsx

8 icon components with only 1 exercised indirectly. Test areas:

- Each icon renders an SVG element
- Custom `className` is applied
- Default className when none provided

---

## Priority 2: Critical Branch Coverage Gap

### useWakeLock.ts (12.5% branch coverage)

8 branch conditions, only 1 tested. Missing:

- Guard when `navigator.wakeLock` is absent
- Guard when lock is already held (no duplicate acquire)
- `release` event listener that nulls the ref
- `catch` block when `wakeLock.request()` fails
- `handleVisibilityChange` re-acquiring when `visibilityState='visible'` and `wantLockRef=true`
- Not re-acquiring when `wantLockRef=false`
- `release()` called on cleanup/unmount

---

## Priority 3: Partial Coverage on Core Logic

### useGeminiLive.ts (76.8% branch)

Untested areas (lines 59-60, 78, 80, 222-226, 303-308, 344-345, 377-378, 383-386, 401):

- **handleAudioData**: Never triggers because `useAudioCapture` is fully mocked
- **voiceState derivation**: `isPlaying` and `isCapturing` branches never true (mocked as false)
- **Story mode auto-continuation**: `sendClientContent` with continuation prompt when `isStoryMode=true` and turn completes mid-story
- **Reconnect on failure during reconnect**: The `catch` block `isReconnect=true` path
- **switchStoryMode while connected**: Should disconnect and reconnect
- **storyModeTimeoutRef cleanup** in disconnect and unmount

### useAudioCapture.ts (72.2% branch)

- Downsampling when `sampleRate !== 16000` (mock uses 16000, never exercises resampling)
- `isSupported` when `navigator.mediaDevices` is undefined (not just failing)
- Non-Error exceptions in `startCapture`

### CharacterDisplay.tsx (64.5% lines)

- `getAllImages()` with `CharacterStateImages` object (all characters use single string)
- Crossfade `useEffect` when `currentImage` changes (can't fire with single-string images)

### page.tsx (0%)

Meaningful logic worth testing:

- Loading persisted `selectedCharacterId` from localStorage
- Rendering `CharacterSelect` vs `VoiceChat` based on selection
- `handleBack` clearing localStorage
- `switchCharacter` with transition lock (`isTransitioningRef`)
- Hydration guard (empty `<main>` until `hydrated=true`)

---

## Priority 4: Missing Test Categories

### No integration tests for audio pipeline

`useGeminiLive` fully mocks both `useAudioCapture` and `useAudioPlayback`. No test verifies they compose correctly (audio from capture reaching `session.sendRealtimeInput`, audio from `onmessage` reaching the playback queue).

### No kstTimeString interpolation tests

Each character's `bedtimeAddendum(kstTimeString)` embeds the time string in the prompt. Tests verify `BEDTIME MODE` appears but don't check the actual time string is interpolated. The `kstTime ? ... : ...` branch in each character file is untested.

### No error boundary / edge case tests

- `localStorage.getItem` throwing (private browsing in Safari)
- `storage.addMessage` throwing during transcript flush
- Concurrent `connect()` calls (the `isConnectingRef` guard)

---

## Recommendations (Priority Order)

1. **Add tests for ChatDrawer, ChatPeek, MicButton, SettingsMenu** — pushes branch coverage above the 70% threshold; straightforward React component tests
2. **Add tests for useWakeLock** — the 12.5% branch coverage is the worst metric; mocking `navigator.wakeLock` and `document.visibilityState` is sufficient
3. **Test page.tsx** — localStorage persistence, hydration guard, character switching with transition lock
4. **Cover untested branches in useGeminiLive** — story mode auto-continuation, switchStoryMode while connected, reconnect-on-failure-during-reconnect
5. **Test audio resampling in useAudioCapture** — set `mockAudioContext.sampleRate` to `48000` to exercise the downsampling branch
6. **Test CharacterDisplay crossfade** — pass a `CharacterStateImages` object to cover `getAllImages()` and `resolveImage()` for non-string images
7. **Add kstTimeString interpolation tests** — verify `getSystemPrompt(false, true, '21:30')` embeds "21:30" in the bedtime addendum
