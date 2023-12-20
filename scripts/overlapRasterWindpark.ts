import {
  Sketch,
  SketchCollection,
  Polygon,
  Metric,
  area,
} from "@seasketch/geoprocessing";
import { isSketchCollection } from "@seasketch/geoprocessing";
import { createMetric } from "@seasketch/geoprocessing";
import { featureEach } from "@turf/meta";
import { MultiPolygon } from "@turf/helpers";
import turfArea from "@turf/area";

// @ts-ignore
import { Georaster, sum } from "geoblaze";

/**
 * Returns metrics representing sketch overlap with raster.
 * If sketch collection, then calculate overlap for all child sketches also
 */
export async function overlapRasterWindpark(
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
  const sumPromises: Promise<number>[] = [];
  const sumFeatures: Sketch[] = [];

  featureEach(sketch, async (feat) => {
    // accumulate geoblaze sum promises and features so we can create metrics later
    sumPromises.push(sum(raster, feat));
    sumFeatures.push(feat);
  });

  const bathyPixelArea = 362528.3;
  const turbineCost = 7;

  const depthAdjust = (baseCost: number, depth: number) => {
    if (25 < Math.abs(depth) && Math.abs(depth) < 30) {
      return (baseCost / 100) * 10 + baseCost;
    }
    if (30 <= Math.abs(depth) && Math.abs(depth) < 40) {
      return (baseCost / 100) * 20 + baseCost;
    }
    if (40 <= Math.abs(depth) && Math.abs(depth) < 50) {
      return (baseCost / 100) * 30 + baseCost;
    }
    if (50 <= Math.abs(depth) && Math.abs(depth) < 60) {
      return (baseCost / 100) * 40 + baseCost;
    }
    if (Math.abs(depth) >= 60) {
      return (baseCost / 100) * 50 + baseCost;
    } else {
      return baseCost;
    }
  };

  // await results and create metrics
  let sketchMetrics: Metric[] = [];
  (await Promise.all(sumPromises)).forEach((curSum, index) => {
    const sketchArea = turfArea(sketch);
    const sketchAreaSqKm = sketchArea / 1000000;
    const meanDepth = Math.abs(curSum) / (sketchArea / bathyPixelArea);
    const numberOfTurbines = sketchArea / 1200000;
    const baseCost = numberOfTurbines * turbineCost;
    const depthCost = depthAdjust(baseCost, meanDepth);
    const totalCost = depthCost + baseCost;

    sketchMetrics.push(
      createMetric({
        metricId,
        sketchId: sumFeatures[index].properties.id,
        value: curSum,
        extra: {
          sketchName: sumFeatures[index].properties.name,
        },
      })
    );
  });

  if (isSketchCollection(sketch)) {
    // Push collection with accumulated sumValue
    const collSumValue = await sum(raster, sketch);
    sketchMetrics.push(
      createMetric({
        metricId,
        sketchId: sketch.properties.id,
        value: collSumValue,
        extra: {
          sketchName: sketch.properties.name,
          isCollection: true,
          meanDepth: Math.abs(collSumValue) / turfArea(sketch) / bathyPixelArea,
        },
      })
    );
  }

  return sketchMetrics;
}
