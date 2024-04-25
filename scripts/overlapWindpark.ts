import {
  Sketch,
  SketchCollection,
  Polygon,
  Metric,
} from "@seasketch/geoprocessing";
import { isSketchCollection } from "@seasketch/geoprocessing";
import { createMetric } from "@seasketch/geoprocessing";
import { featureEach } from "@turf/meta";
import { MultiPolygon } from "@turf/helpers";
import turfArea from "@turf/area";
import { getDistanceCost } from "./getDistanceCost";

// @ts-ignore
import { Georaster, mean } from "geoblaze";

/**
 * Returns metrics representing sketch overlap with raster.
 * If sketch collection, then calculate overlap for all child sketches also
 */
export async function overlapWindpark(
  /** metricId value to assign to each measurement */
  metricId: string,
  /** Cloud-optimized geotiff to calculate overlap with, loaded via geoblaze.parse() */
  raster: Georaster,
  /** single sketch or collection to calculate metrics for. */
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>
): Promise<Metric[]> {
  // Get raster sum for each feature
  const meanPromises: Promise<number[]>[] = [];
  const sketchFeatures: Sketch<Polygon | MultiPolygon>[] = [];

  featureEach(sketch, async (feat) => {
    // accumulate geoblaze sum promises and features so we can create metrics later
    meanPromises.push(mean(raster, feat));
    sketchFeatures.push(feat);
  });

  const turbineCost = 11.9;

  const depthAdjust = (baseCost: number, depth: number) => {
    if (25 < Math.abs(depth) && Math.abs(depth) < 30) {
      return (baseCost / 100) * 10;
    }
    if (30 <= Math.abs(depth) && Math.abs(depth) < 40) {
      return (baseCost / 100) * 20;
    }
    if (40 <= Math.abs(depth) && Math.abs(depth) < 50) {
      return (baseCost / 100) * 30;
    }
    if (50 <= Math.abs(depth) && Math.abs(depth) < 60) {
      return (baseCost / 100) * 40;
    }
    if (Math.abs(depth) >= 60) {
      return (baseCost / 100) * 50;
    } else {
      return baseCost;
    }
  };

  const distanceCostPromsises = sketchFeatures.map(async (feature) => {
    return await getDistanceCost(feature);
  });

  const distanceCosts = await Promise.all(distanceCostPromsises);

  let depthCostSum = 0;

  // await results and create metrics
  let sketchMetrics: Metric[] = [];
  (await Promise.all(meanPromises)).forEach(async (curMean, index) => {
    const sketchArea = turfArea(sketchFeatures[index]);
    const meanDepth = curMean[0];
    const numberOfTurbines = sketchArea / 1890000;
    const baseCost = numberOfTurbines * turbineCost;
    const depthCost = depthAdjust(baseCost, meanDepth);
    depthCostSum += depthCost;
    const distanceCost = distanceCosts[index];
    const totalCost = depthCost + baseCost + distanceCost;

    sketchMetrics.push(
      createMetric({
        metricId,
        sketchId: sketchFeatures[index].properties.id,
        value: totalCost,
        extra: {
          sketchName: sketchFeatures[index].properties.name,
          sketchArea: sketchArea,
          meanDepth: meanDepth,
          numberOfTurbines: numberOfTurbines,
          baseCost: baseCost,
          depthCost: depthCost,
          distanceCost: distanceCost,
        },
      })
    );
  });

  if (isSketchCollection(sketch)) {
    // Push collection with accumulated sumValue
    const meanDepth = (await mean(raster, sketch))[0];
    const sketchArea = turfArea(sketch);
    const numberOfTurbines = sketchArea / 1890000;
    const baseCost = numberOfTurbines * turbineCost;
    const depthCost = depthCostSum;
    const distanceCost = distanceCosts.reduce((curValue, sum) => curValue + sum, 0);
    const totalCost = depthCost + baseCost + distanceCost;
    sketchMetrics.push(
      createMetric({
        metricId,
        sketchId: sketch.properties.id,
        value: totalCost,
        extra: {
          sketchName: sketch.properties.name,
          isCollection: true,
          sketchArea: sketchArea,
          meanDepth: meanDepth,
          numberOfTurbines: numberOfTurbines,
          baseCost: baseCost,
          depthCost: depthCost,
          distanceCost: distanceCost,
        },
      })
    );
  }

  return sketchMetrics;
}
