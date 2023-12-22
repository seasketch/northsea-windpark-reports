import React from "react";
import { SizeCard } from "./SizeCard";
import { SketchAttributesCard } from "@seasketch/geoprocessing/client-ui";
import { WindparkCard } from "./WindparkCard";

const ReportPage = () => {
  return (
    <>
      <SizeCard />
      <WindparkCard />
      <SketchAttributesCard autoHide />
    </>
  );
};

export default ReportPage;
