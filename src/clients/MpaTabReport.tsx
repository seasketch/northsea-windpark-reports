import React, { useState } from "react";
import { SegmentControl, ReportPage } from "@seasketch/geoprocessing/client-ui";
import ViabilityPage from "../components/ViabilityPage";
import RepresentationPage from "../components/RepresentationPage";
import { useTranslation } from "react-i18next";
import { Translator } from "../components/TranslatorAsync";

const enableAllTabs = false;

const MpaTabReport = () => {
  const { t } = useTranslation();
  const viabilityId = "viability";
  const representationId = "representation";
  const segments = [
    { id: viabilityId, label: t("Viability") },
    { id: representationId, label: t("Representation") },
  ];
  const [tab, setTab] = useState<string>(viabilityId);
  return (
    <>
      <ReportPage hidden={!enableAllTabs && tab !== viabilityId}>
        <ViabilityPage />
      </ReportPage>
    </>
  );
};

export default function () {
  // Translator must be in parent FunctionComponent in order for ReportClient to use useTranslate hook
  return (
    <Translator>
      <MpaTabReport />
    </Translator>
  );
}
