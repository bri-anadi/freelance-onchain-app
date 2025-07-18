# Unlocked - Decentralized Freelance Marketplace on Base Network

Unlocked is a decentralized freelance marketplace built on the Base Network blockchain. It connects clients with freelancers, allowing for secure and transparent job posting, application, and payment processes, all powered by blockchain technology.

![Unlocked Platform](https://devfolio-prod.s3.ap-south-1.amazonaws.com/hackathons/base-batch-apac/projects/3c2235fa9424427cb3170f42c52a00ac/c8fb3ee6-0732-4082-b49e-1bfcdc0da142.jpeg)

## Features

- **Decentralized Authentication**: Connect with any Web3 wallet
- **Smart Contract Integration**: All jobs, applications, and payments handled on-chain
- **AI Verification System**: Automatic work verification with partial payment release
- **Job Marketplace**: Browse and apply for available jobs
- **Client Dashboard**: Post jobs, review applications, and approve work
- **Freelancer Dashboard**: Apply for jobs, submit work, and track earnings
- **Admin Panel**: Manage platform settings and verify work submissions
- **Dark/Light Mode Support**: User preference-based theming

## Technology Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Blockchain Integration**: OnchainKit, Wagmi, Viem
- **Smart Contracts**: Solidity (Base Network)
- **Authentication**: Web3 wallet providers
- **UI Components**: ShadcnUI
- **AI Verification**: Custom API integration

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm, yarn, pnpm, or bun
- A web3 wallet (MetaMask, Coinbase Wallet, etc.)
- Base Network configured in your wallet

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/unlocked-freelance.git
cd unlocked-freelance
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:
```
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_onchainkit_api_key
NEXT_PUBLIC_CHAIN_ID=testnet  # or mainnet
NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET=your_testnet_contract_address
NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET=your_mainnet_contract_address
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=Unlocked Freelance
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## How It Works

### For Clients

1. **Connect Wallet**: Connect your Web3 wallet to the platform
2. **Post a Job**: Create a job with a title, description, deadline, and ETH reward
3. **Review Applications**: View and accept applications from freelancers
4. **Review Submissions**: Once work is submitted, review and approve to release payment

### For Freelancers

1. **Connect Wallet**: Connect your Web3 wallet to the platform
2. **Browse Jobs**: Explore available jobs on the marketplace
3. **Apply for Jobs**: Submit proposals for jobs you're interested in
4. **Submit Work**: When your application is accepted, complete the work and submit
5. **Get Paid**: Upon AI verification or client approval, receive payment in ETH

### AI Verification System

The platform features an innovative AI verification system that:
- Allows freelancers to submit evidence of completed work
- Automatically verifies work against the job requirements
- Releases partial payment immediately upon successful verification
- Provides verification status and feedback to both parties

## Smart Contract Functionality

The platform interacts with a smart contract deployed on the Base Network that handles:
- Job creation and management
- Application processing
- Work submission and verification
- Payment escrow and release
- Platform fee management

## Admin Features

Platform administrators can:
- Adjust platform fees
- Set AI verification parameters
- Review and verify work submissions
- Monitor platform statistics
- Manage the verification process

## Project Structure

- `/app`: Next.js app router files
- `/components`: React components
- `/components/ui`: UI components (shadcn/ui)
- `/hooks`: Custom React hooks
- `/lib`: Utility functions and services
- `/public`: Static assets

## Deployment

The application can be deployed to any platform that supports Next.js applications:

```bash
# Build the application
npm run build
# or
yarn build

# Start the production server
npm start
# or
yarn start
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Base Network for blockchain infrastructure
- OnchainKit for simplifying Web3 integration
- The Next.js team for the awesome framework
- shadcn/ui for beautiful UI components

---

Built with ❤️ for the decentralized future of work.
