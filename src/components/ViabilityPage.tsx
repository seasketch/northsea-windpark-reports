import React from "react";
import { SketchAttributesCard } from "@seasketch/geoprocessing/client-ui";
import { WindparkCard } from "./WindparkCard";

const ReportPage = () => {
  return (
    <>
      <WindparkCard />
      <SketchAttributesCard autoHide />
    </>
  );
};

export default ReportPage;
