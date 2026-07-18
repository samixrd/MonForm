// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MonForm {
    struct Form {
        address owner;
        string metadataId;   // Irys transaction ID for the form's schema JSON (name + fields)
        string ownerPubKey;  // owner's encryption public key, cached at creation time
        uint256 createdAt;
    }

    struct Submission {
        string ipfsCID;
        uint256 timestamp;
    }

    uint256 public formCount;
    mapping(uint256 => Form) public forms;
    mapping(uint256 => address[]) private submitters;
    mapping(uint256 => mapping(address => Submission)) private submissions;
    mapping(uint256 => mapping(address => bool)) private hasSubmittedMap;

    event FormCreated(uint256 indexed formId, address indexed owner, string metadataId);
    event ResponseSubmitted(uint256 indexed formId, address indexed submitter, string ipfsCID, uint256 timestamp);

    /**
     * @notice Create a new form. The metadataId is the Irys transaction ID
     *         pointing to the JSON blob that contains the form's name and
     *         field definitions. Storing the full ID (not just its hash)
     *         means any device with the formId can reconstruct the schema.
     */
    function createForm(string calldata metadataId, string calldata ownerPubKey)
        external
        returns (uint256 formId)
    {
        formId = formCount++;
        forms[formId] = Form({
            owner: msg.sender,
            metadataId: metadataId,
            ownerPubKey: ownerPubKey,
            createdAt: block.timestamp
        });
        emit FormCreated(formId, msg.sender, metadataId);
    }

    function submitResponse(uint256 formId, string calldata ipfsCID) external {
        require(forms[formId].owner != address(0), "Form does not exist");
        require(!hasSubmittedMap[formId][msg.sender], "Already submitted");

        hasSubmittedMap[formId][msg.sender] = true;
        submissions[formId][msg.sender] = Submission(ipfsCID, block.timestamp);
        submitters[formId].push(msg.sender);

        emit ResponseSubmitted(formId, msg.sender, ipfsCID, block.timestamp);
    }

    function getSubmitters(uint256 formId) external view returns (address[] memory) {
        return submitters[formId];
    }

    function hasSubmitted(uint256 formId, address submitter) external view returns (bool) {
        return hasSubmittedMap[formId][submitter];
    }

    function getSubmission(uint256 formId, address submitter)
        external
        view
        returns (string memory ipfsCID, uint256 timestamp)
    {
        Submission memory s = submissions[formId][submitter];
        return (s.ipfsCID, s.timestamp);
    }

    function getForm(uint256 formId) external view returns (Form memory) {
        return forms[formId];
    }
}
