---
author: Sanjay Yepuri
state: Draft
discussion: TBD
---

# Passkey Authentication with WebAuthn

## Abstract

This document presents a comprehensive technical analysis of passkey-based authentication using the WebAuthn protocol, followed by its implementation strategy for the Party Invitation Platform. We replace traditional password-based authentication with cryptographically secure, phishing-resistant passkeys backed by public-key cryptography. The implementation combines Better Auth's passkey plugin with magic link registration, creating a passwordless authentication system that leverages platform authenticators (Face ID, Touch ID, Windows Hello) for seamless user experience.

## Problem Statement

### The Fundamental Flaw of Password Authentication

Password-based authentication relies on **shared secrets** — both the client and server know (or can verify) the same secret value. This architectural decision creates several critical vulnerabilities:

1. **Symmetric Security Model**: Passwords use symmetric cryptography where both parties must possess knowledge of the secret. A breach on either end compromises the entire system.

2. **Server-Side Storage Risk**: Servers must store password hashes (or worse, plaintext passwords). Database breaches expose these hashes to offline brute-force attacks, especially for weak passwords.

3. **Phishing Vulnerability**: Users can be tricked into entering passwords on malicious websites. The attacker receives the actual credential, enabling immediate account access.

4. **Credential Reuse**: Users reuse passwords across services. A breach at one service cascades to others, creating systemic risk across the internet.

5. **Human Memory Limitations**: Strong passwords (high entropy) are difficult to remember, leading to weak passwords or written records.

### Why Public-Key Cryptography Solves This

Passkeys use **asymmetric cryptography**, fundamentally restructuring the security model:

- **Private Key**: Never leaves the user's device. Stored in secure hardware (TPM, Secure Enclave).
- **Public Key**: Stored on the server. Even if the server is breached, the public key cannot be used to authenticate.
- **Domain Binding**: Credentials are cryptographically bound to the origin domain, making phishing impossible.
- **No Shared Secrets**: The server never possesses information sufficient to impersonate the user.

---

## Public Key Cryptography Foundations

### Asymmetric vs Symmetric Cryptography

**Symmetric Cryptography** (e.g., passwords):
```
Encryption Key = Decryption Key
```
- Same key for encryption and decryption
- Both parties must securely share the key
- Examples: AES, ChaCha20
- Problem: Key distribution and shared secret vulnerability

**Asymmetric Cryptography** (e.g., passkeys):
```
Public Key ≠ Private Key
Public Key can encrypt, only Private Key can decrypt
Private Key can sign, Public Key can verify
```
- Key pair: (sk, pk) where sk = secret/private key, pk = public key
- Mathematical relationship makes one-way operations possible
- Examples: RSA, ECDSA, EdDSA
- Advantage: Public keys can be freely distributed

### One-Way Functions and Trapdoor Functions

The security of asymmetric cryptography relies on **trapdoor one-way functions**:

**One-Way Function** f: X → Y satisfies:
- Easy to compute: Given x, compute y = f(x) efficiently
- Hard to invert: Given y, computationally infeasible to find x such that f(x) = y

**Trapdoor One-Way Function** adds a secret:
- With trapdoor t, inversion becomes easy
- Without t, inversion remains infeasible

Example: Elliptic Curve Discrete Logarithm Problem (ECDLP)
```
Given: G (generator point), n (order), Q (public key point)
Find: k such that Q = k·G

Forward direction (easy): Q = k·G
Inverse direction (hard without k): k = log_G(Q)
```

---

## Elliptic Curve Cryptography (ECC)

### Why Elliptic Curves?

WebAuthn primarily uses elliptic curve cryptography instead of RSA because:

1. **Efficiency**: Smaller keys provide equivalent security
   - 256-bit ECC ≈ 3072-bit RSA security
   - Faster computations, critical for mobile devices

2. **Security per Bit**: ECC provides exponentially more security per bit
   - RSA security: O(exp(∛(log n)))
   - ECC security: O(exp(√(log n)))

3. **Forward Secrecy**: Easier to implement ephemeral key exchanges

### Elliptic Curve Structure

An elliptic curve over a finite field F_p (prime field) has the form:
```
E: y² = x³ + ax + b (mod p)
```

**Group Operation**: Point addition creates an abelian group
- Identity element: Point at infinity (O)
- Point addition: P + Q = R (geometric: line through P,Q intersects curve at -R)
- Scalar multiplication: k·P = P + P + ... + P (k times)

**Discrete Logarithm Problem (ECDLP)**:
Given G and Q = k·G, finding k is computationally infeasible for large prime-order curves.

### Standard Curves

**secp256r1 (P-256)** — Used by ES256 algorithm:
```
p = 2^256 - 2^224 + 2^192 + 2^96 - 1
a = -3
b = 41058363725152142129326129780047268409114441015993725554835256314039467401291
G = (generator point)
n = order ≈ 2^256
```

**Ed25519** — Used by EdDSA algorithm:
```
Twisted Edwards curve: -x² + y² = 1 - (121665/121666)x²y²
Over F_p where p = 2^255 - 19
```

### Security Considerations

**Attack Complexity**:
- Best known attack: Pollard's rho algorithm
- Time complexity: O(√n) where n is the curve order
- For 256-bit curve: ~2^128 operations (quantum: ~2^64 with Shor's algorithm)

**Side-Channel Resistance**:
- Timing attacks: Constant-time implementations required
- Power analysis: Hardware isolation (Secure Enclave) mitigates
- Fault injection: Signature verification prevents some attacks

---

## WebAuthn Signature Algorithms

### ES256: ECDSA with P-256 Curve

**Algorithm Specification**:
- **Curve**: secp256r1 (P-256)
- **Hash**: SHA-256
- **Signature**: (r, s) pair, each 32 bytes = 64 bytes total
- **COSE Algorithm ID**: -7

**Signature Generation**:
```
Given: Message m, private key d, generator G, order n
1. Hash: h = SHA-256(m)
2. Convert hash to integer: e = h mod n
3. Generate random nonce: k ∈ [1, n-1]  (CRITICAL: must be random!)
4. Compute point: (x₁, y₁) = k·G
5. Compute r = x₁ mod n  (if r = 0, regenerate k)
6. Compute s = k⁻¹(e + d·r) mod n  (if s = 0, regenerate k)
7. Signature: (r, s)
```

**Signature Verification**:
```
Given: Message m, signature (r, s), public key Q, generator G, order n
1. Verify: r, s ∈ [1, n-1]
2. Hash: h = SHA-256(m)
3. Convert: e = h mod n
4. Compute: w = s⁻¹ mod n
5. Compute: u₁ = e·w mod n, u₂ = r·w mod n
6. Compute point: (x₁, y₁) = u₁·G + u₂·Q
7. Verify: r = x₁ mod n
```

**Critical Security Note: Nonce Reuse Catastrophe**

If the same nonce k is used for two signatures (r₁, s₁) and (r₂, s₂):
```
s₁ = k⁻¹(e₁ + d·r) mod n
s₂ = k⁻¹(e₂ + d·r) mod n

Attacker can compute:
k = (e₁ - e₂)·(s₁ - s₂)⁻¹ mod n

Then recover private key:
d = r⁻¹(s₁·k - e₁) mod n
```

This is why RFC 6979 specifies **deterministic ECDSA**: k = HMAC(private_key, message) ensuring uniqueness per message without requiring random number generation.

### EdDSA: Ed25519 Signature Scheme

**Algorithm Specification**:
- **Curve**: Twisted Edwards curve over F_{2^255-19}
- **Hash**: SHA-512
- **Signature**: (R, S) where R is curve point (32 bytes), S is scalar (32 bytes) = 64 bytes total
- **COSE Algorithm ID**: -8

**Key Generation**:
```
1. Generate random 32-byte seed: k
2. Hash: h = SHA-512(k)
3. Prune: Set specific bits in h[0:32] for security
4. Private scalar: s = pruned(h[0:32])
5. Public key: A = s·B (where B is base point)
```

**Signature Generation** (Deterministic):
```
Given: Message m, private key (k, A)
1. Hash seed: (h₀, h₁) = SHA-512(k) split into 32-byte halves
2. Compute nonce: r = SHA-512(h₁ || m) mod L  (L = curve order)
3. Compute R = r·B
4. Compute: h = SHA-512(R || A || m) mod L
5. Compute: S = (r + h·s) mod L
6. Signature: (R, S)
```

**Signature Verification**:
```
Given: Message m, signature (R, S), public key A
1. Verify: S < L (curve order)
2. Compute: h = SHA-512(R || A || m) mod L
3. Verify: S·B = R + h·A  (point equality on curve)
```

**Advantages of EdDSA**:
- **Deterministic by design**: No nonce reuse vulnerability
- **Faster**: ~2x faster than ECDSA on equivalent security
- **Simpler**: No modular inversion required
- **Side-channel resistant**: Complete formulas prevent timing attacks
- **No malleability**: Unlike ECDSA where (r, s) and (r, -s) both valid

### RS256: RSA with SHA-256

**Algorithm Specification**:
- **Key Size**: 2048-4096 bits (typically 2048)
- **Padding**: PKCS#1 v1.5 or PSS
- **Hash**: SHA-256
- **COSE Algorithm ID**: -257

**RSA Operation**:
```
Public key: (n, e) where n = p·q (product of large primes), e = 65537 typically
Private key: (n, d) where d = e⁻¹ mod φ(n), φ(n) = (p-1)(q-1)

Signature: s = m^d mod n
Verification: m = s^e mod n
```

**Comparison**:
- **Pros**: Wide compatibility, well-studied
- **Cons**: Large keys (2048+ bits), slower, quantum-vulnerable
- **Use Case**: Legacy support, hardware without ECC

---

## WebAuthn Protocol Specification

### Registration Flow (Attestation)

The registration ceremony creates a new credential and optionally provides attestation (proof of authenticator provenance).

#### Step 1: Relying Party Initiates Registration

The server (Relying Party) generates a challenge and specifies requirements:

```typescript
interface PublicKeyCredentialCreationOptions {
  challenge: ArrayBuffer;              // Random bytes (16-32 recommended)
  rp: {
    id: string;                        // Domain: "example.com"
    name: string;                      // Display: "Example Corp"
  };
  user: {
    id: ArrayBuffer;                   // Unique user ID (not PII)
    name: string;                      // Email or username
    displayName: string;               // User's full name
  };
  pubKeyCredParams: {
    type: "public-key";
    alg: number;                       // COSE algorithm: -7 (ES256), -8 (EdDSA), -257 (RS256)
  }[];
  authenticatorSelection?: {
    authenticatorAttachment?: "platform" | "cross-platform";
    residentKey?: "required" | "preferred" | "discouraged";
    userVerification?: "required" | "preferred" | "discouraged";
  };
  timeout?: number;                    // Milliseconds
  attestation?: "none" | "indirect" | "direct";
}
```

**Key Parameters**:
- `challenge`: Cryptographically random, prevents replay attacks
- `rp.id`: Origin domain, binds credential to this domain
- `user.id`: Internal user ID (not email), prevents correlation across RPs
- `pubKeyCredParams`: Supported algorithms in preference order
- `authenticatorAttachment`:
  - `"platform"`: Built-in authenticator (Touch ID, Face ID, Windows Hello)
  - `"cross-platform"`: Removable authenticator (USB security keys)
- `residentKey`:
  - `"required"`: Credential stored on device (enables autofill)
  - `"discouraged"`: Credential ID stored on server
- `userVerification`:
  - `"required"`: Must use biometric or PIN
  - `"discouraged"`: Just device presence sufficient

#### Step 2: Client Calls WebAuthn API

```javascript
const credential = await navigator.credentials.create({
  publicKey: options
});
```

Browser validates:
1. Origin matches `rp.id` (with subdomain allowance rules)
2. User gesture present (security requirement)
3. HTTPS context (except localhost)

#### Step 3: Authenticator Generates Key Pair

The authenticator (e.g., Secure Enclave on iPhone):

1. **Generates key pair**:
   - Private key: sk ∈ [1, n-1] (for ECDSA)
   - Public key: pk = sk·G
   - Private key stored in secure hardware, never exported

2. **Creates credential ID**:
   - Unique identifier for this key pair
   - Format varies: random UUID, encrypted private key wrap, etc.
   - For resident keys: stored on authenticator with user info

3. **Gathers authenticator data**:
   - rpIdHash: SHA-256(rp.id)
   - flags: UP (user present), UV (user verified), AT (attested credential data)
   - signCount: 0 (initial value)
   - AAGUID: Authenticator Attestation GUID (identifies model)

#### Step 4: Attestation Statement Creation

**Attestation** proves the authenticator's provenance. Three formats:

**None** (most common):
```javascript
{
  fmt: "none",
  attStmt: {}
}
```
- No attestation provided
- Privacy-preserving (no device tracking)
- RP trusts any authenticator

**Packed**:
```javascript
{
  fmt: "packed",
  attStmt: {
    alg: -7,                           // ES256
    sig: bytes,                         // Signature over authData || clientDataHash
    x5c: [cert1, cert2, ...]           // Certificate chain
  }
}
```
- Signature using attestation private key
- Certificate chain validates to manufacturer root CA
- RP can verify authenticator is genuine

**Self-Attestation**:
- Credential private key signs its own attestation
- No certificate chain
- Proves possession but not provenance

#### Step 5: Client Returns Response

```typescript
interface AuthenticatorAttestationResponse {
  clientDataJSON: ArrayBuffer;         // Serialized client data
  attestationObject: ArrayBuffer;      // CBOR-encoded attestation
}

// Decoded clientDataJSON:
{
  type: "webauthn.create",
  challenge: base64url(challenge),
  origin: "https://example.com",
  crossOrigin: false
}

// Decoded attestationObject (CBOR):
{
  fmt: "packed" | "fido-u2f" | "none",
  authData: AuthenticatorData,
  attStmt: AttestationStatement
}
```

**AuthenticatorData Structure** (binary format):
```
Bytes 00-31: rpIdHash (SHA-256, 32 bytes)
Byte  32:    flags (bit field)
              bit 0 (UP): User Present
              bit 2 (UV): User Verified
              bit 3 (BE): Backup Eligible
              bit 4 (BS): Backup State
              bit 6 (AT): Attested Credential Data included
              bit 7 (ED): Extension Data included
Bytes 33-36: signCount (uint32, big-endian)
Bytes 37+:   attestedCredentialData (if AT flag set)
              [00-15] AAGUID (16 bytes)
              [16-17] credentialIdLength (uint16, big-endian)
              [18+L]  credentialId (L bytes)
              [18+L+] credentialPublicKey (COSE_Key, CBOR-encoded)
```

**COSE_Key Structure** (for ES256):
```cbor
{
  1: 2,          // kty: EC2 (Elliptic Curve with x,y coordinates)
  3: -7,         // alg: ES256
  -1: 1,         // crv: P-256
  -2: x_bytes,   // x coordinate (32 bytes)
  -3: y_bytes    // y coordinate (32 bytes)
}
```

#### Step 6: Server Verification

The server performs these verification steps (order matters):

1. **Verify challenge**:
   ```
   clientData.challenge == base64url(expected_challenge)
   ```

2. **Verify origin**:
   ```
   clientData.origin == "https://" + rp.id
   ```

3. **Verify type**:
   ```
   clientData.type == "webauthn.create"
   ```

4. **Verify rpIdHash**:
   ```
   authData.rpIdHash == SHA-256(rp.id)
   ```

5. **Verify flags**:
   ```
   authData.flags.UP == 1  (User Present)
   authData.flags.UV == 1  (if userVerification was "required")
   ```

6. **Verify attestation signature** (if not "none"):
   ```
   data = authData || SHA-256(clientDataJSON)
   Verify(attestation_public_key, data, attStmt.sig)
   ```

7. **Extract public key**:
   ```
   credentialPublicKey = decode_COSE_Key(authData.attestedCredentialData)
   ```

8. **Store credential**:
   ```sql
   INSERT INTO passkey (
     id, credentialID, publicKey, userId, counter, ...
   ) VALUES (
     uuid(), credentialId, base64(publicKey), userId, 0, ...
   );
   ```

**Security Note**: The server must verify the signature before storing the credential. A malicious client could submit an arbitrary public key without proving possession of the private key. Attestation verification prevents this.

### Authentication Flow (Assertion)

The authentication ceremony proves possession of the private key without revealing it.

#### Step 1: Relying Party Initiates Authentication

```typescript
interface PublicKeyCredentialRequestOptions {
  challenge: ArrayBuffer;              // Fresh random bytes
  rpId?: string;                       // Domain
  allowCredentials?: {
    type: "public-key";
    id: ArrayBuffer;                   // credentialId
    transports?: ("usb" | "nfc" | "ble" | "internal" | "hybrid")[];
  }[];
  userVerification?: "required" | "preferred" | "discouraged";
  timeout?: number;
}
```

**Key Parameters**:
- `challenge`: New random challenge, prevents replay
- `allowCredentials`: Optional list of acceptable credentials
  - Empty/omitted: Resident key flow (autofill)
  - Provided: Non-resident key flow (server stores credential ID)
- `userVerification`: Require biometric/PIN verification

#### Step 2: Client Calls WebAuthn API

```javascript
const credential = await navigator.credentials.get({
  publicKey: options,
  mediation: "conditional"  // Optional: enables autofill UI
});
```

**Conditional Mediation** (autofill):
```javascript
<input type="text" autocomplete="username webauthn" />

await navigator.credentials.get({
  publicKey: options,
  mediation: "conditional"
});
```
- Browser displays passkeys in autofill dropdown
- User selects → biometric prompt → authentication
- Seamless UX, no explicit button click needed

#### Step 3: Authenticator Creates Assertion

The authenticator:

1. **Finds credential**:
   - If `allowCredentials` provided: Match by credentialId
   - If resident key flow: Display list of credentials for this RP

2. **Performs user verification**:
   - Biometric (fingerprint, face)
   - PIN
   - Platform-specific mechanism

3. **Increments signature counter**:
   - Prevents replay attacks
   - Detects cloned authenticators

4. **Signs challenge**:
   ```
   signature = Sign(privateKey, authenticatorData || SHA-256(clientDataJSON))
   ```

#### Step 4: Client Returns Response

```typescript
interface AuthenticatorAssertionResponse {
  clientDataJSON: ArrayBuffer;
  authenticatorData: ArrayBuffer;
  signature: ArrayBuffer;
  userHandle?: ArrayBuffer;            // userId for resident keys
}

// Decoded clientDataJSON:
{
  type: "webauthn.get",
  challenge: base64url(challenge),
  origin: "https://example.com",
  crossOrigin: false
}

// AuthenticatorData (binary):
Bytes 00-31: rpIdHash
Byte  32:    flags (UP, UV, BE, BS)
Bytes 33-36: signCount
```

#### Step 5: Server Verification

```javascript
// 1. Lookup credential by credentialId
const credential = await db.getPasskey(credentialId);

// 2. Verify challenge
assert(clientData.challenge == base64url(expected_challenge));

// 3. Verify origin
assert(clientData.origin == "https://" + rp.id);

// 4. Verify type
assert(clientData.type == "webauthn.get");

// 5. Verify rpIdHash
assert(authData.rpIdHash == SHA-256(rp.id));

// 6. Verify flags
assert(authData.flags.UP == 1);
if (userVerification == "required") {
  assert(authData.flags.UV == 1);
}

// 7. Verify signature
const data = authData || SHA-256(clientDataJSON);
const publicKey = decode_COSE_Key(credential.publicKey);
assert(Verify(publicKey, data, signature));

// 8. Verify signature counter (prevents replay)
assert(authData.signCount > credential.counter);

// 9. Update stored counter
await db.updatePasskeyCounter(credentialId, authData.signCount);

// 10. Create session
const sessionId = createSession(credential.userId);
return sessionId;
```

**Signature Counter Anti-Cloning**:
The signature counter must strictly increase. If it doesn't:
- Authenticator was cloned
- Replay attack attempted
- Hardware malfunction

Action: Reject authentication, alert user, potentially revoke credential.

---

## Security Properties of WebAuthn

### 1. Phishing Resistance

**Origin Binding**: The `rpId` is cryptographically bound into signed data.

Attack scenario:
```
1. Attacker creates phishing site: evil.com
2. User visits evil.com
3. Evil site requests: navigator.credentials.get({ rpId: "bank.com" })
4. Browser rejects: origin mismatch
```

The browser enforces that `rpId` must match (or be a suffix of) the current origin. Even if the attacker tricks the user, the signature will fail verification because:
```
clientData.origin = "https://evil.com"
authData.rpIdHash = SHA-256("bank.com")
```
The server verifies both independently.

**Countermeasure**: Impossible for attacker to obtain valid signature for different origin.

### 2. Replay Attack Resistance

**Challenge-Response**: Each authentication uses a fresh random challenge.

Attack scenario:
```
1. Attacker captures valid assertion (signature, authenticatorData, clientData)
2. Attacker attempts replay attack
3. Server checks: clientData.challenge != expected_challenge
4. Rejection: Signature valid but challenge mismatched
```

**Signature Counter**: Detects cloned authenticators.
```
Legitimate device: counter increments 1, 2, 3, 4, 5
Cloned device:      counter resets to 3, then 4, 5, ...
Server sees:        5, then 4 → REJECT (counter decreased)
```

### 3. Credential Isolation

Each (relying party, user) pair gets a unique key pair:
```
rpA + user1 → (sk₁, pk₁)
rpB + user1 → (sk₂, pk₂)
rpA + user2 → (sk₃, pk₃)
```

**Privacy**: Relying parties cannot correlate users across sites (no shared identifier).

**Security**: Compromise of one RP's credentials doesn't affect others.

### 4. No Shared Secrets

**Server Storage**:
```
Passwords: Hash(password) → Breach enables offline cracking
Passkeys:  Public key → Breach is useless (public by definition)
```

An attacker with database access gains nothing. Public keys cannot authenticate without the corresponding private key.

### 5. Man-in-the-Middle (MITM) Protection

**Signed Client Data**: The `origin` field is signed into the assertion.

MITM attack scenario:
```
User ↔ [Attacker Proxy] ↔ Server

1. User generates assertion for "bank.com"
2. Attacker intercepts assertion
3. Attacker forwards to "attacker.com"
4. Server verification fails: origin mismatch
```

The signature is bound to the exact origin. MITM cannot use the assertion for a different RP.

### 6. User Verification

**Biometric/PIN Requirement**: The `UV` flag proves user verification occurred.

Attack scenario:
```
1. Attacker steals user's laptop
2. Attacker attempts authentication
3. System requires: Face ID / fingerprint / PIN
4. Attack fails: Cannot impersonate biometric
```

Hardware-backed user verification (Secure Enclave) is resistant to:
- Biometric spoofing (liveness detection)
- Side-channel attacks (isolated hardware)
- Software tampering (attestation verifies authenticity)

---

## Implementation Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React Components                                       │ │
│  │  - PasskeyLoginForm (conditional UI autofill)          │ │
│  │  - MagicLinkRegistrationForm                           │ │
│  │  - PasskeyManagementUI                                 │ │
│  │  - PasskeySetupPage                                    │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────────┐ │
│  │  Auth Client (@better-auth/react)                      │ │
│  │  Plugins:                                              │ │
│  │  - passkeyClient() → signIn.passkey(), passkey.*       │ │
│  │  - magicLinkClient() → magicLink.sendMagicLink()      │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────────┐ │
│  │  WebAuthn API (navigator.credentials)                  │ │
│  │  - create(): Registration (attestation)                │ │
│  │  - get(): Authentication (assertion)                   │ │
│  │  - isConditionalMediationAvailable()                   │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────────┐ │
│  │  Platform Authenticator                                │ │
│  │  - Secure Enclave (iOS/macOS)                          │ │
│  │  - TPM 2.0 (Windows)                                   │ │
│  │  - Hardware Security Module                            │ │
│  └────────────────┬───────────────────────────────────────┘ │
└───────────────────┼──────────────────────────────────────────┘
                    │ HTTPS (Required)
                    │ TLS 1.3 Recommended
┌───────────────────▼──────────────────────────────────────────┐
│              Next.js Server (Bouncer)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  API Routes: /handlers/auth/*                          │ │
│  │  - /passkey/create                                     │ │
│  │  - /passkey/verify                                     │ │
│  │  - /magic-link/send                                    │ │
│  │  - /magic-link/verify                                  │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────────┐ │
│  │  Better Auth Server (betterAuth)                       │ │
│  │  Plugins:                                              │ │
│  │  - passkey() using SimpleWebAuthn                      │ │
│  │    • rpID, rpName, origin configuration               │ │
│  │    • Attestation verification                          │ │
│  │    • Assertion verification                            │ │
│  │  - magicLink()                                         │ │
│  │    • Token generation and verification                 │ │
│  │    • Email sending integration                         │ │
│  │  - emailAndPassword: disabled                          │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────────┐ │
│  │  Email Service (Resend / SendGrid / AWS SES)          │ │
│  │  - Send magic link emails                             │ │
│  │  - Rate limiting                                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────────┐ │
│  │  PostgreSQL (Neon Serverless)                          │ │
│  │  Tables:                                               │ │
│  │  - user: id, email, name, phone                        │ │
│  │  - session: id, token, userId, expiresAt               │ │
│  │  - passkey: id, credentialID, publicKey, userId,       │ │
│  │             counter, deviceType, backedUp              │ │
│  │  - verification: id, identifier, value, expiresAt      │ │
│  │    (for magic link tokens)                             │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Database Schema

#### Existing Tables

```sql
-- User table (from Better Auth)
create table "user" (
  "id" text primary key,
  "name" text not null,
  "email" text not null unique,
  "emailVerified" boolean not null,
  "image" text,
  "phone" text,
  "createdAt" timestamptz default CURRENT_TIMESTAMP not null,
  "updatedAt" timestamptz default CURRENT_TIMESTAMP not null
);

-- Session table
create table "session" (
  "id" text primary key,
  "expiresAt" timestamptz not null,
  "token" text not null unique,
  "userId" text not null references "user"("id") on delete cascade,
  "ipAddress" text,
  "userAgent" text,
  "createdAt" timestamptz default CURRENT_TIMESTAMP not null,
  "updatedAt" timestamptz not null
);

-- Verification table (for magic links)
create table "verification" (
  "id" text primary key,
  "identifier" text not null,        -- email address
  "value" text not null,              -- hashed token
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz default CURRENT_TIMESTAMP not null,
  "updatedAt" timestamptz default CURRENT_TIMESTAMP not null
);
```

#### New Passkey Table

```sql
-- Passkey table for WebAuthn credentials
create table "passkey" (
  -- Record identifier (UUID)
  "id" text not null primary key,

  -- User-provided name for the passkey
  -- Example: "MacBook Pro", "iPhone 13", "YubiKey 5"
  "name" text,

  -- COSE-encoded public key (base64)
  -- This is the key used to verify signatures
  "publicKey" text not null,

  -- Foreign key to user table
  "userId" text not null references "user" ("id") on delete cascade,

  -- WebAuthn credential ID (unique identifier for this passkey)
  -- Used by browser to identify the credential during authentication
  "credentialID" text not null unique,

  -- Signature counter (for replay attack detection)
  -- Must strictly increase with each authentication
  "counter" integer not null,

  -- Device type: "platform" (built-in) or "cross-platform" (USB key)
  "deviceType" text not null,

  -- Whether this credential is backed up / synced across devices
  -- Important for understanding user's recovery options
  "backedUp" boolean not null,

  -- Supported transports: "usb", "nfc", "ble", "internal", "hybrid"
  -- Comma-separated or JSON array
  "transports" text,

  -- Authenticator Attestation GUID (identifies authenticator model)
  -- Useful for security policies (e.g., "only allow YubiKeys")
  "aaguid" text,

  -- Timestamp when passkey was created
  "createdAt" timestamptz default CURRENT_TIMESTAMP not null
);

-- Indexes for efficient queries
create index "passkey_userId_idx" on "passkey" ("userId");
create index "passkey_credentialID_idx" on "passkey" ("credentialID");
```

### Configuration Specifications

#### Server Configuration

**File**: `/app/bouncer/lib/auth.ts`

```typescript
import { betterAuth } from "better-auth";
import { passkey } from "@better-auth/passkey";
import { magicLink } from "better-auth/plugins";
import { Pool } from "pg";
import { sendEmail } from "./email";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.NEON_POSTGRES_URL,
  }),

  // Disable password authentication
  emailAndPassword: {
    enabled: false,
  },

  plugins: [
    // Passkey authentication plugin
    passkey({
      // Relying Party ID: domain name
      rpID: process.env.NEXT_PUBLIC_RP_ID || "localhost",

      // Relying Party Name: display name
      rpName: "Party Invitation Platform",

      // Origin: full URL of the application
      origin: getBaseURL(),

      // Authenticator selection criteria
      authenticatorSelection: {
        // Prefer platform authenticators (Face ID, Touch ID, Windows Hello)
        // Over cross-platform (USB security keys)
        authenticatorAttachment: "platform",

        // Require resident keys (credential stored on device)
        // Enables conditional UI / autofill
        residentKey: "required",

        // Always require user verification (biometric or PIN)
        userVerification: "required",
      },

      // Attestation format
      attestation: "none",  // Privacy-preserving, no device tracking
    }),

    // Magic link plugin for initial registration and recovery
    magicLink({
      // Token expiration time (5 minutes)
      expiresIn: 300,

      // Allow new user creation via magic link
      disableSignUp: false,

      // Email sending function
      sendMagicLink: async ({ email, token, url }, ctx) => {
        await sendEmail({
          to: email,
          subject: "Sign in to Party Platform",
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2>Sign in to Party Platform</h2>
                  <p>Click the link below to sign in to your account:</p>
                  <a href="${url}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                    Sign In
                  </a>
                  <p style="color: #666; font-size: 14px; margin-top: 20px;">
                    This link expires in 5 minutes.<br>
                    If you didn't request this, you can safely ignore this email.
                  </p>
                </div>
              </body>
            </html>
          `,
        });
      },
    }),
  ],

  // User schema
  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: false,
      },
    },
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,      // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,             // 5 minutes
    },
  },

  baseURL: getBaseURL(),
  basePath: "/handlers/auth",
  trustedOrigins: [getBaseURL()],
});

function getBaseURL() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export type Session = typeof auth.$Infer.Session;
```

#### Client Configuration

**File**: `/app/bouncer/lib/auth-client.ts`

```typescript
import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";
import { magicLinkClient } from "better-auth/client/plugins";

function getClientBaseURL() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return undefined;
}

export const authClient = createAuthClient({
  baseURL: getClientBaseURL(),
  basePath: "/handlers/auth",
  plugins: [
    passkeyClient(),      // Adds: signIn.passkey(), passkey.addPasskey(), etc.
    magicLinkClient(),    // Adds: magicLink.sendMagicLink()
  ],
});

// Export typed methods
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  passkey,      // Passkey management methods
  magicLink,    // Magic link methods
} = authClient;
```

---

## User Flows

### New User Registration Flow

```
┌──────────────────────────────────────────────────────────────┐
│ 1. User visits /auth/registration                            │
│    Component: MagicLinkRegistrationForm                      │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. User enters:                                              │
│    - Name: "Alice Johnson"                                   │
│    - Email: "alice@example.com"                              │
│                                                              │
│    Clicks "Send login link"                                  │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Client calls:                                             │
│    magicLink.sendMagicLink({ email, data: { name } })       │
│                                                              │
│    Server:                                                   │
│    - Generates random token (32 bytes)                       │
│    - Hashes token: SHA-256(token)                            │
│    - Stores in verification table:                           │
│      { identifier: email, value: hash, expiresAt: +5min }   │
│    - Constructs URL:                                         │
│      /handlers/auth/magic-link/verify?token=...             │
│    - Sends email with link                                   │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Confirmation screen:                                      │
│    "Check your email"                                        │
│    "We sent a login link to alice@example.com"               │
│    "The link expires in 5 minutes."                          │
└──────────────────────────────────────────────────────────────┘
                     │
                     ▼ (user clicks email link)
┌──────────────────────────────────────────────────────────────┐
│ 5. Server validates magic link token:                        │
│    GET /handlers/auth/magic-link/verify?token=xyz            │
│                                                              │
│    Validation:                                               │
│    1. Hash token: SHA-256(xyz)                               │
│    2. Lookup in verification table by hash                   │
│    3. Check expiration: expiresAt > now                      │
│    4. Delete token (one-time use)                            │
│                                                              │
│    User Creation:                                            │
│    - Check if user exists by email                           │
│    - If not: INSERT INTO user (email, name, ...)             │
│                                                              │
│    Session Creation:                                         │
│    - Generate session token                                  │
│    - Store in session table                                  │
│    - Set secure cookie                                       │
│                                                              │
│    Redirect: /auth/setup-passkey                             │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. Passkey setup page (/auth/setup-passkey)                 │
│    Component: PasskeySetupPage                               │
│                                                              │
│    Checks:                                                   │
│    - Session exists? (redirect to /auth/login if not)        │
│    - WebAuthn supported? (show fallback if not)             │
│                                                              │
│    Display:                                                  │
│    "Set up biometric login"                                  │
│    "Use your fingerprint, face, or device PIN to sign in    │
│     quickly and securely."                                   │
│                                                              │
│    Buttons:                                                  │
│    [Set up passkey] [Skip for now]                          │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼ (user clicks "Set up passkey")
┌──────────────────────────────────────────────────────────────┐
│ 7. Client initiates passkey registration:                   │
│    passkey.addPasskey({ name: "MacBook Pro - Dec 28" })     │
│                                                              │
│    API call: POST /handlers/auth/passkey/create              │
│                                                              │
│    Server response: PublicKeyCredentialCreationOptions       │
│    {                                                         │
│      challenge: random_bytes(32),                            │
│      rp: { id: "localhost", name: "Party Platform" },        │
│      user: {                                                 │
│        id: user.id (base64url),                              │
│        name: "alice@example.com",                            │
│        displayName: "Alice Johnson"                          │
│      },                                                      │
│      pubKeyCredParams: [                                     │
│        { alg: -7, type: "public-key" },   // ES256           │
│        { alg: -8, type: "public-key" }    // EdDSA           │
│      ],                                                      │
│      authenticatorSelection: {                               │
│        authenticatorAttachment: "platform",                  │
│        residentKey: "required",                              │
│        userVerification: "required"                          │
│      },                                                      │
│      timeout: 60000                                          │
│    }                                                         │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 8. Browser calls WebAuthn API:                              │
│    navigator.credentials.create({ publicKey: options })      │
│                                                              │
│    Browser displays platform UI:                             │
│    ┌──────────────────────────────────────┐                 │
│    │ 🔒 Create a passkey                  │                 │
│    │                                      │                 │
│    │ Use Touch ID to continue            │                 │
│    │                                      │                 │
│    │ [👆 Touch ID icon]                  │                 │
│    │                                      │                 │
│    │ [Cancel]  [Use Touch ID]            │                 │
│    └──────────────────────────────────────┘                 │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼ (user completes biometric)
┌──────────────────────────────────────────────────────────────┐
│ 9. Authenticator (Secure Enclave):                          │
│    - Generates key pair: (sk, pk) using ECDSA P-256          │
│    - Private key stored in secure hardware (never leaves)    │
│    - Generates credential ID: random UUID or encrypted wrap  │
│    - Creates attestation statement                           │
│    - Returns to browser                                      │
│                                                              │
│    Browser sends to server:                                  │
│    POST /handlers/auth/passkey/verify                        │
│    {                                                         │
│      credential: {                                           │
│        id: credentialId,                                     │
│        rawId: ArrayBuffer,                                   │
│        response: {                                           │
│          clientDataJSON: {...},                              │
│          attestationObject: CBOR(...)                        │
│        },                                                    │
│        type: "public-key"                                    │
│      }                                                       │
│    }                                                         │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 10. Server verifies attestation:                            │
│     - Decode clientDataJSON and attestationObject            │
│     - Verify challenge matches                               │
│     - Verify origin matches rpID                             │
│     - Verify rpIdHash in authenticatorData                   │
│     - Verify user present (UP) and verified (UV) flags       │
│     - Verify attestation signature (if not "none")           │
│     - Extract public key from attestationObject              │
│                                                              │
│     Store credential:                                        │
│     INSERT INTO passkey (                                    │
│       id, credentialID, publicKey, userId, counter,          │
│       deviceType, backedUp, name                             │
│     ) VALUES (                                               │
│       uuid(), credentialId, base64(publicKey), userId, 0,    │
│       'platform', true, 'MacBook Pro - Dec 28'               │
│     )                                                        │
│                                                              │
│     Response: { success: true }                              │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 11. Redirect to /invitations                                │
│     User is now authenticated with:                          │
│     - Active session (7 days)                                │
│     - Passkey registered                                     │
│     - Can use biometric login on future visits               │
└──────────────────────────────────────────────────────────────┘
```

### Returning User Authentication Flow

```
┌──────────────────────────────────────────────────────────────┐
│ 1. User visits /auth/login                                   │
│    Component: PasskeyLoginForm                               │
│                                                              │
│    Page loads:                                               │
│    - Checks WebAuthn support                                 │
│    - Checks conditional UI support                           │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 2a. Conditional UI enabled (Chrome 119+, Safari 17+):       │
│                                                              │
│     Email field with autofill:                               │
│     <input                                                   │
│       type="email"                                           │
│       autoComplete="username webauthn"                       │
│     />                                                       │
│                                                              │
│     Automatically initiates:                                 │
│     signIn.passkey({ mediation: "conditional" })             │
│                                                              │
│     User clicks email field → sees passkeys in dropdown      │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼ (user selects passkey from autofill)
┌──────────────────────────────────────────────────────────────┐
│ 2b. Or: User clicks "Sign in with passkey" button           │
│     signIn.passkey({ email: optionalEmail })                 │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Client requests authentication options:                  │
│    GET /handlers/auth/passkey/authenticate                   │
│                                                              │
│    Server response: PublicKeyCredentialRequestOptions        │
│    {                                                         │
│      challenge: random_bytes(32),                            │
│      rpId: "localhost",                                      │
│      userVerification: "required",                           │
│      timeout: 60000,                                         │
│      allowCredentials: []   // Empty for resident key flow   │
│    }                                                         │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Browser calls WebAuthn API:                              │
│    navigator.credentials.get({ publicKey: options })         │
│                                                              │
│    Browser displays passkey selection / biometric prompt:    │
│    ┌──────────────────────────────────────┐                 │
│    │ 🔒 Sign in to localhost              │                 │
│    │                                      │                 │
│    │ Use Touch ID for alice@example.com  │                 │
│    │                                      │                 │
│    │ [👆 Touch ID icon]                  │                 │
│    │                                      │                 │
│    │ [Cancel]  [Use Touch ID]            │                 │
│    └──────────────────────────────────────┘                 │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼ (user completes biometric)
┌──────────────────────────────────────────────────────────────┐
│ 5. Authenticator (Secure Enclave):                          │
│    - Finds stored credential by rpID                         │
│    - Requests user verification (biometric/PIN)              │
│    - Increments signature counter: counter++                 │
│    - Signs challenge:                                        │
│      signature = Sign(sk, authenticatorData || clientDataHash)│
│    - Returns assertion to browser                            │
│                                                              │
│    Browser sends to server:                                  │
│    POST /handlers/auth/passkey/verify                        │
│    {                                                         │
│      credential: {                                           │
│        id: credentialId,                                     │
│        response: {                                           │
│          clientDataJSON: {...},                              │
│          authenticatorData: binary,                          │
│          signature: binary,                                  │
│          userHandle: userId                                  │
│        }                                                     │
│      }                                                       │
│    }                                                         │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. Server verifies assertion:                               │
│    1. Lookup credential by credentialId in passkey table     │
│    2. Decode clientDataJSON and authenticatorData            │
│    3. Verify challenge matches                               │
│    4. Verify origin == "https://localhost" (or domain)       │
│    5. Verify type == "webauthn.get"                          │
│    6. Verify rpIdHash == SHA-256("localhost")                │
│    7. Verify flags: UP=1, UV=1                               │
│    8. Verify signature:                                      │
│       data = authenticatorData || SHA-256(clientDataJSON)    │
│       Verify(publicKey, data, signature) == true             │
│    9. Verify counter: authData.counter > stored.counter      │
│   10. Update stored counter                                  │
│                                                              │
│    If verification successful:                               │
│    - Get userId from credential                              │
│    - Create session                                          │
│    - Set secure cookie                                       │
│    - Response: { success: true, sessionId }                  │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 7. Redirect to /invitations                                 │
│    User is authenticated                                     │
│    Session valid for 7 days                                  │
└──────────────────────────────────────────────────────────────┘
```

### Fallback: Magic Link Recovery

```
┌──────────────────────────────────────────────────────────────┐
│ Scenario: User has no available passkey                     │
│ - New device (passkey on different device)                  │
│ - Lost authenticator                                         │
│ - Unsupported browser                                        │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 1. Login page: User clicks "Use email instead"              │
│    Form switches to magic link mode                          │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. User enters email, clicks "Send login link"              │
│    magicLink.sendMagicLink({ email })                        │
│    Server sends email with link                              │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. User clicks link in email                                │
│    Server validates token, creates session                   │
│    Redirect to /invitations                                  │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Optional: Prompt to add passkey for current device       │
│    "Add a passkey for faster login on this device?"         │
│    [Set up passkey] [Not now]                                │
└──────────────────────────────────────────────────────────────┘
```

---

## Browser Support Matrix

| Browser        | Version | Platform Authenticator | Conditional UI | Cross-platform Keys |
|----------------|---------|----------------------|----------------|---------------------|
| Chrome         | 119+    | ✅                   | ✅             | ✅                  |
| Safari (iOS)   | 16+     | ✅ (Face ID / Touch ID) | ✅ (iOS 17+)   | Limited             |
| Safari (macOS) | 16+     | ✅ (Touch ID)        | ✅             | Limited             |
| Firefox        | 122+    | ✅                   | ❌             | ✅                  |
| Edge           | 119+    | ✅ (Windows Hello)   | ✅             | ✅                  |

**Platform Authenticators**:
- **iOS**: Face ID, Touch ID (Secure Enclave)
- **macOS**: Touch ID (T2 chip / Apple Silicon Secure Enclave)
- **Windows**: Windows Hello (TPM 2.0, facial recognition, fingerprint)
- **Android**: Fingerprint, face unlock, screen lock PIN

**Conditional UI / Autofill Support**:
- Chrome/Edge 119+ (desktop and mobile)
- Safari 17+ (iOS and macOS)
- Firefox: Not yet supported (as of v122)

**Fallback Strategy**:
1. **Best**: Passkey + conditional UI (seamless autofill)
2. **Good**: Passkey + manual button click
3. **Acceptable**: Magic link only (unsupported browsers)

---

## Security Considerations

### 1. Rate Limiting

**Magic Link Requests**:
```
Limit: 5 requests per email per 15 minutes
Action: Return "Too many requests" error
```

**Authentication Attempts**:
```
Limit: 10 failed attempts per user per hour
Action: Temporarily lock account, send alert email
```

**Implementation**: Use Redis or in-memory store for rate limit counters.

### 2. HTTPS Enforcement

WebAuthn **requires** secure context:
- Production: HTTPS mandatory
- Development: `localhost` allowed
- IP addresses: Not allowed (except `127.0.0.1`)

**Enforcement**:
```typescript
if (process.env.NODE_ENV === "production" && !request.url.startsWith("https://")) {
  return new Response("HTTPS required", { status: 403 });
}
```

### 3. Signature Counter Validation

**Anti-Cloning Detection**:
```typescript
async function verifyAssertion(credentialId, authData) {
  const stored = await db.getPasskey(credentialId);

  // Counter must strictly increase
  if (authData.signCount <= stored.counter) {
    // Possible cloned authenticator!
    await alertUser(stored.userId, "Possible security issue detected");
    await revokePasskey(credentialId);
    throw new Error("Invalid signature counter");
  }

  // Update stored counter
  await db.updatePasskeyCounter(credentialId, authData.signCount);
}
```

**Note**: Counter of 0 means authenticator doesn't support counter (some USB keys). Accept but log.

### 4. Session Security

```typescript
session: {
  expiresIn: 60 * 60 * 24 * 7,        // 7 days
  updateAge: 60 * 60 * 24,            // Refresh if > 1 day old
  cookieCache: {
    enabled: true,
    maxAge: 5 * 60,                   // 5 minute cache
  },
}

// Cookie settings (Better Auth defaults)
secure: true,                         // HTTPS only
httpOnly: true,                       // No JavaScript access
sameSite: "lax",                      // CSRF protection
```

### 5. Challenge Randomness

Challenges must be cryptographically random:
```typescript
// Good: Cryptographically secure
const challenge = crypto.getRandomValues(new Uint8Array(32));

// Bad: Predictable
const challenge = Math.random();  // ❌ INSECURE
```

### 6. Origin Validation

Always verify `clientData.origin` matches expected origin:
```typescript
const clientData = JSON.parse(base64url.decode(response.clientDataJSON));

// Must match exactly
if (clientData.origin !== `https://${expectedRpId}`) {
  throw new Error("Origin mismatch");
}
```

### 7. Timeout Enforcement

```typescript
// Server-side timeout validation
const CHALLENGE_TIMEOUT = 5 * 60 * 1000;  // 5 minutes

interface ChallengeRecord {
  challenge: string;
  createdAt: number;
}

async function validateChallenge(providedChallenge: string) {
  const record = await redis.get(`challenge:${providedChallenge}`);

  if (!record) {
    throw new Error("Invalid challenge");
  }

  if (Date.now() - record.createdAt > CHALLENGE_TIMEOUT) {
    throw new Error("Challenge expired");
  }

  // Delete challenge (one-time use)
  await redis.del(`challenge:${providedChallenge}`);
}
```

---

## Testing Strategy

### Unit Tests

**WebAuthn Utilities**:
```typescript
describe("checkWebAuthnSupport", () => {
  it("detects support when PublicKeyCredential exists", async () => {
    global.PublicKeyCredential = mockPKC;
    const support = await checkWebAuthnSupport();
    expect(support.supported).toBe(true);
  });

  it("returns unsupported when API missing", async () => {
    global.PublicKeyCredential = undefined;
    const support = await checkWebAuthnSupport();
    expect(support.supported).toBe(false);
  });
});

describe("getWebAuthnErrorMessage", () => {
  it("maps NotAllowedError to user-friendly message", () => {
    const error = new Error("User cancelled");
    error.name = "NotAllowedError";
    const message = getWebAuthnErrorMessage(error);
    expect(message).toContain("cancelled or timed out");
  });
});
```

**Cryptographic Functions**:
```typescript
describe("Signature Verification", () => {
  it("verifies valid ES256 signature", () => {
    const { publicKey, privateKey } = generateKeyPair();
    const message = "test message";
    const signature = sign(privateKey, message);
    expect(verify(publicKey, message, signature)).toBe(true);
  });

  it("rejects signature with wrong message", () => {
    const signature = sign(privateKey, "original");
    expect(verify(publicKey, "tampered", signature)).toBe(false);
  });
});
```

### Integration Tests

**Registration Flow**:
```typescript
describe("Passkey Registration", () => {
  it("completes full registration flow", async () => {
    // 1. Request creation options
    const options = await authClient.passkey.getRegistrationOptions();
    expect(options.challenge).toBeDefined();

    // 2. Simulate authenticator response (using virtual authenticator)
    const credential = await navigator.credentials.create({
      publicKey: options
    });

    // 3. Verify credential on server
    const result = await authClient.passkey.verifyRegistration(credential);
    expect(result.verified).toBe(true);

    // 4. Check database
    const stored = await db.getPasskeyByCredentialId(credential.id);
    expect(stored).toBeDefined();
    expect(stored.counter).toBe(0);
  });
});
```

**Authentication Flow**:
```typescript
describe("Passkey Authentication", () => {
  beforeEach(async () => {
    await registerTestPasskey();
  });

  it("authenticates with valid passkey", async () => {
    const options = await authClient.passkey.getAuthenticationOptions();
    const credential = await navigator.credentials.get({
      publicKey: options
    });

    const session = await authClient.passkey.verifyAuthentication(credential);
    expect(session.authenticated).toBe(true);
    expect(session.userId).toBe(testUserId);
  });

  it("rejects replayed assertion", async () => {
    const credential = await authenticate();

    // Try to replay same assertion
    await expect(
      authClient.passkey.verifyAuthentication(credential)
    ).rejects.toThrow("Challenge already used");
  });

  it("detects cloned authenticator via counter", async () => {
    // Authenticate once (counter = 1)
    await authenticate();

    // Simulate cloned authenticator (counter resets to 0)
    const clonedCredential = createClonedAssertion(counter: 0);

    await expect(
      authClient.passkey.verifyAuthentication(clonedCredential)
    ).rejects.toThrow("Invalid signature counter");
  });
});
```

### Browser Compatibility Tests

**Manual Testing Matrix**:
- Chrome 119+ (Windows, macOS, Android)
- Safari 16+ (macOS, iOS 16+)
- Safari 17+ (test conditional UI)
- Firefox 122+ (Windows, macOS, Linux)
- Edge 119+ (Windows)

**Test Cases**:
1. Registration with platform authenticator
2. Authentication with passkey
3. Conditional UI autofill (supported browsers)
4. Magic link fallback (all browsers)
5. Multiple passkey management
6. Cross-origin rejection (security test)

### Security Tests

**Penetration Testing**:
```typescript
describe("Security Tests", () => {
  it("rejects assertion from different origin", async () => {
    const options = await getAuthOptions({ rpId: "bank.com" });
    const credential = await createAssertion({
      ...options,
      origin: "https://evil.com"  // Attacker site
    });

    await expect(
      verifyAssertion(credential)
    ).rejects.toThrow("Origin mismatch");
  });

  it("rejects reused challenge", async () => {
    const challenge = generateChallenge();
    await authClient.authenticate({ challenge });

    // Try to reuse same challenge
    await expect(
      authClient.authenticate({ challenge })
    ).rejects.toThrow("Challenge expired or already used");
  });

  it("enforces rate limiting on magic links", async () => {
    const email = "test@example.com";

    // Send 5 magic links (limit)
    for (let i = 0; i < 5; i++) {
      await magicLink.send(email);
    }

    // 6th request should fail
    await expect(
      magicLink.send(email)
    ).rejects.toThrow("Too many requests");
  });
});
```

---

## Migration and Rollout Plan

### Phase 1: Preparation (Pre-deployment)
- Write comprehensive RFD (this document)
- Review with stakeholders
- Set up development environment
- Install dependencies

### Phase 2: Infrastructure (1-2 hours)
- Upgrade Better Auth packages
- Run database migration (create passkey table)
- Configure email service (Resend/SendGrid)
- Set environment variables

### Phase 3: Backend Implementation (3-4 hours)
- Configure server authentication (passkey + magic link plugins)
- Update client configuration
- Test API endpoints

### Phase 4: Frontend Implementation (8-10 hours)
- Create utility functions (pure, functional)
- Build React hooks
- Implement authentication components:
  - Passkey login form
  - Magic link registration
  - Passkey setup page
  - Passkey management UI
- Update routes

### Phase 5: Testing (4-6 hours)
- Unit tests for utilities
- Integration tests for auth flows
- Browser compatibility testing
- Security testing
- Performance testing

### Phase 6: Deployment (1 hour)
- Deploy to staging
- Run smoke tests
- Deploy to production
- Monitor for issues

### Phase 7: Monitoring (Ongoing)
- Track authentication success rates
- Monitor error rates by browser
- Analyze conditional UI usage
- Collect user feedback

---

## Estimated Timeline

**Total Implementation Time**: 20-25 hours
- RFD Creation: 3-4 hours ✓ (this document)
- Dependency Setup: 1 hour
- Database Migration: 1 hour
- Backend Configuration: 2-3 hours
- Utility Functions: 2-3 hours
- React Hooks: 1-2 hours
- Component Development: 6-8 hours
- Route Updates: 1 hour
- Testing: 4-6 hours
- Documentation: 1-2 hours

---

## Open Questions

1. **Email Service Provider**: Resend, SendGrid, or AWS SES?
   - Recommendation: Resend (best developer experience, generous free tier)

2. **Multiple Passkeys**: Allow users to register multiple passkeys?
   - Recommendation: Yes (different devices, backup keys)

3. **Cross-platform Authenticators**: Support USB security keys?
   - Recommendation: Yes (set authenticatorAttachment to undefined, not "platform")

4. **Attestation**: Verify authenticator provenance?
   - Recommendation: "none" for privacy (no device tracking)

5. **Existing Users**: Migration strategy for users with passwords?
   - Recommendation: Force passkey setup on next login, then disable passwords

6. **Session Duration**: 7 days or shorter?
   - Recommendation: Keep 7 days (standard for similar applications)

7. **Magic Link Expiration**: 5 minutes or longer?
   - Recommendation: Keep 5 minutes (security best practice)

---

## References

- [W3C WebAuthn Level 3 Specification](https://www.w3.org/TR/webauthn-3/)
- [WebAuthn Guide](https://webauthn.guide/)
- [Better Auth Passkey Plugin](https://www.better-auth.com/docs/plugins/passkey)
- [SimpleWebAuthn Documentation](https://simplewebauthn.dev/)
- [FIDO Alliance Specifications](https://fidoalliance.org/specifications/)
- [RFC 6979: Deterministic ECDSA](https://datatracker.ietf.org/doc/html/rfc6979)
- [ECDSA: Elliptic Curve Digital Signatures](https://cryptobook.nakov.com/digital-signatures/ecdsa-sign-verify-messages)
- [EdDSA / Ed25519 Specification](https://ed25519.cr.yp.to/)
- [COSE (CBOR Object Signing and Encryption)](https://datatracker.ietf.org/doc/html/rfc8152)
- [WebAuthn Awesome List](https://github.com/herrjemand/awesome-webauthn)

---

## Appendix: COSE Key Encoding Example

**ES256 Public Key** (P-256 curve):

Decoded COSE_Key (CBOR map):
```json
{
  1: 2,                                // kty: EC2
  3: -7,                               // alg: ES256
  -1: 1,                               // crv: P-256
  -2: "x_coordinate_32_bytes",         // x
  -3: "y_coordinate_32_bytes"          // y
}
```

CBOR Encoding:
```
A5                                   // Map (5 pairs)
  01 02                              // Key 1 (kty), Value 2 (EC2)
  03 26                              // Key 3 (alg), Value -7 (ES256)
  20 01                              // Key -1 (crv), Value 1 (P-256)
  21 58 20 [32 bytes x]              // Key -2 (x), Bytes(32)
  22 58 20 [32 bytes y]              // Key -3 (y), Bytes(32)
```

**EdDSA Public Key** (Ed25519):

```json
{
  1: 1,                                // kty: OKP (Octet Key Pair)
  3: -8,                               // alg: EdDSA
  -1: 6,                               // crv: Ed25519
  -2: "public_key_32_bytes"            // x (public key point)
}
```

---

## Conclusion

This RFD presents a comprehensive analysis of passkey authentication using WebAuthn, from cryptographic foundations through practical implementation. By replacing password-based authentication with public-key cryptography, we eliminate entire classes of vulnerabilities (phishing, credential stuffing, server breaches) while providing superior user experience through biometric authentication.

The implementation leverages Better Auth's passkey and magic link plugins, creating a passwordless system that balances security, usability, and developer ergonomics. With functional programming principles, type safety, and graceful degradation, the codebase will be maintainable and extensible for future enhancements.

---

**Status**: Draft
**Next Steps**: Review → Approval → Implementation
**Questions**: Contact Sanjay Yepuri
