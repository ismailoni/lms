import express from 'express';
import { 
  getUserCourseProgress, 
  getUserEnrolledCourses, 
  updateUserCourseProgress,
  updateChapterProgress,
  checkCourseAccess,
  createInitialCourseProgress,
  recalculateOverallProgress
} from '../controllers/userCourseProgressController';

const router = express.Router();

// Course access and enrollment routes
router.get('/:userId/courses/:courseId/access', checkCourseAccess);
router.get('/:userId/enrolled-courses', getUserEnrolledCourses);

// Progress initialization route
router.post('/initialize-progress', createInitialCourseProgress);

// Progress tracking routes
router.get('/:userId/courses/:courseId', getUserCourseProgress);
router.put('/:userId/courses/:courseId', updateUserCourseProgress);
router.put('/:userId/courses/:courseId/sections/:sectionId/chapters/:chapterId', updateChapterProgress);
router.put('/:userId/courses/:courseId/recalculate', recalculateOverallProgress);

export default router;