import React, { useMemo } from 'react'
import * as THREE from 'three'

function Edge({ edge }) {
  const points = useMemo(() => {
    return [
      new THREE.Vector3(edge.sourcePos.x, edge.sourcePos.y, edge.sourcePos.z),
      new THREE.Vector3(edge.targetPos.x, edge.targetPos.y, edge.targetPos.z)
    ]
  }, [edge])

  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    return geometry
  }, [points])

  return (
    <line geometry={lineGeometry}>
      <lineBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.2}
        linewidth={1}
      />
    </line>
  )
}

function Edges({ edges }) {
  return (
    <group>
      {edges.map((edge, index) => (
        <Edge key={`${edge.source}-${edge.target}-${index}`} edge={edge} />
      ))}
    </group>
  )
}

export default Edges
