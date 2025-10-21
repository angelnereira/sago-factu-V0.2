"use client"

import { Plus } from "lucide-react"
import { useState } from "react"
import { FolioPurchaseModal } from "./folio-purchase-modal"

export function FolioPurchaseButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <Plus className="h-5 w-5" />
        <span>Comprar Folios</span>
      </button>

      <FolioPurchaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}

