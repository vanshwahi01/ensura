// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title InsuranceDemoContract
 * @notice Simplified insurance contract for demo purposes
 * @dev FDC verification present in other deployed smart contract
 * 
 * This contract allows:
 * 1. Underwriters to create pre-funded offers
 * 2. Users to accept offers and bind policies
 * 3. All transactions visible on Coston2 Explorer
 */
contract InsuranceDemoContract is ReentrancyGuard {
    
    // Offer structure
    struct Offer {
        uint256 offerId;
        address provider;
        string providerName;
        string insuranceType;
        uint256 premium;         // Premium in wei
        uint256 coverageAmount;  // Coverage in wei
        uint256 validUntil;      // Expiry timestamp
        bool funded;
        bool accepted;
        address acceptedBy;
        uint256 acceptedAt;
    }

    // Policy structure (after acceptance)
    struct Policy {
        uint256 policyId;
        uint256 offerId;
        address holder;
        string insuranceType;
        uint256 premium;
        uint256 coverage;
        uint256 startTime;
        bool active;
    }

    // Storage
    Offer[] public offers;
    Policy[] public policies;
    mapping(address => uint256) public providerFunds;
    mapping(address => uint256[]) public userPolicies;
    
    // Events
    event OfferCreated(
        uint256 indexed offerId,
        address indexed provider,
        string providerName,
        string insuranceType,
        uint256 premium,
        uint256 coverage
    );
    event OfferFunded(uint256 indexed offerId, address indexed provider, uint256 amount);
    event PolicyBound(
        uint256 indexed policyId,
        uint256 indexed offerId,
        address indexed holder,
        uint256 premium,
        uint256 coverage
    );

    /**
     * @notice Create a new insurance offer
     * @param providerName Name of the provider (e.g., "Ensura Agency", "Alice")
     * @param insuranceType Type of insurance (e.g., "Health Insurance", "Auto Insurance")
     * @param premium Premium amount in wei
     * @param coverageAmount Coverage amount in wei
     * @param validityDuration How long the offer is valid (in seconds)
     */
    function createOffer(
        string memory providerName,
        string memory insuranceType,
        uint256 premium,
        uint256 coverageAmount,
        uint256 validityDuration
    ) external payable returns (uint256 offerId) {
        require(bytes(providerName).length > 0, "Provider name required");
        require(bytes(insuranceType).length > 0, "Insurance type required");
        require(premium > 0, "Premium must be > 0");
        require(coverageAmount > 0, "Coverage must be > 0");
        require(msg.value >= coverageAmount, "Must fund coverage amount");
        
        offerId = offers.length;
        
        offers.push(Offer({
            offerId: offerId,
            provider: msg.sender,
            providerName: providerName,
            insuranceType: insuranceType,
            premium: premium,
            coverageAmount: coverageAmount,
            validUntil: block.timestamp + validityDuration,
            funded: true,
            accepted: false,
            acceptedBy: address(0),
            acceptedAt: 0
        }));
        
        // Store provider funds
        providerFunds[msg.sender] += msg.value;
        
        emit OfferCreated(offerId, msg.sender, providerName, insuranceType, premium, coverageAmount);
        emit OfferFunded(offerId, msg.sender, msg.value);
    }

    /**
     * @notice Accept an offer and bind insurance policy
     * @param offerId The ID of the offer to accept
     */
    function acceptOffer(uint256 offerId) external payable nonReentrant returns (uint256 policyId) {
        require(offerId < offers.length, "Invalid offer ID");
        
        Offer storage offer = offers[offerId];
        
        require(!offer.accepted, "Offer already accepted");
        require(offer.funded, "Offer not funded");
        require(block.timestamp <= offer.validUntil, "Offer expired");
        require(msg.value >= offer.premium, "Insufficient premium");
        
        // Mark offer as accepted
        offer.accepted = true;
        offer.acceptedBy = msg.sender;
        offer.acceptedAt = block.timestamp;
        
        // Premium goes to provider
        providerFunds[offer.provider] += msg.value;
        
        // Create policy
        policyId = policies.length;
        policies.push(Policy({
            policyId: policyId,
            offerId: offerId,
            holder: msg.sender,
            insuranceType: offer.insuranceType,
            premium: offer.premium,
            coverage: offer.coverageAmount,
            startTime: block.timestamp,
            active: true
        }));
        
        // Track user's policies
        userPolicies[msg.sender].push(policyId);
        
        emit PolicyBound(policyId, offerId, msg.sender, offer.premium, offer.coverageAmount);
    }

    /**
     * @notice Get offer details
     */
    function getOffer(uint256 offerId) external view returns (
        address provider,
        string memory providerName,
        string memory insuranceType,
        uint256 premium,
        uint256 coverage,
        uint256 validUntil,
        bool funded,
        bool accepted
    ) {
        require(offerId < offers.length, "Invalid offer ID");
        Offer memory offer = offers[offerId];
        
        return (
            offer.provider,
            offer.providerName,
            offer.insuranceType,
            offer.premium,
            offer.coverageAmount,
            offer.validUntil,
            offer.funded,
            offer.accepted
        );
    }

    /**
     * @notice Get policy details
     */
    function getPolicy(uint256 policyId) external view returns (
        uint256 offerId,
        address holder,
        string memory insuranceType,
        uint256 premium,
        uint256 coverage,
        uint256 startTime,
        bool active
    ) {
        require(policyId < policies.length, "Invalid policy ID");
        Policy memory policy = policies[policyId];
        
        return (
            policy.offerId,
            policy.holder,
            policy.insuranceType,
            policy.premium,
            policy.coverage,
            policy.startTime,
            policy.active
        );
    }

    /**
     * @notice Get all policies for a user
     */
    function getUserPolicies(address user) external view returns (uint256[] memory) {
        return userPolicies[user];
    }

    /**
     * @notice Get total number of offers
     */
    function getOfferCount() external view returns (uint256) {
        return offers.length;
    }

    /**
     * @notice Get total number of policies
     */
    function getPolicyCount() external view returns (uint256) {
        return policies.length;
    }

    /**
     * @notice Get provider balance
     */
    function getProviderBalance(address provider) external view returns (uint256) {
        return providerFunds[provider];
    }

    /**
     * @notice Provider can withdraw their accumulated premiums
     */
    function withdrawProviderFunds(uint256 amount) external nonReentrant {
        require(providerFunds[msg.sender] >= amount, "Insufficient balance");
        
        providerFunds[msg.sender] -= amount;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
}

