import { seedEmissionFactors } from "./emissionFactors.seed";
import { seedReportTemplates } from "./reportTemplates.seed";
import { seedUsers } from "./users.seed";
async function main() {
  console.log(":rocket: Starting full seed process...");
  try {
    // Run individual seeders in the required order
    await seedUsers();
    await seedReportTemplates();
    await seedEmissionFactors();
    console.log(":white_check_mark: All seeders have completed successfully.");
  } catch (err) {
    console.error(":x: Error during seeding:", err);
    process.exit(1);
  } finally {
    // Exit explicitly to close any open DB connections
    process.exit(0);
  }
}
main();
