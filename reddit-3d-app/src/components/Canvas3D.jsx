import React, { useRef, useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { transformTreeTo3DGraph } from '../utils/graph-transformer'
import Nodes from './Nodes'
import Edges from './Edges'

function Canvas3D({ threadData, selectedNode, onNodeClick }) {
  const { nodes, edges } = useMemo(() => {
    if (!threadData) return { nodes: [], edges: [] }
    return transformTreeTo3DGraph(threadData.root)
  }, [threadData])

  return (
    <div className="canvas-container">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 2, 5]} />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={2}
          maxDistance={15}
        />

        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        <Edges edges={edges} />
        <Nodes
          nodes={nodes}
          selectedNode={selectedNode}
          onNodeClick={onNodeClick}
        />
      </Canvas>

      <div className="canvas-info">
        <div className="info-item">
          <span className="info-label">Nodes:</span>
          <span className="info-value">{nodes.length}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Edges:</span>
          <span className="info-value">{edges.length}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Title:</span>
          <span className="info-value">{threadData?.title}</span>
        </div>
      </div>

      <div className="canvas-legend">
        <div className="legend-title">Legend</div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#4ade80' }}></span>
          <span>Solution</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#fbbf24' }}></span>
          <span>Question</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#fb923c' }}></span>
          <span>Debate</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#60a5fa' }}></span>
          <span>Deep (5+ levels)</span>
        </div>
      </div>
    </div>
  )
}

export default Canvas3D
