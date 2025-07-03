import { useAppDispatch, useAppSelector } from '@/state/redux';
import React from 'react'

const ChapterModal = () => {
    const dispatch = useAppDispatch();
    const {
        isChapterModalOpen,
        selectedSectionIndex,
        selectedChapterIndex,
        sections
    } = useAppSelector((state) => state.global.courseEditor);
  return (
    <div>ChapterModal</div>
  )
}

export default ChapterModal