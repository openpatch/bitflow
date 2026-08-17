import { FlowSynchronizeNode } from "@bitflow/core";
import { FlowNode, FlowNodeProps } from "@bitflow/flow-node";
import { css } from "@emotion/react";
import { Box, Icon, Text } from "@openpatch/patches";
import { Lock, LockOpen } from "@openpatch/patches/icons";
import { useTranslations } from "@vocab/react";
import translations from "./locales.vocab";

export const SynchronizeNode = (node: {
  id?: string;
  data?: FlowSynchronizeNode["data"] & {
    toggle?: (id: string) => void;
    count?: number;
  };
  hideHandles?: boolean;
  maxWidth?: FlowNodeProps["maxWidth"];
}) => {
  const { t } = useTranslations(translations);
  const toggle = node.data?.toggle;
  return (
    <FlowNode
      tone="purple"
      title={t("synchronize")}
      count={node.data?.count}
      description={
        <Text
          fontSize="small"
          css={css`
            color: #421987;
          `}
        >
          {t("synchronize-helper-text")}
          <Box textAlign="center">
            <Box
              display="inline"
              onClick={(e) => {
                e.preventDefault();
                if (node?.id) {
                  toggle?.(node.id);
                }
              }}
              title={t("synchronize-lock-toggle")}
              cursor={toggle ? "pointer" : undefined}
              css={
                toggle &&
                css`
                  :hover {
                    opacity: 0.7;
                  }
                `
              }
            >
              <Icon color="neutral" size="large">
                {node.data?.unlocked ? <LockOpen /> : <Lock />}
              </Icon>
            </Box>
          </Box>
          <Text textAlign="center">
            {node.data?.unlocked ? t("unlocked") : t("locked")}
          </Text>
        </Text>
      }
      sourceHandles={1}
      targetHandles={1}
      hideHandles={node.hideHandles}
      maxWidth={node.maxWidth}
    />
  );
};
