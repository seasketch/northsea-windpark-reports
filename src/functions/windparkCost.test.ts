/**
 * @jest-environment node
 * @group smoke
 */
import { windparkCost } from "./windparkCost";
import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof windparkCost).toBe("function");
  });
  test("windparkCostSmoke - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await windparkCost(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "windparkCost", example.properties.name);
    }
  }, 120000);
});
