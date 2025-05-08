import {
  GeoprocessingHandler,
  Metric,
  Polygon,
  ReportResult,
  Sketch,
  SketchCollection,
  DefaultExtraParams,
  toNullSketch,
  rekeyMetrics,
  sortMetrics,
  getCogFilename,
  MultiPolygon,
  getFirstFromParam,
} from "@seasketch/geoprocessing";
import { loadCog } from "@seasketch/geoprocessing/dataproviders";
import project from "../../project";
import { overlapWindpark } from "../../scripts/overlapWindpark";

const metricGroup = project.getMetricGroup("windparkCost");

export async function windparkCost(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
  extraParams: DefaultExtraParams = {}
): Promise<ReportResult> {
  const geographyId = getFirstFromParam("geographyIds", extraParams);
  const curGeography = project.getGeographyById(geographyId, {
    fallbackGroup: "default-boundary",
  });

  const finalSketch = sketch;
  const metrics: Metric[] = (
    await Promise.all(
      metricGroup.classes.map(async (curClass) => {
        if (!curClass.datasourceId)
          throw new Error(`Expected datasourceId for ${curClass}`);
        const url = `${project.dataBucketUrl()}${getCogFilename(
          project.getInternalRasterDatasourceById(curClass.datasourceId)
        )}`;
        const raster = await loadCog(url);
        let overlapResult = await overlapWindpark(
          metricGroup.metricId,
          raster,
          finalSketch
        );

        return overlapResult.map(
          (metrics): Metric => ({
            ...metrics,
            classId: curClass.classId,
            geographyId: curGeography.geographyId,
          })
        );
      })
    )
  ).reduce(
    // merge
    (metricsSoFar, curClassMetrics) => [...metricsSoFar, ...curClassMetrics],
    []
  );

  return {
    metrics: sortMetrics(rekeyMetrics(metrics)),
    sketch: toNullSketch(finalSketch, true),
  };
}

export default new GeoprocessingHandler(windparkCost, {
  title: "windparkCost",
  description: "metrics for cost of proposed windparks",
  timeout: 900, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
  memory: 10240,
});
