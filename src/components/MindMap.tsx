import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type Connection,
  BackgroundVariant,
  Panel,
  ConnectionLineType,
  ConnectionMode,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useResearchStore } from '../store/useResearchStore'
import { useSettingsStore } from '../store/useSettingsStore'
import {
  computeCitationPosition,
  countCitationsInCategory,
  primaryCitationColor,
  THESIS_COLOR,
} from '../lib/categories'
import { assignmentEdgeId } from '../lib/graphUtils'
import { CitationNode } from './CitationNode'
import { CategoryNode } from './CategoryNode'
import { ThesisNode } from './ThesisNode'
import { EmptyStateGuide } from './EmptyStateGuide'
import { DeletableEdge } from './DeletableEdge'
import { LayoutGrid } from 'lucide-react'

import type { Category, Citation } from '../types'
import {
  closestSideHandles,
  kindFromNodeId,
  nodeCenter,
} from '../lib/edgeHandles'

const edgeTypes = {
  deletable: DeletableEdge,
}

const nodeTypes = {
  citation: CitationNode,
  category: CategoryNode,
  thesis: ThesisNode,
}

const defaultEdgeOptions = {
  type: 'deletable',
  style: { strokeWidth: 2.5 },
  selectable: true,
}

function handlesBetween(sourceId: string, targetId: string, nodes: Node[]) {
  const sourceNode = nodes.find((n) => n.id === sourceId)
  const targetNode = nodes.find((n) => n.id === targetId)
  if (!sourceNode || !targetNode) {
    return { sourceHandle: 'h-bottom', targetHandle: 'h-top' }
  }
  const sourceKind = kindFromNodeId(sourceId)
  const targetKind = kindFromNodeId(targetId)
  return closestSideHandles(
    nodeCenter(sourceNode.position, sourceKind, {
      width: sourceNode.measured?.width ?? sourceNode.width,
      height: sourceNode.measured?.height ?? sourceNode.height,
    }),
    nodeCenter(targetNode.position, targetKind, {
      width: targetNode.measured?.width ?? targetNode.width,
      height: targetNode.measured?.height ?? targetNode.height,
    }),
    sourceKind,
    targetKind,
    {
      width: sourceNode.measured?.width ?? sourceNode.width,
      height: sourceNode.measured?.height ?? sourceNode.height,
    },
    {
      width: targetNode.measured?.width ?? targetNode.width,
      height: targetNode.measured?.height ?? targetNode.height,
    }
  )
}

function buildGraph(
  thesis: string,
  projectName: string,
  citations: Citation[],
  categories: Category[],
  connections: ReturnType<typeof useResearchStore.getState>['project']['connections'],
  selectedCitationId: string | null,
  selectedCategoryId: string | null,
  thesisSelected: boolean,
  _animateEdges: boolean
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  const thesisPosition = { x: -120, y: -80 }

  nodes.push({
    id: 'thesis-center',
    type: 'thesis',
    position: thesisPosition,
    data: { thesis, projectName },
    draggable: true,
    connectable: true,
    selected: thesisSelected,
  })

  categories.forEach((category) => {
    nodes.push({
      id: `category-${category.id}`,
      type: 'category',
      position: category.position,
      data: {
        category,
        citationCount: countCitationsInCategory(citations, category.id),
      },
      draggable: true,
      connectable: true,
      selected: category.id === selectedCategoryId,
    })
  })

  citations.forEach((citation, index) => {
    const nodeId = `citation-${citation.id}`
    nodes.push({
      id: nodeId,
      type: 'citation',
      position: computeCitationPosition(citation, categories, index, citations),
      data: {
        citation,
        label: citation.author.split(',')[0] || citation.author || 'Unknown',
        color: primaryCitationColor(citation, categories),
      },
      draggable: true,
      connectable: true,
      selected: citation.id === selectedCitationId,
    })

    // Sources connect to their category / subcategory (closest sides)
    citation.categoryIds.forEach((categoryId) => {
      const category = categories.find((c) => c.id === categoryId)
      if (!category) return

      const sourceId = `category-${categoryId}`
      const { sourceHandle, targetHandle } = handlesBetween(sourceId, nodeId, nodes)

      edges.push({
        id: assignmentEdgeId(categoryId, citation.id),
        source: sourceId,
        sourceHandle,
        target: nodeId,
        targetHandle,
        type: 'deletable',
        style: { stroke: category.color, strokeWidth: 2, opacity: 0.85 },
        animated: false,
        deletable: true,
        data: { deletable: true },
      })
    })

    if (citation.categoryIds.length === 0) {
      const { sourceHandle, targetHandle } = handlesBetween('thesis-center', nodeId, nodes)
      edges.push({
        id: `edge-thesis-unassigned-${citation.id}`,
        source: 'thesis-center',
        sourceHandle,
        target: nodeId,
        targetHandle,
        type: 'deletable',
        style: { stroke: '#64748b', strokeWidth: 1.5, opacity: 0.35, strokeDasharray: '6 4' },
        animated: false,
        deletable: false,
        selectable: false,
        data: { deletable: false },
      })
    }
  })

  connections.forEach((conn) => {
    // Main idea only links to top-level categories (not subtopics)
    if (conn.source === 'thesis-center' || conn.target === 'thesis-center') {
      const otherId = (conn.source === 'thesis-center' ? conn.target : conn.source).replace(
        'category-',
        ''
      )
      const otherCat = categories.find((c) => c.id === otherId)
      if (otherCat?.parentId) return
    }

    // Skip parent↔child duplicates (rendered as hierarchy edges below)
    const srcCat = categories.find((c) => `category-${c.id}` === conn.source)
    const tgtCat = categories.find((c) => `category-${c.id}` === conn.target)
    if (
      srcCat &&
      tgtCat &&
      (srcCat.parentId === tgtCat.id || tgtCat.parentId === srcCat.id)
    ) {
      return
    }

    const { sourceHandle, targetHandle } = handlesBetween(conn.source, conn.target, nodes)

    edges.push({
      id: conn.id,
      source: conn.source,
      target: conn.target,
      sourceHandle,
      targetHandle,
      type: 'deletable',
      style: {
        stroke:
          conn.source === 'thesis-center' || conn.target === 'thesis-center'
            ? THESIS_COLOR
            : conn.source.startsWith('citation-') && conn.target.startsWith('citation-')
              ? '#fbbf24'
              : '#94a3b8',
        strokeWidth: 2.5,
        opacity: 0.85,
      },
      animated: false,
      deletable: true,
      data: { deletable: true },
    })
  })

  // Subtopic → parent category (dashed), then sources hang off the subtopic
  categories.forEach((category) => {
    if (!category.parentId) return
    const parent = categories.find((c) => c.id === category.parentId)
    if (!parent) return

    const sourceId = `category-${category.parentId}`
    const targetId = `category-${category.id}`
    const { sourceHandle, targetHandle } = handlesBetween(sourceId, targetId, nodes)

    edges.push({
      id: `subcategory-${category.parentId}-to-${category.id}`,
      source: sourceId,
      target: targetId,
      sourceHandle,
      targetHandle,
      type: 'deletable',
      style: {
        stroke: category.color,
        strokeWidth: 2.5,
        opacity: 0.85,
        strokeDasharray: '8 4',
      },
      animated: false,
      deletable: false,
      data: { deletable: false },
    })
  })

  return { nodes, edges }
}

function MindMapCanvas() {
  const {
    project,
    selectedCitationId,
    selectedCategoryId,
    thesisSelected,
    selectCitation,
    selectCategory,
    selectThesis,
    clearMapSelection,
    handleMapConnect,
    handleMapDisconnect,
    updateCategoryPosition,
    updateCitationPosition,
    organizeMap,
  } = useResearchStore()
  const { showMinimap, showAnimations, autoFitMap } = useSettingsStore()
  const { fitView } = useReactFlow()
  const [organizing, setOrganizing] = useState(false)

  const handleOrganize = useCallback(() => {
    setOrganizing(true)
    organizeMap()
    setTimeout(() => {
      fitView({ padding: 0.35, duration: 400 })
      setOrganizing(false)
    }, 120)
  }, [organizeMap, fitView])

  const graph = useMemo(
    () =>
      buildGraph(
        project.thesis,
        project.name,
        project.citations,
        project.categories,
        project.connections,
        selectedCitationId,
        selectedCategoryId,
        thesisSelected,
        showAnimations
      ),
    [
      project.thesis,
      project.name,
      project.citations,
      project.categories,
      project.connections,
      selectedCitationId,
      selectedCategoryId,
      thesisSelected,
      showAnimations,
    ]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges)

  useEffect(() => {
    setNodes(graph.nodes)
    setEdges(graph.edges)
    if (autoFitMap) {
      const timer = setTimeout(() => fitView({ padding: 0.35, duration: 300 }), 100)
      return () => clearTimeout(timer)
    }
  }, [graph, setNodes, setEdges, autoFitMap, fitView])

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      handleMapConnect(
        connection.source,
        connection.target,
        connection.sourceHandle,
        connection.targetHandle
      )
    },
    [handleMapConnect]
  )

  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      deleted.forEach((edge) => {
        handleMapDisconnect(edge.id, edge.source, edge.target)
      })
    },
    [handleMapDisconnect]
  )

  const onReconnectEnd = useCallback(
    (_event: MouseEvent | TouchEvent, edge: Edge, _handleType: string, connectionState: { isValid: boolean | null }) => {
      if (connectionState.isValid !== true) {
        handleMapDisconnect(edge.id, edge.source, edge.target)
      }
    },
    [handleMapDisconnect]
  )

  const onNodeDragStop = useCallback(
    (_event: MouseEvent | TouchEvent, node: Node) => {
      if (node.type === 'category') {
        updateCategoryPosition(node.id.replace('category-', ''), node.position)
      } else if (node.type === 'citation') {
        updateCitationPosition(node.id.replace('citation-', ''), node.position)
      }
    },
    [updateCategoryPosition, updateCitationPosition]
  )

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'thesis') {
        selectThesis()
      } else if (node.type === 'citation') {
        selectCitation((node.data as { citation: { id: string } }).citation.id)
      } else if (node.type === 'category') {
        selectCategory((node.data as { category: { id: string } }).category.id)
      }
    },
    [selectThesis, selectCitation, selectCategory]
  )

  const onPaneClick = useCallback(() => {
    clearMapSelection()
  }, [clearMapSelection])

  const mappedCount = project.citations.filter((c) => c.categoryIds.length > 0).length
  const isEmpty = project.citations.length === 0 && !project.thesis && project.categories.length === 0

  return (
    <div className="flex-1 h-full relative">
      {isEmpty && <EmptyStateGuide />}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onReconnectEnd={onReconnectEnd}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: '#d4644a', strokeWidth: 2 }}
        connectionMode={ConnectionMode.Loose}
        snapToGrid={false}
        fitView
        fitViewOptions={{ padding: 0.35 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable
        elementsSelectable
        edgesFocusable
        edgesReconnectable
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={1} color="rgba(244, 241, 234, 0.06)" />
        <Controls showInteractive={false} />
        {showMinimap && (
          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'category') {
                return (node.data as { category: { color: string } }).category.color
              }
              if (node.type === 'thesis') return THESIS_COLOR
              return '#334155'
            }}
            maskColor="rgba(2, 4, 8, 0.8)"
            className="!bottom-16"
          />
        )}

        {thesisSelected && (
          <Panel position="top-left" className="glass-panel rounded-lg px-4 py-3 m-4 max-w-xs pointer-events-auto animate-fade-in-up">
            <label className="block">
              <span className="text-[10px] font-mono text-arc-500 tracking-wider">PROJECT</span>
              <input
                value={project.name}
                onChange={(e) => useResearchStore.getState().setProjectName(e.target.value)}
                className="w-full mt-1 bg-transparent border-b border-arc-500/30 text-sm font-display text-arc-200 focus:outline-none focus:border-arc-400 pb-1"
              />
            </label>
            <label className="block mt-3">
              <span className="text-[10px] font-mono text-arc-500 tracking-wider">LIT REVIEW / THESIS</span>
              <textarea
                value={project.thesis}
                onChange={(e) => useResearchStore.getState().setThesis(e.target.value)}
                placeholder="Your thesis statement or research question..."
                className="w-full mt-1 bg-transparent border border-arc-500/20 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-arc-400 resize-none h-16 hud-input"
              />
            </label>
          </Panel>
        )}

        <Panel position="bottom-left" className="m-4 mb-16 pointer-events-auto">
          <button
            type="button"
            onClick={handleOrganize}
            disabled={organizing || (project.categories.length === 0 && project.citations.length === 0)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg hud-button hud-button-primary text-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <LayoutGrid size={14} className={organizing ? 'animate-pulse' : ''} />
            {organizing ? 'Organizing...' : 'Organize by Topic'}
          </button>
        </Panel>


        <Panel position="bottom-right" className="text-[10px] font-mono text-arc-500/50 m-4 mb-16">
          {project.citations.length} sources · {project.categories.length} categories · {mappedCount} linked
          {project.citations.some((c) => !c.categoryIds.length) &&
            ` · ${project.citations.filter((c) => !c.categoryIds.length).length} unassigned`}
        </Panel>
      </ReactFlow>
    </div>
  )
}

export function MindMap() {
  return (
    <ReactFlowProvider>
      <MindMapCanvas />
    </ReactFlowProvider>
  )
}
