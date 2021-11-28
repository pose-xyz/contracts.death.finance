// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VerifySignature {
    
    function getMessageHash(
        address _to,
        uint32 _id
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_to, _id));
    }

    function recover(
        bytes32 messageHash, 
        uint8 v, 
        bytes32 r, 
        bytes32 s
    ) public pure returns (address) {
        return ecrecover(messageHash, v, r, s);
    }
    
    function verify(
        address _signer,
        address _to,
        uint32 _id,
        bytes memory signature
    ) public pure returns (bool) {
        bytes32 payloadHash = getMessageHash(_to, _id);
        bytes32 messageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", payloadHash));
        return recoverSigner(messageHash, signature) == _signer;
    }

    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature)
        public
        pure
        returns (address)
    {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);

        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(bytes memory sig)
        public
        pure
        returns (
            bytes32 r,
            bytes32 s,
            uint8 v
        )
    {
        require(sig.length == 65, "invalid signature length");

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }
}