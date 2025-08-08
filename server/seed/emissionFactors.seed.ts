import fs from "fs";
// server/seed/emissionFactors.seed.ts
import path from "path";
import xlsx from "xlsx";
import { db } from "server/db";
import { emissionFactors } from "@shared/schema";
export async function seedEmissionFactors() {
  console.log(":seedling: Seeding emission_factors…");
  // 1. Load workbook
  const filePath = path.join(
    process.cwd(),
    "server",
    "data",
    "emission_factors.xlsx"
  );
  if (!fs.existsSync(filePath)) {
    console.error(":x: emission_factors.xlsx not found at:", filePath);
    throw new Error(`Missing file: ${filePath}`);
  }
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json<Record<string, any>>(sheet, {
    defval: "",
  });
  // 2. If already seeded, skip
  const already = await db.select().from(emissionFactors).limit(1);
  if (already.length) {
    console.log(":warning:  emission_factors already seeded, skipping.");
    return;
  }
  // 3. Insert each row
  for (const row of rows) {
    await db.insert(emissionFactors).values({
      categoryId: row["category_id"] || row["Category ID"],
      scope: row["scope"] || row["Scope"],
      level1: row["level1"] || row["Level1"],
      level2: row["level2"] || null || row["Level2"] || null,
      level3: row["level3"] || null || row["Level3"] || null,
      level4: row["level4"] || null || row["Level4"] || null,
      columnText: row["column_text"] || null || row["Column Text"] || null,
      uom: row["uom"] || row["UOM"],
      ghgUnit: row["ghg_unit"] || row["GHG Unit"],
      ghgConversionFactor: parseFloat(
        row["ghg_conversion_factor"] || row["GHG Conversion Factor"]
      ),
      year: row["year"] ? +row["year"] : undefined,
      // createdAt & updatedAt default to now()
    });
  }
  console.log(":white_check_mark: emission_factors seed inserted.");
}
