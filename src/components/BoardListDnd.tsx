'use client'

import React, { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { SortableBoardCard } from './SortableBoardCard'
import { reorderBoards } from '@/app/actions'

interface BoardListDndProps {
  initialBoards: any[]
}

export default function BoardListDnd({ initialBoards }: BoardListDndProps) {
  const [boards, setBoards] = useState(initialBoards)
  
  useEffect(() => {
    setBoards(initialBoards)
  }, [initialBoards])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require dragging at least 8px before activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = boards.findIndex(item => item.id === active.id)
      const newIndex = boards.findIndex(item => item.id === over.id)
      const newBoards = arrayMove(boards, oldIndex, newIndex)
      
      setBoards(newBoards)
      
      // Save to backend without blocking UI
      reorderBoards(newBoards.map(b => b.id)).catch(console.error)
    }
  }

  return (
    <DndContext 
      id="board-dnd-context"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @3xl/main:grid-cols-3 @5xl/main:grid-cols-4">
        <SortableContext 
          items={boards.map(b => b.id)}
          strategy={rectSortingStrategy}
        >
          {boards.map(board => (
            <SortableBoardCard key={board.id} board={board} />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  )
}
