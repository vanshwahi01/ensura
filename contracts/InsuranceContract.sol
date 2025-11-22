// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract InsuranceContract is ReentrancyGuard {
    // Data structure for a quote request
    struct QuoteRequest {
        address requester;
        uint256 timestamp;
        string metadata;      // e.g., insurance requirements / personal details reference
        bool fulfilled;
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
    }

    // Storage
    QuoteRequest[] public quoteRequests;
    Offer[] public offers;

    // Mapping provider => available funds (to fund coverage)
    mapping(address => uint256) public providerFunds;

    // Events
    event QuoteRequested(uint256 indexed quoteRequestId, address indexed requester);
    event OfferMade(
        uint256 indexed offerId,
        uint256 indexed quoteRequestId,
        address indexed provider,
        uint256 premium,
        uint256 coverageAmount,
        uint256 validUntil
    );
    event PremiumPaid(uint256 indexed offerId, address indexed requester, uint256 amount);
    event CoverageFunded(uint256 indexed offerId, address indexed provider, uint256 amount);
    event OfferAccepted(uint256 indexed offerId, uint256 indexed quoteRequestId, address indexed requester);
    event PayoutMade(uint256 indexed offerId, address indexed requester, uint256 payoutAmount);
    event ProviderRefunded(uint256 indexed offerId, address indexed provider, uint256 amount);

    // Function: request a quote
    function getQuote(string memory metadata) external returns (uint256 quoteRequestId) {
        quoteRequestId = quoteRequests.length;
        quoteRequests.push(QuoteRequest({
            requester: msg.sender,
            timestamp: block.timestamp,
            metadata: metadata,
            fulfilled: false
        }));
        emit QuoteRequested(quoteRequestId, msg.sender);
    }

    // Function: provider makes an offer
    function offer(
        uint256 quoteRequestId,
        uint256 premium,
        uint256 coverageAmount,
        uint256 validUntil
    ) external returns (uint256 offerId) {
        require(quoteRequestId < quoteRequests.length, "Invalid quoteRequestId");
        QuoteRequest storage qr = quoteRequests[quoteRequestId];
        require(!qr.fulfilled, "Quote already fulfilled");

        offerId = offers.length;
        offers.push(Offer({
            quoteRequestId: quoteRequestId,
            provider: msg.sender,
            premium: premium,
            coverageAmount: coverageAmount,
            validUntil: validUntil,
            accepted: false,
            premiumPaid: false,
            coverageFunded: false,
            payoutClaimed: false
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

    // Function: claimant requests payout after event validated (via FDC)
    function claimPayout(uint256 offerId) external nonReentrant {
        require(offerId < offers.length, "Invalid offerId");
        Offer storage off = offers[offerId];
        QuoteRequest storage qr = quoteRequests[off.quoteRequestId];

        require(off.accepted, "Offer not accepted");
        require(msg.sender == qr.requester, "Only requester may claim");
        require(!off.payoutClaimed, "Payout already claimed");
        // Additional require: claim validated via FDC oracle call (to integrate)
        // e.g., require(eventOccurred(…)==true, "No valid claim event");

        off.payoutClaimed = true;

        uint256 payout = off.coverageAmount;
        // deduct payout from providerFunds
        require(providerFunds[off.provider] >= payout, "Provider underfunded");
        providerFunds[off.provider] -= payout;

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
}
