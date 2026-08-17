import {
  Evaluate,
  Flow as IFlow,
  FlowEdge,
  FlowNode,
  uuidv4,
} from "@bitflow/core";
import { Flow } from "@bitflow/flow";
import { useFlow } from "@bitflow/provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, BoxProps, ButtonPrimary } from "@openpatch/patches";
import { useTranslations } from "@vocab/react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Connection,
  Edge,
  Elements,
  isEdge,
  isNode,
  OnLoadParams,
  ReactFlowProps,
} from "react-flow-renderer";
import {
  FormProvider,
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
} from "react-hook-form";
import translations from "./locales.vocab";
import { Sidebar } from "./Sidebar";

export type FlowEditorProps = Partial<IFlow> & {
  height?: BoxProps["height"];
  onSubmit?: SubmitHandler<IFlow>;
  onError?: SubmitErrorHandler<IFlow>;
  onEvaluate?: Evaluate;
  allowDraft?: boolean;
  saving?: boolean;
  submitVariant?: "extern" | "intern";
};

export type FlowEditorRef = {
  submit: () => void;
  getValues: () => IFlow;
};

const startUUID = uuidv4();
const endUUID = uuidv4();

export const FlowEditor = forwardRef<FlowEditorRef, FlowEditorProps>(
  (
    {
      name,
      nodes: defaultNodes = [
        {
          id: startUUID,
          type: "start",
          position: { x: 100, y: 200 },
          data: {
            name: "Start",
            description: "",
            subtype: "simple",
            view: {
              markdown: "",
              title: "Start",
            },
          },
        },
        {
          id: endUUID,
          type: "end",
          position: { x: 400, y: 200 },
          data: {
            name: "End",
            description: "",
            subtype: "tries",
            view: {
              markdown: "",
            },
          },
        },
      ],
      edges: defaultEdges = [
        {
          id: uuidv4(),
          source: startUUID,
          target: endUUID,
        },
      ],
      description = "",
      draft = false,
      language = "en",
      zoom = 1,
      position = [0, 0],
      height = "100%",
      visibility = "private",
      onSubmit,
      onError,
      onEvaluate,
      allowDraft = false,
      saving = false,
      submitVariant = "intern",
    },
    ref
  ) => {
    const { t } = useTranslations(translations);
    const { FlowSchema, FlowNodeSchema } = useFlow();
    const methods = useForm<IFlow>({
      defaultValues: {
        name: name || t("new-flow-title"),
        zoom,
        position,
        description,
        visibility,
        draft,
        language,
        edges: defaultEdges,
        nodes: defaultNodes,
      },
      resolver: zodResolver(FlowSchema),
      reValidateMode: "onSubmit",
      shouldUnregister: false,
      mode: "onSubmit",
    });
    const [nodes, _setNodes] = useState<IFlow["nodes"]>(defaultNodes);
    const [edges, _setEdges] = useState<IFlow["edges"]>(defaultEdges);

    function setNodes(nodes: FlowNode[]) {
      methods.setValue("nodes", nodes, { shouldDirty: true });
      _setNodes(nodes);
    }

    function setEdges(edges: FlowEdge[]) {
      methods.setValue("edges", edges, { shouldDirty: true });
      _setEdges(edges);
    }

    const submitButtonRef = useRef<HTMLButtonElement>(null);

    useImperativeHandle(ref, () => ({
      submit: () => submitButtonRef.current?.click(),
      getValues: () => methods.getValues(),
    }));

    const onSave = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === "KeyS") {
        e.preventDefault();
        submitButtonRef.current?.click();
      }
    };

    useEffect(() => {
      window.addEventListener("keydown", onSave);

      return () => {
        window.removeEventListener("keydown", onSave);
      };
    }, []);

    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [reactFlowInstance, setReactFlowInstance] =
      useState<OnLoadParams<IFlow>>();

    const [selectedNode, setSelectedNode] = useState<FlowNode>();

    const onElementsRemove = (elementsToRemove: Elements) => {
      const edgeIdsToRemove = elementsToRemove.filter(isEdge).map((e) => e.id);
      const nodeIdsToRemove = elementsToRemove.filter(isNode).map((n) => n.id);

      const newEdges = edges.filter((e) => !edgeIdsToRemove.includes(e.id));
      const newNodes = nodes.filter((n) => !nodeIdsToRemove.includes(n.id));

      setEdges(newEdges);
      setNodes(newNodes);
    };

    const onConnect = (params: Edge | Connection) => {
      let edge: FlowEdge;
      if (isEdge(params)) {
        edge = { ...params } as FlowEdge;
      } else {
        edge = {
          ...params,
          id: uuidv4(),
        } as FlowEdge;
      }

      if (
        !edges.some(
          (el) =>
            isEdge(el) &&
            el.source === edge.source &&
            el.target === edge.target &&
            (el.sourceHandle === edge.sourceHandle ||
              (!el.sourceHandle && !edge.sourceHandle))
        )
      ) {
        const newEdges = [...edges, edge];
        setEdges(newEdges);
      }
    };

    const onLoad: ReactFlowProps["onLoad"] = (reactFlowInstance) => {
      setReactFlowInstance(reactFlowInstance);
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
          event.dataTransfer.getData("application/bitflow-node")
        );

        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const newNode = {
          ...data,
          id: uuidv4(),
          position,
        };

        addNode(newNode);
      }
    };

    const addNode = (data: FlowNode) => {
      if (reactFlowWrapper.current && reactFlowInstance) {
        const result = FlowNodeSchema.safeParse(data);
        if (result.success) {
          const newNodes = [...nodes, data];
          setNodes(newNodes);
        }
      }
    };

    const handleSuccess: SubmitHandler<IFlow> = (flow) => {
      if (onSubmit) {
        const flow2 = reactFlowInstance?.toObject();
        flow.zoom = flow2?.zoom || flow.zoom;
        flow.position = flow2?.position || flow.position;
        onSubmit(flow);
      }
    };

    const handleError: SubmitErrorHandler<IFlow> = (error, event) => {
      if (allowDraft && onSubmit) {
        const flow = methods.getValues();
        flow.draft = true;
        handleSuccess(flow);
      } else if (onError) {
        onError(error, event);
      }
    };

    const onSelectionChange: ReactFlowProps["onSelectionChange"] = (
      elements
    ) => {
      const first = elements?.[0];
      if (first && isNode(first)) {
        setSelectedNode(first as FlowNode);
      } else {
        setSelectedNode(undefined);
      }
    };

    const onNodeDragStop: ReactFlowProps["onNodeDragStop"] = (event, node) => {
      _setNodes((nodes) => {
        const oldNode = nodes.find((n) => n.id === node.id);
        if (oldNode) {
          oldNode.position = node.position;
        }
        methods.setValue("nodes", [...nodes], { shouldDirty: true });
        return [...nodes];
      });
    };
    return (
      <Box position="relative" width="100%" height="100%" overflow="hidden">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(handleSuccess, handleError)}>
            <Box height={height} ref={reactFlowWrapper}>
              <Box
                display={submitVariant === "intern" ? "block" : "none"}
                position="absolute"
                width="100px"
                top="0"
                left="0"
                zIndex="50"
                padding="standard"
              >
                <ButtonPrimary
                  loading={saving}
                  type="submit"
                  ref={submitButtonRef}
                >
                  {t("save")}
                </ButtonPrimary>
              </Box>
              <Flow
                nodes={nodes}
                edges={edges}
                onLoad={onLoad}
                onNodeContextMenu={(e) => e.preventDefault()}
                onEdgeContextMenu={(e) => e.preventDefault()}
                onPaneContextMenu={(e) => e.preventDefault()}
                onElementsRemove={onElementsRemove}
                onSelectionChange={onSelectionChange}
                onNodeDragStop={onNodeDragStop}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                defaultZoom={zoom}
                defaultPosition={position}
              />
            </Box>
            <Sidebar
              node={selectedNode}
              onEvaluate={onEvaluate}
              nodeIndex={nodes.findIndex((n) => n.id === selectedNode?.id)}
              errors={methods.formState.errors}
            />
          </form>
        </FormProvider>
      </Box>
    );
  }
);
