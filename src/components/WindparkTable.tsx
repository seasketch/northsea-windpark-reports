import React from "react";
import { ReportResult } from "@seasketch/geoprocessing";
import { Pill } from "@seasketch/geoprocessing/client-ui";

type TableProps = {
  data: ReportResult;
};

export const WindparkTable: React.FC<TableProps> = ({ data }) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        fontSize: "14px",
      }}
    >
      <table
        style={{
          textAlign: "center",
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th style={{ padding: "10px" }}>
              <Pill color={"#E2E2E2"}>Zone</Pill>
            </th>
            <th style={{ padding: "10px" }}>
              <Pill color={"#E2E2E2"}>Area</Pill>
            </th>
            <th style={{ padding: "10px" }}>
              <Pill color={"#E2E2E2"}>Turbines</Pill>
            </th>
            <th style={{ padding: "10px" }}>
              <Pill color={"#E2E2E2"}>Depth</Pill>
            </th>
            <th style={{ padding: "10px" }}>
              <Pill color={"#E2E2E2"}>Cost</Pill>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.metrics.map((metric, index) => {
            if (index !== data.metrics.length - 1) {
              const sketchArea =
                typeof metric.extra?.sketchArea === "number"
                  ? (metric.extra?.sketchArea / 1e6).toFixed(0)
                  : null;

              const numberOfTurbines =
                typeof metric.extra?.numberOfTurbines === "number"
                  ? metric.extra?.numberOfTurbines.toFixed(0)
                  : null;

              const meanDepth =
                typeof metric.extra?.meanDepth === "number"
                  ? Math.abs(metric.extra?.meanDepth).toFixed(0)
                  : null;

              return (
                <tr key={index}>
                  <td
                    style={{
                      borderRight: "1px solid #CCCCCC",
                      borderBottom: "1px solid #CCCCCC",
                      padding: "10px",
                    }}
                  >
                    {metric.extra?.sketchName}
                  </td>
                  <td
                    style={{
                      borderRight: "1px solid #CCCCCC",
                      borderBottom: "1px solid #CCCCCC",
                      padding: "10px",
                    }}
                  >
                    {sketchArea + " km²"}
                  </td>
                  <td
                    style={{
                      borderRight: "1px solid #CCCCCC",
                      borderBottom: "1px solid #CCCCCC",
                    }}
                  >
                    {numberOfTurbines}
                  </td>
                  <td
                    style={{
                      borderRight: "1px solid #CCCCCC",
                      borderBottom: "1px solid #CCCCCC",
                    }}
                  >
                    {meanDepth + "m"}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #CCCCCC",
                      padding: "10px",
                    }}
                  >
                    €{metric.value.toFixed(0)} M
                  </td>
                </tr>
              );
            }
          })}
        </tbody>
      </table>
    </div>
  );
};
