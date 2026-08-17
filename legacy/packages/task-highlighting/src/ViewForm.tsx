import {
  FormLabel,
  HookFormController,
  FormHelperText,
  TextEditor,
  Box,
  CodeEditor,
  Checkbox,
  Input,
} from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import { Fragment } from "react";
import { colors } from "./colors";
import translations from "./locales.vocab";
import { TaskBit } from "./types";

export const ViewForm: TaskBit["ViewForm"] = ({ name }) => {
  const { t } = useTranslations(translations);

  return (
    <Fragment>
      <HookFormController
        name={`${name}.view.instruction`}
        label={t("instruction")}
        defaultValue=""
        render={({ value, onChange }) => (
          <Fragment>
            <TextEditor variant="outlined" value={value} onChange={onChange} />
            <FormHelperText>{t("instruction-shortcodes")}</FormHelperText>
          </Fragment>
        )}
      />
      <HookFormController
        name={`${name}.view.text`}
        label={t("text")}
        defaultValue=""
        render={({ value, onChange }) => (
          <CodeEditor variant="outlined" value={value} onChange={onChange} />
        )}
      />
      <FormLabel htmlFor="">{t("enabled-highlight-colors")}</FormLabel>
      <FormHelperText>
        {t("instruction-enabled-highlight-colors")}
      </FormHelperText>
      {Object.keys(colors).map((c) => {
        return (
          <Box display="flex" alignItems="center" mt="standard" key={c}>
            <Box
              marginRight="small"
              title={t(c as any)}
              display="inline-block"
              width="15px"
              height="15px"
              style={{
                backgroundColor: colors[c].bg,
              }}
            />
            <HookFormController
              name={`${name}.view.colors.${c}.enabled`}
              render={({ onChange, value, onBlur }) => (
                <Checkbox checked={value} onChange={onChange} onBlur={onBlur} />
              )}
            />
            <HookFormController
              name={`${name}.view.colors.${c}.label`}
              defaultValue={t(c as any)}
              render={Input}
            />
          </Box>
        );
      })}
    </Fragment>
  );
};
