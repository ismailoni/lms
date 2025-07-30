import express from 'express';
import { 
  getUserCourseProgress, 
  getUserEnrolledCourses, 
  updateUserCourseProgress,
  updateChapterProgress,
  checkCourseAccess
} from '../controllers/userCourseProgressController';

const router = express.Router();

// Course access and enrollment routes
router.get('/users/:userId/courses/:courseId/access', checkCourseAccess);
router.get('/users/:userId/enrolled-courses', getUserEnrolledCourses);

// Progress tracking routes
router.get('/users/:userId/courses/:courseId/progress', getUserCourseProgress);
router.put('/users/:userId/courses/:courseId/progress', updateUserCourseProgress);
router.put('/users/:userId/courses/:courseId/sections/:sectionId/chapters/:chapterId/progress', updateChapterProgress);

export default router;