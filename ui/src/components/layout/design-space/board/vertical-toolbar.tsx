import { useEffect, useRef, useState } from 'react';

import './vertical-toolbar.scss';

import { GeoShapeGeoStyle } from '@tldraw/editor';
import { DefaultStylePanel, TLComponents, TldrawUiIcon, useEditor } from 'tldraw';

import { useSystemConfig } from '@/apis/common';
import { useWorkspacePages } from '@/apis/pages';
import { getWorkflow } from '@/apis/workflow';
import { normalizeWorkflowInputParams } from '@/components/layout/design-space/board/shapes/workflow/normalizeWorkflowInputParams';
import { VinesIcon } from '@/components/ui/vines-icon';
import { getI18nContent } from '@/utils';

// 设计板工具栏自定义 SVG 图标（内联代码，不依赖本地文件/OSS）
const ToolbarSvgInput: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 1026 1024" fill="none" aria-hidden="true" focusable="false" {...props}>
    <path
      d="M384.216363 59.877205c19.260501 0 34.92837 15.667869 34.928369 34.92837v289.40649c0 19.260501-15.667869 34.92837-34.928369 34.92837h-289.406491c-19.260501 0-34.92837-15.667869-34.928369-34.92837v-289.40649c0-19.260501 15.667869-34.92837 34.928369-34.92837h289.406491m0-59.877205h-289.406491c-52.392554 0-94.805575 42.41302-94.805574 94.805575v289.40649c0 52.392554 42.41302 94.805575 94.805574 94.805575h289.406491c52.392554 0 94.805575-42.41302 94.805574-94.805575v-289.40649c0-52.392554-42.41302-94.805575-94.805574-94.805575zM386.312065 604.859565c19.260501 0 34.92837 15.667869 34.92837 34.92837v289.40649c0 19.260501-15.667869 34.92837-34.92837 34.92837H96.905575c-19.260501 0-34.92837-15.667869-34.92837-34.92837V639.787935c0-19.260501 15.667869-34.92837 34.92837-34.92837h289.40649m0-59.877205H96.905575c-52.392554 0-94.805575 42.41302-94.805575 94.805575v289.40649c0 52.392554 42.41302 94.805575 94.805575 94.805575h289.40649c52.392554 0 94.805575-42.41302 94.805575-94.805575V639.787935c0-52.392554-42.41302-94.805575-94.805575-94.805575zM929.198723 604.859565c19.260501 0 34.92837 15.667869 34.92837 34.92837v289.40649c0 19.260501-15.667869 34.92837-34.92837 34.92837H639.792233c-19.260501 0-34.92837-15.667869-34.92837-34.92837V639.787935c0-19.260501 15.667869-34.92837 34.92837-34.92837h289.40649m0-59.877205H639.792233c-52.392554 0-94.805575 42.41302-94.805575 94.805575v289.40649c0 52.392554 42.41302 94.805575 94.805575 94.805575h289.40649c52.392554 0 94.805575-42.41302 94.805575-94.805575V639.787935c0-52.392554-42.41302-94.805575-94.805575-94.805575zM876.806169 278.229412c-4.590586-8.283013-13.07319-13.372576-22.254361-13.172985l-25.846994 0.598772c0.299386-67.561446 7.085469-148.794854 125.742131-218.950979l1.397135-0.798363 1.097748-1.097749c4.790176-4.889972 6.386902-11.57626 3.892019-17.56398-2.594679-6.087516-9.081376-10.07933-16.06705-9.979534h-0.997954l-0.997953 0.199591c-58.48007 10.179125-108.976513 27.942696-150.191989 52.891531-34.628984 20.957022-62.970861 47.103401-84.127473 77.740571-33.132053 47.801969-41.315271 94.805575-43.011792 121.051749l-29.539422 0.598772c-11.077283 0.199591-20.757431 5.887925-25.747198 15.168892-4.790176 8.981581-4.191404 19.759478 1.596726 28.142287l0.299386 0.498976 100.294318 133.925349c7.28506 9.280967 18.362343 14.470325 30.537375 14.270734 7.983627-0.199591 15.468278-2.594679 21.755384-6.985674 3.293246-2.295293 6.386902-5.189358 8.981581-8.5824l101.591658-138.216548 0.19959-0.498977c5.887925-8.981581 6.486697-20.158659 1.397135-29.240035z"
      fill="currentColor"
    />
    <path
      d="M742.082458 462.252022c-11.975441 0-22.952929-5.289153-30.138193-14.470324L611.649946 313.856349l-0.299386-0.498976c-5.887925-8.582399-6.486697-19.559887-1.596725-28.641263 5.189358-9.480557 14.969301-15.268687 26.146379-15.368483l29.040445-0.598772c1.696521-24.549654 9.480557-72.551213 43.011792-120.852159 21.256408-30.736965 49.598285-56.883345 84.327064-77.840366 41.215476-24.948835 91.811714-42.712406 150.391579-52.891531l0.997954-0.199591h1.097749c7.185265-0.199591 13.871552 3.991814 16.566026 10.27892 2.494884 5.98772 0.997953 12.973394-3.991813 18.062957l-1.197544 1.197544-1.397135 0.798363c-114.864438 67.960628-125.143358 144.902836-125.442745 218.052821l25.348017-0.598772c9.181171-0.199591 17.963161 4.989767 22.653543 13.372576 5.089562 9.181171 4.590586 20.657636-1.397135 29.739012l-0.199591 0.399181-101.691453 138.216548c-2.494884 3.293246-5.588539 6.187311-9.081376 8.682195-6.386902 4.49079-14.071143 6.885879-22.05477 7.085469h-0.798363zM945.265773 17.763571h-1.397134l-0.898159 0.19959C884.49041 28.042491 833.993967 45.806062 792.878287 70.655102c-34.529188 20.857226-62.77127 47.003606-84.027678 77.640776-33.63103 48.500536-41.315271 96.502095-42.911997 120.852158v0.498977l-29.938602 0.598772c-10.877692 0.099795-20.35825 5.688334-25.348017 14.869506-4.690381 8.78199-4.091609 19.360296 1.596725 27.64331l0.299386 0.498976L712.742627 447.182926c7.185265 9.181171 18.062957 14.270734 30.138194 14.071143 7.784037-0.199591 15.168892-2.494884 21.455998-6.885879 3.492837-2.395088 6.386902-5.289153 8.881785-8.482604l101.591658-138.216548 0.199591-0.399181c5.78813-8.881785 6.287107-19.859273 1.397135-28.741059-4.590586-8.183218-12.873599-13.07319-21.755385-12.873599l-26.34597 0.598772v-0.498976c0.199591-32.633077 1.696521-70.655102 18.561934-108.776923 18.961115-42.911997 54.089075-79.137706 107.479582-110.673034l1.29734-0.798362 1.097749-1.097749c4.690381-4.790176 6.187311-11.276874 3.792223-16.965208-2.594679-5.78813-8.582399-9.680148-15.268688-9.680148z"
      fill="currentColor"
    />
  </svg>
);

const ToolbarSvgOutput: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 1026 1024" fill="none" aria-hidden="true" focusable="false" {...props}>
    <path
      d="M384.216363 59.877205c19.260501 0 34.92837 15.667869 34.928369 34.92837v289.40649c0 19.260501-15.667869 34.92837-34.928369 34.92837h-289.406491c-19.260501 0-34.92837-15.667869-34.928369-34.92837v-289.40649c0-19.260501 15.667869-34.92837 34.928369-34.92837h289.406491m0-59.877205h-289.406491c-52.392554 0-94.805575 42.41302-94.805574 94.805575v289.40649c0 52.392554 42.41302 94.805575 94.805574 94.805575h289.406491c52.392554 0 94.805575-42.41302 94.805574-94.805575v-289.40649c0-52.392554-42.41302-94.805575-94.805574-94.805575zM386.312065 604.859565c19.260501 0 34.92837 15.667869 34.92837 34.92837v289.40649c0 19.260501-15.667869 34.92837-34.92837 34.92837H96.905575c-19.260501 0-34.92837-15.667869-34.92837-34.92837V639.787935c0-19.260501 15.667869-34.92837 34.92837-34.92837h289.40649m0-59.877205H96.905575c-52.392554 0-94.805575 42.41302-94.805575 94.805575v289.40649c0 52.392554 42.41302 94.805575 94.805575 94.805575h289.40649c52.392554 0 94.805575-42.41302 94.805575-94.805575V639.787935c0-52.392554-42.41302-94.805575-94.805575-94.805575zM929.198723 604.859565c19.260501 0 34.92837 15.667869 34.92837 34.92837v289.40649c0 19.260501-15.667869 34.92837-34.92837 34.92837H639.792233c-19.260501 0-34.92837-15.667869-34.92837-34.92837V639.787935c0-19.260501 15.667869-34.92837 34.92837-34.92837h289.40649m0-59.877205H639.792233c-52.392554 0-94.805575 42.41302-94.805575 94.805575v289.40649c0 52.392554 42.41302 94.805575 94.805575 94.805575h289.40649c52.392554 0 94.805575-42.41302 94.805575-94.805575V639.787935c0-52.392554-42.41302-94.805575-94.805575-94.805575zM692.184787 200.788227c4.590586 8.283013 13.07319 13.372576 22.254361 13.172985l25.846994-0.598772c-0.299386 67.561446-7.085469 148.794854-125.742131 218.95098l-1.397134 0.798362-1.097749 1.097749c-4.790176 4.889972-6.386902 11.57626-3.892019 17.56398 2.594679 6.087516 9.081376 10.07933 16.06705 9.979535h0.997954l0.997953-0.199591c58.579866-10.179125 108.976513-27.8429 150.191989-52.791736 34.628984-20.957022 62.970861-47.103401 84.127473-77.740571 33.132053-47.801969 41.315271-94.805575 43.011793-121.051749l29.539421-0.598772c11.077283-0.199591 20.757431-5.887925 25.747198-15.168892 4.790176-8.981581 4.191404-19.759478-1.596726-28.142287l-0.299386-0.498976L856.64751 31.535328c-7.28506-9.280967-18.362343-14.470325-30.537375-14.270734-7.983627 0.199591-15.468278 2.594679-21.755384 6.985674-3.293246 2.295293-6.386902 5.189358-8.981581 8.582399L693.781513 171.149011l-0.199591 0.498977c-5.887925 8.881785-6.486697 20.058864-1.397135 29.140239z"
      fill="currentColor"
    />
    <path
      d="M623.725183 462.252022c-7.085469 0-13.472371-4.091609-16.06705-10.27892-2.494884-5.98772-0.997953-12.973394 3.991813-18.062957l1.197544-1.197544 1.397135-0.798363c114.864438-67.960628 125.143358-144.902836 125.442745-218.052821l-25.348017 0.598772c-9.181171 0.199591-17.963161-4.989767-22.653543-13.372576-5.089562-9.181171-4.590586-20.657636 1.397135-29.739011l0.199591-0.399182L794.973989 32.533281c2.494884-3.293246 5.588539-6.187311 9.081376-8.682194 6.386902-4.49079 14.071143-6.885879 22.05477-7.08547 12.274827-0.199591 23.551701 5.089562 30.936556 14.470325l100.294319 133.925348 0.299386 0.498977c5.887925 8.582399 6.486697 19.559887 1.596725 28.641263-5.189358 9.480557-14.969301 15.268687-26.146379 15.368483l-29.040445 0.598772c-1.696521 24.549654-9.480557 72.551213-43.011792 120.852158-21.256408 30.736965-49.598285 56.883345-84.327064 77.840367-41.215476 24.948835-91.811714 42.712406-150.391579 52.891531l-0.997954 0.199591h-1.097749c-0.199591 0.199591-0.299386 0.199591-0.498976 0.19959z m-10.27892-28.641263l-1.097749 1.097749c-4.690381 4.790176-6.187311 11.276874-3.792223 16.965208 2.494884 5.887925 8.78199 9.779943 15.568073 9.680148h0.997954l0.898158-0.199591c58.48007-10.07933 108.976513-27.8429 150.092193-52.69194 34.529188-20.857226 62.77127-47.003606 84.027678-77.640776 33.63103-48.500536 41.315271-96.502095 42.911997-120.852158v-0.498977l29.938602-0.598772c10.877692-0.099795 20.35825-5.688334 25.348017-14.869506 4.690381-8.78199 4.091609-19.360296-1.596725-27.64331l-0.299386-0.498976L856.248329 31.834714c-7.185265-9.181171-18.162752-14.270734-30.138194-14.071143-7.784037 0.199591-15.168892 2.494884-21.455998 6.885878-3.492837 2.395088-6.386902 5.289153-8.881785 8.482604L694.180694 171.448397l-0.199591 0.399181c-5.78813 8.881785-6.287107 19.859273-1.397135 28.741059 4.590586 8.183218 12.873599 13.07319 21.755385 12.873599l26.34597-0.598772v0.498976c-0.199591 32.633077-1.696521 70.655102-18.561933 108.776923-18.961115 42.911997-54.089075 79.137706-107.479583 110.673033l-1.197544 0.798363z"
      fill="currentColor"
    />
  </svg>
);

const ToolbarSvgTextInput: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 1024 1024" fill="none" aria-hidden="true" focusable="false" {...props}>
    <path
      d="M896 160H128c-35.2 0-64 28.8-64 64v576c0 35.2 28.8 64 64 64h768c35.2 0 64-28.8 64-64V224c0-35.2-28.8-64-64-64z m0 608c0 16-12.8 32-32 32H160c-19.2 0-32-12.8-32-32V256c0-16 12.8-32 32-32h704c19.2 0 32 12.8 32 32v512z"
      fill="currentColor"
    />
    <path
      d="M224 288c-19.2 0-32 12.8-32 32v256c0 16 12.8 32 32 32s32-12.8 32-32V320c0-16-12.8-32-32-32z m608 480c19.2 0 32-12.8 32-32V608L704 768h128z"
      fill="currentColor"
    />
  </svg>
);

const ToolbarSvgLiveDraw: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 1024 1024" fill="none" aria-hidden="true" focusable="false" {...props}>
    <path
      d="M749.056 233.386667c-29.632-29.632-82.538667-30.592-118.272 5.141333L319.146667 550.186667c-60.778667 60.8-93.653333 128.853333-100.906667 210.837333l-0.298667 4.117333 4.437334-0.256c80.832-7.210667 146.624-41.770667 208.149333-103.296l0.170667-0.170666L743.978667 351.573333c35.669333-35.754667 34.688-88.597333 5.077333-118.186666z m-178.624-55.189334c65.749333-65.749333 172.8-71.317333 238.954667-5.141333 66.197333 66.176 60.608 173.226667-5.12 238.933333l-0.192 0.192-313.28 309.802667c-73.301333 73.258667-157.226667 118.826667-261.632 127.957333a32.618667 32.618667 0 0 1-0.810667 0.064l-0.576 0.042667-53.354667 2.922667A42.666667 42.666667 0 0 1 129.493333 807.466667l3.626667-52.693334a42.666667 42.666667 0 0 1 0.064-0.810666c9.045333-103.402667 51.477333-189.973333 125.610667-264.128L570.453333 178.197333z"
      fill="currentColor"
    />
    <path d="M448.64 700.928l-161.6-161.578667 60.330667-60.352 161.6 161.6-60.352 60.330667z" fill="currentColor" />
    <path d="M512 768h384v85.333333H512v-85.333333z" fill="currentColor" />
    <path d="M682.666667 597.333333h213.333333v85.333334H682.666667v-85.333334z" fill="currentColor" />
  </svg>
);

// 导入 Workflow 节点图标
import { AddIcon } from './workflow-examples/src/components/icons/AddIcon';
import { ConditionalIcon } from './workflow-examples/src/components/icons/ConditionalIcon';
import { DivideIcon } from './workflow-examples/src/components/icons/DivideIcon';
import { MultiplyIcon } from './workflow-examples/src/components/icons/MultiplyIcon';
import { SliderIcon } from './workflow-examples/src/components/icons/SliderIcon';
import { SubtractIcon } from './workflow-examples/src/components/icons/SubtractIcon';

// 自定义竖向工具栏组件
export const VerticalToolbar: TLComponents['Toolbar'] = () => {
  const editor = useEditor();
  const { data: oem } = useSystemConfig();
  const [currentToolId, setCurrentToolId] = useState(editor.getCurrentToolId());
  const [isDrawMenuOpen, setIsDrawMenuOpen] = useState(false);
  const [drawVariant, setDrawVariant] = useState<'draw' | 'highlight' | 'laser'>('draw');
  const drawGroupRef = useRef<HTMLDivElement | null>(null);
  const drawCloseTimerRef = useRef<number | undefined>(undefined);
  const [isInstructionMenuOpen, setIsInstructionMenuOpen] = useState(false);
  const [instructionVariant, setInstructionVariant] = useState<'text' | 'image'>('text');
  const instructionGroupRef = useRef<HTMLDivElement | null>(null);
  const instructionCloseTimerRef = useRef<number | undefined>(undefined);
  const [isGeoMenuOpen, setIsGeoMenuOpen] = useState(false);
  const [geoVariant, setGeoVariant] = useState<
    (typeof GeoShapeGeoStyle.values extends Iterable<infer T> ? T : never) | 'rectangle'
  >('rectangle');
  const geoGroupRef = useRef<HTMLDivElement | null>(null);
  const geoCloseTimerRef = useRef<number | undefined>(undefined);
  const [isWorkflowMenuOpen, setIsWorkflowMenuOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const workflowGroupRef = useRef<HTMLDivElement | null>(null);
  const workflowCloseTimerRef = useRef<number | undefined>(undefined);
  const [isNodeMenuOpen, setIsNodeMenuOpen] = useState(false);
  const [selectedNodeType, setSelectedNodeType] = useState<string>('add');
  const nodeGroupRef = useRef<HTMLDivElement | null>(null);
  const nodeCloseTimerRef = useRef<number | undefined>(undefined);
  const [isStylePanelVisible, setIsStylePanelVisible] = useState(false);
  const stylePanelRef = useRef<HTMLDivElement | null>(null);
  const stylePanelButtonRef = useRef<HTMLButtonElement | null>(null);

  // 获取 pin 到工作台的工作流列表
  const { data: pinnedPagesData } = useWorkspacePages();
  // 从 pin 的页面中提取工作流列表（只包含有 workflow 的页面）
  const workflowList =
    pinnedPagesData?.pages
      ?.filter((page) => page.workflow && page.workflow.workflowId)
      .map((page) => {
        const workflow = page.workflow!;
        return {
          ...workflow,
          workflowId: workflow.workflowId || workflow.id || '',
          displayName: workflow.displayName,
          description: workflow.description,
          // 图标：优先 workflow.iconUrl，其次 page.info.iconUrl / instance.icon
          iconUrl: (workflow as any).iconUrl || (page as any)?.info?.iconUrl || (page as any)?.instance?.icon || undefined,
          // 兼容 name 字段（如果 workflow 中没有 name，使用 displayName）
          name: (workflow as any).name || getI18nContent(workflow.displayName) || '',
        };
      }) || [];

  // 监听工具变化
  useEffect(() => {
    const handleToolChange = () => {
      setCurrentToolId(editor.getCurrentToolId());
    };

    editor.addListener('change', handleToolChange);

    return () => {
      editor.removeListener('change', handleToolChange);
    };
  }, [editor]);

  // 点击外部关闭下拉
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (isDrawMenuOpen) {
        if (drawGroupRef.current && !drawGroupRef.current.contains(target)) {
          setIsDrawMenuOpen(false);
        }
      }
      if (isInstructionMenuOpen) {
        if (instructionGroupRef.current && !instructionGroupRef.current.contains(target)) {
          setIsInstructionMenuOpen(false);
        }
      }
      if (isGeoMenuOpen) {
        if (geoGroupRef.current && !geoGroupRef.current.contains(target)) {
          setIsGeoMenuOpen(false);
        }
      }
      if (isWorkflowMenuOpen) {
        if (workflowGroupRef.current && !workflowGroupRef.current.contains(target)) {
          setIsWorkflowMenuOpen(false);
        }
      }
      if (isNodeMenuOpen) {
        if (nodeGroupRef.current && !nodeGroupRef.current.contains(target)) {
          setIsNodeMenuOpen(false);
        }
      }
      if (isStylePanelVisible) {
        // 检查点击是否在 StylePanel 或其按钮内
        const isClickInStylePanel =
          stylePanelRef.current?.contains(target) || stylePanelButtonRef.current?.contains(target);
        if (!isClickInStylePanel) {
          setIsStylePanelVisible(false);
        }
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [isDrawMenuOpen, isInstructionMenuOpen, isGeoMenuOpen, isWorkflowMenuOpen, isNodeMenuOpen, isStylePanelVisible]);

  // 定义工具栏中要显示的工具列表 - 使用正确的工具ID
  const oneOnOne = (oem as any)?.theme?.designProjects?.oneOnOne === true;
  const showRealtimeDrawing = (oem as any)?.theme?.designProjects?.showRealtimeDrawing === true;
  const showWorkflow = (oem as any)?.theme?.designProjects?.showWorkflow === true;
  const showAgent = (oem as any)?.theme?.designProjects?.showAgent === true;
  // 工具栏分组（白色框）之间的间距：原为 20，这里整体缩小一半
  const TOOLBAR_GROUP_GAP = 10;

  // 基础工具栏工具（不包含 workflow 相关工具）
  const toolbarTools = [
    { id: 'select', label: '选择', icon: 'tool-pointer' },
    { id: 'hand', label: '拖动', icon: 'tool-hand' },
    ...(!oneOnOne ? [{ id: 'frame', label: '画板', icon: 'tool-frame' }] : []),
    { id: 'shape', label: '形状', icon: 'geo-rectangle' },
    { id: 'draw', label: '绘制', icon: 'tool-pencil' },
    { id: 'style-panel', label: '样式面板', icon: 'palette' },
    { id: 'eraser', label: '橡皮擦', icon: 'tool-eraser' },
    { id: 'text', label: '文本', icon: 'tool-text' },
    { id: 'note', label: '便签', icon: 'tool-note' },
  ];

  // Workflow 相关工具（独立工具栏）
  const workflowTools = [
    { id: 'instruction', label: 'Instruction', icon: 'tool-text' },
    { id: 'output', label: '输出', icon: 'tool-frame' },
    { id: 'workflow', label: '工作流', icon: 'tool-workflow' },
    { id: 'workflow-node', label: '流程节点', icon: 'tool-frame' },
  ];

  // Draw Fast 相关工具（独立工具栏）
  // 仅保留实时转绘草图框；结果沿用 Workflow 工具栏中的 Output 节点
  const drawfastTools = [{ id: 'live-image', label: '实时转绘', icon: 'tool-frame' }];

  // 展示层：当同时开启 workflow 与实时转绘时，把“实时转绘”合并进 Workflow 同一个白色工具栏框里，
  // 并插入到 “工作流” 后面（见 UI 期望：I / O / workflow / 实时转绘 / workflow-node）。
  const workflowToolsForDisplay =
    showRealtimeDrawing && showWorkflow
      ? (() => {
          const arr = [...workflowTools];
          const insertIdx = arr.findIndex((t) => t.id === 'workflow');
          if (insertIdx >= 0) arr.splice(insertIdx + 1, 0, ...drawfastTools);
          else arr.push(...drawfastTools);
          return arr;
        })()
      : workflowTools;

  return (
    <div
      className="vertical-toolbar"
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: '20px',
        zIndex: 9999,
        pointerEvents: 'auto',
      }}
    >
      {/* StylePanel - 显示在 toolbar 上方 */}
      {isStylePanelVisible && (
        <div
          ref={stylePanelRef}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '20px',
            zIndex: 10000,
          }}
        >
          <DefaultStylePanel />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'row', gap: TOOLBAR_GROUP_GAP }}>
        <div className="custom-toolbar">
          {toolbarTools.map((tool) => {
            if (tool.id === 'shape') {
              const isActive = currentToolId === 'geo';
              const activeId = geoVariant;
              return (
                <div key="shape-group" className={`tool-group ${isActive ? 'selected' : ''}`} ref={geoGroupRef}>
                  <button
                    className={`tool-button ${isActive ? 'selected' : ''} ${isGeoMenuOpen ? 'menu-open' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      editor.run(() => {
                        editor.setStyleForNextShapes(GeoShapeGeoStyle, activeId as any);
                        editor.setCurrentTool('geo');
                        setCurrentToolId('geo');
                      });
                    }}
                    title={`形状: ${String(activeId)}`}
                    style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 10000 }}
                  >
                    <TldrawUiIcon icon={`geo-${String(activeId)}` as any} label={`形状: ${String(activeId)}`} />
                    <span className="caret" />
                    <span
                      className="caret-hit"
                      title="More shapes"
                      onMouseEnter={() => {
                        if (geoCloseTimerRef.current !== undefined) {
                          window.clearTimeout(geoCloseTimerRef.current);
                          geoCloseTimerRef.current = undefined;
                        }
                        setIsGeoMenuOpen(true);
                      }}
                      onMouseLeave={() => {
                        geoCloseTimerRef.current = window.setTimeout(() => {
                          setIsGeoMenuOpen(false);
                          geoCloseTimerRef.current = undefined;
                        }, 150);
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsGeoMenuOpen((v) => !v);
                      }}
                    />
                  </button>
                  {isGeoMenuOpen && (
                    <div
                      className="dropdown-menu shapes-grid"
                      onMouseEnter={() => {
                        if (geoCloseTimerRef.current !== undefined) {
                          window.clearTimeout(geoCloseTimerRef.current);
                          geoCloseTimerRef.current = undefined;
                        }
                        setIsGeoMenuOpen(true);
                      }}
                      onMouseLeave={() => {
                        setIsGeoMenuOpen(false);
                      }}
                    >
                      {[...GeoShapeGeoStyle.values].map((id) => (
                        <div
                          key={String(id)}
                          className={`dropdown-item ${String(geoVariant) === String(id) ? 'active' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setGeoVariant(id as any);
                            editor.run(() => {
                              editor.setStyleForNextShapes(GeoShapeGeoStyle, id as any);
                              editor.setCurrentTool('geo');
                            });
                            setCurrentToolId('geo');
                            setIsGeoMenuOpen(false);
                          }}
                        >
                          <TldrawUiIcon icon={`geo-${String(id)}` as any} label={`形状: ${String(id)}`} />
                        </div>
                      ))}
                      {/* Extra tools in shapes menu: Arrow & Line */}
                      <div
                        className={`dropdown-item ${currentToolId === 'arrow' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          editor.setCurrentTool('arrow');
                          setCurrentToolId('arrow');
                          setIsGeoMenuOpen(false);
                        }}
                      >
                        <TldrawUiIcon icon="tool-arrow" label="箭头工具" />
                      </div>
                      <div
                        className={`dropdown-item ${currentToolId === 'line' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          editor.setCurrentTool('line');
                          setCurrentToolId('line');
                          setIsGeoMenuOpen(false);
                        }}
                      >
                        <TldrawUiIcon icon="tool-line" label="直线工具" />
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            if (tool.id === 'draw') {
              const activeId = drawVariant;
              const isActive = currentToolId === 'draw' || currentToolId === 'highlight' || currentToolId === 'laser';
              return (
                <div key="draw-group" className={`tool-group ${isActive ? 'selected' : ''}`} ref={drawGroupRef}>
                  <button
                    className={`tool-button ${isActive ? 'selected' : ''} ${isDrawMenuOpen ? 'menu-open' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      editor.setCurrentTool(activeId);
                      setCurrentToolId(activeId);
                      setIsDrawMenuOpen(false);
                    }}
                    title={activeId === 'draw' ? '铅笔' : activeId === 'highlight' ? '荧光笔' : '激光笔'}
                    style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 10000 }}
                  >
                    <TldrawUiIcon
                      icon={
                        activeId === 'draw' ? 'tool-pencil' : activeId === 'highlight' ? 'tool-highlight' : 'tool-laser'
                      }
                      label={activeId === 'draw' ? '铅笔' : activeId === 'highlight' ? '荧光笔' : '激光笔'}
                    />
                    <span className="caret" />
                    <span
                      className="caret-hit"
                      title="更多画笔"
                      onMouseEnter={() => {
                        if (drawCloseTimerRef.current !== undefined) {
                          window.clearTimeout(drawCloseTimerRef.current);
                          drawCloseTimerRef.current = undefined;
                        }
                        setIsDrawMenuOpen(true);
                      }}
                      onMouseLeave={() => {
                        drawCloseTimerRef.current = window.setTimeout(() => {
                          setIsDrawMenuOpen(false);
                          drawCloseTimerRef.current = undefined;
                        }, 150);
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDrawMenuOpen((v) => !v);
                      }}
                    />
                  </button>
                  {isDrawMenuOpen && (
                    <div
                      className="dropdown-menu"
                      onMouseEnter={() => {
                        if (drawCloseTimerRef.current !== undefined) {
                          window.clearTimeout(drawCloseTimerRef.current);
                          drawCloseTimerRef.current = undefined;
                        }
                        setIsDrawMenuOpen(true);
                      }}
                      onMouseLeave={() => {
                        setIsDrawMenuOpen(false);
                      }}
                    >
                      <div
                        className={`dropdown-item ${drawVariant === 'draw' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDrawVariant('draw');
                          editor.setCurrentTool('draw');
                          setCurrentToolId('draw');
                          setIsDrawMenuOpen(false);
                        }}
                      >
                        <TldrawUiIcon icon="tool-pencil" label="铅笔" />
                        <span>铅笔</span>
                      </div>
                      <div
                        className={`dropdown-item ${drawVariant === 'highlight' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDrawVariant('highlight');
                          editor.setCurrentTool('highlight');
                          setCurrentToolId('highlight');
                          setIsDrawMenuOpen(false);
                        }}
                      >
                        <TldrawUiIcon icon="tool-highlight" label="荧光笔" />
                        <span>荧光笔</span>
                      </div>
                      <div
                        className={`dropdown-item ${drawVariant === 'laser' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDrawVariant('laser');
                          editor.setCurrentTool('laser');
                          setCurrentToolId('laser');
                          setIsDrawMenuOpen(false);
                        }}
                      >
                        <TldrawUiIcon icon="tool-laser" label="激光笔" />
                        <span>激光笔</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // instruction, output, workflow, workflow-node 已移到独立的 workflow 工具栏
            if (
              tool.id === 'instruction' ||
              tool.id === 'output' ||
              tool.id === 'workflow' ||
              tool.id === 'workflow-node'
            ) {
              return null;
            }

            if (tool.id === 'style-panel') {
              return (
                <button
                  key={tool.id}
                  ref={stylePanelButtonRef}
                  className={`tool-button ${isStylePanelVisible ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsStylePanelVisible((prev) => !prev);
                  }}
                  title={tool.label}
                  style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 10000 }}
                >
                  <VinesIcon size="xs" className="toolbar-vines-icon">
                    lucide:palette
                  </VinesIcon>
                </button>
              );
            }

            return (
              <button
                key={tool.id}
                className={`tool-button ${currentToolId === tool.id ? 'selected' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  editor.setCurrentTool(tool.id);
                  setCurrentToolId(tool.id);
                  setIsDrawMenuOpen(false);
                }}
                title={tool.label}
                style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 10000 }}
              >
                <TldrawUiIcon icon={tool.icon} label={tool.label || tool.id} />
              </button>
            );
          })}
        </div>

        {/* Draw Fast 工具栏（独立） - 根据 OEM 配置控制显示
            说明：如果 Workflow 工具栏开启，则实时转绘会合并进 Workflow 同一工具栏框中 */}
        {showRealtimeDrawing && !showWorkflow && (
          <div className="custom-toolbar" style={{ marginLeft: TOOLBAR_GROUP_GAP }}>
            {drawfastTools.map((tool) => {
              const isActive = currentToolId === tool.id;
              return (
                <button
                  key={tool.id}
                  className={`tool-button ${isActive ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    editor.setCurrentTool(tool.id);
                    setCurrentToolId(tool.id);
                  }}
                  title={tool.label}
                  style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 10000 }}
                >
                  <TldrawUiIcon icon={tool.icon} label={tool.label || tool.id} />
                </button>
              );
            })}
          </div>
        )}

        {/* Workflow 工具栏（独立） - 根据 OEM 配置控制显示 */}
        {showWorkflow && (
          <div className="custom-toolbar" style={{ marginLeft: TOOLBAR_GROUP_GAP }}>
            {workflowToolsForDisplay.map((tool) => {
              if (tool.id === 'instruction') {
                const activeId = instructionVariant;
                const isActive = currentToolId === 'instruction';
                return (
                  <div
                    key="instruction-group"
                    className={`tool-group ${isActive ? 'selected' : ''}`}
                    ref={instructionGroupRef}
                  >
                    <button
                      className={`tool-button ${isActive ? 'selected' : ''} ${isInstructionMenuOpen ? 'menu-open' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // 设置输入模式并激活工具
                        const instructionTool = editor.getStateDescendant('instruction') as any;
                        if (instructionTool && instructionTool.setInputMode) {
                          instructionTool.setInputMode(activeId);
                        }
                        editor.setCurrentTool('instruction');
                        setCurrentToolId('instruction');
                        setIsInstructionMenuOpen(false);
                      }}
                      title={activeId === 'text' ? '文本输入' : '图片输入'}
                      style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 10000 }}
                    >
                      {activeId === 'text' ? <ToolbarSvgInput /> : <span style={{ fontSize: '16px' }}>📷</span>}
                      <span className="caret" />
                      <span
                        className="caret-hit"
                        title="更多输入模式"
                        onMouseEnter={() => {
                          if (instructionCloseTimerRef.current !== undefined) {
                            window.clearTimeout(instructionCloseTimerRef.current);
                            instructionCloseTimerRef.current = undefined;
                          }
                          setIsInstructionMenuOpen(true);
                        }}
                        onMouseLeave={() => {
                          instructionCloseTimerRef.current = window.setTimeout(() => {
                            setIsInstructionMenuOpen(false);
                            instructionCloseTimerRef.current = undefined;
                          }, 150);
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsInstructionMenuOpen((v) => !v);
                        }}
                      />
                    </button>
                    {isInstructionMenuOpen && (
                      <div
                        className="dropdown-menu"
                        onMouseEnter={() => {
                          if (instructionCloseTimerRef.current !== undefined) {
                            window.clearTimeout(instructionCloseTimerRef.current);
                            instructionCloseTimerRef.current = undefined;
                          }
                          setIsInstructionMenuOpen(true);
                        }}
                        onMouseLeave={() => {
                          setIsInstructionMenuOpen(false);
                        }}
                      >
                        <div
                          className={`dropdown-item ${instructionVariant === 'text' ? 'active' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setInstructionVariant('text');
                            const instructionTool = editor.getStateDescendant('instruction') as any;
                            if (instructionTool && instructionTool.setInputMode) {
                              instructionTool.setInputMode('text');
                            }
                            editor.setCurrentTool('instruction');
                            setCurrentToolId('instruction');
                            setIsInstructionMenuOpen(false);
                          }}
                        >
                          <ToolbarSvgTextInput style={{ width: 16, height: 16, marginRight: 6, flexShrink: 0 }} />
                          <span>文本输入</span>
                        </div>
                        <div
                          className={`dropdown-item ${instructionVariant === 'image' ? 'active' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setInstructionVariant('image');
                            const instructionTool = editor.getStateDescendant('instruction') as any;
                            if (instructionTool && instructionTool.setInputMode) {
                              instructionTool.setInputMode('image');
                            }
                            editor.setCurrentTool('instruction');
                            setCurrentToolId('instruction');
                            setIsInstructionMenuOpen(false);
                          }}
                        >
                          <span style={{ fontSize: '16px' }}>📷</span>
                          <span>图片输入</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              if (tool.id === 'output') {
                const isActive = currentToolId === 'output';
                return (
                  <button
                    key={tool.id}
                    className={`tool-button ${isActive ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      editor.setCurrentTool('output');
                      setCurrentToolId('output');
                    }}
                    title={tool.label}
                    style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 10000 }}
                  >
                    <ToolbarSvgOutput />
                  </button>
                );
              }

              if (tool.id === 'live-image') {
                const isActive = currentToolId === tool.id;
                return (
                  <button
                    key={tool.id}
                    className={`tool-button ${isActive ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      editor.setCurrentTool(tool.id);
                      setCurrentToolId(tool.id);
                    }}
                    title={tool.label}
                    style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 10000 }}
                  >
                    <ToolbarSvgLiveDraw />
                  </button>
                );
              }

              if (tool.id === 'workflow') {
                const isActive = currentToolId === 'workflow';
                return (
                  <div
                    key="workflow-group"
                    className={`tool-group ${isActive ? 'selected' : ''}`}
                    ref={workflowGroupRef}
                  >
                    <button
                      className={`tool-button ${isActive ? 'selected' : ''} ${isWorkflowMenuOpen ? 'menu-open' : ''}`}
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (selectedWorkflow) {
                          // 如果已选择工作流，激活工具并设置工作流数据
                          try {
                            // 获取工作流详细信息（包括输入参数）
                            const workflowDetail = await getWorkflow(selectedWorkflow.workflowId);

                            // 转换输入参数格式（带默认值/下拉选项兼容）
                            const inputParams = normalizeWorkflowInputParams(workflowDetail?.variables);

                            const workflowTool = editor.getStateDescendant('workflow') as any;
                            if (workflowTool && workflowTool.setWorkflowData) {
                              workflowTool.setWorkflowData({
                                workflowId: selectedWorkflow.workflowId,
                                workflowName:
                                  getI18nContent(workflowDetail?.displayName || selectedWorkflow.displayName) ||
                                  selectedWorkflow.name ||
                                  '未命名工作流',
                                workflowDescription:
                                  getI18nContent(workflowDetail?.description || selectedWorkflow.description) || '',
                                workflowIcon: selectedWorkflow?.iconUrl || (workflowDetail as any)?.iconUrl || '',
                                inputParams: inputParams,
                              });
                            }
                          } catch (error) {
                            console.error('获取工作流详情失败:', error);
                            const workflowTool = editor.getStateDescendant('workflow') as any;
                            if (workflowTool && workflowTool.setWorkflowData) {
                              workflowTool.setWorkflowData({
                                workflowId: selectedWorkflow.workflowId,
                                workflowName:
                                  getI18nContent(selectedWorkflow.displayName) ||
                                  selectedWorkflow.name ||
                                  '未命名工作流',
                                workflowDescription: getI18nContent(selectedWorkflow.description) || '',
                                workflowIcon: selectedWorkflow?.iconUrl || '',
                                inputParams: [],
                              });
                            }
                          }
                          editor.setCurrentTool('workflow');
                          setCurrentToolId('workflow');
                        } else {
                          // 如果没有选择工作流，打开菜单
                          setIsWorkflowMenuOpen(true);
                        }
                      }}
                      title={
                        selectedWorkflow
                          ? `工作流: ${getI18nContent(selectedWorkflow.displayName) || selectedWorkflow.name}`
                          : '工作流'
                      }
                      style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 10000 }}
                    >
                      <VinesIcon size="xs" className="toolbar-vines-icon">
                        {selectedWorkflow?.iconUrl || 'lucide:workflow'}
                      </VinesIcon>
                      <span className="caret" />
                      <span
                        className="caret-hit"
                        title="选择工作流"
                        onMouseEnter={() => {
                          if (workflowCloseTimerRef.current !== undefined) {
                            window.clearTimeout(workflowCloseTimerRef.current);
                            workflowCloseTimerRef.current = undefined;
                          }
                          setIsWorkflowMenuOpen(true);
                        }}
                        onMouseLeave={() => {
                          workflowCloseTimerRef.current = window.setTimeout(() => {
                            setIsWorkflowMenuOpen(false);
                            workflowCloseTimerRef.current = undefined;
                          }, 150);
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsWorkflowMenuOpen((v) => !v);
                        }}
                      />
                    </button>
                    {isWorkflowMenuOpen && (
                      <div
                        className="dropdown-menu workflow-list"
                        style={{ maxHeight: '300px', overflowY: 'auto' }}
                        onMouseEnter={() => {
                          if (workflowCloseTimerRef.current !== undefined) {
                            window.clearTimeout(workflowCloseTimerRef.current);
                            workflowCloseTimerRef.current = undefined;
                          }
                          setIsWorkflowMenuOpen(true);
                        }}
                        onMouseLeave={() => {
                          setIsWorkflowMenuOpen(false);
                        }}
                      >
                        {(!workflowList || workflowList.length === 0) && (
                          <div className="dropdown-item" style={{ color: '#9CA3AF', cursor: 'default' }}>
                            <span>暂无工作流</span>
                          </div>
                        )}
                        {workflowList &&
                          workflowList.map((workflow: any) => (
                            <div
                              key={workflow.workflowId}
                              className={`dropdown-item ${selectedWorkflow?.workflowId === workflow.workflowId ? 'active' : ''}`}
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedWorkflow(workflow);

                                try {
                                  // 获取工作流详细信息（包括输入参数）
                                  const workflowDetail = await getWorkflow(workflow.workflowId);

                                  // 转换输入参数格式（带默认值/下拉选项兼容）
                                  const inputParams = normalizeWorkflowInputParams(workflowDetail?.variables);

                                  // 设置工作流数据并激活工具
                                  const workflowTool = editor.getStateDescendant('workflow') as any;
                                  if (workflowTool && workflowTool.setWorkflowData) {
                                    workflowTool.setWorkflowData({
                                      workflowId: workflow.workflowId,
                                      workflowName:
                                        getI18nContent(workflowDetail?.displayName || workflow.displayName) ||
                                        workflow.name ||
                                        '未命名工作流',
                                      workflowDescription:
                                        getI18nContent(workflowDetail?.description || workflow.description) || '',
                                      workflowIcon: workflow?.iconUrl || (workflowDetail as any)?.iconUrl || '',
                                      inputParams: inputParams,
                                    });
                                  }
                                  editor.setCurrentTool('workflow');
                                  setCurrentToolId('workflow');
                                } catch (error) {
                                  console.error('获取工作流详情失败:', error);
                                  // 如果获取失败，使用基本信息
                                  const workflowTool = editor.getStateDescendant('workflow') as any;
                                  if (workflowTool && workflowTool.setWorkflowData) {
                                    workflowTool.setWorkflowData({
                                      workflowId: workflow.workflowId,
                                      workflowName:
                                        getI18nContent(workflow.displayName) || workflow.name || '未命名工作流',
                                      workflowDescription: getI18nContent(workflow.description) || '',
                                      workflowIcon: workflow?.iconUrl || '',
                                      inputParams: [],
                                    });
                                  }
                                  editor.setCurrentTool('workflow');
                                  setCurrentToolId('workflow');
                                }

                                setIsWorkflowMenuOpen(false);
                              }}
                              title={getI18nContent(workflow.description) || ''}
                            >
                              <VinesIcon size="xs" style={{ width: 20, height: 20 }}>
                                {workflow?.iconUrl || 'lucide:workflow'}
                              </VinesIcon>
                              <span
                                style={{
                                  maxWidth: '150px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {getI18nContent(workflow.displayName) || workflow.name || '未命名工作流'}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                );
              }

              if (tool.id === 'workflow-node') {
                const isActive = currentToolId === 'workflow-node';
                const nodeTypes = [
                  { type: 'add', label: '加法', IconComponent: AddIcon },
                  { type: 'subtract', label: '减法', IconComponent: SubtractIcon },
                  { type: 'multiply', label: '乘法', IconComponent: MultiplyIcon },
                  { type: 'divide', label: '除法', IconComponent: DivideIcon },
                  { type: 'slider', label: '滑块', IconComponent: SliderIcon },
                  { type: 'conditional', label: '条件', IconComponent: ConditionalIcon },
                ];
                const currentNode = nodeTypes.find((n) => n.type === selectedNodeType) || nodeTypes[0];
                const CurrentIcon = currentNode.IconComponent;

                return (
                  <div key="node-group" className={`tool-group ${isActive ? 'selected' : ''}`} ref={nodeGroupRef}>
                    <button
                      className={`tool-button ${isActive ? 'selected' : ''} ${isNodeMenuOpen ? 'menu-open' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const nodeTool = editor.getStateDescendant('workflow-node') as any;
                        if (nodeTool && nodeTool.setNodeType) {
                          nodeTool.setNodeType({ type: selectedNodeType });
                        }
                        editor.setCurrentTool('workflow-node');
                        setCurrentToolId('workflow-node');
                      }}
                      title={`流程节点: ${currentNode.label}`}
                      style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 10000 }}
                    >
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CurrentIcon />
                      </div>
                      <span className="caret" />
                      <span
                        className="caret-hit"
                        title="选择节点类型"
                        onMouseEnter={() => {
                          if (nodeCloseTimerRef.current !== undefined) {
                            window.clearTimeout(nodeCloseTimerRef.current);
                            nodeCloseTimerRef.current = undefined;
                          }
                          setIsNodeMenuOpen(true);
                        }}
                        onMouseLeave={() => {
                          nodeCloseTimerRef.current = window.setTimeout(() => {
                            setIsNodeMenuOpen(false);
                            nodeCloseTimerRef.current = undefined;
                          }, 150);
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsNodeMenuOpen((v) => !v);
                        }}
                      />
                    </button>
                    {isNodeMenuOpen && (
                      <div
                        className="dropdown-menu"
                        onMouseEnter={() => {
                          if (nodeCloseTimerRef.current !== undefined) {
                            window.clearTimeout(nodeCloseTimerRef.current);
                            nodeCloseTimerRef.current = undefined;
                          }
                          setIsNodeMenuOpen(true);
                        }}
                        onMouseLeave={() => {
                          setIsNodeMenuOpen(false);
                        }}
                      >
                        {nodeTypes.map((nodeType) => {
                          const NodeIcon = nodeType.IconComponent;
                          return (
                            <div
                              key={nodeType.type}
                              className={`dropdown-item ${selectedNodeType === nodeType.type ? 'active' : ''}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedNodeType(nodeType.type);
                                const nodeTool = editor.getStateDescendant('workflow-node') as any;
                                if (nodeTool && nodeTool.setNodeType) {
                                  nodeTool.setNodeType({ type: nodeType.type });
                                }
                                editor.setCurrentTool('workflow-node');
                                setCurrentToolId('workflow-node');
                                setIsNodeMenuOpen(false);
                              }}
                            >
                              <div
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <NodeIcon />
                              </div>
                              <span>{nodeType.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return null;
            })}
          </div>
        )}

        {/* Agent toggle button - 根据 OEM 配置控制显示 */}
        {showAgent && (
          <div className="custom-toolbar" style={{ marginLeft: TOOLBAR_GROUP_GAP }}>
            <div className="tool-group">
              <button
                className="tool-button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent('vines:toggle-agent-embed'));
                }}
                title="Agent"
                style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 10000 }}
              >
                <VinesIcon size="xs" className="toolbar-vines-icon">
                  lucide:bot
                </VinesIcon>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
