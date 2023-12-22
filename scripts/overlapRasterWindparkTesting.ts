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
import { Georaster, mean } from "geoblaze";
import { MetricWithExtra } from "./MetricWithExtra";

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
): Promise<MetricWithExtra[]> {
  // Get raster sum for each feature
  const meanPromises: Promise<number[]>[] = [];
  const meanFeatures: Sketch[] = [];

  featureEach(sketch, async (feat) => {
    // accumulate geoblaze sum promises and features so we can create metrics later
    meanPromises.push(mean(raster, feat));
    meanFeatures.push(feat);
  });

  const bathyPixelArea = 362528.3;
  const turbineCost = 7;

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

  // await results and create metrics
  let sketchMetrics: MetricWithExtra[] = [];
  (await Promise.all(meanPromises)).forEach((curMean, index) => {
    const sketchArea = turfArea(meanFeatures[index]);
    const meanDepth = curMean[0];
    const numberOfTurbines = sketchArea / 1200000;
    const baseCost = numberOfTurbines * turbineCost;
    const depthCost = depthAdjust(baseCost, meanDepth);
    const totalCost = depthCost + baseCost;

    sketchMetrics.push({
      metricId: metricId,
      sketchId: meanFeatures[index].properties.id,
      value: totalCost,
      classId: null,
      groupId: null,
      geographyId: null,
      extra: {
        sketchName: meanFeatures[index].properties.name,
        sketchArea: sketchArea,
        meanDepth: meanDepth,
        numberOfTurbines: numberOfTurbines,
        baseCost: baseCost,
        depthCost: depthCost,
      },
    });
  });

  if (isSketchCollection(sketch)) {
    // Push collection with accumulated sumValue
    const meanDepth = await mean(raster, sketch)[0];
    const sketchArea = turfArea(sketch);
    const numberOfTurbines = sketchArea / 1200000;
    const baseCost = numberOfTurbines * turbineCost;
    const depthCost = depthAdjust(baseCost, meanDepth);
    const totalCost = depthCost + baseCost;
    sketchMetrics.push({
      metricId: metricId,
      sketchId: sketch.properties.id,
      value: totalCost,
      classId: null,
      groupId: null,
      geographyId: null,
      extra: {
        sketchName: sketch.properties.name,
        isCollection: true,
        sketchArea: sketchArea,
        meanDepth: meanDepth,
        numberOfTurbines: numberOfTurbines,
        baseCost: baseCost,
        depthCost: depthCost,
      },
    });
  }

  return sketchMetrics;
}
