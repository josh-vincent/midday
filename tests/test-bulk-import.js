const testData = {
  jobs: [
    {
      contactPerson: "Luke",
      contactNumber: "0412345678",
      rego: "ABC123",
      loadNumber: 1,
      companyName: "ABC Construction",
      addressSite: "123 Main St",
      equipmentType: "Excavator",
      materialType: "Clay",
      pricePerUnit: 45,
      cubicMetreCapacity: 10,
      jobDate: "2024-01-15",
    },
    {
      contactPerson: "John",
      contactNumber: "0412345679",
      rego: "DEF456",
      companyName: "DEF Construction",
      addressSite: "456 Second St",
      equipmentType: "Truck",
      materialType: "Sand",
    },
  ],
};

// Log the test data to copy and test
console.log("Test data structure:");
console.log(JSON.stringify(testData, null, 2));

// Validate each job
testData.jobs.forEach((job, index) => {
  console.log(`\nJob ${index + 1} validation:`);
  console.log("- contactPerson:", typeof job.contactPerson, job.contactPerson);
  console.log("- contactNumber:", typeof job.contactNumber, job.contactNumber);
  console.log("- rego:", typeof job.rego, job.rego);
  console.log("- loadNumber:", typeof job.loadNumber, job.loadNumber);
  console.log("- companyName:", typeof job.companyName, job.companyName);
  console.log("- addressSite:", typeof job.addressSite, job.addressSite);
  console.log("- equipmentType:", typeof job.equipmentType, job.equipmentType);
  console.log("- materialType:", typeof job.materialType, job.materialType);
  console.log("- pricePerUnit:", typeof job.pricePerUnit, job.pricePerUnit);
  console.log(
    "- cubicMetreCapacity:",
    typeof job.cubicMetreCapacity,
    job.cubicMetreCapacity,
  );
  console.log("- jobDate:", typeof job.jobDate, job.jobDate);
});
