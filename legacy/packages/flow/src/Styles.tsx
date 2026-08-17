import { css, Global } from "@emotion/react";
import { Theme } from "@openpatch/patches";
export const Styles = () => {
  return (
    <Global
      styles={(theme: Theme) => css`
        .react-flow__handle-left {
          left: -10px !important;
        }
        .react-flow__node-input {
          padding: 0;
          border-radius: ${theme.radii.standard};
          width: auto;
          font-size: ${theme.fontSizes.standard};
          color: #222;
          text-align: center;
          border-width: 0px;
          border-style: solid;
        }
        .react-flow__node {
          border-radius: ${theme.radii.standard}!important;
        }
        .react-flow__node-latent-variable {
          border-radius: ${theme.radii.full}!important;
        }
        .react-flow__node.selected {
          box-shadow: ${theme.shadows.outline}!important;
        }
        .react-flow__edge-text {
          font-size: ${theme.fontSizes.large}!important;
          font-weight: ${theme.fontWeights.bold}!important;
          stroke: #fff;
          stroke-width: 1.2;
        }
        .react-flow__edge-textbg {
          fill: transparent;
        }
        .react-flow__edge-path,
        .react-flow__connection-path {
          stroke-width: 4 !important;
        }
        .react-flow__edge.selected .react-flow__edge-path {
          stroke: ${theme.colors.neutral[900]}!important;
        }
        .react-flow__handle-right {
          right: -10px !important;
        }
        .react-flow__handle {
          width: 12px !important;
          height: 12px !important;
          background-color: ${theme.colors.neutral[100]}!important;
          border: 2px solid ${theme.colors.neutral[900]}!important;
          border-radius: ${theme.radii.small}!important;
        }
        .react-flow__minimap {
          border: 2px solid ${theme.colors.neutral[400]}!important;
          border-radius: ${theme.radii.small}!important;
          box-shadow: ${theme.shadows.standard}!important;
        }
      `}
    ></Global>
  );
};
