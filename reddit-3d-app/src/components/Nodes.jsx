import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { isBranchNode } from '../utils/node-helpers'

function Node({ node, isSelected, onClick }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)

  // Animation for branch nodes (pulse effect)
  useFrame((state) => {
    if (!meshRef.current) return

    if (isBranchNode(node)) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1
      meshRef.current.scale.setScalar(node.size * pulse)
    }

    // Glow effect for selected node
    if (isSelected) {
      meshRef.current.material.emissiveIntensity = Math.sin(state.clock.elapsedTime * 3) * 0.3 + 0.7
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={[node.position.x, node.position.y, node.position.z]}
      onClick={(e) => {
        e.stopPropagation()
        onClick(node)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'default'
      }}
      scale={hovered ? node.size * 1.3 : node.size}
    >
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        color={node.color}
        transparent
        opacity={isSelected ? 1 : node.opacity}
        emissive={isSelected ? node.color : '#000000'}
        emissiveIntensity={isSelected ? 0.5 : 0}
        roughness={0.3}
        metalness={0.7}
      />

      {hovered && (
        <sprite scale={[2, 0.5, 1]} position={[0, 1.5, 0]}>
          <spriteMaterial
            color="#ffffff"
            transparent
            opacity={0.8}
          />
        </sprite>
      )}
    </mesh>
  )
}

function Nodes({ nodes, selectedNode, onNodeClick }) {
  return (
    <group>
      {nodes.map((node) => (
        <Node
          key={node.id}
          node={node}
          isSelected={selectedNode?.id === node.id}
          onClick={onNodeClick}
        />
      ))}
    </group>
  )
}

export default Nodes
