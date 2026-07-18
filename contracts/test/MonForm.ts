import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("MonForm", function () {
  let monForm: any;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;

  beforeEach(async function () {
    const MonForm = await ethers.getContractFactory("MonForm");
    const signers = await ethers.getSigners();
    owner = signers[0] as HardhatEthersSigner;
    addr1 = signers[1] as HardhatEthersSigner;
    addr2 = signers[2] as HardhatEthersSigner;
    monForm = await MonForm.deploy();
  });

  describe("Form Creation", function () {
    it("Should create a form", async function () {
      const metadataHash = ethers.encodeBytes32String("testHash");
      const pubKey = "testPubKey";

      await expect(monForm.createForm(metadataHash, pubKey))
        .to.emit(monForm, "FormCreated")
        .withArgs(0, owner.address);

      const form = await monForm.getForm(0);
      expect(form.owner).to.equal(owner.address);
      expect(form.metadataHash).to.equal(metadataHash);
      expect(form.ownerPubKey).to.equal(pubKey);
      expect(await monForm.formCount()).to.equal(1);
    });
  });

  describe("Form Submission", function () {
    beforeEach(async function () {
      const metadataHash = ethers.encodeBytes32String("testHash");
      await monForm.createForm(metadataHash, "pubKey");
    });

    it("Should allow submitting a response", async function () {
      const ipfsCID = "QmTest123";
      await expect(monForm.connect(addr1).submitResponse(0, ipfsCID))
        .to.emit(monForm, "ResponseSubmitted")
        .withArgs(0, addr1.address, ipfsCID, (val: any) => val > 0);

      expect(await monForm.hasSubmitted(0, addr1.address)).to.be.true;

      const submission = await monForm.getSubmission(0, addr1.address);
      expect(submission.ipfsCID).to.equal(ipfsCID);
    });

    it("Should revert if submitted twice", async function () {
      const ipfsCID = "QmTest123";
      await monForm.connect(addr1).submitResponse(0, ipfsCID);
      await expect(monForm.connect(addr1).submitResponse(0, ipfsCID))
        .to.be.revertedWith("Already submitted");
    });

    it("Should return correct submitters list", async function () {
      await monForm.connect(addr1).submitResponse(0, "CID1");
      await monForm.connect(addr2).submitResponse(0, "CID2");

      const submitters = await monForm.getSubmitters(0);
      expect(submitters).to.deep.equal([addr1.address, addr2.address]);
    });
  });
});
