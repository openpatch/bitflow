import {
  AutoGrid,
  Box,
  ButtonPrimary,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CodeEditor,
} from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { useState } from "react";
import { NavLayout } from "../components/NavLayout";
import translations from "../locales.vocab";
import {
  convertFromJsonToString,
  convertFromStringToJson,
} from "../utils/convertFlow";

export default function Converter() {
  const { t } = useTranslations(translations);
  const [string, setString] = useState("");
  const [json, setJson] = useState("");

  const handleConvertStringToJson = () => {
    const flowData = convertFromStringToJson(string);
    setJson(JSON.stringify(flowData, null, 2));
  };
  const handleConvertJsonToString = () => {
    const flowData = JSON.parse(json);
    const flowString = convertFromJsonToString(flowData);
    setString(flowString);
  };
  return (
    <NavLayout active="converter">
      <Box padding="large">
        <AutoGrid columns={[1, 2]} gap="standard">
          <Card>
            <CardHeader>{t("flow-string")}</CardHeader>
            <CardContent>
              <CodeEditor
                variant="input"
                config={{
                  lineWrapping: true,
                }}
                height="400px"
                value={string}
                onChange={(_, v) => setString(v)}
              />
            </CardContent>
            <CardFooter>
              <ButtonPrimary onClick={handleConvertStringToJson}>
                {t("convert-flow-string-to-json")}
              </ButtonPrimary>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>{t("flow-json")}</CardHeader>
            <CardContent>
              <CodeEditor
                variant="input"
                language="javascript"
                height="400px"
                value={json}
                onChange={(_, v) => setJson(v)}
              />
            </CardContent>
            <CardFooter>
              <ButtonPrimary onClick={handleConvertJsonToString}>
                {t("convert-flow-json-to-string")}
              </ButtonPrimary>
            </CardFooter>
          </Card>
        </AutoGrid>
      </Box>
    </NavLayout>
  );
}
