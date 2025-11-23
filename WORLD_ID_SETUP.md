# World ID Integration Setup Guide

## Overview

Ensura uses **World ID** for proof-of-personhood verification to ensure:
- ✅ One person, one policy (prevents fraud)
- 🔒 Privacy-preserving verification (no KYC required)
- 🌍 Decentralized identity verification
- 🎯 Fair, unbiased AI-driven insurance quotes

[World ID Documentation](https://docs.world.org/world-id/concepts)

## Setup Steps

### 1. Create a World ID Application

1. Visit the [World Developer Portal](https://developer.worldcoin.org/)
2. Sign in or create an account
3. Click **"Create New App"**
4. Configure your app:
   - **Integration Type**: External (for web apps using IDKit)
   - **Environment**: 
     - **Staging/Development**: For testing (use test identities)
     - **Production**: For real World IDs
   - **Verification Target**: 
     - **Cloud**: Verify via REST API (recommended for this project)
     - **On-chain**: Verify in smart contracts

### 2. Create an Action

1. In your app dashboard, create a new **Incognito Action**
2. Action name: `insurance-verification` (or customize)
3. This action represents the specific verification gate for insurance applications

### 3. Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# Copy from .env.example
cp .env.example .env.local
```

Add your World ID credentials:

```env
# World ID Configuration
NEXT_PUBLIC_WORLD_APP_ID=app_staging_YOUR_APP_ID_HERE
NEXT_PUBLIC_WORLD_ACTION=insurance-verification
```

Replace `YOUR_APP_ID_HERE` with your actual app ID from the Developer Portal.

### 4. Verification Levels

World ID supports multiple verification levels (in order of strength):

| Level | Description | Use Case |
|-------|-------------|----------|
| **Device** | Unique mobile device check | Quick verification, good for demos |
| **Document** | Passport verification | Higher assurance |
| **Secure Document** | Passport with NFC chip | Very high assurance |
| **Orb** | Biometric iris scan | Highest assurance |
| **Orb+** | Orb + authentication | Maximum security |

The current implementation uses **Device** level as the minimum requirement. You can upgrade to Orb for production.

## How It Works in Ensura

### User Flow

1. **User arrives at Ensura** → See verification screen
2. **Click "Verify with World ID"** → Opens World App
3. **Complete verification** → World App generates zero-knowledge proof
4. **Proof verified** → Backend validates with World ID API
5. **Connect wallet** → User connects Web3 wallet
6. **Fill insurance form** → Proceed with quote

### Technical Flow

```
Frontend (IDKit Widget)
    ↓
User verifies in World App
    ↓
ZK Proof generated (nullifier_hash, merkle_root, proof)
    ↓
Backend API (/api/worldid/verify)
    ↓
World ID API validates proof
    ↓
Success → User proceeds to insurance form
```

### Key Concepts

- **Nullifier Hash**: Unique ID for (user + app + action) - prevents double verification
- **Merkle Root**: Proves user is in the verified set
- **Zero-Knowledge Proof**: Proves verification without revealing identity
- **Signal**: Optional data committed to the proof (not currently used)

## Testing

### Development/Staging Testing

1. Use `app_staging_*` app ID for testing
2. Download **World App** (iOS/Android)
3. In World App, enable **Developer Mode**
4. Use test identities for verification

### Worldcoin Simulator

For automated testing without a real World App:
```bash
npm install -g @worldcoin/cli
worldcoin-simulator
```

See [Testing Documentation](https://docs.world.org/world-id/quick-start/testing)

## Security Best Practices

### ⚠️ CRITICAL: Always Verify on Backend

```typescript
// ✅ GOOD: Verify proof on backend
const response = await fetch('/api/worldid/verify', {
  method: 'POST',
  body: JSON.stringify(proof)
});

// ❌ BAD: Trust frontend only
if (proof) {
  // Never trust unverified proofs!
}
```

### Prevent Replay Attacks

- Store `nullifier_hash` in your database
- Check if nullifier has been used before
- Each person can only verify once per action

### Production Checklist

- [ ] Use Production environment in Developer Portal
- [ ] Store nullifier hashes in database
- [ ] Implement replay attack prevention
- [ ] Use Orb verification for higher security
- [ ] Set up monitoring for verification failures
- [ ] Rate limit verification endpoints

## Integration Code Reference

### Frontend Component

```tsx
// src/app/components/WorldIDVerification.tsx
import { IDKitWidget, VerificationLevel } from '@worldcoin/idkit'

<IDKitWidget
  app_id={process.env.NEXT_PUBLIC_WORLD_APP_ID}
  action="insurance-verification"
  onSuccess={handleVerify}
  verification_level={VerificationLevel.Device}
/>
```

### Backend Verification

```typescript
// src/app/api/worldid/verify/route.ts
const verifyRes = await fetch(
  `https://developer.worldcoin.org/api/v2/verify/${app_id}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nullifier_hash,
      merkle_root,
      proof,
      verification_level,
      action: 'insurance-verification'
    })
  }
);
```

## Troubleshooting

### "App ID not found"
- Check that `NEXT_PUBLIC_WORLD_APP_ID` is set correctly
- Verify app exists in Developer Portal
- Ensure environment (staging/production) matches

### "Action not found"
- Action name must match exactly in:
  - Developer Portal
  - `.env.local` file
  - API verification call

### "Verification failed"
- Check network connection
- Ensure World App is up to date
- Try with a different verification level
- Check Developer Portal logs

### "Nullifier already used"
- User has already verified for this action
- This is by design (prevents double verification)
- Use different action names for different flows

## Additional Resources

- [World ID Documentation](https://docs.world.org/world-id/concepts)
- [IDKit Reference](https://docs.world.org/world-id/reference/idkit)
- [API Reference](https://docs.world.org/reference/api)
- [Developer Portal](https://developer.worldcoin.org/)
- [Mini Apps Guide](https://docs.world.org/mini-apps/commands/verify)

## Prize Track Integration

World ID integration makes Ensura eligible for:
- **World ID Track**: Proof-of-personhood for fair insurance
- **Stronger Narrative**: "AI-driven, unbiased insurance for verified humans"
- **Real-world Use Case**: Solving insurance fraud and discrimination
- **Privacy-First**: No KYC required, preserves user privacy

---

**Note**: The default configuration uses staging environment with Device-level verification for easy demo testing. For production deployment, upgrade to Orb verification and implement proper database storage for nullifier hashes.

