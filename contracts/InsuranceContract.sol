// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@flarenetwork/flare-periphery-contracts/coston2/IFdcVerification.sol";
import "@flarenetwork/flare-periphery-contracts/coston2/IWeb2Json.sol";

contract InsuranceContract is ReentrancyGuard {
    // FDC Verification contract
    IFdcVerification public immutable fdcVerification;
    
    // Data structure for a quote request
    struct QuoteRequest {
        address requester;
        uint256 timestamp;
        string metadata;      // e.g., insurance requirements / personal details reference
        bool fulfilled;
        bytes32 underwritingDataHash; // Hash of FDC-verified underwriting data
    }

    // Data structure for data transporation
    struct DataTransportObject {
    uint256 premium;
}

    // Data structure for an offer
    struct Offer {
        uint256 quoteRequestId;
        address provider;
        uint256 premium;         // premium amount the requester must pay
        uint256 coverageAmount;  // amount covered in case of claim
        uint256 validUntil;      // offer expiry timestamp
        bool accepted;
        bool premiumPaid;
        bool coverageFunded;
        bool payoutClaimed;
        bytes32 riskAssessmentHash; // Hash of FDC-verified AI risk assessment
    }

    // Claim evidence structure
    struct ClaimEvidence {
        uint256 offerId;
        bytes32 evidenceHash;
        uint256 verifiedAt;
        bool verified;
    }

    // Storage
    QuoteRequest[] public quoteRequests;
    Offer[] public offers;
    mapping(uint256 => ClaimEvidence) public claimEvidences;

    // Mapping provider => available funds (to fund coverage)
    mapping(address => uint256) public providerFunds;
    
    /**
     * @notice Constructor
     * @param _fdcVerification Address of the FDC Verification contract
     */
    constructor(address _fdcVerification) {
        require(_fdcVerification != address(0), "Invalid FDC verification address");
        fdcVerification = IFdcVerification(_fdcVerification);
    }

    // Events
    event QuoteRequested(uint256 indexed quoteRequestId, address indexed requester);
    event UnderwritingDataVerified(uint256 indexed quoteRequestId, bytes32 dataHash);
    event OfferMade(
        uint256 indexed offerId,
        uint256 indexed quoteRequestId,
        address indexed provider,
        uint256 premium,
        uint256 coverageAmount,
        uint256 validUntil
    );
    event RiskAssessmentVerified(uint256 indexed offerId, bytes32 assessmentHash);
    event PremiumPaid(uint256 indexed offerId, address indexed requester, uint256 amount);
    event CoverageFunded(uint256 indexed offerId, address indexed provider, uint256 amount);
    event OfferAccepted(uint256 indexed offerId, uint256 indexed quoteRequestId, address indexed requester);
    event ClaimEvidenceVerified(uint256 indexed offerId, bytes32 evidenceHash);
    event PayoutMade(uint256 indexed offerId, address indexed requester, uint256 payoutAmount);
    event ProviderRefunded(uint256 indexed offerId, address indexed provider, uint256 amount);

    /**
     * @notice Request a quote with FDC-verified underwriting data
     * @param metadata Off-chain reference to user data
     * @param proof FDC proof containing underwriting data (Web2Json attestation)
     * @return quoteRequestId The ID of the created quote request
     */
    function getQuote(
        string memory metadata,
        IWeb2Json.Proof calldata proof
    ) external returns (uint256 quoteRequestId) {
        // Verify underwriting data using FDC
        require(
            _verifyWeb2JsonProof(proof),
            "FDC: Underwriting data verification failed"
        );
        
        // Extract and hash the response data
        bytes32 dataHash = keccak256(abi.encode(proof.data.responseBody));
        
        quoteRequestId = quoteRequests.length;
        quoteRequests.push(QuoteRequest({
            requester: msg.sender,
            timestamp: block.timestamp,
            metadata: metadata,
            fulfilled: false,
            underwritingDataHash: dataHash
        }));
        
        emit QuoteRequested(quoteRequestId, msg.sender);
        emit UnderwritingDataVerified(quoteRequestId, dataHash);
    }

    /**
     * @notice Provider makes an offer with FDC-verified AI risk assessment
     * @param quoteRequestId The quote request ID
     * @param premium Premium amount in wei
     * @param coverageAmount Coverage amount in wei
     * @param validUntil Offer expiry timestamp
     * @param proof FDC proof containing AI risk assessment (Web2Json attestation)
     * @return offerId The ID of the created offer
     */
    function offer(
        uint256 quoteRequestId,
        uint256 premium,
        uint256 coverageAmount,
        uint256 validUntil,
        IWeb2Json.Proof calldata proof
    ) external returns (uint256 offerId) {
        require(quoteRequestId < quoteRequests.length, "Invalid quoteRequestId");
        QuoteRequest storage qr = quoteRequests[quoteRequestId];
        require(!qr.fulfilled, "Quote already fulfilled");

        // Verify AI risk assessment using FDC
        require(
            _verifyWeb2JsonProof(proof),
            "FDC: Risk assessment verification failed"
        );

        // TODO: Get premium out of response body
        // Extract and hash the risk assessment data
        DataTransportObject memory dto = abi.decode(data.data.responseBody.abiEncodedData, (DataTransportObject));
        // bytes32 assessmentHash = keccak256(abi.encode(proof.data.responseBody));

        offerId = offers.length;
        offers.push(Offer({
            quoteRequestId: quoteRequestId,
            provider: msg.sender,
            premium: dto.premium,
            coverageAmount: coverageAmount,
            validUntil: validUntil,
            accepted: false,
            premiumPaid: false,
            coverageFunded: false,
            payoutClaimed: false,
        }));
        
        emit OfferMade(offerId, quoteRequestId, msg.sender, premium, coverageAmount, validUntil);
    }

    // Function: provider deposits funds to fund coverage
    function fundCoverage(uint256 offerId) external payable nonReentrant {
        require(offerId < offers.length, "Invalid offerId");
        Offer storage off = offers[offerId];
        require(msg.sender == off.provider, "Only provider may fund coverage");
        require(!off.coverageFunded, "Coverage already funded");
        require(msg.value >= off.coverageAmount, "Insufficient funding for coverage");

        off.coverageFunded = true;
        providerFunds[msg.sender] += msg.value;
        emit CoverageFunded(offerId, msg.sender, msg.value);
    }

    // Function: requester pays premium and accepts offer
    function accept(uint256 offerId) external payable nonReentrant {
        require(offerId < offers.length, "Invalid offerId");
        Offer storage off = offers[offerId];
        QuoteRequest storage qr = quoteRequests[off.quoteRequestId];

        require(msg.sender == qr.requester, "Only requester may accept");
        require(!off.accepted, "Offer already accepted");
        require(block.timestamp <= off.validUntil, "Offer expired");
        require(msg.value >= off.premium, "Insufficient premium payment");
        require(off.coverageFunded, "Coverage not yet funded by provider");

        off.premiumPaid = true;
        off.accepted = true;
        qr.fulfilled = true;

        // Premium funds go to provider
        providerFunds[off.provider] += msg.value;

        emit PremiumPaid(offerId, msg.sender, msg.value);
        emit OfferAccepted(offerId, off.quoteRequestId, msg.sender);
    }

    /**
     * @notice Claim payout with FDC-verified claim evidence
     * @param offerId The offer ID
     * @param proof FDC proof containing claim evidence (Web2Json attestation)
     */
    function claimPayout(
        uint256 offerId,
        IWeb2Json.Proof calldata proof
    ) external nonReentrant {
        require(offerId < offers.length, "Invalid offerId");
        Offer storage off = offers[offerId];
        QuoteRequest storage qr = quoteRequests[off.quoteRequestId];

        require(off.accepted, "Offer not accepted");
        require(msg.sender == qr.requester, "Only requester may claim");
        require(!off.payoutClaimed, "Payout already claimed");

        // Verify claim evidence using FDC
        require(
            _verifyWeb2JsonProof(proof),
            "FDC: Claim evidence verification failed"
        );

        // Extract and hash the claim evidence
        bytes32 evidenceHash = keccak256(abi.encode(proof.data.responseBody));
        
        // Store claim evidence
        claimEvidences[offerId] = ClaimEvidence({
            offerId: offerId,
            evidenceHash: evidenceHash,
            verifiedAt: block.timestamp,
            verified: true
        });

        off.payoutClaimed = true;

        uint256 payout = off.coverageAmount;
        // deduct payout from providerFunds
        require(providerFunds[off.provider] >= payout, "Provider underfunded");
        providerFunds[off.provider] -= payout;

        emit ClaimEvidenceVerified(offerId, evidenceHash);

        (bool success,) = msg.sender.call{ value: payout }("");
        require(success, "Payout transfer failed");

        emit PayoutMade(offerId, msg.sender, payout);
    }

    // Function: provider refund if no claim after expiry
    function refundProvider(uint256 offerId) external nonReentrant {
        require(offerId < offers.length, "Invalid offerId");
        Offer storage off = offers[offerId];

        require(off.provider == msg.sender, "Only provider may refund");
        require(off.accepted == false, "Offer was accepted; cannot refund");
        require(block.timestamp > off.validUntil, "Offer not yet expired");
        require(off.coverageFunded, "Coverage not funded");

        off.coverageFunded = false;

        uint256 refundAmount = off.coverageAmount;
        require(providerFunds[msg.sender] >= refundAmount, "Insufficient funds to refund");
        providerFunds[msg.sender] -= refundAmount;

        (bool success,) = msg.sender.call{ value: refundAmount }("");
        require(success, "Refund transfer failed");

        emit ProviderRefunded(offerId, msg.sender, refundAmount);
    }

    // Function: view provider available funds
    function getProviderFunds(address provider) external view returns (uint256) {
        return providerFunds[provider];
    }

    /**
     * @notice Get claim evidence for an offer
     * @param offerId The offer ID
     * @return ClaimEvidence struct containing evidence details
     */
    function getClaimEvidence(uint256 offerId) external view returns (ClaimEvidence memory) {
        return claimEvidences[offerId];
    }

    /**
     * @notice Internal function to verify Web2Json FDC proofs
     * @param proof The FDC proof to verify
     * @return bool True if proof is valid
     */
    function _verifyWeb2JsonProof(IWeb2Json.Proof calldata proof) internal view returns (bool) {
        // Verify the proof against the stored Merkle root
        return fdcVerification.verifyWeb2Json(proof);
    }
}
