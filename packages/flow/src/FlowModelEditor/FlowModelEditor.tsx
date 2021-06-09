import { uuidv4 } from "@bitflow/base";
import { Box, BoxProps, ButtonPrimary } from "@openpatch/patches";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  isEdge,
  Node,
  OnLoadParams,
  ReactFlowProps,
  ReactFlowProvider,
} from "react-flow-renderer";
import { LatentVariableNode } from "../FlowModel/LatentVariableNode";
import { ManifestTaskNode } from "../FlowModel/ManifestTaskNode";
import { Styles } from "../Styles";
import { PropertiesSidebarProps } from "./PropertiesSidebar";
import { Sidebar } from "./Sidebar";

export type FlowModelEditorProps = {
  height?: BoxProps["height"];
  onSave?: (flow: Omit<FlowModelEditorProps, "onSave">) => void;
  saving?: boolean;
  saveVariant?: "extern" | "intern";
  latentVariables: (Node & {
    type: "latent-variable";
    data: {
      title: string;
      alpha: number;
    };
  })[];
  nodes: (Node & {
    type: "manifest-task";
    data: {
      title: string;
      description: string;
      subtype: string;
    };
  })[];
  edges: Edge<{
    factorLoading: number;
  }>[];
};

export type FlowModelEditorRef = {
  save: () => void;
};

export const FlowModelEditor = forwardRef<
  FlowModelEditorRef,
  FlowModelEditorProps
>(
  (
    {
      onSave,
      nodes = [],
      height = "100%",
      edges: defaultEdges = [],
      latentVariables: defaultLatentVariables = [],
      saving = false,
      saveVariant = "intern",
    },
    ref
  ) => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [reactFlowInstance, setReactFlowInstance] =
      useState<OnLoadParams<any>>();
    const [latentVariables, setLatentVariables] = useState(
      defaultLatentVariables
    );
    const [selectedNode, setSelectedNode] =
      useState<FlowModelEditorProps["latentVariables"][0]>();
    const [edges, setEdges] = useState(defaultEdges);

    const handleSave = () => {
      if (onSave) {
        const model = reactFlowInstance?.toObject();
        if (model) {
          onSave({
            latentVariables: model.elements.filter(
              (e) => e.type === "latent-variable"
            ) as any,
            nodes: model.elements.filter(
              (e) => e.type === "manifest-task"
            ) as any,
            edges: model.elements.filter(isEdge),
          });
        }
      }
    };

    const handleShortcut = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === "KeyS") {
        e.preventDefault();
        handleSave();
      }
    };

    useImperativeHandle(ref, () => ({
      save: handleSave,
    }));

    useEffect(() => {
      window.addEventListener("keydown", handleShortcut);

      return () => {
        window.removeEventListener("keydown", handleShortcut);
      };
    });

    const onLoad: ReactFlowProps["onLoad"] = (reactFlowInstance) => {
      setReactFlowInstance(reactFlowInstance);
    };
    const onConnect: ReactFlowProps["onConnect"] = (params) => {
      const newEdges = [
        ...edges,
        { ...params, id: uuidv4(), data: { factorLoading: 0 } },
      ];
      setEdges(newEdges as any);
    };
    const onElementsRemove: ReactFlowProps["onElementsRemove"] = (
      elementsToRemove
    ) => {
      const newEdges = edges.filter(
        (e) => !elementsToRemove.map((r) => r.id).includes(e.id)
      );
      setEdges(newEdges);
      const newLatentVariables = latentVariables.filter(
        (v) => !elementsToRemove.map((r) => r.id).includes(v.id)
      );
      setLatentVariables(newLatentVariables);
    };
    const onDragOver: ReactFlowProps["onDragOver"] = (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    };
    const onDrop: ReactFlowProps["onDrop"] = (event) => {
      if (reactFlowWrapper.current && reactFlowInstance) {
        event.preventDefault();

        const reactFlowBounds =
          reactFlowWrapper.current.getBoundingClientRect();
        const data = JSON.parse(
          event.dataTransfer.getData("application/bits-model-node")
        );

        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        if (data.type === "latent-variable") {
          const newLV = {
            ...data,
            id: uuidv4(),
            position,
          };

          setLatentVariables([...latentVariables, newLV]);
        }
      }
    };
    const onSelectionChange: ReactFlowProps["onSelectionChange"] = (
      elements
    ) => {
      const first = elements?.[0];
      if (first && first.type === "latent-variable") {
        setSelectedNode(first as any);
      } else {
        setSelectedNode(undefined);
      }
    };
    const setNode: PropertiesSidebarProps["setNode"] = (id, node) => {
      setLatentVariables((lvs) =>
        lvs.map((lv) => {
          if (lv.id === id) {
            lv.data = {
              ...lv.data,
              ...node?.data,
            };
          }

          return lv;
        })
      );
    };

    return (
      <Box position="relative" width="100%" height="100%" overflow="hidden">
        <ReactFlowProvider>
          <Styles />
          <Box height={height} ref={reactFlowWrapper}>
            {saveVariant === "intern" && onSave && (
              <Box
                position="absolute"
                width="100px"
                top="0"
                left="0"
                zIndex="50"
                padding="standard"
              >
                <ButtonPrimary loading={saving} onClick={handleSave}>
                  Save
                </ButtonPrimary>
              </Box>
            )}
            <ReactFlow
              onLoad={onLoad}
              onConnect={onConnect}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onElementsRemove={onElementsRemove}
              onSelectionChange={onSelectionChange}
              onNodeContextMenu={(e) => e.preventDefault()}
              onEdgeContextMenu={(e) => e.preventDefault()}
              onPaneContextMenu={(e) => e.preventDefault()}
              elements={[...nodes, ...latentVariables, ...edges]}
              minZoom={0.1}
              onlyRenderVisibleElements={false}
              nodeTypes={{
                "manifest-task": ManifestTaskNode,
                "latent-variable": LatentVariableNode,
              }}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={16}
                size={0.5}
              />
              <Controls />
            </ReactFlow>
          </Box>
          <Sidebar node={selectedNode} setNode={setNode} />
        </ReactFlowProvider>
      </Box>
    );
  }
);
