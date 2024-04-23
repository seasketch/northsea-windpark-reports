import {
  Sketch,
  Polygon,
  Feature,
  Point,
  MultiPolygon,
  SketchCollection,
} from "@seasketch/geoprocessing";
import project from "../project";
import distance from "@turf/distance";
import centroid from "@turf/centroid";
import { fgbFetchAll } from "@seasketch/geoprocessing/dataproviders";

export async function getDistanceCost(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>
): Promise<number> {
  const url = `${project.dataBucketUrl()}cable_landing_points.fgb`;
  const landingPoints = await fgbFetchAll<Feature<Point>>(url);

  const sketchCentroid = centroid(sketch);

  const distances = landingPoints.map((point) => {
    const dist = distance(sketchCentroid, point);
    return dist;
  });

  // get min distance in km and cost in M euros
  const minDistance = Math.min(...distances) * 1000;
  const distanceCost = (minDistance * 160) / 1e6;

  return distanceCost;
}
