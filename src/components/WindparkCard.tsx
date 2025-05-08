import React from "react";
import {
  Collapse,
  KeySection,
  Pill,
  ResultsCard,
  VerticalSpacer,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import {
  ReportResult,
  Metric,
  GeogProp,
} from "@seasketch/geoprocessing/client-core";
import { Trans, useTranslation } from "react-i18next";
import { WindparkTable } from "./WindparkTable";
import { InfoStatus } from "../util/InfoStatusCentered";

const Number = new Intl.NumberFormat("en", { style: "decimal" });

export const WindparkCard: React.FunctionComponent<GeogProp> = (props) => {
  const [{ isCollection }] = useSketchProperties();
  const { t } = useTranslation();

  return (
    <>
      <ResultsCard title={t("Windpark Cost")} functionName="windparkCost">
        {(data: ReportResult) => {
          // get the last metric in the array, which is the collection
          const collectionIndex = data.metrics.length - 1;
          const collectionMetrics: Metric = data.metrics[collectionIndex];

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

          const productionValue = collectionMetrics.extra?.sketchArea as number * 5 / 1e6
          const production = productionValue.toFixed(0) + " MW"

          const installationCostValue = productionValue * 760 / 1e6
          const installationCost = "€" + installationCostValue.toFixed(0) + " M"

          const baseCost =
            typeof collectionMetrics.extra?.baseCost === "number"
              ? collectionMetrics.extra?.baseCost.toFixed(0)
              : null;

          const depthCost =
            typeof collectionMetrics.extra?.depthCost === "number"
              ? collectionMetrics.extra?.depthCost.toFixed(0)
              : null;

          const distanceCost =
          typeof collectionMetrics.extra?.distanceCost === "number"
            ? collectionMetrics.extra?.distanceCost.toFixed(0)
            : null;

          const totalCost = (collectionMetrics.value + installationCostValue).toFixed(0);

          return (
            <>
              <InfoStatus 
                msg={
                  <p>
                    <b>This report is still under development.</b>
                  </p>
                }
              ></InfoStatus>
              <p>
                <Trans i18nKey="Windpark Overview">
                  This report summarizes the costs and spatial attributes of the
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
                <b>Production</b>: {production}
              </p>
              <p>
                <b>Average Depth</b>: {meanDepth}
              </p>
              <VerticalSpacer height="1rem" />
              <Pill color={"#E2E2E2"}>
                <b>Costs</b>
              </Pill>
              <p>
                <b>Base Cost</b>: €{baseCost} M
              </p>
              <p>
                <b>Depth Cost</b>: €{depthCost} M
              </p>
              <p>
                <b>Distance Cost</b>: €{distanceCost} M
              </p>
              <p>
                <b>Installation Cost</b>: {installationCost}
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
                  🧮 Calculations and assumptions:
                  <VerticalSpacer height="0.5rem" />
                  <li>
                    <b>Number of Turbines</b>: 1.89 per km²
                  </li>
                  <li>
                    <b>Production</b>: 5 MW per km²
                  </li>
                  <li>
                    <b>Base Cost</b>: €11.9 M per turbine
                  </li>
                  <li>
                    <b>Distance Cost</b>: €160 per m from coast to zone centroid
                  </li>
                  <li>
                    <b>Installation cost</b>: €760 per MW
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
                </Trans>
              </Collapse>
            </>
          );
        }}
      </ResultsCard>
    </>
  );
};
