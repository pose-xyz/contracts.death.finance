// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import { VerifySignature } from "./VerifySignature.sol";
import { ERC721 } from "./ERC721.sol";

// TODO: Add router to this for future updates
// Add royalties to these
contract ComposeArt is ERC721, Ownable {

    using SafeMath for uint256;

    // Add delete for this when trying to create new release
    struct Release {
        uint64 packPrice;
        uint32 base;
        uint16 maxPacks;
        uint16 packsPurchased;
        uint8 maxPackPurchase;
        uint8 propsPerPack;
        bool isWhitelisted;
        address owner;
        bytes32 provenanceHash;
        ReleaseTiming releaseTiming;
    }

    // Have special saleEnd value for sales which have no intended ending.
    struct ReleaseTiming {
        bool isOngoing;
        uint256 saleStart;
        uint256 saleEnd;
        uint256 startingIndex;
        uint256 startingIndexBlock;
    }

    // NOTE: 10000000000000000 IS 0.01 ETH
    struct Config {
        address signerAddress;
        address verifySignatureAddress;
        uint64 baseRegistrationFee;
        uint32 baseCount;
        uint32 releaseCount;
        uint8 mintCut;
        uint8 royaltyCut;
        bool isWhitelisted;
    }
    Config public config;

    mapping(uint32 => address) public baseOwner;
    mapping(uint32 => Release) public releases;
    mapping(uint32 => ReleaseTiming) public releaseTimings;
    mapping(address => bool) public personaAvailable;
    // TODO: Set minimum balance needed to transact with platform
    mapping(uint32 => uint72) public releaseBalance;
    mapping(bytes32 => bool) public signatureRedeemed;
    // TODO: Differentiate between release and base signatures

    constructor(string memory _name, string memory _symbol, address _signerAddress, address _verifySignatureAddress) ERC721(_name, _symbol) {
        config = Config(_signerAddress, _verifySignatureAddress, 10000000000000000, 0, 0, 0, 0, false);
        Release storage release = releases[config.releaseCount];
        release.owner = _msgSender();
        config.releaseCount = config.releaseCount + 1;
    }

    function setCuts(uint8 _mintCut, uint8 _royaltyCut) public onlyOwner {
        config.mintCut = _mintCut;
        config.royaltyCut = _royaltyCut;
    }

    function setIsWhitelisted(bool _isWhitelisted) public onlyOwner {
        config.isWhitelisted = _isWhitelisted;
    }

    function setSigner(address _signerAddress) public onlyOwner {
        config.signerAddress = _signerAddress;
    }

    // function createBaseFromWhitelist(address _to, uint32 _id, bytes memory _signature, address _signer) payable public returns (uint32) {
    //     require(config.isWhitelisted, "Config is not whitelisted.");
    //     require(VerifySignature(config.verifySignatureAddress).verifyMinter(_signer, _to, _id, true, _signature), "Creator not on whitelist");
    //     require(msg.value >= config.baseRegistrationFee, "Not enough moneys, bb");
    //     baseOwner[config.baseCount] = _to;
    //     releaseBalance[0] = releaseBalance[0] + uint72(msg.value);
    //     config.baseCount = config.baseCount + 1;
    //     return config.baseCount;
    // }

    function createBase() payable public returns (uint32) {
        require(!config.isWhitelisted, "Config is not whitelisted.");
        require(msg.value >= config.baseRegistrationFee, "Must include registration fee.");
        baseOwner[config.baseCount] = _msgSender();
        releaseBalance[0] = releaseBalance[0] + uint72(msg.value);
        config.baseCount = config.baseCount + 1;
        return config.baseCount;
    }

    function updateBaseRegistrationFee(uint64 _baseRegistrationFee) public onlyOwner {
        config.baseRegistrationFee = _baseRegistrationFee;
    }

    // TODO: Make this whitelisted to ensure that provenance isn't tampered with 
    // (use provenancehash + releaseid to ensure uniqueness)
    // Utilize signature verification to ensure the integrity of provenance hash
    function createRelease(bool _isWhitelisted, bool _isOngoing, uint32 _base, uint8 _propsPerPack, uint8 _maxPackPurchase, uint16 _maxPacks, uint64 _packPrice, uint256 _saleStart, uint256 _saleEnd, bytes32 _provenanceHash) public returns (uint32) {
        require(baseOwner[_base] == _msgSender(), "Must be owner of base.");
        Release storage release = releases[config.releaseCount];
        release.base = _base;
        release.owner = _msgSender();
        release.provenanceHash = _provenanceHash;
        release.maxPackPurchase = _maxPackPurchase;
        release.maxPacks = _maxPacks;
        release.propsPerPack = _propsPerPack;
        release.packPrice = _packPrice;
        release.isWhitelisted = _isWhitelisted;

        ReleaseTiming storage releaseTiming = releaseTimings[config.releaseCount];
        releaseTiming.isOngoing = _isOngoing;
        releaseTiming.saleStart = _saleStart;
        releaseTiming.saleEnd = _saleEnd;

        config.releaseCount = config.releaseCount + 1;
        return config.releaseCount;
    }

    // TODO: Update this to use multisig for contract owner
    // and need their index set, that this happens before they can withdrawal
    function withdraw(uint32 _releaseId) payable public {
        Release storage release = releases[_releaseId];
        ReleaseTiming storage releaseTiming = releaseTimings[_releaseId];
        require(release.owner == _msgSender(), "Not release owner");
        require(releaseTiming.startingIndexBlock != 0, "Sale still active");
        uint balance = releaseBalance[_releaseId];
        releaseBalance[_releaseId] = 0;
        payable(_msgSender()).transfer(balance);
    }

    function setBaseURI(string memory _baseURI) public onlyOwner {
        _setBaseURI(_baseURI);
    }

    function currentTokenId() public view returns(uint256) {
        return totalSupply();
    }

    function mintPack(address _to, uint32 _releaseId, bytes memory _signature, address _signer, uint16 _numberOfPacks) public payable {
        Release storage release = releases[_releaseId];
        ReleaseTiming storage releaseTiming = releaseTimings[_releaseId];
        require(block.timestamp >= releaseTiming.saleStart, "Sale not started");
        require(block.timestamp <= releaseTiming.saleEnd, "Sale ended");
        require(releaseTiming.startingIndexBlock == 0, "Sale not active");
        
        if (release.isWhitelisted) {
            require(VerifySignature(config.verifySignatureAddress).verifyMinter(_signer, _to, _releaseId, false, _signature), "Purchaser not on whitelist");
        }
        require(_numberOfPacks <= release.maxPackPurchase, "Max pack purchase exceeded");
        require((release.packsPurchased + _numberOfPacks) <= release.maxPacks, "Not enough packs remaining");
        require((release.packPrice * _numberOfPacks) <= msg.value, "Not enough ETH sent");
        
        for(uint i = 0; i < _numberOfPacks; i++) {
            for(uint j = 0; j < release.propsPerPack; j++) {
                uint mintIndex = totalSupply();
                _safeMint(_to, mintIndex);
            }
        }
        
        release.packsPurchased = release.packsPurchased + _numberOfPacks;
        // TODO: Figure out how to transfer moneys to the project owner (80% to artist, 20% to us)
        // TODO: Figure out royalties (1% to us, 2% to artist)

        uint256 platformFee = msg.value / config.mintCut;
        releaseBalance[0] = releaseBalance[0] + uint72(platformFee);
        releaseBalance[_releaseId] = releaseBalance[_releaseId] + uint72(msg.value - platformFee);

        // If we haven't set the starting index and this is the last saleable token
        if (releaseTiming.startingIndexBlock == 0 && (release.packsPurchased == release.maxPacks || block.timestamp >= releaseTiming.saleEnd)) {
            releaseTiming.startingIndexBlock = block.number;
        }
    }

    function setStartingIndex(uint32 _releaseId) public {
        Release storage release = releases[_releaseId];
        ReleaseTiming storage releaseTiming = releaseTimings[_releaseId];
        require(releaseTiming.startingIndex == 0, "Starting index already set");
        if (release.packsPurchased == release.maxPacks || block.timestamp >= releaseTiming.saleEnd) {
            releaseTiming.startingIndexBlock = block.number;
        } 
        require(releaseTiming.startingIndexBlock != 0, "Starting index block not set");
        
        releaseTiming.startingIndex = uint(blockhash(releaseTiming.startingIndexBlock)) % release.maxPacks;
        // Just a sanity case in the worst case if this function is called late (EVM only stores last 256 block hashes)
        if (block.number.sub(releaseTiming.startingIndexBlock) > 255) {
            releaseTiming.startingIndex = uint(blockhash(block.number - 1)) % release.maxPacks;
        }
        // Prevent default sequence
        if (releaseTiming.startingIndex == 0) {
            releaseTiming.startingIndex = 1;
        }
    }

    function composePersona(uint32 releaseId, string memory message, bytes memory signature, uint numberOfPacks) public payable {
        // TODO: Figure out how to use parse address from message in verification and then use that to set persona to claimed
        // Need to transfer all token ids in message to this contract (staking)
        // Need to mint new persona NFT
    }

    function deComposePersona(uint32 releaseId, string memory message, bytes memory signature, uint numberOfPacks) public payable {
        // TODO: The exact opposite of compose
    }
}
