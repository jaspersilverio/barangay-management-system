import { useState, useEffect } from 'react'
import PersonnelPage from './PersonnelPage'

export default function SKOfficialsPage() {
  return (
    <PersonnelPage
      category="sk"
      title="SK Officials"
      description="Manage Sangguniang Kabataan (SK) officials and their information"
      addButtonLabel="Add SK Official"
    />
  )
}

