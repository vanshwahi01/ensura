# PeerSurance


![Last Commit](https://img.shields.io/github/last-commit/vanshwahi01/ensura)
![Issues](https://img.shields.io/github/issues/vanshwahi01/ensura)
![Version](https://img.shields.io/badge/version-v0.0.0-blue)


Decentralized insurance built for real users.


## Built With


- **Flare's FDC** - Flare Data Connector for decentralized data verification
- **0G** - Decentralized compute network
- **Next.js** - React framework for the frontend


## Getting Started


### Prerequisites


Send >= 1 OG Token to provider if this is the first time the wallet is being used.


### Setup


Create a `.env` file in the root directory:


```env
PRIVATE_KEY=<your private key without 0x prefix>
PORT=4000
NODE_ENV=development
```


### Install & Run


```bash
npm install
npm run build
npm run dev
```


## How to Use PeerSurance


### For Insurance Seekers


#### 1. Submit an Insurance Application


Start by filling out the insurance application form on the homepage:


**Required Information:**
- **First Name** and **Last Name** - Your full legal name
- **Age** - Must be 18 or older
- **Nationality** - Select your country of citizenship
- **Insurance Type** - Choose from:
  - Health Insurance
  - Life Insurance
  - Auto Insurance
  - Home Insurance
  - Travel Insurance
  - Business Insurance
  - Disability Insurance
  - Pet Insurance


**Optional Documents:**
- Driver's License (image or PDF)
- Passport (image or PDF)


**Additional Information:**
- Share any specific concerns, medical conditions, coverage preferences, or questions that can help generate a more accurate quote


Click **"Get Your Quote"** to submit your application.


#### 2. AI-Powered Quote Generation


After submission, your application goes through a 3-stage analysis process powered by the 0G decentralized compute network:


**Stage 1: Data Analysis (33% complete)**
- The system analyzes your selected insurance type and personal details



**Stage 2: AI Inference (66% complete)**
- An AI insurance advisor processes your information to provide personalized recommendations
- Considers factors like your age, nationality, and specific needs



**Stage 3: Contract Proposal (100% complete)**
- A comprehensive insurance quote is generated with detailed pricing


**Total processing time:** 20-180 seconds


#### 3. Review Your Personalized Quote


Once processing completes, you'll see your comprehensive insurance quote containing:


**Coverage Recommendation:**
- Recommended policy type and coverage amount
- Term/duration of coverage
- Key benefit highlights


**Pricing:**
- Monthly premium amount
- Annual premium amount
- Total coverage value


**Personalized Analysis:**
- Why this coverage works for your age and risk profile
- Coverage fit for your life stage
- Benefits specific to your nationality (if applicable)


**Important Information:**
- Critical exclusions you should be aware of
- Key terms and conditions


**Next Steps:**
- Clear instructions on how to proceed
- What to expect after acceptance
- When coverage activates


**Blockchain Transparency:**
All quotes are backed by smart contracts on the Flare Network, ensuring transparency and automated execution without intermediaries.


#### 4. Accept or Decline Your Contract


After reviewing your quote, you have two options:


**Accept:**
1. Click **"Accept Contract"** 
2. Confirm your acceptance in the modal dialog
3. Review the terms one final time
4. Click **"Yes, Accept Contract"**
5. You'll receive a confirmation message and email with your policy details
6. Your coverage activates according to the timeline in your quote


**Decline:**
1. Click **"Decline"**
2. Confirm your decision
3. The form resets, and you can submit a new request anytime with different parameters


#### 5. Managing Your Policy


**After Acceptance:**
- A copy of your contract is sent to your registered email
- Your policy is recorded on-chain via Flare Network smart contracts
- Coverage begins according to your policy terms


**Filing a Claim:**
When you need to file a claim:
1. Gather evidence of your claim (documentation, receipts, reports, etc.)
2. Submit your claim through the platform
3. Evidence is verified using Flare's FDC (Flare Data Connector) for on-chain proof
4. Once verified, payout is automatically processed through the smart contract
5. Funds are transferred to your wallet


### For Insurance Providers


#### Making an Offer


Providers can review quote requests and make competitive offers:


1. Review available quote requests on the platform
2. Analyze the requester's underwriting data (verified by FDC)
3. Submit an offer with:
   - Premium amount (what the requester pays)
   - Coverage amount (maximum payout)
   - Validity period (offer expiration)
   - AI risk assessment (verified by FDC)

### Key Features


**Decentralized Data Verification**
- Flare's FDC (Flare Data Connector) verifies underwriting data, risk assessments, and claim evidence on-chain
- Ensures all data used in insurance contracts is cryptographically proven


**AI-Powered Risk Assessment**
- Uses 0G's decentralized compute network for AI-driven insurance recommendations
- Provides personalized quotes based on individual risk profiles


**Smart Contract Automation**
- Premiums, coverage funding, and payouts are handled automatically
- No intermediaries or manual processing delays
- Transparent, auditable, and tamper-proof


**Blockchain Transparency**
- All contracts stored on Flare Network
- Fully auditable policy terms
- Trustless execution of claims
