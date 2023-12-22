import React from "react";
import {
  ClassTable,
  Collapse,
  KeySection,
  ResultsCard,
  SketchClassTable,
  Table,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import {
  ReportResult,
  toNullSketchArray,
  flattenBySketchAllClass,
  metricsWithSketchId,
  Metric,
  MetricGroup,
  toPercentMetric,
  GeogProp,
  squareMeterToKilometer,
} from "@seasketch/geoprocessing/client-core";
import project from "../../project";
import { Trans, useTranslation } from "react-i18next";

const Number = new Intl.NumberFormat("en", { style: "decimal" });

export const WindparkCard: React.FunctionComponent<GeogProp> = (props) => {
  const [{ isCollection }] = useSketchProperties();
  const { t } = useTranslation();

  const curGeography = project.getGeographyById(props.geographyId, {
    fallbackGroup: "default-boundary",
  });

  const metricGroup = project.getMetricGroup("windparkCost", t);
  // const precalcMetrics = project.getPrecalcMetrics(
  //   metricGroup,
  //   "sum",
  //   curGeography.geographyId
  // );

  const mapLabel = t("Map");
  const withinLabel = t("Within Plan");
  const percValueLabel = t("% Within Plan");
  const km2Label = t("km²");

  return (
    <>
      <ResultsCard title={t("Habitat")} functionName="windparkCost">
        {(data: ReportResult) => {
          // Single sketch or collection top-level
          const percMetricIdName = `${metricGroup.metricId}Perc`;
          const parentMetrics = metricsWithSketchId(
            [
              ...data.metrics.filter(
                (m) => m.metricId === metricGroup.metricId
              ),
            ],
            [data.sketch.properties.id]
          );

          const metricIndex = data.metrics.length - 1;
          const collectionMetrics = data.metrics[data.metrics.length - 1];

          const meanDepth =
            typeof collectionMetrics.extra?.meanDepth === "number"
              ? collectionMetrics.extra?.meanDepth.toFixed(0) + "m"
              : null;

          const sketchArea =
            typeof collectionMetrics.extra?.sketchArea === "number"
              ? (collectionMetrics.extra?.sketchArea / 1e6).toFixed(0) + "km²"
              : null;

          return (
            <>
              <p>
                <Trans i18nKey="Habitat Card 1">
                  This report summarizes the proportion of nearshore habitats
                  within this plan. Plans should consider protection of high
                  value habitats.
                </Trans>
              </p>
              <KeySection>
                <b>Total Cost:</b> {data.metrics[metricIndex].value.toFixed(0)}
              </KeySection>
              <KeySection>
                <b>Mean Depth:</b> {meanDepth}
              </KeySection>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Area</th>
                    <th>Number of Turbines</th>
                    <th>Average Depth</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Windpark</td>
                    <td>{sketchArea}</td>
                    <td>
                      {typeof data.metrics[0].extra?.numberOfTurbines ===
                      "number"
                        ? data.metrics[0].extra?.numberOfTurbines.toFixed(0)
                        : null}
                    </td>
                    <td>{meanDepth}</td>
                  </tr>
                </tbody>
              </table>
              <ClassTable
                rows={parentMetrics}
                metricGroup={metricGroup}
                columnConfig={[
                  {
                    columnLabel: " ",
                    type: "class",
                    width: 30,
                  },
                  {
                    columnLabel: withinLabel,
                    type: "metricValue",
                    metricId: metricGroup.metricId,
                    valueFormatter: (val: string | number) =>
                      Math.round(typeof val === "string" ? parseInt(val) : val),
                    width: 25,
                  },
                  {
                    columnLabel: percValueLabel,
                    type: "metricChart",
                    metricId: percMetricIdName,
                    valueFormatter: "percent",
                    chartOptions: {
                      showTitle: true,
                    },
                    width: 35,
                  },
                  {
                    columnLabel: mapLabel,
                    type: "layerToggle",
                    width: 10,
                  },
                ]}
              />
              {/* {isCollection && (
                <Collapse title={t("Show by MPA")}>
                  {genSketchTable(data, precalcMetrics, metricGroup)}
                </Collapse>
              )} */}

              <Collapse title={t("Learn more")}>
                <Trans i18nKey="Habitat Card - learn more">
                  <p>🎯 Planning Objective: No specific planning objective.</p>
                  <p>
                    🗺️ Source data: Merged 2015 Baldwin and 1998 Folkestone
                    Study, Baldwin - for PSSEP From BSTP. From CZMU.
                  </p>
                  <p>
                    📈 Report: Percentages are calculated by summing area within
                    MPAs in this plan, and dividing it by the total area within
                    the planning area. If the plan includes multiple areas that
                    overlap, the overlap is only counted once.
                  </p>
                </Trans>
              </Collapse>
            </>
          );
        }}
      </ResultsCard>
    </>
  );
};

const genSketchTable = (
  data: ReportResult,
  precalcMetrics: Metric[],
  metricGroup: MetricGroup
) => {
  const childSketches = toNullSketchArray(data.sketch);
  const childSketchIds = childSketches.map((sk) => sk.properties.id);
  const childSketchMetrics = toPercentMetric(
    metricsWithSketchId(data.metrics, childSketchIds),
    precalcMetrics
  );
  const sketchRows = flattenBySketchAllClass(
    childSketchMetrics,
    metricGroup.classes,
    childSketches
  );

  return (
    <SketchClassTable rows={sketchRows} metricGroup={metricGroup} formatPerc />
  );
};
