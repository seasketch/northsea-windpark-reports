import React from "react";
import {
  ClassTable,
  Collapse,
  KeySection,
  Pill,
  ResultsCard,
  SketchClassTable,
  Table,
  VerticalSpacer,
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
import { WindparkTable } from "./WindparkTable";

const Number = new Intl.NumberFormat("en", { style: "decimal" });

export const WindparkCard: React.FunctionComponent<GeogProp> = (props) => {
  const [{ isCollection }] = useSketchProperties();
  const { t } = useTranslation();

  const curGeography = project.getGeographyById(props.geographyId, {
    fallbackGroup: "default-boundary",
  });

  const metricGroup = project.getMetricGroup("windparkCost", t);

  const mapLabel = t("Map");
  const withinLabel = t("Within Plan");
  const percValueLabel = t("% Within Plan");
  const km2Label = t("km²");

  return (
    <>
      <ResultsCard title={t("Windpark Cost")} functionName="windparkCost">
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

          // get the last metric in the array, which is the collection
          const collectionIndex = data.metrics.length - 1;
          const collectionMetrics = data.metrics[collectionIndex];

          const meanDepth =
            typeof collectionMetrics.extra?.meanDepth === "number"
              ? Math.abs(collectionMetrics.extra?.meanDepth).toFixed(0) + "m"
              : null;

          const sketchArea =
            typeof collectionMetrics.extra?.sketchArea === "number"
              ? (collectionMetrics.extra?.sketchArea / 1e6).toFixed(0) + " km²"
              : null;

          const sketchName = data.sketch.properties.name;

          const numberOfTurbines =
            typeof collectionMetrics.extra?.numberOfTurbines === "number"
              ? collectionMetrics.extra?.numberOfTurbines.toFixed(0)
              : null;

          const production =
            typeof collectionMetrics.extra?.sketchArea === "number"
              ? ((collectionMetrics.extra?.sketchArea * 3) / 1e6).toFixed(0) +
                " MW"
              : null;

          const baseCost =
            typeof collectionMetrics.extra?.baseCost === "number"
              ? collectionMetrics.extra?.baseCost.toFixed(0)
              : null;

          const depthCost =
            typeof collectionMetrics.extra?.depthCost === "number"
              ? collectionMetrics.extra?.depthCost.toFixed(0)
              : null;

          const totalCost = collectionMetrics.value.toFixed(0);

          return (
            <>
              <p>
                <Trans i18nKey="Windpark Overview">
                  This report summarizes the costs and spatial attrubutes of the
                  proposed windpark.
                </Trans>
              </p>
              <KeySection>
                <b>Total Cost:</b> €{totalCost} M
              </KeySection>
              <p>
                <br />
                <Pill color={"#E2E2E2"}>
                  <b>Overview</b>
                </Pill>
              </p>
              <p>
                <b>Name</b>: {sketchName}
              </p>
              <p>
                <b>Area</b>: {sketchArea}
              </p>
              <p>
                <b>Number of Turbines</b>: {numberOfTurbines}
              </p>
              <p>
                <b>Average Depth</b>: {meanDepth}
              </p>
              <p>
                <b>Production</b>: {production}
              </p>
              <p>
                <VerticalSpacer height="1rem" />
                <Pill color={"#E2E2E2"}>
                  <b>Costs</b>
                </Pill>
              </p>
              <p>
                <b>Base Cost</b>: €{baseCost} M
              </p>
              <p>
                <b>Depth Cost</b>: €{depthCost} M
              </p>

              <VerticalSpacer height="0.2rem" />
              {isCollection && (
                <Collapse title={t("Show by Zone")}>
                  <VerticalSpacer height="1rem" />
                  <WindparkTable data={data}></WindparkTable>
                </Collapse>
              )}
              <Collapse title={t("Learn more")}>
                <Trans i18nKey="Windpark - learn more">
                  <p>
                    ℹ️ This report is part of an Educational Project of Van Hall
                    Larenstein University.
                  </p>
                  <p>
                    🧮 Calculations and assumptions:
                    <VerticalSpacer height="0.5rem" />
                    <li>
                      <b>Base Cost</b>: €7 M per turbine
                    </li>
                    <li>
                      <b>Production</b>: 3 MW per km²
                    </li>
                    <li>
                      <b>Depth Cost</b>:
                      <ul>
                        <li>25-29m: Base Cost ÷ 10</li>
                        <li>30-39m: Base Cost ÷ 5</li>
                        <li>40-49m: Base Cost ÷ 3⅓</li>
                        <li>50-59m: Base Cost ÷ 2.5</li>
                        <li>{">="}60m: base cost ÷ 2</li>
                      </ul>
                    </li>
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
