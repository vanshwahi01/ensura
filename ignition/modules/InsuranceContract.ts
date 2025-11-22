import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const InsuranceContractModule = buildModule("InsuranceContract", (m) => {
  // Deploy the InsuranceContract with no constructor parameters
  const insurance = m.contract("InsuranceContract");

  return { insurance };
});

export default InsuranceContractModule;

